'use strict';
/** Restore exact reviewed companion clauses to their existing OncoWiki homes. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {elements}=require('./patient-overview-v08445.cjs');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const cache=new Map();
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function decode(s){return s.replace(/&#(?:x([0-9a-f]+)|(\d+));/gi,(_,hex,dec)=>String.fromCodePoint(parseInt(hex||dec,hex?16:10))).replace(/&(amp|lt|gt|quot|apos|nbsp|ndash|mdash|rsquo|lsquo);/g,(_,x)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',ndash:'–',mdash:'—',rsquo:'’',lsquo:'‘'}[x]));}
function attr(node,name){const m=node.open.match(new RegExp('\\s'+name+'\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))','i'));return m&&(m[1]??m[2]??m[3]);}
function plain(s){return decode(s.replace(/<(script|style|svg)\b[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<!--[\s\S]*?-->/g,'').replace(/<[^>]*>/g,' '));}
function context(root,planPath){
 const file=planPath||[path.join(root,'data/patient-canonical-retention-v08445.json'),path.join(__dirname,'patient-canonical-retention-v08445.json')].find(fs.existsSync);
 if(!file)throw Error('Missing explicit v45 canonical-retention plan');
 const key=root+'\n'+file;if(cache.has(key))return cache.get(key);
 const plan=JSON.parse(fs.readFileSync(file,'utf8'));
 if(hash(fs.readFileSync(path.join(root,plan.historical_audit)))!==plan.historical_audit_sha256)throw Error('Historical retention review changed');
 const terms=require(path.join(root,'tools/patient-editorial-v08444.cjs')).TERMS;
 if(hash(JSON.stringify(terms))!==plan.normalization.terms_sha256)throw Error('Reviewed acronym normalization changed');
 const raw=x=>decode(String(x)).normalize('NFKC').replace(/\u00ad/g,'').replace(/[^\p{L}\p{N}_]/gu,'').toLowerCase();
 const expansions=terms.map(([short,full])=>[raw(full+short),raw(short)]).sort((a,b)=>b[0].length-a[0].length);
 const norm=x=>{let result=raw(x);for(const [a,b] of expansions)result=result.split(a).join(b);return result;};
 const value={plan,norm};cache.set(key,value);return value;
}
function restoreCanonical(input,{root=process.cwd(),route,documentKind='knowledge.html',planPath}={}){
 if(!/^knowledge(?:\.html)?$/.test(documentKind))return {html:input,changes:[]};
 const {plan,norm}=context(root,planPath),rows=plan.rows.filter(x=>x.route===route);
 let output=input;const changes=[];
 for(const row of rows){
  if(hash(fs.readFileSync(path.join(root,row.source_file)))!==row.source_file_sha256)throw Error('Reviewed source changed: '+row.source_file);
  if(row.reviewed_counterpart_variants.length)continue;
  if(norm(plain(output)).includes(norm(row.display_clause)))continue;
  let nodes=elements(output),section=nodes.find(n=>attr(n,'id')===row.target_id);
  if(!section){
   // Legacy books may have the practical support chapter but no embedded
   // logistics subsection. Create only a named home for reviewed source
   // clauses inside that chapter; never invent clinical replacement prose.
   const parents=nodes.filter(n=>attr(n,'id')==='support'&&n.tag==='section');
   if(!parents.length)throw Error('Reviewed clause needs an existing practical-support chapter on '+route);
   const parent=parents.at(-1),titles={'treatment-logistics':'Practical treatment details','port-pump':'Your line or pump plan','treatment-journey':'Your treatment and checks'};
   const container='<section id="'+row.target_id+'" class="book44-companion-section" data-canonical-retention-home-v45="1"><h3>'+titles[row.target_id]+'</h3></section>';
   output=output.slice(0,parent.innerEnd)+container+output.slice(parent.innerEnd);
   nodes=elements(output);section=nodes.find(n=>attr(n,'id')===row.target_id);
  }
  const headings=nodes.filter(n=>['h2','h3','h4'].includes(n.tag)&&n.start>section.start&&n.end<section.end&&norm(plain(output.slice(n.innerStart,n.innerEnd)))===norm(row.source_heading));
  const p='<p data-canonical-retention-v45="1" data-book44-companion-source="'+esc(row.source_file)+'" data-book44-source-unit="'+row.source_unit_sha256+'" data-book44-companion-heading="'+esc(row.source_heading)+'">'+esc(row.display_clause)+'</p>';
  let target=section,insert=p;
  if(headings.length===1&&headings[0].parent&&['article','section','div'].includes(headings[0].parent.tag))target=headings[0].parent;
  else insert='<article class="pk-card book44-companion-detail" data-canonical-retention-topic-v45="'+esc(row.source_heading)+'"><h3>'+esc(row.source_heading)+'</h3>'+p+'</article>';
  output=output.slice(0,target.innerEnd)+insert+output.slice(target.innerEnd);
  changes.push({source_file:row.source_file,source_xpath:row.source_xpath,source_clause:row.source_clause,display_clause:row.display_clause,target_document:'knowledge.html',target_id:row.target_id,source_heading:row.source_heading,reason:row.review_reason});
 }
 // Cross-unit deduplication is allowed only where the frozen review explicitly
 // names its reciprocal canonical clause. Require that clause in the result.
 const text=norm(plain(output));
 for(const row of rows){
  const variants=row.reviewed_counterpart_variants.length?row.reviewed_counterpart_variants:[row.display_clause];
  if(!variants.some(v=>text.includes(norm(v))))throw Error('Exact reviewed clause/counterpart not restored: '+route+' '+row.source_heading);
 }
 return {html:output,changes,source_clauses_checked:rows.length};
}
function enhanceKnowledge(html,options={}){return restoreCanonical(html,{...options,documentKind:'knowledge.html'}).html;}
// No missing record-specific counterpart was found in the v44 inventory. Keep
// passport source unchanged; do not duplicate logistics prose into worksheets.
function enhancePassport(html){return html;}
module.exports={restoreCanonical,enhanceKnowledge,enhancePassport};
