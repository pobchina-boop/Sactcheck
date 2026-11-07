(function(){
  'use strict';
  function unresolvedPrescriptionRows(rows){
    const deferred=/\b(?:agent|dose|formulation|volume)\b.*\b(?:prescribed by|selected by|confirmed by|specified by|specialist|to be confirmed)\b|\b(?:as prescribed|not specified|to be confirmed)\b|\b(?:see|follow)\b.*\b(?:local|specialist)\b.*\b(?:plan|policy|protocol|prescription)\b/i;
    const placeholder=/^(?:[-–—−_?.\s]+|t\.?\s*b\.?\s*[cd]\.?|n\/?a|not\s+(?:specified|provided|recorded)|pending)$/i;
    const noMedicine=/^(?:no (?:routine|scheduled) (?:antiemetic|premedication|prophylaxis|medicine)|none(?:\s+required)?|not applicable)/i;
    return rows.filter(row=>{
      const medicine=String(row.medicine||'').trim();
      const dose=String(row.dose||'').trim();
      return medicine&&!noMedicine.test(medicine)&&(!dose||placeholder.test(dose)||deferred.test(dose));
    });
  }
  if(typeof module==='object'&&module.exports)module.exports=Object.freeze({unresolvedPrescriptionRows});
  if(typeof document==='undefined')return;
  let select=document.getElementById('support-phase');
  const standalone=!select?document.querySelector?.('main[data-support-single-phase]'):null;
  if(standalone)select=prepareStandalonePlan(standalone);
  if(!select)return;
  const main=select.closest?.('main')||null;
  const phases=[...document.querySelectorAll('[data-support-phase]')];
  const prompt=document.getElementById('phase-prompt');

  // Older generated pages also receive the shared reading layout. The static
  // generator includes this link and table regions for no-JavaScript access.
  const script=document.currentScript;
  if(script&&document.head&&typeof document.querySelector==='function'&&!document.querySelector('link[data-clinical-screen],link[href*="clinical-screen.css"]')){
    const stylesheet=document.createElement('link');
    stylesheet.rel='stylesheet';
    stylesheet.href=new URL('clinical-screen.css',script.src).href;
    stylesheet.dataset.clinicalScreen='';
    document.head.append(stylesheet);
  }
  document.querySelectorAll('[data-support-phase] table').forEach(table=>{
    if(table.tagName!=='TABLE'||!table.parentElement)return;
    if(table.parentElement.classList.contains('support-table-scroll'))return;
    const hint=document.createElement('p');
    hint.className='support-table-hint no-print';
    hint.textContent='Scroll the table sideways to read all medicine, dose and timing columns.';
    const region=document.createElement('div');
    region.className='support-table-scroll';
    region.tabIndex=0;
    region.setAttribute('role','region');
    region.setAttribute('aria-label','Supportive medicines: medicine, dose and timing');
    table.before(hint,region);
    region.append(table);
  });
  // Keep the authored guidance as the source of truth. The script view copies
  // only the explicitly selected phase, including every medicine/timing cell,
  // additional support paragraph, signing check and source. It never selects a
  // general CINV prescription from the emetogenic category.
  let activeView='guidance';
  let tabs=null;
  let guidancePanel=null;
  let scriptPanel=null;

  function element(tag,className,text){
    const node=document.createElement(tag);
    if(className)node.className=className;
    if(text!==undefined)node.textContent=text;
    return node;
  }
  function prepareStandalonePlan(host){
    // Some completed endocrine suites have one continuous plan rather than
    // treatment phases. Keep all authored content and do not invent a cycle,
    // medicine list or dose merely to give these pages the same controls.
    const title=[...host.children].find(node=>node.tagName==='H1');
    if(!title)return null;
    const content=[];
    let afterTitle=false;
    for(const node of [...host.childNodes]){
      if(node===title){afterTitle=true;continue;}
      if(afterTitle&&!(node.nodeType===1&&['SCRIPT','STYLE'].includes(node.tagName)))content.push(node);
    }
    if(!content.some(node=>node.nodeType===1))return null;
    const phase=element('section');
    phase.dataset.supportPhase='treatment';
    phase.append(...content);
    const control=element('select');
    control.id='support-phase';
    control.hidden=true;
    control.tabIndex=-1;
    control.setAttribute('aria-label','Current authored supportive-care plan');
    const option=element('option','',title.textContent.trim());
    option.value='treatment';
    control.append(option);
    const status=element('p','','The current authored supportive-care plan is shown below.');
    status.id='phase-prompt';
    status.hidden=true;
    host.append(control,status,phase);
    return control;
  }
  function cleanCopy(node){
    const copy=node.cloneNode(true);
    copy.removeAttribute('id');
    copy.removeAttribute('hidden');
    copy.removeAttribute('data-support-phase');
    copy.querySelectorAll('[id]').forEach(item=>item.removeAttribute('id'));
    // Navigation/print controls are replaced by the controls of this view.
    // Clinical source text and all table cells are retained unchanged.
    copy.querySelectorAll('.no-print').forEach(item=>item.remove());
    return copy;
  }
  function field(label){
    const box=element('div','support-script-field');
    box.append(element('b','',label),element('span','support-script-line',''));
    return box;
  }
  function missingPrescriptionDetails(phase){
    const rows=[...phase.querySelectorAll('tbody tr')].flatMap(row=>{
      const cells=[...row.querySelectorAll('td')];
      const dose=cells[1]?.textContent?.trim()||'';
      return cells.length>=3?[{medicine:cells[0].textContent.trim(),dose}]:[];
    });
    return unresolvedPrescriptionRows(rows);
  }
  function sourcePhasePdf(phase){
    // Re-use only an actual local phase-PDF link in the authored controls.
    // A protocol source PDF is not a generated prescribing script.
    for(const link of phase.querySelectorAll('.no-print a[href]')){
      const href=link.getAttribute('href')||'';
      if(!/^support-[a-z0-9_-]+\.pdf(?:[?#].*)?$/i.test(href))continue;
      try{
        const url=new URL(href,window.location.href);
        if(url.origin===window.location.origin)return url.href;
      }catch(_){}
    }
    return null;
  }
  function renderScript(){
    if(!scriptPanel)return;
    scriptPanel.replaceChildren();
    const selected=phases.find(phase=>phase.dataset.supportPhase===select.value);
    if(!selected){
      scriptPanel.append(element('p','support-script-prompt','Choose the prescribed treatment phase above to generate its SACTCheck script. No medicines are selected automatically from the risk category.'));
      return;
    }

    const gaps=missingPrescriptionDetails(selected);
    const hasMedicineRows=[...selected.querySelectorAll('tbody tr')].some(row=>row.querySelectorAll('td').length>=3);
    const actions=element('div','support-script-actions no-print');
    const printButton=element('button','support-script-print',!hasMedicineRows?'Print / save support plan':gaps.length?'Print / save script template':'Print / save script PDF');
    printButton.type='button';
    printButton.addEventListener('click',()=>window.print());
    actions.append(printButton);
    const pdf=sourcePhasePdf(selected);
    if(pdf){
      const download=element('a','','Download existing phase PDF');
      download.href=pdf;
      download.download='';
      actions.append(download);
    }
    scriptPanel.append(actions);

    const sheet=element('article','support-generated-script');
    sheet.dataset.supportScriptIncomplete=String(Boolean(gaps.length));
    sheet.dataset.supportScriptKind=hasMedicineRows?'prescription-template':'individual-support-plan';
    const head=element('header','support-script-head');
    const brand=element('div','support-script-brand');
    if(script?.src){
      const mark=element('img');
      mark.src=new URL('../branding/sactcheck-mark.svg',script.src).href;
      mark.alt='';mark.width=34;mark.height=34;
      mark.addEventListener('error',()=>mark.remove(),{once:true});
      brand.append(mark);
    }
    brand.append(element('span','','SACTCheck'));
    head.append(brand,element('p','support-script-kicker',hasMedicineRows?'SUPPORTIVE MEDICINES · PRESCRIPTION TEMPLATE':'SUPPORTIVE CARE · INDIVIDUAL PLAN TEMPLATE'));
    const title=main.querySelector('h1')?.textContent?.trim()||'Selected treatment';
    head.append(element('h2','',title));
    sheet.append(head);
    const meta=[...main.children].find(node=>node.tagName==='P'||node.classList.contains('wiki-kicker')||node.classList.contains('pt-kicker'));
    if(meta)sheet.append(element('p','support-script-meta',meta.textContent));
    const fields=element('section','support-script-fields');
    fields.setAttribute('aria-label','Complete the patient and treatment details on the printed script');
    ['Patient name','Date of birth / hospital number','Allergies','Treatment date / cycle'].forEach(label=>fields.append(field(label)));
    sheet.append(fields);

    // Keep the regimen's own scope and safety notices in the printed output.
    [...main.children].filter(node=>node.classList.contains('notice')).forEach(node=>sheet.append(cleanCopy(node)));
    if(!hasMedicineRows){
      const note=element('aside','support-script-gap');
      note.append(element('strong','','Individual support plan'),element('p','','No medicine orders are populated in this authored plan. Keep its guidance below and record any individual symptom treatment separately. No medicines or doses have been added.'));
      sheet.append(note);
    }
    if(gaps.length){
      const notice=element('aside','support-script-gap');
      notice.append(element('strong','','Prescription details still required'),element('p','','The source leaves the following details to the treating service. They have not been filled in or inferred. Complete and verify these entries before signing:'));
      const list=element('ul');
      gaps.forEach(item=>list.append(element('li','',`${item.medicine}: ${item.dose||'(empty dose / route cell)'}`)));
      notice.append(list);
      sheet.append(notice);
    }
    const authored=cleanCopy(selected);
    authored.classList.add('support-script-authored');
    sheet.append(authored);
    const signatures=element('section','support-script-signatures');
    signatures.append(field(`${hasMedicineRows?'Prescriber':'Clinician'} name / registration number`),field(`${hasMedicineRows?'Prescriber':'Clinician'} signature / date`));
    sheet.append(signatures);
    sheet.append(element('p','support-script-footer',hasMedicineRows?'SACTCheck prescription template. The treating clinician confirms and completes the individual prescription. All selected-phase medicine, timing and source text above is retained from the authored guidance.':'SACTCheck individual support plan. The treating clinician confirms any symptom treatment separately. All authored supportive-care advice and source text above is retained.'));
    scriptPanel.append(sheet);
  }
  function activate(view,{focus=false}={}){
    activeView=view;
    tabs?.querySelectorAll('[role="tab"]').forEach(tab=>{
      const current=tab.dataset.supportView===view;
      tab.setAttribute('aria-selected',String(current));
      tab.tabIndex=current?0:-1;
      if(current&&focus)tab.focus();
    });
    if(guidancePanel)guidancePanel.hidden=view!=='guidance';
    if(scriptPanel)scriptPanel.hidden=view!=='script';
    document.body.classList.toggle('support-script-print-view',view==='script');
    if(view==='script')renderScript();
  }
  function installTabs(){
    if(!main||!prompt||!phases.length)return;
    tabs=element('div','support-view-tabs no-print');
    tabs.setAttribute('role','tablist');
    tabs.setAttribute('aria-label','Supportive-care view');
    [['guidance','Guidance'],['script','Generate script']].forEach(([view,label])=>{
      const tab=element('button','',label);
      tab.type='button';
      tab.id=`support-${view}-tab`;
      tab.dataset.supportView=view;
      tab.setAttribute('role','tab');
      tab.setAttribute('aria-controls',`support-${view}-panel`);
      tab.addEventListener('click',()=>activate(view));
      tabs.append(tab);
    });
    tabs.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();
      const next=event.key==='Home'?'guidance':event.key==='End'?'script':activeView==='guidance'?'script':'guidance';
      activate(next,{focus:true});
    });
    guidancePanel=element('section','support-guidance-panel');
    guidancePanel.id='support-guidance-panel';
    guidancePanel.setAttribute('role','tabpanel');
    guidancePanel.setAttribute('aria-labelledby','support-guidance-tab');
    scriptPanel=element('section','support-script-panel');
    scriptPanel.id='support-script-panel';
    scriptPanel.setAttribute('role','tabpanel');
    scriptPanel.setAttribute('aria-labelledby','support-script-tab');
    scriptPanel.hidden=true;
    prompt.before(tabs,guidancePanel,scriptPanel);
    guidancePanel.append(prompt,...phases);

    const style=element('style');
    style.id='sactcheckSupportTabsStyle';
    style.textContent=`
      .support-view-tabs{display:flex;gap:6px;margin:18px 0;border-bottom:1px solid #cbdde2;padding:0 0 6px}
      .support-view-tabs [role="tab"]{min-height:44px;padding:10px 18px;border:1px solid #cbdde2;border-radius:9px;background:#f5f9fa;color:#193a4c;cursor:pointer;font:inherit;font-weight:700}
      .support-view-tabs [role="tab"][aria-selected="true"]{background:#126f74;border-color:#126f74;color:white}
      .support-view-tabs [role="tab"]:focus-visible{outline:3px solid #df9c27;outline-offset:2px}
      .clinical-support-page [hidden],.support-script-panel[hidden],.support-guidance-panel[hidden]{display:none!important}
      .support-script-actions{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin:14px 0}
      .support-script-actions button{min-height:44px;border:0;border-radius:8px;background:#126f74;color:#fff;font:inherit;font-weight:700;padding:10px 16px;cursor:pointer}
      .support-script-actions a{font-weight:650;text-underline-offset:3px}
      .support-generated-script{border:1px solid #d4e1e5;background:#fff;padding:24px;box-shadow:0 5px 20px #12314a0b}
      .support-script-head{border-top:7px solid #137b7b;border-bottom:1px solid #d4e1e5;padding:14px 0 18px;margin-bottom:14px}
      .support-script-brand{display:flex;align-items:center;gap:10px;font-size:24px;font-weight:850;letter-spacing:-.5px;color:#12314a}
      .support-script-brand img{width:34px;height:34px;object-fit:contain}
      .support-script-kicker{font-size:11px;font-weight:750;letter-spacing:.06em;color:#31606a;margin:6px 0 10px}
      .support-script-head h2{font-size:22px;line-height:1.25;margin:0;color:#12314a}
      .support-script-meta{font-size:12px;color:#48616d}
      .support-script-fields,.support-script-signatures{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 20px;margin:20px 0}
      .support-script-field{min-height:46px;display:flex;flex-direction:column;gap:16px;font-size:12px}
      .support-script-line{display:block;border-bottom:1px solid #829aa6;min-height:8px}
      .support-script-gap{border-left:4px solid #ac6718;background:#fff4e5;padding:12px 14px;margin:18px 0}
      .support-script-gap p,.support-script-gap li{font-size:13px;line-height:1.45}
      .support-script-footer{border-top:1px solid #d4e1e5;padding-top:12px;font-size:11px;line-height:1.4;color:#48616d}
      @media(max-width:520px){.support-generated-script{padding:14px}.support-view-tabs [role="tab"]{flex:1;padding:10px}.support-script-head h2{font-size:20px}.support-script-fields,.support-script-signatures{grid-template-columns:1fr}}
      @media print{
        .support-view-tabs,.support-script-actions{display:none!important}
        body.support-script-print-view main>*:not(.support-script-panel){display:none!important}
        body.support-script-print-view .support-guidance-panel{display:none!important}
        body.support-script-print-view .support-script-panel{display:block!important}
        body.support-script-print-view .support-generated-script{border:0;padding:0;box-shadow:none}
        .support-generated-script .support-script-head{break-inside:avoid;break-after:avoid}
        .support-generated-script .support-script-brand{font-size:20pt}
        .support-generated-script .support-script-head h2{font-size:15pt}
        .support-generated-script .support-script-kicker{font-size:8pt}
        .support-generated-script .support-script-fields,.support-generated-script .support-script-signatures{grid-template-columns:repeat(2,minmax(0,1fr));break-inside:avoid}
        .support-generated-script .support-table-scroll{overflow:visible!important;max-width:none!important}
        .support-generated-script table{width:100%!important;min-width:0!important;table-layout:auto!important}
        .support-generated-script th,.support-generated-script td{white-space:normal!important;overflow-wrap:anywhere}
        .support-generated-script thead{display:table-header-group}
        .support-generated-script tr,.support-generated-script li{break-inside:avoid}
        .support-generated-script h2,.support-generated-script h3{break-after:avoid}
        .support-generated-script .support-script-gap p,.support-generated-script .support-script-gap li{font-size:9pt}
        .support-generated-script .support-script-footer{font-size:8pt}
      }`;
    document.head.append(style);
    activate('guidance');
  }

  select.value=standalone?'treatment':'';
  const render=()=>{
    phases.forEach(el=>{el.hidden=el.dataset.supportPhase!==select.value;});
    if(prompt)prompt.hidden=Boolean(select.value);
    if(activeView==='script')renderScript();
  };
  select.addEventListener('change',render);
  installTabs();
  render();
})();
