#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Iterable

ROOT = Path(__file__).resolve().parents[1]
PROTOCOL_ROOT = ROOT / "protocols"
RELEASE = "0.37.0"
NCCP_ANTIEMETIC_URL = "https://healthservice.hse.ie/documents/7152/Classification_Document_for_Systemic_Anti-_Cancer_Therapy_SACT_Induced_Nausea__pWgDCrm.pdf"
NCI_CTCAE_URL = "https://dctd.cancer.gov/research/ctep-trials/for-sites/adverse-events/ctcae-v5-5x7.pdf"

SECTION_LABELS = {
    "chemotherapy_combination_sact": "Chemotherapy & combination SACT",
    "targeted_her2_therapy": "Targeted & HER2 therapies",
    "immunotherapy": "Immunotherapy",
    "endocrine_hormonal_therapy": "Endocrine (hormonal) therapies",
    "bone_modifying_therapy": "Bone-modifying therapies",
    "supportive_other": "Other SACT / supportive therapy",
}

PURE_ENDOCRINE = ("tamoxifen", "anastrozole", "letrozole", "exemestane", "fulvestrant")
BONE = ("zoledronic", "denosumab")
ICI = ("pembrolizumab", "nivolumab", "durvalumab", "atezolizumab", "avelumab", "ipilimumab", "tremelimumab")
HER2 = ("trastuzumab", "pertuzumab", "phesgo", "t-dm1", "emtansine", "deruxtecan", "tucatinib", "lapatinib", "neratinib")
ADC = ("sacituzumab", "deruxtecan", "emtansine", "t-dm1", "mirvetuximab")
CDK = ("palbociclib", "ribociclib", "abemaciclib")
PARP = ("olaparib", "niraparib", "talazoparib")
ANTIANGIOGENIC = ("bevacizumab", "aflibercept", "ramucirumab")
ORAL_TARGETED = (
    "palbociclib", "ribociclib", "abemaciclib", "everolimus", "lapatinib", "neratinib", "tucatinib",
    "olaparib", "niraparib", "talazoparib", "regorafenib", "trifluridine", "tipiracil",
    "afatinib", "osimertinib", "gefitinib", "erlotinib", "crizotinib", "alectinib", "lorlatinib",
)
CYTOTOXIC = (
    "paclitaxel", "nab-paclitaxel", "docetaxel", "carboplatin", "cisplatin", "cyclophosphamide",
    "doxorubicin", "epirubicin", "fluorouracil", "5-fluorouracil", "5fu", "gemcitabine", "vinorelbine",
    "eribulin", "oxaliplatin", "irinotecan", "etoposide", "pemetrexed", "methotrexate", "capecitabine",
    "pegylated liposomal", "sacituzumab", "trifluridine", "tipiracil",
    "folfox", "folfiri", "folfirinox", "folfoxiri", "capox", "xelox", "cmf", "fec",
)

# Protocol-level overrides for titles that intentionally omit dose/component detail.
# These prevent the UI from pretending a precise mapping can be inferred where the
# NCCP title is abbreviated or the companion component is not fixed.
EMETOGENIC_CODE_OVERRIDES = {
    "00209": {"level": "moderate", "script_id": "nccp-parenteral-moderate", "basis": "FOLFOX contains oxaliplatin, a moderate emetogenic-risk component in NCCP V6 Table 7.", "confidence": "high"},
    "00227": {"level": "moderate", "script_id": "nccp-parenteral-moderate", "basis": "FOLFIRI contains irinotecan, a moderate emetogenic-risk component in NCCP V6 Table 7.", "confidence": "high"},
    "00329": {"level": "moderate", "script_id": "nccp-parenteral-moderate", "basis": "FOLFIRINOX contains irinotecan and oxaliplatin; the highest active component is moderate risk in NCCP V6 Table 7.", "confidence": "high"},
    "00447": {"level": "moderate", "script_id": "nccp-parenteral-moderate", "basis": "Panitumumab is minimal risk and modified FOLFOX-6 is driven by oxaliplatin, which is moderate risk.", "confidence": "high"},
    "00448": {"level": "moderate", "script_id": "nccp-parenteral-moderate", "basis": "Panitumumab is minimal risk and FOLFIRI is driven by irinotecan, which is moderate risk.", "confidence": "high"},
    "00515": {"level": "moderate", "script_id": "nccp-parenteral-moderate", "basis": "Modified FOLFIRINOX contains irinotecan and oxaliplatin; the highest active component is moderate risk.", "confidence": "high"},
    "00555": {"level": "moderate", "script_id": "nccp-parenteral-moderate", "basis": "FOLFOXIRI contains irinotecan and oxaliplatin; the highest active component is moderate risk.", "confidence": "high"},
    "00731": {"level": "high", "script_id": "nccp-parenteral-high", "basis": "TCHP-type regimen with carboplatin used at the protocol treatment dose; mapped to high-risk prophylaxis pending local pharmacy validation.", "confidence": "moderate"},
}

# CTCAE category names correspond to js/ctcae-descriptors.js.
CTCAE_GUIDANCE = {
    "neuropathy": "Assess sensory and/or motor symptoms and their effect on instrumental versus self-care activities of daily living. Distinguish transient cold sensitivity from persistent functional neuropathy.",
    "diarrhoea": "Count stools per day above the patient's baseline, assess ostomy output, continence, hydration, fever, abdominal pain, haemodynamic compromise and whether hospital care is indicated.",
    "diarrhoea_or_colitis": "Assess stool frequency above baseline and also assess abdominal pain, mucus/blood in stool and peritoneal signs. Grade diarrhoea and colitis separately using CTCAE v5.0, then enter the higher applicable grade and document which term determines it.",
    "mucositis": "Inspect the oral cavity and assess pain, ulceration, diet modification and whether oral intake is impaired.",
    "mucositis_or_diarrhoea": "Assess both oral mucositis and diarrhoea using their separate CTCAE v5.0 definitions, then enter the higher applicable grade. Document which toxicity determines the grade.",
    "pneumonitis": "Assess new cough, dyspnoea, oxygen requirement, imaging findings, infection and alternative causes. Immune-related or drug-related pneumonitis requires urgent senior review when symptomatic.",
    "rash": "Assess morphology, body-surface area, symptoms, mucosal involvement, blistering, systemic features and effect on daily activities. Use the specific CTCAE skin term where possible.",
    "rash_acneiform": "Assess papules/pustules, body-surface area, pruritus/tenderness, psychosocial and functional impact, and local or extensive superinfection.",
    "infusion": "Document timing, symptoms, need to interrupt treatment, response to symptomatic therapy, recurrence, hospitalisation and any airway or haemodynamic compromise.",
    "allergic_reaction": "Assess whether systemic treatment is required, route of treatment, bronchospasm, angioedema, hypotension, hospitalisation and life-threatening features. If the event is infusion-related, use the CTCAE infusion-related reaction term rather than double-reporting both.",
    "hypersensitivity_anaphylaxis": "Assess bronchospasm, urticaria, angioedema, hypotension, airway compromise, treatment route and hospitalisation. Anaphylaxis or life-threatening hypersensitivity requires immediate emergency treatment.",
    "hypertension": "Use repeated, correctly measured blood pressure readings and record whether antihypertensive treatment or urgent intervention is required.",
    "proteinuria": "Use the protocol-specified urine test (dipstick, protein:creatinine ratio or 24-hour collection) and assess for nephrotic syndrome or renal impairment.",
    "haemorrhage": "Grade using the site-specific CTCAE haemorrhage term, intervention required, transfusion need, hospitalisation and haemodynamic consequences.",
    "infection": "Use the site-specific CTCAE infection term and grade according to local versus systemic treatment, IV antimicrobials, hospitalisation, organ dysfunction and life-threatening consequences.",
    "ppe": "Assess painful erythema, swelling, hyperkeratosis, peeling or blistering of palms/soles and the effect on instrumental or self-care activities.",
    "hfsr": "Assess painful erythema, swelling, hyperkeratosis, peeling or blistering of palms/soles and the effect on instrumental or self-care activities.",
    "fistula": "Use the anatomical site-specific CTCAE fistula term; assess symptoms, need for invasive intervention and life-threatening consequences.",
    "thromboembolism": "Confirm the event and assess symptoms, need for anticoagulation or urgent intervention, hospitalisation, haemodynamic or neurological instability.",
    "febrile_neutropenia": "Confirm ANC and temperature criteria, assess sepsis, haemodynamic stability, organ dysfunction and need for urgent IV antimicrobial treatment.",
    "hepatic_alt_ast": "Use the measured ALT/AST and laboratory ULN; account for an abnormal baseline where CTCAE specifies a baseline-relative definition. Assess bilirubin and alternative causes concurrently.",
    "hepatic_bilirubin": "Use the measured bilirubin and laboratory ULN; account for an abnormal baseline where CTCAE specifies a baseline-relative definition and assess the overall hepatic pattern.",
    "hypomagnesaemia": "Use the measured serum magnesium and local lower limit of normal; assess symptoms, ECG effects and the need for oral or IV replacement.",
    "electrolyte": "Use the named CTCAE electrolyte term, laboratory result and local reference range together with symptoms, ECG effects and replacement requirements.",
    "cardiac": "Use the named cardiac CTCAE term where possible and assess symptoms, biomarkers, ECG/imaging findings, treatment required, hospitalisation and haemodynamic compromise.",
    "myocarditis": "Assess symptoms at rest and with activity, troponin/other biomarkers, ECG, echocardiography or cardiac MRI as appropriate, treatment required and haemodynamic compromise. Suspected immune-mediated myocarditis requires urgent senior review.",
    "neurological": "Use the named neurological CTCAE term where possible and assess objective deficit, instrumental versus self-care ADL limitation, respiratory/bulbar involvement and need for hospitalisation.",
    "encephalitis": "Assess mental status, cognition, seizures, focal neurological findings, functional limitation, airway risk and need for hospital care. Use the most appropriate named CTCAE neurological term and urgently exclude infection and other causes.",
    "guillain_barre": "Assess ascending weakness, reflexes, gait, bulbar or respiratory involvement and impact on instrumental versus self-care activities. Suspected Guillain-Barre syndrome requires urgent neurological and respiratory assessment.",
    "myositis": "Assess pain, objective weakness, CK and other relevant investigations, swallowing or respiratory involvement, and impact on instrumental versus self-care activities. Suspected immune-mediated myositis requires urgent senior review.",
    "serious_neurological": "Identify and document the exact neurological adverse event before grading. Assess objective deficit, instrumental versus self-care ADL limitation, bulbar/respiratory involvement and need for hospitalisation.",
    "pancreatitis": "Assess symptoms, pancreatic enzymes, imaging, oral intake, IV fluid/analgesia requirements, hospitalisation and organ dysfunction.",
    "pericardial": "Assess symptoms, ECG/echo findings, effusion or tamponade physiology, treatment required and haemodynamic compromise.",
    "constipation": "Assess change from baseline, need for laxatives, interference with activities, manual evacuation, obstruction and hospitalisation.",
    "cutaneous": "Use the most specific CTCAE skin term available and assess body-surface area, symptoms, mucosal/systemic involvement and functional impact.",
    "haematological": "Use the specific CTCAE laboratory term and numerical result rather than a generic grade whenever the protocol provides an explicit blood-count threshold.",
    "other_nonhaematological": "Name the exact non-haematological adverse event first and apply that event's own CTCAE v5.0 criterion. The general Grade 1-4 severity anchors are a screening aid only and are not a substitute for the named term.",
    "generic": "Identify the actual adverse event first, then apply that toxicity-specific CTCAE definition. The generic severity anchors are not a substitute for the named CTCAE criterion.",
}


def norm(text: Any) -> str:
    value = str(text or "").lower()
    value = value.replace("–", "-").replace("—", "-").replace("®", "")
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def is_regimen_file(path: Path, data: dict[str, Any]) -> bool:
    if path.name in {"protocol-schema.json", "package.json", "index.json"}:
        return False
    code = str(data.get("metadata", {}).get("nccp_regimen_code") or "")
    if not code or code == "00000" or "_template" in path.parts:
        return False
    return True


def classify_protocol(title: str) -> tuple[str, list[str], bool]:
    t = norm(title)
    classes: list[str] = []

    pure_endocrine = any(token in t for token in PURE_ENDOCRINE)
    bone = any(token in t for token in BONE)
    has_ici = any(token in t for token in ICI)
    has_her2 = any(token in t for token in HER2)
    has_adc = any(token in t for token in ADC)
    has_cdk = any(token in t for token in CDK)
    has_parp = any(token in t for token in PARP)
    has_antiangio = any(token in t for token in ANTIANGIOGENIC)
    has_oral_targeted = any(token in t for token in ORAL_TARGETED)
    has_cytotoxic = any(token in t for token in CYTOTOXIC)
    if any(token in t for token in ("folfox", "folfiri", "folfirinox", "folfoxiri", "capox", "xelox", " cmf", " fec")):
        has_cytotoxic = True

    # Do not count the endocrine partner phrase in abemaciclib as a pure endocrine protocol.
    if has_cdk or has_oral_targeted or "everolimus" in t:
        pure_endocrine = False

    if pure_endocrine:
        section = "endocrine_hormonal_therapy"
        classes.append("endocrine_therapy")
        has_cytotoxic = False
    elif bone:
        section = "bone_modifying_therapy"
        classes.append("bone_modifying_therapy")
        has_cytotoxic = False
    elif has_cytotoxic:
        section = "chemotherapy_combination_sact"
        classes.append("cytotoxic_chemotherapy")
        if any(sep in t for sep in (" and ", "+", "followed by", "/")):
            classes.append("combination_sact")
    elif has_ici:
        section = "immunotherapy"
    elif has_her2 or has_adc or has_cdk or has_parp or has_oral_targeted or has_antiangio:
        section = "targeted_her2_therapy"
    else:
        section = "supportive_other"

    if has_ici:
        classes.append("immunotherapy")
    if has_her2:
        classes.append("her2_targeted_therapy")
    if has_adc:
        classes.append("antibody_drug_conjugate")
    if has_cdk:
        classes.extend(["cdk4_6_inhibitor", "oral_targeted_therapy"])
    if has_parp:
        classes.extend(["parp_inhibitor", "oral_targeted_therapy"])
    if has_oral_targeted and "oral_targeted_therapy" not in classes:
        classes.append("oral_targeted_therapy")
    if has_antiangio:
        classes.append("antiangiogenic_therapy")
    if ("exemestane" in t or "endocrine therapy" in t) and not pure_endocrine:
        classes.append("endocrine_combination")

    # Stable order, no duplicates.
    classes = list(dict.fromkeys(classes))
    return section, classes, has_cytotoxic


def parse_auc(title: str) -> float | None:
    t = norm(title)
    match = re.search(r"auc\s*(\d+(?:\.\d+)?)", t)
    if not match:
        return None
    return float(match.group(1))


def emetogenic_profile(title: str, section: str, code: str = "") -> dict[str, Any]:
    if code in EMETOGENIC_CODE_OVERRIDES:
        return dict(EMETOGENIC_CODE_OVERRIDES[code])
    t = norm(title)

    if section == "endocrine_hormonal_therapy":
        return {
            "level": "minimal",
            "script_id": "nccp-minimal-no-routine-prophylaxis",
            "basis": "Endocrine monotherapy; no routine antiemetic prophylaxis is expected. Manage symptoms individually and follow local policy.",
            "confidence": "high",
        }
    if section == "bone_modifying_therapy":
        return {
            "level": "minimal",
            "script_id": "nccp-minimal-no-routine-prophylaxis",
            "basis": "Bone-modifying monotherapy is not assigned routine antiemetic prophylaxis in this catalogue layer.",
            "confidence": "high",
        }

    # Multi-phase neoadjuvant regimens require phase-specific guidance.
    if "followed by" in t and ("ac" in t or ("doxorubicin" in t and "cyclophosphamide" in t)):
        auc = parse_auc(t)
        carbo_level = "high" if auc is not None and auc >= 4 else "moderate"
        if "carboplatin" not in t:
            carbo_level = "low"
        return {
            "level": "phase_dependent",
            "script_id": None,
            "basis": "Risk changes by treatment phase; use the phase/day-specific profile rather than one regimen-wide script.",
            "confidence": "high",
            "phase_profiles": {
                "taxane_or_weekly_phase": {"level": carbo_level if "carboplatin" in t else "low", "script_id": f"nccp-parenteral-{carbo_level}" if "carboplatin" in t else "nccp-parenteral-low"},
                "anthracycline_cyclophosphamide_phase": {"level": "high", "script_id": "nccp-parenteral-high"},
                **({"adjuvant_immunotherapy_phase": {"level": "minimal", "script_id": "nccp-minimal-no-routine-prophylaxis"}} if "pembrolizumab" in t else {}),
            },
        }

    if "with chemotherapy" in t and ("trastuzumab" in t or "pertuzumab" in t):
        return {
            "level": "variable",
            "script_id": None,
            "basis": "The companion chemotherapy is not fixed in the catalogue title; antiemetic prophylaxis must follow the most emetogenic active component.",
            "confidence": "high",
        }

    # Oral SACT categories from NCCP V6 Table 8.
    oral_mod_high = ("abemaciclib", "olaparib", "ribociclib", "niraparib", "trifluridine", "tipiracil", "oral vinorelbine")
    oral_min_low = ("palbociclib", "capecitabine", "everolimus", "lapatinib", "regorafenib", "talazoparib", "neratinib", "tucatinib")
    if any(token in t for token in oral_mod_high) and not any(token in t for token in ("cisplatin", "carboplatin", "oxaliplatin", "irinotecan", "paclitaxel", "docetaxel")):
        return {"level": "oral_moderate_high", "script_id": "nccp-oral-moderate-high", "basis": "Oral SACT classification from NCCP V6 Table 8.", "confidence": "high"}
    if any(token in t for token in oral_min_low) and not any(token in t for token in ("cisplatin", "carboplatin", "oxaliplatin", "irinotecan", "paclitaxel", "docetaxel")):
        return {"level": "oral_minimal_low", "script_id": "nccp-oral-minimal-low", "basis": "Oral SACT classification from NCCP V6 Table 8.", "confidence": "high"}

    # Parenteral high-risk components.
    if "cisplatin" in t:
        return {"level": "high", "script_id": "nccp-parenteral-high", "basis": "Cisplatin is high emetogenic risk in NCCP V6 Table 7.", "confidence": "high"}
    if "sacituzumab" in t or "trastuzumab deruxtecan" in t:
        return {"level": "high", "script_id": "nccp-parenteral-high", "basis": "The active ADC is high emetogenic risk in NCCP V6 Table 7.", "confidence": "high"}
    if (("doxorubicin" in t or "epirubicin" in t or re.search(r"\bac\b", t)) and "cyclophosphamide" in t):
        return {"level": "high", "script_id": "nccp-parenteral-high", "basis": "Anthracycline/cyclophosphamide combination is high emetogenic risk in NCCP V6 Table 7.", "confidence": "high"}
    if "carboplatin" in t:
        auc = parse_auc(t)
        if auc is not None:
            level = "high" if auc >= 4 else "moderate"
            return {"level": level, "script_id": f"nccp-parenteral-{level}", "basis": f"Carboplatin AUC {auc:g}; NCCP V6 classifies AUC >=4 as high and AUC <4 as moderate.", "confidence": "high"}
        if any(token in t for token in ("tch", "train-2")):
            return {"level": "high", "script_id": "nccp-parenteral-high", "basis": "Carboplatin-containing TCH/TCHP/TRAIN-2 regimen; protocol-specific carboplatin dosing requires high-risk prophylaxis mapping confirmation.", "confidence": "moderate"}
        return {"level": "variable", "script_id": None, "basis": "Carboplatin AUC is not explicit in the catalogue title; classify from the active protocol dose before prescribing antiemetics.", "confidence": "moderate"}

    # Parenteral moderate-risk components.
    if any(token in t for token in ("irinotecan", "oxaliplatin")):
        return {"level": "moderate", "script_id": "nccp-parenteral-moderate", "basis": "Irinotecan and oxaliplatin are moderate emetogenic risk in NCCP V6 Table 7.", "confidence": "high"}
    if "cyclophosphamide" in t:
        return {"level": "moderate", "script_id": "nccp-parenteral-moderate", "basis": "Cyclophosphamide at standard regimen doses is moderate risk unless part of an anthracycline/cyclophosphamide combination.", "confidence": "moderate"}
    if "doxorubicin 50" in t:
        return {"level": "moderate", "script_id": "nccp-parenteral-moderate", "basis": "Doxorubicin below 60 mg/m2 is moderate emetogenic risk in NCCP V6 Table 7.", "confidence": "high"}

    # Parenteral low-risk components.
    low_tokens = ("docetaxel", "paclitaxel", "nab-paclitaxel", "eribulin", "etoposide", "5-fluorouracil", "fluorouracil", "gemcitabine", "pemetrexed", "pegylated liposomal", "trastuzumab emtansine", "t-dm1", "aflibercept", "panitumumab")
    if any(token in t for token in low_tokens):
        script = "docetaxel-cuh-v2" if "docetaxel" in t and all(x not in t for x in ("carboplatin", "cisplatin", "cyclophosphamide", "doxorubicin")) else "nccp-parenteral-low"
        return {"level": "low", "script_id": script, "basis": "Highest active parenteral component is low emetogenic risk in NCCP V6 Table 7.", "confidence": "high"}

    # Minimal-risk biologics and checkpoint inhibitors.
    minimal_tokens = ("pembrolizumab", "nivolumab", "durvalumab", "atezolizumab", "tremelimumab", "bevacizumab", "trastuzumab", "pertuzumab", "phesgo", "intravenous vinorelbine")
    if any(token in t for token in minimal_tokens):
        return {"level": "minimal", "script_id": "nccp-minimal-no-routine-prophylaxis", "basis": "Highest active parenteral component is minimal emetogenic risk in NCCP V6 Table 7.", "confidence": "high"}

    return {"level": "variable", "script_id": None, "basis": "A safe regimen-specific category could not be assigned from the encoded component data; confirm against the NCCP antiemetic classification and local policy.", "confidence": "requires_review"}


def ctcae_category(field_id: str, label: str) -> str:
    text = norm(f"{field_id} {label}")
    if ("mucositis" in text or "stomatitis" in text) and ("diarr" in text or "colitis" in text):
        return "mucositis_or_diarrhoea"
    if re.search(r"non[-_ ]?ha?em|non[-_ ]?hemat|non[-_ ]?haemat", text):
        return "other_nonhaematological"
    if "neuropathy" in text:
        return "neuropathy"
    if "colitis" in text:
        return "diarrhoea_or_colitis"
    if "diarr" in text:
        return "diarrhoea"
    if "stomatitis" in text or "mucositis" in text:
        return "mucositis"
    if "pneumonitis" in text or re.search(r"\bild\b", text):
        return "pneumonitis"
    if "acneiform" in text:
        return "rash_acneiform"
    if "rash" in text:
        return "rash"
    if "infusion" in text:
        return "infusion"
    if "anaphyl" in text:
        return "hypersensitivity_anaphylaxis"
    if "hypersensitivity" in text or "allergic" in text:
        return "allergic_reaction"
    if "hypertension" in text:
        return "hypertension"
    if "proteinuria" in text:
        return "proteinuria"
    if "haemorr" in text or "hemorr" in text or "bleed" in text:
        return "haemorrhage"
    if "infection" in text:
        return "infection"
    if "hand-foot skin reaction" in text or "hfsr" in text:
        return "hfsr"
    if "hand-foot" in text or "palmar" in text or "ppe" in text:
        return "ppe"
    if "fistula" in text:
        return "fistula"
    if "thrombo" in text:
        return "thromboembolism"
    if "febrile neutropenia" in text:
        return "febrile_neutropenia"
    if "alt" in text or "ast" in text or "transamin" in text:
        return "hepatic_alt_ast"
    if "bilirubin" in text:
        return "hepatic_bilirubin"
    if "magnesium" in text:
        return "hypomagnesaemia"
    if "electrolyte" in text:
        return "electrolyte"
    if "myocarditis" in text:
        return "myocarditis"
    if "cardiac" in text:
        return "cardiac"
    if "pericard" in text:
        return "pericardial"
    if "guillain" in text:
        return "guillain_barre"
    if "myositis" in text or "polymyositis" in text:
        return "myositis"
    if "encephal" in text:
        return "encephalitis"
    if "serious" in text and "neurolog" in text:
        return "serious_neurological"
    if "neurolog" in text:
        return "neurological"
    if "pancreatitis" in text:
        return "pancreatitis"
    if "constipation" in text:
        return "constipation"
    if "cutaneous" in text or "skin reaction" in text:
        return "cutaneous"
    if "haematological" in text or "hematological" in text:
        return "haematological"
    return "generic"


def is_true_grade_input(field_id: str, definition: dict[str, Any]) -> bool:
    text = norm(f"{field_id} {definition.get('label', '')}")
    if "grade" not in text and "ctcae" not in text:
        return False
    exclusions = (
        "occurrence", "duration", " days", "weeks", "recurrent", "prior grade", "prior_grade",
        "not recovered", "persists", "over one week", "resolution", "requiring interruption",
        "unresolved", "meeting protocol criteria", "with fever", "fever or infection",
        "complicated diarrhoea", "grade4_", "grade3_", "grade2_", "grade1_",
    )
    if any(token in text for token in exclusions):
        return False
    return field_id.endswith("_grade") or "current_grade" in field_id or "highest_grade" in field_id or definition.get("type") == "select"


def enrich_ctcae(data: dict[str, Any]) -> int:
    changed = 0
    definitions = data.get("input_definitions") or {}
    for field_id, definition in definitions.items():
        if not isinstance(definition, dict) or not is_true_grade_input(field_id, definition):
            continue
        category = ctcae_category(field_id, definition.get("label", ""))
        definition["ctcae_version"] = "5.0"
        definition["ctcae_category"] = category
        definition["ctcae_source_url"] = NCI_CTCAE_URL
        definition["assessment_guidance"] = CTCAE_GUIDANCE[category]
        # Use a selector rather than a free numerical grade entry.
        definition["type"] = "select"
        definition.pop("min", None)
        definition.pop("max", None)
        definition.pop("step", None)
        existing = {str(option.get("value")): option for option in definition.get("options", []) if isinstance(option, dict)}
        options = []
        for grade in range(0, 5):
            option = dict(existing.get(str(grade), {}))
            option["value"] = grade
            option.setdefault("label", f"Grade {grade}")
            option["ctcae_grade"] = grade
            options.append(option)
        definition["options"] = options
        changed += 1
    return changed


def collect_numeric_comparisons(node: Any, field_id: str, output: list[tuple[str, int]]) -> None:
    if isinstance(node, dict):
        if node.get("field") == field_id and node.get("operator") in {"<", "<=", ">", ">=", "=="}:
            value = node.get("value")
            if isinstance(value, (int, float)) and float(value).is_integer():
                output.append((str(node["operator"]), int(value)))
        for child in node.values():
            collect_numeric_comparisons(child, field_id, output)
    elif isinstance(node, list):
        for child in node:
            collect_numeric_comparisons(child, field_id, output)


def predicate_signature(value: int, comparisons: Iterable[tuple[str, int]]) -> tuple[bool, ...]:
    result = []
    for operator, threshold in comparisons:
        if operator == "<": result.append(value < threshold)
        elif operator == "<=": result.append(value <= threshold)
        elif operator == ">": result.append(value > threshold)
        elif operator == ">=": result.append(value >= threshold)
        else: result.append(value == threshold)
    return tuple(result)


def renal_bands(comparisons: list[tuple[str, int]], maximum: int = 300) -> list[tuple[int, int]]:
    comparisons = sorted(set(comparisons), key=lambda item: (item[1], item[0]))
    groups: list[tuple[int, int]] = []
    start = 0
    previous_signature = predicate_signature(0, comparisons)
    for value in range(1, maximum + 1):
        signature = predicate_signature(value, comparisons)
        if signature != previous_signature:
            groups.append((start, value - 1))
            start = value
            previous_signature = signature
    groups.append((start, maximum))
    return groups


def band_label(start: int, end: int, maximum: int = 300) -> str:
    if start == 0 and end < maximum:
        return f"<{end + 1} mL/min"
    if end == maximum:
        return f">={start} mL/min"
    if start == end:
        return f"{start} mL/min"
    return f"{start}-{end} mL/min"


def convert_renal_inputs(data: dict[str, Any]) -> int:
    definitions = data.get("input_definitions") or {}
    rules = (data.get("rule_engine") or {}).get("rules", [])
    changed = 0
    haemodialysis_fields = [field_id for field_id in definitions if "haemodialysis" in field_id.lower() or "dialysis" == field_id.lower()]
    for field_id, definition in definitions.items():
        if not isinstance(definition, dict) or definition.get("type") != "number":
            continue
        text = norm(f"{field_id} {definition.get('label', '')}")
        if not re.search(r"crcl|creatinine clearance|\bgfr\b|egfr", text):
            continue
        comparisons: list[tuple[str, int]] = []
        collect_numeric_comparisons(rules, field_id, comparisons)
        if not comparisons:
            continue

        # Carboplatin/Calvert dosing requires the continuous GFR/CrCl value. Keep
        # the regimen's main renal input numerical even when the same value is
        # also used by safety thresholds. Component-specific renal fields (for
        # example etoposide_crcl_ml_min) remain eligible for band conversion.
        title = norm(data.get("metadata", {}).get("title", ""))
        generic_carboplatin_field = field_id in {"gfr", "gfr_ml_min", "egfr", "egfr_ml_min", "crcl", "crcl_ml_min"}
        if "carboplatin" in title and generic_carboplatin_field:
            definition["renal_input"] = {
                "mode": "exact_continuous",
                "exact_value_required": True,
                "reason": "Required for carboplatin Calvert dosing and renal safety assessment.",
            }
            definition["assessment_guidance"] = "Enter the verified continuous GFR/CrCl used for carboplatin dosing. The app will apply encoded renal thresholds; confirm the Calvert calculation and local dosing policy independently."
            continue

        # Convert only decision-band fields. Exact values remain when no categorical rule exists.
        bands = renal_bands(comparisons)
        options: list[dict[str, Any]] = []
        for start, end in bands:
            representative = start if start == end else int((start + end) / 2)
            if end == 300:
                representative = start
            options.append({
                "value": f"renal_{start}_{'plus' if end == 300 else end}",
                "label": band_label(start, end),
                "decision_value": representative,
                "range_min_inclusive": start,
                "range_max_inclusive": None if end == 300 else end,
            })
        if haemodialysis_fields:
            dialysis_field = haemodialysis_fields[0]
            options.append({
                "value": "dialysis",
                "label": "Dialysis - use the protocol-specific dialysis pathway / specialist review",
                "decision_value": 0,
                "sets_fields": {dialysis_field: True},
            })
            definitions[dialysis_field]["visible"] = False
            definitions[dialysis_field]["derived_from"] = field_id
        definition["type"] = "select"
        definition["label"] = re.sub(r"\s*\([^)]*mL/min[^)]*\)\s*$", "", str(definition.get("label", "")), flags=re.I).strip() or "Renal function category"
        if "category" not in definition["label"].lower() and "band" not in definition["label"].lower():
            definition["label"] += " category"
        definition["options"] = options
        definition["renal_input"] = {
            "mode": "protocol_specific_band",
            "source": "Encoded rule thresholds",
            "exact_value_required": False,
        }
        definition["assessment_guidance"] = "Select the protocol-specific renal band containing the verified CrCl/eGFR/GFR. Do not estimate a band without a valid renal-function calculation."
        definition.pop("min", None)
        definition.pop("max", None)
        definition.pop("step", None)
        demo = definition.get("demo_value")
        if isinstance(demo, (int, float)):
            selected = next((option for option in options if option.get("range_min_inclusive", 0) <= demo and (option.get("range_max_inclusive") is None or demo <= option["range_max_inclusive"])), options[0])
            definition["demo_value"] = selected["value"]
        changed += 1
    return changed


def count_renal_input_modes(data: dict[str, Any]) -> tuple[int, int]:
    """Return current protocol-specific band and exact-continuous renal fields.

    This post-migration count is intentionally idempotent. It avoids reporting
    zero migrated renal fields simply because the migration script was rerun.
    """
    band_fields = 0
    exact_fields = 0
    for definition in (data.get("input_definitions") or {}).values():
        if not isinstance(definition, dict):
            continue
        mode = (definition.get("renal_input") or {}).get("mode")
        if mode == "protocol_specific_band":
            band_fields += 1
        elif mode == "exact_continuous":
            exact_fields += 1
    return band_fields, exact_fields


def supportive_registry() -> dict[str, Any]:
    return {
        "schema_version": "2.0",
        "release": RELEASE,
        "source": {
            "status": "nccp_v6_source_mapped_with_local_cuh_documents",
            "title": "NCCP Classification Document for SACT Induced Nausea and Vomiting, V6 (2025)",
            "url": NCCP_ANTIEMETIC_URL,
            "local_document_note": "CUH local prescription sheets remain local aids and require oncology-pharmacy approval before clinical deployment.",
            "mapping_rule": "For combination SACT, use the most emetogenic active component. Multi-day and multi-phase regimens require day/phase-specific selection.",
        },
        "levels": {
            "high": {"label": "High emetogenic potential", "colour": "red", "default_script_id": "nccp-parenteral-high"},
            "moderate": {"label": "Moderate emetogenic potential", "colour": "orange", "default_script_id": "nccp-parenteral-moderate"},
            "low": {"label": "Low emetogenic potential", "colour": "green", "default_script_id": "nccp-parenteral-low"},
            "minimal": {"label": "Minimal / no routine prophylaxis", "colour": "blue", "default_script_id": "nccp-minimal-no-routine-prophylaxis"},
            "oral_moderate_high": {"label": "Oral SACT: moderate-high", "colour": "orange", "default_script_id": "nccp-oral-moderate-high"},
            "oral_minimal_low": {"label": "Oral SACT: minimal-low", "colour": "green", "default_script_id": "nccp-oral-minimal-low"},
            "phase_dependent": {"label": "Phase-dependent emetogenic risk", "colour": "purple"},
            "variable": {"label": "Risk depends on active component", "colour": "grey"},
            "pending": {"label": "Mapping requires review", "colour": "grey"},
        },
        "scripts": {
            "generic-high-cuh-v2-05-21": {
                "label": "CUH high-risk antiemetic prescription sheet (legacy alias)",
                "risk_level": "high",
                "url": "assets/supportive-care/Antiemetics_High_V2_05.21.pdf",
                "source_url": NCCP_ANTIEMETIC_URL,
                "status": "available_local_document",
                "summary": "Legacy-compatible alias for the local high-risk prescription sheet; reconcile against NCCP V6 and current local policy.",
                "subsequent_days": "Use the current locally approved high-risk subsequent-day schedule after pharmacy validation.",
            },
            "generic-moderate-cuh": {
                "label": "CUH moderate-risk antiemetic prescription sheet (legacy alias)",
                "risk_level": "moderate",
                "url": "assets/supportive-care/Antiemetics_Moderate_V2_05.21.pdf",
                "source_url": NCCP_ANTIEMETIC_URL,
                "status": "available_local_document",
                "summary": "Legacy-compatible alias for the local moderate-risk prescription sheet; reconcile against NCCP V6 and current local policy.",
                "subsequent_days": "Use the current locally approved moderate-risk subsequent-day schedule after pharmacy validation.",
            },
            "generic-low-cuh-v2-05-21": {
                "label": "CUH low-risk antiemetic prescription sheet (legacy alias)",
                "risk_level": "low",
                "url": "assets/supportive-care/Antiemetics_Low_V2_05.21.pdf",
                "source_url": NCCP_ANTIEMETIC_URL,
                "status": "available_local_document",
                "summary": "Legacy-compatible alias for the local low-risk prescription sheet; reconcile against NCCP V6 and current local policy.",
                "subsequent_days": "No routine subsequent-day prophylaxis unless clinically indicated.",
            },
            "nccp-parenteral-high": {
                "label": "CUH high-risk prescription sheet (2021; pharmacy reconciliation required)",
                "risk_level": "high",
                "url": "assets/supportive-care/Antiemetics_High_V2_05.21.pdf",
                "source_url": NCCP_ANTIEMETIC_URL,
                "status": "available_local_document_pending_local_pharmacy_validation",
                "summary": "NCCP V6 class recommendation: NK1 antagonist + 5-HT3 antagonist + corticosteroid + olanzapine, adjusted for the active regimen, interactions and local policy.",
                "subsequent_days": "Use the NCCP V6 high-risk subsequent-day schedule; anthracycline/cyclophosphamide and immune-checkpoint contexts require regimen-specific steroid review.",
            },
            "nccp-parenteral-moderate": {
                "label": "CUH moderate-risk prescription sheet (2021; pharmacy reconciliation required)",
                "risk_level": "moderate",
                "url": "assets/supportive-care/Antiemetics_Moderate_V2_05.21.pdf",
                "source_url": NCCP_ANTIEMETIC_URL,
                "status": "available_local_document_pending_local_pharmacy_validation",
                "summary": "NCCP V6 class recommendation: 5-HT3 antagonist + corticosteroid, adjusted for the active regimen, interactions and local policy.",
                "subsequent_days": "Consider the NCCP V6 subsequent-day corticosteroid schedule where appropriate; account for steroids already included in the SACT regimen.",
            },
            "nccp-parenteral-low": {
                "label": "CUH low-risk prescription sheet (2021; pharmacy reconciliation required)",
                "risk_level": "low",
                "url": "assets/supportive-care/Antiemetics_Low_V2_05.21.pdf",
                "source_url": NCCP_ANTIEMETIC_URL,
                "status": "available_local_document_pending_local_pharmacy_validation",
                "summary": "NCCP V6 class recommendation: one 5-HT3 antagonist or corticosteroid before treatment, selected according to the regimen and local policy.",
                "subsequent_days": "No routine subsequent-day prophylaxis in the class table unless clinically indicated.",
            },
            "nccp-minimal-no-routine-prophylaxis": {
                "label": "Minimal-risk guidance",
                "risk_level": "minimal",
                "url": NCCP_ANTIEMETIC_URL,
                "source_url": NCCP_ANTIEMETIC_URL,
                "status": "national_guidance_link",
                "summary": "NCCP V6: no routine antiemetic prophylaxis required; treat symptoms and individual risk factors according to local policy.",
                "subsequent_days": "No routine prophylaxis.",
            },
            "nccp-oral-moderate-high": {
                "label": "Oral SACT moderate-high guidance",
                "risk_level": "oral_moderate_high",
                "url": NCCP_ANTIEMETIC_URL,
                "source_url": NCCP_ANTIEMETIC_URL,
                "status": "national_guidance_link",
                "summary": "NCCP V6 Table 5: daily oral 5-HT3 antagonist prophylaxis, selected and reviewed under local policy; avoid routine prolonged steroids for continuously administered oral therapy.",
                "subsequent_days": "Continue daily while the oral SACT risk persists, with review for interactions and adverse effects.",
            },
            "nccp-oral-minimal-low": {
                "label": "Oral SACT minimal-low guidance",
                "risk_level": "oral_minimal_low",
                "url": NCCP_ANTIEMETIC_URL,
                "source_url": NCCP_ANTIEMETIC_URL,
                "status": "national_guidance_link",
                "summary": "NCCP V6 Table 5: antiemetics on an as-required basis; select an appropriate agent under local policy and account for interactions/QT risk.",
                "subsequent_days": "Continue only as required and reassess persistent symptoms.",
            },
            "docetaxel-cuh-v2": {
                "label": "CUH docetaxel supportive medicines sheet (2021; pharmacy reconciliation required)",
                "risk_level": "low",
                "url": "assets/supportive-care/Docetaxel_Supportive_Medicines_V2_05.2021.pdf",
                "source_url": NCCP_ANTIEMETIC_URL,
                "status": "available_local_regimen_specific_document_pending_local_pharmacy_validation",
                "summary": "Regimen-specific local docetaxel supportive medicines sheet; reconcile with the current NCCP source and local policy.",
                "subsequent_days": "Follow the locally approved docetaxel steroid/supportive schedule after pharmacy validation.",
            },
        },
        "breakthrough": {
            "summary": "Reassess emetogenic risk, disease/medication causes and adherence; add an antiemetic from a different mechanism and use it regularly rather than PRN while breakthrough symptoms persist.",
            "source_url": NCCP_ANTIEMETIC_URL,
            "warning": "Agent choice, dose, QT risk, sedation, extrapyramidal effects and drug interactions require clinical/pharmacy review.",
        },
        "protocols": {},
    }


def main() -> None:
    registry = supportive_registry()
    audit = {
        "protocols_updated": 0,
        "ctcae_fields_enriched": 0,
        "renal_fields_converted": 0,
        "renal_fields_newly_converted_this_run": 0,
        "exact_continuous_renal_fields_retained": 0,
        "sections": {},
        "emetogenic_levels": {},
        "requires_review": [],
    }

    for path in sorted(PROTOCOL_ROOT.rglob("*.json")):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            continue
        if not is_regimen_file(path, data):
            continue

        metadata = data.setdefault("metadata", {})
        code = str(metadata.get("nccp_regimen_code"))
        title = str(metadata.get("title") or metadata.get("short_title") or path.stem)
        section, classes, cytotoxic = classify_protocol(title)
        metadata["catalogue_section"] = section
        metadata["catalogue_section_label"] = SECTION_LABELS[section]
        metadata["treatment_class"] = classes
        metadata["cytotoxic"] = cytotoxic
        metadata["sactcheck_encoding_version"] = RELEASE
        metadata.setdefault("catalog", {})["enabled"] = True

        profile = emetogenic_profile(title, section, code)
        supportive = data.setdefault("supportive_care", {})
        supportive["emetogenic_risk"] = profile["level"]
        supportive["script_id"] = profile.get("script_id")
        supportive["mapping_source"] = "NCCP SACT Antiemetic Guidance V6 (2025)"
        supportive["mapping_source_url"] = NCCP_ANTIEMETIC_URL
        supportive["mapping_basis"] = profile["basis"]
        supportive["mapping_confidence"] = profile["confidence"]
        supportive["validation_status"] = "source_mapped_pending_local_oncology_pharmacy_validation"
        supportive["breakthrough_profile_id"] = "nccp-breakthrough-general"
        if profile.get("phase_profiles"):
            supportive["phase_profiles"] = profile["phase_profiles"]
        elif "phase_profiles" in supportive:
            supportive.pop("phase_profiles", None)

        # Reconcile legacy per-protocol links with the central v0.37.0 mapping.
        # This prevents a minimal-risk biologic or oral SACT regimen from opening
        # a stale parenteral low/moderate prescription sheet.
        selected_script = registry.get("scripts", {}).get(profile.get("script_id"), {})
        if selected_script:
            supportive["supportive_medications_pdf_url"] = selected_script.get("url")
            supportive["supportive_medications_label"] = selected_script.get("label")
        else:
            supportive.pop("supportive_medications_pdf_url", None)
            supportive.pop("supportive_medications_label", None)

        registry["protocols"][code] = {
            "level": profile["level"],
            "script_id": profile.get("script_id"),
            "mapping_basis": profile["basis"],
            "mapping_confidence": profile["confidence"],
            **({"phase_profiles": profile["phase_profiles"]} if profile.get("phase_profiles") else {}),
        }

        ctcae_count = enrich_ctcae(data)
        renal_count = convert_renal_inputs(data)
        renal_band_count, renal_exact_count = count_renal_input_modes(data)

        path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        audit["protocols_updated"] += 1
        audit["ctcae_fields_enriched"] += ctcae_count
        audit["renal_fields_converted"] += renal_band_count
        audit["renal_fields_newly_converted_this_run"] += renal_count
        audit["exact_continuous_renal_fields_retained"] += renal_exact_count
        audit["sections"][section] = audit["sections"].get(section, 0) + 1
        audit["emetogenic_levels"][profile["level"]] = audit["emetogenic_levels"].get(profile["level"], 0) + 1
        if profile["confidence"] in {"requires_review", "moderate"} or profile["level"] == "variable":
            audit["requires_review"].append({"code": code, "title": title, "level": profile["level"], "basis": profile["basis"], "confidence": profile["confidence"]})

    (ROOT / "data" / "emetogenic-risk-map.json").write_text(json.dumps(registry, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (ROOT / "V0370_MIGRATION_AUDIT.json").write_text(json.dumps(audit, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(audit, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
