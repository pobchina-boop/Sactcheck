/**
 * SACTCheck regimen-course metadata utilities.
 *
 * Pure, DOM-independent functions used by both the browser card renderer and
 * the repository backfill/audit tool. The module deliberately avoids inventing
 * treatment intent or duration when the source protocol is ambiguous.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.SACTCheckRegimenCourseMetadata = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const VERSION = "1.0.0";

  const INTENT_LABELS = Object.freeze({
    neoadjuvant: "Neoadjuvant",
    adjuvant: "Adjuvant",
    curative: "Curative",
    palliative: "Palliative",
    maintenance: "Maintenance",
    consolidation: "Consolidation",
    advanced_disease: "Advanced disease"
  });

  function asArray(value) {
    if (Array.isArray(value)) return value;
    if (value === null || value === undefined || value === "") return [];
    return [value];
  }

  function cleanText(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim();
  }

  function unique(values) {
    return [...new Set(values.filter(value => value !== null && value !== undefined && value !== ""))];
  }

  function firstFinite(...values) {
    for (const value of values) {
      const number = Number(value);
      if (Number.isFinite(number) && number > 0) return number;
    }
    return null;
  }

  function normaliseIntent(value) {
    const text = cleanText(value).toLowerCase().replace(/[\s-]+/g, "_");
    if (!text) return null;
    if (INTENT_LABELS[text]) return text;
    if (text.includes("neoadjuvant")) return "neoadjuvant";
    if (text.includes("adjuvant")) return "adjuvant";
    if (text.includes("palliative")) return "palliative";
    if (text.includes("maintenance")) return "maintenance";
    if (text.includes("consolidation")) return "consolidation";
    if (text.includes("curative")) return "curative";
    if (/(advanced|metastatic|recurrent)/.test(text)) return "advanced_disease";
    return null;
  }

  function inferIntent(text) {
    const value = cleanText(text).toLowerCase();
    if (!value) return null;

    // Order matters: "neoadjuvant" contains "adjuvant".
    if (/\bneo[- ]?adjuvant\b/.test(value)) return "neoadjuvant";
    if (/\badjuvant\b/.test(value)) return "adjuvant";
    if (/\bpalliative\b/.test(value)) return "palliative";
    if (/\bmaintenance\b/.test(value)) return "maintenance";
    if (/\bconsolidation\b/.test(value)) return "consolidation";
    if (/\bcurative\b/.test(value)) return "curative";

    // Advanced/metastatic disease is not automatically labelled palliative.
    // It receives a factual disease-context label unless palliative is explicit.
    if (/\b(advanced|metastatic|recurrent)\b/.test(value)) return "advanced_disease";
    return null;
  }

  function intentLabel(intent) {
    return INTENT_LABELS[normaliseIntent(intent)] || cleanText(intent) || null;
  }

  function phaseAppliesToIndication(phase, indicationId) {
    const ids = unique([
      ...asArray(phase?.indication_id),
      ...asArray(phase?.indication_ids),
      ...asArray(phase?.applies_to_indications)
    ].map(cleanText));
    return ids.length === 0 || !indicationId || ids.includes(indicationId);
  }

  function cycleLengthFromText(value) {
    const text = cleanText(value).toLowerCase();
    if (!text) return null;
    let match = text.match(/\b(?:every|q)\s*(\d+(?:\.\d+)?)\s*days?\b/);
    if (match) return Number(match[1]);
    match = text.match(/\b(\d+(?:\.\d+)?)\s*[- ]?day\s+cycles?\b/);
    if (match) return Number(match[1]);
    match = text.match(/\b(?:every|q)\s*(\d+(?:\.\d+)?)\s*weeks?\b/);
    if (match) return Number(match[1]) * 7;
    match = text.match(/\b(\d+(?:\.\d+)?)\s*[- ]?weeks?\b/);
    if (match && /therapy|cycle|every|q/.test(text)) return Number(match[1]) * 7;
    if (/\bweekly\b/.test(text)) return 7;
    if (/\bfortnightly\b|\bbiweekly\b/.test(text)) return 14;
    return null;
  }

  function cycleLengthFromObject(value) {
    if (!value || typeof value !== "object") return null;
    const days = firstFinite(
      value.cycle_length_days,
      value.cycleLengthDays,
      value.cycle_days,
      value.cycleDays,
      value.interval_days,
      value.intervalDays,
      value.repeat_every_days
    );
    if (days) return days;
    const weeks = firstFinite(value.cycle_length_weeks, value.interval_weeks, value.repeat_every_weeks);
    if (weeks) return weeks * 7;
    return cycleLengthFromText([
      value.schedule_summary,
      value.schedule,
      value.cycle,
      value.frequency,
      value.title,
      value.duration
    ].map(cleanText).filter(Boolean).join(". "));
  }

  function durationFromStructuredObject(value) {
    if (!value || typeof value !== "object") return null;

    const type = cleanText(value.duration_type || value.durationType || value.type).toLowerCase();
    const plannedCycles = firstFinite(value.planned_cycles, value.plannedCycles, value.number_of_cycles, value.cycle_count);
    const maximumCycles = firstFinite(value.maximum_cycles, value.maximumCycles, value.max_cycles, value.maxCycles);
    const durationText = cleanText(value.duration_text || value.durationText || value.text || value.planned_duration);

    if (maximumCycles) {
      return {
        type: "maximum_cycles",
        maximum_cycles: maximumCycles,
        label: `Up to ${formatNumber(maximumCycles)} cycles`,
        source: "structured"
      };
    }

    if (plannedCycles) {
      return {
        type: "fixed_cycles",
        planned_cycles: plannedCycles,
        label: `${formatNumber(plannedCycles)} ${plannedCycles === 1 ? "cycle" : "cycles"}`,
        source: "structured"
      };
    }

    if (typeof value.cycles === "number" && value.cycles > 0) {
      return {
        type: "fixed_cycles",
        planned_cycles: value.cycles,
        label: `${formatNumber(value.cycles)} ${value.cycles === 1 ? "cycle" : "cycles"}`,
        source: "structured"
      };
    }

    if (Array.isArray(value.cycles) && value.cycles.length) {
      const numbers = value.cycles.map(Number).filter(Number.isFinite).sort((a, b) => a - b);
      const consecutive = numbers.length === value.cycles.length && numbers.every((number, index) => number === index + 1);
      if (consecutive) {
        return {
          type: "fixed_cycles",
          planned_cycles: numbers.length,
          label: `${numbers.length} ${numbers.length === 1 ? "cycle" : "cycles"}`,
          source: "structured"
        };
      }
    }

    if (["until_progression_or_toxicity", "until_progression", "continuous_until_progression"].includes(type)) {
      return {
        type: "until_progression_or_toxicity",
        label: "Until progression/toxicity",
        source: "structured"
      };
    }
    if (type === "single_dose") return { type, label: "Single dose", source: "structured" };
    if (type === "continuous") return { type, label: "Continuous", source: "structured" };

    if (durationText) return durationFromText(durationText, "structured_text");
    return null;
  }

  function parseCountToken(value) {
    const words = {
      one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
      seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12
    };
    const text = cleanText(value).toLowerCase();
    if (Object.prototype.hasOwnProperty.call(words, text)) return words[text];
    const number = Number(text);
    return Number.isFinite(number) && number > 0 ? number : null;
  }

  function durationFromText(text, source = "text") {
    const original = cleanText(text);
    const value = original.toLowerCase();
    if (!value) return null;

    const countToken = "(\\d+(?:\\.\\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)";

    let match = value.match(new RegExp(`\\b${countToken}\\s+induction cycles?\\b.{0,120}\\b(?:followed by|then)\\b.{0,80}\\bmaintenance\\b`));
    if (match) {
      const cycles = parseCountToken(match[1]);
      return {
        type: "phased_course",
        planned_cycles: cycles,
        label: `${formatNumber(cycles)} induction cycles → maintenance`,
        source
      };
    }

    match = value.match(new RegExp(`\\b(?:up to|maximum(?: of)?|max(?:imum)?\\.?)[^0-9a-z]{0,12}${countToken}\\s*cycles?\\b`));
    if (match) {
      const maximumCycles = parseCountToken(match[1]);
      return {
        type: "maximum_cycles",
        maximum_cycles: maximumCycles,
        label: `Up to ${formatNumber(maximumCycles)} cycles`,
        source
      };
    }

    match = value.match(new RegExp(`\\b(?:(?:for|usually)\\s+)?${countToken}\\s*cycles?\\b`));
    if (match) {
      const plannedCycles = parseCountToken(match[1]);
      return {
        type: "fixed_cycles",
        planned_cycles: plannedCycles,
        label: `${formatNumber(plannedCycles)} ${plannedCycles === 1 ? "cycle" : "cycles"}`,
        source
      };
    }

    if (/\buntil\b.{0,80}\bprogression\b/.test(value) || /\buntil\b.{0,80}\bunacceptable toxicity\b/.test(value)) {
      return {
        type: "until_progression_or_toxicity",
        label: "Until progression/toxicity",
        source
      };
    }

    if (/\bsingle dose\b|\bone[- ]off dose\b/.test(value)) {
      return { type: "single_dose", label: "Single dose", source };
    }

    // Time-limited treatment is displayed as written; it is not converted into
    // a cycle count because cycle interruptions and mixed phases can invalidate
    // a simple arithmetic conversion.
    match = value.match(/\b(?:up to|for)\s+(\d+(?:\.\d+)?)\s*(weeks?|months?|years?)\b/);
    if (match) {
      const amount = Number(match[1]);
      const unit = match[2].replace(/s$/, "");
      const prefix = value.slice(Math.max(0, match.index - 5), match.index + 5).includes("up to") ? "Up to " : "";
      return {
        type: "fixed_duration",
        duration_value: amount,
        duration_unit: unit,
        label: `${prefix}${formatNumber(amount)} ${unit}${amount === 1 ? "" : "s"}`,
        source
      };
    }

    return null;
  }

  function durationKey(duration) {
    if (!duration) return "";
    return [
      duration.type,
      duration.planned_cycles,
      duration.maximum_cycles,
      duration.duration_value,
      duration.duration_unit,
      duration.label
    ].join("|");
  }

  function formatNumber(value) {
    const number = Number(value);
    return Number.isInteger(number) ? String(number) : String(number).replace(/\.0+$/, "");
  }

  function formatInterval(days) {
    const number = Number(days);
    if (!Number.isFinite(number) || number <= 0) return null;
    return `q${formatNumber(number)}d`;
  }

  function canonicalContexts(protocol) {
    const card = protocol?.metadata?.regimen_card || protocol?.metadata?.regimenCard;
    if (!card || typeof card !== "object") return [];

    const contexts = asArray(card.contexts).filter(item => item && typeof item === "object");
    if (contexts.length) {
      return contexts.map((context, index) => normaliseContext(context, `context_${index + 1}`));
    }

    const flat = normaliseContext(card, "default");
    const hasValue = flat.intent || flat.cycle_length_days || flat.duration;
    return hasValue ? [flat] : [];
  }

  function normaliseContext(context, fallbackId) {
    const duration = durationFromStructuredObject(context) || durationFromText(context?.duration_text || context?.durationText || "");
    const intent = normaliseIntent(context?.intent || context?.treatment_intent || context?.treatmentIntent);
    const cycleLengthDays = cycleLengthFromObject(context);
    const explicitUnresolved = asArray(context?.requires_review || context?.unresolved).map(cleanText).filter(Boolean);
    return {
      id: cleanText(context?.id || context?.context_id || context?.indication_id || fallbackId),
      indication_id: cleanText(context?.indication_id || context?.indicationId) || null,
      intent,
      intent_label: intentLabel(context?.intent_label || context?.intentLabel || intent),
      cycle_length_days: cycleLengthDays,
      duration,
      provenance: cleanText(context?.provenance || context?.source) || "canonical",
      unresolved: unique([
        ...explicitUnresolved,
        ...(intent ? [] : ["intent"]),
        ...(cycleLengthDays ? [] : ["cycle_length"]),
        ...(duration ? [] : ["duration"])
      ])
    };
  }

  function deriveContexts(protocol) {
    const canonical = canonicalContexts(protocol);
    if (canonical.length) return canonical;

    const metadata = protocol?.metadata || {};
    const treatment = protocol?.treatment && typeof protocol.treatment === "object" ? protocol.treatment : {};
    const indications = asArray(protocol?.indications).filter(item => item && typeof item === "object");
    const hasExplicitIndications = indications.length > 0;
    const phases = asArray(protocol?.treatment_phases).filter(item => item && typeof item === "object");
    const settingText = [
      ...asArray(metadata.treatment_setting),
      ...asArray(metadata.treatment_context)
    ].map(cleanText).filter(Boolean).join(". ");
    const baseText = [
      metadata.title,
      metadata.short_title,
      metadata.indication,
      treatment.schedule_summary,
      treatment.duration,
      settingText
    ].map(cleanText).filter(Boolean).join(". ");

    const indicationContexts = indications.length ? indications : [{ indication_id: null, description: baseText }];

    return indicationContexts.map((indication, index) => {
      const indicationId = cleanText(indication.indication_id || indication.id || indication.code) || null;
      const specificText = [indication.description, indication.indication, indication.title]
        .map(cleanText)
        .filter(Boolean)
        .join(". ");
      const relevantPhases = phases.filter(phase => phaseAppliesToIndication(phase, indicationId));

      const cycleLengths = unique([
        cycleLengthFromObject(indication),
        ...relevantPhases.map(cycleLengthFromObject),
        cycleLengthFromObject(treatment),
        cycleLengthFromObject(metadata),
        cycleLengthFromText(specificText),
        cycleLengthFromText(baseText)
      ].filter(Boolean));

      const indicationDuration = durationFromStructuredObject(indication) || durationFromText(specificText);
      const treatmentDuration = durationFromStructuredObject(treatment)
        || durationFromText(treatment.duration || treatment.schedule_summary || "");
      const metadataDuration = durationFromStructuredObject(metadata)
        || (!hasExplicitIndications || indications.length === 1 ? durationFromText(baseText) : null);
      const phaseDurations = relevantPhases.map(durationFromStructuredObject);
      const populatedPhaseDurations = phaseDurations.filter(Boolean);
      const uniquePhaseDurations = unique(populatedPhaseDurations.map(durationKey));
      const phaseDuration = relevantPhases.length === 1
        ? populatedPhaseDurations[0] || null
        : relevantPhases.length > 1 && populatedPhaseDurations.length === relevantPhases.length && uniquePhaseDurations.length === 1
          ? populatedPhaseDurations[0]
          : null;
      const duration = indicationDuration || treatmentDuration || metadataDuration || phaseDuration;
      const durationAmbiguous = !duration && relevantPhases.length > 1 && populatedPhaseDurations.length > 0;

      const explicitIntent = normaliseIntent(
        indication.intent || indication.treatment_intent || metadata.intent || metadata.treatment_intent
      );
      const intent = explicitIntent || inferIntent(specificText) || inferIntent(settingText)
        || (!hasExplicitIndications ? inferIntent(baseText) : null);

      return {
        id: indicationId || `context_${index + 1}`,
        indication_id: indicationId,
        intent,
        intent_label: intentLabel(intent),
        cycle_length_days: cycleLengths.length === 1 ? cycleLengths[0] : null,
        duration,
        provenance: "derived_from_existing_protocol_json",
        unresolved: [
          ...(intent ? [] : ["intent"]),
          ...(cycleLengths.length === 1 ? [] : [cycleLengths.length > 1 ? "cycle_length_varies" : "cycle_length"]),
          ...(duration ? [] : [durationAmbiguous ? "duration_multiphase" : "duration"])
        ]
      };
    });
  }

  function summarise(protocol) {
    const contexts = deriveContexts(protocol);
    const intentValues = contexts.map(context => context.intent_label || null);
    const intervalValues = contexts.map(context => formatInterval(context.cycle_length_days) || null);
    const durationValues = contexts.map(context => context.duration?.label || null);
    const intents = unique(intentValues);
    const intervals = unique(intervalValues);
    const durations = unique(durationValues);
    const unresolved = unique(contexts.flatMap(context => asArray(context.unresolved)));

    const intentLabelSummary = intentValues.includes(null) && contexts.length > 1
      ? "Multiple indications"
      : intents.length === 1
        ? intents[0]
        : intents.length > 1
          ? intents.slice(0, 3).join(" / ") + (intents.length > 3 ? " +" : "")
          : null;

    const intervalLabelSummary = intervals.length === 1 && !intervalValues.includes(null)
      ? intervals[0]
      : intervals.length || intervalValues.some(Boolean)
        ? "Variable schedule"
        : null;

    const durationLabelSummary = durations.length === 1 && !durationValues.includes(null)
      ? durations[0]
      : durations.length || durationValues.some(Boolean)
        ? "Indication-dependent"
        : null;

    return {
      version: VERSION,
      contexts,
      intent: intentLabelSummary,
      interval: intervalLabelSummary,
      duration: durationLabelSummary,
      tokens: [intentLabelSummary, durationLabelSummary, intervalLabelSummary].filter(Boolean),
      unresolved,
      complete: Boolean(intentLabelSummary && intervalLabelSummary && durationLabelSummary && unresolved.length === 0)
    };
  }

  function serialisableRegimenCard(protocol) {
    const summary = summarise(protocol);
    return {
      schema_version: VERSION,
      contexts: summary.contexts.map(context => {
        const output = { id: context.id };
        if (context.indication_id) output.indication_id = context.indication_id;
        if (context.intent) output.intent = context.intent;
        if (context.intent_label) output.intent_label = context.intent_label;
        if (context.cycle_length_days) output.cycle_length_days = context.cycle_length_days;
        if (context.duration) {
          output.duration_type = context.duration.type;
          if (context.duration.planned_cycles) output.planned_cycles = context.duration.planned_cycles;
          if (context.duration.maximum_cycles) output.maximum_cycles = context.duration.maximum_cycles;
          if (context.duration.duration_value) output.duration_value = context.duration.duration_value;
          if (context.duration.duration_unit) output.duration_unit = context.duration.duration_unit;
          output.duration_text = context.duration.label;
        }
        if (context.unresolved?.length) output.requires_review = context.unresolved;
        return output;
      }),
      display: {
        intent: summary.intent,
        duration: summary.duration,
        cycle_interval: summary.interval
      },
      provenance: {
        method: "derived_from_existing_protocol_json",
        reviewed: false,
        unresolved: summary.unresolved
      }
    };
  }

  return Object.freeze({
    version: VERSION,
    INTENT_LABELS,
    asArray,
    cleanText,
    normaliseIntent,
    inferIntent,
    intentLabel,
    cycleLengthFromObject,
    cycleLengthFromText,
    durationFromStructuredObject,
    durationFromText,
    formatInterval,
    deriveContexts,
    summarise,
    serialisableRegimenCard
  });
});
