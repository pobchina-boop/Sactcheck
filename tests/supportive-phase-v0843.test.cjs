'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),data=JSON.parse(read('data/regimen-workflow-v0750.json'));
const protocols=fs.readdirSync(path.join(root,'protocols/breast')).filter(f=>f.endsWith('.json')).map(f=>JSON.parse(read('protocols/breast/'+f)));
const byCode=code=>protocols.find(p=>String(p.metadata.nccp_regimen_code).padStart(5,'0')===code);
require('../js/sactcheck-release.js');
const workflow=require('../js/regimen-workflow-engine-v0750.js'),pdf=require('../js/supportive-care-pdf-v0750.js');
let count=0;
const check=(v,message)=>{assert(v,message);count++;};
const risk={level:'phase_dependent',baseLevel:'phase_dependent',phaseResolved:false};
for(const [code,entry] of Object.entries(data.supportive_phase_selectors)){
 const protocol=byCode(code);
 check(workflow.buildManifest(protocol,data,risk).supportiveCare.status==='phase_review_required',code+' must require explicit selection');
 for(const phase of entry.phases){
  const m=workflow.buildManifest(protocol,data,risk,phase.id),plan=m.supportiveCare;
  check(plan.status==='available'&&plan.planId===phase.plan_id,code+' '+phase.id+' plan');
  assert.deepEqual(m.components,phase.active_medicines);count++;
  check(!m.components.includes('pembrolizumab'),'No copied immunotherapy phase');
  check(plan.local_prescription_items.length===0,'No conflicting legacy local prescription');
  check(plan.agentSupport.every(a=>a.match_agents.some(drug=>phase.active_medicines.includes(drug.toLowerCase()))),'Agent support belongs to active phase');
  if(phase.id==='dose_dense_ac'){
   check(!plan.subsequent.some(x=>x.medicine==='Dexamethasone'),'AC has no routine delayed dexamethasone');
   check(plan.day1.some(x=>x.medicine==='Olanzapine'),'AC olanzapine');
   check(!plan.agentSupport.some(x=>JSON.stringify(x).toLowerCase().includes('paclitaxel')),'No taxane premedication in AC');
  }else check(!plan.day1.some(x=>x.medicine==='Olanzapine'),'No AC schedule inherited by taxane/carbo');
  const payload={manifest:m,sources:data.sources},bytes=pdf.buildPdf(payload),text=Buffer.from(bytes).toString('latin1');
  check(text.includes('SELECTED PHASE:'),'PDF identifies phase');
  check(text.includes('v'+require('../package.json').version),'PDF carries current release');
  check(text.includes('Day 1 below means the selected treatment visit.'),'PDF day numbering defined');
  check(pdf.filename(payload).includes(phase.id),'PDF filenames distinguish phases');
  if(process.env.SACTCHECK_PHASE_PDF_DIR){fs.mkdirSync(process.env.SACTCHECK_PHASE_PDF_DIR,{recursive:true});fs.writeFileSync(path.join(process.env.SACTCHECK_PHASE_PDF_DIR,pdf.filename(payload)),bytes);}
 }
 for(const id of ['', 'adjuvant_pembrolizumab','arbitrary'])check(workflow.buildManifest(protocol,data,{...risk,level:'high',phaseResolved:true},id).supportiveCare.status==='phase_review_required','Unverified phase must not prescribe');
 const next={...protocol,metadata:{...protocol.metadata,nccp_version:'future'}};
 check(workflow.buildManifest(next,data,risk,entry.phases[0].id).supportiveCare.status==='phase_review_required','Changed source version cannot inherit script');
}
check(data.supportive_phase_selectors['00348'].phases.length===3,'00348 day 1 versus days 8/15 versus AC');
check(data.supportive_phase_selectors['00734'].phases.length===2,'00734 weekly combination versus AC');
check(workflow.buildManifest(byCode('00252'),data,{level:'high'}).supportiveCare.planId==='high_ac','Standalone AC unchanged');

// Minimal DOM event harness: execute the production card entry, rendered select,
// change listener and export listener together. No browser/layout claims.
function harness(){
 const ids=new Map(),events={},opened=[],alerts=[],exports=[];
 class Element{
  constructor(tag='div'){this.tagName=tag;this.dataset={};this.children=[];this.listeners={};this.classList={add(){},remove(){}};this.hidden=false;this.value='';}
  set id(v){this._id=v;ids.set(v,this);}get id(){return this._id;}
  set innerHTML(value){
   this.html=value;for(const child of this.children)if(child.id)ids.delete(child.id);this.children=[];
   for(const match of value.matchAll(/<(select|button|div|aside|input|option)[^>]*>/g)){
    const attrs=match[0],el=new Element(match[1]);el.attrs=attrs;
    const id=attrs.match(/\bid="([^"]+)"/);if(id)el.id=id[1];
    el.disabled=/\sdisabled(?:\s|>)/.test(attrs);el.value=attrs.match(/\bvalue="([^"]*)"/)?.[1]||'';
    if(match[1]==='option'&&/\sselected/.test(attrs)){const select=this.children.find(x=>x.tagName==='select');if(select)select.value=el.value;}
    this.children.push(el);
   }
  }
  get innerHTML(){return this.html||'';}
  appendChild(child){this.children.push(child);return child;}
  querySelector(s){if(s.startsWith('#'))return this.children.find(x=>x.id===s.slice(1))||null;const a=s.match(/^\[([^\]]+)\]$/);return a?this.children.find(x=>x.attrs?.includes(a[1]))||null:null;}
  querySelectorAll(s){const n=this.querySelector(s);return n?[n]:[];}
  addEventListener(type,fn){this.listeners[type]=fn;}
  emit(type,event={}){if(!this.disabled)return this.listeners[type]?.({target:this,...event});}
  setAttribute(){}remove(){}focus(){this.focused=true;}scrollIntoView(){}
 }
 const doc={readyState:'loading',documentElement:new Element(),body:new Element('body'),head:new Element('head'),createElement:t=>new Element(t),getElementById:id=>ids.get(id)||null,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:(type,fn)=>{events[type]=fn;}};
 const ctx={document:doc,URL,console,SACTCHECK_RELEASE:'0.84.3',fetch:async()=>({ok:true,json:async()=>data}),setTimeout:()=>0,addEventListener(){},MutationObserver:class{observe(){}},alert:m=>alerts.push(m),open:url=>{const win={document:{body:{}},close(){this.closed=true;}};opened.push({url,win});return win;},SACTCheckProtocolLoader:{getProtocolById:id=>protocols.find(p=>p.protocol_id===id)},SACTCheckEmetogenicRisk:{get:p=>({level:p.supportive_care.emetogenic_risk,baseLevel:p.supportive_care.emetogenic_risk})}};
 vm.createContext(ctx);
 for(const f of ['js/patient-asset-registry-v0810.js','js/regimen-workflow-engine-v0750.js','js/antiemetic-print-v0810.js'])vm.runInContext(read(f),ctx);
 ctx.SACTCheckAntiemeticPrintV0810.install();
 ctx.SACTCheckSupportiveCarePdf={release:'0.84.3',buildPdf:pdf.buildPdf,filename:pdf.filename,openInViewer:payload=>{exports.push(payload);return payload;}};
 // The presentation guard wraps exporters. Record its real buildPdf input instead.
 const original=ctx.SACTCheckSupportiveCarePdf;
 Object.defineProperty(ctx,'SACTCheckSupportiveCarePdf',{value:{...original,openInViewer:payload=>{exports.push(payload);return payload;}},configurable:true});
 return {ctx,doc,ids,opened,alerts,exports,events};
}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
 const h=harness();
 // Preserve the historical dynamic fallback tests after these regimens migrate to dedicated suites.
 const authoredRegistry=h.ctx.SACTCheckPatientAssets;
 h.ctx.SACTCheckPatientAssets={...authoredRegistry,relativePath:(p,a)=>['00348','00734'].includes(String(p.metadata.nccp_regimen_code).padStart(5,'0'))&&a.startsWith('supportive-care')?null:authoredRegistry.relativePath(p,a),runtimeUrl:(p,a)=>['00348','00734'].includes(String(p.metadata.nccp_regimen_code).padStart(5,'0'))&&a.startsWith('supportive-care')?null:authoredRegistry.runtimeUrl(p,a)};
 const card={dataset:{jsonProtocolId:byCode('00348').protocol_id}};
 const badge={closest:()=>card};
 h.events.click({target:{closest:()=>badge},preventDefault(){},stopImmediatePropagation(){}});await settle();
 let select=h.ids.get('workflowSupportPhase'),body=h.ids.get('workflowPanelBody');
 check(!!select&&select.focused,'Card Rx opens and focuses a real selector');
 check(h.opened.length===0&&h.alerts.length===0,'No blank viewer or dead-end alert');
 check(body.querySelector('[data-workflow-support]').disabled,'No export until selection');
 for(const id of ['carbo_paclitaxel_day1','dose_dense_ac','paclitaxel_days8_15']){
  select=h.ids.get('workflowSupportPhase');select.value=id;select.emit('change');await settle();
  body=h.ids.get('workflowPanelBody');const button=body.querySelector('[data-workflow-support]');
  check(!button.disabled,'Selected phase enables export');await button.emit('click');await settle();
  check(h.exports.at(-1).manifest.supportPhase.id===id,'Export follows currently selected phase');
 }
 select=h.ids.get('workflowSupportPhase');select.value='';select.emit('change');await settle();
 check(h.ids.get('workflowPanelBody').querySelector('[data-workflow-support]').disabled,'Clearing selection removes stale export');
 await h.ctx.SACTCheckRegimenWorkflow.openSupportivePdf(byCode('00734'));
 check(h.ids.get('workflowSupportPhase').value==='','Different regimen starts unselected');
 check(!h.ids.get('workflowPanelBody').innerHTML.includes('value="paclitaxel_days8_15"'),'Weekly AUC2 does not inherit paclitaxel-alone option');
 await h.ctx.SACTCheckRegimenWorkflow.openSupportivePdf(byCode('00348'),{supportPhase:'not-a-phase'});
 check(h.alerts.length===0&&h.ids.get('workflowSupportPhase').value==='','Invalid phase returns usable picker');
 await Promise.all([h.ctx.SACTCheckRegimenWorkflow.open(byCode('00348'),{supportPhase:'dose_dense_ac'}),h.ctx.SACTCheckRegimenWorkflow.open(byCode('00734'))]);
 check(h.ids.get('workflowPanelBody').innerHTML.includes('00734')&&!h.ids.get('workflowPanelBody').innerHTML.includes('value="paclitaxel_days8_15"'),'Late response cannot replace latest regimen');
 const pending=h.ctx.SACTCheckRegimenWorkflow.open(byCode('00348'));h.ids.get('regimenWorkflowOverlay').emit('keydown',{key:'Escape'});await pending;
 check(h.ids.get('regimenWorkflowOverlay').hidden,'Closing pending panel keeps it closed');
 h.ctx.SACTCheckPatientAssets=authoredRegistry;
 for(const code of ['00252','00260','00278','00485','00857','00348','00734','00858','00860','00861']){
  await h.ctx.SACTCheckRegimenWorkflow.openSupportivePdf(byCode(code));
  check(h.opened.at(-1).url.endsWith('/patient/'+code+'/supportive-care.html'),code+' retains dedicated phase selector');
  check(fs.existsSync(path.join(root,'patient',code,'supportive-care.html')),'Dedicated selector exists');
 }
 const html=read('patient/00252/supportive-care.html');check(html.includes('id="support-phase"'),'Standalone AC selector is an actual input');
 const selectNode={value:'old',addEventListener(_,fn){this.change=fn;}},prompt={hidden:false},sections=[{dataset:{supportPhase:'ac'},hidden:false},{dataset:{supportPhase:'taxane'},hidden:false}];
 vm.runInNewContext(read('assets/patient/phase-support-v0838.js'),{document:{getElementById:id=>id==='support-phase'?selectNode:prompt,querySelectorAll:()=>sections}});
 check(sections.every(x=>x.hidden)&&selectNode.value==='','Dedicated selector clears restored values');
 selectNode.value='ac';selectNode.change();check(!sections[0].hidden&&sections[1].hidden,'Dedicated AC phase selectable');
 selectNode.value='taxane';selectNode.change();check(sections[0].hidden&&!sections[1].hidden,'Dedicated phase switch hides prior script');
 console.log(`Supportive phase fix: ${count} checks passed (plan/day isolation, real UI handlers, PDF identity, invalid selection, race/close and dedicated AC routes).`);
})().catch(error=>{console.error(error);process.exitCode=1;});
