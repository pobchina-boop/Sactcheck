 'use strict';
// Scoped source/content checks; PDF pagination, visual review and clinical approval remain separate.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),codes=['00675','00747','00504','00754','00757'];
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8')),text=f=>fs.readFileSync(path.join(root,f),'utf8');
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f))).digest('hex');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let checks=0;function ok(v,m){assert.ok(v,m);checks++;}
const consent=require('./consent-core-v08455.cjs'),evidence=require('../js/treatment-evidence-v08413.js'),publication=require('./patient-publication-v08444.cjs');
const box={module:{exports:{}},console,SACTCheckPatientAssets:{contextFor:()=>''}};
vm.runInNewContext(text('js/regimen-workflow-engine-v0750.js').replace('return Object.freeze({','return Object.freeze({ renderSupportiveScript,'),box);
const engine=box.module.exports,workflow=read('data/regimen-workflow-v0750.json'),phases=read('data/phase-support-v0838.json').regimens;
const kb=read('data/regimen-knowledge-base-v08464-addendum.json').regimen_profiles;
const inputs=read('validation/sarcoma-v08464/patient-authoring/source-payload/manifest.json');
const templates=read('validation/sarcoma-v08464/patient-authoring/source-payload/accepted-cuh-restoration/cuh-support/templates.json').templates;
const out=[];let completeRows=0;
for(const code of codes){
 const d=read(`data/patient-knowledge/${code}.json`),guide=text(`patient/${code}/guide.html`),knowledge=text(`patient/${code}/knowledge.html`),index=text(`patient/${code}/index.html`),form=text(`patient/${code}/consent-form.html`),passport=text(`patient/${code}/passport.html`);
 const entry=kb.find(x=>x.patient_route===code),e=evidence.render(entry);
 ok((e.match(/class="evidence-outcome evidence-/g)||[]).length===entry.evidence_at_a_glance.endpoints.length,code+' all evidence cards');
 for(const endpoint of entry.evidence_at_a_glance.endpoints)ok(evidence.outcome(endpoint).includes(endpoint.sources[0].url),code+' source-linked endpoint');
 for(const m of d.patient_summary.monitoring){ok(guide.includes(esc(m.test)),code+' named test '+m.test);ok(guide.includes(esc(m.when)),code+' timed test');}
 ok(form.includes(String(d.consent_generic_risks).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')),code+' complete authored generic consent paragraph');
 for(const agent of d.agents)for(const risk of agent.risks)ok(form.includes(esc(risk)),code+' agent consent risk '+risk);
 ok(form.includes('data-consent-module="chemotherapy"'),code+' generic chemotherapy consent');
 ok(form.includes('data-consent-module="authored-generic-v08464"'),code+' complete authored paragraph module');
 for(const risk of consent.model.categories.chemotherapy.risks)ok(form.includes(String(risk.label).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')),code+' NCCP checklist '+risk.id);
 if(['00504','00757'].includes(code))ok(form.includes('unlicensed in Ireland')&&form.includes('Drugs and Therapeutics Committee'),code+' source licensing and local consent');
 for(const link of ['handbook.pdf','knowledge.pdf','sactcard.pdf','guide.pdf'])ok(index.includes('href="'+link+'"'),code+' stable '+link);
 ok(knowledge.includes('id="anatomical-effects"')&&d.anatomy.length===8,code+' full eight-part anatomy');
 ok(d.independent_clinical_approval===false,code+' no human approval claim');
 if(d.schedule_kind==='reference-course'){
  for(const html of [guide,knowledge,index,passport])for(const bad of ['203-day cycle','252-day cycle','One cycle per page','one cycle, one page','Cycle number:','Day of cycle','Read the whole cycle as text'])ok(!html.includes(bad),code+' no inherited '+bad);
  ok(passport.includes(code==='00100'?'Infusion number:':'Treatment visit number:'),code+' reference record unit');
 }
 const visibleKnowledge=knowledge.replace(/<script\b[\s\S]*?<\/script>/gi,'').replace(/<style\b[\s\S]*?<\/style>/gi,'');
 for(const phase of d.phase_cycles||[])ok(visibleKnowledge.includes(esc(phase.label)),code+' visible phase calendar '+phase.label);
 if(['00675','00747'].includes(code)){
  ok(d.phase_cycles.length===3,code+' three distinct calendars');
  ok(JSON.stringify(d.phase_cycles.flatMap(p=>p.cycles).sort((a,b)=>a-b))===JSON.stringify(Array.from({length:14},(_,i)=>i+1)),code+' complete14administration course');
  ok(d.phase_cycles.every(p=>p.cycle_days===(code==='00675'?14:21)),code+' correct interval');
  ok(!d.phase_cycles[2].timeline.some(x=>x.id==='doxorubicin'),code+' final VC omits doxorubicin');
  ok(d.phase_cycles[2].timeline.find(x=>x.id==='dactinomycin').label.includes('ONLY if selected'),code+' optional dactinomycin');
 }
 if(code==='00754'){
  ok(JSON.stringify(d.phase_cycles.map(p=>p.cycles))==='[[1,2],[3,4],[5,6,7,8,9]]','IVADo phase allocation');
  ok(!d.phase_cycles[2].timeline.some(x=>x.id==='doxorubicin'),'laterIVADo omits doxorubicin');
  for(const phase of d.phase_cycles)ok(phase.timeline.find(x=>x.id==='mesna').text.includes('no new day-3 dose'),'mesna completion ratherthannewdose');
 }
 if(['00504','00757'].includes(code))ok(d.patient_summary.monitoring.some(x=>x.when.includes('liver tests also after every cycle, including the final cycle')),code+' aftercycle liver testing');
 const clinical=read('validation/sarcoma-v08464/patient-authoring/source-payload/'+inputs.clinical_inputs[code].path);
 const phaseResults=[];
 for(const phase of phases[code]){
  const ref=phase.local_reference,original=templates[ref.template_id],m=engine.buildManifest(clinical,workflow,{},phase.id),html=engine.renderSupportiveScript(m),printed=text(`patient/${code}/support-${phase.id}.html`);
  if(code==='00504')for(const [name,value]of [['authored phase',JSON.stringify(phase)],['selected workflow',html],['printed support',printed]])ok(!/vincristine[- ]only\s+visit/i.test(value),code+' no VIT-only visit in '+name);
  if(code==='00757')for(const [name,value]of [['authored phase',JSON.stringify(phase)],['selected workflow',html],['printed support',printed]])ok(value.includes('On a vincristine-only visit, ongoing delayed-diarrhoea support remains relevant without starting a new irinotecan course.'),code+phase.id+' retains VIT visit context in '+name);
  ok(m.supportiveCare.planId==='sarcoma64_'+code+'_'+phase.id,code+phase.id+' selected workflow');
  ok(m.supportiveCare.day1.length+m.supportiveCare.subsequent.length===0,code+phase.id+' no archival prescription automation');
  ok(ref.display_only_reference&&ref.requires_individual_prescription&&!ref.automatic_prescription,code+phase.id+' reference boundary');
  ok(ref.items.length===original.items.length,code+phase.id+' complete CUH rows');
  for(let i=0;i<ref.items.length;i++){
   const row=ref.items[i];for(const [k,v]of Object.entries(original.items[i]))ok(row[k]===v,code+phase.id+' original CUH '+k);
   for(const value of [row.medicine,...Object.values(row.display_fields),row.source_clarification].filter(Boolean))for(const [name,rendered]of [['workflow',html],['printed',printed]])ok(rendered.includes(esc(value)),code+phase.id+' '+name+' row detail '+value);
  }
  for(const rendered of [html,printed]){ok(rendered.includes(esc(ref.note)),code+phase.id+' applicability note');ok(rendered.includes('16 mg/day is a maximum, not a target.'),code+phase.id+' ambiguity note');}
  ok(printed.includes('SACTCheck v0.84.64'),code+phase.id+' current footer');
  completeRows+=ref.items.length;phaseResults.push({phase:phase.id,rows:ref.items.length,workflow_and_print_pass:true});
 }
 let documents=0;
 for(const name of fs.readdirSync(path.join(root,'patient',code)).filter(x=>x.endsWith('.html'))){
  const file=`patient/${code}/${name}`,html=text(file);
  if(code==='00504')ok(!/vincristine[- ]only\s+visit/i.test(html),file+' no cross-regimen VIT-only visit claim');
  ok(publication.decorateGenerated(file,html,root)===html,file+' final publication idempotent');documents++;
 }
 out.push({code,evidence_cards:entry.evidence_at_a_glance.endpoints.length,summary_monitoring_rows:d.patient_summary.monitoring.length,monitoring_cards:d.monitoring_test_details.length,documents,phases:phaseResults,profile_sha256:sha(`data/patient-knowledge/${code}.json`)});
}
ok(completeRows===108,'All108historicalCUH rows retained');
const report={status:'passed',release:'0.84.64',checks,complete_cuh_reference_rows:completeRows,profiles:out,actual_workflow_and_printed_html_checked:true,pdf_and_visual:'Pending document owner',independent_clinical_approval:false};
fs.writeFileSync(path.join(root,'validation/sarcoma-v08464/patient-authoring/actual-html-checks.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,checks,profiles:out.length,complete_cuh_reference_rows:completeRows}));
