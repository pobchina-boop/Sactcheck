'use strict';
const previous=require('./patient-pack-v08432.cjs');
function render(d){
 const result=previous.render(d);
 if(d.patient_summary?.template_version!=='0.84.33')return result;
 return Object.fromEntries(Object.entries(result).map(([key,html])=>{
  html=html.replaceAll('SACTCheck v0.84.32','SACTCheck v0.84.33');
  if(d.code==='00691')html=html.replace('My cycle record','FOLFIRINOX cycle record')
   .replace('Team stamps after each completed cycle.','Stamp the six induction cycles only.')
   .replace('Phase: __________ Planned cycles: 6','Phase: FOLFIRINOX induction · 6 cycles')
   .replace('<h3>Put your treatment page on your phone</h3>','<h3>Chemoradiation record</h3><p>Separate phase: team records each completed capecitabine/radiotherapy week. Follow the prescribed radiation calendar.</p><p>Week 1 ______ &nbsp; 2 ______ &nbsp; 3 ______ &nbsp; 4 ______ &nbsp; 5 ______ <small>(date / initials)</small></p><h3>Put your treatment page on your phone</h3>');
  return [key,html];
 }));
}
module.exports={...previous,render};
