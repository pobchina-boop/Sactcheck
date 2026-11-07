'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CODES=new Set(['00334','00342','00379','00461','00658']);
function enhance(d,html){
 if(d.suite_release!=='0.84.38'||!CODES.has(d.code))return html;
 const data=require('../validation/neuro-oncology-v08438/patient-content/glioma-passport-fields.json');
 const record=g=>'<section class="glioma-record"><h3>'+esc(g.group)+'</h3>'+(g.fields||[]).map(f=>'<div class="glioma-field"><b>'+esc(typeof f==='string'?f:f.label)+'</b><div class="glioma-write-space"></div></div>').join('')+(g.note?'<p>'+esc(g.note)+'</p>':'')+'</section>';
 const source='<p class="glioma-source">SACTCheck patient information. Your team confirms your diagnosis, prescription and follow-up plan. Open clinical and medicine sources are collected in your treatment reference.</p>';
 const page=(title,body)=>'<section class="suite-page glioma-profile"><div class="wiki-kicker">My brain tumour care record</div><h2>'+title+'</h2>'+body+source+'</section>';
 const groups=data.groups.filter(g=>g.fields?.length);
 const find=name=>groups.find(g=>g.group===name);
 for(const name of ['Diagnosis and plan','Medicines and safety','Symptoms and support'])if(!find(name))throw Error('Missing glioma passport group '+name);
 let intro=page('My diagnosis, plan and medicines','<p>Complete these pages with your team. Leave unknown or inapplicable items blank. This record supports the consent discussion and your written prescription.</p>'+record(find('Diagnosis and plan'))+record(find('Medicines and safety')));
 intro+=page('My scans, symptoms and support','<p>Record what each test is checking and when the result will be discussed. Scan changes need interpretation alongside symptoms and treatment timing.</p><table class="glioma-test-record"><thead><tr><th>Test and purpose</th><th>Date / booking contact</th><th>Result discussion</th><th>Agreed next step</th></tr></thead><tbody>'+Array.from({length:4},()=>'<tr><td>&nbsp;</td><td></td><td></td><td></td></tr>').join('')+'</tbody></table>'+record(find('Symptoms and support'))+'<div class="glioma-field"><b>My urgent contact plan / what my carer should do</b><div class="glioma-write-space"></div></div>');
 if(!html.includes('<section class="suite-page suite-cycle">'))throw Error('Missing passport phase insertion point');
 return html.replace('<section class="suite-page suite-cycle">',intro+'<section class="suite-page suite-cycle">').replace('</head>','<style>.glioma-record{padding:5px 0;break-inside:avoid}.glioma-record h3{margin:0 0 3px}.glioma-record p{margin:0;font-size:11px}.glioma-field{border-bottom:1px solid #b3c6cf;break-inside:avoid;font-size:11px;min-height:30px}.glioma-write-space{min-height:17px}.glioma-test-record{width:100%;border-collapse:collapse}.glioma-test-record th,.glioma-test-record td{width:25%;border:1px solid #b3c6cf;padding:5px;font-size:11px}.glioma-test-record td{height:32px}.glioma-profile{break-after:page}.glioma-source{font-size:10px!important;color:#405768}@media print{.glioma-profile h2{font-size:19px}.glioma-profile>p{font-size:11px}}</style></head>');
}
module.exports={enhance};
