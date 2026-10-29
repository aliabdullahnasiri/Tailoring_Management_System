"""Collect platform installers into one release ZIP (run from the repository root)."""
from pathlib import Path
import shutil
import sys
import tempfile

platform = sys.argv[1]
bundle = Path('frontend/src-tauri/target/release/bundle')
installers = sorted(p for p in bundle.rglob('*') if p.is_file() and p.suffix in {'.deb', '.AppImage', '.dmg', '.exe', '.msi'})
if not installers:
    raise SystemExit(f'No desktop installers found in {bundle}')
with tempfile.TemporaryDirectory() as directory:
    destination = Path(directory)
    for installer in installers:
        shutil.copy2(installer, destination / installer.name)
    shutil.copy2('README.md', destination / 'README.md')
    shutil.make_archive(f'tailoring-ms-{platform}', 'zip', destination)
