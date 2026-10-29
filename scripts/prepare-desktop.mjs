// Run through npm from frontend/. Build on the target OS (PyInstaller is not a cross compiler).
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, copyFileSync, renameSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const frontend = path.join(root, 'frontend');
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
// Use npm's actual script rather than relying on npm.cmd shell behavior on Windows.
run(process.execPath, [path.join(frontend, 'node_modules/typescript/bin/tsc'), '-b'], { cwd: frontend });
run(process.execPath, [path.join(frontend, 'node_modules/vite/bin/vite.js'), 'build'], { cwd: frontend });
const localPython = path.join(root, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
const python = process.env.TMS_PYTHON || (existsSync(localPython) ? localPython : 'python');
run(python, ['-m', 'PyInstaller', '--noconfirm', '--distpath', 'dist/tms-sidecar', 'tms-backend.spec'], {
  env: { ...process.env, TMS_ONEFILE: '1' },
});
const rust = spawnSync('rustc', ['-vV'], { encoding: 'utf8' });
if (rust.status !== 0) throw new Error('Install the Rust toolchain before building the desktop app.');
const host = rust.stdout.match(/^host: (.+)$/m)?.[1].trim();
const target = process.env.TAURI_ENV_TARGET_TRIPLE || host;
if (target !== host) throw new Error('Build the Python sidecar on the target architecture; cross compilation is unsupported.');
const extension = process.platform === 'win32' ? '.exe' : '';
const binaries = path.join(frontend, 'src-tauri/binaries');
mkdirSync(binaries, { recursive: true });
// Replace atomically so an older executable being inspected or run on Unix
// cannot make a rebuild fail with ETXTBSY.
const destination = path.join(binaries, `tms-backend-${target}${extension}`);
const temporary = `${destination}.tmp-${process.pid}`;
copyFileSync(path.join(root, 'dist/tms-sidecar', `tms-backend${extension}`), temporary);
renameSync(temporary, destination);
console.log(`Desktop backend prepared for ${target}`);
