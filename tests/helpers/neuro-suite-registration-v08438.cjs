'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),dir=path.join(root,'validation/neuro-oncology-v08438');
const before=path.join(dir,'patient-asset-registry-v08437.before.cjs');
const hashes=JSON.parse(fs.readFileSync(path.join(dir,'baseline-v08437-file-hashes.json')));
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(before)).digest('hex'),hashes['js/patient-asset-registry-v0810.js']);
const prior=require(before).codes;assert.equal(prior.length,178);
const added=['00334','00342','00379','00461','00658'];assert(added.every(c=>!prior.includes(c)));
const expected=[...prior,...added].sort();
function registry(codes){assert.deepEqual([...codes].sort(),expected,'All178 preceding suites plus exactly five audited glioma suites');}
function priorRegistry(codes){assert.deepEqual([...codes].sort(),[...prior].sort(),'Preceding registry is preserved exactly');}
function profiles(names){registry(names.map(n=>n.replace(/\.json$/,'')));}
module.exports={registry,profiles,priorRegistry,added};
