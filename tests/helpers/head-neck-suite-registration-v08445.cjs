'use strict';
const assert=require('node:assert/strict');
const added=['00385','00387','00705','00706'];
function registry(codes,prior){assert.equal(prior.length,199);assert(added.every(x=>!prior.includes(x)));assert.deepEqual([...codes].sort(),[...prior,...added].sort(),'All 199 prior roots plus four explicit v45 roots; cetuximab adds a context only');}
module.exports={registry,added};
