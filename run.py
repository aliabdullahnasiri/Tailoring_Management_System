"""Launcher for the standalone server and Tauri's packaged Python sidecar."""
import argparse
import sys
import threading
import webbrowser

import uvicorn


class DesktopServer(uvicorn.Server):
    async def startup(self, sockets=None):
        await super().startup(sockets=sockets)
        if self.started:
            # Emitted only after migrations and the listener are ready. Port 0 lets
            # the OS reserve a free port without a bind/close race in the desktop app.
            port = self.servers[0].sockets[0].getsockname()[1]
            print(f'TMS_READY http://127.0.0.1:{port}', flush=True)


def main():
    parser = argparse.ArgumentParser(description='Thread & Ledger local server')
    parser.add_argument('--port', type=int, default=8000)
    parser.add_argument('--no-browser', action='store_true')
    parser.add_argument('--desktop', action='store_true', help='Tauri startup and shutdown protocol')
    args = parser.parse_args()
    from app import app

    if args.desktop:
        server = DesktopServer(uvicorn.Config(app, host='127.0.0.1', port=args.port, workers=1))

        def watch_parent():
            # The desktop owns this pipe. Closing the window or losing the desktop
            # process closes stdin, including when PyInstaller has a bootloader parent.
            sys.stdin.buffer.read()
            server.should_exit = True

        threading.Thread(target=watch_parent, daemon=True).start()
        server.run()
    else:
        if not args.no_browser:
            timer = threading.Timer(2, lambda: webbrowser.open(f'http://127.0.0.1:{args.port}'))
            timer.daemon = True
            timer.start()
        uvicorn.run(app, host='127.0.0.1', port=args.port, workers=1)


if __name__ == '__main__':
    main()
