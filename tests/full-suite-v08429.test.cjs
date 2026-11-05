'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('crypto'),vm=require('vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const scope=json('validation/lung-cytotoxic-v08429/scope.json'),idx=json('data/lung-cytotoxic-v08429-source-index.json'),kb=json('data/regimen-knowledge-base-v08429-addendum.json'),author=json('data/lung-cytotoxic-v08429-authoring.json').regimens;
const Engine=require('../js/assessment-engine'),Registry=require('../js/patient-asset-registry-v0810'),Journey=require('../js/treatment-journey-v0837'),Dose=require('../js/protocol-dose-schedule'),Evidence=require('../js/treatment-evidence-v08413');
const entries=json('protocols/index.json').protocols,protocol=c=>json(entries.find(x=>x.path.includes('/'+c+'-')).path);
assert.equal(scope.new_codes.length,5);assert.equal(scope.retrospective_codes.length,5);assert.equal(idx.codes.length,10);assert.equal(kb.regimen_profiles.length,10);require('./helpers/net-suite-registration-v08437.cjs').registry(Registry.codes);assert(Registry.codes.includes('00244'),'Audited v34 regorafenib accounts for the added patient registry entry');
const routes=[];
for(const c of idx.codes){
 const p=protocol(c),x=author[c],k=kb.regimen_profiles.find(x=>x.protocol_id===p.protocol_id);
 assert.equal(p.metadata.full_suite_release,'0.84.29');assert.equal(p.metadata.source_checked_date,'2026-11-02');
 for(const flag of ['consultant_reviewed','oncology_pharmacy_reviewed','clinical_use_authorised'])assert.equal(p.metadata.validation[flag],false);
 assert.equal(Engine.assess(p,{}).complete,false);assert(!['proceed','proceed_with_caution'].includes(Engine.assess(p,{}).actionType));
 assert.equal(new Set(p.rule_engine.rules.map(x=>x.rule_id||x.id)).size,p.rule_engine.rules.length,c+' duplicate rule IDs');
 assert(Dose.buildModel(p).phases.length,c+' clinical dose/schedule missing');
 assert(k.treatment_rationale.line&&k.evidence_at_a_glance.sources.length);assert(!/undefined|\[object Object\]/.test(Evidence.render(k)));
 if(!x.preserve_canonical_patient_content&&!x.patient.patient_context_selector)routes.push(c);
 for(const slug of Object.keys(x.patient_contexts||{}))routes.push(c+'/'+slug);
}
assert.equal(routes.length,12);
// Selecting a route must select its actual reference dose; missing context cannot
// inherit the first alternative even when a toxicity rule is independently known.
{
 const p=protocol('00614'),missing=Dose.buildModificationModel(p,Engine.assess(p,{neuropathy_grade:3}));
 assert(missing.rows.length);for(const row of missing.rows){assert.equal(row.startingDose,'');assert.equal(row.quantified,false);assert.match(row.protocolDose,/Confirm the prescribed schedule/);}
 for(const [route,dose]of [['iv','25 mg/m²'],['oral','60 mg/m²']]){
  const m=Dose.buildModificationModel(p,Engine.assess(p,{neuropathy_grade:3,vinorelbine_route:route,treatment_day:'day8'}));
  const row=m.rows.find(x=>x.componentId==='vinorelbine');assert.equal(row.startingDose,dose);assert.equal(row.protocolDose,'Not to be administered');
 }
}

for(const route of routes){
 const d=json(route.includes('/')?`data/patient-knowledge-contexts/${route}.json`:`data/patient-knowledge/${route}.json`),s=d.patient_summary,html=read(`patient/${route}/index.html`),guide=read(`patient/${route}/guide.html`),card=read(`patient/${route}/sactcard.html`);
 assert.equal(s.template_version,'0.84.29');assert.equal(d.evidence.metrics.length,0);assert(Journey.definitions[route.replace('/',':')]);
 assert.equal((html.match(/data-patient-nav/g)||[]).length,5);assert.equal((html.match(/data-patient-panel/g)||[]).length,5);
 assert(html.indexOf('id="urgent"')<html.indexOf('data-patient-panel'));
 for(const id of ['my-treatment','between-treatments','my-tests','my-passport','my-resources','side-effects','monitoring-schedule'])assert(html.includes(`id="${id}"`),route+'/'+id);
 assert.equal((guide.match(/class="pt-page /g)||[]).length,3);assert(html.includes('class="pt-tabs"'));assert(guide.includes('hcc-static-connectors'));assert(guide.includes('oncowiki-qr.png'));
 for(const txt of ['FRONT / CONTACTS','BACK / TREATMENT RECORD','Do not cut the centre line','100%','qr.png','EXAMPLE NUMBERS','Add to Home Screen','not a personal record'])assert(card.includes(txt),route+'/'+txt);
 assert(!card.includes('Regimen QR added by'));
 assert.equal((card.match(/<span>C\d<\/span>/g)||[]).length,s.card_cycle_count||0);
 if(s.card_cycle_count===null)assert(card.includes('Rolling record'));
 for(const r of s.monitoring)assert(['Required by regimen','If clinically indicated','Team-agreed plan'].includes(r.basis));
 assert(!/<input[^>]+type="date"/.test(html));
 for(const file of fs.readdirSync(`${root}/patient/${route}`).filter(n=>n.endsWith('.html'))){
  const t=read(`patient/${route}/${file}`);assert(!/undefined|\[object Object\]/.test(t),route+'/'+file);
  for(const m of t.matchAll(/(?:src|href)="([^"#]+)"/g)){if(/^(https?:|data:|mailto:|tel:)/.test(m[1]))continue;assert(fs.existsSync(path.resolve(root,'patient',route,m[1].split(/[?#]/)[0])),route+'/'+file+': '+m[1]);}
 }
}
for(const c of ['00203','00232','00259']){
 assert.notEqual(json(`data/patient-knowledge/${c}.json`).suite_release,'0.84.29');
 assert.equal(Registry.relativePath(c,'guide','lung'),`patient/${c}/lung/guide.pdf`);
}
assert.equal(Registry.relativePath('00284','guide'),'patient/00284/scope.html?asset=guide');
assert.equal(Registry.relativePath('00388','guide'),'patient/00388/scope.html?asset=guide');
for(const slug of ['schedule_7d','schedule_3d','schedule_21d'])assert(read('patient/00388/scope.html').includes(slug+'/'));
assert(!fs.existsSync(root+'/patient/00388/guide.pdf'),'No all-schedules combined guide');
const base=json('validation/lung-cytotoxic-v08429/baseline-hashes.json');
const exclusions=json('validation/lung-completion-v08430/historical-baseline-exclusions.json').files,committed30=json('validation/lung-completion-v08430/baseline-hashes.json').files;
for(const [file,h]of Object.entries(base.files)){if(exclusions[file]){assert.equal(exclusions[file],h);assert(!Object.hasOwn(committed30,file));assert(fs.existsSync(path.join(root,path.dirname(file),'guide.pdf')));continue;}if(!/^(patient|docs\/patient|data\/patient-knowledge|data\/patient-knowledge-contexts)\//.test(file))continue;assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'),require('./helpers/retrospective-v08429.cjs').expectedHash(file,h),file);}
const ctx={fetch:async()=>({ok:true,json:async()=>json('data/emetogenic-risk-map.json')}),console};vm.runInNewContext(read('js/emetogenic-risk.js'),ctx);
(async()=>{
 await ctx.SACTCheckEmetogenicRisk.load('data/emetogenic-risk-map.json');const r=ctx.SACTCheckEmetogenicRisk,p=protocol('00614');
 for(const options of [{},{treatmentDay:'day8'},{treatmentRoute:'oral'},{treatmentDay:'day8',treatmentRoute:'unknown'},{treatmentPhase:'day8_iv'}])assert.equal(r.get(p,options).scriptId,null);
 for(const [day,route,level]of [['day1','iv','high'],['day1','oral','high'],['day8','iv','minimal'],['day8','oral','oral_moderate_high']]){const out=r.get(p,{treatmentDay:day,treatmentRoute:route});assert.equal(out.level,level);assert(out.scriptId);}
 console.log('v0.84.29: ten integrated source suites, twelve three-page patient routes, schedule-specific cards, day/route support and preservation checks pass.');
})().catch(e=>{console.error(e);process.exitCode=1});
