"""Check Tauri's backend protocol, including cleanup through PyInstaller's bootloader."""
import json
import os
from pathlib import Path
import queue
import subprocess
import sys
import threading
import urllib.request


def test_desktop_ready_port_and_parent_shutdown(tmp_path):
    root = Path(__file__).resolve().parents[2]
    executable = os.environ.get('TMS_EXECUTABLE')
    command = [executable] if executable else [sys.executable, str(root / 'run.py')]
    command += ['--desktop', '--no-browser', '--port', '0']
    environment = {**os.environ, 'PYTHONPATH': str(root / 'backend'), 'TMS_DATA_DIR': str(tmp_path / 'shop')}
    messages = queue.Queue()
    with (tmp_path / 'backend.log').open('w+') as log:
        process = subprocess.Popen(command, cwd=tmp_path, env=environment, stdin=subprocess.PIPE,
                                   stdout=subprocess.PIPE, stderr=log, text=True)
        def read_output():
            for line in process.stdout:
                if line.startswith('TMS_READY '):
                    messages.put(line.strip().split(' ', 1)[1])
            messages.put(None)
        threading.Thread(target=read_output, daemon=True).start()
        try:
            address = messages.get(timeout=90)
            log.flush()
            log.seek(0)
            assert address is not None, log.read()
            assert address.startswith('http://127.0.0.1:')
            assert int(address.rsplit(':', 1)[1]) > 0
            with urllib.request.urlopen(address + '/api/auth/status', timeout=3) as response:
                assert json.load(response)['signup_allowed']
            with urllib.request.urlopen(address, timeout=3) as response:
                assert response.read().decode() == (root / 'frontend/dist/index.html').read_text(encoding='utf-8')
            # This is the desktop's normal shutdown and crash-detection mechanism.
            process.stdin.close()
            assert process.wait(timeout=10) == 0
            assert (tmp_path / 'shop/tailoring.db').exists()
        finally:
            if process.poll() is None:
                process.stdin.close()
                try:
                    process.wait(timeout=10)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait(timeout=5)
            process.stdout.close()
