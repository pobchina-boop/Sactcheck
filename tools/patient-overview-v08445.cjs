'use strict';
/** A portal overview composed from authored documents; it writes no files. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const esc=value=>String(value??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const VOID=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
function elements(source){
  const result=[],stack=[];
  const token=/<!--[\s\S]*?-->|<(script|style|template)\b(?:[^>"']|"[^"]*"|'[^']*')*>[\s\S]*?<\/\1\s*>|<\/?([a-z][a-z0-9:-]*)\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi;
  for(let m;(m=token.exec(source));){
    if(m[0].startsWith('<!--'))continue;
    const tag=(m[1]||m[2]).toLowerCase();
    if(m[0].startsWith('</')){
      let index=stack.length-1;while(index>=0&&stack[index].tag!==tag)index--;
      if(index<0)continue;
      const item=stack[index];item.innerEnd=m.index;item.end=token.lastIndex;stack.length=index;
      continue;
    }
    const open=m[0].slice(0,m[0].indexOf('>')+1);
    const item={tag,open,start:m.index,innerStart:m.index+open.length,innerEnd:token.lastIndex,end:token.lastIndex,parent:stack.at(-1)||null};
    result.push(item);
    if(m[1])item.innerEnd=m.index+m[0].toLowerCase().lastIndexOf('</'+tag);
    else if(!VOID.has(tag)&&!m[0].endsWith('/>'))stack.push(item);
  }
  return result;
}
function attr(item,name){const m=item.open.match(new RegExp('\\s'+name+'\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))','i'));return m&&(m[1]??m[2]??m[3]);}
function hasClass(item,name){return (attr(item,'class')||'').split(/\s+/).includes(name);}
const outer=(source,item)=>source.slice(item.start,item.end);
const inner=(source,item)=>source.slice(item.innerStart,item.innerEnd);
function find(source,predicate){return elements(source).find(predicate);}
function mainSections(source){const nodes=elements(source),main=nodes.find(n=>n.tag==='main');return main?nodes.filter(n=>n.parent===main&&n.tag==='section'):[];}
function omit(source,predicate){const nodes=elements(source).filter(predicate).sort((a,b)=>a.start-b.start);let out='',pos=0;for(const n of nodes){if(n.start<pos)continue;out+=source.slice(pos,n.start);pos=n.end;}return out+source.slice(pos);}
function clean(source){return omit(source,n=>n.tag==='footer'||n.tag==='script'||hasClass(n,'pt-toolbar')||hasClass(n,'suite-toolbar'));}
function firstClass(source,name){const found=find(source,n=>hasClass(n,name));return found?outer(source,found):'';}
function sourceParts(guide,card,index,profile,scheduleHtml){
 const pages=mainSections(guide),modern=pages.length===3&&hasClass(pages[0],'pt-first');
 if(modern)return {modern:true,panels:pages.map(p=>clean(outer(guide,p))),mode:'authored-three-page-guide'};
 const map=firstClass(guide,'patient-bodymap-card')||firstClass(index,'patient-bodymap-card');
 if(!map)throw Error('Legacy overview requires the existing rich anatomical map');
 if(!profile.schedule_summary)throw Error('Legacy overview requires an authored schedule summary');
 const monitoring=profile.monitoring_summary?'<p>'+esc(profile.monitoring_summary)+'</p>':(profile.monitoring_schedule?.rows?.length?'<div class="po45-monitoring-grid">'+profile.monitoring_schedule.rows.map(row=>'<article><h5>'+esc(row.label)+'</h5><dl>'+row.cells.map((cell,i)=>'<dt>'+esc(profile.monitoring_schedule.columns[i])+'</dt><dd>'+esc(cell)+'</dd>').join('')+'</dl></article>').join('')+'</div><p>'+esc(profile.monitoring_schedule.note)+'</p>':'');
 if(!monitoring)throw Error('Legacy overview requires authored monitoring information');
 const schedule=scheduleHtml||firstClass(guide,'scv-schedule-graphic')||firstClass(index,'scv-schedule-graphic');
 const between=[profile.timeline_note,profile.safety_note].filter((x,i,a)=>typeof x==='string'&&x&&a.indexOf(x)===i).map(x=>'<p>'+esc(x)+'</p>').join('');
 const first='<section class="po45-legacy-summary"><h3>'+esc(profile.title)+'</h3><p>'+esc(profile.purpose)+'</p><h4>My schedule at a glance</h4>'+schedule+'<p>'+esc(profile.schedule_summary)+'</p><h4>Tests and checks</h4>'+monitoring+'<h4>Between treatment visits</h4>'+(between||'<p>'+esc(profile.timeline_note||profile.safety_note)+'</p>')+'</section>';
 const urgent=firstClass(guide,'suite-red')||firstClass(index,'pt-urgent')||(profile.urgent_extra?'<aside class="pt-urgent"><p>'+esc(profile.urgent_extra)+'</p></aside>':'');
 const second='<section class="po45-legacy-effects">'+map+urgent+'</section>';
 const main=find(card,n=>n.tag==='main');
 if(!main)throw Error('An authored standalone treatment-card main section is required');
 return {modern:false,panels:[first,second,clean(inner(card,main))],mode:'legacy-guide-anatomy-with-authored-summary-and-separate-card'};
}
function buildOverview(input,{root=process.cwd(),route,profile,data,guideHtml,cardHtml,knowledgeHtml}={}){
 profile=profile||data;
 if(!route||!/^\d{5}(?:\/[a-z0-9_]+)?$/.test(route))throw Error('An exact authored regimen route is required');
 const folder=path.join(root,'patient',route);
 if(!fs.existsSync(path.join(folder,'guide.html'))&&guideHtml===undefined)return input;
 if(profile?.patient_context_selector)return input;
 if(!profile){const standard=require(path.join(root,'tools/patient-visual-standard-v08443.cjs'));profile=JSON.parse(fs.readFileSync(path.join(root,standard.sourcePath(route)),'utf8'));}
 const guide=guideHtml??fs.readFileSync(path.join(folder,'guide.html'),'utf8');
 const card=cardHtml??fs.readFileSync(path.join(folder,'sactcard.html'),'utf8');
 const knowledge=knowledgeHtml??fs.readFileSync(path.join(folder,'knowledge.html'),'utf8');
 const standard=require(path.join(root,'tools/patient-visual-standard-v08443.cjs'));
 const source=sourceParts(guide,card,input,profile,standard.renderScheduleGraphic(standard.profileModel(profile,route,root)));
 const guideHead=find(guide,n=>n.tag==='head'),cardHead=find(card,n=>n.tag==='head'),inputHead=find(input,n=>n.tag==='head');
 if(!guideHead||!inputHead)throw Error('Expected complete authored guide and portal documents');
 const rel=path.posix.relative('patient/'+route,'assets/patient/patient-overview-v08445.css');
 const authoredSheets=new Map(),sheets=new Map();
 for(const value of [inner(guide,guideHead),cardHead?inner(card,cardHead):'']){
  for(const item of elements(value).filter(n=>n.tag==='style'||(n.tag==='link'&&attr(n,'rel')==='stylesheet'))){
   const html=outer(value,item);authoredSheets.set(attr(item,'href')||sha(html),html);
  }
 }
 for(const item of elements(inner(input,inputHead)).filter(n=>n.tag==='style'||(n.tag==='link'&&attr(n,'rel')==='stylesheet'))){
  const html=outer(inner(input,inputHead),item),key=attr(item,'href')||sha(html);
  if(key!==rel&&!authoredSheets.has(key))sheets.set(key,html);
 }
 for(const [key,value] of authoredSheets)sheets.set(key,value);
 sheets.set(rel,'<link rel="stylesheet" href="'+rel+'">');
 let head=omit(inner(input,inputHead),n=>n.tag==='style'||(n.tag==='link'&&attr(n,'rel')==='stylesheet'))+[...sheets.values()].join('');
 const descriptions=[['My schedule and checks','Know the plan before your next visit.'],['My side-effect map','Recognise changes and know when to call.'],['My card and contacts','Keep practical help and your treatment details to hand.']];
 let panels=source.panels.map((body,i)=>'<section class="po45-panel" id="overview-'+(i+1)+'" aria-labelledby="overview-title-'+(i+1)+'"><header class="po45-panel-heading"><p class="po45-step">'+(i+1)+' / 3 · My treatment essentials</p><h2 id="overview-title-'+(i+1)+'">'+descriptions[i][0]+'</h2><p>'+descriptions[i][1]+'</p></header><div class="po45-content">'+body+'</div></section>').join('');
 if(!find(panels,n=>attr(n,'id')==='urgent')){
  const urgent=find(panels,n=>hasClass(n,'pt-urgent')||hasClass(n,'suite-red'));
  if(urgent)panels=panels.slice(0,urgent.start)+panels.slice(urgent.start).replace(/^<([a-z][^\s>]*)/i,'<$1 id="urgent"');
  else panels=panels.replace('id="overview-2"','id="overview-2" data-urgent-destination="true"');
 }
 const knowledgeIds=new Set(elements(knowledge).map(n=>attr(n,'id')).filter(Boolean));
 const anchor=(...ids)=>{const id=ids.find(x=>knowledgeIds.has(x));return 'knowledge.html'+(id?'#'+id:'');};
 const destinations=[
  ['my-treatment','Understand my treatment','Why it is offered and how the medicines work.',anchor('medicines','understanding')],
  ['my-tests','My complete schedule and checks','The detailed treatment stages, tests and preparation plan.',anchor('monitoring-schedule','phases')],
  ['between-treatments','Living with treatment','Detailed symptom advice, practical care and support.',anchor('support','daily-life','living')],
  ['my-passport','My treatment passport','Record my cycles or reviews, symptoms and questions.','passport.html'],
  ['my-resources','Sources and further help','The evidence behind this information and additional resources.',anchor('sources')]
 ];
 const companionGroups={
  'my-tests':[['treatment-journey.html','My treatment journey'],['logistics.html','Preparing for treatment visits'],['port-pump.html','My line and pump']],
  'between-treatments':[['supportive-care.html','My prescribed supportive care']],
  'my-passport':[['sactcard.html','My standalone treatment card'],['sactcard.pdf','Download my treatment card']]
 };
 const deeper=destinations.map(([id,title,purpose,href])=>{
  const companions=(companionGroups[id]||[]).filter(([name])=>fs.existsSync(path.join(folder,name)));
  const extras=companions.length?'<ul class="po45-companion-links">'+companions.map(([name,label])=>'<li><a href="'+name+'"'+(name.endsWith('.pdf')?' download':'')+'>'+label+'</a></li>').join('')+'</ul>':'';
  return '<article class="po45-destination" id="'+id+'"><h3><a href="'+href+'">'+title+'</a></h3><p>'+purpose+'</p><a class="po45-read-more" href="'+href+'">Read more <span aria-hidden="true">→</span></a>'+extras+'</article>';
 }).join('');
 const urgentHref=find(panels,n=>attr(n,'id')==='urgent')?'#urgent':'#overview-2';
 const body='<body class="ps-body pt-body-page po45-body" data-patient-overview="0.84.45" data-overview-source="'+sha(guide)+'" data-overview-mode="'+source.mode+'"><a class="pt-skip" href="#main">Skip to treatment information</a><div class="po45-top"><a href="./">SACTCheck · My treatment</a><a href="'+urgentHref+'">I feel unwell / urgent help</a></div><main id="main" class="po45-shell"><header class="po45-introduction"><p class="po45-kicker">My treatment essentials</p><h1>'+esc(profile.title)+'</h1><p>Start with these three sections. Your complete information and personal record follow below.</p><div class="po45-downloads"><a href="guide.pdf" download>'+ (source.modern?'Download my three-page pack':'Download my treatment guide')+'</a><a href="handbook.pdf" download>Download my complete handbook</a></div></header>'+panels+'<section id="more-information" class="po45-deeper"><header><p class="po45-kicker">When I want more detail</p><h2>My complete treatment information</h2><p>Each section has a different purpose. Choose the information you need.</p></header><div class="po45-destinations">'+deeper+'</div><p class="po45-full-reference"><a href="knowledge.html">Read the full OncoWiki</a> · <a href="knowledge.pdf" download>Download the treatment reference</a></p></section><footer class="po45-footer">SACTCheck · Feasibility build · clinical and patient review pending. Your team confirms your personal treatment plan.</footer></main>';
 const connectors=elements(input).filter(n=>n.tag==='script'&&/hcc-connectors/.test(attr(n,'src')||'')).map(n=>outer(input,n)).join('');
 return '<!doctype html><html lang="en-IE"><head>'+head+'</head>'+body+connectors+'</body></html>';
}
module.exports={buildOverview,transformHtml:buildOverview,elements,mainSections,sourceParts};
