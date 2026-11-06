(function(){
  'use strict';
  const assets={portal:'',knowledge:'knowledge.html',guide:'guide.pdf',passport:'passport.pdf','sact-card':'sactcard.pdf','consent-draft':'consent-form.html','supportive-care-selector':'supportive-care.html','supportive-care':'supportive-care.pdf',longitudinal:'treatment-journey.html'};
  const requested=new URLSearchParams(window.location.search).get('asset')||'portal';
  const file=Object.prototype.hasOwnProperty.call(assets,requested)?assets[requested]:'';
  document.querySelectorAll('[data-context]').forEach(link=>{
    link.setAttribute('href',(['./','lung/','colorectal/','neuroendocrine/','adjuvant/','adjuvant/','adjuvant/','adjuvant/'].includes(link.dataset.route)?link.dataset.route:link.dataset.context==='colorectal'?'colorectal/':link.dataset.context==='lung'?'lung/':'./')+file);
  });
})();
