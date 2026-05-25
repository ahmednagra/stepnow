#!/usr/bin/env python3
# ════════════════════════════════════════════════
#  StepNow Rides & Movers — Local Server
#  Version 1.0 | Naeem Ahmad e.K.
#  
#  Doppelklick → Server startet
#  Browser öffnet automatisch
#  Strg+C → Server beenden
# ════════════════════════════════════════════════

import http.server
import socketserver
import json
import os
import sys
import threading
import webbrowser
import urllib.parse
from pathlib import Path
from datetime import datetime

# ── Konfiguration ──
PORT       = 9119          # Port (StepNow = 9119)
HOST       = '127.0.0.1'   # Nur lokaler Zugriff — kein Internet
DATA_FILE  = 'StepNow_Data.json'  # Datendatei
HTML_FILE  = 'StepNow_Buchhaltung.html'

# Skript-Verzeichnis
BASE_DIR = Path(sys.executable).parent if getattr(sys,'frozen',False) else Path(__file__).parent
DATA_PATH = BASE_DIR / DATA_FILE
HTML_PATH = BASE_DIR / HTML_FILE

# ════════════════════════════════════════════════
class StepNowHandler(http.server.SimpleHTTPRequestHandler):

    def log_message(self, format, *args):
        # Sauberes Logging
        ts = datetime.now().strftime('%H:%M:%S')
        print(f"  [{ts}] {args[0] if args else format}")

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_GET(self):
        path = urllib.parse.urlparse(self.path).path

        # ── Haupt-HTML ──
        if path in ('/', '/index.html', '/' + HTML_FILE):
            self._serve_html()

        # ── Daten laden ──
        elif path == '/api/load':
            self._load_data()

        # ── Status ──
        elif path == '/api/status':
            self._json_response({'ok': True, 'version': '1.0',
                                 'dataFile': str(DATA_PATH),
                                 'dataSize': DATA_PATH.stat().st_size if DATA_PATH.exists() else 0})
        else:
            self.send_error(404)

    def do_POST(self):
        path = urllib.parse.urlparse(self.path).path

        # ── Daten speichern ──
        if path == '/api/save':
            self._save_data()
        else:
            self.send_error(404)

    # ────────────────────────────────────────────
    def _serve_html(self):
        if not HTML_PATH.exists():
            self.send_error(404, f'HTML-Datei nicht gefunden: {HTML_PATH}')
            return
        content = HTML_PATH.read_bytes()
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', len(content))
        self._cors()
        self.end_headers()
        self.wfile.write(content)

    def _load_data(self):
        if DATA_PATH.exists():
            data = DATA_PATH.read_text(encoding='utf-8')
            self._json_raw(data)
        else:
            self._json_response({'empty': True})

    def _save_data(self):
        try:
            length  = int(self.headers.get('Content-Length', 0))
            body    = self.rfile.read(length)
            data    = json.loads(body)

            # Backup anlegen (letzte 3 Versionen)
            if DATA_PATH.exists():
                for i in range(2, 0, -1):
                    bk = DATA_PATH.with_suffix(f'.bak{i}.json')
                    bk_prev = DATA_PATH.with_suffix(f'.bak{i-1}.json') if i > 1 else DATA_PATH
                    if bk_prev.exists():
                        bk.write_bytes(bk_prev.read_bytes())

            # Speichern
            DATA_PATH.write_text(
                json.dumps(data, ensure_ascii=False, indent=2),
                encoding='utf-8'
            )
            size_kb = DATA_PATH.stat().st_size / 1024
            ts = datetime.now().strftime('%H:%M:%S')
            print(f"  [{ts}] ✅ Gespeichert — {size_kb:.1f} KB")
            self._json_response({'ok': True, 'size': DATA_PATH.stat().st_size})

        except Exception as e:
            print(f"  ❌ Fehler: {e}")
            self._json_response({'ok': False, 'error': str(e)}, 500)

    def _cors(self):
        self.send_header('Access-Control-Allow-Origin',  '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def _json_response(self, obj, code=200):
        self._json_raw(json.dumps(obj, ensure_ascii=False), code)

    def _json_raw(self, raw, code=200):
        b = raw.encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', len(b))
        self._cors()
        self.end_headers()
        self.wfile.write(b)


# ════════════════════════════════════════════════
def main():
    os.chdir(BASE_DIR)

    print()
    print("  ╔══════════════════════════════════════╗")
    print("  ║   StepNow Rides & Movers — Server    ║")
    print("  ║   Naeem Ahmad e.K.          v1.0     ║")
    print("  ╚══════════════════════════════════════╝")
    print()
    print(f"  📁 Verzeichnis : {BASE_DIR}")
    print(f"  📄 HTML-Datei  : {HTML_FILE}")
    print(f"  💾 Datendatei  : {DATA_FILE}")
    if DATA_PATH.exists():
        size_kb = DATA_PATH.stat().st_size / 1024
        print(f"  📊 Datengröße  : {size_kb:.1f} KB")
    print()
    print(f"  🌐 Adresse     : http://{HOST}:{PORT}")
    print()
    print("  ─────────────────────────────────────────")
    print("  Browser wird geöffnet...")
    print("  Strg+C zum Beenden")
    print("  ─────────────────────────────────────────")
    print()

    # HTML prüfen
    if not HTML_PATH.exists():
        print(f"  ⚠  WARNUNG: {HTML_FILE} nicht gefunden!")
        print(f"     Bitte Datei in diesen Ordner legen:")
        print(f"     {BASE_DIR}")
        print()

    # Server starten
    with socketserver.TCPServer((HOST, PORT), StepNowHandler) as httpd:
        httpd.allow_reuse_address = True

        # Browser nach kurzer Pause öffnen
        def open_browser():
            import time; time.sleep(0.8)
            webbrowser.open(f'http://{HOST}:{PORT}')
        threading.Thread(target=open_browser, daemon=True).start()

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print()
            print("  ⏹  Server beendet.")
            print()


if __name__ == '__main__':
    main()
