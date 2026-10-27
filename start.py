"""First-run setup and local launcher. Python 3.12+ required."""
import sys, subprocess, os, socket, threading, webbrowser
from pathlib import Path
ROOT=Path(__file__).resolve().parent

def main():
    if sys.version_info<(3,12):raise RuntimeError('Install Python 3.12 or newer, then run again.')
    python=ROOT/'.venv'/('Scripts/python.exe' if os.name=='nt' else 'bin/python')
    if not python.exists():
        print('Creating an isolated Python environment…')
        subprocess.run([sys.executable,'-m','venv',str(ROOT/'.venv')],check=True)
    marker=ROOT/'.venv'/'tms-installed.txt'
    requirements=(ROOT/'backend/requirements.txt').read_text()
    if not marker.exists() or marker.read_text()!=requirements:
        print('Installing dependencies. This first step needs an internet connection.')
        subprocess.run([str(python),'-m','pip','install','-r',str(ROOT/'backend/requirements.txt')],check=True)
        marker.write_text(requirements)
    if not (ROOT/'frontend/dist/index.html').exists():raise RuntimeError('Frontend build is missing. Run npm ci and npm run build in frontend.')
    with socket.socket() as s:
        if s.connect_ex(('127.0.0.1',8000))==0:raise RuntimeError('Port 8000 is already in use. Close the existing TMS window/server or the program using this port, then retry.')
    print('Opening http://127.0.0.1:8000. Keep this terminal open. Press Ctrl+C to stop.')
    timer=threading.Timer(2,lambda:webbrowser.open('http://127.0.0.1:8000'));timer.daemon=True;timer.start()
    try:subprocess.run([str(python),'-m','uvicorn','app:app','--host','127.0.0.1','--port','8000','--workers','1'],cwd=ROOT/'backend',check=True)
    except KeyboardInterrupt:pass
if __name__=='__main__':
    try:main()
    except Exception as e:
        print('\nCould not start:',e,file=sys.stderr)
        if os.name=='nt':input('Press Enter to close…')
        sys.exit(1)
