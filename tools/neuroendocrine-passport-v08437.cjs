'use strict';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function enhance(d,html){
 if(d.suite_release!=='0.84.37'||!['00320','00327','00505','00642'].includes(d.code))return html;
 const fields=d.net_passport_fields||[
  ['My diagnosis','Primary site; pathology date; well-differentiated NET or poorly differentiated NEC; grade and Ki-67; stage and sites involved. Ask the team to complete or explain each item.'],
  ['Hormones and receptors','Hormone-related symptoms and tests, if relevant; somatostatin receptor imaging result and date. Receptor positivity and hormone production are different findings.'],
  ['My treatment plan','Treatment goal; medicines and prescribed doses; cycle or review interval; intended number of treatments if fixed; reasons to hold or change treatment.'],
  ['My monitoring plan','Required safety blood tests; individually agreed scan dates; any useful hormone or tumour-marker test and why it is being followed. Not every NET needs the same tests.'],
  ['My team and support','Oncology / NET team; specialist nurse; nuclear medicine team if applicable; GP; pharmacy; dietitian; urgent and out-of-hours numbers.'],
  ['What matters to me','Symptoms and daily-life priorities; eating or weight concerns; work, family or travel plans; questions and agreed next steps.']
 ];
 const groups=require('../validation/neuroendocrine-v08437/patient-content/net-passport-fields.json').groups;
 const recordGroup=g=>'<section class="net-passport-field"><h3>'+escape(g.group)+'</h3>'+((g.fields||[]).map(label=>'<div class="net-record-field"><b>'+escape(label)+'</b><div class="net-write-space"></div></div>').join(''))+(g.note?'<p>'+escape(g.note)+'</p>':'')+'</section>';
 const intro='<p>Complete these pages with your team. Leave an item blank if it does not apply or is not yet known. This personal record does not replace your prescription, clinical notes or consent discussion.</p>';
 const source='<p class="net-source-note">Education informed by NCCN Guidelines for Patients: Neuroendocrine Tumors (2026); written for this Irish treatment context. Your team confirms your individual plan.</p>';
 const makePage=(title,body)=>'<section class="suite-page net-passport-profile"><div class="wiki-kicker">My NET care record</div><h2>'+title+'</h2>'+body+source+'</section>';
 const tests=groups.find(g=>g.columns);
 let page=makePage('My diagnosis, plan and priorities',intro+recordGroup(groups[0])+recordGroup(groups[1]));
 page+=makePage('My tests, symptoms and support','<p>Safety blood tests, scans to assess treatment, and tests for hormone symptoms have different purposes. Record only the tests agreed for you.</p><table class="net-test-record"><thead><tr><th>Test and purpose</th><th>Due / booking contact</th><th>Result explained by / date</th><th>Agreed next step</th></tr></thead><tbody>'+Array.from({length:4},()=>'<tr><td>&nbsp;</td><td></td><td></td><td></td></tr>').join('')+'</tbody></table><p>'+escape(tests.note)+'</p>'+recordGroup(groups.find(g=>g.group==='Symptoms and support')));
 if(d.code==='00642')page+=makePage('My PRRT appointments and safety plan',intro+recordGroup(groups.find(g=>g.group==='PRRT only'))+'<p>Keep the nuclear medicine team’s written instructions and restriction dates with this record. Do not use a general leaflet to calculate when your personal restrictions end.</p>');
 html=html.replace('<section class="suite-page suite-cycle">',page+'<section class="suite-page suite-cycle">');
 return html.replace('</head>','<style>.net-passport-field{padding:7px 0;break-inside:avoid}.net-passport-field h3{margin:0 0 3px}.net-passport-field p{margin:0;font-size:11px}.net-record-field{border-bottom:1px solid #b3c6cf;break-inside:avoid;font-size:11px;min-height:27px}.net-write-space{min-height:14px}.net-test-record{width:100%;border-collapse:collapse}.net-test-record th,.net-test-record td{width:25%;border:1px solid #b3c6cf;padding:5px;font-size:11px}.net-test-record td{height:32px}.net-passport-profile{break-after:page}.net-source-note{font-size:10px!important;color:#405768}@media print{.net-passport-profile h2{font-size:19px}.net-passport-profile>p{font-size:11px}}</style></head>')
  .replaceAll('SACTCheck v0.83.0','SACTCheck v0.84.37');
}
module.exports={enhance};
