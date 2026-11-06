'use strict';
// Explicit terminal migration: expected values are reviewed hashes, never current bytes.
const fs=require('node:fs'),path=require('node:path');
const BASE_COMMIT='cd4e04061195cbe794c54498c92ad4db35961143';
const CODES=['00320','00327','00505','00642'];
const PROTOCOLS=new Set(['protocols/index.json','protocols/shared/00320-everolimus-monotherapy.json','protocols/neuroendocrine/00327-sunitinib-37-5-mg-therapy-28-day.json','protocols/gastrointestinal/00505-capecitabine-and-temozolomide-therapy.json','protocols/gastrointestinal/00642-lutetium-177-oxodotreotide-lutathera-therapy.json']);
const RECORD=path.join(__dirname,'../../validation/neuroendocrine-v08437/retrospective-hashes.json');
const SHA=/^[a-f0-9]{64}$/;
function safeRelative(file){return typeof file==='string'&&file.length>0&&!file.includes('\\')&&!file.includes('\0')&&!file.startsWith('/')&&!file.split('/').some(s=>s==='.'||s==='..'||s==='');}
function approvedPath(file){
 if(!safeRelative(file))return false;
 if(PROTOCOLS.has(file))return true;
 let m=file.match(/^data\/patient-knowledge\/(\d{5})\.json$/);
 if(m)return CODES.includes(m[1]);
 if(file==='data/patient-knowledge-contexts/00320/neuroendocrine.json')return true;
 m=file.match(/^(?:patient|docs\/patient)\/(\d{5})\/(.+)$/);
 if(!m||!CODES.includes(m[1]))return false;
 if(m[1]==='00320')return /^(?:scope|index)\.html$/.test(m[2])||/^neuroendocrine\/[a-z0-9_-]+\.(?:html|pdf|png)$/.test(m[2]);
 return /^[a-z0-9_-]+\.(?:html|pdf|png)$/.test(m[2]);
}
function createMigration(record){
 if(!record||record.schema_version!==1||record.base_commit!==BASE_COMMIT||record.base_release!=='0.84.36'||!Array.isArray(record.codes)||JSON.stringify([...record.codes].sort())!==JSON.stringify(CODES)||!record.files||Array.isArray(record.files)||typeof record.files!=='object'||!Object.keys(record.files).length)throw Error('Invalid reviewed v37 migration record');
 const entries=new Map();
 for(const [file,change]of Object.entries(record.files)){
  if(!approvedPath(file))throw Error('Unapproved v37 migration path '+file);
  if(!change||(change.before!==null&&!SHA.test(change.before))||!SHA.test(change.after)||change.before===change.after)throw Error('Invalid v37 migration hashes '+file);
  entries.set(file,Object.freeze({before:change.before,after:change.after}));
 }
 return function expectedHash(file,original){
  if(!safeRelative(file))throw Error('Unsafe v37 migration lookup '+file);
  const change=entries.get(file);if(!change)return original;
  if(original!==change.before&&original!==change.after)throw Error('Unexpected v37 original hash '+file);
  return change.after;
 };
}
let migration;
function expectedHash(file,original){
 if(!migration)migration=createMigration(JSON.parse(fs.readFileSync(RECORD,'utf8')));
 return require('./retrospective-v08438.cjs').expectedHash(file,migration(file,original));
}
function expectedBuilderHash(file,original){
 if(!safeRelative(file)||!/^tools\/[a-zA-Z0-9_-]+\.(?:cjs|js|py)$/.test(file))throw Error('Unsafe v37 builder lookup '+file);
 const entries=JSON.parse(fs.readFileSync(path.join(__dirname,'../../validation/neuroendocrine-v08437/shared-builder-revisions.json'),'utf8'));
 const change=entries[file];if(!change)return require('./retrospective-v08438.cjs').expectedBuilderHash(file,original);
 if(!change||!SHA.test(change.after)||(change.before!==null&&!SHA.test(change.before)))throw Error('Invalid v37 builder hashes '+file);
 if(original!==change.before)throw Error('Unexpected v37 original builder '+file);
 return require('./retrospective-v08438.cjs').expectedBuilderHash(file,change.after);
}
module.exports={expectedBuilderHash,expectedHash,createMigration,approvedPath,safeRelative,BASE_COMMIT,CODES,RECORD};
