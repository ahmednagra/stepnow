#!/usr/bin/env bash
set +e

echo "──────── SERVICE STATUS ────────"
for svc in stepnow-backend stepnow-frontend nginx; do
  state=$(systemctl is-active "$svc")
  printf "  %-20s %s\n" "$svc" "$state"
done

echo ""
echo "──────── LISTENING PORTS ───────"
ss -ltnp | grep -E "3000|8000|:80|:443" || echo "  (no app ports listening!)"

echo ""
echo "──────── LOCAL HEALTH CHECK ────"
echo -n "  frontend :3000  -> "; curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000 || echo "down"
echo -n "  backend  :8000  -> "; curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000 || echo "down"

echo ""
echo "  Live logs:"
echo "    journalctl -u stepnow-backend -f"
echo "    journalctl -u stepnow-frontend -f"