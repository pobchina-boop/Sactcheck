'use strict';
// Emits reviewable patches under this proposal directory only. Does not edit protocols.
const fs=require('fs'),path=require('path');
const H=require('./head-neck-grading-v08445.cjs');
const root=path.resolve(__dirname,'../../../..');
function walk(p){return fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(p,e.name)):[path.join(p,e.name)]);}
const proposals={};
for(const file of walk(path.join(root,'protocols')).filter(p=>p.endsWith('.json'))){
 let d;try{d=JSON.parse(fs.readFileSync(file,'utf8'));}catch{continue;}
 const code=String(d.metadata?.nccp_regimen_code);if(!['00385','00387','00705','00706'].includes(code))continue;
 const expected=H.scope[code];const fields={};
 for(const field of H.fields(expected)){
  const immune=(expected.v4||[]).includes(field);
  const label=immune?`NCCP ${code} Table 4: CTCAE v4.0 named-event assessment`:`NCCP ${code} named adverse-event table; grading edition not specified`;
  const note=immune?`NCCP ${code} Table 4 specifies CTCAE v4.0 but is not a complete grading table. Confirm the documented grade using the exact named event criteria in that edition. Do not convert a generic interface description into a source-specific grade.`:`NCCP ${code} uses event grades in its treatment-modification table but does not specify a grading edition. Confirm the documented clinical grade of the exact named event under verified local policy; do not infer a CTCAE v5 source attribution or convert between editions.`;
  const set={grading_source_label:label,grading_source_url:expected.url,source_grading_note:note,assessment_guidance:`${note} Assess attribution, current severity, previous events and recovery separately.`};
  // Existing generic grade descriptions are not the source's event definitions.
  set.options=d.input_definitions[field].options.map(o=>({...o,description:Number(o.value)===0?'No documented toxicity of this named event.':`Documented grade ${o.value} of this named event; confirm the source/local event-specific grading definition. The dose-action table alone does not define the grade.`}));
  if(immune)set.ctcae_version='4.0';
  fields[field]={set,remove:immune?['ctcae_source_url']:['ctcae_version','ctcae_source_url']};
 }
 proposals[code]={file:path.relative(root,file),input_definitions:fields};
}
fs.writeFileSync(path.join(__dirname,'grading-metadata-proposal.json'),JSON.stringify(proposals,null,2)+'\n');
console.log(`Prepared metadata-only grading proposals for ${Object.keys(proposals).join(', ')}.`);
