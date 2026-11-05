'use strict';
// Progressive navigation: without JavaScript every section remains readable.
(()=>{
 const panels=[...document.querySelectorAll('[data-patient-panel]')];
 const links=[...document.querySelectorAll('[data-patient-nav]')];
 const menu=document.querySelector('#patient-section');
 const shell=document.querySelector('main.pt-shell');
 let expanded=false;
 const expand=document.createElement('button');
 expand.type='button';expand.className='pt-expand-details';expand.textContent='Expand all details';expand.setAttribute('aria-pressed','false');
 function documents(){
  const header=shell?.querySelector(':scope > header');if(!header)return;
  const choices=document.createElement('section');choices.className='pt-document-choices';choices.setAttribute('aria-label','Choose how to read your treatment information');
  for(const [href,label,copy] of [['knowledge.html','Read online','Explore the complete treatment reference by topic.'],['guide.pdf','Three-page guide','Treatment summary, anatomical side-effect guide and practical card.'],['handbook.pdf','Full handbook','Complete printable reference and support sheets.']]){
   const link=header.querySelector(`a[href="${href}"]`);if(!link)continue;
   const card=document.createElement('div');const title=document.createElement('strong');title.textContent=label;const note=document.createElement('span');note.textContent=copy;
   card.append(title,note,link);choices.append(card);
  }
  const reference=header.querySelector('a[href="knowledge.pdf"]');
  if(reference){const more=document.createElement('details');const summary=document.createElement('summary');summary.textContent='Reference-only PDF';more.append(summary,reference);choices.append(more);}
  header.querySelectorAll('p').forEach(p=>{if(!p.children.length&&/^[\s·]*$/.test(p.textContent))p.remove();});
  header.append(choices);
 }
 const nav=shell?.querySelector('.pt-tabs');
 const title=shell?.querySelector(':scope > header h1');
 if(nav&&title){
  const navigation=document.createElement('div');navigation.className='pt-section-navigation';
  const label=document.createElement('p');label.className='pt-nav-label';label.textContent='In your treatment portal';
  navigation.append(label,nav,expand);title.after(navigation);
 }
 documents();
 function show(id,focus=false){
  const target=document.getElementById(id);const panel=target?.closest('[data-patient-panel]');
  if(!panel)return;
  expanded=false;expand.setAttribute('aria-pressed','false');expand.textContent='Expand all details';
  for(let parent=target.parentElement;parent&&parent!==panel;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
  panels.forEach(p=>{p.hidden=p!==panel;});
  links.forEach(a=>{if(a.hash==='#'+panel.id)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  if(menu)menu.value=panel.id;
  if(focus){panel.querySelector('h2')?.focus({preventScroll:true});target.scrollIntoView({block:'start'});}
 }
 expand.addEventListener('click',()=>{
  expanded=!expanded;
  if(!expanded){show(location.hash.slice(1)||menu?.value||'my-treatment');return;}
  panels.forEach(p=>p.hidden=false);
  shell?.querySelectorAll('details').forEach(d=>d.open=true);
  expand.setAttribute('aria-pressed','true');expand.textContent='Return to selected section';
 });
 if(panels.length){document.documentElement.classList.add('pt-enhanced');show(location.hash.slice(1)||'my-treatment');
  if(panels.every(p=>!p.hidden))show('my-treatment');
  links.forEach(a=>a.addEventListener('click',()=>show(a.hash.slice(1),true)));
  menu?.addEventListener('change',()=>{location.hash=menu.value;show(menu.value,true);});
  window.addEventListener('hashchange',()=>show(location.hash.slice(1),true));
 }
 document.querySelectorAll('[data-print]').forEach(b=>b.addEventListener('click',()=>window.print()));
 let printState=[];
 window.addEventListener('beforeprint',()=>{
  printState=[...panels,...document.querySelectorAll('main.pt-shell details')].map(n=>[n,n.hidden,n.open]);
  panels.forEach(p=>p.hidden=false);
  document.querySelectorAll('main.pt-shell details').forEach(d=>d.open=true);
 });
 window.addEventListener('afterprint',()=>{printState.forEach(([n,hidden,open])=>{n.hidden=hidden;if(n.tagName==='DETAILS')n.open=open;});});
})();
