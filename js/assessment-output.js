/**
 * SACTCheck concise assessment-output builder.
 *
 * Produces a transparent concise clinical summary from an assessment result.
 * The HTML preview is compact; the direct PDF generator retains all entered
 * printable rows and paginates only when clinically necessary.
 * It reports encoded criteria as met, not met/requiring review, or unassessed;
 * it does not authorise treatment or replace clinician judgement.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SACTCheckAssessmentOutput = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "0.45.3";
  const MAX_ROUTINE_ROWS = 10;
  const DISCLAIMER = "SACTCheck applies encoded NCCP protocol criteria to clinician-entered information. This output does not constitute treatment clearance and does not replace complete clinical assessment, the current official NCCP protocol, prescribing information, local policy or professional judgement. The responsible oncology clinician retains responsibility for the final treatment decision.";

  const CONTEXT_FIELDS = new Set([
    "indication_id", "assessment_type", "cycle_number", "day_number",
    "schedule_q3w_or_q6w", "etoposide_schedule"
  ]);

  const CRITICAL_ACTIONS = new Set(["permanently_discontinue", "contraindicated", "discontinue", "cease"]);
  const HOLD_ACTIONS = new Set(["omit", "withhold", "withhold_then_reduce", "delay", "delay_then_dose_reduce"]);
  const REVIEW_ACTIONS = new Set(["consultant_review", "partial_context_required"]);
  const CLEAR_ACTIONS = new Set(["proceed", "proceed_with_caution"]);

  function asArray(value) {
    if (value === undefined || value === null) return [];
    return Array.isArray(value) ? value : [value];
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function cleanText(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim();
  }

  function humanise(value) {
    return cleanText(value).replace(/_/g, " ").replace(/\b\w/g, character => character.toUpperCase());
  }

  function hasValue(value) {
    return value !== undefined && value !== null && value !== "";
  }

  function formatDateTime(value) {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) return cleanText(value) || "Not recorded";
    try {
      return new Intl.DateTimeFormat("en-IE", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: false
      }).format(date);
    } catch (error) {
      return date.toISOString().replace("T", " ").slice(0, 16);
    }
  }

  function formatValue(value) {
    if (value === true) return "Yes";
    if (value === false) return "No";
    if (!hasValue(value)) return "Not entered";
    return cleanText(value);
  }

  function operatorSymbol(operator) {
    const symbols = {
      lt: "<", "<": "<", lte: "≤", "<=": "≤",
      gt: ">", ">": ">", gte: "≥", ">=": "≥",
      eq: "=", equals: "=", "==": "=", "=": "=",
      neq: "≠", not_equals: "≠", "!=": "≠", "<>": "≠",
      between: "within", between_inclusive: "within", between_exclusive: "within",
      outside: "outside", in: "in", one_of: "in", not_in: "not in"
    };
    return symbols[String(operator || "=").toLowerCase()] || cleanText(operator) || "=";
  }

  function formatCutoff(value, operator) {
    if (Array.isArray(value)) {
      const joiner = ["between", "between_inclusive", "between_exclusive"].includes(String(operator).toLowerCase()) ? "–" : ", ";
      return value.map(formatValue).join(joiner);
    }
    return formatValue(value);
  }

  function collectLeaves(node, output = []) {
    if (!node) return output;
    if (Array.isArray(node)) {
      node.forEach(item => collectLeaves(item, output));
      return output;
    }
    if (typeof node !== "object") return output;
    if (node.field) output.push(node);
    ["all", "any", "none"].forEach(key => {
      if (node[key]) collectLeaves(node[key], output);
    });
    if (node.not) collectLeaves(node.not, output);
    return output;
  }

  function actionCategory(finding) {
    const type = String(finding?.actionType || finding?.action?.type || "").toLowerCase();
    if (finding?.domainAssessment || CLEAR_ACTIONS.has(type)) return { key: "met", label: "Criterion met", priority: 4 };
    if (CRITICAL_ACTIONS.has(type)) return { key: "critical", label: "Criterion not met - urgent review", priority: 0 };
    if (HOLD_ACTIONS.has(type)) return { key: "hold", label: "Criterion not met - review/hold pathway", priority: 1 };
    if (type.includes("dose_reduce") || type.includes("dose_adjust") || type === "modify") return { key: "modify", label: "Dose-modification pathway", priority: 2 };
    if (REVIEW_ACTIONS.has(type)) return { key: "review", label: "Additional clinical review/context", priority: 3 };
    if (type && type !== "proceed") return { key: "review", label: humanise(type), priority: 3 };
    return { key: "recorded", label: "Recorded", priority: 5 };
  }

  function findingRows(result, labCalculations = {}) {
    const definitions = new Map(asArray(result?.definitions).map(definition => [definition.id, definition]));
    const rows = [];

    asArray(result?.findings).forEach(finding => {
      const category = actionCategory(finding);
      const conditions = asArray(finding.conditions?.length ? finding.conditions : finding.condition);
      const leaves = conditions.flatMap(condition => collectLeaves(condition, []));
      const comparableLeaves = leaves.filter(leaf => leaf.field && hasValue(result?.inputs?.[leaf.field]));

      if (comparableLeaves.length) {
        comparableLeaves.forEach(leaf => {
          const definition = definitions.get(leaf.field) || {};
          const lab = labCalculations[leaf.field];
          const unit = definition.unit ? ` ${definition.unit}` : "";
          rows.push({
            field: leaf.field,
            label: definition.label || humanise(leaf.field),
            actual: lab ? `${lab.display} → ${lab.decisionDisplay}` : `${result?.displayInputs?.[leaf.field] ?? formatValue(result?.inputs?.[leaf.field])}${lab ? "" : unit}`,
            criterion: `${operatorSymbol(leaf.operator)} ${formatCutoff(leaf.value, leaf.operator)}${unit}`,
            outcome: category.label,
            outcomeKey: category.key,
            priority: category.priority,
            source: cleanText(finding.sourceText),
            title: cleanText(finding.displayTitle || finding.ruleId)
          });
        });
        return;
      }

      const fields = asArray(finding.conditionFields).filter(field => hasValue(result?.inputs?.[field]));
      fields.forEach(field => {
        const definition = definitions.get(field) || {};
        const lab = labCalculations[field];
        const unit = definition.unit ? ` ${definition.unit}` : "";
        rows.push({
          field,
          label: definition.label || humanise(field),
          actual: lab ? `${lab.display} → ${lab.decisionDisplay}` : `${result?.displayInputs?.[field] ?? formatValue(result?.inputs?.[field])}${lab ? "" : unit}`,
          criterion: finding.contextRequired ? "Linked context required" : "Encoded pathway reviewed",
          outcome: category.label,
          outcomeKey: category.key,
          priority: category.priority,
          source: cleanText(finding.sourceText),
          title: cleanText(finding.displayTitle || finding.ruleId)
        });
      });
    });

    const represented = new Set(rows.map(row => row.field));
    asArray(result?.definitions).forEach(definition => {
      if (definition.visible === false || CONTEXT_FIELDS.has(definition.id)) return;
      const value = result?.inputs?.[definition.id];
      if (!hasValue(value) || represented.has(definition.id)) return;
      const lab = labCalculations[definition.id];
      const unit = definition.unit ? ` ${definition.unit}` : "";
      rows.push({
        field: definition.id,
        label: definition.label || humanise(definition.id),
        actual: lab ? `${lab.display} → ${lab.decisionDisplay}` : `${result?.displayInputs?.[definition.id] ?? formatValue(value)}${lab ? "" : unit}`,
        criterion: "No standalone encoded criterion",
        outcome: "Recorded",
        outcomeKey: "recorded",
        priority: 5,
        source: "",
        title: ""
      });
    });

    const deduplicated = rows.filter((row, index, array) => array.findIndex(other =>
      other.label === row.label && other.actual === row.actual && other.criterion === row.criterion && other.outcome === row.outcome
    ) === index);

    deduplicated.sort((a, b) => a.priority - b.priority || a.label.localeCompare(b.label));
    const important = deduplicated.filter(row => row.priority <= 3);
    const routine = deduplicated.filter(row => row.priority > 3);
    const routineAllowance = Math.max(0, MAX_ROUTINE_ROWS - important.length);
    const visible = [...important, ...routine.slice(0, routineAllowance)];

    return {
      rows: visible,
      allRows: deduplicated,
      omittedRoutineCount: Math.max(0, routine.length - routineAllowance),
      totalCount: deduplicated.length
    };
  }

  function outcomeFor(result) {
    if (asArray(result?.invalid).length || asArray(result?.errors).length) {
      return {
        key: "review",
        title: "Assessment incomplete - correct entered values",
        detail: "One or more entered values could not be evaluated. Review the listed issue before using this assessment."
      };
    }

    const findings = asArray(result?.findings);
    const substantive = findings.filter(finding => !finding.domainAssessment && !CLEAR_ACTIONS.has(String(finding.actionType || "").toLowerCase()));
    const restrictive = substantive.filter(finding => String(finding.actionType || "").toLowerCase() !== "partial_context_required");
    const contextRequired = substantive.filter(finding => String(finding.actionType || "").toLowerCase() === "partial_context_required");

    if (restrictive.length) {
      return {
        key: "review",
        title: `${restrictive.length} encoded ${restrictive.length === 1 ? "criterion" : "criteria"} require clinical review`,
        detail: "Review the highlighted protocol criteria and the current NCCP source before the final treatment decision."
      };
    }

    if (contextRequired.length) {
      return {
        key: "partial",
        title: "Partial assessment - additional linked context required",
        detail: "The entered information was assessed as far as the encoded pathway allows; further protocol context remains necessary."
      };
    }

    if (result?.partialAssessment || result?.complete === false || asArray(result?.unassessed).length) {
      return {
        key: "partial",
        title: "Partial assessment - no restrictive criterion triggered in assessed domains",
        detail: "Unassessed domains remain unknown and have not been assumed normal."
      };
    }

    return {
      key: "met",
      title: "No encoded protocol criterion breached",
      detail: "No restrictive rule was triggered by the information entered. This is not treatment clearance."
    };
  }

  function courseTokens(protocol, indicationId) {
    const metadataApi = typeof globalThis !== "undefined" ? globalThis.SACTCheckRegimenCourseMetadata : null;
    if (!metadataApi?.deriveContexts) return [];
    const contexts = metadataApi.deriveContexts(protocol);
    const selected = contexts.find(context => String(context.indication_id || context.id || "") === String(indicationId || ""))
      || (contexts.length === 1 ? contexts[0] : null);
    if (!selected) return [];
    return [
      selected.intent_label,
      selected.duration?.label,
      metadataApi.formatInterval?.(selected.cycle_length_days)
    ].filter(Boolean);
  }

  function compactList(items, maximum = 8) {
    const values = asArray(items).map(item => cleanText(item?.label ?? item)).filter(Boolean);
    if (!values.length) return "None recorded";
    const shown = values.slice(0, maximum);
    const omitted = values.length - shown.length;
    return `${shown.join(", ")}${omitted > 0 ? ` + ${omitted} more` : ""}`;
  }

  function normaliseDecision(value) {
    const labels = {
      "": "Not documented",
      proceed: "Proceed",
      hold: "Hold or defer",
      modify: "Dose modify",
      discuss: "Discuss with consultant/pharmacy",
      other: "Other"
    };
    return labels[value] || cleanText(value) || "Not documented";
  }

  function buildModel(options = {}) {
    const result = options.result || {};
    const protocol = options.protocol || {};
    const metadata = protocol.metadata || {};
    const rowData = findingRows(result, options.labCalculations || {});
    const course = courseTokens(protocol, result?.context?.indicationId);
    const outcome = outcomeFor(result);
    const tumourGroup = cleanText(options.tumourGroup) && options.tumourGroup !== "all"
      ? cleanText(options.tumourGroup)
      : cleanText(metadata.tumour_group || asArray(metadata.tumour_groups).join(" / ")) || "Not specified";

    const contextParts = [
      result?.context?.cycle !== null && result?.context?.cycle !== undefined ? `Cycle ${result.context.cycle}` : null,
      result?.context?.day !== null && result?.context?.day !== undefined ? `Day ${result.context.day}` : null,
      result?.context?.schedule ? cleanText(result.context.schedule) : null
    ].filter(Boolean);

    return {
      version: VERSION,
      appVersion: cleanText(options.appVersion || VERSION),
      assessmentId: cleanText(options.assessmentId) || "Not entered",
      assessedAt: formatDateTime(result?.context?.assessedAt),
      protocolTitle: cleanText(result?.protocol?.title || metadata.title || protocol.protocol_id) || "Protocol not specified",
      protocolCode: cleanText(result?.protocol?.code || metadata.nccp_regimen_code || protocol.protocol_id) || "Not specified",
      protocolVersion: cleanText(result?.protocol?.version || metadata.nccp_version) || "Not specified",
      tumourGroup,
      indication: cleanText(result?.context?.indicationLabel || metadata.indication) || "Not specified",
      assessmentProfile: cleanText(result?.profile?.label) || "Default assessment",
      course: course.join(" · ") || "Course metadata not confirmed",
      treatmentContext: contextParts.join(" · ") || "Not entered",
      outcome,
      rows: rowData.rows,
      allRows: rowData.allRows,
      omittedRoutineCount: rowData.omittedRoutineCount,
      unassessed: compactList(result?.unassessed),
      invalid: compactList([...(result?.missing || []), ...(result?.invalid || []), ...(result?.errors || [])]),
      clinicianDecision: normaliseDecision(options.clinicianDecision),
      clinicianNote: cleanText(options.clinicianNote) || "Not documented",
      disclaimer: DISCLAIMER,
      sourceLabel: `NCCP ${cleanText(result?.protocol?.code || metadata.nccp_regimen_code || protocol.protocol_id) || "protocol"}${cleanText(result?.protocol?.version || metadata.nccp_version) ? ` · ${cleanText(result?.protocol?.version || metadata.nccp_version)}` : ""}`
    };
  }

  function renderRows(rows) {
    if (!rows.length) {
      return '<tr><td colspan="4" class="print-empty">No clinical value was entered or no printable criterion row was generated.</td></tr>';
    }
    return rows.map(row => `
      <tr class="print-row-${escapeHtml(row.outcomeKey)}">
        <th scope="row">${escapeHtml(row.label)}</th>
        <td>${escapeHtml(row.actual)}</td>
        <td>${escapeHtml(row.criterion)}</td>
        <td><span class="print-result-chip ${escapeHtml(row.outcomeKey)}">${escapeHtml(row.outcome)}</span></td>
      </tr>`).join("");
  }

  function renderHtml(model) {
    const omitted = model.omittedRoutineCount > 0
      ? `<p class="print-omitted-note">${escapeHtml(model.omittedRoutineCount)} additional routine entered ${model.omittedRoutineCount === 1 ? "value will" : "values will"} be included in the generated PDF if an additional page is required.</p>`
      : "";
    return `
      <article class="assessment-print-sheet" aria-label="Concise SACTCheck clinical assessment summary">
        <header class="print-sheet-header">
          <div><span class="print-eyebrow">SACTCheck treatment assessment</span><h2>${escapeHtml(model.protocolTitle)}</h2></div>
          <div class="print-document-id"><strong>${escapeHtml(model.sourceLabel)}</strong><span>SACTCheck v${escapeHtml(model.appVersion)}</span></div>
        </header>

        <dl class="print-meta-grid">
          <div><dt>Tumour group</dt><dd>${escapeHtml(model.tumourGroup)}</dd></div>
          <div><dt>Indication</dt><dd>${escapeHtml(model.indication)}</dd></div>
          <div><dt>Course</dt><dd>${escapeHtml(model.course)}</dd></div>
          <div><dt>Treatment context</dt><dd>${escapeHtml(model.treatmentContext)}</dd></div>
          <div><dt>Assessment ID</dt><dd>${escapeHtml(model.assessmentId)}</dd></div>
          <div><dt>Assessment time</dt><dd>${escapeHtml(model.assessedAt)}</dd></div>
        </dl>

        <section class="print-outcome print-outcome-${escapeHtml(model.outcome.key)}">
          <span>Encoded criteria result</span>
          <strong>${escapeHtml(model.outcome.title)}</strong>
          <p>${escapeHtml(model.outcome.detail)}</p>
        </section>

        <section class="print-values-section">
          <div class="print-section-heading"><h3>Entered values and encoded criteria</h3><span>${escapeHtml(model.assessmentProfile)}</span></div>
          <table class="print-values-table">
            <thead><tr><th>Domain</th><th>Entered value</th><th>Encoded criterion</th><th>Result</th></tr></thead>
            <tbody>${renderRows(model.rows)}</tbody>
          </table>
          ${omitted}
        </section>

        <div class="print-summary-grid">
          <section><h3>Unassessed domains</h3><p>${escapeHtml(model.unassessed)}</p><small>Blank domains were not assumed normal.</small></section>
          <section><h3>Clinician decision</h3><p><strong>${escapeHtml(model.clinicianDecision)}</strong></p><small>${escapeHtml(model.clinicianNote)}</small></section>
        </div>

        <footer class="print-sheet-footer">
          <strong>Clinical decision support - not treatment clearance.</strong>
          <p>${escapeHtml(model.disclaimer)}</p>
        </footer>
      </article>`;
  }

  function toText(model) {
    const lines = [
      "SACTCheck treatment assessment",
      `${model.protocolTitle} - ${model.sourceLabel}`,
      `Tumour group: ${model.tumourGroup}`,
      `Indication: ${model.indication}`,
      `Course: ${model.course}`,
      `Treatment context: ${model.treatmentContext}`,
      `Assessment ID: ${model.assessmentId}`,
      `Assessment time: ${model.assessedAt}`,
      "",
      `Encoded criteria result: ${model.outcome.title}`,
      model.outcome.detail,
      "",
      "Entered values and encoded criteria:"
    ];
    const textRows = model.allRows?.length ? model.allRows : model.rows;
    if (textRows.length) {
      textRows.forEach(row => lines.push(`- ${row.label}: ${row.actual} | ${row.criterion} | ${row.outcome}`));
    } else {
      lines.push("- No printable criterion row generated.");
    }
    lines.push(
      "",
      `Unassessed domains: ${model.unassessed}`,
      `Clinician decision: ${model.clinicianDecision}`,
      `Decision rationale/override: ${model.clinicianNote}`,
      "",
      `Disclaimer: ${model.disclaimer}`
    );
    return lines.join("\n");
  }

  return Object.freeze({
    version: VERSION,
    disclaimer: DISCLAIMER,
    outcomeFor,
    findingRows,
    buildModel,
    renderHtml,
    toText
  });
});
