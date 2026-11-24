'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(root,f));
const json = f => JSON.parse(read(f));
const workflow = require('../js/regimen-workflow-engine-v0750');
const printer = require('../js/supportive-care-pdf-v0750');
const routes = require('../js/patient-asset-registry-v0810');
const journeys = require('../js/treatment-journey-v0837');
const risk = json('data/emetogenic-risk-map.json');
const config = json('data/regimen-workflow-v0750.json');
const sources = json('data/nccp-change-tracker/source-register-v0620.json');
const clinical = json('data/clinical-validation-register-v0630.json');
const sus = json('data/sustainability-regimen-metadata-v08445-addendum.json');
const load = async url => ({ok:true,json:async()=>json(url)});
const noop = ()=>{};
const classes = {add:noop,remove:noop,toggle:noop};
const body = {innerHTML:'',querySelector:()=>null};
const title = {}, sub = {};
const knowledgeBody={innerHTML:'',querySelector:()=>null};
const knowledgeShell={classList:classes,querySelector:s=>s==='[data-regimen-info-content]'?knowledgeBody:null};
const shell = {querySelector:s=>s==='#patientSupportBody'?body:s==='#patientSupportTitle'?title:sub,querySelectorAll:()=>[]};
const doc = {readyState:'loading',addEventListener:noop,getElementById:id=>id==='patientSupportShell'?shell:id==='regimenInformationOverlay'?knowledgeShell:null,body:{classList:classes}};
const browser = {URL,console,document:doc,fetch:load,location:{href:'https://sactcheck.com/'},SACTCheckRegimenComponents:require('../js/regimen-components'),SACTCheckPatientAssets:routes,SACTCheckTreatmentEvidence:require('../js/treatment-evidence-v08413'),SACTCheckTreatmentJourney:journeys};
browser.window=browser;
vm.createContext(browser);
for(const file of ['js/regimen-consent-builder-v0710.js','js/regimen-knowledge-base.js']) vm.runInContext(read(file).toString(),browser);
async function check() {
  const kb = browser.SACTCheckRegimenKnowledgeBase;
  const payload = await kb.load();
  for (const code of ['00862','00929']) {
    const oral = code === '00862';
    const file = 'protocols/gynaecology/'+fs.readdirSync(path.join(root,'protocols/gynaecology')).find(n=>n.startsWith(code));
    const p = json(file);
    const sha = b=>crypto.createHash('sha256').update(b).digest('hex');
    const reg = clinical.protocols.find(r=>r.nccp_code===code);
    const source = sources.records.find(r=>r.nccp_regimen_code===code);
    assert.equal(source.pdf_sha256,sha(read('validation/gynaecology-00862-00929/sources/'+code+'.pdf')));
    assert.equal(source.protocol_json_sha256,sha(read(file)));
    assert.equal(reg.rule_count,p.rule_engine.rules.length);
    assert.equal(reg.input_count,Object.keys(p.input_definitions).length);
    assert(reg.knowledge_base_profile && reg.source_document_checked && !reg.formal_consultant_reviewed && !reg.formal_pharmacy_reviewed);
    const profile = kb.regimenProfileForProtocol(p,payload);
    assert.equal(profile.protocol_id,p.protocol_id);
    for(const name of oral?['PRIMA','NOVA']:['RUBY']) assert(kb.evidenceForProtocol(p,payload).some(r=>r.trial_acronym===name && r.primary_endpoint));
    assert(kb.open(p));
    await new Promise(resolve=>setImmediate(resolve));
    for(const token of ['Longitudinal monitoring schedule',oral?'NOVA':'RUBY','data-treatment-journey']) {
      assert(knowledgeBody.innerHTML.includes(token),code+' clinician knowledge display: '+token);
    }
    const input=oral?{platelets:92}:{treatment_phase:'combination',platelets:92};
    const result=require('../js/assessment-engine').assess(p,input);
    const model=require('../js/assessment-output').buildModel({result,protocol:p,assessmentId:'AUDIT-'+code,tumourGroup:'Gynaecology',clinicianDecision:'hold',clinicianNote:'Review platelet count before treatment.'});
    const assessed=Buffer.from(require('../js/assessment-pdf').buildPdfBytes(model)).toString('latin1');
    assert(assessed.startsWith('%PDF') && assessed.includes('92') && /[Pp]latelet/.test(assessed),code+' assessment PDF');
    assert(journeys.renderForCode(code,'clinician').includes('data-treatment-journey="'+code+'"'));
    assert.equal(sus.profiles[p.protocol_id].route_classification.value,oral?'oral_only':'parenteral_only');
    await browser.SACTCheckRegimenConsentBuilder.openPatientSupport(p);
    for(const agent of oral?['Niraparib']:['Dostarlimab','Paclitaxel','Carboplatin']) {
      assert(body.innerHTML.toLowerCase().includes('patient-risk-source">'+agent.toLowerCase()),code+' consent must identify '+agent);
    }
    assert(!body.innerHTML.includes('[object Object]'));
    const empty = workflow.buildManifest(p,config,risk.protocols[code]);
    assert.equal(empty.supportiveCare.status,'phase_review_required');
    for(const [phase,id,level] of oral?[['continuous_oral','niraparib_tablets_00862','oral_moderate_high']]:[['combination','high_carboplatin','high'],['maintenance','minimal','minimal']]) {
      const m=workflow.buildManifest(p,config,risk.protocols[code],phase);
      assert.equal(m.supportiveCare.planId,id);
      assert.equal(m.emetogenic.level,level);
      const pdf=Buffer.from(printer.buildPdf({manifest:m,sources:config.sources})).toString('latin1');
      assert(pdf.startsWith('%PDF'));
      if(oral) {
        assert.deepEqual(m.supportiveCare.day1,[]);
        assert(m.interactionOverrides.some(r=>r.id==='niraparib_bleeding_review'));
        assert(pdf.includes('first two weeks'));
        assert.equal(m.extravasation.agents.length,0);
      } else if(phase==='maintenance'){
        assert.deepEqual(m.components,['dostarlimab']);
        assert(!m.extravasation.agents.some(a=>['paclitaxel','carboplatin'].includes(a.key)));
        assert(m.extravasation.unknownAgents.some(a=>/dostarlimab/i.test(a)));
      }else{
        assert(pdf.includes('chlorphenamine'));
        assert(m.extravasation.agents.some(a=>a.key==='paclitaxel'));
        assert(m.extravasation.agents.some(a=>a.key==='carboplatin'));
      }
    }
    assert(routes.hasDedicated(p));
    console.log(code+' passed source, register, knowledge, trial, journey, consent renderer, phase-support PDF, interaction, extravasation, environmental profile and portal checks.');
  }
}
check().catch(e=>{console.error(e);process.exitCode=1});
