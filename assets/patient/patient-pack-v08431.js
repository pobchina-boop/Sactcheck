'use strict';
// Progressive navigation: without JavaScript every section remains readable.
(()=>{
 const panels=[...document.querySelectorAll('[data-patient-panel]')];
 const links=[...document.querySelectorAll('[data-patient-nav]')];
 const menu=document.querySelector('#patient-section');
 function show(id,focus=false){
  const target=document.getElementById(id);const panel=target?.closest('[data-patient-panel]');
  if(!panel)return;
  for(let parent=target.parentElement;parent&&parent!==panel;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
  panels.forEach(p=>{p.hidden=p!==panel;});
  links.forEach(a=>{if(a.hash==='#'+panel.id)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  if(menu)menu.value=panel.id;
  if(focus){panel.querySelector('h2')?.focus({preventScroll:true});target.scrollIntoView({block:'start'});}
 }
 if(panels.length){document.documentElement.classList.add('pt-enhanced');show(location.hash.slice(1)||'my-treatment');
  if(panels.every(p=>!p.hidden))show('my-treatment');
  links.forEach(a=>a.addEventListener('click',()=>show(a.hash.slice(1),true)));
  menu?.addEventListener('change',()=>{location.hash=menu.value;show(menu.value,true);});
  window.addEventListener('hashchange',()=>show(location.hash.slice(1),true));
 }
 document.querySelectorAll('[data-print]').forEach(b=>b.addEventListener('click',()=>window.print()));
})();
