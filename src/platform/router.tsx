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
export const router = {
  push(href: Href) { location.assign(hrefOf(href)); },
  replace(href: Href) { location.replace(hrefOf(href)); },
  back() { history.length > 1 ? history.back() : location.assign('/'); },
  canGoBack() { return typeof history !== 'undefined' && history.length > 1; },
  setParams(params: Record<string, string>) { const url = new URL(location.href); Object.entries(params).forEach(([key,value])=>url.searchParams.set(key,value)); history.replaceState(null,'',url); },
};
export const RouteContext = createContext<Record<string, any>>({});
export const useRouter = () => router;
export const useLocalSearchParams = <T,>() => useContext(RouteContext) as T;
export const useGlobalSearchParams = useLocalSearchParams;
export const Stack = { Screen: (_props: any) => null };
export function Link({ href, children, ...props }: any) { return <a href={hrefOf(href)} {...props}>{children}</a>; }
