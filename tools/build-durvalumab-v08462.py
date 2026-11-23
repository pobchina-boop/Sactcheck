#!/usr/bin/env python3
"""Regenerate the five reviewed patient suites, ending with their shared icon appendices."""
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COMBINATIONS = ("00897", "00926", "00953")

def run(*args, env=None):
    subprocess.run(args, cwd=ROOT, env=env, check=True)

def refresh_clinician_anatomy():
    bundle = ROOT / "js/patient-anatomy-data-v08431.js"
    prefix = "globalThis.SACTCheckAnatomyData="
    raw = bundle.read_text(encoding="utf-8")
    if not raw.startswith(prefix) or not raw.endswith(";\n"):
        raise ValueError("Unexpected clinician anatomy bundle format")
    records = json.loads(raw[len(prefix):-2])
    for code in ("00576", "00655", *COMBINATIONS):
        source = ROOT / "data" / "patient-knowledge" / (code + ".json")
        anatomy = json.loads(source.read_text(encoding="utf-8"))["anatomy"]
        record = records.setdefault(code, {"code": code})
        record["anatomy"] = anatomy
    bundle.write_text(prefix + json.dumps(records, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")

def main():
    refresh_clinician_anatomy()
    lung_env = {**os.environ, "SACT_SUITE_CODES": "00576,00655"}
    run("node", "tools/build-patient-knowledge.cjs", env=lung_env)
    run("node", "tools/build-complete-pathways.cjs", env=lung_env)
    with tempfile.TemporaryDirectory(prefix="sactcheck-durvalumab-") as stage:
        run(sys.executable, "tools/build-durvalumab-lung-print-v08462.py", "--stage", stage, "--publish")
    run("node", "tools/patient-publication-v08444.cjs", "--routes", "00576,00655", "--write")
    run("node", "tools/build-durvalumab-patient-suites.cjs", *COMBINATIONS)
    run(sys.executable, "tools/render-durvalumab-patient-pdfs.py", *COMBINATIONS)
    run(sys.executable, "tools/durvalumab-symptom-pictures.py")

if __name__ == "__main__":
    main()
