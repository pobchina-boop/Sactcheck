/** Source-labelled endocrine reference comparisons. No treatment or steroid dosing rules. */
(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.SACTCheckEndocrineContext=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';
  const sourceRoot='https://search.stjames.ie/Labmed/Info/Biochemistry/';
  const sources=Object.freeze({
    tsh:sourceRoot+'ExamTestName25587en.html',
    freeT4:sourceRoot+'ExamTestName25565en.html',
    cortisol:sourceRoot+'ExamTestName25562en.html',
    acth:sourceRoot+'ExamTestName25553en.html',
    immune:'https://academic.oup.com/ejendo/article/187/6/G1/6979880',
    assay:'https://ascopubs.org/doi/10.1200/JCO.21.01440',
    steroids:'https://www.endocrine.org/clinical-practice-guidelines/glucocorticoid-induced-adrenal-insufficiency'
  });
  const fields=Object.freeze([
    {id:'tsh_miu_l',key:'tsh',label:'TSH',unit:'mIU/L',lower:0.27,upper:4.20},
    {id:'free_t4_pmol_l',key:'freeT4',label:'Free T4',unit:'pmol/L',lower:11.9,upper:21.6},
    {id:'cortisol_nmol_l',key:'cortisolMorning',label:'Cortisol, 06:00–10:00',unit:'nmol/L',lower:166,upper:507,source:'cortisol'},
    {id:'cortisol_nmol_l',key:'cortisolAfternoon',label:'Cortisol, 16:00–20:00',unit:'nmol/L',lower:77,upper:291,source:'cortisol'},
    {id:'acth_result',key:'acth',label:'ACTH',unit:'pg/mL',lower:7.2,upper:63.3}
  ]);
  const defaults=Object.freeze({profile:'sjh',...Object.fromEntries(fields.flatMap(f=>[[f.key+'Lower',f.lower],[f.key+'Upper',f.upper]]))});
  const key='sactcheck.endocrineReferences.v0844';
  let memory={...defaults};
  const has=v=>v!==undefined&&v!==null&&String(v).trim()!=='';
  const number=v=>has(v)&&Number.isFinite(Number(v))&&Number(v)>=0?Number(v):null;
  function read(){try{const raw=JSON.parse(root.localStorage?.getItem(key)||'null');if(raw&&['sjh','custom'].includes(raw.profile))memory={...defaults,...raw};}catch(_){}return {...memory};}
  function write(patch){memory={...read(),...patch};try{root.localStorage?.setItem(key,JSON.stringify(memory));}catch(_){}return read();}
  function selectProfile(profile){return write(profile==='sjh'?{...defaults}:{...read(),profile:'custom'});}
  function interval(field,settings=read()){
    const lower=number(settings[field.key+'Lower']),upper=number(settings[field.key+'Upper']);
    return lower!==null&&upper!==null&&upper>lower?{lower,upper}:null;
  }
  function sampleWindow(value){
    const m=/^(\d{1,2}):(\d{2})$/.exec(String(value||'').trim());
    if(!m||+m[1]>23||+m[2]>59)return null;
    const time=+m[1]*60+(+m[2]);
    return time>=360&&time<=600?'cortisolMorning':time>=960&&time<=1200?'cortisolAfternoon':null;
  }
  function referenceLabel(settings){return settings.profile==='sjh'?"St James's Hospital reference example; verify against the reporting laboratory":"Custom reporting-laboratory reference limits";}
  function referenceHint(id,inputs={},settings=read()){
    const candidates=fields.filter(f=>f.id===id);
    if(!candidates.length)return '';
    return candidates.map(f=>{const r=interval(f,settings);return r?`${f.label}: ${r.lower}–${r.upper} ${f.unit}`:`${f.label}: reference limits incomplete`;}).join(' · ')+'. '+referenceLabel(settings)+'.';
  }
  function steroidText(inputs){
    const exposure=inputs.recent_steroid_use;
    const details=[['steroid_name','Agent'],['steroid_dose','Dose'],['steroid_route','Route'],['steroid_duration','Duration'],['steroid_last_dose','Last dose / taper']].filter(([id])=>has(inputs[id])).map(([id,label])=>`${label}: ${String(inputs[id]).trim()}`);
    let text;
    if(exposure==='yes')text='Current or recent steroid exposure reported. Exogenous glucocorticoids can suppress ACTH and endogenous cortisol; some assays are also affected by steroid interference. Review the agent, timing and assay before interpretation.';
    else if(exposure==='no'&&!details.length)text='No current or recent steroid exposure reported. Sampling time, symptoms and the reporting assay still matter.';
    else if(exposure==='no')text='Steroid history is inconsistent: no exposure selected but steroid details entered. Clarify before interpretation.';
    else text='Steroid exposure unknown or not recorded. Do not assume no exposure; clarify the medication history before interpreting cortisol/ACTH.';
    if(details.length)text+=' '+details.join('; ')+'.';
    return text;
  }
  function assess(inputs={},settings=read()){
    const rows=[];
    for(const id of [...new Set(fields.map(f=>f.id))]){
      if(!has(inputs[id]))continue;
      const v=number(inputs[id]);
      let field=fields.find(f=>f.id===id);
      let interpretation='';
      if(id==='cortisol_nmol_l'){
        const window=sampleWindow(inputs.cortisol_sample_time);
        field=fields.find(f=>f.key===window)||field;
        if(!window)interpretation='No time-matched reference comparison: enter HH:MM; published windows are 06:00–10:00 and 16:00–20:00.';
      }
      const range=interval(field,settings);
      if(v===null)interpretation='Invalid result: enter a non-negative number in the displayed units.';
      else if(!interpretation&&!range)interpretation='Reference limits incomplete or invalid; comparison unavailable.';
      else if(!interpretation)interpretation=v<range.lower?'Below the selected reference interval.':v>range.upper?'Above the selected reference interval.':'Within the selected reference interval.';
      if(id==='cortisol_nmol_l')interpretation+=' A reference interval does not exclude adrenal insufficiency or establish recovery after steroids. Interpret with ACTH, symptoms and steroid exposure.';
      else if(id==='acth_result')interpretation+=' Interpret with paired cortisol, sampling conditions and steroid exposure.';
      else if(id==='free_t4_pmol_l')interpretation+=' Interpret with TSH; a non-raised TSH does not make a low free T4 reassuring.';
      else interpretation+=' Interpret with free T4 and clinical context.';
      rows.push({field:id,label:field.label.replace(/,.*$/,''),actual:`${inputs[id]} ${field.unit}${id==='cortisol_nmol_l'?`; sample ${inputs.cortisol_sample_time||'time not recorded'}`:''}`,criterion:range&&!(id==='cortisol_nmol_l'&&!sampleWindow(inputs.cortisol_sample_time))?`${range.lower}–${range.upper} ${field.unit}`:'No applicable reference comparison',outcome:'Contextual review',outcomeKey:'review',priority:2,source:sources[field.source||field.key],sourceLabel:settings.profile==='custom'?'Published example (custom limits used)':'Reference source',interpretation,title:'Reference comparison; not an NCCP treatment threshold'});
    }
    const adrenal=has(inputs.cortisol_nmol_l)||has(inputs.acth_result);
    if(adrenal)rows.push({field:'steroid_context',label:'Steroid context',actual:steroidText(inputs),criterion:'Medication and sampling context',outcome:'Review before interpretation',outcomeKey:'review',priority:2,source:sources.assay,sourceLabel:'Steroid interpretation guidance',interpretation:'This module does not recommend stopping steroids or apply steroid-recovery cutoffs as treatment clearance.',title:'Cortisol / ACTH context'});
    return {rows,referenceLabel:referenceLabel(settings),sources,reviewRequired:rows.length>0};
  }
  function toText(context){return context?.rows?.length?'Hormone reference context — '+context.referenceLabel+'\n'+context.rows.map(r=>`${r.label}: ${r.actual.replace(/[.]+$/, '')}. ${r.criterion}. ${r.interpretation}`).join('\n'):'';}
  return Object.freeze({version:'0.84.4',sources,fields,defaults,read,write,selectProfile,interval,sampleWindow,referenceHint,assess,toText});
});
