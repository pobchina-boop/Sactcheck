'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const scope=json('validation/lung-completion-v08430/scope.json'),idx=json('data/lung-completion-v08430-source-index.json'),kb=json('data/regimen-knowledge-base-v08430-addendum.json'),author=json('data/lung-completion-v08430-authoring.json').regimens;
const Engine=require('../js/assessment-engine'),Registry=require('../js/patient-asset-registry-v0810'),Journey=require('../js/treatment-journey-v0837'),Dose=require('../js/protocol-dose-schedule'),Evidence=require('../js/treatment-evidence-v08413');
const entries=json('protocols/index.json').protocols,protocol=c=>json(entries.find(x=>x.path.includes('/'+c+'-')).path);
assert.deepEqual([...scope.new_codes].sort(),['00214','00279','00309','00372','00456','00561']);
assert.equal(idx.codes.length,6);assert.equal(kb.regimen_profiles.length,6);assert.equal(Registry.codes.length,165);
const routes=[];
for(const c of idx.codes){
 const p=protocol(c),x=author[c],k=kb.regimen_profiles.find(x=>x.protocol_id===p.protocol_id);
 assert.equal(p.metadata.full_suite_release,'0.84.30');assert.equal(p.metadata.source_checked_date,'2026-11-02');
 for(const flag of ['consultant_reviewed','oncology_pharmacy_reviewed','clinical_use_authorised'])assert.equal(p.metadata.validation[flag],false);
 assert.equal(Engine.assess(p,{}).complete,false);assert(!['proceed','proceed_with_caution'].includes(Engine.assess(p,{}).actionType));
 assert.equal(new Set(p.rule_engine.rules.map(x=>x.rule_id||x.id)).size,p.rule_engine.rules.length,c+' duplicate rules');
 assert(Dose.buildModel(p).phases.length,c+' clinical reference missing');
 assert(k.treatment_rationale.line&&k.evidence_at_a_glance.sources.length);assert(!/undefined|\[object Object\]/.test(Evidence.render(k)));
 if(!x.patient.patient_context_selector)routes.push(c);
 for(const slug of Object.keys(x.patient_contexts||{}))routes.push(c+'/'+slug);
 assert.match(p.metadata.source_pdf_sha256,/^[0-9a-f]{64}$/);
}
for(const route of routes){
 const d=json(route.includes('/')?`data/patient-knowledge-contexts/${route}.json`:`data/patient-knowledge/${route}.json`),s=d.patient_summary,html=read(`patient/${route}/index.html`),guide=read(`patient/${route}/guide.html`),card=read(`patient/${route}/sactcard.html`);
 assert.equal(s.template_version,'0.84.30');assert.equal(d.evidence.metrics.length,0);assert(Journey.definitions[route.replace('/',':')]);
 assert.equal((html.match(/data-patient-nav/g)||[]).length,5);assert.equal((html.match(/data-patient-panel/g)||[]).length,5);
 assert(html.indexOf('id="urgent"')<html.indexOf('data-patient-panel'));
 for(const id of ['my-treatment','between-treatments','my-tests','my-passport','my-resources','side-effects','monitoring-schedule'])assert(html.includes(`id="${id}"`),route+'/'+id);
 assert.equal((guide.match(/class="pt-page /g)||[]).length,3);assert(html.includes('class="pt-tabs"'));assert(guide.includes('hcc-static-connectors'));assert(guide.includes('oncowiki-qr.png'));
 for(const txt of ['FRONT / CONTACTS','BACK / TREATMENT RECORD','Do not cut the centre line','100%','qr.png','EXAMPLE NUMBERS','Add to Home Screen','not a personal record'])assert(card.includes(txt),route+'/'+txt);
 assert(!card.includes('Regimen QR added by'));
 assert.equal((card.match(/<span>[CW]\d<\/span>/g)||[]).length,s.card_cycle_count||0);
 if(s.card_cycle_count===null)assert(card.includes('Rolling record'));
 for(const r of s.monitoring)assert(['Required by regimen','If clinically indicated','Team-agreed plan','Conditional on anticoagulant','Regimen BP check; other tests team-agreed','Required; extra tests if indicated','Regimen + etoposide product information','Required safety checks','Individual treatment plan','Source blood-count check; other plan team-agreed'].includes(r.basis));
 assert(!/<input[^>]+type="date"/.test(html));
 for(const file of fs.readdirSync(`${root}/patient/${route}`).filter(n=>n.endsWith('.html'))){
  const t=read(`patient/${route}/${file}`);assert(!/undefined|\[object Object\]/.test(t),route+'/'+file);
  for(const m of t.matchAll(/(?:src|href)="([^"#]+)"/g)){if(/^(https?:|data:|mailto:|tel:)/.test(m[1]))continue;assert(fs.existsSync(path.resolve(root,'patient',route,m[1].split(/[?#]/)[0])),route+'/'+file+': '+m[1]);}
 }
}
assert.equal(json('data/patient-knowledge/00309.json').patient_summary.card_cycle_count,7);
assert.equal(json('data/patient-knowledge/00309.json').patient_summary.card_record_unit,'administration');
assert.equal(Registry.relativePath('00214','guide'),'patient/00214/scope.html?asset=guide');
assert.equal(Registry.relativePath('00372','guide'),'patient/00372/scope.html?asset=guide');
assert.deepEqual(Registry.bundleRoutes('00372'),['00372/combination','00372/continuation']);
assert(!fs.existsSync(root+'/patient/00372/guide.pdf'),'No all-phase guide with conflicting schedules');
const coverage=json('validation/lung-completion-v08430/lung-coverage.json');assert.equal(coverage.authored,59);assert.equal(coverage.total,59);assert.equal(coverage.remaining.length,0);
const base=json('validation/lung-completion-v08430/baseline-hashes.json');
for(const [file,h]of Object.entries(base.files)){if(!/^(patient|docs\/patient|data\/patient-knowledge|data\/patient-knowledge-contexts)\//.test(file))continue;assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex'),require('./helpers/retrospective-v08430.cjs').expectedHash(file,h),file);}
const vm=require('vm'),ctx={fetch:async()=>({ok:true,json:async()=>json('data/emetogenic-risk-map.json')}),console};vm.runInNewContext(read('js/emetogenic-risk.js'),ctx);
(async()=>{await ctx.SACTCheckEmetogenicRisk.load();const risk=ctx.SACTCheckEmetogenicRisk,map=json('data/emetogenic-risk-map.json');
for(const row of coverage.rows){const r=map.protocols[row.code];for(const x of [r,...Object.values(r.phase_profiles||{})])if(x.script_id)assert(map.scripts[x.script_id],row.code+' missing support script '+x.script_id);}
const p=protocol('00279');for(const o of [{},{treatmentDay:'day1'},{treatmentSchedule:'iv_21'},{treatmentSchedule:'unknown',treatmentDay:'day1'}])assert.equal(risk.get(p,o).scriptId,null);
for(const interval of [21,28])for(const v of ['iv','mixed','split_iv','split_mixed','carbo_iv','carbo_mixed'])for(const day of ['day1','day2','day3']){const out=risk.get(p,{treatmentSchedule:v+'_'+interval,treatmentDay:day});assert.equal(out.level,day==='day1'||v.startsWith('split_')?'high':v.includes('mixed')?'oral_minimal_low':'low');assert(map.scripts[out.scriptId]);}
const n=protocol('00372');assert.equal(risk.get(n,{treatmentPhase:'combination'}).scriptId,null);for(const [phase,day,level]of [['combination','day1','low'],['combination','days2_21','oral_minimal_low'],['continuation',undefined,'oral_minimal_low']])assert.equal(risk.get(n,{treatmentPhase:phase,treatmentDay:day}).level,level);
console.log('v0.84.30: six integrated suites, explicit nintedanib phases, seven-week card, source-reviewed patient packs and59/59lung coverage verified.');
})().catch(e=>{console.error(e);process.exitCode=1});
