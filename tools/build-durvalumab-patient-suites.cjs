'use strict';
/* Rebuild a dedicated combination suite from its reviewed native patient profile. */
const fs = require('node:fs');
const path = require('node:path');
const {render} = require('./patient-pack-v08461.cjs');
const {buildOverview} = require('./patient-overview-v08445.cjs');
const projectRoot = path.resolve(__dirname, '..');
const gynaeBatch = new Set(['00303','00306','00308','00624','00819','00620','00716','00769','00771','00772','00817','00811','00799','00766','00499','00312','00375','00676','00300','00246','00247','00248','00249','00264','00266','00267','00301','00904']);
const gynaecology = new Set(['00862', '00929', ...gynaeBatch]);
const illustratedSuites = new Set([...gynaecology, '00344']);
const codes = new Set([...illustratedSuites, '00897', '00926', '00953']);
const esc = value => String(value ?? '').replace(/[<>&"']/g, s => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[s]));
const link = (href,text) => '<a href="'+esc(href)+'">'+esc(text)+'</a>';
const section = (id,title,body) => '<section id="'+id+'"><h2>'+esc(title)+'</h2>'+body+'</section>';
const paragraphs = items => items.map(i => '<article class="unit"><h3>'+esc(i.title)+'</h3><p>'+esc(i.text)+'</p></article>').join('');
const list = lines => '<ul>'+lines.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ul>';
const questionList = entries => '<ul>'+entries.map(v=>typeof v==='string'?'<li>'+esc(v)+'</li>':'<li><b>'+esc(v.q)+'</b> '+esc(v.a)+'</li>').join('')+'</ul>';
const table = (head,rows) => '<table><thead><tr>'+head.map(x=>'<th scope="col">'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
const sheet = html => '<div class="sheet">'+html+'</div>';
const writing = n => '<div class="recordline"></div>'.repeat(n);
function document(d,title,body,download) {
 const nav=link('./','My treatment')+link('knowledge.html','Full treatment reference')+(download?link(download,'Download PDF'):'');
 return '<!doctype html><html lang="en-IE"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(title)+' · '+esc(d.title)+' · SACTCheck</title><link rel="stylesheet" href="../../assets/patient/durvalumab-documents.css"></head><body><nav>'+nav+'</nav><main><header><p class="identity">SACTCheck · NCCP '+esc(d.code)+' v'+esc(d.protocol_version)+' · '+esc(d.context_label)+'</p><h1>'+esc(title)+'</h1><p>'+esc(d.title)+'</p></header>'+body+'<footer>Source checked '+esc(d.source_checked)+'. Feasibility build. Oncology, pharmacy and patient review pending. The treating team confirms your plan.</footer></main></body></html>\n';
}
function localisePack(html,d) {
 const warning=d.patient_summary.wallet_warning;
 if (!warning) throw Error('Missing retained-wallet warning '+d.code);
 return html.replaceAll('087 12345678','________________').replaceAll('087 87654321','________________')
  .replaceAll(' (EXAMPLE)','').replaceAll('EXAMPLE NUMBERS ONLY — your team must replace these before patient use.','Ask your oncology team to fill in and check both numbers before use.')
  .replaceAll('EXAMPLE ONLY — team must replace both numbers before patient use.','Ask your oncology team to fill in both numbers before use.')
  .replaceAll('EXAMPLE NUMBERS — replace before patient use.','Keep your hospital immunotherapy alert card too.')
  .replaceAll('Unwell or fever? Call oncology now.',esc(warning))
  .replaceAll(/SACTCheck v0\.84\.\d+/g,'SACTCheck').replaceAll(/Document revised [\dA-Za-z ]+20\d\d/g,'Source checked '+esc(d.source_checked))
  .replaceAll('Follow the standard schedule','Follow the prescribed schedule')
  .replace('</head>','<style>@media print{.pt-card-phones{margin:.3mm 0!important}.pt-wallet-front .pt-card-urgent{padding:.45mm!important}.pt-card-regimen,.pt-card-schedule{margin:.3mm 0!important}}</style></head>');
}
function scheduleSection(profile) {
 return section('cycle',['00862','00904'].includes(profile.code)?'Your tablet schedule':'Your infusion schedule',paragraphs(profile.phases.map(phase => ({title:phase.label,text:phase.detail}))));
}
function renderPages(code, root = projectRoot) {
 if (!codes.has(code)) throw Error('Unknown dedicated suite: '+code);
 const data=JSON.parse(fs.readFileSync(path.join(root,'data/patient-knowledge',code+'.json'),'utf8'));
 const d=data; const s=d.patient_summary;
 const pack=render({...d,patient_summary:{...s,template_version:'0.84.31'}});
 const files={};files['guide.html']=localisePack(pack.print,d);files['sactcard.html']=localisePack(pack.card,d);
 const purpose='<p>'+esc(d.purpose)+'</p>';
 const meds=paragraphs(d.agents.map(a=>({title:a.name+' · '+a.brand,text:a.type+'. '+a.explanation+' '+a.watch})));
 const tests=d.monitoring_schedule;
 const testRows=tests.rows.map(r=>[r.label,...r.cells]);
 const testHead=['Check',...tests.columns];
 const monitoring=table(testHead,testRows)+'<p>'+esc(tests.note)+'</p>';
 const action='<div class="warn"><b>Contact your oncology service urgently.</b> '+esc(d.urgent_extra)+' If you have severe breathing difficulty, severe chest pain, collapse or a seizure, call 112 or 999. Follow the 24-hour contact instructions from your treating hospital.</div>';
 const evidence='<p>'+esc(d.evidence.interpretation)+'</p><p>'+esc(d.evidence.limitations)+'</p>';
 const sources='<ol>'+d.sources.map(a=>'<li class="source">'+link(a.url,a.title)+'</li>').join('')+'</ol>';
 const medicinesSection=section('medicines','Your treatment and how the medicines work',purpose+meds);
 const planSection=scheduleSection(d);
 const testsSection=section('monitoring-schedule','Your tests and checks',monitoring);
 const common=section('common-effects','Common effects and what to do',paragraphs(d.common_effects));
 const serious=section('serious-effects','Serious effects: when to call',paragraphs(d.serious_effects)+action);
 const support=section('support','Practical support',paragraphs(d.support));
 const logistics=section('treatment-logistics','Planning your visits',paragraphs(d.logistics.sections));
 const evidenceSection=section('evidence','What the research found',evidence);
 const refs=section('sources','Sources and further help',sources);
 const wiki=medicinesSection+planSection+testsSection+common+serious+support+logistics+evidenceSection+refs;
 files['knowledge.html']=document(d,'Your complete treatment reference',wiki,'knowledge.pdf');
 files['knowledge-print.html']=document(d,'Your treatment reference',wiki,'knowledge.pdf');
 files['treatment-journey.html']=document(d,'Your treatment journey',purpose+planSection+testsSection+section('review','At review visits',questionList(d.questions)),'treatment-journey.pdf');
 files['logistics.html']=document(d,'Preparing for treatment visits',logistics+section('appointments','Write down your next appointments',list(s.preparation)+writing(3))+action,'logistics.pdf');
 files['supportive-care.html']=files['supportive-care-overview.html']=document(d,'Your supportive care plan',support+action+section('team','Your team completes this section','<p>Prescribed medicines, when to use them and when to phone</p>'+writing(3)),'supportive-care.pdf');
 if(d.phase_support){
  const refs=[];
  for(const p of d.phases){
   const items=d.phase_support[p.id];
   if(!items?.length) throw Error('Missing phase support for '+code+' '+p.id);
   const stem='support-'+p.id;
   files[stem+'.html']=document(d,'Support during '+p.short.toLowerCase(),'<p>'+esc(p.detail)+'</p>'+paragraphs(items)+action,stem+'.pdf');
   refs.push('<p>'+link(stem+'.html',p.short+' support')+' · '+link(stem+'.pdf','Download this phase')+'</p>');
  }
  for(const name of ['supportive-care.html','supportive-care-overview.html'])files[name]=files[name].replace('</main>','<div class="no-print">'+section('phase-support','Choose the current phase',refs.join(''))+'</div>'+'</main>');
 }
 if (gynaeBatch.has(code)) {
  const phaseSheets=JSON.parse(fs.readFileSync(path.join(root,'data/phase-support-v0838.json'),'utf8')).regimens[code];
  for (const phase of phaseSheets) {
   const rows=phase.medicines.map(m=>[m.name,m.dose,m.timing,m.note||'']);
   const emptyPlan = code === '00904' ? 'Your team will write which anti-sickness medicine to take, how much and when.' : 'No routine preventive anti-sickness medicine is specified. Follow the individually prescribed plan.';
   const pills=rows.length?table(['Medicine','Dose in reference plan','When','Additional instructions'],rows):'<p>'+emptyPlan+'</p>';
   let timingNote='Ask your team to confirm your signed prescription. The day numbers on a support prescription are counted from this visit.';
   if (['00267','00301'].includes(code)) timingNote='Use the dated anti-sickness plan for the whole treatment block. On a return visit, continue from the actual cycle day and confirm which medicines you have already taken.';
   if (code==='00904') timingNote='Use the anti-sickness medicine and timing on your personal prescription. Tell your team if nausea is affecting eating, drinking or taking the tablets.';
   if (code==='00300' && phase.id!=='bleomycin') timingNote='Use one signed anti-sickness plan from day 1 of the five-day block. Keep the same day numbers on return visits.';
   if (code==='00248' && ['ema','ema2'].includes(phase.id)) timingNote='The EMA anti-sickness prescription counts from day 1. Continue the same course when you return on day 2.';
   const entry=section('written-plan-'+phase.id,'Support medicines for this visit','<p>'+timingNote+'</p>'+pills+list(phase.additional_support));
   const key='support-'+phase.id+'.html';
   files[key]=files[key].replace('</main>',entry+'</main>');
  }
 }
 const timing=table(['Phase','When','What changes'],d.phases.map(p=>[p.short,p.cycles.join(' · '),p.detail]));
 const consentA=sheet(purpose+section('purpose','Treatment discussion','<p>'+esc(d.indication_text)+'</p>'+timing)+section('benefit','Possible benefit, alternatives and your priorities',evidence+'<p>'+esc(d.consent_support)+'</p><p>Other options discussed and what matters most to me</p>'+writing(2)));
 const consentB=sheet(section('risks','Important risks we discussed',list(d.serious_effects.map(e=>e.title+' — '+e.text)))+section('understanding','Understanding and next steps','<p>'+esc(d.teachback)+'</p><p>Questions, individual risks and decisions recorded by the clinician</p>'+writing(2)+'<p>Patient / representative __________________  Clinician __________________  Date __________</p><p>This discussion aid accompanies your hospital’s formal consent process.</p>'));
 files['consent-form.html']=files['consent.html']=document(d,'Consent discussion aid',consentA+consentB,'consent-form.pdf');
 const passport=sheet(section('personal','My treatment record',purpose+timing+'<p>Oncology day unit __________________  Out of hours __________________</p><p>Hospital __________________  Who to call if I cannot reach the team __________________</p>')+action)+sheet(section('appointments','Appointments, tests and results',testsSection+table(['Date','Visit or test','What my team told me'],Array.from({length:5},()=>['__________','__________________','________________________']))))+sheet(section('cycles','My cycle record','<p>Ask the team to identify the phase and record delays or changes. A stamp records a visit or completed cycle; your team decides whether the next treatment goes ahead.</p>'+table(['Cycle / phase','Date','Medicines given or held','Next review'],Array.from({length:10},()=>['_______','_______','_________________','__________']))))+sheet(section('symptoms','My symptom record','<p>Call for urgent symptoms now. This record can help explain when a change began.</p>'+table(['Date','Symptom / change','Action taken / team advice'],Array.from({length:9},()=>['_______','______________','______________________']))))+sheet(section('questions','My questions and next steps',questionList(d.questions)+writing(6)+action));
 files['passport.html']=document(d,'My treatment passport',passport,'passport.pdf');
 const handbook=sheet(medicinesSection+evidenceSection)+sheet(planSection+testsSection)+sheet(common+serious)+sheet(support+logistics)+sheet(section('conversation','Preparing for your oncology discussion',questionList(d.questions)+'<p>'+esc(d.teachback)+'</p>')+refs);
 files['handbook-print.html']=document(d,'My treatment handbook',handbook,'handbook.pdf');
 files['index.html']=buildOverview(localisePack(pack.portal,d),{root,route:code,profile:d,guideHtml:files['guide.html'],cardHtml:files['sactcard.html'],knowledgeHtml:files['knowledge.html']});
 const pictureEntry = require('./durvalumab-symptom-entry.cjs').entry;
 if (!illustratedSuites.has(code)) for (const name of ['index.html','knowledge.html']) files[name]=pictureEntry(code,name,files[name]);
 if (illustratedSuites.has(code)) {
  const map = require('../js/patient-anatomy-v08431.js').render(d);
  files['knowledge.html'] = files['knowledge.html'].replace('</head>','<link rel="stylesheet" href="../../assets/patient/hcc-bodymap-v08431.css"></head>').replace('<section id="common-effects">', map+'<section id="common-effects">');
  const agentRisks = section('risks-by-medicine','Risks to discuss for each medicine',paragraphs(d.agents.map(a => ({title:a.name,text:a.risks.join(', ')+'. '+a.watch}))));
  const consentWithAgents = files['consent-form.html'].replace('<section id="understanding">',agentRisks+'<section id="understanding">');
  files['consent-form.html'] = files['consent.html'] = consentWithAgents;
  const phaseSheets = d.phases.map(p => sheet(section('support-'+p.id, p.short+' · supportive care', paragraphs(d.phase_support[p.id])+(gynaeBatch.has(code)?(files['support-'+p.id+'.html'].match(/<section id="written-plan-[\s\S]*?<\/section>/)||[''])[0]:'')))).join('');
  files['handbook-print.html'] = files['handbook-print.html'].replace('</main>', phaseSheets+'</main>');
  for (const name of Object.keys(files)) {
   files[name]=files[name].replace(/<a href="([^"]+\.pdf)"(?! download)/g,'<a download href="$1"');
   if(gynaeBatch.has(code) && !['00819','00811','00817'].includes(code)) files[name]=files[name].replaceAll('Keep your hospital immunotherapy alert card too.','Carry your current treatment card.');
   if(code === '00904') files[name]=files[name]
     .replaceAll('My cycle record', 'My review record')
     .replaceAll('<th>Cycle</th>', '<th>Review</th>')
     .replaceAll('Cycle plan: team to confirm', 'Next review: __________')
     .replaceAll('Latest treatment date:', 'Latest review date:')
     .replaceAll('A cycle is complete after its final planned dose; a weekly-treatment stamp records that weekly dose.', 'Use this record for clinic or pharmacy reviews of your daily tablets.')
     .replaceAll('A stamp records a visit or completed cycle; your team decides whether the next treatment goes ahead.', 'Record the current tablet dose, any pause, and your next review date.')
     .replaceAll('Cycle / phase', 'Review / tablet dose')
     .replaceAll('Medicines given or held', 'Dose or pause agreed');
   if(code==='00862') files[name]=files[name].replaceAll('Keep your hospital immunotherapy alert card too.','Carry this card and your latest prescription.').replaceAll('My cycle record','My review record');
  }
 }
 if (d.pump_care) {
  const pump = section('pump-care','Using your 24-hour pump',paragraphs(d.pump_care));
  files['port-pump.html'] = document(d,'My line and pump',pump+action,'port-pump.pdf').replace('href="port-pump.pdf"','download href="port-pump.pdf"');
  files['handbook-print.html'] = files['handbook-print.html'].replace('</main>',sheet(pump)+'</main>');
  if (!files['index.html'].includes('href="port-pump.html"')) files['index.html'] = files['index.html'].replace('</main>','<p><a href="port-pump.html">Using your 24-hour pump</a> · <a download href="port-pump.pdf">Pump instructions PDF</a></p></main>');
  for (const name of Object.keys(files)) files[name]=files[name].replaceAll('Keep your hospital immunotherapy alert card too.','Carry your current treatment card.');
 }
 const clinical=require('./gynae-clinical-documents-v08466.cjs');
 if(clinical.codes.has(code)){
  const phases=JSON.parse(fs.readFileSync(path.join(root,'data/phase-support-v0838.json'),'utf8')).regimens[code];
  Object.assign(files,clinical.build(d,phases));
  for(const key of ['supportive-care.html','supportive-care-overview.html']){
    files[key]=files[key].replace('</main>','<div class="no-print"><h2>Antiemetic prescription PDFs</h2>'+phases.map(p=>'<p><a download href="antiemetic-'+esc(p.id)+'.pdf">'+esc(p.label)+' · Download prescription PDF</a></p>').join('')+'</div></main>');
  }
 }
 return {data:d,files};
}
// Shared publication uses the native source for every document this suite owns.
function renderFile(file, root = projectRoot) {
 const relative = path.relative(root, path.resolve(root,file)).split(path.sep).join('/');
 const match = /^patient\/(\d{5})\/([^/]+\.html)$/.exec(relative);
 if (!match || !codes.has(match[1])) return null;
 return renderPages(match[1],root).files[match[2]] ?? null;
}
function build(code, {names, check = false} = {}) {
 const root=projectRoot;
 const {data:d,files}=renderPages(code,root);
 const dir=path.join(root,'patient',code);
 if (!check) fs.mkdirSync(dir,{recursive:true});
 function output(file, html) {
  if (check) require('node:assert/strict').ok(fs.readFileSync(file, 'utf8') === html, 'Stale generated '+path.relative(root,file));
  else fs.writeFileSync(file, html);
 }
 for (const name of names || Object.keys(files))
  output(path.join(dir,name), files[name]);
 if (names) return;
 const docs=path.join(root,'docs/patient',code);if(!check)fs.mkdirSync(docs,{recursive:true});
 for(const [name,url] of [['index',''],['guide','guide.pdf']]){
  const target='/patient/'+code+'/'+url;
  output(path.join(docs,name+'.html'),'<!doctype html><html lang="en"><meta charset="utf-8"><meta http-equiv="refresh" content="0;url='+target+'"><link rel="canonical" href="https://sactcheck.com'+target+'"><title>'+esc(d.title)+'</title><a href="'+target+'">Open '+esc(d.title)+'</a></html>\n');
 }
}
if(require.main===module){const selected=process.argv.slice(2);for(const code of selected.length?selected:['00897', '00926', '00953'])build(code);}
module.exports={build,codes,renderFile,scheduleSection};
