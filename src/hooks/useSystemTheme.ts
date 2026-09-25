import { useSyncExternalStore } from 'react';

const query = '(prefers-color-scheme: dark)';

function snapshot(): 'light' | 'dark' {
  return window.matchMedia(query).matches ? 'dark' : 'light';
}

function subscribe(update: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener('change', update);
  return () => media.removeEventListener('change', update);
}

// Read at render time and recheck when subscribing, so an OS change between
// loading the module and mounting React cannot leave a stale initial theme.
export function useSystemTheme() {
  return useSyncExternalStore(subscribe, snapshot, () => 'light' as const);
}
