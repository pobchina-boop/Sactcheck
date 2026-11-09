'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.resolve(__dirname,'../../..'),read=p=>JSON.parse(fs.readFileSync(path.join(__dirname,p),'utf8'));
const evidence=require(path.join(root,'js/treatment-evidence-v08413.js'));
const anatomy=require(path.join(root,'js/patient-anatomy-v08431.js'));
const pack=require(path.join(root,'tools/patient-pack-v08432.cjs'));
const visual=require(path.join(root,'tools/patient-visual-language-v08444.cjs'));
// Exercise the actual KB module markup functions without modifying application code.
const kbSource=fs.readFileSync(path.join(root,'js/regimen-knowledge-base.js'),'utf8').replace('version: VERSION,','version: VERSION, renderHtml: profile => overviewMarkup(profile,"1") + patientSelectionMarkup(profile,"2") + supportiveCareMarkup(profile,"3") + monitoringMarkup(profile,"4") + administrationMarkup(profile,"5") + evidenceAuditMarkup(profile,"6"),');
const sandbox={module:{exports:{}},console};vm.runInNewContext(kbSource,sandbox);
const kb=sandbox.module.exports,clinical=read('clinician-profile-proposals.json'),results=[];
const fullGenerator=fs.readFileSync(path.join(root,'tools/build-complete-pathways.cjs'),'utf8');
const severitySource=fullGenerator.slice(fullGenerator.indexOf('const severity='),fullGenerator.indexOf('\nfor(const code of codes)'));
const symptomSandbox={module:{exports:{}}};vm.runInNewContext(severitySource+'\nmodule.exports=severity;',symptomSandbox);
const symptomKeys=new Set(Object.keys(symptomSandbox.module.exports));
for(const route of read('manifest.json').authored_routes){
 const d=read('profiles/'+route+'.json'),ids=new Set(d.sources.map(s=>s.id));
 const walk=o=>{if(Array.isArray(o))return o.forEach(walk);if(o&&typeof o==='object'){if(o.source_ids)o.source_ids.forEach(id=>assert(ids.has(id),route+' missing source '+id));Object.values(o).forEach(walk)}};walk(d);
 assert(d.anatomy.length>=8);assert.equal(new Set(d.anatomy.map(x=>x[0])).size,d.anatomy.length);assert.equal(d.chapters.length,10);
 d.agents.forEach(a=>a.symptoms.forEach(s=>assert(symptomKeys.has(s),route+' unrecognised passport symptom '+s)));
 assert(d.monitoring_schedule.rows.every(r=>r.cells.length===d.monitoring_schedule.columns.length));
 assert(d.patient_summary.monitoring.some(x=>x.stage==='Before'));
 assert(d.patient_summary.monitoring.some(x=>x.stage==='During'));
 assert(d.patient_summary.monitoring.some(x=>x.stage==='After / response'));
 assert(visual.renderMonitoringDetails(d.monitoring_test_details).includes('sc44-investigation'));
 assert(visual.renderMonitoringSchedule(d.monitoring_schedule).includes('sc44-monitoring-stage'));
 const cp=clinical.regimen_profiles.find(x=>x.protocol_id===d.protocol_id&&(x.context_id||'')===d.patient_context);
 const html=kb.renderHtml(cp)+evidence.render(cp);assert(!html.includes('[object Object]'));assert(!html.includes('undefined'));assert(html.includes('2026-11-07'));
 assert(anatomy.render(d).includes('anatomy-hcc-v0762.png'));
 const outputs=pack.render(d);assert(outputs&&Object.keys(outputs).length>=3);const all=Object.values(outputs).join('');assert(all.includes('85.6'));assert(all.includes('EXAMPLE NUMBERS'));assert(all.includes('oncowiki-qr.png'));
 if(route.startsWith('007')){assert.equal(d.phases[0].cycles.length,6);assert.equal(d.phases[1].id,'maintenance');assert.equal(d.pump_steps.length,6);assert(d.administration_text.includes('22-hour'));assert(d.administration_text.includes('48 hours'));assert(!d.patient_summary.monitoring[0].basis.includes('radiation'));}
 if(route==='00387')assert.equal(d.patient_summary.card_cycle_count,3);
 if(route.startsWith('00385/'))assert.equal(d.patient_summary.card_cycle_count,6);
 results.push({route,anatomyAnchors:d.anatomy.length,chapters:d.chapters.length,sourceReferences:ids.size,kbMarkup:true,evidenceMarkup:true,packMarkup:true,renderedPDF:false});
}
fs.writeFileSync(path.join(__dirname,'content-check-results.json'),JSON.stringify({checked:'2026-11-07',checks:results,limitations:['Markup/schema/source-reference checks do not establish PDF pagination, mobile visual quality, clinical sign-off or QR decoding.']},null,2)+'\n');
console.log('Six patient profiles passed schema, source reference, KB/evidence and pack markup checks.');
