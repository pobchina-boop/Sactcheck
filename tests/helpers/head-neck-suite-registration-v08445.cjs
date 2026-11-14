'use strict';
const assert=require('node:assert/strict');
const added=['00830','00481','00477','00479','00480','00103','00577','00233','00574','00693','00294','00242','00295','00615','00893','00385','00387','00705','00706','00314','00552','00417','00418','00696','00315','00323','00324','00332','00419','00514','00517','00903','00589','00591'];
function registry(codes,prior){assert.equal(prior.length,199);assert(added.every(x=>!prior.includes(x)));assert.deepEqual([...codes].sort(),[...prior,...added].sort(),'Exact registry codes: 199 prior plus four v45, five v47 five v48 five v49 five v50, five v51 and five v52 entries; 00419 and 00294 have context-only profiles');}
module.exports={registry,added};
