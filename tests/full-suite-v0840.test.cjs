'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),cp=require('child_process');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const index=json('data/breast-family-v0840-source-index.json'),codes=index.codes,R=require('../js/patient-asset-registry-v0810'),J=require('../js/treatment-journey-v0837'),B=require('../js/breast-library-v0837'),D=require('../js/protocol-dose-schedule');
const kb=json('data/regimen-knowledge-base-v0840-addendum.json'),support=json('data/phase-support-v0838.json').regimens;
assert.equal(codes.length,16);assert.equal(kb.regimen_profiles.length,16);assert.equal(kb.evidence_records.length,16);
for(const code of codes){
 const d=json(`data/patient-knowledge/${code}.json`),p=json('protocols/breast/'+fs.readdirSync(path.join(root,'protocols/breast')).find(n=>n.startsWith(code)));
 assert.equal(d.suite_release,'0.84.0');assert.equal(d.cycle_display,'reference-chronology');assert.equal(p.metadata.sactcheck_encoding_version,'0.84.0');assert.equal(d.protocol_version,String(p.metadata.nccp_version));
 assert.equal(index.regimens[code].rule_count,p.rule_engine.rules.length);assert.match(index.regimens[code].source_sha256,/^[a-f0-9]{64}$/);assert.equal(p.metadata.validation.clinical_use_authorised,false);
 assert(p.rule_engine.rules.every(r=>r.source?.url&&r.source.page));assert.equal(new Set(p.rule_engine.rules.map(r=>r.rule_id)).size,p.rule_engine.rules.length);
 assert(d.anatomy.length>=3&&d.anatomy.length<=8);assert.equal(J.definitions[code].has_patient_dates,false);assert.equal(J.definitions[code].schedule_type,'relative-educational');
 for(const lane of J.definitions[code].lanes){assert.equal(lane.cells.length,J.definitions[code].stages.length);for(const id of lane.source_ids)assert(J.definitions[code].sources.some(s=>s.id===id));}
 for(const row of d.monitoring_schedule.rows)assert.equal(row.cells.length,d.monitoring_schedule.columns.length);
 const pages=['index','knowledge','consent','consent-form','guide','passport','sactcard','logistics','supportive-care','treatment-journey',...support[code].map(p=>'support-'+p.id)];
 for(const name of pages){const h=read(`patient/${code}/${name}.html`);assert(!/undefined|\[object Object\]/.test(h),code+'/'+name);for(const m of h.matchAll(/(?:src|href)="([^"#]+)"/g)){if(/^(https?:|data:|mailto:|tel:)/.test(m[1]))continue;assert(fs.existsSync(path.resolve(root,'patient',code,m[1].split(/[?#]/)[0])),code+'/'+name+': '+m[1]);}
  if(['index','knowledge','treatment-journey'].includes(name))assert(!/<input|<select/.test(h),'Orientation must not require dates / personal parameters');
  if(['index','knowledge'].includes(name)){assert(h.includes('wikiCycleChronology'));const ids=[...h.matchAll(/id="(wikiCycleChronology[^"]*)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);}
 }
 for(const name of ['guide','passport','consent-form','sactcard','logistics','supportive-care','treatment-journey',...support[code].map(p=>'support-'+p.id)])assert.deepEqual(fs.readFileSync(path.join(root,`patient/${code}/${name}.pdf`)),fs.readFileSync(path.join(root,`docs/patient/${code}/${name}.pdf`)));
 assert(read(`docs/patient/${code}/guide.html`).includes(`../../../patient/${code}/guide.pdf`));
 assert.equal(R.relativePath(code,'supportive-care-selector'),`patient/${code}/supportive-care.html`);assert.equal(R.relativePath(code,'longitudinal'),`patient/${code}/treatment-journey.html`);assert(read('404.html').includes(code));
 assert(kb.regimen_profiles.some(k=>k.protocol_id===d.protocol_id));assert(kb.evidence_records.some(k=>k.protocol_id===d.protocol_id));assert(D.buildModel(p).phases.length>=1);
 const sm=json('data/sustainability-regimen-metadata-v0691.json').profiles[p.protocol_id];assert.equal(sm.administration_frequency.value,d.schedule_summary);assert.equal(sm.ambulatory_pump.value,false);
 for(const phase of support[code])if(phase.id==='continuation'){assert.equal(phase.medicines.length,0);assert.equal(phase.emetogenic_risk,'Minimal');}
}
const contexts=json('data/breast-library-contexts-v0837.json').regimens;
for(const c of ['00260','00278','00316','00432','00433','00745']){assert(contexts[c].settings.includes('neoadjuvant'));assert(contexts[c].settings.includes('adjuvant'));}
for(const c of ['00252','00250'])assert(B.matchesReceptor(contexts[c],'hrpos-her2neg'));
assert(!contexts['00731'].settings.includes('adjuvant'));assert(contexts['00731'].settings.includes('neoadjuvant'));
const p621=json('data/patient-knowledge/00621.json');assert(p621.phase_cycles[0].timeline.some(r=>r.id==='planned-break'&&r.start===22));assert(!p621.phase_cycles[0].timeline.some(r=>r.style==='treatment'&&r.start===22));
const p316=json('data/patient-knowledge/00316.json');assert(p316.phase_cycles[1].timeline.some(r=>r.id==='her28'&&r.start===8));assert(!p316.phase_cycles[1].timeline.some(r=>r.id==='chemo8'));
for(const c of ['00745','00507']){const d=json(`data/patient-knowledge/${c}.json`),cy=d.phase_cycles.find(c=>c.timeline.some(r=>r.id==='chemo15'));assert.equal(cy.cycle_days,21);assert(cy.timeline.some(r=>r.id==='her21'));assert(!cy.timeline.some(r=>r.id==='her28'));}
for(const c of ['00203','00621']){const d=json(`data/patient-knowledge/${c}.json`);assert(!d.chapters.some(ch=>JSON.stringify(ch).includes('Oncotype')));assert(d.context_label.includes('Source-defined'));}
const reuse=json('data/regimen-reuse-map-v0840.json');for(const c of codes)assert.equal(reuse.regimens.find(r=>r.code===c).category,'authored_suite');for(const c of ['00278','00316','00433']){const row=reuse.regimens.find(r=>r.code===c);assert(row.components.some(x=>/doxorubicin/i.test(x)));assert(row.components.some(x=>/cyclophosphamide/i.test(x)));}
for(const f of ['tools/build-breast-journeys.cjs','tools/build-patient-knowledge.cjs','tools/build-complete-pathways.cjs','tools/build-phase-support-v0838.cjs'])cp.execFileSync(process.execPath,[f,'--check'],{cwd:root,stdio:'pipe'});
console.log('Sixteen suites: source identities, clinical/patient routes, phase graphs, monitoring, support, PDFs and reuse safeguards passed.');
