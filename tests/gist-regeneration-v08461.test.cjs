'use strict';
const cp=require('node:child_process'),path=require('node:path');
const root=path.resolve(__dirname,'..');
for(const [codes,context] of [['00335',''],['00325,00719,00244','gist']]){
 cp.execFileSync(process.execPath,['tools/build-complete-pathways.cjs','--check'],{cwd:root,env:{...process.env,SACT_SUITE_CODES:codes,SACT_SUITE_CONTEXT:context},stdio:'inherit'});
}
// The root sunitinib pages are context selectors, not generic treatment plans.
cp.execFileSync(process.execPath,['tools/build-complete-pathways.cjs','--check'],{cwd:root,env:{...process.env,SACT_SUITE_CODES:'00325,00719',SACT_SUITE_CONTEXT:''},stdio:'inherit'});
console.log('Four GIST pathway regeneration checks and context-only root handling passed.');

cp.execFileSync(process.execPath,['tools/build-gist-scope-v08461.cjs','--check'],{cwd:root,stdio:'inherit'});
