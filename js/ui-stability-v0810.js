/**
 * SACTCheck v0.81.0 - atomic regimen-card action hydration.
 * Prevents the historical two-buttons-first / controls-appear-later layout shift.
 */
(function(root){
  'use strict';
  if(!root?.document||root.SACTCheckUIStabilityV0810) return;
  const RELEASE=root.SACTCHECK_RELEASE||'0.81.0';
  let scheduled=false;

  function ensureCss(){
    if(root.document.getElementById('uiStabilityV0810Style')) return;
    const s=root.document.createElement('style');s.id='uiStabilityV0810Style';
    s.textContent=`
      .regimen-card[data-json-protocol-id] .card-actions{min-height:96px;align-content:start}
      .regimen-card[data-json-protocol-id]:not([data-sact-card-ready="true"]) .card-actions,
      .regimen-card[data-json-protocol-id]:not([data-sact-card-ready="true"]) .antiemetic-script-v0780{visibility:hidden}
      .regimen-card[data-json-protocol-id]:not([data-sact-card-ready="true"]) .sact-card-action-placeholder{display:block}
      .sact-card-action-placeholder{display:none;height:142px;margin:10px 0 2px;border-radius:10px;border:1px solid #dfe8eb;background:linear-gradient(90deg,#f4f7f8 20%,#edf3f4 40%,#f4f7f8 60%);background-size:220% 100%;animation:sactShimmer 1.3s linear infinite}
      .regimen-card[data-sact-card-ready="degraded"] .sact-card-action-placeholder{display:none}
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
      antiemetic:Boolean(card.querySelector('.antiemetic-script-v0780'))
    };
  }
  function complete(s){return s.actions&&s.workflow&&s.patient&&s.assessment&&s.regimenInfo&&s.antiemetic;}
  function hydrateCard(card){
    if(!card||card.dataset.sactCardReady==='true') return;
    placeholder(card);
    try{root.SACTCheckInterface?.decorateCards?.();}catch(_){}
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
        const finalState=capabilityState(card);
        card.dataset.sactCardReady=complete(finalState)?'true':'degraded';
        card.dataset.sactCardCapabilities=Object.entries(finalState).filter(([,v])=>!v).map(([k])=>k).join(',');
        card.querySelector('.sact-card-action-placeholder')?.remove();
      },2600);
    }
  }
  function hydrateAll(){
    ensureCss();
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
      if(mutations.some(m=>[...m.addedNodes].some(n=>n?.nodeType===1&&(n.matches?.('.regimen-card,.antiemetic-script-v0780')||n.querySelector?.('.regimen-card,.antiemetic-script-v0780'))))) schedule();
    });
    obs.observe(root.document.body,{childList:true,subtree:true});
    root.addEventListener?.('sactcheck:protocols-loaded',schedule);
    root.document.addEventListener?.('sactcheck:regimen-card-metadata-rendered',schedule);
  }
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',install,{once:true});else install();
  root.SACTCheckUIStabilityV0810=Object.freeze({release:RELEASE,install,hydrateAll,capabilityState});
})(typeof globalThis!=='undefined'?globalThis:this);
