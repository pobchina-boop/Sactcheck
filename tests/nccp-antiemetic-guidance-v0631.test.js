#!/usr/bin/env node
"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const readJson = file => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const pkg = readJson("package.json");
const riskMap = readJson("data/emetogenic-risk-map.json");
const index = readJson("protocols/index.json");
const classificationBaseline = readJson("V0630_EMETOGENIC_CLASSIFICATION_SNAPSHOT.json");
const clinicalCoreBaseline = readJson("V0630_CLINICAL_CORE_HASHES.json");
// Fresh NCCP source evidence corrects the historical whole-combination minimal-risk mapping.
// Nivolumab alone remains minimal; the ipilimumab-containing combination is low.
const dualImmuneV35 = {
  '00551':{path:'shared/00551-nivolumab-3-mg-kg-with-ipilimumab-1-mg-kg-therapy.json',version:'7a',url:'https://healthservice.hse.ie/documents/6385/551_Nivolumab_3mgkg_Ipilimumab_1mgkg.pdf',sha256:'6822cf3e3086fa9de1513ad982ff14b7238e5345e342a6c505cef5c5983c9c9b',page:11},
  '00900':{path:'gastrointestinal/00900-nivolumab-240-mg-and-ipilimumab-1-mg-kg-therapy.json',version:'1a',url:'https://healthservice.hse.ie/documents/6653/900_v1a_Nivolumab_240mg_ipilimumab_1mgkg_.pdf',sha256:'a5f56d4f7f61e0b50128ba68cb8209a078184f657ac217704000cf986a9f96ac',page:9}
};
// NCCP source-audited v0.84.0 phases replace legacy whole-course classifications.
const familyPhases = {
 '00691':{induction:'high',chemoradiation:'oral_minimal_low'},
 '00486':{oxaliplatin_days:'moderate',fluorouracil:'low'},
 '00279':{cis_day1:'high',days23:'phase_dependent',carboplatin_substitution:'high',iv_only:'low',oral_only:'oral_minimal_low',split_platinum:'high'},
 '00456':{day1:'high',etoposide_day:'low',day8:'high'},'00561':{day1:'moderate',etoposide_day:'low',day8:'moderate'},
 '00372':{combination:'low',continuation:'oral_minimal_low',combination_oral:'oral_minimal_low'},
  '00319':{day1:'high','oral-days2-3':'low'},'00614':{day1:'high',day8_iv:'minimal',day8_oral:'oral_moderate_high'},
  '00281':{day1:'high',day8:'low'},'00310':{day1:'high',day8:'low'},
  '00339':{cisplatin_day:'high',vinorelbine_day:'minimal'},'00343':{cisplatin_day:'high',vinorelbine_day:'minimal'},
  '00712':{induction:'high',maintenance_day1:'low',maintenance_day22:'minimal'},
  '00792':{'dual_immunotherapy_day1':'low','dual_immunotherapy_day22':'minimal'},
  '00849':{"backbone_00304": "high", "backbone_00310": "high", "backbone_00310_day8": "low", "backbone_00281": "high", "backbone_00281_day8": "low", "backbone_00318": "high", "backbone_00317": "high"},
  '00689':{induction:'high',maintenance:'minimal'},
  '00908':{induction:'high',maintenance:'minimal'},
  '00569':{induction:'high',maintenance:'low'},
  '00579':{induction:'high',maintenance:'minimal'},
  '00713':{induction:'high',maintenance_day1:'low',maintenance_day22:'minimal'},
  '00714':{induction:'high',maintenance_day1:'low',maintenance_day22:'minimal'},
  '00568':{induction:'high',maintenance:'low'},
  '00688':{combination:'low',atezolizumab:'minimal'},
  '00738':{combination:'low',bevacizumab_only:'minimal',paclitaxel_only:'low'},
  '00485':{anthracycline:'high',paclitaxel:'low'},
  '00815':{combination:'low',trastuzumab_maintenance:'minimal'},
  '00858':{taxane_platinum:'moderate',ac:'high',adjuvant:'minimal'},'00860':{taxane_platinum:'high',ac:'high',paclitaxel_only:'low',adjuvant:'minimal'},'00861':{taxane_platinum:'moderate',ac:'high',adjuvant:'minimal'},'00348':{taxane_platinum:'high',ac:'high',paclitaxel_only:'low'},'00734':{taxane_platinum:'moderate',ac:'high'},
  '00260':{ac:'high',paclitaxel:'low'}, '00278':{ac:'high',paclitaxel:'low'},
  '00316':{ac:'high',paclitaxel:'low',continuation:'minimal'},
  '00432':{ac:'high',paclitaxel:'low',continuation:'minimal'},
  '00433':{ac:'high',paclitaxel:'low',continuation:'minimal'},
  '00745':{ac:'high',paclitaxel:'low',continuation:'minimal'},
  '00258':{combination:'high',continuation:'minimal'},
  '00204':{combination:'low',continuation:'minimal'},
  '00507':{combination:'low',continuation:'minimal'},
  '00512':{combination:'low',continuation:'minimal'},
  '00526':{iv:'minimal',oral:'oral_moderate_high',continuation:'minimal'},
  '00798':{iv:'minimal',oral:'oral_moderate_high',continuation:'minimal'},
  '00775':{day1:'high',day8:'low',continuation:'variable'},
  '00722':{combination:'high',continuation:'variable'},
  '00731':{combination:'high',continuation:'variable'}
};
const resolver = fs.readFileSync(path.join(root, "js", "emetogenic-risk.js"), "utf8");
const ui = fs.readFileSync(path.join(root, "js", "generic-assessment-ui.js"), "utf8");

const MED = "https://healthservice.hse.ie/documents/7180/Supportive_Care_Antiemetics_for_inclusion_NCIS_Medical_Oncology.pdf";
const HAEM = "https://assets.hse.ie/media/documents/NCCP_Antiemetics_in_NCISHaem-Onc.pdf";

assert.ok(pkg.version.localeCompare("0.63.1", undefined, { numeric: true }) >= 0, "package version must retain v0.63.1 or later functionality");
assert.strictEqual(riskMap.release, "0.48.0", "emetogenic classification release must remain unchanged");
assert.strictEqual(riskMap.guidance_link_release, "0.63.1");
assert.strictEqual(riskMap.source.medical_oncology_antiemetic_guidance_url, MED);
assert.strictEqual(riskMap.source.haemato_oncology_antiemetic_guidance_url, HAEM);
assert.ok(resolver.includes("medical_oncology_antiemetic_guidance_url"));
assert.ok(resolver.includes("haemato_oncology_antiemetic_guidance_url"));
assert.ok(ui.includes("Open NCCP emetogenic classification source"));

for (const [id, script] of Object.entries(riskMap.scripts || {})) {
  assert.ok(/^https:\/\//.test(script.url || ""), `${id} must use a national NCCP web link`);
  assert.ok(!/CUH/i.test(script.label || ""), `${id} must not expose a CUH antiemetic label`);
  if (['nccp-captem-v08437','nccp-prrt-v08437'].includes(id)) {
    const code=id==='nccp-captem-v08437'?'00505':'00642';
    const protocol=JSON.parse(fs.readFileSync(path.join(root,index.protocols.find(p=>p.path.includes('/'+code+'-')).path),'utf8'));
    require('../tools/neuroendocrine-organ-migration-v08437.cjs').validate(code,protocol);
    assert.strictEqual(script.status,'source_mapped_pending_local_oncology_pharmacy_validation');
    assert.strictEqual(script.url,MED);assert.strictEqual(script.source_url,protocol.metadata.source_url);
    assert.strictEqual(protocol.supportive_care.script_id,id);
    assert.strictEqual(protocol.supportive_care.supportive_medications_label,script.label);
    assert.strictEqual(riskMap.protocols[code].level,script.risk_level);
  } else assert.strictEqual(script.status, "national_guidance_link", `${id} must be marked as national guidance`);
}

const currentMapLevels = Object.fromEntries(Object.entries(riskMap.protocols || {}).map(([code, rec]) => [code, {
  level: rec.level,
  phase_levels: Object.fromEntries(Object.entries(rec.phase_profiles || {}).map(([k, v]) => [k, v?.level]))
}]));
if (pkg.version.localeCompare("0.64.0", undefined, { numeric: true }) < 0) {
  assert.deepStrictEqual(currentMapLevels, classificationBaseline.protocol_risk_map_levels, "central emetogenic classifications must remain unchanged");
} else {
  const allowedCorrections = {
    "00105":"low", "00551":"low", // v42: current NCCP ipilimumab-containing phase; nivolumab-only maintenance remains minimal.
    "00415":"oral_moderate_high", "00563":"oral_moderate_high", // NCCP00415 v5, v40 source-audited oral risk.
    "00742":"oral_moderate_high", "00804":"oral_moderate_high", // v39: highest active component; bevacizumab-only phase remains minimal.
    "00505":"oral_moderate_high", // v37: NCCP00505 temozolomide Days10–14, exact source/hash checked above.
    "00642":"moderate", // v37: PRRT-specific amino-acid/5-HT3 plan, not a generic steroid script.
    "00555":"high", "00783":"high", "00238":"moderate", "00791":"low",
    "00309":"moderate",
    "00243": "oral_moderate_high", // v0.84.24: NCCP 00243 v7, oral crizotinib risk
    "00382": "oral_moderate_high", // v0.84.24: NCCP 00382 v4, oral trifluridine/tipiracil risk
    "00319": "high", // v0.84.23: carboplatin AUC5, oral etoposide does not remove Day 1 high risk
    "00318": "high", // v0.84.22 carboplatin AUC5
    "00207": "low",
    "00732": "low", // NCCP 00732 v4, reviewed v0.84.21
    "00525": "oral_moderate_high",
    "00892": "oral_moderate_high",
    "00261": "high", // v0.84.20 NCCP carboplatin AUC >=4

    "00377": "oral_moderate_high", // v0.84.18 oral cyclophosphamide Days 1–14, NCCP Table 5

    "00225": "low", // v0.83.5: NCCP V6 table 7 and 00225 v6
    "00586": "oral_minimal_low", // v0.83.4 NCCP capecitabine oral risk
    "00623": "oral_minimal_low",
    "00844": "moderate",
    "00449": "moderate", // v0.83.3: NCCP 00449 v6a p6
    "00446": "moderate", // v0.83.3: NCCP 00446 v7b p6
    "00945": "low",
    "00431": "low",
    "00319": "phase_dependent", // v29: day1 carboplatin versus oral etoposide days2–3
    "00614": "phase_dependent", // v29: treatment day and prescribed vinorelbine route
    "00340": "oral_moderate_high" // NCCP00340 v4 p6; source-derived v0.84.25 audit
  };
  for (const [code, baseline] of Object.entries(classificationBaseline.protocol_risk_map_levels)) {
    const migratedMap = ['00691','00486','00279','00456','00561','00372','00281','00310','00339','00343','00712','00792','00849','00689','00908','00569','00579','00713','00714','00568','00688','00738','00485','00204','00507','00258','00526','00798','00775','00722','00731','00316','00433','00745','00512','00815'].includes(code);
    const expected = migratedMap ? 'phase_dependent' : allowedCorrections[code] || baseline.level;
    if(migratedMap) assert.deepStrictEqual(currentMapLevels[code].phase_levels,familyPhases[code],code+' source-reconciled phase risks');
    assert.strictEqual(currentMapLevels[code]?.level, expected, `${code} emetogenic classification differs from the retained baseline or approved v0.64.0 correction`);
  }
}

let protocolCount = 0;
let medicalLinks = 0;
let haemLinks = 0;
for (const record of index.protocols || []) {
  if (record.enabled === false) continue;
  const file = path.join(root, record.path);
  const protocol = JSON.parse(fs.readFileSync(file, "utf8"));
  protocolCount += 1;
  const relative = path.relative(path.join(root, "protocols"), file).replace(/\\/g, "/");
  const sc = protocol.supportive_care || {};
  const md = protocol.metadata || {};
  const baseline = classificationBaseline.protocol_supportive_care_levels[relative];
  if(['00742','00804'].includes(md.nccp_regimen_code)){
    assert(require('./helpers/neuro-inputs-v08439.cjs').validate(protocol));
    assert.equal(sc.emetogenic_risk,'oral_moderate_high');
    assert.deepStrictEqual(Object.fromEntries(Object.entries(sc.phase_profiles).map(([k,v])=>[k,v.level])),{lomustine_day_1:'oral_moderate_high',bevacizumab_only_days:'minimal'});
    const phases=readJson('data/phase-support-v0838.json').regimens[md.nccp_regimen_code];
    assert.equal(phases.find(p=>p.id==='day1').emetogenic_risk,'oral_moderate_high');assert.equal(phases.find(p=>p.id==='bevacizumab_only').emetogenic_risk,'minimal');
    assert.equal(phases.find(p=>p.id==='bevacizumab_only').medicines.length,0);
  }
  if(['00415','00563'].includes(md.nccp_regimen_code)){assert(require('./helpers/skin-inputs-v08440.cjs').validate(protocol));assert.equal(sc.emetogenic_risk,'oral_moderate_high');}
  const immune35=dualImmuneV35[md.nccp_regimen_code];
  if(immune35){
    assert.equal(relative,immune35.path);
    assert.equal(md.clinical_audit_release,md.nccp_regimen_code==='00551'?'0.84.42':'0.84.35');
    if(md.nccp_regimen_code==='00551')assert(require('./helpers/skin-inputs-v08440.cjs').validate(protocol));
    assert.equal(md.nccp_version,immune35.version);
    assert.equal(md.source_url,immune35.url);
    const binary=fs.readFileSync(path.join(root,'validation/colorectal-v08435/nivo-fruq-source-audit',md.nccp_regimen_code+'.pdf'));
    assert.equal(crypto.createHash('sha256').update(binary).digest('hex'),immune35.sha256);
    assert.equal(md.source_sha256,immune35.sha256);
    assert.equal(sc.script_id,'nccp-parenteral-low');
    assert.match(sc.mapping_basis,/ipilimumab low.*maintenance nivolumab minimal/i);
    const phases=readJson('validation/colorectal-v08435/support-kb/default-support-updates.json')[md.nccp_regimen_code];
    assert.equal(phases.find(p=>p.id==='nivolumab_continuation').emetogenic_risk,'Minimal');
    assert.match(phases.find(p=>p.id==='combination_cycles_1_4').emetogenic_risk,/Low combination/);
  }
  if(sc.phase_specific_plan&&!sc.emetogenic_risk){assert(fs.existsSync(path.join(root,sc.phase_specific_plan)),relative+' lacks authored phase selector');assert(sc.source_url,relative+' lacks source');}
  else if (baseline) {
    const correctionByPath = {
      "skin/00105-ipilimumab-monotherapy.json":"low",
      "skin/00563-encorafenib-and-binimetinib-therapy.json":"oral_moderate_high",
      "skin/00415-trametinib-and-dabrafenib-therapy.json":"oral_moderate_high",
      "neuro-oncology/00742-lomustine-and-bevacizumab-5-mg-kg-therapy.json":"oral_moderate_high",
      "neuro-oncology/00804-lomustine-and-bevacizumab-7-5-mg-kg-therapy.json":"oral_moderate_high",
      "gastrointestinal/00505-capecitabine-and-temozolomide-therapy.json":"oral_moderate_high",
      "gastrointestinal/00642-lutetium-177-oxodotreotide-lutathera-therapy.json":"moderate",
      "gastrointestinal/00555-folfoxiri.json":"high",
      "gastrointestinal/00783-bevacizumab-5-mg-kg-and-folfoxiri-therapy-14-day.json":"high",
      "gastrointestinal/00238-aflibercept-folfiri.json":"moderate",
      "gastrointestinal/00791-bevacizumab-5-mg-kg-5-fluorouracil-and-folinic-acid-therapy-14-day.json":"low",
      "lung/00309-weekly-carboplatin-auc2-and-paclitaxel-50-mg-m2-with-radiotherapy.json":"moderate",
      "lung/00243-crizotinib-monotherapy.json": "oral_moderate_high",
      "gastrointestinal/00382-trifluridine-tipiracil.json": "oral_moderate_high",
      "lung/00319-carboplatin-and-oral-etoposide-therapy-21-day.json": "high",
      "lung/00318-pemetrexed-and-carboplatin-therapy.json": "high",
      "gastrointestinal/00732-cetuximab-therapy-14-days.json": "low",
      "gastrointestinal/00207-cetuximab-therapy-7-days.json": "low",
      "breast/00261-carboplatin-q21d.json": "high",

      "breast/00377-cmf-oral.json": "oral_moderate_high",
      "gastrointestinal/00225-panitumumab-6-mg-kg-therapy.json": "low",
      "gastrointestinal/00586-capecitabine-825-mg-m2-and-radiotherapy-7-day.json": "oral_minimal_low",
      "gastrointestinal/00623-bevacizumab-7-5-mg-kg-and-capecitabine-1250-mg-m2-therapy.json": "oral_minimal_low",
      "gastrointestinal/00844-nivolumab-modified-folfox6.json": "moderate",
      "gastrointestinal/00449-bevacizumab-folfiri.json": "moderate",
      "gastrointestinal/00446-bevacizumab-modified-folfox6.json": "moderate",
      "genitourinary/00945-enfortumab-vedotin-and-pembrolizumab-therapy.json": "low",
      "skin/00431-nivolumab-1-mg-kg-and-ipilimumab-3-mg-kg-therapy.json": "low",
      "lung/00340-ceritinib-monotherapy.json": "oral_moderate_high"
    };
    const expectedRisk = immune35 ? 'low' : pkg.version.localeCompare("0.64.0", undefined, { numeric: true }) >= 0 && correctionByPath[relative]
      ? correctionByPath[relative]
      : (baseline.emetogenic_risk ?? null);
    const auditedPhases = md.nccp_regimen_code==='00486'?{oxaliplatin_days:'moderate',fluorouracil:'low'}:familyPhases[md.nccp_regimen_code];
    assert.strictEqual(sc.emetogenic_risk ?? null, auditedPhases ? 'phase_dependent' : expectedRisk, `${relative} emetogenic risk changed outside approved source reconciliation`);
    const phaseLevels = Object.fromEntries(Object.entries(sc.phase_profiles || {}).map(([k, v]) => [k, v?.emetogenic_risk ?? v?.level]));
    assert.deepStrictEqual(phaseLevels, md.nccp_regimen_code==='00309'?{}:['00377','00378','00381','00430','00749'].includes(md.nccp_regimen_code)?{combination:md.nccp_regimen_code==='00377'?'oral_moderate_high':md.nccp_regimen_code==='00749'?'low':'moderate'}:auditedPhases || baseline.phase_levels || {}, `${relative} phase risk classification changed`);
  }
  for (const [label, url] of [["supportive", sc.supportive_medications_pdf_url], ["metadata", md.antiemetic_proforma_url]]) {
    if (!url) continue;
    assert.ok(url === MED || url === HAEM, `${relative} ${label} antiemetic link must use national NCCP guidance`);
    if (url === MED) medicalLinks += 1;
    if (url === HAEM) haemLinks += 1;
  }
  assert.ok(!/CUH.*(?:antiem|supportive|prescription sheet)|(?:antiem|supportive).*CUH/i.test(JSON.stringify({
    supportive_medications_label: sc.supportive_medications_label,
    provenance: sc.provenance,
    antiemetic_proforma_url: md.antiemetic_proforma_url
  })), `${relative} must not expose CUH antiemetic source wording`);

  const core = {
    input_definitions: protocol.input_definitions,
    required_inputs: protocol.required_inputs,
    rule_engine: protocol.rule_engine,
    treatment: protocol.treatment,
    eligibility: protocol.eligibility,
    exclusions: protocol.exclusions
  };
  const actualCoreHash = crypto.createHash("sha256").update(JSON.stringify(core, Object.keys(core).sort())).digest("hex");
  // Use stable deep sort to match baseline.
  function stable(value) {
    if (Array.isArray(value)) return value.map(stable);
    if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map(k => [k, stable(value[k])]));
    return value;
  }
  const stableHash = crypto.createHash("sha256").update(JSON.stringify(stable(core))).digest("hex");
  if (pkg.version === "0.63.1") {
    assert.strictEqual(stableHash, clinicalCoreBaseline.hashes[relative], `${relative} clinical core changed during antiemetic link migration`);
  }
}

assert.strictEqual(protocolCount, 377);
assert.ok(medicalLinks > 0, "medical oncology protocols must link national NCCP medical oncology antiemetic guidance");

const localDir = path.join(root, "assets", "supportive-care");
if (fs.existsSync(localDir)) {
  const localPdfs = fs.readdirSync(localDir).filter(name => /Antiemetics_|Docetaxel_Supportive/i.test(name));
  assert.deepStrictEqual(localPdfs, [], "local CUH antiemetic and supportive prescription PDFs must not remain in active assets");
}


(async () => {
  const context = {
    console,
    fetch: async () => ({ ok: true, json: async () => riskMap })
  };
  context.globalThis = context;
  vm.runInNewContext(resolver, context);
  await context.SACTCheckEmetogenicRisk.load("data/emetogenic-risk-map.json");
  for (const [code, phases] of Object.entries(familyPhases)) {
    const record = index.protocols.find(p=>String(p.nccp_regimen_code || p.code || p.id).includes(code) || p.path.includes('/'+code+'-'));
    const protocol = readJson(record.path), risk = context.SACTCheckEmetogenicRisk;
    assert.strictEqual(risk.get(protocol).level, 'phase_dependent');
    assert.strictEqual(risk.get(protocol).scriptId, null, 'No old whole-course script without a selected phase');
    assert.strictEqual(risk.get(protocol).subsequentDays, null);
    for (const [phase, level] of Object.entries(phases)) {
      const day=Object.keys(protocol.supportive_care.treatment_day_profiles||{}).find(k=>protocol.supportive_care.treatment_day_profiles[k]===phase);
      const completionOptions=code==='00372'?(phase==='combination'?{treatmentDay:'day1'}:phase==='combination_oral'?{treatmentPhase:'combination',treatmentDay:'days2_21'}:{}):code==='00279'?({cis_day1:{treatmentSchedule:'iv_21',treatmentDay:'day1'},carboplatin_substitution:{treatmentSchedule:'carbo_iv_21',treatmentDay:'day1'},iv_only:{treatmentSchedule:'iv_21',treatmentDay:'day2'},oral_only:{treatmentSchedule:'mixed_21',treatmentDay:'day2'},split_platinum:{treatmentSchedule:'split_iv_21',treatmentDay:'day2'}}[phase]||{}):{};
      const selected=risk.get(protocol,{treatmentPhase:phase,...(day?{treatmentDay:day}:{}),...(code==='00849'?{treatmentDay:1}:{}),...(code==='00614'?{treatmentDay:phase==='day1'?'day1':'day8',treatmentRoute:phase==='day8_oral'?'oral':'iv'}:{}),...completionOptions});
      assert.strictEqual(selected.level,level,code+'/'+phase);
      const migrated=['00204','00507','00258','00526','00798','00775','00722','00731','00316','00433','00745','00512','00815'].includes(code);
      const v17Scripts={high:'nccp-v8-ac-v08417',low:'nccp-v8-paclitaxel-v08417',minimal:'nccp-v8-trastuzumab-v08417'};
      const expectedScript=code==='00691'?(phase==='induction'?'nccp-v8-high-v08420':'nccp-oral-minimal-low'):code==='00279'?({cis_day1:'nccp-v8-high-v08420',days23:null,carboplatin_substitution:'nccp-v8-carboplatin-v08420',iv_only:'nccp-parenteral-low',oral_only:'nccp-oral-minimal-low',split_platinum:'nccp-v8-high-v08420'})[phase]:code==='00372'?(phase==='combination'?'nccp-parenteral-low':'nccp-oral-minimal-low'):['00456','00561'].includes(code)?({high:'nccp-parenteral-high',low:'nccp-v8-low-v08418',moderate:'nccp-v8-moderate-v08418'})[level]:code==='00319'?(phase==='day1'?'nccp-v8-carboplatin-v08420':'nccp-oral-minimal-low'):code==='00614'?({day1:'nccp-v8-carboplatin-v08420',day8_iv:'nccp-minimal-no-routine',day8_oral:'nccp-oral-vinorelbine-v08420'})[phase]:['00281','00310','00339','00343'].includes(code)?({high:code==='00310'?'nccp-v8-carboplatin-v08420':'nccp-v8-high-v08420',low:'nccp-parenteral-low',minimal:'nccp-parenteral-minimal'})[level]:code==='00849'?(phase.endsWith('_day8')?'nccp-parenteral-low':['backbone_00304','backbone_00310','backbone_00318'].includes(phase)?'nccp-v8-carboplatin-v08420':'nccp-v8-high-v08420'):['00712','00792'].includes(code)?(phase==='induction'?'nccp-v8-carboplatin-v08420':level==='minimal'?'nccp-minimal-no-routine-prophylaxis':'nccp-parenteral-low'):['00689','00908'].includes(code)?(phase==='induction'?'nccp-v8-carboplatin-v08420':code==='00689'?'nccp-parenteral-minimal':'nccp-minimal-no-routine-prophylaxis'):['00569','00579','00713','00714'].includes(code)?(level==='minimal'?'nccp-minimal-no-routine-prophylaxis':phase==='induction'&&['00579','00713'].includes(code)?'nccp-v8-carboplatin-v08420':'nccp-parenteral-'+level):code==='00568'?(phase==='induction'?'nccp-v8-carboplatin-v08420':'nccp-parenteral-low'):['00688','00738','00485'].includes(code)?({high:'nccp-v8-ac-v08417',low:'nccp-v8-low-v08418',minimal:'nccp-minimal-no-routine-prophylaxis'})[level]:['00260','00278','00432','00316','00433','00745','00512','00815'].includes(code) ? v17Scripts[level] : migrated ? (['high','variable'].includes(level)?null:level==='minimal'?'nccp-minimal-no-routine-prophylaxis':level==='oral_moderate_high'?'nccp-oral-moderate-high':'nccp-parenteral-'+level) : ['00858','00860','00861'].includes(code)&&level==='minimal'?'nccp-minimal-no-routine-prophylaxis':'nccp-parenteral-'+level;
      assert.strictEqual(selected.scriptId,expectedScript,code+'/'+phase+' must use the source-specific support pathway');
    }
    for (const [alias,phase] of Object.entries(protocol.supportive_care.phase_aliases || {})) assert.strictEqual(risk.get(protocol,{treatmentPhase:alias}).level,phases[phase]);
    assert.strictEqual(risk.get(protocol,{treatmentPhase:'unknown'}).scriptId,null);
  }

  const breast = context.SACTCheckEmetogenicRisk.get({
    metadata: { nccp_regimen_code: "TESTMED", tumour_group: "Breast" },
    supportive_care: { emetogenic_risk: "high", script_id: "nccp-parenteral-high" }
  }, { tumourGroup: "Breast" });
  assert.strictEqual(breast.proformaUrl, MED, "medical oncology context must resolve to the national Medical Oncology antiemetic document");

  const haem = context.SACTCheckEmetogenicRisk.get({
    metadata: { nccp_regimen_code: "TESTHAEM", tumour_group: "Haemato Oncology" },
    supportive_care: { emetogenic_risk: "high", script_id: "nccp-parenteral-high" }
  }, { tumourGroup: "Haemato Oncology" });
  assert.strictEqual(haem.proformaUrl, HAEM, "haemato oncology context must resolve to the national Haemato Oncology antiemetic document");

  console.log(`v0.63.1 NCCP antiemetic guidance tests passed for ${protocolCount} enabled protocols. Medical links: ${medicalLinks}. Haem contexts resolve dynamically to the national Haemato Oncology document.`);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
