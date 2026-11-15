'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib'),vm=require('node:vm');
const R=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(R,f)),json=f=>JSON.parse(read(f)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const core=require('../tools/consent-core-v08455.cjs'),idx=json('protocols/index.json');
test('compressed catalogue retains every source protocol and its exact clinical content',()=>{
 const bytes=zlib.gunzipSync(read(idx.bundle.path)),bundle=JSON.parse(bytes);assert.equal(sha(bytes),idx.bundle.sha256);assert.equal(bytes.length,idx.bundle.bytes);assert.equal(bundle.records.length,377);
 for(const {entry,protocol} of bundle.records){assert.deepEqual(protocol,json(entry.path));assert.deepEqual(entry,idx.protocols.find(e=>e.id===entry.id));}
 assert(read(idx.bundle.path).length<3*1024*1024);
 const baseline=json('validation/usability-consent-v08455/baseline-v54-protected.json');
 for(const f of baseline.files.filter(f=>f.path.startsWith('protocols/')&&f.path!=='protocols/index.json'))assert.equal(sha(read(f.path)),f.sha256,f.path+' clinical rules unchanged');
});
function loader(fetch,overrides={}){const context={AbortController,console:{warn(){},error(){},info(){}},fetch,URL,Response,DecompressionStream,TextDecoder,crypto:crypto.webcrypto,document:{readyState:'loading',addEventListener(){}},setTimeout,clearTimeout,...overrides};context.window=context;vm.runInNewContext(read('js/protocol-loader.js').toString(),context);return context.SACTCheckProtocolLoader;}
test('fast catalogue uses one payload request and rejects corrupt or mismatched data',async()=>{
 let requests=0;const api=loader(async url=>{requests++;assert.equal(url,idx.bundle.path);return new Response(read(url));});
 const result=await api.loadBundledProtocols(idx,idx.protocols);assert.equal(result.protocols.length,377);assert.equal(requests,1);
 assert.equal(await api.loadBundledProtocols({...idx,bundle:{...idx.bundle,sha256:'0'.repeat(64)}},idx.protocols),null);
 assert.equal(await api.loadBundledProtocols(idx,[{...idx.protocols[0],path:'protocols/wrong.json'}]),null);
 assert.equal(await loader(async()=>new Response('bad',{status:503})).loadBundledProtocols(idx,idx.protocols),null);
 assert.equal(await loader(async()=>new Response('not gzip')).loadBundledProtocols(idx,idx.protocols),null);
 assert.equal(await api.loadBundledProtocols({...idx,bundle:undefined},idx.protocols),null);
});
test('a stalled bundle body times out and leaves the individual-file fallback available',async()=>{
 let trigger,cleared=false;
 const api=loader(async(_url,init)=>new Response(new ReadableStream({start(controller){init.signal.addEventListener('abort',()=>controller.error(Error('stalled transfer')));}})),{setTimeout(fn,ms){assert.equal(ms,15000);trigger=fn;return 1;},clearTimeout(){cleared=true;}});
 const pending=api.loadBundledProtocols(idx,idx.protocols);await Promise.resolve();trigger();assert.equal(await pending,null);assert(cleared);
 let requested=false;const legacy=loader(async()=>{requested=true;},{DecompressionStream:undefined});assert.equal(await legacy.loadBundledProtocols(idx,idx.protocols),null);assert.equal(requested,false);
});
test('cache deduplicates concurrent misses, does not wait for disk writes, and never prefetches on boot',async()=>{
 let hits=0,opened=0,writes=0,boot;
 let finishWrite;const diskWrite=new Promise(r=>{finishWrite=r;});
 const ctx={location:{href:'https://sactcheck.com/'},SACTCHECK_RELEASE:'0.84.55',URL,Response,AbortController,CustomEvent:class{},setTimeout,clearTimeout,
 fetch:async()=>{hits++;return new Response('{"ok":true}');},caches:{open:async()=>{opened++;return {match:async()=>{await new Promise(r=>setTimeout(r,5));return null;},put:()=>{writes++;return diskWrite;}}},keys:async()=>[]},
 document:{readyState:'loading',getElementById:()=>({}),addEventListener:(n,fn)=>{boot=fn;}},dispatchEvent(){}};
 vm.runInNewContext(read('js/runtime-performance-v0810.js').toString(),ctx);boot();await new Promise(r=>setTimeout(r,10));assert.equal(hits,0);
 const responses=await Promise.race([Promise.all([ctx.fetch('protocols/index.json'),ctx.fetch('protocols/index.json')]),new Promise((_,reject)=>setTimeout(()=>reject(Error('cache write blocked fetch')),250))]);
 assert.equal(hits,1);assert.equal(opened,1);assert.equal(writes,1);for(const r of responses)assert.deepEqual(await r.json(),{ok:true});finishWrite();
 assert(ctx.SACTCheckRuntimePerformanceV0810.isCacheable(new URL('https://sactcheck.com/protocols/catalogue-bundle.json.gz')));
});
test('a search typed while loading is retained and applied when the catalogue is ready',()=>{
 const source=read('index.html').toString();const fn=source.slice(source.indexOf('  function filterRegimens('),source.indexOf('  window.filterRegimens=filterRegimens;'));
 const elements={regimenSearch:{value:'pembro'},tumourFilter:{value:'all'},treatmentFilter:{value:'all'},statusFilter:{value:'all'}};
 for(const id of ['catalogCount','catalogEmptyState','regimenGrid','libraryScreen','searchResultSummary'])elements[id]={textContent:'',classList:{toggle(){}},setAttribute(){},replaceChildren(){this.textContent='';},append(...xs){this.textContent+=xs.map(x=>x.textContent||x).join('');}};
 let cards=[],rankCalls=0,fallbackCalls=0;
 const ctx={window:{SACTCHECK_CATALOGUE_STATE:'loading',SACTCheckRegimenSearch:{rankCards:c=>{rankCalls++;return c.map(card=>({card,score:200,reason:'test match'}));},matchesText:()=>{fallbackCalls++;return true;}}},document:{body:{dataset:{}},querySelectorAll:s=>s.includes('data-json-protocol-id')?cards:[],createElement:()=>({textContent:''}),createTextNode:text=>({textContent:text})},$:id=>elements[id],value:id=>elements[id]?.value,clearSearchDecoration(){},decorateSearchMatch(){}};
 vm.createContext(ctx);vm.runInContext(fn+'\nthis.run=filterRegimens;',ctx);ctx.run();assert.match(elements.searchResultSummary.textContent,/will appear automatically/);assert.equal(elements.regimenSearch.value,'pembro');
 cards=[{dataset:{name:'pembro',tumour:'Lung',status:'active',section:'immunotherapy'},style:{},textContent:'Pembrolizumab',setAttribute(){}}];ctx.window.SACTCHECK_CATALOGUE_STATE='ready';ctx.run();assert.match(elements.searchResultSummary.textContent,/1 matching regimen/);assert.equal(cards[0].style.display,'flex');assert.equal(fallbackCalls,0);assert.equal(rankCalls,2);
});
test('NCCP treatment-type lists are complete, treatment-specific, and preserve every agent risk',()=>{
 assert.deepEqual(Object.fromEntries(Object.entries(core.model.categories).map(([k,v])=>[k,v.risks.length])),{chemotherapy:19,immunotherapy:12,targeted:11,endocrine:8});
 assert.deepEqual(core.classify(json('data/patient-knowledge/00568.json')),['chemotherapy','immunotherapy']);
 assert.deepEqual(core.classify(json('data/patient-knowledge/00494.json')),['endocrine']);
 assert.deepEqual(core.classify(json('data/patient-knowledge/00415.json')),['targeted']);
 assert.deepEqual(core.classifyAgent({id:'trastuzumab_deruxtecan',name:'Trastuzumab deruxtecan'}),['chemotherapy','targeted']);
 const inventory=json('validation/usability-consent-v08455/consent-inventory.json');assert.equal(inventory.routes.length,279);
 const norm=s=>s.replace(/&(?:#039|#39);/g,"'").replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
 for(const row of inventory.routes){const p=json(row.profile),file=`patient/${row.route}/consent-form.html`,html=read(file).toString();assert.equal(core.transform(html,p,file),html,file+' idempotence');assert.equal((html.match(/data-consent-core="0.84.55"/g)||[]).length,1);
  for(const category of core.classify(p))for(const risk of core.model.categories[category].risks)assert(html.includes(`data-nccp-risk="${category}-${risk.id}"`),file+' '+risk.label);
  for(const a of p.agents)for(const risk of a.risks)assert(norm(html).includes(norm(risk)),file+' lost agent risk '+risk);
  if(core.classify(p).includes('immunotherapy'))for(const risk of core.model.immune_supplement)assert(html.includes(`data-immune-risk="${risk.id}"`));
 }
 assert.equal(sha(read('validation/usability-consent-v08455/sources/nccp-consent-current.docx')),core.model.source.sha256);
});
test('all consent PDFs retain source content and have identical published download copies',()=>{
 const report=json('validation/usability-consent-v08455/consent-pdf-verification.json');assert.equal(report.forms,279);assert.equal(report.status,'passed');assert.equal(report.published,true);
 for(const r of report.routes){assert(r.pages>=1&&r.pages<=6);assert(r.all_source_units_retained);assert.equal(r.a4_and_bounds,'pass');assert.equal(sha(read(`patient/${r.route}/consent-form.html`)),r.source_sha256);assert.equal(sha(read(`patient/${r.route}/consent-form.pdf`)),r.sha256);assert.equal(sha(read(`docs/patient/${r.route}/consent-form.pdf`)),r.sha256);}
});
test('v55 accepts only exact consent and startup transitions and retains historical provenance',async()=>{
 const m=require('./helpers/retrospective-v08455.cjs'),record=json('validation/usability-consent-v08455/asset-migrations.json');
 assert.equal(m.NEW_ROUTES.length,0);assert.equal(m.ROUTES.length,279);for(const f of ['js/assessment-engine.js','patient/00568/guide.pdf','protocols/genitourinary/00101-cabazitaxel-prednisolone.json','patient/99999/consent-form.pdf','../unsafe'])assert.equal(m.approvedPath(f),false,f);
 assert.equal(m.approvedPath('patient/00568/consent-form.pdf'),true);const migrate=m.createMigration(record);const [f,v]=Object.entries(record.files).find(([f,v])=>v.before);assert.equal(migrate(f,v.before),v.after);assert.throws(()=>migrate(f,'0'.repeat(64)));assert((await m.verifyBeforeHashes(record))>0);const counts=m.verifyCurrent(record);assert(counts.protectedCount>11000);assert(counts.currentCount>=counts.protectedCount);
});
