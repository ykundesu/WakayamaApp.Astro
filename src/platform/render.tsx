import React from 'react';
import { renderToString } from 'react-dom/server';
import { StyleSheet } from 'react-native';
import { App } from './App';
export function prerender(Screen: React.ComponentType, page: string) {
  const html = renderToString(<App Screen={Screen} page={page} />);
  const css = (StyleSheet as any).getSheet().textContent;
  return { html, css };
}
