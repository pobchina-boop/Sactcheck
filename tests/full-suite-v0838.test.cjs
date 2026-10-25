'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p)),codes=['00485','00815','00659','00892','00936'],R=require('../js/patient-asset-registry-v0810'),J=require('../js/treatment-journey-v0837'),B=require('../js/breast-library-v0837'),support=json('data/phase-support-v0838.json');
const kb=json('data/regimen-knowledge-base-v0838-addendum.json');
for(const c of codes){const d=json(`data/patient-knowledge/${c}.json`);assert.equal(d.suite_release,c==='00485'?'0.84.19':c==='00815'?'0.84.18':c==='00659'?'0.84.14':'0.83.8');assert.equal(d.cycle_display,'reference-chronology');assert(d.anatomy.length>=3&&d.anatomy.length<=8);assert.equal(new Set(d.anatomy.map(a=>a[0])).size,d.anatomy.length);assert.equal(J.definitions[c].has_patient_dates,false);
 for(const lane of J.definitions[c].lanes){assert.equal(lane.cells.length,J.definitions[c].stages.length);for(const id of lane.source_ids)assert(J.definitions[c].sources.some(s=>s.id===id));}
 for(const n of ['index','knowledge','consent','consent-form','guide','passport','sactcard','logistics','supportive-care','treatment-journey',...support.regimens[c].map(p=>'support-'+p.id)]){
  const h=read(`patient/${c}/${n}.html`);assert(!/undefined|\[object Object\]/.test(h));assert(h.includes(c));
  for(const m of h.matchAll(/(?:src|href)="([^"#]+)"/g)){if(/^(https?:|data:|mailto:|tel:)/.test(m[1]))continue;assert(fs.existsSync(path.resolve(root,'patient',c,m[1].split(/[?#]/)[0])),`${c}/${n}: missing ${m[1]}`);}
  if(['index','knowledge','treatment-journey'].includes(n))assert(!/<input|<select/.test(h),'Patient orientation must not require date or parameter entry');
  if(['index','knowledge'].includes(n)){assert(h.includes('wikiCycleChronology'));const ids=[...h.matchAll(/id="(wikiCycleChronology[^"]*)"/g)].map(x=>x[1]);assert.equal(new Set(ids).size,ids.length);}
 }
 for(const n of ['guide','passport','consent-form','sactcard','logistics','supportive-care','treatment-journey',...support.regimens[c].map(p=>'support-'+p.id)]){const b=fs.readFileSync(path.join(root,`patient/${c}/${n}.pdf`));assert.equal(b.subarray(0,5).toString(),'%PDF-');assert.deepEqual(b,fs.readFileSync(path.join(root,`docs/patient/${c}/${n}.pdf`)));}
 assert.equal(R.relativePath(c,'supportive-care-selector'),`patient/${c}/supportive-care.html`);assert.equal(R.relativePath(c,'longitudinal'),`patient/${c}/treatment-journey.html`);assert(kb.regimen_profiles.some(k=>k.protocol_id===d.protocol_id));assert(kb.evidence_records.some(k=>k.protocol_id===d.protocol_id));
 const metadata=json('data/sustainability-regimen-metadata-v0691.json').profiles[d.protocol_id];assert.equal(metadata.administration_frequency.value,d.schedule_summary);assert.equal(metadata.planned_treatment_encounters.value,null);
}
assert.equal(support.regimens['00485'].length,2);assert.equal(support.regimens['00815'].length,2);assert.equal(support.regimens['00857'].length,4);
assert(!support.regimens['00485'][1].medicines.some(m=>m.name==='Aprepitant'));assert(!support.regimens['00815'][1].medicines.length);assert(!support.regimens['00892'][0].medicines.some(m=>m.name==='Ondansetron'));
assert(support.regimens['00485'][0].medicines.some(m=>m.name==='Dexamethasone'&&m.timing==='Day 1'&&/No routine Days 2–4/.test(m.note)));
// Exercise phase switching and unknown-phase reset without needing a browser service.
let callback;const select={value:'stale',addEventListener:(event,fn)=>{assert.equal(event,'change');callback=fn;}},prompt={hidden:false},panels=['ac','paclitaxel'].map(id=>({dataset:{supportPhase:id},hidden:false}));
const document={getElementById:id=>id==='support-phase'?select:prompt,querySelectorAll:()=>panels};vm.runInNewContext(read('assets/patient/phase-support-v0838.js'),{document});assert.equal(select.value,'');assert(panels.every(p=>p.hidden));for(const value of ['ac','paclitaxel','']){select.value=value;callback();assert.equal(panels.filter(p=>!p.hidden).length,value?1:0);if(value)assert.equal(panels.find(p=>!p.hidden).dataset.supportPhase,value);}
// Review feedback: sparse maps and visible baseline-versus-cycle checks.
assert.equal(json('data/patient-knowledge/00726.json').anatomy.length,3);for(const c of ['00525','00892'])assert.equal(json(`data/patient-knowledge/${c}.json`).anatomy.length,4);
for(const c of ['00722','00619','00525','00892'])for(const n of ['index','knowledge','treatment-journey'])assert(read(`patient/${c}/${n}.html`).includes('monitoring-schedule'),`${c}/${n}: monitoring visible`);
const tchp=json('data/patient-knowledge/00722.json').monitoring_schedule;assert(tchp.columns.some(x=>/cycle 5/i.test(x)));assert(tchp.rows[0].cells[0].includes('Baseline'));assert(/clock/.test(JSON.stringify(tchp.rows.find(r=>r.label.startsWith('Echo')))),'Phase changes must preserve the cardiac monitoring clock');
const abema=json('data/patient-knowledge/00619.json').monitoring_schedule;assert(abema.rows.find(r=>r.label.startsWith('ECG')).cells[0].includes('clinically indicated'));assert(abema.note.includes('does not mandate'));
const nav=json('data/breast-library-contexts-v0837.json').regimens;assert(Object.values(nav).filter(x=>x.longitudinal).length>=10);assert(B.matchesReceptor(nav['00892'],'hrpos-her2neg'));assert(!B.matchesReceptor(nav['00892'],'her2pos'));assert(nav['00936'].settings.includes('advanced'));assert(!nav['00936'].settings.includes('adjuvant'));
for(const f of ['tools/build-breast-journeys.cjs','tools/build-patient-knowledge.cjs','tools/build-complete-pathways.cjs','tools/build-phase-support-v0838.cjs'])cp.execFileSync(process.execPath,[f,'--check'],{cwd:root,stdio:'pipe'});
console.log('Five new full suites, phase switching, source links, sparse body maps, cycle monitoring and generated parity passed.');

// Every new component resolves to its own clinician profile, including ADC identity.
global.SACTCheckRegimenComponents=require('../js/regimen-components');
const K=require('../js/regimen-knowledge-base'),bank=json('data/regimen-knowledge-base-v0680.json');bank.drug_profiles.push(...kb.drug_profiles);
for(const c of codes){const p=json('protocols/breast/'+fs.readdirSync(path.join(root,'protocols/breast')).find(f=>f.startsWith(c)));const names=global.SACTCheckRegimenComponents.forProtocol(p);assert.equal(K.profilesForProtocol(p,bank).length,names.length,`${c}: missing medicine-level knowledge`);}
for(const [name,id] of [['Trastuzumab emtansine','trastuzumab_emtansine'],['Trastuzumab emtansine IV','trastuzumab_emtansine'],['Trastuzumab','trastuzumab'],['Trastuzumab deruxtecan','trastuzumab_deruxtecan'],['Ribociclib','ribociclib'],['Abemaciclib','abemaciclib']])assert.equal(K.profilesForProtocol({metadata:{drugs:[name]}},bank)[0]?.id,id,name);
console.log('Medicine-level coverage and antibody/conjugate identity checks passed.');
