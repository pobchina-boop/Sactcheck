'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const{runStage}=require('../tools/run-regression-stage.cjs');
for(const status of [0,7])test('preserves original evidence and exact exit '+status,()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'sactcheck-stage-test-')),artifacts=path.join(root,'artifacts');
 try{
  fs.writeFileSync(path.join(root,'report.json'),'original user bytes');fs.writeFileSync(path.join(root,'clinical.json'),'original clinical data');
  const result=runStage({root,artifactRoot:artifacts,reportPaths:['report.json'],command:[process.execPath,'-e',`const fs=require('node:fs');fs.writeFileSync('report.json','fresh result');fs.writeFileSync('clinical.json','changed clinical data');process.exit(${status});`]});
  assert.equal(result,status);assert.equal(fs.readFileSync(path.join(root,'report.json'),'utf8'),'original user bytes');
  assert.equal(fs.readFileSync(path.join(root,'clinical.json'),'utf8'),'changed clinical data','unregistered source changes must remain visible');
  const dir=path.join(artifacts,fs.readdirSync(artifacts)[0]);assert.equal(fs.readFileSync(path.join(dir,'report.json'),'utf8'),'fresh result');
  const record=JSON.parse(fs.readFileSync(path.join(dir,'stage.json')));assert.equal(record.exit_code,status);assert.equal(record.restored_reports.length,1);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
