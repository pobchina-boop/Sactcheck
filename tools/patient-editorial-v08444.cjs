'use strict';
/** Patient-only publication layer. Never rewrites scripts, attributes or rules. */
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const catalogue=require('./patient-editorial-replacements-v08444.json');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const decode=s=>s.replace(/&#(?:x([0-9a-f]+)|(\d+));|&(amp|lt|gt|quot|apos|nbsp);/gi,(m,h,n,name)=>h?String.fromCodePoint(parseInt(h,16)):n?String.fromCodePoint(Number(n)):({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '})[name.toLowerCase()]);
const escapeRx=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

// Expansions are patient language, not a glossary pasted into every chapter.
// Gene names such as BRAF remain names; their role is explained in authored text.
const TERMS=[
 ['GEP-NETs','gastroenteropancreatic neuroendocrine tumours'],['GEP-NET','gastroenteropancreatic neuroendocrine tumour'],
 ['FDG-PET','fluorodeoxyglucose positron emission tomography'],
 ['PRRT','peptide receptor radionuclide therapy'],['NETs','neuroendocrine tumours'],['NET','neuroendocrine tumour'],
 ['SSTR','somatostatin receptor'],['SSA','somatostatin analogue'],
 ['MRI','magnetic resonance imaging'],['PET','positron emission tomography'],['CT','computed tomography'],
 ['ECG','electrocardiogram'],['ECHO','echocardiogram (heart ultrasound)'],['MUGA','multigated acquisition (heart pumping) scan'],
 ['DEXA','dual-energy X-ray absorptiometry (bone density)'],['DXA','dual-energy X-ray absorptiometry (bone density)'],
 ['FBC','full blood count'],['CBC','complete blood count'],['LFTs','liver function tests'],['LFT','liver function tests'],
 ['U&E','urea and electrolytes'],['BUN','blood urea nitrogen'],['eGFR','estimated glomerular filtration rate (kidney filtration)'],['CrCl','creatinine clearance'],
 ['TSH','thyroid-stimulating hormone'],['FT4','free thyroxine'],['LDH','lactate dehydrogenase'],
 ['5-HIAA','5-hydroxyindoleacetic acid'],['CgA','chromogranin A'],['CEA','carcinoembryonic antigen'],['AFP','alpha-fetoprotein'],
 ['CK','creatine kinase'],['CPK','creatine phosphokinase'],['INR','international normalised ratio (blood-clotting test)'],
 ['ALT','alanine aminotransferase'],['AST','aspartate aminotransferase'],['Hb','haemoglobin'],
 ['PJP','Pneumocystis jirovecii pneumonia'],['LVEF','left ventricular ejection fraction (heart pumping measurement)'],
 ['HBsAg','hepatitis B surface antigen'],['anti-HBc','antibody to hepatitis B core antigen'],
 ['HBV','hepatitis B virus'],['HCV','hepatitis C virus'],['HIV','human immunodeficiency virus'],
 ['HbA1c','glycated haemoglobin (longer-term blood glucose)'],['TFTs','thyroid function tests'],['TFT','thyroid function tests'],
 ['IDH','isocitrate dehydrogenase'],['MGMT','O6-methylguanine-DNA methyltransferase'],
 ['ES-SCLC','extensive-stage small-cell lung cancer'],['NSCLC','non-small-cell lung cancer'],['SCLC','small-cell lung cancer'],
 ['HCC','hepatocellular carcinoma'],['SCC','squamous cell carcinoma'],['BCC','basal cell carcinoma'],['CNS','central nervous system'],
 ['PICC','peripherally inserted central catheter'],['BP','blood pressure'],['MDT','multidisciplinary team'],
 ['ILD','interstitial lung disease'],['GI','gastrointestinal'],['SPF','sun protection factor'],
 ['CTCAE','Common Terminology Criteria for Adverse Events'],
 ['DPD','dihydropyrimidine dehydrogenase (a medicine-processing enzyme)'],
 ['G-CSF','granulocyte colony-stimulating factor (white-cell growth support)'],
 ['OFS','ovarian function suppression'],['AI','aromatase inhibitor'],
 ['PCV','procarbazine, lomustine and vincristine'],['CAPTEM','capecitabine and temozolomide'],
 ['CRT','chemoradiotherapy'],['RT','radiotherapy'],['IV','intravenous'],['SC','subcutaneous'],['IM','intramuscular'],
 ['SACT','systemic anticancer therapy'],['NCCP','National Cancer Control Programme'],
 ['DNA','deoxyribonucleic acid (the cell’s genetic material)'],
];
const termMap=new Map(TERMS);
const termRx=new RegExp('(?<![A-Za-z0-9])('+TERMS.map(([a])=>escapeRx(a)).join('|')+')(?![A-Za-z0-9])','g');

/** Preserve every tag/attribute and raw block byte-for-byte. */
function mapVisibleText(html,fn,options={}){
 const token=/<!--[\s\S]*?-->|<(script|style|template|svg)\b[^>]*>[\s\S]*?<\/\1\s*>|<[^>]*>/gi;
 let out='',last=0,head=false,rawDepth=0,stack=[];
 function text(s){return head||rawDepth?s:fn(s,stack);}
 for(const m of html.matchAll(token)){
  out+=text(html.slice(last,m.index));
  const t=m[0];out+=t;last=m.index+t.length;
  if(m[1]||t.startsWith('<!--'))continue;
  const close=t.match(/^<\/\s*([a-z0-9:-]+)/i);
  const open=t.match(/^<\s*([a-z0-9:-]+)/i);
  if(close){
   const tag=close[1].toLowerCase();if(tag==='head')head=false;
   const i=stack.map(x=>x.tag).lastIndexOf(tag);
   if(i>=0){for(const x of stack.splice(i))if(x.skip)rawDepth--;}
  }else if(open){
   const tag=open[1].toLowerCase();if(tag==='head')head=true;
   if(!/\/$/.test(t.slice(0,-1))&&!['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'].includes(tag)){
    const phase=/\sdata-support-phase\s*=/i.test(t);
    // A phase panel is patient content revealed by the existing selector. Its
    // hidden attribute is preserved; it must still receive the prose migration.
    const concealed=/\shidden(?:\s|=|>)/i.test(t)||/\baria-hidden=["']true["']/i.test(t);
    const skip=concealed&&!(phase&&options.selectablePhases);
    stack.push({tag,skip,phase,acronym:/data-sact-acronym-v44=/i.test(t)});if(skip)rawDepth++;
   }
  }
 }
 return out+text(html.slice(last));
}

function patientData(options){
 if(options.data)return options.data;
 if(!options.route)return null;
 const root=options.root||ROOT,route=String(options.route).replace(/^\/+|\/+$/g,'');
 if(!/^\d{5}(?:\/[a-z0-9_-]+)?$/i.test(route))return null;
 const [code,context]=route.split('/');
 const file=path.join(root,'data',context?'patient-knowledge-contexts':'patient-knowledge',context?`${code}/${context}.json`:`${code}.json`);
 return fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):null;
}

function rewriteProse(html){
 const entries=Object.entries(catalogue.text).sort((a,b)=>b[0].length-a[0].length);
 return mapVisibleText(html,(raw)=>{
  let text=decode(raw),original=text;
  for(let pass=0;pass<4;pass++){
   const previous=text;
   for(const [old,replacement] of Object.entries(catalogue.direct_language))if(text.includes(old))text=text.split(old).join(replacement);
   for(const [old,replacement] of entries)if(text.includes(old))text=text.split(old).join(replacement);
   if(previous===text)break;
  }
  return text===original?raw:esc(text);
 },{selectablePhases:true});
}

function expandFirstUse(html,options={}){
 const main={seen:new Set(),trailing:''},phaseScopes=new WeakMap();
 return mapVisibleText(html,(raw,stack)=>{
  // Each selectable phase can be the first one a person reads. It receives its
  // own introductions and cannot consume the first use in the visible document.
  const phase=stack.findLast(x=>x.phase);
  if(phase&&!phaseScopes.has(phase))phaseScopes.set(phase,{seen:new Set(),trailing:''});
  const state=phase?phaseScopes.get(phase):main,{seen}=state;
  const text=decode(raw);
  if(stack.some(x=>x.acronym)){
   for(const m of text.matchAll(termRx))seen.add(m[1]);
   state.trailing=(state.trailing+text).slice(-160);return raw;
  }
  let changed=false;
  const result=text.replace(termRx,(a,term,offset)=>{
   if(seen.has(a))return a;
   if(a==='AI'&&!options.aromataseContext)return a;
   const full=termMap.get(a),before=(state.trailing+text.slice(0,offset)).slice(-200);
   // Roman staging and receptor/gene names must not become treatment routes.
   if(a==='IV'&&/\b(?:stage|grade|class|type)\s*$/i.test(before))return a;
   if(a==='DNA'&&/O6-methylguanine-$/i.test(before))return a;
   // Respect an author-provided introduction, including inline markup.
   const simple=full.replace(/\s*\([^)]*\)/g,'');
   const introduced=new RegExp(escapeRx(full)+'\\s*\\(?\\s*$','i').test(before)||new RegExp(escapeRx(simple)+'\\s*\\(?\\s*$','i').test(before)||
     (a==='ECHO'&&/echocardiogra(?:m|phy)[^.!?]{0,45}\(?\s*$/i.test(before))||
     (a==='MUGA'&&/multigated acquisition[^.!?]{0,45}\(?\s*$/i.test(before));
   seen.add(a);
   if(introduced)return a;
   changed=true;
   return `${full} (${a})`;
  });
  state.trailing=(state.trailing+result).slice(-160);
  if(!changed)return raw;
  // Pure text is valid in titles, SVG-free captions, options and table cells;
  // idempotency follows from recognising the full expansion on the next pass.
  return esc(result);
 },{selectablePhases:true});
}

function aromataseContext(data){
 if(!data)return false;
 if(data.service_kind==='endocrine')return true;
 const authored=[data.title,data.context_label,data.purpose,data.schedule_summary,
  ...(data.agents||[]).map(a=>[a.name,a.type,a.explanation].filter(Boolean).join(' ')),
  ...(data.support||[]).map(s=>s.text),...(data.chapters||[]).flatMap(c=>c.items.map(i=>i.text))].filter(Boolean).join(' ');
 return /\baromatase inhibitor(?:s)?\b|\b(?:letrozole|anastrozole|exemestane)\b/i.test(authored);
}

function groupedSources(html,data){
 if(!data||!data.patient_editorial_revision)return html;
 // These short repeated footers contain references only, not clinical prose.
 html=html.replace(/<p\b[^>]*class=["'][^"']*pk-small[^"']*["'][^>]*>\s*Sources:\s*(?:<a\b[^>]*>[\s\S]*?<\/a>\s*(?:·\s*)?)*<\/p>/gi,'');
 const printed=/<section\b[^>]*class=["'][^"']*print-sources\b|data-sact-print-sources=/i.test(html);
 const list=`<ul class="pk-source-list" data-sact-editorial-v44="sources"${printed?' data-sact-print-sources="true"':''}>${(data.sources||[]).map(s=>`<li id="source-${esc(s.id)}"><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a>${printed?`<br><span class="sact-source-address">${esc(s.url)}</span>`:''}</li>`).join('')}</ul>`;
 html=html.replace(/<ul\b[^>]*class=["'][^"']*pk-source-list[^"']*["'][^>]*>[\s\S]*?<\/ul>/gi,list);
 if(printed&&html.includes('data-sact-print-sources="true"'))html=html.replace(/<section\b[^>]*class=["'][^"']*print-sources\b[^"']*["'][^>]*>[\s\S]*?<\/section>/gi,'');
 // Journey footers use direct source links rather than source IDs. The original
 // expectation note remains; only the source list is regenerated from live data.
 html=html.replace(/(<p\b[^>]*class=["'][^"']*journey-footer[^"']*["'][^>]*>)([\s\S]*?)(<a\b[\s\S]*?)(<\/p>)/gi,(whole,open,note,links,close)=>{
   if(!/nccn\.org|NCCN/i.test(links))return whole;
   const primary=(data.sources||[]).filter(s=>s.id==='nccp'||/smpc|(?:-pi)$|temodal|cotellic|erivedge/i.test(s.id));
   return open+note+primary.map(s=>`<a href="${esc(s.url)}">${esc(s.title)}</a>`).join(' · ')+close;
 });
 // Historical passport templates carried a blanket NCCN note. Replace that
 // explanatory claim, not just its acronym, after its clinical prose migration.
 html=html.replace(/<p\b[^>]*class=["'](?:glioma-source|net-source-note|skin-source)["'][^>]*>[\s\S]*?<\/p>/gi,
  '<p class="sact-editorial-note" data-sact-editorial-v44="authorship">SACTCheck patient information. Your team confirms your personal plan. The treatment reference collects the clinical and medicine sources.</p>');
 return html;
}

function applyEditorial(html,options={}){
 if(typeof html!=='string')throw new TypeError('applyEditorial expects HTML text');
 const data=patientData(options);
 html=rewriteProse(html);
 html=groupedSources(html,data);
 html=expandFirstUse(html,{aromataseContext:aromataseContext(data)});
 if(/<body\b/i.test(html)&&!/<body\b[^>]*\bdata-sact-editorial-v44=/i.test(html))html=html.replace(/<body\b/i,'<body data-sact-editorial-v44="0.84.44"');
 return html;
}
module.exports={applyEditorial,expandFirstUse,rewriteProse,mapVisibleText,TERMS};
