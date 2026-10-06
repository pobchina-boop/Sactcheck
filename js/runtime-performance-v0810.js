/**
 * SACTCheck v0.81.0 - runtime network/cache supervisor.
 *
 * The historical protocol loader requests hundreds of immutable JSON files and
 * explicitly bypasses the HTTP cache. This supervisor keeps the loader API
 * unchanged while providing release-scoped CacheStorage, in-flight request
 * de-duplication, protocol prewarming and bounded network waits.
 */
(function(root){
  'use strict';
  if(!root||typeof root.fetch!=='function'||root.SACTCheckRuntimePerformanceV0810) return;

  const RELEASE=root.SACTCHECK_RELEASE||'0.81.0';
  const CACHE_NAME=`sactcheck-runtime-${RELEASE}`;
  const INDEX_PATH='protocols/index.json';
  const PREFETCH_CONCURRENCY=16;
  const NETWORK_TIMEOUT_MS=6500;
  const nativeFetch=root.fetch.bind(root);
  const inFlight=new Map();
  const stats={cacheHits:0,networkHits:0,networkFailures:0,deduped:0,prefetched:0,prefetchFailures:0,indexReady:false};

  function absolute(input){
    const raw=typeof input==='string'?input:input?.url||String(input||'');
    try{return new URL(raw,root.location?.href||'https://sactcheck.com/');}catch(_){return null;}
  }
  function isSameOrigin(url){
    try{return url.origin===new URL(root.location?.href||'https://sactcheck.com/').origin;}catch(_){return false;}
  }
  function isCacheable(url){
    if(!url||!isSameOrigin(url)) return false;
    const p=url.pathname.replace(/^\/+/, '');
    return (/^protocols\/.*\.json$/i.test(p)||/^data\/.*\.json$/i.test(p));
  }
  function canonical(url){
    const copy=new URL(url.href);
    copy.searchParams.delete('sact_retry');
    copy.searchParams.delete('_');
    return copy;
  }
  function cacheApi(){return root.caches&&typeof root.caches.open==='function'?root.caches:null;}
  async function openCache(){
    const api=cacheApi(); if(!api) return null;
    try{return await api.open(CACHE_NAME);}catch(_){return null;}
  }
  function dispatch(name,detail){
    try{root.dispatchEvent?.(new CustomEvent(name,{detail}));}catch(_){}
  }
  async function withTimeout(url,init){
    const controller=typeof AbortController!=='undefined'?new AbortController():null;
    const external=init?.signal;
    let timer=null;
    if(controller){
      if(external?.aborted) controller.abort(external.reason);
      else external?.addEventListener?.('abort',()=>controller.abort(external.reason),{once:true});
      timer=root.setTimeout?.(()=>controller.abort(new Error('SACTCheck static-data request timed out.')),NETWORK_TIMEOUT_MS);
    }
    try{
      const next={...(init||{}),cache:'default'};
      if(controller) next.signal=controller.signal;
      return await nativeFetch(url,next);
    }finally{if(timer) root.clearTimeout?.(timer);}
  }
  async function cachedFetch(input,init={}){
    const url=absolute(input);
    const method=String(init?.method||input?.method||'GET').toUpperCase();
    if(method!=='GET'||!isCacheable(url)) return nativeFetch(input,init);
    const key=canonical(url).href;
    const cache=await openCache();
    if(cache){
      try{
        const hit=await cache.match(key,{ignoreSearch:false});
        if(hit){stats.cacheHits++;dispatch('sactcheck:runtime-fetch',{kind:'cache',url:key,stats:{...stats}});return hit.clone();}
      }catch(_){}
    }
    if(inFlight.has(key)){
      stats.deduped++;
      const response=await inFlight.get(key);
      return response.clone();
    }
    const promise=(async()=>{
      try{
        const response=await withTimeout(key,init);
        stats.networkHits++;
        if(response.ok&&cache){try{await cache.put(key,response.clone());}catch(_){}}
        dispatch('sactcheck:runtime-fetch',{kind:'network',url:key,stats:{...stats}});
        return response;
      }catch(error){stats.networkFailures++;dispatch('sactcheck:runtime-fetch',{kind:'failure',url:key,error:String(error?.message||error),stats:{...stats}});throw error;}
      finally{inFlight.delete(key);}
    })();
    inFlight.set(key,promise);
    const response=await promise;
    return response.clone();
  }

  // Install before protocol-loader.js executes. Its existing fetch calls now gain
  // cache reuse and in-flight de-duplication without changing clinical logic.
  root.fetch=cachedFetch;

  async function mapLimit(items,limit,worker){
    let cursor=0;
    const workers=Array.from({length:Math.max(1,Math.min(limit,items.length||1))},async()=>{
      while(cursor<items.length){const i=cursor++;await worker(items[i],i);}
    });
    await Promise.all(workers);
  }
  async function warmProtocolCache(){
    try{
      const response=await root.fetch(INDEX_PATH);
      if(!response.ok) throw new Error(`Protocol index HTTP ${response.status}`);
      const index=await response.json();
      const entries=Array.isArray(index?.protocols)?index.protocols.filter(x=>x?.enabled!==false&&x?.path):[];
      stats.indexReady=true;
      dispatch('sactcheck:protocol-prewarm-start',{total:entries.length});
      await mapLimit(entries,PREFETCH_CONCURRENCY,async entry=>{
        try{const r=await root.fetch(entry.path);if(r.ok)stats.prefetched++;else stats.prefetchFailures++;}
        catch(_){stats.prefetchFailures++;}
      });
      dispatch('sactcheck:protocol-cache-warmed',{total:entries.length,stats:{...stats}});
    }catch(error){dispatch('sactcheck:protocol-cache-warm-failed',{error:String(error?.message||error),stats:{...stats}});}
  }
  async function pruneOldCaches(){
    const api=cacheApi(); if(!api?.keys) return;
    try{for(const name of await api.keys()){if(name.startsWith('sactcheck-runtime-')&&name!==CACHE_NAME) await api.delete(name);}}catch(_){}
  }

  function installLoadStatus(){
    if(!root.document||root.document.getElementById('sactRuntimeLoadStatus')) return;
    const el=root.document.createElement('div');
    el.id='sactRuntimeLoadStatus';el.setAttribute('role','status');el.setAttribute('aria-live','polite');
    el.style.cssText='position:fixed;right:14px;bottom:14px;z-index:9999;max-width:300px;padding:9px 11px;border-radius:9px;background:#12314a;color:white;font:600 12px/1.35 Arial,sans-serif;box-shadow:0 4px 18px #0003;display:none';
    el.textContent='Loading regimen library…';root.document.body.appendChild(el);
    const first=root.setTimeout?.(()=>{el.style.display='block';},1400);
    const slow=root.setTimeout?.(()=>{el.textContent='Regimen library is taking longer than usual. SACTCheck is retrying slow files; previously cached data is reused automatically.';el.style.display='block';},9000);
    root.addEventListener?.('sactcheck:protocols-loaded',()=>{if(first)root.clearTimeout?.(first);if(slow)root.clearTimeout?.(slow);el.textContent='Regimen library ready';root.setTimeout?.(()=>el.remove(),700);},{once:true});
  }

  function boot(){
    pruneOldCaches();
    installLoadStatus();
    // Start prewarming at DOM ready. This listener is registered in <head>, so it
    // runs before protocol-loader's DOMContentLoaded listener. Identical requests
    // are coalesced by cachedFetch rather than duplicated.
    warmProtocolCache();
  }
  if(root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();}
  else{pruneOldCaches();}

  root.SACTCheckRuntimePerformanceV0810=Object.freeze({release:RELEASE,cacheName:CACHE_NAME,stats,warmProtocolCache,isCacheable,canonicalUrl:url=>canonical(absolute(url)).href});
})(typeof globalThis!=='undefined'?globalThis:this);
