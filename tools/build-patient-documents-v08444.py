#!/usr/bin/env python3
"""Build concise, source-traceable patient books from current authored content.

The handbook is a single reading sequence, not a concatenation of overlapping
standalone PDFs. Clinical text is checked after consolidation; exact duplicates
are recorded. Existing anatomical and wallet pages retain their original scale.
The separate distilled guide keeps its own purpose and document structure.
All output is staged before an explicit --publish writes either public mirror.
"""
from pathlib import Path
import argparse
import collections
import concurrent.futures
import copy
import functools
import hashlib
import html
import importlib.util
import json
import logging
import math
import re
import shutil
import subprocess
import sys
import unicodedata

import pymupdf as fitz
from lxml import html as LH, etree as ET

ROOT = Path(__file__).resolve().parents[1]
CSS_FILE = ROOT / "assets/patient/patient-handbook-v08444.css"
GUIDE_CSS = ROOT / "assets/patient/patient-distilled-print-v08444.css"
COMPANION_AUDIT = ROOT / "validation/patient-design-v08444/companion-content-retention.json"
VERSION = json.loads((ROOT / "package.json").read_text())["version"]
HASH = lambda value: hashlib.sha256(value).hexdigest()
CHAPTERS = [
    ("treatment", "Understanding your treatment"),
    ("schedule", "Your schedule, tests and appointments"),
    ("care", "Symptoms and supportive care"),
    ("records", "Your record and contact card"),
    ("sources", "Sources and further information"),
]
GENERATED = ["guide.pdf", "knowledge.pdf", "handbook.pdf"]
NEW_ROUTES_WITHOUT_PRIOR_BOOK = frozenset()
WORD_MINIMUM = 110
SHORT_PAGE_HEIGHT = 200
COMPANION_TAIL_HEIGHT = 300
OLD_SPEC = importlib.util.spec_from_file_location("patient43", ROOT / "tools/build-patient-documents-v08443.py")
old = importlib.util.module_from_spec(OLD_SPEC)
OLD_SPEC.loader.exec_module(old)
ACRONYM_TERMS = json.loads(subprocess.check_output(["node", "-e", 'process.stdout.write(JSON.stringify(require("./tools/patient-editorial-v08444.cjs").TERMS))'], cwd=ROOT))
ACRONYM_EQUIVALENTS = sorted([(re.sub(r'[^\w]', '', unicodedata.normalize('NFKC',full+short)).casefold(),re.sub(r'[^\w]', '', short).casefold()) for short,full in ACRONYM_TERMS], key=lambda pair: -len(pair[0]))


def norm(value):
    value = unicodedata.normalize("NFKC", value).replace("\u00ad", "")
    # Reordering a chapter can move its first acronym use. Only the explicit,
    # approved full-name (ACRONYM) expansion is an equivalent textual form.
    value = re.sub(r"[^\w]", "", value).casefold()
    for full,short in ACRONYM_EQUIVALENTS:
        value = value.replace(full,short)
    return value


def classes(element):
    return set(element.get("class", "").split())


def visible_text(element):
    candidate = copy.deepcopy(element)
    for hidden in list(candidate.xpath(".//script | .//style | .//svg")):
        hidden.drop_tree()
    return re.sub(r"\s+", " ", candidate.text_content()).strip()


def read_profile(route):
    model = old.node("model", route)
    path = ROOT / model["sourcePath"]
    return model, json.loads(path.read_text()), path


def publication_pass(source, route, kind, profile):
    """Use the same idempotent authoring and vector presentation as the portal."""
    script = r"""
const fs=require('fs'),path=require('path');
const x=JSON.parse(fs.readFileSync(0,'utf8'));
let source=x.html;
const editorial=path.join(process.cwd(),'tools/patient-editorial-v08444.cjs');
const visual=path.join(process.cwd(),'tools/patient-visual-language-v08444.cjs');
if(fs.existsSync(editorial)){
 const result=require(editorial).applyEditorial(source,{route:x.route,documentKind:x.kind,data:x.profile,root:process.cwd()});
 source=typeof result==='string'?result:result.html;
}
if(fs.existsSync(visual)){
 const cssHref=path.posix.relative('patient/'+x.route,'assets/patient/patient-visual-language-v08444.css');
 const result=require(visual).upgradeVisualLanguage(source,{route:x.route,documentKind:x.kind,profile:x.profile,cssHref});
 source=typeof result==='string'?result:result.html;
}
if(typeof source!=='string')throw new Error('Patient publication transform did not return HTML');
process.stdout.write(source);
"""
    return subprocess.check_output(["node", "-e", script], cwd=ROOT,
        input=json.dumps({"html": source, "route": route, "kind": kind, "profile": profile}).encode()).decode()


def tree_for(route, name, profile):
    source = ROOT / "patient" / route / name
    return LH.fromstring(publication_pass(source.read_text(), route, name, profile)), source


def drop(element, changes, reason):
    if element.getparent() is None:
        return
    changes.append({"operation": "remove", "reason": reason, "text": visible_text(element),
        "id": element.get("id"), "class": element.get("class")})
    element.drop_tree()


def clean_browser_markup(tree, changes):
    for element in list(tree.xpath("//script | //noscript | //nav | //button | //input | //select | //textarea")):
        drop(element, changes, "Browser control; it has no paper action")
    remove_classes = {"pk-top", "pk-skip", "pk-help-link", "pk-contents", "pk-nav", "pk-controls",
        "pk-day-detail", "access-links", "journey-scroll-hint", "no-print", "suite-toolbar", "pt-toolbar",
        "scv-document-downloads", "access-links", "pk-footer", "endocrine-footer"}
    for element in list(tree.iter()):
        if not isinstance(element.tag, str) or element.getparent() is None:
            continue
        if classes(element) & remove_classes:
            drop(element, changes, "Redundant navigation, source footer or interactive-only view")
    for element in tree.xpath("//details"):
        element.set("open", "open")
        if 'journey-milestone' in classes(element):
            element.set('style',element.get('style','')+';break-inside:avoid!important')
    for badge in tree.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," journey-number ")]'):
        # Explicit print geometry replaces CSS grid sizing, which older PDF
        # renderers otherwise stretch into a page-wide oval.
        badge.set('style',badge.get('style','')+';display:block!important;float:left!important;width:7mm!important;height:7mm!important;line-height:7mm!important;margin:0 2mm 1mm 0!important;text-align:center!important')
    for icons in tree.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," access-step ")]/*[contains(concat(" ",normalize-space(@class)," ")," sc44-icon-group ")]'):
        icons.set('style',icons.get('style','')+';display:block!important;float:left!important;margin:0 2.5mm 1mm 0!important')
        for graphic in icons.xpath('./svg'):
            graphic.set('style',graphic.get('style','')+';width:8mm!important;height:8mm!important')
    for element in tree.xpath("//*[@hidden]"):
        element.attrib.pop("hidden", None)
    for graphic in tree.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," access-step ")]/svg'):
        # SVG images are self-contained in the PDF renderer: presentation
        # attributes make the existing outline icon independent of page CSS.
        for key, value in {"fill": "none", "stroke": "#087b7a", "stroke-width": "3", "stroke-linecap": "round", "stroke-linejoin": "round"}.items():
            if graphic.get(key) is None:
                graphic.set(key, value)
    browser_text = {
        "Your date stays on this page only. It is not saved or added to a QR code.",
        "On a small screen, swipe the chart sideways. Each day is a keyboard-accessible button.",
        "On a small screen, swipe the map sideways. The checks below give the same timing in words.",
        "Select a day to explore what to watch for. These are possible patterns, not a promise about when symptoms start or stop.",
        "The anatomical side-effect map follows.",
    }
    for element in list(tree.xpath("//p | //summary")):
        value = visible_text(element)
        if value in browser_text:
            if "possible patterns" in value:
                element.text = "Timing is a general guide; symptoms may start or stop at other times."
                for child in list(element):
                    element.remove(child)
                changes.append({"operation": "replace", "reason": "Paper wording retains the timing caveat", "before": value, "after": element.text})
            else:
                drop(element, changes, "Browser orientation or redundant transition note")
        elif value in {"Choose a topic to read", "Reference contents"}:
            drop(element, changes, "The handbook already has one opening contents page")
        elif value == "Read the whole cycle as text":
            element.text = "Between-treatment notes"
    for element in list(tree.xpath('//a[contains(concat(" ",normalize-space(@class)," ")," pk-button ")]')):
        drop(element, changes, "Action links are replaced by the single reading sequence and contact card")
    for element in list(tree.xpath('//*[@id="pk-active-medicines"]')):
        parent = element.getparent()
        drop(parent, changes, "Interactive selected-day status; full authored schedule is retained")
    for element in list(tree.xpath('//p | //footer | //div[contains(concat(" ",normalize-space(@class)," ")," pk-eyebrow ")]')):
        if element.getparent() is None:
            continue
        value = visible_text(element)
        if value.startswith("Sources:") or value.startswith("Sources checked ") or value.startswith("Treatment reference ·"):
            drop(element, changes, "Source details are grouped once in the evidence section")
    # A short mechanism qualification stays with its last illustration, never
    # alone on a new page after a large unbreakable group of medicine cards.
    for section in tree.xpath('//*[@id="medicines"]'):
        cards = section.xpath('.//*[contains(concat(" ",normalize-space(@class)," ")," pk-card ")]')
        for element in list(section.xpath('./p')):
            if visible_text(element).startswith("The drawings are simplified explanations") and cards:
                section.remove(element)
                element.set("class", "book44-caption")
                cards[-1].append(element)
                changes.append({"operation": "move", "reason": "Keep the illustration explanation with the medicine card", "text": visible_text(element)})
    for element in list(tree.xpath("//details")):
        if len(visible_text(element)) < 4:
            drop(element, changes, "Empty navigation wrapper after contents removal")


def printable_timelines(tree, changes):
    """Turn authored grid spans into labelled vector lanes that cannot detach."""
    xpath = '//*[contains(concat(" ",normalize-space(@class)," ")," wiki-cycle-chart ") or contains(concat(" ",normalize-space(@class)," ")," pk-chart ")]'
    records = []
    for chart in list(tree.xpath(xpath)):
        modern = "wiki-cycle-chart" in classes(chart)
        if modern:
            axes = chart.xpath('./*[contains(concat(" ",normalize-space(@class)," ")," wiki-cycle-axis ")]')
            if len(axes) != 1:
                raise ValueError("An authored chronology needs one axis")
            labels = [visible_text(value) for value in axes[0]][1:]
            rows = chart.xpath('./*[contains(concat(" ",normalize-space(@class)," ")," wiki-cycle-track ")]')
        else:
            all_rows = chart.xpath('./*[contains(concat(" ",normalize-space(@class)," ")," pk-row ")]')
            if not all_rows:
                raise ValueError("An authored chronology needs rows")
            labels = all_rows[0].xpath('./button/@data-day')
            # Buttons can already have been removed as UI. The source retains
            # the explicit number of grid columns in its custom property.
            if not labels:
                value = re.search(r"--days\s*:\s*(\d+)", chart.get("style", ""))
                if value:
                    labels = [str(i) for i in range(1, int(value[1]) + 1)]
            rows = all_rows[1:]
        if not labels:
            raise ValueError("An authored chronology has no readable axis")
        numeric = labels == [str(i) for i in range(1, len(labels) + 1)]
        table = LH.Element("table", {"class": "book44-timeline"})
        thead = ET.SubElement(table, "thead")
        row = ET.SubElement(thead, "tr")
        for title in ["Treatment or check", "Timing in this view"]:
            ET.SubElement(row, "th").text = title
        tbody = ET.SubElement(table, "tbody")
        record = {"axis": labels, "numeric_days": numeric, "rows": []}
        for source in rows:
            names = source.xpath('./*[contains(concat(" ",normalize-space(@class)," ")," '+('wiki-cycle-label' if modern else 'pk-row-label')+' ")]')
            bands = source.xpath('./*[contains(concat(" ",normalize-space(@class)," ")," '+('wiki-cycle-band' if modern else 'pk-band')+' ")]')
            if len(names) != 1 or len(bands) != 1:
                raise ValueError("Each chronology row needs one label and one authored span")
            span = re.search(r"grid-column\s*:\s*(\d+)\s*/\s*(\d+)", bands[0].get("style", ""))
            if not span:
                raise ValueError("Missing exact chronology span")
            first, stop = [int(value) - 2 for value in span.groups()]
            if not 0 <= first < stop <= len(labels):
                raise ValueError("Chronology span outside its axis")
            title, detail = visible_text(names[0]), visible_text(bands[0])
            tr = ET.SubElement(tbody, "tr", {"data-span-start": str(first), "data-span-stop": str(stop)})
            ET.SubElement(tr, "th").text = title
            cell = ET.SubElement(tr, "td")
            if numeric:
                total = len(labels)
                left = 12 + 456 * first / total
                width = max(4, 456 * (stop - first) / total)
                end_label = "Day " + str(first + 1) if stop == first + 1 else "Days " + str(first + 1) + "–" + str(stop)
                svg = '<svg class="book44-timing-lane" viewBox="0 0 480 42" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="'+html.escape(end_label, quote=True)+'"><line x1="12" y1="21" x2="468" y2="21" stroke="#cbdedc" stroke-width="3"/><rect x="'+str(round(left, 4))+'" y="14" width="'+str(round(width, 4))+'" height="14" rx="4" fill="#8acfc8" stroke="#087e80"/><text x="12" y="10" font-size="10" fill="#526b77">1</text><text x="468" y="10" text-anchor="end" font-size="10" fill="#526b77">'+str(total)+'</text></svg>'
                cell.append(LH.fromstring(svg))
            else:
                end_label = " → ".join(labels[first:stop])
            ET.SubElement(cell, "strong").text = end_label
            ET.SubElement(cell, "p").text = detail
            record["rows"].append({"label": title, "start": first, "stop": stop, "text": detail, "timing": end_label})
        chart.getparent().replace(chart, table)
        records.append(record)
    changes.append({"operation": "render_timeline", "reason": "Exact authored spans shown as print-safe vector lanes", "charts": records})
    return records


def deduplicate_monitoring(tree, changes):
    def row_signature(row):
        cells = row.xpath('./th | ./td')
        if len(cells) < 2:
            return None
        label = copy.deepcopy(cells[0])
        # Only a badge made entirely of linked source labels is metadata.
        # Conditional notes and other row-label qualifiers remain in the key.
        for badge in list(label.xpath('.//small')):
            links = badge.xpath('.//a[@href]')
            if links and norm(visible_text(badge)) == norm(' '.join(visible_text(a) for a in links)):
                badge.drop_tree()
        return (norm(visible_text(label)), tuple(norm(visible_text(cell)) for cell in cells[1:]))

    sections = tree.xpath('//*[@id="monitoring-schedule"]')
    journeys = tree.xpath('//*[@id="treatment-journey"]')
    for section in sections:
        for original in list(section.xpath('.//table')):
            for journey in journeys:
                for candidate in journey.xpath('.//table'):
                    a = [row_signature(row) for row in original.xpath('./tbody/tr')]
                    b = [row_signature(row) for row in candidate.xpath('./tbody/tr')]
                    ac = [norm(visible_text(value)) for value in original.xpath('.//thead//th')][1:]
                    bc = [norm(visible_text(value)) for value in candidate.xpath('.//thead//th')][1:]
                    if not a or any(value is None for value in a+b) or ac != bc:
                        continue
                    available = list(enumerate(b,1))
                    mapping = []
                    for index,signature in enumerate(a,1):
                        retained = next(((number,value) for number,value in available if value == signature),None)
                        if retained is None:
                            break
                        available.remove(retained)
                        mapping.append({'removed_row':index,'retained_row':retained[0],'label_normalized':signature[0],
                            'clinical_cells_sha256':HASH(json.dumps(signature[1]).encode())})
                    if len(mapping) == len(a):
                        section.set('data-book44-matrix-consolidated','true')
                        changes.append({'operation':'verified_monitoring_row_subset','removed_section':section.get('id'),'retained_section':journey.get('id'),
                            'removed_rows':len(a),'retained_rows':len(b),'identical_timing_columns':ac,'row_mapping':mapping,
                            'reason':'Every complete clinical cell, timing column and row label is retained in the larger matrix; only linked source badges are ignored in the label comparison'})
                        drop(original, changes, "Duplicate monitoring matrix: every clinical cell and timing column is retained in the whole-treatment matrix")
                        break
                if original.getparent() is None:
                    break


def core_units(tree, source):
    """Inventory current authored statements before exact duplicate consolidation."""
    result = []
    selected = tree.xpath('//main//p | //main//li | //main//td | //main//th')
    for element in selected:
        chain = [element] + list(element.iterancestors())
        if any(value.get("id") in {"sources", "anatomical-effects"} or classes(value) & {"book44-source-metadata", "journey-footer", "access-note", "pk-top", "no-print"} for value in chain):
            continue
        if element.tag == "li" and element.xpath(".//p | .//li | .//table"):
            continue
        value = visible_text(element)
        if len(norm(value)) < 18 or value.startswith("Sources:"):
            continue
        result.append({"source": source, "xpath": tree.getroottree().getpath(element), "text": value, "sha256": HASH(norm(value).encode())})
    return result


def deduplicate_explanations(tree, changes):
    """Remove exact repeated explanations, never phase tables or conditional rows."""
    def has_answer_content(element):
        answer = copy.deepcopy(element)
        for summary in list(answer.xpath('.//summary')):
            summary.drop_tree()
        return bool(answer.xpath('.//p[normalize-space()] | .//li[normalize-space()] | .//table | .//img | .//svg'))

    answered_details = [element for element in tree.xpath('//details') if has_answer_content(element)]
    seen = {}
    # Chapter identity is deliberate navigation, not duplicate clinical prose.
    protected = {"book44-chapter-head", "book44-phase", "pk-phases", "scv-phase-path", "scv-schedule-graphic", "journey-checks"}
    for element in list(tree.xpath("//p | //li")):
        if element.getparent() is None or element.xpath(".//p | .//li | .//table"):
            continue
        if any(value.tag in {"table", "td", "th", "svg"} or classes(value) & protected for value in [element] + list(element.iterancestors())):
            continue
        value = visible_text(element)
        key = norm(value)
        if len(key) < 45 or value.startswith("Sources:"):
            continue
        matching = next((prior for prior in seen if key == prior or key in prior), None)
        if matching is not None:
            destination = seen[matching]
            changes.append({"operation": "deduplicate", "reason": "Complete repeated clinical statement retained verbatim in an earlier explanation", "text": value, "retained_at": destination})
            element.drop_tree()
        else:
            section = next((a.get("id") for a in element.iterancestors() if a.get("id")), None)
            seen[key] = section or "main"
    for element in answered_details:
        if element.getparent() is not None and not has_answer_content(element):
            drop(element,changes,"This FAQ had authored answer content, and all of that content was retained elsewhere as verified exact duplicates; remove the now-unanswered question")
    for element in list(tree.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," pk-card ")]')):
        if element.xpath(".//p | .//li | .//table | .//svg | .//img"):
            continue
        drop(element, changes, "Card heading left after its duplicate explanation was consolidated")
    for element in list(tree.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," pk-section ")]')):
        if element.getparent() is None or element.xpath('.//p | .//li | .//table | .//svg | .//img | .//article'):
            continue
        drop(element, changes, "Empty topic after its complete repeated statements were retained earlier")
    for element in list(tree.xpath('//*[@data-book44-matrix-consolidated="true"]')):
        if element.getparent() is not None and not element.xpath('.//p[normalize-space()] | .//li[normalize-space()] | .//table | .//article'):
            drop(element,changes,"Empty monitoring heading after every matrix row and any repeated explanation were retained in the whole-treatment section")
    return seen


def chapter_group(element):
    identity = element.get("id", "")
    tokens = classes(element)
    if identity == "sources":
        return "sources"
    if identity == "urgent" and "pk-chapter" not in tokens:
        return "treatment"
    if identity in {"medicines", "understanding", "understand-diagnosis", "treatment-rationale", "treatment-purpose",
        "treatment-aim", "why-this-treatment", "why-treatment", "your-treatment", "medicine", "treatment",
        "net-diagnosis", "net-goals", "glioma-diagnosis", "glioma-goals", "evidence", "choices-and-support"}:
        return "treatment"
    if identity in {"phases", "monitoring-schedule", "treatment-journey", "treatment-logistics", "logistics", "port-pump",
        "schedule", "visits", "checks", "monitoring", "tests", "preparation", "before-treatment", "after-treatment",
        "taking-treatment", "daily-tablets", "testing-treatment", "how-to-receive", "prrt-monitoring", "preparing-prrt",
        "prrt-service-plan", "net-tests", "glioma-tests", "whole-pathway", "whole-plan", "local-treatment", "wider-treatment"}:
        return "schedule"
    return "care"


def source_addresses(trees):
    result = {}
    for tree in trees:
        for anchor in tree.xpath('//a[@href]'):
            url = anchor.get("href", "")
            if not url.startswith("https://") or url.startswith("https://sactcheck.com") or url.startswith("https://www.sactcheck.com"):
                continue
            label = visible_text(anchor)
            if url not in result or len(label) > len(result[url]):
                result[url] = label or url
    return [{"url": url, "label": title} for url, title in result.items()]


@functools.lru_cache(maxsize=1)
def companion_audit():
    data = COMPANION_AUDIT.read_bytes()
    inventory = json.loads(data)
    if inventory.get('schema_version') != 1 or inventory.get('status') != 'reviewed' or inventory.get('errors'):
        raise ValueError('The complete companion-content audit must be reviewed before rendering')
    if inventory['normalization']['terms_sha256'] != HASH(json.dumps(ACRONYM_TERMS,ensure_ascii=False,separators=(',',':')).encode()):
        raise ValueError('Approved acronym terms changed after the companion-content review')
    return inventory, HASH(data)


def companion_plan(route):
    """Load the independently reviewed standalone-source coverage decisions."""
    inventory, inventory_hash = companion_audit()
    names = ['treatment-journey.html','logistics.html','port-pump.html']
    expected = {str((ROOT/'patient'/route/name).relative_to(ROOT)) for name in names if (ROOT/'patient'/route/name).exists()}
    files = [row for row in inventory['source_files'] if row['file'] in expected]
    if {row['file'] for row in files} != expected:
        raise ValueError((route,'Companion source-file coverage is incomplete'))
    trees = {}
    for record in files:
        source = ROOT/record['file']
        if HASH(source.read_bytes()) != record['sha256']:
            raise ValueError((route,'A reviewed companion source has changed',record['file']))
        trees[record['file']] = LH.fromstring(source.read_text())
    units = [row for row in inventory['units'] if row['route'] == route]
    for unit in units:
        if unit['source_file'] not in trees or HASH(norm(unit['source_text']).encode()) != unit['source_sha256']:
            raise ValueError((route,'Invalid reviewed companion statement',unit.get('source_file')))
        if unit['status'] not in {'exact','equivalent','missing','excluded_ui_or_metadata'}:
            raise ValueError((route,'Unreviewed companion status',unit['status']))
        if not unit.get('reason'):
            raise ValueError((route,'Companion decision requires its review reason'))
        for xpath in unit.get('source_xpaths',[unit['source_xpath']]):
            matches = trees[unit['source_file']].xpath(xpath)
            if len(matches) != 1 or norm(visible_text(matches[0])) != norm(unit['source_text']):
                raise ValueError((route,'Companion source statement or XPath has changed',unit['source_file'],xpath))
        for clause in unit.get('missing_clauses',[]):
            if not norm(clause) or norm(clause) not in norm(unit['source_text']):
                raise ValueError((route,'Only exact source clauses may be imported',unit['source_file'],clause))
        if unit.get('display_clauses'):
            if len(unit['display_clauses']) != len(unit.get('missing_clauses',[])) or any(not norm(display) for display in unit['display_clauses']):
                raise ValueError((route,'Each unique source clause requires its reviewed display sentence',unit['source_file']))
    decision_hash = HASH(json.dumps({'source_files':files,'units':units},sort_keys=True).encode())
    return {'inventory':str(COMPANION_AUDIT.relative_to(ROOT)),'inventory_sha256':inventory_hash,'route_plan_sha256':decision_hash,'source_files':files,'units':units},list(trees.values())


def companion_clause_counterparts(plan, unit, index):
    """Resolve only an explicitly reviewed cross-unit equivalence, never fuzzy text."""
    display = (unit.get('display_clauses') or unit['missing_clauses'])[index]
    # The reviewer identified this short supply prompt as the same instruction
    # as the complete prescription-supply sentence. Other deduplication notes
    # describe gaps already excluded from missing_clauses and need no skipping.
    related = (unit.get('deduplication') or {}).get('supply_gap_covered_by_group_id')
    if related is not None:
        matches = [row for row in plan['units'] if row.get('group_id') == related and row['status'] == 'missing']
        if len(matches) != 1 or len(unit['missing_clauses']) != 1:
            raise ValueError((unit['source_file'],'Ambiguous reviewed supply counterpart'))
        target = matches[0]
        if (target.get('deduplication') or {}).get('canonical_for_related_supply_gap_group_id') != unit.get('group_id'):
            raise ValueError((unit['source_file'],'Missing reciprocal reviewed supply decision'))
        return target.get('display_clauses') or target['missing_clauses'], target
    return [unit['missing_clauses'][index], display], None


def add_companion_unique_material(main, plan, changes):
    """Add only the unique clauses identified by the complete source audit."""
    destinations = {
        'treatment-journey.html':('treatment-journey','Your treatment and checks'),
        'logistics.html':('treatment-logistics','Practical treatment details'),
        'port-pump.html':('port-pump','Your line or pump plan'),
    }
    cards = {}
    required = []
    existing = norm(visible_text(main))
    for unit in plan['units']:
        if unit['status'] != 'missing':
            continue
        if not unit.get('missing_clauses'):
            raise ValueError((unit['source_file'],'A missing decision needs explicit source clauses'))
        for index,clause in enumerate(unit['missing_clauses']):
            display_clause = (unit.get('display_clauses') or unit['missing_clauses'])[index]
            alternatives, counterpart = companion_clause_counterparts(plan,unit,index)
            if counterpart is not None:
                changes.append({'operation':'deduplicate_reviewed_companion_clause','source':unit['source_file'],'source_xpath':unit['source_xpath'],
                    'text':clause,'retained_counterpart':alternatives,'retained_source_unit_sha256':counterpart['source_sha256'],
                    'reason':'The frozen independent review explicitly maps this supply prompt to the complete retained supply instruction'})
                continue
            if any(norm(value) in existing for value in alternatives):
                changes.append({'operation':'retain_companion_clause','source':unit['source_file'],'source_xpath':unit['source_xpath'],
                    'text':clause,'reason':'The exact unique clause is already present after consolidation'})
                continue
            basename = Path(unit['source_file']).name
            identity,title = destinations[basename]
            heading_text = unit.get('source_heading') or title
            key = (identity,heading_text)
            if key not in cards:
                # Where the exact source topic already exists, keep its unique
                # addition beside that topic. Otherwise retain the source
                # heading, including any conditional or after-treatment scope.
                matches = [h for h in main.xpath('.//h2 | .//h3') if norm(visible_text(h)) == norm(heading_text)]
                if len(matches) == 1 and matches[0].getparent().tag in {'article','section','div'}:
                    target = matches[0].getparent()
                else:
                    sections = main.xpath('.//*[@id="'+identity+'"]')
                    if sections:
                        section = sections[0]
                    else:
                        section = ET.SubElement(main,'section',{'id':identity,'class':'pk-section book44-companion-section'})
                        ET.SubElement(section,'h2').text = title
                    target = ET.SubElement(section,'article',{'class':'pk-card book44-companion-detail'})
                    ET.SubElement(target,'h3').text = heading_text
                cards[key] = target
            paragraph = ET.SubElement(cards[key],'p',{'data-book44-companion-source':unit['source_file'],'data-book44-source-unit':unit['source_sha256'],
                'data-book44-companion-heading':heading_text})
            paragraph.text = display_clause[0].upper()+display_clause[1:] if re.match(r'^(?:discuss|ask|confirm|report|follow|keep|take|tell|contact|check|swallow|use)\b',display_clause) else display_clause
            existing += norm(display_clause)
            required.append({'source':unit['source_file'],'xpath':unit['source_xpath']+'#unique-clause','text':paragraph.text,
                'source_clause':clause,'source_clause_sha256':HASH(norm(clause).encode()),'sha256':HASH(norm(paragraph.text).encode())})
            changes.append({'operation':'retain_unique_companion_clause','source':unit['source_file'],'source_xpath':unit['source_xpath'],
                'source_heading':heading_text,'text':clause,'display_text':paragraph.text,'retained_at':identity,'reason':unit['reason']})
    return required


def check_companion_units(plan, reference, handbook):
    """Require the final PDFs to contain every reviewed source counterpart."""
    texts = {name:norm(''.join(remove_folios(page.get_text()) for page in doc)) for name,doc in [('knowledge.pdf',reference),('handbook.pdf',handbook)]}
    counts = collections.Counter()
    raw = 0
    proofs = []
    for unit in plan['units']:
        raw += len(unit.get('source_xpaths',[unit['source_xpath']]))
        status = unit['status']
        counts[status] += 1
        expected = []
        if status == 'exact':
            expected = [{'variants':[unit['source_text']],'documents':list(texts)}]
        elif status in {'equivalent','missing'}:
            destinations = unit.get('destination_texts',[])
            if status == 'equivalent' and not destinations:
                raise ValueError((unit['source_file'],'Equivalent source needs a concrete retained counterpart'))
            for destination in destinations:
                if HASH(norm(destination['text']).encode()) != destination['sha256']:
                    raise ValueError((unit['source_file'],'Changed companion counterpart hash'))
            # Record-specific instructions have an audited handbook-page
            # counterpart. They belong in that form, not a duplicate narrative.
            expected = [{'variants':[row['text']], 'documents':['handbook.pdf'] if row['source_file'].endswith('/handbook.pdf') else list(texts)} for row in destinations]
            for index,_ in enumerate(unit.get('missing_clauses',[])):
                alternatives,counterpart = companion_clause_counterparts(plan,unit,index)
                expected.append({'variants':alternatives,'documents':list(texts),'reviewed_cross_unit_equivalence':counterpart is not None})
        for item in expected:
            for name in item['documents']:
                if not any(norm(value) in texts[name] for value in item['variants']):
                    raise ValueError((name,'Reviewed companion counterpart missing',unit['source_file'],unit['source_xpath'],item['variants'][0][:240]))
        proofs.append({'source_file':unit['source_file'],'source_sha256':unit['source_sha256'],'raw_occurrences':len(unit.get('source_xpaths',[unit['source_xpath']])),
            'reviewed_status':status,'final_status':'imported_unique_clauses' if status == 'missing' else status,
            'verified_counterparts':[{'text_sha256':[HASH(norm(value).encode()) for value in item['variants']],
                'documents':item['documents'],'reviewed_cross_unit_equivalence':item.get('reviewed_cross_unit_equivalence',False)} for item in expected]})
    return {'inventory':plan['inventory'],'inventory_sha256':plan['inventory_sha256'],'route_plan_sha256':plan['route_plan_sha256'],'source_files':len(plan['source_files']),
        'raw_source_units':raw,'unique_source_units':len(plan['units']),'reviewed_status_counts':dict(counts),'unresolved_units':0,'units':proofs}


def add_guide_unique_material(guide, target, changes):
    """Retain useful guide-only risk lists/practical instructions once."""
    existing = norm(visible_text(target))
    extras = []
    selectors = '//*[contains(concat(" ",normalize-space(@class)," ")," wiki-side-card ") or contains(concat(" ",normalize-space(@class)," ")," wiki-panel ")]'
    for source in guide.xpath(selectors):
        clone = copy.deepcopy(source)
        clinical = clone.xpath(".//p | .//li")
        kept = []
        for element in clinical:
            text = visible_text(element)
            if len(norm(text)) < 10:
                continue
            if norm(text) in existing:
                element.drop_tree()
                changes.append({"operation": "deduplicate_guide", "reason": "Guide statement already appears in the unified reference", "text": text})
            else:
                kept.append(text)
                existing += norm(text)
        if kept:
            clone.set("class", "book44-extra")
            extras.append(clone)
            changes.append({"operation": "include_unique_guide", "reason": "Guide-only information added to the single reading sequence", "texts": kept})
    return extras


def heading(number, title, model):
    return '<header class="book44-chapter-head"><p class="book44-chapter-kicker">SACTCHECK · CHAPTER '+str(number).zfill(2)+'</p><h1 class="book44-chapter-title">'+html.escape(title)+'</h1><small>'+html.escape(model["title"])+' · NCCP '+html.escape(model["code"])+'</small></header>'


def document(tree, body, body_class="book44"):
    head = copy.deepcopy(tree.find("head"))
    for element in list(head.xpath(".//script")):
        element.drop_tree()
    stylesheet = LH.Element("style", {"data-sactcheck-book": "0.84.44"})
    stylesheet.text = CSS_FILE.read_text()
    head.append(stylesheet)
    visual_css = ROOT / "assets/patient/patient-visual-language-v08444.css"
    if visual_css.exists():
        sheet = LH.Element("style", {"data-sactcheck-visual-language": "0.84.44"})
        sheet.text = visual_css.read_text()
        head.append(sheet)
    shell = LH.Element("html", {"lang": "en-IE"})
    shell.append(head)
    main_body = ET.SubElement(shell, "body", {"class": body_class})
    main = ET.SubElement(main_body, "main")
    for element in LH.fragments_fromstring(body):
        if isinstance(element, str):
            continue
        main.append(element)
    return "<!doctype html>" + LH.tostring(shell, encoding="unicode", method="html")


def build_phase_content(route, profile, changes):
    names = old.current_support_files(route)
    sections, trees, units = [], [], []
    seen_notice = set()
    for filename in names:
        source_name = filename.replace(".pdf", ".html")
        tree, path = tree_for(route, source_name, profile)
        trees.append(copy.deepcopy(tree))
        clean_browser_markup(tree, changes)
        main = tree.xpath("//main")[0]
        for value in list(main.xpath("./h1 | ./p")):
            if value.tag == "h1" or re.fullmatch(r"nccp\d{5}cliniciandraft", norm(visible_text(value))):
                drop(value, changes, "Repeated regimen identity is supplied by the chapter heading")
        for value in list(main.xpath('.//*[contains(concat(" ",normalize-space(@class)," ")," sources ")]')):
            drop(value, changes, "Phase evidence is grouped in the source section")
        for notice in list(main.xpath('./div[contains(concat(" ",normalize-space(@class)," ")," notice ")]')):
            value = norm(visible_text(notice))
            if value in seen_notice:
                drop(notice, changes, "Identical support-draft qualification is printed once before the phase plans")
            else:
                seen_notice.add(value)
        units.extend(core_units(tree, "patient/"+route+"/"+source_name))
        section = LH.Element("section", {"class": "book44-phase", "data-support-source": source_name})
        for child in list(main):
            section.append(child)
        sections.append(section)
    return sections, trees, units, names


def build_reading_body(route, model, profile, companions=None):
    tree, source_path = tree_for(route, "knowledge.html", profile)
    original_tree = copy.deepcopy(tree)
    guide_tree, _ = tree_for(route, "guide.html", profile)
    companion, companion_trees = companions if companions is not None else companion_plan(route)
    changes = []
    # Preserve raw chronological axes before removing keyboard/day buttons.
    timeline_records = printable_timelines(tree, changes)
    clean_browser_markup(tree, changes)
    deduplicate_monitoring(tree, changes)
    main = tree.xpath("//main")[0]
    sources = source_addresses([original_tree])
    source_units = core_units(tree, "patient/"+route+"/knowledge.html")
    anatomy_units = []
    for element in list(main.xpath('./*[@id="anatomical-effects"]')):
        anatomy_units.extend(core_units(LH.fromstring('<html><body><main>'+LH.tostring(element, encoding="unicode")+'</main></body></html>'), "patient/"+route+"/knowledge.html#anatomy"))
        drop(element, changes, "The complete anatomical page is included once at its original scale")
    extras = add_guide_unique_material(guide_tree, main, changes)
    for extra in extras:
        main.append(extra)
    phase_sections, phase_trees, phase_units, support_names = build_phase_content(route, profile, changes)
    companion_units = add_companion_unique_material(main,companion,changes)
    sources = source_addresses([original_tree] + phase_trees + companion_trees)
    groups = {key: [] for key, _ in CHAPTERS}
    for element in list(main):
        if not isinstance(element.tag, str):
            continue
        if element.tag == "footer" or not visible_text(element):
            continue
        group = chapter_group(element)
        if group != "sources":
            groups[group].append(element)
    for section in phase_sections:
        groups["care"].append(section)
    # Material not in an existing paragraph (especially the exact indication)
    # is introduced once; source values already represented are not repeated.
    context = []
    all_text = norm(" ".join(visible_text(value) for values in groups.values() for value in values))
    for key in ["context_label", "scope_note"]:
        value = profile.get(key)
        if isinstance(value, str) and norm(value) and norm(value) not in all_text:
            context.append(value)
            all_text += norm(value)
    if context:
        box = LH.Element("aside", {"class": "book44-context"})
        for value in context:
            ET.SubElement(box, "p").text = value
        groups["treatment"].insert(0, box)
    body = ""
    for number, (key, title) in enumerate(CHAPTERS[:3], 1):
        body += '<section class="book44-chapter" id="book44-'+key+'">'+heading(number, title, model)
        body += "".join(LH.tostring(element, encoding="unicode", method="html") for element in groups[key])
        body += "</section>"
    assembled = LH.fromstring(document(tree, body))
    # Required units include added guide-only statements and current phase rows.
    source_units.extend(core_units(assembled, "assembled current source narrative"))
    source_units.extend(phase_units)
    source_units.extend(companion_units)
    deduplicate_explanations(assembled, changes)
    printed = publication_pass("<!doctype html>" + LH.tostring(assembled, encoding="unicode", method="html"), route, "assembled-handbook", profile)
    return printed, {"changes": changes, "source_units": source_units, "anatomy_units": anatomy_units,
        "timelines": timeline_records, "sources": sources, "support_files": support_names, "tree": tree,
        "companion_plan":companion,"input_trees": [original_tree, guide_tree] + phase_trees + companion_trees}


def source_section_html(tree, sources, model, number):
    items = "".join('<li><span class="book44-source-label">'+html.escape(source["label"])+'</span><a href="'+html.escape(source["url"], quote=True)+'">'+html.escape(source["url"])+'</a></li>' for source in sources)
    body = '<section class="book44-chapter book44-sources">'+heading(number, "Sources and further information", model)
    body += '<p>Use this information alongside the plan agreed with your treatment team. Your team confirms your medicines, doses and appointments.</p><ol class="book44-refs">'+items+'</ol></section>'
    return document(tree, body)


def build_guide(route, model, profile, previous):
    source = ROOT / "patient" / route / "guide.html"
    tree, _ = tree_for(route, "guide.html", profile)
    original_file = previous / "patient" / route / "guide.pdf"
    original = fitz.open(original_file)
    profile_font = old.font_profile(original)
    first = tree.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," pt-first ")]')
    if first:
        if len(original) != 3 or len(first) != 1:
            raise ValueError((route, "Modern guide requires one first page and three prior pages"))
        body = tree.find("body")
        for child in list(body):
            body.remove(child)
        main = ET.SubElement(body, "main", {"class": "pt-sheet"})
        main.append(copy.deepcopy(first[0]))
        data = old.render(LH.tostring(tree, encoding="unicode", method="html"), source, styles=GUIDE_CSS.read_text(), profile=profile_font)
        first_doc = fitz.open(stream=data, filetype="pdf")
        if len(first_doc) != 1:
            raise ValueError((route, "The distilled guide first page overflowed", len(first_doc)))
        guide = fitz.open()
        guide.insert_pdf(first_doc)
        guide.insert_pdf(original, from_page=1, to_page=2)
        retained = old.body_signature(original)[1:]
        if old.body_signature(guide)[1:] != retained:
            raise ValueError((route, "Anatomy or wallet guide page changed"))
        return guide.tobytes(garbage=4, deflate=True), {"mode": "Current first page plus exact original anatomy and wallet", "pages": 3,
            "previous_sha256": HASH(original_file.read_bytes()), "retained_pages": [{"source_page": 2, "output_page": 2}, {"source_page": 3, "output_page": 3}], "font_profile": profile_font}
    # Historical legacy guide renderers supplied this auxiliary print layout;
    # it is intentionally not linked by the responsive source HTML. Its exact
    # authored dimensions prevent a zero-width anatomy wrapper in WeasyPrint.
    for line in tree.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," hcc-static-connectors ")]//line'):
        if line.get('stroke') is None:
            line.set('stroke','#a94022' if 'chemo' in classes(line) else '#682b9f')
        if line.get('stroke-width') is None:
            line.set('stroke-width','.42')
        if 'chemo' in classes(line) and line.get('stroke-dasharray') is None:
            line.set('stroke-dasharray','1.4 .9')
    data = old.render(LH.tostring(tree, encoding="unicode", method="html"), source,
        styles=(ROOT/'assets/patient/pdf-layout-v0838.css').read_text(), profile=profile_font)
    doc = fitz.open(stream=data, filetype="pdf")
    def illustrations(pdf):
        return [{'page':index+1,'digest':bytes(item['digest']).hex(),'pixels':[item['width'],item['height']],
            'bbox':list(item['bbox']),'size_pt':[fitz.Rect(item['bbox']).width,fitz.Rect(item['bbox']).height]}
            for index,page in enumerate(pdf) for item in page.get_image_info(hashes=True) if item['width']==846 and item['height']==1859]
    before,after = illustrations(original),illustrations(doc)
    if not before or len(before)!=len(after):
        raise ValueError((route,'Legacy guide anatomical illustration missing or duplicated',len(before),len(after)))
    for a,b in zip(before,after):
        if a['digest']!=b['digest'] or any(abs(x-y)>.1 for x,y in zip(a['size_pt'],b['size_pt'])):
            raise ValueError((route,'Legacy guide anatomical pixels or physical scale changed',a,b))
    return data, {"mode": "Current legacy source with historical print layout; full clinical content", "pages": len(doc), "previous_pages": len(original), "previous_sha256": HASH(original_file.read_bytes()), "font_profile": profile_font,
        'anatomical_bitmap_proof':{'previous':before,'current':after,'original_pixels_and_physical_scale_retained':True,'position_note':'Current first-use explanations can move the illustration vertically; its pixels, aspect and physical size are unchanged.'}}


def anatomy_document(route, model, profile, previous):
    source = ROOT / "patient" / route / "guide.html"
    guide = LH.fromstring(source.read_text())
    maps = guide.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," patient-bodymap-card ")]')
    original_file = previous / "patient" / route / "guide.pdf"
    if maps:
        original = fitz.open(original_file)
        first = guide.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," pt-first ")]')
        index = 1 if first else 0
        doc = fitz.open()
        doc.insert_pdf(original, from_page=index, to_page=index)
        return doc, {"mode": "Original unscaled anatomical page", "source": str(original_file), "source_page": index + 1,
            "source_sha256": HASH(original_file.read_bytes()), "signature": old.body_signature(doc)[0]}
    tree, path = tree_for(route, "index.html", profile)
    maps = tree.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," patient-bodymap-card ")]')
    if len(maps) != 1:
        raise ValueError((route, "Exactly one detailed anatomical map is required"))
    map_element = copy.deepcopy(maps[0])
    stage = map_element.xpath('.//*[contains(concat(" ",normalize-space(@class)," ")," hcc-visual-stage ")]')[0]
    columns = stage.xpath('./*[contains(concat(" ",normalize-space(@class)," ")," hcc-organ-column ")]')
    anatomy = stage.xpath('./*[contains(concat(" ",normalize-space(@class)," ")," hcc-anatomy ")]')[0]
    image_wrap = anatomy.xpath('./*[contains(concat(" ",normalize-space(@class)," ")," hcc-image-wrap ")]')[0]
    authored_height = re.search(r'--pdf-map-height\s*:\s*([\d.]+)mm', map_element.get('style',''))
    authored_width = re.search(r'--pdf-map-width\s*:\s*([\d.]+)mm', map_element.get('style',''))
    image_file = (path.parent/image_wrap.xpath('./img')[0].get('src').split('?')[0]).resolve()
    image_pixels = fitz.Pixmap(str(image_file))
    # The shared authored map stylesheet specifies 150 mm when a route has no
    # explicit print-size override; intrinsic aspect ratio supplies its width.
    image_height = float(authored_height[1]) if authored_height else 150.0
    image_width = float(authored_width[1]) if authored_width else image_height*image_pixels.width/image_pixels.height
    card_rows = max(len(column.xpath('./article')) for column in columns)
    stage_height = max(image_height, 44*card_rows)
    width, card_width = 182, 52
    image_left = (width-image_width)/2
    image_top = (stage_height-image_height)/2
    row_height = stage_height/card_rows
    stage.set('class', stage.get('class','')+' book44-map-stage')
    stage.set('style', 'width:182mm!important;height:'+str(stage_height)+'mm!important')
    anatomy.set('style', 'left:'+str(image_left)+'mm!important;top:'+str(image_top)+'mm!important;width:'+str(image_width)+'mm!important;height:'+str(image_height)+'mm!important')
    image_wrap.set('style', 'width:'+str(image_width)+'mm!important;height:'+str(image_height)+'mm!important')
    image_wrap.xpath('./img')[0].set('style','display:block!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:contain!important;object-position:50% 50%!important;margin:0!important;padding:0!important')
    pins = {}
    placed, marker_offsets, leaders = [], [], []
    for pin in image_wrap.xpath('./span[@data-hcc-pin]'):
        left = float(re.search(r'left\s*:\s*([\d.]+)%',pin.get('style',''))[1])
        top = float(re.search(r'top\s*:\s*([\d.]+)%',pin.get('style',''))[1])
        pins[pin.get('data-hcc-pin')] = (image_left+image_width*left/100, image_top+image_height*top/100)
        target_x,target_y = pins[pin.get('data-hcc-pin')]
        x,y = target_x,target_y
        if any(math.hypot(x-px,y-py)<8 for px,py in placed):
            for dx,dy in [(-9,0),(9,0),(0,-9),(0,9),(-12,-6),(12,6)]:
                candidate = (target_x+dx,target_y+dy)
                if image_left+3 <= candidate[0] <= image_left+image_width-3 and image_top+3 <= candidate[1] <= image_top+image_height-3 and all(math.hypot(candidate[0]-px,candidate[1]-py)>=8 for px,py in placed):
                    x,y = candidate
                    pin.set('style','left:'+str((x-image_left)*100/image_width)+'%;top:'+str((y-image_top)*100/image_height)+'%')
                    colour = '#a94022' if 'bev' in classes(pin) else '#682b9f'
                    length = math.hypot(x-target_x,y-target_y)
                    end_x,end_y = x+(target_x-x)*3/length,y+(target_y-y)*3/length
                    leaders.append('<line x1="'+str(target_x)+'" y1="'+str(target_y)+'" x2="'+str(end_x)+'" y2="'+str(end_y)+'" stroke="'+colour+'" stroke-width=".5"/>')
                    marker_offsets.append({'target':pin.get('data-hcc-pin'),'number':visible_text(pin),'authored_target_mm':[target_x,target_y],'badge_offset_mm':[dx,dy],'reason':'Keep overlapping numbered badges separately readable'})
                    break
            else:
                raise ValueError((route,'Cannot separate two authored anatomical marker labels safely'))
        placed.append((x,y))
    lines = []
    for side,column in enumerate(columns):
        column.set('style','left:'+str(0 if side==0 else width-card_width)+'mm!important;top:0!important;width:'+str(card_width)+'mm!important;height:'+str(stage_height)+'mm!important')
        for index,card in enumerate(column.xpath('./article')):
            card.set('style','top:'+str(index*row_height)+'mm;height:'+str(row_height-3)+'mm')
            x,y = pins[card.get('data-hcc-target')]
            colour = '#682b9f' if side==0 else '#a94022'
            lines.append('<line x1="'+str(card_width if side==0 else width-card_width)+'" y1="'+str((index+.5)*row_height-1.5)+'" x2="'+str(x)+'" y2="'+str(y)+'" stroke="'+colour+'" stroke-width=".55"/>')
    for original in list(stage.xpath('./svg')):
        original.drop_tree()
    stage.insert(0,LH.fromstring('<svg class="book44-map-connectors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 182 '+str(stage_height)+'" preserveAspectRatio="none" aria-hidden="true">'+''.join(lines)+'</svg>'))
    if leaders:
        stage.insert(1,LH.fromstring('<svg class="book44-map-connectors book44-map-leaders" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 182 '+str(stage_height)+'" preserveAspectRatio="none" aria-hidden="true">'+''.join(leaders)+'</svg>'))
    body = tree.find("body")
    for child in list(body):
        body.remove(child)
    main = ET.SubElement(body, "main", {"class": "book44-anatomy-sheet"})
    title = ET.SubElement(main, "h1"); title.text = "Your anatomical side-effect map"
    label = ET.SubElement(main, "p"); label.text = model["title"]
    main.append(map_element)
    style = LH.Element("style")
    style.text = '@page{size:A4;margin:14mm}html,body{margin:0!important;background:#fff!important;font:11pt Arial;color:#173947}.book44-anatomy-sheet{max-width:none!important;margin:0!important;padding:0!important}.book44-anatomy-sheet>h1{font-size:20pt;margin:0 0 3mm}.book44-anatomy-sheet>p{font-size:11pt;margin:0 0 4mm}.book44-anatomy-sheet .patient-bodymap-card{break-inside:avoid!important;width:100%!important;max-width:none!important;padding:0!important;border:0!important}.book44-anatomy-sheet .hcc-visual-title{margin:0 0 3mm!important;padding:0!important}.book44-anatomy-sheet .hcc-visual-title h4{font-size:13pt;margin:0 0 1mm!important}.book44-anatomy-sheet .hcc-visual-title p{font-size:10pt;line-height:1.3;margin:0!important}.book44-anatomy-sheet .book44-map-stage{display:block!important;position:relative!important;min-height:0!important;padding:0!important;overflow:visible!important;isolation:auto!important;background:#f1f8f6!important}.book44-anatomy-sheet .hcc-organ-column{position:absolute!important;display:block!important;min-height:0!important;z-index:3}.book44-anatomy-sheet .hcc-organ-card{position:absolute!important;width:100%!important;min-height:0!important;margin:0!important;padding:2mm!important;border-radius:2mm!important;box-shadow:none!important;overflow:visible!important}.book44-anatomy-sheet .hcc-organ-card p{font-size:9.5pt!important;line-height:1.25!important;margin:1mm 0 0!important}.book44-anatomy-sheet .hcc-organ-head{font-size:10.5pt!important;line-height:1.15!important}.book44-anatomy-sheet .hcc-drug-label{font-size:8pt!important;line-height:1.2!important}.book44-anatomy-sheet .hcc-anatomy{position:absolute!important;display:block!important;min-height:0!important;max-height:none!important;margin:0!important;z-index:2}.book44-anatomy-sheet .hcc-image-wrap{position:relative!important;max-width:none!important;margin:0!important;aspect-ratio:auto!important}.book44-anatomy-sheet .hcc-anatomy img{width:100%!important;height:100%!important;object-fit:contain!important}.book44-anatomy-sheet .book44-map-connectors{display:block!important;position:absolute!important;left:0;top:0;width:100%;height:100%;z-index:1}.book44-anatomy-sheet .hcc-visual-foot{font-size:8.5pt!important;line-height:1.25!important;margin:2mm 0 0!important}.book44-anatomy-sheet .hcc-card-number{font-size:9pt!important;line-height:1.2!important}'
    style.text += '.book44-anatomy-sheet .book44-map-leaders{z-index:3!important}.book44-anatomy-sheet .hcc-visual-title{display:block!important}.book44-anatomy-sheet .hcc-visual-title h4{display:none!important}'
    tree.find("head").append(style)
    map_html = publication_pass(LH.tostring(tree, encoding="unicode", method="html"), route, "standalone-anatomical-map", profile)
    data = old.render(map_html, path, profile="Nimbus")
    doc = fitz.open(stream=data, filetype="pdf")
    if len(doc) != 1:
        raise ValueError((route, "Detailed portal anatomy requires a legible single page", len(doc)))
    rendered_images = [item for item in doc[0].get_image_info() if item['width'] == image_pixels.width and item['height'] == image_pixels.height]
    if len(rendered_images) != 1:
        raise ValueError((route,'Expected one original anatomical bitmap'))
    image_rect = fitz.Rect(rendered_images[0]['bbox'])
    rendered_size = [image_rect.width*25.4/72,image_rect.height*25.4/72]
    if any(abs(actual-wanted)>.15 for actual,wanted in zip(rendered_size,[image_width,image_height])):
        raise ValueError((route,'The figure and anatomical marker frame differ',rendered_size,[image_width,image_height]))
    return doc, {"mode": "Full detailed portal map added to the book", "source": str(path.relative_to(ROOT)), "source_map_sha256": HASH(LH.tostring(maps[0])), "pages": 1,
        "authored_image_dimensions_mm": [image_width,image_height], "rendered_image_dimensions_mm":rendered_size, "label_rows":card_rows,"stage_height_mm":stage_height,"anatomical_target_positions_preserved":True,"numbered_marker_offsets_mm":marker_offsets}


def complete_reference_html(printed, route, profile, sources_html):
    """Keep the staged composition complete without replacing canonical HTML."""
    tree = LH.fromstring(printed)
    maps = []
    # Some historical landing pages redirect to the current full reference;
    # their authored detailed map remains in the standalone guide instead.
    for map_source in ["index.html", "guide.html", "knowledge.html"]:
        portal, _ = tree_for(route, map_source, profile)
        maps = portal.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," patient-bodymap-card ")]')
        if len(maps) == 1:
            break
    if len(maps) != 1:
        raise ValueError((route, "The full print reference needs exactly one authored anatomy map"))
    main = tree.xpath('//main')[0]
    section = ET.SubElement(main, 'section', {'class': 'book44-reference-anatomy', 'id': 'anatomical-effects', 'data-book44-anatomy-source': map_source})
    ET.SubElement(section, 'h2').text = 'Your anatomical side-effect map'
    section.append(copy.deepcopy(maps[0]))
    sources = LH.fromstring(sources_html).xpath('//main')[0]
    for child in list(sources):
        main.append(child)
    return publication_pass('<!doctype html>'+LH.tostring(tree, encoding='unicode', method='html'), route, 'complete-print-reference', profile)


def records_document(route, model, profile):
    tree, path = tree_for(route, "passport.html", profile)
    changes = []
    clean_browser_markup(tree, changes)
    main = tree.xpath("//main")[0]
    pages = main.xpath('./section')
    if not pages:
        raise ValueError((route, "Passport has no record sections"))
    intro = pages[0]
    for element in list(intro.xpath('./h1 | ./h2 | ./div | ./footer')):
        if element.tag in {"h1", "h2", "footer"} or classes(element) & {"wiki-kicker", "wiki-note", "wiki-contact-grid", "suite-qr-row", "suite-note-space"}:
            drop(element, changes, "Repeated identity/contact content is already in the handbook and wallet")
    for element in list(intro.xpath('./p')):
        value = visible_text(element)
        if norm(value) == norm(profile.get("schedule_summary", "")) or value.startswith("Source reconciled"):
            drop(element, changes, "Repeated schedule or review metadata is included once elsewhere")
        elif "four pages are reusable" in value or "pages are reusable recording sheets" in value or "two pages are reusable" in value:
            element.text = "Use a new record sheet for each cycle or review. Copy or print another sheet when needed; the number of sheets does not prescribe the length of treatment."
            for child in list(element):
                element.remove(child)
        elif value.startswith("One cycle per page."):
            element.text = value.replace("One cycle per page.", "Record each cycle separately.", 1)
            for child in list(element):
                element.remove(child)
            changes.append({'operation':'replace_paper_orientation','before':value,'after':element.text,'reason':'A reusable record can span more than one page; its cycle identity is unchanged'})
    intro.set("class", "book44-record-intro")
    seen = {}
    kept, repeated = [], []
    for element in pages[1:]:
        # Printed copy numbers are not clinical differences. Remove only the
        # repeated running footer before comparing the reusable form content.
        for footer in list(element.xpath('.//footer')):
            drop(footer, changes, "Record-copy numbering is replaced by one reusable template and global folios")
        for metadata in list(element.xpath('./*[contains(concat(" ",normalize-space(@class)," ")," wiki-kicker ")]')):
            drop(metadata, changes, "Regimen identity and reusable-sheet numbering are supplied by the chapter and form headings")
        for repeated_title in list(element.xpath('./h1 | ./h2')):
            if norm(visible_text(repeated_title)) in {norm(model['title']), norm(profile.get('title',''))}:
                drop(repeated_title, changes, "The exact regimen title is already printed in the record chapter heading")
        for label in element.xpath('.//*[contains(concat(" ",normalize-space(@class)," ")," suite-phase-check ")]'):
            value = visible_text(label)
            if re.match(r'^Cycle \d+ · ', value) and value.endswith('copy this sheet for another cycle of the same phase.'):
                label.text = re.sub(r'^Cycle \d+', 'Reusable cycle record', value)
                for child in list(label):
                    label.remove(child)
                changes.append({"operation": "replace_copy_number", "before": value, "after": label.text, "reason": "The blank cycle-number field records the actual cycle; numbered duplicate copies are unnecessary"})
        value = norm(visible_text(element))
        # Some source copies add only "if prescribed" to an otherwise exact
        # day label. Retain the qualified copy, never delete the qualifier or
        # merge genuinely different phases, days, tables or instructions.
        comparison = copy.deepcopy(element)
        qualified = 0
        for label in comparison.xpath('.//*[contains(concat(" ",normalize-space(@class)," ")," suite-phase-check ")]'):
            label_text = visible_text(label)
            match = re.fullmatch(r'Reusable cycle record · (Days? [^·]+) · copy this sheet for another cycle of the same phase\.', label_text)
            if match and match.group(1).endswith(' if prescribed'):
                qualified += 1
                label.text = label_text.replace(' if prescribed ·', ' ·')
                for child in list(label):
                    label.remove(child)
        comparison_key = norm(visible_text(comparison))
        if comparison_key in seen:
            prior = seen[comparison_key]
            if qualified > prior['qualified']:
                kept[prior['index']] = element
                discarded_value, retained_value = prior['value'], value
                seen[comparison_key] = {'index': prior['index'], 'qualified': qualified, 'value': value}
            else:
                discarded_value, retained_value = value, prior['value']
            repeated.append({"text_sha256": HASH(discarded_value.encode()), "retained_text_sha256": HASH(retained_value.encode()),
                "reason": "Identical blank record template; one reusable copy is included" if discarded_value == retained_value else "The same day label, tables and instructions are retained once in the copy explicitly qualified 'if prescribed'"})
            continue
        seen[comparison_key] = {'index': len(kept), 'qualified': qualified, 'value': value}
        kept.append(element)
    if kept:
        kept[0].set("class", kept[0].get("class", "")+" book44-first-cycle")
    body = '<section class="book44-chapter">'+heading(4, "Your record and contact card", model)
    body += LH.tostring(intro, encoding="unicode", method="html")
    body += "".join(LH.tostring(element, encoding="unicode", method="html") for element in kept)
    body += "</section>"
    printed = publication_pass(document(tree, body, "book44 book44-records"), route, "assembled-records", profile)
    data = old.render(printed, path, profile="Nimbus")
    orphan_flags = inspect(data,route+'/record-forms')['short_page_flags']
    if orphan_flags:
        compact = LH.fromstring(printed)
        compact.find('body').set('class','book44 book44-records book44-records-compact')
        candidate = '<!doctype html>'+LH.tostring(compact,encoding='unicode',method='html')
        candidate_data = old.render(candidate,path,profile='Nimbus')
        if len(inspect(candidate_data,route+'/record-forms compact')['short_page_flags']) <= len(orphan_flags) and len(fitz.open(stream=candidate_data,filetype='pdf')) <= len(fitz.open(stream=data,filetype='pdf')):
            printed,data = candidate,candidate_data
            changes.append({'operation':'prevent_record_orphan','previous_short_pages':orphan_flags,'reason':'Tighter table padding and paragraph leading retain every font size and complete form content'})
    for _ in range(2):
        orphan_flags = inspect(data,route+'/record-forms')['short_page_flags']
        if not orphan_flags:
            break
        tree = LH.fromstring(printed)
        pdf = fitz.open(stream=data,filetype='pdf')
        amended = []
        for flag in orphan_flags:
            action = rebalance_tail(tree.xpath('//main')[0],pdf,flag)
            if action:
                amended.append(action)
                break
        if not amended:
            break
        candidate = '<!doctype html>'+LH.tostring(tree,encoding='unicode',method='html')
        candidate_data = old.render(candidate,path,profile='Nimbus')
        candidate_check = inspect(candidate_data,route+'/record-forms candidate')
        if len(candidate_check['short_page_flags']) > len(orphan_flags) or candidate_check['pages'] > len(pdf):
            original = LH.fromstring(printed)
            for action in amended:
                for element in original.xpath(action['reject_xpath']):
                    element.set(action['reject_attribute'],'true')
            printed = '<!doctype html>'+LH.tostring(original,encoding='unicode',method='html')
            changes.append({'operation':'reject_record_pagination_candidate','reason':'Trial increased the page count or ordinary sparse-page count; previous form layout retained'})
            continue
        printed,data = candidate,candidate_data
        changes.extend({'operation':'balance_record_tail',**item} for item in amended)
    return fitz.open(stream=data, filetype="pdf"), {"source": str(path.relative_to(ROOT)), "removed_duplicate_record_copies": repeated,
        "kept_unique_sections": len(kept), "changes": changes, "required_units": core_units(LH.fromstring(printed), str(path.relative_to(ROOT))), "html": printed}


def remove_folios(text):
    return re.sub(r"(?:Handbook|Reference)\s+\d+\s*/\s*\d+", "", text)


def check_units(doc, units, label):
    combined = norm("".join(remove_folios(page.get_text()) for page in doc))
    unique, missing = {}, []
    for unit in units:
        value = norm(unit["text"])
        unique.setdefault(unit["sha256"], unit)
        if value not in combined:
            missing.append(unit)
    if missing:
        raise ValueError((label, "Source statements missing from rendered output", [{"source": row["source"], "text": row["text"][:230]} for row in missing[:12]]))
    return {"checks": len(units), "unique_statements": len(unique), "missing": []}


def inspect(data, label, exempt_pages=()):
    doc = fitz.open(stream=data, filetype="pdf")
    findings, short = [], []
    for i, page in enumerate(doc):
        words = page.get_text("words")
        if not words:
            raise ValueError((label, i + 1, "Empty page"))
        for word in words:
            if word[0] < -1 or word[1] < -1 or word[2] > page.rect.width + 1 or word[3] > page.rect.height + 1:
                findings.append({"page": i + 1, "text": word[4], "bbox": list(word[:4])})
        body_words = [word for word in words if 25 <= word[1] < page.rect.height - 30]
        if i + 1 not in exempt_pages and len(body_words) < WORD_MINIMUM:
            occupied = max((word[3] for word in body_words), default=0) - min((word[1] for word in body_words), default=0)
            if occupied < SHORT_PAGE_HEIGHT:
                short.append({"page": i + 1, "words": len(body_words), "occupied_height_pt": round(occupied, 1), "text": " ".join(word[4] for word in body_words)})
    if findings:
        raise ValueError((label, "Out-of-page text", findings[:10]))
    return {"sha256": HASH(data), "pages": len(doc), "bounds": [], "short_page_flags": short,
        "short_page_exemptions": sorted(exempt_pages), "fonts": sorted({font[3] for page in doc for font in page.get_fonts()})}


def cover(route, model, contents, profile, reference=False):
    source = old.node("cover", route, {"contents": contents})
    if reference:
        source = source.replace("My complete treatment handbook", "My treatment reference")
    source = publication_pass(source, route, "handbook-cover" if not reference else "reference-cover", profile)
    data = old.render(source, ROOT)
    doc = fitz.open(stream=data, filetype="pdf")
    if len(doc) != 1:
        raise ValueError((route, "Branded cover/contents overflow", len(doc)))
    return doc, source


def add_toc_links(doc, entries):
    for entry in entries:
        for rect in doc[0].search_for(entry["title"]):
            doc[0].insert_link({"kind": fitz.LINK_GOTO, "from": rect, "page": entry["page"]-1})


def fingerprint_inputs(route, profile_path, previous, companion_fingerprint):
    paths = [Path(__file__), CSS_FILE, COMPANION_AUDIT, ROOT/"package.json", profile_path,
        ROOT/"tools/patient-visual-standard-v08443.cjs", ROOT/"tools/build-patient-documents-v08443.py"]
    for name in ["tools/patient-editorial-v08444.cjs", "tools/patient-visual-language-v08444.cjs", "assets/patient/patient-visual-language-v08444.css"]:
        if (ROOT/name).exists():
            paths.append(ROOT/name)
    paths.extend(sorted((ROOT/"patient"/route).glob("*.html")))
    for filename in ['guide.html','index.html']:
        tree = LH.fromstring((ROOT/'patient'/route/filename).read_text())
        for source in tree.xpath('//img/@src'):
            if not source.startswith(('data:','https:','http:')):
                asset = (ROOT/'patient'/route/source.split('?')[0]).resolve()
                if asset.is_relative_to(ROOT) and asset.is_file():
                    paths.append(asset)
    paths.extend(sorted((ROOT/"assets/patient").glob("*.css")))
    paths.extend([previous/"patient"/route/name for name in ["guide.pdf", "sactcard.pdf", "handbook.pdf"] if name!="handbook.pdf" or route not in NEW_ROUTES_WITHOUT_PRIOR_BOOK or (previous/"patient"/route/name).exists()])
    records = {str(path.relative_to(ROOT)) if path.is_relative_to(ROOT) else str(path): HASH(path.read_bytes()) for path in paths}
    return HASH(json.dumps({'files':records,'companion_decisions':companion_fingerprint}, sort_keys=True).encode()), records


def rebalance_tail(container, pdf, flag):
    """Move a complete nearby topic onto a short tail without altering text."""
    if flag['page'] < 2:
        return None
    def layout_text(value):
        # Both the DOM and PDF already contain publication-expanded wording.
        # Geometric word offsets need the same literal normalization on both
        # sides; a multiword acronym collapse cannot be applied per PDF word.
        return re.sub(r'[^\w]','',unicodedata.normalize('NFKC',value).replace('\u00ad','')).casefold()

    previous_page = pdf[flag['page']-2]
    previous_words = [word for word in previous_page.get_text('words') if 25 <= word[1] < previous_page.rect.height-30]
    word_spans = []
    previous_text = ''
    for word in previous_words:
        first = len(previous_text)
        previous_text += layout_text(word[4])
        word_spans.append((first,len(previous_text),word))

    def safe_previous_block(value):
        # A heading/first-line match does not establish that its containing
        # section fits on this page. Require the complete visible block, then
        # ensure its removal cannot leave another orphan heading above it.
        full = layout_text(value)
        # Repeated medicines in induction and maintenance can have identical
        # rows. Their text on the preceding page does not identify which
        # authored occurrence is there, so never move an ambiguous occurrence.
        if not full or layout_text(full_text).count(full) != 1:
            return None
        start = previous_text.find(full) if full else -1
        if start < 0:
            return None
        before = [word for first,stop,word in word_spans if stop <= start]
        height = max((word[3] for word in before),default=0)-min((word[1] for word in before),default=0)
        if len(before) < WORD_MINIMUM and height < SHORT_PAGE_HEIGHT:
            return None
        return {'preceding_body_words':len(before),'preceding_occupied_height_pt':round(height,1),
            'complete_moved_block_sha256':HASH(full.encode())}

    full_text = visible_text(container)
    choices = []
    content_classes = {'pk-card','access-step','book44-extra','suite-agent-table','sc44-investigation','journey-milestone'}
    for element in container.iterdescendants():
        if not isinstance(element.tag,str) or 'book44-keep-tail-topic' in classes(element) or element.get('data-book44-rebalance-rejected'):
            continue
        if element.tag != 'section' and not (classes(element) & content_classes):
            continue
        if classes(element) & {'book44-chapter','book44-chapter-head','book44-record-intro'}:
            continue
        if element.xpath('ancestor::header'):
            continue
        value = visible_text(element)
        if len(value.split()) < 20:
            continue
        position = full_text.rfind(value)
        if position < 0 or len(full_text[position:].split()) < WORD_MINIMUM:
            continue
        anchor_element = copy.deepcopy(element)
        for hidden in list(anchor_element.iterdescendants()):
            if isinstance(hidden.tag,str) and (classes(hidden) & {'pk-eyebrow','wiki-kicker','access-kicker','journey-eyebrow','journey-number','no-print'} or hidden.get('aria-hidden') == 'true'):
                hidden.drop_tree()
        proof = safe_previous_block(visible_text(anchor_element))
        if proof:
            choices.append((position,element,value,proof))
    if not choices:
        # A long medicine/review table can leave only its following notes on
        # the next page. Use complete body rows as a bounded fallback; the
        # existing table header repeats and no cell or qualifier is removed.
        for element in container.xpath('.//table/tbody/tr | .//table/tr'):
            if 'book44-keep-tail-topic' in classes(element) or element.get('data-book44-rebalance-rejected') or element.xpath('ancestor::*[contains(concat(" ",normalize-space(@class)," ")," suite-agent-table ")]'):
                continue
            value = visible_text(element)
            if not re.search(r'[A-Za-z]',value):
                continue
            position = full_text.rfind(value)
            if position < 0 or len(full_text[position:].split()) < WORD_MINIMUM:
                continue
            proof = safe_previous_block(value)
            if proof:
                choices.append((position,element,value,proof))
    if not choices:
        return None
    position,element,value,proof = max(choices,key=lambda item:item[0])
    element.set('class',element.get('class','')+' book44-keep-tail-topic')
    return {'previous_short_page':flag,'moved_topic':value[:220],**proof,
        'reject_xpath':element.getroottree().getpath(element),'reject_attribute':'data-book44-rebalance-rejected',
        'adjustment':'Start a complete nearby topic on the tail page so its remaining content forms a useful reading section'}


def group_phase_ending(chapter, pdf, flag):
    """Keep a phase's closing review with its own final medicine rows.

    A repeated induction/maintenance row is not a safe page-position anchor.
    Bind this wrapper to the phase heading instead. The continued table repeats
    its existing column headings; every clinical body cell remains once and in
    the original order. This is used only for a short closing-instruction page.
    """
    if not str(flag.get('text','')).startswith(('Before signing:','Additional phase-specific support')):
        return None
    toc = pdf.get_toc()
    candidates = []
    for index,phase in enumerate(chapter.xpath('.//*[@data-support-source]')):
        headings = phase.xpath('./h2')
        if not headings:
            continue
        title = norm(visible_text(headings[0]))
        pages = [page for level,label,page in toc if norm(label) == title and page < flag['page']]
        if pages:
            candidates.append((max(pages),index,phase))
    if not candidates:
        return None
    phase = max(candidates,key=lambda item:item[:2])[2]
    if phase.get('data-book44-ending-rejected') or phase.xpath('.//*[@data-book44-phase-ending]'):
        return None
    wrappers = phase.xpath('./div[contains(concat(" ",normalize-space(@class)," ")," support-table-scroll ")]')
    if len(wrappers) != 1:
        return None
    wrapper = wrappers[0]
    tables = wrapper.xpath('./table')
    if len(tables) != 1:
        return None
    table = tables[0]
    rows = table.xpath('./tbody/tr')
    if len(rows) < 3 or table.xpath('.//*[@rowspan or @colspan]'):
        return None
    closing = list(phase)[phase.index(wrapper)+1:]
    if not closing or not any('Individual changes / rescue duration:' in visible_text(item) for item in closing):
        return None
    if len((' '.join(visible_text(item) for item in rows[-2:]+closing)).split()) > 250:
        return None
    before_cells = [visible_text(cell) for cell in phase.xpath('.//tbody/tr/td | .//tbody/tr/th')]
    continued = copy.deepcopy(wrapper)
    continued_table = continued.xpath('./table')[0]
    for body in continued_table.xpath('./tbody'):
        for child in list(body):
            body.remove(child)
    for header in continued_table.xpath('./thead'):
        header.set('data-book44-repeated-header','true')
    target_body = continued_table.xpath('./tbody')[0]
    for row in rows[-2:]:
        target_body.append(row)
    ending = LH.Element('div',{'class':'book44-phase-ending','data-book44-phase-ending':phase.get('data-support-source'),
        'style':'break-inside:avoid!important;page-break-inside:avoid!important'})
    phase.insert(phase.index(wrapper)+1,ending)
    ending.append(continued)
    for element in closing:
        ending.append(element)
    after_cells = [visible_text(cell) for cell in phase.xpath('.//tbody/tr/td | .//tbody/tr/th')]
    if after_cells != before_cells:
        raise ValueError('Phase-ending grouping changed the clinical table cell sequence')
    return {'phase':phase.get('data-support-source'),'medicine_rows_kept_with_closing_instructions':2,
        'reject_xpath':phase.getroottree().getpath(phase),'reject_attribute':'data-book44-ending-rejected',
        'adjustment':'Keep this phase’s final two medicine rows, repeated column headings and complete closing review together'}


def narrative_page_checks(printed, data, label):
    details = inspect(data,label)
    flags = list(details['short_page_flags'])
    doc = fitz.open(stream=data,filetype='pdf')
    tree = LH.fromstring(printed)
    restored = [norm(visible_text(element)) for element in tree.xpath('//*[@data-book44-companion-source]')]
    flagged_pages = {flag['page'] for flag in flags}
    for index,page in enumerate(doc,1):
        # A few short restored cards can occupy just over the ordinary
        # 200 pt orphan threshold because of their borders and spacing.
        words = [word for word in page.get_text('words') if 25 <= word[1] < page.rect.height-30]
        occupied = max((word[3] for word in words),default=0)-min((word[1] for word in words),default=0)
        if index not in flagged_pages and len(words) < WORD_MINIMUM and occupied < COMPANION_TAIL_HEIGHT:
            value = norm(page.get_text())
            if any(clause and clause in value for clause in restored):
                flags.append({'page':index,'words':len(words),'occupied_height_pt':round(occupied,1),
                    'text':' '.join(word[4] for word in words),'reason':'Sparse page containing restored companion details'})
    return details,flags,doc,tree


def render_narrative(printed, source_path):
    """Resolve short tails with bounded spacing and complete-topic balancing."""
    def render(value):
        return old.render(value, source_path, profile="Nimbus")
    data = render(printed)
    changes = []
    for attempt in range(6):
        details,flags,doc,tree = narrative_page_checks(printed,data,str(source_path)+' narrative')
        if not flags:
            break
        chapters = [(title,page) for level,title,page in doc.get_toc() if level == 1 and title in dict(CHAPTERS[:3]).values()]
        amended = set()
        proposed = []
        actions = []
        for flag in flags:
            matches = [(title,page) for title,page in chapters if page <= flag['page']]
            if not matches:
                continue
            title,start = matches[-1]
            identity = next(key for key,label in CHAPTERS if label == title)
            if identity in amended:
                # A second move in this chapter must use its newly rendered
                # page positions, not stale positions from before the first.
                continue
            chapter = tree.xpath('//*[@id="book44-'+identity+'"]')[0]
            if attempt == 0:
                chapter.set('class', chapter.get('class','')+' book44-compact')
                reason = 'Reduce paragraph/table spacing in this chapter while retaining every font size'
            else:
                if flag['page'] <= start:
                    continue
                action = group_phase_ending(chapter,doc,flag) or rebalance_tail(chapter,doc,flag)
                if not action:
                    continue
                reason = action['adjustment']
                actions.append(action)
            amended.add(identity)
            proposed.append({'chapter': title, 'previous_short_page': flag, 'adjustment': reason})
        if not amended:
            break
        candidate = '<!doctype html>'+LH.tostring(tree,encoding='unicode',method='html')
        candidate_data = render(candidate)
        candidate_details,candidate_flags,_,_ = narrative_page_checks(candidate,candidate_data,str(source_path)+' candidate narrative')
        worsened_severity = bool(actions) and len(candidate_flags) == len(flags) and sum(WORD_MINIMUM-flag['words'] for flag in candidate_flags) > sum(WORD_MINIMUM-flag['words'] for flag in flags)
        if (len(candidate_details['short_page_flags']) > len(details['short_page_flags']) or len(candidate_flags) > len(flags)
            or candidate_details['pages'] > details['pages'] or worsened_severity):
            # Reject a geometric estimate that the PDF renderer disproves.
            # Keep the previous bytes/layout and try a different bounded move.
            original = LH.fromstring(printed)
            for action in actions:
                for element in original.xpath(action['reject_xpath']):
                    element.set(action['reject_attribute'],'true')
            printed = '<!doctype html>'+LH.tostring(original,encoding='unicode',method='html')
            changes.append({'operation':'reject_pagination_candidate','reason':'The trial worsened the page count or sparse-page count/severity; original content and layout retained',
                'before_pages':details['pages'],'trial_pages':candidate_details['pages'],
                'before_sparse_pages':len(flags),'trial_sparse_pages':len(candidate_flags)})
            continue
        printed,data = candidate,candidate_data
        changes.extend(proposed)
    return printed,data,changes


def build_route(route, stage, previous, resume=False):
    logging.getLogger("weasyprint").setLevel(logging.ERROR)
    model, profile, profile_path = read_profile(route)
    companions = companion_plan(route)
    fingerprint, input_hashes = fingerprint_inputs(route, profile_path, previous, companions[0]['route_plan_sha256'])
    output = stage/route
    report_file = output/"build.json"
    if resume and report_file.exists():
        saved = json.loads(report_file.read_text())
        if saved.get("fingerprint") == fingerprint and all((output/row["document"]).exists() and HASH((output/row["document"]).read_bytes()) == row["sha256"] for row in saved["documents"]):
            return saved
    output.mkdir(parents=True, exist_ok=True)
    guide, guide_proof = build_guide(route, model, profile, previous)
    printed, reading = build_reading_body(route, model, profile, companions)
    printed, body_data, pagination = render_narrative(printed, ROOT/"patient"/route/"knowledge.html")
    reading['changes'].extend({'operation':'prevent_orphan_page',**change} for change in pagination)
    (output/"reading-body.html").write_text(printed)
    (output/"reading-body.pdf").write_bytes(body_data)
    body = fitz.open(stream=body_data, filetype="pdf")
    anatomy, anatomy_proof = anatomy_document(route, model, profile, previous)
    anatomy_page = len(body)+2
    body.insert_pdf(anatomy)
    retention = check_units(body, reading["source_units"], route+"/reading-body")
    records, record_proof = records_document(route, model, profile)
    wallet_file = previous/"patient"/route/"sactcard.pdf"
    wallet = fitz.open(wallet_file)
    body_toc = body.get_toc()
    starts = {}
    for level, title, page in body_toc:
        if level == 1 and title in dict(CHAPTERS).values():
            starts[title] = page+1
    for key, title in CHAPTERS[:3]:
        if title not in starts:
            raise ValueError((route, "Missing chapter bookmark", title))
    entries = [{"title": title, "page": starts[title]} for key, title in CHAPTERS[:3]]
    entries += [{"title": CHAPTERS[3][1], "page": len(body)+2}]
    source_page = len(body)+len(records)+len(wallet)+2
    entries += [{"title": CHAPTERS[4][1], "page": source_page}]
    sources_html = publication_pass(source_section_html(reading["tree"], reading["sources"], model, 5), route, "handbook-sources", profile)
    sources_pdf = fitz.open(stream=old.render(sources_html, ROOT/"patient"/route/"knowledge.html", profile="Nimbus"), filetype="pdf")
    book, cover_html = cover(route, model, entries, profile)
    book.insert_pdf(body)
    book.insert_pdf(records)
    wallet_page = len(book)+1
    book.insert_pdf(wallet)
    book.insert_pdf(sources_pdf)
    toc = [[1, entry["title"], entry["page"]] for entry in entries]
    toc += [[2, "Your anatomical side-effect map", anatomy_page], [2, "Your treatment and contact card", wallet_page]]
    toc.sort(key=lambda row: (row[2], row[0]))
    book.set_toc(toc)
    add_toc_links(book, entries)
    book.set_metadata({"title": model["title"]+" - patient handbook", "author": "SACTCheck", "subject": "One consolidated reading sequence; v"+VERSION})
    book_retention = check_units(book, reading["source_units"]+record_proof["required_units"], route+"/handbook")
    old.add_global_folios(book, "Handbook")
    # The standalone reference shares exactly the same clinical reading body.
    ref_entries = [{"title": title, "page": starts[title]} for key, title in CHAPTERS[:3]]
    ref_entries.append({"title": CHAPTERS[4][1], "page": len(body)+2})
    reference, reference_cover = cover(route, model, ref_entries, profile, reference=True)
    reference.insert_pdf(body)
    reference_sources = publication_pass(source_section_html(reading["tree"], reading["sources"], model, 4), route, "reference-sources", profile)
    reference_sources_pdf = fitz.open(stream=old.render(reference_sources, ROOT/"patient"/route/"knowledge.html", profile="Nimbus"), filetype="pdf")
    reference.insert_pdf(reference_sources_pdf)
    reference.set_toc([[1, entry["title"], entry["page"]] for entry in ref_entries])
    add_toc_links(reference, ref_entries)
    reference.set_metadata({"title": model["title"]+" - treatment reference", "author": "SACTCheck"})
    old.add_global_folios(reference, "Reference")
    companion_retention = check_companion_units(reading['companion_plan'],reference,book)
    outputs = {"guide.pdf": guide, "knowledge.pdf": reference.tobytes(garbage=4, deflate=True), "handbook.pdf": book.tobytes(garbage=4, deflate=True)}
    documents = []
    for name, data in outputs.items():
        exempt = [1]
        complete_source_section = None
        if name == "handbook.pdf":
            exempt += [anatomy_page]+list(range(wallet_page, wallet_page+len(wallet)))
            if len(sources_pdf) == 1 and reading['sources']:
                complete_source_section = source_page
        elif name == "knowledge.pdf":
            exempt += [anatomy_page]
            if len(reference_sources_pdf) == 1 and reading['sources']:
                complete_source_section = len(body)+2
        elif guide_proof["mode"].startswith("Current first"):
            exempt += [2, 3]
        if complete_source_section is not None:
            exempt.append(complete_source_section)
        info = inspect(data, route+"/"+name, exempt_pages=exempt)
        if complete_source_section is not None:
            info['complete_source_section'] = {'page':complete_source_section,'source_count':len(reading['sources']),
                'reason':'The entire labelled source list is intentionally grouped on one final page, rather than being an orphan continuation'}
        info["document"] = name
        (output/name).write_bytes(data)
        documents.append(info)
    (output/"knowledge-print.html").write_text(complete_reference_html(printed, route, profile, reference_sources))
    (output/"cover.html").write_text(cover_html)
    (output/"records.html").write_text(record_proof.pop("html"))
    previous_book_path = previous/"patient"/route/"handbook.pdf"
    previous_book = fitz.open(previous_book_path) if previous_book_path.exists() or route not in NEW_ROUTES_WITHOUT_PRIOR_BOOK else fitz.open()
    required = {row["sha256"]: row for row in reading["source_units"]+record_proof["required_units"]}
    report = {"route": route, "release": VERSION, "fingerprint": fingerprint, "inputs": input_hashes,
        "source_json": str(profile_path.relative_to(ROOT)), "documents": documents,
        "previous_handbook_pages": len(previous_book), "handbook_pages": len(book), "pages_saved": len(previous_book)-len(book),
        "contents": entries, "anatomy_page": anatomy_page, "wallet_page": wallet_page,
        "guide": guide_proof, "anatomy": anatomy_proof, "wallet": {"source": str(wallet_file), "sha256": HASH(wallet_file.read_bytes()), "pages": len(wallet)},
        "records": record_proof, "current_support_files": reading["support_files"], "sources": reading["sources"],
        "companion_content":companion_retention,
        "semantic_consolidation": {"structural": "One authored narrative; standalone guide, journey, logistics and full reference are not concatenated", "changes": reading["changes"]},
        "clinical_content": {"reading_retention": retention, "book_retention": book_retention, "unique_source_inventory": list(required.values())},
        "timelines": reading["timelines"], "mirrors": ["patient/"+route, "docs/patient/"+route]}
    report_file.write_text(json.dumps(report, indent=2)+"\n")
    return report


def job(values):
    route, stage, previous, resume = values
    try:
        return {"ok": True, "result": build_route(route, Path(stage), Path(previous), resume)}
    except Exception as error:
        import traceback
        return {"ok": False, "route": route, "error": str(error), "trace": traceback.format_exc()}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--routes", required=True, help="all or comma-separated authored routes")
    parser.add_argument("--stage", required=True, type=Path)
    parser.add_argument("--report", required=True, type=Path)
    parser.add_argument("--previous-root", type=Path, default=ROOT, help="Frozen previous package used only for anatomy, wallet and before/after comparison")
    parser.add_argument("--workers", type=int, default=3)
    parser.add_argument("--resume", action="store_true")
    parser.add_argument("--publish", action="store_true")
    args = parser.parse_args()
    discovered = json.loads(subprocess.check_output(["node", "-e", 'process.stdout.write(JSON.stringify(require("./tools/apply-patient-visual-standard-v08443.cjs").discoverRoutes(process.cwd())))'], cwd=ROOT))
    routes = discovered if args.routes == "all" else args.routes.split(",")
    if not routes or len(set(routes)) != len(routes) or set(routes)-set(discovered):
        parser.error("Select distinct authored treatment routes")
    args.stage.mkdir(parents=True, exist_ok=True)
    results, errors = [], []
    with concurrent.futures.ProcessPoolExecutor(max_workers=args.workers) as pool:
        pending = [pool.submit(job, (route, str(args.stage), str(args.previous_root), args.resume)) for route in routes]
        for future in concurrent.futures.as_completed(pending):
            value = future.result()
            if value["ok"]:
                row = value["result"]; results.append(row)
                print(row["route"], str(row["previous_handbook_pages"])+" → "+str(row["handbook_pages"])+" handbook pages", flush=True)
            else:
                errors.append(value); print("FAILED", value["route"], value["error"], flush=True)
    results.sort(key=lambda row: row["route"])
    report = {"release": VERSION, "previous_root": str(args.previous_root), "requested_routes": routes, "completed": len(results), "errors": errors, "published": False,
        "runtime": {"python": sys.version, "weasyprint": __import__("weasyprint").__version__, "pymupdf": fitz.VersionBind, "fonts": {name: HASH(Path(name).read_bytes()) for group in old.FONTS.values() for name in group}},
        "results": results}
    if not errors and args.publish:
        for row in results:
            for name in GENERATED:
                source = args.stage/row["route"]/name
                if source.exists():
                    for prefix in ["patient", "docs/patient"]:
                        target = ROOT/prefix/row["route"]/name
                        target.parent.mkdir(parents=True, exist_ok=True)
                        shutil.copyfile(source, target)
        report["published"] = True
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2)+"\n")
    print(json.dumps({"completed": len(results), "failed": len(errors), "published": report["published"], "report": str(args.report)}))
    if errors:
        sys.exit(1)


if __name__ == "__main__":
    main()
