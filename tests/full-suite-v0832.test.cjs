'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const registry=require('../js/patient-asset-registry-v0810'),workflow=require('../js/regimen-workflow-engine-v0750'),engine=require('../js/assessment-engine');
const kb=json('data/regimen-knowledge-base-v0832-addendum.json'),baseKb=json('data/regimen-knowledge-base-v0680.json'),index=json('protocols/index.json');
const workflowData=json(workflow.dataUrl),supportivePdf=require('../js/supportive-care-pdf-v0750');
for(const code of ['00227','00449','00446']){
 const d=json(`data/patient-knowledge/${code}.json`),entry=index.protocols.find(p=>p.id===d.protocol_id||p.protocol_id===d.protocol_id),protocol=json(entry.path);
 const kp=kb.regimen_profiles.find(p=>p.protocol_id===d.protocol_id);
 const manifest=workflow.buildManifest(protocol,workflowData,{level:code==='00226'?'low':'moderate'});
 assert.equal(manifest.supportiveCare.status,'available');
 assert.equal(manifest.supportiveCare.planId,code==='00226'?'low':'moderate');
 assert(Buffer.from(supportivePdf.buildPdf({manifest})).subarray(0,5).toString()==='%PDF-');
 assert(manifest.extravasation.agents.some(a=>a.key===(code==='00446'?'oxaliplatin':'irinotecan')));
 if(code==='00209')assert.equal(manifest.extravasation.agents.filter(a=>a.key==='fluorouracil').length,1,'Both encoded 5FU administrations must resolve to one fluorouracil guidance row');
 if(code==='00321')assert(!manifest.extravasation.agents.some(a=>a.key==='capecitabine'),'Oral medicine must not receive infusion guidance');
 for(const key of ['patient_selection','supportive_care','monitoring_and_toxicity','administration','evidence_audit'])assert(kp[key],`${code} clinical ${key}`);
 assert([...kb.evidence_records,...baseKb.evidence_records].some(e=>e.protocol_id===d.protocol_id),`${code} evidence missing`);
 assert(kp.reference_links.some(x=>x.url===`patient/${code}/knowledge.html`));
 for(const [asset,file] of [['knowledge','knowledge.html'],['consent-draft','consent-form.html'],['guide','guide.pdf'],['passport','passport.pdf'],['sact-card','sactcard.pdf']])assert.equal(registry.relativePath(protocol,asset),`patient/${code}/${file}`);
 let opened;global.location={href:'https://test.example/subpath/index.html'};global.open=u=>{opened=u;return {}};workflow.openConsentSupport(protocol);assert.equal(opened,`https://test.example/subpath/patient/${code}/consent-form.html`);
 for(const file of ['index.html','knowledge.html','consent.html','consent-form.html','guide.html','passport.html','sactcard.html','port-pump.html']){
  const html=read(`patient/${code}/${file}`);assert(html.includes(code));
  assert.doesNotMatch(html,/Pembrolizumab|pemetrexed|carboplatin|KEYNOTE|immune effects|folic acid.*B12/i,`${code}/${file} inherited lung content`);
  for(const match of html.matchAll(/(?:href|src)="([^"#]+)"/g)){
   const url=match[1];if(/^(https?:|data:|mailto:|tel:)/.test(url))continue;
   const p=path.resolve(root,'patient',code,url.split(/[?#]/)[0]);assert(fs.existsSync(p),`broken local link ${code}/${file}: ${url}`);
  }
 }
 for(const file of ['guide.pdf','consent-form.pdf','passport.pdf','sactcard.pdf','port-pump.pdf']){const b=fs.readFileSync(path.join(root,'patient',code,file));assert.equal(b.subarray(0,5).toString(),'%PDF-');assert(b.length>5000);assert.deepEqual(b,fs.readFileSync(path.join(root,'docs/patient',code,file)));}
 const defs=protocol.input_definitions;const anc=Object.keys(defs).find(k=>/anc.*x10|^anc$/i.test(k));assert(anc,`${code}: ANC input`);const result=engine.assess(protocol,{[anc]:0.3});assert.equal(result.complete,false,`${code}: missing domains must stay unassessed`);assert(result.findings.length>0,`${code}: ANC-only should yield a finding`);
 for(const f of ['index.html','knowledge.html']){const h=read(`patient/${code}/${f}`);assert(h.includes('data-port-pump'));assert(!/<input|<select/.test(h));assert(h.includes(require('../tools/cycle-chronology.cjs').render(d)));}
 assert.equal(d.anatomy.length,8);assert.equal(d.timeline.find(x=>x.id==='pump').end,3);
 if(code==='00446'){assert.doesNotMatch(read(`patient/${code}/index.html`),/Irinotecan|MOSAIC|adjuvant colon/i);assert(read(`patient/${code}/knowledge.html`).includes('9.4 months'));}
 else assert.doesNotMatch(read(`patient/${code}/index.html`),/Oxaliplatin|Cold sensitivity|MOSAIC/i);
 assert(d.chapters.length>=6&&d.questions.length>=6);assert(d.agents.every(a=>a.risks.length&&a.symptoms.length));
 const ids=new Set(d.sources.map(x=>x.id));for(const a of d.agents)for(const id of a.source_ids)assert(ids.has(id));for(const id of d.evidence.source_ids)assert(ids.has(id));
 for(const m of d.evidence.metrics)for(const key of ['combination','comparison'])assert(m[key]>=0&&m[key]<=100);
 console.log(`${code}: clinical profile, evidence, consent, assessment, patient resources and local links passed`);
}
cp.execFileSync(process.execPath,['tools/build-complete-pathways.cjs','--check'],{cwd:root,stdio:'inherit'});
console.log('Colorectal full-suite contract passed.');
