/** SACTCheck v0.81.0 - canonical antiemetic prescribing-support action. */
(function(root){
  'use strict';
  if(!root?.document||root.SACTCheckAntiemeticPrintV0810) return;
  const RELEASE=root.SACTCHECK_RELEASE||'0.81.0';
  let installed=false;
  function protocolFor(card){const id=card?.dataset?.jsonProtocolId;return root.SACTCheckProtocolLoader?.getProtocolById?.(id)||null;}
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
    s.textContent='.anti-print-v0810{display:inline-flex;align-items:center;gap:6px;margin-top:8px;border:0;border-radius:7px;background:#0f7f82;color:#fff;font-weight:800;padding:8px 10px;cursor:pointer}.anti-print-v0810:hover{filter:brightness(.96)}';
    root.document.head.appendChild(s);
  }
  function decorate(){
    ensureCss();
    root.document.querySelectorAll('.regimen-card[data-json-protocol-id] .antiemetic-script-v0780').forEach(details=>{
      if(details.dataset.printOwner==='v0810') return;
      details.dataset.printOwner='v0810';
      const body=details.querySelector('.antiemetic-script-body');if(!body)return;
      body.querySelector('.anti-print-v0804')?.remove();
      if(body.querySelector('.anti-print-v0810')) return;
      const b=root.document.createElement('button');b.type='button';b.className='anti-print-v0810';b.textContent='Open printable antiemetic script';
      b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openPdf(details.closest('.regimen-card'));});body.appendChild(b);
    });
  }
  function install(){
    if(installed) return; installed=true; decorate();
    root.document.addEventListener('click',e=>{
      const badge=e.target?.closest?.('.regimen-card .emetogenic-badge');if(!badge)return;
      e.preventDefault();e.stopImmediatePropagation();openPdf(badge.closest('.regimen-card'));
    },true);
    const obs=new MutationObserver(m=>{if(m.some(x=>[...x.addedNodes].some(n=>n?.nodeType===1&&(n.matches?.('.antiemetic-script-v0780,.regimen-card')||n.querySelector?.('.antiemetic-script-v0780')))))decorate();});
    obs.observe(root.document.body,{childList:true,subtree:true});
    root.addEventListener?.('sactcheck:protocols-loaded',decorate);
    root.document.addEventListener?.('sactcheck:regimen-card-metadata-rendered',decorate);
  }
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',install,{once:true});else install();
  root.SACTCheckAntiemeticPrintV0810=Object.freeze({release:RELEASE,install,decorate,openPdf});
})(typeof globalThis!=='undefined'?globalThis:this);
