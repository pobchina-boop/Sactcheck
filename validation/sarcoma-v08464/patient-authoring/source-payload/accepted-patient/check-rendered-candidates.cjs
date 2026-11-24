'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=__dirname,repo=path.resolve(process.argv[2]||path.join(root,'../Sactcheck'));
const chronology=require(path.join(repo,'tools/cycle-chronology.cjs'));
const evidence=require(path.join(repo,'js/treatment-evidence-v08413.js'));
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const output=path.join(root,'render-preview');fs.mkdirSync(output,{recursive:true});const checks=[];
const kb=read('overlay/data/regimen-knowledge-base-v08464-addendum.DRAFT.json').regimen_profiles;
for(const code of ['00675','00747','00504','00754','00757']){
 const file=path.join(root,'overlay/data/patient-knowledge/'+code+'.json');const d=JSON.parse(fs.readFileSync(file));
 const chart=chronology.render(d),k=kb.find(x=>x.protocol_id===d.protocol_id),ev=evidence.render(k);
 assert(!/undefined|NaN|Infinity/.test(chart+ev));
 for(const outcome of k.evidence_at_a_glance.endpoints){assert(evidence.endpoints[outcome.endpoint]);assert(ev.includes(esc(outcome.result_text)));}
 assert.equal((ev.match(/class="evidence-outcome /g)||[]).length,k.evidence_at_a_glance.endpoints.length);
 if(k.evidence_at_a_glance.harms)assert(ev.includes(esc(k.evidence_at_a_glance.harms)));
 for(const phase of d.phase_cycles||[]){assert(chart.includes(esc(phase.label)));for(const row of phase.timeline){assert(row.start>=1&&row.end<=phase.cycle_days&&row.end>=row.start);assert(chart.includes(esc(row.text)));}}
 if(['00675','00747'].includes(code)){
  const phases=d.phase_cycles;assert.equal(phases.length,3);assert.deepEqual(phases.flatMap(x=>x.cycles).sort((a,b)=>a-b),Array.from({length:14},(_,i)=>i+1));
  assert.deepEqual(phases[0].cycles,[1,3,5,7,9,11,13]);assert.deepEqual(phases[1].cycles,[2,4,6,8,10]);assert.deepEqual(phases[2].cycles,[12,14]);
  assert(!phases[2].timeline.some(x=>x.id==='doxorubicin'));assert(phases[2].timeline.find(x=>x.id==='dactinomycin').label.includes('ONLY if selected'));
  for(const name of ['ifosfamide','etoposide']){const row=phases[0].timeline.find(x=>x.id===name);assert.deepEqual([row.start,row.end],[1,5]);}
  assert(phases.every(x=>x.cycle_days===(code==='00675'?14:21)));
  if(code==='00675')assert.deepEqual([phases[0].timeline.find(x=>x.id==='growth-factor').start,phases[0].timeline.find(x=>x.id==='growth-factor').end],[8,13]);
  else assert(phases.every(x=>!x.timeline.find(t=>t.id==='growth-factor').text.includes('8–13')));
 }
 if(code==='00754'){
  const [a,b,c]=d.phase_cycles;assert.deepEqual(a.cycles,[1,2]);assert.deepEqual(b.cycles,[3,4]);assert.deepEqual(c.cycles,[5,6,7,8,9]);
  assert.deepEqual(a.timeline.filter(x=>x.id.startsWith('vincristine')).map(x=>x.start),[1,8,15]);
  for(const p of [b,c])assert.deepEqual(p.timeline.filter(x=>x.id.startsWith('vincristine')).map(x=>x.start),[1]);
  assert(!c.timeline.some(x=>x.id==='doxorubicin'));
  for(const p of [a,b,c]){const mesna=p.timeline.find(x=>x.id==='mesna');assert.deepEqual([mesna.start,mesna.end],[1,3]);assert(mesna.text.includes('no new day-3 dose'));}
 }
 if(code==='00757'){assert(d.schedule_summary.includes('Temozolomide is taken by mouth on days 1–5: 125 mg/m² in cycle 1.'));assert(d.timeline.some(x=>x.id==='vin8'&&x.start===8&&x.end===8));}
 if(['00504','00757'].includes(code)){assert(d.monitoring_test_details.find(x=>x.label==='Liver tests').timing.includes('after every treatment cycle, including the final cycle'));assert(d.patient_summary.monitoring.some(x=>x.when.includes('liver tests also after every cycle, including the final cycle')));assert(!JSON.stringify(d.support).includes('mesna-pump'));}
 fs.writeFileSync(path.join(output,code+'-chronology.html'),'<html><head><meta charset="utf-8"><style>'+chronology.stylesheet+'</style></head><body>'+chart+'</body></html>');
 fs.writeFileSync(path.join(output,code+'-evidence.html'),'<html><head><meta charset="utf-8"></head><body>'+ev+'</body></html>');
 checks.push({code,profile_sha256:sha(file),phase_charts:d.phase_cycles?.length||1,exact_phase_calendar_checks:'pass',endpoint_cards:k.evidence_at_a_glance.endpoints.length,all_numeric_result_text_rendered:true,harms_text_rendered:!!k.evidence_at_a_glance.harms});
}
const result={scope:'External structured-content and actual chronology/evidence renderer checks; not a complete application or visual/PDF approval',checks,renderers:{chronology:sha(path.join(repo,'tools/cycle-chronology.cjs')),evidence:sha(path.join(repo,'js/treatment-evidence-v08413.js'))},clinical_final_source_freeze:read('overlay/draft-integration/draft-checks.json').clinical_freeze,independent_clinical_approval:false};fs.writeFileSync(path.join(root,'rendered-candidate-checks.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
