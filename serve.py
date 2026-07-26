#!/usr/bin/env python3
"""
Serve the field guide locally.

    python3 serve.py            # http://localhost:8000
    python3 serve.py 9000       # a different port

The guide loads its chapters as separate files, which browsers refuse to
do over file:// — hence this. It is 30 lines of standard library and it
starts instantly. There is no build step and nothing to install.
"""

import http.server
import socketserver
import sys
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        # never serve a stale module while you are editing one
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        if "304" not in (args[1] if len(args) > 1 else ""):
            sys.stderr.write("  %s\n" % (fmt % args))


if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}/"
        print(f"\n  Spikes — an interactive field guide\n  {url}\n  Ctrl-C to stop\n")
        try:
            webbrowser.open(url)
        except Exception:
            pass
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n  stopped\n")
