'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),chronology=require('../tools/cycle-chronology.cjs');
const profile=code=>JSON.parse(fs.readFileSync(path.join(root,`data/patient-knowledge/${code}.json`),'utf8'));
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const band=(chart,id)=>chart.match(new RegExp(`data-cycle-track="${id}"[\\s\\S]*?class="wiki-cycle-band[^\"]*"[^>]*>([\\s\\S]*?)</span>`))?.[1];

test('the 48-hour 00555 pump and 46-hour 00691 pump retain their authored instructions',()=>{
 for(const [code,hours] of [['00555',48],['00691',46],['00209',46]]){
  const d=profile(code),row=d.timeline.find(r=>r.id==='pump'),before=JSON.stringify(d),chart=chronology.render(d);
  assert.match(row.text,new RegExp(`^${hours} hours;`));
  assert.equal(band(chart,'pump'),esc(row.text),`${code}: chart must retain duration and disconnection instruction`);
  assert.equal(JSON.stringify(d),before,'rendering must not alter clinical profile data');
 }
});

test('different phases preserve their own pump durations and complete instructions',()=>{
 const d=profile('00555'),row=d.timeline.find(r=>r.id==='pump');
 d.phase_cycles=[
  {label:'First phase',cycle_days:14,schedule_summary:'First-phase schedule',timeline:[{...row,text:'46 hours; first-phase disconnect instruction'}]},
  {label:'Second phase',cycle_days:14,schedule_summary:'Second-phase schedule',timeline:[{...row,text:'48 hours; second-phase disconnect instruction'}]}
 ];
 const chart=chronology.render(d);
 for(const phase of d.phase_cycles)assert(chart.includes(`>${esc(phase.timeline[0].text)}</span>`));
 assert.equal((chart.match(/data-cycle-track="pump"/g)||[]).length,2);
});

test('every configured reference chronology retains each regimen and phase band text',()=>{
 const config=require('../data/patient-presentation-v08431.json');let checked=0;
 for(const [route,file] of Object.entries(config.routes)){
  const d=JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
  if(!d.timeline||!d.cycle_days)continue;
  const chart=chronology.render(d),phases=Array.isArray(d.phase_cycles)&&d.phase_cycles.length?d.phase_cycles:[d];
  for(const phase of phases)for(const row of phase.timeline){
   if(!row.text)continue;
   assert(chart.includes(`>${esc(row.text)}</span>`),`${route}: omitted band text for ${row.id}`);checked++;
  }
 }
 assert(checked>200,'exercise the full configured collection, rather than only two pump examples');
});
