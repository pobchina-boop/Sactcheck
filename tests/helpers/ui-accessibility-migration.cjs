'use strict';
// Explicitly reviewed asset migration. Expected values never come from current files.
const fs=require('node:fs'),path=require('node:path');
const RECORD=path.join(__dirname,'../../validation/ui-usability-fixes-20261105/ui-asset-hashes.json');
const SHA256=/^[a-f0-9]{64}$/;
const ASSET=/^(?:patient|docs\/patient)\/\d{5}(?:\/[a-z0-9_]+)?\/(?:index\.html|knowledge(?:-print)?\.html|supportive-care\.html|support-[a-z0-9_-]+\.html|consent-form\.pdf|knowledge\.pdf|handbook\.pdf)$/;
// These shared controls and styles have reviewed UI changes protected by the
// Phesgo fixture. Keep this list exact; it does not authorize other source files.
const SHARED_ASSETS=new Set(['assets/patient/phase-support-v0838.js','assets/patient/consent-discussion.js','assets/patient/consent-form-v0819.css','assets/patient/complete-pathways-v0830.css']);
function safeRelative(file){return typeof file==='string'&&file.length>0&&!file.includes('\\')&&!file.includes('\0')&&!file.startsWith('/')&&!file.split('/').some(segment=>segment==='.'||segment==='..'||segment==='');}
function createMigration(record){
 if(!record||record.schema_version!==1||!/^[a-f0-9]{40}$/.test(record.baseline_commit)||!Array.isArray(record.files)||record.files.length===0)throw Error('Invalid reviewed UI asset migration record');
 const files=new Map();
 for(const entry of record.files){
  if(!entry||!safeRelative(entry.file)||(!ASSET.test(entry.file)&&!SHARED_ASSETS.has(entry.file)))throw Error('Unapproved UI asset migration path '+entry?.file);
  if(files.has(entry.file))throw Error('Duplicate UI asset migration '+entry.file);
  if(!SHA256.test(entry.before)||!SHA256.test(entry.after)||entry.before===entry.after)throw Error('Invalid UI asset migration hashes '+entry.file);
  files.set(entry.file,Object.freeze({before:entry.before,after:entry.after}));
 }
 return function expectedHash(file,original){
  if(!safeRelative(file))throw Error('Unsafe UI asset migration lookup '+file);
  const change=files.get(file);if(!change)return original;
  if(original!==change.before&&original!==change.after)throw Error('Unexpected UI asset migration original hash '+file);
  return change.after;
 };
}
const expectedHash=createMigration(JSON.parse(fs.readFileSync(RECORD,'utf8')));
module.exports={expectedHash,createMigration};
