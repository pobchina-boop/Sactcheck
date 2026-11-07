'use strict';
// One final, idempotent publication pass for newly generated and existing
// patient pages. Clinical source revision and evidence remain separate.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ROOT = path.resolve(__dirname, '..');
const standard = require('./patient-visual-standard-v08443.cjs');
const discovery = require('./apply-patient-visual-standard-v08443.cjs');
const editorial = require('./patient-editorial-v08444.cjs');
const visual = require('./patient-visual-language-v08444.cjs');
const FILES = new Set(['index.html','guide.html','knowledge.html','knowledge-print.html','treatment-journey.html','logistics.html','passport.html','supportive-care.html','supportive-care-overview.html','consent.html']);
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const isRedirect = html => /<meta\b[^>]*\bhttp-equiv\s*=\s*(?:"\s*refresh\s*"|'\s*refresh\s*'|refresh(?=\s|\/?>))/i.test(html);

function target(file, root=ROOT) {
  const relative=(path.isAbsolute(file)?path.relative(root,file):file).split(path.sep).join('/');
  const m=relative.match(/^(?:docs\/)?patient\/(\d{5}(?:\/[a-z0-9_]+)?)\/([a-z0-9_-]+\.html)$/);
  if(!m||(!FILES.has(m[2])&&!/^support-[a-z0-9_-]+\.html$/.test(m[2])))return null;
  const profileFile=standard.sourcePath(m[1]);
  if(!fs.existsSync(path.join(root,profileFile)))return null;
  // Context selector pages are not authored treatment documents.
  if(m[2]==='index.html'&&!fs.existsSync(path.join(root,'patient',m[1],'guide.html')))return null;
  return {relative,route:m[1],name:m[2],profileFile};
}

function decorateGenerated(file,html,root=ROOT) {
  if(isRedirect(html))return html;
  root=path.resolve(root);
  const t=target(file,root);
  if(!t)return html;
  const data=JSON.parse(fs.readFileSync(path.join(root,t.profileFile),'utf8'));
  // Reinstall the v44 stylesheet after the shared v43 sheet on every pass.
  // Its location depends on whether this is a canonical page or a docs mirror.
  const clean=html.replace(/<link\b(?=[^>]*\bhref\s*=\s*["'][^"']*patient-(?:visual-language|distilled-print)-v08444\.css(?:\?[^"']*)?["'])[^>]*>/gi,'');
  const branded=['index.html','guide.html','knowledge.html','knowledge-print.html'].includes(t.name)
    ? standard.transformHtml(clean,data,t.route,t.relative,{root}).html
    : clean;
  let result=editorial.applyEditorial(branded,{route:t.route,documentKind:t.name.replace(/\.html$/,''),data,root});
  if(typeof result!=='string')throw Error('Editorial publication must return HTML: '+t.relative);
  const cssHref=path.posix.relative(path.posix.dirname(t.relative),'assets/patient/patient-visual-language-v08444.css');
  result=visual.upgradeVisualLanguage(result,{route:t.route,documentKind:t.name.replace(/\.html$/,''),file:t.relative,cssHref,data,root});
  if(typeof result!=='string')throw Error('Visual publication must return HTML: '+t.relative);
  // The visual pass can insert authored test panels. Expand their first-use
  // abbreviations in the same final text pass as the surrounding document.
  result=editorial.applyEditorial(result,{route:t.route,documentKind:t.name.replace(/\.html$/,''),data,root});
  if(typeof result!=='string')throw Error('Final editorial publication must return HTML: '+t.relative);
  if(t.name==='guide.html'){
    const printHref=path.posix.relative(path.posix.dirname(t.relative),'assets/patient/patient-distilled-print-v08444.css');
    result=result.replace(/<\/head>/i,`<link rel="stylesheet" href="${printHref}"></head>`);
  }
  if(t.relative.startsWith('docs/'))result=result.replace(/\b(href|src)=(["'])(?:\.\.\/)+((?:assets|js|data)\/[^"']+)\2/g,
    (_,attribute,quote,asset)=>`${attribute}=${quote}${path.posix.relative(path.posix.dirname(t.relative),asset)}${quote}`);
  return result;
}

function filesForRoute(root,route) {
  return fs.readdirSync(path.join(root,'patient',route)).filter(name=>FILES.has(name)||/^support-[a-z0-9_-]+\.html$/.test(name)).sort();
}

function mirrorFromCanonical(html,canonical,mirror) {
  // A full compatibility page is a view of the current canonical document,
  // never a second independently maintained source of patient information.
  // Rebase local URLs to their original targets so links also work when a
  // sibling HTML/PDF has no docs copy. Fragments, query-only links, absolute
  // URLs and raw script/style bodies retain their exact authored bytes.
  function relocate(value) {
    if(!value||/^(?:[a-z][a-z0-9+.-]*:|\/|#|\?)/i.test(value))return value;
    const match=value.match(/^([^?#]*)([?#][\s\S]*)?$/);
    const pathname=match[1],suffix=match[2]||'';
    const destination=path.posix.normalize(path.posix.join(path.posix.dirname(canonical),pathname));
    let relative=path.posix.relative(path.posix.dirname(mirror),destination)||'.';
    if(pathname.endsWith('/')&&!relative.endsWith('/'))relative+='/';
    return relative+suffix;
  }
  const tags=/<!--[\s\S]*?-->|<\/?[a-z][a-z0-9:-]*\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi;
  let output='',last=0;
  for(let match;(match=tags.exec(html));){
    const tag=match[0];
    if(/^<!--|^<\//.test(tag))continue;
    const rewritten=tag.replace(/(\s)(href|src|action|poster|data|xlink:href)(\s*=\s*)(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gi,
      (_,space,attribute,equals,double,single,bare)=>{
        const quote=double!==undefined?'"':single!==undefined?"'":'';
        return space+attribute+equals+quote+relocate(double??single??bare)+quote;
      });
    output+=html.slice(last,match.index)+rewritten;
    last=tags.lastIndex;
    const raw=tag.match(/^<(script|style)\b/i);
    if(raw){
      const closing=new RegExp('</'+raw[1]+'\\s*>','ig');
      closing.lastIndex=tags.lastIndex;
      if(!closing.exec(html))throw Error('Unclosed '+raw[1]+' element in '+canonical);
      tags.lastIndex=closing.lastIndex;
    }
  }
  return output+html.slice(last);
}

function run({root=ROOT,routes,write=false,check=false,mirrorsOnly=false,report}={}) {
  root=path.resolve(root);
  const known=[...new Set([...discovery.discoverRoutes(root),...JSON.parse(fs.readFileSync(path.join(root,'validation/patient-design-v08443/scope.json'),'utf8')).routes])].sort();
  routes=routes||known;
  for(const route of routes){
    if(!known.includes(route))throw Error('Unknown authored treatment route: '+route);
    for(const name of ['index.html','guide.html','knowledge.html','knowledge-print.html'])if(!fs.existsSync(path.join(root,'patient',route,name)))throw Error('Missing published patient document: patient/'+route+'/'+name);
  }
  const changes=[],documents=[],mirrors=[],fullMirrors=[];
  for(const route of routes)for(const name of filesForRoute(root,route)) {
    const file=path.posix.join('patient',route,name);
    const original=fs.readFileSync(path.join(root,file),'utf8');
    const html=decorateGenerated(file,original,root);
    if(decorateGenerated(file,html,root)!==html)throw Error('Non-idempotent patient publication: '+file);
    documents.push({file,route,before:sha(original),after:sha(html),changed:html!==original});
    if(html!==original)changes.push({file,original,html});
    const mirror=path.posix.join('docs',file),full=path.join(root,mirror);
    if(fs.existsSync(full)){
      const current=fs.readFileSync(full,'utf8');
      if(!isRedirect(current)){
        // The canonical pass above is already idempotent and complete. Rebase
        // that result once; re-running branding in the mirror would recreate
        // download links relative to a potentially incomplete docs directory.
        const transformed=mirrorFromCanonical(html,file,mirror);
        fullMirrors.push({file:mirror,canonical:file,before:sha(current),after:sha(transformed),changed:transformed!==current});
        if(transformed!==current)changes.push({file:mirror,original:current,html:transformed});
      }else mirrors.push(mirror);
    }
  }
  if(mirrorsOnly&&changes.some(item=>!item.file.startsWith('docs/patient/')))throw Error('Mirror-only publication requires already published canonical documents');
  for(const item of changes)if(fs.readFileSync(path.join(root,item.file),'utf8')!==item.original)throw Error('Concurrent patient-page edit: '+item.file);
  if(write)for(const item of changes)fs.writeFileSync(path.join(root,item.file),item.html);
  const result={release:JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version,mode:write?'write':check?'check':'plan',routes,documents,full_mirrors:fullMirrors,changed_files:changes.map(c=>c.file),retained_redirects:mirrors,idempotent:true};
  if(report){fs.mkdirSync(path.dirname(path.resolve(report)),{recursive:true});fs.writeFileSync(report,JSON.stringify(result,null,2)+'\n');}
  console.log(JSON.stringify({release:result.release,routes:routes.length,documents:documents.length,changed_files:changes.length,mode:result.mode,report:report||null},null,2));
  if(check&&changes.length)process.exitCode=1;
  return result;
}
module.exports={decorateGenerated,mirrorFromCanonical,run,target,FILES};
if(require.main===module){
 const options={};
 for(let i=2;i<process.argv.length;i++){const arg=process.argv[i];if(arg==='--write')options.write=true;else if(arg==='--check')options.check=true;else if(arg==='--mirrors-only')options.mirrorsOnly=true;else if(arg==='--root')options.root=process.argv[++i];else if(arg==='--report')options.report=process.argv[++i];else if(arg==='--routes'){const value=process.argv[++i];if(value!=='all')options.routes=value.split(',');}else throw Error('Unknown argument '+arg);}
 if(options.write&&options.check)throw Error('Choose --write or --check');run(options);
}
