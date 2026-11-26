'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),cp=require('node:child_process');
const prior=require('./card-startup-checkpoint.cjs');
const root=path.resolve(__dirname,'../..'),base='3368f80d8c6f0390ccd085b34609a87cbea4cf50';
const filename='validation/card-startup-20261125/transition.json',checkpoint='tests/helpers/card-startup-checkpoint.cjs';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const historic=(revision,file)=>cp.execFileSync('git',['show',revision+':'+file],{cwd:root,maxBuffer:64*1024*1024});
const raw=fs.readFileSync(path.join(root,filename));assert.equal(hash(raw),'b3e2aabb1074fe5f8167e1baa145b36181b53e2524ac115183892abf19c4d302');
const record=JSON.parse(raw);assert.equal(record.base,base);const files=record.files;
assert(fs.readFileSync(path.join(root,checkpoint)).equals(historic(base,'tests/helpers/live-release-v08464.cjs')));
for(const[file,entry]of Object.entries(files)){if(entry.before===null)continue;const before=historic(base,file);assert.equal(hash(before),entry.before,file+' published predecessor');assert.equal(before.length,entry.before_bytes);}
function verifyFile(file){const entry=files[file];if(!entry)return prior.verifyFile(file);const bytes=fs.readFileSync(path.join(root,file));assert.equal(hash(bytes),entry.after,file+' reviewed UI change');assert.equal(bytes.length,entry.after_bytes,file);}
function isCurrent(file,digest,size){const entry=files[file];return entry?digest===entry.after&&(size===undefined||size===entry.after_bytes):prior.isCurrent(file,digest,size);}
function expected(file,digest,size){const entry=files[file];if(!entry)return prior.expected(file,digest,size);if(!isCurrent(file,digest,size)){const old=prior.expected(file,digest,size);assert.equal(old.sha256,entry.before,file+' predecessor');if(old.bytes!==undefined)assert.equal(old.bytes,entry.before_bytes);}return {sha256:entry.after,bytes:entry.after_bytes};}
function beforeStartupBytes(file){if(!files[file])return fs.readFileSync(path.join(root,file));verifyFile(file);return historic(base,file);}
function astraBytes(file){if(!files[file])return prior.astraBytes(file);verifyFile(file);return historic('51bded8c59210c052873b577af444f07579fd44f',file);}
function owns(file){if(file===filename||file===checkpoint)return true;if(!files[file])return prior.owns(file);verifyFile(file);return true;}
const addition=file=>file===filename||file===checkpoint||files[file]?.before===null||prior.addition(file);
function checkedInventory(inventory){return {...inventory,helper:{...inventory.helper,approvedPath(file){if(files[file]&&inventory.record.files[file]){verifyFile(file);return true;}return inventory.helper.approvedPath(file);}}};}
const startupInventory=()=>({version:65,record,helper:{approvedPath:file=>!!files[file]&&owns(file)}});
module.exports={...prior,verifyFile,isCurrent,expected,beforeStartupBytes,astraBytes,astraJson:file=>JSON.parse(astraBytes(file)),owns,addition,startupInventory,gynaecologyInventory:()=>checkedInventory(prior.gynaecologyInventory()),sarcomaInventory:()=>checkedInventory(prior.sarcomaInventory()),gynae65Inventory:()=>checkedInventory(prior.gynae65Inventory())};
