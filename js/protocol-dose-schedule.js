/**
 * SACTCheck Protocol Dose & Schedule viewer.
 *
 * Displays only explicit protocol schedule and dose-level data already
 * structured in the protocol JSON. It never converts generic assessment,
 * eligibility or CTCAE rules into dose information and never calculates a
 * patient-specific dose.
 */
(function (root) {
  "use strict";

  const VERSION = "0.52.1";
  let activeProtocol = null;
  let activeModel = null;
  let selectedPhaseIndex = 0;
  let selectedDay = "all";
  let selectedLevel = "0";

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
    return String(value || "component")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
  }

  function normaliseDrug(value) {
    return humanise(value || "Component")
      .replace(/Fluorouracil Infusion/i, "Infusional 5-FU")
      .replace(/Fluorouracil Bolus/i, "Bolus 5-FU")
      .replace(/Folinic Acid/i, "Folinic acid")
      .replace(/Prednisone\/Prednisolone/i, "Prednisone / prednisolone");
  }

  function normaliseUnit(value) {
    return String(value || "")
      .replace(/mg\/m2/gi, "mg/m²")
      .replace(/mcg\/m2/gi, "micrograms/m²")
      .replace(/ug\/m2/gi, "micrograms/m²");
  }

  function formatDoseObject(dose) {
    if (dose == null || dose === "") return "";
    if (typeof dose === "number") return String(dose);
    if (typeof dose === "string") return normaliseUnit(dose.trim());
    if (typeof dose !== "object") return "";

    const value = dose.value ?? dose.dose ?? dose.amount;
    const unit = normaliseUnit(dose.unit ?? dose.units ?? "");
    if (value != null) {
      const pieces = [String(value)];
      if (unit) pieces.push(unit);
      if (dose.frequency) pieces.push(humanise(dose.frequency).toLowerCase());
      if (dose.duration) pieces.push(String(dose.duration));
      return pieces.join(" ");
    }

    const recognised = [
      ["dose_mg_m2", "mg/m²"],
      ["dose_mg_kg", "mg/kg"],
      ["dose_mg", "mg"],
      ["dose_micrograms_m2", "micrograms/m²"],
      ["dose_auc", "AUC"]
    ];
    for (const [key, suffix] of recognised) {
      if (dose[key] != null) {
        return suffix === "AUC" ? `AUC ${dose[key]}` : `${dose[key]} ${suffix}`;
      }
    }
    return "";
  }

  function formatStartingDose(treatment) {
    if (!treatment || typeof treatment !== "object") return "";
    if (treatment.starting_dose_mg_m2 != null) return `${treatment.starting_dose_mg_m2} mg/m²`;
    if (treatment.starting_dose_mg_kg != null) return `${treatment.starting_dose_mg_kg} mg/kg`;
    if (treatment.starting_dose_mg != null) return `${treatment.starting_dose_mg} mg`;
    if (treatment.starting_dose_auc != null) return `AUC ${treatment.starting_dose_auc}`;
    if (treatment.starting_dose != null) return formatDoseObject(treatment.starting_dose);
    return "";
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
    return matches ? [matches[1].trim()] : [];
  }

  function formatDays(days) {
    if (!days?.length) return "";
    if (days.length === 1 && /continuous/i.test(days[0])) return "Continuous";
    return days.map(day => /^\d+$/.test(day) ? `Day ${day}` : day).join(", ");
  }

  function phaseLabel(phase, index) {
    if (phase.label) return phase.label;
    if (phase.phase_id) return humanise(phase.phase_id);
    return `Phase ${index + 1}`;
  }

  function componentFromAdministration(item, index) {
    const dose = formatDoseObject(item?.dose ?? item?.starting_dose ?? item?.dose_text);
    const days = normaliseDays(item);
    if (!dose || !days.length) return null;
    return {
      id: componentKey(item.drug || item.component || item.name || `component_${index + 1}`),
      drug: normaliseDrug(item.drug || item.component || item.name || `Component ${index + 1}`),
      dose,
      route: normaliseUnit(item.route || ""),
      days,
      order: item.order ?? index + 1,
      note: item.note || item.notes || item.schedule || item.role || ""
    };
  }

  function expectedDrugCount(protocol) {
    const drugs = asArray(protocol?.metadata?.drugs)
      .map(item => componentKey(item))
      .filter(Boolean);
    return new Set(drugs).size;
  }

  function phaseFromTreatmentPhase(protocol, phase, index) {
    const raw = asArray(phase.administration);
    const components = raw.map(componentFromAdministration).filter(Boolean);
    const expected = expectedDrugCount(protocol);
    const complete = raw.length > 0 && components.length === raw.length && (!expected || components.length >= expected);
    return {
      id: phase.phase_id || `phase_${index + 1}`,
      label: phaseLabel(phase, index),
      cycleLength: phase.cycle_length_days ?? phase.cycle_days ?? null,
      cycles: phase.cycles ?? phase.planned_cycles ?? null,
      duration: phase.duration_text || phase.duration || "",
      summary: phase.schedule_summary || "",
      components,
      complete
    };
  }

  function phaseFromTreatment(protocol) {
    const treatment = protocol.treatment || {};
    let raw = [];

    if (Array.isArray(treatment.components)) raw = treatment.components;
    else if (Array.isArray(treatment.administration)) raw = treatment.administration;
    else if (treatment.drug) {
      raw = [{
        drug: treatment.drug,
        dose: formatStartingDose(treatment),
        route: treatment.route || treatment.starting_dose?.route,
        days: treatment.days,
        cycle: treatment.starting_dose?.cycle,
        note: asArray(treatment.administration_instructions).join(" ")
      }];
    }

    const components = raw.map(componentFromAdministration).filter(Boolean);
    const expected = expectedDrugCount(protocol);
    const title = String(protocol.metadata?.short_title || protocol.metadata?.title || "");
    const looksLikeCombination = raw.length === 1 && /\+|,|\band\b/i.test(title);
    const complete = raw.length > 0 && components.length === raw.length && (!expected || components.length >= expected) && !looksLikeCombination;
    const cycle = treatment.cycle || {};
    const cycleLength = treatment.cycle_length_days ?? treatment.cycle_days ?? treatment.cycle_days ?? cycle.length_days ?? null;
    const cycles = treatment.planned_cycles ?? treatment.maximum_cycles ?? cycle.planned_cycles ?? null;
    const duration = treatment.duration_text || treatment.duration || (treatment.duration_type ? humanise(treatment.duration_type) : "");
    const summary = treatment.schedule_summary || (typeof treatment.cycle === "string" ? treatment.cycle : "");

    return {
      id: "standard_schedule",
      label: "Standard schedule",
      cycleLength,
      cycles,
      duration,
      summary,
      components,
      complete
    };
  }

  function inferDoseUnit(phases, component) {
    const key = componentKey(component);
    const match = phases.flatMap(phase => phase.components).find(item => item.id === key);
    const dose = String(match?.dose || "");
    const unitMatch = dose.match(/(?:^|\s)(mg\/m²|mg\/kg|mg|micrograms\/m²|AUC)(?:\s|$)/i);
    return unitMatch ? unitMatch[1] : "";
  }

  function formatArrayDoseLevel(level) {
    if (level.dose_mg_m2 != null) return `${level.dose_mg_m2} mg/m²`;
    if (level.dose_mg_kg != null) return `${level.dose_mg_kg} mg/kg`;
    if (level.dose_mg != null) return `${level.dose_mg} mg`;
    if (level.dose_mg_twice_daily != null) return `${level.dose_mg_twice_daily} mg twice daily`;
    if (level.dose_auc != null) return `AUC ${level.dose_auc}`;
    if (level.dose_percent_of_original != null) return `${level.dose_percent_of_original}% of original dose`;
    if (level.dose_percent != null) return `${level.dose_percent}% dose`;
    return formatDoseObject(level.dose ?? level.value);
  }

  function levelKey(value) {
    const text = String(value ?? "").trim().toLowerCase();
    if (["starting", "standard", "start", "0"].includes(text)) return "0";
    return String(value ?? "").trim();
  }

  function levelLabel(value) {
    const key = levelKey(value);
    if (key === "0") return "Starting dose";
    if (/^-\d+$/.test(key)) return `Dose level ${key}`;
    return humanise(key);
  }

  function normaliseDoseLevels(protocol, phases) {
    const doseLevels = protocol.dose_levels;
    const groups = [];

    if (Array.isArray(doseLevels) && doseLevels.length) {
      const component = phases.flatMap(phase => phase.components)[0]?.drug || normaliseDrug(protocol.treatment?.drug || "Regimen component");
      const levels = doseLevels.map(level => {
        const dose = formatArrayDoseLevel(level);
        if (!dose) return null;
        return {
          key: levelKey(level.dose_level ?? level.level ?? level.name),
          label: levelLabel(level.dose_level ?? level.level ?? level.name),
          dose
        };
      }).filter(Boolean);
      if (levels.length) groups.push({ component, componentId: componentKey(component), levels });
    } else if (doseLevels && typeof doseLevels === "object") {
      Object.entries(doseLevels).forEach(([component, levelsObject]) => {
        if (!levelsObject || typeof levelsObject !== "object") return;
        const unit = inferDoseUnit(phases, component);
        const levels = Object.entries(levelsObject).map(([level, rawDose]) => {
          let dose = "";
          if (typeof rawDose === "number") dose = unit ? `${rawDose} ${unit}` : "";
          else if (typeof rawDose === "string") dose = normaliseUnit(rawDose);
          else dose = formatDoseObject(rawDose);
          if (!dose) return null;
          return { key: levelKey(level), label: levelLabel(level), dose };
        }).filter(Boolean);
        if (levels.length) groups.push({ component: normaliseDrug(component), componentId: componentKey(component), levels });
      });
    }

    return groups;
  }

  function buildModel(protocol) {
    const allPhases = Array.isArray(protocol.treatment_phases) && protocol.treatment_phases.length
      ? protocol.treatment_phases.map((phase, index) => phaseFromTreatmentPhase(protocol, phase, index))
      : [phaseFromTreatment(protocol)];
    const phases = allPhases.filter(phase => phase.complete && phase.components.length);

    return {
      title: protocol.metadata?.short_title || protocol.metadata?.title || protocol.protocol_id,
      code: protocol.metadata?.nccp_regimen_code || protocol.protocol_id,
      version: protocol.metadata?.nccp_version || "",
      sourceUrl: protocol.metadata?.source_url || "",
      phases,
      allPhases,
      doseLevels: normaliseDoseLevels(protocol, allPhases)
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

  function courseText(phase) {
    const cycles = phase.cycles;
    if (Array.isArray(cycles)) return cycles.length ? `Cycles ${cycles.join(", ")}` : "";
    if (cycles != null && cycles !== "") return `${cycles} planned cycle${Number(cycles) === 1 ? "" : "s"}`;
    return phase.duration || "";
  }

  function renderScheduleTable(phase) {
    if (!phase?.components?.length) return "";
    const rows = phase.components
      .filter(component => selectedDay === "all" || component.days.includes(selectedDay) || component.days.includes("Continuous"))
      .sort((a, b) => a.order - b.order);
    const showRoute = rows.some(component => component.route);
    return `
      <section class="dose-schedule-block">
        <h3>Protocol schedule</h3>
        <div class="dose-schedule-table-wrap">
          <table class="dose-schedule-table">
            <thead><tr><th>Component</th><th>Protocol dose</th>${showRoute ? "<th>Route</th>" : ""}<th>Treatment day</th></tr></thead>
            <tbody>${rows.map(component => `
              <tr>
                <td><strong>${escapeHtml(component.drug)}</strong>${component.note ? `<span class="dose-schedule-note">${escapeHtml(component.note)}</span>` : ""}</td>
                <td>${escapeHtml(component.dose)}</td>
                ${showRoute ? `<td>${escapeHtml(component.route || "—")}</td>` : ""}
                <td>${escapeHtml(formatDays(component.days))}</td>
              </tr>`).join("")}</tbody>
          </table>
        </div>
      </section>`;
  }

  function levelSort(a, b) {
    if (a === "0") return -1;
    if (b === "0") return 1;
    const an = Number(a), bn = Number(b);
    if (Number.isFinite(an) && Number.isFinite(bn)) return bn - an;
    return a.localeCompare(b);
  }

  function doseAt(group, key) {
    return group.levels.find(level => level.key === key)?.dose || "—";
  }

  function renderDoseLevels(model) {
    if (!model.doseLevels.length) return "";
    const keys = [...new Set(model.doseLevels.flatMap(group => group.levels.map(level => level.key)))].sort(levelSort);
    if (!keys.includes(selectedLevel)) selectedLevel = keys[0] || "0";

    return `
      <section class="dose-schedule-block">
        <div class="dose-level-heading">
          <div><h3>Protocol dose levels</h3><p>These are protocol-defined dose values only. No patient-specific dose is calculated.</p></div>
          ${keys.length > 1 ? `<div class="dose-level-selector"><label for="jsonDoseLevelHighlight">Highlight dose level</label><select id="jsonDoseLevelHighlight">${keys.map(key => `<option value="${escapeHtml(key)}"${key === selectedLevel ? " selected" : ""}>${escapeHtml(levelLabel(key))}</option>`).join("")}</select></div>` : ""}
        </div>
        <div class="dose-schedule-table-wrap">
          <table class="dose-schedule-table dose-level-table">
            <thead><tr><th>Component</th>${keys.map(key => `<th class="${key === selectedLevel ? "is-selected" : ""}">${escapeHtml(levelLabel(key))}</th>`).join("")}</tr></thead>
            <tbody>${model.doseLevels.map(group => `<tr><td><strong>${escapeHtml(group.component)}</strong></td>${keys.map(key => `<td class="${key === selectedLevel ? "is-selected" : ""}">${escapeHtml(doseAt(group, key))}</td>`).join("")}</tr>`).join("")}</tbody>
          </table>
        </div>
      </section>`;
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
    const phase = activeModel.phases[selectedPhaseIndex] || activeModel.phases[0] || null;
    const days = phase ? allDays(phase) : [];
    if (selectedDay !== "all" && !days.includes(selectedDay)) selectedDay = "all";
    const course = phase ? courseText(phase) : "";

    panel.innerHTML = `
      <div class="dose-schedule-header">
        <div>
          <span class="dose-schedule-kicker">Protocol-derived information</span>
          <h2>Dose &amp; Schedule</h2>
          <p>${escapeHtml(activeModel.title)} · NCCP ${escapeHtml(activeModel.code)}${activeModel.version ? ` · Version ${escapeHtml(activeModel.version)}` : ""}</p>
        </div>
        <button type="button" class="btn secondary" id="jsonDoseScheduleClose">Close</button>
      </div>

      <p class="dose-schedule-boundary">No patient-specific calculation is performed.</p>

      ${(activeModel.phases.length > 1 || days.length > 1) ? `<div class="dose-schedule-controls">
        ${activeModel.phases.length > 1 ? `<div><label for="jsonDosePhase">Treatment phase</label><select id="jsonDosePhase">${activeModel.phases.map((item, index) => `<option value="${index}"${index === selectedPhaseIndex ? " selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}</select></div>` : ""}
        ${days.length > 1 ? `<div><label for="jsonDoseDay">Show treatment day</label><select id="jsonDoseDay"><option value="all">All scheduled days</option>${days.map(day => `<option value="${escapeHtml(day)}"${day === selectedDay ? " selected" : ""}>${escapeHtml(/^\d+$/.test(day) ? `Day ${day}` : day)}</option>`).join("")}</select></div>` : ""}
      </div>` : ""}

      ${phase ? `<div class="dose-schedule-summary-row">
        ${phase.cycleLength ? `<span><strong>Cycle:</strong> q${escapeHtml(phase.cycleLength)}d</span>` : ""}
        ${course ? `<span><strong>Course:</strong> ${escapeHtml(course)}</span>` : ""}
        ${activeModel.phases.length > 1 ? `<span><strong>Phase:</strong> ${escapeHtml(phase.label)}</span>` : ""}
      </div>` : ""}

      ${phase?.summary ? `<p class="dose-schedule-summary">${escapeHtml(phase.summary)}</p>` : ""}
      ${renderScheduleTable(phase)}
      ${renderDoseLevels(activeModel)}

      <div class="dose-schedule-footer">
        ${activeModel.sourceUrl ? `<a class="btn secondary" href="${escapeHtml(activeModel.sourceUrl)}" rel="external" referrerpolicy="no-referrer"><span aria-hidden="true">📄</span> Open official NCCP protocol</a>` : ""}
        <span>Confirm the current protocol and authorised prescribing system before prescribing.</span>
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
    document.getElementById("jsonDoseLevelHighlight")?.addEventListener("change", event => {
      selectedLevel = event.target.value;
      render();
    });
  }

  function open(protocol) {
    activeProtocol = protocol || activeProtocol;
    if (!activeProtocol) return;
    activeModel = buildModel(activeProtocol);
    selectedPhaseIndex = 0;
    selectedDay = "all";
    selectedLevel = "0";
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
    selectedLevel = "0";
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
