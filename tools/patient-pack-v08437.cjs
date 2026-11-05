'use strict';
// Preserve every earlier presentation; the NET additions are explicitly scoped.
const previous=require('./patient-pack-v08436.cjs');
const CODES=new Set(['00320','00327','00505','00642']);
function applies(d){return CODES.has(d.code)&&d.patient_summary?.template_version==='0.84.37'&&(d.code!=='00320'||d.patient_context==='neuroendocrine');}
function enhance(d,html){
 if(!applies(d))return html;
 if(d.code==='00642')html=html.replaceAll('Planned weekly doses:','Planned administrations:').replaceAll('weekly-treatment stamp','administration stamp').replaceAll('that weekly dose','that administration').replaceAll('a administration stamp','an administration stamp').replace(/<span>W([1-4])<\/span>/g,'<span>T$1</span>');
 return html.replaceAll('SACTCheck v0.84.32','SACTCheck v0.84.37').replaceAll('4 November 2026','5 November 2026')
  .replace(/<body([^>]*)>/,'<body$1 data-neuroendocrine-print="v37">')
  .replace('</head>','<link rel="stylesheet" href="../../assets/patient/neuroendocrine-print-v08437.css"></head>');
}
function render(d){return Object.fromEntries(Object.entries(previous.render(d)).map(([key,html])=>{
 html=enhance(d,html);
 if(applies(d))html=html.replace(/<svg class="hcc-static-connectors"[\s\S]*?<\/svg>/g,svg=>svg+svg.replace('class="hcc-static-connectors"','class="hcc-static-connectors net-print-connectors"').replace(/y1="([0-9.]+)"/g,(_,n)=>'y1="'+(Number(n)*170/146)+'"'));
 if(applies(d)&&key==='print')html=html.replace('</head>','<link rel="stylesheet" href="../../assets/patient/colorectal-anatomy-print-v08436.css"></head>');
 return [key,html];
}));}
function wiki(d,html){
 html=enhance(d,previous.wiki(d,html));
 if(!applies(d)||html.includes('id="anatomical-effects"'))return html;
 if(!d.anatomy?.length)throw Error('Missing NET anatomical explanations: '+d.code);
 const map=require('../js/patient-anatomy-v08431.js').render(d);
 const section='<section class="pk-section" id="anatomical-effects"><div class="pk-eyebrow">Regimen-specific side effects</div><h2>Your anatomical side-effect map</h2>'+map+'</section>';
 if(!html.includes('<section class="pk-section" id="phases">'))throw Error('Missing NET reference insertion point');
 return html.replace('<section class="pk-section" id="phases">',section+'<section class="pk-section" id="phases">').replace('</head>','<link rel="stylesheet" href="../../assets/patient/hcc-bodymap-v08431.css"></head>');
}
module.exports={...previous,render,wiki,applies};
