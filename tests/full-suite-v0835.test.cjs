const current21=new Set(require('../data/breast-completion-v08421-source-index.json').codes);
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p)),registry=require('../js/patient-asset-registry-v0810'),workflow=require('../js/regimen-workflow-engine-v0750'),relationship=require('../js/treatment-relationship-v0835');
for(const code of ['00225','00447','00448']){
 const d=json(`data/patient-knowledge/${code}.json`),p=json('protocols/gastrointestinal/'+fs.readdirSync(path.join(root,'protocols/gastrointestinal')).find(f=>f.startsWith(code))),log=code==='00225'?'logistics':'port-pump';
 assert.equal(d.suite_release,current21.has(d.code)?'0.84.21':('0.83.5'));assert.equal(d.cycle_days,14);assert.equal(d.anatomy.length,8);assert.equal(new Set(d.anatomy.map(r=>r[0])).size,8,'Body-map targets must be distinct');assert.equal(new Set(d.anatomy.map(r=>r.slice(4).join(','))).size,8,'Body-map pins must not overlap');assert(d.chapters.length>=6);assert(d.questions.length>=6);assert.equal(d.port_pump,code!=='00225');
 const sources=new Set(d.sources.map(s=>s.id));for(const a of d.agents)for(const id of a.source_ids)assert(sources.has(id));
 for(const name of ['index','knowledge','consent','consent-form','guide','passport','sactcard',log,'supportive-care']){
  const html=read(`patient/${code}/${name}.html`);assert(html.includes(code));assert.doesNotMatch(html,/Pembrolizumab|pemetrexed|carboplatin|KEYNOTE|blood pressure \/ kidneys|Keep BP and urine checks/i);
  for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)){const u=m[1];if(/^(https?:|data:|mailto:|tel:)/.test(u))continue;assert(fs.existsSync(path.resolve(root,'patient',code,u.split(/[?#]/)[0])),`${code}/${name}: ${u}`);}
  if(['index','knowledge'].includes(name)){assert(html.includes(require('../tools/cycle-chronology.cjs').render(d)));assert(!/<input|<select/.test(html));}
 }
 for(const name of ['guide','consent-form','passport','sactcard',log,'supportive-care']){const a=fs.readFileSync(path.join(root,`patient/${code}/${name}.pdf`));assert.equal(a.subarray(0,5).toString(),'%PDF-');assert.deepEqual(a,fs.readFileSync(path.join(root,`docs/patient/${code}/${name}.pdf`)));}
 assert.equal(registry.relativePath(p,'consent-draft'),`patient/${code}/consent-form.html`);assert.equal(registry.relativePath(p,'supportive-care'),`patient/${code}/supportive-care.pdf`);
 const manifest=workflow.buildManifest(p,json(workflow.dataUrl),{level:p.supportive_care.emetogenic_risk});assert(manifest.interactionOverrides.some(x=>x.id==='panitumumab_combination_review'));
 const kb=json('data/regimen-knowledge-base-v0835-addendum.json');assert(kb.regimen_profiles.some(x=>x.protocol_id===p.protocol_id&&x.administration&&x.supportive_care));assert(kb.evidence_records.some(x=>x.protocol_id===p.protocol_id));
}
for(const c of ['00586','00655']){const html=relationship.renderForCode(c);assert(html.includes('tr-grid'));assert(!/<input|<select/.test(html));assert(json('data/regimen-knowledge-base-v0835-addendum.json').regimen_profiles.some(p=>p.treatment_relationship_code===c));}
for(const name of ['index','knowledge','consent','treatment-timeline'])assert(read(`patient/00586/${name}.html`).includes(relationship.renderForCode('00586')));
assert(fs.existsSync(path.join(root,'assets/patient/durvalumab-00655-qr.png')));
assert(read('js/patient-support-v0750.js').includes('SACTCheckTreatmentRelationship?.renderForCode'));assert(read('js/regimen-knowledge-base.js').includes('v0835-addendum'));assert(read('index.html').includes('js/treatment-relationship-v0835.js'));
for(const f of ['tools/build-patient-knowledge.cjs','tools/build-complete-pathways.cjs','tools/build-panitumumab-support-v0835.cjs'])cp.execFileSync(process.execPath,[f,'--check'],{cwd:root,stdio:'pipe'});
(async()=>{const previousFetch=global.fetch;global.fetch=async url=>({ok:true,json:async()=>json(url)});try{const K=require('../js/regimen-knowledge-base'),payload=await K.load();for(const code of ['00225','00447','00448']){const p=json('protocols/gastrointestinal/'+fs.readdirSync(path.join(root,'protocols/gastrointestinal')).find(f=>f.startsWith(code)));assert(K.profilesForProtocol(p,payload).some(x=>x.id==='panitumumab'&&x.mechanism.includes('EGFR')));assert.equal(K.profilesForProtocol(p,payload).length,code==='00225'?1:4);}console.log('Panitumumab full-suite, loaded medicine knowledge and retrospective treatment-course contracts passed.');}finally{global.fetch=previousFetch;}})().catch(e=>{console.error(e);process.exitCode=1;});
