/**
 * SACTCheck v0.78.0 - Treatment Passport Card
 * Patient-identifiable fields are intentionally blank and completed by hand.
 * The QR contains only the public regimen URL.
 */
(function(root,factory){
  const api=factory(root||{});
  if(typeof module==="object"&&module.exports) module.exports=api;
  root.SACTCheckTreatmentPassportCard=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(root){
  "use strict";
  const RELEASE=root.SACTCHECK_RELEASE||"0.78.0";
  const text=v=>String(v??"").trim();
  const esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
  const arr=v=>v==null?[]:(Array.isArray(v)?v:[v]);

  function title(protocol){
    const md=protocol?.metadata||{};
    return text(md.short_title||md.display_title||md.title||protocol?.title||protocol?.protocol_id||"SACT regimen");
  }
  function code(protocol){
    const md=protocol?.metadata||{};
    return text(md.nccp_regimen_code||md.nccp_number||protocol?.nccp_regimen_code||"");
  }
  function version(protocol){return text(protocol?.metadata?.nccp_version||"");}
  function components(protocol){
    try{
      const fromPatient=root.SACTCheckPatientContent?.componentsForProtocol?.(protocol);
      if(Array.isArray(fromPatient)&&fromPatient.length) return fromPatient;
    }catch(_){ }
    const out=[];
    arr(protocol?.treatment_phases).forEach(p=>arr(p?.administration).forEach(x=>out.push(x?.drug||x?.medicine||x?.name)));
    arr(protocol?.regimen_components).forEach(x=>out.push(x?.drug||x?.medicine||x?.name||x));
    arr(protocol?.metadata?.drugs).forEach(x=>out.push(x?.drug||x?.medicine||x?.name||x));
    return [...new Set(out.map(text).filter(Boolean))];
  }
  function schedule(protocol){
    try{
      const v=root.SACTCheckPatientContent?.scheduleSummary?.(protocol);
      if(text(v)) return text(v);
    }catch(_){ }
    const md=protocol?.metadata||{};
    return text(md.schedule||md.frequency||md.cycle_schedule||"Confirm schedule with your oncology team");
  }
  function regimenLink(protocol){
    try{
      const v=root.SACTCheckPatientContent?.regimenLink?.(protocol);
      if(text(v)) return text(v);
    }catch(_){ }
    const c=code(protocol);
    return c?`https://sactcheck.com/patient/${encodeURIComponent(c)}/`:`https://sactcheck.com/`;
  }
  function qrUrl(protocol){
    try{
      const v=root.SACTCheckPatientContent?.qrUrl?.(protocol);
      if(text(v)) return text(v);
    }catch(_){ }
    return `https://quickchart.io/qr?size=170&margin=1&text=${encodeURIComponent(regimenLink(protocol))}`;
  }
  function therapyType(protocol){
    const s=(title(protocol)+" "+components(protocol).join(" ")+" "+JSON.stringify(protocol?.metadata||{})).toLowerCase();
    const tags=[];
    if(/pembrolizumab|nivolumab|atezolizumab|durvalumab|cemiplimab|ipilimumab/.test(s)) tags.push("IMMUNOTHERAPY");
    if(/trastuzumab|pertuzumab|bevacizumab|cetuximab|panitumumab|olaparib|niraparib|ribociclib|osimertinib|erlotinib|targeted/.test(s)) tags.push("TARGETED THERAPY");
    if(/tamoxifen|letrozole|anastrozole|exemestane|abiraterone|enzalutamide|endocrine|hormonal/.test(s)) tags.push("HORMONAL / TARGETED");
    if(/carboplatin|cisplatin|oxaliplatin|paclitaxel|docetaxel|fluorouracil|5-fu|capecitabine|gemcitabine|irinotecan|doxorubicin|cyclophosphamide|pemetrexed|temozolomide|etoposide|vinorelbine|chemotherapy/.test(s)) tags.unshift("CHEMOTHERAPY");
    return [...new Set(tags)].slice(0,2).join(" + ")||"SYSTEMIC ANTI-CANCER THERAPY";
  }
  function maintenanceLike(protocol){
    const s=(title(protocol)+" "+schedule(protocol)+" "+JSON.stringify(protocol?.treatment_phases||[])).toLowerCase();
    return /maintenance|until progression|until disease progression|continuous/.test(s) && !/induction/.test(title(protocol).toLowerCase());
  }
  function stampCount(protocol){
    if(maintenanceLike(protocol)) return 8;
    // Use only explicit structured course metadata. Do not infer a planned
    // treatment length from free-text rules, where unrelated cycle numbers can occur.
    const candidates=[
      protocol?.treatment?.planned_cycles, protocol?.treatment?.maximum_cycles,
      protocol?.planned_cycles, protocol?.maximum_cycles,
      protocol?.metadata?.planned_cycles, protocol?.metadata?.maximum_cycles,
      ...arr(protocol?.treatment_phases).flatMap(p=>[p?.planned_cycles,p?.maximum_cycles])
    ].map(Number).filter(Number.isFinite).filter(n=>n>=1);
    if(candidates.length) return Math.min(12,Math.max(...candidates));
    // Eight neutral stamp spaces fit the wallet format and do not imply that eight
    // cycles are clinically required; the card is reissued when more space is needed.
    return 8;
  }
  function risk(protocol){
    try{return root.SACTCheckEmetogenicRisk?.get?.(protocol)||{};}catch(_){return {};}
  }
  function riskColour(level){
    const x=String(level||"").toLowerCase();
    if(x==="high") return "#b42318";
    if(x==="moderate"||x==="oral_moderate_high") return "#c56a00";
    if(x==="low"||x==="oral_minimal_low") return "#217a46";
    if(x==="minimal") return "#246b9e";
    return "#667781";
  }
  function stampMarkup(protocol){
    const n=stampCount(protocol), maint=maintenanceLike(protocol);
    return Array.from({length:n},(_,i)=>`<div class="stamp"><b>${maint?"M":"C"}${i+1}</b><span></span></div>`).join("");
  }
  function card(protocol,index){
    const r=risk(protocol), c=code(protocol), v=version(protocol), link=regimenLink(protocol);
    const riskLabel=text(r.label||"Emetogenic risk: confirm");
    const meds=components(protocol).slice(0,6).join(" · ");
    const phaseNote=maintenanceLike(protocol)?"Maintenance card · reissue if treatment changes":"Replace/reissue this card if the regimen or treatment phase changes";
    return `<section class="fold-card" aria-label="Treatment Passport Card copy ${index}">
      <article class="card-face front">
        <div class="brandrow"><div><span class="eyebrow">SACTCHECK</span><h2>Treatment Passport</h2></div><span class="show">SHOW TO HEALTHCARE STAFF</span></div>
        <div class="patient-fields"><span><b>Name</b> __________________________</span><span><b>DOB</b> ______________</span><span><b>Hospital / unit</b> __________________</span></div>
        <div class="regimen"><small>MY CURRENT TREATMENT</small><h3>${esc(title(protocol))}</h3><p>${esc(meds||"See regimen information")}</p></div>
        <div class="facts"><span><b>${esc(therapyType(protocol))}</b></span><span>${esc(schedule(protocol))}</span>${c?`<span>NCCP ${esc(c)}${v?` · v${esc(v)}`:""}</span>`:""}</div>
        <div class="risk" style="--risk:${riskColour(r.level||r.baseLevel)}"><i></i><b>${esc(riskLabel)}</b><span>Follow the anti-sickness medicines supplied by your oncology team.</span></div>
        <div class="cycle-head"><b>${maintenanceLike(protocol)?"Maintenance treatments":"Cycle record"}</b><span>Stamp / date when given</span></div>
        <div class="stamps">${stampMarkup(protocol)}</div>
        <div class="write-row"><span><b>Last treatment</b> ____________</span><span><b>Next planned</b> ____________</span><span><b>SOS</b> __________________</span></div>
      </article>
      <article class="card-face back">
        <div class="backtop"><div><span class="eyebrow">SACTCHECK · TREATMENT PASSPORT</span><h3>If I become unwell</h3></div><div class="qr"><img src="${esc(qrUrl(protocol))}" alt="QR to public regimen information"><small>Public regimen guide</small></div></div>
        <div class="urgent"><b>Contact oncology urgently</b><p>Fever / shivering or sudden illness · new chest pain or breathlessness · persistent vomiting or diarrhoea · significant bleeding · new confusion / severe weakness · another symptom your team told you is urgent.</p></div>
        <div class="emergency"><b>Medical emergency in Ireland: 112 / 999</b><span>Tell staff I am receiving systemic anti-cancer treatment.</span></div>
        <div class="blank"><span><b>24-hour oncology SOS number</b> ____________________________</span><span><b>Oncology team / hospital</b> ______________________________</span></div>
        <div class="link"><b>${esc(title(protocol))}</b><code>${esc(link)}</code></div>
        <div class="privacy">No patient information is stored in the QR. Personal details are written on the physical card only. ${esc(phaseNote)}.</div>
      </article>
    </section>`;
  }

  function html(protocol){
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SACTCheck Treatment Passport - ${esc(title(protocol))}</title><style>
      @page{size:A4 portrait;margin:8mm}*{box-sizing:border-box}body{margin:0;background:#e9eef1;font-family:Arial,Helvetica,sans-serif;color:#152832}.toolbar{position:sticky;top:0;z-index:5;background:#0d3852;padding:9px;text-align:center}.toolbar button{border:0;border-radius:8px;background:#fff;color:#0d3852;font-weight:800;padding:9px 15px}.sheet{width:194mm;min-height:281mm;margin:10px auto;background:#fff;padding:5mm;display:grid;grid-template-rows:repeat(4,54mm);gap:5mm;box-shadow:0 8px 30px #0002}.fold-card{width:171.2mm;height:54mm;margin:auto;display:grid;grid-template-columns:85.6mm 85.6mm;border:1px dashed #8da0aa;border-radius:3mm;overflow:hidden;break-inside:avoid}.card-face{position:relative;padding:3.2mm;background:#fff;overflow:hidden}.front{border-right:1px dashed #71858f}.brandrow,.backtop{display:flex;justify-content:space-between;gap:3mm;align-items:flex-start}.eyebrow{font-size:6.2pt;letter-spacing:.1em;font-weight:900;color:#347b78}.brandrow h2,.backtop h3{margin:.2mm 0 0;color:#123a58}.brandrow h2{font-size:13pt}.show{font-size:5.8pt;font-weight:800;color:#5d6e75;text-align:right}.patient-fields{display:flex;flex-wrap:wrap;gap:1.1mm 3mm;margin:2mm 0;font-size:6.1pt}.regimen{border-left:2.2mm solid #327d78;padding-left:2mm;margin:1.7mm 0}.regimen small{font-size:5.4pt;letter-spacing:.08em;font-weight:800;color:#60747d}.regimen h3{font-size:10.5pt;margin:.4mm 0;color:#173e57;line-height:1.03}.regimen p{font-size:5.8pt;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.facts{display:flex;flex-wrap:wrap;gap:1mm;margin:1.3mm 0}.facts span{font-size:5.6pt;background:#edf4f5;border-radius:20px;padding:.8mm 1.4mm}.risk{display:grid;grid-template-columns:3mm auto 1fr;align-items:center;gap:1mm;font-size:5.6pt;border-top:1px solid #dbe5e8;padding-top:1mm}.risk i{width:2.5mm;height:2.5mm;border-radius:50%;background:var(--risk)}.risk span{color:#65767d;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cycle-head{display:flex;justify-content:space-between;margin-top:1.2mm;font-size:5.6pt}.stamps{display:flex;gap:1mm;margin-top:.8mm;flex-wrap:wrap}.stamp{width:9mm;height:9mm;border:1px solid #9cadb5;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:5.2pt;background:#fbfdfd}.stamp span{display:block;width:5mm;border-top:1px solid #b8c4ca;margin-top:.7mm}.write-row{position:absolute;left:3.2mm;right:3.2mm;bottom:2.2mm;display:flex;justify-content:space-between;gap:2mm;font-size:5.4pt}.backtop h3{font-size:12pt}.qr{text-align:center;width:17mm}.qr img{display:block;width:13mm;height:13mm;margin:auto}.qr small{font-size:4.8pt}.urgent{margin-top:1.5mm;border-left:2mm solid #b42318;background:#fff4f2;padding:1.7mm 2mm}.urgent b{font-size:7pt;color:#8c2118}.urgent p{font-size:5.8pt;line-height:1.3;margin:.7mm 0 0}.emergency{margin:1.5mm 0;background:#173e57;color:#fff;border-radius:1.5mm;padding:1.5mm 2mm;display:flex;justify-content:space-between;gap:2mm;font-size:5.7pt}.blank{display:grid;gap:1.4mm;font-size:5.9pt;margin:1.4mm 0}.link{border-top:1px solid #dbe5e8;padding-top:1.2mm;font-size:5.3pt}.link code{display:block;font-size:4.8pt;color:#61737b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.privacy{position:absolute;left:3.2mm;right:3.2mm;bottom:2mm;font-size:4.8pt;line-height:1.25;color:#6b7b82}.fold-card:after{content:"FOLD";position:absolute}.foot{font-size:7pt;text-align:center;color:#62737a;margin-top:3mm}@media print{body{background:#fff}.toolbar{display:none}.sheet{margin:0;box-shadow:none;width:auto;min-height:0;padding:0}}
    </style></head><body><div class="toolbar"><button onclick="window.print()">Print / Save Treatment Passport Card</button></div><main class="sheet">${[1,2,3,4].map(i=>card(protocol,i)).join("")}</main><div class="foot">Print at actual size (100%). Cut each dashed outer edge and fold on the centre line. Confirm local printing/lamination practice before routine distribution. SACTCheck v${esc(RELEASE)}.</div></body></html>`;
  }

  function open(protocol){
    const live=root.SACTCheckProtocolLoader?.getProtocolById?.(protocol?.protocol_id)||protocol;
    if(!live) return null;
    const w=root.open?.("","_blank");
    if(!w){root.showToast?.("Allow pop-ups to open the Treatment Passport Card.");return null;}
    w.document.open();w.document.write(html(live));w.document.close();
    return w;
  }

  return Object.freeze({release:RELEASE,title,code,components,schedule,regimenLink,stampCount,maintenanceLike,html,open});
});
