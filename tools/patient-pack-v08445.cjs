'use strict';
// Keep all earlier layouts; apply current source identity to the audited routes.
const previous=require('./patient-pack-v08442.cjs');
const codes=new Set(['00385','00387','00207','00705','00706','00455','00558','00328','00733','00456']);
const applies=d=>codes.has(d.code)&&(d.suite_release==='0.84.45'||d.clinical_audit_release==='0.84.45');
function enhance(d,html){
 if(!applies(d))return html;
 if(['00705','00706'].includes(d.code)&&html.includes('pt-effects'))html=html.replace(/(<svg[^>]*class="hcc-static-connectors"[^>]*>)([\s\S]*?)(<\/svg>)/g,(_,open,lines,close)=>open+lines.replace(/y2="([0-9.]+)"/g,(_,y)=>'y2="'+(Number(y)*146/160).toFixed(4)+'"')+close);
 if(d.code==='00705'&&html.includes('pt-effects')){let n=0;html=html.replace(/<line[^>]*class="immune"[^>]*>/g,line=>line.replace(/y1="[^"]+"/,'y1="'+([15.5,46.5,77.5,108.5,142][n++]/160*100)+'"'));}
 return html.replace(/SACTCheck v0\.84\.\d+/g,'SACTCheck v0.84.45')
  .replace(/Document revised \d+ November 2026/g,'Document revised 7 November 2026')
  .replace(/<body([^>]*)>/,'<body$1 data-head-neck-audit="v45" data-audit-regimen="'+d.code+'" data-audit-context="'+(d.patient_context||'root')+'">')
  .replace('</head>','<link rel="stylesheet" href="../../assets/patient/head-neck-print-v08445.css"></head>');
}
function render(d){return Object.fromEntries(Object.entries(previous.render(d)).map(([kind,html])=>[kind,enhance(d,html)]));}
function wiki(d,html){
 html=enhance(d,previous.wiki(d,html));
 if(!applies(d))return html;
 // This marker selects the compact printed pack's organ-card geometry. The
 // full reference retains its established screen/print body-map layout.
 html=html.replace(/ data-audit-regimen="[^"]+"/,'');
 html=html.replaceAll('href="./#side-effects"','href="#anatomical-effects"');
 if(html.includes('id="anatomical-effects"'))return html;
 if(!d.anatomy?.length)throw Error('Missing authored anatomy '+d.code);
 const map=require('../js/patient-anatomy-v08431.js').render(d);
 const section='<section class="pk-section" id="anatomical-effects"><div class="pk-eyebrow">Regimen-specific side effects</div><h2>Your anatomical side-effect map</h2>'+map+'</section>';
 if(!html.includes('<section class="pk-section" id="phases">'))throw Error('Missing anatomical insertion point');
 return html.replace('<section class="pk-section" id="phases">',section+'<section class="pk-section" id="phases">').replace('</head>','<link rel="stylesheet" href="../../assets/patient/hcc-bodymap-v08431.css"></head>');
}
module.exports={...previous,render,wiki,applies};
