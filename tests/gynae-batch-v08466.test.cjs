'use strict';
const assert=require('node:assert/strict'), fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const bytes=f=>fs.readFileSync(path.join(root,f));
const engine=require('../js/assessment-engine'),registry=require('../js/patient-asset-registry-v0810');
const labs=require('../js/local-lab-profile');
assert.equal(labs.calculate('taxane_alt_multiple',{alt:70,ast:400},{...labs.read(),altUln:35}).ratio,2);
const codes=['00620','00716','00769','00771','00772'];
const protocols=Object.fromEntries([...codes,'00303','00306','00308','00624','00819'].map(c=>[c,read('protocols/gynaecology/'+fs.readdirSync(path.join(root,'protocols/gynaecology')).find(f=>f.startsWith(c+'-')))]));
const cfg=read('data/phase-support-v0838.json'),src=read('validation/gynae-v08466/sources.json'),workflow=read('data/regimen-workflow-v0750.json');
let boundaries=0,visits=0;
function test(c,input,id,expected=true){
 const r=engine.assess(protocols[c],input);assert.deepEqual(r.invalid,[],c+' '+JSON.stringify(input));assert.deepEqual(r.errors,[]);
 assert.equal(r.findings.some(v=>v.ruleId===id),expected,[c,id,JSON.stringify(input)].join(' '));boundaries++;
}
for(const c of codes){
 assert.deepEqual(registry.bundleRoutes(c),[c]);
 assert.equal(engine.assess(protocols[c],{}).actionType,'incomplete');
 const f='validation/gynae-v08466/sources/'+c+'.pdf';
 assert.equal(crypto.createHash('sha256').update(bytes(f)).digest('hex'),src[c].sha256);
 for(const [v,e] of [[150,false],[151,true]])test(c,{systolic_bp:v},'BEV_RECHECK_systolic_bp',e);
 test(c,{uncontrolled_or_symptomatic_bp:true},'BEV_BP_CONFIRMED');test(c,{uncontrolled_or_symptomatic_bp:false},'BEV_BP_CONFIRMED',false);
 test(c,{clinically_significant_bleeding:true},'BEV_CLASSIFY_clinically_significant_bleeding');test(c,{clinically_significant_bleeding:true},'BEV_VASCULAR_STOP',false);
 if(['00620','00716'].includes(c)){
  for(const [v,stop,caution] of [[20,true,false],[20.1,false,true],[30,false,true],[30.1,false,false]]){
   test(c,{gfr_or_crcl_ml_min:v},'CARBO_NO_DOSE',stop);test(c,{gfr_or_crcl_ml_min:v},'CARBO_CAUTION',caution);
  }
  for(const [v,e] of [[99,true],[100,false]])test(c,{platelets:v},'PLATELET_HOLD',e);
  test(c,{platelets:88,treatment_visit:'maintenance'},'PLATELET_HOLD',false);
  test(c,{platelets:88,treatment_visit:'combination'},'PLATELET_HOLD');
  test(c,{first_cycle_within_four_weeks_surgery:true},'BEV_POSTOP');
 }else{
  for(const [v,hold,stop] of [[2,false,false],[2.1,true,false],[4,true,false],[4.1,false,true]]){
   test(c,{urine_protein_g_24h:v},'BEV_URINE_HOLD',hold);test(c,{urine_protein_g_24h:v},'BEV_URINE_STOP',stop);
  }
  test(c,{urine_dipstick:3},'BEV_DIP_CONFIRM');test(c,{urine_dipstick:4},'BEV_DIP_HOLD');
 }
}
for(const [v,e] of [[69,true],[70,false]])test('00769',{platelets:v},'PLT_HOLD',e);
for(const [v,e] of [[69,false],[70,true],[90,true],[91,false]])test('00769',{platelets:v},'PLT_BAND',e);
for(const [v,e] of [[8.9,true],[9,false]])test('00771',{haemoglobin:v},'TOPO_HOLD_haemoglobin',e);
for(const [v,e] of [[171,false],[172,true]])test('00771',{bilirubin_umol_l:v},'TOPO_BILI',e);
test('00771',{topotecan_renal_band:'20_39'},'TOPO_RENAL');test('00771',{topotecan_renal_band:'ge40'},'TOPO_RENAL',false);
assert.equal(protocols['00771'].treatment.cycle_length_days,28);
for(const [v,id] of [[20,'PLD_BILI75'],[50,'PLD_BILI75'],[51,'PLD_BILI_GAP'],[52,'PLD_BILI50'],[86,'PLD_BILI50'],[87,'PLD_BILI_STOP']]){
 for(const k of ['PLD_BILI75','PLD_BILI_GAP','PLD_BILI50','PLD_BILI_STOP'])test('00772',{bilirubin_umol_l:v},k,k===id);
}
test('00772',{stomatitis_grade:3,pld_delay_weeks:2},'stomatitis_grade_STOP');
test('00772',{stomatitis_grade:3,pld_delay_weeks:1},'stomatitis_grade_HOLD');
for(const c of [...codes,'00303','00306','00308','00624','00819']){
 const p=read('data/patient-knowledge/'+c+'.json'),dir='patient/'+c+'/';const html=bytes(dir+'consent-form.html').toString();
 assert.equal((html.match(/class="agent"/g)||[]).length,p.agents.length);p.agents.forEach(a=>assert(html.includes('<h3>'+a.name+'</h3>')));
 for(const ph of cfg.regimens[c]){
  const stem='antiemetic-'+ph.id;
  const selector=workflow.supportive_phase_selectors[c];
  const protocol=protocols[c];
  const live=require('../js/regimen-workflow-engine-v0750').buildManifest(protocol,workflow,{},ph.id);
  const takeHome=ph.medicines.find(item=>item.name==='Metoclopramide');
  if (ph.emetogenic_risk==='high') {
   assert.match(takeHome.timing,/Subsequent days as prescribed/);
   assert.equal(live.supportiveCare.subsequent.find(item=>item.medicine==='Metoclopramide').timing,'Subsequent days as prescribed');
  }
  if (ph.emetogenic_risk==='low') assert.match(takeHome.timing,/PRN/);
  if (codes.includes(c) && ph.active_medicines.includes('bevacizumab')) {
   assert(live.interactionOverrides.some(item=>item.id==='nccp_'+c+'_medication_review' && item.source.url===selector.source_url));
  }
  if (ph.active_medicines.length===1 && ph.active_medicines[0]==='bevacizumab') {
   assert(!live.interactionOverrides.some(item=>item.id==='nccp_'+c+'_taxane_review'));
  }
  assert(workflow.supportive_phase_selectors[c].phases.some(v=>v.id===ph.id));
  assert(bytes(dir+'antiemetic-prescriptions.html').toString().includes('download href="'+stem+'.pdf"'));
  const pdf=bytes(dir+stem+'.pdf');assert(pdf.subarray(0,5).equals(Buffer.from('%PDF-')));assert(pdf.equals(bytes('docs/'+dir+stem+'.pdf')));
  visits++;
 }
}
console.log(boundaries+' source-boundary checks, '+visits+' phase-specific prescription PDFs and ten agent-table consents passed.');
