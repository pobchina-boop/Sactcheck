/* Focused regressions for the shared workflow review patch.
 * Run in a complete checkout. SACTCHECK_SOURCE_ROOT can point to an isolated,
 * pinned-source fixture when reviewing this patch outside a full checkout.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const sources=process.env.SACTCHECK_SOURCE_ROOT||root;
const read=name=>JSON.parse(fs.readFileSync(path.join(sources,name),'utf8'));
const protocol=read('protocols/gastrointestinal/00642-lutetium-177-oxodotreotide-lutathera-therapy.json');
const data=read('data/regimen-workflow-v0750.json');
global.SACTCHECK_RELEASE=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version;
global.location={href:'https://pobchina-boop.github.io/Sactcheck/'};
const registry=require(path.join(root,'js/patient-asset-registry-v0810.js'));
const workflow=require(path.join(root,'js/regimen-workflow-engine-v0750.js'));
const phaseSupport=require(path.join(root,'assets/patient/phase-support-v0838.js'));

(async()=>{
  for(const dose of ['', '—', '-', '___', 'TBC', 'T.B.C.', 'TBD', 'N/A', 'not specified', 'Agent and dose prescribed by the nuclear-medicine service']){
    assert.equal(phaseSupport.unresolvedPrescriptionRows([{medicine:'Antiemetic',dose}]).length,1,`Unspecified dose must be visible: ${JSON.stringify(dose)}`);
  }
  assert.equal(phaseSupport.unresolvedPrescriptionRows([{medicine:'Example medicine',dose:'8 mg PO'}]).length,0);
  assert.equal(phaseSupport.unresolvedPrescriptionRows([{medicine:'No routine antiemetic prophylaxis',dose:'—'}]).length,0,'An explicit no-medicine recommendation must not become a request to invent a dose');
  for(const level of ['moderate','high','minimal','phase_dependent']){
    const plan=workflow.chooseAntiemeticPlan(protocol,data,{level});
    assert.equal(plan.status,'source_only','PRRT must remain source-specific regardless of the display risk');
    assert.equal(plan.planId,null,'PRRT must not acquire a generic CINV plan');
    assert.equal(plan.day1,undefined,'PRRT must not acquire a generic day-1 medicine list');
  }
  const manifest=workflow.buildManifest(protocol,data,{level:'moderate',label:'Moderate emetogenic potential'});
  assert.equal(manifest.emetogenic.level,'moderate','Display risk is retained independently of script selection');
  assert.equal(manifest.supportiveCare.status,'source_only');
  const generic=workflow.chooseAntiemeticPlan({metadata:{nccp_regimen_code:'00001'}},data,{level:'moderate'});
  assert.equal(generic.planId,'moderate','Existing non-PRRT mapping is not broadened by this patch');

  const opened=[];
  global.open=(url,target,features)=>{const viewer={opener:'previous'};opened.push({url,target,features,viewer});return viewer;};
  global.SACTCheckPatientAssets=registry;
  workflow.openConsentSupport(protocol);
  assert.equal(opened.at(-1).url,'https://pobchina-boop.github.io/Sactcheck/patient/00642/consent-form.html');
  assert.equal(opened.at(-1).viewer.opener,null);
  workflow.openConsentSupport({metadata:{nccp_regimen_code:'00455'},patient_context:'melanoma_adjuvant'});
  assert.equal(opened.at(-1).url,'https://pobchina-boop.github.io/Sactcheck/patient/00455/melanoma_adjuvant/consent-form.html');
  workflow.openConsentSupport({metadata:{nccp_regimen_code:'00455'}});
  assert.equal(opened.at(-1).url,'https://pobchina-boop.github.io/Sactcheck/patient/00455/scope.html?asset=consent-draft','Unknown treatment context must still go through scope selection');
  const authored=await workflow.openSupportivePdf(protocol);
  assert.equal(authored,'https://pobchina-boop.github.io/Sactcheck/patient/00642/supportive-care.html');
  assert.equal(opened.at(-1).url,authored,'Authored guidance remains the first action');

  // An unavailable authored registry must not turn the PRRT risk badge into a
  // moderate-risk chemotherapy prescription. The old path would reach the PDF.
  global.SACTCheckPatientAssets={codeFor:p=>String(p.metadata.nccp_regimen_code),runtimeUrl:()=>null};
  global.SACTCheckEmetogenicRisk={get:()=>({level:'moderate'})};
  global.fetch=async()=>({ok:true,json:async()=>data});
  let pdfCalls=0,closed=0;
  global.SACTCheckSupportiveCarePdf={release:global.SACTCHECK_RELEASE,openInViewer:()=>{pdfCalls++;}};
  global.open=()=>({document:{body:{}},close:()=>{closed++;}});
  const alerts=[];
  global.alert=message=>alerts.push(message);
  assert.equal(await workflow.openSupportivePdf(protocol),null);
  assert.equal(pdfCalls,0,'No generic PRRT prescription PDF is generated');
  assert.equal(closed,1,'The unused placeholder is closed');
  assert.match(alerts.at(-1),/authored PRRT supportive-care sheet/);
  console.log('PASS: missing-dose detection, PRRT source-only guard, missing-source fallback, dedicated guidance, and consent context routing.');
})().catch(error=>{console.error(error);process.exitCode=1;});
