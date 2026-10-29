function installPreferences(saved, origin, launchId) {
  if (window.top !== window || window.location.origin !== origin) return;
  const allowed = key => ['thread-ledger-theme', 'thread-ledger-language', 'thread-ledger-appearance', 'thread-ledger-sidebar-mini'].includes(key)
    || (key.startsWith('thread-ledger-notifications:') && key.length <= 256);
  const storage = window.localStorage;
  const {setItem, removeItem, clear} = Storage.prototype;
  let pending = Promise.resolve();
  const persist = (key, value) => {
    pending = pending.then(() => window.__TAURI_INTERNALS__.invoke('save_preference', {key, value}))
      .catch(error => console.error('Could not save desktop preference:', error));
  };
  // Seed the new port's storage before frontend modules read their initial state.
  const marker = 'thread-ledger-preferences-launch';
  if (window.sessionStorage.getItem(marker) !== launchId) {
    for (const [key, value] of Object.entries(saved)) {
      if (allowed(key)) setItem.call(storage, key, value);
    }
    window.sessionStorage.setItem(marker, launchId);
  }
  // Migrate preferences already saved on this origin on the first upgraded launch.
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);
    if (allowed(key) && !Object.hasOwn(saved, key)) persist(key, storage.getItem(key));
  }
  Storage.prototype.setItem = function(key, value) {
    setItem.call(this, key, value);
    if (this === storage && allowed(String(key))) persist(String(key), String(value));
  };
  Storage.prototype.removeItem = function(key) {
    removeItem.call(this, key);
    if (this === storage && allowed(String(key))) persist(String(key), null);
  };
  Storage.prototype.clear = function() {
    const keys = Object.keys(saved);
    for (let index = 0; index < this.length; index++) keys.push(this.key(index));
    clear.call(this);
    if (this === storage) for (const key of new Set(keys)) if (allowed(key)) persist(key, null);
  };
}
