#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/root/stepnow"
DOMAINS="-d step-now.de -d www.step-now.de -d api.step-now.de"
EMAIL="info@step-now.de"

echo "==> [1/4] Install packages (nginx, certbot, python venv)"
apt-get update
apt-get install -y nginx certbot python3-certbot-nginx python3-venv

echo "==> [2/4] Install HTTP-only nginx config (for certbot challenge)"
cp "$APP_DIR/deploy/nginx/step-now.de.http.conf" /etc/nginx/sites-available/step-now.de
ln -sf /etc/nginx/sites-available/step-now.de /etc/nginx/sites-enabled/step-now.de
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "==> [3/4] Issue Let'\''s Encrypt certificates"
certbot certonly --nginx $DOMAINS --non-interactive --agree-tos -m "$EMAIL"

echo "==> [4/4] Run full deploy (builds apps + swaps to HTTPS config)"
bash "$APP_DIR/scripts/deploy.sh"

echo ""
echo "==> Setup complete. Auto-renew: systemctl status certbot.timer"