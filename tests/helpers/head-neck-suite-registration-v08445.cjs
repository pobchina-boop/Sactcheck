'use strict';
const assert=require('node:assert/strict');
const added=['00104','00326','00518','00564','00101','00257','00313','00546','00482','00492','00493','00494','00848','00478','00488','00489','00490','00491','00830','00481','00477','00479','00480','00103','00577','00233','00574','00693','00294','00242','00295','00615','00893','00385','00387','00705','00706','00314','00552','00417','00418','00696','00315','00323','00324','00332','00419','00514','00517','00903','00589','00591'];
const gu58=['00282','00622','00628','00450','00759','00333','00337','00338','00583','00846'];
const gu59=['00453','00602','00807','00885','00894','00945'];
const sarcoma60=['00500','00391','00392','00501','00511','00335','00325','00719'];
function registry(codes,prior){
  assert.equal(prior.length,199);
  assert(added.every(x=>!prior.includes(x)));
  assert(gu58.every(x=>!prior.includes(x)&&!added.includes(x)));
  const through61=[...prior,...added,...gu58,...gu59,...sarcoma60];
  assert.equal(new Set(through61).size,275,'All previously reviewed routes must remain distinct');
  const {NEW_ROUTES}=require('./retrospective-v08462.cjs');
  assert.deepEqual(NEW_ROUTES,['00897','00926','00953']);
  const through62=[...through61,...NEW_ROUTES];
  assert.equal(new Set(through62).size,278);
  const olaparib=require('./retrospective-v08463.cjs');
  assert.deepEqual(olaparib.NEW_ROUTES,['00588/ovarian_first_line','00588/ovarian_relapsed','00588/pancreatic','00746']);
  assert(!through62.includes('00746'));
  const expected=[...through62,'00746'];
  assert.equal(new Set(expected).size,279);
  const gynaecology = require('./gynaecology-00862-00929.cjs').NEW_ROUTES;
  assert.deepEqual(gynaecology,['00862','00929']);
  const sarcoma = require('./retrospective-v08464.cjs').NEW_ROUTES;
  assert.deepEqual(sarcoma,['00374','00228/liposarcoma','00205/sarcoma','00462','00554']);
  assert.deepEqual([...codes].sort(),[...expected,...gynaecology,...sarcoma.filter(route=>!route.includes('/'))].sort(),'Every released root is present exactly once');
}
module.exports={registry,added};
