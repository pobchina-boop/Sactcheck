'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('crypto'),vm=require('vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const codes=['00785','00789','00790','00796','00797'],R=require('../js/patient-asset-registry-v0810'),J=require('../js/treatment-journey-v0837'),B=require('../js/breast-library-v0837'),kb=json('data/regimen-knowledge-base-v08412-addendum.json');
for(const code of codes){
 const d=json(`data/patient-knowledge/${code}.json`),phases=json('data/phase-support-v0838.json').regimens[code];assert.equal(d.suite_release,'0.84.12');assert.equal(d.cycle_display,'reference-chronology');assert.equal(d.cycle_days,21);
 const src=new Set(d.sources.map(s=>s.id));for(const ch of d.chapters)for(const it of ch.items)for(const id of it.source_ids)assert(src.has(id));
 const j=J.definitions[code];assert.equal(j.has_patient_dates,false);for(const l of j.lanes){assert.equal(l.cells.length,j.stages.length);for(const id of l.source_ids)assert(j.sources.some(s=>s.id===id));}
 assert(/12 weeks/.test(JSON.stringify(d.monitoring_schedule)));assert(/cycle 5/.test(JSON.stringify(d.monitoring_schedule)));for(const row of d.monitoring_schedule.rows)assert.equal(row.cells.length,5);
 for(const name of ['index','knowledge','consent','consent-form','guide','passport','sactcard','logistics','supportive-care','supportive-care-overview','treatment-journey',...phases.map(p=>'support-'+p.id)]){
  const h=read(`patient/${code}/${name}.html`);assert(!/undefined|\[object Object\]/.test(h),code+'/'+name);
  for(const m of h.matchAll(/(?:src|href)="([^"#]+)"/g)){if(/^(https?:|data:|mailto:|tel:)/.test(m[1]))continue;assert(fs.existsSync(path.resolve(root,'patient',code,m[1].split(/[?#]/)[0])),`${code}/${name}: ${m[1]}`);}
  if(['index','knowledge','treatment-journey'].includes(name))assert(!/<input|<select|<textarea/.test(h),'Patient orientation requires no entry');
  if(['index','knowledge'].includes(name)){assert(h.includes('wikiCycleChronology'));assert(!h.includes('pk-day-detail'));}
 }
 for(const name of ['guide','passport','consent-form','sactcard','logistics','supportive-care','treatment-journey',...phases.map(p=>'support-'+p.id)])assert.deepEqual(fs.readFileSync(path.join(root,`patient/${code}/${name}.pdf`)),fs.readFileSync(path.join(root,`docs/patient/${code}/${name}.pdf`)));
 for(const [asset,file] of [['knowledge','knowledge.html'],['longitudinal','treatment-journey.html'],['consent-draft','consent-form.html'],['supportive-care-selector','supportive-care.html']])assert.equal(R.relativePath(code,asset),`patient/${code}/${file}`);
 assert(read('404.html').includes(code));assert(B.regimens[code]);assert(B.matchesReceptor(B.regimens[code],'her2pos'));assert(kb.regimen_profiles.some(p=>p.protocol_id===d.protocol_id));
 // Exercise actual phase-selector script through DOM event callbacks, including reset.
 const listeners={},select={value:'',addEventListener:(ev,fn)=>listeners[ev]=fn},sections=phases.map(p=>({hidden:true,dataset:{supportPhase:p.id}})),prompt={hidden:false};
 const document={getElementById:id=>id==='support-phase'?select:id==='phase-prompt'?prompt:null,querySelectorAll:()=>sections};
 vm.runInNewContext(read('assets/patient/phase-support-v0838.js'),{document,window:{location:{search:''}},URLSearchParams});
 for(const p of phases){select.value=p.id;listeners.change();assert.equal(sections.filter(x=>!x.hidden).length,1);assert.equal(sections.find(x=>!x.hidden).dataset.supportPhase,p.id);}
 select.value='';listeners.change();assert(sections.every(x=>x.hidden));
}
assert.equal(json('data/patient-knowledge/00785.json').anatomy.length,4);assert(!/hair|neutropenia|numbness/i.test(JSON.stringify(json('data/patient-knowledge/00785.json').anatomy)));
assert.deepEqual(B.regimens['00789'].settings,['neoadjuvant']);assert.deepEqual(B.regimens['00790'].settings,['neoadjuvant']);assert(B.regimens['00785'].settings.includes('maintenance'));
const sup=json('data/phase-support-v0838.json').regimens;assert.deepEqual(sup['00790'].map(p=>p.id),['combination','day8','continuation']);assert(sup['00790'][0].medicines.some(m=>m.name==='Aprepitant'));assert(!sup['00790'][1].medicines.some(m=>m.name==='Aprepitant'));assert.equal(sup['00785'][0].medicines.length,0);
for(const c of ['00796','00797'])assert.equal(sup[c].at(-1).medicines.length,0);
// Exercise the actual UI filter values, not a separate 'metastatic' vocabulary.
const filterValues={breastSetting:'advanced',breastReceptor:'her2pos',breastSuite:'full'};
const filterContext={document:{readyState:'loading',addEventListener(){},getElementById:id=>({value:filterValues[id]})}};
vm.createContext(filterContext);vm.runInContext(read('js/breast-library-v0837.js'),filterContext);
for(const code of codes){const card={dataset:{jsonProtocolId:json(`data/patient-knowledge/${code}.json`).protocol_id,tumour:'Breast'}};assert.equal(filterContext.SACTCheckBreastLibrary.matchesCard(card,'Breast','solid'),['00785','00796','00797'].includes(code));}
filterValues.breastSetting='neoadjuvant';
for(const code of codes){const card={dataset:{jsonProtocolId:json(`data/patient-knowledge/${code}.json`).protocol_id,tumour:'Breast'}};assert.equal(filterContext.SACTCheckBreastLibrary.matchesCard(card,'Breast','solid'),['00789','00790'].includes(code));}
const baseline=json('validation/phesgo-v08412/protected-assets.json');for(const [p,h] of Object.entries(baseline))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex'),require('./helpers/retrospective-v08413.cjs').expectedHash(p,h),'Previous patient asset changed '+p);
(async()=>{
 const target={innerHTML:''},cl={add(){},remove(){},toggle(){}},overlay={classList:cl,querySelector:s=>s==='[data-regimen-info-content]'?target:null};const context={console,fetch:async u=>({ok:fs.existsSync(path.join(root,u)),json:async()=>json(u)}),document:{readyState:'loading',addEventListener(){},getElementById:()=>overlay,body:{classList:cl}}};vm.createContext(context);vm.runInContext(read('js/regimen-knowledge-base.js'),context);const api=context.SACTCheckRegimenKnowledgeBase;await api.load();
 for(const code of codes){const f=fs.readdirSync(path.join(root,'protocols/breast')).find(x=>x.startsWith(code+'-')),p=json('protocols/breast/'+f);assert(api.open(p));await new Promise(r=>setImmediate(r));assert(target.innerHTML.includes('Longitudinal monitoring schedule'));assert(!/undefined|\[object Object\]|could not be loaded/.test(target.innerHTML));assert.equal(api.regimenProfileForProtocol(p).full_suite_release,'0.84.12');}
 console.log(`Five Phesgo suites, clinician KB render, phase selectors, service links, date-free maps and ${Object.keys(baseline).length} preserved assets passed.`);
})().catch(e=>{console.error(e);process.exitCode=1;});
