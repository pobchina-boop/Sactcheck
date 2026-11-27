(function(){
  'use strict';
  const assets={portal:'',knowledge:'knowledge.html',guide:'guide.pdf',passport:'passport.pdf','sact-card':'sactcard.pdf','consent-draft':'consent-form.html','supportive-care-selector':'supportive-care.html','supportive-care':'supportive-care.pdf',longitudinal:'treatment-journey.html'};
  const olaparib=/\/patient\/00588\/scope\.html$/.test(window.location.pathname||'');
  const olaparibRoutes={breast:'./',prostate:'prostate/',ovarian_first_line:'ovarian_first_line/',ovarian_relapsed:'ovarian_relapsed/',pancreatic:'pancreatic/',combination_00746:'../00746/'};
  if(olaparib)Object.assign(assets,{handbook:'handbook.pdf','support-treatment':'support-treatment.html','support-treatment-pdf':'support-treatment.pdf','consent-pdf':'consent-form.pdf'});
  const requested=new URLSearchParams(window.location.search).get('asset')||'portal';
  const file=Object.prototype.hasOwnProperty.call(assets,requested)?assets[requested]:'';
  document.querySelectorAll('[data-context]').forEach(link=>{
    if(olaparib){
      const route=Object.prototype.hasOwnProperty.call(olaparibRoutes,link.dataset.context)?olaparibRoutes[link.dataset.context]:null;
      if(!route||link.dataset.route!==route){
        link.removeAttribute('href');
        link.setAttribute('aria-disabled','true');
        return;
      }
      link.setAttribute('href',route+file);
      return;
    }
    link.setAttribute('href',(['prostate/','sarcoma/','head_neck/','nasopharyngeal/','melanoma/','merkel_cell/','melanoma_advanced/','melanoma_adjuvant/','melanoma_perioperative/','./','lung/','colorectal/','neuroendocrine/','adjuvant/','adjuvant/','adjuvant/','adjuvant/'].includes(link.dataset.route)?link.dataset.route:link.dataset.context==='prostate'?'prostate/':link.dataset.context==='colorectal'?'colorectal/':link.dataset.context==='lung'?'lung/':'./')+file);
  });
})();
