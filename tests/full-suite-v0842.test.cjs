'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('crypto'),cp=require('child_process'),vm=require('vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const codes=['00253','00254','00371','00376','00361'],index=json('data/endocrine-v0842-source-index.json'),kb=json('data/regimen-knowledge-base-v0842-addendum.json');
const R=require('../js/patient-asset-registry-v0810'),J=require('../js/treatment-journey-v0837'),B=require('../js/breast-library-v0837'),D=require('../js/protocol-dose-schedule'),support=json('data/phase-support-v0838.json').regimens;
assert.deepEqual(index.codes,codes);assert.equal(kb.regimen_profiles.length,5);assert.equal(kb.drug_profiles.length,5);assert(kb.evidence_records.length>=9);
let rules=0;
for(const code of codes){
 const d=json(`data/patient-knowledge/${code}.json`),p=json('protocols/breast/'+fs.readdirSync(path.join(root,'protocols/breast')).find(n=>n.startsWith(code)));
 assert.equal(d.suite_release,'0.84.2');assert.equal(p.metadata.sactcheck_encoding_version,'0.84.2');assert.equal(d.protocol_version,String(p.metadata.nccp_version));assert.equal(p.metadata.validation.clinical_use_authorised,false);
 assert.equal(index.regimens[code].rule_count,p.rule_engine.rules.length);rules+=p.rule_engine.rules.length;
 assert(p.rule_engine.rules.every(r=>r.source?.url&&r.source.page));assert.equal(new Set(p.rule_engine.rules.map(r=>r.rule_id||r.id)).size,p.rule_engine.rules.length);
 assert.equal(d.agents.length,1);assert.equal(d.anatomy.length,4);assert.equal(d.service_kind,'endocrine');assert.equal(d.cycle_days,code==='00361'?28:null);assert.equal(d.schedule_kind,code==='00361'?'loading_then_q28':'continuous_oral');
 assert.equal(J.definitions[code].has_patient_dates,false);assert.equal(J.definitions[code].schedule_type,'relative-educational');
 for(const lane of J.definitions[code].lanes){assert.equal(lane.cells.length,J.definitions[code].stages.length);for(const id of lane.source_ids)assert(J.definitions[code].sources.some(s=>s.id===id));}
 for(const row of d.monitoring_schedule.rows)assert.equal(row.cells.length,d.monitoring_schedule.columns.length);
 for(const ch of d.chapters)for(const item of ch.items)for(const id of item.source_ids)assert(d.sources.some(s=>s.id===id),code+' unresolved source '+id);
 for(const name of ['index','knowledge','consent','consent-form','guide','passport','sactcard','logistics','supportive-care','supportive-care-overview','treatment-journey','support-treatment']){
  const h=read(`patient/${code}/${name}.html`);assert(!/undefined|\[object Object\]/.test(h));
  for(const m of h.matchAll(/(?:src|href)="([^"#]+)"/g)){if(/^(https?:|data:|mailto:|tel:)/.test(m[1]))continue;assert(fs.existsSync(path.resolve(root,'patient',code,m[1].split(/[?#]/)[0])),`${code}/${name}: ${m[1]}`);}
  if(['index','knowledge','treatment-journey'].includes(name))assert(!/<input|<select|<textarea/.test(h),'Orientation needs no patient input');
  if(['index','knowledge'].includes(name)){assert(h.includes('wikiCycleChronology'));assert(h.includes('endocrine-timeline'));assert(!h.includes('type="date"'));assert(!h.includes('pk-day-detail'));}
 }
 for(const name of ['guide','passport','consent-form','sactcard','logistics','supportive-care','treatment-journey','support-treatment'])assert.deepEqual(fs.readFileSync(path.join(root,`patient/${code}/${name}.pdf`)),fs.readFileSync(path.join(root,`docs/patient/${code}/${name}.pdf`)));
 assert.equal(R.relativePath(code,'consent-draft'),`patient/${code}/consent-form.html`);assert.equal(R.relativePath(code,'longitudinal'),`patient/${code}/treatment-journey.html`);assert.equal(R.relativePath(code,'supportive-care-selector'),`patient/${code}/supportive-care.html`);assert(read('404.html').includes(code));
 const k=kb.regimen_profiles.find(k=>k.protocol_id===d.protocol_id);assert(k);assert.deepEqual(k.monitoring_and_toxicity.longitudinal_schedule,d.monitoring_schedule);assert.equal(k.schedule_kind,d.schedule_kind);assert(D.buildModel(p).phases.length>=1);
 assert(B.matchesReceptor(B.regimens[code],'hrpos-her2neg'));assert(B.matchesReceptor(B.regimens[code],'hrpos-her2pos'));assert(B.matchesReceptor(B.regimens[code],'her2pos'));assert(!B.matchesReceptor(B.regimens[code],'tnbc'));
 assert.equal(support[code].length,1);assert.deepEqual(support[code][0].medicines,[]);assert.equal(support[code][0].emetogenic_risk,'Minimal');
 const sm=json('data/sustainability-regimen-metadata-v0691.json').profiles[d.protocol_id];assert.equal(sm.ambulatory_pump.value,false);assert.equal(sm.route_classification.value,code==='00361'?'parenteral_only':'oral_only');
 assert.equal(json('data/regimen-reuse-map-v0842.json').regimens.find(r=>r.code===code).category,'authored_suite');
 const data=JSON.stringify(d);assert(data.includes('two to four months'));assert(data.includes('marker change alone'));assert(data.includes('No routine antiemetic'));assert(!data.includes('Oncotype'));
 if(code!=='00361'){assert(data.includes('remaining breast tissue'));assert(data.includes('Routine CT, bone scans and tumour markers are not recommended'));assert(J.definitions[code].lanes.some(x=>x.label==='Early: radiotherapy'));}
 if(['00254','00371','00376'].includes(code)){assert(data.includes('if not already receiving adjuvant bisphosphonates'));assert(data.includes('T-score above −2.0'));assert(data.includes('no additional risk factors'));assert(data.includes('one to two years'));}
}
assert.equal(rules,128);
assert.deepEqual(B.regimens['00361'].settings,['advanced']);assert(B.regimens['00371'].settings.includes('neoadjuvant'));assert(!B.regimens['00254'].settings.includes('neoadjuvant'));
// Combined setting/receptor filters respect the narrower neoadjuvant letrozole indication.
const selection={breastSetting:'neoadjuvant',breastReceptor:'hrpos-her2pos',breastSuite:'journey'};
global.document={getElementById:id=>({value:selection[id]||'all'})};
const letrozoleCard={dataset:{jsonProtocolId:'nccp-00371-vcurrent',tumour:'Breast'}};
assert.equal(B.matchesCard(letrozoleCard,'Breast','solid'),false);selection.breastReceptor='hrpos-her2neg';assert.equal(B.matchesCard(letrozoleCard,'Breast','solid'),true);selection.breastSetting='adjuvant';selection.breastReceptor='hrpos-her2pos';assert.equal(B.matchesCard(letrozoleCard,'Breast','solid'),true);delete global.document;
const fulv=json('data/patient-knowledge/00361.json');assert(fulv.schedule_summary.includes('Day 29'));assert(fulv.endocrine_timeline.columns.includes('Day 57 onward'));assert(JSON.stringify(fulv).includes('Child-Pugh B'));assert(JSON.stringify(fulv).includes('whereas EMA'));
const falcon=kb.evidence_records.find(e=>e.publication_url.includes('39772884'));assert(falcon);assert(/no (significant|statistically significant)|not (significant|statistically significant)/i.test(falcon.relevance_summary));
const tam=JSON.stringify(json('data/patient-knowledge/00253.json'));assert(tam.includes('at least four weeks'));assert(tam.includes('annual gynaecological'));assert(tam.includes('does not mean routine ultrasound or biopsy'));
assert(read('js/regimen-knowledge-base.js').includes('regimen-knowledge-base-v0842-addendum.json'));assert(read('js/regimen-knowledge-base.js').includes('During continuous treatment'));
// Exercise the actual consent script: user-entered text stays as text, prints, clears, and never persists.
const fields=['discussion-benefit','discussion-alternatives','discussion-risks','discussion-questions','discussion-review'].map(id=>({id,value:''})),outputs=Object.fromEntries(fields.map(f=>[f.id+'-print',{textContent:''}])),handlers={};
const form={querySelectorAll:()=>fields,addEventListener:(n,f)=>handlers[n]=f,reset:()=>fields.forEach(f=>f.value='')},buttons={};let printed=0;
vm.runInNewContext(read('assets/patient/consent-discussion.js'),{document:{getElementById:id=>id==='consent-discussion'?form:outputs[id]||(buttons[id]={addEventListener:(n,f)=>handlers[id]=f})},window:{addEventListener:(n,f)=>handlers[n]=f,print:()=>printed++}});
fields[0].value='<img src=x onerror=alert(1)>';handlers.input();assert.equal(outputs['discussion-benefit-print'].textContent,fields[0].value);handlers['consent-print']();assert.equal(printed,1);handlers['consent-clear']();assert(fields.every(f=>!f.value));assert(!/localStorage|sessionStorage|fetch\(|sendBeacon/.test(read('assets/patient/consent-discussion.js')));
const protectedFiles=json('validation/endocrine-v0842/protected-patient-baseline.json').files;for(const [p,h] of Object.entries(protectedFiles))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex'),require('./helpers/contact-migration-v0844.cjs').expectedHash(p,h),'Prior patient asset changed outside the approved contact migration: '+p);
for(const f of ['tools/build-breast-journeys.cjs','tools/build-patient-knowledge.cjs','tools/build-complete-pathways.cjs','tools/build-phase-support-v0838.cjs'])cp.execFileSync(process.execPath,[f,'--check'],{cwd:root,stdio:'pipe'});
console.log(`Five endocrine suites: 128 source-linked rules, continuous / loading schedules, setting-specific monitoring, evidence, consent interaction, full assets and ${Object.keys(protectedFiles).length} preserved patient files passed.`);
