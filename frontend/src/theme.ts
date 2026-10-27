import {useSyncExternalStore} from 'react';

export type Theme = 'system' | 'light' | 'dark';
const key = 'thread-ledger-theme';
const valid = (value: unknown): value is Theme => value === 'system' || value === 'light' || value === 'dark';
const system = window.matchMedia('(prefers-color-scheme: dark)');
let current: Theme = 'system';
try {
  const saved = localStorage.getItem(key);
  if (valid(saved)) current = saved;
} catch { /* Theme remains usable without browser storage. */ }
const listeners = new Set<() => void>();
function apply() {
  const resolved = current === 'system' ? (system.matches ? 'dark' : 'light') : current;
  document.documentElement.dataset.theme = resolved;
  document.documentElement.style.colorScheme = resolved;
}
export function setTheme(value: string) {
  if (!valid(value)) return;
  current = value;
  try { localStorage.setItem(key, value); } catch { /* Keep the in-memory preference. */ }
  apply();
  listeners.forEach(listener => listener());
}
export function useTheme() {
  return useSyncExternalStore(callback => {
    listeners.add(callback);
    return () => { listeners.delete(callback); };
  }, () => current, () => 'system' as Theme);
}
system.addEventListener('change', apply);
window.addEventListener('storage', event => {
  if (event.key !== key && event.key !== null) return;
  current = valid(event.newValue) ? event.newValue : 'system';
  apply();
  listeners.forEach(listener => listener());
});
apply();
