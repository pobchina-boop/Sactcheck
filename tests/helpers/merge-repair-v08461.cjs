'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),file='validation/merge-repair-v08461/changes.json';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const raw=fs.readFileSync(path.join(root,file));assert.equal(sha(raw),'da3354271ed8f35fb638de3524d7f6c08e5fa5032b84a61741e869ec4eb6662f');const record=JSON.parse(raw);
function expected(f,h,n){const c=record.files[f];if(!c)return{sha256:h,bytes:n};assert.equal(h,c.before,f+' merge origin');if(n!==undefined)assert.equal(n,c.before_bytes,f+' merge size');return{sha256:c.after,bytes:c.after_bytes};}
function fromRepair(f,h,n){const old=JSON.parse(fs.readFileSync(path.join(root,'validation/release-repair-v08460/changes.json'))).files[f];assert.equal(h,old.after);assert.equal(n,old.after_bytes);return record.repair_targets[f];}
function verify(){for(const[f,c]of Object.entries(record.files)){const b=fs.readFileSync(path.join(root,f));assert.equal(sha(b),c.after,f+' merge bytes');assert.equal(b.length,c.after_bytes);}for(const[f,c]of Object.entries(record.additions)){const b=fs.readFileSync(path.join(root,f));assert.equal(sha(b),c.sha256,f+' retained repair addition');assert.equal(b.length,c.bytes);}return true;}
function isAddition(f){return f===file||f==='tests/helpers/merge-repair-v08461.cjs'||Object.hasOwn(record.additions,f);}
module.exports={expected,fromRepair,verify,isAddition};
