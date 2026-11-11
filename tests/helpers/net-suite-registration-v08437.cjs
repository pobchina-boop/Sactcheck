'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const dir=path.join(__dirname,'../../validation/neuroendocrine-v08437');
const before=path.join(dir,'patient-asset-registry-v08436.before.cjs');
const hashes=JSON.parse(fs.readFileSync(path.join(dir,'baseline-v08436-file-hashes.json')));
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(before)).digest('hex'),hashes['js/patient-asset-registry-v0810.js']);
const prior=require(before).codes;assert.equal(prior.length,174);
const added=['00320','00327','00505','00642'];assert(added.every(c=>!prior.includes(c)));
const expected=[...prior,...added].sort();
function registry(codes){const next=require('./neuro-suite-registration-v08438.cjs');next.priorRegistry(expected);next.registry(codes);}
function profiles(names){const codes=names.map(n=>n.replace(/\.json$/,''));assert(!codes.includes('00419'),'00419 has a context-only profile');const context=JSON.parse(fs.readFileSync(path.join(__dirname,'../../data/patient-knowledge-contexts/00419/head_neck.json')));assert.equal(context.code,'00419');assert.equal(context.patient_context,'head_neck');registry([...codes,'00419']);}
module.exports={registry,profiles};
