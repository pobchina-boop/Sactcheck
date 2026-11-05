'use strict';
// Explicit terminal migration: expected values are reviewed hashes, never current bytes.
const fs=require('node:fs'),path=require('node:path');
const BASE_COMMIT='cd4e04061195cbe794c54498c92ad4db35961143';
const CODES=["00207", "00209", "00210", "00212", "00213", "00214", "00215", "00216", "00225", "00227", "00238", "00244", "00321", "00328", "00330", "00331", "00382", "00421", "00427", "00428", "00446", "00447", "00448", "00449", "00455", "00486", "00551", "00555", "00558", "00585", "00586", "00623", "00660", "00691", "00692", "00732", "00733", "00783", "00791", "00890", "00900"];
const CONTEXT_ONLY=new Set(['00212','00214','00215','00455','00558']);
const PROFILES=new Set(["00216", "00227", "00421", "00555", "00586", "00692", "00783"]);
const PROTOCOLS=new Set(['protocols/index.json','protocols/gastrointestinal/00216-capecitabine-monotherapy.json','protocols/gastrointestinal/00692-cetuximab-and-folfox-4-therapy.json']);
const RECORD=path.join(__dirname,'../../validation/colorectal-v08436/retrospective-hashes.json');
const SHA=/^[a-f0-9]{64}$/;
function safeRelative(file){return typeof file==='string'&&file.length>0&&!file.includes('\\')&&!file.includes('\0')&&!file.startsWith('/')&&!file.split('/').some(s=>s==='.'||s==='..'||s==='');}
function approvedPath(file){
 if(!safeRelative(file))return false;
 if(PROTOCOLS.has(file))return true;
 let m=file.match(/^data\/patient-knowledge\/(\d{5})\.json$/);
 if(m)return PROFILES.has(m[1]);
 m=file.match(/^data\/patient-knowledge-contexts\/(\d{5})\/colorectal\.json$/);
 if(m)return false;
 m=file.match(/^(?:patient|docs\/patient)\/(\d{5})\/(.+)$/);
 if(!m||!CODES.includes(m[1]))return false;
 const tail=m[2];
 if(CONTEXT_ONLY.has(m[1]))return /^colorectal\/[a-z0-9_-]+\.(?:html|pdf|png)$/.test(tail);
 return /^[a-z0-9_-]+\.(?:html|pdf|png)$/.test(tail);
}
function createMigration(record){
 if(!record||record.schema_version!==1||record.base_commit!==BASE_COMMIT||!Array.isArray(record.codes)||JSON.stringify([...record.codes].sort())!==JSON.stringify(CODES)||!record.files||Array.isArray(record.files)||typeof record.files!=='object'||!Object.keys(record.files).length)throw Error('Invalid reviewed v36 migration record');
 const entries=new Map();
 for(const [file,change]of Object.entries(record.files)){
  if(!approvedPath(file))throw Error('Unapproved v36 migration path '+file);
  if(!change||(change.before!==null&&!SHA.test(change.before))||!SHA.test(change.after)||change.before===change.after)throw Error('Invalid v36 migration hashes '+file);
  entries.set(file,Object.freeze({before:change.before,after:change.after}));
 }
 return function expectedHash(file,original){
  if(!safeRelative(file))throw Error('Unsafe v36 migration lookup '+file);
  const change=entries.get(file);if(!change)return original;
  if(original!==change.before&&original!==change.after)throw Error('Unexpected v36 original hash '+file);
  return change.after;
 };
}
let migration;
function expectedHash(file,original){
 if(!migration)migration=createMigration(JSON.parse(fs.readFileSync(RECORD,'utf8')));
 return require('./retrospective-v08437.cjs').expectedHash(file,migration(file,original));
}
function expectedBuilderHash(file,original){
 if(!safeRelative(file)||!/^tools\/[a-zA-Z0-9_-]+\.(?:cjs|js|py)$/.test(file))throw Error('Unsafe v36 builder lookup '+file);
 const entries=JSON.parse(fs.readFileSync(path.join(__dirname,'../../validation/colorectal-v08436/shared-builder-revisions.json'),'utf8'));
 const change=entries[file];if(!change)return require('./retrospective-v08437.cjs').expectedBuilderHash(file,original);
 if(!change||!SHA.test(change.after)||(change.before!==null&&!SHA.test(change.before)))throw Error('Invalid v36 builder hashes '+file);
 if(original!==change.before)throw Error('Unexpected v36 original builder '+file);
 return require('./retrospective-v08437.cjs').expectedBuilderHash(file,change.after);
}
module.exports={expectedBuilderHash,expectedHash,createMigration,approvedPath,safeRelative,BASE_COMMIT,CODES,RECORD};
