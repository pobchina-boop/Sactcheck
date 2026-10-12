(function(root){
  "use strict";
  function redraw(panel){
    const stage=panel.querySelector(".hcc-visual-stage");
    if(!stage) return;
    stage.querySelector(".hcc-connector-layer")?.remove();
    if(stage.querySelector(".hcc-static-connectors")) return;
    if(root.matchMedia?.("(max-width:700px)").matches) return;
    const bounds=stage.getBoundingClientRect();
    if(!bounds.width||!bounds.height) return;
    const ns="http://www.w3.org/2000/svg";
    const svg=root.document.createElementNS(ns,"svg");
    svg.setAttribute("class","hcc-connector-layer");
    svg.setAttribute("viewBox",`0 0 ${bounds.width} ${bounds.height}`);
    svg.setAttribute("aria-hidden","true");
    for(const card of stage.querySelectorAll("[data-hcc-target]")){
      const pin=stage.querySelector(`[data-hcc-pin="${card.dataset.hccTarget}"]`);
      if(!pin) continue;
      const a=card.getBoundingClientRect(),b=pin.getBoundingClientRect();
      const left=card.classList.contains("left");
      const line=root.document.createElementNS(ns,"line");
      line.setAttribute("x1",left?a.right-bounds.left:a.left-bounds.left);
      line.setAttribute("y1",a.top+a.height/2-bounds.top);
      line.setAttribute("x2",b.left+b.width/2-bounds.left);
      line.setAttribute("y2",b.top+b.height/2-bounds.top);
      if(card.classList.contains("bev")) line.setAttribute("class","bev");
      svg.appendChild(line);
    }
    stage.prepend(svg);
  }
  function update(){root.document?.querySelectorAll(".hcc-bodymap").forEach(redraw)}
  let timer;
  function schedule(){root.clearTimeout(timer);timer=root.setTimeout(update,60)}

  function is00568Page(){
    return Boolean(root.document?.querySelector('[data-regimen-map="00568"]')&&root.document?.querySelector('.wiki-drugs'));
  }
  function ensure00568Style(){
    if(!is00568Page()||root.document.getElementById('patient00568RefinementStyle')) return;
    const s=root.document.createElement('style');s.id='patient00568RefinementStyle';
    s.textContent=`
      .wiki-drug .wiki-diagram{height:150px;margin:10px 0 8px;background:linear-gradient(180deg,#fbfdfe,#f6fafb);border:1px solid #e0e9ed;border-radius:14px;padding:8px}
      .wiki-drug .wiki-diagram .diagram-label{font:700 9px system-ui,-apple-system,Segoe UI,sans-serif;letter-spacing:.04em;text-transform:uppercase}
      .wiki-drug .wiki-diagram .diagram-small{font:650 8px system-ui,-apple-system,Segoe UI,sans-serif}

      .wiki-cycle-map{margin-top:26px;border:1px solid #d7e3e7;border-radius:16px;background:#fff;padding:20px;box-shadow:0 6px 22px rgba(16,49,64,.04)}
      .wiki-cycle-map h3{margin:0 0 4px;font-size:22px;color:#153448}
      .wiki-cycle-map>.wiki-cycle-intro{margin:0 0 15px;color:#536c78;max-width:900px}
      .wiki-cycle-scroll{overflow-x:auto;padding:4px 2px 10px}
      .wiki-cycle-chart{min-width:900px}
      .wiki-cycle-axis,.wiki-cycle-track{display:grid;grid-template-columns:190px repeat(21,minmax(24px,1fr));align-items:center;min-height:44px;border-bottom:1px solid #edf2f4}
      .wiki-cycle-axis{min-height:34px;border-bottom:2px solid #dce7eb}
      .wiki-cycle-label{font-weight:780;font-size:13px;padding-right:12px;color:#294c5c}
      .wiki-cycle-day{text-align:center;font-size:10px;color:#6a7d87}
      .wiki-cycle-day:first-of-type{font-weight:850;color:#0b7776}
      .wiki-cycle-band{align-self:center;min-height:28px;display:flex;align-items:center;padding:5px 8px;border-radius:7px;font-size:11px;line-height:1.2;font-weight:720;overflow:visible;white-space:nowrap}
      .wiki-cycle-band.infusion{background:#0b7a78;color:#fff}
      .wiki-cycle-band.early{background:#fff0d5;color:#694500;border:1px solid #f1d79e}
      .wiki-cycle-band.variable{background:repeating-linear-gradient(135deg,#edf4f7,#edf4f7 8px,#e2ecef 8px,#e2ecef 10px);color:#294c5c;border:1px solid #d4e1e5}
      .wiki-cycle-band.bowel{background:#f0eafa;color:#5f3c8a;border:1px solid #dbcfef}
      .wiki-cycle-band.cumulative{background:repeating-linear-gradient(45deg,#f5eee5,#f5eee5 8px,#eadfce 8px,#eadfce 10px);color:#704b18;border:1px solid #e0cfb6}
      .wiki-cycle-band.immune{background:#efe8f8;color:#5f3c8a;border:1px solid #d6c7eb;position:relative}
      .wiki-cycle-band.immune::after{content:'→ can also occur after treatment';position:absolute;left:100%;margin-left:7px;color:#6b4a8f;font-size:10px;font-weight:700}
      .wiki-cycle-key{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 18px;margin-top:14px;color:#516874;font-size:12px;line-height:1.45}
      .wiki-cycle-key strong{color:#234858}
      .wiki-cycle-evidence{margin-top:14px;padding:12px 14px;background:#f7fafb;border-left:4px solid #6f8793;border-radius:8px;color:#556c77;font-size:11.5px;line-height:1.5}
      .wiki-cycle-evidence a{font-weight:750}

      .wiki-safety-dock{position:fixed;right:18px;bottom:18px;z-index:1000;display:flex;align-items:flex-end;gap:8px;font-family:system-ui,-apple-system,Segoe UI,sans-serif}
      .wiki-safety-dock>a,.wiki-safety-dock summary{display:flex;align-items:center;justify-content:center;min-height:42px;padding:9px 12px;border-radius:12px;border:1px solid #cfdde2;background:#fff;color:#173a4b;text-decoration:none;font-size:12px;font-weight:800;box-shadow:0 8px 26px rgba(17,54,71,.14);cursor:pointer;list-style:none}
      .wiki-safety-dock summary::-webkit-details-marker{display:none}
      .wiki-safety-dock details{position:relative}
      .wiki-safety-dock details[open] summary{background:#173f53;color:#fff}
      .wiki-safety-panel{position:absolute;right:0;bottom:50px;width:310px;background:#fff;border:1px solid #cedce1;border-radius:14px;padding:12px;box-shadow:0 16px 42px rgba(17,54,71,.2)}
      .wiki-safety-panel strong{display:block;margin-bottom:6px;color:#153448}
      .wiki-safety-panel a{display:block;padding:9px 10px;margin:5px 0;border-radius:9px;background:#f4f8fa;text-decoration:none;color:#174b62;font-weight:800}
      .wiki-safety-panel small{display:block;color:#667983;font-weight:500;margin-top:2px}
      .wiki-safety-panel .emergency{background:#fff0f2;color:#8e2334}
      @media(max-width:760px){
        body{padding-bottom:64px}
        .wiki-safety-dock{left:0;right:0;bottom:0;align-items:stretch;gap:0;background:#fff;border-top:1px solid #cbd9de;padding-bottom:env(safe-area-inset-bottom)}
        .wiki-safety-dock>a,.wiki-safety-dock summary{flex:1;border:0;border-right:1px solid #dbe5e8;border-radius:0;box-shadow:none;min-height:52px;padding:7px 8px;text-align:center;font-size:11px}
        .wiki-safety-dock details{flex:1;display:flex}
        .wiki-safety-dock details summary{width:100%}
        .wiki-safety-panel{position:fixed;left:10px;right:10px;bottom:62px;width:auto}
      }
      @media print{.wiki-safety-dock{display:none!important}.wiki-cycle-map{box-shadow:none}.wiki-cycle-scroll{overflow:visible}.wiki-cycle-chart{min-width:0}.wiki-cycle-axis,.wiki-cycle-track{grid-template-columns:125px repeat(21,minmax(0,1fr))}.wiki-cycle-band{font-size:7pt;padding:3px}.wiki-cycle-day{font-size:6pt}}
    `;
    root.document.head.appendChild(s);
  }
  function replace00568MechanismDiagrams(){
    if(!is00568Page()) return;
    const cards=[...root.document.querySelectorAll('.wiki-drug')];
    for(const card of cards){
      const name=card.querySelector('h3')?.textContent?.trim();
      const old=card.querySelector('.wiki-diagram'); if(!old) continue;
      let svg='';
      if(name==='Pembrolizumab') svg=`<svg class="wiki-diagram" viewBox="0 0 300 140" role="img" aria-label="Simplified diagram showing pembrolizumab blocking the PD-1 immune brake between a T cell and a cancer cell"><g fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="64" cy="69" r="38" fill="#f3edf9" stroke="#663399" stroke-width="3"/><circle cx="64" cy="69" r="10" fill="#fff" stroke="#663399" stroke-width="3"/><path d="M101 69h24" stroke="#663399" stroke-width="3"/><path d="M125 58v22m0-11h12" stroke="#663399" stroke-width="3"/><path d="M138 69h18" stroke="#b8a6cf" stroke-width="3" stroke-dasharray="5 5"/><path d="M154 56v26m0-13h12" stroke="#a5548f" stroke-width="3"/><path d="M168 69h22" stroke="#b8a6cf" stroke-width="3" stroke-dasharray="5 5"/><circle cx="231" cy="69" r="39" fill="#f7eef4" stroke="#a5548f" stroke-width="3"/><circle cx="219" cy="58" r="6" fill="#fff" stroke="#a5548f" stroke-width="2"/><circle cx="242" cy="80" r="8" fill="#fff" stroke="#a5548f" stroke-width="2"/><path d="M142 30l10 13 10-13m-10 13v16" stroke="#663399" stroke-width="6"/><path d="M139 88l28-38" stroke="#d15f45" stroke-width="5"/></g><text x="64" y="124" text-anchor="middle" fill="#663399" class="diagram-label">T cell</text><text x="152" y="124" text-anchor="middle" fill="#663399" class="diagram-small">PD-1 brake blocked</text><text x="231" y="124" text-anchor="middle" fill="#8f3f78" class="diagram-label">Cancer cell</text></svg>`;
      if(name==='Pemetrexed') svg=`<svg class="wiki-diagram" viewBox="0 0 300 140" role="img" aria-label="Simplified diagram showing pemetrexed blocking folate-dependent building-block pathways needed to copy DNA"><g fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="#0b7a78" stroke-width="3"><polygon points="34,48 46,40 58,48 58,62 46,70 34,62" fill="#e7f5f3"/><polygon points="62,48 74,40 86,48 86,62 74,70 62,62" fill="#e7f5f3"/><polygon points="48,78 60,70 72,78 72,92 60,100 48,92" fill="#e7f5f3"/><path d="M92 70h42"/><path d="M125 61l9 9-9 9"/></g><circle cx="159" cy="70" r="24" fill="#eef7f6" stroke="#0b7a78" stroke-width="3"/><path d="M142 87l34-34" stroke="#d15f45" stroke-width="7"/><path d="M189 70h28" stroke="#9bb9b8" stroke-width="3" stroke-dasharray="5 5"/><g stroke="#0b7a78" stroke-width="3"><path d="M224 36c35 12 22 56 58 68M224 104c35-12 22-56 58-68"/><path d="M232 45v50m14-40v30m14-19v8m14-20v32"/></g></g><text x="59" y="121" text-anchor="middle" fill="#0b6665" class="diagram-small">Folate-dependent building blocks</text><text x="159" y="121" text-anchor="middle" fill="#a44336" class="diagram-small">Pemetrexed blocks pathway</text><text x="255" y="121" text-anchor="middle" fill="#0b6665" class="diagram-label">DNA copying</text></svg>`;
      if(name==='Carboplatin') svg=`<svg class="wiki-diagram" viewBox="0 0 300 140" role="img" aria-label="Simplified diagram showing platinum cross-links binding the two DNA strands and interfering with copying and repair"><g fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="#0b7a78" stroke-width="3"><path d="M24 38c94 18 116 45 252 64M24 102c94-18 116-45 252-64"/><path d="M43 43v54m24-48v42m24-35v28m24-20v12m24-12v12m24-4v4m24-9v18m24-29v34m24-43v48m24-54v58"/></g><g stroke="#a9600b" stroke-width="8"><path d="M124 55l0 30"/><path d="M171 56l0 29"/></g><circle cx="124" cy="70" r="12" fill="#fff7e9" stroke="#a9600b" stroke-width="3"/><circle cx="171" cy="70" r="12" fill="#fff7e9" stroke="#a9600b" stroke-width="3"/><text x="124" y="74" text-anchor="middle" fill="#8d520d" class="diagram-small">Pt</text><text x="171" y="74" text-anchor="middle" fill="#8d520d" class="diagram-small">Pt</text></g><text x="77" y="124" text-anchor="middle" fill="#0b6665" class="diagram-label">DNA strands</text><text x="148" y="124" text-anchor="middle" fill="#8d520d" class="diagram-small">Platinum cross-links</text><text x="238" y="124" text-anchor="middle" fill="#0b6665" class="diagram-small">Copying / repair disrupted</text></svg>`;
      if(svg) old.outerHTML=svg;
    }
  }
  function ensureCycleChronology(){
    if(!is00568Page()||root.document.getElementById('wikiCycleChronology')) return;
    const journey=root.document.querySelector('#journey .wiki-shell'); if(!journey) return;
    const warning=journey.querySelector('.wiki-note.warn');
    const host=root.document.createElement('div');host.id='wikiCycleChronology';host.className='wiki-cycle-map';
    const days=Array.from({length:21},(_,i)=>`<span class="wiki-cycle-day">${i+1}</span>`).join('');
    host.innerHTML=`<h3>Day 1 → Day 21: a general pattern</h3><p class="wiki-cycle-intro">This is a visual orientation, not a prediction of your personal cycle. It shows when some effects often emerge and which effects are <strong>not</strong> tied to a particular day.</p><div class="wiki-cycle-scroll" tabindex="0" role="region" aria-label="General 21-day treatment pattern"><div class="wiki-cycle-chart"><div class="wiki-cycle-axis"><span class="wiki-cycle-label">Day of cycle</span>${days}</div><div class="wiki-cycle-track"><span class="wiki-cycle-label">Treatment / infusion reaction</span><span class="wiki-cycle-band infusion" style="grid-column:2 / 3">Day 1</span></div><div class="wiki-cycle-track"><span class="wiki-cycle-label">Nausea / appetite</span><span class="wiki-cycle-band early" style="grid-column:2 / 7">Often early · may last longer</span></div><div class="wiki-cycle-track"><span class="wiki-cycle-label">Fatigue / mouth symptoms</span><span class="wiki-cycle-band variable" style="grid-column:3 / 16">Variable after treatment</span></div><div class="wiki-cycle-track"><span class="wiki-cycle-label">Blood counts / infection</span><span class="wiki-cycle-band variable" style="grid-column:8 / 23">Counts may fall · timing varies / can be later</span></div><div class="wiki-cycle-track"><span class="wiki-cycle-label">Diarrhoea / bowel symptoms</span><span class="wiki-cycle-band bowel" style="grid-column:2 / 23">No reliable safe window</span></div><div class="wiki-cycle-track"><span class="wiki-cycle-label">Numbness / tingling</span><span class="wiki-cycle-band cumulative" style="grid-column:2 / 23">More useful to think cumulative across cycles</span></div><div class="wiki-cycle-track"><span class="wiki-cycle-label">Immune-related effects</span><span class="wiki-cycle-band immune" style="grid-column:2 / 23">Any day</span></div></div></div><div class="wiki-cycle-key"><div><strong>Early effects:</strong> nausea and appetite change often cluster in the first days, although delayed symptoms can occur.</div><div><strong>Blood counts:</strong> they can fall between visits; the lowest point depends on the drugs, combination and person, so the calendar cannot tell you whether you are safe from infection.</div><div><strong>Diarrhoea:</strong> chemotherapy can upset the bowel, while pembrolizumab-related colitis is not confined to a particular day or cycle.</div><div><strong>Neuropathy:</strong> with platinum therapy, numbness/tingling is better thought of as a cumulative toxicity across cycles than as a predictable Day X event.</div></div><div class="wiki-cycle-evidence"><strong>Why these bands stay broad:</strong> carboplatin prescribing information describes a median blood-count nadir around Day 21 when used alone; pemetrexed dosing uses nadir blood counts from the prior cycle; PD-1 immune toxicities can occur at any time and after treatment has stopped. Combination therapy does not justify turning those observations into an exact personal timetable. <a href="https://www.accessdata.fda.gov/drugsatfda_docs/nda/2003/20-452.pdf_Paraplatin_Prntlbl.pdf" target="_blank" rel="noopener noreferrer">Carboplatin source ↗</a> · <a href="https://www.medicines.org.uk/emc/product/13373/smpc" target="_blank" rel="noopener noreferrer">Pemetrexed SmPC ↗</a> · <a href="https://www.accessdata.fda.gov/drugsatfda_docs/label/2025/761495s000lbl.pdf" target="_blank" rel="noopener noreferrer">PD-1 safety source ↗</a></div>`;
    if(warning) journey.insertBefore(host,warning); else journey.appendChild(host);
  }
  function ensureSafetyDock(){
    if(!is00568Page()||root.document.getElementById('wikiSafetyDock')) return;
    const dock=root.document.createElement('div');dock.id='wikiSafetyDock';dock.className='wiki-safety-dock';dock.setAttribute('aria-label','Quick patient safety links');
    dock.innerHTML=`<details><summary>☎ Urgent contacts</summary><div class="wiki-safety-panel"><strong>Oncology contact numbers</strong><a href="tel:+353871819645">087 181 9645<small>Acute Oncology Service · Mon–Fri 8am–5pm</small></a><a href="tel:+353214922000">021 4922000<small>Sat / Sun / Bank Holiday 9am–5pm · ask for medical oncology</small></a><a href="#urgent">Evenings / overnight<small>Use your instructed GP out-of-hours / ED pathway</small></a><a class="emergency" href="tel:112">112 / 999<small>Severe breathing difficulty, collapse, seizure or severe chest pain</small></a></div></details><a href="#urgent">⚠ When to call</a><a href="#tools">Patient tools</a>`;
    root.document.body.appendChild(dock);
    root.document.addEventListener('click',event=>{
      const details=dock.querySelector('details');
      if(details?.open&&!event.target.closest('#wikiSafetyDock')) details.removeAttribute('open');
    });
  }
  function enhance00568(){
    if(!is00568Page()) return;
    ensure00568Style();replace00568MechanismDiagrams();ensureCycleChronology();ensureSafetyDock();
  }

  root.SACTCheckHccConnectors=schedule;
  root.addEventListener?.("resize",schedule);
  root.addEventListener?.("beforeprint",update);
  root.document?.fonts?.ready?.then(schedule);
  if(root.document?.readyState==="loading") root.document.addEventListener("DOMContentLoaded",()=>{enhance00568();schedule();});
  else {enhance00568();schedule();}
})(typeof globalThis!=="undefined"?globalThis:this);
