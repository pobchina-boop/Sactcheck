'use strict';
// Exercises the integrated production workflow and exact source-authored plans.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
require(path.join(root,'js/sactcheck-release.js'));
const engine=require(path.join(root,'js/regimen-workflow-engine-v0750.js'));
const proposal=read('validation/head-neck-v08447/clinician-authoring/workflow-proposals.json');
const data=read('data/regimen-workflow-v0750.json');
for(const [c,e]of Object.entries(proposal.supportive_phase_selectors))assert.deepEqual(data.supportive_phase_selectors[c],e);
for(const [id,p]of Object.entries(proposal.antiemetic_plans))assert.deepEqual(data.antiemetic_plans[id],p);
const results=[];let count=0;
const check=(v,label)=>{assert(v,label);count++;};
const protocols=fs.readdirSync(path.join(root,'protocols/head-neck')).filter(f=>f.endsWith('.json')).map(f=>read('protocols/head-neck/'+f));
const get=c=>protocols.find(p=>String(p.metadata.nccp_regimen_code).padStart(5,'0')===c);
for(const [code,entry]of Object.entries(proposal.supportive_phase_selectors)){
 const p=get(code);check(Boolean(p),code+' protocol exists');
 check(engine.buildManifest(p,data,{level:'high'}).supportiveCare.status==='phase_review_required',code+' selection required');
 for(const phase of entry.phases){
  const m=engine.buildManifest(p,data,{level:'high'},phase.id),plan=m.supportiveCare;
  check(plan.planId===phase.plan_id,code+' exact plan');assert.deepEqual(m.components,phase.active_medicines);count++;
  check(plan.local_prescription_items.length===0,code+' no inherited local adjuncts');
  check(plan.risk_level===(code==='00696'||phase.id==='cetuximab_only'||phase.id==='maintenance'?'low':'high'),code+' correct visit risk');
  if(phase.id==='cetuximab_only'||phase.id==='maintenance'){
   check(!plan.day1.some(x=>['Aprepitant','Olanzapine'].includes(x.medicine)),code+' weekly no high-risk carry-over');
   check(!m.components.includes('cisplatin')&&!m.components.includes('carboplatin')&&!m.components.includes('fluorouracil'),code+' no chemotherapy component in weekly visit');
  }
  results.push({code,phase:phase.id,plan:plan.planId,risk:plan.risk_level});
 }
 check(engine.buildManifest(p,data,{level:'high'},'not-a-phase').supportiveCare.status==='phase_review_required',code+' invalid selection fails closed');
 const changed={...p,metadata:{...p.metadata,nccp_version:'future'}};
 check(engine.buildManifest(changed,data,{level:'phase_dependent'},entry.phases[0].id).supportiveCare.status==='phase_review_required',code+' future version cannot inherit prescription');
}
const a=engine.buildManifest(get('00696'),data,{level:'low'},'combination').supportiveCare;
check(a.day1.filter(x=>x.medicine==='Dexamethasone').length===1,'One combined-day steroid');
check(a.day1.filter(x=>x.medicine==='Chlorphenamine').length===1,'One combined-day antihistamine');
check(a.day1.find(x=>x.medicine==='Dexamethasone').dose==='8 mg','Combined-day steroid source dose');
const b=engine.buildManifest(get('00696'),data,{level:'low'},'paclitaxel_only').supportiveCare;
check(!b.day1.some(x=>x.medicine==='Dexamethasone'),'No routine Day 8 steroid');
check(b.warnings.some(x=>/previous reaction/.test(x)),'Conditional Day 8 steroid advice retained');
check(b.subsequent.every(x=>x.medicine!=='Dexamethasone'),'No moderate-risk delayed Day 8 steroid');
check(proposal.emetogenic_risk_protocol_updates['00696'].level==='low','Whole-regimen 00696 low risk');
const blank=engine.buildManifest(get('00314'),data,{level:'high'},'treatment').supportiveCare;
check(blank.day1.length===1&&/complete/.test(blank.day1[0].dose),'Four-day schedule deliberately unfilled');
check(blank.subsequent.length===0,'No invented multiday dosing');
check(!engine.buildManifest(get('00552'),data,{level:'high'},'adjuvant').supportiveCare.day1.some(x=>x.medicine==='Olanzapine'),'Dedicated carboplatin does not inherit olanzapine');
const out={status:'passed',checks:count,scope:'Exact source-authored plans compared with integrated data and exercised through production buildManifest; browser/PDF evidence is separate.',results};
fs.writeFileSync(path.join(root,'validation/head-neck-v08447/workflow-check-results.json'),JSON.stringify(out,null,2)+'\n');
console.log(`${count} integrated workflow checks passed.`);
