'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),cp=require('child_process');
const H=__dirname,R=path.resolve(H,'../../..'),integrated=process.argv.includes('--integrated'),rows=[];
for(const family of ['pem','etop']){
 const run=cp.spawnSync(process.execPath,[path.join(H,`${family}-source-cases.cjs`),...(integrated?['--integrated']:[])],{encoding:'utf8'});
 if(run.status!==0){console.error(run.stdout,run.stderr);process.exit(run.status||1);}
 const file=path.join(H,`${family}-${integrated?'integrated':'source'}-results.json`);rows.push(...JSON.parse(fs.readFileSync(file)).cases);
}
const A=JSON.parse(fs.readFileSync(path.join(H,'authoring.json'))).regimens;
function test(code,name,f){try{f();rows.push({code,name,pass:true});}catch(e){rows.push({code,name,pass:false,error:e.message});}}
const retrieval=JSON.parse(fs.readFileSync(path.join(H,'research/retrieval.json')));
for(const [code,a]of Object.entries(A)){
 const p=JSON.parse(fs.readFileSync(path.join(integrated?path.join(R,'protocols/lung'):path.join(H,'proposed'),fs.readdirSync(path.join(H,'proposed')).find(x=>x.startsWith(code+'-')))));
 const d=a.patient,s=d.patient_summary;
 test(code,'Fresh retrieved source matches prior source hash',()=>assert.equal(p.metadata.source_pdf_sha256,retrieval.find(x=>x.code===code).sha256));
 test(code,'Full source-based first-visit summary',()=>{for(const key of ['purpose','schedule','card_schedule','card_alert'])assert(s[key]&&typeof s[key]==='string');assert.equal(s.preparation.length,3);assert.equal(s.phases.length,3);assert(/3 weeks/.test(s.schedule));});
 test(code,'Source distinction prominently available to renderer',()=>{assert(d.treatment_scope_notice);assert(code.startsWith('003')?/nivolumab/.test(d.treatment_scope_notice):/radiotherapy/.test(d.treatment_scope_notice));});
 test(code,'Anatomy and complete evidence retained',()=>{assert(d.anatomy.length>=6);assert(d.chapters.length>=5);assert.deepEqual(d.evidence.metrics,[]);assert(d.monitoring_schedule.rows.length>=4);});
 test(code,'No dates required from patients',()=>assert.equal(a.journey.has_patient_dates,false));
 test(code,'No trial survival number inserted into card',()=>assert(!/\d+\s*%|median|hazard/i.test(s.card_alert+s.card_schedule)));
 test(code,'Approval flags stay false',()=>{for(const k of ['consultant_reviewed','oncology_pharmacy_reviewed','clinical_use_authorised'])assert.equal(p.metadata.validation[k],false);});
 if(code.startsWith('003'))test(code,'Neoadjuvant full-combination and maintenance links are distinct',()=>{assert(d.related_treatment_plans.some(x=>x.url===`/patient/00849/backbone_${code}/`));assert(d.related_treatment_plans.some(x=>x.url==='/patient/00222/'));});
}
const failed=rows.filter(x=>!x.pass),report={release:'0.84.28',mode:integrated?'integrated':'proposed',date:'2026-11-02',total:rows.length,passed:rows.length-failed.length,failed:failed.length,clinical_use_authorised:false,cases:rows};
fs.writeFileSync(path.join(H,integrated?'integrated-results.json':'source-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({total:report.total,passed:report.passed,failed:report.failed,failures:failed},null,2));if(failed.length)process.exitCode=1;
