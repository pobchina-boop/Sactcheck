'use strict';
// Explicit terminal migration: expected values are reviewed hashes, never current bytes.
const fs=require('node:fs'),path=require('node:path');
const BASE_COMMIT='c19bef57ca5ae49816ad851f2b551b76af32fa5d';
const CODES=["00447", "00448", "00455", "00551", "00558", "00585", "00732", "00733", "00890", "00900"];
const BEV=new Set(['00455','00558']);
const PROTOCOLS=new Set(["protocols/index.json", "protocols/gastrointestinal/00447-panitumumab-modified-folfox6.json", "protocols/gastrointestinal/00448-panitumumab-folfiri.json", "protocols/shared/00455-pembrolizumab-200-mg-monotherapy.json", "protocols/shared/00551-nivolumab-3-mg-kg-with-ipilimumab-1-mg-kg-therapy.json", "protocols/shared/00558-pembrolizumab-400mg-monotherapy.json", "protocols/gastrointestinal/00585-cetuximab-14-day-and-folfiri-14-day-therapy.json", "protocols/gastrointestinal/00732-cetuximab-therapy-14-days.json", "protocols/gastrointestinal/00733-cetuximab-and-modified-folfox-6-therapy.json", "protocols/gastrointestinal/00890-fruquintinib-monotherapy.json", "protocols/gastrointestinal/00900-nivolumab-240-mg-and-ipilimumab-1-mg-kg-therapy.json"]);
const RECORD=path.join(__dirname,'../../validation/colorectal-v08435/retrospective-hashes.json');
const SHA=/^[a-f0-9]{64}$/;
function safeRelative(file){return typeof file==='string'&&file.length>0&&!file.includes('\\')&&!file.includes('\0')&&!file.startsWith('/')&&!file.split('/').some(s=>s==='.'||s==='..'||s==='');}
function approvedPath(file){
 if(!safeRelative(file))return false;
 if(PROTOCOLS.has(file))return true;
 let m=file.match(/^data\/patient-knowledge\/(\d{5})\.json$/);
 if(m)return CODES.includes(m[1])&&!BEV.has(m[1]);
 m=file.match(/^data\/patient-knowledge-contexts\/(\d{5})\/colorectal\.json$/);
 if(m)return BEV.has(m[1]);
 m=file.match(/^(?:patient|docs\/patient)\/(\d{5})\/(.+)$/);
 if(!m||!CODES.includes(m[1]))return false;
 const tail=m[2];
 if(BEV.has(m[1]))return (file.startsWith('patient/')&&tail==='scope.html')||/^colorectal\/[a-z0-9_-]+\.(?:html|pdf|png)$/.test(tail);
 return /^[a-z0-9_-]+\.(?:html|pdf|png)$/.test(tail);
}
function createMigration(record){
 if(!record||record.schema_version!==1||record.base_commit!==BASE_COMMIT||!Array.isArray(record.codes)||JSON.stringify([...record.codes].sort())!==JSON.stringify(CODES)||!record.files||Array.isArray(record.files)||typeof record.files!=='object'||!Object.keys(record.files).length)throw Error('Invalid reviewed v35 migration record');
 const entries=new Map();
 for(const [file,change]of Object.entries(record.files)){
  if(!approvedPath(file))throw Error('Unapproved v35 migration path '+file);
  if(!change||(change.before!==null&&!SHA.test(change.before))||!SHA.test(change.after)||change.before===change.after)throw Error('Invalid v35 migration hashes '+file);
  entries.set(file,Object.freeze({before:change.before,after:change.after}));
 }
 return function expectedHash(file,original){
  if(!safeRelative(file))throw Error('Unsafe v35 migration lookup '+file);
  const change=entries.get(file);if(!change)return original;
  if(original!==change.before&&original!==change.after)throw Error('Unexpected v35 original hash '+file);
  return change.after;
 };
}
let migration;
function expectedHash(file,original){
 if(!migration)migration=createMigration(JSON.parse(fs.readFileSync(RECORD,'utf8')));
 return require('./retrospective-v08436.cjs').expectedHash(file,migration(file,original));
}
function expectedBuilderHash(file,original){
 if(!safeRelative(file)||!/^tools\/[a-zA-Z0-9_-]+\.(?:cjs|js|py)$/.test(file))throw Error('Unsafe v35 builder lookup '+file);
 const entries=JSON.parse(fs.readFileSync(path.join(__dirname,'../../validation/colorectal-v08435/shared-builder-revisions.json'),'utf8'));
 const change=entries[file];if(!change)return require('./retrospective-v08436.cjs').expectedBuilderHash(file,original);
 if(!change||!SHA.test(change.after)||(change.before!==null&&!SHA.test(change.before)))throw Error('Invalid v35 builder hashes '+file);
 if(original!==change.before)throw Error('Unexpected v35 original builder '+file);
 return require('./retrospective-v08436.cjs').expectedBuilderHash(file,change.after);
}
module.exports={expectedBuilderHash,expectedHash,createMigration,approvedPath,safeRelative,BASE_COMMIT,CODES,RECORD};
