'use strict';
// Patch only the existing UI fragments. Do not regenerate protected patient content.
const fs=require('node:fs'),path=require('node:path');
const Chronology=require('./adt-chronology-v08452.cjs');
const SUPPORT_LABEL='Supportive medicines: medicine, dose and timing';
const SUPPORT_HINT='<p class="support-table-hint no-print">Scroll the table sideways to read all medicine, dose and timing columns.</p>';
const SUPPORT_WRAPPER=`<div class="support-table-scroll" role="region" tabindex="0" aria-label="${SUPPORT_LABEL}">`;
// Cache identity follows the unchanged support UI asset, not each content batch.
const SUPPORT_UI_RELEASE='0.84.45';

function attribute(tag,name){
 const escaped=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const m=tag.match(new RegExp(`(?:^|\\s)${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,'i'));
 return m?(m[1]??m[2]??m[3]):null;
}
const hasClass=(tag,name)=>(attribute(tag,'class')||'').split(/\s+/).includes(name);
function tags(html){
 const out=[],pattern=/<!--[\s\S]*?-->|<\/?[a-z][a-z0-9:-]*\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi;
 for(let m;(m=pattern.exec(html));){
  if(m[0].startsWith('<!--'))continue;
  const n=m[0].match(/^<(\/)?([a-z][a-z0-9:-]*)/i),t={start:m.index,end:pattern.lastIndex,raw:m[0],name:n[2].toLowerCase(),closing:!!n[1]};
  out.push(t);
  if(!t.closing&&['script','style'].includes(t.name)){
   const closing=new RegExp(`</${t.name}\\s*>`,'ig');closing.lastIndex=t.end;
   const end=closing.exec(html);if(!end)throw new Error(`Unclosed ${t.name} element`);
   pattern.lastIndex=closing.lastIndex;
  }
 }
 return out;
}
function elementRange(all,opening){
 let depth=0;
 for(const t of all){
  if(t.start<opening.start||t.name!==opening.name)continue;
  depth+=t.closing?-1:1;
  if(depth===0)return {start:opening.start,end:t.end,opening};
 }
 throw new Error(`Unclosed ${opening.name} element at ${opening.start}`);
}
function replaceRanges(html,replacements){
 for(const r of replacements.sort((a,b)=>b.start-a.start))html=html.slice(0,r.start)+r.text+html.slice(r.end);
 return html;
}
function pumpLabelOnlyChange(before,after){
 function bands(html){
  const all=tags(html),out=[];
  for(const track of all.filter(t=>!t.closing&&t.name==='div'&&attribute(t.raw,'data-cycle-track')==='pump')){
   const range=elementRange(all,track),labels=all.filter(t=>!t.closing&&t.name==='span'&&t.start>range.start&&t.end<range.end&&hasClass(t.raw,'wiki-cycle-band'));
   if(labels.length!==1)throw new Error('Pump chronology requires one authored timing band');
   const band=labels[0],end=elementRange(all,band),closing=all.find(t=>t.closing&&t.end===end.end);
   out.push({start:band.end,end:closing.start,text:html.slice(band.end,closing.start)});
  }
  return out;
 }
 const previous=bands(before),updated=bands(after);
 if(!previous.length||previous.length!==updated.length||updated.some(band=>/[<>]/.test(band.text)))return false;
 return replaceRanges(before,previous.map((band,index)=>({...band,text:updated[index].text})))===after;
}
function refreshKnowledge(html,profile){
 const all=tags(html),primary=all.filter(t=>!t.closing&&attribute(t.raw,'id')==='wikiCycleChronology');
 const wrappers=all.filter(t=>!t.closing&&hasClass(t.raw,'phase-cycle-maps'));
 if(primary.length===0){
  // Some mapped routes retain the established interactive cycle presentation.
  // Its controls, dates and full text must not be replaced by a static chart.
  const interactive=all.some(t=>hasClass(t.raw,'pk-chart'))&&all.some(t=>attribute(t.raw,'id')==='pk-phase')&&all.some(t=>attribute(t.raw,'id')==='pk-start');
  if(interactive&&wrappers.length===0)return {html,status:'preserved-interactive'};
  throw new Error('Expected one existing chronology, or the recognized interactive cycle presentation');
 }
 if(primary.length!==1||primary[0].name!=='div'||wrappers.length>1)throw new Error('Unexpected chronology roots');
 if(hasClass(primary[0].raw,'endocrine-timeline')){
  const authored=profile.endocrine_timeline,kind=attribute(primary[0].raw,'data-schedule-kind');
  const knownSchema=authored&&Array.isArray(authored.columns)&&authored.columns.length>0&&Array.isArray(authored.rows)&&authored.rows.length>0;
  const existingContinuous=kind==='continuous_oral'&&profile.cycle_days===null&&Array.isArray(profile.timeline)&&profile.timeline.length===0;
  if(kind!==profile.schedule_kind||(!knownSchema&&!existingContinuous)||wrappers.length)throw new Error('Unrecognized specialized timeline schema');
  return {html,status:kind==='continuous_oral'?'preserved-continuous-oral':'preserved-specialized'};
 }
 if(attribute(primary[0].raw,'class')!=='wiki-cycle-map')throw new Error('Unrecognized static chronology variant');
 const cycles=Array.isArray(profile.phase_cycles)&&profile.phase_cycles.length?profile.phase_cycles.map(phase=>({...profile,...phase})): [profile];
 if(cycles.some(cycle=>!Number.isInteger(cycle.cycle_days)||cycle.cycle_days<1||!Array.isArray(cycle.timeline)||cycle.timeline.length===0))throw new Error('Generic chronology requires a positive cycle length and authored timeline');
 let range=elementRange(all,primary[0]);
 if(wrappers.length){
  if(wrappers[0].name!=='div'||!Array.isArray(profile.phase_cycles)||!profile.phase_cycles.length)throw new Error('Phase chronology wrapper does not match an authored phase array');
  const outer=elementRange(all,wrappers[0]);
  if(outer.start>=range.start||outer.end<range.end)throw new Error('Phase chronology wrapper does not contain the primary chronology');
  range=outer;
 }
 const rendered=Chronology.render(profile);
 return {html:html.slice(0,range.start)+rendered+html.slice(range.end),status:'static-chronology',range};
}
function refreshSupport(html,file){
 const all=tags(html),heads=all.filter(t=>t.name==='head'&&t.closing),bodies=all.filter(t=>t.name==='body'&&!t.closing);
 if(heads.length!==1||bodies.length!==1)throw new Error('Expected one head and body on a support page');
 const rootRelative=path.posix.relative(path.posix.dirname(file.replaceAll('\\','/')),'assets/patient/clinical-screen.css');
 const links=all.filter(t=>t.name==='link'&&/(?:^|\/)clinical-screen\.css(?:[?#]|$)/.test(attribute(t.raw,'href')||''));
 const changes=[];
 if(links.length>1)throw new Error('Duplicate clinical-screen stylesheet links');
 if(links.length&&attribute(links[0].raw,'href')!==rootRelative)throw new Error('Unexpected clinical-screen stylesheet route');
 if(!links.length)changes.push({start:heads[0].start,end:heads[0].start,text:`<link rel="stylesheet" href="${rootRelative}">`});
 if(!hasClass(bodies[0].raw,'clinical-support-page')){
  const raw=bodies[0].raw;
  const updated=attribute(raw,'class')===null?raw.replace(/>$/,' class="clinical-support-page">'):raw.replace(/(\bclass\s*=\s*)(["'])(.*?)\2/i,(_,prefix,quote,classes)=>`${prefix}${quote}${classes}${classes?' ':''}clinical-support-page${quote}`);
  if(updated===raw)throw new Error('Unsupported body class attribute');
  changes.push({start:bodies[0].start,end:bodies[0].end,text:updated});
 }
 // Selectors and source-authored single plans share the same guidance/script
 // controls. Only presentation markers and the shared-script URL change;
 // existing medicine, dose, timing, scope and source text stays untouched.
 let scriptView=null;
 if(path.posix.basename(file.replaceAll('\\','/'))==='supportive-care.html'){
  const selector=all.some(t=>!t.closing&&t.name==='select'&&attribute(t.raw,'id')==='support-phase');
  scriptView=selector?'phase-selector':'single-plan';
  if(!selector){
   const mains=all.filter(t=>!t.closing&&t.name==='main');
   if(mains.length!==1)throw new Error('Standalone support plan requires one main element');
   const main=mains[0],range=elementRange(all,main),headings=all.filter(t=>!t.closing&&t.name==='h1'&&t.start>range.start&&t.end<range.end);
   if(headings.length!==1)throw new Error('Standalone support plan requires one treatment heading');
   const heading=headings[0];
   const nested=all.some(t=>!t.closing&&['div','section','article','header','nav'].includes(t.name)&&t.start>main.start&&t.start<heading.start&&elementRange(all,t).end>heading.end);
   if(nested)throw new Error('Standalone support treatment heading must be a direct main child');
   const marker=attribute(main.raw,'data-support-single-phase');
   if(marker!==null&&marker!=='true')throw new Error('Unexpected single-plan support marker');
   if(marker===null)changes.push({start:main.start,end:main.end,text:main.raw.replace(/>$/,' data-support-single-phase="true">')});
  }
  const scriptRelative=path.posix.relative(path.posix.dirname(file.replaceAll('\\','/')),'assets/patient/phase-support-v0838.js');
  const expected=`${scriptRelative}?v=${SUPPORT_UI_RELEASE}`;
  const scripts=all.filter(t=>!t.closing&&t.name==='script'&&/(?:^|\/)phase-support-v0838\.js(?:[?#]|$)/.test(attribute(t.raw,'src')||''));
  if(scripts.length>1)throw new Error('Duplicate shared support scripts');
  if(scripts.length){
   const current=attribute(scripts[0].raw,'src');
   if(current.split(/[?#]/)[0]!==scriptRelative)throw new Error('Unexpected shared support script route');
   if(current!==expected){
    const updated=scripts[0].raw.replace(/(\bsrc\s*=\s*)(["'])(.*?)\2/i,(_,prefix,quote)=>`${prefix}${quote}${expected}${quote}`);
    if(updated===scripts[0].raw)throw new Error('Unsupported shared support script attribute');
    changes.push({start:scripts[0].start,end:scripts[0].end,text:updated});
   }
  }else{
   const endings=all.filter(t=>t.name==='body'&&t.closing);
   if(endings.length!==1)throw new Error('Expected one closing body on a support page');
   changes.push({start:endings[0].start,end:endings[0].start,text:`<script src="${expected}"></script>`});
  }
 }
 const tables=all.filter(t=>t.name==='table'&&!t.closing),wrappers=all.filter(t=>!t.closing&&hasClass(t.raw,'support-table-scroll'));
 const tableRanges=tables.map(t=>elementRange(all,t));
 for(const range of tableRanges){
  if(tableRanges.some(other=>other!==range&&other.start>range.start&&other.end<range.end))throw new Error('Nested support tables are not supported');
  const parents=wrappers.map(t=>elementRange(all,t)).filter(r=>r.start<range.start&&r.end>range.end);
  if(parents.length>1)throw new Error('Nested support-table-scroll regions');
  if(parents.length){
   const parent=parents[0],open=parent.opening;
   if(open.name!=='div'||attribute(open.raw,'role')!=='region'||attribute(open.raw,'tabindex')!=='0'||attribute(open.raw,'aria-label')!==SUPPORT_LABEL)throw new Error('Unexpected support table region attributes');
   if(html.slice(open.end,range.start).trim()||!/^\s*<\/div>$/i.test(html.slice(range.end,parent.end)))throw new Error('Unexpected content inside support table region');
   if(!html.slice(0,parent.start).trimEnd().endsWith(SUPPORT_HINT))throw new Error('Missing support table scroll hint');
  }else changes.push({start:range.start,end:range.end,text:SUPPORT_HINT+SUPPORT_WRAPPER+html.slice(range.start,range.end)+'</div>'});
 }
 if(wrappers.length!==tableRanges.filter(r=>wrappers.some(w=>{const p=elementRange(all,w);return p.start<r.start&&p.end>r.end;})).length)throw new Error('Empty or shared support table region');
 return {html:replaceRanges(html,changes),tables:tables.length,scriptView};
}
function walk(directory){
 return fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(directory,entry.name)):[path.join(directory,entry.name)]);
}
function planRefresh(root){
 if(!fs.existsSync(path.join(root,'assets/patient/clinical-screen.css')))throw new Error('Missing shared clinical-screen stylesheet');
 // Compare the finished publication, including first-use explanations, with
 // the stored page. The fragment renderers remain independent and exact;
 // reduced fixture roots without a publication module retain that contract.
 const publicationFile=path.join(root,'tools/patient-publication-v08444.cjs');
 const publication=fs.existsSync(publicationFile)?require(publicationFile):null;
 const finish=(file,html)=>publication?publication.decorateGenerated(file,html,root):html;
 const config=JSON.parse(fs.readFileSync(path.join(root,'data/patient-presentation-v08431.json'),'utf8'));
 const changes=[],report={knowledge:{mapped:0,discovered:0,static:0,additionalProfiles:[],preservedInteractive:[],preservedContinuousOral:[],preservedSpecialized:[],preservedUnrelatedDrift:[]},support:{pages:0,tables:0},mirrors:{updated:0,preserved:[]},changed:[]};
 function stage(file,before,after,kind){
  if(before===after)return;
  changes.push({file,before,after});report.changed.push({file,kind});
  const mirror=path.posix.join('docs',file),absolute=path.join(root,mirror);
  if(!fs.existsSync(absolute))return;
  const original=fs.readFileSync(absolute,'utf8');
  if(original===before){changes.push({file:mirror,before:original,after});report.changed.push({file:mirror,kind:'html-mirror'});report.mirrors.updated++;}
  else report.mirrors.preserved.push(mirror);
 }
 const inspected=new Set();
 function inspectChronology(file,route,source,mapped){
  if(!/^\d{5}(?:\/[a-z0-9_]+)?$/.test(route)||!source.startsWith('data/')||source.split('/').includes('..'))throw new Error(`Unsafe presentation mapping: ${route}`);
  if(!fs.existsSync(path.join(root,source)))throw new Error(`${file}: no matching explicit patient profile (${source})`);
  const before=fs.readFileSync(path.join(root,file),'utf8'),profile=JSON.parse(fs.readFileSync(path.join(root,source),'utf8'));
  if(String(profile.code)!==route.split('/')[0])throw new Error(`${file}: patient profile code does not match its route`);
  const result=refreshKnowledge(before,profile);result.html=finish(file,result.html);inspected.add(file);
  if(mapped)report.knowledge.mapped++;
  else {report.knowledge.discovered++;if(!report.knowledge.additionalProfiles.includes(source))report.knowledge.additionalProfiles.push(source);}
  if(result.status==='preserved-interactive')report.knowledge.preservedInteractive.push(file);
  else if(result.status==='preserved-continuous-oral')report.knowledge.preservedContinuousOral.push(file);
  else if(result.status==='preserved-specialized')report.knowledge.preservedSpecialized.push(file);
  else report.knowledge.static++;
  if(!mapped&&result.html!==before&&!pumpLabelOnlyChange(before,result.html)){
   const pumpProfiles=Array.isArray(profile.phase_cycles)?profile.phase_cycles.map(phase=>({...profile,...phase})): [profile];
   if(pumpProfiles.some(p=>p.timeline?.some(row=>row.id==='pump')))throw new Error(`${file}: discovered pump chronology differs beyond its authored timing label`);
   report.knowledge.preservedUnrelatedDrift.push(file);return;
  }
  stage(file,before,result.html,'chronology');
 }
 for(const [route,source]of Object.entries(config.routes))inspectChronology(`patient/${route}/knowledge.html`,route,source,true);
 const patientFiles=walk(path.join(root,'patient')).sort();
 // Older reference portals also embed this same chronology. Resolve each to
 // its explicit profile, while keeping independently authored variants intact.
 for(const absolute of patientFiles.filter(f=>/\/(index|knowledge)\.html$/.test(f.replaceAll('\\','/')))){
  const file=path.relative(root,absolute).replaceAll('\\','/');if(inspected.has(file))continue;
  const before=fs.readFileSync(absolute,'utf8');if(!before.includes('wikiCycleChronology')||!tags(before).some(t=>!t.closing&&attribute(t.raw,'id')==='wikiCycleChronology'))continue;
  const match=file.match(/^patient\/(\d{5}(?:\/[a-z0-9_]+)?)\/(?:index|knowledge)\.html$/);
  if(!match)throw new Error(`Unrecognized static chronology route: ${file}`);
  const route=match[1],source=config.routes[route]||(route.includes('/')?`data/patient-knowledge-contexts/${route}.json`:`data/patient-knowledge/${route}.json`);
  inspectChronology(file,route,source,false);
 }
 for(const absolute of patientFiles.filter(f=>/\/(supportive-care|support-[^/]+)\.html$/.test(f.replaceAll('\\','/')))){
  const file=path.relative(root,absolute).replaceAll('\\','/'),before=fs.readFileSync(absolute,'utf8'),result=refreshSupport(before,file);
  report.support.pages++;report.support.tables+=result.tables;stage(file,before,finish(file,result.html),'support');
 }
 const css='assets/patient/cycle-chronology-v0831.css',cssAbsolute=path.join(root,css),before=fs.existsSync(cssAbsolute)?fs.readFileSync(cssAbsolute,'utf8'):null;
 if(before!==Chronology.stylesheet){changes.push({file:css,before,after:Chronology.stylesheet});report.changed.push({file:css,kind:'chronology-stylesheet'});}
 return {changes,report};
}
function applyRefresh(root,plan){
 // Validate every input before the first write, including concurrent editor changes.
 for(const change of plan.changes){const file=path.join(root,change.file),current=fs.existsSync(file)?fs.readFileSync(file,'utf8'):null;if(current!==change.before)throw new Error(`Input changed since planning: ${change.file}`);}
 for(const change of plan.changes){const file=path.join(root,change.file);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,change.after);}
}
if(require.main===module){
 try{
  const args=process.argv.slice(2),allowed=new Set(['--root','--write','--dry-run','--check','--json']);
  let root=path.resolve(__dirname,'..');
  for(let i=0;i<args.length;i++){if(!allowed.has(args[i]))throw new Error(`Unknown argument: ${args[i]}`);if(args[i]==='--root'){if(!args[i+1])throw new Error('--root requires a directory');root=path.resolve(args[++i]);}}
  if(args.includes('--write')&&(args.includes('--dry-run')||args.includes('--check')))throw new Error('--write cannot be combined with a read-only mode');
  const plan=planRefresh(root);if(args.includes('--write'))applyRefresh(root,plan);
  if(args.includes('--json'))console.log(JSON.stringify(plan.report,null,2));
  else console.log(`${args.includes('--write')?'Refreshed':'Inspected'} ${plan.report.knowledge.static} generic static chronologies (${plan.report.knowledge.mapped} mapped and ${plan.report.knowledge.discovered} additional reference pages inspected; ${plan.report.knowledge.preservedInteractive.length} interactive, ${plan.report.knowledge.preservedContinuousOral.length} continuous-oral and ${plan.report.knowledge.preservedSpecialized.length} other specialized timelines preserved; ${plan.report.knowledge.preservedUnrelatedDrift.length} unrelated renderer differences preserved), ${plan.report.support.pages} support pages / ${plan.report.support.tables} tables; ${plan.changes.length} ${args.includes('--write')?'updated':'pending'} files.`);
  if(args.includes('--check')&&plan.changes.length)process.exitCode=1;
 }catch(error){console.error(`Patient UI refresh failed: ${error.message}`);process.exitCode=1;}
}
module.exports={refreshKnowledge,refreshSupport,planRefresh,applyRefresh,SUPPORT_LABEL,SUPPORT_HINT,SUPPORT_WRAPPER};
