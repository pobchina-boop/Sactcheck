/** SACTCheck v0.81.5 - single card-level antiemetic action + clean printable script. */
(function(root){
  'use strict';
  if(!root?.document||root.SACTCheckAntiemeticPrintV0810) return;
  const RELEASE=root.SACTCHECK_RELEASE||'0.81.5';
  let installed=false;

  function protocolFor(card){
    const id=card?.dataset?.jsonProtocolId;
    return root.SACTCheckProtocolLoader?.getProtocolById?.(id)||null;
  }
  async function openPdf(card){
    const protocol=protocolFor(card); if(!protocol) return null;
    const api=root.SACTCheckRegimenWorkflow;
    if(typeof api?.openSupportivePdf==='function') return api.openSupportivePdf(protocol);
    root.alert?.('Printable antiemetic support is still loading. Please try again in a moment.');
    return null;
  }

  function ensureCss(){
    if(root.document.getElementById('antiemeticPrintV0810Style')) return;
    const s=root.document.createElement('style');s.id='antiemeticPrintV0810Style';
    s.textContent=`
      .regimen-card .emetogenic-badge{
        --anti:#6c7880;
        display:flex!important;align-items:center!important;gap:8px!important;
        width:100%!important;box-sizing:border-box!important;margin:10px 0 2px!important;
        padding:8px 10px!important;border:1px solid #d9e3e7!important;
        border-left:5px solid var(--anti)!important;border-radius:10px!important;
        background:#fbfdfe!important;color:#203b49!important;text-decoration:none!important;
        font-size:.78rem!important;font-weight:800!important;line-height:1.25!important;
        cursor:pointer!important;box-shadow:none!important;
      }
      .regimen-card .emetogenic-badge.emetogenic-high{--anti:#b42318}
      .regimen-card .emetogenic-badge.emetogenic-moderate,
      .regimen-card .emetogenic-badge.emetogenic-oral-moderate-high{--anti:#c56a00}
      .regimen-card .emetogenic-badge.emetogenic-low,
      .regimen-card .emetogenic-badge.emetogenic-oral-minimal-low{--anti:#217a46}
      .regimen-card .emetogenic-badge.emetogenic-minimal{--anti:#246b9e}
      .regimen-card .emetogenic-badge.emetogenic-phase-dependent{--anti:#6c4b91}
      .regimen-card .emetogenic-badge.emetogenic-variable,
      .regimen-card .emetogenic-badge.emetogenic-pending{--anti:#6c7880}
      .regimen-card .emetogenic-badge .emetogenic-dot{
        width:10px!important;height:10px!important;min-width:10px!important;border-radius:50%!important;
        background:var(--anti)!important;box-shadow:0 0 0 3px color-mix(in srgb,var(--anti) 15%,transparent)!important;
      }
      .regimen-card .emetogenic-badge::after{
        content:'Rx script ↗';margin-left:auto;color:#687c85;font-size:.72rem;font-weight:600;white-space:nowrap;
      }
      .regimen-card .emetogenic-badge:hover{filter:brightness(.985)}
      .regimen-card .antiemetic-script-v0780{display:none!important}
    `;
    root.document.head.appendChild(s);
  }

  function sanitizePayload(payload){
    const manifest=payload?.manifest||{};
    const supportive=manifest.supportiveCare||{};
    return {
      ...payload,
      manifest:{
        ...manifest,
        supportiveCare:{...supportive,localPrescriptionSource:null}
      }
    };
  }
  function bytesToLatin1(bytes){
    let out=''; const size=0x8000;
    for(let i=0;i<bytes.length;i+=size) out+=String.fromCharCode(...bytes.subarray(i,Math.min(i+size,bytes.length)));
    return out;
  }
  function latin1ToBytes(text){
    const out=new Uint8Array(text.length);
    for(let i=0;i<text.length;i++) out[i]=text.charCodeAt(i)&255;
    return out;
  }
  function sameLength(value,length){
    value=String(value||'');
    if(value.length>length) return value.slice(0,length);
    return value+' '.repeat(length-value.length);
  }
  function neutralisePresentationText(bytes){
    let text=bytesToLatin1(bytes);
    // PDF text streams are uncompressed. Keep replacement lengths identical so
    // object/xref byte offsets remain valid while removing internal site provenance.
    text=text.replace(/\(([^()]*(?:Local source:)[^()]*)\) Tj/gi,(m,inside)=>`(${sameLength('',inside.length)}) Tj`);
    text=text.replace(/\(([^()]*)\) Tj/g,(m,inside)=>{
      let next=inside;
      next=next.replace(/CUH/gi,'   ');
      next=next.replace(/local policy/gi,match=>sameLength('site policy',match.length));
      next=next.replace(/local prescribing policy/gi,match=>sameLength('prescribing policy',match.length));
      next=next.replace(/local supportive-medicine proforma/gi,match=>sameLength('supportive-medicine proforma',match.length));
      next=next.replace(/local prescription/gi,match=>sameLength('prescription',match.length));
      next=next.replace(/local reference/gi,match=>sameLength('reference',match.length));
      return `(${next}) Tj`;
    });
    return latin1ToBytes(text);
  }
  function wrapPdfApi(api){
    if(!api||api.__sactcheckCleanPresentation) return api;
    const wrapped={...api};
    wrapped.__sactcheckCleanPresentation=true;
    wrapped.buildPdf=function(payload){
      return neutralisePresentationText(api.buildPdf(sanitizePayload(payload)));
    };
    wrapped.openInViewer=function(payload,targetWindow=null){
      const data=wrapped.buildPdf(payload),file=api.filename(payload);
      if(!root?.document||!root?.URL||typeof Blob==='undefined') return {bytes:data,filename:file,pages:1,opened:false};
      const blob=new Blob([data],{type:'application/pdf'}),url=root.URL.createObjectURL(blob);
      let viewer=targetWindow;
      if(viewer?.closed)viewer=null;
      if(!viewer&&root?.open)viewer=root.open('about:blank','_blank');
      if(!viewer)return {bytes:data,filename:file,pages:1,opened:false,blocked:true};
      try{viewer.location.replace(url);}catch(_){viewer.location.href=url;}
      root.setTimeout?.(()=>root.URL.revokeObjectURL(url),10*60*1000);
      return {bytes:data,filename:file,pages:1,opened:true,url};
    };
    return Object.freeze(wrapped);
  }
  function installPdfPresentationGuard(){
    let current=root.SACTCheckSupportiveCarePdf;
    try{
      delete root.SACTCheckSupportiveCarePdf;
      Object.defineProperty(root,'SACTCheckSupportiveCarePdf',{
        configurable:true,
        enumerable:true,
        get(){return current;},
        set(value){current=wrapPdfApi(value);}
      });
      if(current) current=wrapPdfApi(current);
    }catch(_){
      // Non-configurable globals are left untouched; explicit payload suppression
      // below still removes the displayed source line in supported runtimes.
    }
  }

  function decorate(){
    ensureCss();
    root.document.querySelectorAll('.regimen-card[data-json-protocol-id]').forEach(card=>{
      card.querySelectorAll('.antiemetic-script-v0780').forEach(el=>el.remove());
      const badge=card.querySelector('.emetogenic-badge');
      if(!badge) return;
      badge.dataset.singleAntiemeticControl='v0815';
      badge.setAttribute('title','Open printable antiemetic script');
      badge.setAttribute('aria-label',`${String(badge.textContent||'Antiemetic support').trim()} — open printable Rx script`);
    });
  }
  function install(){
    if(installed) return; installed=true;
    installPdfPresentationGuard();
    decorate();
    root.document.addEventListener('click',e=>{
      const badge=e.target?.closest?.('.regimen-card .emetogenic-badge');if(!badge)return;
      e.preventDefault();e.stopImmediatePropagation();openPdf(badge.closest('.regimen-card'));
    },true);
    const obs=new MutationObserver(m=>{
      if(m.some(x=>[...x.addedNodes].some(n=>n?.nodeType===1&&(n.matches?.('.antiemetic-script-v0780,.regimen-card,.emetogenic-badge')||n.querySelector?.('.antiemetic-script-v0780,.emetogenic-badge'))))) decorate();
    });
    obs.observe(root.document.body,{childList:true,subtree:true});
    root.addEventListener?.('sactcheck:protocols-loaded',decorate);
    root.document.addEventListener?.('sactcheck:regimen-card-metadata-rendered',decorate);
  }
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',install,{once:true});else install();
  root.SACTCheckAntiemeticPrintV0810=Object.freeze({release:RELEASE,install,decorate,openPdf});
})(typeof globalThis!=='undefined'?globalThis:this);
