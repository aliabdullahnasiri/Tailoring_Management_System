import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const script = fs.readFileSync(new URL('../src-tauri/src/preferences.js', import.meta.url), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));
function launch(saved, port, initial = {}) {
  class Storage {
    values = new Map();
    get length() { return this.values.size; }
    key(index) { return [...this.values.keys()][index] ?? null; }
    getItem(key) { return this.values.get(String(key)) ?? null; }
    setItem(key, value) { this.values.set(String(key), String(value)); }
    removeItem(key) { this.values.delete(String(key)); }
    clear() { this.values.clear(); }
  }
  const localStorage = new Storage(), sessionStorage = new Storage();
  for (const [key, value] of Object.entries(initial)) localStorage.setItem(key, value);
  const calls = [];
  const window = {localStorage, sessionStorage, location: {origin: `http://127.0.0.1:${port}`},
    __TAURI_INTERNALS__: {invoke: async (command, {key, value}) => {
      assert.equal(command, 'save_preference');
      calls.push(key);
      if (value === null) delete saved[key]; else saved[key] = value;
    }}};
  window.top = window;
  const initialization = `(${script})(${JSON.stringify(saved)}, ${JSON.stringify(window.location.origin)}, 'test-launch');`;
  const reload = () => vm.runInNewContext(initialization, {window, Storage, console});
  reload();
  return {localStorage, sessionStorage, calls, reload};
}

test('desktop preferences survive a restart on a different port before UI initialization', async () => {
  const disk = {};
  const first = launch(disk, 43615);
  const preferences = {
    'thread-ledger-theme': 'dark', 'thread-ledger-language': 'fa',
    'thread-ledger-appearance': '{"accent":"blue","sidebar":"dark","fixedNavbar":true}',
    'thread-ledger-sidebar-mini': 'true', 'thread-ledger-notifications:owner': '["order-1"]',
  };
  for (const [key, value] of Object.entries(preferences)) first.localStorage.setItem(key, value);
  await flush();
  assert.deepEqual(disk, preferences);
  const restarted = launch(disk, 51234);
  for (const [key, value] of Object.entries(preferences)) assert.equal(restarted.localStorage.getItem(key), value);
  restarted.localStorage.setItem('thread-ledger-theme', 'light');
  restarted.localStorage.setItem('thread-ledger-theme', 'system');
  await flush();
  assert.equal(disk['thread-ledger-theme'], 'system');
  restarted.reload();
  assert.equal(restarted.localStorage.getItem('thread-ledger-theme'), 'system');
});

test('only approved local preferences persist; removal and clearing survive restarts', async () => {
  const disk = {};
  const first = launch(disk, 43615, {'thread-ledger-theme': 'dark'});
  first.localStorage.setItem('auth-token', 'private');
  first.sessionStorage.setItem('thread-ledger-theme', 'light');
  await flush();
  assert.deepEqual(disk, {'thread-ledger-theme': 'dark'});
  first.localStorage.removeItem('thread-ledger-theme');
  await flush();
  assert.deepEqual(disk, {});
  first.localStorage.setItem('thread-ledger-language', 'ps');
  first.localStorage.clear();
  await flush();
  assert.deepEqual(disk, {});
  assert.equal(launch(disk, 51234).localStorage.getItem('thread-ledger-language'), null);
});
