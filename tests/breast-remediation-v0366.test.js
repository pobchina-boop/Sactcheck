const fs=require('fs');const path=require('path');
const files=['00659-t-dm1-early-breast.json','00936-tucatinib-trastuzumab-capecitabine.json','00736-nab-paclitaxel-weekly.json','00217-lapatinib-capecitabine.json','00720-neratinib-extended-adjuvant.json'];
for(const f of files){const p=path.join(__dirname,'..','protocols','breast',f);const d=JSON.parse(fs.readFileSync(p,'utf8'));if(d.status.includes('placeholder'))throw new Error(f+' remains placeholder');if(!d.rule_engine||d.rule_engine.rules.length<5)throw new Error(f+' lacks rules');if(!d.supportive_care||d.supportive_care.emetogenic_risk==='awaiting_proforma_mapping')throw new Error(f+' lacks traffic light');if(!d.metadata.source_url)throw new Error(f+' lacks source');}
console.log('v0.36.6 breast remediation tests passed');
