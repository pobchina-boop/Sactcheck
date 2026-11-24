'use strict';
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..');
const model=require('../data/consent-core-v08455.json'),library=require('../data/consent-content-v0710.json');
const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const normalize=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const categoryMap={cytotoxic:['chemotherapy'],immunotherapy:['immunotherapy'],targeted:['targeted'],antibody_drug_conjugate:['chemotherapy','targeted'],endocrine:['endocrine'],endocrine_targeted:['endocrine']};
const endocrineNames=new Set(['letrozole','anastrozole','exemestane','fulvestrant','tamoxifen','apalutamide','darolutamide','abiraterone','enzalutamide','bicalutamide','goserelin','leuprorelin','leuprolide','triptorelin','relugolix','degarelix']);
function classifyAgent(agent){
 const id=normalize(agent.id),name=normalize(agent.name),type=String(agent.type||'').toLowerCase();
 if(endocrineNames.has(id)||endocrineNames.has(name)||/hormone|endocrine|aromatase|androgen|oestrogen|gnrh/.test(type))return ['endocrine'];
 const profile=Object.entries(library.agent_profiles).find(([k,p])=>[k,p.display_name,...(p.aliases||[])].some(x=>[id,name].filter(Boolean).includes(normalize(x))))?.[1];
 if(profile&&categoryMap[profile.category])return categoryMap[profile.category];
 if(/chemotherapy modulator|radiopharmaceutical|radiotherapy|radiation|corticosteroid|support|bone-modifying|local treatment|focused on/.test(type))return [];
 if(/antibody.drug conjugate|chemotherapy payload/.test(type))return ['chemotherapy','targeted'];
 if(/immunotherapy|checkpoint/.test(type))return ['immunotherapy'];
 if(/chemotherapy|cytotoxic/.test(type))return ['chemotherapy'];
 if(/target|kinase|parp|cdk4|mtor|angiokinase|anti-angiogenic|braf|mek/.test(type))return ['targeted'];
 return [];
}
function classify(profile){if(profile.administration_route==='intravesical')return [];return Object.keys(model.categories).filter(k=>(profile.agents||[]).some(a=>classifyAgent(a).includes(k)));}
function render(profile){
 if(profile.administration_route==='intravesical'){
  const live=(profile.agents||[]).some(a=>a.id==='bcg_intravesical');
  const risks=['Urinary catheter discomfort or injury; burning, frequency, urgency, bladder pain or spasm','Blood in urine, urinary infection or difficulty passing urine','Allergic reactions and possible serious or lasting effects; local treatment does not exclude systemic reactions',...(live?['Serious BCG infection or inflammation outside the bladder, potentially fatal; delayed infection can occur months or years later','Possible bladder contracture, genital inflammation and fertility effects']:['Severe or lasting bladder problems; systemic medicine effects are possible','Gemcitabine and docetaxel intravesical route/posology are unlicensed in Ireland: discuss alternatives and local approval'])];
  return `<section id="consent-common-risks-v08455" data-consent-core="0.84.55"><h2 class="section-title">General risks of bladder instillation</h2><p class="consent-core-note">Discuss risks in the context of local bladder treatment, the selected medicine and this patient. The agent-specific section follows.</p><section class="consent-risk-module" data-consent-module="intravesical"><div class="consent-risk-list">${risks.map((x,i)=>`<div class="tick" data-intravesical-risk="${i}"><span class="box"></span><span>${esc(x)}</span></div>`).join('')}</div></section><section class="consent-risk-module" data-consent-module="general-counselling"><h3>General treatment discussion</h3>${model.general_counselling.map(x=>`<div class="tick"><span class="box"></span><span>${esc(x)}</span></div>`).join('')}</section><p class="consent-core-source">Source: <a href="${esc(profile.sources.find(s=>s.id==='nccp').url)}" rel="external">NCCP ${esc(profile.code)} regimen</a>${live?' and the current product-specific BCG information':''}. This is a discussion aid; use the approved local consent process.</p></section>`;
 }
 const selected=classify(profile),groups=selected.map(k=>{
 const c=model.categories[k];return `<section class="consent-risk-module" data-consent-module="${k}"><h3>${esc(c.title)}</h3><div class="consent-risk-list">${c.risks.map(x=>`<div class="tick" data-nccp-risk="${k}-${x.id}"><span class="box"></span><span>${esc(x.label)}</span></div>`).join('')}</div></section>`;
 }).join('');
 return `<section id="consent-common-risks-v08455" data-consent-core="0.84.55"><h2 class="section-title">General risks by treatment type</h2><p class="consent-core-note">NCCP treatment-type checklist: select and explain the risks relevant to this patient, the medicines and the treatment phase. Not every listed effect occurs with every medicine; likelihood and severity vary. The agent-specific section adds detail.</p>${groups||'<p class="consent-core-note">This treatment does not map to the four NCCP checklist categories. Review its specific therapy risks below and the current official source.</p>'}${selected.includes('immunotherapy')?`<section class="consent-risk-module immune" data-consent-module="immune-supplement"><h3>Further immune-related risks and lasting effects</h3><div class="consent-risk-list">${model.immune_supplement.map(x=>`<div class="tick" data-immune-risk="${x.id}"><span class="box"></span><span>${esc(x.label)}</span></div>`).join('')}</div></section>`:''}<section class="consent-risk-module" data-consent-module="general-counselling"><h3>General treatment discussion</h3>${model.general_counselling.map(x=>`<div class="tick"><span class="box"></span><span>${esc(x)}</span></div>`).join('')}</section><p class="consent-core-source">Checklist adapted from the <a href="${model.source.url}" rel="external">published NCCP medical oncology consent form</a>, checked 15 November 2026.${selected.includes('immunotherapy')?` Additional immune-risk prompts: <a href="${model.immune_supplement_source.url}" rel="external">current EMA product information, sections 4.4 and 4.8</a>; check each selected medicine.`:''} This SACTCheck aid is not an approved NCCP form.</p></section>`;
}
function transform(html,profile,file){
 const scope59={ '00453':'Specialist transplant pathway','00807':'Induction and maintenance schedule','00885':'Continuous daily tablets','00894':'Induction and maintenance schedule','00945':'21- or 42-day option; confirm the selected plan' };
 if(profile.suite_release==='0.84.59' && scope59[profile.code])html=html.replace(profile.cycle_days+'-day cycle',scope59[profile.code]);
 if(profile.suite_release==='0.84.61' && profile.code==='00335' && profile.schedule_kind==='continuous')html=html.replace(profile.cycle_days+'-day cycle','Continuous daily tablets; 28-day reference view');
 const start='<!-- consent-core-v08455:start -->',end='<!-- consent-core-v08455:end -->';
 html=html.replace(/<!-- consent-core-v08455:start -->[\s\S]*?<!-- consent-core-v08455:end -->/g,'');
 const marker=/<h2\b[^>]*>[^<]*(?:Regimen\s*\/\s*agent-specific|[Aa]gent-specific|[Mm]edicine-specific|[Mm]aterial risks)[^<]*<\/h2>/;
 if(!marker.test(html))throw Error(file+' missing explicit agent-risk heading');
 html=html.replace(marker,m=>start+render(profile)+end+m);
 if(html.includes('class="endocrine-consent"'))html=html.replace('class="endocrine-consent"','class="endocrine-consent consent-sheet"');
 const css=path.posix.relative(path.posix.dirname(file),'assets/patient/consent-core-v08455.css');
 if(!html.includes('consent-core-v08455.css'))html=html.replace('</head>',`<link rel="stylesheet" href="${css}"></head>`);
 if(!html.includes('consent-form.pdf'))html=html.replace('</nav>','<a href="consent-form.pdf" download>Download complete consent PDF</a></nav>');
 html=html.replace(/Download one-page PDF/g,'Download complete consent PDF').replace(/This one-page form/g,'This form');
 // Existing treatment discussion and all individual-agent risk text stay intact.
 return html;
}
module.exports={model,classify,classifyAgent,render,transform};
