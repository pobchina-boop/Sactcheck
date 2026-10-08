/**
 * SACTCheck v0.81.7 - atomic regimen-card action hydration hotfix.
 * Restores the full action row after the v0.81.5 single antiemetic-control
 * consolidation and prevents optional enrichment from hiding core actions.
 */
(function(root){
  'use strict';
  if(!root?.document||root.SACTCheckUIStabilityV0810) return;
  const RELEASE=root.SACTCHECK_RELEASE||'0.81.7';
  let scheduled=false;

  function ensureCss(){
    if(root.document.getElementById('uiStabilityV0810Style')) return;
    const s=root.document.createElement('style');s.id='uiStabilityV0810Style';
    s.textContent=`
      .regimen-card[data-json-protocol-id] .card-actions{min-height:96px;align-content:start}
      .regimen-card[data-json-protocol-id]:not([data-sact-card-ready="true"]):not([data-sact-card-ready="degraded"]) .card-actions{visibility:hidden}
      .regimen-card[data-json-protocol-id]:not([data-sact-card-ready="true"]):not([data-sact-card-ready="degraded"]) .sact-card-action-placeholder{display:block}
      .sact-card-action-placeholder{display:none;height:142px;margin:10px 0 2px;border-radius:10px;border:1px solid #dfe8eb;background:linear-gradient(90deg,#f4f7f8 20%,#edf3f4 40%,#f4f7f8 60%);background-size:220% 100%;animation:sactShimmer 1.3s linear infinite}
      .regimen-card[data-sact-card-ready="degraded"] .sact-card-action-placeholder{display:none}
      .regimen-card[data-sact-card-ready="degraded"] .card-actions{visibility:visible!important}
      @keyframes sactShimmer{to{background-position:-220% 0}}
      @media (prefers-reduced-motion:reduce){.sact-card-action-placeholder{animation:none}}
      @media (max-width:760px){.regimen-card[data-json-protocol-id] .card-actions{min-height:100px}}
    `;
    root.document.head.appendChild(s);
  }
  function placeholder(card){
    if(card.querySelector('.sact-card-action-placeholder')) return;
    const actions=card.querySelector('.card-actions'); if(!actions) return;
    const p=root.document.createElement('div');p.className='sact-card-action-placeholder';p.setAttribute('aria-hidden','true');
    actions.insertAdjacentElement('beforebegin',p);
  }
  function capabilityState(card){
    const actions=card.querySelector('.card-actions');
    return {
      actions:Boolean(actions),
      workflow:Boolean(actions?.querySelector('[data-open-regimen-workflow]')),
      patient:Boolean(actions?.querySelector('[data-open-patient-support],[data-open-regimen-consent]')),
      assessment:Boolean(actions?.querySelector('.json-assessment-launch,.regimen-launch')),
      regimenInfo:Boolean(actions?.querySelector('.regimen-info-link,[data-regimen-info-protocol]')),
      // v0.81.5 replaced the old expandable antiemetic block with one badge that
      // opens the printable Rx script directly. Either representation satisfies
      // the hydration capability so the core action row is never held hostage by
      // a retired optional renderer.
      antiemetic:Boolean(card.querySelector('.emetogenic-badge,.antiemetic-script-v0780'))
    };
  }
  function complete(s){return s.actions&&s.workflow&&s.patient&&s.assessment&&s.regimenInfo&&s.antiemetic;}
  function hydrateCard(card){
    if(!card||card.dataset.sactCardReady==='true') return;
    placeholder(card);
    try{root.SACTCheckAntiemeticCard?.decorateCard?.(card);}catch(_){}
    const state=capabilityState(card);
    if(complete(state)){
      card.dataset.sactCardReady='true';
      card.querySelector('.sact-card-action-placeholder')?.remove();
      return;
    }
    if(!card.dataset.sactHydrationStarted){
      card.dataset.sactHydrationStarted=String(Date.now());
      root.setTimeout?.(()=>{
        if(card.dataset.sactCardReady==='true') return;
        try{root.SACTCheckInterface?.decorateCards?.();}catch(_){}
        try{root.SACTCheckAntiemeticPrintV0810?.decorate?.();}catch(_){}
        const finalState=capabilityState(card);
        card.dataset.sactCardReady=complete(finalState)?'true':'degraded';
        card.dataset.sactCardCapabilities=Object.entries(finalState).filter(([,v])=>!v).map(([k])=>k).join(',');
        card.querySelector('.sact-card-action-placeholder')?.remove();
      },900);
    }
  }
  function hydrateAll(){
    ensureCss();
    try{root.SACTCheckInterface?.decorateCards?.();}catch(_){}
    try{root.SACTCheckAntiemeticPrintV0810?.decorate?.();}catch(_){}
    root.document.querySelectorAll('.regimen-card[data-json-protocol-id]').forEach(hydrateCard);
  }
  function schedule(){
    if(scheduled) return; scheduled=true;
    (root.requestAnimationFrame||root.setTimeout)(()=>{scheduled=false;hydrateAll();},0);
  }
  function install(){
    ensureCss();hydrateAll();
    if(root.document.documentElement.dataset.sactV0810CardObserver==='true') return;
    root.document.documentElement.dataset.sactV0810CardObserver='true';
    const obs=new MutationObserver(mutations=>{
      if(mutations.some(m=>[...m.addedNodes].some(n=>n?.nodeType===1&&(n.matches?.('.regimen-card,.emetogenic-badge,.antiemetic-script-v0780')||n.querySelector?.('.regimen-card,.emetogenic-badge,.antiemetic-script-v0780'))))) schedule();
    });
    obs.observe(root.document.body,{childList:true,subtree:true});
    root.addEventListener?.('sactcheck:protocols-loaded',schedule);
    root.document.addEventListener?.('sactcheck:regimen-card-metadata-rendered',schedule);
  }
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',install,{once:true});else install();
  root.SACTCheckUIStabilityV0810=Object.freeze({release:RELEASE,install,hydrateAll,capabilityState});
})(typeof globalThis!=='undefined'?globalThis:this);
