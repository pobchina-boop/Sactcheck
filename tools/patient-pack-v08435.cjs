'use strict';
const previous=require('./patient-pack-v08434.cjs');
function enhance(d,html){
 if(d.patient_summary?.template_version!=='0.84.35')return html;
 html=html.replaceAll('SACTCheck v0.84.32','SACTCheck v0.84.35').replaceAll('4 November 2026','5 November 2026');
 if((['00551','00890','00900'].includes(d.code)&&html.includes('pt-effects'))||(['00551','00900'].includes(d.code)&&html.includes('pt-wallet-back')))html=html.replace('</head>','<link rel="stylesheet" href="../../assets/patient/patient-pack-print-v08435.css"></head>');
 return html;
}
function render(d){return Object.fromEntries(Object.entries(previous.render(d)).map(([key,html])=>[key,enhance(d,html)]));}
function anatomyReference(d,html){
 if(d.patient_summary?.template_version!=='0.84.35'||html.includes('id="anatomical-effects"'))return html;
 if(!Array.isArray(d.anatomy)||!d.anatomy.length)throw Error('Missing authored anatomy '+d.code);
 const map=require('../js/patient-anatomy-v08431.js').render(d);
 const section='<section class="pk-section" id="anatomical-effects"><div class="pk-eyebrow">Regimen-specific side effects</div><h2>Your anatomical side-effect map</h2>'+map+'</section>';
 return html.replace('<section class="pk-section" id="phases">',section+'<section class="pk-section" id="phases">').replace('</head>','<link rel="stylesheet" href="../../assets/patient/hcc-bodymap-v08431.css"></head>');
}
function wiki(d,html){return anatomyReference(d,enhance(d,previous.wiki(d,html)));}
module.exports={...previous,render,wiki,anatomyReference};
