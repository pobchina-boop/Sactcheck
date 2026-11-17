'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),m=require('./helpers/retrospective-v08458.cjs');
test('v58 retains Git57 provenance and a bounded ten-suite transition',async()=>{
 assert.equal(m.BASE_COMMIT,'0eba2249a65dce9bcdf6be1b2115869b9563cd38');assert.equal(m.NEW_ROUTES.length,10);assert.equal(m.ROUTES.length,299);
 for(const f of ['patient/00568/guide.pdf','protocols/lung/00568-pembrolizumab-pemetrexed-carboplatin.json','../unsafe','js/assessment-engine.js','patient/00588/guide.pdf'])assert.equal(m.approvedPath(f),false);
 for(const f of ['patient/00333/handbook.pdf','docs/patient/00450/port-pump.pdf','data/regimen-knowledge-base-v08458-addendum.json','docs/patient/00588/prostate/knowledge-print.html'])assert.equal(m.approvedPath(f),true);
 const r=JSON.parse(fs.readFileSync(m.RECORD)),convert=m.createMigration(r),[f,c]=Object.entries(r.files).find(([f,c])=>c.before);assert.equal(convert(f,c.before),c.after);assert.throws(()=>convert(f,'0'.repeat(64)));const counts=m.verifyCurrent(r);assert(counts.protectedCount>12000);assert(counts.currentCount>=counts.protectedCount);
});

test('complete historical migration chain remains required',async()=>{assert((await m.verifyBeforeHashes())>0);});
