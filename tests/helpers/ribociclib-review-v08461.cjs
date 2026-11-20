'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),file='validation/ribociclib-review-v08461/changes.json';
const record=JSON.parse(fs.readFileSync(path.join(root,file)));assert.equal(record.base_commit,'a8ad69a63b129508de65dcb020160ce67d8b95ae');
const next=require('./about-video-v08461.cjs');
function expected(f,h,n){const c=record.files[f];if(!c)return next.expected(f,h,n);assert.equal(h,c.before,f+' ribociclib review origin');if(n!==undefined)assert.equal(n,c.before_bytes,f+' ribociclib review origin size');return next.expected(f,c.after,c.after_bytes);}
function verify(){for(const[f,c]of Object.entries(record.files)){const b=fs.readFileSync(path.join(root,f)),e=next.expected(f,c.after,c.after_bytes);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),e.sha256,f+' ribociclib review bytes');assert.equal(b.length,e.bytes);}return next.verify();}
function isAddition(f){return next.isAddition(f)||f===file||record.files[f]?.before===null;}
module.exports={expected,verify,isAddition,files:{...record.files,...next.files}};
