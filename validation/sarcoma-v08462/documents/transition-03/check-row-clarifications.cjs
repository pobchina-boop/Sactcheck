'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../../..');
const read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const text=f=>fs.readFileSync(path.join(root,f),'utf8');
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
const transition=read('validation/sarcoma-v08462/documents/transition-03/row-data-transition.json');
const note=transition.note,workflow=read('data/regimen-workflow-v0750.json'),index=read('protocols/index.json').protocols;
function engine(source){
 const box={module:{exports:{}},console,SACTCheckPatientAssets:{contextFor:p=>({'00228':'liposarcoma','00205':'sarcoma'}[String(p.metadata.nccp_regimen_code).padStart(5,'0')]||'')}};
 // Test-only exposure of the unchanged actual renderer body, not a copied renderer.
 const marker='return Object.freeze({';assert.equal(source.split(marker).length,2);
 vm.runInNewContext(source.replace(marker,marker+' renderSupportiveScript,'),box);
 return box.module.exports;
}
const currentSource=text('js/regimen-workflow-engine-v0750.js');
const previousSource=text('validation/sarcoma-v08462/documents/transition-03/before/js/regimen-workflow-engine-v0750.js');
const current=engine(currentSource),previous=engine(previousSource),rows=[];
let unchangedPlans=0;
for(const [planId,plan] of Object.entries(workflow.antiemetic_plans)){
 const row=(plan.local_reference?.items||[]).find(x=>x.source_clarification);
 if(!row){
  const manifest={supportiveCare:{status:'available',...plan}};
  assert.equal(current.renderSupportiveScript(manifest),previous.renderSupportiveScript(manifest),planId+' changed without a clarification');
  unchangedPlans++;continue;
 }
 assert.equal(row.source_clarification,note);
 const match=planId.match(/^sarcoma62_(\d{5})_(.+)$/);assert(match);
 const [,code,phase]=match,context=({'00228':'liposarcoma','00205':'sarcoma'}[code]||'');
 const selector=context?workflow.context_supportive_phase_selectors[code][context]:workflow.supportive_phase_selectors[code];
 const indexed=index.find(x=>x.id===selector.protocol_id);assert(indexed);
 const protocol=read(indexed.path),manifest=current.buildManifest(protocol,workflow,{},phase);
 assert.equal(manifest.supportiveCare.planId,planId);
 const html=current.renderSupportiveScript(manifest);
 for(const value of [row.dose,row.frequency,row.timing,row.directions,note])assert(html.includes(value),planId+' workflow omitted '+value);
 assert.equal(html.split(note).length-1,1);
 const route=code+(context?'/'+context:''),file='patient/'+route+'/support-'+phase+'.html';
 const printed=text(file);
 for(const value of [row.dose,row.frequency,row.timing,row.directions,note])assert(printed.includes(value),file+' omitted '+value);
 assert.equal(printed.split(note).length-1,1);
 const old=text('validation/sarcoma-v08462/documents/transition-03/before/'+file);
 assert.equal(printed.replace('<small class="local-source-clarification">'+note+'</small>',''),old,file+' has unrelated HTML changes');
 rows.push({plan_id:planId,route,phase,workflow_manifest_selection_verified:true,actual_workflow_renderer:true,printed_patient_support_renderer:true,original_dose_frequency_timing_directions_retained:true,file,html_sha256:digest(printed)});
}
assert.equal(rows.length,8);
for(const route of [...new Set(rows.map(x=>x.route))]){
 const file='patient/'+route+'/supportive-care.html',html=text(file),old=text('validation/sarcoma-v08462/documents/transition-03/before/'+file);
 assert.equal(html.split(note).length-1,rows.filter(x=>x.route===route).length);
 assert.equal(html.split('<small class="local-source-clarification">'+note+'</small>').join(''),old);
}
const report={status:'passed',clarified_authored_phases:rows.length,clarified_workflow_mirrors:rows.length,unchanged_plans_without_field:unchangedPlans,rows,engine_sha256:digest(currentSource),phase_generator_sha256:digest(text('tools/build-phase-support-v0838.cjs')),scope:'Actual manifest phase selection and actual workflow renderer executed; actual generated patient/support HTML checked. Test-only renderer exposure does not modify application exports. PDF regeneration and visual review remain with documents.'};
fs.writeFileSync(path.join(__dirname,'row-render-checks.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,phases:rows.length,workflow_mirrors:rows.length,unchanged_other_plans:unchangedPlans}));
