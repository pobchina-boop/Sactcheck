/**
 * Browser interface for Modified FOLFOX-6 JSON shadow validation.
 * The existing legacy FOLFOX assessment remains unchanged and active.
 */
(function (root) {
  "use strict";

  const Core = root.SACTCheckFolfoxShadowCore;
  if (!Core) throw new Error("folfox-shadow-core.js must load before folfox-shadow-ui.js.");

  const PROTOCOL_ID = "nccp-00209-v10a";
  let protocol = null;
  let results = [];
  let selectedResult = null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getProtocol() {
    return root.SACTCheckProtocolLoader?.getProtocolById(PROTOCOL_ID) ||
      root.SACTCHECK_PROTOCOLS?.find(item => item.protocol?.protocol_id === PROTOCOL_ID)?.protocol ||
      null;
  }

  function ensureStyles() {
    if (document.getElementById("folfoxShadowStyles")) return;
    const style = document.createElement("style");
    style.id = "folfoxShadowStyles";
    style.textContent = `
      .shadow-table-wrap{overflow-x:auto;border:1px solid #d7dee8;border-radius:10px;background:#fff}
      .shadow-table{width:100%;border-collapse:collapse;min-width:900px}
      .shadow-table th,.shadow-table td{padding:10px;border-bottom:1px solid #e5e9ef;text-align:left;vertical-align:top}
      .shadow-table th{background:#f4f7fb;font-size:.9rem}
      .shadow-table tr:last-child td{border-bottom:0}
      .shadow-match{font-weight:700;color:#146c43}
      .shadow-diff{font-weight:700;color:#b02a37}
      .shadow-component-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}
      .shadow-panel{border:1px solid #d7dee8;border-radius:10px;padding:14px;background:#fff}
      .shadow-panel h3{margin-top:0}
      .shadow-list{margin:.5rem 0 0 1.2rem}
      .shadow-controls{display:grid;grid-template-columns:minmax(260px,1fr) auto auto;gap:10px;align-items:end}
      @media(max-width:760px){.shadow-controls,.shadow-component-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function ensureButton() {
    protocol = getProtocol();
    if (!protocol || document.getElementById("openFolfoxShadow")) return;
    const legacyButton = document.getElementById("openFolfox");
    const card = legacyButton?.closest(".regimen-card");
    const actions = card?.querySelector(".card-actions");
    if (!actions) return;

    const validationRow = card.querySelector(".validation-row");
    if (validationRow && !card.querySelector(".folfox-shadow-badge")) {
      const badge = document.createElement("span");
      badge.className = "badge review folfox-shadow-badge";
      badge.textContent = "JSON shadow validation";
      validationRow.appendChild(badge);
    }

    const button = document.createElement("button");
    button.id = "openFolfoxShadow";
    button.type = "button";
    button.className = "btn secondary";
    button.textContent = "Run JSON shadow comparison";
    button.addEventListener("click", open);
    actions.appendChild(button);
  }

  function ensureScreen() {
    ensureStyles();
    if (document.getElementById("folfoxShadowScreen")) return;
    const main = document.querySelector("main");
    if (!main) throw new Error("Could not find the main application area.");

    const screen = document.createElement("div");
    screen.id = "folfoxShadowScreen";
    screen.className = "screen";
    screen.innerHTML = `
      <div class="toolbar spread">
        <a href="#libraryScreen" class="btn secondary" id="folfoxShadowBack" role="button">← Regimen library</a>
        <span class="badge review">Shadow validator v${escapeHtml(Core.version)}</span>
      </div>

      <section>
        <h1>Modified FOLFOX-6 — JSON shadow validation</h1>
        <p>This screen sends identical predefined cases to the existing hard-coded FOLFOX engine and the new NCCP 00209 JSON rule set. It does not replace the active assessment.</p>
        <div class="notice" style="margin:12px 0">
          <strong>Validation stage only.</strong> A match means the normalised overall action and component recommendations agree for that test case. Consultant and oncology-pharmacy source review are still required before migration.
        </div>
        <div class="protocol-grid">
          <div class="protocol-item"><span>NCCP regimen</span><strong>00209 / Version 10a</strong></div>
          <div class="protocol-item"><span>JSON rules encoded</span><strong id="folfoxShadowRuleCount">—</strong></div>
          <div class="protocol-item"><span>Legacy engine</span><strong>FolfoxEngine</strong></div>
          <div class="protocol-item"><span>Migration status</span><strong>Shadow validation</strong></div>
        </div>
        <p><a class="btn secondary" href="https://healthservice.hse.ie/documents/6549/209_v10a_FOLFOX_6_Modified.pdf" target="_blank" rel="noopener">Open current NCCP source</a></p>
      </section>

      <section>
        <div class="shadow-controls">
          <div>
            <label for="folfoxShadowScenario">Validation scenario</label>
            <select id="folfoxShadowScenario"></select>
          </div>
          <button class="btn" type="button" id="folfoxShadowRunOne">Run selected</button>
          <button class="btn secondary" type="button" id="folfoxShadowRunAll">Run all scenarios</button>
        </div>
      </section>

      <section>
        <div class="metrics">
          <div class="metric"><span>Scenarios</span><strong id="folfoxShadowTotal">0</strong></div>
          <div class="metric"><span>Exact matches</span><strong id="folfoxShadowMatches">0</strong></div>
          <div class="metric"><span>Differences</span><strong id="folfoxShadowDifferences">0</strong></div>
          <div class="metric"><span>Validation result</span><strong id="folfoxShadowOverall">Not run</strong></div>
        </div>
      </section>

      <section>
        <h2>Comparison results</h2>
        <div class="shadow-table-wrap">
          <table class="shadow-table">
            <thead><tr><th>Scenario</th><th>Legacy action</th><th>JSON action</th><th>Component comparison</th><th>Result</th><th></th></tr></thead>
            <tbody id="folfoxShadowRows"><tr><td colspan="6">Run a scenario to begin.</td></tr></tbody>
          </table>
        </div>
      </section>

      <section id="folfoxShadowDetail" class="hidden">
        <h2 id="folfoxShadowDetailTitle">Selected comparison</h2>
        <div id="folfoxShadowDetailBody"></div>
      </section>`;

    main.appendChild(screen);
    document.getElementById("folfoxShadowBack").addEventListener("click", event => {
      event.preventDefault();
      showScreen("libraryScreen");
    });
    document.getElementById("folfoxShadowRunOne").addEventListener("click", runSelected);
    document.getElementById("folfoxShadowRunAll").addEventListener("click", runAll);
  }

  function showScreen(id) {
    if (typeof root.showScreen === "function") {
      root.showScreen(id);
    } else {
      document.querySelectorAll(".screen").forEach(item => item.classList.remove("active"));
      document.getElementById(id)?.classList.add("active");
      window.scrollTo(0, 0);
    }
  }

  function open() {
    protocol = getProtocol();
    if (!protocol) {
      alert("The NCCP 00209 JSON protocol could not be loaded.");
      return;
    }
    if (!root.FolfoxEngine) {
      alert("The existing FolfoxEngine could not be found.");
      return;
    }
    ensureScreen();
    document.getElementById("folfoxShadowRuleCount").textContent = String(protocol.rule_engine?.rules?.length || 0);
    document.getElementById("folfoxShadowScenario").innerHTML = Core.SCENARIOS
      .map(item => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.label)}</option>`)
      .join("");
    showScreen("folfoxShadowScreen");
    history.replaceState(null, "", "#folfoxShadowScreen");
    runAll();
  }

  function runSelected() {
    const id = document.getElementById("folfoxShadowScenario").value;
    const result = Core.runScenario(protocol, root.FolfoxEngine, id);
    const index = results.findIndex(item => item.scenario.scenarioId === id);
    if (index >= 0) results[index] = result;
    else results.push(result);
    selectedResult = result;
    renderResults();
    renderDetail(result);
  }

  function runAll() {
    results = Core.runAll(protocol, root.FolfoxEngine);
    selectedResult = results[0] || null;
    renderResults();
    if (selectedResult) renderDetail(selectedResult);
  }

  function componentSummary(result) {
    const components = result.components;
    return [
      `Ox: ${components.oxaliplatin.suggestedDose}${components.oxaliplatin.infusionHours ? ` / ${components.oxaliplatin.infusionHours} h` : ""}`,
      `FA: ${components.folinicAcid.suggestedDose}`,
      `Bolus: ${components.bolus5fu.suggestedDose}`,
      `Infusion: ${components.infusion5fu.suggestedDose}`
    ].join("; ");
  }

  function renderResults() {
    const matches = results.filter(item => item.comparison.match).length;
    document.getElementById("folfoxShadowTotal").textContent = String(results.length);
    document.getElementById("folfoxShadowMatches").textContent = String(matches);
    document.getElementById("folfoxShadowDifferences").textContent = String(results.length - matches);
    document.getElementById("folfoxShadowOverall").textContent = results.length && matches === results.length ? "All matched" : "Review differences";

    document.getElementById("folfoxShadowRows").innerHTML = results.map(item => `
      <tr>
        <td>${escapeHtml(item.scenario.scenarioLabel || item.scenario.scenarioId)}</td>
        <td>${escapeHtml(item.legacy.status)}</td>
        <td>${escapeHtml(item.json.status)}</td>
        <td>${escapeHtml(componentSummary(item.json))}</td>
        <td class="${item.comparison.match ? "shadow-match" : "shadow-diff"}">${item.comparison.match ? "MATCH" : "DIFFERENCE"}</td>
        <td><button class="btn secondary folfox-shadow-detail-button" type="button" data-scenario="${escapeHtml(item.scenario.scenarioId)}">Details</button></td>
      </tr>`).join("");

    document.querySelectorAll(".folfox-shadow-detail-button").forEach(button => {
      button.addEventListener("click", () => {
        const result = results.find(item => item.scenario.scenarioId === button.dataset.scenario);
        if (result) {
          selectedResult = result;
          document.getElementById("folfoxShadowScenario").value = result.scenario.scenarioId;
          renderDetail(result);
        }
      });
    });
  }

  function renderComponentTable(legacy, json) {
    const rows = [
      ["Oxaliplatin", legacy.components.oxaliplatin.suggestedDose, json.components.oxaliplatin.suggestedDose],
      ["Oxaliplatin infusion", legacy.components.oxaliplatin.infusionHours ? `${legacy.components.oxaliplatin.infusionHours} hours` : "Standard", json.components.oxaliplatin.infusionHours ? `${json.components.oxaliplatin.infusionHours} hours` : "Standard"],
      ["Folinic acid", legacy.components.folinicAcid.suggestedDose, json.components.folinicAcid.suggestedDose],
      ["Bolus 5-FU", legacy.components.bolus5fu.suggestedDose, json.components.bolus5fu.suggestedDose],
      ["Infusional 5-FU", legacy.components.infusion5fu.suggestedDose, json.components.infusion5fu.suggestedDose]
    ];
    return `<table class="shadow-table"><thead><tr><th>Component</th><th>Legacy</th><th>JSON</th></tr></thead><tbody>${rows.map(row => `<tr><td>${escapeHtml(row[0])}</td><td>${escapeHtml(row[1])}</td><td>${escapeHtml(row[2])}</td></tr>`).join("")}</tbody></table>`;
  }

  function renderDetail(result) {
    const detail = document.getElementById("folfoxShadowDetail");
    detail.classList.remove("hidden");
    document.getElementById("folfoxShadowDetailTitle").textContent = result.scenario.scenarioLabel || result.scenario.scenarioId;
    document.getElementById("folfoxShadowDetailBody").innerHTML = `
      <div class="status ${result.comparison.match ? "good" : "bad"}">
        <h2>${result.comparison.match ? "Exact normalised match" : "Difference requires review"}</h2>
        <p>Legacy: ${escapeHtml(result.legacy.status)} · JSON: ${escapeHtml(result.json.status)}</p>
      </div>
      ${result.comparison.differences.length ? `<div class="error-list">${result.comparison.differences.map(escapeHtml).join("<br>")}</div>` : ""}
      <div class="shadow-table-wrap">${renderComponentTable(result.legacy, result.json)}</div>
      <div class="shadow-component-grid">
        <div class="shadow-panel"><h3>Legacy findings</h3><ul class="shadow-list">${result.legacy.triggered.length ? result.legacy.triggered.map(item => `<li>${escapeHtml(item)}</li>`).join("") : "<li>No modification rule triggered.</li>"}</ul></div>
        <div class="shadow-panel"><h3>JSON rules triggered</h3><ul class="shadow-list">${result.json.triggered.length ? result.json.triggered.map(item => `<li>${escapeHtml(item)}</li>`).join("") : "<li>No modification rule triggered.</li>"}</ul></div>
      </div>`;
    detail.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function initialise() {
    ensureButton();
  }

  root.addEventListener("sactcheck:protocols-loaded", initialise);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialise);
  else initialise();

  root.SACTCheckFolfoxShadowUI = Object.freeze({ open, runAll, runSelected });
})(window);
