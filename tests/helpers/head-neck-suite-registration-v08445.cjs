'use strict';
const assert=require('node:assert/strict');
const added=['00385','00387','00705','00706','00314','00552','00417','00418','00696'];
function registry(codes,prior){assert.equal(prior.length,199);assert(added.every(x=>!prior.includes(x)));assert.deepEqual([...codes].sort(),[...prior,...added].sort(),'All 199 prior roots plus four explicit v45 and five v47 roots; context-only additions remain separate');}
module.exports={registry,added};
