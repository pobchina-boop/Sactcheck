'use strict';
const release = require('./helpers/live-release-v08464.cjs');
// Source-derived acceptance cases for NCCP00776v3b Table3 (p4), with
// adversarial data-entry tests for the 23 November 2026 LVEF repair.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const Engine = require('../js/assessment-engine');
const Dose = require('../js/protocol-dose-schedule');
const Output = require('../js/assessment-output');
const Pdf = require('../js/assessment-pdf');
const Validator = require('../js/protocol-validator');
const protocol = require('../protocols/breast/00776-trastuzumab-deruxtecan.json');
const rows = [];
const clinical = result => result.findings.filter(f => !f.domainAssessment && !/^PARTIAL_/.test(f.ruleId || ''));
function check(name, input, action, inspect = () => {}) {
  const result = Engine.assess(protocol, input);
  assert.deepEqual(result.errors, [], name);
  if (action) assert.equal(result.actionType, action, name);
  inspect(result);
  rows.push({name, input, action:result.actionType, calculated_lvef_decrease:result.inputs.lvef_drop_points, invalid:result.invalid, findings:clinical(result).map(f=>({id:f.ruleId,action:f.actionType,source:f.sourceText}))});
  return result;
}
const has = (r, id) => clinical(r).some(f => f.ruleId === id);
const noDose = r => assert(!Dose.buildModificationModel(protocol,r).rows.some(x=>/^\s*\d/.test(x.protocolDose)));
assert.equal(Validator.validate(protocol,{strict:true}).valid,true);
assert.equal(protocol.metadata.validation.clinical_use_authorised,false);

// The original defect and bad manual subtraction can never erase the measured decline.
for (const manual of [undefined, '', 0, 4, 12, 30, -12, 'garbage', null, false, [4], {value:4}]) {
  check('55 to43 ignores supplied decrease '+JSON.stringify(manual),{assessment_stage:'ongoing',baseline_lvef_percent:55,lvef_percent:43,lvef_drop_points:manual},'withhold',r=>{
    assert.equal(r.inputs.lvef_drop_points,12);assert.equal(r.invalid.length,0);assert(has(r,'LVEF_40_45_DROP10'));noDose(r);
  });
}
check('String measurements use the same arithmetic',{assessment_stage:'ongoing',baseline_lvef_percent:'55',lvef_percent:'43'},'withhold',r=>assert.equal(r.inputs.lvef_drop_points,12));
check('Decimals are not rounded across a source boundary',{assessment_stage:'ongoing',baseline_lvef_percent:55.01,lvef_percent:45},'withhold',r=>assert.equal(r.inputs.lvef_drop_points,10.01));
check('Improved function is a negative decrease, not invalid',{assessment_stage:'ongoing',baseline_lvef_percent:55,lvef_percent:61},null,r=>{assert.equal(r.inputs.lvef_drop_points,-6);assert.equal(r.invalid.length,0);assert(!has(r,'LVEF_DROP_GT20'));});

// Independent source boundaries: current LVEF40/45, decrease10/20, and baseline50.
for (const current of [39.99,40,40.01,44.99,45,45.01,55]) {
  for (const decrease of [9.99,10,10.01,19.99,20,20.01]) {
    const baseline=current+decrease;
    const held=current<40 || decrease>20 || (current<=45 && decrease>=10);
    const r=check(`LVEF ${current}; measured decrease ${decrease}`,{assessment_stage:'ongoing',baseline_lvef_percent:baseline,lvef_percent:current},held?'withhold':baseline<50?'consultant_review':null);
    assert.equal(has(r,'LVEF_LT40'),current<40);
    assert.equal(has(r,'LVEF_DROP_GT20'),decrease>20);
    assert.equal(has(r,'LVEF_40_45_DROP10'),current>=40&&current<=45&&decrease>=10&&decrease<=20);
  }
}
for (const current of [49.99,50,50.01]) check('First-dose current LVEF '+current,{assessment_stage:'baseline',lvef_percent:current},current<50?'withhold':null,r=>assert.equal(has(r,'BASELINE_LVEF_LT50'),current<50));
check('Low historical baseline during treatment needs review, not an invented first-dose hold',{assessment_stage:'ongoing',baseline_lvef_percent:49,lvef_percent:48},'consultant_review',r=>{assert(!has(r,'BASELINE_LVEF_LT50'));assert(has(r,'LVEF_BASELINE_OUTSIDE_ELIGIBILITY_ONGOING'));});
check('Unknown stage cannot clear baseline below50',{baseline_lvef_percent:49},'withhold');

for (const current of [40,43,45,55]) check('Missing baseline at current '+current,{assessment_stage:'ongoing',lvef_percent:current},'consultant_review',r=>{assert.equal(r.inputs.lvef_drop_points,null);assert(has(r,'LVEF_BASELINE_REQUIRED'));noDose(r);});
check('Missing baseline does not hide independent LVEFbelow40',{lvef_percent:39},'withhold',r=>{assert(has(r,'LVEF_LT40'));noDose(r);});
for (const raw of ['',null,undefined,'   ']) check('Absent baseline stays absent '+JSON.stringify(raw),{baseline_lvef_percent:raw,lvef_percent:43,lvef_drop_points:4},'consultant_review',r=>assert.equal(r.inputs.lvef_drop_points,null));
for (const bad of ['abc',-1,101,true,[55],{}]) check('Invalid baseline never drives subtraction '+JSON.stringify(bad),{baseline_lvef_percent:bad,lvef_percent:43,lvef_drop_points:4},null,r=>{assert.equal(r.inputs.lvef_drop_points,null);assert(r.invalid.some(x=>x.id==='baseline_lvef_percent'));assert.notEqual(r.actionType,'proceed');noDose(r);});
for (const bad of ['abc',-1,101,true,[43],{}]) check('Invalid current never drives subtraction '+JSON.stringify(bad),{baseline_lvef_percent:55,lvef_percent:bad},null,r=>{assert.equal(r.inputs.lvef_drop_points,null);assert(r.invalid.some(x=>x.id==='lvef_percent'));noDose(r);});
check('Manualdeltaalone cannot fabricate a measured decline',{lvef_drop_points:21},'incomplete',r=>{assert.equal(r.inputs.lvef_drop_points,null);assert.equal(r.findings.length,0);noDose(r);});
check('Invalid unrelated input retains established cardiac hold',{baseline_lvef_percent:55,lvef_percent:43,anc:'invalid'},'withhold',r=>{assert(r.invalid.some(x=>x.id==='anc'));assert(has(r,'LVEF_40_45_DROP10'));noDose(r);});

// Initial fall and qualifying repeat-recovery are distinct states at exactly10points.
for (const decrease of [9.99,10,10.01]) {
  check('Recovered repeat at decrease '+decrease,{assessment_stage:'ongoing',baseline_lvef_percent:55,lvef_percent:55-decrease,lvef_40_45_recheck:'recovered'},decrease<=10?'proceed_with_caution':'withhold',r=>assert.equal(has(r,'LVEF_RECHECK_RECOVERED'),decrease<=10));
}
check('Initial10-pointfall at45 still holds',{assessment_stage:'ongoing',baseline_lvef_percent:55,lvef_percent:45},'withhold');
check('Verified qualifying unrecovered repeat stops',{assessment_stage:'ongoing',baseline_lvef_percent:55,lvef_percent:43,lvef_40_45_recheck:'not_recovered'},'permanently_discontinue');
for (const flag of ['recovered','not_recovered']) {
  check('Recheck label alone needs measurements '+flag,{lvef_40_45_recheck:flag},'consultant_review',noDose);
  check('Recheck label at first-dose assessment cannot substitute for history '+flag,{assessment_stage:'baseline',baseline_lvef_percent:55,lvef_percent:55,lvef_40_45_recheck:flag},'consultant_review',noDose);
}
check('Contradictory unrecovered label does not auto-stop a recovered value',{assessment_stage:'ongoing',baseline_lvef_percent:55,lvef_percent:46,lvef_40_45_recheck:'not_recovered'},'consultant_review',r=>assert(!has(r,'LVEF_RECHECK_NOT_RECOVERED')));
check('Recoverylabel cannot override severe measured LVEF',{assessment_stage:'ongoing',baseline_lvef_percent:45,lvef_percent:39,lvef_40_45_recheck:'recovered'},'withhold');
for (const field of ['symptomatic_chf','confirmed_severe_lvef_recheck','previous_symptomatic_ild','severe_infusion_reaction']) check('Independentstop overrides recoveredcardiac label '+field,{assessment_stage:'ongoing',baseline_lvef_percent:55,lvef_percent:46,lvef_40_45_recheck:'recovered',[field]:true},'permanently_discontinue',noDose);
check('SuspectedILD overrides cardiac recovery',{assessment_stage:'ongoing',baseline_lvef_percent:55,lvef_percent:46,lvef_40_45_recheck:'recovered',suspected_ild_pneumonitis:true},'withhold',noDose);
check('Grade4neutropenia remains independently actionable',{baseline_lvef_percent:55,lvef_percent:43,anc:.4,dose_reduction_level:0},'withhold_then_reduce',r=>{noDose(r);assert(Dose.buildModificationModel(protocol,r).rows[0].futureDoseDeferred);});

for (const extra of [{suspected_ild_pneumonitis:true},{ild_pneumonitis_grade:1},{lvef_percent:43},{crcl_ml_min:29}]) check('Independent hold/review defers numeric future dose '+JSON.stringify(extra),{anc:.4,dose_reduction_level:0,...extra},'withhold_then_reduce',noDose);
check('Isolated neutropenia retains the source conditional reduction',{anc:.4,dose_reduction_level:0},'withhold_then_reduce',r=>assert.equal(Dose.buildModificationModel(protocol,r).rows[0].protocolDose,'4.4 mg/kg'));

// The real clinician output preserves treatment/indication/cycle, both measurements,
// calculated points, source and requested review. It never prints injected4 as the delta.
const handover=check('Documented cardiac escalation',{assessment_stage:'ongoing',indication_id:'00776a',cycle_number:4,day_number:1,baseline_lvef_percent:55,lvef_percent:43,lvef_drop_points:4},'withhold');
const model=Output.buildModel({result:handover,protocol,assessmentId:'ENHERTU-LVEF-REVIEW',clinicianDecision:'hold',clinicianNote:'Withhold treatment. Escalate to oncology and repeat LVEF within three weeks; review outstanding assessment domains.',appVersion:'0.84.62'});
const summary=Output.toText(model);
for (const token of ['Enhertu','55','43','12','Cycle 4','Day 1','NCCP','three weeks']) assert(summary.includes(token),'Handover retains '+token);
assert(model.allRows.some(x=>x.field==='lvef_drop_points' && /12/.test(x.actual)));
const pdf=Buffer.from(Pdf.buildPdfBytes(model));assert(pdf.toString('latin1').startsWith('%PDF-1.4'));

// Production form excludes the manual delta and displays arithmetic from the same engine.
const source=fs.readFileSync(path.join(__dirname,'../js/generic-assessment-ui.js'),'utf8');
const instrumented=source.replace('root.SACTCheckGenericAssessment = Object.freeze({',`root.enhertuTest={definitions:presentationInputDefinitions,preview:refreshDerivedPreviews,render:renderInput,prepare(p,i){activeProtocol=p;activeProfileId=Engine.getProfiles(p)[0]?.id||'default';collectRawInputs=()=>i;}};root.SACTCheckGenericAssessment = Object.freeze({`);
const preview={dataset:{derivedPreview:'lvef_drop_points'},textContent:''};
const context={document:{readyState:'loading',addEventListener(){},querySelectorAll(selector){assert.equal(selector,'[data-derived-preview]');return[preview];}},SACTCheckAssessmentEngine:Engine,SACTCheckAssessmentOutput:Output,SACTCheckAssessmentPdf:Pdf};
vm.runInNewContext(instrumented,context);const ui=context.enhertuTest;
ui.prepare(protocol,{baseline_lvef_percent:55,lvef_percent:43,lvef_drop_points:4});
const visible=ui.definitions(protocol);assert(!visible.some(x=>x.id==='lvef_drop_points'));for(const f of ['baseline_lvef_percent','lvef_percent','cycle_number','day_number'])assert(visible.some(x=>x.id===f),f+' retained in form');
ui.preview();assert(preview.textContent.includes('55 − 43 = 12'));assert(ui.render(visible.find(x=>x.id==='lvef_percent'),{compact:true}).includes('data-derived-preview="lvef_drop_points"'));
ui.prepare(protocol,{lvef_percent:43});ui.preview();assert(preview.textContent.startsWith('Not calculated'));
ui.prepare(protocol,{baseline_lvef_percent:101,lvef_percent:43});ui.preview();assert(preview.textContent.startsWith('Not calculated'));
ui.prepare(protocol,{baseline_lvef_percent:55,lvef_percent:61});ui.preview();assert(preview.textContent.includes('55 − 61 = -6'));

// Authenticate the current catalogue against the fetched baseline and prove
// that opting00776 into the mixed-risk policy did not alter any other protocol.
const cp=require('node:child_process'),zlib=require('node:zlib');
const root=path.resolve(__dirname,'..');
const previousBytes=cp.execFileSync('git',['show','f3b923b247b5663b2bd90b2ffb352fccc5a347ea:protocols/catalogue-bundle.json.gz'],{cwd:root,maxBuffer:5*1024*1024,env:{...process.env,GIT_NO_LAZY_FETCH:'1'}});
const previousCatalogue=JSON.parse(zlib.gunzipSync(previousBytes));
const bundlePath='protocols/catalogue-bundle.json.gz';
const currentBundleBytes=fs.readFileSync(path.join(root,bundlePath));
const currentBundleJson=zlib.gunzipSync(currentBundleBytes);
const currentCatalogue=JSON.parse(currentBundleJson);
const olaparib=require('./helpers/patient-migration-catalogue.cjs').getMigrations().some(item => item.version === 63)?require('./helpers/retrospective-v08463.cjs'):null;
let inheritedCatalogue=currentCatalogue;
if(olaparib){
  // Authenticate the actual successor before replaying the original preservation
  // assertion against the exact inherited Enhertu tree. Only00588/00746 may
  // differ afterward, and their current source JSON must reach the live bundle.
  const inheritedBytes=olaparib.baselineBytes(bundlePath);
  olaparib.assertCurrent(bundlePath,olaparib.sha(inheritedBytes),inheritedBytes.length);
  inheritedCatalogue=JSON.parse(zlib.gunzipSync(inheritedBytes));
  const indexPath='protocols/index.json',inheritedIndexBytes=olaparib.baselineBytes(indexPath);
  const currentIndex=JSON.parse(olaparib.assertCurrent(indexPath,olaparib.sha(inheritedIndexBytes),inheritedIndexBytes.length));
  assert.equal(currentIndex.protocol_count,currentIndex.protocols.length);
  assert.equal(currentIndex.bundle.path,bundlePath);
  assert.equal(currentIndex.bundle.sha256,olaparib.sha(currentBundleJson),'Index authenticates the exact decompressed current catalogue');
  assert.equal(currentIndex.bundle.bytes,currentBundleJson.length);
  assert.equal(currentIndex.bundle.compressed_bytes,currentBundleBytes.length);
  assert.equal(currentIndex.bundle.protocol_count,currentCatalogue.records.length);
  assert.equal(currentCatalogue.schema_version,inheritedCatalogue.schema_version);
  assert.equal(currentCatalogue.records.length,currentIndex.protocol_count);
  const additions = [
    'protocols/gynaecology/00921-mirvetuximab-soravtansine-therapy.json',
    'protocols/gynaecology/00943-pembrolizumab-cisplatin-chemoradiotherapy.json'
  ];
  for (const file of additions) {
    assert(release.addition(file),file+' is an authenticated addition');
    assert(!inheritedCatalogue.records.some(record=>record.entry.path===file),file+' must be new');
    release.verifyFile(file);
  }
  assert.equal(currentCatalogue.records.length,inheritedCatalogue.records.length+additions.length);
  assert.equal(new Set(currentCatalogue.records.map(record=>record.entry.id)).size,currentCatalogue.records.length,'Current catalogue cannot duplicate a record to hide a missing protocol');
  assert.deepEqual(currentCatalogue.records.map(record=>record.entry.path).sort(),inheritedCatalogue.records.map(record=>record.entry.path).concat(additions).sort(),'Current catalogue retains every inherited protocol path and the two audited additions');
  const successors=new Set(['nccp-00588-v5b','nccp-00746-v2']);
  const gynaeCodes = ['00226', '00419', '00812', '00251', '00261', '00279', '00921', '00943',...require('./helpers/retrospective-v08465.cjs').NEW_ROUTES,...require('./helpers/retrospective-v08466.cjs').NEW_ROUTES, ...require('./helpers/retrospective-v08467.cjs').NEW_ROUTES,...require('./helpers/retrospective-v08468.cjs').NEW_ROUTES,...require('./helpers/retrospective-v08469.cjs').NEW_ROUTES,...require('./helpers/retrospective-v08470.cjs').NEW_ROUTES,...require('./helpers/retrospective-v08471.cjs').NEW_ROUTES];
  const sarcomaCodes = require('./helpers/retrospective-v08464.cjs').releaseRoutes.map(route=>route.split('/')[0]);
  const priorAstra=new Map(JSON.parse(zlib.gunzipSync(release.astraBytes(bundlePath))).records.map(r=>[r.entry.path,r]));
  for(const current of currentCatalogue.records){
    const indexed=currentIndex.protocols.find(entry=>entry.id===current.entry.id);assert(indexed,'Current record is indexed: '+current.entry.id);
    assert.deepEqual(current.entry,indexed,'Current bundle entry matches the actual index: '+current.entry.id);
    assert.deepEqual(current.protocol,JSON.parse(fs.readFileSync(path.join(root,indexed.path))),'Current bundle delivers the exact current protocol JSON: '+current.entry.id);
    const batchCode = current.protocol.metadata.nccp_regimen_code;
    if (!successors.has(current.entry.id) && !['00862','00929','00391','00392',...sarcomaCodes,...gynaeCodes].includes(batchCode)) {
      assert.deepEqual(current, priorAstra.get(current.entry.path), 'Unrelated current record equals the AstraZeneca release: ' + current.entry.id);
    }
    if(gynaeCodes.includes(batchCode))release.verifyFile(indexed.path);
    else if(successors.has(current.entry.id))olaparib.validateProtocol(current.protocol);
    else if (['nccp-00862-v2','nccp-00929-v1'].includes(current.entry.id)) require('./helpers/live-release-v08464.cjs').verifyFile(indexed.path);
    else assert.deepEqual(priorAstra.get(current.entry.path),inheritedCatalogue.records.find(record=>record.entry.path===current.entry.path),'Unrelated current protocol, including Enhertu, remains unchanged after olaparib: '+current.entry.id);
  }
}
assert.equal(inheritedCatalogue.records.length,previousCatalogue.records.length);
for(const previous of previousCatalogue.records){
  const current=inheritedCatalogue.records.find(r=>r.entry.id===previous.entry.id);assert(current);
  if(previous.entry.id==='nccp-00776-v3b')assert.deepEqual(current.protocol,protocol,'Compressed catalogue delivers the corrected clinical protocol');
  else assert.deepEqual(current,previous,'Unrelated protocol unchanged: '+previous.entry.id);
}

const report={checked_at:new Date().toISOString(),baseline_commit:'f3b923b247b5663b2bd90b2ffb352fccc5a347ea',release:'0.84.62',source:'NCCP 00776 v3b, eligibility p2 and Table3 p4; current official source verified23November2026',clinical_authorisation:'Independent clinical and oncology-pharmacy review remains pending',protocol_sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,'../protocols/breast/00776-trastuzumab-deruxtecan.json'))).digest('hex'),cases:rows,total:rows.length,passed:rows.length,failed:0,ui_and_export:'Production form and output functions passed; real browser is separately recorded'};
if(process.env.SACT_ENHERTU_REPORT){const f=path.resolve(process.env.SACT_ENHERTU_REPORT);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,JSON.stringify(report,null,2)+'\n');fs.writeFileSync(path.join(path.dirname(f),'cardiac-handover.pdf'),pdf);fs.writeFileSync(path.join(path.dirname(f),'cardiac-handover.txt'),summary);}
console.log(`${rows.length} Enhertu cardiac arithmetic/source-boundary/adversarial/mixed-risk cases, production form previews and clinical PDF/text handover passed.`);
