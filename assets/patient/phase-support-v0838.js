(function(){
  'use strict';
  const select=document.getElementById('support-phase');
  if(!select)return;

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
  select.value='';
  const render=()=>{
    document.querySelectorAll('[data-support-phase]').forEach(el=>{el.hidden=el.dataset.supportPhase!==select.value;});
    document.getElementById('phase-prompt').hidden=Boolean(select.value);
  };
  select.addEventListener('change',render);
  render();
})();
