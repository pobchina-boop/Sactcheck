'use strict';
const previous=require('./adt-chronology-v08452.cjs');
const expected={'00478':28,'00488':168,'00489':28,'00490':28,'00491':168,'00479':84};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function current(d){return (d.suite_release==='0.84.53'||d.retrospective_audit_v08453)&&d.schedule_kind==='depot'&&expected[d.code]===d.cycle_days;}
function isDepot(d){return current(d)||previous.isDepot(d);}
function render(d){
 if(!current(d))return previous.render(d);
 const weeks=d.cycle_days/7,step=weeks===24?2:1,columns=weeks/step;
 const axis=Array.from({length:columns},(_,i)=>'<span class="wiki-cycle-day">'+(step===1?'Week '+(i+1):'Weeks '+(i*step+1)+'–'+((i+1)*step))+'</span>').join('');
 return '<div id="'+esc(d.chronology_id||'wikiCycleChronology')+'" class="wiki-cycle-map" data-cycle-days="'+d.cycle_days+'" data-axis-unit="week" data-weeks-per-column="'+step+'" style="--cycle-days:'+columns+'"><h3>Your '+weeks+'-week injection interval</h3><p class="wiki-cycle-intro">One injection or implant on Day 1. The medicine continues working between visits. '+(step===2?'Each column spans two weeks.':'Each column spans one week.')+'</p><p class="wiki-cycle-schedule">'+esc(d.schedule_summary)+'</p><div class="wiki-cycle-scroll" tabindex="0" role="region" aria-label="'+weeks+'-week depot treatment interval"><div class="wiki-cycle-chart"><div class="wiki-cycle-axis"><span class="wiki-cycle-label">Week of interval</span>'+axis+'</div><div class="wiki-cycle-track"><span class="wiki-cycle-label">Injection / implant</span><span class="wiki-cycle-band infusion single-day" style="grid-column:2 / 3">Day 1 only</span></div><div class="wiki-cycle-track"><span class="wiki-cycle-label">Continuous hormone suppression</span><span class="wiki-cycle-band treatment" style="grid-column:2 / '+(columns+2)+'">Depot works throughout all '+weeks+' weeks</span></div></div></div><div class="wiki-cycle-key">'+d.chronology_notes.map(x=>'<div><strong>'+esc(x.title)+':</strong> '+esc(x.text)+'</div>').join('')+'</div><p class="wiki-cycle-evidence">The prescribed interval is '+d.cycle_days+' days. Keep the written next appointment. Fixed weeks or days are not interchangeable with calendar months. If an appointment is missed, contact the team; do not arrange an extra injection yourself.</p><p class="wiki-cycle-warning">'+esc(d.safety_note)+'</p></div>';
}
module.exports={...previous,render,isDepot};
