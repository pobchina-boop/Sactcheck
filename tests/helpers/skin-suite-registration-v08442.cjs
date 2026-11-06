'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),dir=path.join(root,'validation/skin-melanoma-v08442');
const before=path.join(dir,'patient-asset-registry-v08441.before.cjs');
const hashes=JSON.parse(fs.readFileSync(path.join(dir,'baseline-v08441-file-hashes.json')));
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(before)).digest('hex'),hashes['js/patient-asset-registry-v0810.js']);
const prior=require(before).codes;assert.equal(prior.length,193);
const added=['00102','00105','00237','00373','00464','00535'];assert(added.every(c=>!prior.includes(c)));
const expected=[...prior,...added].sort();
function registry(codes){assert.deepEqual([...codes].sort(),expected,'All193 preceding roots plus six skin roots; shared00551 adds a context only');}
function priorRegistry(codes){assert.deepEqual([...codes].sort(),[...prior].sort(),'Preceding registry is preserved exactly');}
module.exports={registry,priorRegistry,added};
