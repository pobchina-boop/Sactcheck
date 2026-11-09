'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),vm=require('vm');
const R=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(R,f),'utf8'),json=f=>JSON.parse(read(f)),sha=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(R,f))).digest('hex');
const base=json('validation/patient-rollout-v08431/baseline-hashes.json').files,scope=json('validation/patient-rollout-v08431/scope.json');assert.equal(scope.codes.length,10);
const visual=require('../tools/patient-visual-standard-v08443.cjs'),presentationMigration=require('./helpers/retrospective-v08443.cjs'),presentationBaseline=json('validation/patient-design-v08443/migration-baseline.json').files;
for(const c of scope.codes){
 const d=json('data/patient-knowledge/'+c+'.json'),p=read('patient/'+c+'/index.html'),g=read('patient/'+c+'/guide.html'),w=read('patient/'+c+'/knowledge.html');
 assert.equal(d.patient_summary.template_version,c==='00216'?'0.84.36':'0.84.31');require('./helpers/patient-overview-v08445.cjs').validate(p,c);assert(p.includes('Read the full OncoWiki'));
 assert.equal((g.match(/class="pt-page /g)||[]).length,3);assert(g.includes('Full-body anatomical illustration'));assert(g.includes('hcc-static-connectors'));
 assert.equal((g.match(/data-hcc-target=/g)||[]).length,d.anatomy.length);assert(g.includes('oncowiki-qr.png'));assert(!g.includes('viewBox="0 0 180 260"'));assert(!/typical null-day|undefined|\[object Object\]/.test(g));
 assert(w.includes('oncowiki-progressive-v08431.js'));
 if(c==='00216'){
  // Capecitabine's source-audited v36 reference replaces the v31 text; verify the exact reviewed transition from immutable v35 Git bytes.
  const file='patient/00216/knowledge.html',migration=require('./helpers/retrospective-v08436.cjs');
  const before=crypto.createHash('sha256').update(require('node:child_process').execFileSync('git',['show',migration.BASE_COMMIT+':'+file],{cwd:R})).digest('hex');
  assert.equal(sha(file),migration.expectedHash(file,before),'Reviewed capecitabine reference migration');
 }else if(!['00250','00485'].includes(c)){const file='patient/'+c+'/knowledge.html';assert.equal(sha(file),presentationMigration.expectedHash(file,presentationBaseline[file].sha256),'Exact reviewed presentation before historical reconstruction '+c);const pinned= require('node:child_process').execFileSync('git',['show',presentationMigration.BASE_COMMIT+':'+file],{cwd:R,encoding:'utf8',maxBuffer:16*1024*1024});let original=visual.stripStandard(pinned).replace(require('../tools/patient-pack-v08432.cjs').identity(d),'').replace(require('../tools/patient-pack-v08432.cjs').personalPlan(),'').replace('<link rel="stylesheet" href="../../assets/patient/patient-identity-v08432.css">','').replace('<link rel="stylesheet" href="../../assets/patient/oncowiki-progressive-v08431.css">','').replace('<script src="../../assets/patient/oncowiki-progressive-v08431.js"></script>','');const sort=x=>Array.isArray(x)?x.map(sort):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,sort(x[k])])):x;original=original.replace(/(<script type="application\/json" id="pk-data">)([\s\S]*?)(<\/script>)/,(_,a,b,c)=>a+JSON.stringify(sort(JSON.parse(b)))+c);assert.equal(crypto.createHash('sha256').update(original).digest('hex'),json('validation/patient-rollout-v08431/original-wiki-content.json')[c],'Full OncoWiki changed '+c);}
 for(const name of ['consent-form.html','consent-form.pdf','passport.html','passport.pdf','qr.png']){const f='patient/'+c+'/'+name;assert.equal(sha(f),require('./helpers/retrospective-v08432.cjs').expectedHash(f,base[f]),'Preserved original asset '+f);}
}
for(const [f,h]of Object.entries(base))if(f.startsWith('protocols/'))assert.equal(sha(f),require('./helpers/retrospective-v08432.cjs').expectedHash(f,h),'Clinical rules changed '+f);
const ctx={};vm.runInNewContext(read('js/patient-anatomy-data-v08431.js'),ctx);
for(const [c,d]of Object.entries(ctx.SACTCheckAnatomyData))assert.deepEqual(JSON.parse(JSON.stringify(d.anatomy)),json('data/patient-knowledge/'+c+'.json').anatomy,'Anatomical detail changed '+c);
assert(read('js/patient-support-v0750.js').includes('protocolCode(protocol)!=="00831"'),'Preserve bespoke HCC visual');
assert.equal(json('data/patient-knowledge/00722.json').patient_summary.card_cycle_count,6);
assert.equal(json('data/patient-knowledge/00655.json').patient_summary.card_cycle_count,null);
assert(json('data/patient-knowledge/00485.json').patient_summary.cycle_blocks.length>1);
assert(json('data/patient-knowledge/00353.json').patient_summary.cycle_blocks.length>0);
console.log('v0.84.31: ten progressive patient packs, full anatomical content, preserved OncoWiki/consent/passports and unchanged clinical protocols verified.');
