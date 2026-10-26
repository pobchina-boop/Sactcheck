const fs = require('fs');
const path = require('path');
const assert = require('assert');
const read = n => JSON.parse(fs.readFileSync(path.join(__dirname,'..','protocols','breast',n),'utf8'));
const batch = [
 '00201-trastuzumab-iv-weekly.json',
 '00204-pertuzumab-trastuzumab-docetaxel.json',
 '00206-t-dm1-metastatic.json',
 '00212-bevacizumab-q14d.json',
 '00253-tamoxifen.json'
];
for (const f of batch) {
 const p=read(f);
 assert(!String(p.status).includes('placeholder'), `${f} still placeholder`);
 assert.strictEqual(p.metadata.sactcheck_encoding_version, f.startsWith('00253-') ? '0.84.20' : f.startsWith('00204-') ? '0.84.16' : /^(00201|00206)-/.test(f) ? '0.84.14' : f.startsWith('00212-') ? '0.84.21' : '0.37.0');
 assert(Array.isArray(p.metadata.treatment_class) && p.metadata.treatment_class.length>0, `${f} missing treatment class`);
 assert(p.supportive_care && p.supportive_care.emetogenic_risk !== 'awaiting_proforma_mapping', `${f} missing emetogenic mapping`);
 assert(p.rule_engine.rules.length>=7, `${f} lacks gold-standard rule depth`);
}
const lap=read('00217-lapatinib-capecitabine.json');
assert(!lap.input_definitions.crcl, 'Ambiguous old renal input remains retired');
assert(lap.input_definitions.crcl_ml_min && lap.input_definitions.renal_measure_type, 'v0.84.16 supports confirmed numeric CrCl separately from indexed eGFR');
assert(lap.input_definitions.crcl_band, 'CrCl band selector missing');
const vals=lap.input_definitions.crcl_band.options.map(o=>o.value);
for (const v of ['gte_51','30_50','lt_30','dialysis']) assert(vals.includes(v), `missing renal band ${v}`);
assert(lap.rule_engine.rules.some(r=>r.rule_id==='CAPE_RENAL_30_50'));
assert(lap.rule_engine.rules.some(r=>r.rule_id==='CAPE_RENAL_LT30'));
console.log('✓ v0.36.10 breast remediation and renal-band retrofit tests passed');
