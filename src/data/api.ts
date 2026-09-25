import { useCallback, useEffect, useState } from 'react';
const prefix = 'wakosen-api-v1:';
const pending = new Map<string, Promise<{data: unknown; status: number}>>();
export function cachedJSON<T>(url: string): T | null {
  try { const value = JSON.parse(localStorage.getItem(prefix + url) || 'null'); return value?.data ?? null; } catch { return null; }
}
export async function requestJSON<T>(url: string): Promise<{data:T | null; status:number}> {
  if (pending.has(url)) return pending.get(url)! as any;
  const promise = (async () => {
    const response = await fetch(url, { cache:'no-cache', signal:AbortSignal.timeout(10000) });
    if (response.status === 404) {
      try { localStorage.removeItem(prefix + url); } catch {}
      return {data:null,status:404};
    }
    if (!response.ok) throw new Error(`取得できませんでした (${response.status})`);
    const data = await response.json();
    try { localStorage.setItem(prefix + url, JSON.stringify({data,updatedAt:Date.now()})); } catch {}
    return {data,status:response.status};
  })().finally(()=>pending.delete(url));
  pending.set(url,promise);
  return promise;
}
export function useApiResource<T>(url: string, normalize: (raw: any)=>T) {
  const initial = useCallback(()=>{const raw=cachedJSON(url); let data:T|null=null; try { if(raw!==null)data=normalize(raw); }catch{} return {url,data,status:0,error:null as string|null,loading:!data};},[url,normalize]);
  const [state,setState]=useState(initial);
  const [generation,setGeneration]=useState(0);
  useEffect(()=>{
    let active=true;
    setState(initial());
    requestJSON(url).then(result=>{
      if(!active)return;
      setState({url,data:result.data===null?null:normalize(result.data),status:result.status,error:null,loading:false});
    }).catch(error=>{
      if(!active)return;
      setState(previous=>({...previous,error:previous.data?null:String(error.message||error),loading:false}));
    });
    return ()=>{active=false;};
  },[url,generation,initial,normalize]);
  const visible=state.url===url?state:initial();
  const refresh=useCallback(async()=>{setGeneration(n=>n+1);await requestJSON(url).catch(()=>{});},[url]);
  return {...visible,refresh};
}
