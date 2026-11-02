(function(){'use strict';
 const assets=Object.freeze({'portal':'','knowledge':'knowledge.html','guide':'guide.pdf','passport':'passport.pdf','sact-card':'sactcard.pdf','consent-draft':'consent-form.html','supportive-care-selector':'supportive-care.html','supportive-care':'supportive-care.pdf','longitudinal':'treatment-journey.html','logistics':'logistics.html'});
 const contexts=['backbone_00304','backbone_00310','backbone_00281','backbone_00318','backbone_00317'];
 const requested=new URLSearchParams(window.location.search).get('asset')||'portal';
 const suffix=Object.prototype.hasOwnProperty.call(assets,requested)?assets[requested]:'';
 document.querySelectorAll('[data-backbone]').forEach(a=>{const slug=a.getAttribute('data-backbone');if(contexts.includes(slug))a.setAttribute('href',slug+'/'+suffix);});
})();
