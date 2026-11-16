'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),m=require('./helpers/retrospective-v08456.cjs');
test('v56 uses actual Git55 and bounded five-suite transitions',async()=>{
 assert.equal(m.BASE_COMMIT,'8fea74b7b5c8daf0a2c4101cdb96b50265c368d7');assert.equal(m.NEW_ROUTES.length,5);assert.equal(m.ROUTES.length,284);
 for(const f of ['patient/00568/guide.pdf','protocols/lung/00568-pembrolizumab-pemetrexed-carboplatin.json','../unsafe','js/assessment-engine.js'])assert.equal(m.approvedPath(f),false);
 for(const f of ['patient/00203/prostate/guide.pdf','docs/patient/00101/consent-form.pdf','data/regimen-knowledge-base-v08456-addendum.json'])assert.equal(m.approvedPath(f),true);
 const r=JSON.parse(fs.readFileSync(m.RECORD)),convert=m.createMigration(r),[f,c]=Object.entries(r.files).find(([f,c])=>c.before);assert.equal(convert(f,c.before),c.after);assert.throws(()=>convert(f,'0'.repeat(64)));assert((await m.verifyBeforeHashes(r))>0);const counts=m.verifyCurrent(r);assert(counts.protectedCount>11000);assert(counts.currentCount>=counts.protectedCount);
});
