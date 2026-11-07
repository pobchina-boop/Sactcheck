#!/usr/bin/env node
'use strict';
/**
 * Add the shared visual standard without replacing authored clinical markup.
 * Discovery is intentionally dynamic: future completed base/context bundles
 * receive the same presentation when patient:ui runs. Release migration scope
 * and baseline provenance are verified separately by the release migration gate.
 */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const standard=require('./patient-visual-standard-v08443.cjs');
const DEFAULT_ROOT=path.resolve(__dirname,'..');
const FILES=['index.html','guide.html','knowledge.html','knowledge-print.html'];
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
function discoverRoutes(root=DEFAULT_ROOT){
  const profiles=[];
  const base=path.join(root,'data/patient-knowledge');
  for(const name of fs.readdirSync(base).sort())if(/^\d{5}\.json$/.test(name))profiles.push(name.slice(0,-5));
  const contexts=path.join(root,'data/patient-knowledge-contexts');
  if(fs.existsSync(contexts))for(const entry of fs.readdirSync(contexts,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
    if(!entry.isDirectory()||!/^\d{5}$/.test(entry.name))continue;
    for(const name of fs.readdirSync(path.join(contexts,entry.name)).sort())if(/^[a-z0-9_]+\.json$/.test(name))profiles.push(entry.name+'/'+name.slice(0,-5));
  }
  return [...new Set(profiles)].sort().filter(route=>fs.existsSync(path.join(root,'patient',route,'guide.html'))&&fs.existsSync(path.join(root,'patient',route,'knowledge.html')));
}
function plan(root=DEFAULT_ROOT,routes=discoverRoutes(root)){
  const changes=[],documents=[],untouchedMirrors=[];
  for(const route of routes){
    const profile=standard.readProfile(route,root);
    for(const name of FILES){
      const file=path.posix.join('patient',route,name),full=path.join(root,file);
      if(!fs.existsSync(full))continue;
      const original=fs.readFileSync(full,'utf8');
      const transformed=standard.transformHtml(original,profile,route,file,{root});
      if(standard.stripStandard(transformed.html)!==standard.stripStandard(original))throw new Error(file+': source preservation failed');
      const again=standard.transformHtml(transformed.html,profile,route,file,{root});
      if(again.html!==transformed.html)throw new Error(file+': transformation is not idempotent');
      const changed=original!==transformed.html;
      documents.push({file,route,layout:transformed.status,guideDensity:transformed.guideDensity,guideWordCount:transformed.guideWordCount,changed,original_sha256:sha(original),result_sha256:sha(transformed.html),authored_html_retained:true});
      if(changed)changes.push({file,original,html:transformed.html});
      const mirror=path.posix.join('docs',file),mirrorFull=path.join(root,mirror);
      if(fs.existsSync(mirrorFull)){
        const existing=fs.readFileSync(mirrorFull,'utf8');
        // Redirect-only compatibility pages remain redirects. Keep authored
        // byte-identical mirrors paired, as the existing patient UI refresh does.
        if(existing===original){
          if(changed)changes.push({file:mirror,original:existing,html:transformed.html});
        }else if(existing!==transformed.html)untouchedMirrors.push(mirror);
      }
    }
  }
  return {changes,documents,untouchedMirrors};
}
function run(options={}){
  const root=path.resolve(options.root||DEFAULT_ROOT),known=discoverRoutes(root);
  const routes=options.routes?.length?options.routes:known;
  const unknown=routes.filter(route=>!known.includes(route));
  if(unknown.length)throw new Error('Routes do not have authored guide/reference bundles: '+unknown.join(', '));
  const prepared=plan(root,routes);
  const report={release:standard.currentRelease(root),design:'v08443',mode:options.write?'write':options.check?'check':'plan',discovered_routes:known.length,selected_routes:routes.length,routes,documents:prepared.documents,planned_files:prepared.changes.map(c=>c.file),unchanged_compatibility_pages:prepared.untouchedMirrors,authored_html_retained:true,idempotent:true};
  // Validate the complete plan before writing any file. Refuse stale inputs,
  // so a concurrent clinical edit cannot be overwritten by the decoration pass.
  for(const change of prepared.changes)if(fs.readFileSync(path.join(root,change.file),'utf8')!==change.original)throw new Error('Concurrent source change: '+change.file);
  if(options.write)for(const change of prepared.changes)fs.writeFileSync(path.join(root,change.file),change.html);
  if(options.report){const reportFile=path.resolve(options.report);fs.mkdirSync(path.dirname(reportFile),{recursive:true});fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n');}
  const modern=prepared.documents.filter(d=>d.layout==='modern-guide'),legacy=prepared.documents.filter(d=>d.layout==='legacy-guide');
  console.log(JSON.stringify({release:report.release,mode:report.mode,routes:routes.length,documents:prepared.documents.length,modern_guides:modern.length,legacy_guides:legacy.length,normal_guides:modern.filter(d=>d.guideDensity==='normal').length,compact_guides:modern.filter(d=>d.guideDensity==='compact').length,files_needing_update:prepared.changes.length,authored_html_retained:true,idempotent:true,report:options.report||null},null,2));
  if(options.check&&prepared.changes.length)process.exitCode=1;
  return report;
}
function argumentsFrom(argv){
  const options={};
  for(let i=0;i<argv.length;i++){
    const arg=argv[i];
    if(arg==='--write')options.write=true;
    else if(arg==='--check')options.check=true;
    else if(arg==='--root')options.root=argv[++i];
    else if(arg==='--report')options.report=argv[++i];
    else if(arg==='--routes'){const value=argv[++i];if(!value)throw new Error('--routes needs all or a comma-separated list');if(value!=='all')options.routes=[...new Set(value.split(',').filter(Boolean))];}
    else if(arg==='--help'){console.log('Usage: node tools/apply-patient-visual-standard-v08443.cjs [--write | --check] [--routes all|00642,00226/lung] [--root PATH] [--report PATH]');return null;}
    else throw new Error('Unknown argument: '+arg);
  }
  if(options.write&&options.check)throw new Error('Choose --write or --check');
  return options;
}
module.exports={discoverRoutes,plan,run};
if(require.main===module){const options=argumentsFrom(process.argv.slice(2));if(options)run(options);}
