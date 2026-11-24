'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), os = require('node:os'), path = require('node:path'), crypto = require('node:crypto');
const {validate} = require('../tools/validate-patient-video-standard.cjs');
const standard = require('../data/patient-video-standard.json');
const temp = fs.mkdtempSync(path.join(os.tmpdir(),'sact-video-standard-'));
const hash = s => crypto.createHash('sha256').update(s).digest('hex');
try {
  for (const name of ['script.json','transcript.txt','support.html']) fs.writeFileSync(path.join(temp,name),name);
  const base = {standard_id:standard.standard_id,narrator:'Patrick — Engaging and Warm (Irish English)',finished_video:false,
    script_path:'script.json',script_sha256:hash('script.json'),transcript_path:'transcript.txt',transcript_sha256:hash('transcript.txt'),
    sources:[{id:'primary'}],sections:standard.required_sections.map((s,i)=>({id:s.id,position:i+1,authored:true,narrated:false,word_count:20,scene_ids:[String(i+1)],source_ids:['primary']})),
    support_script:{path:'support.html',sha256:hash('support.html'),source_row:'Regimen-specific source row',medicines:['reviewed medicine']}};
  const check = m => validate(m,{base:temp,draft:true});
  assert.equal(check(base).passed,true);
  assert.equal(validate(base,{base:temp}).passed,false,'An authored script is not a finished voiced film');
  for (let i=0;i<7;i++) {const m=structuredClone(base);m.sections.splice(i,1);assert.equal(check(m).passed,false,'Mandatory section '+(i+1)+' cannot be omitted');}
  let m=structuredClone(base);[m.sections[0],m.sections[1]]=[m.sections[1],m.sections[0]];assert.equal(check(m).passed,false,'Order cannot change');
  m=structuredClone(base);m.support_script.sha256='stale';assert.equal(check(m).passed,false,'Support changes require reconciliation');
  m=structuredClone(base);m.sections[5].source_ids=['unknown'];assert.equal(check(m).passed,false,'Source references must resolve');
  m=structuredClone(base);m.narrator='Different narrator';assert.equal(check(m).passed,false,'Original voice must remain');
  m=structuredClone(base);m.finished_video=true;assert.equal(check(m).passed,false,'No finished film without actual identified audio, video and captions');
  console.log('Patient video standard:14 completeness, integrity and unfinished-film checks passed.');
} finally { fs.rmSync(temp,{recursive:true,force:true}); }
