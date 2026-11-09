'use strict';
// The v30 PDF extraction missed underlines in the 00456 count table. Replay
// every original case, changing only the two equality expectations documented
// by the v45 rendered-source review; fractional gaps remain review boundaries.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),vm=require('node:vm'),{createRequire}=require('node:module');
const R=path.resolve(__dirname,'..'),source=path.join(R,'validation/lung-completion-v08430/rt28/source-cases.cjs'),outdir=path.join(R,'validation/head-neck-v08445/platinum');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),original=fs.readFileSync(source),frozen=require('./helpers/retrospective-v08445.cjs').readFrozen('validation/lung-completion-v08430/rt28/source-cases.cjs');
assert(original.equals(frozen),'The historical v30 test remains byte-exact');
let code=original.toString();
for(const [before,after]of [['if(n>1.49&&n<=1.5)','if(n>1.49&&(cis?n<1.5:n<=1.5))'],['if(n>99&&n<=100)','if(n>99&&(cis?n<100:n<=100))']]){assert.equal(code.split(before).length,2);code=code.replace(before,after);}
const req=createRequire(source),historic=path.join(path.dirname(source),'integrated-results.json'),oldHash=hash(fs.readFileSync(historic)),output=path.join(outdir,'retained-v30-rt28-results.json');let writes=0;
const wrappedFs={...fs,writeFileSync(file,data,...args){assert.equal(path.resolve(String(file)),historic);writes++;return fs.writeFileSync(output,data,...args);}};
const scopedRequire=s=>s==='fs'||s==='node:fs'?wrappedFs:req(s);
const run=vm.compileFunction(code,['require','__dirname','process','console'],{filename:source});
run(scopedRequire,path.dirname(source),{...process,argv:[process.execPath,source,'--integrated']},{...console,log:()=>{}});
assert.equal(writes,1);assert.equal(hash(fs.readFileSync(historic)),oldHash);assert(fs.readFileSync(source).equals(original));
const result=JSON.parse(fs.readFileSync(output));assert.equal(result.total,198);assert.equal(result.passed,198);assert.equal(result.failed,0);
for(const name of ['00456 ANC 1.5','00456 platelets 100'])assert(result.results.find(r=>r.name===name)?.pass);
fs.writeFileSync(path.join(outdir,'retained-v30-rt28-verification.json'),JSON.stringify({release:'0.84.45',historical_source_sha256:hash(original),historical_result_sha256:oldHash,original_files_unchanged:true,amended_expectations:['00456 ANC 1.5: no source gap at the printed ≥1.5 boundary','00456 platelets 100: no source gap at the printed ≥100 boundary'],retained_cases:198,passed:198,failed:0,clinical_use_authorised:false},null,2)+'\n');
console.log('v45: all 198 v30 RT28 cases pass; exactly two source-verified equality expectations corrected.');
