'use strict';
// Explicit olaparib scope. Never regenerates the rest of the patient catalogue.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const root = path.resolve(__dirname,'..');
const review = require('./olaparib-patient-review-v08463.cjs');
const check = process.argv.includes('--check');
function companionTransition() {
  const source='patient/00588/logistics.html';
  const base='159532b7cd04238588804a504fff5427ce24a057';
  const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
  const before=cp.execFileSync('git',['show',base+':'+source],{cwd:root});
  const plan=JSON.parse(fs.readFileSync(path.join(root,'data/patient-canonical-retention-v08445.json'),'utf8'));
  const rows=plan.rows.filter(row=>row.route==='00588');
  assert(rows.length===6 && rows.every(row=>row.source_file===source && row.source_file_sha256===digest(before)),'Authenticate original breast companion clauses');
  const originalRelease='71d089b071bff6f8ed3ff6eb3cad49a5e6577105';
  const oldPath='validation/olaparib-v08463/companion-transitions.json';
  const frozen=cp.execFileSync('git',['show',originalRelease+':'+oldPath],{cwd:root});
  assert(fs.readFileSync(path.join(root,oldPath)).equals(frozen),'Original olaparib companion transition is frozen');
  const previous=JSON.parse(frozen).files.find(row=>row.path===source);
  assert.equal(previous.before_sha256,digest(before));
  const current=JSON.parse(fs.readFileSync(path.join(root,'validation/olaparib-source-20261124/companion-transition.json')));
  assert.equal(current.path,source);
  assert.equal(current.before_sha256,previous.after_sha256);
  assert.equal(current.after_sha256,digest(fs.readFileSync(path.join(root,source))),'Current logistics source must match the version 6 transition');

}
companionTransition();
const file = 'data/breast-treatment-journeys-v0837.json';
const journeys = JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
for (const route of review.ROUTES) {
  const d = review.profile(route);
  assert.equal(d.suite_release,'0.84.63',route+' authored release');
  const key = route.replace('/',':');
  const old = journeys[key];
  const combo = d.code === '00746';
  const summary = d.patient_summary;
  const schedule = summary.phases.map(p=>p.text).join(' ');
  const monitoring = summary.monitoring;
  const definition = {
    code:d.code, release:'0.84.63', checked:'2026-11-24', status:d.review_status,
    schedule_type:'relative-educational', has_patient_dates:false,
    title:d.title+' · the whole treatment journey', setting:d.context_label,
    summary:d.schedule_summary,
    stages:['Before starting','Every day','Scheduled review','Change or completion'],
    lanes:[
      {label:'Treatment plan',kind:'treatment',source_ids:['nccp','smpc'],note:'Dates and dose changes are confirmed by the treating team.',cells:[
        'Confirm the cancer setting, molecular test, previous treatment and agreed purpose.',
        combo?'Take the prescribed olaparib tablets morning and evening. Bevacizumab is a separate infusion every21days.':'Take the prescribed olaparib tablets morning and evening, with no planned rest week.',
        'Review symptoms, blood results, medicines, adherence and supply before agreeing the next prescription.',
        schedule
      ]},
      {label:'Safety checks',kind:'monitoring',source_ids:['nccp','smpc'],note:'A normal previous test does not exclude a new problem.',cells:[
        monitoring.find(r=>r.stage==='Before')?.when || monitoring[0].when,
        'Report new symptoms promptly. Urgent symptoms need a call; do not wait for a planned test.',
        monitoring.find(r=>r.stage==='During')?.when || monitoring[1].when,
        'The team follows up abnormal results and explains the next monitoring plan.'
      ]},
      {label:'Cancer review and support',kind:'monitoring',source_ids:['nccp'],note:'Safety blood tests and cancer-response assessment answer different questions.',cells:[
        'Agree who requests each test, who explains results and the daytime/out-of-hours contact routes.',
        'Use the written support plan. Record missed tablets, symptoms and questions for review.',
        monitoring.find(r=>r.stage==='Response')?.when || monitoring.at(-1).when,
        'Agree how to continue, pause or finish treatment and arrange ongoing care.'
      ]}
    ],
    milestones:monitoring.map(r=>({title:r.test,when:r.stage,why:r.when,clinical:r.basis,
      action:'Ask when this check is due, who arranges it and who reviews the result. New symptoms need advice before the next appointment.',source_ids:['nccp','smpc']})),
    clinical_notes:old?.clinical_notes || [d.treatment_scope_notice || d.scope_note || d.context_label],
    sources:d.sources.map(s=>({id:s.id,title:s.title,url:s.url}))
  };
  // Use the verified, authored context-specific wording; no fixed scan interval
  // or dose is inferred by this renderer.
  definition.lanes[0].cells[1]=definition.lanes[0].cells[1].replace('every21days','every 21 days');
  journeys[key]=definition;
}
const serialized=JSON.stringify(journeys,null,2)+'\n';
if(check)assert.equal(fs.readFileSync(path.join(root,file),'utf8'),serialized,'Olaparib journeys are current');
else fs.writeFileSync(path.join(root,file),serialized);
function run(tool,env={}) {
  cp.execFileSync(process.execPath,['tools/'+tool,...(check?['--check']:[])],{cwd:root,stdio:'inherit',env:{...process.env,...env}});
}
run('build-breast-journeys.cjs');
for (const route of review.ROUTES) {
  const [code,context='']=route.split('/');
  const env={SACT_SUITE_CODES:code,SACT_SUITE_CONTEXT:context};
  run('build-patient-knowledge.cjs',env);
  run('build-complete-pathways.cjs',env);
  if(route==='00588')companionTransition();
  run('build-phase-support-v0838.cjs',env);
}
const selector=require('./targeted-patient-suite-v0849.cjs').renderOlaparibScope(review.profile('00588'));
const selectorPath=path.join(root,'patient/00588/scope.html');
if(check)assert.equal(fs.readFileSync(selectorPath,'utf8'),selector,'Olaparib setting selector is current');
else fs.writeFileSync(selectorPath,selector);
console.log('Built six olaparib suites; videos remain unchanged.');
