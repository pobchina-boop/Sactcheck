'use strict';

/**
 * Shared SACTCheck patient document presentation.
 * Pure HTML/SVG renderer; no DOM, packages, clinical defaults or scheduling rules.
 * Every clinical label, time and duration must be supplied from an authored,
 * reviewed presentation record. This module never infers a dose or an appointment.
 */
function text(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function required(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(label + ' must be authored text');
  return value;
}
function icon(name) {
  const paths = {
    calendar:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4m8-4v4M4 10h16M8 14h3m2 0h3m-8 3h3"/>',
    infusion:'<path d="M12 3v3m-4 0h8v10a4 4 0 0 1-8 0V6Zm4 14v2M8 10h8m-4 3v3"/>',
    check:'<path d="M4 12.5 9 18 20 6"/>',
    book:'<path d="M3 4h6a4 4 0 0 1 3 1.5A4 4 0 0 1 15 4h6v15h-6a4 4 0 0 0-3 1.5A4 4 0 0 0 9 19H3V4Zm9 2v14"/>',
    blood:'<path d="M12 3c-2 4-6 7.5-6 11a6 6 0 0 0 12 0c0-3.5-4-7-6-11Z"/><path d="M9 14a3 3 0 0 0 3 3"/>',
    phone:'<path d="m7 3 3 5-2 2a15 15 0 0 0 6 6l2-2 5 3-1 3c-1 3-8-1-12-5S0 4 3 3h4Z"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
  };
  return '<svg class="scv-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (paths[name] || paths.book) + '</svg>';
}
function renderCourse(course) {
  required(course.title, 'course.title');
  if (!Array.isArray(course.milestones) || course.milestones.length < 2 || course.milestones.length > 8) throw new RangeError('course.milestones needs 2–8 authored items');
  const milestones = course.milestones.map((m, i) => {
    required(m.label, 'milestone.label'); required(m.time, 'milestone.time');
    return '<li><span class="scv-milestone-marker">' + text(m.marker || i + 1) + '</span><strong>' + text(m.label) + '</strong><span class="scv-milestone-time">' + text(m.time) + '</span>' + (m.detail ? '<small>' + text(m.detail) + '</small>' : '') + '</li>';
  }).join('');
  return '<section class="scv-course"><div class="scv-section-heading">' + icon('calendar') + '<h3>' + text(course.title) + '</h3></div>' + (course.caption ? '<p class="scv-course-caption">' + text(course.caption) + '</p>' : '') + '<ol class="scv-milestones" style="--scv-count:' + course.milestones.length + '">' + milestones + '</ol>' + (course.note ? '<p class="scv-note">' + text(course.note) + '</p>' : '') + '</section>';
}
function renderInterval(interval) {
  required(interval.title, 'interval.title'); required(interval.unitLabel, 'interval.unitLabel');
  const duration = interval.duration;
  if (!Number.isFinite(duration) || duration <= 0) throw new RangeError('interval.duration must be positive');
  if (!Array.isArray(interval.ticks) || interval.ticks[0] !== 0 || interval.ticks.at(-1) !== duration || interval.ticks.some((n, i) => !Number.isFinite(n) || (i && n <= interval.ticks[i - 1]))) throw new RangeError('interval.ticks must run from 0 to duration, in order');
  if (!Array.isArray(interval.rows) || !interval.rows.length) throw new RangeError('interval.rows must be authored');
  const axis = '<div class="scv-time-axis" aria-hidden="true">' + interval.ticks.map(n => '<span style="left:' + (100 * n / duration).toFixed(3) + '%">' + text(n) + '</span>').join('') + '</div>';
  const rows = interval.rows.map(row => {
    required(row.label, 'interval row.label'); required(row.detail, 'interval row.detail');
    const {start, end} = row;
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end < start || end > duration) throw new RangeError('Invalid authored interval span');
    const x = n => 12 + n / duration * 576;
    const type = ['treatment','monitoring','decision'].includes(row.kind) ? row.kind : 'monitoring';
    const shape = start === end ? '<circle cx="' + x(start) + '" cy="13" r="8"/>' : '<rect x="' + x(start) + '" y="6" width="' + (x(end)-x(start)) + '" height="14" rx="7"/>';
    return '<li class="scv-interval-row"><div class="scv-interval-label"><strong>' + text(row.label) + '</strong>' + (row.timeLabel ? '<small>' + text(row.timeLabel) + '</small>' : '') + '</div><div class="scv-interval-visual"><svg class="scv-track scv-track-' + type + '" viewBox="0 0 600 26" preserveAspectRatio="none" aria-hidden="true"><line x1="12" y1="13" x2="588" y2="13"/>' + shape + '</svg><p>' + text(row.detail) + '</p></div></li>';
  }).join('');
  return '<section class="scv-interval"><div class="scv-section-heading">' + icon('clock') + '<h3>' + text(interval.title) + '</h3></div><div class="scv-axis-row"><div class="scv-axis-label">' + text(interval.unitLabel) + '</div><div class="scv-axis-plot">' + axis + '</div></div><ul class="scv-interval-rows">' + rows + '</ul>' + (interval.note ? '<p class="scv-note">' + text(interval.note) + '</p>' : '') + '</section>';
}
function renderFacts(facts) {
  if (!Array.isArray(facts)) throw new TypeError('facts must be an array');
  return '<dl class="scv-facts">' + facts.map(f => '<div style="width:'+(100/facts.length).toFixed(5)+'%"><dt>' + icon(f.icon) + text(required(f.label,'fact.label')) + '</dt><dd><strong>' + text(required(f.value,'fact.value')) + '</strong>' + (f.detail ? '<span>' + text(f.detail) + '</span>' : '') + '</dd></div>').join('') + '</dl>';
}
function renderChapterHeading(data) {
  if (!Number.isInteger(data.number) || data.number < 1) throw new RangeError('chapter.number must match an assembled contents entry');
  required(data.title, 'chapter.title');
  return '<header class="scv-chapter-banner"><span class="scv-chapter-badge">' + String(data.number).padStart(2,'0') + '</span><div><p class="scv-chapter-eyebrow">CHAPTER ' + data.number + '</p><h2>' + text(data.title) + '</h2>' + (data.subtitle ? '<p class="scv-chapter-subtitle">' + text(data.subtitle) + '</p>' : '') + '</div></header>';
}
function renderCover(data) {
  ['regimenTitle','sourceLabel','versionLabel','logoSrc'].forEach(k => required(data[k],k));
  if (!Array.isArray(data.contents) || !data.contents.length) throw new TypeError('Cover contents must come from assembled handbook sections');
  const contents = data.contents.map((c, i) => {
    required(c.title,'contents.title');
    if (c.page != null && (!Number.isInteger(c.page) || c.page < 2)) throw new RangeError('Content page must be a positive assembled folio after cover');
    return '<li><span class="scv-chapter-number">' + String(i+1).padStart(2,'0') + '</span><span class="scv-chapter-title">' + text(c.title) + '</span>' + (c.page == null ? '' : '<span class="scv-chapter-page">' + c.page + '</span>') + '</li>';
  }).join('');
  return '<article class="scv-page scv-cover"><header class="scv-brand"><img src="' + text(data.logoSrc) + '" alt="SACTCheck"><div><span>YOUR TREATMENT HANDBOOK</span><strong>' + text(data.sourceLabel) + '</strong></div></header><div class="scv-cover-title"><div class="scv-eyebrow">INFORMATION TO KEEP WITH YOU</div><h1>My complete<br>treatment handbook</h1><h2>' + text(data.regimenTitle) + '</h2><p>Understand your treatment. Know what to expect. Keep your plan to hand.</p></div>' + renderFacts(data.facts || []) + (data.course ? renderCourse(data.course) : '') + '<section class="scv-contents"><div class="scv-contents-heading"><h3>Inside your handbook</h3>' + (data.contents.every(c => c.page != null) ? '<span>PAGE</span>' : '') + '</div><ol>' + contents + '</ol></section><div class="scv-personal"><div><span>My name</span><div class="scv-writing-line"></div></div><div><span>Hospital / oncology team</span><div class="scv-writing-line"></div></div></div><aside class="scv-contact-notice">' + icon('phone') + '<p>' + text(required(data.contactNotice,'contactNotice')) + '</p></aside><footer class="scv-footer"><span>' + text(data.versionLabel) + '</span><span>' + text(data.statusLabel || '') + '</span></footer></article>';
}

const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
function currentRelease(root=ROOT){return required(JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version,'package.version');}
const RELEASE=currentRelease();
const CSS_FILE='assets/patient/patient-visual-standard-v08443.css';
const SECTION_FILE='data/patient-document-sections-v08443.json';
const LOGO_FILE='assets/branding/sactcheck-logo.svg';
const ROUTE=/^\d{5}(?:\/[a-z0-9_]+)?$/;
function sourcePath(route){
  if(!ROUTE.test(route))throw new Error('Invalid patient route: '+route);
  return route.includes('/')?'data/patient-knowledge-contexts/'+route+'.json':'data/patient-knowledge/'+route+'.json';
}
function authoredString(...values){return values.find(v=>typeof v==='string'&&v.trim())||'';}
function readProfile(route,root=ROOT){
  const file=sourcePath(route),profile=JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
  if(profile.code!==route.split('/')[0])throw new Error('Profile and patient route disagree: '+route);
  return profile;
}
function validTreatmentRows(profile){
  if(!Number.isInteger(profile.cycle_days)||profile.cycle_days<1||!Array.isArray(profile.timeline))return [];
  return profile.timeline.filter(row=>row.style==='treatment').map(row=>{
    if(!Number.isInteger(row.start)||!Number.isInteger(row.end)||row.start<1||row.end<row.start||row.end>profile.cycle_days)throw new Error('Invalid authored treatment span in '+profile.code+': '+row.id);
    return {id:row.id,label:required(row.label,'treatment row label'),detail:authoredString(row.text),start:row.start,end:row.end};
  });
}
function profileModel(profile,route,root=ROOT,guideOverride){
  const d=profile;
  if(!ROUTE.test(route)||d.code!==route.split('/')[0])throw new Error('Profile and route disagree');
  const guideFile=path.join(root,'patient',route,'guide.html');
  const guide=typeof guideOverride==='string'?stripStandard(guideOverride):(fs.existsSync(guideFile)?stripStandard(fs.readFileSync(guideFile,'utf8')):'');
  const modernGuide=/\bpt-first\b/.test(guide);
  const phaseSource=Array.isArray(d.phases)?d.phases:[];
  const phases=phaseSource.map((p,i)=>({number:i+1,title:authoredString(p.label,p.title),short:authoredString(p.short),detail:authoredString(p.detail,p.text),records:Array.isArray(p.cycles)?p.cycles.map(String):[]}));
  const summaryPhases=(Array.isArray(d.patient_summary?.phases)?d.patient_summary.phases:[]).map((p,i)=>({number:i+1,title:authoredString(p.title,p.label),detail:authoredString(p.text,p.detail)}));
  const continuous=/continuous/.test(d.schedule_kind||'');
  const schedules=Array.isArray(d.phase_cycles)&&d.phase_cycles.length?d.phase_cycles.map(p=>({...d,...p})): [d];
  const calendars=schedules.map((p,i)=>({
    label:authoredString(p.label,p.phase_label,p.name,p.title,schedules.length>1?'Authored phase '+(i+1):''),
    days:Number.isInteger(p.cycle_days)&&p.cycle_days>0?p.cycle_days:null,
    reference:continuous||/reference/.test(d.cycle_display||''),
    rows:validTreatmentRows(p),
    note:authoredString(p.timeline_note,d.timeline_note)
  }));
  const sections=JSON.parse(fs.readFileSync(path.join(root,SECTION_FILE),'utf8')).map(s=>({...s,title:modernGuide&&s.modern_title?s.modern_title:s.title}));
  const model={schema_version:'1.0',release:d.visual_release||JSON.parse(fs.readFileSync(path.join(root,'data/patient-presentation-v08431.json'),'utf8')).default_visual_release||currentRelease(root),route,code:d.code,title:required(d.title,'profile.title'),protocolVersion:String(d.protocol_version??''),sourceLabel:'NCCP '+d.code+' · v'+String(d.protocol_version??''),sourcePath:sourcePath(route),sourceUrls:(d.sources||[]).map(s=>s.url).filter(s=>typeof s==='string'),scheduleKind:d.schedule_kind||'authored',schedule:authoredString(d.patient_summary?.schedule,d.schedule_summary,d.schedule_label),scheduleLabel:authoredString(d.schedule_label),continuous,cycleDays:Number.isInteger(d.cycle_days)&&d.cycle_days>0?d.cycle_days:null,phases,summaryPhases,calendars,modernGuide,sections,explicitCourse:null,scope:authoredString(d.treatment_scope_notice,d.scope_note)};
  // This specialist course is explicitly authored as four PRRT administrations.
  // No other wallet stamp count is treated as a total course length.
  if(d.schedule_kind==='finite_prrt'){
    const p=phaseSource[0];
    if(d.code!=='00642'||d.cycle_days!==56||phaseSource.length!==1||JSON.stringify(p?.cycles)!==JSON.stringify(['T1','T2','T3','T4']))throw new Error('Unrecognised finite PRRT course; supply an explicit reviewed visual model');
    model.explicitCourse={title:'Your planned course',caption:authoredString(d.patient_summary?.schedule),milestones:p.cycles.map((label,i)=>({label:'Treatment '+(i+1),marker:String(i+1),time:'Week '+i*8})),note:'Illustrative elapsed weeks from the first treatment. Each administration needs specialist clearance. Dates can change; follow-up continues after treatment 4.'};
  }
  const firstText=(guide.match(/<section\b[^>]*class="[^"]*\bpt-first\b[^"]*"[^>]*>([\s\S]*?)<section\b[^>]*class="[^"]*\bpt-effects\b/)||[])[1]||'';
  const firstWords=firstText.replace(/<[^>]+>/g,' ').replace(/&[^;]+;/g,' ').split(/\s+/).filter(Boolean).length;
  model.guideWordCount=firstWords;
  model.guideDensity=model.explicitCourse?'normal':(firstWords>=360||calendars.length>1||calendars.some(c=>c.rows.length>3)||summaryPhases.length>2?'compact':'normal');
  const layoutFile=path.join(root,'data/patient-visual-layout-v08443.json');
  model.guideGraphic='treatment-lanes';
  if(fs.existsSync(layoutFile)){
    const routeLayout=JSON.parse(fs.readFileSync(layoutFile,'utf8')).routes?.[route]||{};
    const configured=routeLayout.guideDensity;
    if(configured&&!['normal','compact'].includes(configured))throw new Error('Unknown guide density for '+route);
    if(configured)model.guideDensity=configured;
    if(routeLayout.guideGraphic){
      if(!['treatment-lanes','inline-treatment-lanes','combined-treatment-days'].includes(routeLayout.guideGraphic))throw new Error('Unknown guide graphic for '+route);
      model.guideGraphic=routeLayout.guideGraphic;
    }
  }
  return model;
}
function modelForRoute(route,root=ROOT){return profileModel(readProfile(route,root),route,root);}
function phasePath(model){
  const stages=model.phases.length?model.phases:model.summaryPhases;
  if(!stages.length)return '';
  return '<section class="scv-phase-path"><h3>Treatment stages</h3><ol>'+stages.map((p,i)=>'<li><span class="scv-phase-marker">'+String(i+1).padStart(2,'0')+'</span><div><strong>'+text(p.title)+'</strong>'+(p.short?'<span>'+text(p.short)+'</span>':'')+'</div></li>').join('')+'</ol><p class="scv-note">Your team confirms the active stage and dates. The full treatment guide explains each step.</p></section>';
}
function renderCourseRibbon(course){
  const steps=course.milestones;
  return '<div class="scv-course-ribbon"><ol style="--scv-count:'+steps.length+'">'+steps.map((m,i)=>'<li><span>'+text(m.marker||i+1)+'</span><strong>'+text(m.label)+'</strong><b>'+text(m.time)+'</b></li>').join('')+'</ol><p>Illustrative spacing. Each administration needs specialist clearance; dates can change.</p></div>';
}
function renderCalendar(calendar){
  if(!calendar.days||!calendar.rows.length)return '';
  const days=calendar.days,ticks=[...new Set([1,...Array.from({length:Math.ceil(days/7)-1},(_,i)=>8+i*7),days])].filter(n=>n<=days);
  const pos=day=>100*(day-.5)/days;
  return '<div class="scv-calendar"><div class="scv-calendar-heading"><strong>'+text(calendar.label||'Treatment within the displayed window')+'</strong><span>'+days+'-day view</span></div><div class="scv-calendar-axis"><span>Day</span><div>'+ticks.map(day=>'<i style="left:'+pos(day).toFixed(3)+'%">'+day+'</i>').join('')+'</div></div>'+calendar.rows.map(row=>{
    const point=row.start===row.end;
    const sx=12+576*(row.start-1)/days,ex=12+576*row.end/days;
    const shape=point?'<circle cx="'+(12+576*(row.start-.5)/days).toFixed(3)+'" cy="10" r="5.5" fill="#123f60" stroke="#ffffff" stroke-width="1"/>':'<rect x="'+sx.toFixed(3)+'" y="5" width="'+(ex-sx).toFixed(3)+'" height="10" rx="4" fill="#82cdc7" stroke="#087e80" stroke-width="1"/>';
    return '<div class="scv-calendar-row"><div><strong>'+text(row.label)+'</strong><span>Day '+row.start+(point?'':'–'+row.end)+'</span></div><svg viewBox="0 0 600 20" preserveAspectRatio="none" aria-hidden="true"><line x1="12" y1="10" x2="588" y2="10" stroke="#cbdedd" stroke-width="1.5"/>'+shape+'</svg></div>';
  }).join('')+'</div>';
}
function renderCompactCalendar(model){
  const calendars=model.calendars.filter(c=>c.days&&c.rows.length);
  if(!calendars.length)return '<aside class="scv-schedule-graphic scv-compact-pattern">'+icon('calendar')+'<div><strong>Your treatment pattern</strong><p>'+text(authoredString(model.scheduleLabel,model.schedule))+'</p></div></aside>';
  return '<section class="scv-schedule-graphic scv-compact-strip'+(model.guideGraphic==='inline-treatment-lanes'?' scv-inline-treatment-lanes':'')+'" aria-label="Treatment timing in the displayed window">'+calendars.map(calendar=>{
    if(model.guideGraphic==='combined-treatment-days'){
      const spans=[];
      for(const row of [...calendar.rows].sort((a,b)=>a.start-b.start||a.end-b.end)){
        const last=spans.at(-1);
        if(last&&row.start<=last.end+1)last.end=Math.max(last.end,row.end);
        else spans.push({start:row.start,end:row.end});
      }
      const label=spans.map(row=>String(row.start)+(row.start===row.end?'':'–'+row.end)).join(', ');
      const shapes=spans.map(row=>row.start===row.end?'<circle cx="'+(12+576*(row.start-.5)/calendar.days).toFixed(3)+'" cy="7" r="4.5" fill="#123f60" stroke="#ffffff" stroke-width=".7"/>':'<rect x="'+(12+576*(row.start-1)/calendar.days).toFixed(3)+'" y="3.5" width="'+(576*(row.end-row.start+1)/calendar.days).toFixed(3)+'" height="7" rx="3" fill="#77c5be" stroke="#087e80" stroke-width=".8"/>').join('');
      return '<div class="scv-mini-window"><div class="scv-window-badge"><strong>'+calendar.days+'</strong><span>day view</span></div><div class="scv-mini-content"><p class="scv-mini-caption">Treatment across this window · medicine timings are listed below</p><div class="scv-mini-row"><div><strong>Scheduled treatment</strong><span>Days '+text(label)+'</span></div><svg viewBox="0 0 600 14" preserveAspectRatio="none" aria-hidden="true"><line x1="12" y1="7" x2="588" y2="7" stroke="#c4dad8" stroke-width="1.2"/>'+shapes+'</svg></div></div></div>';
    }
    const groups=[];
    for(const row of calendar.rows){
      // Identically authored labels can share a lane; each original span still
      // has its own mark and exact day label. No doses or durations are inferred.
      let group=groups.find(g=>g.label===row.label&&g.detail===row.detail);
      if(!group){group={label:row.label,detail:row.detail,rows:[]};groups.push(group);}
      group.rows.push(row);
    }
    const hasPhaseLabel=model.calendars.length>1;
    const label=hasPhaseLabel?calendar.label:(model.continuous?'Reference window · ongoing treatment':'Treatment timing in this window');
    const rows=groups.map(group=>{
      const days=group.rows.map(row=>String(row.start)+(row.start===row.end?'':'–'+row.end)).join(', ');
      const hours=group.detail.length<45&&/hours?\b/.test(group.detail)?' · '+group.detail:'';
      const shapes=group.rows.map(row=>{
        const start=12+576*(row.start-1)/calendar.days,end=12+576*row.end/calendar.days;
        return row.start===row.end?'<circle cx="'+(12+576*(row.start-.5)/calendar.days).toFixed(3)+'" cy="7" r="4.5" fill="#123f60" stroke="#ffffff" stroke-width=".7"/>':'<rect x="'+start.toFixed(3)+'" y="3.5" width="'+(end-start).toFixed(3)+'" height="7" rx="3" fill="#77c5be" stroke="#087e80" stroke-width=".8"/>';
      }).join('');
      return '<div class="scv-mini-row"><div><strong>'+text(group.label)+'</strong><span>Day '+text(days+hours)+'</span></div><svg viewBox="0 0 600 14" preserveAspectRatio="none" aria-hidden="true"><line x1="12" y1="7" x2="588" y2="7" stroke="#c4dad8" stroke-width="1.2"/>'+shapes+'</svg></div>';
    }).join('');
    return '<div class="scv-mini-window"><div class="scv-window-badge"><strong>'+calendar.days+'</strong><span>day '+(model.continuous?'reference':'view')+'</span></div><div class="scv-mini-content"><p class="scv-mini-caption">'+text(label)+'</p><div class="scv-mini-rows" data-columns="'+(groups.length>2?'2':'1')+'">'+rows+'</div></div></div>';
  }).join('')+'</section>';
}
function renderScheduleGraphic(model,options={}){
  const guide=!!options.guide;
  const compact=guide&&model.guideDensity==='compact';
  if(compact)return renderCompactCalendar(model);
  let body='';
  if(model.explicitCourse)body=renderCourseRibbon(model.explicitCourse);
  else if((model.phases.length||model.summaryPhases.length)>1)body=phasePath(model);
  else {
    const calendars=model.calendars.filter(c=>c.rows.length);
    if(calendars.length)body=calendars.map(renderCalendar).join('');
    else body='<div class="scv-pattern"><span class="scv-pattern-icon">'+icon('calendar')+'</span><div><strong>Your treatment pattern</strong><p>'+text(authoredString(model.scheduleLabel,model.schedule))+'</p></div></div>';
  }
  return '<section class="scv-schedule-graphic'+(guide?' scv-guide-graphic':'')+'" aria-label="Treatment schedule at a glance">'+body+(model.explicitCourse?'':'<p class="scv-graphic-note">This shows treatment timing, not guaranteed symptom-free days. Your team confirms the active phase and dates.</p>')+'</section>';
}

function attribute(tag,name){const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const m=tag.match(new RegExp('(?:^|\\s)'+escaped+'\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))','i'));return m?(m[1]??m[2]??m[3]):null;}
const hasClass=(tag,name)=>(attribute(tag,'class')||'').split(/\s+/).includes(name);
function tags(html){
  const out=[],pattern=/<!--[\s\S]*?-->|<\/?[a-z][a-z0-9:-]*\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi;
  for(let m;(m=pattern.exec(html));){
    if(m[0].startsWith('<!--'))continue;
    const n=m[0].match(/^<(\/)?([a-z][a-z0-9:-]*)/i),t={start:m.index,end:pattern.lastIndex,raw:m[0],name:n[2].toLowerCase(),closing:!!n[1]};out.push(t);
    if(!t.closing&&['script','style'].includes(t.name)){
      const closing=new RegExp('</'+t.name+'\\s*>','ig');closing.lastIndex=t.end;const end=closing.exec(html);if(!end)throw new Error('Unclosed '+t.name+' element');pattern.lastIndex=closing.lastIndex;
    }
  }
  return out;
}
function elementRange(all,opening){let depth=0;for(const t of all){if(t.start<opening.start||t.name!==opening.name)continue;depth+=t.closing?-1:1;if(depth===0)return {start:opening.start,end:t.end,opening};}throw new Error('Unclosed '+opening.name+' element');}
function applyRanges(html,replacements){for(const r of replacements.sort((a,b)=>b.start-a.start))html=html.slice(0,r.start)+r.text+html.slice(r.end);return html;}
function addition(label,content){return '<!--scv43:'+label+':start-->'+content+'<!--scv43:'+label+':end-->';}
function stripStandard(html){
  return html.replace(/<!--scv43:([a-z-]+):start-->[\s\S]*?<!--scv43:\1:end-->/g,'').replace(/\sdata-patient-visual-standard="v08443"/g,'').replace(/\sdata-scv-guide-density="(?:normal|compact)"/g,'');
}
function missingDocumentLinks(all,route,root){
  const definitions=[
    {file:'handbook.pdf',title:'Complete treatment handbook',description:'All sections, plans and records · PDF'},
    {file:'knowledge.pdf',title:'Full treatment reference',description:'Medicines, schedules and symptoms · PDF'}
  ];
  return definitions.filter(document=>{
    // Future authoring exposes a download only after its actual PDF exists.
    // The PDF publisher runs this shared pass again after creating both files.
    if(!fs.existsSync(path.join(root,'patient',route,document.file)))return false;
    return !all.some(tag=>{
      if(tag.closing||tag.name!=='a')return false;
      const href=attribute(tag.raw,'href');if(!href)return false;
      try{
        const target=new URL(href,'https://sactcheck.com/patient/'+route+'/');
        return ['sactcheck.com','www.sactcheck.com','pobchina-boop.github.io'].includes(target.hostname)&&target.pathname.endsWith('/patient/'+route+'/'+document.file);
      }catch{return false;}
    });
  });
}
function renderDocumentLinks(documents){
  return '<nav class="scv-document-downloads no-print" aria-label="Printable treatment information"><div class="scv-document-intro"><strong>Print or keep a copy</strong><span>Use alongside your personal treatment plan.</span></div><div class="scv-document-options">'+documents.map(document=>'<a href="'+text(document.file)+'" download>'+icon('book')+'<span><strong>'+text(document.title)+'</strong><small>'+text(document.description)+'</small></span></a>').join('')+'</div></nav>';
}
function transformHtml(input,profile,route,file,options={}){
  if(!ROUTE.test(route))throw new Error('Unsafe route');
  const root=options.root||ROOT;
  const basename=path.posix.basename(file);
  if(!['index.html','guide.html','knowledge.html','knowledge-print.html'].includes(basename))return {html:input,status:'not-targeted',additions:0};
  const base=stripStandard(input),all=tags(base);
  if(/http-equiv\s*=\s*["']refresh["']/i.test(base))return {html:input,status:'redirect-preserved',additions:0};
  const body=all.filter(t=>t.name==='body'&&!t.closing),head=all.filter(t=>t.name==='head'&&t.closing);
  if(body.length!==1||head.length!==1)throw new Error(file+': expected one head/body');
  const model=profileModel(profile,route,root,basename==='guide.html'?base:undefined),changes=[];
  const relative=path.posix.relative(path.posix.dirname(file),CSS_FILE);
  changes.push({start:head[0].start,end:head[0].start,text:addition('stylesheet','<link rel="stylesheet" href="'+text(relative)+'">')});
  changes.push({start:body[0].start,end:body[0].end,text:body[0].raw.replace(/>$/,' data-patient-visual-standard="v08443"'+(basename==='guide.html'?' data-scv-guide-density="'+model.guideDensity+'"':'')+'>')});
  const isGuide=basename==='guide.html';
  if(['index.html','knowledge.html'].includes(basename)){
    const missing=missingDocumentLinks(all,route,root);
    if(missing.length){
      const h1=all.find(t=>!t.closing&&t.name==='h1');
      const hero=all.find(t=>!t.closing&&['wiki-hero','pk-hero','ps-hero'].some(name=>hasClass(t.raw,name)));
      const titleHeader=h1?all.filter(t=>!t.closing&&t.name==='header'&&t.start<h1.start).map(t=>elementRange(all,t)).filter(r=>r.end>h1.end).at(-1):null;
      const main=all.find(t=>!t.closing&&t.name==='main');
      const point=hero?elementRange(all,hero).end:titleHeader?titleHeader.end:h1?elementRange(all,h1).end:main?main.end:body[0].end;
      changes.push({start:point,end:point,text:addition('downloads',renderDocumentLinks(missing))});
    }
  }
  const first=all.find(t=>!t.closing&&hasClass(t.raw,'pt-first'));
  const firstRange=first?elementRange(all,first):null;
  const kicker=all.find(t=>!t.closing&&((firstRange&&t.start>firstRange.start&&t.end<firstRange.end&&hasClass(t.raw,'pt-kicker'))||(!firstRange&&isGuide&&hasClass(t.raw,'wiki-kicker'))));
  if(kicker){
    const mark=path.posix.relative(path.posix.dirname(file),'assets/branding/sactcheck-mark.svg');
    changes.push({start:kicker.end,end:kicker.end,text:addition('brand','<img class="scv-inline-mark" src="'+text(mark)+'" alt="" aria-hidden="true">')});
  }
  if(firstRange){
    const schedule=all.find(t=>!t.closing&&t.start>firstRange.start&&t.end<firstRange.end&&hasClass(t.raw,'pt-schedule'));
    if(!schedule)throw new Error(file+': modern first page has no authored schedule');
    const range=elementRange(all,schedule);
    changes.push({start:range.end,end:range.end,text:addition('schedule',renderScheduleGraphic(model,{guide:true}))});
  }else if(!isGuide){
    let anchor=all.find(t=>!t.closing&&attribute(t.raw,'id')==='phases');
    if(!anchor)anchor=all.find(t=>!t.closing&&attribute(t.raw,'id')==='treatment-journey');
    if(anchor){
      const range=elementRange(all,anchor);
      const heading=all.find(t=>!t.closing&&/^h[1-6]$/.test(t.name)&&t.start>range.start&&t.end<range.end);
      const point=heading?elementRange(all,heading).end:anchor.end;
      changes.push({start:point,end:point,text:addition('schedule',renderScheduleGraphic(model))});
    }else{
      anchor=all.find(t=>!t.closing&&attribute(t.raw,'id')==='wikiCycleChronology');
      if(anchor)changes.push({start:anchor.start,end:anchor.start,text:addition('schedule',renderScheduleGraphic(model))});
      else {
        const main=all.find(t=>!t.closing&&t.name==='main');
        if(main)changes.push({start:main.end,end:main.end,text:addition('schedule',renderScheduleGraphic(model))});
        else throw new Error(file+': no recognized treatment-content container');
      }
    }
  }
  const html=applyRanges(base,changes);
  if(stripStandard(html)!==base)throw new Error(file+': original HTML content was not retained exactly');
  return {html,status:firstRange?'modern-guide':isGuide?'legacy-guide':'patient-page',additions:changes.length,guideDensity:model.guideDensity,guideWordCount:model.guideWordCount};
}
function decorateGenerated(file,html,root=ROOT){
  const relative=path.isAbsolute(file)?path.relative(root,file).replaceAll('\\','/'):file.replaceAll('\\','/');
  const match=relative.match(/^patient\/(\d{5}(?:\/[a-z0-9_]+)?)\/(index|guide|knowledge|knowledge-print)\.html$/);
  if(!match||!fs.existsSync(path.join(root,sourcePath(match[1]))))return html;
  return transformHtml(html,readProfile(match[1],root),match[1],relative,{root}).html;
}
function coverDocument(input,root=ROOT){
  const model=input.model||modelForRoute(required(input.route,'route'),root);
  const sourceSections=input.contents||model.sections.map(s=>({title:s.title}));
  const contents=sourceSections.map((s,i)=>({title:required(s.title||s.label,'contents title'),page:s.page??null}));
  const facts=[];
  if(model.explicitCourse)facts.push({label:'Planned treatments',value:'4',detail:'Specialist PRRT administrations',icon:'infusion'},{label:'Usual spacing',value:'8 weeks',detail:'Between administrations',icon:'calendar'});
  else if(model.continuous)facts.push({label:'Treatment pattern',value:'Ongoing',detail:'Follow the prescribed daily plan',icon:'calendar'});
  else if(model.cycleDays)facts.push({label:'Displayed calendar',value:model.cycleDays+' days',detail:model.calendars.length>1?'Intervals differ by treatment phase':'See the active treatment phase',icon:'calendar'});
  else facts.push({label:'Treatment timing',value:'Your plan',detail:'See the schedule in your treatment guide',icon:'calendar'});
  if(!model.explicitCourse&&model.phases.length)facts.push({label:'Treatment stages',value:String(model.phases.length),detail:'Explained in the treatment reference',icon:'book'});
  facts.push({label:'Regimen source',value:'NCCP '+model.code,detail:'Version '+model.protocolVersion,icon:'check'});
  const logo='data:image/svg+xml;base64,'+fs.readFileSync(path.join(root,LOGO_FILE)).toString('base64');
  let body=renderCover({logoSrc:logo,regimenTitle:model.title,sourceLabel:model.sourceLabel,versionLabel:input.versionLabel||'SACTCheck v'+currentRelease(root),statusLabel:input.statusLabel||'Feasibility build. Clinical, pharmacy and patient/PPI review pending.',facts,course:model.explicitCourse,contents,contactNotice:'Use the urgent instructions and contact numbers in your treatment guide. Your team must replace example numbers before patient use. Your individual treatment plan takes precedence.'});
  if(!model.explicitCourse){
    const authoredShort=authoredString(model.scheduleLabel.length<=220?model.scheduleLabel:'',model.schedule.length<=320?model.schedule:'');
    const summary=authoredShort?'<p class="scv-cover-schedule">'+text(authoredShort)+'</p>':'';
    body=body.replace('<section class="scv-contents">',summary+phasePath(model)+'<section class="scv-contents">');
  }
  return documentShell('My complete treatment handbook · '+model.title,body,root,input.fontCss||'');
}
function chapterDocument(input,root=ROOT){
  const model=input.model||modelForRoute(required(input.route,'route'),root);
  const section=model.sections.find(s=>s.number===input.number);
  if(!section)throw new Error('Unknown chapter number');
  const title=input.title||section.title;
  const logo='data:image/svg+xml;base64,'+fs.readFileSync(path.join(root,LOGO_FILE)).toString('base64');
  const defaultItems={
    1:[['Know your treatment','Use your regimen-specific guide and keep your personal plan alongside it.'],['Recognise symptoms','Find the anatomical side-effect explanations and urgent contact instructions.'],['Keep information to hand','Bring your questions and treatment information to review.']],
    2:[['Understand the medicines','Read how the medicines work and why they are included.'],['Explore the full schedule','Check the treatment phases, time between visits and individual precautions.'],['Find detail when you need it','Use the symptom guidance, practical advice and written sources.']],
    3:[['Check the treatment sequence','Follow the stages described for this regimen.'],['Keep tests and appointments visible','Use the monitoring plan alongside the dates confirmed by your team.'],['Record changes','Ask for an updated plan after delays, changes or a treatment pause.']],
    4:[['Know what each medicine is for','Review the supportive medicines and any phase-specific sheets that follow.'],['Follow the prescribed dose and timing','Your individual prescription and team instructions determine what to take.'],['Ask when instructions are unclear','Check duplicated medicines, changed plans or troublesome symptoms with your team.']],
    5:[['Prepare for treatment','Review the practical arrangements described for your regimen.'],['Plan visits and treatment access','Confirm appointments, any line or pump arrangements and transport needs.'],['Prepare for home','Keep the written instructions and contact route available.']],
    6:[['Keep a treatment record','Use the passport to bring the treatment history to review.'],['Record symptoms and questions','Write down changes that you want to discuss with your team.'],['Confirm the next step','A recorded treatment or stamp does not approve the next dose.']],
    7:[['Keep the card available','Carry your treatment details and actual urgent contacts.'],['Follow the printing instructions','Use the stated print size and the supplied cutting or folding instructions.'],['Keep the record accurate','Update changed treatment details with your team and retain other alert cards.']]
  };
  const supplied=Array.isArray(input.items)&&input.items.length?input.items:(defaultItems[input.number]||[]).map(([title,description])=>({title,description}));
  const items=supplied.map(item=>typeof item==='string'?{title:item}:item);
  const reading='<section class="scv-reading-map"><h3>In this section</h3><ol>'+items.map((item,i)=>'<li><span>'+String(i+1).padStart(2,'0')+'</span><div><strong>'+text(authoredString(item.title,item.label))+'</strong>'+(authoredString(item.description,item.text)?'<p>'+text(authoredString(item.description,item.text))+'</p>':'')+'</div></li>').join('')+'</ol></section>';
  const count=Number.isInteger(input.contentPages)&&input.contentPages>0?'<div class="scv-section-pages"><strong>'+input.contentPages+'</strong><span>pages of information follow</span></div>':'';
  const progress='<div class="scv-chapter-progress" aria-label="Chapter '+input.number+' of '+model.sections.length+'">'+model.sections.map(s=>'<span'+(s.number===input.number?' class="current"':'')+'>'+String(s.number).padStart(2,'0')+'</span>').join('')+'</div>';
  const body='<article class="scv-page scv-chapter-divider"><header class="scv-brand"><img src="'+text(logo)+'" alt="SACTCheck"><div><span>YOUR TREATMENT HANDBOOK</span><strong>'+text(model.sourceLabel)+'</strong></div></header>'+progress+renderChapterHeading({number:input.number,title,subtitle:input.subtitle||section.description||''})+'<h3 class="scv-divider-regimen">'+text(model.title)+'</h3>'+(input.description?'<p class="scv-divider-description">'+text(input.description)+'</p>':'')+reading+count+'<aside class="scv-contact-notice">'+icon('book')+'<p>Read the pages that follow at your own pace. Keep your individual treatment instructions with this handbook and ask your team about anything unclear.</p></aside><footer class="scv-footer"><span>SACTCheck v'+currentRelease(root)+'</span><span>'+text(input.footer||'Your team confirms your personal treatment plan.')+'</span></footer></article>';
  return documentShell(title+' · '+model.title,body,root,input.fontCss||'');
}
function documentShell(title,body,root=ROOT,fontCss=''){
  const css=fs.readFileSync(path.join(root,CSS_FILE),'utf8');
  return '<!doctype html><html lang="en-IE"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+text(title)+'</title><style>'+css+'\n@page{size:A4;margin:0}html,body{margin:0;background:white}'+fontCss+'</style></head><body>'+body+'</body></html>';
}

module.exports={RELEASE,CSS_FILE,SECTION_FILE,LOGO_FILE,currentRelease,sourcePath,escape:text,icon,renderCourse,renderInterval,renderFacts,renderCover,renderChapterHeading,readProfile,profileModel,modelForRoute,validTreatmentRows,phasePath,coverDocument,chapterDocument,documentShell,renderCalendar,renderScheduleGraphic,stripStandard,transformHtml,decorateGenerated};
if(require.main===module){
  const action=process.argv[2];
  if(action==='model')process.stdout.write(JSON.stringify(modelForRoute(required(process.argv[3],'route')),null,2)+'\n');
  else if(action==='cover'||action==='chapter'){
    const raw=fs.readFileSync(0,'utf8').trim(),input=raw?JSON.parse(raw):{};
    if(process.argv[3])input.route=process.argv[3];
    process.stdout.write((action==='cover'?coverDocument:chapterDocument)(input));
  }else throw new Error('Choose model ROUTE, cover ROUTE < JSON, or chapter ROUTE < JSON');
}



