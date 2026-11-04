'use strict';
const previous=require('./patient-pack-v08431.cjs');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const revision='4 November 2026';
function identity(d){return `<p class="pt-document-identity"><b>${esc(d.context_label||d.indication_text||'Confirm treatment setting')}</b> · NCCP ${esc(d.code)} v${esc(d.protocol_version)} · Document revised ${revision}</p>`;}
function personalPlan(){return '<aside class="pt-personal-plan"><b>Your personal plan:</b> this is the standard regimen schedule. Your team confirms your prescribed doses, cycles, treatment changes and appointments in your written plan.</aside>';}
function enhance(d,html){
 return html.replace('</head>','<link rel="stylesheet" href="../../assets/patient/patient-identity-v08432.css"></head>')
 .replace(/(<p class="pt-purpose">[\s\S]*?<\/p>)/,'$1'+identity(d)+personalPlan())
 .replaceAll('SACTCheck v0.84.31','SACTCheck v0.84.32')
 .replaceAll('EXAMPLE NUMBERS ONLY — your team must replace these before patient use.','EXAMPLE ONLY — team must replace both numbers before patient use.')
 .replace('Hospital / team: ____________________ &nbsp; Backup contact route: ____________________','Hospital / team: ____________________<br>Backup if the team cannot be reached: ____________________')
 .replace(/(<h2>Keep your treatment details to hand<\/h2>)/,'$1'+identity(d));
}
function render(d){const out=previous.render({...d,patient_summary:{...d.patient_summary,template_version:'0.84.31'}});return Object.fromEntries(Object.entries(out).map(([k,v])=>[k,enhance(d,v)]));}
function wiki(d,html){return html.replace('</head>','<link rel="stylesheet" href="../../assets/patient/patient-identity-v08432.css"></head>').replace(/(<h1[^>]*>[\s\S]*?<\/h1>)/,'$1'+identity(d)+personalPlan());}
module.exports={render,wiki,identity,personalPlan};
