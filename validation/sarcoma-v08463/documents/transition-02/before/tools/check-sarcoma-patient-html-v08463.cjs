 'use strict';
// Scoped source/content checks; PDF pagination, visual review and clinical approval remain separate.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),codes=['00420','00463','00100','00596','00680'];
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8')),text=f=>fs.readFileSync(path.join(root,f),'utf8');
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let checks=0;function ok(v,m){assert.ok(v,m);checks++;}
const consent=require('./consent-core-v08455.cjs'),evidence=require('../js/treatment-evidence-v08413.js'),publication=require('./patient-publication-v08444.cjs');
const box={module:{exports:{}},console,SACTCheckPatientAssets:{contextFor:()=>''}};
vm.runInNewContext(text('js/regimen-workflow-engine-v0750.js').replace('return Object.freeze({','return Object.freeze({ renderSupportiveScript,'),box);
const engine=box.module.exports,workflow=read('data/regimen-workflow-v0750.json'),phases=read('data/phase-support-v0838.json').regimens;
const kb=read('data/regimen-knowledge-base-v08463-addendum.json').regimen_profiles;
const inputs=read('validation/sarcoma-v08463/patient-authoring/source-payload/manifest.json');
const templates=read('validation/sarcoma-v08463/patient-authoring/source-payload/cuh-support/templates.json').templates;
const out=[];let completeRows=0;
for(const code of codes){
 const d=read(`data/patient-knowledge/${code}.json`),guide=text(`patient/${code}/guide.html`),knowledge=text(`patient/${code}/knowledge.html`),index=text(`patient/${code}/index.html`),form=text(`patient/${code}/consent-form.html`),passport=text(`patient/${code}/passport.html`);
 const entry=kb.find(x=>x.patient_route===code),e=evidence.render(entry);
 ok((e.match(/class="evidence-outcome evidence-/g)||[]).length===entry.evidence_at_a_glance.endpoints.length,code+' all evidence cards');
 for(const endpoint of entry.evidence_at_a_glance.endpoints)ok(evidence.outcome(endpoint).includes(endpoint.sources[0].url),code+' source-linked endpoint');
 for(const m of d.patient_summary.monitoring){ok(guide.includes(esc(m.test)),code+' named test '+m.test);ok(guide.includes(esc(m.when)),code+' timed test');}
 for(const agent of d.agents)for(const risk of agent.risks)ok(form.includes(esc(risk)),code+' agent consent risk '+risk);
 if(code==='00100'){
  ok(form.includes('data-consent-module="innate-immune-activation"'),'mifamurtide innate immune module');
  ok(form.includes('data-consent-module="concurrent-chemotherapy-reference"'),'separate chemotherapy context');
  ok(!form.includes('data-consent-module="immune-supplement"'),'no checkpoint consent module');
 }else ok(form.includes('data-consent-module="chemotherapy"'),code+' generic chemotherapy consent');
 if(code==='00596')ok(form.includes('unlicensed indication in Ireland')&&form.includes('Drugs and Therapeutics Committee'),'IE source licensing note');
 for(const link of ['handbook.pdf','knowledge.pdf','sactcard.pdf','guide.pdf'])ok(index.includes('href="'+link+'"'),code+' stable '+link);
 ok(knowledge.includes('id="anatomical-effects"')&&d.anatomy.length===8,code+' full eight-part anatomy');
 ok(d.independent_clinical_approval===false,code+' no human approval claim');
 if(d.schedule_kind==='reference-course'){
  for(const html of [guide,knowledge,index,passport])for(const bad of ['203-day cycle','252-day cycle','One cycle per page','one cycle, one page','Cycle number:','Day of cycle','Read the whole cycle as text'])ok(!html.includes(bad),code+' no inherited '+bad);
  ok(passport.includes(code==='00100'?'Infusion number:':'Treatment visit number:'),code+' reference record unit');
 }
 const clinical=read('validation/sarcoma-v08463/patient-authoring/source-payload/'+inputs.clinical_inputs[code].path);
 const phaseResults=[];
 for(const phase of phases[code]){
  const ref=phase.local_reference,original=templates[ref.template_id],m=engine.buildManifest(clinical,workflow,{},phase.id),html=engine.renderSupportiveScript(m),printed=text(`patient/${code}/support-${phase.id}.html`);
  ok(m.supportiveCare.planId==='sarcoma63_'+code+'_'+phase.id,code+phase.id+' selected workflow');
  ok(m.supportiveCare.day1.length+m.supportiveCare.subsequent.length===0,code+phase.id+' no archival prescription automation');
  ok(ref.display_only_reference&&ref.requires_individual_prescription&&!ref.automatic_prescription,code+phase.id+' reference boundary');
  ok(ref.items.length===original.items.length,code+phase.id+' complete CUH rows');
  for(let i=0;i<ref.items.length;i++){
   const row=ref.items[i];for(const [k,v]of Object.entries(original.items[i]))ok(row[k]===v,code+phase.id+' original CUH '+k);
   for(const value of [row.medicine,...Object.values(row.display_fields),row.source_clarification].filter(Boolean))for(const [name,rendered]of [['workflow',html],['printed',printed]])ok(rendered.includes(esc(value)),code+phase.id+' '+name+' row detail '+value);
  }
  for(const rendered of [html,printed]){ok(rendered.includes(esc(ref.note)),code+phase.id+' applicability note');ok(rendered.includes('16 mg/day is a maximum, not a target.'),code+phase.id+' ambiguity note');}
  ok(printed.includes('SACTCheck v0.84.63'),code+phase.id+' current footer');
  completeRows+=ref.items.length;phaseResults.push({phase:phase.id,rows:ref.items.length,workflow_and_print_pass:true});
 }
 let documents=0;
 for(const name of fs.readdirSync(path.join(root,'patient',code)).filter(x=>x.endsWith('.html'))){
  const file=`patient/${code}/${name}`,html=text(file);
  ok(publication.decorateGenerated(file,html,root)===html,file+' final publication idempotent');documents++;
 }
 out.push({code,evidence_cards:entry.evidence_at_a_glance.endpoints.length,summary_monitoring_rows:d.patient_summary.monitoring.length,monitoring_cards:d.monitoring_test_details.length,documents,phases:phaseResults,profile_sha256:sha(`data/patient-knowledge/${code}.json`)});
}
const report={status:'passed',release:'0.84.63',checks,complete_cuh_reference_rows:completeRows,profiles:out,actual_workflow_and_printed_html_checked:true,pdf_and_visual:'Pending document owner',independent_clinical_approval:false};
fs.writeFileSync(path.join(root,'validation/sarcoma-v08463/patient-authoring/actual-html-checks.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,checks,profiles:out.length,complete_cuh_reference_rows:completeRows}));
