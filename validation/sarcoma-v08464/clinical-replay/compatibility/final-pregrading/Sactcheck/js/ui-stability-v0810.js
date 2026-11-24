/**
 * SACTCheck v0.81.9 - regimen-card/workflow streamlining on top of the v0.81.7
 * atomic hydration guard.
 *
 * v0.81.9 refinement:
 * - Regimen information and Sustainability are no longer duplicated on every
 *   regimen card; both remain available from Clinic workflow.
 * - Sustainability retains a visible homepage anchor.
 * - Card readiness no longer depends on the retired card-level Regimen info action.
 */
(function(root){
  'use strict';
  if(!root?.document||root.SACTCheckUIStabilityV0810) return;
  const RELEASE=root.SACTCHECK_RELEASE||'0.81.9';
  let scheduled=false;

  function ensureCss(){
    if(root.document.getElementById('uiStabilityV0810Style')) return;
    const s=root.document.createElement('style');s.id='uiStabilityV0810Style';
    s.textContent=`
      .regimen-card[data-json-protocol-id] .card-actions{min-height:72px;align-content:start}
      .regimen-card[data-json-protocol-id]:not([data-sact-card-ready="true"]):not([data-sact-card-ready="degraded"]) .card-actions{visibility:hidden}
      .regimen-card[data-json-protocol-id]:not([data-sact-card-ready="true"]):not([data-sact-card-ready="degraded"]) .sact-card-action-placeholder{display:block}
      .sact-card-action-placeholder{display:none;height:112px;margin:10px 0 2px;border-radius:10px;border:1px solid #dfe8eb;background:linear-gradient(90deg,#f4f7f8 20%,#edf3f4 40%,#f4f7f8 60%);background-size:220% 100%;animation:sactShimmer 1.3s linear infinite}
      .regimen-card[data-sact-card-ready="degraded"] .sact-card-action-placeholder{display:none}
      .regimen-card[data-sact-card-ready="degraded"] .card-actions{visibility:visible!important}
      @keyframes sactShimmer{to{background-position:-220% 0}}
      @media (prefers-reduced-motion:reduce){.sact-card-action-placeholder{animation:none}}
      @media (max-width:760px){.regimen-card[data-json-protocol-id] .card-actions{min-height:76px}}

      .workflow-module.sustainability{border-left:4px solid #2f7d5f!important}
      .workflow-module.sustainability .workflow-module-icon{background:#e8f5ef;color:#1e6b4f}

      #sactSustainabilityAnchor{margin:0 auto 16px;max-width:1180px;background:linear-gradient(120deg,#f3faf6,#eef7f5);border:1px solid #cfe3d8;border-left:6px solid #2f7d5f;border-radius:14px;padding:15px 18px;box-shadow:0 4px 16px rgba(24,82,61,.05)}
      #sactSustainabilityAnchor .sact-sustainability-anchor-inner{display:flex;align-items:center;gap:14px;justify-content:space-between}
      #sactSustainabilityAnchor .sact-sustainability-anchor-copy{display:flex;align-items:flex-start;gap:12px;min-width:0}
      #sactSustainabilityAnchor .sact-sustainability-anchor-icon{display:grid;place-items:center;flex:0 0 38px;width:38px;height:38px;border-radius:12px;background:#dff1e7;color:#1e6b4f;font-size:20px}
      #sactSustainabilityAnchor h3{margin:0 0 3px;color:#173f35;font-size:16px}
      #sactSustainabilityAnchor p{margin:0;color:#557067;font-size:12px;line-height:1.45}
      #sactSustainabilityAnchor .btn{flex:0 0 auto;white-space:nowrap;background:#fff;color:#1e5f49;border:1px solid #bcd8c9}
      @media(max-width:760px){#sactSustainabilityAnchor{margin:0 12px 14px}#sactSustainabilityAnchor .sact-sustainability-anchor-inner{align-items:stretch;flex-direction:column}#sactSustainabilityAnchor .btn{width:100%}}
    `;
    root.document.head.appendChild(s);
  }
  function placeholder(card){
    if(card.querySelector('.sact-card-action-placeholder')) return;
    const actions=card.querySelector('.card-actions'); if(!actions) return;
    const p=root.document.createElement('div');p.className='sact-card-action-placeholder';p.setAttribute('aria-hidden','true');
    actions.insertAdjacentElement('beforebegin',p);
  }
  function redundantCardAction(el){
    if(!el) return false;
    if(el.matches?.('.regimen-info-link,[data-regimen-info-protocol],[data-open-sustainability],[data-sustainability-protocol]')) return true;
    const label=String(el.textContent||'').trim().toLowerCase();
    const aria=String(el.getAttribute?.('aria-label')||'').trim().toLowerCase();
    const href=String(el.getAttribute?.('href')||'').toLowerCase();
    return href.includes('sustainability.html') || label==='regimen info' || label==='regimen information' || label.includes('sustainability') || aria.includes('sustainability');
  }
  function streamlineCardActions(card){
    const actions=card?.querySelector?.('.card-actions'); if(!actions) return;
    actions.querySelectorAll('a,button').forEach(el=>{if(redundantCardAction(el))el.remove();});
  }
  function capabilityState(card){
    const actions=card.querySelector('.card-actions');
    return {
      actions:Boolean(actions),
      workflow:Boolean(actions?.querySelector('[data-open-regimen-workflow]')),
      patient:Boolean(actions?.querySelector('[data-open-patient-support],[data-open-regimen-consent]')),
      assessment:Boolean(actions?.querySelector('.json-assessment-launch,.regimen-launch')),
      // Regimen information and sustainability now live inside Clinic workflow,
      // so neither card-level action is part of the readiness contract.
      regimenInfo:Boolean(actions?.querySelector('.regimen-info-link,[data-regimen-info-protocol]')),
      antiemetic:Boolean(card.querySelector('.emetogenic-badge,.antiemetic-script-v0780'))
    };
  }
  function complete(s){return s.actions&&s.workflow&&s.patient&&s.assessment&&s.antiemetic;}
  function sustainabilityUrl(protocol){
    const m=protocol?.metadata||{};
    const q=new URLSearchParams();
    q.set('regimen',m.short_title||m.title||protocol?.protocol_id||'SACT regimen');
    q.set('protocol',protocol?.protocol_id||m.nccp_regimen_code||'');
    const tumour=m.tumour_type||m.tumour_site||m.category||m.cancer_type||'';
    if(tumour) q.set('tumour',tumour);
    const route=m.route_classification||m.route||'';
    if(route) q.set('route',route);
    return `sustainability.html?${q.toString()}`;
  }
  function ensureSustainabilityAnchor(){
    if(root.document.getElementById('sactSustainabilityAnchor')) return;
    const hero=root.document.getElementById('studyHero'); if(!hero) return;
    const section=root.document.createElement('section');
    section.id='sactSustainabilityAnchor'; section.className='library-only';
    section.setAttribute('aria-label','SACT sustainability workspace');
    section.innerHTML=`<div class="sact-sustainability-anchor-inner"><div class="sact-sustainability-anchor-copy"><span class="sact-sustainability-anchor-icon" aria-hidden="true">♻</span><div><h3>Sustainability in SACT delivery</h3><p>Evidence-linked implementation workspace for de-escalation, dose banding, vial use, formulation choice and treatment burden. Kept visible here without repeating it on every regimen card.</p></div></div><a class="btn secondary" href="sustainability.html">Open sustainability workspace</a></div>`;
    hero.insertAdjacentElement('afterend',section);
  }
  function ensureWorkflowSustainability(){
    const body=root.document.getElementById('workflowPanelBody');
    const grid=body?.querySelector?.('.workflow-module-grid'); if(!grid) return;
    let module=grid.querySelector('.workflow-module.sustainability');
    const protocol=root.__v0740ActiveProtocol||null;
    const url=sustainabilityUrl(protocol);
    if(module){ const a=module.querySelector('[data-workflow-sustainability]'); if(a)a.href=url; return; }
    module=root.document.createElement('article');
    module.className='workflow-module sustainability';
    module.innerHTML=`<div class="workflow-module-icon">♻</div><div><span>Implementation</span><h3>Sustainability</h3><p>Regimen-linked sustainability evidence and implementation opportunities.</p></div><span class="workflow-status source">Evidence</span><a class="btn secondary workflow-module-action" data-workflow-sustainability href="${url}">Open</a>`;
    const source=grid.querySelector('.workflow-module.source');
    if(source) grid.insertBefore(module,source); else grid.appendChild(module);
  }
  function hydrateCard(card){
    if(!card) return;
    placeholder(card);
    try{root.SACTCheckInterface?.decorateCards?.();}catch(_){ }
    try{root.SACTCheckAntiemeticPrintV0810?.decorate?.();}catch(_){ }
    streamlineCardActions(card);
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
        try{root.SACTCheckInterface?.decorateCards?.();}catch(_){ }
        try{root.SACTCheckAntiemeticPrintV0810?.decorate?.();}catch(_){ }
        streamlineCardActions(card);
        const finalState=capabilityState(card);
        card.dataset.sactCardReady=complete(finalState)?'true':'degraded';
        card.dataset.sactCardCapabilities=Object.entries(finalState).filter(([k,v])=>!v&&k!=='regimenInfo').map(([k])=>k).join(',');
        card.querySelector('.sact-card-action-placeholder')?.remove();
      },900);
    }
  }
  function hydrateAll(){
    ensureCss();
    ensureSustainabilityAnchor();
    try{root.SACTCheckInterface?.decorateCards?.();}catch(_){ }
    try{root.SACTCheckAntiemeticPrintV0810?.decorate?.();}catch(_){ }
    root.document.querySelectorAll('.regimen-card[data-json-protocol-id]').forEach(card=>{streamlineCardActions(card);hydrateCard(card);});
    ensureWorkflowSustainability();
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
      if(mutations.some(m=>[...m.addedNodes].some(n=>n?.nodeType===1&&(
        n.matches?.('.regimen-card,.emetogenic-badge,.antiemetic-script-v0780,.regimen-info-link,[data-regimen-info-protocol],[data-open-sustainability],.workflow-module-grid')||
        n.querySelector?.('.regimen-card,.emetogenic-badge,.antiemetic-script-v0780,.regimen-info-link,[data-regimen-info-protocol],[data-open-sustainability],.workflow-module-grid')||
        String(n.getAttribute?.('href')||'').includes('sustainability.html')
      )))) schedule();
    });
    obs.observe(root.document.body,{childList:true,subtree:true});
    root.addEventListener?.('sactcheck:protocols-loaded',schedule);
    root.document.addEventListener?.('sactcheck:regimen-card-metadata-rendered',schedule);
  }
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',install,{once:true});else install();
  root.SACTCheckUIStabilityV0810=Object.freeze({release:RELEASE,install,hydrateAll,capabilityState,streamlineCardActions,ensureWorkflowSustainability});
})(typeof globalThis!=='undefined'?globalThis:this);
