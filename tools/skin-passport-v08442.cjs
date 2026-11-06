'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CODES=new Set(['00102','00105','00237','00373','00464','00535','00551']);
function enhance(d,html){

 if(d.suite_release!=='0.84.42'||!['melanoma','merkel_cell'].includes(d.passport_context)||!CODES.has(d.code))return html;
 if(['00102','00237','00373'].includes(d.code))html=html.replaceAll('One cycle per page.','One review period per page.').replaceAll('one cycle, one page','one review period, one page').replaceAll('Cycle number:','Review period:').replaceAll('another cycle of the same phase','another review period of the same phase');
 const data=require('../validation/skin-melanoma-v08442/patient-content/skin-passport-fields.json').by_context[d.passport_context]; if(!data)throw Error('Missing diagnosis-specific passport context');
 const record=g=>'<section class="skin-record"><h3>'+esc(g.title||g.group)+'</h3>'+(g.fields||[]).map(f=>'<div class="skin-field"><b>'+esc(typeof f==='string'?f:f.label)+'</b><div class="skin-write-space"></div></div>').join('')+(g.note?'<p>'+esc(g.note)+'</p>':'')+'</section>';
 const source='<p class="skin-source">'+esc(data.source)+'. Your Irish treating team confirms the diagnosis, prescription and follow-up plan.</p>';
 const page=(title,body)=>'<section class="suite-page skin-profile"><div class="wiki-kicker">My skin cancer care record</div><h2>'+title+'</h2>'+body+source+'</section>';
 const groups=data.groups.filter(g=>g.fields?.length);
 const find=name=>groups.find(g=>g.group===name);
 for(const name of ['Diagnosis and plan','Medicines and safety','Symptoms and support'])if(!find(name))throw Error('Missing skin passport group '+name);
 let intro=page('My diagnosis, plan and medicines','<p>Complete these pages with your team. Leave unknown or inapplicable items blank. This record supports the consent discussion and your written prescription.</p>'+record(find('Diagnosis and plan'))+record(find('Medicines and safety')));
 intro+=page('My checks, symptoms and support','<p>Record what each test is checking and when the result will be discussed. Your team explains which examinations or scans are needed for your diagnosis and treatment.</p><table class="skin-test-record"><thead><tr><th>Test and purpose</th><th>Date / booking contact</th><th>Result discussion</th><th>Agreed next step</th></tr></thead><tbody>'+Array.from({length:4},()=>'<tr><td>&nbsp;</td><td></td><td></td><td></td></tr>').join('')+'</tbody></table>'+'<p>'+esc(data.groups.find(g=>g.group==='Tests and appointments')?.note||'')+'</p>'+record(find('Symptoms and support'))+'<div class="skin-field"><b>My urgent contact plan / what my carer should do</b><div class="skin-write-space"></div></div>');
 if(!html.includes('<section class="suite-page suite-cycle">'))throw Error('Missing passport phase insertion point');
 return html.replace('<section class="suite-page suite-cycle">',intro+'<section class="suite-page suite-cycle">').replace('</head>','<style>.skin-record{padding:5px 0;break-inside:avoid}.skin-record h3{margin:0 0 3px}.skin-record p{margin:0;font-size:11px}.skin-field{border-bottom:1px solid #b3c6cf;break-inside:avoid;font-size:11px;min-height:30px}.skin-write-space{min-height:17px}.skin-test-record{width:100%;border-collapse:collapse}.skin-test-record th,.skin-test-record td{width:25%;border:1px solid #b3c6cf;padding:5px;font-size:11px}.skin-test-record td{height:32px}.skin-profile{break-after:page}.skin-source{font-size:10px!important;color:#405768}@media print{.skin-profile h2{font-size:19px}.skin-profile>p{font-size:11px}}</style></head>');
}
module.exports={enhance};
