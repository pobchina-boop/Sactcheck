'use strict';
// Execute original source assertions without rewriting archived scripts/reports.
// The only clinical expectation amendment below is the explicitly audited 00706
// fractional CrCl gap: printed 50–59 is not silently widened to below 60.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm'),cp=require('node:child_process'),crypto=require('node:crypto'),{createRequire}=require('node:module');
const root=path.resolve(__dirname,'..'),baseline='a47e75b2765fdb10f5795152c0866f016aceb14e',name=process.argv[2];
const config={combo:{script:'validation/head-neck-v08445/combo/source-cases.cjs',report:'validation/head-neck-v08445/combo/source-case-results-integrated.json',args:['--integrated']},cetux:{script:'validation/head-neck-v08445/cetux-chemo/source-cases.cjs',report:'validation/head-neck-v08445/cetux-chemo/integrated-results.json',args:['--integrated']}}[name];
assert(config,'Usage: node tests/source-replays-v08447.cjs combo|cetux');
const src=path.join(root,config.script),original=fs.readFileSync(src),frozen=cp.execFileSync('git',['show',baseline+':'+config.script],{cwd:root,maxBuffer:8e6});assert(original.equals(frozen),'Historical source cases must remain exact Git46 bytes');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),amendments=[];let code=original.toString();
if(name==='combo'){
 const before="yes:v<50?['CIS_RENAL_LOW']:v<60?['CIS_RENAL_50_59']:[]";
 const after="yes:v<50?['CIS_RENAL_LOW']:v<=59?['CIS_RENAL_50_59']:v<60?['HN47_CIS_RENAL_FRACTIONAL_GAP']:[]";
 assert.equal(code.split(before).length,2,'Unique original renal assertion anchor');code=code.replace(before,after);
 amendments.push({protocol:'00706',source:'NCCP00706v3 p4 Table3',before:'A numeric CrCl59.999 required the 50–59 row.',after:'CrCl59.999 requires a separate consultant interpretation; no automatic source percentage.',reason:'The source prints 50–59, not 50 to below60; this makes the current assertion consistent with exact source bounds. Original test retained untouched.'});
}
const archive=path.join(root,config.report),archiveBytes=fs.readFileSync(archive),destination=path.join(root,'validation/head-neck-v08447/retained-'+name+'-cases.json');let writes=0;
const wrappedFs={...fs,writeFileSync(file,data,...args){assert.equal(path.resolve(String(file)),archive,'Unexpected historical write');writes++;return fs.writeFileSync(destination,data,...args);}};
const req=createRequire(src),scopedRequire=n=>['fs','node:fs'].includes(n)?wrappedFs:req(n),proc={...process,argv:[process.execPath,src,...config.args],exitCode:0};
vm.compileFunction(code,['require','__dirname','process','console'],{filename:src})(scopedRequire,path.dirname(src),proc,{...console,log(){}});
assert.equal(writes,1);assert(archiveBytes.equals(fs.readFileSync(archive)),'Historical result changed');assert(original.equals(fs.readFileSync(src)),'Historical script changed');
const results=JSON.parse(fs.readFileSync(destination));assert.equal(results.failed,0,JSON.stringify((results.cases||results.results).filter(r=>!r.pass)));assert.equal(results.passed,results.total);
fs.writeFileSync(path.join(root,'validation/head-neck-v08447/retained-'+name+'-verification.json'),JSON.stringify({release:'0.84.47',baseline_commit:baseline,script:config.script,script_sha256:sha(original),historical_report:config.report,historical_report_sha256:sha(archiveBytes),amendments,total:results.total,passed:results.passed,all_archived_bytes_unchanged:true},null,2)+'\n');
console.log('v47 retained '+name+': '+results.passed+'/'+results.total+'; archived scripts/reports unchanged.');
