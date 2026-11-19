'use strict';
const assert=require('node:assert/strict');
const added=['00104','00326','00518','00564','00101','00257','00313','00546','00482','00492','00493','00494','00848','00478','00488','00489','00490','00491','00830','00481','00477','00479','00480','00103','00577','00233','00574','00693','00294','00242','00295','00615','00893','00385','00387','00705','00706','00314','00552','00417','00418','00696','00315','00323','00324','00332','00419','00514','00517','00903','00589','00591'];
const gu58=['00282','00622','00628','00450','00759','00333','00337','00338','00583','00846'];
const gu59=['00453','00602','00807','00885','00894','00945'];
const sarcoma60=['00500','00391','00392','00501','00511','00335','00325','00719'];
function registry(codes,prior){assert.equal(prior.length,199);assert(added.every(x=>!prior.includes(x)));assert(gu58.every(x=>!prior.includes(x)&&!added.includes(x)));assert.equal(new Set([...prior,...added,...gu58,...gu59,...sarcoma60]).size,275,'Expected route lists must be distinct');assert.deepEqual([...codes].sort(),[...prior,...added,...gu58,...gu59,...sarcoma60].sort(),'Exact registry codes: preserved 251 prior plus ten v58, six v59 and five v60 root suites and three v61 GIST root routes');}
module.exports={registry,added};
