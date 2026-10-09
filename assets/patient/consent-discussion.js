(function(){'use strict';
  const form=document.getElementById('consent-discussion');if(!form)return;
  function sync(){for(const field of form.querySelectorAll('textarea'))document.getElementById(field.id+'-print').textContent=field.value||'To discuss and document with the patient.';}
  form.addEventListener('submit',e=>e.preventDefault());form.addEventListener('input',sync);
  document.getElementById('consent-print').addEventListener('click',()=>{sync();window.print();});
  window.addEventListener('beforeprint',sync);
  document.getElementById('consent-clear').addEventListener('click',()=>{form.reset();sync();});
  sync();
})();
