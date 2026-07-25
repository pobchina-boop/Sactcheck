#!/usr/bin/env python3
"""Materialise tumour-group context on indications in shared protocols."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "protocols" / "index.json"

ALIASES = {
    "breast": "Breast",
    "gastrointestinal": "Gastrointestinal",
    "gi": "Gastrointestinal",
    "gynaecology": "Gynaecology",
    "gynecology": "Gynaecology",
    "gynae": "Gynaecology",
    "lung": "Lung",
    "genitourinary": "Genitourinary",
    "gu": "Genitourinary",
    "neuro-oncology": "Neuro-oncology",
    "neurology": "Neuro-oncology",
    "sarcoma": "Sarcoma",
    "haematology": "Haematology",
    "hematology": "Haematology",
    "lymphoma": "Lymphoma",
    "skin/melanoma": "Skin/Melanoma",
    "skin": "Skin/Melanoma",
    "melanoma": "Skin/Melanoma",
    "head and neck": "Head and Neck",
    "head & neck": "Head and Neck",
    "headneck": "Head and Neck",
}


def arr(value):
    if value is None:
        return []
    return value if isinstance(value, list) else [value]


def normalise(value):
    text = str(value or "").strip()
    return ALIASES.get(text.lower(), text)


def unique(values):
    output = []
    for value in values:
        if value and value not in output:
            output.append(value)
    return output


def protocol_groups(protocol):
    md = protocol.get("metadata", {})
    plural = []
    for group in arr(md.get("tumour_groups")):
        plural.extend(str(group).split(","))
    groups = [normalise(g) for g in plural if str(g).strip()]
    if not groups and md.get("tumour_group"):
        groups = [normalise(md["tumour_group"])]
    return unique(groups)


def infer(indication, allowed):
    explicit = []
    for key in ("tumour_group", "tumour_groups", "tissue_group", "tissue_groups"):
        for group in arr(indication.get(key)):
            explicit.extend(str(group).split(","))
    explicit = unique(normalise(g) for g in explicit if str(g).strip())
    if explicit:
        return [g for g in explicit if not allowed or g in allowed]

    ident = str(indication.get("indication_id") or indication.get("id") or indication.get("code") or "").lower()
    desc = str(indication.get("description") or indication.get("indication") or indication.get("title") or "").lower()
    found = []

    suffix_patterns = [
        (r"(^|[-_])(skin|melanoma)([-_]|$)", "Skin/Melanoma"),
        (r"(^|[-_])gu([-_]|$)", "Genitourinary"),
        (r"(^|[-_])(gyn|gynae)([-_]|$)", "Gynaecology"),
        (r"(^|[-_])lung([-_]|$)", "Lung"),
        (r"(^|[-_])gi([-_]|$)", "Gastrointestinal"),
        (r"(^|[-_])sarcoma([-_]|$)", "Sarcoma"),
        (r"(^|[-_])breast([-_]|$)", "Breast"),
        (r"(^|[-_])(hn|headneck)([-_]|$)", "Head and Neck"),
    ]
    for pattern, group in suffix_patterns:
        if re.search(pattern, ident):
            found.append(group)

    keyword_patterns = [
        (r"\bbreast\b|her2-negative|her2-positive", "Breast"),
        (r"colorectal|colon cancer|rectal cancer|gastric|gastro[ -]?oesophageal|gastroesophageal|pancrea|hepatocellular|biliary|gastrointestinal neuroendocrine", "Gastrointestinal"),
        (r"ovarian|fallopian|peritoneal|cervical|endometrial|dysgerminoma", "Gynaecology"),
        (r"\bnsclc\b|\bsclc\b|lung cancer|small-cell lung|non-small-cell lung", "Lung"),
        (r"urothelial|bladder cancer|renal[ -]?cell|\brcc\b|prostate|testicular|extragonadal germ-cell", "Genitourinary"),
        (r"melanoma|merkel cell|cutaneous squamous|basal-cell|basal cell", "Skin/Melanoma"),
        (r"soft tissue sarcoma|liposarcoma|\bgist\b", "Sarcoma"),
        (r"head and neck|head-and-neck|\bhnscc\b", "Head and Neck"),
        (r"hodgkin|lymphoma|myeloma|leukaemia|leukemia", "Haematology"),
        (r"hodgkin|lymphoma", "Lymphoma"),
    ]
    for pattern, group in keyword_patterns:
        if re.search(pattern, desc):
            found.append(group)

    found = unique(found)
    within = [g for g in found if not allowed or g in allowed]
    if within:
        return within
    return allowed if len(allowed) == 1 else []


def main():
    index = json.loads(INDEX.read_text(encoding="utf-8"))
    changed_files = 0
    annotated = 0
    unresolved = []

    for entry in index["protocols"]:
        path = ROOT / entry["path"]
        protocol = json.loads(path.read_text(encoding="utf-8"))
        groups = protocol_groups(protocol)
        if len(groups) <= 1:
            continue

        changed = False
        for indication in protocol.get("indications", []):
            if not isinstance(indication, dict) or not indication.get("description"):
                continue
            inferred = infer(indication, groups)
            if inferred:
                if indication.get("tumour_groups") != inferred:
                    indication["tumour_groups"] = inferred
                    indication.pop("tumour_group", None)
                    changed = True
                    annotated += 1
            else:
                unresolved.append({
                    "path": entry["path"],
                    "indication_id": indication.get("indication_id"),
                    "description": indication.get("description"),
                    "protocol_groups": groups,
                })

        if changed:
            protocol.setdefault("metadata", {})["sactcheck_encoding_version"] = "0.45.1"
            path.write_text(json.dumps(protocol, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
            changed_files += 1

    audit = {
        "release": "0.45.1",
        "changed_protocol_files": changed_files,
        "annotated_indications": annotated,
        "unresolved_indications": unresolved,
    }
    (ROOT / "V0451_CONTEXTUAL_INDICATION_AUDIT.json").write_text(
        json.dumps(audit, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(json.dumps({k: v for k, v in audit.items() if k != "unresolved_indications"}, indent=2))
    print(f"unresolved={len(unresolved)}")


if __name__ == "__main__":
    main()
