'use strict';
// Disease differentiation must not be presented as toxicity severity or attributed to a drug.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),Engine=require('../js/assessment-engine'),Attribution=require('../js/toxicity-attribution'),CTCAE=require('../js/ctcae-descriptors');
const context={console,SACTCheckAssessmentEngine:Engine,SACTCheckAssessmentOutput:{},SACTCheckAssessmentPdf:{},document:{readyState:'loading',addEventListener(){},querySelector(){return null;},getElementById(){return null;}}};
context.globalThis=context;vm.createContext(context);
for(const file of ['ctcae-descriptors.js','toxicity-attribution.js','generic-assessment-ui.js'])vm.runInContext(fs.readFileSync(path.join(root,'js',file),'utf8'),context,{filename:file});
const Fields=context.SACTCheckAssessmentFieldClassification,BrowserCTCAE=context.SACTCheckCTCAE;
const prrt=require('../protocols/gastrointestinal/00642-lutetium-177-oxodotreotide-lutathera-therapy.json');
const defs=Engine.getInputDefinitions(prrt),indication=defs.find(d=>d.id==='indication_id'),tumour=defs.find(d=>d.id==='net_grade');
assert(indication.options.some(o=>/Grade 1 or 2/.test(o.label)),'Exercise the real indication that caused the bug');
let checks=0;
for(const definition of [indication,tumour,
 {id:'tumour_grade',label:'Tumour grade',type:'select',options:[{value:1,label:'Grade 1'},{value:2,label:'Grade 2'},{value:3,label:'Grade 3'}]},
 {id:'histological_grade',label:'Histological grade',type:'select',options:[{value:1,label:'G1'}]},
 {id:'pathology_band',label:'Tumor differentiation',type:'select',options:[{value:2,label:'Grade 2'}]},
 {id:'pathology',label:'Pathology category',grading_domain:'disease',type:'select',options:[{value:3,label:'Grade 3'}]}
]){
 assert(Fields.isTreatmentContext(definition),definition.id+' belongs to treatment context');
 assert.equal(Fields.isCtcaeToxicity(definition),false,definition.id+' must not appear under clinical toxicities');
 assert.equal(Fields.laboratoryDomain(definition),null);
 assert.equal(Attribution.isToxicityDefinition(definition.id,definition),false);
 for(const lib of [CTCAE,BrowserCTCAE]){
  assert.equal(lib.guide(definition),null,definition.id+' must not have a CTCAE guide');
  for(const option of definition.options){assert.equal(lib.descriptor(definition,option),'');assert.equal(lib.optionLabel(definition,option),option.label,'Retain the full authored disease/indication label');checks++;}
 }
}
for(const definition of [
 {id:'pneumonitis_grade',label:'Pneumonitis / interstitial lung disease grade',type:'select',options:[{value:1,label:'Grade 1'},{value:2,label:'Grade 2'},{value:3,label:'Grade 3'}]},
 {id:'other_toxicity_grade',label:'Other treatment-related toxicity grade',type:'select',options:[{value:1,label:'Grade 1'},{value:4,label:'Grade 4'}]},
 {id:'neuropathy_grade',label:'Neuropathy grade',type:'select',options:[{value:2,label:'Grade 2'}]},
 {id:'differentiation_syndrome_grade',label:'Tumour differentiation syndrome grade',type:'select',options:[{value:2,label:'Grade 2'}]},
 {id:'hepatitis_grade',label:'Immune-mediated hepatitis grade',type:'select',ctcae_version:'5.0',options:[{value:3,label:'Grade 3'}]}
]){
 assert.equal(CTCAE.isDiseaseContextDefinition(definition),false,'Do not exclude a genuine toxicity merely because its label contains disease');
 assert.equal(Fields.isTreatmentContext(definition),false);
 assert.equal(Fields.isCtcaeToxicity(definition),true);
 assert(CTCAE.guide(definition));assert(Attribution.isToxicityDefinition(definition.id,definition));
 for(const option of definition.options){assert(CTCAE.descriptor(definition,option));assert(CTCAE.optionLabel(definition,option).includes(' — '));checks++;}
}
// Verify actual source-specific toxicities remain complete after the classification change.
for(const protocol of [prrt,require('../protocols/neuroendocrine/00327-sunitinib-37-5-mg-therapy-28-day.json'),require('../protocols/gastrointestinal/00505-capecitabine-and-temozolomide-therapy.json')]){
 for(const definition of Engine.getInputDefinitions(protocol).filter(d=>d.ctcae_version||d.ctcae_category||d.grading_source_label)){
  assert.equal(CTCAE.isDiseaseContextDefinition(definition),false,protocol.protocol_id+'/'+definition.id);
  const guide=CTCAE.guide(definition);assert(guide,definition.id+' retains grading guide');
  for(const option of definition.options){
   if(option.description)assert.equal(CTCAE.descriptor(definition,option),option.description,definition.id+' retains authored grading detail');
   checks++;
  }
 }
}
const anc={id:'anc',label:'ANC',type:'number',unit:'×10⁹/L'};
assert.equal(Fields.laboratoryDomain(anc),'haematology');assert(CTCAE.guide(anc));
// The attribution layer is presentation-only: keep disease labels and exact clinical rules intact.
const before=JSON.parse(JSON.stringify(prrt)),decorated=Attribution.decorate(prrt);
assert.equal(decorated.input_definitions.net_grade.label,prrt.input_definitions.net_grade.label);
assert.equal(decorated.input_definitions.net_grade.display_attribution,undefined);
assert.deepEqual(decorated.rule_engine,prrt.rule_engine);assert.deepEqual(prrt,before,'Source protocol must not be mutated');
for(const value of ['well_differentiated_g1_g2','other','unknown']){
 const a=Engine.assess(prrt,{net_grade:value}),b=Engine.assess(decorated,{net_grade:value});
 assert.equal(b.actionType,a.actionType);assert.deepEqual(b.findings.map(f=>[f.ruleId,f.actionType]),a.findings.map(f=>[f.ruleId,f.actionType]));checks++;
}
// The browser attribution module uses the same shared disease exclusion.
assert.equal(context.SACTCheckToxicityAttribution.componentFor(prrt,'net_grade',prrt.input_definitions.net_grade),null);
console.log(`v0.84.37 disease-grade UI classification: ${checks} option/assessment checks; real PRRT labels preserved, disease fields grouped as context, toxicity/source descriptors retained.`);
