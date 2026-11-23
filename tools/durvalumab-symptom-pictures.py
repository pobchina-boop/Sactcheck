#!/usr/bin/env python3
"""Build static, script-free symptom guides and attach them to each selected regimen."""
import argparse
import html
import json
import shutil
import hashlib

import fitz
import subprocess
from pathlib import Path

from weasyprint import HTML

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "data/patient-symptom-pictures.json").read_text())
STYLES = "../assets/symptom-pictures.css"
PICTURES = "../assets/symptom-icons"
def esc(text):
    return html.escape(text, quote=True)

def icon(entry):
    return f'<img src="{PICTURES}/{esc(entry["icon"])}.svg" width="52" height="52" alt="">'

def symptom(key):
    item = DATA["symptoms"][key]
    instruction = f'<p class="picture-action">{esc(item["action"])}</p>' if item["action"] else ""
    return f'<article class="symptom-tile">{icon(item)}<div><h3>{esc(item["label"])}</h3><p>{esc(item["recognise"])}</p>{instruction}</div></article>'

def tiles(keys):
    return '<div class="symptom-tiles">' + "".join(symptom(k) for k in keys) + "</div>"

def page(code):
    plan = DATA["regimens"][code]
    title = esc(plan["title"])
    urgent = plan["urgent"]
    early = ["temp","lung","gut"] if "temp" in urgent else ["lung","gut","endocrine"]
    remaining = [key for key in urgent if key not in early]
    refs = [("Irish NCCP regimen " + code,plan["source"]),("Imfinzi patient leaflet", DATA["sources"]["Imfinzi"])]
    if code == "00926":
        refs.append(("Imjudo patient leaflet",DATA["sources"]["Imjudo"]))
    evidence = " · ".join(f'<a href="{esc(u)}">{esc(label)}</a>' for label,u in refs)
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Symptom picture guide · {title} · SACTCheck</title><link rel="stylesheet" href="{STYLES}"></head><body class="picture-document">
<header class="picture-toolbar"><a href="./">Back to my treatment</a><a href="symptom-icons.pdf" download>Download the picture guide (PDF)</a></header>
<main><section class="picture-sheet"><p class="picture-kicker">SACTCheck · NCCP {code} · {title}</p><h1>My symptom picture guide</h1>
<p>Use the pictures to describe what has changed. A symptom can have several causes. Your oncology team can assess it. You can call even if your symptom is missing from this guide.</p>
<aside class="picture-alert"><strong>Severe breathing difficulty, severe chest pain or collapse?</strong> Call <b>112 or 999</b>. For new or worsening symptoms, use your oncology team's 24-hour number. If the team cannot be reached, seek urgent medical assessment.</aside>
<h2>Changes to recognise and report early</h2>{tiles(plan["everyday"])}
<h2>Call now if these appear</h2>{tiles(early)}
<p class="picture-foot">Tell the person you speak to that you are receiving immunotherapy. Have your hospital number, last treatment date and medication list to hand.</p></section>
<section class="picture-sheet"><p class="picture-kicker">SACTCheck · NCCP {code} · {title}</p><h2>Other changes that need urgent advice</h2>
<p>Immune side effects can begin during treatment or after it has finished. Tell any GP or emergency team about immunotherapy, even months later. Carry the treatment team's immunotherapy alert card as well as your SACTCheck wallet card.</p>
{tiles(remaining)}
<p class="picture-foot"><strong>Your 24-hour oncology number:</strong> ____________________ &nbsp; <strong>Hospital:</strong> ____________________</p>
<footer><p>Sources: {evidence}. Independent feasibility build · local clinical, pharmacy and patient review pending.</p></footer></section></main></body></html>"""

def handbook_appendix(folder):
    """Keep the illustrated pages available in the downloaded handbook as well."""
    handbook = folder / "handbook.pdf"
    pictures = folder / "symptom-icons.pdf"
    doc = fitz.open(handbook)
    appendix = fitz.open(pictures)
    marker_prefix = "SACTCheck symptom appendix "
    marker = marker_prefix + hashlib.sha256(pictures.read_bytes()).hexdigest()
    metadata = doc.metadata
    keywords = (metadata.get("keywords") or "").split("; ")
    existing = next((k for k in keywords if k.startswith(marker_prefix)), None)
    if existing != marker:
        entries = doc.get_toc()
        if existing:
            previous = next((entry for entry in entries if entry[1] == "My symptom picture guide"), None)
            if not previous:
                raise ValueError(f"Cannot locate the previous symptom appendix in {handbook}")
            start = previous[2] - 1
            if start < 1 or "My symptom picture guide" not in doc[start].get_text():
                raise ValueError(f"Unexpected previous appendix boundaries in {handbook}")
            doc.delete_pages(start, len(doc)-1)
            entries = [entry for entry in entries if entry[2] <= start]
        first = len(doc) + 1
        doc.insert_pdf(appendix)
        doc.set_toc([*entries, [1, "My symptom picture guide", first],
                     [2, "Other changes that need urgent advice", first + 1]])
        metadata["keywords"] = "; ".join([k for k in keywords if k and not k.startswith(marker_prefix)] + [marker])
        doc.set_metadata(metadata)
        tmp = handbook.with_suffix(".new")
        doc.save(tmp, garbage=3, deflate=True, no_new_id=True)
        doc.close()
        tmp.replace(handbook)
    else:
        doc.close()
    appendix.close()
    mirror = ROOT / "docs/patient" / folder.name
    if mirror.is_dir():
        for item in (pictures, handbook):
            shutil.copyfile(item, mirror/item.name)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("codes",nargs="*")
    args=parser.parse_args()
    for code in args.codes or DATA["regimens"]:
        if code not in DATA["regimens"]:parser.error(f"Unknown symptom guide {code}")
        folder=ROOT/"patient"/code
        f=folder/"symptom-icons.html"
        f.write_text(page(code))
        HTML(filename=str(f)).write_pdf(folder/"symptom-icons.pdf",pdf_identifier=("SACTCheck symptom guide " + code).encode())
        subprocess.run(["node", str(ROOT / "tools/durvalumab-symptom-entry.cjs"),
                        str(folder / "index.html"), str(folder / "knowledge.html")], check=True)
        handbook_appendix(folder)

if __name__=="__main__":main()
