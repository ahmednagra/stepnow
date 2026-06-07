#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/root/stepnow"
BACKEND_DIR="$APP_DIR/apps/backend"
FRONTEND_DIR="$APP_DIR/apps/frontend"

echo "==> [1/7] Pull latest from git (main)"
cd "$APP_DIR"
git fetch --all --prune
git reset --hard origin/main

echo "==> [2/7] Backend: venv + dependencies"
cd "$BACKEND_DIR"
[ -d venv ] || python3 -m venv venv
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt

echo "==> [3/7] Frontend: install dependencies"
cd "$FRONTEND_DIR"
if [ -f package-lock.json ]; then npm ci; else npm install; fi

echo "==> [4/7] Frontend: production build"
npm run build

echo "==> [5/7] Sync systemd unit files"
cp "$APP_DIR/deploy/systemd/stepnow-backend.service"  /etc/systemd/system/stepnow-backend.service
cp "$APP_DIR/deploy/systemd/stepnow-frontend.service" /etc/systemd/system/stepnow-frontend.service
systemctl daemon-reload

echo "==> [6/7] Sync nginx config"
cp "$APP_DIR/deploy/nginx/step-now.de.conf" /etc/nginx/sites-available/step-now.de
ln -sf /etc/nginx/sites-available/step-now.de /etc/nginx/sites-enabled/step-now.de
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "==> [7/7] Enable + restart app services"
systemctl enable stepnow-backend stepnow-frontend >/dev/null 2>&1 || true
systemctl restart stepnow-backend
systemctl restart stepnow-frontend

echo ""
echo "==> Done. Quick status:"
systemctl --no-pager --lines=0 status stepnow-backend  | head -n 4 || true
systemctl --no-pager --lines=0 status stepnow-frontend | head -n 4 || true
echo ""
echo "==> Listening ports (expect 3000 + 8000):"
ss -ltnp | grep -E "3000|8000" || echo "  !! nothing on 3000/8000 — check: journalctl -u stepnow-backend -n 50"