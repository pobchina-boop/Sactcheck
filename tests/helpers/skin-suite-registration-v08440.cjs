'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),dir=path.join(root,'validation/skin-melanoma-v08440');
const before=path.join(dir,'patient-asset-registry-v08439.before.cjs');
const hashes=JSON.parse(fs.readFileSync(path.join(dir,'baseline-v08439-file-hashes.json')));
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(before)).digest('hex'),hashes['js/patient-asset-registry-v0810.js']);
const prior=require(before).codes;assert.equal(prior.length,188);
const added=['00236', '00415', '00431', '00563', '00812'];assert(added.every(c=>!prior.includes(c)));
const expected=[...prior,...added].sort();
function registry(codes){assert.deepEqual([...codes].sort(),expected,'All188 preceding suites plus exactly five audited skin/melanoma suites');}
function priorRegistry(codes){assert.deepEqual([...codes].sort(),[...prior].sort(),'Preceding registry is preserved exactly');}
function profiles(names){registry(names.map(n=>n.replace(/\.json$/,'')));}
module.exports={registry,profiles,priorRegistry,added};
