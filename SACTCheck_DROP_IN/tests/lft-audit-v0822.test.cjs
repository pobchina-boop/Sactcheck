'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),Lab=require('../js/local-lab-profile'),Engine=require('../js/assessment-engine');
const rows=[],protocolRows=[];let protocolCount=0;
function directories(dir){return fs.readdirSync(dir,{withFileTypes:true}).filter(e=>e.isDirectory()).flatMap(e=>{const p=path.join(dir,e.name);return [p,...directories(p)];});}
for(const dir of directories(path.join(root,'protocols'))){
 const group=path.relative(path.join(root,'protocols'),dir);
 for(const filename of fs.readdirSync(dir).filter(f=>f.endsWith('.json'))){
  protocolCount++;const p=JSON.parse(fs.readFileSync(path.join(dir,filename))),raw=p.input_definitions||p.assessment?.inputs||{};
  const defs=Array.isArray(raw)?raw:Object.entries(raw).map(([id,d])=>({...d,id}));
  const local=[];
  for(const d of defs){
   const sig=`${d.id} ${d.label||''}`.toLowerCase();
   if(!/bilirubin|transamin|(?:^|[ _/])(alt|ast|alp)(?:[ _/]|$)|alk_phos|alkaline phosphatase/.test(sig))continue;
   const adapter=Lab.adapterFor(d);const ratio=d.type==='number'&&/uln/.test(d.id);
   if(ratio)assert(adapter,`${filename}: unmapped LFT ratio ${d.id}`);
   if(d.type!=='number')assert.equal(adapter,null,'Categories and clinical judgements must not be converted');
   if(d.unit==='U/L'||d.unit==='µmol/L')assert.equal(adapter,null,`Already-absolute field ${d.id} must not be divided twice`);
   if(adapter){
    const settings={...Lab.defaults,alpUln:120};const values=Object.fromEntries(adapter.analytes.map(a=>[a.id,settings[a.setting]*2]));
    assert.equal(Lab.calculate(d,values,settings).ratio,2);
    for(const a of adapter.analytes){assert.equal(Lab.calculate(d,{[a.id]:settings[a.setting]*2},settings).ratio,2);}
   }
   local.push({field:d.id,type:d.type,unit:d.unit||'',status:adapter?'automatic actual → ×ULN':d.type==='number'?'absolute/other numeric — unchanged':'categorical/clinical — unchanged',analytes:adapter?.analytes.map(a=>a.label).join(' / ')||''});
  }
  for(const item of local)rows.push({group,protocol:filename.replace('.json',''),...item});
  protocolRows.push({group,protocol:filename.replace('.json',''),automatic:local.filter(d=>d.status.startsWith('automatic')).length,fields:local});
 }
}
assert.equal(protocolCount,379);
const automaticDefinitions=rows.filter(r=>r.status.startsWith('automatic')).length; assert(automaticDefinitions >=450);
Lab.reset();Lab.write({altUln:39,astUln:47,bilirubinUln:22,alpUln:130,creatinineUln:105});
Lab.selectProfile('male');assert.equal(Lab.read().altUln,40);assert.equal(Lab.read().astUln,40);assert.equal(Lab.read().creatinineUln,105);assert.equal(Lab.read().alpUln,130);
Lab.selectProfile('female');assert.equal(Lab.read().altUln,34);assert.equal(Lab.read().astUln,42);
Lab.selectProfile('custom');assert.equal(Lab.read().altUln,39);assert.equal(Lab.read().astUln,47);assert.equal(Lab.read().bilirubinUln,22);
Lab.write({altUln:'',astUln:-1});assert.equal(Lab.read().altUln,39);assert.equal(Lab.read().astUln,47);
Lab.reset();assert.equal(Lab.calculate('alp_uln_multiple',{}),null);assert.equal(Lab.calculate('alp_uln_multiple',{alp:200}).invalid,true);
Lab.write({alpUln:120});assert.equal(Lab.calculate('alp_uln_multiple',{alp:300}).ratio,2.5);
const source=fs.readFileSync(path.join(root,'js/local-lab-profile.js'),'utf8');let stored=JSON.stringify({altUln:44,astUln:49,bilirubinUln:23});
const storage={getItem(){return stored;},setItem(k,v){stored=v;},removeItem(){stored=null;}};
const ctx={localStorage:storage};vm.runInNewContext(source,ctx);assert.equal(ctx.SACTCheckLocalLab.read().lftProfile,'custom');assert.equal(ctx.SACTCheckLocalLab.read().altUln,44);
ctx.SACTCheckLocalLab.selectProfile('male');const ctx2={localStorage:storage};vm.runInNewContext(source,ctx2);assert.equal(ctx2.SACTCheckLocalLab.read().lftProfile,'male');ctx2.SACTCheckLocalLab.selectProfile('custom');assert.equal(ctx2.SACTCheckLocalLab.read().altUln,44);
const p=require('../protocols/lung/00568-pembrolizumab-pemetrexed-and-carboplatin-auc5-therapy.json');
for(const profile of ['female','male']){
 Lab.selectProfile(profile);const uln=Lab.read().altUln;
 for(const [value,hit] of [[3*uln-0.00001,false],[3*uln,false],[3*uln+0.00001,true]]){
  const n=Lab.calculate('alt_ast_uln_multiple',{alt:value});assert.equal(n.ratio,value/uln);
  const result=Engine.assess(p,{alt_ast_uln_multiple:n.ratio});assert.equal(result.findings.some(f=>(f.ruleId||f.id)==='ICI_HEPATITIS_WITHHOLD'),hit);
 }
 for(const [value,hit] of [[29.99999,false],[30,false],[30.00001,true]]){
  const result=Engine.assess(p,{bilirubin_uln_multiple:Lab.calculate('bilirubin_uln_multiple',{bilirubin:value}).ratio});assert.equal(result.findings.some(f=>(f.ruleId||f.id)==='ICI_BILI_WITHHOLD'),hit);
 }
}
// Exercise production form collection with profile changes, ALP, disabled/blank and invalid input.
let extraInputs=null;
let input={dataset:{labTarget:'alt_ast_uln_multiple',labAnalyte:'alt'},value:'120',disabled:false};
const document={readyState:'loading',addEventListener(){},querySelectorAll(s){return s.includes('data-lab-target')?(extraInputs||[input]):[];}};
let ui=fs.readFileSync(path.join(root,'js/generic-assessment-ui.js'),'utf8').replace('root.SACTCheckGenericAssessment = Object.freeze({','root.__test={collectRawInputs,buildControl,setProtocol(p){activeProtocol=p;}};\nroot.SACTCheckGenericAssessment = Object.freeze({');
const context={document,SACTCheckAssessmentEngine:Engine,SACTCheckLocalLab:Lab,SACTCheckAssessmentOutput:{},SACTCheckAssessmentPdf:{}};vm.runInNewContext(ui,context);context.__test.setProtocol(p);
Lab.selectProfile('female');assert.equal(Number(context.__test.collectRawInputs().alt_ast_uln_multiple),120/34);
Lab.selectProfile('male');assert.equal(Number(context.__test.collectRawInputs().alt_ast_uln_multiple),3);
input.disabled=true;assert.equal(context.__test.collectRawInputs().alt_ast_uln_multiple,undefined);input.disabled=false;input.value='';assert.equal(context.__test.collectRawInputs().alt_ast_uln_multiple,undefined);
input.value='-1';assert(Engine.assess(p,context.__test.collectRawInputs()).invalid.length>0);
const alp=protocolRows.find(r=>r.fields.some(d=>d.field==='alp_uln_multiple'));
context.__test.setProtocol(JSON.parse(fs.readFileSync(path.join(root,'protocols',alp.group,alp.protocol+'.json'))));input={dataset:{labTarget:'alp_uln_multiple',labAnalyte:'alp'},value:'300',disabled:false};Lab.write({alpUln:null});let inputs=context.__test.collectRawInputs();assert.equal(inputs.alp_uln_multiple,'NaN');Lab.write({alpUln:120});assert.equal(Number(context.__test.collectRawInputs().alp_uln_multiple),2.5);
// Exercise the real UI renderer and collector for every mapped definition, including
// label-sensitive combined fields, component aliases and nested haem protocols.
Lab.reset();Lab.write({alpUln:120});let uiCount=0;
for(const item of protocolRows){
 const protocol=JSON.parse(fs.readFileSync(path.join(root,'protocols',item.group,item.protocol+'.json')));context.__test.setProtocol(protocol);
 const raw=protocol.input_definitions||protocol.assessment?.inputs||{};
 for(const row of item.fields.filter(f=>f.status.startsWith('automatic'))){
  const def=Array.isArray(raw)?raw.find(d=>d.id===row.field):{...raw[row.field],id:row.field};
  const adapter=Lab.adapterFor(def),settings=Lab.read();
  extraInputs=adapter.analytes.map((a,i)=>({dataset:{labTarget:row.field,labAnalyte:a.id},value:String(settings[a.setting]*(i+2)),disabled:false}));
  assert.match(context.__test.buildControl(def),/data-lab-analyte/);
  assert.equal(Number(context.__test.collectRawInputs()[row.field]),adapter.highest?adapter.analytes.length+1:2,`${item.protocol}/${row.field} UI conversion`);uiCount++;
 }
}
extraInputs=null;assert.equal(uiCount,automaticDefinitions);
Lab.reset();
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify({protocolCount,automaticDefinitions,automaticRegimens:protocolRows.filter(p=>p.automatic).length,protocolRows,rows},null,2));
console.log(`LFT audit passed: ${protocolCount} protocols, ${automaticDefinitions} ratio definitions in ${protocolRows.filter(p=>p.automatic).length} regimens; profile migration/persistence, exact boundaries, partial/invalid inputs and ALP conversion passed.`);
