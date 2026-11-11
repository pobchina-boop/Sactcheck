'use strict';
const assert=require('node:assert/strict');
const added=['00385','00387','00705','00706','00314','00552','00417','00418','00696','00315','00323','00324','00332','00419'];
function registry(codes,prior){assert.equal(prior.length,199);assert(added.every(x=>!prior.includes(x)));assert.deepEqual([...codes].sort(),[...prior,...added].sort(),'Exact registry codes: 199 prior plus four v45, five v47 and five v48 entries; 00419 is a context-only entry');}
module.exports={registry,added};
