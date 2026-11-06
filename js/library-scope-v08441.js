/** Presentation policy. Retain all clinical encodings and their regression tests. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.SACTCheckLibraryScope=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const HAEMATOLOGY_ENABLED=false;
  function isHaematology(value){
    const p=value?.protocol||value||{},m=p.metadata||p;
    return ['Haematology','Haemato-Oncology'].includes(m.tumour_group)||m.catalogue_section==='haem_plasma_cell_disorders';
  }
  function isVisible(value){return HAEMATOLOGY_ENABLED||!isHaematology(value);}
  function domain(value){return HAEMATOLOGY_ENABLED&&value==='haem'?'haem':'solid';}
  return Object.freeze({haematologyEnabled:HAEMATOLOGY_ENABLED,isHaematology,isVisible,domain});
});
