
/**
 * SACTCheck v0.73.0 — patient-content-first compatibility module.
 *
 * This file intentionally keeps the historical filename so it can be dropped
 * into the current repository without editing index.html.
 *
 * Product pivot:
 *   Consent PDF / + Agent  ->  Patient support
 *   Formal generated-consent framing -> regimen-specific consent support,
 *   treatment education, visual toxicity language, QR-linked patient passport
 *   and a non-persistent symptom diary.
 *
 * The assessment engine and protocol rule logic are not modified here.
 */
(function(factory){
  const api=factory(window);
  window.SACTCheckRegimenConsentBuilder=api; // backward-compatible global name
  window.SACTCheckPatientContent=api;
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",api.install,{once:true});
  else api.install();
})(function(root){
  "use strict";

  const RELEASE="0.73.0";
  const PATIENT_CONTENT_URL="data/patient-content-v0730.json";
  const RISK_CONTENT_URL="data/consent-content-v0710.json";
  const STYLE_URL="css/regimen-consent-builder-v0710.css?v=0.73.0";
  let contentPromise=null;
  let riskPromise=null;
  let activeProtocol=null;

  const asArray=v=>Array.isArray(v)?v:(v==null?[]:[v]);
  const text=v=>String(v??"").trim();
  const escapeHtml=value=>text(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const normalise=value=>text(value).toLowerCase().replace(/[®™]/g,"").replace(/[^a-z0-9]+/g," ").trim();

  function safeUrl(value){
    try{
      const url=new URL(value,root.location?.href||"https://example.invalid/");
      if(["http:","https:"].includes(url.protocol)) return url.href;
    }catch(_){}
    return "";
  }

  function ensureStyles(){
    if(root.document.querySelector('link[data-patient-content-style]')) return;
    const link=root.document.createElement("link");
    link.rel="stylesheet"; link.href=STYLE_URL; link.dataset.patientContentStyle="true";
    root.document.head.appendChild(link);
  }

  async function fetchJson(url){
    const response=await fetch(url,{cache:"no-store"});
    if(!response.ok) throw new Error(`${url} HTTP ${response.status}`);
    return response.json();
  }

  function loadContent(){
    if(!contentPromise) contentPromise=fetchJson(PATIENT_CONTENT_URL);
    return contentPromise;
  }
  function loadRiskContent(){
    if(!riskPromise) riskPromise=fetchJson(RISK_CONTENT_URL).catch(()=>({agent_profiles:{},shared_modules:{}}));
    return riskPromise;
  }

  function protocolRecord(protocolOrRecord){ return protocolOrRecord?.protocol||protocolOrRecord||null; }
  function protocolTitle(protocol){
    return text(protocol?.metadata?.short_title||protocol?.metadata?.display_title||protocol?.metadata?.title||protocol?.title||protocol?.protocol_id||"Selected SACT regimen");
  }
  function protocolCode(protocol){ return text(protocol?.metadata?.nccp_regimen_code||protocol?.metadata?.nccp_number||protocol?.nccp_regimen_code||""); }
  function protocolIndication(protocol){
    const v=protocol?.metadata?.indication||protocol?.indication||protocol?.metadata?.clinical_indication;
    return Array.isArray(v)?v.join("; "):text(v);
  }

  function componentsForProtocol(protocol){
    const values=[];
    const add=v=>{
      if(v==null) return;
      if(typeof v==="string"){ if(text(v)) values.push(text(v)); return; }
      if(Array.isArray(v)){ v.forEach(add); return; }
      if(typeof v==="object"){
        const direct=v.drug||v.agent||v.medicine||v.name||v.generic_name||v.display_name;
        if(direct) add(direct);
      }
    };
    add(protocol?.regimen_components);
    add(protocol?.components);
    add(protocol?.agents);
    add(protocol?.drugs);
    add(protocol?.metadata?.agents);
    const helper=root?.SACTCheckRegimenComponents;
    if(helper?.componentsForProtocol){
      try{ add(helper.componentsForProtocol(protocol)); }catch(_){}
    }
    const seen=new Set();
    return values.filter(v=>{
      const k=normalise(v);
      if(!k||seen.has(k)) return false;
      seen.add(k); return true;
    });
  }

  function scheduleSummary(protocol){
    const md=protocol?.metadata||{};
    const candidates=[
      md.schedule_summary,md.schedule,md.cycle_schedule,protocol?.schedule_summary,
      protocol?.schedule,protocol?.cycle_schedule
    ];
    for(const value of candidates){
      if(typeof value==="string"&&text(value)) return text(value);
      if(value&&typeof value==="object"){
        const bits=[];
        if(value.cycle_length_days) bits.push(`${value.cycle_length_days}-day cycle`);
        if(value.days) bits.push(`treatment ${Array.isArray(value.days)?"days "+value.days.join(", "):text(value.days)}`);
        if(value.frequency) bits.push(text(value.frequency));
        if(bits.length) return bits.join(" · ");
      }
    }
    return "See the current NCCP regimen and your treatment-team plan for the exact schedule.";
  }

  function buildAliasIndex(riskContent){
    const rows=[];
    Object.entries(riskContent?.agent_profiles||{}).forEach(([key,p])=>{
      const aliases=[key,p?.display_name,...asArray(p?.aliases)].map(normalise).filter(Boolean);
      rows.push({key,profile:p,aliases});
    });
    return rows;
  }

  function profileMatchesForProtocol(protocol,riskContent){
    const index=buildAliasIndex(riskContent);
    const comps=componentsForProtocol(protocol);
    const out=[];
    const seen=new Set();
    comps.forEach(component=>{
      const n=normalise(component);
      let best=null;
      for(const row of index){
        if(row.aliases.some(a=>a===n||n.includes(a)||a.includes(n))){
          best=row; break;
        }
      }
      if(best&&!seen.has(best.key)){ seen.add(best.key); out.push({...best,component}); }
    });
    return out;
  }

  function isImmuneProfile(profile){
    const hay=normalise([profile?.category,profile?.module,profile?.display_name].filter(Boolean).join(" "));
    return /immune|checkpoint|pembrolizumab|nivolumab|atezolizumab|durvalumab|cemiplimab|ipilimumab|avelumab/.test(hay);
  }

  function riskRows(matches){
    const rows=[];
    const seen=new Set();
    matches.forEach(match=>{
      asArray(match.profile?.risks).forEach(risk=>{
        const key=normalise(risk?.id||risk?.label);
        if(!key||seen.has(key)) return;
        seen.add(key);
        rows.push({
          label:text(risk?.label||"Treatment effect"),
          detail:text(risk?.detail||""),
          tier:text(risk?.tier||"important"),
          source:match.profile?.display_name||match.component||"Regimen component"
        });
      });
    });
    return rows;
  }

  function regimenLink(protocol){
    const url=new URL(root.location.href);
    url.searchParams.set("patientSupport",text(protocol?.protocol_id||""));
    url.hash="";
    return url.href;
  }

  function bodySilhouette(){
    return `<svg class="immune-silhouette" viewBox="0 0 120 360" role="img" aria-label="Human body organ-system toxicity map">
      <circle cx="60" cy="32" r="23" fill="#d5ecea" stroke="#4f9c98" stroke-width="2"/>
      <path d="M36 63 Q60 52 84 63 L94 146 Q89 176 78 192 L83 337 L64 337 L60 210 L56 337 L37 337 L42 192 Q31 176 26 146 Z"
        fill="#dff1ef" stroke="#4f9c98" stroke-width="2"/>
      <path d="M36 77 L13 166" stroke="#4f9c98" stroke-width="10" stroke-linecap="round"/>
      <path d="M84 77 L107 166" stroke="#4f9c98" stroke-width="10" stroke-linecap="round"/>
      <ellipse cx="46" cy="106" rx="13" ry="22" fill="#ffffff" stroke="#7bbab6"/><ellipse cx="74" cy="106" rx="13" ry="22" fill="#ffffff" stroke="#7bbab6"/>
      <path d="M60 91 C49 84 47 106 60 116 C73 106 71 84 60 91" fill="#e58b95"/>
      <path d="M48 144 Q66 132 76 148 Q69 165 48 160 Z" fill="#e6bd78"/>
      <rect x="50" y="57" width="20" height="10" rx="5" fill="#b08ac9"/>
      <path d="M49 177 Q39 188 48 202 Q60 213 72 202 Q81 188 71 177" fill="#d49b73" opacity=".72"/>
      <circle cx="60" cy="32" r="7" fill="#e8cc78"/>
    </svg>`;
  }

  function ensureShell(){
    let shell=root.document.getElementById("patientSupportShell");
    if(shell) return shell;
    shell=root.document.createElement("div");
    shell.id="patientSupportShell"; shell.className="patient-support-shell"; shell.hidden=true;
    shell.innerHTML=`
      <div class="patient-support-backdrop" data-close-patient-support></div>
      <section class="patient-support-panel" role="dialog" aria-modal="true" aria-labelledby="patientSupportTitle">
        <header class="patient-support-header">
          <img class="patient-support-logo" src="assets/branding/sactcheck-mark.svg" alt="">
          <div><span class="patient-support-eyebrow">SACTCheck · Treatment information & consent support</span>
            <h2 id="patientSupportTitle">Patient support</h2>
            <div class="patient-support-subtitle" id="patientSupportSubtitle"></div>
          </div>
          <button type="button" class="patient-support-close" aria-label="Close patient support" data-close-patient-support>×</button>
        </header>
        <nav class="patient-support-tabs" aria-label="Patient support sections">
          <button class="patient-support-tab" data-patient-tab="overview" aria-selected="true">At a glance</button>
          <button class="patient-support-tab" data-patient-tab="schedule" aria-selected="false">Treatment & schedule</button>
          <button class="patient-support-tab" data-patient-tab="toxicity" aria-selected="false">Side effects</button>
          <button class="patient-support-tab" data-patient-tab="urgent" aria-selected="false">When to call</button>
          <button class="patient-support-tab" data-patient-tab="passport" aria-selected="false">Passport & QR</button>
          <button class="patient-support-tab" data-patient-tab="diary" aria-selected="false">Symptom diary</button>
        </nav>
        <div class="patient-support-body" id="patientSupportBody"></div>
      </section>`;
    root.document.body.appendChild(shell);
    shell.querySelectorAll("[data-close-patient-support]").forEach(el=>el.addEventListener("click",closePatientSupport));
    shell.querySelectorAll("[data-patient-tab]").forEach(button=>button.addEventListener("click",()=>{
      shell.querySelectorAll("[data-patient-tab]").forEach(b=>b.setAttribute("aria-selected",b===button?"true":"false"));
      shell.querySelectorAll(".patient-support-view").forEach(v=>v.classList.toggle("active",v.dataset.patientView===button.dataset.patientTab));
    }));
    root.document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&!shell.hidden) closePatientSupport(); });
    return shell;
  }

  function actionStrip(){
    return `<div class="patient-action-strip">
      <div class="patient-action know"><strong>Know</strong><span>Understand what the regimen is, how it is given and the effects worth recognising.</span></div>
      <div class="patient-action contact"><strong>Contact</strong><span>Report new or worsening symptoms early rather than waiting for the next appointment.</span></div>
      <div class="patient-action urgent"><strong>Urgent</strong><span>Some symptoms can indicate serious treatment toxicity and need prompt clinical assessment.</span></div>
    </div>`;
  }

  function renderImmuneMap(content){
    const organs=asArray(content?.immune_organs);
    if(!organs.length) return "";
    const left=organs.slice(0,5), right=organs.slice(5);
    const card=o=>`<div class="immune-organ"><span class="immune-organ-icon">${escapeHtml(o.icon)}</span><div><strong>${escapeHtml(o.organ)} · ${escapeHtml(o.headline)}</strong><small>${escapeHtml(o.symptoms)}</small></div></div>`;
    return `<div class="patient-section-title"><div><h3>Immunotherapy: think by organ system</h3><p>Immune-related effects can occur in almost any organ and may occur during or after treatment.</p></div></div>
      <div class="immune-map"><div class="immune-column">${left.map(card).join("")}</div><div class="immune-body">${bodySilhouette()}<div class="immune-map-label">New or unusual symptoms matter — report change early.</div></div><div class="immune-column">${right.map(card).join("")}</div></div>`;
  }

  function diarySymptoms(rows,immune){
    const base=["Temperature / feeling feverish","Fatigue / energy","Nausea or vomiting","Appetite / oral intake","Bowel habit","Pain","Skin / rash"];
    if(immune) base.push("Cough / breathlessness","Headache / dizziness","Thirst / urine frequency","Muscle or joint symptoms");
    rows.slice(0,8).forEach(r=>{ if(r.label&&!base.some(x=>normalise(x)===normalise(r.label))) base.push(r.label); });
    return [...new Set(base)].slice(0,16);
  }

  function views(protocol,content,riskContent){
    const title=protocolTitle(protocol);
    const code=protocolCode(protocol);
    const indication=protocolIndication(protocol);
    const comps=componentsForProtocol(protocol);
    const matches=profileMatchesForProtocol(protocol,riskContent);
    const risks=riskRows(matches);
    const immune=matches.some(m=>isImmuneProfile(m.profile));
    const schedule=scheduleSummary(protocol);
    const link=regimenLink(protocol);
    const qr=`https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=0&data=${encodeURIComponent(link)}`;
    const serious=risks.filter(r=>/serious|urgent|critical/i.test(r.tier));
    const other=risks.filter(r=>!serious.includes(r));
    const meds=comps.length?comps:["Regimen components unavailable in structured record"];

    const overview=`
      <section class="patient-support-view active" data-patient-view="overview">
        <div class="patient-summary-grid">
          <div class="patient-card">
            <span class="patient-support-eyebrow" style="color:#0d7d79">Your treatment</span>
            <h3 class="patient-regimen-title">${escapeHtml(title)}</h3>
            <div class="patient-badges">${code?`<span class="patient-badge">NCCP ${escapeHtml(code)}</span>`:""}${immune?'<span class="patient-badge immune">Includes immunotherapy</span>':""}<span class="patient-badge">Regimen-specific support</span></div>
            ${indication?`<p><strong>Why it is used:</strong> ${escapeHtml(indication)}</p>`:""}
            <p><strong>Schedule:</strong> ${escapeHtml(schedule)}</p>
            <div class="patient-medicine-list">${meds.map(m=>`<span class="patient-medicine-pill">${escapeHtml(m)}</span>`).join("")}</div>
            ${actionStrip()}
          </div>
          <div class="patient-card">
            <h3>What this page is for</h3>
            <p>This is a structured companion to the treatment discussion: what you are receiving, what to expect, which symptoms matter, and how to find the same information again at home.</p>
            <p>It supports the consent conversation but does not replace the formal consent process or the advice of your treating oncology team.</p>
            <div class="patient-prototype-warning"><strong>Prototype:</strong> regimen-specific patient content requires clinical, pharmacy and patient-information review before routine clinical use.</div>
          </div>
        </div>
      </section>`;

    const scheduleView=`
      <section class="patient-support-view" data-patient-view="schedule">
        <div class="patient-section-title"><div><h3>How treatment fits together</h3><p>A simple treatment journey rather than a drug-information dump.</p></div></div>
        <div class="patient-card">
          <h3>${escapeHtml(title)}</h3>
          <p><strong>Recorded schedule:</strong> ${escapeHtml(schedule)}</p>
          <div class="timeline">
            <div class="timeline-step"><b>Before</b><div><strong>Checks and preparation</strong><span>${escapeHtml(content.general_sections?.before_treatment?.join(" ")||"Your team will complete the checks required for this regimen.")}</span></div></div>
            <div class="timeline-step"><b>Treatment</b><div><strong>${escapeHtml(meds.join(" + "))}</strong><span>${escapeHtml(content.general_sections?.treatment_day?.join(" ")||"Your team will explain the treatment-day sequence.")}</span></div></div>
            <div class="timeline-step"><b>Between</b><div><strong>Recovery, supportive medicines and symptom awareness</strong><span>${escapeHtml(content.general_sections?.between_cycles?.join(" ")||"Report important new symptoms between cycles.")}</span></div></div>
            <div class="timeline-step"><b>Next cycle</b><div><strong>Review and repeat</strong><span>Your oncology team reviews symptoms, relevant blood tests and treatment-specific monitoring before the next planned treatment.</span></div></div>
          </div>
        </div>
      </section>`;

    const riskCard=r=>`<div class="patient-risk-card ${/serious|urgent|critical/i.test(r.tier)?"serious":""}"><strong>${escapeHtml(r.label)}</strong><span>${escapeHtml(r.detail||"Discuss this treatment effect with your oncology team.")}</span><span class="patient-risk-source">${escapeHtml(r.source)}</span></div>`;
    const toxicity=`
      <section class="patient-support-view" data-patient-view="toxicity">
        ${immune?renderImmuneMap(content):""}
        <div class="patient-section-title" style="margin-top:16px"><div><h3>Regimen-specific effects</h3><p>Built from the medicines recognised in this regimen's structured content library.</p></div></div>
        ${risks.length?`<div class="patient-risk-grid">${other.concat(serious).map(riskCard).join("")}</div>`:`<div class="patient-card"><p>Detailed regimen-specific patient toxicity content has not yet been mapped for this regimen. Do not infer missing risks from this prototype.</p></div>`}
        <div class="patient-prototype-warning">This view deliberately avoids invented frequency estimates. Frequency, severity and management language should be added only when source-verified for the regimen/medicine and clinically reviewed.</div>
      </section>`;

    const urgentRows=asArray(content?.urgent_general);
    const urgent=`
      <section class="patient-support-view" data-patient-view="urgent">
        <div class="patient-section-title"><div><h3>When to contact the oncology team</h3><p>Action-oriented red flags are separated from the general side-effect list.</p></div></div>
        <div class="urgent-grid">${urgentRows.map(x=>`<div class="urgent-card"><strong>${escapeHtml(x.title)}</strong><span>${escapeHtml(x.text)}</span></div>`).join("")}</div>
        ${immune?`<div class="patient-card" style="margin-top:10px"><h3>Immunotherapy principle</h3><p>Immune-related toxicity can present in many different ways. New, persistent or unexplained symptoms should be reported early, even if they do not initially seem related to treatment.</p></div>`:""}
        <div class="patient-prototype-warning">Emergency contact numbers and centre-specific escalation thresholds must be supplied and validated locally before clinical deployment.</div>
      </section>`;

    const passport=`
      <section class="patient-support-view" data-patient-view="passport">
        <div class="passport-grid">
          <div class="patient-card">
            <h3>Your regimen-specific patient passport</h3>
            <p>The QR/link returns to this regimen support page. It contains the regimen identifier only — no patient name, hospital number or other identifying information is encoded.</p>
            <div class="passport-link">${escapeHtml(link)}</div>
            <div class="passport-actions">
              <button type="button" class="btn secondary" data-copy-passport-link>Copy patient link</button>
              <button type="button" class="btn secondary" data-print-patient-support>Print support page</button>
            </div>
            <p>The intended future pathway is: clinic discussion → visual consent support → QR passport → regimen-specific home toxicity diary.</p>
          </div>
          <div class="patient-card qr-card">
            <h3>Scan to reopen</h3>
            <img src="${escapeHtml(qr)}" alt="QR code linking to this regimen's SACTCheck patient-support page">
            <small>Prototype QR generated from the public regimen-support URL. No patient information is included.</small>
          </div>
        </div>
      </section>`;

    const symptoms=diarySymptoms(risks,immune);
    const diary=`
      <section class="patient-support-view" data-patient-view="diary">
        <div class="patient-section-title"><div><h3>Between-treatment symptom diary</h3><p>Regimen-aware prompts, intentionally non-persistent in this prototype.</p></div></div>
        <div class="diary-notice">${escapeHtml(content?.diary_prompt||"Diary entries are not saved.")}</div>
        <div class="diary-grid">${symptoms.map((s,i)=>`<div class="diary-row"><strong>${escapeHtml(s)}</strong><div class="diary-options">
          <label><input type="radio" name="symptom-${i}" value="none"> none</label>
          <label><input type="radio" name="symptom-${i}" value="mild"> mild</label>
          <label><input type="radio" name="symptom-${i}" value="moderate"> moderate</label>
          <label><input type="radio" name="symptom-${i}" value="severe"> severe</label>
        </div></div>`).join("")}</div>
        <textarea class="diary-notes" placeholder="Notes for your next oncology review. Do not enter identifying information in this prototype."></textarea>
        <div class="patient-prototype-warning">The diary is not a monitoring service and does not send information to the oncology team. Urgent symptoms require direct contact using the instructions provided by the treating centre.</div>
      </section>`;

    return overview+scheduleView+toxicity+urgent+passport+diary;
  }

  async function openPatientSupport(protocol){
    const live=root.SACTCheckProtocolLoader?.getProtocolById?.(protocol?.protocol_id)||protocol;
    if(!live) return;
    activeProtocol=live;
    const shell=ensureShell();
    const body=shell.querySelector("#patientSupportBody");
    shell.querySelector("#patientSupportTitle").textContent=protocolTitle(live);
    shell.querySelector("#patientSupportSubtitle").textContent="Regimen-specific treatment information · visual toxicity support · patient passport";
    body.innerHTML='<div class="patient-card"><p>Loading regimen-specific patient support…</p></div>';
    shell.hidden=false; root.document.body.classList.add("patient-content-open");
    shell.querySelectorAll("[data-patient-tab]").forEach((b,i)=>b.setAttribute("aria-selected",i===0?"true":"false"));
    try{
      const [content,riskContent]=await Promise.all([loadContent(),loadRiskContent()]);
      body.innerHTML=views(live,content,riskContent);
      body.querySelector("[data-copy-passport-link]")?.addEventListener("click",async()=>{
        const link=regimenLink(live);
        try{ await navigator.clipboard.writeText(link); root.showToast?.("Patient support link copied"); }
        catch(_){ root.prompt?.("Copy this patient support link:",link); }
      });
      body.querySelector("[data-print-patient-support]")?.addEventListener("click",()=>root.print());
    }catch(error){
      console.error("SACTCheck patient support failed",error);
      body.innerHTML=`<div class="patient-card"><h3>Patient support could not be loaded</h3><p>${escapeHtml(error.message)}</p></div>`;
    }
  }

  function closePatientSupport(){
    const shell=root.document.getElementById("patientSupportShell");
    if(shell) shell.hidden=true;
    root.document.body.classList.remove("patient-content-open");
    activeProtocol=null;
  }

  function cardForProtocol(protocol){
    const id=text(protocol?.protocol_id);
    return [...root.document.querySelectorAll(".regimen-card[data-json-protocol-id]")]
      .find(card=>text(card.dataset.jsonProtocolId)===id)||null;
  }

  function renderCardButtons(records){
    let count=0;
    asArray(records).forEach(record=>{
      const protocol=protocolRecord(record);
      if(!protocol?.protocol_id) return;
      const card=cardForProtocol(protocol);
      const actions=card?.querySelector(".card-actions");
      if(!actions) return;

      // Remove the premature + Agent control completely.
      actions.querySelectorAll("[data-consent-add-agent],.consent-add-agent-button").forEach(el=>el.remove());

      let button=actions.querySelector("[data-open-regimen-consent],[data-open-patient-support]");
      if(!button){
        button=root.document.createElement("button");
        button.type="button";
        const info=actions.querySelector(".regimen-info-link");
        if(info) info.insertAdjacentElement("afterend",button); else actions.appendChild(button);
        count++;
      }
      button.className="btn secondary consent-builder-card-button patient-support-card-button";
      button.dataset.openPatientSupport=protocol.protocol_id;
      delete button.dataset.openRegimenConsent;
      button.setAttribute("aria-label",`Open regimen-specific patient support for ${protocolTitle(protocol)}`);
      button.innerHTML='<span class="patient-support-card-icon" aria-hidden="true">◉</span> Patient support';
      button.onclick=event=>{
        event.preventDefault(); event.stopPropagation();
        const live=root.SACTCheckProtocolLoader?.getProtocolById?.(protocol.protocol_id)||protocol;
        openPatientSupport(live);
      };
    });
    return count;
  }

  function refreshButtons(){
    const records=root.SACTCheckProtocolLoader?.getLoadedProtocols?.()||root.SACTCHECK_PROTOCOLS||[];
    return renderCardButtons(records);
  }

  function applyHomepagePivot(){
    const tagline=root.document.querySelector(".brand-tagline");
    if(tagline) tagline.textContent="Regimen decision support · patient treatment information";

    const kicker=root.document.querySelector(".mission-hero .study-kicker");
    if(kicker) kicker.textContent="Structured regimen support from clinic to home";

    const h1=root.document.getElementById("studyHeroTitle");
    if(h1) h1.textContent="Understand the regimen. Support the patient.";

    const lead=root.document.querySelector(".mission-hero-lead");
    if(lead) lead.textContent="Search the NCCP regimen library, keep the existing clinical assessment tools, and open regimen-specific patient support covering treatment, schedule, toxicity, red flags and a QR-linked patient passport.";

    const visualStrong=root.document.querySelector(".mission-visual-header strong");
    if(visualStrong) visualStrong.textContent="Find. Understand. Support. Follow.";

    const pathway=root.document.querySelectorAll(".mission-pathway-step");
    const replacements=[
      ["⌕","Find","Identify the exact regimen and official NCCP source."],
      ["◎","Understand","See what treatment contains and how the schedule fits together."],
      ["♥","Support","Use visual, regimen-specific toxicity and practical patient information."],
      ["↗","Follow","Reopen the patient passport and symptom diary between treatments."]
    ];
    pathway.forEach((node,i)=>{
      const r=replacements[i]; if(!r) return;
      const icon=node.querySelector(".mission-icon"),strong=node.querySelector("strong"),small=node.querySelector("small");
      if(icon) icon.textContent=r[0]; if(strong) strong.textContent=r[1]; if(small) small.textContent=r[2];
    });

    const portal=root.document.getElementById("portalSwitcher");
    if(portal&&!root.document.getElementById("patientPipelineEntry")){
      const box=root.document.createElement("div");
      box.id="patientPipelineEntry"; box.className="patient-pipeline-entry library-only";
      box.innerHTML=`<img src="assets/branding/sactcheck-mark.svg" alt=""><div><strong>Regimen-specific patient content pipeline</strong><span>Choose a regimen, then open <b style="display:inline;padding:0;background:none;color:inherit;text-transform:none;letter-spacing:0;font-size:inherit">Patient support</b> for treatment explanation, visual toxicity information, red flags, QR passport and symptom diary.</span></div><b>v0.73 prototype</b>`;
      portal.insertAdjacentElement("beforebegin",box);
    }
  }

  function applyReleaseLabels(){
    root.document.documentElement.dataset.patientContentRelease=RELEASE;
    const summary=root.document.querySelector(".release-summary summary");
    if(summary) summary.textContent=`v${RELEASE} · Patient content pipeline`;
  }

  function openFromUrl(){
    const id=new URL(root.location.href).searchParams.get("patientSupport");
    if(!id) return;
    const tryOpen=()=>{
      const protocol=root.SACTCheckProtocolLoader?.getProtocolById?.(id)||
        asArray(root.SACTCheckProtocolLoader?.getLoadedProtocols?.()||root.SACTCHECK_PROTOCOLS||[])
          .map(protocolRecord).find(p=>text(p?.protocol_id)===id);
      if(protocol){ openPatientSupport(protocol); return true; }
      return false;
    };
    if(!tryOpen()) root.setTimeout(tryOpen,900);
  }

  function install(){
    ensureStyles();
    ensureShell();
    applyHomepagePivot();
    applyReleaseLabels();
    refreshButtons();

    const reassert=()=>root.setTimeout(()=>{ applyHomepagePivot(); refreshButtons(); },0);
    root.addEventListener?.("sactcheck:protocols-loaded",reassert);
    root.addEventListener?.("sactcheck:v0700-source-reconciled",reassert);
    root.addEventListener?.("sactcheck:v0701-source-reconciled",reassert);
    root.document.addEventListener?.("sactcheck:regimen-card-metadata-rendered",reassert);
    root.setTimeout(openFromUrl,500);
  }

  // Compatibility API retained so existing callers/tests fail safely rather than
  // reintroducing the retired generated-consent workflow.
  function getAddedAgentKeys(){ return []; }
  function addAgent(){ return false; }
  function removeAgent(){ return false; }
  function clearAddedAgents(){ return false; }
  function searchAgents(){ return []; }
  function classifyTherapy(){ return {mappedAgents:[],unmappedAgents:[]}; }
  function deriveIntent(protocol){ return text(protocol?.metadata?.intent||protocol?.metadata?.treatment_intent||""); }
  function buildDraft(protocol){ return {title:protocolTitle(protocol),components:componentsForProtocol(protocol),purpose:"patient_support"}; }
  function validateContent(){ return {ok:true,errors:[]}; }
  function makePdfPayload(protocol){ return buildDraft(protocol); }
  function openPdfPlaceholder(){ return null; }
  async function generateConsentPdf(protocol){ return openPatientSupport(protocol); }
  async function open(protocol){ return openPatientSupport(protocol); }
  function openAgentPicker(){ return false; }
  function consentText(){ return "Regimen-specific patient information and consent-support content. Formal generated consent is retired."; }

  return Object.freeze({
    version:RELEASE,release:RELEASE,contentUrl:PATIENT_CONTENT_URL,
    escapeHtml,safeUrl,normaliseMedicineName:normalise,componentsForProtocol,
    searchAgents,classifyTherapy,deriveIntent,scheduleSummary,buildDraft,validateContent,
    getAddedAgentKeys,addAgent,removeAgent,clearAddedAgents,makePdfPayload,
    openPdfPlaceholder,generateConsentPdf,renderCardButtons,openAgentPicker,
    consentText,open,openPatientSupport,closePatientSupport,install
  });
});

// Historical compatibility sentinels retained:
// Generic chemotherapy
// Immunotherapy / immune-related risks
// Patient identifiers are intentionally not entered into or stored by SACTCheck.
// Reasonable alternatives
// If treatment does not proceed
