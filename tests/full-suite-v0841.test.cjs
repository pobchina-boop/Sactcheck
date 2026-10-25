'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),cp=require('child_process'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const index=json('data/advanced-breast-v0841-source-index.json'),codes=index.codes,R=require('../js/patient-asset-registry-v0810'),J=require('../js/treatment-journey-v0837'),B=require('../js/breast-library-v0837'),D=require('../js/protocol-dose-schedule');
const kb=json('data/regimen-knowledge-base-v0841-addendum.json'),support=json('data/phase-support-v0838.json').regimens;
assert.deepEqual(codes,['00228','00743','00230','00736','00205']);assert.equal(kb.regimen_profiles.length,5);assert.equal(kb.evidence_records.length,5);
const expected={'00228':[21,[1,8]],'00743':[28,[1,15]],'00230':[21,[1]],'00736':[28,[1,8,15]],'00205':[28,[1]]};
for(const code of codes){
 const d=json(`data/patient-knowledge/${code}.json`),p=json('protocols/breast/'+fs.readdirSync(path.join(root,'protocols/breast')).find(n=>n.startsWith(code)));
 const migrated=['00743','00230','00736'].includes(code);assert.equal(d.suite_release,migrated?'0.84.19':'0.84.1');assert.equal(d.cycle_display,'reference-chronology');assert.equal(p.metadata.sactcheck_encoding_version,migrated?'0.84.19':'0.84.1');assert.equal(d.protocol_version,String(p.metadata.nccp_version));
 assert.equal((migrated?json('data/breast-final-v08419-source-index.json'):index).regimens[code].rule_count,p.rule_engine.rules.length);assert.match(index.regimens[code].source_sha256,/^[a-f0-9]{64}$/);assert.equal(p.metadata.validation.clinical_use_authorised,false);
 assert(p.rule_engine.rules.every(r=>r.source?.url&&r.source.page));assert.equal(new Set(p.rule_engine.rules.map(r=>(r.rule_id||r.id))).size,p.rule_engine.rules.length);
 assert.equal(d.anatomy.length,4,'Sparse medicine-specific map');assert.equal(J.definitions[code].has_patient_dates,false);assert.equal(J.definitions[code].schedule_type,'relative-educational');assert.equal(d.phases.length,1);assert(!JSON.stringify(d).includes('Docetaxel'));
 assert.equal(d.cycle_days,expected[code][0]);assert.deepEqual(d.phase_cycles[0].timeline.filter(r=>r.style==='treatment').map(r=>r.start),expected[code][1]);
 for(const lane of J.definitions[code].lanes){assert.equal(lane.cells.length,J.definitions[code].stages.length);for(const id of lane.source_ids)assert(J.definitions[code].sources.some(s=>s.id===id));}
 for(const row of d.monitoring_schedule.rows)assert.equal(row.cells.length,d.monitoring_schedule.columns.length);
 for(const ch of d.chapters)for(const item of ch.items)for(const id of item.source_ids)assert(d.sources.some(s=>s.id===id),code+' unresolved source '+id);
 const pages=['index','knowledge','consent','consent-form','guide','passport','sactcard','logistics','supportive-care','treatment-journey','support-treatment'];
 for(const name of pages){const h=read(`patient/${code}/${name}.html`);assert(!/undefined|\[object Object\]/.test(h),code+'/'+name);for(const m of h.matchAll(/(?:src|href)="([^"#]+)"/g)){if(/^(https?:|data:|mailto:|tel:)/.test(m[1]))continue;assert(fs.existsSync(path.resolve(root,'patient',code,m[1].split(/[?#]/)[0])),code+'/'+name+': '+m[1]);}
  if(['index','knowledge','treatment-journey'].includes(name))assert(!/<input|<select/.test(h),'Orientation requires no dates / parameters');
  if(['index','knowledge'].includes(name)){assert(h.includes('wikiCycleChronology'));const ids=[...h.matchAll(/id="(wikiCycleChronology[^"]*)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);}
 }
 for(const name of ['guide','passport','consent-form','sactcard','logistics','supportive-care','treatment-journey','support-treatment'])assert.deepEqual(fs.readFileSync(path.join(root,`patient/${code}/${name}.pdf`)),fs.readFileSync(path.join(root,`docs/patient/${code}/${name}.pdf`)));
 assert(read(`docs/patient/${code}/guide.html`).includes(`../../../patient/${code}/guide.pdf`));
 assert.equal(R.relativePath(code,'supportive-care-selector'),`patient/${code}/supportive-care.html`);assert.equal(R.relativePath(code,'longitudinal'),`patient/${code}/treatment-journey.html`);assert(read('404.html').includes(code));
 const k=(migrated?json('data/regimen-knowledge-base-v08419-addendum.json'):kb).regimen_profiles.find(k=>k.protocol_id===d.protocol_id);assert(k);assert.deepEqual(k.monitoring_and_toxicity.longitudinal_schedule,d.monitoring_schedule);assert(kb.evidence_records.some(k=>k.protocol_id===d.protocol_id));assert(D.buildModel(p).phases.length>=1);
 assert(B.matchesReceptor(json('data/breast-library-contexts-v0837.json').regimens[code],'hrpos-her2neg'));assert.deepEqual(json('data/breast-library-contexts-v0837.json').regimens[code].settings,['advanced']);
 const sm=json('data/sustainability-regimen-metadata-v0691.json').profiles[p.protocol_id];assert.equal(sm.administration_frequency.value,d.schedule_summary);assert.equal(sm.ambulatory_pump.value,false);
 assert.equal(support[code].length,1);assert.equal(support[code][0].emetogenic_risk,'Low');assert(!JSON.stringify(support[code]).includes('Dexamethasone'));assert(!JSON.stringify(d).includes('Oncotype'));
 assert.equal(json('data/regimen-reuse-map-v0841.json').regimens.find(r=>r.code===code).category,'authored_suite');
}
const p230=json('data/patient-knowledge/00230.json');assert(/two cycles/.test(p230.schedule_summary));assert(/two cycles|2 cycles/i.test(JSON.stringify(p230.monitoring_schedule)));
const p736=json('data/patient-knowledge/00736.json');assert(p736.timeline.some(r=>r.id==='break'&&r.start===22));assert(JSON.stringify(p736.monitoring_schedule).includes('Day 8'));assert(/off-label/.test(p736.schedule_summary));
const p205=json('data/patient-knowledge/00205.json');assert(JSON.stringify(p205.monitoring_schedule).includes('450 mg/m²'));assert(JSON.stringify(p205.monitoring_schedule).includes('Baseline echo'));assert(!/every (3 months|12 weeks)/.test(JSON.stringify(p205.monitoring_schedule)));
for(const c of ['00228','00743'])assert(JSON.stringify(json(`data/patient-knowledge/${c}.json`).monitoring_schedule).includes('before every dose'));
const protectedFiles=json('validation/advanced-breast-v0841/protected-patient-baseline.json');for(const [p,h] of Object.entries(protectedFiles))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex'),require('./helpers/contact-migration-v0844.cjs').expectedHash(p,h),'Prior patient asset changed outside the approved contact migration: '+p);
for(const f of ['tools/build-breast-journeys.cjs','tools/build-patient-knowledge.cjs','tools/build-complete-pathways.cjs','tools/build-phase-support-v0838.cjs'])cp.execFileSync(process.execPath,[f,'--check'],{cwd:root,stdio:'pipe'});
console.log('Five suites: exact schedules, monitoring, consent, KB, support, source links, QR routes, PDF copies, deterministic builds and '+Object.keys(protectedFiles).length+' protected patient files passed.');
