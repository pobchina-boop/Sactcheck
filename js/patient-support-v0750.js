/**
 * SACTCheck v0.75.1 - patient-facing regimen support.
 *
 * Patient agnostic by design:
 * - no patient identifiers are requested or persisted;
 * - no symptom data are stored;
 * - blank patient fields exist only in the printable paper passport;
 * - regimen links/QRs identify the regimen, not a patient.
 */
(function(root,factory){
  const api=factory(root||{});
  if(typeof module==="object"&&module.exports) module.exports=api;
  if(root?.document){
    root.SACTCheckPatientContent=api;
    // Compatibility name retained for the v0.72 clinic-workflow "consent" action.
    root.SACTCheckRegimenConsentBuilder=api;
    if(root.document.readyState==="loading") root.document.addEventListener("DOMContentLoaded",api.install,{once:true});
    else api.install();
  }
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";

  const RELEASE="0.75.1";
  const CONTENT_URL="data/patient-content-v0730.json";
  const RISK_URL="data/consent-content-v0710.json";
  let contentPromise=null;
  let riskPromise=null;
  let activeProtocol=null;

  const CORE_IRAE_IDS=["pneumonitis","colitis","hepatitis","endocrine","nephritis","skin"];
  const URGENT_IDS=new Set([
    "pneumonitis","ild","perforation","bleeding","thrombosis","vte","myocarditis",
    "meningoencephalitis","gbs","myasthenia","myositis","neurological","cardiac",
    "rare_fatal","severe_skin"
  ]);
  const CONTACT_IDS=new Set([
    "hypertension","proteinuria","neutropenia","hepatitis","endocrine","nephritis",
    "skin","diarrhoea","colitis","liver","wound","pancreatitis","ocular"
  ]);

  const PATIENT_SYMPTOMS={
    hypertension:"Headache, dizziness or a blood-pressure rise may occur. Blood pressure is usually monitored.",
    proteinuria:"Protein can appear in the urine and is usually detected on monitoring.",
    bleeding:"Unexpected or significant bleeding, black stools, vomiting blood, coughing blood or unusual bruising.",
    thrombosis:"New one-sided leg swelling/pain, sudden chest pain, breathlessness or stroke-like symptoms.",
    vte:"New one-sided leg swelling/pain, sudden chest pain or breathlessness.",
    wound:"Problems with wound healing, especially around surgery.",
    perforation:"Severe or persistent abdominal pain, fever or sudden deterioration.",
    ild:"New or worsening cough, breathlessness, chest discomfort or reduced exercise tolerance.",
    pneumonitis:"New or worsening cough, breathlessness, chest discomfort or reduced exercise tolerance.",
    colitis:"New diarrhoea, abdominal pain, blood or mucus in the stool.",
    hepatitis:"Yellowing of the skin/eyes, dark urine, nausea or abnormal liver blood tests.",
    endocrine:"Unusual fatigue, dizziness, headache, thirst, frequent urination, temperature intolerance or weakness.",
    nephritis:"Reduced urine, swelling, nausea or changes in kidney blood tests.",
    skin:"New or worsening rash; urgent review for blistering, painful skin or mouth involvement.",
    myocarditis:"Chest pain, breathlessness, palpitations, fainting or unexplained severe weakness.",
    meningoencephalitis:"New confusion, severe headache, seizures, marked drowsiness or other neurological change.",
    gbs:"Progressive weakness, numbness, tingling or difficulty walking/breathing.",
    myasthenia:"New muscle weakness, drooping eyelids, swallowing difficulty or breathing difficulty.",
    myositis:"New marked muscle weakness or severe muscle pain.",
    pancreatitis:"Severe or persistent upper abdominal pain, nausea or vomiting.",
    ocular:"New eye pain, redness or change in vision."
  };

  const text=v=>String(v??"").trim();
  const arr=v=>Array.isArray(v)?v:(v==null?[]:[v]);
  const esc=v=>text(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function normalise(v){
    return text(v).toLowerCase()
      .replace(/[®™]/g,"")
      .replace(/\([^)]*\)/g," ")
      .replace(/[_/–—-]+/g," ")
      .replace(/\b(?:iv|po|sc|oral|intravenous|subcutaneous|infusion|bolus)\b/g," ")
      .replace(/[^a-z0-9]+/g," ")
      .replace(/\s+/g," ")
      .trim();
  }

  async function fetchJson(url){
    const response=await root.fetch(url,{cache:"no-store"});
    if(!response.ok) throw new Error(`${url} HTTP ${response.status}`);
    return response.json();
  }
  function loadContent(){ if(!contentPromise) contentPromise=fetchJson(CONTENT_URL); return contentPromise; }
  function loadRisk(){ if(!riskPromise) riskPromise=fetchJson(RISK_URL); return riskPromise; }
  function preload(){ return Promise.allSettled([loadContent(),loadRisk()]); }

  function protocolTitle(protocol){
    const md=protocol?.metadata||{};
    return text(md.short_title||md.display_title||md.title||protocol?.title||protocol?.protocol_id||"Selected SACT regimen");
  }
  function protocolCode(protocol){
    const md=protocol?.metadata||{};
    return text(md.nccp_regimen_code||md.nccp_number||protocol?.nccp_regimen_code||"");
  }
  function protocolVersion(protocol){ return text(protocol?.metadata?.nccp_version||""); }
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
    arr(protocol?.treatment_phases).forEach(phase=>arr(phase?.administration).forEach(add));
    add(protocol?.regimen_components);
    add(protocol?.components);
    add(protocol?.agents);
    add(protocol?.drugs);
    add(protocol?.metadata?.agents);
    const helper=root?.SACTCheckRegimenComponents;
    try{ if(helper?.forProtocol) add(helper.forProtocol(protocol)); }catch(_){}
    const seen=new Set();
    return values.filter(v=>{
      const k=normalise(v); if(!k||seen.has(k)) return false;
      seen.add(k); return true;
    });
  }

  function displayRoute(value){
    const k=normalise(value);
    if(k==="iv"||k==="intravenous") return "IV";
    if(k==="sc"||k==="subcutaneous") return "SC";
    if(k==="po"||k==="oral") return "oral";
    return text(value);
  }

  function expandDays(value){
    if(value===undefined||value===null||value==="") return [];
    if(Array.isArray(value)) return value.flatMap(expandDays);
    if(typeof value==="number") return [value];
    const raw=text(value).toLowerCase().replace(/days?/g,"").trim();
    const range=raw.match(/^(\d+)\s*(?:-|–|—|to)\s*(\d+)$/);
    if(range){ const a=Number(range[1]),b=Number(range[2]); if(b>=a&&b-a<=31) return Array.from({length:b-a+1},(_,i)=>a+i); }
    if(/^[0-9,\s]+$/.test(raw)) return raw.split(/[,\s]+/).filter(Boolean).map(Number).filter(Number.isFinite);
    return [text(value)];
  }
  function phaseDisplayName(phase,index){
    const raw=text(phase?.name||phase?.label||phase?.phase_name||`Phase ${index+1}`),lower=raw.toLowerCase();
    if(lower.includes("induction")) return `Induction · ${raw.replace(/induction/ig,"").replace(/^\s*[-:·]\s*/,"").trim()||`Phase ${index+1}`}`;
    if(lower.includes("maintenance")) return `Maintenance · ${raw.replace(/maintenance/ig,"").replace(/^\s*[-:·]\s*/,"").trim()||`Phase ${index+1}`}`;
    return raw;
  }
  function scheduleRows(protocol){
    const rows=[];
    arr(protocol?.treatment_phases).forEach((phase,phaseIndex)=>{
      const phaseName=phaseDisplayName(phase,phaseIndex),cycle=Number(phase?.cycle_length_days||phase?.cycle_days||phase?.cycle_length),phaseFrequency=text(phase?.frequency||phase?.schedule||phase?.interval||phase?.administration_frequency||"");
      const byDay=new Map();
      arr(phase?.administration).forEach(item=>{
        const drug=text(item?.drug||item?.name||item?.medicine); if(!drug) return;
        const route=displayRoute(item?.route||item?.administration_route||item?.route_of_administration),frequency=text(item?.frequency||item?.schedule||item?.timing||item?.administration_frequency||"");
        const days=expandDays(item?.days??item?.day??item?.cycle_days??item?.treatment_days); (days.length?days:[""]).forEach(day=>{
          const key=text(day)||"other"; if(!byDay.has(key)) byDay.set(key,[]);
          byDay.get(key).push([route?`${drug} (${route})`:drug,frequency].filter(Boolean).join(" · "));
        });
      });
      if(!byDay.size) return;
      const sorted=[...byDay.entries()].sort((a,b)=>Number(a[0])-Number(b[0]));
      rows.push({phase:phaseName,cycle:cycle||null,frequency:phaseFrequency,days:sorted.map(([day,medicines])=>({day:day==="other"?"As scheduled":/^\d+$/.test(day)?`Day ${day}`:day,medicines:[...new Set(medicines)]}))});
    });
    return rows;
  }

  function scheduleSummary(protocol){
    const rows=scheduleRows(protocol);
    if(rows.length){
      return rows.map(row=>{
        const prefix=[row.phase,row.cycle?`${row.cycle}-day cycle`:"",row.frequency].filter(Boolean).join(" - ");
        return `${prefix}: ${row.days.map(d=>`${d.day}: ${d.medicines.join(" + ")}`).join("; ")}`;
      }).join(" -> ");
    }
    const md=protocol?.metadata||{};
    return text(md.schedule_summary||md.schedule||protocol?.schedule||"Schedule should be confirmed with the treating team.");
  }

  function buildProfileIndex(risk){
    const map=new Map();
    Object.entries(risk?.agent_profiles||{}).forEach(([key,profile])=>{
      const terms=[key,profile?.display_name,...arr(profile?.aliases)];
      terms.forEach(term=>{ const k=normalise(term); if(k) map.set(k,{key,profile}); });
    });
    return map;
  }

  const ISOLATED_AGENT_FAMILIES=["trastuzumab","trastuzumab deruxtecan","trastuzumab emtansine","ado trastuzumab emtansine","pertuzumab","enhertu","kadcyla","t dxd","t dm1"];
  function isIsolatedAgentName(v){ const n=normalise(v); return ISOLATED_AGENT_FAMILIES.some(x=>n===normalise(x)||n.includes(normalise(x))); }
  function profileMatches(protocol,risk){
    const index=buildProfileIndex(risk),out=[],seen=new Set();
    componentsForProtocol(protocol).forEach(component=>{
      const k=normalise(component); let hit=index.get(k);
      if(!hit&&!isIsolatedAgentName(k)){
        const candidates=[]; for(const [term,value] of index.entries()){
          if(!term||isIsolatedAgentName(term)) continue;
          if(k===term) candidates.push([term,value,3]); else if(k.startsWith(term+" ")||term.startsWith(k+" ")) candidates.push([term,value,2]); else if(k.length>8&&term.length>8&&(k.includes(term)||term.includes(k))) candidates.push([term,value,1]);
        }
        candidates.sort((a,b)=>b[2]-a[2]||b[0].length-a[0].length); hit=candidates[0]?.[1];
      }
      if(hit&&!seen.has(hit.key)){seen.add(hit.key);out.push({component,key:hit.key,profile:hit.profile});}
    }); return out;
  }

  function actionLevel(risk){
    const id=normalise(risk?.id).replace(/\s+/g,"_");
    const plain=text(risk?.id).toLowerCase();
    if(URGENT_IDS.has(plain)||/life-threatening|fatal|perforation|embol|myocard|encephal|pneumon|interstitial lung/i.test(`${risk?.label} ${risk?.detail}`))
      return "urgent";
    if(CONTACT_IDS.has(plain)||String(risk?.tier||"").toLowerCase()==="serious") return "contact";
    return "know";
  }

  function patientGradeScale(){
    return [
      {grade:"0",label:"None",meaning:"No symptom or change."},
      {grade:"1",label:"Mild",meaning:"Noticeable but usual activities are largely unchanged."},
      {grade:"2",label:"Moderate",meaning:"Affects usual activities or needs extra symptom treatment - contact the oncology team for advice."},
      {grade:"3",label:"Severe",meaning:"Markedly limits normal or self-care activities - urgent oncology assessment is usually needed."},
      {grade:"4",label:"Emergency",meaning:"Potentially life-threatening symptoms - seek emergency assessment using your oncology team's instructions."}
    ];
  }

  function patientSymptoms(risk){
    return PATIENT_SYMPTOMS[String(risk?.id||"").toLowerCase()]||text(risk?.detail)||"Report a new or worsening symptom to the oncology team.";
  }

  function buildRiskRows(protocol,riskContent){
    const matches=profileMatches(protocol,riskContent);
    const rows=[];
    const seen=new Set();
    const add=(risk,agent,frequency="",source="",category="agent")=>{
      const key=`${normalise(agent)}|${normalise(risk?.id||risk?.label)}`;
      if(!risk?.label||seen.has(key)) return;
      seen.add(key);
      rows.push({
        id:text(risk.id||risk.label),
        label:text(risk.label),
        detail:patientSymptoms(risk),
        agent:text(agent),
        tier:text(risk.tier||"important"),
        action:actionLevel(risk),
        frequency:text(frequency),
        frequencySource:text(source),
        category:text(category||"agent")
      });
    };

    const immuneModule=riskContent?.generic_modules?.immune_checkpoint_inhibitor;
    const chemoModule=riskContent?.generic_modules?.cytotoxic_chemotherapy;
    let hasImmune=false,hasChemo=false;

    matches.forEach(({profile})=>{
      if(profile?.module==="immune_checkpoint_inhibitor") hasImmune=true;
      if(profile?.category==="cytotoxic") hasChemo=true;
    });

    if(hasChemo){
      arr(chemoModule?.risks).slice(0,10).forEach(r=>add(r,"Chemotherapy","","","general"));
    }

    matches.forEach(({component,profile})=>{
      arr(profile?.risks).forEach(r=>add(r,profile.display_name||component,"","","agent"));
      if(profile?.module==="immune_checkpoint_inhibitor"){
        const coreFreq=profile?.immune_core_frequency_estimates||{};
        arr(immuneModule?.risks).filter(r=>CORE_IRAE_IDS.includes(String(r.id))).forEach(r=>{
          add(r,profile.display_name||component,coreFreq?.[r.id]?.display||"",profile?.immune_frequency_source?.label||"","immune");
        });
        arr(profile?.rare_immune_events).forEach(r=>add(
          {...r,tier:"serious"},
          profile.display_name||component,
          r.frequency||"",
          profile?.immune_frequency_source?.label||"",
          "immune"
        ));
      }
    });

    return {rows,matches,hasImmune};
  }

  function regimenLink(protocol){
    const base=new URL("https://sactcheck.com/"); const id=text(protocol?.protocol_id); if(id) base.searchParams.set("patientSupport",id); return base.href;
  }

  function qrUrl(protocol){
    const link=regimenLink(protocol);
    return `https://api.qrserver.com/v1/create-qr-code/?size=210x210&margin=8&data=${encodeURIComponent(link)}`;
  }

  function ensureShell(){
    let shell=root.document.getElementById("patientSupportShell");
    if(shell) return shell;
    shell=root.document.createElement("div");
    shell.id="patientSupportShell";
    shell.className="patient-support-shell";
    shell.hidden=true;
    shell.innerHTML=`
      <div class="patient-support-backdrop" data-close-patient-support></div>
      <section class="patient-support-panel" role="dialog" aria-modal="true" aria-labelledby="patientSupportTitle">
        <header class="patient-support-header">
          <div class="patient-support-brand">
            <img src="assets/branding/sactcheck-mark.svg" alt="">
            <div><strong>SACTCheck</strong><span>SACT support at point of care</span></div>
          </div>
          <div class="patient-support-heading"><span>Patient-facing regimen support</span><h2 id="patientSupportTitle">Treatment support</h2><p id="patientSupportSubtitle"></p></div>
          <button type="button" class="patient-support-close" data-close-patient-support aria-label="Close">×</button>
        </header>
        <nav class="patient-support-tabs" aria-label="Patient support sections">
          <button type="button" data-patient-tab="overview" aria-selected="true">At a glance</button>
          <button type="button" data-patient-tab="schedule" aria-selected="false">Treatment schedule</button>
          <button type="button" data-patient-tab="toxicity" aria-selected="false">Detailed toxicities</button>
          <button type="button" data-patient-tab="urgent" aria-selected="false">When to call</button>
          <button type="button" data-patient-tab="print" aria-selected="false">Print / PDF</button>
        </nav>
        <div class="patient-support-body" id="patientSupportBody"></div>
      </section>`;
    root.document.body.appendChild(shell);
    shell.querySelectorAll("[data-close-patient-support]").forEach(x=>x.addEventListener("click",close));
    shell.querySelectorAll("[data-patient-tab]").forEach(button=>button.addEventListener("click",()=>{
      shell.querySelectorAll("[data-patient-tab]").forEach(b=>b.setAttribute("aria-selected",b===button?"true":"false"));
      shell.querySelectorAll("[data-patient-view]").forEach(v=>v.classList.toggle("active",v.dataset.patientView===button.dataset.patientTab));
    }));
    root.document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&!shell.hidden) close(); });
    return shell;
  }

  function actionLegend(){
    return `<div class="patient-action-strip">
      <div class="patient-action know"><strong>KNOW</strong><span>Expected or useful information to understand.</span></div>
      <div class="patient-action contact"><strong>CONTACT</strong><span>Tell the oncology team promptly about new or worsening symptoms.</span></div>
      <div class="patient-action urgent"><strong>URGENT</strong><span>Symptoms that may need urgent clinical assessment.</span></div>
    </div>`;
  }

  function riskCard(r){
    const freq=r.frequency?`<span class="risk-frequency">${esc(r.frequency)}</span>`:"",categoryLabel=r.category==="general"?"GENERAL":r.category==="immune"?"IMMUNE":"AGENT-SPECIFIC";
    return `<article class="patient-risk-card ${esc(r.action)} category-${esc(r.category)}"><div class="patient-risk-head"><span class="patient-risk-action">${esc(r.action.toUpperCase())}</span>${freq}</div><span class="patient-risk-category">${categoryLabel}</span><h4>${esc(r.label)}</h4><p>${esc(r.detail)}</p><small>${esc(r.agent)}${r.frequencySource?` · ${esc(r.frequencySource)}`:""}</small></article>`;
  }

  function scheduleMarkup(protocol){
    const rows=scheduleRows(protocol);
    if(!rows.length) return `<div class="patient-card"><p>${esc(scheduleSummary(protocol))}</p></div>`;
    return rows.map((row,i)=>`<article class="patient-phase-card">
      <div class="patient-phase-number">${i+1}</div>
      <div><span class="patient-phase-eyebrow">${esc([row.cycle?`${row.cycle}-day cycle`:"Treatment phase",row.frequency].filter(Boolean).join(" · "))}</span>
      <h4>${esc(row.phase)}</h4>
      <div class="patient-phase-days">${row.days.map(d=>`<div><strong>${esc(d.day)}</strong><span>${esc(d.medicines.join(" + "))}</span></div>`).join("")}</div></div>
    </article>`).join("");
  }

  function categoryBlock(title,subtitle,rows,kind){ if(!rows.length) return ""; return `<section class="patient-a4-section ${esc(kind)}"><div class="patient-a4-section-head"><span>${esc(title)}</span><small>${esc(subtitle)}</small></div><div class="patient-a4-risk-grid">${rows.slice(0,6).map(riskCard).join("")}</div></section>`; }
  function renderViews(protocol,content,riskContent){
    const title=protocolTitle(protocol),code=protocolCode(protocol),version=protocolVersion(protocol),indication=protocolIndication(protocol),components=componentsForProtocol(protocol),riskData=buildRiskRows(protocol,riskContent);
    const general=riskData.rows.filter(r=>r.category==="general"),immune=riskData.rows.filter(r=>r.category==="immune"),agent=riskData.rows.filter(r=>r.category!=="general"&&r.category!=="immune"),urgent=riskData.rows.filter(r=>r.action==="urgent"),rows=scheduleRows(protocol);
    const quickSchedule=rows.length?rows.map(r=>`${r.phase}${r.cycle?` · ${r.cycle}-day cycle`:""}${r.frequency?` · ${r.frequency}`:""}: ${r.days.map(d=>`${d.day} ${d.medicines.join(" + ")}`).join("; ")}`).join(" → "):scheduleSummary(protocol);
    const overview=`<section class="patient-support-view active" data-patient-view="overview"><article class="patient-a4-sheet"><header class="patient-a4-header"><div><span class="patient-kicker">SACTCHECK · PATIENT TREATMENT GUIDE</span><h3>${esc(title)}</h3><p>${code?`NCCP ${esc(code)}${version?` · v${esc(version)}`:""}`:"Regimen-specific information"}</p></div><img src="assets/branding/sactcheck-mark.svg" alt="SACTCheck"></header><div class="patient-a4-treatment-grid"><section><span class="patient-a4-label">Your medicines</span><div class="patient-medicine-list">${components.map(m=>`<span>${esc(m)}</span>`).join("")}</div>${indication?`<p><strong>Why this treatment is used:</strong> ${esc(indication)}</p>`:""}</section><section><span class="patient-a4-label">Your schedule</span><p>${esc(quickSchedule)}</p></section></div><div class="patient-a4-callout"><strong>Know what is common. Recognise what is specific. Act early on warning symptoms.</strong><span>How often a side effect occurs is different from how urgently it needs assessment.</span></div>${categoryBlock("General treatment effects","Effects shared across the chemotherapy / SACT backbone",general,"general")}${categoryBlock("Agent-specific effects","Effects linked to one of the medicines in this exact regimen",agent,"agent")}${categoryBlock("Immunotherapy-related effects","Immune effects can affect almost any organ and may occur during or after treatment",immune,"immune")}<div class="patient-a4-urgent"><strong>Contact your oncology team urgently</strong><span> for severe or rapidly worsening symptoms, fever or sudden illness, new breathlessness or chest pain, persistent diarrhoea or vomiting, neurological change, significant bleeding, or another symptom your team has told you is urgent.</span></div><footer class="patient-a4-footer"><div><strong>More detailed regimen information</strong><span>Scan to reopen this regimen guide. The QR contains the regimen identifier only — no patient data.</span><code>${esc(regimenLink(protocol))}</code></div><a href="${esc(regimenLink(protocol))}" target="_blank" rel="noopener noreferrer"><img src="${esc(qrUrl(protocol))}" alt="Regimen QR"></a></footer></article><div class="patient-print-actions"><button type="button" class="btn" data-open-print-passport>Print / save this page</button><button type="button" class="btn secondary" data-copy-regimen-link>Copy regimen link</button></div></section>`;
    const schedule=`<section class="patient-support-view" data-patient-view="schedule"><div class="patient-section-title"><div><h3>Your treatment schedule</h3><p>Each treatment day is kept separate. Sequential phases are labelled explicitly, including induction and maintenance when encoded in the NCCP regimen.</p></div></div><div class="patient-schedule-timeline">${scheduleMarkup(protocol)}</div><div class="patient-card patient-note"><strong>The schedule is pulled from the selected regimen record. Confirm dates and individual changes with your oncology team.</strong></div></section>`;
    const grades=patientGradeScale(),toxicity=`<section class="patient-support-view" data-patient-view="toxicity"><div class="patient-section-title"><div><h3>Detailed toxicity guide</h3><p>General, agent-specific and immune toxicities stay separated so drug content cannot bleed between regimens.</p></div></div>${categoryBlock("General treatment effects","Shared treatment effects",general,"general")}${categoryBlock("Agent-specific effects","Medicine-specific effects",agent,"agent")}${categoryBlock("Immunotherapy-related effects","Immune-mediated effects",immune,"immune")}<div class="patient-section-title"><div><h3>How severe does it feel?</h3></div></div><div class="patient-grade-scale">${grades.map(g=>`<div class="grade-${g.grade}"><strong>${g.grade} · ${esc(g.label)}</strong><span>${esc(g.meaning)}</span></div>`).join("")}</div><div class="patient-grade-boundary">Communication aid only — not a CTCAE assessment and not a treatment decision tool.</div></section>`;
    const urgentCards=[...(content?.urgent_general||[]).map(x=>({title:x.title,text:x.text})),...urgent.slice(0,6).map(x=>({title:x.label,text:x.detail}))],urgentView=`<section class="patient-support-view" data-patient-view="urgent"><div class="patient-emergency-banner"><strong>Do not wait for the next appointment if you are significantly unwell.</strong><span>Use your treating centre's emergency instructions.</span></div><div class="urgent-grid">${urgentCards.map(x=>`<article><strong>${esc(x.title)}</strong><p>${esc(x.text)}</p></article>`).join("")}</div></section>`;
    const printView=`<section class="patient-support-view" data-patient-view="print"><div class="patient-print-card"><div><span class="patient-kicker">A4 · GRASP AT A GLANCE</span><h3>Printable regimen guide</h3><p>This release prints the treatment-at-a-glance page. The longitudinal treatment passport remains a separate future module.</p></div><a href="${esc(regimenLink(protocol))}" target="_blank" rel="noopener noreferrer"><img src="${esc(qrUrl(protocol))}" alt="Regimen QR"></a></div><div class="patient-print-actions"><button type="button" class="btn" data-open-print-passport>Open printable A4 guide</button><button type="button" class="btn secondary" data-copy-regimen-link>Copy regimen link</button></div></section>`;
    return overview+schedule+toxicity+urgentView+printView;
  }

  function printableRiskRows(protocol,riskContent){
    const rows=buildRiskRows(protocol,riskContent).rows;
    return rows.slice(0,14);
  }

  function openPrintablePassport(protocol,riskContent){
    const viewer=root.open?.("about:blank","_blank");
    if(!viewer){ root.alert?.("Allow pop-ups for SACTCheck to open the printable guide."); return null; }
    const title=protocolTitle(protocol),code=protocolCode(protocol),version=protocolVersion(protocol),components=componentsForProtocol(protocol),rows=buildRiskRows(protocol,riskContent).rows;
    const general=rows.filter(r=>r.category==="general"),immune=rows.filter(r=>r.category==="immune"),agent=rows.filter(r=>r.category!=="general"&&r.category!=="immune");
    const phaseHtml=scheduleRows(protocol).map(p=>`<div class="phase"><b>${esc(p.phase)}</b><span>${esc([p.cycle?`${p.cycle}-day cycle`:"",p.frequency].filter(Boolean).join(" · "))}</span>${p.days.map(d=>`<div><strong>${esc(d.day)}</strong> ${esc(d.medicines.join(" + "))}</div>`).join("")}</div>`).join("")||`<p>${esc(scheduleSummary(protocol))}</p>`;
    const cards=list=>list.slice(0,6).map(r=>`<div class="risk ${esc(r.action)}"><b>${esc(r.label)}</b><span>${esc(r.detail)}</span><small>${esc(r.agent)}</small></div>`).join("");
    const link=regimenLink(protocol),qr=qrUrl(protocol),logoUrl=(()=>{try{return new URL("assets/branding/sactcheck-mark.svg",root.location?.href||"https://sactcheck.com/").href;}catch(_){return "https://sactcheck.com/assets/branding/sactcheck-mark.svg";}})();
    viewer.document.open();
    viewer.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>SACTCheck Patient Guide - ${esc(title)}</title><style>@page{size:A4;margin:9mm}*{box-sizing:border-box}body{margin:0;background:#eaf0f2;font-family:Arial,Helvetica,sans-serif;color:#17212b}.toolbar{padding:9px;text-align:center;background:#10354f}.toolbar button{border:0;border-radius:7px;background:#fff;color:#10354f;font-weight:800;padding:9px 14px}.page{width:192mm;min-height:279mm;margin:10px auto;background:#fff;padding:10mm;box-shadow:0 8px 28px rgba(0,0,0,.12)}header{display:flex;justify-content:space-between;gap:12px;border-bottom:4px solid #0b7f7a;padding-bottom:8px}header img{width:38px}h1{font-size:22px;color:#10354f;margin:4px 0}.sub{font-size:9px;color:#60737e}.meds{display:flex;gap:5px;flex-wrap:wrap}.meds span{background:#e7f7f5;color:#0b6f6a;border-radius:99px;padding:4px 7px;font-size:8px;font-weight:700}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:9px 0}.box{border:1px solid #d6e2e7;border-radius:8px;padding:8px}.box h2,.section h2{font-size:12px;color:#10354f;margin:0 0 5px}.phase,.risk,.footer,.box{font-size:8.3px;line-height:1.35}.phase{border-left:3px solid #0b7f7a;padding:5px 7px;background:#f6fafb;margin:4px 0}.phase b,.phase span{display:block}.section{margin-top:8px}.riskgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.risk{border:1px solid #d6e2e7;border-left:4px solid #90a5af;border-radius:7px;padding:6px}.risk.contact{border-left-color:#d49a23}.risk.urgent{border-left-color:#b73743}.risk b,.risk span,.risk small{display:block}.risk b{font-size:8.5px;color:#10354f}.risk small{margin-top:3px;color:#71828a}.general h2{color:#315f78}.agent h2{color:#8b5f0a}.immune h2{color:#6d438d}.urgentbox{margin-top:8px;background:#9c2d37;color:#fff;border-radius:8px;padding:8px;font-size:9px}.qr{display:grid;grid-template-columns:1fr 88px;gap:8px;align-items:center;border-top:1px solid #d6e2e7;margin-top:8px;padding-top:7px}.qr img{width:80px}.qr code{font-size:7px;word-break:break-all}.footer{color:#657780;margin-top:6px}@media print{body{background:#fff}.toolbar{display:none}.page{margin:0;box-shadow:none;width:auto;min-height:0;padding:0}}</style></head><body><div class="toolbar"><button onclick="window.print()">Print / Save PDF</button></div><main class="page"><header><div><div class="sub">SACTCHECK · PATIENT TREATMENT GUIDE</div><h1>${esc(title)}</h1><div class="sub">${code?`NCCP ${esc(code)}${version?` · v${esc(version)}`:""}`:"Regimen-specific information"}</div></div><img src="${esc(logoUrl)}" alt=""></header><div class="grid"><section class="box"><h2>Your medicines</h2><div class="meds">${components.map(x=>`<span>${esc(x)}</span>`).join("")}</div></section><section class="box"><h2>Your treatment schedule</h2>${phaseHtml}</section></div>${general.length?`<section class="section general"><h2>General treatment effects</h2><div class="riskgrid">${cards(general)}</div></section>`:""}${agent.length?`<section class="section agent"><h2>Agent-specific effects</h2><div class="riskgrid">${cards(agent)}</div></section>`:""}${immune.length?`<section class="section immune"><h2>Immunotherapy-related effects</h2><div class="riskgrid">${cards(immune)}</div></section>`:""}<div class="urgentbox"><b>Contact your oncology team urgently</b> for severe or rapidly worsening symptoms, fever or sudden illness, new breathlessness or chest pain, persistent diarrhoea or vomiting, neurological change, significant bleeding, or another symptom your team has told you is urgent.</div><div class="qr"><div><b>More detailed regimen information</b><p>Scan to reopen this regimen guide. The QR contains the regimen identifier only and no patient data.</p><code>${esc(link)}</code></div><a href="${esc(link)}"><img src="${esc(qr)}" alt="Regimen QR"></a></div><div class="footer">Patient information support only. This does not replace your oncology team's advice, formal consent, current NCCP guidance or local emergency instructions.</div></main></body></html>`);
    viewer.document.close(); return viewer;
  }

  async function open(protocol,options={}){
    const live=root.SACTCheckProtocolLoader?.getProtocolById?.(protocol?.protocol_id)||protocol;
    if(!live) return null;
    activeProtocol=live;
    const shell=ensureShell();
    shell.hidden=false;
    root.document.body.classList.add("patient-content-open");
    shell.querySelector("#patientSupportTitle").textContent=protocolTitle(live);
    shell.querySelector("#patientSupportSubtitle").textContent="Regimen-specific treatment guide · schedule · toxicity recognition · printable A4 overview";
    const body=shell.querySelector("#patientSupportBody");
    body.innerHTML='<div class="patient-loading-card">Preparing regimen-specific patient support...</div>';
    try{
      const [content,risk]=await Promise.all([loadContent(),loadRisk()]);
      body.innerHTML=renderViews(live,content,risk);
      const requested=options?.tab||"overview";
      shell.querySelectorAll("[data-patient-tab]").forEach(b=>b.setAttribute("aria-selected",b.dataset.patientTab===requested?"true":"false"));
      shell.querySelectorAll("[data-patient-view]").forEach(v=>v.classList.toggle("active",v.dataset.patientView===requested));
      body.querySelectorAll("[data-open-print-passport]").forEach(button=>button.addEventListener("click",()=>openPrintablePassport(live,risk)));
      body.querySelectorAll("[data-copy-regimen-link]").forEach(button=>button.addEventListener("click",async()=>{
        const link=regimenLink(live);
        try{ await root.navigator.clipboard.writeText(link); root.showToast?.("Regimen link copied"); }
        catch(_){ root.prompt?.("Copy this regimen link:",link); }
      }));
      return shell;
    }catch(error){
      body.innerHTML=`<div class="patient-error-card"><strong>Patient support could not be generated.</strong><p>${esc(error.message)}</p></div>`;
      return null;
    }
  }

  function close(){
    const shell=root.document?.getElementById("patientSupportShell");
    if(shell) shell.hidden=true;
    root.document?.body?.classList?.remove("patient-content-open");
    activeProtocol=null;
  }

  function openFromUrl(){
    let id="";
    try{id=new URL(root.location.href).searchParams.get("patientSupport")||"";}catch(_){}
    if(!id) return;
    const attempt=()=>{
      const p=root.SACTCheckProtocolLoader?.getProtocolById?.(id);
      if(!p) return false;
      root.SACTCheckInterface?.setMode?.("patient");
      open(p,{tab:"overview"});
      return true;
    };
    if(attempt()) return;
    root.addEventListener?.("sactcheck:protocols-loaded",attempt,{once:true});
  }

  function install(){
    ensureShell();
    preload();
    openFromUrl();
  }

  // Compatibility methods used by the existing v0.72 clinic workflow.
  async function generateConsentPdf(protocol){ return open(protocol,{tab:"overview"}); }
  function consentText(){ return "Regimen-specific patient information and consent-support content."; }

  return Object.freeze({
    release:RELEASE,version:RELEASE,
    normalise,componentsForProtocol,scheduleRows,scheduleSummary,profileMatches,
    actionLevel,patientGradeScale,buildRiskRows,regimenLink,qrUrl,
    preload,open,openPatientSupport:open,close,install,openPrintablePassport,
    generateConsentPdf,consentText
  });
});
