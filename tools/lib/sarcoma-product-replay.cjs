'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const pair=require('../../tests/helpers/ifosfamide-pair-v08462.cjs');
function verify(current, historical) {
  assert.equal(current.total,112);
  assert.equal(current.results.length,historical.results.length);
  const revised=new Map();
  for(const pin of current.protocols){
    if(['00391','00392'].includes(pin.code)){
      assert.equal(pin.sha256,pair.validate(require(path.join(root,pin.path))).after_sha256);
      revised.set(pin.code,new Set());
    }
  }
  for(const [i,row] of current.results.entries()){
    const before=historical.results[i];
    for(const field of ['code','name','input','expected'])assert.deepEqual(row[field],before[field]);
    if(!revised.has(row.code)){assert.deepEqual(row,before);continue;}
    assert(!row.observed.components.some(c=>c.quantified));
    const low=row.name.startsWith('One low count overrides intermediate/missing partner ');
    const boundary=row.name==='Exactly shared count boundary retains source distinction';
    const hepatic=row.name==='Absolute bilirubin51.3 with AST300 does not invent ifos hepatic row' ||
                 row.name==='Absolute bilirubin51.31 independently activates ifos review';
    if(!(low||boundary||hepatic)){assert.equal(row.status,'passed',row.name);continue;}
    revised.get(row.code).add(row.name);
    const ifos=row.observed.components.find(c=>c.component==='ifosfamide');
    assert.equal(ifos.action,'withhold');
    assert(row.observed.findings.some(f=>f.id.startsWith('IFO_PRODUCT_') && f.action==='withhold' && f.components.join()==='ifosfamide'));
    const dox=row.observed.components.find(c=>c.component==='doxorubicin');
    const priorDox=before.observed.components.find(c=>c.component==='doxorubicin');
    assert.deepEqual(dox,priorDox,row.name+' retains the independent doxorubicin decision');
    if(low)assert.equal(dox.action,'delay');
  }
  for(const names of revised.values())assert.equal(names.size,7);
  console.log('112 current cases checked, including 14 adjudicated ifosfamide product holds on the two shared regimens.');
}
module.exports={verify};
