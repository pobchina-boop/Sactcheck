/**
 * SACTCheck v0.75.1 - Regimen Workflow Engine
 *
 * Regimen properties are translated into clinic workflow outputs:
 * assessment, consent, supportive medicines, extravasation guidance,
 * patient information status and source verification.
 *
 * This layer does not alter deterministic treatment-assessment rules.
 */
(function(root,factory){
  const api=factory(root);
  if(typeof module==="object"&&module.exports) module.exports=api;
  root.SACTCheckRegimenWorkflow=api;
  if(root?.document) api.install();
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const RELEASE="0.75.1";
  const DATA_URL="data/regimen-workflow-v0750.json";
  const PDF_URL="js/supportive-care-pdf-v0750.js?v=0.75.1";
  let dataCache=null;
  let dataPromise=null;
  let pdfPromise=null;
  let activeProtocol=null;
  let activeManifest=null;

  function asArray(value){
    if(value===undefined||value===null||value==="") return [];
    return Array.isArray(value)?value:[value];
  }
  function esc(value){
    return String(value??"")
      .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
      .replaceAll('"',"&quot;").replaceAll("'","&#039;");
  }
  function normaliseDrug(value){
    return String(value??"").toLowerCase()
      .replace(/[®™]/g,"")
      .replace(/\([^)]*\)/g," ")
      .replace(/[_/–—-]+/g," ")
      .replace(/\b(?:iv|po|sc|oral|intravenous|subcutaneous|infusion|bolus|tablets?|capsules?|mg|mcg)\b/g," ")
      .replace(/[^a-z0-9]+/g," ")
      .replace(/\s+/g," ")
      .trim()
      .replace(/\bnab paclitaxel\b/g,"nab paclitaxel")
      .replace(/\b5 fluorouracil\b/g,"fluorouracil");
  }
  function displayDrug(value){
    return String(value||"").replace(/[_-]+/g," ").replace(/\s+/g," ").trim();
  }
  function routeIsOral(route){
    return /^(po|oral|by mouth)$/i.test(String(route||"").trim());
  }
  function protocolText(protocol){
    try{return JSON.stringify(protocol||{}).toLowerCase();}
    catch(_){return "";}
  }

  function administrationRows(protocol){
    const rows=[];
    asArray(protocol?.treatment_phases).forEach(phase=>{
      asArray(phase?.administration).forEach(item=>{
        const drug=item?.drug||item?.name||item?.medicine;
        if(!drug) return;
        rows.push({
          drug:displayDrug(drug),
          normalised:normaliseDrug(drug),
          route:String(item?.route||item?.administration_route||item?.route_of_administration||""),
          day:item?.day??null
        });
      });
    });
    if(rows.length) return rows;

    const fallback=[];
    asArray(protocol?.treatment?.components).forEach(item=>fallback.push(item?.drug||item?.name||item));
    asArray(protocol?.regimen_components).forEach(item=>fallback.push(item?.drug||item?.name||item));
    asArray(protocol?.metadata?.drugs).forEach(item=>fallback.push(item?.drug||item?.name||item));
    const seen=new Set();
    return fallback.filter(Boolean).map(drug=>({
      drug:displayDrug(drug),normalised:normaliseDrug(drug),route:"",day:null
    })).filter(row=>{
      if(!row.normalised||seen.has(row.normalised)) return false;
      seen.add(row.normalised); return true;
    });
  }

  function componentNames(protocol){
    const helper=root?.SACTCheckRegimenComponents;
    const values=helper?.forProtocol?.(protocol);
    if(Array.isArray(values)&&values.length){
      return [...new Set(values.map(displayDrug).filter(Boolean))];
    }
    return [...new Set(administrationRows(protocol).map(row=>row.drug).filter(Boolean))];
  }

  function isAnthracyclineCyclophosphamide(protocol,components){
    const n=components.map(normaliseDrug);
    const hasAnth=n.some(x=>["doxorubicin","epirubicin","daunorubicin","idarubicin"].includes(x));
    return hasAnth && n.includes("cyclophosphamide");
  }

  function isCarboplatinAuc4Plus(protocol){
    const text=protocolText(protocol);
    if(!text.includes("carboplatin")) return false;
    return /auc\s*(?:>=|≥|greater than or equal to)?\s*[4-9](?:\.\d+)?/.test(text)
      || /auc[_ -]?[4-9](?:\.\d+)?/.test(text);
  }

  function hasTdxd(components){
    const n=components.map(normaliseDrug);
    return n.some(x=>x.includes("trastuzumab deruxtecan")||x==="t dxd"||x.includes("enhertu"));
  }

  function planWithSources(planId,plan,data){
    if(!plan) return null;
    const localSourceId=plan.local_prescription_source_id||"";
    return {
      status:"available",
      planId,
      ...plan,
      localPrescriptionSource:localSourceId?data?.sources?.[localSourceId]||null:null
    };
  }

  function chooseAntiemeticPlan(protocol,data,riskRecord={}){
    const level=String(riskRecord.level||riskRecord.baseLevel||"pending").toLowerCase();
    const components=componentNames(protocol);

    if(level==="phase_dependent" && !riskRecord.phaseResolved){
      return {
        status:"phase_review_required",
        planId:null,
        label:"Phase-dependent supportive care",
        message:"Select or confirm the active treatment phase/day before generating supportive medicines."
      };
    }
    if(level==="high"){
      if(isAnthracyclineCyclophosphamide(protocol,components)){
        return planWithSources("high_ac",data.antiemetic_plans.high_ac,data);
      }
      // Keep trastuzumab deruxtecan and carboplatin branches independent.
      // A carboplatin regimen must never display trastuzumab-deruxtecan wording.
      if(hasTdxd(components)){
        return planWithSources("high_tdxd",data.antiemetic_plans.high_tdxd,data);
      }
      if(isCarboplatinAuc4Plus(protocol)){
        return planWithSources("high_carboplatin",data.antiemetic_plans.high_carboplatin,data);
      }
      return planWithSources("high_standard",data.antiemetic_plans.high_standard,data);
    }
    if(level==="moderate") return planWithSources("moderate",data.antiemetic_plans.moderate,data);
    if(level==="low") return planWithSources("low",data.antiemetic_plans.low,data);
    if(level==="minimal") return planWithSources("minimal",data.antiemetic_plans.minimal,data);

    if(level==="oral_moderate_high"||level==="oral_minimal_low"){
      return {
        status:"source_only",
        planId:null,
        label:riskRecord.label||"Oral SACT antiemetic support",
        message:"Oral SACT requires a dedicated regimen/interaction review; use current NCCP guidance rather than a parenteral prescription template."
      };
    }
    return {
      status:"review_required",
      planId:null,
      label:riskRecord.label||"Supportive-care mapping requires review",
      message:"No single prescribing template can be generated safely from the available regimen metadata."
    };
  }

  function interactionOverrides(protocol,data){
    const components=componentNames(protocol).map(normaliseDrug);
    return asArray(data?.interaction_rules).filter(rule=>
      asArray(rule.match_agents).some(agent=>components.includes(normaliseDrug(agent)))
    ).map(rule=>({
      ...rule,
      source:data?.sources?.[rule.source_id]||null
    }));
  }

  function resolveExtravasation(protocol,data){
    const rules=data?.extravasation?.drugs||{};
    const classes=data?.extravasation?.classes||{};
    const rows=administrationRows(protocol);
    const byDrug=new Map();

    rows.forEach(row=>{
      const key=row.normalised;
      if(!key) return;
      const rule=rules[key];
      if(!rule) return;

      // Do not show extravasation advice for a medicine encoded exclusively as oral.
      if(routeIsOral(row.route)) return;

      if(!byDrug.has(key)){
        const cls=classes[rule.class]||{};
        byDrug.set(key,{
          drug:row.drug,
          key,
          classId:rule.class,
          classLabel:cls.label||rule.class,
          severity:Number(cls.severity||0),
          colour:cls.colour||"grey",
          generalAction:cls.general_action||"",
          compress:rule.compress||"",
          antidote:rule.antidote||"",
          route:row.route||""
        });
      }
    });

    const agents=[...byDrug.values()].sort((a,b)=>b.severity-a.severity||a.drug.localeCompare(b.drug));
    const highest=agents[0]||null;
    const unknownParenteral=rows.filter(row=>!routeIsOral(row.route) && row.normalised && !rules[row.normalised])
      .map(row=>row.drug);
    return {
      status:agents.length?"available":"not_applicable_or_unmapped",
      agents,
      highest,
      unknownAgents:[...new Set(unknownParenteral)],
      sourceClassification:data?.sources?.nccp_extravasation_classification||null,
      sourceGuidance:data?.sources?.nccp_extravasation_guidance||null,
      emergencySteps:[
        "Stop and disconnect the infusion; inform the patient.",
        "Leave vascular access in place initially and gently aspirate where appropriate; do not flush.",
        "Identify the extravasated agent and notify the treating medical team.",
        "Mark and document the affected area; use the drug-specific compress/antidote pathway and local policy.",
        "Elevate the limb, provide analgesia if required and arrange follow-up."
      ]
    };
  }

  function buildManifest(protocol,data,riskRecord={}){
    if(!protocol) throw new Error("A protocol is required.");
    const metadata=protocol.metadata||{};
    const supportive=chooseAntiemeticPlan(protocol,data,riskRecord);
    const interactions=interactionOverrides(protocol,data);
    const extra=resolveExtravasation(protocol,data);

    return {
      release:RELEASE,
      protocolId:String(protocol.protocol_id||""),
      nccpCode:String(metadata.nccp_regimen_code||""),
      nccpVersion:String(metadata.nccp_version||""),
      title:metadata.short_title||metadata.title||protocol.protocol_id||"SACT regimen",
      indication:metadata.indication||"",
      sourceUrl:metadata.source_url||"",
      components:componentNames(protocol),
      emetogenic:riskRecord,
      supportiveCare:supportive,
      interactionOverrides:interactions,
      extravasation:extra,
      modules:{
        assessment:{status:"available"},
        consent:{status:root?.SACTCheckRegimenConsentBuilder?"available":"available_when_loaded"},
        supportiveCare:{status:supportive.status},
        extravasation:{status:extra.status},
        patientInformation:{status:"planned",label:"Patient regimen hub / QR"},
        evidence:{status:"available"}
      }
    };
  }

  async function load(){
    if(dataCache) return dataCache;
    if(dataPromise) return dataPromise;
    if(typeof fetch!=="function") throw new Error("Workflow data cannot be loaded in this environment.");
    dataPromise=fetch(`${DATA_URL}?v=${RELEASE}`,{cache:"no-store"})
      .then(response=>{
        if(!response.ok) throw new Error(`Workflow data HTTP ${response.status}`);
        return response.json();
      })
      .then(payload=>{
        if(payload?.release!==RELEASE) throw new Error(`Expected workflow data ${RELEASE}.`);
        dataCache=payload; return payload;
      }).catch(error=>{dataPromise=null; throw error;});
    return dataPromise;
  }

  async function resolve(protocol,options={}){
    const data=await load();
    const risk=root?.SACTCheckEmetogenicRisk?.get?.(protocol,options)||{
      level:protocol?.supportive_care?.emetogenic_risk||protocol?.metadata?.emetogenic_risk||"pending",
      label:"Emetogenic risk requires review"
    };
    return buildManifest(protocol,data,risk);
  }

  function ensureCss(){
    if(!root?.document||root.document.querySelector('link[data-regimen-workflow-style]')) return;
    const link=root.document.createElement("link");
    link.rel="stylesheet";
    link.href=`css/regimen-workflow-v0720.css?v=${RELEASE}`;
    link.dataset.regimenWorkflowStyle="true";
    root.document.head.appendChild(link);
  }

  async function ensurePdf(){
    if(root?.SACTCheckSupportiveCarePdf?.release===RELEASE) return root.SACTCheckSupportiveCarePdf;
    if(pdfPromise) return pdfPromise;
    if(!root?.document) throw new Error("Supportive-care PDF exporter unavailable.");
    pdfPromise=new Promise((resolve,reject)=>{
      const existing=root.document.querySelector('script[data-supportive-care-pdf]');
      existing?.remove();
      const script=root.document.createElement("script");
      script.src=PDF_URL;
      script.defer=true;
      script.dataset.supportiveCarePdf="true";
      script.addEventListener("load",()=>{
        if(root.SACTCheckSupportiveCarePdf?.release===RELEASE) resolve(root.SACTCheckSupportiveCarePdf);
        else reject(new Error("Supportive-care PDF exporter did not initialise."));
      },{once:true});
      script.addEventListener("error",()=>reject(new Error("Supportive-care PDF exporter could not be loaded.")),{once:true});
      root.document.head.appendChild(script);
    }).catch(error=>{pdfPromise=null;throw error;});
    return pdfPromise;
  }

  function openPdfPlaceholder(){
    const viewer=root?.open?.("about:blank","_blank");
    if(!viewer) return null;
    try{
      viewer.document.title="Preparing SACTCheck supportive-care PDF";
      viewer.document.body.innerHTML='<div style="font-family:Arial,sans-serif;padding:32px;color:#12314a"><h2>Preparing supportive-care PDF...</h2><p>Use the browser PDF controls to print or download only if needed.</p></div>';
    }catch(_){}
    return viewer;
  }

  async function openSupportivePdf(protocol){
    const viewer=openPdfPlaceholder();
    try{
      const [manifest,pdf,data]=await Promise.all([resolve(protocol),ensurePdf(),load()]);
      if(manifest.supportiveCare.status!=="available"){
        try{viewer?.close?.();}catch(_){}
        root.alert?.(manifest.supportiveCare.message||"A single supportive-care template cannot be generated for this regimen.");
        return null;
      }
      const payload={manifest,sources:data.sources,generatedAt:new Date().toISOString()};
      return pdf.openInViewer(payload,viewer);
    }catch(error){
      try{viewer?.close?.();}catch(_){}
      root.alert?.(`Supportive-care PDF could not be generated.\n\n${error.message}`);
      return null;
    }
  }

  function cardFor(protocol){
    const id=String(protocol?.protocol_id||"");
    return [...root.document.querySelectorAll(".regimen-card[data-json-protocol-id]")]
      .find(card=>String(card.dataset.jsonProtocolId||"")===id)||null;
  }

  function closePanel(){
    const overlay=root?.document?.getElementById("regimenWorkflowOverlay");
    if(overlay) overlay.hidden=true;
    root.document?.body?.classList?.remove("workflow-panel-open");
    activeProtocol=null; activeManifest=null;
  }

  function moduleStatus(status){
    if(status==="available") return '<span class="workflow-status available">Ready</span>';
    if(status==="planned") return '<span class="workflow-status planned">Planned</span>';
    if(status==="phase_review_required"||status==="review_required") return '<span class="workflow-status review">Review</span>';
    if(status==="source_only") return '<span class="workflow-status source">Source-led</span>';
    return '<span class="workflow-status muted">Check</span>';
  }

  function ensurePanel(){
    if(!root?.document) return null;
    let overlay=root.document.getElementById("regimenWorkflowOverlay");
    if(overlay) return overlay;
    overlay=root.document.createElement("div");
    overlay.id="regimenWorkflowOverlay";
    overlay.className="workflow-overlay";
    overlay.hidden=true;
    overlay.innerHTML=`
      <div class="workflow-backdrop" data-close-workflow></div>
      <aside class="workflow-panel" role="dialog" aria-modal="true" aria-labelledby="workflowPanelTitle">
        <header class="workflow-panel-header">
          <div class="workflow-panel-brand">
            <img src="assets/branding/sactcheck-mark.svg" alt="">
            <div><span>SACTCheck</span><strong>Regimen workflow</strong></div>
          </div>
          <button type="button" class="workflow-close" data-close-workflow aria-label="Close">×</button>
        </header>
        <div id="workflowPanelBody" class="workflow-panel-body"></div>
      </aside>`;
    root.document.body.appendChild(overlay);
    overlay.querySelectorAll("[data-close-workflow]").forEach(el=>el.addEventListener("click",closePanel));
    overlay.addEventListener("keydown",e=>{if(e.key==="Escape") closePanel();});
    return overlay;
  }

  function renderExtravasation(manifest){
    const x=manifest.extravasation;
    if(!x.agents.length){
      return `<div class="workflow-empty">No mapped parenteral extravasation component was identified from the encoded regimen. Verify the official source/local policy where relevant.</div>`;
    }
    return `<div class="workflow-extra-list">${x.agents.map(item=>`
      <div class="workflow-extra-row">
        <div><strong>${esc(item.drug)}</strong><span class="workflow-extra-class ${esc(item.colour)}">${esc(item.classLabel)}</span></div>
        <p><b>Compress:</b> ${esc(item.compress||"See guidance")} · <b>Antidote:</b> ${esc(item.antidote||"See guidance")}</p>
      </div>`).join("")}</div>`;
  }

  function renderInteractions(manifest){
    if(!manifest.interactionOverrides.length) return "";
    return `<div class="workflow-alert"><strong>Regimen-specific supportive-care check</strong>${manifest.interactionOverrides.map(rule=>
      `<p>${esc(rule.message)}</p>${rule.source?.url?`<a href="${esc(rule.source.url)}" target="_blank" rel="noopener noreferrer">Source ↗</a>`:""}`
    ).join("")}</div>`;
  }

  function renderPanel(manifest){
    const body=root.document.getElementById("workflowPanelBody");
    if(!body) return;
    const risk=manifest.emetogenic||{};
    const supportive=manifest.supportiveCare||{};
    const extra=manifest.extravasation||{};
    body.innerHTML=`
      <section class="workflow-hero-card">
        <span class="workflow-eyebrow">One regimen · one clinical workflow</span>
        <h2 id="workflowPanelTitle">${esc(manifest.title)}</h2>
        <p>${esc(manifest.nccpCode?`NCCP ${manifest.nccpCode}${manifest.nccpVersion?` · v${manifest.nccpVersion}`:""}`:"Regimen source")}</p>
        <div class="workflow-component-line">${manifest.components.map(x=>`<span>${esc(x)}</span>`).join("")}</div>
      </section>

      <div class="workflow-module-grid">
        <article class="workflow-module assessment">
          <div class="workflow-module-icon">✓</div>
          <div><span>Clinical</span><h3>Assess treatment</h3><p>Open the existing structured NCCP assessment engine.</p></div>
          ${moduleStatus("available")}
          <button class="btn workflow-module-action" type="button" data-workflow-assess>Open assessment</button>
        </article>

        <article class="workflow-module consent">
          <div class="workflow-module-icon">✎</div>
          <div><span>Documentation</span><h3>Regimen consent</h3><p>Open the concise regimen-specific two-page consent PDF.</p></div>
          ${moduleStatus("available")}
          <button class="btn secondary workflow-module-action" type="button" data-workflow-consent>Open consent PDF</button>
        </article>

        <article class="workflow-module supportive">
          <div class="workflow-module-icon">Rx</div>
          <div><span>Supportive care</span><h3>${esc(risk.label||supportive.label||"Antiemetic support")}</h3><p>${esc(supportive.label||supportive.message||"Regimen-derived supportive care")}</p></div>
          ${moduleStatus(supportive.status)}
          <button class="btn secondary workflow-module-action" type="button" data-workflow-support ${supportive.status==="available"?"":"disabled"}>Open prescribing support</button>
          <a class="workflow-source-link" href="${esc(dataCache?.sources?.nccp_antiemetic_v8?.url||"")}" target="_blank" rel="noopener noreferrer">NCCP antiemetic source ↗</a>
        </article>

        <article class="workflow-module extravasation">
          <div class="workflow-module-icon">IV</div>
          <div><span>Administration safety</span><h3>Extravasation</h3><p>${extra.highest?`${esc(extra.highest.drug)} · ${esc(extra.highest.classLabel)}`:"Regimen-derived parenteral risk"}</p></div>
          ${moduleStatus(extra.status==="available"?"available":"review_required")}
          <div class="workflow-module-expanded">${renderExtravasation(manifest)}</div>
          ${extra.sourceGuidance?.url?`<a class="workflow-source-link" href="${esc(extra.sourceGuidance.url)}" target="_blank" rel="noopener noreferrer">NCCP extravasation guidance ↗</a>`:""}
        </article>

        <article class="workflow-module patient planned">
          <div class="workflow-module-icon">QR</div>
          <div><span>Patient</span><h3>Patient regimen hub</h3><p>Permanent patient-agnostic regimen page and QR will use this same workflow manifest.</p></div>
          ${moduleStatus("planned")}
        </article>

        <article class="workflow-module source">
          <div class="workflow-module-icon">↗</div>
          <div><span>Source</span><h3>Verify NCCP regimen</h3><p>Keep the current national regimen source visible at the point of care.</p></div>
          ${moduleStatus(manifest.sourceUrl?"available":"review_required")}
          ${manifest.sourceUrl?`<a class="btn secondary workflow-module-action" href="${esc(manifest.sourceUrl)}" target="_blank" rel="noopener noreferrer">Official NCCP PDF</a>`:""}
        </article>
      </div>
      ${renderInteractions(manifest)}
      <div class="workflow-boundary"><strong>Clinician-controlled workflow.</strong> SACTCheck surfaces regimen-derived tools and source-linked guidance. It does not prescribe, authorise treatment or replace the current NCCP regimen, local policy or independent clinical judgement.</div>
    `;

    body.querySelector("[data-workflow-assess]")?.addEventListener("click",()=>{
      const card=cardFor(activeProtocol);
      closePanel();
      card?.querySelector(".json-assessment-launch")?.click();
    });
    body.querySelector("[data-workflow-consent]")?.addEventListener("click",()=>{
      const protocol=activeProtocol;
      closePanel();
      root.SACTCheckRegimenConsentBuilder?.open?.(protocol);
    });
    body.querySelector("[data-workflow-support]")?.addEventListener("click",()=>{
      const protocol=activeProtocol;
      openSupportivePdf(protocol);
    });
  }

  async function open(protocol,options={}){
    const overlay=ensurePanel();
    if(!overlay||!protocol) return;
    activeProtocol=protocol;
    const body=root.document.getElementById("workflowPanelBody");
    body.innerHTML='<div class="workflow-loading">Building regimen workflow...</div>';
    overlay.hidden=false;
    root.document.body.classList.add("workflow-panel-open");
    try{
      activeManifest=await resolve(protocol,options);
      renderPanel(activeManifest);
    }catch(error){
      body.innerHTML=`<div class="workflow-error"><strong>Workflow could not be generated.</strong><p>${esc(error.message)}</p></div>`;
    }
  }

  function addWorkflowButtons(){
    const records=root?.SACTCheckProtocolLoader?.getLoadedProtocols?.()||root?.SACTCHECK_PROTOCOLS||[];
    let added=0;
    asArray(records).forEach(record=>{
      const protocol=record?.protocol||record;
      if(!protocol?.protocol_id) return;
      const card=cardFor(protocol);
      const actions=card?.querySelector(".card-actions");
      if(!actions||actions.querySelector("[data-open-regimen-workflow]")) return;
      const button=root.document.createElement("button");
      button.type="button";
      button.className="btn workflow-card-button";
      button.dataset.openRegimenWorkflow=protocol.protocol_id;
      button.innerHTML='<span aria-hidden="true">✦</span> Clinic workflow';
      button.addEventListener("click",event=>{
        event.preventDefault();event.stopPropagation();
        const live=root.SACTCheckProtocolLoader?.getProtocolById?.(protocol.protocol_id)||protocol;
        open(live);
      });
      const consent=actions.querySelector("[data-open-regimen-consent]");
      if(consent) consent.insertAdjacentElement("beforebegin",button);
      else actions.prepend(button);
      added++;
    });
    return added;
  }

  function bindEmetogenicBadges(){
    root.document.querySelectorAll(".regimen-card .emetogenic-badge").forEach(badge=>{
      if(badge.dataset.workflowBound==="true") return;
      badge.dataset.workflowBound="true";
      badge.addEventListener("click",event=>{
        const card=badge.closest(".regimen-card[data-json-protocol-id]");
        const id=card?.dataset?.jsonProtocolId;
        if(!id) return;
        event.preventDefault();event.stopPropagation();
        const protocol=root.SACTCheckProtocolLoader?.getProtocolById?.(id);
        if(protocol) open(protocol);
      });
      badge.title="Open regimen-derived supportive-care workflow";
    });
  }

  function removeUnusedRegimenImporter(){
    root.document.querySelectorAll("#openProtocolImporter,#developerTools,[data-open-protocol-importer],.protocol-importer-launch,.add-regimen-button")
      .forEach(el=>el.remove());
    root.document.querySelectorAll("button,a").forEach(el=>{
      const text=String(el.textContent||"").trim().toLowerCase();
      const aria=String(el.getAttribute("aria-label")||"").toLowerCase();
      if(text==="add regimen"||aria.includes("add regimen")) el.remove();
    });
  }

  function applyBranding(){
    // v0.75.1: the interface shell owns the homepage hero. The workflow engine
    // must not inject a second logo or overwrite patient-facing hero copy.
    root.document.querySelectorAll?.(".workflow-brand-lockup").forEach?.(x=>x.remove());
    const meta=root.document.querySelector('meta[name="sactcheck-release"]');
    if(meta) meta.setAttribute("content",RELEASE);
    const headerVersion=root.document.querySelector(".header-version");
    if(headerVersion) headerVersion.textContent=`v${RELEASE}`;
  }

  function refresh(){
    ensureCss();
    removeUnusedRegimenImporter();
    applyBranding();
    addWorkflowButtons();
    bindEmetogenicBadges();
  }

  function install(){
    if(!root?.document) return;
    ensureCss();
    ensurePanel();
    const reassert=()=>root.setTimeout?.(refresh,0);
    root.addEventListener?.("sactcheck:protocols-loaded",reassert);
    root.addEventListener?.("sactcheck:v0700-source-reconciled",reassert);
    root.addEventListener?.("sactcheck:v0701-source-reconciled",reassert);
    root.addEventListener?.("sactcheck:engine-first-homepage-ready",reassert);
    root.document.addEventListener?.("sactcheck:regimen-card-metadata-rendered",reassert);
    if(root.document.readyState==="loading") root.document.addEventListener("DOMContentLoaded",refresh,{once:true});
    else refresh();
    root.setTimeout?.(refresh,350);
  }

  return Object.freeze({
    release:RELEASE,
    dataUrl:DATA_URL,
    normaliseDrug,
    administrationRows,
    componentNames,
    chooseAntiemeticPlan,
    interactionOverrides,
    resolveExtravasation,
    buildManifest,
    load,
    resolve,
    openSupportivePdf,
    open,
    install
  });
});
