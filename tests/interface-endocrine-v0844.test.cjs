'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const Endocrine=require('../js/endocrine-context-v0844'),Lab=require('../js/local-lab-profile'),Engine=require('../js/assessment-engine'),Output=require('../js/assessment-output'),Pdf=require('../js/assessment-pdf');
let checks=0;function check(fn){fn();checks++;}
for(const field of Endocrine.fields){
 const time=field.key==='cortisolAfternoon'?'17:00':'09:00';
 for(const [value,expected] of [[field.lower-.01,'Below'],[field.lower,'Within'],[(field.lower+field.upper)/2,'Within'],[field.upper,'Within'],[field.upper+.01,'Above']])check(()=>{
  const r=Endocrine.assess({[field.id]:value,cortisol_sample_time:time});
  assert.ok(r.rows[0].interpretation.startsWith(expected));assert.equal(r.reviewRequired,true);assert.equal(r.rows[0].outcome,'Contextual review');
 });
}
for(const [time,expected]of[['05:59',null],['06:00','cortisolMorning'],['10:00','cortisolMorning'],['10:01',null],['15:59',null],['16:00','cortisolAfternoon'],['20:00','cortisolAfternoon'],['20:01',null],['24:00',null],['09:75',null],['',null],['morning',null]])check(()=>assert.equal(Endocrine.sampleWindow(time),expected));
for(const [exposure,expected]of[[undefined,'unknown'],['unknown','unknown'],['yes','suppress ACTH'],['no','No current']])check(()=>{
 const context=Endocrine.assess({cortisol_nmol_l:400,cortisol_sample_time:'09:00',recent_steroid_use:exposure});
 assert.ok(context.rows[1].actual.includes(expected));assert.match(context.rows[0].interpretation,/does not exclude adrenal insufficiency/);
});
check(()=>assert.match(Endocrine.assess({cortisol_nmol_l:400,recent_steroid_use:'no',steroid_name:'dexamethasone'}).rows[1].actual,/inconsistent/));
check(()=>assert.equal(Endocrine.assess({}).rows.length,0));
check(()=>assert.match(Endocrine.assess({cortisol_nmol_l:400}).rows[0].interpretation,/No time-matched/));
for(const limits of [{tshLower:'',tshUpper:5},{tshLower:5,tshUpper:5},{tshLower:10,tshUpper:5},{tshLower:-1,tshUpper:5}])check(()=>assert.match(Endocrine.assess({tsh_miu_l:2},{...Endocrine.defaults,profile:'custom',...limits}).rows[0].interpretation,/incomplete or invalid/));
check(()=>assert.match(Endocrine.assess({tsh_miu_l:4.5},{...Endocrine.defaults,profile:'custom',tshUpper:5.33,tshLower:.38}).rows[0].interpretation,/Within/));
const protocol=JSON.parse(read('protocols/shared/00455-pembrolizumab-200-mg-monotherapy.json'));
const raw={cortisol_nmol_l:200,cortisol_sample_time:'09:00',recent_steroid_use:'yes',steroid_name:'dexamethasone',steroid_dose:'8 mg daily',steroid_route:'oral',steroid_duration:'3 days',steroid_last_dose:'yesterday'};
const result=Engine.assess(protocol,raw);
check(()=>{assert.ok(result.endocrineContext.reviewRequired);assert.ok(result.unassessed.length);assert.ok(result.definitions.filter(x=>x.endocrine_context).every(x=>!x.required));});
check(()=>assert.match(Engine.documentationSummary(result,'test'),/dexamethasone/));
const model=Output.buildModel({result,protocol});
check(()=>{assert.equal(model.outcome.key,'review');assert.match(Output.toText(model),/dexamethasone/);assert.match(Output.renderHtml(model),/Steroid context/);assert.ok(model.allRows.some(r=>r.actual.includes('8 mg daily')));});
check(()=>assert.ok(Pdf.estimatePageCount(model)>=1));
check(()=>assert.match(Engine.assess(protocol,{acth_result:'not a number'}).actionType,/incomplete/));
check(()=>{const r=Engine.assess(JSON.parse(read('protocols/lung/00568-pembrolizumab-pemetrexed-and-carboplatin-auc5-therapy.json')),{anc_x10e9_l:.3});assert.ok(r.findings.some(x=>/hold|delay|withhold/i.test(x.actionType)));assert.equal(r.endocrineContext.reviewRequired,false);});
const nonIci=JSON.parse(read('protocols/breast/00253-tamoxifen.json'));
check(()=>assert.ok(!Engine.getInputDefinitions(nonIci).some(x=>x.endocrine_context)));
for(const [field,actual,ratio]of[['alt_ast_uln_multiple',{alt:68},2],['alt_ast_uln_multiple',{alt:34,ast:126},3],['bilirubin_ratio_uln',{bilirubin:30},1.5]])check(()=>{const r=Lab.calculate(field,actual);assert.equal(r.ratio,ratio);assert.doesNotMatch(r.display,/÷| = |→/);assert.match(r.display,/ULN/);});
check(()=>{const ui=read('js/generic-assessment-ui.js');assert.match(ui,/Run assessment engine/);assert.match(ui,/Treatment assessment engine/);assert.doesNotMatch(ui,/Run JSON protocol assessment|id="jsonScenarioInterpreterButton"|automatic ×ULN/);});
check(()=>assert.doesNotMatch(read('index.html'),/data-open-global-scenario|id="clinicalScenarioLauncher"|id="globalScenarioInterpreter"/));
check(()=>assert.doesNotMatch(read('css/regimen-workflow-v0720.css'),/content:"Pre-treatment assessment engine"|content:"Patient portal"/));
const edits=['contact-text-changes.json','contact-pdf-changes.json'].flatMap(n=>JSON.parse(read('validation/interface-v0844/'+n)));
for(const edit of edits)check(()=>{
 let content=fs.readFileSync(path.join(root,edit.path));
 // v0.84.13 deliberately revises the generator and 00857; retain exact scoped fixtures.
 if(edit.path==='tools/build-complete-pathways.cjs'){
  const revision=JSON.parse(read('validation/tnbc-v08413/builder-revision.json'));
  assert.equal(revision.original_contact_migration_hash,edit.after);
  const current=JSON.parse(read('validation/her2-retro-v08414/builder-revision.json'));
  assert.equal(current.before,revision.after);
  const phesgo=JSON.parse(read('validation/phesgo-retro-v08415/builder-revision.json'));
  assert.equal(phesgo.before,current.after);
  const breast=JSON.parse(read('validation/breast-expansion-v08416/builder-revision.json'));
  assert.equal(breast.before,phesgo.after);
  const anthra=JSON.parse(read('validation/anthracycline-v08417/builder-revision.json'));
  assert.equal(anthra.before,breast.after);
  const cmfgem=JSON.parse(read('validation/cmf-gem-v08418/builder-revision.json'));
  assert.equal(cmfgem.before,anthra.after);
  const finalBreast=JSON.parse(read('validation/breast-final-v08419/builder-revision.json'));
  assert.equal(finalBreast.before,cmfgem.after);
  const nextEndocrine=JSON.parse(read('validation/endocrine-next-v08420/builder-revision.json'));assert.equal(nextEndocrine.before,finalBreast.after);const completion=JSON.parse(read('validation/breast-completion-v08421/builder-revision.json'));assert.equal(completion.before,nextEndocrine.after);const lung=JSON.parse(read('validation/lung-core-v08422/builder-revision.json'));assert.equal(lung.before,completion.after);assert.equal(crypto.createHash('sha256').update(content).digest('hex'),lung.after);
  assert(content.toString().includes('Insert numbers here'));
 }else if(edit.path==='tools/endocrine-patient-suite-v0842.cjs'){const revision=JSON.parse(read('validation/endocrine-next-v08420/shared-builder-revisions.json'))[edit.path];assert.equal(revision.before,edit.after);const completion=JSON.parse(read('validation/breast-completion-v08421/shared-builder-revisions.json'))[edit.path];assert.equal(completion.before,revision.after);assert.equal(crypto.createHash('sha256').update(content).digest('hex'),completion.after);}else assert.equal(crypto.createHash('sha256').update(content).digest('hex'),require('./helpers/retrospective-v08413.cjs').expectedHash(edit.path,edit.after),edit.path);

});
console.log(`${checks} interface, source-range boundary, partial-input, steroid context, export and contact-migration checks passed.`);
