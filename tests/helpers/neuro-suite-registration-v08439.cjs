'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),dir=path.join(root,'validation/neuro-oncology-v08439');
const before=path.join(dir,'patient-asset-registry-v08438.before.cjs');
const hashes=JSON.parse(fs.readFileSync(path.join(dir,'baseline-v08438-file-hashes.json')));
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(before)).digest('hex'),hashes['js/patient-asset-registry-v0810.js']);
const prior=require(before).codes;assert.equal(prior.length,183);
const added=['00742', '00804', '00805', '00806', '00813'];assert(added.every(c=>!prior.includes(c)));
const expected=[...prior,...added].sort();
function registry(codes){assert.deepEqual([...codes].sort(),expected,'All183 preceding suites plus exactly five audited glioma suites');}
function priorRegistry(codes){assert.deepEqual([...codes].sort(),[...prior].sort(),'Preceding registry is preserved exactly');}
function profiles(names){registry(names.map(n=>n.replace(/\.json$/,'')));}
module.exports={registry,profiles,priorRegistry,added};
