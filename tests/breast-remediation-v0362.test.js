const fs=require('fs'); const path=require('path'); const assert=require('assert');
const root=path.join(__dirname,'..','protocols','breast');
const files=['00261-carboplatin-q21d.json','00430-gemcitabine-carboplatin.json','00507-pertuzumab-trastuzumab-paclitaxel.json','00526-pertuzumab-trastuzumab-vinorelbine.json','00621-paclitaxel-weekly-3-of-4.json'];
for(const f of files){const d=JSON.parse(fs.readFileSync(path.join(root,f),'utf8')); assert(!String(d.status).includes('placeholder'),f+' remains placeholder'); assert(Object.keys(d.input_definitions||{}).length>=8,f+' lacks inputs'); assert((d.rule_engine?.rules||[]).length>=8,f+' lacks rules'); assert(d.metadata?.validation?.source_document_checked===true,f+' source not checked');}
const gem=JSON.parse(fs.readFileSync(path.join(root,files[1]),'utf8')); assert(gem.rule_engine.rules.some(r=>r.rule_id==='DAY8_OMIT'));
const pth=JSON.parse(fs.readFileSync(path.join(root,files[2]),'utf8')); assert(pth.rule_engine.rules.some(r=>String(r.rule_id).includes('LVEF_WITHHOLD_LOW'))); assert(pth.rule_engine.rules.some(r=>r.rule_id==='EXCLUSION_BASELINE_LVEF_BELOW_50'));
console.log('v0.36.2 breast remediation tests passed');
