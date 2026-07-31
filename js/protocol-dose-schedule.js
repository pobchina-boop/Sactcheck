/**
 * SACTCheck Protocol Dose & Schedule and protocol-level dose-modification viewer.
 *
 * The module displays only explicit schedule/dose-level data and dose actions
 * already produced by the deterministic assessment engine. It may calculate a
 * modified protocol dose in mg/m², mg/kg, mg or AUC, but never a patient-specific
 * final dose using BSA, body weight or a renal-dose formula.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SACTCheckProtocolDoseSchedule = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "0.53.0";
  let activeProtocol = null;
  let activeModel = null;
  let activeAssessment = null;
  let activeModificationModel = null;
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
      .replace(/5[\s_-]*fluorouracil|fluorouracil/g, "5fu")
      .replace(/folinic[\s_-]*acid/g, "folinic_acid")
      .replace(/pegylated[\s_-]*liposomal[\s_-]*doxorubicin|pld/g, "pegylated_liposomal_doxorubicin")
      .replace(/prednisone[\s/_-]*prednisolone/g, "prednisone_prednisolone")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
  }

  function componentComparable(value) {
    return componentKey(value)
      .replace(/^bolus_/, "")
      .replace(/^infusional_/, "")
      .replace(/^continuous_/, "")
      .replace(/_bolus$/, "")
      .replace(/_infusion$/, "")
      .replace(/_iv$/, "")
      .replace(/_oral$/, "")
      .replace(/_/g, "");
  }

  function componentMatches(left, right) {
    const a = componentComparable(left);
    const b = componentComparable(right);
    if (!a || !b) return false;
    if (a === b) return true;
    if (a.includes(b) || b.includes(a)) return true;
    const fluorouracilAliases = new Set(["5fu", "fluorouracil"]);
    return fluorouracilAliases.has(a) && fluorouracilAliases.has(b);
  }

  function normaliseDrug(value) {
    return humanise(value || "Component")
      .replace(/Fluorouracil Infusion/i, "Infusional 5-FU")
      .replace(/Infusional 5fu/i, "Infusional 5-FU")
      .replace(/Fluorouracil Bolus/i, "Bolus 5-FU")
      .replace(/Bolus 5fu/i, "Bolus 5-FU")
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
    const cycleLength = treatment.cycle_length_days ?? treatment.cycle_days ?? cycle.length_days ?? null;
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
    const match = phases.flatMap(phase => phase.components).find(item => componentMatches(item.id, component));
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
          <div><h3>Protocol dose levels</h3><p>Protocol-defined values only. Selecting a level does not alter the assessment or calculate a patient-specific dose.</p></div>
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

  function parseDoseText(text) {
    const value = String(text || "").trim();
    if (!value || /discontinue|omit|not recommended/i.test(value)) return null;
    const auc = value.match(/^AUC\s*([0-9.]+)(.*)$/i);
    if (auc) return { value: Number(auc[1]), unit: "AUC", suffix: auc[2].trim() };
    const match = value.match(/^([0-9.]+)\s*(mg\/m²|mg\/kg|mg|micrograms\/m²)(.*)$/i);
    if (!match) return null;
    return { value: Number(match[1]), unit: normaliseUnit(match[2]), suffix: match[3].trim() };
  }

  function formatNumber(value) {
    if (!Number.isFinite(value)) return "";
    const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
    return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(/0+$/, "").replace(/\.$/, "");
  }

  function formatParsedDose(parsed, value) {
    if (!parsed || !Number.isFinite(value)) return "";
    if (parsed.unit === "AUC") return `AUC ${formatNumber(value)}${parsed.suffix ? ` ${parsed.suffix}` : ""}`;
    return `${formatNumber(value)} ${parsed.unit}${parsed.suffix ? ` ${parsed.suffix}` : ""}`;
  }

  function findDoseLevelGroup(model, component) {
    return model.doseLevels.find(group => componentMatches(group.componentId, component) || componentMatches(group.component, component)) || null;
  }

  function findScheduleComponent(model, component) {
    return model.allPhases.flatMap(phase => phase.components)
      .find(item => componentMatches(item.id, component) || componentMatches(item.drug, component)) || null;
  }

  function startingDoseFor(model, component) {
    const group = findDoseLevelGroup(model, component);
    const starting = group?.levels.find(level => level.key === "0") || group?.levels[0];
    if (starting?.dose) return starting.dose;
    return findScheduleComponent(model, component)?.dose || "";
  }

  function normaliseCurrentLevel(value) {
    if (value == null || value === "") return "0";
    const text = String(value).trim().toLowerCase();
    if (["starting", "standard", "0"].includes(text)) return "0";
    const number = text.match(/-?\d+/)?.[0];
    if (!number) return "0";
    return Number(number) > 0 ? `-${number}` : number;
  }

  function targetDoseLevel(model, component, change, result, relativeToCurrent) {
    const group = findDoseLevelGroup(model, component);
    if (!group || !Number.isFinite(Number(change))) return null;
    const currentRaw = result?.inputs?.current_dose_level ?? result?.inputs?.dose_level ?? result?.inputs?.current_level;
    const current = relativeToCurrent ? normaliseCurrentLevel(currentRaw) : "0";
    const currentNumber = Number(current) || 0;
    const target = String(currentNumber + Number(change));
    const exact = group.levels.find(level => level.key === target);
    if (exact) return { level: exact.label, dose: exact.dose };
    const sorted = [...group.levels].sort((a, b) => levelSort(a.key, b.key));
    const fallback = sorted.find(level => Number(level.key) <= Number(target)) || sorted[sorted.length - 1];
    return fallback ? { level: fallback.label, dose: fallback.dose } : null;
  }

  function componentChange(action, component) {
    const changes = action?.component_changes;
    if (!changes || typeof changes !== "object") return null;
    const match = Object.entries(changes).find(([key]) => componentMatches(key, component));
    return match?.[1] || null;
  }

  function explicitDoseInstruction(action, component, model, result) {
    const specific = componentChange(action, component) || {};
    const merged = { ...action, ...specific };

    if (specific.discontinue || merged.type === "permanently_discontinue" || merged.type === "discontinue" || merged.type === "cease" || merged.type === "contraindicated") {
      return { kind: "stop", label: merged.type === "contraindicated" ? "Do not administer" : "Discontinue", precise: true };
    }
    if (specific.omit || merged.type === "omit") return { kind: "omit", label: "Omit component", precise: true };

    const directDose = merged.dose != null ? formatDoseObject(merged.dose) :
      merged.dose_mg_m2 != null ? `${merged.dose_mg_m2} mg/m²` :
      merged.dose_mg_kg != null ? `${merged.dose_mg_kg} mg/kg` :
      merged.dose_mg_twice_daily != null ? `${merged.dose_mg_twice_daily} mg twice daily` :
      merged.total_daily_dose_mg != null ? `${merged.total_daily_dose_mg} mg total daily dose` :
      merged.dose_mg != null ? `${merged.dose_mg} mg` : "";
    if (directDose) return { kind: "absolute", label: "Use protocol dose", dose: directDose, precise: true };

    const percent = merged.dose_percent_of_original ?? merged.dose_percent;
    if (percent != null && Number.isFinite(Number(percent))) {
      const starting = startingDoseFor(model, component);
      const parsed = parseDoseText(starting);
      return {
        kind: "percent",
        label: `Use ${formatNumber(Number(percent))}% of protocol dose`,
        percent: Number(percent),
        dose: parsed ? formatParsedDose(parsed, parsed.value * Number(percent) / 100) : "",
        startingDose: starting,
        precise: true
      };
    }

    let levelChange = merged.dose_level_change;
    if (levelChange == null && merged.type === "dose_reduce_one_level") levelChange = -1;
    if (levelChange == null && merged.type === "dose_reduce_two_levels") levelChange = -2;
    if (levelChange != null) {
      const target = targetDoseLevel(model, component, levelChange, result, Boolean(merged.relative_to_current_dose_level));
      if (target) return { kind: "level", label: target.level, dose: target.dose, precise: true };
    }

    const absolute = merged.absolute_reduction;
    const change = merged.dose_change_mg_m2;
    if ((absolute?.value != null || change != null)) {
      const inputField = merged.dose_input_field;
      const currentValue = inputField ? Number(result?.inputs?.[inputField]) : null;
      const starting = startingDoseFor(model, component);
      const parsed = parseDoseText(starting);
      const reduction = absolute?.value != null ? Number(absolute.value) : Math.abs(Number(change));
      const base = Number.isFinite(currentValue) ? currentValue : parsed?.value;
      if (Number.isFinite(base) && Number.isFinite(reduction)) {
        const unit = normaliseUnit(absolute?.unit || parsed?.unit || "mg/m²");
        return { kind: "absolute_reduction", label: `Reduce by ${formatNumber(reduction)} ${unit}`, dose: `${formatNumber(Math.max(0, base - reduction))} ${unit}`, precise: true };
      }
    }

    return null;
  }

  function parseRecommendationInstruction(finding, component, model, result) {
    const text = String(finding?.action?.recommendation || finding?.explanation || "");
    if (!text) return null;

    const explicitTarget = text.match(/(?:use|reduce(?:\s+\w+)*\s+to|restart(?:\s+\w+)*\s+at)\s+(?:approximately\s+)?(?:a\s+)?([0-9.]+)\s*(mg\/m(?:2|²)|mg\/kg|mg|AUC)/i);
    if (explicitTarget) {
      const unit = normaliseUnit(explicitTarget[2]);
      const dose = /^auc$/i.test(unit) ? `AUC ${explicitTarget[1]}` : `${explicitTarget[1]} ${unit}`;
      return { kind: "absolute", label: "Use protocol dose", dose, precise: true, derivedFromText: true };
    }

    const percentMatch = text.match(/(?:use|consider|start(?:ing)?|resume(?:\s+at)?|reduce(?:\s+to)?)\s+(?:approximately\s+)?([0-9.]+)\s*%\s*(?:of\s+(?:the\s+)?(?:original|starting|protocol)\s+)?(?:\w+\s+)*dose/i)
      || text.match(/([0-9.]+)\s*%\s+of\s+(?:the\s+)?(?:original|starting|protocol)\s+(?:\w+\s+)*dose/i)
      || text.match(/(?:consider|use)\s+(?:approximately\s+)?([0-9.]+)\s*%\s+dose/i);
    if (percentMatch) {
      const percent = Number(percentMatch[1]);
      const starting = startingDoseFor(model, component);
      const parsed = parseDoseText(starting);
      return {
        kind: "percent",
        label: `Use ${formatNumber(percent)}% of protocol dose`,
        percent,
        startingDose: starting,
        dose: parsed ? formatParsedDose(parsed, parsed.value * percent / 100) : "",
        precise: true,
        derivedFromText: true
      };
    }

    let levelChange = null;
    if (/two\s+(?:lower\s+)?dose levels|reduce(?:\s+\w+)*\s+by\s+two\s+dose levels/i.test(text)) levelChange = -2;
    else if (/next\s+lower\s+dose level|one\s+(?:lower\s+)?dose level|reduce(?:\s+\w+)*\s+by\s+one\s+dose level/i.test(text)) levelChange = -1;
    if (levelChange != null) {
      const target = targetDoseLevel(model, component, levelChange, result, /subsequent|current/i.test(text));
      if (target) return { kind: "level", label: target.level, dose: target.dose, precise: true, derivedFromText: true };
    }

    return null;
  }

  const ACTION_RANK = Object.freeze({
    permanently_discontinue: 100,
    contraindicated: 98,
    discontinue: 96,
    cease: 95,
    omit: 92,
    withhold_then_reduce: 88,
    delay_then_dose_reduce: 86,
    withhold: 84,
    delay: 82,
    dose_reduce_two_levels: 76,
    dose_reduce_one_level: 74,
    dose_reduce: 72,
    consultant_review: 50,
    proceed_with_caution: 20,
    proceed: 10
  });

  function immediateAction(finding) {
    const type = String(finding?.actionType || finding?.action?.type || "consultant_review");
    if (["permanently_discontinue", "contraindicated", "discontinue", "cease"].includes(type)) return type === "contraindicated" ? "Do not administer" : "Discontinue";
    if (type === "omit") return "Omit component";
    if (["withhold_then_reduce", "withhold"].includes(type)) return "Withhold now";
    if (["delay_then_dose_reduce", "delay"].includes(type)) return "Delay treatment";
    if (["dose_reduce", "dose_reduce_one_level", "dose_reduce_two_levels"].includes(type)) return "Dose modification";
    return "Clinical review";
  }

  function displayInputTrigger(finding, result) {
    const fields = asArray(finding?.conditionFields);
    const definitions = new Map(asArray(result?.definitions).map(definition => [definition.id, definition]));
    const values = fields.map(field => {
      const display = result?.displayInputs?.[field];
      if (!display) return "";
      const label = definitions.get(field)?.label || humanise(field);
      return `${label}: ${display}`;
    }).filter(Boolean);
    if (values.length) return values.join("; ");
    return finding?.explanation || finding?.ruleId || "Entered protocol criterion";
  }

  function componentUniverse(model) {
    const values = [];
    model.allPhases.flatMap(phase => phase.components).forEach(item => values.push({ id: item.id, label: item.drug }));
    model.doseLevels.forEach(group => values.push({ id: group.componentId, label: group.component }));
    return values.filter((item, index, array) => array.findIndex(other => componentMatches(other.id, item.id)) === index);
  }

  function expandComponents(finding, model) {
    const raw = asArray(finding?.action?.components);
    const universe = componentUniverse(model);
    if (!raw.length || raw.some(item => componentKey(item) === "whole_regimen")) return universe.length ? universe : [{ id: "whole_regimen", label: "Whole regimen" }];
    return raw.map(item => {
      const match = universe.find(candidate => componentMatches(candidate.id, item) || componentMatches(candidate.label, item));
      return match || { id: componentKey(item), label: normaliseDrug(item) };
    });
  }

  function interpretFindingForComponent(finding, component, model, result) {
    const type = String(finding?.actionType || finding?.action?.type || "consultant_review");
    const structured = explicitDoseInstruction(finding.action || {}, component.id, model, result);
    const parsed = structured || parseRecommendationInstruction(finding, component.id, model, result);
    const isImmediatePrecise = ["permanently_discontinue", "contraindicated", "discontinue", "cease", "omit", "withhold", "delay"].includes(type);
    const hasQuantifiedFuture = Boolean(parsed?.precise);
    if (!isImmediatePrecise && !hasQuantifiedFuture && !["withhold_then_reduce", "delay_then_dose_reduce"].includes(type)) return null;
    if (["withhold_then_reduce", "delay_then_dose_reduce"].includes(type) && !hasQuantifiedFuture) return null;

    let actionLabel = immediateAction(finding);
    let protocolDose = "";
    if (parsed) {
      if (["withhold_then_reduce", "delay_then_dose_reduce"].includes(type)) actionLabel = `${actionLabel}; then ${parsed.label.toLowerCase()}`;
      else if (["dose_reduce", "dose_reduce_one_level", "dose_reduce_two_levels"].includes(type)) actionLabel = parsed.label;
      protocolDose = parsed.dose || "";
    }
    if (["permanently_discontinue", "contraindicated", "discontinue", "cease", "omit"].includes(type)) protocolDose = "Not to be administered";
    if (["withhold", "delay"].includes(type)) protocolDose = "No dose now";

    return {
      componentId: component.id,
      component: component.label,
      actionType: type,
      rank: ACTION_RANK[type] || 50,
      actionLabel,
      protocolDose,
      startingDose: startingDoseFor(model, component.id),
      trigger: displayInputTrigger(finding, result),
      explanation: finding?.explanation || "",
      sourceText: finding?.sourceText || "Source encoded in protocol",
      ruleId: finding?.ruleId || "",
      conditionFields: asArray(finding?.conditionFields),
      quantified: Boolean(parsed?.precise)
    };
  }

  function buildModificationModel(protocol, result, suppliedModel) {
    const model = suppliedModel || buildModel(protocol || {});
    if (!result || !Array.isArray(result.findings)) return { rows: [], labTriggered: false, title: "" };
    const actions = [];
    result.findings
      .filter(finding => !finding.domainAssessment && !["proceed", "proceed_with_caution", "partial_context_required"].includes(String(finding.actionType || "")))
      .forEach(finding => {
        expandComponents(finding, model).forEach(component => {
          const interpreted = interpretFindingForComponent(finding, component, model, result);
          if (interpreted) actions.push(interpreted);
        });
      });

    const grouped = new Map();
    actions.forEach(action => {
      const key = componentKey(action.componentId || action.component);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(action);
    });

    const rows = [...grouped.values()].map(items => {
      const sorted = [...items].sort((a, b) => b.rank - a.rank);
      return { ...sorted[0], allActions: sorted };
    }).sort((a, b) => b.rank - a.rank || a.component.localeCompare(b.component));

    const laboratoryPattern = /(anc|neutroph|platelet|haemoglobin|hemoglobin|wbc|crcl|egfr|gfr|creatin|renal|dialysis|bilirubin|alt|ast|transamin|hepatic|liver|albumin|potassium|magnesium|calcium|phosphate)/i;
    const labTriggered = rows.some(row => row.allActions.some(action => action.conditionFields.some(field => laboratoryPattern.test(field))));
    const hasQuantified = rows.some(row => row.quantified || row.allActions.some(action => action.quantified));
    const hasDoseReduction = rows.some(row => ["dose_reduce", "dose_reduce_one_level", "dose_reduce_two_levels", "withhold_then_reduce", "delay_then_dose_reduce"].includes(row.actionType));
    const title = hasQuantified || hasDoseReduction ? "Protocol dose modification applies" : "Protocol dose action applies";
    return { rows, labTriggered, hasQuantified, title };
  }

  function renderModificationTable(modification) {
    if (!modification?.rows?.length) return "";
    return `
      <section class="dose-schedule-block dose-modification-block">
        <div class="dose-modification-heading">
          <div><span class="dose-modification-badge">Assessment linked</span><h3>Applicable protocol dose action</h3><p>Derived from the values entered in the assessment. The governing action is resolved separately for each component.</p></div>
        </div>
        <div class="dose-schedule-table-wrap">
          <table class="dose-schedule-table dose-modification-table">
            <thead><tr><th>Component</th><th>Entered value or trigger</th><th>Governing action</th><th>Protocol dose</th></tr></thead>
            <tbody>${modification.rows.map(row => `
              <tr>
                <td><strong>${escapeHtml(row.component)}</strong>${row.startingDose ? `<span class="dose-schedule-note">Standard: ${escapeHtml(row.startingDose)}</span>` : ""}</td>
                <td>${escapeHtml(row.trigger)}</td>
                <td><strong>${escapeHtml(row.actionLabel)}</strong>${row.allActions.length > 1 ? `<details class="dose-rule-details"><summary>${row.allActions.length} triggered rules</summary><ul>${row.allActions.map(item => `<li>${escapeHtml(item.actionLabel)} — ${escapeHtml(item.trigger)} <span>${escapeHtml(item.sourceText)}</span></li>`).join("")}</ul></details>` : `<span class="dose-schedule-note">${escapeHtml(row.sourceText)}</span>`}</td>
                <td>${escapeHtml(row.protocolDose || "Review protocol action")}</td>
              </tr>`).join("")}</tbody>
          </table>
        </div>
        <p class="dose-modification-boundary">This is a protocol-level dose or action. It is not a patient-specific final dose and must be verified against the current NCCP protocol and authorised prescribing system.</p>
      </section>`;
  }

  function renderPrompt(modification) {
    const prompt = typeof document !== "undefined" ? document.getElementById("jsonDoseModificationPrompt") : null;
    if (!prompt) return;
    if (!modification?.rows?.length) {
      prompt.classList.add("hidden");
      prompt.innerHTML = "";
      return;
    }
    const affected = modification.rows.map(row => row.component).slice(0, 3).join(", ");
    const extra = modification.rows.length > 3 ? ` and ${modification.rows.length - 3} more` : "";
    const hasStructuredSchedule = hasData(activeProtocol);
    const reviewLabel = hasStructuredSchedule ? "Review dose & schedule" : "Review dose action";
    prompt.innerHTML = `
      <div><strong>${escapeHtml(modification.title)}</strong><p>${escapeHtml(affected + extra)}. Review the component-specific protocol action before prescribing.</p></div>
      <button type="button" class="btn" id="jsonReviewDoseModification">${escapeHtml(reviewLabel)}</button>`;
    prompt.classList.remove("hidden");
    document.getElementById("jsonReviewDoseModification")?.addEventListener("click", () => open(activeProtocol));
  }

  function render() {
    const panel = typeof document !== "undefined" ? document.getElementById("jsonDoseSchedulePanel") : null;
    const button = typeof document !== "undefined" ? document.getElementById("jsonDoseScheduleButton") : null;
    if (!panel || !button || !activeModel) return;

    const hasStructuredSchedule = hasData(activeProtocol);
    const hasAssessmentDoseAction = Boolean(activeModificationModel?.rows?.length);
    button.classList.toggle("hidden", !hasStructuredSchedule);
    if (!hasStructuredSchedule && !hasAssessmentDoseAction) {
      panel.classList.add("hidden");
      return;
    }
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

      <p class="dose-schedule-boundary">Protocol doses and actions only. No BSA, weight-based or patient-specific final dose is calculated.</p>

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
      ${!hasStructuredSchedule && hasAssessmentDoseAction ? `<p class="dose-schedule-summary">A structured regimen schedule is not yet available in SACTCheck for this protocol. The applicable encoded protocol dose action is shown below.</p>` : ""}
      ${renderScheduleTable(phase)}
      ${renderDoseLevels(activeModel)}
      ${renderModificationTable(activeModificationModel)}

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
    activeModificationModel = buildModificationModel(activeProtocol, activeAssessment, activeModel);
    selectedPhaseIndex = 0;
    selectedDay = "all";
    selectedLevel = "0";
    const panel = typeof document !== "undefined" ? document.getElementById("jsonDoseSchedulePanel") : null;
    if (!panel) return;
    panel.classList.remove("hidden");
    render();
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function close() {
    if (typeof document !== "undefined") document.getElementById("jsonDoseSchedulePanel")?.classList.add("hidden");
  }

  function prepare(protocol) {
    activeProtocol = protocol;
    activeModel = buildModel(protocol || {});
    activeAssessment = null;
    activeModificationModel = { rows: [], labTriggered: false, title: "" };
    selectedPhaseIndex = 0;
    selectedDay = "all";
    selectedLevel = "0";
    close();
    if (typeof document !== "undefined") {
      const button = document.getElementById("jsonDoseScheduleButton");
      if (button) button.classList.toggle("hidden", !hasData(protocol));
      renderPrompt(activeModificationModel);
    }
  }

  function updateAssessment(result) {
    activeAssessment = result || null;
    activeModificationModel = buildModificationModel(activeProtocol || {}, activeAssessment, activeModel || buildModel(activeProtocol || {}));
    if (typeof document !== "undefined") {
      renderPrompt(activeModificationModel);
      const panel = document.getElementById("jsonDoseSchedulePanel");
      if (panel && !panel.classList.contains("hidden")) render();
    }
    return activeModificationModel;
  }

  return Object.freeze({
    version: VERSION,
    hasData,
    buildModel,
    buildModificationModel,
    prepare,
    updateAssessment,
    open,
    close
  });
});
