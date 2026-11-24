'use strict';
const assert=require('node:assert/strict'),cp=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
// Compare real generator output against the reviewed whole HTML, including its
// stylesheet cascade. A separately idempotent publication hook alone cannot
// establish that a clean generator run reproduces the reviewed patient page.
for(const generator of ['tools/build-patient-knowledge.cjs','tools/build-complete-pathways.cjs','tools/build-phase-support-v0838.cjs']){
 cp.execFileSync(process.execPath,[generator,'--check'],{
  cwd:root,stdio:'inherit',env:{...process.env,SACT_SUITE_CODES:'00776'}
 });
}
cp.execFileSync(process.execPath,['tools/patient-publication-v08444.cjs','--routes','00776','--check'],{cwd:root,stdio:'inherit'});
const publication=require('../tools/patient-publication-v08444.cjs');
const ui=require('../tools/refresh-patient-ui.cjs');
const consent=require('../tools/consent-core-v08455.cjs');
const profile=JSON.parse(fs.readFileSync(path.join(root,'data/patient-knowledge/00776.json')));
let pages=0;
for(const name of fs.readdirSync(path.join(root,'patient/00776')).filter(n=>n.endsWith('.html'))){
 const file='patient/00776/'+name,html=fs.readFileSync(path.join(root,file),'utf8');
 let result=html;
 if(['index.html','knowledge.html'].includes(name)&&html.includes('wikiCycleChronology'))result=ui.refreshKnowledge(result,profile).html;
 if(/^(supportive-care|support-[^/]+)\.html$/.test(name))result=ui.refreshSupport(result,file).html;
 if(name==='consent-form.html')result=consent.transform(result,profile,file);
 for(let pass=1;pass<=3;pass++){
  result=publication.decorateGenerated(file,result,root);
  assert.equal(result,html,file+' reviewed final bytes retained on canonical pass '+pass);
 }
 pages++;
}
console.log(`Enhertu knowledge, consent, complete-pathway and phase-support regeneration passed; ${pages} canonical pages retain exact bytes through UI/publication and three repeated passes.`);
