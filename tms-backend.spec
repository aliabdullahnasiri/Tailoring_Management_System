# Build from the repository root: python -m PyInstaller --clean --noconfirm tms-backend.spec
import os
from pathlib import Path

root = Path(SPECPATH)
if not (root / 'frontend/dist/index.html').is_file():
    raise SystemExit('Build the frontend first: cd frontend && npm ci && npm run build')

a = Analysis(
    [str(root / 'run.py')],
    pathex=[str(root / 'backend')],
    binaries=[],
    datas=[
        (str(root / 'frontend/dist'), 'frontend/dist'),
        (str(root / 'backend/alembic.ini'), '.'),
        (str(root / 'backend/migrations'), 'migrations'),
    ],
    hiddenimports=['sqlalchemy.dialects.sqlite', 'uvicorn.logging',
                   'uvicorn.loops.auto', 'uvicorn.protocols.http.auto',
                   'uvicorn.protocols.websockets.auto', 'uvicorn.lifespan.on'],
    hookspath=[], hooksconfig={}, runtime_hooks=[], excludes=[],
    noarchive=False, optimize=0,
)
pyz = PYZ(a.pure)
if os.environ.get('TMS_ONEFILE') == '1':
    # Single-file sidecar can live next to Tauri on every supported OS.
    exe = EXE(pyz, a.scripts, a.binaries, a.datas, [], name='tms-backend',
              debug=False, bootloader_ignore_signals=False, strip=False,
              upx=False, console=True)
else:
    exe = EXE(pyz, a.scripts, [], exclude_binaries=True, name='tms-backend',
              debug=False, bootloader_ignore_signals=False, strip=False,
              upx=False, console=True)
    coll = COLLECT(exe, a.binaries, a.datas, strip=False, upx=False, name='tms-backend')
