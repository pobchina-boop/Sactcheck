"""Build the two NCCP 00947 cycle planners using the encoded administration days."""
import json
import hashlib
import subprocess
from pathlib import Path
from string import Template

import fitz
from weasyprint import HTML

ROOT = Path(__file__).resolve().parents[2]
SOURCE = Path(__file__).resolve().parent
PORTAL = ROOT / "patient/00947"
MIRROR = ROOT / "docs/patient/00947"


def day_cells(phase):
    medicines = {row["drug"]: set(row["day"]) for row in phase["administration"]}
    cells = []
    for day in range(1, phase["cycle_length_days"] + 1):
        dosing = day in medicines["capivasertib"]
        injection = day in medicines["fulvestrant"]
        marker = '<span class="injection">Injection</span>' if injection else ""
        tablets = "Tablets" if dosing else "Rest"
        cells.append(
            f'<li class="{"on" if dosing else "off"}"><strong><small>Day </small>{day}</strong>'
            f'<span>{tablets}</span>{marker}</li>'
        )
    return "\n".join(cells)


def build():
    protocol = json.loads((ROOT / "protocols/breast/00947-capivasertib-fulvestrant.json").read_text())
    first, later = protocol["treatment_phases"]
    template = Template((SOURCE / "planner.template.html").read_text())
    for phase, slug, title, note in (
        (first, "first-cycle", "My first cycle", "Two injection visits this cycle, on days 1 and 15."),
        (later, "later-cycles", "My next cycle", "One injection visit on day 1 of each cycle from cycle 2 onwards."),
    ):
        tabs = []
        for target, label in (("first-cycle", "Cycle 1"), ("later-cycles", "Cycle 2 onwards")):
            selected = ' aria-current="page"' if slug == target else ""
            tabs.append(f'<a href="{target}.html"{selected}>{label}</a>')
        html = template.substitute(title=title, note=note, days=day_cells(phase), tabs="".join(tabs), slug=slug)
        file = PORTAL / f"{slug}.html"
        file.write_text(html)
        pdf = HTML(filename=str(file)).write_pdf()
        with (fitz.open(stream=pdf, filetype="pdf") as planner,
              fitz.open(PORTAL / "guide.pdf") as guide,
              fitz.open(PORTAL / "sactcard.pdf") as card,
              fitz.open() as pack):
            if len(planner) != 1 or len(card) != 1 or "A picture of side effects" not in guide[0].get_text():
                raise ValueError("Review planner, anatomical guide and wallet-card pagination before combining.")
            # The anatomical sheet carries its original two-page guide folio.
            # Relabel just that small text area on the copy used for this pack.
            folios = guide[0].search_for("1 / 2")
            if len(folios) != 1:
                raise ValueError("Review the source guide folio before assembling the pack.")
            anatomy = guide[0]
            anatomy.add_redact_annot(folios[0], fill=False)
            anatomy.apply_redactions(images=0, graphics=0)
            anatomy.insert_text((folios[0].x0, folios[0].y1 - 1), "2 / 3", fontsize=7)
            pack.insert_pdf(planner)
            pack.insert_pdf(guide, from_page=0, to_page=0)
            pack.insert_pdf(card)
            pack.set_metadata({"title": f"Capivasertib and fulvestrant | {title}"})
            combined = pack.tobytes(garbage=4, deflate=True, no_new_id=True)
        for directory in (PORTAL, MIRROR):
            (directory / f"{slug}-pack.pdf").write_bytes(combined)
            (directory / f"{slug}.pdf").write_bytes(pdf)

    for slug in ("symptom-plan", "glucose-record"):
        pdf = HTML(filename=str(PORTAL / f"{slug}.html")).write_pdf()
        with fitz.open(stream=pdf, filetype="pdf") as check:
            if len(check) != 1:
                raise ValueError(f"{slug} must fit on one A4 page")
        for directory in (PORTAL, MIRROR):
            (directory / f"{slug}.pdf").write_bytes(pdf)

    # Use the audited original so rebuilding never appends a second set of sheets.
    base = "71d089b071bff6f8ed3ff6eb3cad49a5e6577105"
    core = subprocess.check_output(["git", "show", base + ":patient/00947/handbook.pdf"], cwd=ROOT)
    if hashlib.sha256(core).hexdigest() != "98ce5834bd3a21e5ad80df71c06c726c2c8a3498a6fdc7dc0f524000547b54d1":
        raise ValueError("Unexpected core handbook")
    with fitz.open(stream=core, filetype="pdf") as handbook:
        contents = handbook.get_toc()
        for slug, label in (("symptom-plan", "When to call"), ("glucose-record", "My blood sugar record")):
            contents.append([1, label, len(handbook) + 1])
            with fitz.open(PORTAL / f"{slug}.pdf") as sheet:
                handbook.insert_pdf(sheet)
        handbook.set_toc(contents)
        combined = handbook.tobytes(garbage=4, deflate=True, no_new_id=True)
        for directory in (PORTAL, MIRROR):
            (directory / "handbook.pdf").write_bytes(combined)


if __name__ == "__main__":
    build()
