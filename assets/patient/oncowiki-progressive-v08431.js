'use strict';
// Progressive disclosure changes presentation only: original content nodes are retained.
(()=>{
 const main=document.querySelector('main[data-patient-knowledge]');if(!main)return;
 const downloads=document.createElement('nav');downloads.className='oncowiki-downloads';downloads.setAttribute('aria-label','Read and print your treatment information');downloads.innerHTML='<strong>Read and print</strong><div class="oncowiki-format-links"><a href="#medicines">Read online</a><a href="guide.pdf" download>Three-page guide</a><a href="handbook.pdf" download>Full handbook</a></div><details><summary>Reference-only PDF</summary><a href="knowledge.pdf" download>Download full OncoWiki</a></details>';
 const urgent=main.querySelector(':scope > #urgent');if(urgent)urgent.after(downloads);else main.prepend(downloads);
 const topics=[...main.querySelectorAll(':scope > details')].find(d=>d.querySelector('.pk-contents'));
 if(topics)main.prepend(topics);
 const controls=document.createElement('div');controls.className='oncowiki-detail-controls';
 const expand=document.createElement('button');expand.type='button';expand.textContent='Expand all details';expand.setAttribute('aria-expanded','false');controls.append(expand);
 if(topics)topics.after(controls);else main.prepend(controls);
 for(const section of main.children){
  if(section.tagName!=='SECTION'||section.id==='urgent')continue;
  const heading=section.querySelector('h2');if(!heading)continue;
  const details=document.createElement('details');details.className='oncowiki-details';
  if(section.id)details.id='oncowiki-details-'+section.id;
  const summary=document.createElement('summary');summary.append(heading);details.append(summary);
  while(section.firstChild)details.append(section.firstChild);
  section.append(details);
  const print=document.createElement('button');print.type='button';print.className='oncowiki-print-section';print.textContent='Print this section';print.addEventListener('click',()=>{main.classList.add('oncowiki-print-selected');section.classList.add('oncowiki-selected');window.print();});details.append(print);
 }
 function updateControl(){const all=[...main.querySelectorAll('details')];const expanded=all.length>0&&all.every(d=>d.open);expand.textContent=expanded?'Collapse all details':'Expand all details';expand.setAttribute('aria-expanded',String(expanded));}
 expand.setAttribute('aria-controls',[...main.querySelectorAll('details[id]')].map(d=>d.id).join(' '));
 expand.addEventListener('click',()=>{const open=expand.getAttribute('aria-expanded')!=='true';main.querySelectorAll('details').forEach(d=>d.open=open);updateControl();});
 main.addEventListener('toggle',updateControl,true);
 function reveal(){const id=decodeURIComponent(location.hash.slice(1));const target=id&&document.getElementById(id);if(!target)return;for(let n=target;n&&n!==main;n=n.parentElement){if(n.tagName==='DETAILS')n.open=true;}target.closest('section')?.querySelector('.oncowiki-details')?.setAttribute('open','');}
 reveal();window.addEventListener('hashchange',reveal);
 let saved=[];window.addEventListener('beforeprint',()=>{saved=[...main.querySelectorAll('details')].map(d=>[d,d.open]);saved.forEach(([d])=>d.open=true);});window.addEventListener('afterprint',()=>{saved.forEach(([d,open])=>d.open=open);main.classList.remove('oncowiki-print-selected');main.querySelectorAll('.oncowiki-selected').forEach(s=>s.classList.remove('oncowiki-selected'));updateControl();});
})();
