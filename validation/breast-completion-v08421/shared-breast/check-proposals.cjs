/* Source-specific proposal checks; does not modify live content. */
const fs=require('fs'),path=require('path'),assert=require('assert');
const here=__dirname,root=path.resolve(here,'../../..');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const A=read(path.join(here,'authoring.json'));
const dose=require(path.join(root,'js/protocol-dose-schedule.js'));
const ev=require(path.join(root,'js/treatment-evidence-v08413.js'));
let checks=0;function check(value,message){assert(value,message);checks++;}
function findProtocol(c){for(const d of ['breast','shared']){const folder=path.join(root,'protocols',d);const f=fs.readdirSync(folder).find(n=>n.startsWith(c+'-')&&n.endsWith('.json'));if(f)return read(path.join(folder,f));}throw Error(c);}
check(JSON.stringify(Object.keys(A.regimens))===JSON.stringify(['00203','00205','00226','00228','00588','00621']),'six exact retrospective codes');
check(A.clinical_use_authorised===false,'proposal governance');
for(const [c,a] of Object.entries(A.regimens)){
 const p=a.patient,sources=new Set(p.sources.map(s=>s.id));
 check(p.evidence.metrics.length===0,c+' qualitative patient evidence');
 check(!/13\.1 versus 10\.6|79\.6%|89\.8%|42%|HR 0\.|hazard ratio/i.test(JSON.stringify(p)),c+' no quantitative trial evidence leakage');
 check(p.longitudinal_mapping===true,c+' longitudinal');
 check(p.monitoring_schedule.columns.length===5,c+' five full-course milestones');
 check(p.monitoring_schedule.rows.every(r=>r.cells.length===5),c+' complete monitoring cells');
 check(a.journey.lanes.every(r=>r.cells.length===5),c+' complete journey lanes');
 check(a.clinical.baseline.length>0&&a.clinical.ongoing.length>0,c+' clinician monitoring');
 check(p.anatomy.length>0&&p.logistics,c+' full-service anatomy and logistics');
 check(a.support_plans.length>0&&a.support_plans.every(s=>s.additional_support.length>0),c+' support plans');
 check(a.evidence.endpoints.every(e=>ev.endpoints[e.endpoint]),c+' endpoint renderer compatibility');
 check(ev.render({treatment_rationale:a.clinical.rationale,evidence_at_a_glance:a.evidence}).includes('Evidence at a glance'),c+' clinician evidence renders');
 function walk(x){if(Array.isArray(x)){x.forEach(walk);return;}if(!x||typeof x!=='object')return;if(x.source_ids)for(const id of x.source_ids)check(sources.has(id),c+' patient source '+id);Object.values(x).forEach(walk);}
 walk(p);
 check(p.protocol_id===findProtocol(c).protocol_id,c+' stable protocol identity');
 check(String(p.protocol_version)===String(findProtocol(c).metadata.nccp_version),c+' exact source version');
}
check(A.regimens['00588'].patient.service_kind==='targeted','00588 targeted routing');
check(A.regimens['00588'].patient.scope_note.includes('early breast cancer'),'00588 explicit breast scope');
check(A.regimens['00588'].selector.settings.includes('adjuvant'),'00588 adjuvant selector');
check(fs.readFileSync(path.join(root,'patient/00588/scope.html'),'utf8').includes('00588'),'00588 scope gateway retained');
check(!A.regimens['00203'].patient.sources.some(s=>/herceptin/i.test(s.title+' '+s.url)),'00203 wrong Herceptin reference removed');
check(!A.regimens['00621'].patient.sources.some(s=>/herceptin/i.test(s.title+' '+s.url)),'00621 wrong Herceptin reference removed');
check(A.regimens['00621'].evidence.endpoints.length===0,'00621 no invented exact-schedule efficacy');
check(A.regimens['00226'].patient.phase_cycles.length===2,'00226 distinct weekly alternatives');
for(const c of ['00526','00798']){
 const p=read(path.join(here,'proposed',c+'-schedule.json')),original=findProtocol(c),model=dose.buildModel(p);
 for(const key of ['rule_engine','input_definitions','required_inputs','indications','supportive_care','clinical_governance'])check(JSON.stringify(p[key])===JSON.stringify(original[key]),c+' unchanged '+key);
 check(p.metadata.validation.clinical_use_authorised===false,c+' remains unauthorised');
 check(model.phases.length===4&&model.phases.every(p=>p.complete),c+' four complete route/phase tables');
 for(const phase of p.treatment_phases){
  const vin=phase.administration.filter(x=>x.drug==='Vinorelbine'),loading=phase.phase_id.endsWith('cycle1'),iv=phase.route_alternative==='IV';
  check(phase.cycle_length_days===21,c+' q21');check(vin.length===1,c+' one vinorelbine route per alternative');
  check(JSON.stringify(vin[0].days)==='[1,8]',c+' vinorelbine Days1,8 only');
  check(vin[0].route===(iv?'IV':'PO'),c+' route distinction');
  check(vin[0].dose===(iv?(loading?'25 mg/m²':'30 mg/m²'):'60 mg/m² (maximum 120 mg)'),c+' source starting/default dose');
  check(/consultant|physician/.test(vin[0].note),c+' escalation decision explicit');
  if(!iv)check(vin[0].note.includes('80 mg/m²')&&vin[0].note.includes('160 mg')&&vin[0].note.includes('no automatic escalation'),c+' oral optional dose and cap');
  if(c==='00526'){
   check(phase.administration[0].dose===(loading?'840 mg':'420 mg'),c+' pertuzumab load/maintenance');
   check(phase.administration[1].dose===(loading?'8 mg/kg':'6 mg/kg'),c+' trastuzumab load/maintenance');
  }else{
   check(phase.administration[0].dose===(loading?'1200 mg/600 mg':'600 mg/600 mg'),c+' fixed Phesgo dose');
   check(phase.administration[0].route==='SC',c+' Phesgo SC');
   check(phase.administration[0].note.includes(loading?'8 minutes':'5 minutes'),c+' injection time');
   check(phase.administration[0].note.includes(loading?'30 minutes AFTER':'15 minutes AFTER'),c+' observation after injection');
  }
 }
}
fs.writeFileSync(path.join(here,'proposal-check-results.json'),JSON.stringify({checked:'2026-10-25',checks,passed:checks,failed:0,scope:'Bounded source and schema proposal checks; clinical/pharmacy review remains pending.'},null,2)+'\n');
console.log(`${checks} source and proposal checks passed.`);
