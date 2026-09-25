import React from 'react';
import { renderToString } from 'react-dom/server';
import { StyleSheet } from 'react-native';
import { App } from './App';
export function prerender(Screen: React.ComponentType, page: string) {
  // Both static shells use the real theme, including inline React Native styles.
  // CSS selects the saved theme before first paint; React replaces both on mount.
  const light = renderToString(<App Screen={Screen} page={page} initialColorScheme="light" />);
  const dark = renderToString(<App Screen={Screen} page={page} initialColorScheme="dark" />);
  const html = `<div class="initial-shell initial-light">${light}</div><div class="initial-shell initial-dark">${dark}</div>`;
  const css = (StyleSheet as any).getSheet().textContent;
  return { html, css };
}
