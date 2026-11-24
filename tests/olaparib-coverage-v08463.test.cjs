'use strict';
// Disclose missing independent count domains without changing compound-rule truth.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
const {createRequire} = require('node:module');
const root = path.resolve(__dirname, '..');
const E = require('../js/assessment-engine');
const O = require('../js/assessment-output');
const P = require('../js/assessment-pdf');
const D = require('../js/protocol-dose-schedule');
const base = '159532b7cd04238588804a504fff5427ce24a057';
const oldSource = execFileSync('git', ['show', base + ':js/assessment-engine.js'], {cwd:root,encoding:'utf8'});
const ctx = {module:{exports:{}}, require:createRequire(path.join(root,'js/assessment-engine.js'))};
vm.runInNewContext(oldSource, ctx, {filename:'authenticated-prior-assessment-engine.js'});
const old = ctx.module.exports;
const clean = result => JSON.parse(JSON.stringify(result, (key,value) => key === 'assessedAt' ? '[clock]' : value));
const protocols = [require('../protocols/shared/00588-olaparib-tablet-monotherapy.json'), require('../protocols/gynaecology/00746-olaparib-tablet-and-bevacizumab-therapy.json')];
let assertions = 0;
for (const p of protocols) {
  for (const [entered,missing,low] of [['anc_x10e9_l','platelets_x10e9_l',.7],['platelets_x10e9_l','anc_x10e9_l',70]]) {
    for (const absent of [undefined,null,'']) {
      const input = {[entered]:low,[missing]:absent};
      const result = E.assess(p,input), before = old.assess(p,input);
      assert.equal(result.actionType,'delay_then_dose_reduce');
      assert.equal(result.partialAssessment,true); assert.equal(result.complete,false); assert.equal(result.coverageComplete,false);
      assert.equal(result.unassessed.filter(x=>x.id===missing).length,1);
      assert.deepEqual(clean(result.findings),clean(before.findings));
      assert.deepEqual(clean(D.buildModificationModel(p,result)),clean(D.buildModificationModel(p,before)));
      const label = p.input_definitions[missing].label;
      assert(E.documentationSummary(result,'coverage-regression').includes('Optional domain not assessed: '+label));
      const model = O.buildModel({protocol:p,result,assessmentId:'coverage-regression'});
      assert(model.unassessed.includes(label)); assert(O.toText(model).includes(label));
      const pdf = P.buildPdfBytes(model); assert(Buffer.from(pdf).subarray(0,5).toString()==='%PDF-');
      // Actual PDF text commands retain the missing-domain label in the summary.
      assert(Buffer.from(pdf).toString('latin1').includes(missing==='anc_x10e9_l'?'ANC':'Platelets'));
      assertions++;
    }
    for (const bad of ['not a number',-1]) {
      const r = E.assess(p,{[entered]:low,[missing]:bad});
      assert(r.invalid.some(x=>x.id===missing)); assert(r.unassessed.some(x=>x.id===missing));
      assert.equal(r.actionType,'delay_then_dose_reduce'); assert.equal(r.complete,false); assertions++;
    }
  }
  const entered = E.assess(p,{anc_x10e9_l:2,platelets_x10e9_l:150});
  assert(!entered.unassessed.some(x=>['anc_x10e9_l','platelets_x10e9_l'].includes(x.id)));
  const blank = E.assess(p,{});
  for (const field of ['anc_x10e9_l','platelets_x10e9_l']) assert(blank.unassessed.some(x=>x.id===field));
  assert.equal(blank.actionType,'incomplete'); assertions++;
}

// A flagged visible gap prevents completeness even if all Boolean rules are decidable.
const sample = {protocol_id:'coverage-fixture',metadata:{title:'Coverage fixture'},required_inputs:[],input_definitions:{
  a:{type:'number',min:0},b:{type:'number',min:0,report_if_unassessed:true}
},rule_engine:{rules:[{rule_id:'ANY',when:{any:[{field:'a',operator:'>=',value:1},{field:'b',operator:'>=',value:1}]},action:{type:'proceed'}}]}};
assert.equal(E.assess(sample,{a:2}).complete,false);
assert.equal(E.assess(sample,{a:2}).actionType,'proceed_with_caution');
assert.equal(E.assess(sample,{a:2,b:2}).complete,true);
sample.input_definitions.b.visible_when={field:'a',operator:'<',value:0};
// Hidden controls must not become new mandatory fields.
const hidden = E.getInputDefinitions(sample,undefined,{a:2}).find(x=>x.id==='b');
assert.equal(hidden.visible,false);
assert(!E.assess(sample,{a:2}).unassessed.some(x=>x.id==='b'));

// No other protocol opts in: compare complete production result objects with
// the authenticated baseline engine, excluding only the evaluation clock.
let otherProtocols=0, comparisons=0;
for (const row of require('../protocols/index.json').protocols) {
  const p=JSON.parse(fs.readFileSync(path.join(root,row.path),'utf8'));
  if (['00588','00746'].includes(p.metadata?.nccp_regimen_code)) continue;
  assert(!Object.values(p.input_definitions||{}).some(x=>x.report_if_unassessed===true));
  for (const profile of E.getProfiles(p)) {
    const defs=E.getInputDefinitions(p,profile.id);
    const demos=Object.fromEntries(defs.filter(d=>d.demo_value!==undefined).map(d=>[d.id,d.demo_value]));
    for (const input of [{},demos,{anc_x10e9_l:.7},{platelets_x10e9_l:70}]) {
      assert.deepEqual(clean(E.assess(p,input,{profileId:profile.id})),clean(old.assess(p,input,{profileId:profile.id})),row.path+' '+profile.id);
      comparisons++;
    }
  }
  otherProtocols++;
}
console.log(`Olaparib coverage: ${assertions} count/export scenarios; ${comparisons} unchanged assessments across ${otherProtocols} other protocols.`);
