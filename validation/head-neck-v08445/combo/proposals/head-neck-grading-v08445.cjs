'use strict';
const assert = require('assert');
// Explicit audited fields only. A protocol code or release alone does not waive grading checks.
const NCI5 = 'https://dctd.cancer.gov/research/ctep-trials/for-sites/adverse-events/ctcae-v5-5x7.pdf';
const KEYTRUDA = 'https://www.ema.europa.eu/en/documents/product-information/keytruda-epar-product-information_en.pdf';
const immune = ['pneumonitis_grade','diarrhoea_colitis_grade','immune_hepatitis_grade','immune_nephritis_grade','immune_endocrinopathy_grade','immune_skin_grade','other_immune_grade','pembro_infusion_grade'];
const cytotoxic = ['non_haematological_toxicity_grade','mucositis_grade','cytotoxic_diarrhoea_grade','hand_foot_grade','cytotoxic_creatinine_grade'];
const monoImmune = ['pneumonitis_grade','diarrhoea_colitis_grade','rash_grade','myocarditis_grade','encephalitis_grade','guillain_barre_grade','other_immune_toxicity_grade','infusion_reaction_grade'];
const scope = {
  '00207': { url: 'https://healthservice.hse.ie/documents/6941/207_Cetuximab_7day_.pdf', unspecified: ['acneiform_rash_grade','infusion_reaction_grade'] },
  '00328': { url: 'https://healthservice.hse.ie/documents/6773/328_Cetuximab_7_days_plus_FOLFIRI_14_Days.pdf', unspecified: ['acneiform_rash_grade','infusion_reaction_grade','other_nonhaem_toxicity_grade','diarrhoea_grade','diarrhoea_highest_grade','mucositis_grade','mucositis_highest_grade','other_nonhaem_highest_grade'] },
  '00733': { url: 'https://healthservice.hse.ie/documents/6603/733_v2a_Cetuximab_FOLFOX_6.pdf', unspecified: ['neuropathy_highest_grade'], orientation: { acneiform_rash_grade:'rash_acneiform',infusion_reaction_grade:'infusion',other_nonhaem_toxicity_grade:'other_nonhaematological',mucositis_grade:'mucositis',mucositis_highest_grade:'mucositis',neuropathy_grade:'neuropathy' }, table6: ['diarrhoea_grade','diarrhoea_highest_grade'] },
  '00456': { url: 'https://healthservice.hse.ie/documents/6902/456_V4_CISplatin_50_and_Etoposide.pdf', unspecified: ['other_nonhaem_toxicity_grade','mucositis_grade','pre_existing_neuropathy_grade','neuropathy_grade','other_nonhaem_highest_grade','neuropathy_highest_grade'] },
  '00385': { url: 'https://healthservice.hse.ie/documents/6341/385_V5_CISplatin_40mgm2_weekly_with_RT.pdf', unspecified: ['non_haematological_toxicity_grade','hypersensitivity_grade','hearing_or_neuropathy_grade','peripheral_neuropathy_grade'] },
  '00387': { url: 'https://healthservice.hse.ie/documents/6912/387_V5_CISplatin_100mgm2_with_RT.pdf', unspecified: ['non_haematological_toxicity_grade','cisplatin_neuro_hearing_grade','peripheral_neuropathy_grade'] },
  '00705': { url: 'https://healthservice.hse.ie/documents/6881/705_V2d_Pembrolizumab_CARBOplatin_5FU.pdf', unspecified: cytotoxic, v4: immune },
  '00706': { url: 'https://healthservice.hse.ie/documents/6880/706_V3_Pembrolizumab_CISplatin_5FU_.pdf', unspecified: [...cytotoxic,'cisplatin_neuro_hearing_grade','cisplatin_peripheral_neuropathy_grade'], v4: immune },
  '00455': { url: 'https://healthservice.hse.ie/documents/6903/Pembrolizumab_200mg_Monotherapy_455.pdf', v4: monoImmune, supplement: ['pembro_overlap_syndrome_grade'] },
  '00558': { url: 'https://healthservice.hse.ie/documents/6389/Pembrolizumab_400mg_monotherapy_558_.pdf', v4: monoImmune, supplement: ['pembro_overlap_syndrome_grade'] }
};
function fields(expected) { return [...(expected.unspecified||[]),...(expected.v4||[]),...(expected.supplement||[]),...Object.keys(expected.orientation||{}),...(expected.table6||[])]; }
function applies(data) { return Object.hasOwn(scope,String(data.metadata?.nccp_regimen_code)); }
function auditRelease(data) {
  const c=String(data.metadata.nccp_regimen_code),m=data.metadata;
  return ['00385','00387'].includes(c)?m.source_audit?.release:['00705','00706'].includes(c)?m.validation?.audit_release:m.clinical_audit_release;
}
function check(data, field, def, ctcae) {
  const code=String(data.metadata?.nccp_regimen_code), expected=scope[code];
  assert(expected,`${code}/${field}: no v45 grading-source contract`);
  assert(fields(expected).includes(field),`${code}/${field}: unaudited grading field cannot inherit the v45 exception`);
  assert.equal(auditRelease(data),'0.84.45',`${code}/${field}: exact v45 source audit required`);
  assert.equal(data.metadata.source_url,expected.url,`${code}/${field}: wrong audited regimen source`);
  assert.equal(def.type,'select',`${code}/${field}: grade must remain an explicit selector`);
  assert.deepEqual((def.options||[]).map(o=>Number(o.value)),[0,1,2,3,4],`${code}/${field}: retain source action grade choices`);
  assert(def.assessment_guidance,`${code}/${field}: assessment guidance missing`);
  const orientation=Object.hasOwn(expected.orientation||{},field), table6=(expected.table6||[]).includes(field);
  if(orientation){
    // The preserved v35 orientation is explicitly separated from NCCP's unspecified edition.
    assert.equal(def.ctcae_version,'NCCP source grading; edition not specified');
    assert.equal(def.ctcae_source_url,expected.url);
    assert.equal(def.ctcae_category,expected.orientation[field]);
    assert.equal(def.ui_reference_ctcae_version,'5.0');
    assert.equal(def.ui_reference_ctcae_source_url,NCI5);
    assert.match(def.assessment_guidance,/NCCP does not specify CTCAE edition/);
    assert.match(def.assessment_guidance,/orientation only, not a source-edition conversion/);
  }else if(table6){
    assert.equal(def.ctcae_version,'NCCP source table 6');
    assert.equal(def.ctcae_source_url,expected.url);
    assert.equal(def.ctcae_category,'diarrhoea');
    assert.match(def.assessment_guidance,/NCCP 00733 Table 6 legacy grading, not CTCAE v5/);
    assert(def.options.every(o=>o.description),`${code}/${field}: explicit legacy table descriptors required`);
  }else{
    const supplement=(expected.supplement||[]).includes(field), v4=(expected.v4||[]).includes(field)||supplement;
    const source=supplement?KEYTRUDA:expected.url;
    assert.equal(def.ctcae_version,v4?'4.0':undefined,`${code}/${field}: wrong or invented source edition`);
    assert.equal(def.grading_source_url,source,`${code}/${field}: incorrect grading-source attribution`);
    assert(def.grading_source_label,`${code}/${field}: source-specific renderer label missing`);
    assert(def.source_grading_note&&def.source_grading_note.length>=40,`${code}/${field}: grading limitations missing`);
    if(supplement)assert((data.metadata.source_supplements||[]).some(s=>s.url===KEYTRUDA),`${code}/${field}: EMA overlap source not audited`);
    if(v4)assert.match(`${def.grading_source_label} ${def.source_grading_note}`,/CTCAE v4(?:\.0)?/);
    else assert.match(def.source_grading_note,/does not (?:specify|identify|supply)|edition not specified/i);
    assert(!def.ctcae_source_url||def.ctcae_source_url===source,`${code}/${field}: conflicting grading URL`);
    const guide=ctcae.guide({...def,id:field});
    assert(guide?.sourceSpecific,`${code}/${field}: generic descriptors must not replace the audited source`);
    assert.equal(guide.sourceUrl,source);
    assert.equal(guide.calculable,false,`${code}/${field}: source table is not an automatic grade calculator`);
  }
  const guide=ctcae.guide({...def,id:field});
  assert(guide&&guide.grades.length===5,`${code}/${field}: complete rendered grade guide required`);
  guide.grades.forEach(g=>assert(g.description,`${code}/${field}: empty grade explanation`));
  return true;
}
function validateProtocol(data, ctcae) {
  if(!applies(data))return false;
  const expected=scope[String(data.metadata.nccp_regimen_code)];
  for(const field of fields(expected)){assert(data.input_definitions?.[field],`${data.metadata.nccp_regimen_code}/${field}: audited grading field missing`);check(data,field,data.input_definitions[field],ctcae);}
  return true;
}
function negativeChecks(protocols,ctcae){
  const byCode=new Map(protocols.map(x=>[String(x.data.metadata.nccp_regimen_code),x.data]));
  let count=0;
  function rejects(code,field,mutate){const d=JSON.parse(JSON.stringify(byCode.get(code)));assert(d);mutate(d,d.input_definitions[field]);assert.throws(()=>check(d,field,d.input_definitions[field],ctcae));count++;}
  for(const [code,expected]of Object.entries(scope)){
    const field=fields(expected)[0];
    rejects(code,field,d=>{d.metadata.source_url=scope[code==='00207'?'00328':'00207'].url;});
    rejects(code,field,d=>{if(['00385','00387'].includes(code))d.metadata.source_audit.release='0.84.44';else if(['00705','00706'].includes(code))d.metadata.validation.audit_release='0.84.44';else d.metadata.clinical_audit_release='0.84.44';});
    rejects(code,field,(d,f)=>{f.ctcae_version='5.0';});
  }
  rejects('00455','pembro_overlap_syndrome_grade',(d,f)=>{f.grading_source_url=scope['00455'].url;});
  rejects('00558','pembro_overlap_syndrome_grade',d=>{d.metadata.source_supplements=[];});
  rejects('00705','pneumonitis_grade',(d,f)=>{delete f.grading_source_label;});
  rejects('00706','cytotoxic_diarrhoea_grade',(d,f)=>{f.ctcae_version='4.0';});
  rejects('00733','diarrhoea_grade',(d,f)=>{f.ctcae_version='5.0';});
  rejects('00733','acneiform_rash_grade',(d,f)=>{f.ui_reference_ctcae_source_url=scope['00733'].url;});
  assert.throws(()=>check(byCode.get('00705'),'new_unaudited_grade',byCode.get('00705').input_definitions.pneumonitis_grade,ctcae));count++;
  return count;
}
module.exports={applies,check,validateProtocol,negativeChecks,scope,fields};
