(function(){
  'use strict';
  const assets={portal:'',knowledge:'knowledge.html',guide:'guide.pdf',passport:'passport.pdf','sact-card':'sactcard.pdf','consent-draft':'consent-form.html','supportive-care-selector':'supportive-care.html','supportive-care':'supportive-care.pdf',longitudinal:'treatment-journey.html'};
  const olaparib=/\/patient\/00588\/scope\.html$/.test(window.location.pathname||'');
  const olaparibRoutes={breast:'./',prostate:'prostate/',ovarian_first_line:'ovarian_first_line/',ovarian_relapsed:'ovarian_relapsed/',pancreatic:'pancreatic/',combination_00746:'../00746/'};
  if(olaparib)Object.assign(assets,{handbook:'handbook.pdf','support-treatment':'support-treatment.html','support-treatment-pdf':'support-treatment.pdf','consent-pdf':'consent-form.pdf'});
  const cervicalChoice = {
    '00385':{cervical_definitive:'weekly_rt',cervical_postoperative:'weekly_rt'},
    '00419':{cervical:'weekly_rt'}, '00812':{cervical:'cemiplimab'},
    '00455':{cervical_maintenance:'maintenance'}, '00558':{cervical_maintenance:'maintenance'}
  };
  const code=((window.location.pathname || '').match(/\/patient\/(\d{5})\/(?:scope\.html|index\.html)?$/)||[])[1];
  const params=new URLSearchParams(window.location.search);
  if (code==='00385' && params.get('group')==='gynaecology') {
    document.querySelectorAll('[data-other-settings]').forEach(section=>{section.hidden=true;});
  }
  const requested=params.get('asset')||'portal';
  const ovarianCodes = ['00203','00212','00215','00226','00621'];
  if (ovarianCodes.includes(code)) {
    const choices = document.querySelector('.choices') || document.querySelector('main');
    if (choices && !choices.querySelector('[data-context="ovarian"]')) {
      const article = document.createElement('article');
      article.className = 'choice';
      const title = document.createElement('h2');
      title.textContent = 'Ovarian cancer';
      const link = document.createElement('a');
      link.dataset.context = 'ovarian';
      link.dataset.route = 'ovarian/';
      link.textContent = 'Open the ovarian treatment pathway';
      article.append(title, link);
      choices.append(article);
    }
  }
  const file=Object.prototype.hasOwnProperty.call(assets,requested)?assets[requested]:'';
  document.querySelectorAll('[data-context]').forEach(link=>{
    if (ovarianCodes.includes(code) && link.dataset.context === 'ovarian') {
      const target = requested === 'antiemetic-prescription' ? 'antiemetic-prescriptions.html' :
        requested === 'handbook' ? 'handbook.pdf' : requested === 'consent-pdf' ? 'consent-form.pdf' : file;
      link.setAttribute('href', 'ovarian/'+target);
      if (target.endsWith('.pdf')) link.setAttribute('download',target);
      return;
    }
    if (['00251','00261','00279'].includes(code)) {
      const routes = code === '00279' ? {lung:'./',cervical:'cervical/'} :
        code === '00261' ? {breast:'./',head_neck:'head_neck/',ovarian:'ovarian/'} : {breast:'./',ovarian:'ovarian/'};
      const context = link.dataset.context;
      if (!Object.hasOwn(routes,context) || routes[context] !== link.dataset.route) return;
      const target = requested === 'antiemetic-prescription' ? (context === 'ovarian' ? 'antiemetic-day1.pdf' : context === 'cervical' ? 'antiemetic-prescriptions.html' : 'supportive-care.html') :
        requested === 'handbook' ? 'handbook.pdf' : requested === 'consent-pdf' ? 'consent-form.pdf' : file;
      link.setAttribute('href',routes[context]+target);
      if (target.endsWith('.pdf')) link.setAttribute('download',target);
      return;
    }
    const cervical = cervicalChoice[code];
    if(cervical && Object.hasOwn(cervical,link.dataset.context)){
      const route=link.dataset.context+'/';
      const target=requested==='antiemetic-prescription' ? 'antiemetic-'+cervical[link.dataset.context]+'.pdf' :
        requested==='consent-pdf' ? 'consent-form.pdf' : requested==='handbook' ? 'handbook.pdf' : file;
      link.setAttribute('href',route+target);
      if(target.endsWith('.pdf')) link.setAttribute('download',target);
      return;
    }
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
