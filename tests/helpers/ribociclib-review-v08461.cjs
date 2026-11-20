'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),file='validation/ribociclib-review-v08461/changes.json';
const record=JSON.parse(fs.readFileSync(path.join(root,file)));assert.equal(record.base_commit,'a8ad69a63b129508de65dcb020160ce67d8b95ae');
function expected(f,h,n){const c=record.files[f];if(!c)return{sha256:h,bytes:n};assert.equal(h,c.before,f+' ribociclib review origin');if(n!==undefined)assert.equal(n,c.before_bytes,f+' ribociclib review origin size');return{sha256:c.after,bytes:c.after_bytes};}
function verify(){for(const[f,c]of Object.entries(record.files)){const b=fs.readFileSync(path.join(root,f));assert.equal(crypto.createHash('sha256').update(b).digest('hex'),c.after,f+' ribociclib review bytes');assert.equal(b.length,c.after_bytes);}return true;}
function isAddition(f){return f===file||record.files[f]?.before===null;}
module.exports={expected,verify,isAddition,files:record.files};
