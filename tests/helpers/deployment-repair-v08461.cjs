'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),file='validation/deployment-repair-v08461/changes.json';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const raw=fs.readFileSync(path.join(root,file));assert.equal(sha(raw),'d6dae27c926980530f3df6cc1c17e6fbfbf2f7efcbb5d3ab8c00f5923ce3c065');const record=JSON.parse(raw);
assert.equal(record.base_commit,'7f2aaa63c09af2db055c11ca0d9c54709efc42ba');
const next=require('./ribociclib-review-v08461.cjs');
function expected(f,h,n){const c=record.files[f];if(!c)return next.expected(f,h,n);assert.equal(h,c.before,f+' deployment repair origin');if(n!==undefined)assert.equal(n,c.before_bytes,f+' deployment repair origin size');return next.expected(f,c.after,c.after_bytes);}
function verify(){for(const[f,c]of Object.entries(record.files)){const b=fs.readFileSync(path.join(root,f));const e=next.expected(f,c.after,c.after_bytes);assert.equal(sha(b),e.sha256,f+' deployment repair bytes');assert.equal(b.length,e.bytes);}return next.verify();}
function isAddition(f){return next.isAddition(f)||f===file||f==='tests/helpers/deployment-repair-v08461.cjs'||record.files[f]?.before===null;}
function inventory(){return {version:61,helper:{approvedPath:f=>Object.hasOwn(record.files,f)||Object.hasOwn(next.files,f)},record:{files:{...record.files,...next.files}}};}
module.exports={expected,verify,isAddition,inventory};
