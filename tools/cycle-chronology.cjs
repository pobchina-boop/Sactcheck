'use strict';
// Use the accepted 00568 chart's actual CSS, keeping future visual drift detectable.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const reference=fs.readFileSync(path.join(root,'assets/patient/hcc-connectors-v0763.js'),'utf8');
const start=reference.indexOf('      .wiki-cycle-map{');
const end=reference.indexOf('\n\n      .wiki-safety-dock',start);
if(start<0||end<0)throw new Error('The 00568 reference chronology styles could not be found.');
const referenceStyles=reference.slice(start,end);
const stylesheet=`/* Generated from the accepted 00568 chronology. No calendar controls. */\n${referenceStyles}\n.wiki-cycle-map{font:16px/1.58 system-ui,-apple-system,Segoe UI,sans-serif}\n.wiki-cycle-axis,.wiki-cycle-track{grid-template-columns:190px repeat(var(--cycle-days,21),minmax(24px,1fr))}\n.wiki-cycle-band.single-day{padding:5px 2px;justify-content:center}\n.wiki-cycle-schedule{margin:0 0 12px;color:#536c78}\n.wiki-cycle-warning{margin:14px 0 0;padding:12px 14px;border-left:4px solid #ad3448;background:#fff1f3;color:#6a2432;border-radius:8px}\n@media print{.wiki-cycle-map{box-shadow:none}.wiki-cycle-scroll{overflow:visible}.wiki-cycle-chart{min-width:0}.wiki-cycle-axis,.wiki-cycle-track{grid-template-columns:125px repeat(var(--cycle-days,21),minmax(0,1fr))}.wiki-cycle-band{font-size:7pt;padding:3px;white-space:normal}.wiki-cycle-day{font-size:6pt}}\n`;
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const styles={treatment:'infusion',early:'early',variable:'variable',bowel:'bowel',cumulative:'cumulative'};
function render(d){
 if(d.phase_cycles?.length)return `<div class="phase-cycle-maps">${d.phase_cycles.map((p,i)=>`<section aria-label="${esc(p.label)}"><h2>${esc(p.label)}</h2>${render({...d,...p,phase_cycles:null,chronology_id:i?`wikiCycleChronology-phase-${i+1}`:'wikiCycleChronology'})}</section>`).join('')}</div>`;
 const days=Array.from({length:d.cycle_days},(_,i)=>`<span class="wiki-cycle-day">${i+1}</span>`).join('');
 const tracks=d.timeline.map(r=>{
  const text=r.id==='pump'?'46-hour pump':r.style==='treatment'&&r.start===r.end?(r.text||'IV'):r.text;
  const label=r.id==='treatment22'?'Paclitaxel Day 22 · if prescribed':r.label;
  return `<div class="wiki-cycle-track" data-cycle-track="${esc(r.id)}"><span class="wiki-cycle-label">${esc(label)}</span><span class="wiki-cycle-band ${styles[r.style]||'variable'}${r.style==='treatment'&&r.start===r.end?' single-day':''}" style="grid-column:${r.start+1} / ${r.end+2}">${esc(text)}</span></div>`;
 }).join('');
 const refs=d.sources.filter(s=>(d.timeline_source_ids||[]).includes(s.id)).map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a>`).join(' · ');
 return `<div id="${esc(d.chronology_id||'wikiCycleChronology')}" class="wiki-cycle-map" data-cycle-days="${d.cycle_days}" style="--cycle-days:${d.cycle_days}"><h3>Day 1 → Day ${d.cycle_days}: a general pattern</h3><p class="wiki-cycle-intro">This is a visual orientation, not a prediction of your personal cycle. It shows when some effects often emerge and which effects are <strong>not</strong> tied to a particular day.</p><p class="wiki-cycle-schedule">${esc(d.schedule_summary)}</p><div class="wiki-cycle-scroll" tabindex="0" role="region" aria-label="General ${d.cycle_days}-day treatment pattern"><div class="wiki-cycle-chart"><div class="wiki-cycle-axis"><span class="wiki-cycle-label">Day of cycle</span>${days}</div>${tracks}</div></div><div class="wiki-cycle-key">${d.chronology_notes.map(n=>`<div><strong>${esc(n.title)}:</strong> ${esc(n.text)}</div>`).join('')}</div><div class="wiki-cycle-evidence"><strong>Why these bands stay broad:</strong> ${esc(d.timeline_note)} Band length does not show likelihood or severity, and the chart cannot tell you whether it is safe to receive treatment. ${refs}</div><p class="wiki-cycle-warning"><strong>There are no guaranteed “safe days”.</strong> ${esc(d.safety_note.replace(/^There are no guaranteed safe days\.\s*/,''))}</p></div>`;
}
module.exports={render,stylesheet,referenceStyles};
