'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const dir=path.join(__dirname,'../../validation/neuroendocrine-v08437');
const before=path.join(dir,'patient-asset-registry-v08436.before.cjs');
const hashes=JSON.parse(fs.readFileSync(path.join(dir,'baseline-v08436-file-hashes.json')));
assert.equal(crypto.createHash('sha256').update(fs.readFileSync(before)).digest('hex'),hashes['js/patient-asset-registry-v0810.js']);
const prior=require(before).codes;assert.equal(prior.length,174);
const added=['00320','00327','00505','00642'];assert(added.every(c=>!prior.includes(c)));
const expected=[...prior,...added].sort();
function registry(codes){assert.deepEqual([...codes].sort(),expected,'All174 preceding suites plus exactly four audited NET suites');}
function profiles(names){registry(names.map(n=>n.replace(/\.json$/,'')));}
module.exports={registry,profiles};
