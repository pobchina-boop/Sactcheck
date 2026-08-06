/** SACTCheck v0.61.0 search-first layout guard and scenario disclosure. */
(function(){
  'use strict';
  function initialise(){
    const catalogue=document.getElementById('libraryCatalogueSection');
    const hero=document.getElementById('studyHero');
    const library=document.getElementById('libraryScreen');
    if(library&&hero&&library.firstElementChild!==hero) library.insertBefore(hero,library.firstElementChild);
    const search=document.getElementById('regimenSearch');
    const primary=document.querySelector('.library-search-primary');
    if(primary&&!primary.querySelector('.search-performance-note')){
      const note=document.createElement('p'); note.className='search-performance-note';
      note.textContent='Searches regimen titles, drugs, trade names, NCCP numbers and indications. Close-spelling matching is used only when direct matching finds no result.';
      primary.appendChild(note);
    }
    const panel=document.getElementById('globalScenarioInterpreter');
    const toggles=[...document.querySelectorAll('[data-open-global-scenario]')];
    function setOpen(open,focus){
      if(!panel)return;
      panel.classList.toggle('scenario-collapsed',!open); panel.classList.toggle('scenario-expanded',open);
      toggles.forEach(btn=>btn.setAttribute('aria-expanded',String(open)));
      if(open&&focus){panel.scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>document.getElementById('globalScenarioText')?.focus(),250)}
    }
    toggles.forEach(btn=>btn.addEventListener('click',event=>{event.preventDefault();setOpen(panel?.classList.contains('scenario-collapsed'),true)}));
    setOpen(false,false);
    document.querySelector('[data-focus-regimen-search]')?.addEventListener('click',()=>{catalogue?.scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>search?.focus(),250)});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialise);else initialise();
})();
