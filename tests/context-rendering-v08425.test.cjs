'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const codes=['00203','00226','00232','00259','00215'],index=json('protocols/index.json').protocols;
const protocol=c=>json(index.find(p=>p.path.includes('/'+c+'-')).path);
const fetch=async u=>({ok:fs.existsSync(path.join(root,u)),json:async()=>json(u)});
(async()=>{
 let change,context='all';
 const picker={addEventListener(type,fn){assert.equal(type,'change');change=fn}},target={innerHTML:'',querySelector:()=>picker},cl={add(){},remove(){},toggle(){}};
 const overlay={classList:cl,querySelector:s=>s==='[data-regimen-info-content]'?target:null};
 const ctx={console,fetch,SACTCheckProtocolContext:{activeTumourGroup:()=>context},SACTCheckTreatmentJourney:{renderForCode:c=>`<p data-test-journey="${c}"></p>`},document:{readyState:'loading',addEventListener(){},getElementById:()=>overlay,body:{classList:cl}}};
 vm.createContext(ctx);for(const p of ['js/treatment-evidence-v08413.js','js/regimen-knowledge-base.js'])vm.runInContext(read(p),ctx);
 const api=ctx.SACTCheckRegimenKnowledgeBase;await api.load();
 for(const c of codes){
  context='all';assert(api.open(protocol(c)));await new Promise(r=>setImmediate(r));
  assert.match(target.innerHTML,/Choose an indication context/);assert(!target.innerHTML.includes('data-test-journey='));assert(!target.innerHTML.includes('evidence-outcome'));
  change({target:{value:'lung'}});assert(target.innerHTML.includes(`data-test-journey="${c}:lung"`));assert(target.innerHTML.includes(`patient/${c}/lung/guide.pdf`));assert(!/undefined|\[object Object\]/.test(target.innerHTML));
  change({target:{value:'breast'}});assert(target.innerHTML.includes(`data-test-journey="${c}"`));assert(!target.innerHTML.includes(`patient/${c}/lung/guide.pdf`));
  context='Lung';api.open(protocol(c));await new Promise(r=>setImmediate(r));assert(target.innerHTML.includes(`data-test-journey="${c}:lung"`));
 }
 const V=require('../js/treatment-evidence-v08413');
 for(const p of json('data/regimen-knowledge-base-v08425-addendum.json').regimen_profiles){
  for(const e of p.evidence_at_a_glance?.endpoints||[]){
   if(Number.isFinite(e.intervention_value)&&!Number.isFinite(e.comparator_value)){
    const html=V.outcome(e);assert(html.includes(String(e.intervention_value)));assert.match(html,/No comparator arm/);assert(!/\dpercent|\dmonths/.test(html));assert(!html.includes('Difference:'));
   }
  }
 }
 // Exercise the actual sustainability page initializer and inspect rendered values.
 const node=()=>({children:[],textContent:'',classList:cl,append(...x){this.children.push(...x)},appendChild(x){this.children.push(x)},replaceChildren(){this.children=[]}});
 const flatten=n=>[n.textContent,...n.children.map(flatten)].join(' ');
 for(const c of codes){
  const id=protocol(c).protocol_id;
  for(const tumour of ['lung','breast','all']){
   let init;const host=node();const env={console,fetch,URLSearchParams,location:{search:'?protocol='+id+'&tumour='+tumour},document:{readyState:'loading',addEventListener:(t,f)=>{init=f},getElementById:id=>id==='metadataGrid'?host:null,createElement:node}};
   vm.createContext(env);vm.runInContext(read('js/sustainability-module.js'),env);await init();
   const rendered=flatten(host);
   const expected=tumour==='all'?'Confirm the treatment indication, schedule and planned doses with the oncology team.':json('data/sustainability-regimen-metadata-v0691.json').profiles[id].context_profiles[tumour].administration_frequency.value;
   const pretty=String(expected).replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());assert(rendered.includes(pretty),c+'/'+tumour);
  }
 }
 console.log('Indication switching, unknown-context withholding, single-arm evidence and all five sustainability profiles render correctly.');
})().catch(e=>{console.error(e);process.exitCode=1});
