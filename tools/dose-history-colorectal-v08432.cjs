'use strict';
const fs=require('fs'),idx=require('../protocols/index.json').protocols;
for(const code of ['00209','00321','00227']){
 const file=idx.find(x=>x.path.includes('/'+code+'-')).path,p=JSON.parse(fs.readFileSync(file));
 for(const r of p.rule_engine.rules)for(const [component,change]of Object.entries(r.action?.component_changes||{})){
  if(change.dose_level_change==null)continue;
  const field='current_'+component+'_dose_level',levels=p.dose_levels[component];if(!levels)throw Error(code+' missing levels '+component);
  p.input_definitions[field]={label:'Current '+component.replaceAll('_',' ')+' dose level',type:'select',required:false,input_role:'decision',always_show:true,demo_value:'',options:Object.entries(levels).filter(([k,v])=>typeof v==='number').map(([k,v])=>({value:Number(k),label:'Level '+k+' — '+v+' mg/m²'+(component==='capecitabine'?' per dose, twice daily':'')})),help_text:'Use the last prescribed component dose level. Required before calculating a further reduction; do not assume the starting dose.'};
  change.relative_to_current_dose_level=true;change.current_dose_level_field=field;
  if(r.source){r.source.url=p.metadata.source_url;r.source.document='NCCP '+code+' v'+p.metadata.nccp_version;}
 }
 fs.writeFileSync(file,JSON.stringify(p,null,2)+'\n');
}
