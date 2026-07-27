#!/usr/bin/env python3
"""Serve this folder on http://localhost:8000.

The guide loads its chapters as separate files, which browsers block over
file://. That is the only reason this exists. Any static server works just
as well: `npx serve`, `php -S localhost:8000`, whatever you already have.
"""

import argparse
import http.server
import socketserver
import webbrowser
from functools import partial
from pathlib import Path

ROOT = Path(__file__).parent.resolve()


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".css": "text/css",
        ".svg": "image/svg+xml",
    }

    def end_headers(self):
        # Editing a figure and hitting reload should show the new figure.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        if "404" in (fmt % args):
            super().log_message(fmt, *args)


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("-p", "--port", type=int, default=8000)
    ap.add_argument("-n", "--no-browser", action="store_true")
    args = ap.parse_args()

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", args.port), partial(Handler, directory=str(ROOT))) as httpd:
        url = f"http://localhost:{args.port}"
        print(f"The Bench is at {url}   (ctrl-c to stop)")
        if not args.no_browser:
            try:
                webbrowser.open(url)
            except Exception:
                pass
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nstopped")


if __name__ == "__main__":
    main()
