const current21=new Set(require('../data/breast-completion-v08421-source-index.json').codes);
'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),vm=require('vm'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const codes=['00858','00860','00861','00348','00734','00857'],R=require('../js/patient-asset-registry-v0810'),J=require('../js/treatment-journey-v0837'),B=require('../js/breast-library-v0837'),V=require('../js/treatment-evidence-v08413'),KB=json('data/regimen-knowledge-base-v08413-addendum.json');
for(const code of codes){
 const d=json(`data/patient-knowledge/${code}.json`),phases=json('data/phase-support-v0838.json').regimens[code],immune=!['00348','00734'].includes(code);assert.equal(d.suite_release,current21.has(d.code)?'0.84.21':('0.84.13'));assert.equal(d.cycle_display,'reference-chronology');assert(!d.evidence);assert(!d.evidence_at_a_glance);
 const src=new Set(d.sources.map(s=>s.id));for(const ch of d.chapters)for(const it of ch.items)for(const id of it.source_ids)assert(src.has(id),id);
 const j=J.definitions[code];assert.equal(j.has_patient_dates,false);for(const l of j.lanes){assert.equal(l.cells.length,j.stages.length);for(const id of l.source_ids)assert(j.sources.some(s=>s.id===id));}
 const patientNumerics=/85\.1|77\.2|78\.3|69\.8|86\.6|81\.7|64\.8|51\.2|hazard ratio|evidence_at_a_glance|data-clinician-evidence/;
 for(const name of ['index','knowledge','consent','consent-form','guide','passport','sactcard','logistics','supportive-care','supportive-care-overview','treatment-journey',...phases.map(p=>'support-'+p.id)]){
  const h=read(`patient/${code}/${name}.html`);assert(!/undefined|\[object Object\]/.test(h),code+'/'+name);assert(!patientNumerics.test(h),code+'/'+name+' evidence crossed audience boundary');
  for(const m of h.matchAll(/(?:src|href)="([^"#]+)"/g)){if(/^(https?:|data:|mailto:|tel:)/.test(m[1]))continue;assert(fs.existsSync(path.resolve(root,'patient',code,m[1].split(/[?#]/)[0])),`${code}/${name}: ${m[1]}`);}
  if(['index','knowledge','treatment-journey'].includes(name))assert(!/<input|<select|<textarea/.test(h));
  if(['index','knowledge'].includes(name))assert(h.includes('wikiCycleChronology'));
 }
 for(const name of ['guide','passport','consent-form','sactcard','logistics','supportive-care','treatment-journey',...phases.map(p=>'support-'+p.id)])assert.deepEqual(fs.readFileSync(path.join(root,`patient/${code}/${name}.pdf`)),fs.readFileSync(path.join(root,`docs/patient/${code}/${name}.pdf`)));
 for(const [asset,file] of [['knowledge','knowledge.html'],['longitudinal','treatment-journey.html'],['consent-draft','consent-form.html'],['supportive-care-selector','supportive-care.html']])assert.equal(R.relativePath(code,asset),`patient/${code}/${file}`);
 assert(B.matchesReceptor(B.regimens[code],'tnbc'));assert(read('404.html').includes(code));
 const profile=KB.regimen_profiles.find(p=>p.protocol_id===d.protocol_id);assert(profile.treatment_rationale.line.includes('perioperative'));const e=profile.evidence_at_a_glance;assert(e.checked&&e.sources.length);const html=V.render(profile);assert(html.includes('Why this regimen?'));assert(html.includes('Toxicity context.'));assert(!/undefined|NaN/.test(html));
 if(immune){assert.deepEqual(e.endpoints.slice(0,2).map(x=>[x.endpoint,x.intervention_value,x.comparator_value]),[['OS',85.1,77.2],['EFS',78.3,69.8]]);assert(html.includes('+7.9 percentage points'));assert(html.includes('+8.5 percentage points'));assert(html.includes('conference abstract'));assert.equal(phases.at(-1).medicines.length,0);assert.deepEqual(d.anatomy_phases.at(-1).anatomy.map(x=>x[2]),Array(4).fill('Pembrolizumab'));}
 else{assert(!d.agents.some(a=>a.id==='pembrolizumab'));assert(!JSON.stringify(phases).includes('Pembrolizumab'));assert(d.monitoring_schedule.rows[0].cells[2].includes('Weekly throughout AC'));}
 if(['00860','00861'].includes(code)){assert(e.applicability.includes('exact'));assert.equal(d.phase_cycles[1].cycle_days,14);assert.equal(d.phase_cycles.at(-1).cycle_days,42);}
 const listeners={},select={value:'',addEventListener:(ev,fn)=>listeners[ev]=fn},sections=phases.map(p=>({hidden:true,dataset:{supportPhase:p.id}})),prompt={hidden:false};
 vm.runInNewContext(read('assets/patient/phase-support-v0838.js'),{document:{getElementById:id=>id==='support-phase'?select:id==='phase-prompt'?prompt:null,querySelectorAll:()=>sections},window:{location:{search:''}},URLSearchParams});
 for(const p of phases){select.value=p.id;listeners.change();assert.equal(sections.filter(x=>!x.hidden).length,1);assert.equal(sections.find(x=>!x.hidden).dataset.supportPhase,p.id);}select.value='';listeners.change();assert(sections.every(x=>x.hidden));
}
assert(!V.render({treatment_rationale:{summary:'<script>bad()</script>',sources:[{label:'bad',url:'javascript:alert(1)'}]}}).includes('<script>'));assert(!V.render({treatment_rationale:{sources:[{url:'javascript:alert(1)'}]}}).includes('href="javascript:'));
assert(!V.render(KB.regimen_profiles.find(x=>x.protocol_id.includes('00734'))).includes('data-endpoint="OS"'));
const updates=json('validation/tnbc-v08413/retrospective-00857-hashes.json');for(const [p,c] of Object.entries(updates.files))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex'),require('./helpers/retrospective-v08414.cjs').expectedHash(p,c.after));
(async()=>{
 const target={innerHTML:''},cl={add(){},remove(){},toggle(){}},overlay={classList:cl,querySelector:s=>s==='[data-regimen-info-content]'?target:null};const context={console,fetch:async u=>({ok:fs.existsSync(path.join(root,u)),json:async()=>json(u)}),document:{readyState:'loading',addEventListener(){},getElementById:()=>overlay,body:{classList:cl}}};vm.createContext(context);vm.runInContext(read('js/treatment-evidence-v08413.js'),context);vm.runInContext(read('js/regimen-knowledge-base.js'),context);const api=context.SACTCheckRegimenKnowledgeBase;await api.load();
 for(const code of codes){const f=fs.readdirSync(path.join(root,'protocols/breast')).find(x=>x.startsWith(code+'-')),p=json('protocols/breast/'+f);assert(api.open(p));await new Promise(r=>setImmediate(r));assert(target.innerHTML.includes('Why this regimen?'));assert(target.innerHTML.includes('Longitudinal monitoring schedule'));assert(!/undefined|\[object Object\]|could not be loaded/.test(target.innerHTML));assert.equal(api.regimenProfileForProtocol(p).full_suite_release,'0.84.13');}
 console.log('TNBC full-suite service links, actual KB loader/render, endpoint arithmetic, phase selectors, patient boundary and scoped retrospective hashes passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
