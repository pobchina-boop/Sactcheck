'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),file='validation/release-repair-v08460/changes.json';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const raw=fs.readFileSync(path.join(root,file));assert.equal(sha(raw),'bd05628e8570ccda85d7f4cccd55cf8d0887c224362838b75eab92483452b649');
const record=JSON.parse(raw);assert.equal(record.base_commit,'ee5f22c222afc35b6c220bbdd9f3c8a3041d6777');
function expected(f,h,n){const c=record.files[f];if(!c)return {sha256:h,bytes:n};assert.equal(h,c.before,f+' repair origin');assert.equal(n,c.before_bytes,f+' repair origin size');return{sha256:c.after,bytes:c.after_bytes};}
function verify(){for(const[f,c]of Object.entries(record.files)){const b=fs.readFileSync(path.join(root,f));assert.equal(sha(b),c.after,f+' exact repair');assert.equal(b.length,c.after_bytes,f+' repair size');}return true;}
function isAddition(f){return f===file||f==='tests/helpers/release-repair-v08460.cjs'||record.files[f]?.before===null;}
module.exports={expected,verify,isAddition};
