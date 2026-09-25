import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
export function mount(Screen: React.ComponentType, page: string) {
  const params: Record<string,string> = Object.fromEntries(new URLSearchParams(location.search));
  if (page === 'rule') params.ruleId = decodeURIComponent(location.pathname.split('/').filter(Boolean).at(-1) || '');
  // The static shell contains no API data. Mount only after it has been painted.
  createRoot(document.getElementById('app')!).render(<App Screen={Screen} page={page} params={params} />);
}
