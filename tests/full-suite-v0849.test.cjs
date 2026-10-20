'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),vm=require('node:vm'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const codes=['00414','00322','00776','00794','00588'],idx=json('data/targeted-breast-v0849-source-index.json'),kb=json('data/regimen-knowledge-base-v0849-addendum.json'),R=require('../js/patient-asset-registry-v0810'),J=require('../js/treatment-journey-v0837'),B=require('../js/breast-library-v0837');
assert.deepEqual(idx.codes,codes);assert.equal(kb.regimen_profiles.length,5);assert(kb.drug_profiles.length>=5);assert(kb.evidence_records.length>=9);
let rules=0;
for(const code of codes){
 const d=json(`data/patient-knowledge/${code}.json`),dir=code==='00588'?'shared':'breast',pf=fs.readdirSync(path.join(root,'protocols',dir)).find(n=>n.startsWith(code+'-')),p=json('protocols/'+dir+'/'+pf);
 assert.equal(d.suite_release,'0.84.9');assert.equal(d.protocol_version,String(p.metadata.nccp_version));assert.equal(p.metadata.validation.clinical_use_authorised,false);assert.equal(idx.regimens[code].rule_count,p.rule_engine.rules.length);rules+=p.rule_engine.rules.length;
 assert(p.rule_engine.rules.every(r=>r.source?.url&&r.source.page));assert.equal(d.service_kind,'targeted');assert(d.anatomy.length>=4&&d.anatomy.length<=6);
 for(const ch of d.chapters)for(const item of ch.items)for(const id of item.source_ids)assert(d.sources.some(s=>s.id===id),`${code}: source ${id}`);
 const j=J.definitions[code];assert.equal(j.has_patient_dates,false);assert.equal(j.schedule_type,'relative-educational');
 for(const lane of j.lanes){assert.equal(lane.cells.length,j.stages.length);for(const id of lane.source_ids)assert(j.sources.some(s=>s.id===id));}
 for(const row of d.monitoring_schedule.rows)assert.equal(row.cells.length,d.monitoring_schedule.columns.length);
 const phases=json('data/phase-support-v0838.json').regimens[code];
 for(const name of ['index','knowledge','consent','consent-form','guide','passport','sactcard','logistics','supportive-care','supportive-care-overview','treatment-journey',...phases.map(p=>'support-'+p.id)]){
  const h=read(`patient/${code}/${name}.html`);assert(!/undefined|\[object Object\]/.test(h),code+'/'+name);
  for(const m of h.matchAll(/(?:src|href)="([^"#]+)"/g)){if(/^(https?:|data:|mailto:|tel:)/.test(m[1]))continue;assert(fs.existsSync(path.resolve(root,'patient',code,m[1].split(/[?#]/)[0])),`${code}/${name}: ${m[1]}`);}
  if(['index','knowledge','treatment-journey'].includes(name))assert(!/<input|<select|<textarea/.test(h),'Patient orientation requires no entry');
  if(['index','knowledge'].includes(name)){assert(h.includes('wikiCycleChronology'));assert(!h.includes('type="date"'));assert(!h.includes('pk-day-detail'));}
  if(code==='00588')assert(h.includes('Breast adjuvant treatment only'),`Shared-indication scope absent ${name}`);
 }
 for(const name of ['guide','passport','consent-form','sactcard','logistics','supportive-care','treatment-journey',...phases.map(p=>'support-'+p.id)])assert.deepEqual(fs.readFileSync(path.join(root,`patient/${code}/${name}.pdf`)),fs.readFileSync(path.join(root,`docs/patient/${code}/${name}.pdf`)));
 assert(read('404.html').includes(code));assert(kb.regimen_profiles.find(k=>k.protocol_id===p.protocol_id));
 if(code!=='00588'){assert.equal(R.relativePath(code,'knowledge'),`patient/${code}/knowledge.html`);assert.equal(R.relativePath(code,'longitudinal'),`patient/${code}/treatment-journey.html`);}
 assert(B.regimens[code]);
 for(const receptor of B.regimens[code].receptors){assert(['her2pos','hrpos-her2pos','hrpos-her2neg','tnbc','her2neg','any','unspecified'].includes(receptor),`${code}: invalid receptor token ${receptor}`);assert(B.matchesReceptor(B.regimens[code],receptor));}
}
// All shared olaparib service entry points require a scope choice, independent of tissue filter.
for(const asset of ['portal','guide','passport','knowledge','sact-card','consent-draft','supportive-care','supportive-care-selector','longitudinal']){
 assert.equal(R.relativePath('00588',asset),`patient/00588/scope.html?asset=${encodeURIComponent(asset)}`);
 assert(R.compatibilityUrl('00588',asset).includes('scope.html'));
}
assert(B.matchesReceptor(B.regimens['00776'],'hrpos-her2neg'));
assert.deepEqual(B.regimens['00588'].settings,['adjuvant']);assert.deepEqual(B.regimens['00794'].receptors,['tnbc']);assert(!B.regimens['00414'].settings.includes('adjuvant'));
const targets=['guide','knowledge','../../evil','https://example.org'],expected=['guide.pdf','knowledge.html','./','./'];targets.forEach((asset,i)=>{const link={href:''};vm.runInNewContext(read('assets/patient/indication-scope-v0849.js'),{window:{location:{search:'?asset='+encodeURIComponent(asset)}},document:{getElementById:()=>link},URLSearchParams});assert.equal(link.href,expected[i]);});
const pal=json('data/patient-knowledge/00414.json');assert.equal(pal.cycle_days,28);assert(pal.timeline.some(r=>r.start===1&&r.end===21));assert(JSON.stringify(pal.monitoring_schedule).includes('15'));
const enh=json('data/patient-knowledge/00776.json');assert(/12.week|12 week/.test(JSON.stringify(enh.monitoring_schedule)));assert(/cycle.{0,10}5/i.test(JSON.stringify(enh)));assert.equal(enh.cycle_days,21);
const sac=json('data/patient-knowledge/00794.json');assert(sac.timeline.some(r=>r.start===8));assert.deepEqual(json('data/phase-support-v0838.json').regimens['00794'].map(p=>p.id),['day1','day8']);
for(const code of ['00322','00588']){const d=json(`data/patient-knowledge/${code}.json`);assert.equal(d.cycle_days,null);assert.equal(d.schedule_kind,'continuous_oral');}
const support=json('data/phase-support-v0838.json').regimens;assert(!support['00776'][0].medicines.some(m=>m.name==='Olanzapine'));assert(support['00794'].every(p=>p.medicines.some(m=>m.name==='Olanzapine')));assert(support['00588'][0].medicines.length===0);assert(JSON.stringify(support['00588']).includes('CYP3A'));
// Old patient documents are byte-preserved, including the accepted gold-standard reference.
const baseline=json('validation/targeted-breast-v0849/protected-patient-baseline.json').files;
for(const [p,h] of Object.entries(baseline))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex'),h,'Unexpected prior-patient change '+p);
for(const f of ['tools/build-breast-journeys.cjs','tools/build-patient-knowledge.cjs','tools/build-complete-pathways.cjs','tools/build-phase-support-v0838.cjs'])cp.execFileSync(process.execPath,[f,'--check'],{cwd:root,stdio:'pipe'});
console.log(`Targeted breast full suite: ${rules} source-linked rules, five complete suites, indication routing, relative timelines, day-specific support and ${Object.keys(baseline).length} preserved patient files passed.`);
// Exercise the actual knowledge-base loader and renderer, including every addendum.
(async()=>{
 const target={innerHTML:''},classes={add(){},remove(){},toggle(){}},overlay={classList:classes,querySelector:s=>s==='[data-regimen-info-content]'?target:null};
 const context={console,fetch:async url=>({ok:fs.existsSync(path.join(root,url)),json:async()=>json(url)}),document:{readyState:'loading',addEventListener(){},getElementById:id=>id==='regimenInformationOverlay'?overlay:null,body:{classList:classes}}};
 vm.createContext(context);vm.runInContext(read('js/regimen-knowledge-base.js'),context);
 const api=context.SACTCheckRegimenKnowledgeBase;await api.load();
 for(const code of codes){
  const directory=code==='00588'?'shared':'breast',file=fs.readdirSync(path.join(root,'protocols',directory)).find(n=>n.startsWith(code+'-')),protocol=json(`protocols/${directory}/${file}`);
  assert(api.open(protocol));await new Promise(resolve=>setImmediate(resolve));
  assert(target.innerHTML.includes('Longitudinal monitoring schedule'),`${code}: clinician monitoring table was not rendered`);
  assert(!/undefined|\[object Object\]|could not be loaded/.test(target.innerHTML),`${code}: clinician rendering error`);
  const profile=api.regimenProfileForProtocol(protocol);assert.equal(profile.protocol_id,protocol.protocol_id);
  assert.equal((target.innerHTML.match(/scope="row"/g)||[]).length,profile.monitoring_and_toxicity.longitudinal_schedule.rows.length);
  if(code==='00588')assert(/adjuvant|00588h/i.test(target.innerHTML));
 }
 console.log('Five clinician knowledge-base panels loaded and rendered with source-specific longitudinal tables.');
})().catch(error=>{console.error(error);process.exitCode=1;});
