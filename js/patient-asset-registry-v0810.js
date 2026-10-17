/**
 * SACTCheck v0.81.0 - canonical patient asset registry.
 *
 * This is the single source of truth for dedicated patient-facing routes.
 * All clinician-card, workflow, QR and compatibility routing must resolve
 * dedicated patient assets through this registry. Dynamic rendering is a
 * fallback only for regimens that are not registered here.
 */
(function(root,factory){
  const api=factory(root||{});
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.SACTCheckPatientAssets=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';

  const RELEASE='0.83.9';
  const CONTENT_RELEASE='0.83.9';
  const PUBLIC_ORIGIN='https://sactcheck.com/';
  const DEFINITIONS=Object.freeze({
    '00200':{"title": "Trastuzumab IV \u00b7 every 3 weeks", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00201':{"title": "Trastuzumab IV \u00b7 weekly \u00b7 metastatic", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00272':{"title": "Trastuzumab SC \u00b7 metastatic", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00285':{"title": "Trastuzumab SC \u00b7 early breast cancer", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00206':{"title": "Trastuzumab emtansine (T-DM1) \u00b7 metastatic", "guide": true, "passport": true, "sactCard": true, "knowledge": true, "consentDraft": true, "supportiveCare": true, "phaseSupport": true, "longitudinal": true},
    '00485':{title:"Dose-dense AC \u2192 weekly paclitaxel",guide:true,passport:true,sactCard:true,knowledge:true,consentDraft:true,supportiveCare:true,phaseSupport:true,longitudinal:true},
    '00815':{title:"Weekly paclitaxel + trastuzumab \u2192 trastuzumab continuation",guide:true,passport:true,sactCard:true,knowledge:true,consentDraft:true,supportiveCare:true,phaseSupport:true,longitudinal:true},
    '00659':{title:"Adjuvant trastuzumab emtansine (T-DM1)",guide:true,passport:true,sactCard:true,knowledge:true,consentDraft:true,supportiveCare:true,phaseSupport:true,longitudinal:true},
    '00892':{title:"Adjuvant ribociclib + endocrine therapy",guide:true,passport:true,sactCard:true,knowledge:true,consentDraft:true,supportiveCare:true,phaseSupport:true,longitudinal:true},
    '00936':{title:"Tucatinib + capecitabine + trastuzumab",guide:true,passport:true,sactCard:true,knowledge:true,consentDraft:true,supportiveCare:true,phaseSupport:true,longitudinal:true},
    '00525':{title:"Ribociclib + endocrine therapy \u00b7 metastatic",guide:true,passport:true,sactCard:true,knowledge:true,consentDraft:true,supportiveCare:true,longitudinal:true},
    '00726':{title:"Pertuzumab + trastuzumab maintenance",guide:true,passport:true,sactCard:true,knowledge:true,consentDraft:true,supportiveCare:true,longitudinal:true},
    '00207':{title:"Cetuximab \u00b7 weekly",guide:true,passport:true,sactCard:true,knowledge:true,consentDraft:true,supportiveCare:true},
    '00732':{title:"Cetuximab \u00b7 every two weeks",guide:true,passport:true,sactCard:true,knowledge:true,consentDraft:true,supportiveCare:true},
    '00328':{title:"Weekly cetuximab + FOLFIRI",guide:true,passport:true,sactCard:true,knowledge:true,consentDraft:true,supportiveCare:true},
    '00585':{title:"Fortnightly cetuximab + FOLFIRI",guide:true,passport:true,sactCard:true,knowledge:true,consentDraft:true,supportiveCare:true},
    '00330':{title:"Weekly cetuximab + irinotecan",guide:true,passport:true,sactCard:true,knowledge:true,consentDraft:true,supportiveCare:true},
    '00331':{title:"Fortnightly cetuximab + irinotecan",guide:true,passport:true,sactCard:true,knowledge:true,consentDraft:true,supportiveCare:true},
    '00692':{title:"Weekly cetuximab + FOLFOX-4",guide:true,passport:true,sactCard:true,knowledge:true,consentDraft:true,supportiveCare:true},
    '00733':{title:"Fortnightly cetuximab + modified FOLFOX-6",guide:true,passport:true,sactCard:true,knowledge:true,consentDraft:true,supportiveCare:true},
    '00210':{title:"FOLFOX-4",guide:true,passport:true,sactCard:true,knowledge:true,consentDraft:true,supportiveCare:true},
    '00213':{title:"Irinotecan \u00b7 every three weeks",guide:true,passport:true,sactCard:true,knowledge:true,consentDraft:true,supportiveCare:true},
    '00225':{title:"Panitumumab",guide:true,passport:true,sactCard:true,knowledge:true,consentDraft:true,supportiveCare:true},
    '00447':{title:"Panitumumab + modified FOLFOX-6",guide:true,passport:true,sactCard:true,knowledge:true,consentDraft:true,supportiveCare:true},
    '00448':{title:"Panitumumab + FOLFIRI",guide:true,passport:true,sactCard:true,knowledge:true,consentDraft:true,supportiveCare:true},
    '00216':{title:'Capecitabine',guide:true,passport:true,sactCard:true,knowledge:true,consentDraft:true,supportiveCare:true},
    '00586':{title:'Capecitabine + radiotherapy',guide:true,passport:true,sactCard:true,knowledge:true,consentDraft:true,supportiveCare:true},
    '00623':{title:'Bevacizumab + capecitabine',guide:true,passport:true,sactCard:true,knowledge:true,consentDraft:true,supportiveCare:true},
    '00227':{title:'FOLFIRI',guide:true,passport:true,sactCard:true,knowledge:true,consentDraft:true},
    '00449':{title:'FOLFIRI + bevacizumab',guide:true,passport:true,sactCard:true,knowledge:true,consentDraft:true},
    '00446':{title:'Modified FOLFOX-6 + bevacizumab',guide:true,passport:true,sactCard:true,knowledge:true,consentDraft:true},

    '00209':{title:'Modified FOLFOX-6',guide:true,passport:true,sactCard:true,knowledge:true,consentDraft:true},
    '00226':{title:'Weekly paclitaxel',guide:true,passport:true,sactCard:true,knowledge:true,consentDraft:true},
    '00321':{title:'CAPOX / XELOX',guide:true,passport:true,sactCard:true,knowledge:true,consentDraft:true},
    '00222':{title:'Pemetrexed Monotherapy',guide:true,passport:true},
    '00317':{title:'Pemetrexed + Cisplatin',guide:true,passport:true},
    '00318':{title:'Pemetrexed + Carboplatin',guide:true,passport:true},
    '00382':{title:'Trifluridine/Tipiracil',guide:true,passport:true},
    '00568':{title:'Pembrolizumab + Pemetrexed + Carboplatin',guide:true,passport:true,sactCard:true,knowledge:true,consentDraft:true},
    '00569':{title:'Pembrolizumab + Pemetrexed + Cisplatin',guide:true,passport:true},
    '00619':{title:"Adjuvant abemaciclib + endocrine therapy",guide:true,passport:true,sactCard:true,knowledge:true,consentDraft:true,supportiveCare:true,longitudinal:true},
    '00713':{title:'Nivolumab + Ipilimumab + Pemetrexed + Carboplatin',guide:true,passport:true},
    '00714':{title:'Nivolumab + Ipilimumab + Pemetrexed + Cisplatin',guide:true,passport:true},
    '00722':{title:"TCHP: docetaxel, carboplatin, trastuzumab and pertuzumab",guide:true,passport:true,sactCard:true,knowledge:true,consentDraft:true,supportiveCare:true,longitudinal:true},
    '00831':{title:'Atezolizumab + Bevacizumab',guide:true,passport:true,contactCard:true},
    '00857':{title:"Pembrolizumab + carboplatin/paclitaxel \u2192 AC",guide:true,passport:true,sactCard:true,knowledge:true,consentDraft:true,supportiveCare:true,phaseSupport:true,longitudinal:true}
  });
  const CODES=Object.freeze(Object.keys(DEFINITIONS));

  function text(v){return String(v??'').trim();}
  function normaliseCode(value){
    const digits=text(value).replace(/\D/g,'');
    if(!digits) return '';
    return digits.slice(-5).padStart(5,'0');
  }
  function codeFor(protocol){
    return normaliseCode(protocol?.metadata?.nccp_regimen_code||protocol?.nccp_regimen_code||protocol?.nccp_code||'');
  }
  function definitionFor(value){
    const code=typeof value==='string'?normaliseCode(value):codeFor(value);
    return code&&DEFINITIONS[code]?Object.freeze({code,...DEFINITIONS[code]}):null;
  }
  function hasDedicated(value){return Boolean(definitionFor(value));}
  function relativePath(value,asset='portal'){
    const def=definitionFor(value); if(!def) return null;
    if(asset==='supportive-care-selector') return def.phaseSupport?`patient/${def.code}/supportive-care.html`:null;
    if(asset==='longitudinal') return def.longitudinal?`patient/${def.code}/treatment-journey.html`:null;
    if(asset==='supportive-care') return def.supportiveCare?`patient/${def.code}/supportive-care.pdf`:null;
    if(asset==='knowledge') return def.knowledge?`patient/${def.code}/knowledge.html`:null;
    // Clinic Workflow consent generator now opens the dedicated one-page form.
    // The longer consent discussion adjunct remains available separately as patient/${code}/consent.html.
    if(asset==='consent-draft') return def.consentDraft?`patient/${def.code}/consent-form.html`:null;
    if(asset==='guide') return `patient/${def.code}/guide.pdf`;
    if(asset==='passport') return `patient/${def.code}/passport.pdf`;
    if(asset==='contact-card'&&def.contactCard) return `patient/${def.code}/contact-card.pdf`;
    if(asset==='sact-card'&&def.sactCard) return `patient/${def.code}/sactcard.pdf`;
    return `patient/${def.code}/`;
  }
  function publicUrl(value,asset='portal'){
    const rel=relativePath(value,asset); return rel?new URL(rel,PUBLIC_ORIGIN).href:null;
  }
  function runtimeUrl(value,asset='portal'){
    const rel=relativePath(value,asset); if(!rel) return null;
    const base=root.location?.href||PUBLIC_ORIGIN;
    try{return new URL(rel,base).href;}catch(_){return new URL(rel,PUBLIC_ORIGIN).href;}
  }
  function compatibilityUrl(value,asset='portal'){
    const def=definitionFor(value); if(!def) return null;
    const suffix=asset==='guide'?'guide.pdf':asset==='passport'?'passport.pdf':asset==='contact-card'&&def.contactCard?'contact-card.pdf':asset==='sact-card'&&def.sactCard?'sactcard.pdf':'';
    return new URL(`docs/patient/${def.code}/${suffix}`,PUBLIC_ORIGIN).href;
  }
  function fallbackUrl(protocol){
    const id=text(protocol?.protocol_id);
    const u=new URL(PUBLIC_ORIGIN);
    if(id) u.searchParams.set('patientSupport',id);
    return u.href;
  }
  function publicPortalUrl(protocol){return publicUrl(protocol,'portal')||fallbackUrl(protocol);}
  function guideUrl(protocol){return publicUrl(protocol,'guide');}
  function passportUrl(protocol){return publicUrl(protocol,'passport');}
  function sactCardUrl(protocol){return publicUrl(protocol,'sact-card');}
  function openTarget(url,target='_blank'){
    if(!url) return null;
    if(typeof root.open!=='function') return {url,opened:false};
    const win=root.open(url,target);
    if(win){try{win.opener=null;}catch(_){} return win;}
    return {url,opened:false,blocked:true};
  }
  function openPortal(protocol){
    const url=runtimeUrl(protocol,'portal');
    if(!url) return false;
    return openTarget(url);
  }
  function openGuide(protocol){
    const url=runtimeUrl(protocol,'guide');
    if(!url) return false;
    return openTarget(url);
  }
  function openPassport(protocol){
    const url=runtimeUrl(protocol,'passport');
    if(!url) return false;
    return openTarget(url);
  }
  function openSactCard(protocol){
    const url=runtimeUrl(protocol,'sact-card');
    if(!url) return false;
    return openTarget(url);
  }

  return Object.freeze({
    release:RELEASE,
    contentRelease:CONTENT_RELEASE,
    publicOrigin:PUBLIC_ORIGIN,
    codes:CODES,
    definitions:DEFINITIONS,
    normaliseCode,codeFor,definitionFor,hasDedicated,relativePath,
    publicUrl,runtimeUrl,compatibilityUrl,fallbackUrl,publicPortalUrl,
    guideUrl,passportUrl,sactCardUrl,openPortal,openGuide,openPassport,openSactCard
  });
});
