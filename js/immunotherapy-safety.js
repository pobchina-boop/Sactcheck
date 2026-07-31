/**
 * SACTCheck Immunotherapy Visual Safety Panel.
 *
 * Original organ-system navigation layer for immune-checkpoint inhibitor
 * regimens. It does not add new clinical rules: status highlighting is derived
 * only from already-entered values and findings produced by the deterministic
 * assessment engine.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SACTCheckImmunotherapySafety = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "0.53.0";
  const ESMO_URL = "https://www.esmo.org/guidelines/esmo-clinical-practice-guideline-management-of-toxicities-from-immunotherapy";
  const SITC_URL = "https://www.sitcancer.org/research/cancer-immunotherapy-guidelines/irae/immune-checkpoint-inhibitor-related-adverse-events";
  const KNOWN_AGENTS = ["pembrolizumab", "nivolumab", "atezolizumab", "durvalumab", "avelumab", "ipilimumab", "cemiplimab", "dostarlimab", "relatlimab", "tislelizumab", "tremelimumab", "serplulimab"];
  const EMA = Object.freeze({
    pembrolizumab: ["Keytruda", "https://www.ema.europa.eu/en/medicines/human/EPAR/keytruda"],
    nivolumab: ["Opdivo", "https://www.ema.europa.eu/en/medicines/human/EPAR/opdivo"],
    atezolizumab: ["Tecentriq", "https://www.ema.europa.eu/en/medicines/human/EPAR/tecentriq"],
    durvalumab: ["Imfinzi", "https://www.ema.europa.eu/en/medicines/human/EPAR/imfinzi"],
    avelumab: ["Bavencio", "https://www.ema.europa.eu/en/medicines/human/EPAR/bavencio"],
    ipilimumab: ["Yervoy", "https://www.ema.europa.eu/en/medicines/human/EPAR/yervoy"],
    cemiplimab: ["Libtayo", "https://www.ema.europa.eu/en/medicines/human/EPAR/libtayo"],
    dostarlimab: ["Jemperli", "https://www.ema.europa.eu/en/medicines/human/EPAR/jemperli"],
    relatlimab: ["Opdualag", "https://www.ema.europa.eu/en/medicines/human/EPAR/opdualag"],
    tislelizumab: ["Tevimbra", "https://www.ema.europa.eu/en/medicines/human/EPAR/tevimbra"],
    tremelimumab: ["Imjudo", "https://www.ema.europa.eu/en/medicines/human/EPAR/imjudo"],
    serplulimab: ["Hetronifly", "https://www.ema.europa.eu/en/medicines/human/EPAR/hetronifly"]
  });

  const ICONS = Object.freeze({
    lung: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M23 9v14M25 23V9M22 20c-4-7-10-8-12-3-2 5-2 16 1 21 2 3 7 2 10-1 2-3 2-10 1-17Zm4 0c4-7 10-8 12-3 2 5 2 16-1 21-2 3-7 2-10-1-2-3-2-10-1-17Z"/></svg>',
    gi: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M15 9c-4 6-4 12 1 15 5 3 3 10 0 14M33 9c4 6 4 12-1 15-5 3-3 10 0 14M18 12c4-3 8-3 12 0M18 36c4 3 8 3 12 0M17 18c3 3 11 3 14 0M17 30c3-3 11-3 14 0"/></svg>',
    liver: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 18c8-8 21-9 32-2-1 9-6 16-16 18-8 2-13-3-16-8Zm18-2c1 6 5 9 12 9"/></svg>',
    endocrine: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 10c-4 0-7 4-7 9 0 4 2 7 7 9 5-2 7-5 7-9 0-5-3-9-7-9Zm0 18v10M18 35h12M14 14l5 4M34 14l-5 4"/></svg>',
    renal: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M17 10c-7 1-10 9-7 17 2 6 7 10 12 7 3-2 2-7 2-11 0-7-1-14-7-13Zm14 0c7 1 10 9 7 17-2 6-7 10-12 7-3-2-2-7-2-11 0-7 1-14 7-13Z"/></svg>',
    skin: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 14h32M8 24h32M8 34h32M13 10v8M24 20v8M35 30v8"/></svg>',
    neuro: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 9c-8-4-16 3-13 11-5 4-2 12 4 12 1 7 10 8 13 2 6 2 11-4 8-9 5-5 1-13-5-13-1-3-4-4-7-3Zm0 0v27M16 17c4 0 6 2 8 5M32 16c-4 1-6 3-8 6M16 29c4 0 6-2 8-5M32 30c-4-1-6-3-8-6"/></svg>',
    cardiac: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 39S8 30 8 18c0-7 9-11 16-3 7-8 16-4 16 3 0 12-16 21-16 21Z"/><path d="m12 25 7-1 3-7 4 13 3-6 7 1"/></svg>',
    infusion: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M17 8h14v22H17zM20 12h8M24 30v8M19 38h10M31 18h5v9c0 4-2 7-6 7"/></svg>'
  });

  const DOMAINS = Object.freeze([
    { id: "lung", label: "Lung", icon: ICONS.lung, prompt: "New cough, dyspnoea, hypoxia or chest symptoms", checks: ["Oxygen saturation", "Chest imaging if suspected", "Exclude infection and other causes"], patterns: ["pneumon", "interstitial lung", "dyspno", "cough", "oxygen"] },
    { id: "gi", label: "Bowel", icon: ICONS.gi, prompt: "Diarrhoea, abdominal pain, blood or mucus", checks: ["Stool frequency and hydration", "Electrolytes if clinically indicated", "Exclude infection"], patterns: ["colitis", "diarrh", "bowel", "stool", "abdominal"] },
    { id: "liver", label: "Liver", icon: ICONS.liver, prompt: "Often asymptomatic; ask about jaundice, pain or malaise", checks: ["ALT", "AST", "Bilirubin"], patterns: ["hepatitis", "bilirubin", "\\balt\\b", "\\bast\\b", "transamin", "liver"] },
    { id: "endocrine", label: "Endocrine", icon: ICONS.endocrine, prompt: "Fatigue, headache, dizziness, weight or thirst change", checks: ["TSH and free T4", "Cortisol ± ACTH if indicated", "Glucose ± ketones"], patterns: ["endocr", "thyroid", "tsh", "free t4", "cortisol", "acth", "adrenal", "hypophys", "diabetes", "glucose", "ketone"] },
    { id: "renal", label: "Kidney", icon: ICONS.renal, prompt: "Creatinine rise, reduced urine or urinary symptoms", checks: ["Creatinine and eGFR", "Urinalysis if clinically indicated", "Exclude dehydration and other causes"], patterns: ["nephritis", "creatinine", "egfr", "renal", "kidney", "urine"] },
    { id: "skin", label: "Skin", icon: ICONS.skin, prompt: "Rash, pruritus, blistering or mucosal lesions", checks: ["Extent and body surface area", "Mucosal involvement", "Features of severe cutaneous reaction"], patterns: ["rash", "skin", "dermat", "prurit", "cutaneous", "sjs", "ten", "blister"] },
    { id: "neuro", label: "Neurological", icon: ICONS.neuro, prompt: "Weakness, sensory change, confusion, ptosis or dysphagia", checks: ["Focused neurological examination", "Urgent senior review for new deficit", "Specialist tests as indicated"], patterns: ["neuro", "encephal", "mening", "myasthen", "guillain", "weakness", "confusion", "ptosis"] },
    { id: "cardiac", label: "Cardiac / muscle", icon: ICONS.cardiac, prompt: "Chest pain, palpitations, dyspnoea or proximal weakness", checks: ["Troponin and ECG if suspected", "CK if myositis suspected", "Urgent cardiac assessment when indicated"], patterns: ["myocard", "cardiac", "troponin", "myositis", "polymyos", "\\bck\\b", "muscle"] },
    { id: "infusion", label: "Infusion / systemic", icon: ICONS.infusion, prompt: "Fever, rigors, hypotension, flushing, wheeze or acute reaction", checks: ["Observations during infusion", "Reaction grade", "Infection and systemic assessment"], patterns: ["infusion", "infusion-related", "hypersens", "anaphyl", "rigor", "hypotension", "wheeze"] }
  ]);

  let activeProtocol = null;
  let activeDefinitions = [];
  let activeInputs = {};
  let activeResult = null;
  let activeDomain = "lung";
  let panelOpen = false;

  function asArray(value) { return Array.isArray(value) ? value : (value == null ? [] : [value]); }
  function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
  function protocolText(protocol) {
    const m = protocol?.metadata || {};
    return [m.title, m.short_title, m.catalogue_section, m.assessment_model, ...asArray(m.treatment_class), ...asArray(m.drugs), ...asArray(m.common_trade_names)].filter(Boolean).join(" ").toLowerCase();
  }
  function definitionText(definition) { return [definition?.id, definition?.label, definition?.ctcae_category, definition?.assessment_guidance, definition?.help].filter(Boolean).join(" ").toLowerCase(); }
  function agentsForProtocol(protocol) { const text = protocolText(protocol); return KNOWN_AGENTS.filter(agent => text.includes(agent)); }
  function supports(protocol, definitions = []) {
    const text = protocolText(protocol);
    if (agentsForProtocol(protocol).length) return true;
    if (/\bimmunotherapy\b|single_agent_ici|checkpoint inhibitor|combined_ici|ici_plus/.test(text)) return true;
    return false;
  }
  function matches(domain, text) { return domain.patterns.some(pattern => new RegExp(pattern, "i").test(text)); }
  function linkedDefinitions(domain, definitions = []) { return definitions.filter(definition => matches(domain, definitionText(definition))); }
  function findingText(finding) { return [finding?.ruleId, finding?.displayTitle, finding?.explanation, finding?.actionType, finding?.action?.recommendation, finding?.sourceText, ...(finding?.conditionFields || [])].filter(Boolean).join(" ").toLowerCase(); }
  function linkedFindings(domain, result) { return asArray(result?.findings).filter(finding => matches(domain, findingText(finding))); }
  function actionLevel(actionType) {
    const action = String(actionType || "").toLowerCase();
    if (["permanently_discontinue", "contraindicated", "discontinue", "cease"].includes(action)) return 3;
    if (["withhold", "delay", "omit", "consultant_review", "withhold_then_reduce", "delay_then_dose_reduce"].includes(action) || action.includes("dose_reduce")) return 2;
    return 0;
  }
  function hasValue(value) { return value !== undefined && value !== null && value !== ""; }
  function domainStatus(domain, definitions, inputs, result) {
    const fields = linkedDefinitions(domain, definitions);
    const findings = linkedFindings(domain, result);
    const level = findings.reduce((max, finding) => Math.max(max, actionLevel(finding.actionType)), 0);
    const entered = fields.some(field => hasValue(inputs?.[field.id]));
    if (level >= 3) return { level: "critical", label: "Urgent / stop pathway", findings, fields, entered };
    if (level === 2) return { level: "review", label: "Review / withhold pathway", findings, fields, entered };
    if (entered) return { level: "entered", label: "Data entered", findings, fields, entered };
    return { level: "unassessed", label: "No data entered", findings, fields, entered };
  }
  function sourcesForProtocol(protocol) {
    const m = protocol?.metadata || {};
    const sources = [];
    if (m.source_url) sources.push({ label: `Official NCCP protocol${m.nccp_version ? ` · v${m.nccp_version}` : ""}`, url: m.source_url, sameTab: true });
    sources.push({ label: "ESMO immunotherapy toxicity guideline", url: ESMO_URL });
    sources.push({ label: "SITC immune-related adverse-event guideline", url: SITC_URL });
    agentsForProtocol(protocol).forEach(agent => { if (EMA[agent]) sources.push({ label: `${EMA[agent][0]} EMA product information`, url: EMA[agent][1] }); });
    return sources;
  }
  function buildModel(protocol, definitions = [], inputs = {}, result = null) {
    const domains = DOMAINS.map(domain => ({ ...domain, status: domainStatus(domain, definitions, inputs, result) }));
    const priority = domains.find(item => item.status.level === "critical") || domains.find(item => item.status.level === "review") || domains.find(item => item.status.entered) || domains[0];
    return { supported: supports(protocol, definitions), agents: agentsForProtocol(protocol), domains, activeDomain: priority?.id || "lung", sources: sourcesForProtocol(protocol), protocolTitle: protocol?.metadata?.title || protocol?.metadata?.short_title || "Immunotherapy regimen" };
  }
  function currentModel() { return buildModel(activeProtocol, activeDefinitions, activeInputs, activeResult); }
  function statusClass(level) { return `immune-status-${level}`; }
  function statusSummary(model) {
    const critical = model.domains.filter(item => item.status.level === "critical").length;
    const review = model.domains.filter(item => item.status.level === "review").length;
    if (critical) return `<div class="immune-safety-alert critical"><strong>${critical} organ-system urgent or discontinuation pathway${critical === 1 ? "" : "s"} triggered.</strong><span>Review the encoded findings and current NCCP protocol immediately.</span></div>`;
    if (review) return `<div class="immune-safety-alert review"><strong>${review} organ-system review or withholding pathway${review === 1 ? "" : "s"} triggered.</strong><span>Open the relevant tile and review the encoded action.</span></div>`;
    return `<div class="immune-safety-alert neutral"><strong>Visual monitoring map</strong><span>Blank domains remain unassessed. A coloured tile reflects entered data or an encoded assessment finding, not treatment clearance.</span></div>`;
  }
  function renderDetail(domain) {
    const status = domain.status;
    const inputs = status.fields.length ? status.fields.map(field => `<span class="immune-input-chip">${escapeHtml(field.label || field.id)}</span>`).join("") : '<span class="subtle">No structured input for this domain in the selected regimen.</span>';
    const findings = status.findings.length ? status.findings.map(finding => `<div class="immune-finding ${statusClass(actionLevel(finding.actionType) >= 3 ? "critical" : "review")}"><strong>${escapeHtml(finding.displayTitle || finding.ruleId || domain.label)}</strong><span>${escapeHtml(finding.action?.recommendation || finding.explanation || "Review the encoded protocol pathway.")}</span>${finding.sourceText ? `<small>${escapeHtml(finding.sourceText)}</small>` : ""}</div>`).join("") : '<p class="subtle">No restrictive encoded finding is currently triggered for this organ system.</p>';
    const focus = status.fields[0]?.id ? `<button type="button" class="btn secondary immune-focus-input" data-field-id="${escapeHtml(status.fields[0].id)}">Go to relevant input</button>` : "";
    return `<div class="immune-detail-grid"><div><h3>Ask and examine</h3><p>${escapeHtml(domain.prompt)}</p><h3>Common linked checks</h3><ul>${domain.checks.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div><div><h3>Inputs available in this regimen</h3><div class="immune-input-chips">${inputs}</div>${focus}</div><div class="immune-findings-column"><h3>Current encoded pathway</h3>${findings}</div></div>`;
  }
  function render() {
    const panel = typeof document !== "undefined" ? document.getElementById("jsonImmuneSafetyPanel") : null;
    if (!panel || !activeProtocol) return;
    const model = currentModel();
    if (!model.supported) { panel.classList.add("hidden"); return; }
    if (!model.domains.some(item => item.id === activeDomain)) activeDomain = model.activeDomain;
    const selected = model.domains.find(item => item.id === activeDomain) || model.domains[0];
    panel.innerHTML = `<div class="immune-safety-head"><div><span class="immune-eyebrow">Immune checkpoint inhibitor safety</span><h2>Immune-mediated toxicity map</h2><p>${escapeHtml(model.protocolTitle)}${model.agents.length ? ` · ${escapeHtml(model.agents.join(" + "))}` : ""}</p></div><button type="button" class="btn secondary immune-close">Close</button></div>${statusSummary(model)}<div class="immune-legend"><span><i class="immune-dot unassessed"></i>No data</span><span><i class="immune-dot entered"></i>Data entered</span><span><i class="immune-dot review"></i>Review / withhold</span><span><i class="immune-dot critical"></i>Urgent / stop</span></div><div class="immune-organ-grid">${model.domains.map(domain => `<button type="button" class="immune-organ-tile ${statusClass(domain.status.level)}${domain.id === selected.id ? " active" : ""}" data-domain="${domain.id}"><span class="immune-organ-icon">${domain.icon}</span><span class="immune-organ-copy"><strong>${escapeHtml(domain.label)}</strong><small>${escapeHtml(domain.status.label)}</small></span></button>`).join("")}</div><section class="immune-domain-detail"><div class="immune-domain-title"><span class="immune-organ-icon large">${selected.icon}</span><div><h2>${escapeHtml(selected.label)}</h2><p>${escapeHtml(selected.prompt)}</p></div></div>${renderDetail(selected)}</section><details class="immune-source-details"><summary>Official sources and scope</summary><div class="details-body"><p>This original visual panel is a navigation aid. It does not add new management rules; treatment actions come from the current encoded NCCP regimen and must be checked against local immune-toxicity pathways.</p><div class="immune-source-links">${model.sources.map(source => `<a href="${escapeHtml(source.url)}"${source.sameTab ? "" : ' target="_blank" rel="noopener noreferrer"'}>${escapeHtml(source.label)}</a>`).join("")}</div></div></details>`;
    bindPanel(panel);
  }
  function bindPanel(panel) {
    if (panel.dataset.immuneBound === "true") return;
    panel.dataset.immuneBound = "true";
    panel.addEventListener("click", event => {
      const tile = event.target.closest("[data-domain]");
      if (tile) { activeDomain = tile.dataset.domain; render(); return; }
      if (event.target.closest(".immune-close")) { close(); return; }
      const focus = event.target.closest(".immune-focus-input");
      if (focus) focusField(focus.dataset.fieldId);
    });
  }
  function focusField(fieldId) {
    if (typeof document === "undefined" || !fieldId) return;
    const escaped = root.CSS?.escape ? root.CSS.escape(fieldId) : fieldId.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
    const control = document.querySelector(`[data-field="${escaped}"], [data-lab-target="${escaped}"]`);
    const wrapper = control?.closest("[data-input-wrapper]") || control;
    wrapper?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    control?.focus?.();
  }
  function prepare(protocol, definitions = [], inputs = {}) {
    activeProtocol = protocol; activeDefinitions = definitions; activeInputs = inputs || {}; activeResult = null;
    const button = typeof document !== "undefined" ? document.getElementById("jsonImmuneSafetyButton") : null;
    const supported = supports(protocol, definitions);
    button?.classList.toggle("hidden", !supported);
    if (!supported) close();
    else if (panelOpen) render();
    return supported;
  }
  function open(protocol = activeProtocol) {
    if (protocol) activeProtocol = protocol;
    if (!supports(activeProtocol, activeDefinitions)) return false;
    panelOpen = true;
    activeDomain = currentModel().activeDomain;
    const panel = typeof document !== "undefined" ? document.getElementById("jsonImmuneSafetyPanel") : null;
    panel?.classList.remove("hidden");
    render();
    panel?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    return true;
  }
  function close() { panelOpen = false; const panel = typeof document !== "undefined" ? document.getElementById("jsonImmuneSafetyPanel") : null; panel?.classList.add("hidden"); }
  function updateInputs(protocol, definitions = [], inputs = {}) { activeProtocol = protocol || activeProtocol; activeDefinitions = definitions; activeInputs = inputs || {}; if (panelOpen) render(); }
  function updateAssessment(result, inputs = activeInputs) { activeResult = result || null; activeInputs = inputs || {}; if (panelOpen) { const model = currentModel(); const priority = model.domains.find(item => item.status.level === "critical") || model.domains.find(item => item.status.level === "review"); if (priority) activeDomain = priority.id; render(); } }

  return Object.freeze({ version: VERSION, domains: DOMAINS, supports, agentsForProtocol, linkedDefinitions, linkedFindings, domainStatus, buildModel, sourcesForProtocol, prepare, open, close, updateInputs, updateAssessment });
});
