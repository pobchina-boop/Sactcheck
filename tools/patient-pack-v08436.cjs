'use strict';
const previous=require('./patient-pack-v08435.cjs');
const REFERENCE_CODES=new Set(['00209','00210','00213','00216','00227','00238','00321','00421','00427','00428','00446','00449','00486','00555','00586','00623','00660','00691','00692','00783','00791']);
const ANATOMY_CODES=new Set(["00207", "00209", "00210", "00212", "00213", "00214", "00215", "00216", "00225", "00227", "00238", "00244", "00321", "00328", "00330", "00331", "00382", "00421", "00427", "00428", "00446", "00447", "00448", "00449", "00455", "00486", "00551", "00555", "00558", "00585", "00586", "00623", "00660", "00691", "00692", "00732", "00733", "00783", "00791", "00890", "00900"]);
const CONTEXT_CODES=new Set(['00212','00214','00215','00455','00558']);
const PRINT_CODES=new Set(['00216','00692','00227','00321','00427','00428','00486','00586','00623']);
function enhance(d,html){
 if(d.patient_summary?.template_version==='0.84.36')html=html.replaceAll('SACTCheck v0.84.32','SACTCheck v0.84.36').replaceAll('4 November 2026','5 November 2026');
 if(PRINT_CODES.has(d.code)){html=html.replace(/<body([^>]*)>/,'<body$1 data-colorectal-print="v36">');html=html.replace('</head>','<link rel="stylesheet" href="../../assets/patient/colorectal-print-v08436.css"></head>');}
 return html;
}
function render(d){return Object.fromEntries(Object.entries(previous.render(d)).map(([key,html])=>{html=enhance(d,html);if(key==='print'&&ANATOMY_CODES.has(d.code)&&(!CONTEXT_CODES.has(d.code)||d.patient_context==='colorectal'))html=html.replace('</head>','<link rel="stylesheet" href="../../assets/patient/colorectal-anatomy-print-v08436.css"></head>');return[key,html];}));}
function anatomyReference(d,html){
 if(!REFERENCE_CODES.has(d.code)||html.includes('id="anatomical-effects"'))return html;
 if(!Array.isArray(d.anatomy)||!d.anatomy.length)throw Error('Missing authored anatomy '+d.code);
 const map=require('../js/patient-anatomy-v08431.js').render(d);
 const section='<section class="pk-section" id="anatomical-effects"><div class="pk-eyebrow">Regimen-specific side effects</div><h2>Your anatomical side-effect map</h2>'+map+'</section>';
 return html.replace('<section class="pk-section" id="phases">',section+'<section class="pk-section" id="phases">').replace('</head>','<link rel="stylesheet" href="../../assets/patient/hcc-bodymap-v08431.css"></head>');
}
function wiki(d,html){return anatomyReference(d,enhance(d,previous.wiki(d,html)));}
module.exports={...previous,render,wiki,anatomyReference,REFERENCE_CODES,PRINT_CODES};
