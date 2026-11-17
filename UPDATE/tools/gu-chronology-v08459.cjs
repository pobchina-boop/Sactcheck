'use strict';
const previous=require('./adt-chronology-v08454.cjs');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(d){
 if(d.code!=='00453'||d.suite_release!=='0.84.59')return previous.render(d);
 if(d.relative_day_origin!==-5)throw Error('Transplant chronology requires explicit day origin');
 const days=Array.from({length:14},(_,i)=>i-5);
 const axis=days.map(n=>`<span class="wiki-cycle-day">${n>0?'+':''}${n}</span>`).join('');
 const rows=d.timeline.map(r=>`<div class="wiki-cycle-track"><span class="wiki-cycle-label">${esc(r.label)}</span><span class="wiki-cycle-band treatment" style="grid-column:${r.start+1}/${r.end+2}">${esc(r.text)}</span></div>`).join('');
 return `<div id="wikiCycleChronology" class="wiki-cycle-map" data-cycle-days="14" data-day-origin="-5" style="--cycle-days:14"><h3>Days relative to your stem-cell infusion</h3><p class="wiki-cycle-intro">Day 0 is the stem-cell infusion. Negative days come before it; positive days come afterwards.</p><p class="wiki-cycle-schedule">${esc(d.schedule_summary)}</p><div class="wiki-cycle-scroll" tabindex="0" role="region" aria-label="Conditioning and stem-cell rescue timeline"><div class="wiki-cycle-chart"><div class="wiki-cycle-axis"><span class="wiki-cycle-label">Transplant day</span>${axis}</div>${rows}</div></div><p class="wiki-cycle-warning">Recovery can extend beyond this reference diagram. It does not set a discharge date or automatically schedule another high-dose cycle.</p></div>`;
}
module.exports={...previous,render};
