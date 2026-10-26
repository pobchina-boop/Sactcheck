const current21=new Set(require('../data/breast-completion-v08421-source-index.json').codes);
'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),vm=require('vm'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const codes=['00785','00796','00797','00789','00790'],R=require('../js/patient-asset-registry-v0810'),J=require('../js/treatment-journey-v0837'),V=require('../js/treatment-evidence-v08413'),KB=json('data/regimen-knowledge-base-v08415-addendum.json');
const forbidden=/hazard ratio|evidence_at_a_glance|data-clinician-evidence|median overall survival|median progression.free survival|CLEOPATRA|FeDeriCa|TRYPHAENA|hazard ratio/;
for(const code of codes){
 const d=json(`data/patient-knowledge/${code}.json`),phases=json('data/phase-support-v0838.json').regimens[code];
 assert.equal(d.suite_release,current21.has(d.code)?'0.84.21':('0.84.15'));assert.equal(d.cycle_display,'reference-chronology');assert(!d.evidence);assert(!d.evidence_at_a_glance);assert(d.chapters.some(x=>x.id==='treatment-rationale'));
 const src=new Set(d.sources.map(s=>s.id));for(const ch of d.chapters)for(const it of ch.items)for(const id of it.source_ids)assert(src.has(id),code+':'+id);
 const j=J.definitions[code];assert.equal(j.has_patient_dates,false);for(const l of j.lanes){assert.equal(l.cells.length,j.stages.length);for(const id of l.source_ids)assert(j.sources.some(s=>s.id===id));}
 for(const name of ['index','knowledge','consent','consent-form','guide','passport','sactcard','logistics','supportive-care','supportive-care-overview','treatment-journey',...phases.map(p=>'support-'+p.id)]){
  const h=read(`patient/${code}/${name}.html`);assert(!/undefined|\[object Object\]/.test(h),code+'/'+name);assert(!forbidden.test(h),code+'/'+name+' evidence crossed audience boundary');
  for(const m of h.matchAll(/(?:src|href)="([^"#]+)"/g)){if(/^(https?:|data:|mailto:|tel:)/.test(m[1]))continue;assert(fs.existsSync(path.resolve(root,'patient',code,m[1].split(/[?#]/)[0])),`${code}/${name}: ${m[1]}`);}
  if(['index','knowledge','treatment-journey'].includes(name))assert(!/<input|<select|<textarea/.test(h));
  if(['index','knowledge'].includes(name))assert(h.includes('wikiCycleChronology'));
 }
 for(const name of ['guide','passport','consent-form','sactcard','logistics','supportive-care','treatment-journey',...phases.map(p=>'support-'+p.id)])assert.deepEqual(fs.readFileSync(path.join(root,`patient/${code}/${name}.pdf`)),fs.readFileSync(path.join(root,`docs/patient/${code}/${name}.pdf`)));
 for(const [asset,file] of [['knowledge','knowledge.html'],['longitudinal','treatment-journey.html'],['consent-draft','consent-form.html'],['supportive-care-selector','supportive-care.html']])assert.equal(R.relativePath(code,asset),`patient/${code}/${file}`);
 const profile=KB.regimen_profiles.find(p=>p.protocol_id===d.protocol_id),e=profile.evidence_at_a_glance;assert(profile.treatment_rationale.line);assert(profile.evidence_audit.remaining_uncertainties.length);assert(!JSON.stringify(profile).includes('monarchE'));assert.deepEqual(profile.administration.practical_workflow,d.logistics.steps.map(x=>x.text));assert(e.checked&&e.sources.length);const html=V.render(profile);assert(html.includes('Why this regimen?'));assert(!/undefined|NaN/.test(html));
 if(code==='00785'){assert.equal(phases.length,1);assert.equal(phases[0].medicines.length,0);assert(!read(`patient/${code}/consent-form.html`).includes('Bone-marrow suppression / infection risk'));assert(/maintenance/i.test(e.applicability));}
 if(['00789','00790'].includes(code)){
  const heart=j.lanes.find(l=>l.kind==='heart'),blood=j.lanes.find(l=>l.kind==='blood');
  assert(/Neoadjuvant/.test(j.stages[1]));assert(/cycle 5/.test(heart.cells[1]));assert(!/cycle 5/.test(heart.cells[2]));
  assert(/selected postoperative medicine/.test(blood.cells[3]));assert(!/Day 8/.test(blood.cells[3]));
  assert(/Postoperative/.test(d.monitoring_schedule.columns[4]));
  assert(/not automatically tied/.test(d.monitoring_schedule.rows.find(r=>r.label==='Scans / cancer markers').cells[2]));
  const post=phases.find(p=>p.id==='continuation');assert(/Confirm/.test(post.emetogenic_risk));assert.equal(post.source_page,1);assert(/antibody-drug conjugate/.test(post.additional_support.join(' ')));
  assert(!/00785/.test(d.chapters.find(ch=>ch.id==='treatment-aim').items.find(it=>it.title==='After this phase').text));
 }
 if(code==='00790'){assert(/nine|9 cycles/.test(JSON.stringify(e)));assert(/six|6 cycles/.test(JSON.stringify(e)));}
 const listeners={},select={value:'',addEventListener:(ev,fn)=>listeners[ev]=fn},sections=phases.map(p=>({hidden:true,dataset:{supportPhase:p.id}})),prompt={hidden:false};
 vm.runInNewContext(read('assets/patient/phase-support-v0838.js'),{document:{getElementById:id=>id==='support-phase'?select:id==='phase-prompt'?prompt:null,querySelectorAll:()=>sections},window:{location:{search:''}},URLSearchParams});
 for(const p of phases){select.value=p.id;listeners.change();assert.equal(sections.filter(x=>!x.hidden).length,1);assert.equal(sections.find(x=>!x.hidden).dataset.supportPhase,p.id);}select.value='';listeners.change();assert(sections.every(x=>x.hidden));
}
const workflow=read('js/regimen-workflow-engine-v0750.js'),block=workflow.match(/<details class="workflow-patient-disclosure">([\s\S]*?)<\/details>/);assert(block);assert(block[1].includes('<summary>'));assert(block[1].includes('Patient platform'));assert.equal((block[1].match(/class="btn secondary workflow-module-action/g)||[]).length,5);assert(read('css/regimen-workflow-v0720.css').includes('.workflow-patient-disclosure:not([open])'));
const updates=json('validation/phesgo-retro-v08415/retrospective-hashes.json');for(const [p,c] of Object.entries(updates.files))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex'),c.after);
const inv=json('validation/phesgo-retro-v08415/retrospective-inventory.json');assert.equal(inv.authored_suites,79);assert.equal(inv.reviewed_cumulative,16);assert.equal(inv.remaining_review_queue,63);
(async()=>{
 const target={innerHTML:''},cl={add(){},remove(){},toggle(){}},overlay={classList:cl,querySelector:s=>s==='[data-regimen-info-content]'?target:null};const context={console,fetch:async u=>({ok:fs.existsSync(path.join(root,u)),json:async()=>json(u)}),document:{readyState:'loading',addEventListener(){},getElementById:()=>overlay,body:{classList:cl}}};vm.createContext(context);vm.runInContext(read('js/treatment-evidence-v08413.js'),context);vm.runInContext(read('js/regimen-knowledge-base.js'),context);const api=context.SACTCheckRegimenKnowledgeBase;await api.load();
 for(const code of codes){const f=fs.readdirSync(path.join(root,'protocols/breast')).find(x=>x.startsWith(code+'-')),p=json('protocols/breast/'+f);assert(api.open(p));await new Promise(r=>setImmediate(r));assert(target.innerHTML.includes('Why this regimen?'));assert(target.innerHTML.includes('Longitudinal monitoring schedule'));assert(!/undefined|\[object Object\]|could not be loaded/.test(target.innerHTML));assert.equal(api.regimenProfileForProtocol(p).full_suite_release,'0.84.15');}
 console.log('Five Phesgo retrospective suites: links, patient boundary, evidence applicability, actual KB loader, phase selectors, dropdown and retrospective preservation passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
