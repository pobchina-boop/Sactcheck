'use strict';
// Five exact reviewed contexts; no broad exemption from historical assertions.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'../..'),codes=['00205','00228','00374','00462','00554'],read=f=>JSON.parse(fs.readFileSync(path.join(ROOT,f))),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const ranges={'00205':{mucositis_grade:[0,1,2,3,4],other_nonhaem_toxicity_grade:[0,1,2,3,4],ppe_grade:[0,1,2,3,4],stomatitis_grade:[0,1,2,3,4],infusion_reaction_grade:[0,1,2,3,4]},'00228':{mucositis_grade:[0,1,2,3,4],other_nonhaem_toxicity_grade:[0,1,2,3,4],neuropathy_grade:[0,1,2,3,4]},'00374':{current_other_toxicity_grade:[0,1,2,3,4],prior_cycle_other_toxicity_grade:[0,1,2,3,4]},'00462':{mucositis_grade:[0,1,2,3,4],other_nonhaem_toxicity_grade:[0,1,2,3,4],ppe_grade:[0,1,2,3,4],stomatitis_grade:[0,1,2,3,4],infusion_reaction_grade:[0,1,2,3,4]},'00554':{neuropathy_grade:[0,1,2,3,4],mucositis_grade:[0,1,2,3,4]}};
function applies(p){return codes.includes(p.metadata?.nccp_regimen_code)&&p.metadata?.sactcheck_encoding_version==='0.84.62';}
const checkpoint = '9049a163d44c9de14639e431f1cd8e6c11b9a0b4';
const archived = file => require('node:child_process').execFileSync('git',['show',checkpoint+':'+file],{cwd:ROOT,maxBuffer:32*1024*1024});
const file = 'validation/sarcoma-v08462/clinical-compatibility.json';
const manifest = read(file);
assert.deepEqual(manifest,JSON.parse(archived(file)));
assert.deepEqual(manifest.ranges,ranges);
function validate(p) {
 if (!applies(p)) return null;
 const code=p.metadata.nccp_regimen_code, entry=manifest.records[code];
 assert(codes.includes(code) && entry,code+' reviewed source');
 assert.deepEqual(p,JSON.parse(archived(entry.path)),code+' exact reviewed clinical rules and inputs');
 assert.equal(p.metadata.source_url,entry.source_url);
 assert.equal(String(p.metadata.nccp_version),entry.source_version);
 for(const flag of ['clinical_use_authorised','consultant_reviewed','oncology_pharmacy_reviewed']) assert.equal(p.metadata.validation[flag],false);
 for(const [field,allowed] of Object.entries(ranges[code])) {
   const def=p.input_definitions[field];
   assert.deepEqual(def.options.map(option=>Number(option.value)),allowed);
   assert.equal(sha(Buffer.from(JSON.stringify(def))),entry.grade_definitions_sha256[field],code+' '+field);
 }
 return entry;
}
function validateGrade(p,field,d,CTCAE){const r=validate(p),code=p.metadata.nccp_regimen_code,expected=ranges[code]?.[field];assert(r&&expected,'Unreviewed v62 grading field '+code+'/'+field);const guide=CTCAE.guide({...d,id:field});assert(guide?.grades?.length>=expected.length);const sourcePld=['00205','00462'].includes(code)&&['mucositis_grade','stomatitis_grade','ppe_grade'].includes(field);if(sourcePld){assert.equal(d.ctcae_version,undefined);assert.equal(d.grading_source_url,'https://www.ema.europa.eu/en/documents/product-information/caelyx-pegylated-liposomal-epar-product-information_en.pdf');assert.equal(d.grading_source_label,'NCCP 00205 / Caelyx NCI-CTC source table');assert.equal(guide.sourceSpecific,true);}else{assert.equal(d.ctcae_version,'5.0');assert(d.ctcae_category);assert.notEqual(guide.sourceSpecific,true);if(code==='00554'){assert.match(d.assessment_guidance,/UI grading aid/);assert.match(d.assessment_guidance,/does not (?:name|identify) the grading edition/);}}
 for(const grade of expected)assert(guide.grades.find(x=>Number(x.grade)===grade)?.description,'Missing grading explanation');return expected;}
module.exports={codes,ranges,applies,validate,validateGrade};
