'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const review=require('../tools/olaparib-patient-review-v08463.cjs');
const registry=require('../js/patient-asset-registry-v0810.js');
const consentCore=require('../tools/consent-core-v08455.cjs');
const visible=require('./helpers/patient-visible-text-v08444.cjs');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const norm=s=>s.replace(/&amp;/g,'&').replace(/&#(?:039|39);/g,"'").replace(/&quot;/g,'"').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const pdfs=['guide','handbook','knowledge','passport','sactcard','consent-form','logistics','treatment-journey','supportive-care','support-treatment'];
const expectedSources={
 '00588':/germline.*BRCA|BRCA.*germline/i,
 '00588/prostate':/castration-resistant/i,
 '00588/ovarian_first_line':/first.line/i,
 '00588/ovarian_relapsed':/relapsed/i,
 '00588/pancreatic':/pancreatic/i,
 '00746':/homologous recombination|HRD/i
};
const added = require('./helpers/gynaecology-00862-00929.cjs').NEW_ROUTES;
for (const code of added) assert.deepEqual(registry.bundleRoutes(code),[code]);
const addedRoutes = [...require('./helpers/retrospective-v08464.cjs').releaseRoutes, ...require('./helpers/retrospective-v08465.cjs').releaseRoutes];
assert.equal(registry.codes.length,279 + added.length + addedRoutes.filter(route=>!route.includes('/')).length);
assert.equal(registry.codes.flatMap(c=>registry.bundleRoutes(c)).length,313 + added.length + addedRoutes.length);
const results=[];
for(const route of review.ROUTES){
 const d=review.profile(route),prefix='patient/'+route+'/';
 assert.equal(d.suite_release,'0.84.63');assert.equal(d.source_checked,'2026-11-24');
 assert.equal(d.patient_summary.card_cycle_count,null,'Recording boxes must not invent a treatment count');
 assert.equal(d.anatomy.length,8);assert.match(JSON.stringify(d),expectedSources[route]);
 assert.match(d.patient_summary.card_title,/olaparib/i);assert.match(d.patient_summary.card_title,/Lynparza/i);
 assert.equal(d.patient_summary.card_record_unit,d.code==='00746'?'infusion/review':'review');
 const ids=new Set(d.sources.map(s=>s.id));assert.equal(ids.size,d.sources.length,route+' unique source IDs');
 function references(value){
  if(Array.isArray(value)){for(const item of value)references(item);return;}
  if(!value||typeof value!=='object')return;
  for(const [key,v]of Object.entries(value)){
   if(/source_ids$/.test(key))for(const id of v||[])assert(ids.has(id),route+' unresolved source '+id);
   else references(v);
  }
 }
 references(d);
 const htmlFiles=fs.readdirSync(path.join(root,prefix)).filter(f=>f.endsWith('.html')&&f!=='scope.html');
 for(const name of htmlFiles){
  const html=read(prefix+name);assert(!/undefined|\[object Object\]|null-day/.test(html),route+'/'+name+' visible placeholders');
  assert(!/087 12345678|087 87654321/.test(html),route+'/'+name+' fabricated contact numbers');
  for(const match of html.matchAll(/(?:href|src)=["']([^"'#]+)["']/g)){
   const target=match[1];if(/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(target))continue;
   assert(fs.existsSync(path.resolve(root,prefix,target.split(/[?#]/)[0]||'.')),route+'/'+name+' missing '+target);
  }
 }
 const guide=read(prefix+'guide.html');assert.equal((guide.match(/class="pt-page /g)||[]).length,3);
 for(const htmlName of ['guide.html','knowledge.html']){
  const html=read(prefix+htmlName);assert.equal((html.match(/data-authored-map/g)||[]).length,1,route+' one anatomical map');
  for(const row of d.anatomy)visible.assertVisibleTextIncludes(html,row[3],route+' anatomy '+row[0]);
 }
 const card=read(prefix+'sactcard.html');const wallet=(card.match(/<section class="pt-wallet-front">([\s\S]*?)<\/section>/)||[])[1];assert(wallet,'Wallet cutout exists');
 assert.match(wallet,/breathlessness/);assert.match(wallet,/Call oncology now/);assert.match(wallet,/112 \/ 999/);
 visible.assertVisibleTextIncludes(wallet,d.patient_summary.card_title,route+' card identity');
 visible.assertVisibleTextIncludes(wallet,d.patient_summary.card_schedule,route+' card schedule');
 assert.match(card,/85\.6 × 54 mm/);assert.match(card,/Do not cut the centre line/);assert.match(card,/oncowiki-qr\.png/);
 const consent=read(prefix+'consent-form.html');for(const agent of d.agents)for(const risk of agent.risks)visible.assertVisibleTextIncludes(consent,risk,route+' '+agent.name+' consent risk');
 assert.equal(consentCore.transform(consent,d,prefix+'consent-form.html'),consent,'Consent regeneration is stable');
 const support=read(prefix+'support-treatment.html');assert.match(support,/CYP3A/);assert.match(support,/individual|individually/i);assert.match(support,/aprepitant/i);assert.match(support,/not.*issued.*prescription/i);
 const passport=read(prefix+'passport.html');assert.match(passport,/not.*formal.*CTCAE|not.*formal.*Common Terminology/i);assert.match(passport,/reusable/);
 const fingerprints={};
 for(const name of pdfs){
  const bytes=fs.readFileSync(path.join(root,prefix+name+'.pdf'));assert.equal(bytes.subarray(0,5).toString(),'%PDF-');
  assert(bytes.equals(fs.readFileSync(path.join(root,'docs',prefix+name+'.pdf'))),route+' exact PDF mirror '+name);
  fingerprints[name]=crypto.createHash('sha256').update(bytes).digest('hex');
 }
 if(d.code==='00588'){assert.equal(d.schedule_kind,'continuous');assert.match(d.patient_summary.cycle_blocks[0].text,/no planned rest week/i);}
 if(route==='00588')assert.match(norm(guide),/up to one year/i);
 if(route==='00588/ovarian_first_line')assert.match(norm(guide),/two.year|2.year/i);
 if(route==='00588/ovarian_relapsed')assert.match(JSON.stringify(d),/no automatic two.year|no fixed two.year|not.*two.year/i);
 if(route==='00588/pancreatic')assert.match(JSON.stringify(d),/16 weeks|sixteen weeks/i);
 if(route==='00746'){assert.match(norm(guide),/15 months/i);assert.match(norm(guide),/two years|2 years/i);assert.match(norm(guide),/three weeks|3 weeks/i);assert.equal(d.agents.length,2);}
 results.push({route,html_documents:htmlFiles.length,pdf_documents:pdfs.length,fingerprints});
}
console.log(JSON.stringify({release:'0.84.63',six_current_suites_verified:results.length,clinical_approval:false,results},null,2));
