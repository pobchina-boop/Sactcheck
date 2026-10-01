/** v0.80.4: render regimen-card controls as one stable block instead of visibly adding controls in waves. */
(function(root){
  "use strict";
  const RELEASE=root.SACTCHECK_RELEASE||"0.80.4";
  let queued=false;
  function ensureCss(){
    if(!root.document||root.document.getElementById("uiStabilityV0804Style"))return;
    const s=root.document.createElement("style");
    s.id="uiStabilityV0804Style";
    s.textContent=`
      .regimen-card .card-actions{min-height:92px;align-content:start}
      .anti-slot-v0804{height:43px;margin:10px 0 2px;border:1px solid #e1eaed;border-left:5px solid #c8d5da;border-radius:10px;background:#f8fbfc}
      .regimen-card[data-anti-v0780="ready"] .anti-slot-v0804{display:none}
      @media (max-width:760px){.regimen-card .card-actions{min-height:96px}}
    `;
    root.document.head.appendChild(s);
  }
  function reserve(card){
    if(!card)return;
    const actions=card.querySelector(".card-actions");
    if(actions&&!card.querySelector(".antiemetic-script-v0780")&&!card.querySelector(".anti-slot-v0804")){
      const slot=root.document.createElement("div");slot.className="anti-slot-v0804";slot.setAttribute("aria-hidden","true");actions.insertAdjacentElement("beforebegin",slot);
    }
    if(card.querySelector(".antiemetic-script-v0780"))card.querySelector(".anti-slot-v0804")?.remove();
  }
  function decorate(){
    ensureCss();
    root.document?.querySelectorAll?.(".regimen-card[data-json-protocol-id]").forEach(card=>{
      reserve(card);
      try{root.SACTCheckInterface?.decorateCards?.();}catch(_){}
      try{root.SACTCheckAntiemeticCard?.decorateCard?.(card);}catch(_){}
      if(card.querySelector(".antiemetic-script-v0780"))card.querySelector(".anti-slot-v0804")?.remove();
    });
  }
  function schedule(){if(queued)return;queued=true;(root.requestAnimationFrame||root.setTimeout)(()=>{queued=false;decorate();},0);}
  function install(){
    ensureCss();
    try{root.SACTCheckRegimenWorkflow?.install?.();}catch(_){}
    decorate();
    if(!root.document||root.document.documentElement.dataset.v0804StableObserver==="true")return;
    root.document.documentElement.dataset.v0804StableObserver="true";
    const obs=new MutationObserver(mutations=>{if(mutations.some(m=>[...m.addedNodes].some(n=>n?.nodeType===1&&(n.matches?.(".regimen-card,.antiemetic-script-v0780")||n.querySelector?.(".regimen-card,.antiemetic-script-v0780")))))schedule();});
    obs.observe(root.document.body,{childList:true,subtree:true});
    root.addEventListener?.("sactcheck:protocols-loaded",schedule);
    root.document.addEventListener?.("sactcheck:regimen-card-metadata-rendered",schedule);
  }
  if(root.document){if(root.document.readyState==="loading")root.document.addEventListener("DOMContentLoaded",install,{once:true});else install();}
  root.SACTCheckUIStabilityV0804=Object.freeze({release:RELEASE,decorate,install});
})(typeof globalThis!=="undefined"?globalThis:this);
