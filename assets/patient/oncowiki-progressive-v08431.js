'use strict';
// Progressive disclosure changes presentation only: original content nodes are retained.
(()=>{
 const main=document.querySelector('main[data-patient-knowledge]');if(!main)return;
 const downloads=document.createElement('div');downloads.className='oncowiki-downloads';downloads.innerHTML='<a href="handbook.pdf" download>Download complete patient handbook</a> · <a href="knowledge.pdf" download>Download full OncoWiki</a>';main.prepend(downloads);
 for(const section of main.children){
  if(section.tagName!=='SECTION'||section.id==='urgent')continue;
  const heading=section.querySelector('h2');if(!heading)continue;
  const details=document.createElement('details');details.className='oncowiki-details';
  const summary=document.createElement('summary');summary.append(heading);details.append(summary);
  while(section.firstChild)details.append(section.firstChild);
  section.append(details);
  const print=document.createElement('button');print.type='button';print.className='oncowiki-print-section';print.textContent='Print this section';print.addEventListener('click',()=>{main.classList.add('oncowiki-print-selected');section.classList.add('oncowiki-selected');window.print();});details.append(print);
 }
 function reveal(){const id=decodeURIComponent(location.hash.slice(1));const target=id&&document.getElementById(id);if(!target)return;for(let n=target;n&&n!==main;n=n.parentElement){if(n.tagName==='DETAILS')n.open=true;}target.closest('section')?.querySelector('.oncowiki-details')?.setAttribute('open','');}
 reveal();window.addEventListener('hashchange',reveal);
 let saved=[];window.addEventListener('beforeprint',()=>{saved=[...main.querySelectorAll('details')].map(d=>[d,d.open]);saved.forEach(([d])=>d.open=true);});window.addEventListener('afterprint',()=>{saved.forEach(([d,open])=>d.open=open);main.classList.remove('oncowiki-print-selected');main.querySelectorAll('.oncowiki-selected').forEach(s=>s.classList.remove('oncowiki-selected'));});
})();
