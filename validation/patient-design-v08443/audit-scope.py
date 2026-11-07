#!/usr/bin/env python3
"""Inventory authored patient routes from the pinned v0.84.42 registry and tree.

This is a read-only audit of clinical and generated content. The output describes
baseline availability, not clinical approval, current source validity or deployment.
Run before asset generation; every read is checked against the pinned Git blob.
"""
import argparse
import collections
import hashlib
import json
from pathlib import Path
import re
import subprocess

import fitz

BASE_COMMIT = "67aaa3579794278074478b3f6cce4e57c803e4db"
BASE_TREE = "ba65db9ba843ef3d191f7acd5af2b195f453e229"
BASE_VERSION = "0.84.42"
SELECTORS = ["00320", "00372", "00388", "00535", "00849"]
REQUIRED = ["index.html", "guide.pdf", "knowledge.html", "knowledge.pdf", "handbook.pdf", "passport.pdf", "sactcard.pdf", "consent-form.html", "consent-form.pdf", "supportive-care.pdf", "treatment-journey.pdf"]
SECTIONS = ["guide.pdf", "knowledge.pdf", "treatment-journey.pdf", "supportive-care.pdf", "logistics.pdf", "passport.pdf", "sactcard.pdf"]
SOURCE_METADATA = ["schema_version", "suite_release", "content_version", "patient_layout_release", "protocol_id", "protocol_version", "patient_context", "context_label", "scope_note", "indication_text", "review_status", "source_checked", "cycle_days"]


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2])
    ap.add_argument("--tree", type=Path, required=True, help="Untruncated GitHub git/trees response for the pinned commit")
    ap.add_argument("--baseline-fallback", action="append", type=Path, default=[])
    ap.add_argument("--output", type=Path)
    args = ap.parse_args()
    root = args.root.resolve()
    output = args.output or root / "validation/patient-design-v08443/scope.json"
    tree_document = json.loads(args.tree.read_text())
    assert not tree_document["truncated"], "Truncated tree cannot establish complete route coverage"
    tree = {row["path"]: row for row in tree_document["tree"] if row["type"] == "blob"}
    roots = [root] + args.baseline_fallback
    data_cache = {}
    info_cache = {}
    fallback_reads = []

    def data(relative):
        if relative in data_cache:
            return data_cache[relative]
        expected = tree[relative]["sha"]
        for directory in roots:
            path = directory / relative
            if not path.is_file():
                continue
            content = path.read_bytes()
            blob = hashlib.sha1(b"blob " + str(len(content)).encode() + b"\0" + content).hexdigest()
            if blob == expected:
                data_cache[relative] = content
                if directory != root:
                    fallback_reads.append(relative)
                return content
        raise AssertionError("No local copy matches pinned Git blob: " + relative)

    def js(relative):
        return json.loads(data(relative))

    def info(relative):
        if relative in info_cache:
            return info_cache[relative]
        if relative not in tree:
            return {"path": relative, "present": False, "git_blob_sha1": None, "sha256": None}
        content = data(relative)
        out = {"path": relative, "present": True, "bytes": len(content), "git_blob_sha1": tree[relative]["sha"], "sha256": hashlib.sha256(content).hexdigest()}
        if relative.endswith(".pdf"):
            with fitz.open(stream=content, filetype="pdf") as document:
                out["pages"] = len(document)
                out["page_sizes_pt"] = sorted({(round(p.rect.width, 2), round(p.rect.height, 2)) for p in document})
        info_cache[relative] = out
        return out

    # Execute the verified registry bytes in a separate Node process, never a
    # possibly changed candidate file.
    registry_path = "js/patient-asset-registry-v0810.js"
    node_script = "const vm=require('vm'),fs=require('fs');const s={module:{exports:{}},exports:{},URL};vm.runInNewContext(fs.readFileSync(0,'utf8'),s);const r=s.module.exports;process.stdout.write(JSON.stringify({release:r.release,codes:r.codes,definitions:r.definitions,routes:[...new Set(r.codes.flatMap(c=>r.bundleRoutes(c)))]}));"
    registry = json.loads(subprocess.check_output(["node", "-e", node_script], input=data(registry_path)))
    assert registry["release"] == BASE_VERSION
    assert js("package.json")["version"] == BASE_VERSION
    actual_roots = {m.group(1) for p in tree for m in [re.fullmatch(r"patient/(\d{5}(?:/[^/]+)?)/index\.html", p)] if m}
    routes = sorted(actual_roots - set(SELECTORS))
    registry_routes = set(registry["routes"])
    assert set(SELECTORS) <= actual_roots
    assert registry_routes <= set(routes)
    assert len(routes) == 228
    assert {r.split("/")[0] for r in routes} == set(registry["codes"])

    skin = js("validation/skin-melanoma-v08442/skin-coverage.json")
    lung = js("validation/lung-completion-v08430/lung-coverage.json")
    crc = js("data/colorectal-suite-progress-v0832.json")
    net = js("validation/neuroendocrine-v08437/consistency-matrix.json")
    breast = js("validation/breast-completion-v08421/catalogue-reconciliation.json")
    families = {
        "Skin/Melanoma": {r for values in skin["routes_by_code"].values() for r in values},
        "Colorectal": {r["patient_route"].removeprefix("patient/").strip("/") for r in crc["regimens"] if r.get("full_suite")},
        "Neuroendocrine": {r["route"] for r in net["rows"]},
        "Neuro-oncology": {"00334", "00342", "00379", "00461", "00658", "00742", "00804", "00805", "00806", "00813"},
        "Hepatocellular": {"00831"},
        "Lung": set(),
    }
    for row in lung["rows"]:
        code = row["code"]
        families["Lung"].update([code + "/lung"] if row.get("lung_context") else [r for r in routes if r == code or (code in {"00372", "00388", "00849"} and r.startswith(code + "/"))])
    assigned = set().union(*families.values())
    official_breast_codes = {c for source in breast["sources"] for c in source["codes"]}
    families["Breast"] = (official_breast_codes | {"00798"}) - assigned
    occurrences = collections.Counter(r for group in families.values() for r in group)
    assert set(occurrences) == set(routes)
    assert all(n == 1 for n in occurrences.values())
    family_for = {r: family for family, rs in families.items() for r in rs}
    presentation = js("data/patient-presentation-v08431.json")["routes"]
    protocol_index = js("protocols/index.json")["protocols"]
    protocol_paths = {}
    for entry in protocol_index:
        match = re.search(r"/(\d{5})-", entry["path"])
        if match:
            protocol_paths[match.group(1)] = entry["path"]

    inventory = {}
    for route in routes:
        code, _, context = route.partition("/")
        source = "data/patient-knowledge-contexts/" + route + ".json" if context else "data/patient-knowledge/" + code + ".json"
        assert source in tree, "No authored source JSON: " + route
        profile = js(source)
        guide = data("patient/" + route + "/guide.html").decode()
        styles = re.findall(r'href="([^"]+\.css)"', guide)
        family = "patient-pack/pt-page" if 'class="pt-page' in guide else "legacy-suite/suite-page" if 'class="suite-page' in guide else "patient-summary-v08428/ps-page" if 'class="ps-page' in guide else "specialized/unclassified"
        prefix = "patient/" + route + "/"
        names = {p[len(prefix):] for p in tree if p.startswith(prefix) and "/" not in p[len(prefix):]}
        names |= set(REQUIRED) | set(SECTIONS)
        files = {}
        for name in sorted(names):
            primary = info(prefix + name)
            mirror = info("docs/" + prefix + name)
            files[name] = {"patient": primary, "docs": mirror, "mirrors_identical": primary["present"] and mirror["present"] and primary["sha256"] == mirror["sha256"]}
        missing = [name for name in REQUIRED if not files[name]["patient"]["present"]]
        inventory[route] = {
            "code": code, "context": context or None,
            "title": profile.get("title"), "authoring_family": family_for[route],
            "registry_bundle_route": route in registry_routes,
            "source_json": source, "source": info(source),
            "source_metadata": {k: profile[k] for k in SOURCE_METADATA if k in profile},
            "protocol": info(protocol_paths[code]),
            "generator_family": family, "guide_stylesheets": styles,
            "patient_summary_template_version": profile.get("patient_summary", {}).get("template_version"),
            "configured_in_existing_handbook_builder": route in presentation,
            "all_required_outputs_present": not missing,
            "missing_required_outputs": missing,
            "handbook_source_sections": [{"file": n, "present": files[n]["patient"]["present"], "pages": files[n]["patient"].get("pages")} for n in SECTIONS],
            "additional_support_pdfs": sorted(n for n in names if re.fullmatch(r"support-.+\.pdf", n)),
            "files": files,
        }

    missing_counts = collections.Counter(n for row in inventory.values() for n in row["missing_required_outputs"])
    page_counts = {name: dict(sorted(collections.Counter(str(row["files"][name]["patient"].get("pages", "missing")) for row in inventory.values()).items())) for name in SECTIONS + ["handbook.pdf"]}
    mirror_findings = [{"route": r, "file": n, "patient_present": v["patient"]["present"], "docs_present": v["docs"]["present"]} for r, row in inventory.items() for n, v in row["files"].items() if n.endswith(".pdf") and v["patient"]["present"] and (not v["docs"]["present"] or not v["mirrors_identical"])]
    evidence = [registry_path, "package.json", "protocols/index.json", "data/patient-presentation-v08431.json", "validation/skin-melanoma-v08442/site-coverage.json", "validation/skin-melanoma-v08442/skin-coverage.json", "validation/lung-completion-v08430/lung-coverage.json", "data/colorectal-suite-progress-v0832.json", "validation/breast-completion-v08421/catalogue-reconciliation.json", "data/breast-library-contexts-v0837.json", "validation/neuroendocrine-v08437/consistency-matrix.json", "validation/neuro-oncology-v08438/scope.json", "validation/neuro-oncology-v08439/scope.json"]
    result = {
        "schema_version": 1, "release": "0.84.43", "baseline_release": BASE_VERSION,
        "baseline_commit": BASE_COMMIT, "baseline_tree_sha": BASE_TREE,
        "inventory_basis": "Pinned Git tree plus verified registry, authored context metadata and existing patient index pages. Authored treatment routes exclude root selectors.",
        "scope_meaning": "Visual rollout across existing authored routes; this does not certify clinical approval, current official source validity, unimplemented shared indications or deployment.",
        "authoring_family_note": "The seven families partition authored routes for rendering only; they are not exclusive clinical applicability. Preserve each source context_label, scope_note and indication_text. In particular capecitabine 00216 covers colorectal and breast; shared taxane and tumour-agnostic indications remain as authored.",
        "counts": {"unique_regimen_codes": len(registry["codes"]), "registry_bundle_routes": len(registry_routes), "treatment_routes": len(routes), "additional_authored_contexts": len(set(routes)-registry_routes), "preserved_root_selectors": len(SELECTORS), "source_jsons": len(inventory), "all_required_outputs_present": sum(r["all_required_outputs_present"] for r in inventory.values()), "existing_handbook_builder_configured_routes": len(presentation), "missing_required_outputs": dict(sorted(missing_counts.items()))},
        "authoring_families": {k: {"route_count": len(v), "unique_regimen_codes": len({r.split('/')[0] for r in v}), "routes": sorted(v)} for k, v in sorted(families.items())},
        "routes": routes, "codes": sorted(registry["codes"]),
        "additional_authored_contexts": sorted(set(routes)-registry_routes),
        "source_jsons": {r: row["source_json"] for r, row in inventory.items()},
        "required_outputs_from_current_site_audit": REQUIRED,
        "required_handbook_sections_in_reading_order": SECTIONS,
        "design_output_files_per_route": ["index.html", "guide.html", "guide.pdf", "knowledge.html", "knowledge-print.html", "knowledge.pdf", "handbook.pdf"],
        "guide_pages_distribution": page_counts["guide.pdf"],
        "guide_pagination_note": "The pinned baseline contains 109 three-page modern guides and 119 two-page legacy guides. All routes also have separate wallet-card PDFs. Preserving authored material and approved wallet dimensions takes precedence over silently imposing a page-count assertion that the baseline never met.",
        "baseline_pdf_pages_distribution": page_counts,
        "generator_families": dict(collections.Counter(row["generator_family"] for row in inventory.values())),
        "mirror_findings": mirror_findings,
        "mirror_findings_scope": "PDF copies only. Individual HTML/PNG compatibility-copy presence and equality are recorded as inventory, not counted as failures; some HTML copies intentionally use different relative asset paths.",
        "preserved_root_selectors": {route: {"index": info("patient/" + route + "/index.html"), "docs_index": info("docs/patient/" + route + "/index.html")} for route in SELECTORS},
        "completion_evidence": {p: info(p) for p in evidence},
        "skin_reconciliation": {"catalogue_entries": skin["authored_skin_catalogue_entries"], "context_routes": len(families["Skin/Melanoma"]), "historical_clinical_approval": skin["clinical_approval"], "historical_all_required_gates_passed": skin["all_required_gates_passed"], "interpretation": "Historical authoring/validation flags remain separate from current source and deployment verification."},
        "baseline_verification": {"all_read_files_matched_pinned_git_blobs": True, "verified_file_count": len(data_cache), "fallback_read_count": len(fallback_reads), "fallback_files": sorted(fallback_reads), "pdf_reader": "PyMuPDF " + fitz.VersionBind},
        "route_inventory": inventory,
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps({"output": str(output), "counts": result["counts"], "families": {k: v["route_count"] for k, v in result["authoring_families"].items()}, "generators": result["generator_families"], "guide_pages": result["guide_pages_distribution"], "mirror_findings": len(mirror_findings), "baseline_verification": result["baseline_verification"]}, indent=2))


if __name__ == "__main__":
    main()
