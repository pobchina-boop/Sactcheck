/**
 * SACTCheck v0.74.0 - patient-facing regimen support.
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

  const RELEASE="0.74.0";
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

  function scheduleRows(protocol){
    const rows=[];
    arr(protocol?.treatment_phases).forEach((phase,phaseIndex)=>{
      const phaseName=text(phase?.name||phase?.label||phase?.phase_name||`Phase ${phaseIndex+1}`);
      const cycle=Number(phase?.cycle_length_days);
      const byDay=new Map();
      arr(phase?.administration).forEach(item=>{
        const drug=text(item?.drug||item?.name||item?.medicine);
        if(!drug) return;
        const route=displayRoute(item?.route||item?.administration_route||item?.route_of_administration);
        const days=Array.isArray(item?.days)?item.days:[item?.day];
        const clean=days.filter(v=>v!==undefined&&v!==null&&v!=="");
        (clean.length?clean:[""]).forEach(day=>{
          const key=text(day)||"other";
          if(!byDay.has(key)) byDay.set(key,[]);
          byDay.get(key).push(route?`${drug} (${route})`:drug);
        });
      });
      if(!byDay.size) return;
      rows.push({
        phase:phaseName,
        cycle:cycle||null,
        days:[...byDay.entries()].map(([day,medicines])=>({
          day:day==="other"?"As scheduled":`Day ${day}`,
          medicines:[...new Set(medicines)]
        }))
      });
    });
    return rows;
  }

  function scheduleSummary(protocol){
    const rows=scheduleRows(protocol);
    if(rows.length){
      return rows.map(row=>{
        const prefix=[row.phase,row.cycle?`${row.cycle}-day cycle`:""].filter(Boolean).join(" - ");
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

  function profileMatches(protocol,risk){
    const index=buildProfileIndex(risk);
    const out=[],seen=new Set();
    componentsForProtocol(protocol).forEach(component=>{
      const k=normalise(component);
      let hit=index.get(k);
      if(!hit){
        for(const [term,value] of index.entries()){
          if(k.includes(term)||term.includes(k)){ hit=value; break; }
        }
      }
      if(hit&&!seen.has(hit.key)){
        seen.add(hit.key);
        out.push({component,key:hit.key,profile:hit.profile});
      }
    });
    return out;
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
    const add=(risk,agent,frequency="",source="")=>{
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
        frequencySource:text(source)
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
      arr(chemoModule?.risks).slice(0,10).forEach(r=>add(r,"Chemotherapy"));
    }

    matches.forEach(({component,profile})=>{
      arr(profile?.risks).forEach(r=>add(r,profile.display_name||component));
      if(profile?.module==="immune_checkpoint_inhibitor"){
        const coreFreq=profile?.immune_core_frequency_estimates||{};
        arr(immuneModule?.risks).filter(r=>CORE_IRAE_IDS.includes(String(r.id))).forEach(r=>{
          add(r,profile.display_name||component,coreFreq?.[r.id]?.display||"",profile?.immune_frequency_source?.label||"");
        });
        arr(profile?.rare_immune_events).forEach(r=>add(
          {...r,tier:"serious"},
          profile.display_name||component,
          r.frequency||"",
          profile?.immune_frequency_source?.label||""
        ));
      }
    });

    return {rows,matches,hasImmune};
  }

  function regimenLink(protocol){
    const id=encodeURIComponent(text(protocol?.protocol_id));
    const base=new URL(root.location?.href||"https://sactcheck.com/");
    base.search="";
    base.hash="";
    base.searchParams.set("patientSupport",id);
    return base.href;
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
          <button type="button" data-patient-tab="toxicity" aria-selected="false">Toxicity passport</button>
          <button type="button" data-patient-tab="urgent" aria-selected="false">When to call</button>
          <button type="button" data-patient-tab="print" aria-selected="false">Printable passport</button>
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
    const freq=r.frequency?`<span class="risk-frequency">${esc(r.frequency)}</span>`:"";
    return `<article class="patient-risk-card ${esc(r.action)}">
      <div class="patient-risk-head"><span class="patient-risk-action">${esc(r.action.toUpperCase())}</span>${freq}</div>
      <h4>${esc(r.label)}</h4>
      <p>${esc(r.detail)}</p>
      <small>${esc(r.agent)}${r.frequencySource?` · ${esc(r.frequencySource)}`:""}</small>
    </article>`;
  }

  function scheduleMarkup(protocol){
    const rows=scheduleRows(protocol);
    if(!rows.length) return `<div class="patient-card"><p>${esc(scheduleSummary(protocol))}</p></div>`;
    return rows.map((row,i)=>`<article class="patient-phase-card">
      <div class="patient-phase-number">${i+1}</div>
      <div><span class="patient-phase-eyebrow">${esc(row.cycle?`${row.cycle}-day cycle`:"Treatment phase")}</span>
      <h4>${esc(row.phase)}</h4>
      <div class="patient-phase-days">${row.days.map(d=>`<div><strong>${esc(d.day)}</strong><span>${esc(d.medicines.join(" + "))}</span></div>`).join("")}</div></div>
    </article>`).join("");
  }

  function renderViews(protocol,content,riskContent){
    const title=protocolTitle(protocol);
    const code=protocolCode(protocol), version=protocolVersion(protocol);
    const indication=protocolIndication(protocol);
    const components=componentsForProtocol(protocol);
    const riskData=buildRiskRows(protocol,riskContent);
    const urgent=riskData.rows.filter(r=>r.action==="urgent");
    const contact=riskData.rows.filter(r=>r.action==="contact");
    const know=riskData.rows.filter(r=>r.action==="know");

    const overview=`
      <section class="patient-support-view active" data-patient-view="overview">
        <div class="patient-intro-card">
          <span class="patient-kicker">YOUR TREATMENT AT A GLANCE</span>
          <h3>${esc(title)}</h3>
          <div class="patient-badges">${code?`<span>NCCP ${esc(code)}${version?` · v${esc(version)}`:""}</span>`:""}${riskData.hasImmune?'<span>Includes immunotherapy</span>':""}</div>
          ${indication?`<p><strong>Why it is used:</strong> ${esc(indication)}</p>`:""}
          <p><strong>Recorded schedule:</strong> ${esc(scheduleSummary(protocol))}</p>
          <div class="patient-medicine-list">${components.map(m=>`<span>${esc(m)}</span>`).join("")}</div>
        </div>
        ${actionLegend()}
        <div class="patient-section-title"><div><h3>Important effects to recognise</h3><p>Seriousness and urgency are shown separately from how often an effect occurs.</p></div></div>
        <div class="patient-risk-grid">${[...urgent,...contact,...know].slice(0,12).map(riskCard).join("")||'<p class="patient-empty">Regimen-specific risk content is awaiting review.</p>'}</div>
      </section>`;

    const schedule=`
      <section class="patient-support-view" data-patient-view="schedule">
        <div class="patient-section-title"><div><h3>Your treatment schedule</h3><p>The regimen is shown as phases and treatment days so sequential regimens are easier to understand.</p></div></div>
        <div class="patient-schedule-timeline">${scheduleMarkup(protocol)}</div>
        <div class="patient-card patient-note"><strong>Bring this back to the treatment discussion if the recorded schedule does not match what your oncology team has explained.</strong></div>
      </section>`;

    const grades=patientGradeScale();
    const toxicity=`
      <section class="patient-support-view" data-patient-view="toxicity">
        <div class="patient-section-title"><div><h3>Toxicity passport</h3><p>A patient-language severity guide for describing change between treatments.</p></div></div>
        <div class="patient-grade-scale">${grades.map(g=>`<div class="grade-${g.grade}"><strong>${g.grade} · ${esc(g.label)}</strong><span>${esc(g.meaning)}</span></div>`).join("")}</div>
        <div class="patient-grade-boundary">This is a communication aid inspired by clinical toxicity grading. It is <strong>not</strong> a CTCAE assessment and should not be used to self-diagnose or decide whether treatment proceeds.</div>
        <div class="patient-risk-grid">${riskData.rows.map(riskCard).join("")||'<p class="patient-empty">Regimen-specific risk content is awaiting review.</p>'}</div>
      </section>`;

    const urgentCards=[
      ...(content?.urgent_general||[]).map(x=>({title:x.title,text:x.text})),
      ...urgent.slice(0,6).map(x=>({title:x.label,text:x.detail}))
    ];
    const urgentView=`
      <section class="patient-support-view" data-patient-view="urgent">
        <div class="patient-emergency-banner"><strong>Do not wait for the next appointment if you are significantly unwell.</strong><span>Use the emergency contact instructions supplied by your treating oncology centre.</span></div>
        <div class="urgent-grid">${urgentCards.map(x=>`<article><strong>${esc(x.title)}</strong><p>${esc(x.text)}</p></article>`).join("")}</div>
        <div class="patient-contact-template"><h3>Your treating-centre contacts</h3><p>24-hour oncology advice: ______________________________</p><p>Day ward / clinic: ____________________________________</p><p>Other instructions: ___________________________________</p></div>
      </section>`;

    const printView=`
      <section class="patient-support-view" data-patient-view="print">
        <div class="patient-print-card">
          <div><span class="patient-kicker">PRINT-FIRST · PATIENT AGNOSTIC</span><h3>Printable treatment passport</h3>
          <p>The passport is generated from the regimen only. It contains blank spaces for handwriting after printing; SACTCheck does not store patient name, hospital number, symptom diary entries or treatment dates.</p></div>
          <img src="${esc(qrUrl(protocol))}" alt="Regimen QR">
        </div>
        <div class="patient-print-actions">
          <button type="button" class="btn" data-open-print-passport>Open printable passport</button>
          <button type="button" class="btn secondary" data-copy-regimen-link>Copy regimen link</button>
        </div>
        <div class="patient-grade-boundary">The printable passport opens in a separate tab. Use the browser's <strong>Print</strong> command to print it or save it as a PDF. Nothing is automatically downloaded.</div>
      </section>`;

    return overview+schedule+toxicity+urgentView+printView;
  }

  function printableRiskRows(protocol,riskContent){
    const rows=buildRiskRows(protocol,riskContent).rows;
    return rows.slice(0,14);
  }

  function openPrintablePassport(protocol,riskContent){
    const viewer=root.open?.("about:blank","_blank");
    if(!viewer){ root.alert?.("Allow pop-ups for SACTCheck to open the printable passport."); return null; }

    const title=protocolTitle(protocol), code=protocolCode(protocol), version=protocolVersion(protocol);
    const components=componentsForProtocol(protocol), rows=printableRiskRows(protocol,riskContent);
    const grades=patientGradeScale();
    const qr=qrUrl(protocol), link=regimenLink(protocol);
    const riskRows=rows.map(r=>`<tr><td><b>${esc(r.label)}</b><br><small>${esc(r.agent)}</small></td><td>${esc(r.detail)}</td><td class="${esc(r.action)}">${esc(r.action.toUpperCase())}</td><td></td><td></td><td></td><td></td></tr>`).join("");

    const phaseHtml=scheduleRows(protocol).map((p,i)=>`<div class="phase"><b>${i+1}. ${esc(p.phase)}</b><span>${p.cycle?`${p.cycle}-day cycle · `:""}${esc(p.days.map(d=>`${d.day}: ${d.medicines.join(" + ")}`).join("; "))}</span></div>`).join("")||`<p>${esc(scheduleSummary(protocol))}</p>`;

    viewer.document.open();
    viewer.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>SACTCheck Patient Passport - ${esc(title)}</title>
<style>
@page{size:A4;margin:10mm}*{box-sizing:border-box}body{margin:0;background:#eef3f5;font-family:Arial,Helvetica,sans-serif;color:#17212b}
.toolbar{position:sticky;top:0;z-index:5;padding:10px;text-align:center;background:#12314a}.toolbar button{background:#fff;color:#12314a;border:0;border-radius:7px;padding:9px 15px;font-weight:700;cursor:pointer}
.page{width:190mm;min-height:277mm;margin:12px auto;background:#fff;padding:12mm;box-shadow:0 8px 28px rgba(0,0,0,.12);page-break-after:always}
.page:last-child{page-break-after:auto}.brand{display:flex;gap:10px;align-items:center;border-bottom:3px solid #159b95;padding-bottom:8px}.brand img{width:42px;height:48px}.brand b{font-size:24px;color:#12314a}.brand span{display:block;color:#0b7772;font-weight:700}
h1{font-size:23px;color:#12314a;margin:15px 0 4px}h2{font-size:16px;color:#12314a;border-bottom:1px solid #cbd8de;padding-bottom:5px;margin-top:16px}p,td,th{font-size:10px;line-height:1.4}
.badges{display:flex;gap:6px;flex-wrap:wrap}.badge{background:#e9f6f5;color:#0b6d69;padding:4px 8px;border-radius:999px;font-size:9px;font-weight:700}
.blank{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0}.blank div{border-bottom:1px solid #657780;padding:8px 2px;font-size:10px}
.phase{border-left:4px solid #159b95;background:#f3f9f9;padding:8px 10px;margin:7px 0}.phase b{display:block;color:#12314a}.phase span{display:block;font-size:9.5px;margin-top:3px}
.legend{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.legend div{padding:8px;border-radius:8px;font-size:9px}.legend b{display:block;margin-bottom:3px}.know{background:#eef7f2}.contact{background:#fff6df}.urgent{background:#fff0f1;color:#84252d}
table{border-collapse:collapse;width:100%;table-layout:fixed}th,td{border:1px solid #bfcdd4;padding:5px;vertical-align:top}th{background:#edf4f6;color:#12314a}th:nth-child(1){width:20%}th:nth-child(2){width:38%}th:nth-child(3){width:12%}th:nth-child(n+4){width:7.5%}
.grade{display:grid;grid-template-columns:repeat(5,1fr);gap:5px}.grade div{border:1px solid #cbd6dc;border-radius:7px;padding:6px}.grade b{display:block;color:#12314a;font-size:9px}.grade span{display:block;font-size:8px;margin-top:2px}
.qr{display:grid;grid-template-columns:1fr 115px;gap:10px;align-items:center;border:1px solid #cbd8de;border-radius:9px;padding:10px}.qr img{width:105px;height:105px}.url{font-size:8px;word-break:break-all;color:#58717c}
.note{font-size:8px;color:#697b83;margin-top:8px}.footer{margin-top:10px;border-top:1px solid #ced9df;padding-top:6px;font-size:8px;color:#697b83}
@media print{body{background:#fff}.toolbar{display:none}.page{margin:0;box-shadow:none;width:auto;min-height:0;padding:0}}
</style></head><body>
<div class="toolbar"><button onclick="window.print()">Print / Save PDF</button></div>

<section class="page">
<div class="brand"><img src="assets/branding/sactcheck-mark.svg" alt=""><div><b>SACTCheck</b><span>SACT support at point of care</span></div></div>
<h1>${esc(title)}</h1>
<div class="badges">${code?`<span class="badge">NCCP ${esc(code)}${version?` · v${esc(version)}`:""}</span>`:""}<span class="badge">Patient treatment passport</span><span class="badge">Regimen specific</span></div>
<div class="blank"><div>Patient name (handwrite):</div><div>Hospital / MRN (handwrite):</div><div>Oncology contact:</div><div>Treatment start date:</div></div>
<h2>Your treatment</h2>
<p><b>Medicines:</b> ${esc(components.join(" + ")||"Confirm with your treating team")}</p>
<div>${phaseHtml}</div>
<h2>How to use this passport</h2>
<div class="legend"><div class="know"><b>KNOW</b>Expected or useful information.</div><div class="contact"><b>CONTACT</b>Report new or worsening symptoms promptly.</div><div class="urgent"><b>URGENT</b>Symptoms that may need urgent assessment.</div></div>
<h2>Regimen-specific effects to recognise</h2>
<table><thead><tr><th>Effect</th><th>What to notice</th><th>Action</th><th>C1</th><th>C2</th><th>C3</th><th>C4</th></tr></thead><tbody>${riskRows}</tbody></table>
<div class="footer">This is a patient communication aid. It does not replace oncology advice, formal consent, current NCCP guidance or local emergency instructions.</div>
</section>

<section class="page">
<div class="brand"><img src="assets/branding/sactcheck-mark.svg" alt=""><div><b>My treatment passport</b><span>${esc(title)}</span></div></div>
<h2>Patient symptom severity guide</h2>
<div class="grade">${grades.map(g=>`<div><b>${esc(g.grade)} · ${esc(g.label)}</b><span>${esc(g.meaning)}</span></div>`).join("")}</div>
<p class="note"><b>Important:</b> this patient-language scale is inspired by clinical toxicity grading but is not a CTCAE assessment. Do not use it to decide whether treatment should proceed.</p>
<h2>Cycle / visit record</h2>
<table><thead><tr><th>Cycle / date</th><th colspan="2">How I felt / symptoms to discuss</th><th colspan="2">Action taken / advice</th></tr></thead>
<tbody>${Array.from({length:9},(_,i)=>`<tr style="height:18mm"><td>Cycle ${i+1}<br>Date:</td><td colspan="2"></td><td colspan="2"></td></tr>`).join("")}</tbody></table>
<h2>When to call</h2>
<p>Use the emergency contact instructions supplied by your treating centre for fever or sudden illness, new/worsening breathlessness or chest pain, severe/persistent diarrhoea or vomiting, new neurological symptoms, significant bleeding, or any symptom that is severe or rapidly worsening.</p>
<div class="blank"><div>24-hour oncology advice:</div><div>Day ward / clinic:</div><div>Other instructions:</div><div>Next planned review:</div></div>
<div class="qr"><div><b>Regimen-specific information</b><p>Scan the QR code to reopen the patient-facing SACTCheck page for this regimen. The link identifies the regimen only and contains no patient details.</p><div class="url">${esc(link)}</div></div><img src="${esc(qr)}" alt="Regimen QR"></div>
<div class="footer">Blank fields are intended for handwriting after printing. SACTCheck does not store the patient's name, MRN, symptom diary entries or treatment dates in this passport.</div>
</section>
</body></html>`);
    viewer.document.close();
    return viewer;
  }

  async function open(protocol,options={}){
    const live=root.SACTCheckProtocolLoader?.getProtocolById?.(protocol?.protocol_id)||protocol;
    if(!live) return null;
    activeProtocol=live;
    const shell=ensureShell();
    shell.hidden=false;
    root.document.body.classList.add("patient-content-open");
    shell.querySelector("#patientSupportTitle").textContent=protocolTitle(live);
    shell.querySelector("#patientSupportSubtitle").textContent="Regimen-specific treatment understanding, toxicity recognition and printable passport";
    const body=shell.querySelector("#patientSupportBody");
    body.innerHTML='<div class="patient-loading-card">Preparing regimen-specific patient support...</div>';
    try{
      const [content,risk]=await Promise.all([loadContent(),loadRisk()]);
      body.innerHTML=renderViews(live,content,risk);
      const requested=options?.tab||"overview";
      shell.querySelectorAll("[data-patient-tab]").forEach(b=>b.setAttribute("aria-selected",b.dataset.patientTab===requested?"true":"false"));
      shell.querySelectorAll("[data-patient-view]").forEach(v=>v.classList.toggle("active",v.dataset.patientView===requested));
      body.querySelector("[data-open-print-passport]")?.addEventListener("click",()=>openPrintablePassport(live,risk));
      body.querySelector("[data-copy-regimen-link]")?.addEventListener("click",async()=>{
        const link=regimenLink(live);
        try{ await root.navigator.clipboard.writeText(link); root.showToast?.("Regimen link copied"); }
        catch(_){ root.prompt?.("Copy this regimen link:",link); }
      });
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
  function consentText(){ return "Regimen-specific consent and patient-information support."; }

  return Object.freeze({
    release:RELEASE,version:RELEASE,
    normalise,componentsForProtocol,scheduleRows,scheduleSummary,profileMatches,
    actionLevel,patientGradeScale,buildRiskRows,regimenLink,qrUrl,
    preload,open,openPatientSupport:open,close,install,openPrintablePassport,
    generateConsentPdf,consentText
  });
});
