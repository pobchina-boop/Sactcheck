'use strict';
// Explicit terminal migration: expected values are reviewed hashes, never current bytes.
const fs=require('node:fs'),path=require('node:path');
const BASE_COMMIT='bffd2cda167d7943ce6431ff32d5a1525509f618';
const CODES=['00236', '00415', '00431', '00563', '00812'];
const PROTOCOLS=new Set(["protocols/index.json", "protocols/shared/00551-nivolumab-3-mg-kg-with-ipilimumab-1-mg-kg-therapy.json", "protocols/shared/00483-nivolumab-monotherapy-14-day.json", "protocols/shared/00484-nivolumab-monotherapy-28-day.json", "protocols/shared/00455-pembrolizumab-200-mg-monotherapy.json", "protocols/gynaecology/00812-cemiplimab-therapy.json", "protocols/shared/00558-pembrolizumab-400mg-monotherapy.json", "protocols/skin/00236-vismodegib-monotherapy.json", "protocols/skin/00415-trametinib-and-dabrafenib-therapy.json", "protocols/skin/00431-nivolumab-1-mg-kg-and-ipilimumab-3-mg-kg-therapy.json", "protocols/skin/00563-encorafenib-and-binimetinib-therapy.json"]);
const RECORD=path.join(__dirname,'../../validation/skin-melanoma-v08440/retrospective-hashes.json');
const SHA=/^[a-f0-9]{64}$/;
function safeRelative(file){return typeof file==='string'&&file.length>0&&!file.includes('\\')&&!file.includes('\0')&&!file.startsWith('/')&&!file.split('/').some(s=>s==='.'||s==='..'||s==='');}
function approvedPath(file){
 if(!safeRelative(file))return false;
 if(PROTOCOLS.has(file))return true;
 let m=file.match(/^data\/patient-knowledge\/(\d{5})\.json$/);
 if(m)return CODES.includes(m[1])||['00455','00558','00483','00484','00551'].includes(m[1]);
 if(/^data\/patient-knowledge\/(00455|00558|00483|00484|00551)\.json$/.test(file)||/^data\/patient-knowledge-contexts\/(00455|00558)\/colorectal\.json$/.test(file))return true;
 if(file==='data/patient-knowledge-contexts/00415/adjuvant.json')return true;
 m=file.match(/^(?:patient|docs\/patient)\/(\d{5})\/(.+)$/);
 if(m&&['00455','00558','00483','00484','00551'].includes(m[1])){let leaf=m[2];if(['00455','00558'].includes(m[1])&&leaf.startsWith('colorectal/'))leaf=leaf.slice(11);return /^(?:index\.html|knowledge(?:-print)?\.(?:html|pdf)|handbook\.pdf|passport\.(?:html|pdf)|supportive-care(?:-overview)?\.(?:html|pdf)|support-[a-z0-9_-]+\.(?:html|pdf))$/.test(leaf);}
 if(!m||!CODES.includes(m[1]))return false;
 if(m[1]==='00415'&&m[2].startsWith('adjuvant/'))m[2]=m[2].slice(9);
 return /^[a-z0-9_-]+\.(?:html|pdf|png)$/.test(m[2]);
}
function createMigration(record){
 if(!record||record.schema_version!==1||record.base_commit!==BASE_COMMIT||record.base_release!=='0.84.39'||!Array.isArray(record.codes)||JSON.stringify([...record.codes].sort())!==JSON.stringify(CODES)||!record.files||Array.isArray(record.files)||typeof record.files!=='object'||!Object.keys(record.files).length)throw Error('Invalid reviewed v40 migration record');
 const entries=new Map();
 for(const [file,change]of Object.entries(record.files)){
  if(!approvedPath(file))throw Error('Unapproved v40 migration path '+file);
  if(!change||(change.before!==null&&!SHA.test(change.before))||!SHA.test(change.after)||change.before===change.after)throw Error('Invalid v40 migration hashes '+file);
  entries.set(file,Object.freeze({before:change.before,after:change.after}));
 }
 return function expectedHash(file,original){
  if(!safeRelative(file))throw Error('Unsafe v40 migration lookup '+file);
  const change=entries.get(file);if(!change)return original;
  if(original!==change.before&&original!==change.after)throw Error('Unexpected v40 original hash '+file);
  return change.after;
 };
}
let migration;
function expectedHash(file,original){
 if(!migration)migration=createMigration(JSON.parse(fs.readFileSync(RECORD,'utf8')));
 return require('./retrospective-v08441.cjs').expectedHash(file,migration(file,original));
}
function expectedBuilderHash(file,original){
 if(!safeRelative(file)||!/^tools\/[a-zA-Z0-9_-]+\.(?:cjs|js|py)$/.test(file))throw Error('Unsafe v40 builder lookup '+file);
 const entries=JSON.parse(fs.readFileSync(path.join(__dirname,'../../validation/skin-melanoma-v08440/shared-builder-revisions.json'),'utf8'));
 const change=entries[file];if(!change)return require('./retrospective-v08441.cjs').expectedBuilderHash(file,original);
 if(!change||!SHA.test(change.after)||(change.before!==null&&!SHA.test(change.before)))throw Error('Invalid v40 builder hashes '+file);
 if(original!==change.before)throw Error('Unexpected v40 original builder '+file);
 return require('./retrospective-v08441.cjs').expectedBuilderHash(file,change.after);
}
module.exports={expectedBuilderHash,expectedHash,createMigration,approvedPath,safeRelative,BASE_COMMIT,CODES,RECORD};
