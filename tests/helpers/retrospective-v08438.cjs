'use strict';
// Explicit terminal migration: expected values are reviewed hashes, never current bytes.
const fs=require('node:fs'),path=require('node:path');
const BASE_COMMIT='55f4769f368b4bb1c67a12364c0fedec92a0afba';
const CODES=['00334','00342','00379','00461','00658'];
const PROTOCOLS=new Set(["protocols/index.json", "protocols/neuro-oncology/00334-temozolomide-with-radiotherapy-and-adjuvant-therapy.json", "protocols/neuro-oncology/00342-temozolomide-recurrent-therapy.json", "protocols/neuro-oncology/00379-procarbazine-lomustine-and-vincristine-pcv-therapy-42-day.json", "protocols/neuro-oncology/00461-temozolomide-with-radiotherapy-and-adjuvant-therapy-patients-greater-than-65-years.json", "protocols/neuro-oncology/00658-procarbazine-lomustine-and-vincristine-pcv-therapy-56-day.json"]);
const RECORD=path.join(__dirname,'../../validation/neuro-oncology-v08438/retrospective-hashes.json');
const SHA=/^[a-f0-9]{64}$/;
function safeRelative(file){return typeof file==='string'&&file.length>0&&!file.includes('\\')&&!file.includes('\0')&&!file.startsWith('/')&&!file.split('/').some(s=>s==='.'||s==='..'||s==='');}
function approvedPath(file){
 if(!safeRelative(file))return false;
 if(PROTOCOLS.has(file))return true;
 let m=file.match(/^data\/patient-knowledge\/(\d{5})\.json$/);
 if(m)return CODES.includes(m[1]);
 m=file.match(/^(?:patient|docs\/patient)\/(\d{5})\/(.+)$/);
 if(!m||!CODES.includes(m[1]))return false;
 return /^[a-z0-9_-]+\.(?:html|pdf|png)$/.test(m[2]);
}
function createMigration(record){
 if(!record||record.schema_version!==1||record.base_commit!==BASE_COMMIT||record.base_release!=='0.84.37'||!Array.isArray(record.codes)||JSON.stringify([...record.codes].sort())!==JSON.stringify(CODES)||!record.files||Array.isArray(record.files)||typeof record.files!=='object'||!Object.keys(record.files).length)throw Error('Invalid reviewed v38 migration record');
 const entries=new Map();
 for(const [file,change]of Object.entries(record.files)){
  if(!approvedPath(file))throw Error('Unapproved v38 migration path '+file);
  if(!change||(change.before!==null&&!SHA.test(change.before))||!SHA.test(change.after)||change.before===change.after)throw Error('Invalid v38 migration hashes '+file);
  entries.set(file,Object.freeze({before:change.before,after:change.after}));
 }
 return function expectedHash(file,original){
  if(!safeRelative(file))throw Error('Unsafe v38 migration lookup '+file);
  const change=entries.get(file);if(!change)return original;
  if(original!==change.before&&original!==change.after)throw Error('Unexpected v38 original hash '+file);
  return change.after;
 };
}
let migration;
function expectedHash(file,original){
 if(!migration)migration=createMigration(JSON.parse(fs.readFileSync(RECORD,'utf8')));
 return migration(file,original);
}
function expectedBuilderHash(file,original){
 if(!safeRelative(file)||!/^tools\/[a-zA-Z0-9_-]+\.(?:cjs|js|py)$/.test(file))throw Error('Unsafe v38 builder lookup '+file);
 const entries=JSON.parse(fs.readFileSync(path.join(__dirname,'../../validation/neuro-oncology-v08438/shared-builder-revisions.json'),'utf8'));
 const change=entries[file];if(!change)return original;
 if(!change||!SHA.test(change.after)||(change.before!==null&&!SHA.test(change.before)))throw Error('Invalid v38 builder hashes '+file);
 if(original!==change.before)throw Error('Unexpected v38 original builder '+file);
 return change.after;
}
module.exports={expectedBuilderHash,expectedHash,createMigration,approvedPath,safeRelative,BASE_COMMIT,CODES,RECORD};
