/**
 * SACTCheck v0.71.0 — Regimen-specific SACT consent builder.
 *
 * Generates a clinician-reviewable consent discussion draft from:
 *   1) regimen metadata,
 *   2) generic chemotherapy consent content,
 *   3) generic immune-checkpoint-inhibitor consent content, and
 *   4) curated agent-specific material-risk prompts.
 *
 * No patient identifiers are requested or persisted. The current NCCP regimen,
 * HSE National Consent Policy and clinician judgement remain authoritative.
 */
(function(root,factory){
  const api=factory(root);
  if(typeof module==="object"&&module.exports) module.exports=api;
  root.SACTCheckRegimenConsentBuilder=api;
  if(root&&root.document) api.install();
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const VERSION="0.71.0";
  const CONTENT_URL="data/consent-content-v0710.json";
  let contentCache=null;
  let contentPromise=null;
  let activeProtocol=null;
  let activeDraft=null;
  let uiState=null;

  function asArray(value){
    if(value===undefined||value===null||value==="") return [];
    return Array.isArray(value)?value:[value];
  }

  function escapeHtml(value){
    return String(value??"")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function safeUrl(value){
    try{
      const url=new URL(String(value||""),root?.location?.href||"https://sactcheck.com/");
      return /^https?:$/.test(url.protocol)?url.href:"";
    }catch(_){ return ""; }
  }

  function normaliseMedicineName(value){
    return String(value??"")
      .toLowerCase()
      .replace(/[®™]/g,"")
      .replace(/\([^)]*\)/g," ")
      .replace(/[_/–—-]+/g," ")
      .replace(/\b(?:iv|po|sc|oral|infusion|bolus|tablets?|capsules?|mg|mg\/m2|mg\/kg)\b/g," ")
      .replace(/[^a-z0-9]+/g," ")
      .replace(/\s+/g," ")
      .trim();
  }

  function titleCase(value){
    return String(value||"").replace(/[_-]+/g," ").replace(/\b\w/g,c=>c.toUpperCase());
  }

  function fallbackComponents(protocol){
    const values=[];
    asArray(protocol?.treatment?.components).forEach(item=>values.push(item?.drug||item?.name||item));
    asArray(protocol?.regimen_components).forEach(item=>values.push(item?.drug||item?.name||item));
    asArray(protocol?.metadata?.drugs).forEach(item=>values.push(item?.drug||item?.name||item));
    asArray(protocol?.treatment_phases).forEach(phase=>{
      asArray(phase?.administration).forEach(item=>values.push(item?.drug||item?.name));
    });
    const seen=new Set();
    return values.filter(Boolean).map(value=>String(value).replace(/[_-]+/g," ").trim()).filter(value=>{
      const key=normaliseMedicineName(value);
      if(!key||seen.has(key)) return false;
      seen.add(key); return true;
    });
  }

  function componentsForProtocol(protocol){
    const helper=root?.SACTCheckRegimenComponents;
    const values=helper?.forProtocol?.(protocol);
    return Array.isArray(values)&&values.length?values:fallbackComponents(protocol);
  }

  function buildAgentAliasIndex(content){
    const rows=[];
    Object.entries(content?.agent_profiles||{}).forEach(([key,profile])=>{
      const names=[key,profile.display_name,...asArray(profile.aliases)];
      names.forEach(name=>{
        const normalised=normaliseMedicineName(name);
        if(normalised) rows.push({normalised,key,profile});
      });
    });
    return rows.sort((a,b)=>b.normalised.length-a.normalised.length);
  }

  function profileForComponent(component,content){
    const normalised=normaliseMedicineName(component);
    if(!normalised) return null;
    const index=buildAgentAliasIndex(content);
    const exact=index.find(item=>item.normalised===normalised);
    if(exact) return exact;
    const contained=index.find(item=>
      item.normalised.length>=4 &&
      (normalised.includes(item.normalised)||item.normalised.includes(normalised))
    );
    return contained||null;
  }

  function expandCombinedComponent(component){
    const text=normaliseMedicineName(component);
    if(text.includes("pertuzumab")&&text.includes("trastuzumab")) return ["Pertuzumab","Trastuzumab"];
    if(text.includes("trifluridine")&&text.includes("tipiracil")) return ["Trifluridine/tipiracil"];
    if(text.includes("fluorouracil")) return ["Fluorouracil"];
    if(text.includes("daratumumab")) return ["Daratumumab"];
    return [component];
  }

  function consentComponents(protocol){
    const values=componentsForProtocol(protocol).flatMap(expandCombinedComponent);
    const seen=new Set();
    return values.filter(Boolean).filter(value=>{
      const key=normaliseMedicineName(value);
      if(!key||seen.has(key)) return false;
      seen.add(key); return true;
    });
  }

  function classifyTherapy(protocol,content){
    const rawComponents=consentComponents(protocol);
    const supportive=new Set(asArray(content?.supportive_components_not_counted_as_agent_coverage).map(normaliseMedicineName));
    const treatmentClasses=asArray(protocol?.metadata?.treatment_class).map(value=>String(value).toLowerCase());
    const matches=[];
    const unmapped=[];
    const ignored=[];

    rawComponents.forEach(component=>{
      const normalised=normaliseMedicineName(component);
      if(supportive.has(normalised)){ ignored.push(component); return; }
      const match=profileForComponent(component,content);
      if(match) matches.push({component,key:match.key,profile:match.profile});
      else unmapped.push(component);
    });

    const cytotoxic=Boolean(
      protocol?.metadata?.cytotoxic===true ||
      treatmentClasses.some(value=>value.includes("cytotoxic")||value.includes("chemotherapy")) ||
      matches.some(item=>item.profile?.category==="cytotoxic")
    );
    const immunotherapy=Boolean(
      treatmentClasses.some(value=>value.includes("immunotherapy")||value.includes("immune_checkpoint")) ||
      matches.some(item=>item.profile?.module==="immune_checkpoint_inhibitor")
    );

    return {
      cytotoxic,
      immunotherapy,
      components:rawComponents,
      mappedAgents:matches,
      unmappedAgents:[...new Set(unmapped)],
      ignoredComponents:ignored
    };
  }

  function normaliseRisk(risk,prefix,extra={}){
    return {
      id:`${prefix}:${risk.id}`,
      label:risk.label,
      detail:risk.detail,
      tier:risk.tier||"important",
      ...extra
    };
  }

  function deriveIntent(protocol){
    const metadata=protocol?.metadata||{};
    const candidates=[
      metadata?.regimen_card?.intent,
      metadata?.regimen_card?.treatment_intent,
      metadata.treatment_intent,
      ...asArray(metadata.treatment_context),
      ...asArray(metadata.treatment_setting)
    ].filter(Boolean).map(String);
    const text=candidates.join(" ").toLowerCase();
    const labels=[];
    if(/\bneoadjuvant\b/.test(text)) labels.push("Neoadjuvant");
    if(/\badjuvant\b/.test(text)) labels.push("Adjuvant");
    if(/\bcurative\b/.test(text)) labels.push("Curative");
    if(/\bpalliative\b/.test(text)) labels.push("Palliative");
    if(/\bmaintenance\b/.test(text)) labels.push("Maintenance");
    if(/\bconsolidation\b/.test(text)) labels.push("Consolidation");
    if(/\bmetastatic|advanced|unresectable\b/.test(text)&&!labels.length) labels.push("Advanced/metastatic disease — clinician to confirm treatment intent");
    return labels.length?[...new Set(labels)].join(" / "):"Clinician to confirm treatment intent";
  }

  function scheduleSummary(protocol){
    const phases=asArray(protocol?.treatment_phases);
    const parts=[];
    phases.slice(0,4).forEach(phase=>{
      const cycle=Number(phase?.cycle_length_days);
      const administrations=asArray(phase?.administration);
      const days=[...new Set(administrations.map(item=>item?.day).filter(Boolean).map(String))];
      const medicines=[...new Set(administrations.map(item=>item?.drug||item?.name).filter(Boolean).map(value=>String(value).replace(/[_-]+/g," ")))];
      const items=[];
      if(cycle) items.push(`${cycle}-day cycle`);
      if(days.length) items.push(`administration ${days.map(day=>String(day).match(/^day/i)?day:`day ${day}`).join(", ")}`);
      if(medicines.length&&phases.length>1) items.push(medicines.join(" + "));
      if(items.length) parts.push(items.join(" · "));
    });
    return parts.length?parts.join(" → "):"Confirm schedule against the current NCCP regimen.";
  }

  function buildDraft(protocol,content,options={}){
    if(!protocol) throw new Error("A regimen protocol is required.");
    const classification=classifyTherapy(protocol,content);
    const includeChemo=options.includeChemo??classification.cytotoxic;
    const includeImmunotherapy=options.includeImmunotherapy??classification.immunotherapy;
    const includeAgents=options.includeAgents??true;

    const genericChemo=includeChemo
      ? asArray(content?.generic_modules?.cytotoxic_chemotherapy?.risks).map(r=>normaliseRisk(r,"chemo",{group:"Generic chemotherapy"}))
      : [];
    const immunotherapy=includeImmunotherapy
      ? asArray(content?.generic_modules?.immune_checkpoint_inhibitor?.risks).map(r=>normaliseRisk(r,"immune",{group:"Immunotherapy"}))
      : [];

    const agentGroups=includeAgents?classification.mappedAgents.map(item=>({
      key:item.key,
      component:item.component,
      displayName:item.profile.display_name,
      module:item.profile.module||null,
      reviewStatus:item.profile.review_status,
      sourceBasis:item.profile.source_basis,
      risks:asArray(item.profile.risks).map(r=>normaliseRisk(r,`agent:${item.key}`,{
        group:item.profile.display_name,
        agentKey:item.key
      }))
    })):[];
    const metadata=protocol.metadata||{};
    return {
      version:VERSION,
      title:metadata.title||metadata.short_title||protocol.protocol_id||"SACT regimen",
      shortTitle:metadata.short_title||metadata.title||"SACT regimen",
      nccpCode:String(metadata.nccp_regimen_code||""),
      nccpVersion:String(metadata.nccp_version||""),
      indication:metadata.indication||asArray(protocol.indications).map(item=>item?.description).filter(Boolean).join(" ")||"Clinician to confirm diagnosis / indication.",
      intent:deriveIntent(protocol),
      schedule:scheduleSummary(protocol),
      components:classification.components,
      sourceUrl:safeUrl(metadata.source_url),
      sourceCatalogueUrl:safeUrl(metadata.source_catalogue_url),
      classification,
      genericChemo,
      immunotherapy,
      agentGroups,
      coverage:{
        mapped:classification.mappedAgents.length,
        unmapped:classification.unmappedAgents.length,
        unmappedAgents:classification.unmappedAgents.slice()
      }
    };
  }

  function validateContent(content){
    const errors=[];
    if(content?.release!==VERSION) errors.push(`Expected consent-content release ${VERSION}.`);
    if(!content?.generic_modules?.cytotoxic_chemotherapy?.risks?.length) errors.push("Generic chemotherapy module is missing.");
    if(!content?.generic_modules?.immune_checkpoint_inhibitor?.risks?.length) errors.push("Generic immunotherapy module is missing.");
    if(Object.keys(content?.agent_profiles||{}).length<40) errors.push("Agent-specific risk library is unexpectedly small.");
    const sourceIds=new Set(asArray(content?.sources).map(item=>item.id));
    if(!sourceIds.has("hse_national_consent_policy")) errors.push("HSE National Consent Policy source is missing.");
    if(!sourceIds.has("nccp_sact_consent_resources")) errors.push("NCCP SACT consent resource source is missing.");
    return {valid:errors.length===0,errors};
  }

  async function loadContent(){
    if(contentCache) return contentCache;
    if(contentPromise) return contentPromise;
    if(typeof fetch!=="function") throw new Error("Consent content cannot be loaded in this environment.");
    contentPromise=fetch(`${CONTENT_URL}?v=${VERSION}`,{cache:"no-store"})
      .then(response=>{
        if(!response.ok) throw new Error(`Consent content HTTP ${response.status}`);
        return response.json();
      })
      .then(payload=>{
        const validation=validateContent(payload);
        if(!validation.valid) throw new Error(validation.errors.join(" "));
        contentCache=payload;
        return payload;
      })
      .catch(error=>{
        contentPromise=null;
        throw error;
      });
    return contentPromise;
  }

  function applyReleaseLabel(){
    if(!root?.document) return;
    root.document.title=`SACTCheck v${VERSION} — Regimen Consent Builder`;
    const meta=root.document.querySelector('meta[name="sactcheck-release"]');
    if(meta) meta.setAttribute("content",VERSION);
    const version=root.document.querySelector(".header-version");
    if(version) version.textContent=`v${VERSION}`;
    const summary=root.document.querySelector("#releaseSummary summary");
    if(summary) summary.textContent=`v${VERSION} · Regimen-specific consent builder`;
    const detail=root.document.querySelector("#releaseSummary .release-detail");
    if(detail){
      const strong=detail.querySelector("strong");
      if(strong) strong.textContent="Regimen-specific consent builder";
      const textNodes=[...detail.childNodes].filter(node=>node.nodeType===3);
      if(textNodes.length){
        textNodes[0].textContent=" Generates a clinician-reviewable consent discussion from regimen context, generic chemotherapy or immunotherapy risks and mapped agent-specific material-risk prompts. Patient identifiers are not stored.";
      }
    }
    root.document.querySelectorAll(".app-footer small").forEach(node=>{
      node.textContent=node.textContent.replace(/SACTCheck v\d+\.\d+\.\d+/g,`SACTCheck v${VERSION}`);
    });
  }

  function ensureStyles(){
    if(!root?.document||root.document.querySelector('link[data-consent-builder-style]')) return;
    const link=root.document.createElement("link");
    link.rel="stylesheet";
    link.href=`css/regimen-consent-builder-v0710.css?v=${VERSION}`;
    link.dataset.consentBuilderStyle="true";
    root.document.head?.appendChild(link);
  }

  function showScreen(id){
    if(typeof root.showScreen==="function") root.showScreen(id);
    else{
      root.document.querySelectorAll(".screen").forEach(screen=>screen.classList.remove("active"));
      root.document.getElementById(id)?.classList.add("active");
      root.scrollTo?.(0,0);
    }
  }

  function ensureScreen(){
    if(!root?.document) return null;
    let screen=root.document.getElementById("consentBuilderScreen");
    if(screen) return screen;
    screen=root.document.createElement("div");
    screen.id="consentBuilderScreen";
    screen.className="screen consent-builder-screen";
    screen.innerHTML=`
      <div class="consent-builder-toolbar toolbar spread">
        <button type="button" class="btn secondary" data-consent-back>← Regimen library</button>
        <div class="consent-toolbar-actions">
          <button type="button" class="btn secondary" data-consent-copy>Copy consent text</button>
          <button type="button" class="btn" data-consent-print>Print / Save PDF</button>
        </div>
      </div>

      <section class="consent-builder-hero">
        <div>
          <span class="consent-builder-kicker">SACTCheck · regimen-specific consent</span>
          <h1>Consent builder</h1>
          <p>Creates a regimen-specific consent discussion draft. The consent conversation, current NCCP source and patient-specific material risks must still be reviewed by the treating clinician.</p>
        </div>
        <div class="consent-builder-safety">
          <strong>No patient identifiers stored</strong>
          <span>Complete name, MRN, DOB and signatures only in the approved clinical record or after printing.</span>
        </div>
      </section>

      <div id="consentBuilderLoading" class="consent-builder-loading">Preparing regimen-specific consent content…</div>

      <div id="consentBuilderContent" class="consent-builder-layout" hidden>
        <div class="consent-builder-controls">
          <section class="consent-control-card">
            <div class="consent-control-heading">
              <div><span>Regimen</span><h2 id="consentRegimenTitle">—</h2></div>
              <span id="consentCoverageBadge" class="consent-coverage-badge">—</span>
            </div>
            <div id="consentRegimenMeta" class="consent-regimen-meta"></div>
            <div class="consent-source-actions">
              <a id="consentNccpSource" class="btn secondary hidden" target="_blank" rel="noopener noreferrer">Official NCCP regimen</a>
              <a id="consentNccpCatalogue" class="btn secondary hidden" target="_blank" rel="noopener noreferrer">NCCP catalogue</a>
            </div>
          </section>

          <section class="consent-control-card">
            <span class="consent-section-eyebrow">Automatic consent layers</span>
            <h2>What should be included?</h2>
            <label class="consent-layer-toggle"><input type="checkbox" id="consentIncludeChemo"> <span><strong>Generic chemotherapy</strong><small>Core cytotoxic risks where applicable.</small></span></label>
            <label class="consent-layer-toggle"><input type="checkbox" id="consentIncludeImmune"> <span><strong>Generic immunotherapy</strong><small>Immune-mediated toxicities and delayed effects.</small></span></label>
            <label class="consent-layer-toggle"><input type="checkbox" id="consentIncludeAgents" checked> <span><strong>Agent-specific risks</strong><small>Mapped risks for the medicines in this exact regimen.</small></span></label>
          </section>

          <section class="consent-control-card">
            <span class="consent-section-eyebrow">HSE consent domains</span>
            <h2>Patient-specific discussion</h2>
            <label>Diagnosis / clinical context
              <textarea id="consentDiagnosis" rows="3"></textarea>
            </label>
            <label>Treatment intent — confirm
              <input id="consentIntent" type="text">
            </label>
            <label>Expected benefit / aim of treatment <span class="consent-required">*</span>
              <textarea id="consentBenefit" rows="3" placeholder="Clinician to document the expected benefit / aim for this patient."></textarea>
            </label>
            <label>Reasonable alternatives discussed <span class="consent-required">*</span>
              <textarea id="consentAlternatives" rows="3" placeholder="Clinician to document relevant alternatives, including supportive care where appropriate."></textarea>
            </label>
            <label>What may happen if treatment does not proceed <span class="consent-required">*</span>
              <textarea id="consentNoTreatment" rows="3" placeholder="Clinician to document the likely consequence of declining or deferring treatment."></textarea>
            </label>
            <label>Additional patient-specific material risks
              <textarea id="consentCustomRisks" rows="3" placeholder="Comorbidities, previous toxicity, individual priorities or additional material risks."></textarea>
            </label>
            <label>Pregnancy / contraception / fertility discussion
              <textarea id="consentFertility" rows="2" placeholder="Document where clinically relevant."></textarea>
            </label>
            <label>Patient questions / additional notes
              <textarea id="consentQuestions" rows="3"></textarea>
            </label>
          </section>

          <section class="consent-control-card">
            <div class="consent-control-heading compact">
              <div><span class="consent-section-eyebrow">Auto-selected material-risk prompts</span><h2>Review risks</h2></div>
              <button type="button" class="btn secondary consent-small-button" data-consent-select-all>Select all</button>
            </div>
            <div id="consentRiskChecklist" class="consent-risk-checklist"></div>
            <p class="consent-review-warning">Risk prompts are a structured draft, not an exhaustive SmPC list. Unmapped agents are clearly flagged and require manual review before formal clinical use.</p>
          </section>
        </div>

        <div class="consent-builder-preview-column">
          <div id="consentCompletion" class="consent-completion-strip"></div>
          <article id="consentPreview" class="consent-print-sheet"></article>
        </div>
      </div>
    `;
    const mount=root.document.querySelector("main")||root.document.body;
    mount.appendChild(screen);
    bindScreen(screen);
    return screen;
  }

  function sourceById(id){
    return asArray(contentCache?.sources).find(item=>item.id===id)||null;
  }

  function selectedRiskIds(){
    return uiState?.selectedRiskIds||new Set();
  }

  function currentFields(){
    if(!root?.document) return {};
    const get=id=>root.document.getElementById(id)?.value?.trim?.()||"";
    return {
      diagnosis:get("consentDiagnosis"),
      intent:get("consentIntent"),
      benefit:get("consentBenefit"),
      alternatives:get("consentAlternatives"),
      noTreatment:get("consentNoTreatment"),
      customRisks:get("consentCustomRisks"),
      fertility:get("consentFertility"),
      questions:get("consentQuestions")
    };
  }

  function activeRiskGroups(){
    if(!activeDraft||!uiState) return [];
    const groups=[];
    if(uiState.includeChemo){
      groups.push({title:"Generic chemotherapy risks",risks:activeDraft.genericChemo});
    }
    if(uiState.includeImmunotherapy){
      groups.push({title:"Immunotherapy / immune-related risks",risks:activeDraft.immunotherapy});
    }
    if(uiState.includeAgents){
      activeDraft.agentGroups.forEach(group=>{
        groups.push({title:`${group.displayName} — agent-specific risks`,risks:group.risks});
      });
    }
    return groups.map(group=>({
      ...group,
      risks:group.risks.filter(item=>selectedRiskIds().has(item.id))
    })).filter(group=>group.risks.length);
  }

  function renderRiskChecklist(){
    const target=root.document.getElementById("consentRiskChecklist");
    if(!target||!activeDraft) return;
    const blocks=[];
    const makeBlock=(title,risks,prefix)=>{
      if(!risks.length) return;
      blocks.push(`<div class="consent-risk-group"><h3>${escapeHtml(title)}</h3>${risks.map(item=>`
        <label class="consent-risk-option">
          <input type="checkbox" data-consent-risk-id="${escapeHtml(item.id)}" ${selectedRiskIds().has(item.id)?"checked":""}>
          <span><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.detail)}</small></span>
          <em class="consent-risk-tier ${escapeHtml(item.tier)}">${escapeHtml(item.tier==="serious"?"Important / serious":"Important")}</em>
        </label>`).join("")}</div>`);
    };
    makeBlock("Generic chemotherapy",activeDraft.genericChemo,"chemo");
    makeBlock("Immunotherapy",activeDraft.immunotherapy,"immune");
    activeDraft.agentGroups.forEach(group=>{
      if(group.risks.length) makeBlock(group.displayName,group.risks,group.key);
      else if(group.module==="immune_checkpoint_inhibitor"){
        blocks.push(`<div class="consent-risk-group consent-risk-module-only"><h3>${escapeHtml(group.displayName)}</h3><p>Agent mapped as an immune-checkpoint inhibitor. Its principal consent risks are supplied by the immunotherapy module; review the current regimen-specific NCCP source for exceptions.</p></div>`);
      }
    });
    if(activeDraft.coverage.unmapped){
      blocks.push(`<div class="consent-unmapped-warning"><strong>Agent-specific consent mapping incomplete</strong><span>${escapeHtml(activeDraft.coverage.unmappedAgents.join(", "))}</span><small>Add and verify material risks manually before using this draft clinically.</small></div>`);
    }
    target.innerHTML=blocks.join("")||'<p class="subtle">No automatic risk module is available for this regimen.</p>';
  }

  function renderRegimenHeader(){
    if(!activeDraft) return;
    root.document.getElementById("consentRegimenTitle").textContent=activeDraft.title;
    const coverage=root.document.getElementById("consentCoverageBadge");
    if(activeDraft.coverage.unmapped===0){
      coverage.textContent=`Agent mapping ${activeDraft.coverage.mapped}/${activeDraft.coverage.mapped}`;
      coverage.className="consent-coverage-badge complete";
    }else{
      coverage.textContent=`${activeDraft.coverage.unmapped} agent${activeDraft.coverage.unmapped===1?"":"s"} need review`;
      coverage.className="consent-coverage-badge review";
    }
    const meta=root.document.getElementById("consentRegimenMeta");
    meta.innerHTML=`
      <div><span>NCCP</span><strong>${escapeHtml(activeDraft.nccpCode||"—")} · v${escapeHtml(activeDraft.nccpVersion||"—")}</strong></div>
      <div><span>Components</span><strong>${escapeHtml(activeDraft.components.join(" · ")||"Confirm against source")}</strong></div>
      <div><span>Schedule</span><strong>${escapeHtml(activeDraft.schedule)}</strong></div>
      <div><span>Consent content</span><strong>Draft · clinical / pharmacy review pending</strong></div>`;
    const source=root.document.getElementById("consentNccpSource");
    if(activeDraft.sourceUrl){ source.href=activeDraft.sourceUrl; source.classList.remove("hidden"); }
    else{ source.removeAttribute("href"); source.classList.add("hidden"); }
    const catalogue=root.document.getElementById("consentNccpCatalogue");
    if(activeDraft.sourceCatalogueUrl){ catalogue.href=activeDraft.sourceCatalogueUrl; catalogue.classList.remove("hidden"); }
    else{ catalogue.removeAttribute("href"); catalogue.classList.add("hidden"); }
  }

  function fieldOrPlaceholder(value,label){
    return value
      ? `<p>${escapeHtml(value)}</p>`
      : `<p class="consent-missing-field">Clinician to complete: ${escapeHtml(label)}</p>`;
  }

  function renderPreview(){
    const target=root.document.getElementById("consentPreview");
    if(!target||!activeDraft) return;
    const fields=currentFields();
    const groups=activeRiskGroups();
    const policy=sourceById("hse_national_consent_policy");
    const nccp=sourceById("nccp_sact_consent_resources");
    const incomplete=["benefit","alternatives","noTreatment"].filter(key=>!fields[key]);
    const completion=root.document.getElementById("consentCompletion");
    completion.className=`consent-completion-strip ${incomplete.length?"incomplete":"complete"}`;
    completion.innerHTML=incomplete.length
      ? `<strong>${3-incomplete.length}/3 core HSE discussion fields completed</strong><span>Benefit, alternatives and consequences of no treatment must be completed before finalising the consent discussion.</span>`
      : `<strong>Core consent discussion fields completed</strong><span>Continue to review patient-specific material risks, questions and signatures.</span>`;

    const risksHtml=groups.length?groups.map(group=>`
      <section class="consent-document-section">
        <h3>${escapeHtml(group.title)}</h3>
        <ul>${group.risks.map(item=>`<li><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.detail)}</li>`).join("")}</ul>
      </section>`).join(""):'<p>No automatic risk prompts selected.</p>';

    const unmapped=activeDraft.coverage.unmapped
      ? `<div class="consent-document-warning"><strong>Agent-specific content requiring manual completion:</strong> ${escapeHtml(activeDraft.coverage.unmappedAgents.join(", "))}. Do not finalise without reviewing the current NCCP regimen and medicine product information.</div>`
      : "";

    target.innerHTML=`
      <header class="consent-document-header">
        <div>
          <span>SACTCheck regimen-specific SACT consent discussion</span>
          <h2>${escapeHtml(activeDraft.title)}</h2>
          <p>NCCP ${escapeHtml(activeDraft.nccpCode||"—")} · Version ${escapeHtml(activeDraft.nccpVersion||"—")}</p>
        </div>
        <strong class="consent-draft-stamp">DRAFT · CLINICIAN REVIEW REQUIRED</strong>
      </header>

      <div class="consent-identifiers">
        <span>Patient name: ______________________________</span>
        <span>Hospital number: __________________________</span>
        <span>DOB: _____________________________________</span>
      </div>
      <p class="consent-privacy-note">Patient identifiers are intentionally not entered into or stored by SACTCheck. Complete them only on the approved clinical record / printed form.</p>

      <section class="consent-document-section">
        <h3>Diagnosis / treatment context</h3>
        ${fieldOrPlaceholder(fields.diagnosis,"diagnosis / clinical context")}
        <div class="consent-document-grid">
          <div><span>Treatment intent</span><strong>${escapeHtml(fields.intent||"Clinician to confirm")}</strong></div>
          <div><span>Regimen components</span><strong>${escapeHtml(activeDraft.components.join(" · ")||"Confirm against NCCP source")}</strong></div>
          <div><span>Schedule</span><strong>${escapeHtml(activeDraft.schedule)}</strong></div>
          <div><span>Current source</span><strong>NCCP ${escapeHtml(activeDraft.nccpCode||"—")} v${escapeHtml(activeDraft.nccpVersion||"—")}</strong></div>
        </div>
      </section>

      <section class="consent-document-section">
        <h3>Purpose and expected benefit</h3>
        ${fieldOrPlaceholder(fields.benefit,"expected benefit / aim of treatment")}
      </section>

      <section class="consent-document-section">
        <h3>Material risks discussed</h3>
        ${unmapped}
        ${risksHtml}
        ${fields.customRisks?`<div class="consent-custom-risk"><strong>Additional patient-specific material risks:</strong><p>${escapeHtml(fields.customRisks)}</p></div>`:""}
      </section>

      <section class="consent-document-section">
        <h3>Alternatives</h3>
        ${fieldOrPlaceholder(fields.alternatives,"reasonable alternatives")}
      </section>

      <section class="consent-document-section">
        <h3>If treatment does not proceed</h3>
        ${fieldOrPlaceholder(fields.noTreatment,"what may happen if treatment is declined or deferred")}
      </section>

      <section class="consent-document-section">
        <h3>Pregnancy, contraception and fertility</h3>
        ${fields.fertility?`<p>${escapeHtml(fields.fertility)}</p>`:'<p>Discuss and document where clinically relevant to the patient and treatment.</p>'}
      </section>

      <section class="consent-document-section">
        <h3>Patient questions / additional discussion</h3>
        ${fields.questions?`<p>${escapeHtml(fields.questions)}</p>`:'<p>Questions invited; document additional points in the approved clinical record.</p>'}
      </section>

      <section class="consent-acknowledgement">
        <h3>Consent discussion checklist</h3>
        <label>□ Diagnosis / treatment context and proposed regimen explained.</label>
        <label>□ Expected benefits and treatment intent discussed.</label>
        <label>□ Material risks, including regimen-specific and patient-specific risks, discussed.</label>
        <label>□ Reasonable alternatives discussed.</label>
        <label>□ Consequences of declining or deferring treatment discussed.</label>
        <label>□ Opportunity to ask questions provided and written / electronic information offered where appropriate.</label>
        <label>□ Patient understands consent is voluntary and may be withdrawn.</label>
      </section>

      <div class="consent-signatures">
        <div><span>Patient / person giving consent</span><strong>______________________________</strong><small>Date: ______________</small></div>
        <div><span>Clinician obtaining consent</span><strong>______________________________</strong><small>Registration no.: __________ · Date: __________</small></div>
      </div>

      <footer class="consent-document-footer">
        <p><strong>Governance:</strong> This is a regimen-specific consent discussion aid and does not replace the HSE National Consent Policy, the current NCCP regimen, local governance or professional judgement. Agent-specific content remains pending independent clinical and oncology-pharmacy validation.</p>
        <p>${escapeHtml(policy?.label||"HSE National Consent Policy")} · ${escapeHtml(nccp?.label||"NCCP SACT consent resources")} · Generated with SACTCheck v${VERSION}</p>
      </footer>`;
  }

  function selectedAllRiskIds(draft){
    return new Set([
      ...draft.genericChemo,
      ...draft.immunotherapy,
      ...draft.agentGroups.flatMap(group=>group.risks)
    ].map(item=>item.id));
  }

  function populateInputs(){
    const set=(id,value)=>{ const el=root.document.getElementById(id); if(el) el.value=value||""; };
    set("consentDiagnosis",activeDraft.indication);
    set("consentIntent",activeDraft.intent);
    ["consentBenefit","consentAlternatives","consentNoTreatment","consentCustomRisks","consentFertility","consentQuestions"].forEach(id=>set(id,""));
    root.document.getElementById("consentIncludeChemo").checked=uiState.includeChemo;
    root.document.getElementById("consentIncludeImmune").checked=uiState.includeImmunotherapy;
    root.document.getElementById("consentIncludeAgents").checked=uiState.includeAgents;
  }

  function consentText(){
    if(!activeDraft) return "";
    const fields=currentFields();
    const groups=activeRiskGroups();
    const lines=[
      "SACTCheck regimen-specific SACT consent discussion",
      `Regimen: ${activeDraft.title}`,
      `NCCP: ${activeDraft.nccpCode || "—"} · Version ${activeDraft.nccpVersion || "—"}`,
      `Diagnosis / context: ${fields.diagnosis || "[clinician to complete]"}`,
      `Treatment intent: ${fields.intent || "[clinician to confirm]"}`,
      `Components: ${activeDraft.components.join(" · ") || "[confirm against NCCP source]"}`,
      `Schedule: ${activeDraft.schedule}`,
      "",
      `Expected benefit / aim: ${fields.benefit || "[clinician to complete]"}`,
      "",
      "Material risks discussed:"
    ];
    groups.forEach(group=>{
      lines.push(group.title);
      group.risks.forEach(item=>lines.push(`- ${item.label}: ${item.detail}`));
    });
    if(activeDraft.coverage.unmapped) lines.push(`- MANUAL AGENT REVIEW REQUIRED: ${activeDraft.coverage.unmappedAgents.join(", ")}`);
    if(fields.customRisks) lines.push(`- Additional patient-specific material risks: ${fields.customRisks}`);
    lines.push(
      "",
      `Alternatives: ${fields.alternatives || "[clinician to complete]"}`,
      `If treatment does not proceed: ${fields.noTreatment || "[clinician to complete]"}`,
      `Pregnancy / contraception / fertility: ${fields.fertility || "[discuss where relevant]"}`,
      `Questions / notes: ${fields.questions || "[none recorded here]"}`,
      "",
      "This draft supports but does not replace the HSE/NCCP consent process. Current NCCP source and clinician judgement remain authoritative.",
      `Generated with SACTCheck v${VERSION}.`
    );
    return lines.join("\n");
  }

  async function copyText(){
    const text=consentText();
    if(!text) return;
    try{ await root.navigator?.clipboard?.writeText(text); }
    catch(_){
      const area=root.document.createElement("textarea");
      area.value=text; area.style.position="fixed"; area.style.opacity="0";
      root.document.body.appendChild(area); area.select(); root.document.execCommand?.("copy"); area.remove();
    }
    root.showToast?.("Consent discussion text copied");
  }

  function printConsent(){
    const fields=currentFields();
    const incomplete=["benefit","alternatives","noTreatment"].filter(key=>!fields[key]);
    if(incomplete.length){
      const proceed=root.confirm?.("Core consent discussion fields are still incomplete. Print this draft anyway?");
      if(proceed===false) return;
    }
    root.print?.();
  }

  function bindScreen(screen){
    screen.querySelector("[data-consent-back]")?.addEventListener("click",()=>{
      showScreen("libraryScreen");
      if(root.history?.replaceState) root.history.replaceState(null,"","#libraryScreen");
    });
    screen.querySelector("[data-consent-copy]")?.addEventListener("click",copyText);
    screen.querySelector("[data-consent-print]")?.addEventListener("click",printConsent);
    screen.querySelector("[data-consent-select-all]")?.addEventListener("click",()=>{
      if(!activeDraft) return;
      uiState.selectedRiskIds=selectedAllRiskIds(activeDraft);
      renderRiskChecklist();
      renderPreview();
    });
    ["consentDiagnosis","consentIntent","consentBenefit","consentAlternatives","consentNoTreatment","consentCustomRisks","consentFertility","consentQuestions"]
      .forEach(id=>screen.querySelector(`#${id}`)?.addEventListener("input",renderPreview));
    screen.querySelector("#consentIncludeChemo")?.addEventListener("change",event=>{ uiState.includeChemo=event.target.checked; renderPreview(); });
    screen.querySelector("#consentIncludeImmune")?.addEventListener("change",event=>{ uiState.includeImmunotherapy=event.target.checked; renderPreview(); });
    screen.querySelector("#consentIncludeAgents")?.addEventListener("change",event=>{ uiState.includeAgents=event.target.checked; renderPreview(); });
    screen.querySelector("#consentRiskChecklist")?.addEventListener("change",event=>{
      const id=event.target?.dataset?.consentRiskId;
      if(!id) return;
      if(event.target.checked) uiState.selectedRiskIds.add(id);
      else uiState.selectedRiskIds.delete(id);
      renderPreview();
    });
  }

  async function open(protocol){
    const screen=ensureScreen();
    ensureStyles();
    applyReleaseLabel();
    activeProtocol=protocol;
    const loading=root.document.getElementById("consentBuilderLoading");
    const content=root.document.getElementById("consentBuilderContent");
    if(loading){ loading.hidden=false; loading.textContent="Preparing regimen-specific consent content…"; }
    if(content) content.hidden=true;
    showScreen("consentBuilderScreen");
    if(root.history?.replaceState) root.history.replaceState(null,"","#consentBuilderScreen");
    try{
      const payload=await loadContent();
      activeDraft=buildDraft(protocol,payload);
      uiState={
        includeChemo:activeDraft.classification.cytotoxic,
        includeImmunotherapy:activeDraft.classification.immunotherapy,
        includeAgents:true,
        selectedRiskIds:selectedAllRiskIds(activeDraft)
      };
      renderRegimenHeader();
      populateInputs();
      renderRiskChecklist();
      renderPreview();
      if(loading) loading.hidden=true;
      if(content) content.hidden=false;
    }catch(error){
      if(loading){
        loading.hidden=false;
        loading.innerHTML=`<strong>Consent content could not be loaded.</strong><span>${escapeHtml(error.message)}</span>`;
      }
    }
  }

  function cardForProtocol(protocol){
    const id=String(protocol?.protocol_id||"");
    return [...root.document.querySelectorAll(".regimen-card[data-json-protocol-id]")]
      .find(card=>String(card.dataset.jsonProtocolId||"")===id)||null;
  }

  function renderCardButtons(records){
    if(!root?.document) return 0;
    let count=0;
    asArray(records).forEach(record=>{
      const protocol=record?.protocol||record;
      if(!protocol?.protocol_id) return;
      const card=cardForProtocol(protocol);
      const actions=card?.querySelector(".card-actions");
      if(!actions||actions.querySelector("[data-open-regimen-consent]")) return;
      const button=root.document.createElement("button");
      button.type="button";
      button.className="btn secondary consent-builder-card-button";
      button.dataset.openRegimenConsent=protocol.protocol_id;
      button.setAttribute("aria-label",`Build regimen-specific consent for ${protocol?.metadata?.short_title||protocol?.metadata?.title||"this regimen"}`);
      button.innerHTML='<span aria-hidden="true">✎</span> Consent';
      button.addEventListener("click",event=>{
        event.preventDefault();
        event.stopPropagation();
        const live=root.SACTCheckProtocolLoader?.getProtocolById?.(protocol.protocol_id)||protocol;
        open(live);
      });
      const info=actions.querySelector(".regimen-info-link");
      if(info) info.insertAdjacentElement("afterend",button);
      else actions.appendChild(button);
      count++;
    });
    return count;
  }

  function refreshButtons(){
    const records=root?.SACTCheckProtocolLoader?.getLoadedProtocols?.()||root?.SACTCHECK_PROTOCOLS||[];
    return renderCardButtons(records);
  }

  function install(){
    if(!root?.document||root.document.documentElement?.dataset?.consentBuilderInstalled==="true") return;
    root.document.documentElement.dataset.consentBuilderInstalled="true";
    ensureStyles();
    ensureScreen();
    applyReleaseLabel();
    const reassert=()=>root.setTimeout?.(()=>{ applyReleaseLabel(); refreshButtons(); },0);
    root.addEventListener?.("sactcheck:protocols-loaded",reassert);
    root.addEventListener?.("sactcheck:v0700-source-reconciled",reassert);
    root.addEventListener?.("sactcheck:v0701-source-reconciled",reassert);
    root.document.addEventListener?.("sactcheck:regimen-card-metadata-rendered",reassert);
    if(root.document.readyState==="loading"){
      root.document.addEventListener("DOMContentLoaded",()=>{ applyReleaseLabel(); refreshButtons(); },{once:true});
    }else{
      refreshButtons();
    }
  }

  return Object.freeze({
    version:VERSION,
    contentUrl:CONTENT_URL,
    escapeHtml,
    safeUrl,
    normaliseMedicineName,
    componentsForProtocol,
    profileForComponent,
    classifyTherapy,
    deriveIntent,
    scheduleSummary,
    buildDraft,
    validateContent,
    consentText,
    renderCardButtons,
    open,
    install
  });
});
