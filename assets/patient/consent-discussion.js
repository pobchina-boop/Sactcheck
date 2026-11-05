(function(){'use strict';
  const form=document.getElementById('consent-discussion');if(!form)return;
  const enhanced=Boolean(document.body?.classList&&document.head?.append&&document.currentScript?.src&&typeof document.createElement==='function');
  if(enhanced){
  document.body.classList.add('consent-discussion-page');
  const stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href=new URL('consent-discussion.css',document.currentScript.src).href;stylesheet.dataset.consentDiscussionStyles='true';document.head.append(stylesheet);
  const sections=[...form.querySelectorAll(':scope > section')];
  const navigation=document.createElement('nav');navigation.className='consent-task-navigation pk-no-print';navigation.setAttribute('aria-label','Consent discussion sections');
  const label=document.createElement('strong');label.textContent='In this discussion';navigation.append(label);
  const destinations=[['consent-purpose','Purpose'],['consent-risks','Risks'],['consent-understanding','Understanding']];
  sections.forEach((section,index)=>{
    const destination=destinations[index];const heading=section.querySelector('h2');if(!destination||!heading)return;
    if(!heading.id)heading.id=destination[0];heading.tabIndex=-1;
    const link=document.createElement('a');link.href='#'+heading.id;link.textContent=destination[1];
    link.addEventListener('click',()=>{heading.focus({preventScroll:true});heading.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});navigation.append(link);
  });
  const start=document.createElement('button');start.type='button';start.className='consent-start';start.textContent='Start discussion';start.addEventListener('click',()=>{
    const field=form.querySelector('textarea');if(!field)return;field.focus({preventScroll:true});
    form.querySelector(`label[for="${field.id}"]`)?.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  });navigation.append(start);
  const toolbar=form.querySelector('.pk-nav');
  if(toolbar){const tools=document.createElement('details');tools.className='consent-secondary-tools pk-no-print';const summary=document.createElement('summary');summary.textContent='Print, clear and patient resources';toolbar.before(navigation,tools);tools.append(summary,toolbar);}
  else sections[0]?.prepend(navigation);
  const privacy=sections[0]?.querySelector('p.pk-no-print');privacy?.classList.add('consent-privacy-warning');
  // Move existing guidance nodes into a labelled disclosure; keep the original
  // labels, fields and all clinical wording, and expand guidance for printing.
  const firstHeading=sections[0]?.querySelector('h2');const firstLabel=sections[0]?.querySelector('label');
  if(firstHeading&&firstLabel){
    const context=document.createElement('details');context.className='consent-purpose-context';const summary=document.createElement('summary');summary.textContent='Treatment schedule and discussion guidance';context.append(summary);
    let node=firstHeading.nextSibling;while(node&&node!==firstLabel){const next=node.nextSibling;context.append(node);node=next;}firstLabel.before(context);
  }
  }
  function sync(){for(const field of form.querySelectorAll('textarea'))document.getElementById(field.id+'-print').textContent=field.value||'To discuss and document with the patient.';}
  form.addEventListener('submit',e=>e.preventDefault());form.addEventListener('input',sync);
  document.getElementById('consent-print').addEventListener('click',()=>{sync();window.print();});
  let printState=null;
  window.addEventListener('beforeprint',()=>{sync();if(!enhanced)return;if(printState===null)printState=[...form.querySelectorAll('details:not(.pk-no-print)')].map(d=>[d,d.open]);printState.forEach(([d])=>d.open=true);});
  window.addEventListener('afterprint',()=>{printState?.forEach(([d,open])=>d.open=open);printState=null;});
  document.getElementById('consent-clear').addEventListener('click',()=>{form.reset();sync();});
  sync();
})();
