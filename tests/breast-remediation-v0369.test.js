const fs=require('fs'); const path=require('path');
const files=['00285-trastuzumab-sc-q21d-ebc.json','00200-trastuzumab-iv-q21d.json','00272-trastuzumab-sc-q21d-metastatic.json','00688-atezolizumab-nab-paclitaxel.json','00545-zoledronic-acid-adjuvant.json'];
for(const name of files){const p=path.join(__dirname,'..','protocols','breast',name); const x=JSON.parse(fs.readFileSync(p)); if(x.status.includes('placeholder')) throw new Error(name+' still placeholder'); if(!x.rule_engine.rules.length) throw new Error(name+' has no rules'); if(!x.supportive_care) throw new Error(name+' missing supportive care');}
console.log('v0.36.9 breast remediation tests passed');
