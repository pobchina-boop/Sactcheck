/**
 * SACTCheck Protocol Dose & Schedule viewer.
 *
 * Presents protocol-derived regimen structure inside the opened assessment
 * engine. It deliberately does not calculate patient-specific doses.
 */
(function (root) {
  "use strict";

  const VERSION = "0.52.0";
  let activeProtocol = null;
  let activeModel = null;
  let selectedPhaseIndex = 0;
  let selectedDay = "all";
  let selectedComponent = "all";
  const selectedDoseLevels = new Map();

  function asArray(value) {
    return Array.isArray(value) ? value : (value == null ? [] : [value]);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function humanise(value) {
    return String(value ?? "")
      .replaceAll("_", " ")
      .replace(/\b\w/g, letter => letter.toUpperCase())
      .replace(/\b5fu\b/i, "5-FU")
      .replace(/\bsc\b/i, "SC")
      .replace(/\biv\b/i, "IV")
      .replace(/\bpo\b/i, "PO");
  }

  function componentKey(value) {
    return String(value || "component").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  }

  function normaliseDrug(value) {
    const text = humanise(value || "Component");
    return text
      .replace(/Fluorouracil Infusion/i, "Infusional 5-FU")
      .replace(/Fluorouracil Bolus/i, "Bolus 5-FU")
      .replace(/Bolus 5-FU/i, "Bolus 5-FU")
      .replace(/Infusional 5-FU/i, "Infusional 5-FU")
      .replace(/Folinic Acid/i, "Folinic acid")
      .replace(/Prednisone\/Prednisolone/i, "Prednisone / prednisolone");
  }

  function formatDoseObject(dose) {
    if (dose == null || dose === "") return "Not structured";
    if (typeof dose === "string" || typeof dose === "number") return String(dose);
    if (typeof dose !== "object") return String(dose);

    const value = dose.value ?? dose.dose ?? dose.amount;
    const unit = dose.unit ?? dose.units ?? "";
    const pieces = [];
    if (value != null) pieces.push(String(value));
    if (unit) pieces.push(String(unit).replace("mg/m2", "mg/m²"));
    if (dose.frequency) pieces.push(humanise(dose.frequency));
    if (dose.duration) pieces.push(String(dose.duration));
    return pieces.join(" ") || Object.entries(dose)
      .filter(([, item]) => ["string", "number"].includes(typeof item))
      .map(([key, item]) => `${humanise(key)}: ${item}`)
      .join(" · ") || "Protocol dose";
  }

  function formatStartingDose(treatment) {
    if (!treatment || typeof treatment !== "object") return "Not structured";
    if (treatment.starting_dose_mg_m2 != null) return `${treatment.starting_dose_mg_m2} mg/m²`;
    if (treatment.starting_dose != null) {
      const dose = treatment.starting_dose;
      if (typeof dose !== "object") return String(dose);
      if (dose.dose_per_administration_mg != null) {
        const frequency = dose.frequency ? ` ${humanise(dose.frequency).toLowerCase()}` : "";
        return `${dose.dose_per_administration_mg} mg${frequency}`;
      }
      return formatDoseObject(dose);
    }
    return "Not structured";
  }

  function normaliseDays(item) {
    if (!item || typeof item !== "object") return [];
    const raw = item.days ?? item.day ?? item.cycle_day ?? item.treatment_days;
    if (Array.isArray(raw)) return raw.map(value => String(value));
    if (raw != null && raw !== "") return [String(raw)];
    const cycle = String(item.cycle || "").toLowerCase();
    if (cycle === "continuous") return ["Continuous"];
    const schedule = String(item.schedule || "");
    const matches = schedule.match(/days?\s+([0-9,–\- and]+)/i);
    if (matches) return [matches[1].trim()];
    return [];
  }

  function formatDays(days) {
    if (!days?.length) return "See schedule";
    if (days.length === 1 && /continuous/i.test(days[0])) return "Continuous";
    return days.map(day => /^\d+$/.test(day) ? `Day ${day}` : day).join(", ");
  }

  function phaseLabel(phase, index) {
    if (phase.label) return phase.label;
    if (phase.phase_id) return humanise(phase.phase_id);
    return `Phase ${index + 1}`;
  }

  function componentFromAdministration(item, index) {
    return {
      id: componentKey(item.drug || item.component || item.name || `component_${index + 1}`),
      drug: normaliseDrug(item.drug || item.component || item.name || `Component ${index + 1}`),
      dose: formatDoseObject(item.dose ?? item.starting_dose ?? item.dose_text),
      route: item.route ? String(item.route) : "Not structured",
      days: normaliseDays(item),
      order: item.order ?? index + 1,
      note: item.note || item.notes || item.schedule || item.role || ""
    };
  }

  function phaseFromTreatmentPhase(phase, index) {
    const components = asArray(phase.administration).map(componentFromAdministration);
    return {
      id: phase.phase_id || `phase_${index + 1}`,
      label: phaseLabel(phase, index),
      cycleLength: phase.cycle_length_days ?? phase.cycle_days ?? null,
      cycles: phase.cycles ?? phase.planned_cycles ?? null,
      duration: phase.duration_text || phase.duration || "",
      summary: phase.schedule_summary || "",
      components
    };
  }

  function phaseFromTreatment(protocol) {
    const treatment = protocol.treatment || {};
    let components = [];

    if (Array.isArray(treatment.components)) {
      components = treatment.components.map(componentFromAdministration);
    } else if (Array.isArray(treatment.administration)) {
      components = treatment.administration.map(componentFromAdministration);
    } else if (treatment.drug) {
      components = [componentFromAdministration({
        drug: treatment.drug,
        dose: formatStartingDose(treatment),
        route: treatment.route || treatment.starting_dose?.route,
        days: treatment.days,
        cycle: treatment.starting_dose?.cycle,
        note: asArray(treatment.administration_instructions).join(" ")
      }, 0)];
    } else if (Array.isArray(treatment.drugs)) {
      components = treatment.drugs.map((drug, index) => componentFromAdministration({ drug }, index));
    }

    const cycle = treatment.cycle || {};
    const cycleLength = treatment.cycle_length_days ?? treatment.cycle_days ?? cycle.length_days ?? null;
    const cycles = treatment.planned_cycles ?? treatment.maximum_cycles ?? cycle.planned_cycles ?? null;
    const duration = treatment.duration_text || treatment.duration || (treatment.duration_type ? humanise(treatment.duration_type) : "");
    const summary = treatment.schedule_summary || (typeof treatment.cycle === "string" ? treatment.cycle : "");

    if (!components.length && !cycleLength && !summary && !duration) return null;
    return {
      id: "standard_schedule",
      label: "Standard schedule",
      cycleLength,
      cycles,
      duration,
      summary,
      components,
      generalDoseReductions: asArray(treatment.dose_reductions),
      additionalRequirement: treatment.additional_requirement || ""
    };
  }

  function inferDoseUnit(phases, component) {
    const key = componentKey(component);
    const match = phases.flatMap(phase => phase.components).find(item => item.id === key);
    const dose = String(match?.dose || "");
    const unitMatch = dose.match(/(?:^|\s)(mg\/m²|mg\/m2|mg\/kg|mg|micrograms?\/m²|µg\/m²|AUC)(?:\s|$)/i);
    return unitMatch ? unitMatch[1].replace("mg/m2", "mg/m²") : "";
  }

  function normaliseDoseLevels(protocol, phases) {
    const doseLevels = protocol.dose_levels;
    const groups = [];

    if (Array.isArray(doseLevels) && doseLevels.length) {
      const singleDrug = phases.flatMap(phase => phase.components)[0]?.drug || normaliseDrug(protocol.treatment?.drug || "Regimen component");
      groups.push({ component: singleDrug, componentId: componentKey(singleDrug), levels: doseLevels.map(level => ({
        key: String(level.dose_level ?? level.level ?? level.name ?? "level"),
        label: String(level.dose_level ?? level.level ?? level.name ?? "Dose level"),
        dose: Object.entries(level)
          .filter(([key]) => !["dose_level", "level", "name"].includes(key))
          .map(([key, value]) => `${humanise(key)}: ${value}`)
          .join(" · ") || "Protocol-defined dose"
      })) });
    } else if (doseLevels && typeof doseLevels === "object") {
      Object.entries(doseLevels).forEach(([component, levels]) => {
        if (!levels || typeof levels !== "object") return;
        const unit = inferDoseUnit(phases, component);
        groups.push({
          component: normaliseDrug(component),
          componentId: componentKey(component),
          levels: Object.entries(levels).map(([level, dose]) => ({
            key: String(level),
            label: level === "0" ? "Starting dose" : (String(level).startsWith("-") ? `Dose level ${level}` : humanise(level)),
            dose: typeof dose === "object"
              ? formatDoseObject(dose)
              : (typeof dose === "number" && unit ? `${dose} ${unit}` : String(dose).replace("mg/m2", "mg/m²"))
          }))
        });
      });
    }

    const reductions = asArray(protocol.treatment?.dose_reductions);
    if (!groups.length && reductions.length) {
      groups.push({
        component: "Protocol reduction options",
        componentId: componentKey("protocol_reductions"),
        levels: [
          { key: "standard", label: "Starting dose", dose: "Use the protocol starting dose" },
          ...reductions.map((dose, index) => ({ key: `reduction_${index + 1}`, label: `Reduction ${index + 1}`, dose: String(dose) }))
        ]
      });
    }

    return groups;
  }

  function extractAction(rule) {
    return rule?.action && typeof rule.action === "object" ? rule.action : null;
  }

  function actionComponents(action) {
    const components = new Set(asArray(action?.components));
    Object.keys(action?.component_changes || {}).forEach(component => components.add(component));
    if (action?.whole_regimen) components.add("whole_regimen");
    return [...components].filter(Boolean);
  }

  function describeComponentChange(change) {
    if (!change || typeof change !== "object") return "";
    const parts = [];
    if (change.dose_level_change != null) parts.push(`${change.dose_level_change > 0 ? "+" : ""}${change.dose_level_change} dose level`);
    if (change.dose_percent_of_original != null) parts.push(`${change.dose_percent_of_original}% of original dose`);
    if (change.dose_percent != null) parts.push(`${change.dose_percent}% dose`);
    if (change.dose != null) parts.push(String(change.dose));
    if (change.omit) parts.push("omit");
    if (change.hold || change.withhold) parts.push("hold");
    if (change.discontinue) parts.push("discontinue");
    return parts.join(" · ");
  }

  function describeAction(action) {
    if (!action) return "Protocol action";
    const parts = [];
    if (action.recommendation) parts.push(String(action.recommendation));
    if (action.whole_regimen) parts.push(`Whole regimen: ${humanise(action.whole_regimen).toLowerCase()}`);
    Object.entries(action.component_changes || {}).forEach(([component, change]) => {
      const description = describeComponentChange(change);
      if (description) parts.push(`${normaliseDrug(component)}: ${description}`);
    });
    if (!parts.length && action.type) parts.push(humanise(action.type));
    if (action.until) parts.push(`Until ${String(action.until)}`);
    return parts.join(" · ");
  }

  function normaliseModificationRules(protocol) {
    const rules = asArray(protocol.rule_engine?.rules);
    return rules.map(rule => {
      const action = extractAction(rule);
      if (!action) return null;
      const type = String(action.type || "").toLowerCase();
      const components = actionComponents(action);
      const hasDoseChange = Boolean(
        ["dose_reduce", "withhold", "hold", "omit", "discontinue", "permanently_discontinue", "contraindicated", "consultant_review"].includes(type) ||
        Object.keys(action.component_changes || {}).length || action.whole_regimen
      );
      if (!hasDoseChange) return null;
      return {
        id: rule.rule_id || "protocol_rule",
        title: rule.explanation || humanise(rule.rule_id || action.type || "Protocol modification"),
        action: describeAction(action),
        type,
        components,
        componentKeys: components.map(componentKey),
        source: rule.source || {},
        explanation: rule.explanation || ""
      };
    }).filter(Boolean);
  }

  function buildModel(protocol) {
    const phases = Array.isArray(protocol.treatment_phases) && protocol.treatment_phases.length
      ? protocol.treatment_phases.map(phaseFromTreatmentPhase)
      : [phaseFromTreatment(protocol)].filter(Boolean);

    return {
      title: protocol.metadata?.short_title || protocol.metadata?.title || protocol.protocol_id,
      code: protocol.metadata?.nccp_regimen_code || protocol.protocol_id,
      version: protocol.metadata?.nccp_version || "",
      sourceUrl: protocol.metadata?.source_url || "",
      phases,
      doseLevels: normaliseDoseLevels(protocol, phases),
      modificationRules: normaliseModificationRules(protocol)
    };
  }

  function hasData(protocol) {
    const model = buildModel(protocol || {});
    return Boolean(model.phases.length || model.doseLevels.length);
  }

  function allDays(phase) {
    const values = new Set();
    phase.components.forEach(component => component.days.forEach(day => values.add(String(day))));
    return [...values].sort((a, b) => {
      const an = Number(a), bn = Number(b);
      if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
      return a.localeCompare(b);
    });
  }

  function phaseCyclesText(phase) {
    const cycles = phase.cycles;
    if (Array.isArray(cycles)) return cycles.length ? `Cycles ${cycles.join(", ")}` : "Maintenance / ongoing";
    if (cycles != null && cycles !== "") return `${cycles} planned cycle${Number(cycles) === 1 ? "" : "s"}`;
    return phase.duration || "Confirm duration in the current protocol";
  }

  function componentOptions(model) {
    const ids = new Map();
    model.phases.flatMap(phase => phase.components).forEach(component => ids.set(component.id, component.drug));
    model.doseLevels.forEach(group => ids.set(group.componentId, group.component));
    return [...ids.entries()];
  }

  function sourceReference(source) {
    if (!source || typeof source !== "object") return "NCCP source";
    const pieces = [];
    if (source.page != null) pieces.push(`page ${source.page}`);
    if (source.table != null) pieces.push(`table ${source.table}`);
    if (source.section) pieces.push(String(source.section));
    return pieces.length ? pieces.join(" · ") : "NCCP source";
  }

  function renderScheduleTable(phase) {
    if (!phase.components.length) {
      return `<div class="dose-schedule-empty"><strong>Detailed component rows are not yet structured.</strong><p>${escapeHtml(phase.summary || "Use the current official NCCP protocol for full administration detail.")}</p></div>`;
    }
    const rows = phase.components
      .filter(component => selectedDay === "all" || component.days.includes(selectedDay) || component.days.includes("Continuous") || !component.days.length)
      .sort((a, b) => a.order - b.order)
      .map(component => `
        <tr>
          <td><strong>${escapeHtml(component.drug)}</strong>${component.note ? `<span class="dose-schedule-note">${escapeHtml(component.note)}</span>` : ""}</td>
          <td>${escapeHtml(component.dose)}</td>
          <td>${escapeHtml(component.route)}</td>
          <td>${escapeHtml(formatDays(component.days))}</td>
        </tr>`).join("");
    return `
      <div class="dose-schedule-table-wrap">
        <table class="dose-schedule-table">
          <thead><tr><th>Component</th><th>Protocol dose</th><th>Route</th><th>Treatment day</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="4">No component is scheduled for the selected day.</td></tr>'}</tbody>
        </table>
      </div>`;
  }

  function renderDoseLevels(model) {
    if (!model.doseLevels.length) return `
      <div class="dose-schedule-empty compact">
        <strong>No selectable dose level table is currently structured for this regimen.</strong>
        <p>The schedule remains available above. Confirm any modification against the official NCCP protocol.</p>
      </div>`;

    return `<div class="dose-level-grid">${model.doseLevels.map((group, index) => {
      const selection = selectedDoseLevels.get(group.componentId) ?? group.levels[0]?.key ?? "";
      const selected = group.levels.find(level => level.key === selection) || group.levels[0];
      return `
        <div class="dose-level-card">
          <label for="doseLevel_${index}">${escapeHtml(group.component)}</label>
          <select id="doseLevel_${index}" data-dose-component="${escapeHtml(group.componentId)}">
            ${group.levels.map(level => `<option value="${escapeHtml(level.key)}"${level.key === selected?.key ? " selected" : ""}>${escapeHtml(level.label)}</option>`).join("")}
          </select>
          <div class="dose-level-output" aria-live="polite">
            <span>Selected protocol dose</span>
            <strong>${escapeHtml(selected?.dose || "Not structured")}</strong>
          </div>
        </div>`;
    }).join("")}</div>`;
  }

  function renderModifications(model) {
    const rules = model.modificationRules.filter(rule => {
      if (selectedComponent === "all") return true;
      return rule.componentKeys.includes(selectedComponent) || rule.componentKeys.includes("whole_regimen");
    });

    if (!rules.length) return `<div class="dose-schedule-empty compact"><strong>No matching encoded modification pathway.</strong><p>Confirm the current official NCCP protocol.</p></div>`;

    return `<div class="dose-modification-list">${rules.map(rule => `
      <article class="dose-modification-item">
        <div class="dose-modification-heading">
          <strong>${escapeHtml(rule.title)}</strong>
          <span>${escapeHtml(sourceReference(rule.source))}</span>
        </div>
        <p>${escapeHtml(rule.action)}</p>
        ${rule.components.length ? `<p class="dose-schedule-note"><strong>Affected:</strong> ${escapeHtml(rule.components.map(normaliseDrug).join(" · "))}</p>` : ""}
      </article>`).join("")}</div>`;
  }

  function render() {
    const panel = document.getElementById("jsonDoseSchedulePanel");
    const button = document.getElementById("jsonDoseScheduleButton");
    if (!panel || !button || !activeModel) return;

    if (!hasData(activeProtocol)) {
      button.classList.add("hidden");
      panel.classList.add("hidden");
      return;
    }

    button.classList.remove("hidden");
    const phase = activeModel.phases[selectedPhaseIndex] || activeModel.phases[0] || {
      label: "Standard schedule", cycleLength: null, cycles: null, duration: "", summary: "", components: []
    };
    const days = allDays(phase);
    if (selectedDay !== "all" && !days.includes(selectedDay)) selectedDay = "all";
    const components = componentOptions(activeModel);

    panel.innerHTML = `
      <div class="dose-schedule-header">
        <div>
          <span class="dose-schedule-kicker">Protocol-derived regimen map</span>
          <h2>Dose &amp; Schedule</h2>
          <p>${escapeHtml(activeModel.title)} · NCCP ${escapeHtml(activeModel.code)}${activeModel.version ? ` · Version ${escapeHtml(activeModel.version)}` : ""}</p>
        </div>
        <button type="button" class="btn secondary" id="jsonDoseScheduleClose">Close</button>
      </div>

      <div class="dose-schedule-boundary">
        <strong>No patient-specific calculation.</strong>
        This view displays protocol doses, days and encoded modification pathways. It does not calculate BSA, renal function, carboplatin dose or a final prescribed dose.
      </div>

      <div class="dose-schedule-controls">
        ${activeModel.phases.length > 1 ? `<div><label for="jsonDosePhase">Treatment phase</label><select id="jsonDosePhase">${activeModel.phases.map((item, index) => `<option value="${index}"${index === selectedPhaseIndex ? " selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}</select></div>` : ""}
        ${days.length ? `<div><label for="jsonDoseDay">Highlight treatment day</label><select id="jsonDoseDay"><option value="all">All scheduled days</option>${days.map(day => `<option value="${escapeHtml(day)}"${day === selectedDay ? " selected" : ""}>${escapeHtml(/^\d+$/.test(day) ? `Day ${day}` : day)}</option>`).join("")}</select></div>` : ""}
      </div>

      <div class="dose-schedule-metrics">
        <div><span>Cycle</span><strong>${phase.cycleLength ? `q${escapeHtml(phase.cycleLength)}d` : "See protocol"}</strong></div>
        <div><span>Course</span><strong>${escapeHtml(phaseCyclesText(phase))}</strong></div>
        <div><span>Phase</span><strong>${escapeHtml(phase.label)}</strong></div>
      </div>

      ${phase.summary ? `<p class="dose-schedule-summary">${escapeHtml(phase.summary)}</p>` : ""}
      ${renderScheduleTable(phase)}

      <details class="dose-schedule-section" open>
        <summary>Select protocol dose level</summary>
        <div class="details-body">
          <p class="subtle">Selection changes only the displayed protocol level. It does not calculate a patient-specific dose or alter the assessment.</p>
          ${renderDoseLevels(activeModel)}
        </div>
      </details>

      <details class="dose-schedule-section">
        <summary>Protocol dose modification pathways</summary>
        <div class="details-body">
          <div class="dose-modification-filter">
            <label for="jsonDoseComponentFilter">Filter by component</label>
            <select id="jsonDoseComponentFilter">
              <option value="all">All components</option>
              ${components.map(([id, label]) => `<option value="${escapeHtml(id)}"${id === selectedComponent ? " selected" : ""}>${escapeHtml(label)}</option>`).join("")}
            </select>
          </div>
          <p class="subtle">These are source-linked pathways already encoded in the regimen assessment. Apply them only after confirming the full clinical context and current NCCP protocol.</p>
          <div id="jsonDoseModificationResults">${renderModifications(activeModel)}</div>
        </div>
      </details>

      <div class="dose-schedule-footer">
        ${activeModel.sourceUrl ? `<a class="btn secondary" href="${escapeHtml(activeModel.sourceUrl)}" rel="external" referrerpolicy="no-referrer"><span aria-hidden="true">📄</span> Open official NCCP protocol</a>` : ""}
        <span>Current official protocol and authorised prescribing system remain authoritative.</span>
      </div>`;

    wirePanelEvents();
  }

  function wirePanelEvents() {
    document.getElementById("jsonDoseScheduleClose")?.addEventListener("click", close);
    document.getElementById("jsonDosePhase")?.addEventListener("change", event => {
      selectedPhaseIndex = Number(event.target.value) || 0;
      selectedDay = "all";
      render();
    });
    document.getElementById("jsonDoseDay")?.addEventListener("change", event => {
      selectedDay = event.target.value;
      render();
    });
    document.getElementById("jsonDoseComponentFilter")?.addEventListener("change", event => {
      selectedComponent = event.target.value;
      const results = document.getElementById("jsonDoseModificationResults");
      if (results) results.innerHTML = renderModifications(activeModel);
    });
    document.querySelectorAll("[data-dose-component]").forEach(select => {
      select.addEventListener("change", event => {
        selectedDoseLevels.set(event.target.dataset.doseComponent, event.target.value);
        render();
      });
    });
  }

  function open(protocol) {
    activeProtocol = protocol || activeProtocol;
    if (!activeProtocol) return;
    activeModel = buildModel(activeProtocol);
    selectedPhaseIndex = 0;
    selectedDay = "all";
    selectedComponent = "all";
    selectedDoseLevels.clear();
    const panel = document.getElementById("jsonDoseSchedulePanel");
    if (!panel) return;
    panel.classList.remove("hidden");
    render();
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function close() {
    document.getElementById("jsonDoseSchedulePanel")?.classList.add("hidden");
  }

  function prepare(protocol) {
    activeProtocol = protocol;
    activeModel = buildModel(protocol || {});
    selectedPhaseIndex = 0;
    selectedDay = "all";
    selectedComponent = "all";
    selectedDoseLevels.clear();
    close();
    const button = document.getElementById("jsonDoseScheduleButton");
    if (button) button.classList.toggle("hidden", !hasData(protocol));
  }

  root.SACTCheckProtocolDoseSchedule = Object.freeze({
    version: VERSION,
    hasData,
    buildModel,
    prepare,
    open,
    close
  });
})(typeof window !== "undefined" ? window : globalThis);
