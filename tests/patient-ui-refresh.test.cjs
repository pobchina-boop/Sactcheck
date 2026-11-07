'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),test=require('node:test');
const Chronology=require('../tools/cycle-chronology.cjs');
const {refreshKnowledge,refreshSupport,planRefresh,applyRefresh,SUPPORT_HINT,SUPPORT_WRAPPER}=require('../tools/refresh-patient-ui.cjs');
const profile={code:'00555',cycle_days:14,schedule_summary:'Every 14 days; review before treatment.',timeline:[{id:'pump',label:'Fluorouracil pump',start:1,end:3,style:'treatment',text:'48 hours; disconnect as arranged'}],sources:[],chronology_notes:[{title:'Variation',text:'Timing varies for each person.'}],timeline_note:'Broad possible timing.',safety_note:'There are no guaranteed safe days. Call the team when unwell.'};
const oldChart='<div id="wikiCycleChronology" class="wiki-cycle-map"><h3>Existing chart</h3><div><div>46-hour pump</div></div><!-- </div> --></div>';
const table='<table class="prescription"><thead><tr><th>Medicine</th><th>Dose / route</th><th>When</th></tr></thead><tbody><tr><td>Ondansetron &amp; other medicines</td><td>8 mg orally</td><td>On treatment day<small>Review QT, constipation and hepatic dosing; no automatic repeat.</small></td></tr></tbody></table>';
const support=`<!doctype html><html><head><meta charset="utf-8"><title>Full prescription</title><style>body{color:#193a4c}</style></head><body class="suite-v08425"><main><h1>Supportive care</h1>${table}<p>Prescriber / date: __________________</p></main></body></html>\n`;

test('refreshes only a balanced static chronology and keeps the authored pump duration',()=>{
 const prefix='<!doctype html><html><head><script>const example="<div id=\"wikiCycleChronology\">";</script></head><body><section id="cycle">\n',suffix='\n</section><section><svg><title>Detailed anatomical illustration</title></svg><p>All clinical detail stays here.</p></section></body></html>\n';
 const result=refreshKnowledge(prefix+oldChart+suffix,profile);
 assert.equal(result.html,prefix+Chronology.render(profile)+suffix);
 assert.ok(result.html.includes('48 hours; disconnect as arranged'));
 assert.ok(!result.html.includes('46-hour pump'));
 assert.equal(refreshKnowledge(result.html,profile).html,result.html);
});

test('refreshes the whole existing phase wrapper, including every authored phase',()=>{
 const phased={...profile,phase_cycles:[{label:'Induction',cycle_days:14},{label:'Continuation',cycle_days:7}]};
 const original='<section>Before</section><div class="phase-cycle-maps"><section><h2>Induction</h2>'+oldChart+'</section><section><div id="wikiCycleChronology-phase-2">Old second phase</div></section></div><p>After</p>';
 assert.equal(refreshKnowledge(original,phased).html,'<section>Before</section>'+Chronology.render(phased)+'<p>After</p>');
 assert.throws(()=>refreshKnowledge(original,{...profile,phase_cycles:{induction:{cycle_days:14}}}),/authored phase array/);
});

test('preserves recognized interactive cycles and rejects unknown or malformed roots',()=>{
 const interactive='<section id="cycle"><select id="pk-phase"></select><input id="pk-start"><div class="pk-chart"><button>1</button></div></section>';
 assert.deepEqual(refreshKnowledge(interactive,profile),{html:interactive,status:'preserved-interactive'});
 assert.throws(()=>refreshKnowledge('<section id="cycle">Unexpected content</section>',profile),/Expected one/);
 assert.throws(()=>refreshKnowledge(oldChart+oldChart,profile),/Unexpected chronology roots/);
 assert.throws(()=>refreshKnowledge('<div id="wikiCycleChronology" class="wiki-cycle-map"><div>Unclosed</div>',profile),/Unclosed div/);
 const continuous='<div id="wikiCycleChronology" class="wiki-cycle-map endocrine-timeline" data-schedule-kind="continuous_oral"><h3>Daily tablets, reviews and treatment decisions</h3><div>Complete existing timeline</div></div>';
 assert.deepEqual(refreshKnowledge(continuous,{...profile,schedule_kind:'continuous_oral',cycle_days:null,timeline:[]}),{html:continuous,status:'preserved-continuous-oral'});
 const specialized=continuous.replace('continuous_oral','loading_then_q28');
 assert.deepEqual(refreshKnowledge(specialized,{...profile,schedule_kind:'loading_then_q28',endocrine_timeline:{columns:['Starting','Review'],rows:[{label:'Treatment'}]}}),{html:specialized,status:'preserved-specialized'});
 assert.throws(()=>refreshKnowledge(specialized,{...profile,schedule_kind:'loading_then_q28'}),/specialized timeline schema/);
 assert.throws(()=>refreshKnowledge(oldChart,{...profile,cycle_days:null,timeline:[]}),/positive cycle length/);
});

test('adds static, keyboard accessible support tables without changing any table bytes',()=>{
 const result=refreshSupport(support,'patient/00555/supportive-care.html');
 assert.equal(result.tables,1);
 assert.ok(result.html.includes('<link rel="stylesheet" href="../../assets/patient/clinical-screen.css"></head>'));
 assert.ok(result.html.includes('<body class="suite-v08425 clinical-support-page">'));
 assert.ok(result.html.includes(SUPPORT_HINT+SUPPORT_WRAPPER+table+'</div>'));
 assert.equal(result.html.match(/<table\b[\s\S]*?<\/table>/g)[0],table);
 assert.equal(refreshSupport(result.html,'patient/00555/supportive-care.html').html,result.html);
 const nested=refreshSupport(support,'patient/00388/schedule_7d/support-treatment.html');
 assert.ok(nested.html.includes('href="../../../assets/patient/clinical-screen.css"'));
 const noTables=refreshSupport(support.replace(table,''),'patient/00555/support-treatment.html');
 assert.equal(noTables.tables,0);assert.ok(!noTables.html.includes('support-table-scroll'));
});

test('support refresh fails on unexpected structures instead of silently dropping content',()=>{
 assert.throws(()=>refreshSupport(support.replace('</table>',''),'patient/00555/supportive-care.html'),/Unclosed table/);
 assert.throws(()=>refreshSupport(support.replace(table,'<table><tr><td>'+table+'</td></tr></table>'),'patient/00555/supportive-care.html'),/Nested support tables/);
 assert.throws(()=>refreshSupport(support.replace('<body class="suite-v08425">',''),'patient/00555/supportive-care.html'),/one head and body/);
 const invalid=refreshSupport(support,'patient/00555/supportive-care.html').html.replace('tabindex="0"','tabindex="-1"');
 assert.throws(()=>refreshSupport(invalid,'patient/00555/supportive-care.html'),/region attributes/);
});

test('standalone support plans retain every authored main-content byte and gain the shared script',()=>{
 const noRoutine='<p>No routine prophylactic antiemetic, steroid premedication or G-CSF is populated.</p><h2>Individual symptom support</h2><ul><li>Review the existing medicine and monitoring plan.</li></ul><p>Prescriber / date: __________________</p>';
 const original=support.replace(table,noRoutine);
 const result=refreshSupport(original,'patient/00253/supportive-care.html');
 assert.equal(result.scriptView,'single-plan');
 assert.ok(result.html.includes('<main data-support-single-phase="true">'));
 assert.equal(result.html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1],original.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1]);
 assert.ok(result.html.includes(`src="../../assets/patient/phase-support-v0838.js?v=${require('../package.json').version}"`));
 assert.equal((result.html.match(/phase-support-v0838\.js/g)||[]).length,1);
 assert.equal(refreshSupport(result.html,'patient/00253/supportive-care.html').html,result.html);
 const nested=refreshSupport(original,'patient/00253/example/supportive-care.html');
 assert.ok(nested.html.includes(`src="../../../assets/patient/phase-support-v0838.js?v=${require('../package.json').version}"`));
});

test('phase selectors keep their complete authored sections while only the shared script cache key changes',()=>{
 const selector=support.replace(table,'<select id="support-phase"><option value="">Choose</option><option value="one">One</option></select><p id="phase-prompt">Choose the phase</p><section data-support-phase="one" hidden>'+table+'</section>')
  .replace('</body>','<script src="../../assets/patient/phase-support-v0838.js?v=older"></script><script src="unrelated.js"></script></body>');
 const result=refreshSupport(selector,'patient/00555/supportive-care.html');
 assert.equal(result.scriptView,'phase-selector');
 assert.ok(!result.html.includes('data-support-single-phase'));
 assert.ok(result.html.includes('<section data-support-phase="one" hidden>'));
 assert.equal(result.html.match(/<table\b[\s\S]*?<\/table>/)[0],table);
 assert.ok(result.html.includes('<script src="unrelated.js"></script>'));
 assert.equal((result.html.match(/phase-support-v0838\.js/g)||[]).length,1);
 assert.equal(refreshSupport(result.html,'patient/00555/supportive-care.html').html,result.html);
 assert.throws(()=>refreshSupport(selector.replace('</body>','<script src="../../assets/patient/phase-support-v0838.js"></script></body>'),'patient/00555/supportive-care.html'),/Duplicate shared support scripts/);
 assert.throws(()=>refreshSupport(selector.replace('../../assets/patient/phase-support-v0838.js','elsewhere/phase-support-v0838.js'),'patient/00555/supportive-care.html'),/Unexpected shared support script route/);
 assert.throws(()=>refreshSupport(support.replace('<h1>Supportive care</h1>','<header><h1>Supportive care</h1></header>'),'patient/00555/supportive-care.html'),/direct main child/);
});

function fixture(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'sactcheck-patient-ui-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const write=(file,content)=>{fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),content);};
 write('assets/patient/clinical-screen.css','.support-table-scroll{overflow-x:auto}');
 write('data/patient-presentation-v08431.json',JSON.stringify({routes:{'00555':'data/patient-knowledge/00555.json','00388/schedule_7d':'data/patient-knowledge-contexts/00388/schedule_7d.json'}}));
 write('data/patient-knowledge/00555.json',JSON.stringify(profile));write('data/patient-knowledge-contexts/00388/schedule_7d.json',JSON.stringify({...profile,code:'00388'}));
 write('patient/00555/knowledge.html','<h1>Before</h1>'+oldChart+'<p>After</p>');
 write('patient/00388/schedule_7d/knowledge.html','<div class="pk-chart"></div><select id="pk-phase"></select><input id="pk-start">');
 write('patient/00555/supportive-care.html',support);
 write('docs/patient/00555/supportive-care.html',support);
 write('docs/patient/00555/knowledge.html','<!doctype html><meta http-equiv="refresh" content="0;url=/patient/00555/knowledge.html">');
 return {root,write};
}

test('plans without writing, copies matching HTML mirrors, preserves redirects and is idempotent',t=>{
 const {root}=fixture(t),plan=planRefresh(root),read=file=>fs.readFileSync(path.join(root,file),'utf8');
 assert.equal(read('patient/00555/supportive-care.html'),support);
 assert.deepEqual(plan.report.knowledge,{mapped:2,discovered:0,static:1,additionalProfiles:[],preservedInteractive:['patient/00388/schedule_7d/knowledge.html'],preservedContinuousOral:[],preservedSpecialized:[],preservedUnrelatedDrift:[]});
 assert.deepEqual(plan.report.support,{pages:1,tables:1});
 assert.equal(plan.report.mirrors.updated,1);assert.deepEqual(plan.report.mirrors.preserved,['docs/patient/00555/knowledge.html']);
 const redirect=read('docs/patient/00555/knowledge.html');applyRefresh(root,plan);
 assert.equal(read('docs/patient/00555/supportive-care.html'),read('patient/00555/supportive-care.html'));
 assert.equal(read('docs/patient/00555/knowledge.html'),redirect);
 assert.equal(read('assets/patient/cycle-chronology-v0831.css'),Chronology.stylesheet);
 assert.equal(planRefresh(root).changes.length,0);
});

test('validates the complete plan before writing, including concurrent changes',t=>{
 const {root,write}=fixture(t),plan=planRefresh(root);
 write('patient/00555/supportive-care.html',support+'<!-- concurrent edit -->');
 assert.throws(()=>applyRefresh(root,plan),/Input changed since planning/);
 assert.ok(fs.readFileSync(path.join(root,'patient/00555/knowledge.html'),'utf8').includes('46-hour pump'));
});

test('discovers existing portal and knowledge chronology roots outside the presentation mapping',t=>{
 const {root,write}=fixture(t),extra={...profile,code:'00328',timeline:[{...profile.timeline[0],text:'About 46 hours'}]};
 write('data/patient-knowledge/00328.json',JSON.stringify(extra));
 const oldPump=Chronology.render(extra).replace('>About 46 hours</span>','>Previous timing label</span>');
 const original='<h1>Retained full reference portal</h1>'+oldPump+'<svg><title>Original anatomical details</title></svg>';
 write('patient/00328/index.html',original);write('patient/00328/knowledge.html',original);
 const plan=planRefresh(root);assert.equal(plan.report.knowledge.discovered,2);
 assert.deepEqual(plan.report.knowledge.additionalProfiles,['data/patient-knowledge/00328.json']);
 for(const file of ['patient/00328/index.html','patient/00328/knowledge.html'])assert.equal(plan.changes.find(c=>c.file===file).after,'<h1>Retained full reference portal</h1>'+Chronology.render(extra)+'<svg><title>Original anatomical details</title></svg>');
 applyRefresh(root,plan);assert.equal(planRefresh(root).changes.length,0);
});

test('unknown discovered static roots and mismatched explicit profiles fail before any writes',t=>{
 const {root,write}=fixture(t);write('patient/00328/knowledge.html',oldChart);
 assert.throws(()=>planRefresh(root),/no matching explicit patient profile/);
 write('data/patient-knowledge/00328.json',JSON.stringify(profile));
 assert.throws(()=>planRefresh(root),/profile code does not match/);
 write('data/patient-knowledge/00328.json',JSON.stringify({...profile,code:'00328'}));
 write('patient/00328/knowledge.html',oldChart.replace('wiki-cycle-map','wiki-cycle-map unexpected-subtype'));
 assert.throws(()=>planRefresh(root),/Unrecognized static chronology variant/);
 assert.equal(fs.readFileSync(path.join(root,'patient/00555/supportive-care.html'),'utf8'),support);
});

test('discovery preserves unrelated nonpump drift and rejects extra pump differences',t=>{
 const {root,write}=fixture(t),nonpump={...profile,code:'00328',timeline:[{...profile.timeline[0],id:'infusion',text:'Day 1'}]};
 write('data/patient-knowledge/00328.json',JSON.stringify(nonpump));write('patient/00328/knowledge.html',oldChart);
 const plan=planRefresh(root);assert.deepEqual(plan.report.knowledge.preservedUnrelatedDrift,['patient/00328/knowledge.html']);
 assert.ok(!plan.changes.some(change=>change.file==='patient/00328/knowledge.html'));
 write('data/patient-knowledge/00328.json',JSON.stringify({...profile,code:'00328'}));
 assert.throws(()=>planRefresh(root),/differs beyond its authored timing label/);
});
