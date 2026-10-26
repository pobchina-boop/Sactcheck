const current21=new Set(require('../data/breast-completion-v08421-source-index.json').codes);
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),json=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8')),registry=require('../js/patient-asset-registry-v0810'),workflow=require('../js/regimen-workflow-engine-v0750');
for(const c of ['00216','00586','00623']){
 const d=json(`data/patient-knowledge/${c}.json`),protocol=json('protocols/gastrointestinal/'+fs.readdirSync(path.join(root,'protocols/gastrointestinal')).find(f=>f.startsWith(c)));
 assert.equal(d.suite_release,current21.has(d.code)?'0.84.21':('0.83.4'));assert.equal(d.anatomy.length,8);assert((d.logistics.steps||d.logistics.sections).length>=3);assert(d.chapters.length>=6);assert(d.questions.length>=6);
 const sources=new Set(d.sources.map(x=>x.id));for(const agent of d.agents)for(const id of agent.source_ids)assert(sources.has(id));for(const chapter of d.chapters)for(const item of chapter.items)for(const id of item.source_ids)assert(sources.has(id));
 for(const f of ['index','knowledge','consent','consent-form','guide','passport','sactcard','logistics','supportive-care']){
  const html=fs.readFileSync(path.join(root,`patient/${c}/${f}.html`),'utf8');assert(html.includes(c));assert.doesNotMatch(html,/Pembrolizumab|pemetrexed|carboplatin|KEYNOTE|oxaliplatin infusion|46-hour pump|Induction and maintenance/i);
  for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)){const u=m[1];if(/^(https?:|data:|mailto:|tel:)/.test(u))continue;assert(fs.existsSync(path.resolve(root,'patient',c,u.split(/[?#]/)[0])),`${c}/${f}: missing ${u}`);}
  if(['index','knowledge'].includes(f)){assert(html.includes(require('../tools/cycle-chronology.cjs').render(d)));assert(!/<input|<select/.test(html));assert(html.includes('data-treatment-logistics'));}
 }
 for(const f of ['guide','consent-form','passport','sactcard','logistics','supportive-care']){const b=fs.readFileSync(path.join(root,`patient/${c}/${f}.pdf`));assert.equal(b.subarray(0,5).toString(),'%PDF-');assert.deepEqual(b,fs.readFileSync(path.join(root,`docs/patient/${c}/${f}.pdf`)));}
 assert.equal(registry.relativePath(protocol,'supportive-care'),`patient/${c}/supportive-care.pdf`);assert.equal(registry.relativePath(protocol,'consent-draft'),`patient/${c}/consent-form.html`);
 const m=workflow.buildManifest(protocol,json(workflow.dataUrl),{level:protocol.supportive_care.emetogenic_risk});assert.equal(m.supportiveCare.status,'source_only');assert(m.interactionOverrides.some(x=>x.id==='capecitabine_medication_review'&&x.source.url.includes('medicines.org.uk')));assert(!m.extravasation.agents.some(a=>a.key==='capecitabine'));
 if(c==='00586'){assert.equal(d.cycle_days,7);assert.equal(d.timeline.find(t=>t.id==='tablets').end,5);assert(d.agents.some(a=>a.id==='radiotherapy'));assert(!protocol.treatment_phases.some(p=>(p.active_drugs||[]).includes('radiotherapy')));}
 if(c==='00623'){assert.equal(d.evidence.metrics.length,0);const html=fs.readFileSync(path.join(root,`patient/${c}/knowledge.html`),'utf8');assert(!/75.83333333333333%|9.1 months/.test(html));assert(JSON.stringify(json('data/regimen-knowledge-base-v08421-addendum.json')).includes('AVEX'));}
 const kb=json('data/regimen-knowledge-base-v0834-addendum.json');assert(kb.regimen_profiles.some(x=>x.protocol_id===d.protocol_id));assert(kb.evidence_records.some(x=>x.protocol_id===d.protocol_id));
}
for(const f of ['tools/build-patient-knowledge.cjs','tools/build-complete-pathways.cjs','tools/build-capecitabine-support-v0834.cjs'])cp.execFileSync(process.execPath,[f,'--check'],{cwd:root,stdio:'inherit'});
console.log('Three capecitabine full-suite contracts passed.');
