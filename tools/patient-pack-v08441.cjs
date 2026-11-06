'use strict';
// Preserve every earlier presentation; the skin additions are explicitly scoped.
const previous=require('./patient-pack-v08440.cjs');
const CODES=new Set(['00455', '00558', '00483', '00484', '00551']);
function applies(d){return CODES.has(d.code)&&d.patient_summary?.template_version==='0.84.41';}
function enhance(d,html){
 if(!applies(d))return html;
 if(d.patient_context==='melanoma_perioperative')html=html.replaceAll('Planned cycles: 3','Before surgery: 3 doses').replaceAll('My cycle record','Before-surgery record').replaceAll('Team stamps after each completed cycle.','3 preoperative doses only; 15 postoperative doses in passport.').replace(/<span>C([1-3])<\/span>/g,'<span>Pre $1</span>');
 if(['00236','00415','00563'].includes(d.code))html=html
  .replace(/A typical (\d+)-day cycle/g,'A $1-day reference calendar')
  .replaceAll('My cycle record','My review record').replaceAll('<th>Cycle</th>','<th>Review</th>')
  .replaceAll('Cycle plan: team to confirm','Review plan: team to confirm')
  .replaceAll('Latest treatment date:','Latest review date:')
  .replace('The team dates and initials each recorded treatment unit when complete. A cycle is complete after its final planned dose; a weekly-treatment stamp records that weekly dose. Delays, omitted doses or a changed plan need a note or a replacement card. A stamp does not approve the next treatment. Keep any medicine-specific alert card too.','The team dates and initials each completed review. Daily tablets continue according to your prescribed plan; a review stamp does not mean the course is complete or authorise further treatment. Record interruptions or a changed plan. Keep any medicine-specific alert card too.');
 return html.replaceAll('SACTCheck v0.84.32','SACTCheck v0.84.41').replaceAll('4 November 2026','6 November 2026')
  .replaceAll('5 November 2026','6 November 2026')
  .replace(/<body([^>]*)>/,'<body$1 data-skin-melanoma-print="v41">')
  .replace('</head>','<link rel="stylesheet" href="../../assets/patient/skin-melanoma-print-v08441.css"></head>');
}
function render(d){return Object.fromEntries(Object.entries(previous.render(d)).map(([key,html])=>{
 html=enhance(d,html);
 if(applies(d))html=html.replace(/<svg class="hcc-static-connectors"[\s\S]*?<\/svg>/g,svg=>svg+svg.replace('class="hcc-static-connectors"','class="hcc-static-connectors net-print-connectors"').replace(/y1="([0-9.]+)"/g,(_,n)=>'y1="'+(Number(n)*(d.anatomy.length>8?182:162)/146)+'"'));
 if(applies(d)&&key==='print')html=html.replace('</head>','<link rel="stylesheet" href="../../assets/patient/colorectal-anatomy-print-v08436.css"></head>');
 return [key,html];
}));}
function wiki(d,html){
 html=enhance(d,previous.wiki(d,html));
 if(applies(d))html=html.replace('href="./#side-effects"','href="#anatomical-effects"');
 if(!applies(d)||html.includes('id="anatomical-effects"'))return html;
 if(!d.anatomy?.length)throw Error('Missing skin anatomical explanations: '+d.code);
 const map=require('../js/patient-anatomy-v08431.js').render(d);
 const section='<section class="pk-section" id="anatomical-effects"><div class="pk-eyebrow">Regimen-specific side effects</div><h2>Your anatomical side-effect map</h2>'+map+'</section>';
 if(!html.includes('<section class="pk-section" id="phases">'))throw Error('Missing skin reference insertion point');
 return html.replace('<section class="pk-section" id="phases">',section+'<section class="pk-section" id="phases">').replace('</head>','<link rel="stylesheet" href="../../assets/patient/hcc-bodymap-v08431.css"></head>');
}
module.exports={...previous,render,wiki,applies};
