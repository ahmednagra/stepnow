#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/root/stepnow"
BACKEND_DIR="$APP_DIR/apps/backend"
FRONTEND_DIR="$APP_DIR/apps/frontend"

echo "==> [1/8] Pull latest from git (main)"
cd "$APP_DIR"
git fetch --all --prune
git reset --hard origin/main

echo "==> [2/8] Backend: venv + dependencies"
cd "$BACKEND_DIR"
[ -d venv ] || python3 -m venv venv
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt

echo "==> [2b] Database preflight (exists, reachable, app role can create + owns every table)"
# A brand-new database is owned by postgres, and on PostgreSQL 15+ the app role then cannot
# CREATE in schema public — the backend refuses to start and every prerendered page 500s.
# Checked here, BEFORE anything restarts, so a bad database never takes the live site down.
# Reads DATABASE_URL from .env the same way systemd does; the password is never printed.
db_probe() {
  ./venv/bin/python - <<'PY'
import sys
from dotenv import dotenv_values
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.exc import OperationalError
raw = dotenv_values(".env").get("DATABASE_URL") or ""
if not raw:
    print("DATABASE_URL is missing from apps/backend/.env", file=sys.stderr); sys.exit(6)
url = make_url(raw)
print(f"{url.username} {url.database} {url.host or 'localhost'}")
try:
    with create_engine(url, pool_pre_ping=True).connect() as c:
        can_create = c.execute(text("select has_schema_privilege(current_user, 'public', 'CREATE')")).scalar()
        foreign = c.execute(text("select count(*) from pg_tables where schemaname = 'public' and tableowner <> current_user")).scalar()
except OperationalError as exc:
    msg = str(exc.orig).strip().splitlines()[0]
    print(msg, file=sys.stderr)
    sys.exit(2 if "does not exist" in msg and "database" in msg else 4)
sys.exit(3 if not can_create else 5 if foreign else 0)
PY
}

db_fix_as_postgres() {  # $1=role $2=db — local PostgreSQL only; runs as the postgres superuser
  local role="$1" db="$2"
  local psql=(runuser -u postgres -- psql -X -q -v ON_ERROR_STOP=1)
  if [ "$("${psql[@]}" -d postgres -tAc "select 1 from pg_database where datname = '$db'")" != "1" ]; then
    if [ "$("${psql[@]}" -d postgres -tAc "select 1 from pg_roles where rolname = '$role'")" != "1" ]; then
      echo "    !! role '$role' does not exist. Create it with its password first (see apps/backend/.env):"
      echo "       runuser -u postgres -- psql -c \"CREATE ROLE $role LOGIN PASSWORD '...';\""
      return 1
    fi
    echo "    creating database '$db' owned by '$role'"
    "${psql[@]}" -d postgres -c "CREATE DATABASE \"$db\" OWNER \"$role\";"
  fi
  "${psql[@]}" -d postgres -c "ALTER DATABASE \"$db\" OWNER TO \"$role\";"
  "${psql[@]}" -d "$db" -c "ALTER SCHEMA public OWNER TO \"$role\"; GRANT USAGE, CREATE ON SCHEMA public TO \"$role\";"
  # Tables created earlier by another role (e.g. a restore run as postgres) block ADD COLUMN in sync_schema.
  "${psql[@]}" -d "$db" -c "DO \$\$ DECLARE t text; BEGIN
    FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tableowner <> '$role' LOOP
      EXECUTE format('ALTER TABLE public.%I OWNER TO %I', t, '$role');
    END LOOP; END \$\$;"
}

set +e; probe=$(db_probe); rc=$?; set -e
read -r DB_ROLE DB_NAME DB_HOST <<<"$probe" || true
case $rc in
  0) echo "    ok — database '$DB_NAME' reachable, role '$DB_ROLE' can create and owns all tables" ;;
  2|3|5)
    echo "    database '$DB_NAME' needs setup (code $rc: 2=missing, 3=no CREATE on public, 5=tables owned by another role)"
    # Only names we can quote safely, and only a PostgreSQL on this machine, are fixed automatically.
    if [[ ! "$DB_ROLE" =~ ^[A-Za-z_][A-Za-z0-9_]*$ || ! "$DB_NAME" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
      echo "    !! role/database name has unusual characters — fix by hand"; exit 1
    fi
    if [[ "$DB_HOST" != "localhost" && "$DB_HOST" != "127.0.0.1" && "$DB_HOST" != "::1" ]] || ! id postgres >/dev/null 2>&1; then
      echo "    !! database is not on this machine ($DB_HOST) — as its superuser run:"
      echo "       ALTER DATABASE \"$DB_NAME\" OWNER TO \"$DB_ROLE\"; ALTER SCHEMA public OWNER TO \"$DB_ROLE\";"
      exit 1
    fi
    db_fix_as_postgres "$DB_ROLE" "$DB_NAME"
    set +e; db_probe >/dev/null; rc=$?; set -e
    [ "$rc" = "0" ] || { echo "    !! database still not usable after setup (code $rc)"; exit 1; }
    echo "    fixed — role '$DB_ROLE' now owns database '$DB_NAME' and schema public" ;;
  4) echo "    !! cannot connect as '$DB_ROLE' to '$DB_HOST' — check PostgreSQL is running and the password in apps/backend/.env"; exit 1 ;;
  *) echo "    !! database preflight failed (code $rc)"; exit 1 ;;
esac

echo "==> [3/8] Sync systemd unit files"
cp "$APP_DIR/deploy/systemd/stepnow-backend.service"  /etc/systemd/system/stepnow-backend.service
cp "$APP_DIR/deploy/systemd/stepnow-frontend.service" /etc/systemd/system/stepnow-frontend.service
cp "$APP_DIR/deploy/systemd/stepnow-backup.service"   /etc/systemd/system/stepnow-backup.service
cp "$APP_DIR/deploy/systemd/stepnow-backup.timer"     /etc/systemd/system/stepnow-backup.timer
systemctl daemon-reload
systemctl enable --now stepnow-backup.timer

echo "==> [4/8] Restart backend on the new code and wait until it serves real data"
systemctl enable stepnow-backend stepnow-frontend >/dev/null 2>&1 || true
systemctl restart stepnow-backend

# The frontend build prerenders every public page against this API, so it must run the NEW code
# and be healthy BEFORE the build. A failure here stops the deploy while the old frontend is still up.
echo "    waiting for backend on 127.0.0.1:8000 ..."
for i in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/api/v0/public/services || true)
  if [ "$code" = "200" ]; then
    echo "    backend is ready (HTTP $code after ${i}s)"
    break
  fi
  if [ "$i" = "30" ]; then
    echo "    !! backend did not become ready in 30s — check: journalctl -u stepnow-backend -n 40 --no-pager"
    journalctl -u stepnow-backend -n 60 --no-pager || true
    exit 1
  fi
  sleep 1
done

# Reference data (site settings, UI strings, services, pricing, legal pages, …). Every seeder is
# idempotent and never overwrites admin edits, so this is a no-op on a populated database and
# fills a brand-new one. Needs the tables, which the backend's sync_schema just created.
# The seeders read apps/backend/.env themselves (SEED_ADMIN_EMAIL/PASSWORD for the first admin).
echo "    seeding reference data (idempotent)"
(cd "$BACKEND_DIR" && ./venv/bin/python -m scripts.seed) || { echo "    !! seeding failed — see output above"; exit 1; }

# /public/services answers 200 even on an empty database; /public/settings is what every page
# needs, so it is the real "ready to prerender" check.
for path in settings ui-strings services; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:8000/api/v0/public/$path" || true)
  [ "$code" = "200" ] || { echo "    !! /public/$path returned HTTP $code — the build would fail; stopping before the site goes down"; exit 1; }
done
echo "    public API serves data — safe to build"

echo "==> [5/8] Stop frontend (avoid reading a half-built .next)"
systemctl stop stepnow-frontend || true
# From here until the restart below the site is down; say so loudly if the build fails.
trap 'echo "!! deploy failed after stopping the frontend — site is DOWN. Fix, then re-run deploy.sh" >&2' ERR

echo "==> [6/8] Frontend: install + clean build"
cd "$FRONTEND_DIR"
if [ -f package-lock.json ]; then npm ci; else npm install; fi
rm -rf .next
npm run build

echo "==> [7/8] Sync nginx config"
cp "$APP_DIR/deploy/nginx/step-now.de.conf" /etc/nginx/sites-available/step-now.de
ln -sf /etc/nginx/sites-available/step-now.de /etc/nginx/sites-enabled/step-now.de
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "==> Start frontend"
systemctl enable stepnow-backend stepnow-frontend >/dev/null 2>&1 || true
systemctl restart stepnow-frontend
trap - ERR

echo "==> [8/8] Status"
sleep 5
systemctl is-active stepnow-backend stepnow-frontend nginx
ss -ltnp | grep -E "3000|8000" || echo "  !! nothing on 3000/8000 — check journalctl"
