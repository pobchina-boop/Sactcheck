'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../../..');let checks=0;
function ok(x,msg){assert.ok(x,msg);checks++;}
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const rows=read('validation/head-neck-v08446/retrospective/patient-source-changes.json');
for(const row of rows){
 const d=read(row.path),b=read('validation/head-neck-v08446/retrospective/baseline/'+row.path);
 if(['00455','00558'].includes(d.code)){for(const a of b.agents)a.risks=[...new Set(a.risks)];const repeat='Discuss the possibility that heart, muscle and nerve inflammation can occur together and may need urgent hospital treatment. A severe immune reaction may mean treatment must remain stopped even after recovery.';b.consent_support=b.consent_support.replace(repeat+' '+repeat,repeat);}
 for(const key of ['anatomy','agents','consent_support','sources','purpose','indication_text','administration_text','evidence']){assert.deepStrictEqual(d[key],b[key],row.path+' altered '+key);checks++;}
 ok(d.patient_summary?.monitoring?.length===3,row.path+' compact test map');
 ok(d.patient_summary.card_cycle_count===null,row.path+' no invented fixed breast/immune course');
 if(['00483','00484'].includes(d.code)){
  ok(d.patient_summary.cycle_expectations.some(x=>/permanently stopped nivolumab/.test(x)),row.path+' retain past permanent stop');
  ok(d.chapters.some(x=>x.items?.some(i=>i.title==='Previous permanent-stop decisions')),row.path+' deep restart warning');
 }
 if(d.code==='00484'){
  const text=JSON.stringify(d);
  ok(!/thyroid[^.]{0,60}(?:once a month|monthly)/i.test(text),row.path+' no borrowed monthly thyroid schedule');
  ok(/thyroid function (?:is checked )?before each cycle/i.test(text),row.path+' source TFT interval');
 }
 if(d.code==='00483')ok(/thyroid[^.]{0,45}(?:once a month|monthly)/i.test(JSON.stringify(d)),row.path+' retain distinct q14 monthly schedule');
 if(['00455','00558'].includes(d.code)){
  ok(new Set(d.patient_summary.cycle_expectations).size===d.patient_summary.cycle_expectations.length,row.path+' no duplicate permanent-stop text');
  ok(/12 months/.test(d.schedule_summary)&&/24 months/.test(d.schedule_summary),row.path+' distinct adjuvant and metastatic review');
 }
}
const carbo=read('data/patient-knowledge/00261.json');
ok(carbo.chapters.some(c=>c.items.some(i=>/within 48 hours/.test(i.text))),'carboplatin estimate blood age');
ok(/no preset/.test(carbo.patient_summary.schedule),'breast no three-cycle HN course leakage');
ok(!JSON.stringify(carbo).includes('These two carboplatin'),'single-regimen patient wording');
ok(/Thyroid function tests every 3–6 weeks/.test(JSON.stringify(read('data/patient-knowledge/00558.json').patient_summary)),'00558 source TFTs, not TSH-only');
console.log(JSON.stringify({status:'passed',profiles:rows.length,checks,limitations:['PDF rendering, browser review and clinical engine cases are separate release-owner checks.']}));
