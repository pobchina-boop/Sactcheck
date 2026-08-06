#!/usr/bin/env python3
"""SACTCheck v0.59.0 library-wide organ-function reconciliation.

Reconciles the 74 records intentionally marked partial in v0.58.1. The script
adds optional, independently assessable renal/hepatic inputs and component-
specific decision rules, or records an explicit source-reviewed no-prescriptive-
adjustment resolution where the NCCP source does not define a dose table.

The script is idempotent: v0.59.0 rules are replaced on repeat execution.
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Callable

ROOT = Path(__file__).resolve().parents[1]
PROTOCOL_ROOT = ROOT / "protocols"
RELEASE = "0.59.0"
CHECKED_DATE = "2026-08-05"
PREFIX = "OF590_"

EXPECTED_CODES = {
    "00205","00207","00210","00213","00214","00219","00220","00221","00222","00225",
    "00235","00239","00240","00243","00283","00284","00294","00311","00318","00320",
    "00325","00328","00330","00331","00335","00340","00353","00372","00380","00383",
    "00384","00386","00401","00421","00427","00428","00429","00460","00462","00473",
    "00486","00501","00502","00505","00509","00511","00521","00522","00523","00524",
    "00559","00562","00565","00570","00585","00586","00587","00594","00623","00642",
    "00644","00654","00680","00692","00702","00719","00727","00732","00733","00791",
    "00823","00889","00890","00901",
}

NO_PRESCRIPTIVE_ONLY = {"00207", "00214", "00225", "00732"}


def load_protocols() -> dict[str, tuple[Path, dict[str, Any]]]:
    result: dict[str, tuple[Path, dict[str, Any]]] = {}
    for path in PROTOCOL_ROOT.rglob("*.json"):
        if "_template" in path.parts or path.name == "index.json":
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        code = str(data.get("metadata", {}).get("nccp_regimen_code", ""))
        if code in EXPECTED_CODES:
            result[code] = (path, data)
    missing = EXPECTED_CODES - set(result)
    extra = set(result) - EXPECTED_CODES
    if missing or extra:
        raise RuntimeError(f"Protocol register mismatch; missing={sorted(missing)}, extra={sorted(extra)}")
    return result


def number(label: str, unit: str = "", demo: float = 1, step: float = 1, minimum: float = 0, help_text: str | None = None) -> dict[str, Any]:
    d: dict[str, Any] = {
        "label": label, "type": "number", "required": False, "min": minimum,
        "step": step, "demo_value": demo, "ui_section": "labs", "always_show": True,
    }
    if unit:
        d["unit"] = unit
    if help_text:
        d["help"] = help_text
    return d


def select(label: str, options: list[tuple[str, str]], demo: str | None = None, help_text: str | None = None, ui_section: str = "labs") -> dict[str, Any]:
    if demo is None:
        demo = options[0][0]
    d: dict[str, Any] = {
        "label": label, "type": "select", "required": False,
        "options": [{"value": value, "label": text} for value, text in options],
        "demo_value": demo, "ui_section": ui_section, "always_show": True,
    }
    if help_text:
        d["help"] = help_text
    return d


def boolean(label: str, demo: bool = False, help_text: str | None = None, ui_section: str = "clinical") -> dict[str, Any]:
    d: dict[str, Any] = {
        "label": label, "type": "boolean", "required": False,
        "demo_value": demo, "ui_section": ui_section, "always_show": True,
    }
    if help_text:
        d["help"] = help_text
    return d


def ensure_input(p: dict[str, Any], field: str, definition: dict[str, Any], replace: bool = False) -> None:
    defs = p.setdefault("input_definitions", {})
    if replace or field not in defs:
        defs[field] = definition
    else:
        defs[field]["required"] = False
        defs[field].setdefault("demo_value", definition.get("demo_value"))
        defs[field].setdefault("always_show", True)


def action(action_type: str, components: list[str], message: str, percent: int | None = None) -> dict[str, Any]:
    result: dict[str, Any] = {
        "type": action_type,
        "components": components,
        "message": message,
        "recommendation": message,
    }
    if percent is not None and len(components) == 1:
        result["component_changes"] = {components[0]: {"dose_percent_of_original": percent}}
    return result


def add_rule(p: dict[str, Any], suffix: str, when: dict[str, Any], action_type: str, components: list[str], message: str, percent: int | None = None, priority: int = 20) -> None:
    rules = p.setdefault("rule_engine", {}).setdefault("rules", [])
    rule_id = PREFIX + suffix
    rules[:] = [r for r in rules if (r.get("id") or r.get("rule_id")) != rule_id]
    rules.append({
        "id": rule_id,
        "priority": priority,
        "when": when,
        "action": action(action_type, components, message, percent),
        "source": {
            "document": "Current official NCCP regimen",
            "page": "renal/hepatic dose-modification section",
        },
        "explanation": message,
    })


def cond(field: str, operator: str, value: Any) -> dict[str, Any]:
    return {"field": field, "operator": operator, "value": value}


def all_(*conditions: dict[str, Any]) -> dict[str, Any]:
    return {"all": list(conditions)}


def any_(*conditions: dict[str, Any]) -> dict[str, Any]:
    return {"any": list(conditions)}


def remove_previous_release_rules(p: dict[str, Any]) -> None:
    rules = p.setdefault("rule_engine", {}).setdefault("rules", [])
    rules[:] = [r for r in rules if not str(r.get("id") or r.get("rule_id") or "").startswith(PREFIX)]


def profile_pld(p: dict[str, Any], code: str) -> None:
    field = "pld_bilirubin_band"
    ensure_input(p, field, select("Bilirubin for pegylated liposomal doxorubicin", [
        ("lt20", "<20 µmol/L"), ("20_50", "20–50 µmol/L"),
        ("51_86", "51–86 µmol/L"), ("gt86", ">86 µmol/L"),
    ]))
    add_rule(p, f"{code}_PLD_BILI_20_50", cond(field,"==","20_50"), "dose_reduce", ["pegylated_liposomal_doxorubicin"], "Bilirubin 20–50 µmol/L: administer 75% of the pegylated liposomal doxorubicin dose.", 75)
    add_rule(p, f"{code}_PLD_BILI_51_86", cond(field,"==","51_86"), "dose_reduce", ["pegylated_liposomal_doxorubicin"], "Bilirubin 51–86 µmol/L: administer 50% of the pegylated liposomal doxorubicin dose.", 50)
    add_rule(p, f"{code}_PLD_BILI_GT86", cond(field,"==","gt86"), "contraindicated", ["pegylated_liposomal_doxorubicin"], "Bilirubin >86 µmol/L: pegylated liposomal doxorubicin is not recommended.")


def profile_gemcitabine(p: dict[str, Any], code: str) -> None:
    ensure_input(p, "gemcitabine_renal_band", select("Renal function for gemcitabine", [
        ("ge30", "CrCl ≥30 mL/min"), ("lt30", "CrCl <30 mL/min"), ("dialysis", "Dialysis"),
    ]))
    ensure_input(p, "gemcitabine_bilirubin_band", select("Bilirubin for gemcitabine", [
        ("lt27", "<27 µmol/L"), ("ge27", "≥27 µmol/L"),
    ]))
    add_rule(p, f"{code}_GEM_RENAL_LT30", cond("gemcitabine_renal_band","in",["lt30","dialysis"]), "consultant_review", ["gemcitabine"], "CrCl <30 mL/min or dialysis: consider a gemcitabine dose reduction and agree the starting dose with the Consultant and oncology pharmacy.")
    add_rule(p, f"{code}_GEM_BILI_GE27", cond("gemcitabine_bilirubin_band","==","ge27"), "dose_reduce", ["gemcitabine"], "Bilirubin ≥27 µmol/L: start gemcitabine at 800 mg/m² and escalate only if tolerated.")


def profile_sunitinib(p: dict[str, Any], code: str) -> None:
    ensure_input(p, "sunitinib_renal_band", select("Renal status for sunitinib", [
        ("non_dialysis", "Mild, moderate or severe renal impairment (not dialysis)"),
        ("dialysis", "End-stage renal disease on haemodialysis"),
    ]))
    ensure_input(p, "child_pugh_class", select("Child–Pugh class", [("none","No hepatic impairment"),("A","Child–Pugh A"),("B","Child–Pugh B"),("C","Child–Pugh C")]))
    add_rule(p, f"{code}_SUNITINIB_CHILD_C", cond("child_pugh_class","==","C"), "contraindicated", ["sunitinib"], "Child–Pugh C: sunitinib is not recommended.")
    # No starting renal adjustment for non-dialysis or ESRD/HD; status is documented in metadata.


def profile_everolimus(p: dict[str, Any], code: str) -> None:
    ensure_input(p, "child_pugh_class", select("Child–Pugh class", [("none","No hepatic impairment"),("A","Child–Pugh A"),("B","Child–Pugh B"),("C","Child–Pugh C")]))
    add_rule(p, f"{code}_EVEROLIMUS_CHILD_A", cond("child_pugh_class","==","A"), "dose_reduce", ["everolimus"], "Child–Pugh A: use 75% of the usual everolimus dose.", 75)
    add_rule(p, f"{code}_EVEROLIMUS_CHILD_B", cond("child_pugh_class","==","B"), "dose_reduce", ["everolimus"], "Child–Pugh B: use 50% of the usual everolimus dose.", 50)
    add_rule(p, f"{code}_EVEROLIMUS_CHILD_C", cond("child_pugh_class","==","C"), "dose_reduce", ["everolimus"], "Child–Pugh C: use 25% of the usual everolimus dose only after specialist benefit–risk review.", 25)


def profile_topotecan_iv(p: dict[str, Any], code: str) -> None:
    ensure_input(p, "topotecan_renal_band", select("Renal function for IV topotecan", [("ge40","CrCl ≥40 mL/min"),("20_39","CrCl 20–39 mL/min"),("lt20","CrCl <20 mL/min"),("dialysis","Dialysis")]), replace=True)
    ensure_input(p, "topotecan_bilirubin_band", select("Bilirubin for IV topotecan", [("le171","≤171 µmol/L"),("gt171",">171 µmol/L")]))
    add_rule(p, f"{code}_TOPO_IV_20_39", cond("topotecan_renal_band","==","20_39"), "dose_reduce", ["topotecan"], "CrCl 20–39 mL/min: administer 50% of the IV topotecan dose.", 50)
    add_rule(p, f"{code}_TOPO_IV_LT20", cond("topotecan_renal_band","in",["lt20","dialysis"]), "contraindicated", ["topotecan"], "CrCl <20 mL/min or dialysis: IV topotecan is not recommended; if treatment is unavoidable, specialist review of a markedly reduced dose is required.")
    add_rule(p, f"{code}_TOPO_IV_BILI_GT171", cond("topotecan_bilirubin_band","==","gt171"), "contraindicated", ["topotecan"], "Bilirubin >171 µmol/L: IV topotecan is not recommended.")


def profile_topotecan_oral(p: dict[str, Any], code: str) -> None:
    ensure_input(p, "topotecan_oral_renal_band", select("Renal function for oral topotecan", [("ge50","CrCl ≥50 mL/min"),("30_49","CrCl 30–49 mL/min"),("lt30","CrCl <30 mL/min"),("dialysis","Dialysis")]))
    ensure_input(p, "hepatic_impairment_evidence", select("Hepatic function for oral topotecan", [("none","No significant hepatic impairment"),("impaired","Hepatic impairment present")]))
    add_rule(p, f"{code}_TOPO_ORAL_30_49", cond("topotecan_oral_renal_band","==","30_49"), "dose_reduce", ["topotecan"], "CrCl 30–49 mL/min: administer approximately 83% of the standard oral topotecan dose (1.9 mg/m²/day in the NCCP table).", 83)
    add_rule(p, f"{code}_TOPO_ORAL_LT30", cond("topotecan_oral_renal_band","in",["lt30","dialysis"]), "consultant_review", ["topotecan"], "CrCl <30 mL/min or dialysis: evidence is insufficient for routine oral topotecan dosing; Consultant/pharmacy review is required.")
    add_rule(p, f"{code}_TOPO_ORAL_HEPATIC", cond("hepatic_impairment_evidence","==","impaired"), "consultant_review", ["topotecan"], "Hepatic impairment: the source provides insufficient dose-adjustment data for oral topotecan; obtain specialist review.")


def profile_dacarbazine(p: dict[str, Any], code: str) -> None:
    ensure_input(p, "dacarbazine_renal_band", select("Renal function for dacarbazine", [("gt60","CrCl >60 mL/min"),("45_60","CrCl 45–60 mL/min"),("30_44","CrCl 30–44 mL/min"),("lt30","CrCl <30 mL/min"),("dialysis","Dialysis")]), replace=True)
    ensure_input(p, "dacarbazine_hepatic_status", select("Hepatic status for dacarbazine", [("none","No significant hepatic impairment"),("impaired","Hepatic impairment"),("severe","Severe liver disease")]))
    add_rule(p, f"{code}_DTIC_45_60", cond("dacarbazine_renal_band","==","45_60"), "dose_reduce", ["dacarbazine"], "CrCl 45–60 mL/min: administer 80% of the dacarbazine dose.", 80)
    add_rule(p, f"{code}_DTIC_30_44", cond("dacarbazine_renal_band","==","30_44"), "dose_reduce", ["dacarbazine"], "CrCl 30–44 mL/min: administer 75% of the dacarbazine dose.", 75)
    add_rule(p, f"{code}_DTIC_LT30", cond("dacarbazine_renal_band","in",["lt30","dialysis"]), "dose_reduce", ["dacarbazine"], "CrCl <30 mL/min or dialysis: use approximately 70% of the dacarbazine dose only after specialist review.", 70)
    add_rule(p, f"{code}_DTIC_HEPATIC", cond("dacarbazine_hepatic_status","==","impaired"), "consultant_review", ["dacarbazine"], "Hepatic impairment: dacarbazine is potentially hepatotoxic; consider dose reduction and close monitoring.")
    add_rule(p, f"{code}_DTIC_SEVERE_HEPATIC", cond("dacarbazine_hepatic_status","==","severe"), "contraindicated", ["dacarbazine"], "Severe liver disease is outside the routine dacarbazine pathway.")


def profile_ifosfamide(p: dict[str, Any], code: str) -> None:
    ensure_input(p, "ifosfamide_renal_band", select("Renal function for ifosfamide", [("ge50","CrCl ≥50 mL/min"),("lt50","CrCl <50 mL/min"),("dialysis","Dialysis")]), replace=True)
    ensure_input(p, "ifosfamide_hepatic_band", select("Hepatic function for ifosfamide", [("none","No significant impairment"),("mild_moderate","Mild or moderate impairment"),("severe","Severe impairment")]))
    add_rule(p, f"{code}_IFO_RENAL", cond("ifosfamide_renal_band","in",["lt50","dialysis"]), "consultant_review", ["ifosfamide"], "CrCl <50 mL/min or dialysis: high-dose ifosfamide requires an individual Consultant and oncology-pharmacy decision.")
    add_rule(p, f"{code}_IFO_HEPATIC_SEVERE", cond("ifosfamide_hepatic_band","==","severe"), "contraindicated", ["ifosfamide"], "Severe hepatic impairment: high-dose ifosfamide is not routinely recommended; a source-directed reduced dose is a specialist-only decision.")


def profile_imatinib(p: dict[str, Any], code: str) -> None:
    ensure_input(p, "imatinib_renal_status", select("Renal status for imatinib", [("normal_or_impaired","Normal renal function or renal impairment"),("dialysis","Haemodialysis")]))
    ensure_input(p, "bilirubin_uln_multiple", number("Bilirubin (×ULN)", "×ULN", 0.8, 0.1))
    ensure_input(p, "alt_ast_uln_multiple", number("ALT or AST (highest ×ULN)", "×ULN", 1, 0.1))
    add_rule(p, f"{code}_IMATINIB_LFT_HOLD", any_(cond("bilirubin_uln_multiple",">",3),cond("alt_ast_uln_multiple",">",5)), "withhold", ["imatinib"], "Bilirubin >3 ×ULN or transaminases >5 ×ULN: withhold imatinib; resume at the source-reduced dose only after recovery below the specified thresholds.")


def profile_docetaxel(p: dict[str, Any], code: str) -> None:
    ensure_input(p, "docetaxel_hepatic_band", select("Hepatic function for docetaxel", [("normal","No source-defined hepatic reduction"),("reduce75","ALP >2.5 ×ULN with AST/ALT >1.5 ×ULN"),("stop","ALP >6 ×ULN and/or AST/ALT >3.5 ×ULN with bilirubin >ULN")]))
    add_rule(p, f"{code}_DOC_HEP_75", cond("docetaxel_hepatic_band","==","reduce75"), "dose_reduce", ["docetaxel"], "Source hepatic pattern: administer docetaxel at 75 mg/m² (or the corresponding source-reduced level).")
    add_rule(p, f"{code}_DOC_HEP_STOP", cond("docetaxel_hepatic_band","==","stop"), "contraindicated", ["docetaxel"], "Severe source-defined hepatic dysfunction: stop docetaxel unless the Consultant determines treatment is strictly indicated.")


def profile_doxorubicin(p: dict[str, Any], code: str) -> None:
    ensure_input(p, "doxorubicin_renal_band", select("Renal status for doxorubicin", [("gt10","CrCl >10 mL/min"),("le10","CrCl ≤10 mL/min"),("dialysis","Haemodialysis")]))
    ensure_input(p, "doxorubicin_bilirubin_band", select("Bilirubin for doxorubicin", [("lt20","<20 µmol/L"),("20_50","20–50 µmol/L"),("51_86","51–86 µmol/L"),("gt86",">86 µmol/L / Child–Pugh C")]))
    add_rule(p, f"{code}_DOX_DIALYSIS", cond("doxorubicin_renal_band","==","dialysis"), "dose_reduce", ["doxorubicin"], "Haemodialysis: consider 75% of the doxorubicin dose.", 75)
    add_rule(p, f"{code}_DOX_BILI_20_50", cond("doxorubicin_bilirubin_band","==","20_50"), "dose_reduce", ["doxorubicin"], "Bilirubin 20–50 µmol/L: administer 50% of the doxorubicin dose.", 50)
    add_rule(p, f"{code}_DOX_BILI_51_86", cond("doxorubicin_bilirubin_band","==","51_86"), "dose_reduce", ["doxorubicin"], "Bilirubin 51–86 µmol/L: administer 25% of the doxorubicin dose.", 25)
    add_rule(p, f"{code}_DOX_BILI_GT86", cond("doxorubicin_bilirubin_band","==","gt86"), "contraindicated", ["doxorubicin"], "Bilirubin >86 µmol/L or Child–Pugh C: doxorubicin is not recommended.")


def add_5fu(p: dict[str, Any], code: str, severe_not_recommended: bool = False) -> None:
    ensure_input(p, "fluorouracil_renal_impairment", select("Renal impairment for fluorouracil", [("none_mild_moderate","None, mild or moderate"),("severe","Severe renal impairment")]))
    ensure_input(p, "fluorouracil_bilirubin_umol_l", number("Bilirubin for fluorouracil", "µmol/L", 12, 1))
    ensure_input(p, "fluorouracil_ast_u_l", number("AST for fluorouracil", "U/L", 30, 1))
    ensure_input(p, "fluorouracil_hepatic_impairment", select("Clinical hepatic impairment for fluorouracil", [("none","No clinically significant impairment"),("moderate","Moderate impairment"),("severe","Severe impairment")]))
    add_rule(p, f"{code}_5FU_RENAL_SEVERE", cond("fluorouracil_renal_impairment","==","severe"), "consultant_review", ["fluorouracil"], "Severe renal impairment: consider fluorouracil dose reduction and review DPD phenotyping reliability.")
    add_rule(p, f"{code}_5FU_BILI_GT85", cond("fluorouracil_bilirubin_umol_l",">",85), "contraindicated", ["fluorouracil"], "Bilirubin >85 µmol/L: fluorouracil is contraindicated in the encoded source table.")
    add_rule(p, f"{code}_5FU_AST_GT180", cond("fluorouracil_ast_u_l",">",180), "contraindicated", ["fluorouracil"], "AST >180 U/L: fluorouracil is contraindicated in the encoded source table.")
    if severe_not_recommended:
        add_rule(p, f"{code}_5FU_HEP_MOD", cond("fluorouracil_hepatic_impairment","==","moderate"), "consultant_review", ["fluorouracil"], "Moderate hepatic impairment: source-specific Consultant/pharmacy review is required.")
        add_rule(p, f"{code}_5FU_HEP_SEV", cond("fluorouracil_hepatic_impairment","==","severe"), "contraindicated", ["fluorouracil"], "Severe hepatic impairment: fluorouracil is not recommended in this regimen source.")
    else:
        add_rule(p, f"{code}_5FU_HEP_MOD", cond("fluorouracil_hepatic_impairment","==","moderate"), "dose_reduce", ["fluorouracil"], "Moderate hepatic impairment: reduce the initial fluorouracil dose by one-third; escalate only if tolerated.")
        add_rule(p, f"{code}_5FU_HEP_SEV", cond("fluorouracil_hepatic_impairment","==","severe"), "dose_reduce", ["fluorouracil"], "Severe hepatic impairment: reduce the initial fluorouracil dose by one-half; escalate only if tolerated.")


def add_capecitabine(p: dict[str, Any], code: str) -> None:
    ensure_input(p, "capecitabine_renal_band", select("Renal function for capecitabine", [("ge51","CrCl ≥51 mL/min"),("30_50","CrCl 30–50 mL/min"),("lt30","CrCl <30 mL/min"),("dialysis","Dialysis")]))
    ensure_input(p, "capecitabine_bilirubin_uln", number("Bilirubin for capecitabine", "×ULN", 0.8, 0.1))
    ensure_input(p, "capecitabine_alt_ast_uln", number("ALT or AST for capecitabine", "×ULN", 1, 0.1))
    add_rule(p, f"{code}_CAPE_RENAL_30_50", cond("capecitabine_renal_band","==","30_50"), "dose_reduce", ["capecitabine"], "CrCl 30–50 mL/min: administer 75% of the capecitabine dose.", 75)
    add_rule(p, f"{code}_CAPE_RENAL_LT30", cond("capecitabine_renal_band","in",["lt30","dialysis"]), "contraindicated", ["capecitabine"], "CrCl <30 mL/min or dialysis: capecitabine is not recommended.")
    add_rule(p, f"{code}_CAPE_HEPATIC_HOLD", any_(cond("capecitabine_bilirubin_uln",">",3),cond("capecitabine_alt_ast_uln",">",2.5)), "withhold", ["capecitabine"], "Bilirubin >3 ×ULN or ALT/AST >2.5 ×ULN: withhold capecitabine and reassess according to the source pathway.")


def add_oxaliplatin(p: dict[str, Any], code: str) -> None:
    ensure_input(p, "oxaliplatin_renal_band", select("Renal function for oxaliplatin", [("ge30","CrCl ≥30 mL/min"),("lt30","CrCl <30 mL/min"),("dialysis","Dialysis")]), replace=True)
    add_rule(p, f"{code}_OXALI_LT30", cond("oxaliplatin_renal_band","==","lt30"), "dose_reduce", ["oxaliplatin"], "CrCl <30 mL/min: consider 50% of the original oxaliplatin dose.", 50)
    add_rule(p, f"{code}_OXALI_DIALYSIS", cond("oxaliplatin_renal_band","==","dialysis"), "dose_reduce", ["oxaliplatin"], "Dialysis: consider 50% oxaliplatin with dialysis timing directed by the Consultant and oncology pharmacy.", 50)


def add_cisplatin(p: dict[str, Any], code: str, variant: str = "standard") -> None:
    if variant == "45":
        opts=[("ge60","CrCl ≥60 mL/min"),("45_59","CrCl 45–59 mL/min"),("lt45","CrCl <45 mL/min"),("dialysis","Dialysis")]
        ensure_input(p,"cisplatin_crcl_band",select("Creatinine clearance for cisplatin",opts),replace=True)
        add_rule(p,f"{code}_CIS_45_59",cond("cisplatin_crcl_band","==","45_59"),"dose_reduce",["cisplatin"],"CrCl 45–59 mL/min: administer 75% of the cisplatin dose.",75)
        add_rule(p,f"{code}_CIS_LT45",cond("cisplatin_crcl_band","==","lt45"),"contraindicated",["cisplatin"],"CrCl <45 mL/min: hold/omit cisplatin or use the source alternative after Consultant review.")
    else:
        opts=[("ge60","CrCl ≥60 mL/min"),("50_59","CrCl 50–59 mL/min"),("40_49","CrCl 40–49 mL/min"),("lt40","CrCl <40 mL/min"),("dialysis","Dialysis")]
        ensure_input(p,"cisplatin_crcl_band",select("Creatinine clearance for cisplatin",opts),replace=True)
        add_rule(p,f"{code}_CIS_50_59",cond("cisplatin_crcl_band","==","50_59"),"dose_reduce",["cisplatin"],"CrCl 50–59 mL/min: administer 75% of the cisplatin dose.",75)
        add_rule(p,f"{code}_CIS_40_49",cond("cisplatin_crcl_band","==","40_49"),"dose_reduce",["cisplatin"],"CrCl 40–49 mL/min: administer 50% of the cisplatin dose.",50)
        add_rule(p,f"{code}_CIS_LT40",cond("cisplatin_crcl_band","==","lt40"),"contraindicated",["cisplatin"],"CrCl <40 mL/min: cisplatin is not recommended in the routine source pathway.")
    add_rule(p,f"{code}_CIS_DIALYSIS",cond("cisplatin_crcl_band","==","dialysis"),"dose_reduce",["cisplatin"],"Haemodialysis: a 50% cisplatin dose may be considered only with specialist dialysis timing and pharmacy review.",50)


def add_carboplatin(p: dict[str, Any], code: str) -> None:
    ensure_input(p,"gfr_crcl_ml_min",number("GFR / CrCl used for carboplatin dosing","mL/min",80,1))
    add_rule(p,f"{code}_CARBO_LE20",cond("gfr_crcl_ml_min","<=",20),"contraindicated",["carboplatin"],"GFR/CrCl ≤20 mL/min is outside the routine carboplatin pathway.")
    add_rule(p,f"{code}_CARBO_21_30",all_(cond("gfr_crcl_ml_min",">",20),cond("gfr_crcl_ml_min","<=",30)),"consultant_review",["carboplatin"],"GFR/CrCl 21–30 mL/min requires extreme caution and specialist Calvert-dose review.")


def add_irinotecan(p: dict[str, Any], code: str) -> None:
    ensure_input(p,"irinotecan_renal_band",select("Renal status for irinotecan",[("not_dialysis","Not receiving dialysis"),("dialysis","Haemodialysis")]))
    ensure_input(p,"irinotecan_bilirubin_uln",number("Bilirubin for irinotecan","×ULN",0.8,0.1))
    add_rule(p,f"{code}_IRINO_DIALYSIS",cond("irinotecan_renal_band","==","dialysis"),"consultant_review",["irinotecan"],"Haemodialysis: irinotecan dosing is not routinely established; use only after Consultant/pharmacy review.")
    add_rule(p,f"{code}_IRINO_BILI_1_5_3",all_(cond("irinotecan_bilirubin_uln",">",1.5),cond("irinotecan_bilirubin_uln","<=",3)),"dose_reduce",["irinotecan"],"Bilirubin >1.5 to 3 ×ULN: use the source-reduced irinotecan dose (200 mg/m² for the 3-weekly monotherapy table).")
    add_rule(p,f"{code}_IRINO_BILI_GT3",cond("irinotecan_bilirubin_uln",">",3),"contraindicated",["irinotecan"],"Bilirubin >3 ×ULN: discontinue/do not administer irinotecan.")


def add_epirubicin(p: dict[str, Any], code: str, variant: str = "standard") -> None:
    ensure_input(p,"epirubicin_bilirubin_umol_l",number("Bilirubin for epirubicin","µmol/L",12,1))
    ensure_input(p,"epirubicin_ast_uln",number("AST for epirubicin","×ULN",1,0.1))
    if variant == "ecf":
        add_rule(p,f"{code}_EPI_REDUCE50",any_(all_(cond("epirubicin_bilirubin_umol_l",">=",24),cond("epirubicin_bilirubin_umol_l","<=",51)),all_(cond("epirubicin_ast_uln",">=",2),cond("epirubicin_ast_uln","<=",5))),"dose_reduce",["epirubicin"],"Bilirubin 24–51 µmol/L or AST 2–5 ×ULN: administer 50% epirubicin.",50)
        add_rule(p,f"{code}_EPI_REDUCE25",any_(all_(cond("epirubicin_bilirubin_umol_l",">",51),cond("epirubicin_bilirubin_umol_l","<=",85)),cond("epirubicin_ast_uln",">",5)),"dose_reduce",["epirubicin"],"Bilirubin 52–85 µmol/L or AST >5 ×ULN: administer 25% epirubicin.",25)
        add_rule(p,f"{code}_EPI_OMIT",cond("epirubicin_bilirubin_umol_l",">",85),"contraindicated",["epirubicin"],"Bilirubin >85 µmol/L: omit epirubicin.")
    else:
        add_rule(p,f"{code}_EPI_REDUCE50",any_(all_(cond("epirubicin_bilirubin_umol_l",">=",21),cond("epirubicin_bilirubin_umol_l","<=",51)),all_(cond("epirubicin_ast_uln",">=",2),cond("epirubicin_ast_uln","<=",4))),"dose_reduce",["epirubicin"],"Bilirubin 21–51 µmol/L or AST 2–4 ×ULN: consider 50% epirubicin.",50)
        add_rule(p,f"{code}_EPI_REDUCE25",any_(cond("epirubicin_bilirubin_umol_l",">",51),cond("epirubicin_ast_uln",">",4)),"dose_reduce",["epirubicin"],"Bilirubin >51 µmol/L or AST >4 ×ULN: consider 25% epirubicin.",25)
        add_rule(p,f"{code}_EPI_NOT_RECOMMENDED",cond("epirubicin_bilirubin_umol_l",">",86),"contraindicated",["epirubicin"],"Bilirubin >86 µmol/L or Child–Pugh C: epirubicin is not recommended.")


def add_temozolomide(p: dict[str, Any], code: str) -> None:
    ensure_input(p,"temozolomide_renal_band",select("Renal function for temozolomide",[("ge36","CrCl ≥36 mL/min"),("lt36","CrCl <36 mL/min"),("dialysis","Dialysis")]))
    ensure_input(p,"temozolomide_hepatic_band",select("Hepatic impairment for temozolomide",[("none_mild_moderate","None, mild or moderate"),("severe","Severe")]))
    add_rule(p,f"{code}_TMZ_RENAL_LOW",cond("temozolomide_renal_band","in",["lt36","dialysis"]),"proceed_with_caution",["temozolomide"],"CrCl <36 mL/min or dialysis: no dose adjustment is expected, but use clinical judgement and close monitoring.")
    add_rule(p,f"{code}_TMZ_HEP_SEV",cond("temozolomide_hepatic_band","==","severe"),"consultant_review",["temozolomide"],"Severe hepatic impairment: temozolomide requires individual specialist review.")


def add_teysuno(p: dict[str, Any], code: str) -> None:
    ensure_input(p,"teysuno_renal_band",select("Renal function for Teysuno (S-1)",[("gt50","CrCl >50 mL/min"),("30_50","CrCl 30–50 mL/min"),("lt30","CrCl <30 mL/min"),("dialysis","Dialysis")]))
    add_rule(p,f"{code}_TEYSUNO_30_50",cond("teysuno_renal_band","==","30_50"),"dose_reduce",["teysuno"],"CrCl 30–50 mL/min: administer 80% of the Teysuno dose.",80)
    add_rule(p,f"{code}_TEYSUNO_LT30",cond("teysuno_renal_band","in",["lt30","dialysis"]),"dose_reduce",["teysuno"],"CrCl <30 mL/min or dialysis: administer 40% of the Teysuno dose only with specialist review.",40)


def add_mitomycin(p: dict[str, Any], code: str) -> None:
    ensure_input(p,"mitomycin_crcl_band",select("Renal function for mitomycin",[("gt10","CrCl >10 mL/min"),("eq10","CrCl exactly 10 mL/min"),("lt10","CrCl <10 mL/min")]))
    ensure_input(p,"mitomycin_ast_uln",number("AST for mitomycin","×ULN",1,0.1))
    add_rule(p,f"{code}_MITO_LT10",cond("mitomycin_crcl_band","==","lt10"),"dose_reduce",["mitomycin"],"CrCl <10 mL/min: administer 75% of the mitomycin dose.",75)
    add_rule(p,f"{code}_MITO_EQ10",cond("mitomycin_crcl_band","==","eq10"),"consultant_review",["mitomycin"],"CrCl exactly 10 mL/min is not explicitly allocated by the source table; obtain Consultant/pharmacy review.")
    add_rule(p,f"{code}_MITO_AST_GT2",cond("mitomycin_ast_uln",">",2),"consultant_review",["mitomycin"],"AST >2 ×ULN: hepatic dose modification is a clinical decision for mitomycin.")


def profile_lutathera(p: dict[str, Any], code: str) -> None:
    ensure_input(p,"lutathera_renal_band",select("Renal function for lutetium-177 oxodotreotide",[("ge40","CrCl ≥40 mL/min"),("30_39","CrCl 30–39 mL/min"),("lt30","CrCl <30 mL/min"),("dialysis","Dialysis")]))
    ensure_input(p,"lutathera_hepatic_band",select("Hepatic function for lutetium-177 oxodotreotide",[("none_mild_moderate","None, mild or moderate"),("severe","Bilirubin >3 ×ULN / severe impairment")]))
    ensure_input(p,"lutathera_renal_toxicity",boolean("Treatment-emergent renal toxicity: CrCl <40, creatinine +40%, or CrCl decrease 40%"))
    ensure_input(p,"lutathera_hepatic_toxicity",boolean("Treatment-emergent severe hepatic toxicity (bilirubin >3 ×ULN or albumin <30 g/L with INR >1.5)"))
    add_rule(p,f"{code}_LUTA_LT30",cond("lutathera_renal_band","in",["lt30","dialysis"]),"contraindicated",["lutetium_177_oxodotreotide"],"CrCl <30 mL/min: lutetium-177 oxodotreotide is contraindicated; baseline CrCl <40 mL/min is not routinely recommended.")
    add_rule(p,f"{code}_LUTA_30_39",cond("lutathera_renal_band","==","30_39"),"contraindicated",["lutetium_177_oxodotreotide"],"Baseline CrCl 30–39 mL/min: treatment is not recommended in the routine source pathway.")
    add_rule(p,f"{code}_LUTA_HEP_SEV",cond("lutathera_hepatic_band","==","severe"),"consultant_review",["lutetium_177_oxodotreotide"],"Severe hepatic impairment: treat only after careful specialist benefit–risk review.")
    add_rule(p,f"{code}_LUTA_RENAL_TOX",cond("lutathera_renal_toxicity","==",True),"withhold",["lutetium_177_oxodotreotide"],"Treatment-emergent renal toxicity: withhold; if recovery occurs, resume at the reduced 3,700 MBq level, and discontinue for recurrence or prolonged non-recovery.")
    add_rule(p,f"{code}_LUTA_HEP_TOX",cond("lutathera_hepatic_toxicity","==",True),"withhold",["lutetium_177_oxodotreotide"],"Severe treatment-emergent hepatic toxicity: withhold and use the source reduce/discontinue pathway.")


def profile_sorafenib(p: dict[str, Any], code: str) -> None:
    ensure_input(p,"sorafenib_renal_band",select("Renal function for sorafenib",[("ge40","CrCl ≥40 mL/min"),("20_39","CrCl 20–39 mL/min"),("lt20","CrCl <20 mL/min"),("dialysis","Dialysis")]))
    ensure_input(p,"child_pugh_class",select("Child–Pugh class",[("none","No hepatic impairment"),("A","Child–Pugh A"),("B","Child–Pugh B"),("C","Child–Pugh C")]))
    add_rule(p,f"{code}_SORA_20_39",cond("sorafenib_renal_band","==","20_39"),"dose_reduce",["sorafenib"],"CrCl 20–39 mL/min: start sorafenib at 200 mg twice daily and escalate if tolerated.")
    add_rule(p,f"{code}_SORA_LT20",cond("sorafenib_renal_band","in",["lt20","dialysis"]),"dose_reduce",["sorafenib"],"CrCl <20 mL/min or dialysis: start sorafenib at 200 mg once daily and escalate only if tolerated.")
    add_rule(p,f"{code}_SORA_CHILD_C",cond("child_pugh_class","==","C"),"dose_reduce",["sorafenib"],"Child–Pugh C: start sorafenib at 200 mg once daily and escalate only after specialist review.")


def add_pemetrexed(p: dict[str, Any], code: str) -> None:
    ensure_input(p,"pemetrexed_renal_band",select("Renal function for pemetrexed",[("ge45","CrCl ≥45 mL/min"),("30_44","CrCl 30–44 mL/min"),("lt30","CrCl <30 mL/min"),("dialysis","Dialysis")]))
    ensure_input(p,"pemetrexed_severe_hepatic",boolean("Severe hepatic impairment"))
    add_rule(p,f"{code}_PEME_LT45",cond("pemetrexed_renal_band","in",["30_44","lt30","dialysis"]),"contraindicated",["pemetrexed"],"CrCl <45 mL/min or dialysis: pemetrexed is not recommended.")
    add_rule(p,f"{code}_PEME_HEP_SEV",cond("pemetrexed_severe_hepatic","==",True),"contraindicated",["pemetrexed"],"Severe hepatic impairment: pemetrexed is not recommended in the routine source pathway.")


def targeted_inputs(p: dict[str, Any], renal_options: list[tuple[str,str]], hepatic_options: list[tuple[str,str]]) -> None:
    ensure_input(p,"targeted_renal_band",select("Renal function for this targeted therapy",renal_options), replace=True)
    ensure_input(p,"targeted_hepatic_band",select("Hepatic function for this targeted therapy",hepatic_options), replace=True)


def profile_targeted(p: dict[str, Any], code: str) -> None:
    # Code-specific NCCP renal/hepatic tables. Normal/no-adjustment bands are deliberately rule-free.
    if code == "00221":  # afatinib
        targeted_inputs(p,[("ge15","CrCl ≥15 mL/min"),("lt15","CrCl <15 mL/min"),("dialysis","Dialysis")],[("none","None"),("A","Child–Pugh A"),("B","Child–Pugh B"),("C","Child–Pugh C")])
        add_rule(p,f"{code}_AFA_LT15",cond("targeted_renal_band","in",["lt15","dialysis"]),"proceed_with_caution",["afatinib"],"CrCl <15 mL/min or dialysis: no adjustment is expected, but evidence is limited and close monitoring is required.")
        add_rule(p,f"{code}_AFA_CHILD_C",cond("targeted_hepatic_band","==","C"),"proceed_with_caution",["afatinib"],"Child–Pugh C: no adjustment is expected by the source, but evidence is limited; use close specialist monitoring.")
    elif code == "00401":  # alectinib
        targeted_inputs(p,[("ge30","CrCl ≥30"),("lt30","CrCl <30"),("dialysis","Dialysis")],[("none","None"),("A","Child A"),("B","Child B"),("C","Child C")])
        ensure_input(p,"alt_ast_uln_multiple",number("ALT or AST","×ULN",1,0.1)); ensure_input(p,"bilirubin_uln_multiple",number("Bilirubin","×ULN",0.8,0.1))
        add_rule(p,f"{code}_ALEC_CHILD_C",cond("targeted_hepatic_band","==","C"),"dose_reduce",["alectinib"],"Child–Pugh C: administer 75% of the standard alectinib dose (450 mg twice daily).",75)
        add_rule(p,f"{code}_ALEC_LFT_HOLD",all_(cond("alt_ast_uln_multiple",">",5),cond("bilirubin_uln_multiple","<=",2)),"withhold",["alectinib"],"ALT/AST >5 ×ULN with bilirubin ≤2 ×ULN: withhold alectinib and restart at a reduced dose after recovery.")
        add_rule(p,f"{code}_ALEC_LFT_STOP",all_(cond("alt_ast_uln_multiple",">",3),cond("bilirubin_uln_multiple",">",2)),"permanently_discontinue",["alectinib"],"ALT/AST >3 ×ULN with bilirubin >2 ×ULN: permanently discontinue alectinib unless another cause is established.")
    elif code == "00562":  # brigatinib
        targeted_inputs(p,[("ge30","CrCl ≥30"),("lt30","CrCl <30"),("dialysis","Dialysis")],[("none","None"),("A","Child A"),("B","Child B"),("C","Child C")])
        add_rule(p,f"{code}_BRIG_RENAL",cond("targeted_renal_band","in",["lt30","dialysis"]),"dose_reduce",["brigatinib"],"CrCl <30 mL/min: start brigatinib 60 mg daily for 7 days, then 90 mg daily if tolerated.")
        add_rule(p,f"{code}_BRIG_CHILD_C",cond("targeted_hepatic_band","==","C"),"dose_reduce",["brigatinib"],"Child–Pugh C: start 60 mg daily for 7 days, then 120 mg daily if tolerated.")
    elif code == "00243":  # crizotinib
        targeted_inputs(p,[("gt30","CrCl >30"),("le30","CrCl ≤30"),("dialysis","Dialysis")],[("none_mild","None/mild"),("moderate","Moderate"),("severe","Severe")])
        add_rule(p,f"{code}_CRIZ_RENAL",cond("targeted_renal_band","in",["le30","dialysis"]),"dose_reduce",["crizotinib"],"CrCl ≤30 mL/min or dialysis: administer 50% of the standard crizotinib dose (250 mg once daily).",50)
        add_rule(p,f"{code}_CRIZ_HEP_MOD",cond("targeted_hepatic_band","==","moderate"),"dose_reduce",["crizotinib"],"Moderate hepatic impairment: start at approximately 80% of the standard crizotinib dose.",80)
        add_rule(p,f"{code}_CRIZ_HEP_SEV",cond("targeted_hepatic_band","==","severe"),"dose_reduce",["crizotinib"],"Severe hepatic impairment: start at 50% of the standard crizotinib dose.",50)
    elif code == "00565":  # dacomitinib
        targeted_inputs(p,[("mild_moderate","Mild/moderate renal impairment"),("severe","Severe renal impairment")],[("none","None"),("A_B","Child A/B"),("C","Child C")])
        add_rule(p,f"{code}_DACO_RENAL_SEV",cond("targeted_renal_band","==","severe"),"consultant_review",["dacomitinib"],"Severe renal impairment: the starting dose is not established; Consultant/pharmacy review is required.")
        add_rule(p,f"{code}_DACO_CHILD_C",cond("targeted_hepatic_band","==","C"),"dose_reduce",["dacomitinib"],"Child–Pugh C: start dacomitinib at 30 mg daily; consider escalation to 45 mg after at least 4 weeks if tolerated.")
    elif code == "00353":  # osimertinib
        targeted_inputs(p,[("non_dialysis","Renal impairment, not dialysis"),("dialysis","Dialysis")],[("none_mild_mod","None, mild or moderate / Child A-B"),("severe","Severe / Child C")])
        add_rule(p,f"{code}_OSI_HEP_SEV",cond("targeted_hepatic_band","==","severe"),"dose_reduce",["osimertinib"],"Severe hepatic impairment / Child–Pugh C: consider 50% of the standard osimertinib dose.",50)
    elif code == "00220":  # gefitinib
        targeted_inputs(p,[("non_dialysis","Renal impairment, not dialysis"),("dialysis","Dialysis")],[("none_metastases_A","No impairment, hepatic metastases, or Child A"),("B_C","Child B or C")])
        add_rule(p,f"{code}_GEF_HEP_BC",cond("targeted_hepatic_band","==","B_C"),"dose_reduce",["gefitinib"],"Child–Pugh B or C: consider 50% of the standard gefitinib dose.",50)
    elif code == "00219":  # erlotinib
        targeted_inputs(p,[("ge15","CrCl ≥15"),("lt15","CrCl <15")],[("not_severe","No severe dysfunction"),("severe","Severe hepatic dysfunction / AST or ALT >5 ×ULN")])
        add_rule(p,f"{code}_ERLO_RENAL",cond("targeted_renal_band","==","lt15"),"contraindicated",["erlotinib"],"CrCl <15 mL/min: erlotinib should not be used.")
        add_rule(p,f"{code}_ERLO_HEP",cond("targeted_hepatic_band","==","severe"),"contraindicated",["erlotinib"],"Severe hepatic dysfunction or AST/ALT >5 ×ULN: erlotinib is not recommended.")
    elif code == "00702":  # entrectinib
        targeted_inputs(p,[("mild_moderate","Mild/moderate renal impairment"),("severe","Severe renal impairment")],[("none_mild_mod","None/mild/moderate"),("severe","Severe")])
        add_rule(p,f"{code}_ENT_RENAL_SEV",cond("targeted_renal_band","==","severe"),"consultant_review",["entrectinib"],"Severe renal impairment: not studied; obtain specialist review.")
        add_rule(p,f"{code}_ENT_HEP_SEV",cond("targeted_hepatic_band","==","severe"),"proceed_with_caution",["entrectinib"],"Severe hepatic impairment: no adjustment is recommended by the source, but close monitoring is required.")
    elif code == "00570":  # lorlatinib
        targeted_inputs(p,[("ge30","CrCl ≥30"),("lt30","CrCl <30"),("dialysis","Dialysis")],[("none_mild","None/mild"),("moderate_severe","Moderate or severe")])
        add_rule(p,f"{code}_LOR_RENAL",cond("targeted_renal_band","==","lt30"),"dose_reduce",["lorlatinib"],"CrCl <30 mL/min: start lorlatinib at 75 mg daily.")
        add_rule(p,f"{code}_LOR_DIALYSIS",cond("targeted_renal_band","==","dialysis"),"consultant_review",["lorlatinib"],"Dialysis: no source dosing information; Consultant/pharmacy review is required.")
        add_rule(p,f"{code}_LOR_HEP",cond("targeted_hepatic_band","==","moderate_severe"),"contraindicated",["lorlatinib"],"Moderate or severe hepatic impairment: lorlatinib is not recommended.")
    elif code == "00901":  # ivosidenib
        targeted_inputs(p,[("ge30","CrCl ≥30"),("lt30","CrCl <30"),("dialysis","Dialysis")],[("none","None"),("A_B","Child A/B"),("C","Child C")])
        add_rule(p,f"{code}_IVO_RENAL_LOW",cond("targeted_renal_band","in",["lt30","dialysis"]),"proceed_with_caution",["ivosidenib"],"CrCl <30 mL/min or dialysis: no adjustment is expected, but evidence is limited and close monitoring is required.")
        add_rule(p,f"{code}_IVO_CHILD_C",cond("targeted_hepatic_band","==","C"),"contraindicated",["ivosidenib"],"Child–Pugh C: ivosidenib is not recommended.")
    elif code == "00340":  # ceritinib
        targeted_inputs(p,[("ge30","CrCl ≥30"),("lt30","CrCl <30")],[("none","None"),("A_B","Child A/B"),("C","Child C")])
        add_rule(p,f"{code}_CERI_RENAL",cond("targeted_renal_band","==","lt30"),"proceed_with_caution",["ceritinib"],"CrCl <30 mL/min: no adjustment is expected, but use close monitoring because evidence is limited.")
        add_rule(p,f"{code}_CERI_CHILD_C",cond("targeted_hepatic_band","==","C"),"dose_reduce",["ceritinib"],"Child–Pugh C: administer approximately 67% of the original ceritinib dose.",67)
    elif code == "00823":  # tepotinib
        targeted_inputs(p,[("ge30","CrCl ≥30"),("lt30","CrCl <30"),("dialysis","Dialysis")],[("none","None"),("A_B","Child A/B"),("C","Child C")])
        ensure_input(p,"alt_ast_uln_multiple",number("ALT or AST","×ULN",1,0.1)); ensure_input(p,"bilirubin_uln_multiple",number("Bilirubin","×ULN",0.8,0.1))
        add_rule(p,f"{code}_TEPO_CHILD_C",cond("targeted_hepatic_band","==","C"),"contraindicated",["tepotinib"],"Child–Pugh C: tepotinib is not recommended.")
        add_rule(p,f"{code}_TEPO_LFT_STOP",all_(cond("alt_ast_uln_multiple",">",3),cond("bilirubin_uln_multiple",">",2)),"permanently_discontinue",["tepotinib"],"ALT/AST >3 ×ULN with bilirubin >2 ×ULN: permanently discontinue tepotinib.")
        add_rule(p,f"{code}_TEPO_ALT20",cond("alt_ast_uln_multiple",">",20),"permanently_discontinue",["tepotinib"],"ALT/AST >20 ×ULN: permanently discontinue tepotinib.")
        add_rule(p,f"{code}_TEPO_ALT5",all_(cond("alt_ast_uln_multiple",">",5),cond("alt_ast_uln_multiple","<=",20)),"withhold",["tepotinib"],"ALT/AST >5–20 ×ULN: withhold tepotinib and use the source same-dose/reduced-dose restart pathway after recovery.")
    elif code == "00889":  # pemigatinib
        targeted_inputs(p,[("ge30","CrCl ≥30"),("lt30","CrCl <30"),("dialysis","Dialysis")],[("none","None"),("A_B","Child A/B"),("C","Child C")])
        add_rule(p,f"{code}_PEMI_RENAL",cond("targeted_renal_band","==","lt30"),"dose_reduce",["pemigatinib"],"CrCl <30 mL/min: reduce pemigatinib by one dose level (13.5→9 mg; 9→4.5 mg).")
        add_rule(p,f"{code}_PEMI_CHILD_C",cond("targeted_hepatic_band","==","C"),"dose_reduce",["pemigatinib"],"Child–Pugh C: reduce pemigatinib by one dose level (13.5→9 mg; 9→4.5 mg).")
    elif code == "00890":  # fruquintinib
        targeted_inputs(p,[("mild","Mild renal impairment"),("moderate","Moderate renal impairment"),("severe","Severe renal impairment")],[("none","None"),("mild_mod","Mild or moderate"),("severe","Severe")])
        ensure_input(p,"alt_ast_uln_multiple",number("ALT or AST","×ULN",1,0.1)); ensure_input(p,"bilirubin_uln_multiple",number("Bilirubin","×ULN",0.8,0.1))
        add_rule(p,f"{code}_FRUQ_HEP_SEV",cond("targeted_hepatic_band","==","severe"),"contraindicated",["fruquintinib"],"Severe hepatic impairment: fruquintinib is not recommended.")
        add_rule(p,f"{code}_FRUQ_STOP",all_(cond("alt_ast_uln_multiple",">",3),cond("bilirubin_uln_multiple",">",2)),"permanently_discontinue",["fruquintinib"],"ALT/AST >3 ×ULN with bilirubin >2 ×ULN: permanently discontinue fruquintinib.")
        add_rule(p,f"{code}_FRUQ_G4",cond("alt_ast_uln_multiple",">",20),"permanently_discontinue",["fruquintinib"],"Grade 4 transaminase elevation: permanently discontinue fruquintinib.")
        add_rule(p,f"{code}_FRUQ_G2_3",all_(cond("alt_ast_uln_multiple",">",3),cond("alt_ast_uln_multiple","<=",20)),"withhold",["fruquintinib"],"Grade 2–3 transaminase elevation: withhold until recovery to grade 1/baseline and resume at the source-directed dose.")
    elif code == "00644":  # lenvatinib HCC
        p.setdefault("input_definitions", {}).pop("renal_toxicity_grade", None)
        p.setdefault("input_definitions", {}).pop("hepatic_toxicity_grade", None)
        targeted_inputs(p,[("ge30","CrCl ≥30"),("lt30","CrCl <30"),("dialysis","Dialysis")],[("none","None"),("A_B","Child A/B"),("C","Child C")])
        ensure_input(p,"renal_toxicity_requires_interruption",boolean("Renal toxicity requiring interruption (grade 3 or worse)"),replace=True); ensure_input(p,"hepatic_toxicity_requires_interruption",boolean("Hepatic toxicity requiring interruption (grade 3 or worse)"),replace=True)
        add_rule(p,f"{code}_LEN_RENAL_LOW",cond("targeted_renal_band","==","lt30"),"consultant_review",["lenvatinib"],"CrCl <30 mL/min: not studied in HCC; Consultant/pharmacy review is required.")
        add_rule(p,f"{code}_LEN_DIALYSIS",cond("targeted_renal_band","==","dialysis"),"dose_reduce",["lenvatinib"],"Haemodialysis: a 50% lenvatinib dose may be considered only after specialist review.",50)
        add_rule(p,f"{code}_LEN_CHILD_C",cond("targeted_hepatic_band","==","C"),"contraindicated",["lenvatinib"],"Child–Pugh C: lenvatinib is not recommended for HCC.")
        add_rule(p,f"{code}_LEN_RENAL_G3",cond("renal_toxicity_requires_interruption","==",True),"withhold",["lenvatinib"],"Grade 3 renal toxicity: interrupt lenvatinib; grade 4 toxicity requires discontinuation.")
        add_rule(p,f"{code}_LEN_HEP_G3",cond("hepatic_toxicity_requires_interruption","==",True),"withhold",["lenvatinib"],"Grade 3 hepatic toxicity: interrupt lenvatinib; grade 4 toxicity requires discontinuation.")
    else:
        raise RuntimeError(f"No targeted profile for {code}")


def profile_nintedanib_docetaxel(p: dict[str, Any], code: str) -> None:
    ensure_input(p,"nintedanib_renal_band",select("Renal function for nintedanib",[("gt30","CrCl >30 mL/min"),("le30","CrCl ≤30 mL/min")]))
    ensure_input(p,"nintedanib_child_pugh",select("Child–Pugh class for nintedanib",[("none","None"),("A","Child A"),("B_C","Child B or C")]))
    ensure_input(p,"alt_ast_uln_multiple",number("ALT or AST","×ULN",1,0.1)); ensure_input(p,"bilirubin_uln_multiple",number("Bilirubin","×ULN",0.8,0.1)); ensure_input(p,"alp_uln_multiple",number("ALP","×ULN",1,0.1))
    add_rule(p,f"{code}_NINT_RENAL",cond("nintedanib_renal_band","==","le30"),"consultant_review",["nintedanib"],"CrCl ≤30 mL/min: nintedanib has not been studied; specialist review is required.")
    add_rule(p,f"{code}_NINT_HEP",cond("nintedanib_child_pugh","==","B_C"),"contraindicated",["nintedanib"],"Child–Pugh B or C: nintedanib is not recommended.")
    add_rule(p,f"{code}_NINT_LFT_STOP",all_(cond("alt_ast_uln_multiple",">",3),cond("bilirubin_uln_multiple",">=",2),cond("alp_uln_multiple","<",2)),"permanently_discontinue",["nintedanib"],"ALT/AST >3 ×ULN with bilirubin ≥2 ×ULN and ALP <2 ×ULN: permanently discontinue nintedanib.")
    add_rule(p,f"{code}_NINT_LFT_HOLD",all_(cond("alt_ast_uln_multiple",">",2.5),cond("alt_ast_uln_multiple","<=",5),cond("bilirubin_uln_multiple",">=",1.5)),"withhold",["nintedanib"],"ALT/AST >2.5–5 ×ULN with bilirubin ≥1.5 ×ULN: withhold nintedanib and resume at a reduced dose after recovery.")
    profile_docetaxel(p,code)


def profile_no_prescriptive(p: dict[str, Any], code: str) -> None:
    # Deliberately no artificial CrCl/bilirubin trigger. Source-reviewed absence is represented in metadata.
    pass


def apply_profiles(code: str, p: dict[str, Any]) -> list[str]:
    drugs = [str(x).lower() for x in p.get("metadata", {}).get("drugs", [])]
    components: list[str] = []

    if code in {"00205","00462"}: profile_pld(p,code); components.append("pegylated_liposomal_doxorubicin")
    elif code in {"00283","00284","00521","00522","00559"}: profile_gemcitabine(p,code); components.append("gemcitabine")
    elif code in {"00719","00325"}: profile_sunitinib(p,code); components.append("sunitinib")
    elif code == "00320": profile_everolimus(p,code); components.append("everolimus")
    elif code == "00311": profile_topotecan_iv(p,code); components.append("topotecan")
    elif code == "00587": profile_topotecan_oral(p,code); components.append("topotecan")
    elif code == "00511": profile_dacarbazine(p,code); components.append("dacarbazine")
    elif code == "00680": profile_ifosfamide(p,code); components.append("ifosfamide")
    elif code == "00335": profile_imatinib(p,code); components.append("imatinib")
    elif code == "00386": profile_doxorubicin(p,code); components.append("doxorubicin")
    elif code in {"00222","00318"}:
        add_pemetrexed(p,code); components.append("pemetrexed")
        if "carboplatin" in drugs: add_carboplatin(p,code); components.append("carboplatin")
    elif code in {"00219","00220","00221","00243","00340","00353","00401","00562","00565","00570","00644","00702","00823","00889","00890","00901"}: profile_targeted(p,code); components.extend(drugs)
    elif code == "00372": profile_nintedanib_docetaxel(p,code); components.extend(["nintedanib","docetaxel"])
    elif code == "00642": profile_lutathera(p,code); components.append("lutetium_177_oxodotreotide")
    elif code == "00294": profile_sorafenib(p,code); components.append("sorafenib")
    elif code in NO_PRESCRIPTIVE_ONLY: profile_no_prescriptive(p,code); components.extend(drugs)
    else:
        # Combination/legacy cytotoxic profiles, assembled component by component.
        if "gemcitabine" in drugs: profile_gemcitabine(p,code); components.append("gemcitabine")
        if "docetaxel" in drugs: profile_docetaxel(p,code); components.append("docetaxel")
        if "doxorubicin" in drugs: profile_doxorubicin(p,code); components.append("doxorubicin")
        if "irinotecan" in drugs: add_irinotecan(p,code); components.append("irinotecan")
        if "oxaliplatin" in drugs: add_oxaliplatin(p,code); components.append("oxaliplatin")
        if "5-fluorouracil" in drugs:
            add_5fu(p,code,severe_not_recommended=(code=="00502")); components.append("fluorouracil")
        if "capecitabine" in drugs: add_capecitabine(p,code); components.append("capecitabine")
        if "cisplatin" in drugs:
            add_cisplatin(p,code,variant="45" if code in {"00240","00383","00594"} else "standard"); components.append("cisplatin")
        if "carboplatin" in drugs: add_carboplatin(p,code); components.append("carboplatin")
        if "epirubicin" in drugs: add_epirubicin(p,code,variant="ecf" if code=="00240" else "standard"); components.append("epirubicin")
        if "temozolomide" in drugs: add_temozolomide(p,code); components.append("temozolomide")
        if "tegafur/gimeracil/oteracil" in drugs: add_teysuno(p,code); components.append("teysuno")
        if "mitomycin" in drugs: add_mitomycin(p,code); components.append("mitomycin")
        # Explicitly source-reviewed biologics with no organ-function dose table.
        for biologic in ["bevacizumab","cetuximab","panitumumab","trastuzumab"]:
            if biologic in drugs: components.append(biologic)
        if not components:
            raise RuntimeError(f"No profile components applied for {code}: {drugs}")
    return list(dict.fromkeys(components))


def classify_resolution(code: str, p: dict[str, Any]) -> str:
    rules = p.get("rule_engine", {}).get("rules", [])
    added = [r for r in rules if str(r.get("id") or r.get("rule_id") or "").startswith(PREFIX)]
    if code in NO_PRESCRIPTIVE_ONLY and not added:
        return "source_reviewed_no_prescriptive_adjustment"
    return "structured_rules"



def _condition_uses_option_value(node: Any, field: str, option_values: set[str]) -> bool:
    if isinstance(node, list):
        return any(_condition_uses_option_value(item, field, option_values) for item in node)
    if not isinstance(node, dict):
        return False
    if node.get("field") == field:
        value = node.get("value")
        if isinstance(value, list):
            return any(str(item) in option_values for item in value)
        return str(value) in option_values
    return any(_condition_uses_option_value(value, field, option_values) for value in node.values())


def standardize_renal_input_metadata(p: dict[str, Any]) -> None:
    """Keep v0.37+ renal-input UI contracts without changing rule semantics."""
    rules = p.get("rule_engine", {}).get("rules", [])
    for field, definition in p.get("input_definitions", {}).items():
        text = f"{field} {definition.get('label','')}".lower()
        if not re.search(r"crcl|creatinine clearance|\begfr\b|\bgfr\b|renal function|renal status", text):
            continue
        if definition.get("type") == "select":
            definition["renal_input"] = {
                "mode": "protocol_specific_band",
                "exact_value_required": False,
            }
            options = definition.get("options", [])
            option_values = {str(option.get("value")) for option in options}
            string_rules = any(
                _condition_uses_option_value(rule.get("when", rule.get("condition", {})), field, option_values)
                for rule in rules
            )
            for index, option in enumerate(options):
                # Exact category rules must receive the category token. Existing
                # numeric decision values are retained where rules use thresholds.
                if string_rules:
                    option["decision_value"] = option.get("value")
                else:
                    option.setdefault("decision_value", index)
        elif definition.get("type") == "number":
            definition["renal_input"] = {
                "mode": "exact_continuous",
                "exact_value_required": True,
                "reason": "The source uses continuous GFR/CrCl in component dosing or a formula-based calculation, so an exact verified value is required.",
            }

def update_metadata(p: dict[str, Any], code: str, components: list[str], resolution: str) -> None:
    m = p.setdefault("metadata", {})
    source_url = m.get("source_url")
    source_version = m.get("nccp_version")
    m["sactcheck_encoding_version"] = RELEASE
    m["partial_assessment_supported"] = True
    m["partial_assessment_policy"] = "Each entered value is assessed independently. Organ-function values or categories are optional; omitted domains remain unassessed and are never assumed normal."
    m["organ_function_reconciliation"] = {
        "release": RELEASE,
        "checked_date": CHECKED_DATE,
        "source_url": source_url,
        "source_version": source_version,
        "components": components,
        "resolution": resolution,
        "partial_assessment_supported": True,
        "source_reconciled": True,
        "consultant_reviewed": False,
        "oncology_pharmacy_reviewed": False,
        "clinical_use_authorised": False,
        "note": (
            "Structured renal/hepatic component rules were reconciled to the current official NCCP regimen source. "
            "Independent Consultant and oncology-pharmacy validation remains pending."
            if resolution == "structured_rules" else
            "The current official NCCP source was reviewed and does not provide a prescriptive renal/hepatic dose-adjustment table for this regimen component. No artificial cutoff has been introduced. Independent validation remains pending."
        ),
    }
    m["encoding_maturity"] = {
        "level": "source_reconciled_rule_encoding",
        "label": "Source-reconciled organ-function encoding · clinical/pharmacy review pending",
        "source_reconciled": True,
        "consultant_reviewed": False,
        "oncology_pharmacy_reviewed": False,
        "clinical_use_authorised": False,
    }
    validation = m.setdefault("validation", {})
    validation["rule_level_source_reconciliation_status"] = "source_reconciled_organ_function_v0590"
    validation["consultant_reviewed"] = False
    validation["oncology_pharmacy_reviewed"] = False
    validation["clinical_use_authorised"] = False

    p.setdefault("clinical_governance", {})["organ_function_rule_status"] = (
        "Source reconciled in SACTCheck v0.59.0; independent Consultant and oncology-pharmacy validation pending."
    )
    dose = p.setdefault("dose_modifications", {})
    if isinstance(dose, dict):
        dose["organ_function_reconciliation"] = {
            "status": "source_reconciled",
            "release": RELEASE,
            "resolution": resolution,
            "components": components,
            "source_url": source_url,
            "review_status": "independent_clinical_and_oncology_pharmacy_review_pending",
        }


def main() -> None:
    protocols = load_protocols()
    records: list[dict[str, Any]] = []
    for code in sorted(protocols):
        path, p = protocols[code]
        before_level = p.get("metadata", {}).get("encoding_maturity", {}).get("level")
        if before_level not in {"partial_rule_encoding", "source_reconciled_rule_encoding"}:
            raise RuntimeError(f"{code} expected v0.58.1 partial state; found {before_level!r}")
        remove_previous_release_rules(p)
        components = apply_profiles(code, p)
        standardize_renal_input_metadata(p)
        resolution = classify_resolution(code, p)
        update_metadata(p, code, components, resolution)
        path.write_text(json.dumps(p, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        added_rules = [r for r in p.get("rule_engine", {}).get("rules", []) if str(r.get("id") or r.get("rule_id") or "").startswith(PREFIX)]
        records.append({
            "nccp_code": code,
            "path": str(path.relative_to(ROOT)),
            "title": p.get("metadata", {}).get("title"),
            "source_url": p.get("metadata", {}).get("source_url"),
            "nccp_version": p.get("metadata", {}).get("nccp_version"),
            "components": components,
            "resolution": resolution,
            "added_rule_count": len(added_rules),
            "organ_input_count": len([k for k in p.get("input_definitions", {}) if any(t in k for t in ("renal","crcl","gfr","bilirubin","bili","ast","alt","hepatic","child_pugh","dialysis"))]),
        })

    register = {
        "release": RELEASE,
        "checked_date": CHECKED_DATE,
        "scope": "The 74 protocols marked partial_rule_encoding by the v0.58.1 organ-function audit.",
        "protocol_count": len(records),
        "structured_rule_records": sum(r["resolution"] == "structured_rules" for r in records),
        "source_reviewed_no_prescriptive_adjustment_records": sum(r["resolution"] == "source_reviewed_no_prescriptive_adjustment" for r in records),
        "records": records,
    }
    (ROOT / "V0590_ORGAN_FUNCTION_SOURCE_REGISTER.json").write_text(json.dumps(register, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Reconciled {len(records)} protocols: {register['structured_rule_records']} structured; {register['source_reviewed_no_prescriptive_adjustment_records']} explicit no-prescriptive-adjustment.")


if __name__ == "__main__":
    main()
