const fs=require('fs'); const path=require('path'); const assert=require('assert');
const root=path.join(__dirname,'..');
const files=['00794-sacituzumab-govitecan.json','00414-palbociclib.json','00525-ribociclib-metastatic.json','00619-abemaciclib-adjuvant.json','00892-ribociclib-adjuvant.json'];
for(const f of files){const p=path.join(root,'protocols','breast',f);const d=JSON.parse(fs.readFileSync(p,'utf8'));assert.equal(d.metadata.sactcheck_encoding_version,'0.36.11');assert(d.metadata.treatment_class?.length);assert(d.ctcae_standard);assert(d.supportive_care?.supportive_medications_pdf_url);}
const r=JSON.parse(fs.readFileSync(path.join(root,'protocols','breast','00525-ribociclib-metastatic.json')));assert(r.input_definitions.renal_band);assert(!r.input_definitions.crcl);assert(r.input_definitions.ast_alt_grade.options.some(x=>String(x.label).includes('>5 to 20')));
const a=JSON.parse(fs.readFileSync(path.join(root,'protocols','breast','00892-ribociclib-adjuvant.json')));assert.equal(a.metadata.tumour_group,'Breast');assert.equal(a.metadata.nccp_regimen_code,'00892');assert(!a.indications);assert(a.input_definitions.dose_level.options.some(x=>x.value===400));
const s=JSON.parse(fs.readFileSync(path.join(root,'protocols','breast','00794-sacituzumab-govitecan.json')));assert.equal(s.supportive_care.emetogenic_risk,'high');assert(s.input_definitions.nonhaem_grade.options[3].description);
console.log('v0.36.11 breast remediation tests passed');
