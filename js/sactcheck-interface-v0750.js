/**
 * SACTCheck v0.75.1 - cohesive clinician/patient interface shell.
 * Keeps regimen-card actions stable from first render and removes the delayed
 * "two buttons first, more buttons later" effect.
 */
(function(root,factory){
  const api=factory(root||{});
  if(typeof module==="object"&&module.exports) module.exports=api;
  if(root?.document){
    root.SACTCheckInterface=api;
    if(root.document.readyState==="loading") root.document.addEventListener("DOMContentLoaded",api.install,{once:true});
    else api.install();
  }
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  const RELEASE="0.75.1";
  let mode="clinician";
  let queued=false;

  const text=v=>String(v??"").trim();

  function protocolForCard(card){
    const id=text(card?.dataset?.jsonProtocolId);
    return root.SACTCheckProtocolLoader?.getProtocolById?.(id)||
      (root.SACTCheckProtocolLoader?.getLoadedProtocols?.()||[]).map(x=>x?.protocol||x).find(p=>text(p?.protocol_id)===id)||
      null;
  }

  function replaceButtonWithOwned(button,kind){
    if(!button) return null;
    if(button.dataset.v0740Owned==="true") return button;
    const clone=button.cloneNode(true);
    button.replaceWith(clone);
    clone.dataset.v0740Owned="true";
    clone.addEventListener("click",event=>{
      event.preventDefault();event.stopPropagation();
      const card=clone.closest(".regimen-card[data-json-protocol-id]");
      const protocol=protocolForCard(card);
      if(!protocol) return;
      if(kind==="workflow"){
        const api=root.SACTCheckRegimenWorkflow;
        if(api?.open) api.open(protocol);
        else root.showToast?.("Clinic workflow is still loading - try again in a moment.");
      }else{
        const api=root.SACTCheckPatientContent||root.SACTCheckRegimenConsentBuilder;
        if(api?.open) api.open(protocol,{tab:"overview"});
        else root.showToast?.("Patient support is still loading - try again in a moment.");
      }
    });
    return clone;
  }

  function ensureAction(actions,card,kind){
    const id=text(card.dataset.jsonProtocolId);
    if(kind==="workflow"){
      let button=actions.querySelector("[data-open-regimen-workflow]");
      if(!button){
        button=root.document.createElement("button");
        button.type="button";
        button.className="btn workflow-card-button";
        button.dataset.openRegimenWorkflow=id;
        button.innerHTML='<span aria-hidden="true">✦</span> Clinic workflow';
        actions.prepend(button);
      }else{
        button.classList.add("workflow-card-button");
        button.innerHTML='<span aria-hidden="true">✦</span> Clinic workflow';
      }
      replaceButtonWithOwned(button,"workflow");
    }else{
      let button=actions.querySelector("[data-open-patient-support],[data-open-regimen-consent]");
      if(!button){
        button=root.document.createElement("button");
        button.type="button";
        button.className="btn secondary patient-support-card-button";
        button.dataset.openPatientSupport=id;
        const info=actions.querySelector(".regimen-info-link");
        if(info) info.insertAdjacentElement("afterend",button); else actions.appendChild(button);
      }else{
        delete button.dataset.openRegimenConsent;
        button.dataset.openPatientSupport=id;
        button.className="btn secondary patient-support-card-button";
      }
      button.innerHTML='<span aria-hidden="true">◎</span> Patient support';
      replaceButtonWithOwned(button,"patient");
    }
  }

  function decorateCards(){
    root.document.querySelectorAll(".regimen-card[data-json-protocol-id]").forEach(card=>{
      const actions=card.querySelector(".card-actions");
      if(!actions) return;
      actions.querySelectorAll("[data-consent-add-agent],.consent-add-agent-button,.add-regimen-button").forEach(x=>x.remove());
      ensureAction(actions,card,"workflow");
      ensureAction(actions,card,"patient");
      card.dataset.v0740Actions="ready";
    });
  }

  function removeUnusedControls(){
    root.document.querySelectorAll(
      "#openProtocolImporter,#developerTools,[data-open-protocol-importer],.protocol-importer-launch,.add-regimen-button,[data-consent-add-agent],.consent-add-agent-button"
    ).forEach(x=>x.remove());
    root.document.querySelectorAll("button,a").forEach(el=>{
      const t=text(el.textContent).toLowerCase();
      const aria=text(el.getAttribute("aria-label")).toLowerCase();
      if(t==="add regimen"||aria.includes("add regimen")) el.remove();
    });
  }

  function ensureModeSwitcher(){
    const portal=root.document.getElementById("portalSwitcher");
    if(!portal||root.document.getElementById("sactcheckModeSwitcher")) return;
    const section=root.document.createElement("section");
    section.id="sactcheckModeSwitcher";
    section.className="sact-mode-switcher library-only";
    section.setAttribute("aria-label","Choose SACTCheck interface");
    section.innerHTML=`
      <button type="button" data-sact-mode="clinician" aria-pressed="true">
        <span class="mode-icon">⌁</span><span><strong>Clinician workspace</strong><small>Assessment · supportive care · administration safety · sources</small></span>
      </button>
      <button type="button" data-sact-mode="patient" aria-pressed="false">
        <span class="mode-icon">◎</span><span><strong>Patient-facing support</strong><small>A4 treatment guide · exact schedule · toxicity recognition</small></span>
      </button>`;
    portal.insertAdjacentElement("beforebegin",section);
    section.querySelectorAll("[data-sact-mode]").forEach(button=>button.addEventListener("click",()=>{
      setMode(button.dataset.sactMode);
      root.document.getElementById("regimenSearch")?.focus?.();
    }));
  }

  function setMode(next){
    mode=next==="patient"?"patient":"clinician";
    root.document.body.dataset.sactMode=mode;
    root.document.querySelectorAll("#sactcheckModeSwitcher [data-sact-mode]").forEach(b=>
      b.setAttribute("aria-pressed",b.dataset.sactMode===mode?"true":"false")
    );
    const sub=root.document.getElementById("librarySubheading");
    if(sub){
      sub.textContent=mode==="patient"
        ?"Find the exact regimen, then open the patient-facing A4 treatment guide, schedule and toxicity support."
        :"Find the exact NCCP regimen and open the regimen-derived clinical workflow.";
    }
    const search=root.document.getElementById("regimenSearch");
    if(search) search.placeholder=mode==="patient"
      ?"Find a regimen for patient support"
      :"Regimen, drug, trade name, NCCP number or indication";
  }

  function applyBranding(){
    const tagline=root.document.querySelector(".brand-tagline");
    if(tagline) tagline.textContent="SACT support at point of care";

    const hero=root.document.getElementById("studyHero");
    if(hero){
      const copy=hero.querySelector(".mission-hero-copy");
      // The base page already carries the SACTCheck mark/tagline. Remove the
      // old injected lock-up so the hero never shows duplicate branding.
      hero.querySelectorAll(".v0740-brand-lockup,.v0750-brand-lockup").forEach(x=>x.remove());
      const kicker=hero.querySelector(".study-kicker");
      if(kicker) kicker.textContent="One regimen · connected clinical and patient support";
      const h1=hero.querySelector("#studyHeroTitle");
      if(h1) h1.textContent="One regimen. Two connected experiences.";
      const lead=hero.querySelector(".mission-hero-lead");
      if(lead) lead.textContent="The regimen drives both the clinical workflow and a patient-facing treatment guide from the same regimen-specific content model.";
      const purpose=hero.querySelector(".mission-hero-purpose");
      if(purpose) purpose.innerHTML="<strong>SACT support at point of care:</strong> assessment, supportive medicines, administration safety, consent support and patient information are surfaced from the properties of the selected regimen.";

      const visual=hero.querySelector(".mission-visual");
      if(visual && visual.dataset.v0750Mission!=="ready"){
        visual.dataset.v0750Mission="ready";
        visual.innerHTML=`
          <div class="mission-visual-header v0750-mission-header">
            <div><strong>One regimen, connected support</strong><span>The selected regimen determines what each workspace shows.</span></div>
            <b>376 NCCP protocols</b>
          </div>
          <div class="mission-pathway">
            <div class="mission-pathway-step"><span class="mission-icon">1</span><div><strong>Select the regimen</strong><small>Use the NCCP regimen identity, indication and schedule.</small></div></div>
            <div class="mission-pathway-step"><span class="mission-icon">2</span><div><strong>Clinician workspace</strong><small>Assessment, supportive care, administration safety and sources.</small></div></div>
            <div class="mission-pathway-step"><span class="mission-icon">3</span><div><strong>Patient guide</strong><small>A4 treatment-at-a-glance, exact treatment days and toxicity recognition.</small></div></div>
            <div class="mission-pathway-step"><span class="mission-icon">4</span><div><strong>Verify the source</strong><small>Clinical judgement and the current NCCP source remain visible.</small></div></div>
          </div>
          <div class="mission-visual-footer"><span>Regimen-specific</span><span>Patient-agnostic</span><span>Source-linked</span></div>`;
      }
    }

    const headerVersion=root.document.querySelector(".header-version");
    if(headerVersion) headerVersion.textContent=`v${RELEASE}`;
    const meta=root.document.querySelector('meta[name="sactcheck-release"]');
    if(meta) meta.setAttribute("content",RELEASE);
    root.document.title=`SACTCheck v${RELEASE} - SACT support at point of care`;
    root.document.documentElement.dataset.sactcheckInterfaceRelease=RELEASE;
  }

  function polishWorkflowPanel(){
    const body=root.document.getElementById("workflowPanelBody");
    if(!body) return;

    body.querySelectorAll(".workflow-module").forEach(module=>{
      const h3=module.querySelector("h3");
      const button=module.querySelector(".workflow-module-action");
      if(h3?.textContent==="Regimen consent"){
        h3.textContent="Consent & patient support";
        const p=h3.parentElement?.querySelector("p");
        if(p) p.textContent="Open the regimen-specific treatment and toxicity snapshot used to support the consent discussion.";
        if(button) button.textContent="Open patient support";
      }
      if(module.classList.contains("patient")){
        h3.textContent="Patient A4 treatment guide";
        const p=h3.parentElement?.querySelector("p");
        if(p) p.textContent="Patient-agnostic, regimen-specific A4 guide with exact schedule, toxicity categories, urgent warnings and QR access.";
        const status=module.querySelector(".workflow-status");
        if(status){ status.className="workflow-status available"; status.textContent="Ready"; }
        if(!module.querySelector("[data-workflow-print-passport]")){
          const b=root.document.createElement("button");
          b.type="button";
          b.className="btn secondary workflow-module-action";
          b.dataset.workflowPrintPassport="true";
          b.textContent="Open patient guide";
          b.addEventListener("click",async()=>{
            const panel=root.document.getElementById("regimenWorkflowOverlay");
            panel && (panel.hidden=true);
            const protocol=root.__v0740ActiveProtocol;
            if(protocol){
              const api=root.SACTCheckPatientContent;
              const risk=await api?.preload?.().then(()=>null).catch(()=>null);
              api?.open?.(protocol,{tab:"print"});
            }
          });
          module.appendChild(b);
        }
      }
    });
  }

  function patchWorkflowOpen(){
    const api=root.SACTCheckRegimenWorkflow;
    if(!api?.open||api.open.__v0740Wrapped) return;
    const original=api.open.bind(api);
    const wrapped=async function(protocol,options){
      root.__v0740ActiveProtocol=protocol;
      const result=await original(protocol,options);
      root.setTimeout(polishWorkflowPanel,0);
      return result;
    };
    wrapped.__v0740Wrapped=true;
    try{ api.open=wrapped; }catch(_){}
    // Object.freeze on older module may prevent assignment. The card button still
    // records the active protocol before opening, so panel polishing remains safe.
  }

  function bindWorkflowMutation(){
    if(root.document.documentElement.dataset.v0740WorkflowObserver==="true") return;
    root.document.documentElement.dataset.v0740WorkflowObserver="true";
    const obs=new MutationObserver(mutations=>{
      if(mutations.some(m=>m.target?.id==="workflowPanelBody"||m.target?.closest?.("#workflowPanelBody"))){
        root.setTimeout(polishWorkflowPanel,0);
      }
    });
    obs.observe(root.document.body,{subtree:true,childList:true});
  }

  function prepareCardButtons(){
    // Buttons are created as soon as each card exists, independent of slower
    // metadata / supportive-care enrichment passes.
    if(root.document.documentElement.dataset.v0740CardObserver==="true") return;
    root.document.documentElement.dataset.v0740CardObserver="true";
    const observer=new MutationObserver(()=>{
      if(queued) return;
      queued=true;
      (root.requestAnimationFrame||root.setTimeout)(()=>{queued=false;decorateCards();removeUnusedControls();},0);
    });
    observer.observe(root.document.body,{subtree:true,childList:true});
  }

  function prewarm(){
    const work=()=>{ root.SACTCheckPatientContent?.preload?.(); root.SACTCheckRegimenWorkflow?.load?.().catch?.(()=>{}); };
    if(root.requestIdleCallback) root.requestIdleCallback(work,{timeout:800});
    else root.setTimeout(work,40);
  }

  function refresh(){
    ensureModeSwitcher();
    removeUnusedControls();
    applyBranding();
    decorateCards();
    bindWorkflowMutation();
    polishWorkflowPanel();
  }

  function install(){
    prepareCardButtons();
    refresh();
    setMode(new URL(root.location.href).searchParams.has("patientSupport")?"patient":"clinician");
    prewarm();

    const rerender=()=>root.setTimeout(refresh,0);
    root.addEventListener?.("sactcheck:protocols-loaded",rerender);
    root.addEventListener?.("sactcheck:v0700-source-reconciled",rerender);
    root.addEventListener?.("sactcheck:v0701-source-reconciled",rerender);
    root.addEventListener?.("sactcheck:engine-first-homepage-ready",rerender);
    root.document.addEventListener?.("sactcheck:regimen-card-metadata-rendered",rerender);

    // Guard against the older workflow module rewriting branding after it refreshes.
    const hero=root.document.getElementById("studyHero");
    if(hero){
      const brandingObserver=new MutationObserver(()=>root.setTimeout(applyBranding,0));
      brandingObserver.observe(hero,{subtree:true,childList:true,characterData:true});
    }
  }

  return Object.freeze({release:RELEASE,install,refresh,decorateCards,setMode,applyBranding,removeUnusedControls});
});
