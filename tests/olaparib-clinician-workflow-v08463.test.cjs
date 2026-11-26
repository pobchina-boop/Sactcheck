'use strict';
const release = require('./helpers/live-release-v08464.cjs');
// Exercise production workflow, knowledge and compatibility consent renderers.
// VM/DOM fixtures are file-based integration checks, not browser acceptance.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),json=f=>JSON.parse(read(f));
const baseline=f=>JSON.parse(execFileSync('git',['show','159532b7cd04238588804a504fff5427ce24a057:'+f],{cwd:root,encoding:'utf8',maxBuffer:20*1024*1024}));
const plain=x=>JSON.parse(JSON.stringify(x));
const mono=json('protocols/shared/00588-olaparib-tablet-monotherapy.json'),combo=json('protocols/gynaecology/00746-olaparib-tablet-and-bevacizumab-therapy.json');
const workflow=json('data/regimen-workflow-v0750.json'),risk=json('data/emetogenic-risk-map.json');
const W=require('../js/regimen-workflow-engine-v0750'),P=require('../js/supportive-care-pdf-v0750');
const R=require('../js/patient-asset-registry-v0810'),J=require('../js/treatment-journey-v0837');
const contexts=['breast','prostate','ovarian_first_line','ovarian_relapsed','pancreatic'];
let checks=0;
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const plainPdf=bytes=>[...Buffer.from(bytes).toString('latin1').matchAll(/\(((?:\\.|[^\\)])*)\) Tj/g)].map(m=>m[1].replace(/\\([\\()])/g,'$1')).join(' ').replace(/\s+/g,' ');

for(const context of [...contexts,'combination']){
  const p=context==='combination'?combo:{...mono,patient_context:context},code=p.metadata.nccp_regimen_code;
  const before=W.buildManifest(p,workflow,risk.protocols[code]);
  assert.equal(before.supportiveCare.status,'phase_review_required');
  const m=W.buildManifest(p,workflow,risk.protocols[code],'treatment'),plan=m.supportiveCare;
  assert.equal(plan.status,'available');assert.equal(plan.planId,context==='combination'?'olaparib63_00746':'olaparib63_00588_'+context);
  assert.equal(m.emetogenic.level,'oral_moderate_high');
  assert.deepEqual(m.components,context==='combination'?['olaparib','bevacizumab']:['olaparib']);
  assert.deepEqual(plan.day1,[]);assert.deepEqual(plan.subsequent,[]);assert.deepEqual(plan.local_prescription_items,[]);
  assert(plan.warnings.some(t=>/routine antiemetic prophylaxis is not required/.test(t)));
  assert(plan.warnings.some(t=>/Aprepitant.*moderate CYP3A/.test(t)));
  assert(plan.warnings.some(t=>/exact days\/duration/.test(t)));
  assert(m.interactionOverrides.some(t=>t.id==='olaparib_cyp3a_and_support_review_v08463'));
  const pdf=P.buildPdf({manifest:m,sources:workflow.sources}),text=plainPdf(pdf);
  assert(Buffer.from(pdf).subarray(0,5).toString()==='%PDF-');
  for(const warning of [...plan.warnings,...m.interactionOverrides.map(x=>x.message)])assert(text.includes(P.ascii(warning)),'Support PDF lost warning: '+warning);
  if(context==='combination'){
    assert(plan.warnings.some(t=>/every three weeks/.test(t)));assert(plan.warnings.some(t=>/before each bevacizumab cycle/.test(t)));
    assert(plan.warnings.some(t=>/does not normally require routine premedication/.test(t)));
  }
  checks++;
}
for(const context of ['', 'gynaecology','unknown']){
  const p={...mono,patient_context:context};
  const m=W.buildManifest(p,workflow,risk.protocols['00588'],'treatment');
  assert.notEqual(m.supportiveCare.status,'available');assert.equal(m.supportiveCare.planId,null);checks++;
}
// Exact preservation of all unrelated configuration, including the retained old plan.
const priorWorkflow=release.astraJson('data/regimen-workflow-v0750.json');
const priorRisk=release.astraJson('data/emetogenic-risk-map.json');
const priorReview=release.astraJson('data/clinical-validation-register-v0630.json');
const priorSource=release.astraJson('data/nccp-change-tracker/source-register-v0620.json');
const oldW=baseline('data/regimen-workflow-v0750.json'),oldR=baseline('data/emetogenic-risk-map.json');
for(const [id,plan]of Object.entries(oldW.antiemetic_plans))assert.deepEqual(priorWorkflow.antiemetic_plans[id],plan,id);
for(const [id,selector]of Object.entries(oldW.context_supportive_phase_selectors))if(id!=='00588')assert.deepEqual(priorWorkflow.context_supportive_phase_selectors[id],selector,id);
for(const [id,selector]of Object.entries(oldW.supportive_phase_selectors))if(id!=='00746')assert.deepEqual(priorWorkflow.supportive_phase_selectors[id],selector,id);
assert.deepEqual(priorWorkflow.interaction_rules.filter(r=>r.id!=='olaparib_cyp3a_and_support_review_v08463'),oldW.interaction_rules);
for(const [code,entry]of Object.entries(oldR.protocols))if(!['00588','00746'].includes(code))assert.deepEqual(priorRisk.protocols[code],entry,code);
const consent=json('data/consent-content-v0710.json'),oldConsent=baseline('data/consent-content-v0710.json');
for(const [id,profile]of Object.entries(oldConsent.agent_profiles))if(id==='niraparib') {
  const reviewed=structuredClone(consent.agent_profiles[id]);
  assert(reviewed.aliases.includes('niraparib tablets'));
  reviewed.aliases=reviewed.aliases.filter(a=>a!=='niraparib tablets');
  assert(reviewed.risks.some(r=>r.id==='pres'));
  reviewed.risks=reviewed.risks.filter(r=>r.id!=='pres');
  assert.deepEqual(reviewed,profile,id+' retained risks and aliases');
} else if(id!=='olaparib') assert.deepEqual(consent.agent_profiles[id],profile,id);
assert(consent.agent_profiles.olaparib.risks.some(r=>r.id==='olaparib_reproductive'));
assert(consent.agent_profiles.bevacizumab.risks.some(r=>r.id==='reproductive'));
assert(!consent.agent_profiles.olaparib.risks.some(r=>r.id==='reproductive'));
const review=json('data/clinical-validation-register-v0630.json'),oldReview=baseline('data/clinical-validation-register-v0630.json');
const source=json('data/nccp-change-tracker/source-register-v0620.json'),oldSource=baseline('data/nccp-change-tracker/source-register-v0620.json');
for(const row of oldReview.protocols)if(!['00588','00746'].includes(row.nccp_code))assert.deepEqual(priorReview.protocols.find(r=>r.protocol_id===row.protocol_id),row);
for(const row of oldSource.records)if(!['00588','00746'].includes(row.nccp_regimen_code))assert.deepEqual(priorSource.records.find(r=>r.tracking_key===row.tracking_key),row);
for(const p of [mono,combo]){
  const code=p.metadata.nccp_regimen_code,row=review.protocols.find(r=>r.nccp_code===code),tracked=source.records.find(r=>r.nccp_regimen_code===code);
  assert.equal(row.rule_count,p.rule_engine.rules.length);assert.equal(row.input_count,Object.keys(p.input_definitions).length);assert.equal(row.encoding_version,'0.84.63');
  assert.equal(row.formal_consultant_reviewed,false);assert.equal(row.formal_pharmacy_reviewed,false);assert.equal(row.knowledge_base_profile,true);
  assert.equal(tracked.protocol_json_sha256,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,row.path))).digest('hex'));
  assert.equal(tracked.pdf_sha256,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'validation/olaparib-source-20261124',code+'.pdf'))).digest('hex'));assert.equal(tracked.extracted_text_sha256,null);assert.match(tracked.source_reconciliation_note,/HSE original PDF retrieved/);
}

(async()=>{
  const target={innerHTML:'',querySelector:()=>null},classes={add(){},remove(){},toggle(){}},overlay={classList:classes,querySelector:s=>s==='[data-regimen-info-content]'?target:null};
  const context={console,SACTCheckPatientAssets:R,SACTCheckTreatmentJourney:J,SACTCheckTreatmentEvidence:require('../js/treatment-evidence-v08413'),
    fetch:async url=>({ok:fs.existsSync(path.join(root,url)),json:async()=>json(url)}),
    document:{readyState:'loading',addEventListener(){},getElementById:id=>id==='regimenInformationOverlay'?overlay:null,body:{classList:classes}}};
  vm.createContext(context);vm.runInContext(read('js/regimen-knowledge-base.js'),context);
  const api=context.SACTCheckRegimenKnowledgeBase,payload=await api.load();
  const base=api.regimenProfileForProtocol(mono),combination=api.regimenProfileForProtocol(combo);
  assert.deepEqual(plain(base.context_profiles.map(p=>p.context_id)),contexts);
  assert.equal(combination.protocol_id,combo.protocol_id);
  const expectedTrials={breast:'OlympiA',prostate:'PROfound',ovarian_first_line:'SOLO1',ovarian_relapsed:'SOLO2',pancreatic:'POLO',combination:'PAOLA-1'};
  const indicationMap={breast:'adjuvant_high_risk_early_breast',prostate:'mcrpc_brca_monotherapy',ovarian_first_line:'first_line_advanced_ovarian_maintenance',ovarian_relapsed:'platinum_sensitive_relapsed_ovarian_maintenance',pancreatic:'pancreatic_maintenance'};
  for(const selected of [...contexts,'combination']){
    const p=selected==='combination'?combo:{...mono,selected_indication_id:indicationMap[selected]};
    assert(api.open(p));await tick();const html=target.innerHTML;
    assert(!/undefined|\[object Object\]|could not be loaded/.test(html),selected);
    assert(html.includes('Longitudinal monitoring schedule'));assert(html.includes(expectedTrials[selected]));
    const evidence=html.match(/<section class="regimen-information-section treatment-rationale"[\s\S]*?<\/section>/)?.[0];
    assert(evidence,selected+' missing actual evidence renderer');
    for(const [other,trial]of Object.entries(expectedTrials))if(other!==selected)assert(!evidence.includes(trial),selected+' cross-context trial '+trial);
    // The older prostate explainer has its own explicit code allow-list.
    // It must never leak into another olaparib indication.
    if(selected!=='prostate')assert(!html.includes('prostate-pathway-title'));
    assert(html.includes('Aprepitant'));assert(html.includes('100 mg twice daily'));assert(html.includes('150 mg twice daily'));assert(html.includes('Child–Pugh C'));
    const profile=selected==='combination'?combination:base.context_profiles.find(x=>x.context_id===selected);
    const journey=J.definitions[profile.journey_key];assert(journey,'Missing journey key '+profile.journey_key);
    const monitoringTable=html.match(/aria-label="Longitudinal monitoring schedule"([\s\S]*?)<\/table>/)?.[1];
    assert(monitoringTable);assert.equal((monitoringTable.match(/scope="row"/g)||[]).length,profile.monitoring_and_toxicity.longitudinal_schedule.rows.length);
    if(selected==='combination'){assert(html.includes('15 months'));assert(html.includes('90 minutes'));assert(html.includes('exactly 4'));}
    checks++;
  }
  for(const selected of ['gynaecology','unknown']){assert(api.open({...mono,patient_context:selected}));await tick();assert(target.innerHTML.includes('Choose the exact monotherapy indication'));assert(!target.innerHTML.includes('data-clinician-evidence="true"'));checks++;}
  // All historical addenda stay intact; the new file only supersedes these two profiles.
  assert.equal(payload.regimen_profiles.filter(p=>p.protocol_id===mono.protocol_id).length,1);
  assert.equal(payload.regimen_profiles.filter(p=>p.protocol_id===combo.protocol_id).length,1);
  for(const f of ['data/regimen-knowledge-base-v0849-addendum.json','data/regimen-knowledge-base-v08457-addendum.json'])assert.deepEqual(release.astraJson(f),baseline(f));

  // Public compatibility entry point exercises the real component-risk matcher
  // and renderer, retaining separately labelled olaparib/bevacizumab risks.
  const body={innerHTML:'',querySelector:()=>null},title={},sub={},shell={querySelector:s=>s==='#patientSupportBody'?body:s==='#patientSupportTitle'?title:sub,querySelectorAll:()=>[]};
  const c={URL,console,SACTCheckRegimenComponents:require('../js/regimen-components'),location:{href:'https://sactcheck.ie/'},document:{readyState:'loading',addEventListener(){},getElementById:id=>id==='patientSupportShell'?shell:null,body:{classList:classes}},fetch:async url=>({ok:true,json:async()=>json(url)})};c.window=c;
  vm.createContext(c);vm.runInContext(read('js/regimen-consent-builder-v0710.js'),c);
  const oldContext={...c};oldContext.window=oldContext;
  vm.createContext(oldContext);vm.runInContext(execFileSync('git',['show','159532b7cd04238588804a504fff5427ce24a057:js/regimen-consent-builder-v0710.js'],{cwd:root,encoding:'utf8'}),oldContext);
  let unchangedComponentLists=0;
  for(const row of json('protocols/index.json').protocols){const p=json(row.path);if(['00588','00746'].includes(p.metadata.nccp_regimen_code))continue;
    const reviewedGynae = {
      '00303':['Paclitaxel','Carboplatin'],
      '00306':['Gemcitabine','Carboplatin'],
      '00308':['Carboplatin','Paclitaxel'],
      '00624':['Pegylated Liposomal Doxorubicin','Carboplatin'],
      '00819':['Dostarlimab'],
      '00344':['Docetaxel','Oxaliplatin','Folinic Acid','5 Fluorouracil'],
      '00620':['Bevacizumab','Carboplatin','Paclitaxel'],
      '00716':['Bevacizumab','Carboplatin','Paclitaxel'],
      '00769':['Bevacizumab','Paclitaxel'],
      '00771':['Bevacizumab','Topotecan'],
      '00772':['Bevacizumab','Pegylated Liposomal Doxorubicin']
    }[p.metadata.nccp_regimen_code];
    if (reviewedGynae) {
      assert.deepEqual(plain(c.SACTCheckRegimenConsentBuilder.componentsForProtocol(p)),reviewedGynae);
      continue;
    }
    if(['00862','00929'].includes(p.metadata.nccp_regimen_code)){
      const expected=p.metadata.nccp_regimen_code==='00862'?['Niraparib Tablets']:['Dostarlimab','Paclitaxel','Carboplatin'];
      assert.deepEqual(plain(c.SACTCheckRegimenConsentBuilder.componentsForProtocol(p)),expected);
      continue;
    }
    assert.deepEqual(plain(c.SACTCheckRegimenConsentBuilder.componentsForProtocol(p)),plain(oldContext.SACTCheckRegimenConsentBuilder.componentsForProtocol(p)));unchangedComponentLists++;}
  for(const p of [mono,combo]){
    await c.SACTCheckRegimenConsentBuilder.openPatientSupport(p);
    assert(!/could not be loaded|undefined|\[object Object\]/.test(body.innerHTML));
    for(const agent of p===combo?['olaparib','bevacizumab']:['olaparib']){
      const profile=consent.agent_profiles[agent];
      for(const risk of profile.risks){assert(body.innerHTML.includes(c.SACTCheckRegimenConsentBuilder.escapeHtml(risk.label)),agent+' missing '+risk.id);assert(body.innerHTML.includes(c.SACTCheckRegimenConsentBuilder.escapeHtml(risk.detail)),agent+' missing detail '+risk.id);}
      assert.equal((body.innerHTML.match(new RegExp('class="patient-risk-source">'+profile.display_name,'g'))||[]).length,profile.risks.length);
    }
    if(p===mono)assert(!body.innerHTML.includes('class="patient-risk-source">Bevacizumab'));
    checks++;
  }
  execFileSync(process.execPath,['tools/refresh-olaparib-registers-v08463.cjs','--check'],{cwd:root,stdio:'pipe'});
  console.log(`Olaparib clinician workflow: ${checks} context/route/renderer scenarios; complete support PDF warning retention; ${unchangedComponentLists} other component lists, unrelated plans, risks, consent profiles and historical KB preserved; current registers fresh.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
