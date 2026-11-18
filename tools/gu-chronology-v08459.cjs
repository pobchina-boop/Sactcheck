'use strict';
const previous=require('./adt-chronology-v08454.cjs');
const assert=require('node:assert/strict');
function render(d){
 if(d.code!=='00453'||d.suite_release!=='0.84.59')return previous.render(d);
 assert.equal(d.relative_day_origin,-5,'Transplant chronology requires explicit day origin');
 assert.equal(d.cycle_days,14,'Reviewed transplant reference has fourteen columns');
 // Retain every authored track, legend, source link and safety warning.
 // Change only the origin and labels of the existing reference axis.
 let html=previous.render(d);
 const labels=Array.from({length:14},(_,i)=>'<span class="wiki-cycle-day">'+(i>5?'+':'')+(i-5)+'</span>').join('');
 const axis=/<span class="wiki-cycle-label">Day of cycle<\/span>(?:<span class="wiki-cycle-day">\d+<\/span>){14}/;
 assert(axis.test(html),'Expected original fourteen-day axis');
 return html.replace('data-cycle-days="14"','data-cycle-days="14" data-day-origin="-5"')
 .replace('<h3>Day 1 → Day 14: a general pattern</h3>','<h3>Days relative to your stem-cell infusion</h3>')
 .replace(/<p class="wiki-cycle-intro">[\s\S]*?<\/p>/,'<p class="wiki-cycle-intro">Day 0 is the stem-cell infusion. Negative days come before it; positive days come afterwards. This is a reference view, not a prediction of recovery or a discharge date.</p>')
 .replace('aria-label="General 14-day treatment pattern"','aria-label="Conditioning and stem-cell rescue timeline"')
 .replace('not an outpatient 28-day cycle','not an outpatient 28-day reference view')
 .replace(axis,'<span class="wiki-cycle-label">Transplant day</span>'+labels);
}
module.exports={...previous,render};
