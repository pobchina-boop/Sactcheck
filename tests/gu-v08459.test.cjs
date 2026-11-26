const gynae68 = require('./helpers/retrospective-v08468.cjs').inventory;
const flot67 = require('./helpers/retrospective-v08467.cjs').inventory;
const gynae66 = require('./helpers/retrospective-v08466.cjs').inventory;
'use strict';
const gynae65 = require('./helpers/retrospective-v08465.cjs').inventory;
const gynaecologyCounts = require('./helpers/gynaecology-00862-00929.cjs').inventory;
const sarcomaCounts = require('./helpers/retrospective-v08464.cjs').inventory;
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const R=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(R,f)),json=f=>JSON.parse(read(f));
const S=json('validation/gu-v08459/scope.json'),A=require('../js/patient-asset-registry-v0810.js'),H=require('./helpers/gu-inputs-v08459.cjs'),C=require('../tools/consent-core-v08455.cjs'),V=require('../js/protocol-validator.js'),E=require('../js/assessment-engine.js'),I=json('protocols/index.json').protocols;
const release=json('package.json').version,counts={'0.84.59':[267,297,305],'0.84.60':[272,302,310],'0.84.61':[275,306,314],'0.84.62':[278,309,317],'0.84.68':[gynae68.codes,gynae68.routes,gynae68.visualRoutes],'0.84.67':[flot67.codes,flot67.routes,flot67.visualRoutes],'0.84.66':[gynae66.codes,gynae66.routes,gynae66.visualRoutes],'0.84.65':[gynae65.codes,gynae65.routes,gynae65.visualRoutes],'0.84.64':[sarcomaCounts.codes,sarcomaCounts.routes,sarcomaCounts.visualRoutes],'0.84.63':[gynaecologyCounts.codes,gynaecologyCounts.routes,gynaecologyCounts.visualRoutes]};assert(counts[release]);assert.equal(A.release,release);assert.equal(I.length, require('./helpers/live-inventory-v08462.cjs').total);assert.equal(A.codes.length,counts[release][0]);assert.equal(A.codes.flatMap(c=>A.bundleRoutes(c)).length,counts[release][1]);assert.equal(require('../tools/apply-patient-visual-standard-v08443.cjs').discoverRoutes(R).length,counts[release][2]);
assert.equal(S.new_routes.length,6);assert.equal(S.retrospective_codes.length,5);assert.equal(S.presentation_repair_routes.length,10);assert.equal(S.independent_clinical_approval,false);
const norm=s=>s.replace(/<[^>]*>/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#(?:039|39);/g,"'").replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
for(const c of S.new_routes){
 const p=json(I.find(x=>x.path.includes('/'+c+'-')).path),d=json('data/patient-knowledge/'+c+'.json'),base='patient/'+c+'/';
 assert(H.validate(p));assert.deepEqual(V.validate(p).errors,[]);assert.notEqual(E.assess(p,{}).actionType,'proceed');
 assert.equal(d.protocol_id,p.protocol_id);assert.equal(d.protocol_version,p.metadata.nccp_version);assert.equal(d.anatomy.length,8);
 for(const [f,def]of Object.entries(p.input_definitions)){if(f.includes('grade')&&def.type==='select')assert(H.grade(p,f,def));if(['crcl_ml_min','gfr_ml_min'].includes(f))assert(H.numericRenal(p,f,def));}
 const guide=read(base+'guide.html').toString(),consent=read(base+'consent-form.html').toString();assert.equal((guide.match(/class="pt-page /g)||[]).length,3);assert.equal((guide.match(/data-hcc-target=/g)||[]).length,8);
 for(const agent of d.agents)for(const risk of agent.risks)assert(norm(consent).includes(norm(risk)),c+' consent omission '+risk);
 assert.equal(C.transform(consent,d,base+'consent-form.html'),consent);
 if(['00807','00894'].includes(c)){assert.deepEqual(C.classify(d),[]);assert(/instillation/i.test(consent));assert(!consent.includes('data-immune-risk='));assert(!consent.includes('data-nccp-risk="chemotherapy-'));}
 else {for(const cat of C.classify(d))for(const risk of C.model.categories[cat].risks)assert(consent.includes(`data-nccp-risk="${cat}-${risk.id}"`));}
 if(c==='00945')for(const risk of C.model.immune_supplement)assert(consent.includes(`data-immune-risk="${risk.id}"`));
 for(const n of ['guide','sactcard','handbook','knowledge','passport','logistics','consent-form','treatment-journey','supportive-care']){const b=read(base+n+'.pdf');assert.equal(b.subarray(0,4).toString(),'%PDF');assert(b.equals(read('docs/'+base+n+'.pdf')),c+' '+n+' mirror');}
 for(const f of ['source-reconciliation-v0700.js','source-reconciliation-v0701.js']){const x=structuredClone(p),before=JSON.stringify(x);require('../js/'+f).apply(x);assert.equal(JSON.stringify(x),before);}
}
for(const c of S.presentation_repair_routes){const d=json('data/patient-knowledge/'+c+'.json'),html=read('patient/'+c+'/knowledge.html').toString();assert(!html.includes('undefined'));for(const note of d.chronology_notes){assert.equal(typeof note.text,'string');assert(norm(html).includes(norm(note.text)));}}
const transplant=read('patient/00453/guide.html').toString();for(const label of ['Day -5–-3','Day 0','Day +1–+8'])assert(transplant.includes(label),label);assert(!transplant.includes('<span>Day 6</span>'));
const gem=json(I.find(x=>x.path.includes('/00894-')).path);assert.deepEqual(gem.rule_engine.rules.find(x=>x.rule_id==='GEM_SEVERE').action.components,['gemcitabine intravesical']);
const redirect=read('404.html').toString().match(/<script>([\s\S]*?)<\/script>/)[1];for(const c of S.new_routes){let dest;vm.runInNewContext(redirect,{location:{pathname:`/docs/patient/${c}/guide.html`,replace:x=>dest=x}});assert.equal(dest,`/patient/${c}/guide.pdf`);}
for(const [file,count]of [['source-case-results.json',176],['retrospective-case-results.json',185]]){const r=json('validation/gu-v08459/clinical/'+file);assert.equal(r.total,count);assert.equal(r.passed,count);}
console.log('Final six GU suites: clinical source, consent, relative-day calendar, anatomy, routes and PDF mirrors passed.');
