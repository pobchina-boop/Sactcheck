"use strict";
const assert=require("assert");
const fs=require("fs");
const path=require("path");
const content=JSON.parse(fs.readFileSync(path.join(__dirname,"..","data","consent-content-v0710.json"),"utf8"));
const risks=content.generic_modules.immune_checkpoint_inhibitor.risks;
const labels=new Set(risks.map(item=>item.label));
for(const label of [
  "Pneumonitis",
  "Diarrhoea / colitis",
  "Hepatitis",
  "Endocrine toxicity",
  "Nephritis",
  "Severe skin toxicity",
  "Myocarditis / pericarditis",
  "Neurological immune toxicity",
  "Myositis / neuromuscular toxicity",
  "Ocular inflammation",
  "Pancreatitis / pancreatic inflammation",
  "Delayed or persistent immune toxicity",
  "Rare life-threatening or fatal immune toxicity"
]){
  assert.ok(labels.has(label),`Missing explicit immunotherapy consent domain: ${label}`);
}
const neuro=risks.find(item=>item.label==="Neurological immune toxicity");
assert.ok(/encephalitis/i.test(neuro.detail));
assert.ok(/myasthen/i.test(neuro.detail));
const cardiac=risks.find(item=>item.label==="Myocarditis / pericarditis");
assert.ok(/life-threatening/i.test(cardiac.detail));
console.log("v0.71.2 consent-content immunotherapy audit tests passed.");

const atezo=content.agent_profiles.atezolizumab;
assert.strictEqual(atezo.immune_core_frequency_estimates.nephritis.display,"0.2%*");
assert.strictEqual(atezo.immune_core_frequency_estimates.skin.display,"0.6%*");
assert.ok(atezo.rare_immune_events.some(item=>item.label==="Myocarditis" && item.frequency==="<0.1%*"));
assert.ok(atezo.rare_immune_events.some(item=>item.label==="Meningoencephalitis" && item.frequency==="0.4%*"));
assert.ok(atezo.immune_frequency_source.url.includes("medicines.org.uk/emc/product/8442/smpc"));
console.log("v0.71.3 atezolizumab frequency-evidence metadata tests passed.");
