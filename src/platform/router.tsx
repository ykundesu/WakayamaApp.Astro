import React, { createContext, useContext } from 'react';
export type Href = string | { pathname: string; params?: Record<string, any> };
export function hrefOf(href: Href): string {
  const raw = typeof href === 'string' ? href : href.pathname;
  let path = raw.replace('/(tabs)', '') || '/';
  if (typeof href !== 'string') {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(href.params || {})) {
      if (path.includes(`[${key}]`)) path = path.replace(`[${key}]`, encodeURIComponent(String(value)));
      else if (value != null) query.set(key, String(value));
    }
    if (query.size) path += '?' + query;
  }
  return path;
}
export function navigate(href: Href, replace = false) {
  const url = new URL(hrefOf(href), location.href);
  if (url.origin !== location.origin) { location.assign(url.href); return; }
  history[replace ? 'replaceState' : 'pushState']({}, '', url);
  window.dispatchEvent(new Event('wakosen:navigate'));
}
export function routeAtLocation() {
  const path = location.pathname.replace(/\/$/, '') || '/';
  const params = Object.fromEntries(new URLSearchParams(location.search));
  const page = path === '/' ? 'index' : path === '/school-rules' ? 'school-rules/index' : /^\/school-rules\/[^/]+$/.test(path) ? 'rule' : path.slice(1);
  if (page === 'rule') params.ruleId = decodeURIComponent(path.split('/').at(-1)!);
  return {page, params};
}
export function followLink(event: React.MouseEvent<HTMLAnchorElement>) {
  if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.currentTarget.target) return;
  event.preventDefault(); navigate(event.currentTarget.href);
}
export const router = {
  push(href: Href) { navigate(href); },
  replace(href: Href) { navigate(href, true); },
  back() { history.length > 1 ? history.back() : location.assign('/'); },
  canGoBack() { return typeof history !== 'undefined' && history.length > 1; },
  setParams(params: Record<string, string>) { const url = new URL(location.href); Object.entries(params).forEach(([key,value])=>url.searchParams.set(key,value)); history.replaceState(null,'',url); },
};
export const RouteContext = createContext<Record<string, any>>({});
export const useRouter = () => router;
export const useLocalSearchParams = <T,>() => useContext(RouteContext) as T;
export const useGlobalSearchParams = useLocalSearchParams;
export const Stack = { Screen: (_props: any) => null };
export function Link({ href, children, ...props }: any) { return <a href={hrefOf(href)} onClick={followLink} {...props}>{children}</a>; }
