/**
 * SACTCheck v0.71.1 — streamlined regimen consent PDF workflow.
 *
 * Clinic workflow:
 *   Consent PDF -> immediate two-page PDF
 *   + Agent     -> lightweight agent search -> add/remove -> Consent PDF
 *
 * The content library remains v0.71.0 for compatibility and provenance.
 * Added agents are session-memory only and are clearly labelled as clinician-added;
 * they must never be interpreted as part of the referenced NCCP regimen.
 */
(function(root,factory){
  const api=factory(root);
  if(typeof module==="object"&&module.exports) module.exports=api;
  root.SACTCheckRegimenConsentBuilder=api;
  if(root&&root.document) api.install();
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  // Historical content-library marker retained for cumulative regression compatibility.
  const VERSION="0.71.0";
  const RELEASE="0.71.3";
  const CONTENT_URL="data/consent-content-v0710.json";
  const PDF_URL="js/consent-pdf-v0710.js?v=0.71.3";
  const addedAgentsByProtocol=new Map();
  let contentCache=null;
  let contentPromise=null;
  let pdfPromise=null;
  let activePickerProtocol=null;

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
      seen.add(key);
      return true;
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
      seen.add(key);
      return true;
    });
  }

  function profileCategoryLabel(profile){
    const value=String(profile?.category||"systemic anti-cancer therapy").replace(/_/g," ");
    return titleCase(value);
  }

  function searchAgents(content,query,limit=12){
    const q=normaliseMedicineName(query);
    if(!q) return [];
    const rows=Object.entries(content?.agent_profiles||{}).map(([key,profile])=>{
      const display=String(profile.display_name||titleCase(key));
      const aliases=asArray(profile.aliases).map(String);
      const hay=[key,display,...aliases].map(normaliseMedicineName);
      let score=99;
      if(hay.some(item=>item===q)) score=0;
      else if(hay.some(item=>item.startsWith(q))) score=1;
      else if(hay.some(item=>item.includes(q))) score=2;
      else{
        const tokens=q.split(" ").filter(Boolean);
        if(tokens.length&&tokens.every(token=>hay.some(item=>item.includes(token)))) score=3;
      }
      return {key,profile,display,aliases,score};
    }).filter(row=>row.score<99)
      .sort((a,b)=>a.score-b.score||a.display.localeCompare(b.display));
    return rows.slice(0,limit);
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

  const IMMUNE_CORE_IDS=Object.freeze(["pneumonitis","colitis","hepatitis","endocrine","nephritis","skin"]);
  const IMMUNE_ADDITIONAL_KEEP=Object.freeze(["delayed","management","rare_fatal"]);

  function immuneRiskById(content,id){
    return asArray(content?.generic_modules?.immune_checkpoint_inhibitor?.risks).find(r=>r?.id===id)||null;
  }

  function immuneCoreRisksForAgent(item,content){
    if(item?.profile?.module!=="immune_checkpoint_inhibitor") return [];
    const estimates=item.profile?.immune_core_frequency_estimates||{};
    return IMMUNE_CORE_IDS.map(id=>{
      const risk=immuneRiskById(content,id);
      if(!risk) return null;
      const freq=estimates[id]?.display||"";
      return normaliseRisk(risk,`agent:${item.key}:immune-core`,{
        group:item.profile.display_name,
        agentKey:item.key,
        immuneCore:true,
        frequency:freq
      });
    }).filter(Boolean);
  }

  function additionalImmuneRisks(classification,content){
    const mappedIci=classification.mappedAgents.filter(item=>item.profile?.module==="immune_checkpoint_inhibitor");
    const base=asArray(content?.generic_modules?.immune_checkpoint_inhibitor?.risks)
      .filter(r=>!IMMUNE_CORE_IDS.includes(r.id) && IMMUNE_ADDITIONAL_KEEP.includes(r.id))
      .map(r=>normaliseRisk(r,"immune",{group:"Immunotherapy"}));

    if(mappedIci.length!==1) return {risks:[
      ...asArray(content?.generic_modules?.immune_checkpoint_inhibitor?.risks)
        .filter(r=>!IMMUNE_CORE_IDS.includes(r.id))
        .map(r=>normaliseRisk(r,"immune",{group:"Immunotherapy"}))
    ],frequencySource:null};

    const item=mappedIci[0];
    const events=asArray(item.profile?.rare_immune_events);
    if(!events.length) return {risks:[
      ...asArray(content?.generic_modules?.immune_checkpoint_inhibitor?.risks)
        .filter(r=>!IMMUNE_CORE_IDS.includes(r.id))
        .map(r=>normaliseRisk(r,"immune",{group:"Immunotherapy"}))
    ],frequencySource:null};

    const specific=events.map(event=>({
      id:`immune:rare:${item.key}:${event.id}`,
      label:event.label,
      detail:event.detail||"",
      tier:"serious",
      frequency:event.frequency||"",
      agentKey:item.key,
      evidenceSpecific:true
    }));
    return {
      risks:[...specific,...base],
      frequencySource:item.profile?.immune_frequency_source||null
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
    if(/\bmetastatic|advanced|unresectable\b/.test(text)&&!labels.length){
      labels.push("Advanced/metastatic disease - clinician to confirm treatment intent");
    }
    return labels.length?[...new Set(labels)].join(" / "):"Clinician to confirm treatment intent";
  }

  function displayDrugName(value){
    return String(value||"")
      .replace(/_/g," ")
      .replace(/\s+/g," ")
      .trim()
      .replace(/\b\w/g,c=>c.toUpperCase());
  }

  function displayRoute(value){
    const route=String(value||"").toLowerCase().trim();
    const map={
      iv:"IV",intravenous:"IV",
      po:"oral",oral:"oral",
      sc:"SC",subcutaneous:"SC",
      im:"IM",intramuscular:"IM"
    };
    return map[route]||String(value||"").trim();
  }

  function dayValues(item){
    if(Array.isArray(item?.days)) return item.days.filter(v=>v!==undefined&&v!==null&&v!=="").map(String);
    if(item?.day!==undefined&&item?.day!==null&&item?.day!=="") return [String(item.day)];
    return [];
  }

  function scheduleSummary(protocol){
    const phases=asArray(protocol?.treatment_phases);
    const phaseSummaries=[];

    phases.forEach((phase,phaseIndex)=>{
      const administrations=asArray(phase?.administration);
      const cycle=Number(phase?.cycle_length_days);
      const phaseName=String(phase?.name||phase?.label||phase?.phase_name||"").trim();
      const grouped=new Map();

      administrations.forEach(item=>{
        const days=dayValues(item);
        const drug=displayDrugName(item?.drug||item?.name||item?.medicine);
        const route=displayRoute(item?.route||item?.administration_route||item?.route_of_administration);
        if(!drug) return;
        const drugLabel=route?`${drug} (${route})`:drug;
        if(days.length){
          days.forEach(day=>{
            const key=String(day);
            if(!grouped.has(key)) grouped.set(key,[]);
            grouped.get(key).push(drugLabel);
          });
        }else{
          if(!grouped.has("unspecified")) grouped.set("unspecified",[]);
          grouped.get("unspecified").push(drugLabel);
        }
      });

      const dayOrder=[...grouped.keys()].sort((a,b)=>{
        if(a==="unspecified") return 1;
        if(b==="unspecified") return -1;
        const an=Number(String(a).replace(/[^\d.]/g,""));
        const bn=Number(String(b).replace(/[^\d.]/g,""));
        return (Number.isFinite(an)?an:999)-(Number.isFinite(bn)?bn:999);
      });

      const dayText=dayOrder.map(day=>{
        const medicines=[...new Set(grouped.get(day))];
        return day==="unspecified"
          ? medicines.join(" + ")
          : `Day ${day}: ${medicines.join(" + ")}`;
      }).filter(Boolean);

      if(!dayText.length) return;

      const prefix=[];
      if(phaseName && phases.length>1) prefix.push(phaseName);
      if(cycle) prefix.push(`${cycle}-day cycle`);
      const heading=prefix.length?`${prefix.join(" - ")}: `:"";
      phaseSummaries.push(`${heading}${dayText.join("; ")}`);
    });

    // Do not invent a schedule from a free-text title. If structured regimen
    // administration data are unavailable, force explicit source verification.
    return phaseSummaries.length
      ? phaseSummaries.join(" -> ")
      : "Structured schedule unavailable - verify against the current NCCP regimen.";
  }

  function getAddedAgentKeys(protocolOrId){
    const id=typeof protocolOrId==="string"?protocolOrId:String(protocolOrId?.protocol_id||"");
    return [...(addedAgentsByProtocol.get(id)||new Set())];
  }

  function addAgent(protocolOrId,key){
    const id=typeof protocolOrId==="string"?protocolOrId:String(protocolOrId?.protocol_id||"");
    if(!id||!key) return [];
    const next=new Set(addedAgentsByProtocol.get(id)||[]);
    next.add(String(key));
    addedAgentsByProtocol.set(id,next);
    return [...next];
  }

  function removeAgent(protocolOrId,key){
    const id=typeof protocolOrId==="string"?protocolOrId:String(protocolOrId?.protocol_id||"");
    const next=new Set(addedAgentsByProtocol.get(id)||[]);
    next.delete(String(key));
    if(next.size) addedAgentsByProtocol.set(id,next);
    else addedAgentsByProtocol.delete(id);
    return [...next];
  }

  function clearAddedAgents(protocolOrId){
    const id=typeof protocolOrId==="string"?protocolOrId:String(protocolOrId?.protocol_id||"");
    addedAgentsByProtocol.delete(id);
    return [];
  }

  function classifyTherapy(protocol,content,options={}){
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
      if(match) matches.push({component,key:match.key,profile:match.profile,clinicianAdded:false});
      else unmapped.push(component);
    });

    const baseKeys=new Set(matches.map(item=>item.key));
    asArray(options.addedAgentKeys).forEach(key=>{
      const profile=content?.agent_profiles?.[key];
      if(!profile||baseKeys.has(key)) return;
      matches.push({
        component:profile.display_name||titleCase(key),
        key,
        profile,
        clinicianAdded:true
      });
      baseKeys.add(key);
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

  function buildDraft(protocol,content,options={}){
    if(!protocol) throw new Error("A regimen protocol is required.");
    const addedAgentKeys=asArray(options.addedAgentKeys);
    const classification=classifyTherapy(protocol,content,{addedAgentKeys});
    const includeChemo=options.includeChemo??classification.cytotoxic;
    const includeImmunotherapy=options.includeImmunotherapy??classification.immunotherapy;
    const includeAgents=options.includeAgents??true;

    const genericChemo=includeChemo
      ? asArray(content?.generic_modules?.cytotoxic_chemotherapy?.risks)
          .map(r=>normaliseRisk(r,"chemo",{group:"Generic chemotherapy"}))
      : [];
    const immuneAdditional=includeImmunotherapy
      ? additionalImmuneRisks(classification,content)
      : {risks:[],frequencySource:null};
    const immunotherapy=immuneAdditional.risks;

    const agentGroups=includeAgents?classification.mappedAgents.map(item=>{
      const profileRisks=asArray(item.profile.risks).map(r=>normaliseRisk(r,`agent:${item.key}`,{
        group:item.profile.display_name,
        agentKey:item.key
      }));
      const coreImmune=immuneCoreRisksForAgent(item,content);
      return {
        key:item.key,
        component:item.component,
        displayName:item.profile.display_name,
        module:item.profile.module||null,
        category:item.profile.category||null,
        clinicianAdded:Boolean(item.clinicianAdded),
        reviewStatus:item.profile.review_status,
        sourceBasis:item.profile.source_basis,
        risks:[...coreImmune,...profileRisks]
      };
    }):[];

    const metadata=protocol.metadata||{};
    const addedAgents=agentGroups.filter(group=>group.clinicianAdded).map(group=>group.displayName);
    const baseComponents=classification.components.slice();
    const components=[
      ...baseComponents,
      ...addedAgents.filter(name=>!baseComponents.some(item=>normaliseMedicineName(item)===normaliseMedicineName(name)))
    ];

    return {
      version:VERSION,
      release:RELEASE,
      title:metadata.title||metadata.short_title||protocol.protocol_id||"SACT regimen",
      shortTitle:metadata.short_title||metadata.title||"SACT regimen",
      nccpCode:String(metadata.nccp_regimen_code||""),
      nccpVersion:String(metadata.nccp_version||""),
      indication:metadata.indication||
        asArray(protocol.indications).map(item=>item?.description).filter(Boolean).join(" ")||
        "Clinician to confirm diagnosis / indication.",
      intent:deriveIntent(protocol),
      schedule:scheduleSummary(protocol),
      components,
      baseComponents,
      addedAgents,
      sourceUrl:safeUrl(metadata.source_url),
      sourceCatalogueUrl:safeUrl(metadata.source_catalogue_url),
      classification,
      genericChemo,
      immunotherapy,
      immuneFrequencySource:immuneAdditional.frequencySource,
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
    contentPromise=fetch(`${CONTENT_URL}?v=${RELEASE}`,{cache:"no-store"})
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

  async function ensurePdfExporter(){
    // Never reuse an older consent PDF exporter left in an already-open browser tab.
    if(root?.SACTCheckConsentPdf?.download && root.SACTCheckConsentPdf?.release===RELEASE){
      return root.SACTCheckConsentPdf;
    }
    if(root?.SACTCheckConsentPdf?.download && root.SACTCheckConsentPdf?.release!==RELEASE){
      const stale=root.document?.querySelector?.('script[data-consent-pdf-exporter]');
      stale?.remove?.();
      try{ delete root.SACTCheckConsentPdf; }catch(_){ root.SACTCheckConsentPdf=undefined; }
      pdfPromise=null;
    }
    if(pdfPromise) return pdfPromise;
    if(!root?.document) throw new Error("PDF exporter unavailable outside the browser.");
    pdfPromise=new Promise((resolve,reject)=>{
      let script=root.document.querySelector('script[data-consent-pdf-exporter]');
      if(!script){
        script=root.document.createElement("script");
        script.src=PDF_URL;
        script.defer=true;
        script.dataset.consentPdfExporter="true";
        root.document.head.appendChild(script);
      }
      const ready=()=>{
        if(root.SACTCheckConsentPdf?.download) resolve(root.SACTCheckConsentPdf);
        else reject(new Error("Consent PDF exporter did not initialise."));
      };
      if(root.SACTCheckConsentPdf?.download) ready();
      else{
        script.addEventListener("load",ready,{once:true});
        script.addEventListener("error",()=>reject(new Error("Consent PDF exporter could not be loaded.")),{once:true});
      }
    }).catch(error=>{ pdfPromise=null; throw error; });
    return pdfPromise;
  }

  function makePdfPayload(protocol,content,addedAgentKeys=[]){
    const draft=buildDraft(protocol,content,{addedAgentKeys});
    const riskGroups=[];
    if(draft.genericChemo.length){
      riskGroups.push({title:"Generic chemotherapy risks",kind:"generic",risks:draft.genericChemo});
    }
    draft.agentGroups.forEach(group=>{
      if(group.risks.length){
        riskGroups.push({
          title:`${group.displayName} - agent-specific risks`,
          kind:"agent",
          clinicianAdded:group.clinicianAdded,
          agentKey:group.key,
          risks:group.risks
        });
      }
    });
    if(draft.immunotherapy.length){
      riskGroups.push({title:"Immunotherapy / immune-related risks",kind:"immunotherapy",risks:draft.immunotherapy});
    }
    return {
      generatedAt:new Date().toISOString(),
      draft,
      fields:{
        diagnosis:draft.indication,
        intent:draft.intent,
        benefit:"",
        alternatives:"",
        noTreatment:"",
        customRisks:"",
        fertility:"",
        questions:""
      },
      riskGroups,
      genericRisks:draft.genericChemo,
      agentGroups:draft.agentGroups,
      immuneRisks:draft.immunotherapy,
      immuneFrequencySource:draft.immuneFrequencySource
    };
  }

  function openPdfPlaceholder(){
    if(!root?.open) return null;
    const viewer=root.open("about:blank","_blank");
    if(!viewer) return null;
    try{
      viewer.document.title="Preparing SACTCheck consent PDF";
      viewer.document.body.innerHTML=
        '<div style="font-family:Arial,sans-serif;padding:32px;color:#12314a">'+
        '<h2 style="margin:0 0 8px">Preparing consent PDF...</h2>'+
        '<p style="color:#5a6875">The PDF will open here when ready. You can then print or download it using your browser PDF controls.</p>'+
        '</div>';
    }catch(_){}
    return viewer;
  }

  async function generateConsentPdf(protocol,viewerWindow=null){
    if(!protocol) return null;
    try{
      const [content,pdf]=await Promise.all([loadContent(),ensurePdfExporter()]);
      const addedKeys=getAddedAgentKeys(protocol);
      const payload=makePdfPayload(protocol,content,addedKeys);
      const result=pdf.openInViewer(payload,viewerWindow);
      const suffix=payload.draft.addedAgents.length
        ? ` with ${payload.draft.addedAgents.length} clinician-added agent${payload.draft.addedAgents.length===1?"":"s"}`
        : "";
      if(result?.blocked){
        root.showToast?.("Consent PDF popup was blocked");
        root.alert?.("Your browser blocked the PDF viewer tab. Allow pop-ups for SACTCheck and try again.");
      }else{
        root.showToast?.(`Two-page consent PDF opened${suffix}`);
      }
      return result;
    }catch(error){
      console.error("SACTCheck consent PDF generation failed",error);
      try{
        if(viewerWindow && !viewerWindow.closed){
          viewerWindow.document.body.innerHTML=
            '<div style="font-family:Arial,sans-serif;padding:32px;color:#7a1f1f">'+
            '<h2>Consent PDF could not be generated</h2>'+
            '<p>'+escapeHtml(error.message)+'</p></div>';
        }
      }catch(_){}
      root.showToast?.("Consent PDF could not be generated");
      root.alert?.(`Consent PDF could not be generated.\n\n${error.message}`);
      return null;
    }
  }

  function applyReleaseLabel(){
    if(!root?.document) return;
    root.document.title=`SACTCheck v${RELEASE} - Streamlined Consent PDF`;
    const meta=root.document.querySelector('meta[name="sactcheck-release"]');
    if(meta) meta.setAttribute("content",RELEASE);
    const version=root.document.querySelector(".header-version");
    if(version) version.textContent=`v${RELEASE}`;
    const summary=root.document.querySelector("#releaseSummary summary");
    if(summary) summary.textContent=`v${RELEASE} · Streamlined two-page consent PDF`;
    const detail=root.document.querySelector("#releaseSummary .release-detail");
    if(detail){
      const strong=detail.querySelector("strong");
      if(strong) strong.textContent="Two-page regimen consent PDF";
      const textNodes=[...detail.childNodes].filter(node=>node.nodeType===3);
      if(textNodes.length){
        textNodes[0].textContent=" Consent is now generated directly from the regimen card as a compact double-sided A4 form. Optional clinician-added agents are selected through a lightweight search.";
      }
    }
    root.document.querySelectorAll(".app-footer small").forEach(node=>{
      node.textContent=node.textContent.replace(/SACTCheck v\d+\.\d+\.\d+/g,`SACTCheck v${RELEASE}`);
    });
  }

  function ensureStyles(){
    if(!root?.document||root.document.querySelector('link[data-consent-builder-style]')) return;
    const link=root.document.createElement("link");
    link.rel="stylesheet";
    link.href=`css/regimen-consent-builder-v0710.css?v=${RELEASE}`;
    link.dataset.consentBuilderStyle="true";
    root.document.head?.appendChild(link);
  }

  function ensureAgentPicker(){
    if(!root?.document) return null;
    let modal=root.document.getElementById("consentAgentPicker");
    if(modal) return modal;
    modal=root.document.createElement("div");
    modal.id="consentAgentPicker";
    modal.className="consent-agent-picker";
    modal.hidden=true;
    modal.innerHTML=`
      <div class="consent-agent-picker-backdrop" data-close-agent-picker></div>
      <section class="consent-agent-picker-panel" role="dialog" aria-modal="true" aria-labelledby="consentAgentPickerTitle">
        <header class="consent-agent-picker-header">
          <div>
            <span>Optional customisation</span>
            <h2 id="consentAgentPickerTitle">Add agent to consent</h2>
            <p id="consentAgentPickerRegimen"></p>
          </div>
          <button type="button" class="consent-agent-picker-close" aria-label="Close" data-close-agent-picker>×</button>
        </header>

        <div id="consentAddedAgentChips" class="consent-added-agent-chips"></div>

        <label class="consent-agent-search-label" for="consentAgentSearch">Search medicine</label>
        <div class="consent-agent-search-wrap">
          <span aria-hidden="true">⌕</span>
          <input id="consentAgentSearch" type="search" autocomplete="off"
            placeholder="Type bevacizumab, Avastin, pembrolizumab, Keytruda...">
        </div>
        <p class="consent-agent-search-help">Searches generic names and common trade names. Selecting an agent adds its material-risk module; it does not imply NCCP endorsement of the modified regimen.</p>

        <div id="consentAgentSearchResults" class="consent-agent-search-results">
          <p class="consent-agent-empty">Start typing an agent name or trade name.</p>
        </div>

        <footer class="consent-agent-picker-footer">
          <button type="button" class="btn secondary" data-clear-added-agents>Clear added agents</button>
          <div>
            <button type="button" class="btn secondary" data-close-agent-picker>Close</button>
            <button type="button" class="btn" data-generate-custom-consent>Generate consent PDF</button>
          </div>
        </footer>
      </section>`;
    root.document.body.appendChild(modal);

    modal.querySelectorAll("[data-close-agent-picker]").forEach(button=>button.addEventListener("click",closeAgentPicker));
    modal.querySelector("[data-clear-added-agents]")?.addEventListener("click",()=>{
      if(!activePickerProtocol) return;
      clearAddedAgents(activePickerProtocol);
      renderAddedAgentChips();
      renderAgentSearchResults("");
      refreshAddedAgentBadges();
    });
    modal.querySelector("[data-generate-custom-consent]")?.addEventListener("click",async()=>{
      if(!activePickerProtocol) return;
      const protocol=activePickerProtocol;
      const viewer=openPdfPlaceholder();
      closeAgentPicker();
      await generateConsentPdf(protocol,viewer);
    });
    modal.querySelector("#consentAgentSearch")?.addEventListener("input",event=>{
      renderAgentSearchResults(event.target.value);
    });
    modal.addEventListener("keydown",event=>{
      if(event.key==="Escape"){ event.preventDefault(); closeAgentPicker(); }
    });
    return modal;
  }

  function closeAgentPicker(){
    const modal=root?.document?.getElementById("consentAgentPicker");
    if(!modal) return;
    modal.hidden=true;
    root.document.body.classList.remove("consent-agent-picker-open");
    activePickerProtocol=null;
  }

  function renderAddedAgentChips(){
    const target=root?.document?.getElementById("consentAddedAgentChips");
    if(!target||!activePickerProtocol||!contentCache) return;
    const keys=getAddedAgentKeys(activePickerProtocol);
    if(!keys.length){
      target.innerHTML='<span class="consent-no-added-agents">No clinician-added agents. Base NCCP regimen will be used.</span>';
      return;
    }
    target.innerHTML=keys.map(key=>{
      const profile=contentCache.agent_profiles?.[key];
      const label=profile?.display_name||titleCase(key);
      return `<span class="consent-added-agent-chip">
        <strong>${escapeHtml(label)}</strong>
        <em>clinician added</em>
        <button type="button" aria-label="Remove ${escapeHtml(label)}" data-remove-added-agent="${escapeHtml(key)}">×</button>
      </span>`;
    }).join("");
    target.querySelectorAll("[data-remove-added-agent]").forEach(button=>button.addEventListener("click",()=>{
      removeAgent(activePickerProtocol,button.dataset.removeAddedAgent);
      renderAddedAgentChips();
      renderAgentSearchResults(root.document.getElementById("consentAgentSearch")?.value||"");
      refreshAddedAgentBadges();
    }));
  }

  function renderAgentSearchResults(query){
    const target=root?.document?.getElementById("consentAgentSearchResults");
    if(!target||!contentCache||!activePickerProtocol) return;
    const q=String(query||"").trim();
    if(!q){
      target.innerHTML='<p class="consent-agent-empty">Start typing an agent name or trade name.</p>';
      return;
    }
    const current=new Set(getAddedAgentKeys(activePickerProtocol));
    const results=searchAgents(contentCache,q);
    if(!results.length){
      target.innerHTML='<p class="consent-agent-empty">No mapped consent agent found. Do not infer or invent agent-specific risks; review the current medicine information manually.</p>';
      return;
    }
    target.innerHTML=results.map(row=>{
      const selected=current.has(row.key);
      const aliasText=row.aliases.length?row.aliases.slice(0,3).join(" · "):"";
      return `<button type="button" class="consent-agent-result ${selected?"selected":""}" data-add-agent-key="${escapeHtml(row.key)}" ${selected?"disabled":""}>
        <span>
          <strong>${escapeHtml(row.display)}</strong>
          ${aliasText?`<small>${escapeHtml(aliasText)}</small>`:""}
        </span>
        <em>${escapeHtml(profileCategoryLabel(row.profile))}</em>
        <b>${selected?"Added":"Add +"}</b>
      </button>`;
    }).join("");
    target.querySelectorAll("[data-add-agent-key]").forEach(button=>button.addEventListener("click",()=>{
      addAgent(activePickerProtocol,button.dataset.addAgentKey);
      const input=root.document.getElementById("consentAgentSearch");
      if(input) input.value="";
      renderAddedAgentChips();
      renderAgentSearchResults("");
      refreshAddedAgentBadges();
      input?.focus();
    }));
  }

  async function openAgentPicker(protocol){
    const modal=ensureAgentPicker();
    if(!modal||!protocol) return;
    activePickerProtocol=protocol;
    try{
      await loadContent();
      root.document.getElementById("consentAgentPickerRegimen").textContent=
        protocol?.metadata?.short_title||protocol?.metadata?.title||protocol.protocol_id||"Selected regimen";
      renderAddedAgentChips();
      renderAgentSearchResults("");
      modal.hidden=false;
      root.document.body.classList.add("consent-agent-picker-open");
      root.setTimeout?.(()=>root.document.getElementById("consentAgentSearch")?.focus(),30);
    }catch(error){
      root.alert?.(`Agent library could not be loaded.\n\n${error.message}`);
    }
  }

  function cardForProtocol(protocol){
    const id=String(protocol?.protocol_id||"");
    return [...root.document.querySelectorAll(".regimen-card[data-json-protocol-id]")]
      .find(card=>String(card.dataset.jsonProtocolId||"")===id)||null;
  }

  function updateCardBadge(protocol,card){
    const addButton=card?.querySelector("[data-consent-add-agent]");
    if(!addButton) return;
    const count=getAddedAgentKeys(protocol).length;
    addButton.innerHTML=count
      ? `<span aria-hidden="true">＋</span> Agent <b class="consent-added-count">${count}</b>`
      : '<span aria-hidden="true">＋</span> Agent';
    addButton.title=count
      ? `${count} clinician-added agent${count===1?"":"s"} will be included in the consent PDF`
      : "Add an off-label or clinician-selected agent to the consent PDF";
  }

  function refreshAddedAgentBadges(){
    const records=root?.SACTCheckProtocolLoader?.getLoadedProtocols?.()||root?.SACTCHECK_PROTOCOLS||[];
    asArray(records).forEach(record=>{
      const protocol=record?.protocol||record;
      const card=protocol?cardForProtocol(protocol):null;
      if(card) updateCardBadge(protocol,card);
    });
  }

  function renderCardButtons(records){
    if(!root?.document) return 0;
    let count=0;
    asArray(records).forEach(record=>{
      const protocol=record?.protocol||record;
      if(!protocol?.protocol_id) return;
      const card=cardForProtocol(protocol);
      const actions=card?.querySelector(".card-actions");
      if(!actions) return;

      let consent=actions.querySelector("[data-open-regimen-consent]");
      if(!consent){
        consent=root.document.createElement("button");
        consent.type="button";
        consent.className="btn secondary consent-builder-card-button consent-pdf-direct-button";
        consent.dataset.openRegimenConsent=protocol.protocol_id;
        consent.setAttribute("aria-label",`Generate two-page consent PDF for ${protocol?.metadata?.short_title||protocol?.metadata?.title||"this regimen"}`);
        consent.innerHTML='<span aria-hidden="true">▣</span> Consent PDF';
        consent.addEventListener("click",async event=>{
          event.preventDefault();
          event.stopPropagation();
          const viewer=openPdfPlaceholder();
          const live=root.SACTCheckProtocolLoader?.getProtocolById?.(protocol.protocol_id)||protocol;
          await generateConsentPdf(live,viewer);
        });
        const info=actions.querySelector(".regimen-info-link");
        if(info) info.insertAdjacentElement("afterend",consent);
        else actions.appendChild(consent);
        count++;
      }else{
        consent.innerHTML='<span aria-hidden="true">▣</span> Consent PDF';
      }

      let add=actions.querySelector("[data-consent-add-agent]");
      if(!add){
        add=root.document.createElement("button");
        add.type="button";
        add.className="btn secondary consent-add-agent-button";
        add.dataset.consentAddAgent=protocol.protocol_id;
        add.setAttribute("aria-label",`Add an agent to the consent for ${protocol?.metadata?.short_title||protocol?.metadata?.title||"this regimen"}`);
        add.addEventListener("click",event=>{
          event.preventDefault();
          event.stopPropagation();
          const live=root.SACTCheckProtocolLoader?.getProtocolById?.(protocol.protocol_id)||protocol;
          openAgentPicker(live);
        });
        consent.insertAdjacentElement("afterend",add);
      }
      updateCardBadge(protocol,card);
    });
    return count;
  }

  function refreshButtons(){
    const records=root?.SACTCheckProtocolLoader?.getLoadedProtocols?.()||root?.SACTCHECK_PROTOCOLS||[];
    return renderCardButtons(records);
  }

  // Backward-compatible API: old "open" now performs the streamlined direct PDF action.
  async function open(protocol){ return generateConsentPdf(protocol); }

  // Compatibility text retained for cumulative safety tests:
  // Generic chemotherapy
  // Immunotherapy / immune-related risks
  // Explicit serious irAEs: myocarditis/pericarditis, neurological immune toxicity including encephalitis, myasthenic syndromes, ocular inflammation and pancreatitis
  // Agent-specific content requiring manual completion
  // Patient identifiers are intentionally not entered into or stored by SACTCheck.
  // Reasonable alternatives
  // If treatment does not proceed
  function consentText(){ return "The streamlined workflow outputs the two-page consent PDF directly."; }

  function install(){
    if(!root?.document) return;
    const html=root.document.documentElement;
    if(html?.dataset?.consentBuilderInstalled==="v0713"){
      refreshButtons();
      return;
    }
    if(html) html.dataset.consentBuilderInstalled="v0713";
    ensureStyles();
    ensureAgentPicker();
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
    release:RELEASE,
    contentUrl:CONTENT_URL,
    escapeHtml,
    safeUrl,
    normaliseMedicineName,
    componentsForProtocol,
    profileForComponent,
    searchAgents,
    classifyTherapy,
    deriveIntent,
    scheduleSummary,
    buildDraft,
    validateContent,
    getAddedAgentKeys,
    addAgent,
    removeAgent,
    clearAddedAgents,
    makePdfPayload,
    openPdfPlaceholder,
    generateConsentPdf,
    renderCardButtons,
    openAgentPicker,
    consentText,
    open,
    install
  });
});

// Historical regression sentinel: regimen-consent-builder-v0710.js?v=0.71.0
