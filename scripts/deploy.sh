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

echo "==> [3/8] Stop frontend (avoid reading a half-built .next)"
systemctl stop stepnow-frontend || true

echo "==> [4/8] Frontend: install + clean build"
cd "$FRONTEND_DIR"
if [ -f package-lock.json ]; then npm ci; else npm install; fi
rm -rf .next
npm run build

echo "==> [5/8] Sync systemd unit files"
cp "$APP_DIR/deploy/systemd/stepnow-backend.service"  /etc/systemd/system/stepnow-backend.service
cp "$APP_DIR/deploy/systemd/stepnow-frontend.service" /etc/systemd/system/stepnow-frontend.service
systemctl daemon-reload

echo "==> [6/8] Sync nginx config"
cp "$APP_DIR/deploy/nginx/step-now.de.conf" /etc/nginx/sites-available/step-now.de
ln -sf /etc/nginx/sites-available/step-now.de /etc/nginx/sites-enabled/step-now.de
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "==> [7/8] Start backend FIRST, then wait until it's actually ready"
systemctl enable stepnow-backend stepnow-frontend >/dev/null 2>&1 || true
systemctl restart stepnow-backend

# Wait for the backend to accept connections before touching the frontend.
echo "    waiting for backend on 127.0.0.1:8000 ..."
for i in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/api/v0/public/services || true)
  if [ "$code" = "200" ]; then
    echo "    backend is ready (HTTP $code after ${i}s)"
    break
  fi
  if [ "$i" = "30" ]; then
    echo "    !! backend did not become ready in 30s — check: journalctl -u stepnow-backend -n 40 --no-pager"
    exit 1
  fi
  sleep 1
done

echo "==> Start frontend (backend confirmed up)"
systemctl restart stepnow-frontend

echo "==> [8/8] Status"
sleep 5
systemctl is-active stepnow-backend stepnow-frontend nginx
ss -ltnp | grep -E "3000|8000" || echo "  !! nothing on 3000/8000 — check journalctl"
