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

  const RELEASE='0.81.9';
  const CONTENT_RELEASE='0.81.9';
  const PUBLIC_ORIGIN='https://sactcheck.com/';
  const DEFINITIONS=Object.freeze({
    '00209':{title:'Modified FOLFOX-6',guide:true,passport:true},
    '00222':{title:'Pemetrexed Monotherapy',guide:true,passport:true},
    '00317':{title:'Pemetrexed + Cisplatin',guide:true,passport:true},
    '00318':{title:'Pemetrexed + Carboplatin',guide:true,passport:true},
    '00382':{title:'Trifluridine/Tipiracil',guide:true,passport:true},
    '00568':{title:'Pembrolizumab + Pemetrexed + Carboplatin',guide:true,passport:true,sactCard:true,knowledge:true,consentDraft:true},
    '00569':{title:'Pembrolizumab + Pemetrexed + Cisplatin',guide:true,passport:true},
    '00619':{title:'Abemaciclib + Endocrine Therapy',guide:true,passport:true},
    '00713':{title:'Nivolumab + Ipilimumab + Pemetrexed + Carboplatin',guide:true,passport:true},
    '00714':{title:'Nivolumab + Ipilimumab + Pemetrexed + Cisplatin',guide:true,passport:true},
    '00722':{title:'TCHP',guide:true,passport:true},
    '00831':{title:'Atezolizumab + Bevacizumab',guide:true,passport:true,contactCard:true},
    '00857':{title:'Pembrolizumab + Carboplatin/Paclitaxel → AC',guide:true,passport:true}
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
    if(asset==='knowledge') return def.knowledge?`patient/${def.code}/knowledge.html`:null;
    if(asset==='consent-draft') return def.consentDraft?`patient/${def.code}/consent.html`:null;
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
