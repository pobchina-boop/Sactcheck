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
  const PREFETCH_CONCURRENCY=16; // explicit legacy prewarm only; never on startup
  let cachePromise;
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
    return (/^protocols\/.*\.json(?:\.gz)?$/i.test(p)||/^data\/.*\.json$/i.test(p));
  }
  function canonical(url){
    const copy=new URL(url.href);
    copy.searchParams.delete('sact_retry');
    copy.searchParams.delete('_');
    // Scope the HTTP URL as well as CacheStorage to the active release.
    // Otherwise a new cache can be populated with an older HTTP-cached JSON response.
    if(isCacheable(copy)) copy.searchParams.set('sact_release',RELEASE);
    return copy;
  }
  function cacheApi(){return root.caches&&typeof root.caches.open==='function'?root.caches:null;}
  async function openCache(){
    const api=cacheApi(); if(!api) return null;
    if(!cachePromise) cachePromise=api.open(CACHE_NAME).catch(()=>null);
    return cachePromise;
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
    // Register the whole operation before the first await, so parallel cache
    // misses are coalesced too. Cache writes must not block catalogue readiness.
    if(inFlight.has(key)) { stats.deduped++; return (await inFlight.get(key)).clone(); }
    const promise=(async()=>{
      const cache=await openCache();
      if(cache){try{const hit=await cache.match(key,{ignoreSearch:false});if(hit){stats.cacheHits++;return hit;}}catch(_){}}
      try{
        const response=await withTimeout(key,init);
        stats.networkHits++;
        if(response.ok&&cache) void cache.put(key,response.clone()).catch(()=>{});
        dispatch('sactcheck:runtime-fetch',{kind:'network',url:key,stats:{...stats}});
        return response;
      }catch(error){stats.networkFailures++;throw error;}
    })();
    inFlight.set(key,promise);
    try{return (await promise).clone();}finally{if(inFlight.get(key)===promise)inFlight.delete(key);}
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
    root.addEventListener?.('sactcheck:protocols-load-failed',()=>{if(first)root.clearTimeout?.(first);if(slow)root.clearTimeout?.(slow);el.remove();},{once:true});
    root.addEventListener?.('sactcheck:protocols-loaded',()=>{if(first)root.clearTimeout?.(first);if(slow)root.clearTimeout?.(slow);el.textContent='Regimen library ready';root.setTimeout?.(()=>el.remove(),700);},{once:true});
  }

  function boot(){
    pruneOldCaches();
    installLoadStatus();
    // The loader owns startup. Eagerly warming 377 separate files competes
    // with the single bundled catalogue and the interface resources.
  }
  if(root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();}
  else{pruneOldCaches();}

  root.SACTCheckRuntimePerformanceV0810=Object.freeze({release:RELEASE,cacheName:CACHE_NAME,stats,warmProtocolCache,isCacheable,canonicalUrl:url=>canonical(absolute(url)).href});
})(typeof globalThis!=='undefined'?globalThis:this);
