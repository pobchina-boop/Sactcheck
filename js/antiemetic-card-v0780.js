/** SACTCheck v0.78.0 - visible traffic-light antiemetic script on regimen cards. */
(function(root){
  "use strict";
  const RELEASE=root.SACTCHECK_RELEASE||"0.78.0";
  const esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
  const arr=v=>v==null?[]:(Array.isArray(v)?v:[v]);
  const colours={high:"#b42318",moderate:"#c56a00",low:"#217a46",minimal:"#246b9e",oral_moderate_high:"#c56a00",oral_minimal_low:"#217a46",pending:"#6c7880",variable:"#6c7880",phase_dependent:"#6c4b91"};
  let queued=false;

  function medText(x){return [x?.medicine,x?.dose,x?.frequency].filter(Boolean).join(" ");}
  function uniqueNames(items){return [...new Set(arr(items).map(x=>x?.medicine).filter(Boolean))];}
  function protocolFor(card){
    const id=card?.dataset?.jsonProtocolId;
    return root.SACTCheckProtocolLoader?.getProtocolById?.(id)||null;
  }
  function ensureCss(){
    if(root.document.getElementById("antiemeticCardV0780Style")) return;
    const s=root.document.createElement("style");s.id="antiemeticCardV0780Style";
    s.textContent=`.antiemetic-script-v0780{margin:10px 0 2px;border:1px solid #d9e3e7;border-left:5px solid var(--anti);border-radius:10px;background:#fbfdfe;overflow:hidden}.antiemetic-script-v0780 summary{display:flex;align-items:center;gap:8px;cursor:pointer;list-style:none;padding:8px 10px;font-size:.78rem;color:#203b49}.antiemetic-script-v0780 summary::-webkit-details-marker{display:none}.antiemetic-script-v0780 summary .anti-dot{width:10px;height:10px;border-radius:50%;background:var(--anti);box-shadow:0 0 0 3px color-mix(in srgb,var(--anti) 15%,transparent)}.antiemetic-script-v0780 summary b{margin-right:auto}.antiemetic-script-v0780 summary small{color:#687c85;font-weight:600}.antiemetic-script-body{padding:0 10px 10px;font-size:.73rem;line-height:1.42;color:#4b6069}.antiemetic-script-body p{margin:6px 0}.antiemetic-script-body strong{color:#263f4b}.antiemetic-script-body .anti-source{display:inline-block;margin-top:4px;font-weight:700;color:#216b78;text-decoration:none}.antiemetic-script-body .anti-evidence{margin-top:7px;padding:6px 7px;background:#f1f6f7;border-radius:6px;color:#536871}.antiemetic-script-body .anti-local{margin-top:7px;padding-top:7px;border-top:1px dashed #ccd9de}.antiemetic-script-body .anti-warning{color:#7a4d21}`;
    root.document.head.appendChild(s);
  }
  function render(card,manifest){
    if(!card||card.querySelector(".antiemetic-script-v0780")) return;
    const r=manifest?.emetogenic||{}, p=manifest?.supportiveCare||{};
    const level=String(r.level||r.baseLevel||p.risk_level||"pending").toLowerCase();
    const colour=colours[level]||colours.pending;
    const day1=arr(p.day1).map(medText).filter(Boolean);
    const after=arr(p.subsequent).map(medText).filter(Boolean);
    const local=uniqueNames(p.local_prescription_items);
    const agent=arr(p.agentSupport);
    const agentNames=agent.map(x=>x?.label).filter(Boolean);
    const localAgentMeds=[...new Set(agent.flatMap(x=>uniqueNames(x?.local_prescription_items)))];
    const status=p.status||"review_required";
    const details=root.document.createElement("details");
    details.className="antiemetic-script-v0780";
    details.style.setProperty("--anti",colour);
    details.dataset.release=RELEASE;
    details.innerHTML=`<summary><span class="anti-dot" aria-hidden="true"></span><b>${esc(r.label||p.label||"Antiemetic support")}</b><small>${status==="available"?"Rx script":"review"} ▾</small></summary><div class="antiemetic-script-body">
      ${day1.length?`<p><strong>Day 1:</strong> ${esc(day1.join(" + "))}</p>`:`<p><strong>Day 1:</strong> ${esc(p.message||"No routine prophylaxis / confirm current guidance")}</p>`}
      ${after.length?`<p><strong>After treatment / rescue:</strong> ${esc(after.join(" · "))}</p>`:""}
      ${local.length?`<div class="anti-local"><strong>Local-reference adjuncts:</strong> ${esc(local.join(", "))}. <span>Not all are antiemetics; use the current labelled/local prescription.</span></div>`:""}
      ${agentNames.length?`<div class="anti-local"><strong>Regimen-specific support:</strong> ${esc(agentNames.join(" · "))}${localAgentMeds.length?` — ${esc(localAgentMeds.join(", "))}`:""}</div>`:""}
      ${p.evidence_update?`<div class="anti-evidence"><strong>2023–2025 evidence reconciliation:</strong> ${esc(p.evidence_update)}</div>`:""}
      ${arr(p.warnings).some(x=>String(x).toLowerCase().includes("metoclopramide"))?`<p class="anti-warning"><strong>Metoclopramide:</strong> current EMA/Irish product information limits adult use to max 30 mg/day for max 5 days.</p>`:""}
      <a class="anti-source" href="https://healthservice.hse.ie/documents/7180/Supportive_Care_Antiemetics_for_inclusion_NCIS_Medical_Oncology.pdf" target="_blank" rel="noopener noreferrer">Current NCCP antiemetic guidance ↗</a>
    </div>`;
    const actions=card.querySelector(".card-actions");
    if(actions) actions.insertAdjacentElement("beforebegin",details); else card.appendChild(details);
  }
  async function decorateCard(card){
    if(!card||card.dataset.antiV0780==="loading"||card.querySelector(".antiemetic-script-v0780")) return;
    const protocol=protocolFor(card); if(!protocol) return;
    card.dataset.antiV0780="loading";
    try{
      const manifest=await root.SACTCheckRegimenWorkflow?.resolve?.(protocol);
      if(manifest) render(card,manifest);
    }catch(_){
      const r=root.SACTCheckEmetogenicRisk?.get?.(protocol)||{};
      render(card,{emetogenic:r,supportiveCare:{status:"review_required",message:"Open current NCCP antiemetic guidance and confirm the regimen-specific prescription."}});
    }finally{card.dataset.antiV0780="ready";}
  }
  function refresh(){
    ensureCss();
    root.document.querySelectorAll(".regimen-card[data-json-protocol-id]").forEach(decorateCard);
  }
  function schedule(){if(queued)return;queued=true;root.setTimeout(()=>{queued=false;refresh();},20);}
  function install(){
    ensureCss();schedule();
    root.addEventListener?.("sactcheck:protocols-loaded",schedule);
    root.document.addEventListener?.("sactcheck:regimen-card-metadata-rendered",schedule);
    root.addEventListener?.("sactcheck:engine-first-homepage-ready",schedule);
  }
  if(root.document){if(root.document.readyState==="loading")root.document.addEventListener("DOMContentLoaded",install,{once:true});else install();}
  root.SACTCheckAntiemeticCard=Object.freeze({release:RELEASE,refresh,decorateCard});
})(typeof globalThis!=="undefined"?globalThis:this);
