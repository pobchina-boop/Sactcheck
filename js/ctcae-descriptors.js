(function (root) {
  "use strict";

  const GENERIC = {
    0: "No toxicity",
    1: "Mild; asymptomatic or mild symptoms; intervention usually not required",
    2: "Moderate; minimal/local/non-invasive intervention; limits instrumental ADLs",
    3: "Severe or medically significant; often requires hospital care; limits self-care ADLs",
    4: "Life-threatening consequences; urgent intervention required",
    5: "Death related to the adverse event"
  };

  const SETS = {
    neuropathy: {
      0: "No neuropathy",
      1: "Mild symptoms; no functional limitation",
      2: "Moderate symptoms; limits instrumental ADLs",
      3: "Severe symptoms; limits self-care ADLs",
      4: "Life-threatening consequences; urgent intervention required",
      5: "Death related to neuropathy"
    },
    diarrhoea: {
      0: "No increase over baseline",
      1: "Increase of <4 stools/day over baseline",
      2: "Increase of 4–6 stools/day over baseline; limits instrumental ADLs",
      3: "Increase of ≥7 stools/day, incontinence or hospitalisation indicated; limits self-care ADLs",
      4: "Life-threatening consequences; urgent intervention required",
      5: "Death related to diarrhoea/colitis"
    },
    mucositis: {
      0: "No oral mucosal toxicity",
      1: "Asymptomatic or mild symptoms; intervention not indicated",
      2: "Moderate pain or ulceration; modified diet indicated",
      3: "Severe pain; interferes with oral intake",
      4: "Life-threatening consequences; urgent intervention required",
      5: "Death related to mucositis"
    },
    pneumonitis: {
      0: "No pneumonitis",
      1: "Asymptomatic; clinical or diagnostic observations only",
      2: "Symptomatic; medical intervention indicated; limits instrumental ADLs",
      3: "Severe symptoms; oxygen indicated; limits self-care ADLs",
      4: "Life-threatening respiratory compromise; urgent intervention indicated",
      5: "Death related to pneumonitis"
    },
    rash: {
      0: "No rash",
      1: "Limited skin involvement; mild or no symptoms",
      2: "Moderate/widespread involvement; limits instrumental ADLs",
      3: "Severe or extensive involvement; limits self-care ADLs",
      4: "Life-threatening skin reaction; urgent intervention required",
      5: "Death related to skin toxicity"
    },
    infusion: {
      0: "No infusion or hypersensitivity reaction",
      1: "Mild transient reaction; infusion interruption not indicated",
      2: "Therapy or infusion interruption indicated; responds promptly to symptomatic treatment",
      3: "Prolonged or recurrent reaction; hospitalisation may be indicated",
      4: "Life-threatening consequences; urgent intervention required",
      5: "Death related to reaction"
    },
    hypertension: {
      0: "No treatment-related hypertension",
      1: "Transient or mild elevation; no treatment required",
      2: "Persistent/recurrent elevation; single-agent treatment indicated",
      3: "Requires more than one drug or more intensive treatment",
      4: "Life-threatening consequences; urgent intervention required",
      5: "Death related to hypertension"
    },
    proteinuria: {
      0: "No proteinuria",
      1: "Mild proteinuria",
      2: "Moderate proteinuria; diagnostic quantification/monitoring indicated",
      3: "Severe proteinuria or nephrotic-range features",
      4: "Life-threatening renal consequences; urgent intervention required",
      5: "Death related to renal toxicity"
    },
    haemorrhage: {
      0: "No haemorrhage",
      1: "Mild bleeding; intervention not indicated",
      2: "Moderate bleeding; medical intervention indicated",
      3: "Severe bleeding; transfusion, invasive intervention or hospitalisation indicated",
      4: "Life-threatening bleeding; urgent intervention required",
      5: "Death related to haemorrhage"
    },
    infection: {
      0: "No infection",
      1: "Localised infection; local intervention indicated",
      2: "Oral or non-invasive systemic treatment indicated",
      3: "IV antimicrobial, invasive intervention or hospitalisation indicated",
      4: "Life-threatening infection; urgent intervention required",
      5: "Death related to infection"
    },
    ppe: {
      0: "No palmar–plantar erythrodysesthesia",
      1: "Minimal skin changes or dermatitis without pain",
      2: "Painful skin changes; limits instrumental ADLs",
      3: "Severe painful skin changes; limits self-care ADLs",
      4: "Life-threatening consequences; urgent intervention required",
      5: "Death related to skin toxicity"
    },
    cardiac: {
      0: "No cardiac toxicity",
      1: "Mild or asymptomatic findings",
      2: "Moderate symptoms; medical intervention indicated",
      3: "Severe symptoms; hospitalisation or intensive treatment indicated",
      4: "Life-threatening cardiac compromise; urgent intervention required",
      5: "Death related to cardiac toxicity"
    },
    neurological: {
      0: "No neurological toxicity",
      1: "Mild symptoms; no functional limitation",
      2: "Moderate symptoms; limits instrumental ADLs",
      3: "Severe symptoms; limits self-care ADLs or hospitalisation indicated",
      4: "Life-threatening neurological compromise; urgent intervention required",
      5: "Death related to neurological toxicity"
    },
    hepatic: {
      0: "No graded hepatic abnormality",
      1: "Mild laboratory abnormality",
      2: "Moderate laboratory abnormality",
      3: "Severe laboratory abnormality",
      4: "Life-threatening hepatic consequences",
      5: "Death related to hepatic toxicity"
    }
  };

  function normalise(definition) {
    return `${definition?.id || ""} ${definition?.label || ""}`.toLowerCase();
  }

  function categoryFor(definition) {
    const text = normalise(definition);
    if (/neuropathy|neurotoxicity/.test(text)) return "neuropathy";
    if (/diarrhoea|diarrhea|colitis/.test(text)) return "diarrhoea";
    if (/stomatitis|mucositis/.test(text)) return "mucositis";
    if (/pneumonitis/.test(text)) return "pneumonitis";
    if (/rash|skin reaction/.test(text)) return "rash";
    if (/infusion|hypersensitivity|allergic|anaphyl/.test(text)) return "infusion";
    if (/hypertension/.test(text)) return "hypertension";
    if (/proteinuria/.test(text)) return "proteinuria";
    if (/haemorrhage|hemorrhage|bleeding/.test(text)) return "haemorrhage";
    if (/infection/.test(text)) return "infection";
    if (/palmar|plantar|ppe/.test(text)) return "ppe";
    if (/myocarditis|pericard|cardiac/.test(text)) return "cardiac";
    if (/encephalitis|guillain|myositis|neurological/.test(text)) return "neurological";
    if (/ast|alt|bilirubin|hepatic|transamin/.test(text)) return "hepatic";
    return null;
  }

  function numericGrade(value, label) {
    if (value !== undefined && value !== null && value !== "" && Number.isFinite(Number(value))) return Number(value);
    const match = String(label || "").match(/grade\s*([0-5])/i);
    return match ? Number(match[1]) : null;
  }

  function descriptor(definition, option) {
    const grade = numericGrade(option?.value, option?.label);
    if (grade === null) return "";
    const category = categoryFor(definition);
    return (category && SETS[category]?.[grade]) || GENERIC[grade] || "";
  }

  function optionLabel(definition, option) {
    const base = option?.label ?? option?.value ?? "";
    const description = descriptor(definition, option);
    if (!description || String(base).includes("—")) return String(base);
    return `${base} — ${description}`;
  }

  root.SACTCheckCTCAE = {
    version: "CTCAE v5.0 educational descriptors",
    generic: GENERIC,
    sets: SETS,
    categoryFor,
    descriptor,
    optionLabel
  };
})(window);
