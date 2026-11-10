#!/usr/bin/env python3
"""v46 layout extension of the independently guarded v44 publication pipeline.

Install next to the v44 tool. May also run from the proposal folder. Every v44
clinical-retention, companion-audit, original anatomy, wallet and QR contract
remains active. Outputs remain staged unless the inherited --publish is used.
An optional --companion-audit PATH selects a separately reviewed inventory;
it does not waive its source hashes, exact clauses or review requirements.
"""
from pathlib import Path
import gzip
import hashlib
import html
import importlib.util
import json
import os
import re
import sys

HERE = Path(__file__).resolve()
ROOT = next(p for p in HERE.parents if (p/'package.json').is_file() and (p/'tools/build-patient-documents-v08444.py').is_file())
SPEC = importlib.util.spec_from_file_location('patient44', ROOT/'tools/build-patient-documents-v08444.py')
b44 = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = b44
SPEC.loader.exec_module(b44)
b44.VERSION = "0.84.46"
b44.NEW_ROUTES_WITHOUT_PRIOR_BOOK = frozenset(["00261/head_neck","00483/head_neck","00484/head_neck","00455/head_neck","00558/head_neck"])
CSS_FILE = ROOT/'assets/patient/patient-handbook-v08445.css'
if not CSS_FILE.exists():
    CSS_FILE = HERE.with_name('patient-handbook-v08445.css')
b44.CSS_FILE = CSS_FILE
PURPOSES = {
    'Understanding your treatment': 'Why this treatment is offered, what its medicines do, and how the agreed plan fits your care.',
    'Your schedule, tests and appointments': 'Your treatment stages, checks and practical preparations, from before treatment through follow-up.',
    'Symptoms and supportive care': 'Recognising changes, knowing when to call, and using your prescribed supportive-care plan.',
    'Your record and contact card': 'Space for your own cycle or review record, questions and notes, followed by your treatment card.',
    'Sources and further information': 'The references behind this information and addresses you can use to find further help.',
}


def heading(number, title, model):
    """One deliberate full-page opener per chapter; no clinical content deleted."""
    return ('<header class="book44-chapter-head book45-chapter-opener" data-book45-chapter="'+str(number)+'">'
        '<p class="book45-brand">SACTCheck</p><div class="book45-opener-body">'
        '<p class="book44-chapter-kicker">CHAPTER '+str(number).zfill(2)+'</p>'
        '<h1 class="book44-chapter-title">'+html.escape(title)+'</h1>'
        '<p class="book45-purpose-label">In this chapter</p><p class="book45-purpose">'+html.escape(PURPOSES[title])+'</p></div>'
        '<p class="book45-regimen">'+html.escape(model['title'])+'<br>NCCP '+html.escape(model['code'])+'</p></header>')


b44.heading = heading
_original_document = b44.document

def document(tree, body, body_class="book44"):
    result = _original_document(tree, body, body_class)
    # The original builder embeds CSS into patient-route HTML. Resolve the
    # inherited sheet here, so a relative @import cannot load a wrong path.
    result = result.replace("@import url('patient-handbook-v08444.css');", (ROOT/'assets/patient/patient-handbook-v08444.css').read_text())
    return result.replace('</head>', '<style data-v46-caption-keep>.book44 .journey-table caption{break-after:avoid!important;page-break-after:avoid!important}.book44 .journey-table thead{break-before:avoid!important;page-break-before:avoid!important}</style></head>')

b44.document = document
_original_clean = b44.clean_browser_markup

def clean_browser_markup(tree, changes):
    _original_clean(tree, changes)
    # Preserve the words and qualifications of every anchor. An internal HTML
    # target has no paper action; sources retain their printed full addresses.
    for anchor in tree.xpath('//a[@href]'):
        href = anchor.get('href', '')
        if href.startswith('#') or (not re.match(r'^[a-z][a-z0-9+.-]*:', href, re.I) and not href.startswith('//')):
            before = b44.visible_text(anchor)
            anchor.tag = 'span'
            anchor.attrib.pop('href', None)
            anchor.attrib.pop('download', None)
            changes.append({'operation':'paper_internal_anchor','text':before,'target':href,
                'reason':'Printed text is retained; an internal browser action is not required to read the book'})

b44.clean_browser_markup = clean_browser_markup
_original_deduplicate = b44.deduplicate_explanations

def deduplicate_explanations(tree, changes):
    # Capture complete original instructions before the unchanged exact-clause deduplicator.
    candidates = [(element, [b44.visible_text(unit) for unit in element.xpath('.//p|.//li|.//td|.//th')])
        for element in tree.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," access-step ")]')]
    _original_deduplicate(tree, changes)
    retained = b44.norm(b44.visible_text(tree))
    for element, clauses in candidates:
        if element.getparent() is None or not clauses or element.xpath('.//p|.//li|.//td|.//th'):
            continue
        if not all(b44.norm(clause) in retained for clause in clauses):
            raise ValueError(('Empty access card lost an original instruction', clauses))
        changes.append({'operation':'remove_empty_access_step_after_exact_deduplication',
            'heading':b44.visible_text(element), 'retained_original_clauses':clauses,
            'reason':'All original instructions remain verbatim elsewhere; remove only the now-empty title and decorative icon'})
        element.drop_tree()

b44.deduplicate_explanations = deduplicate_explanations
_current_sources = []
_original_source_section = b44.source_section_html

def source_section_html(tree, sources, model, number):
    global _current_sources
    _current_sources = sources
    return _original_source_section(tree, sources, model, number)

b44.source_section_html = source_section_html
_original_inspect = b44.inspect

def opener_pages(doc):
    """Recognise intentional separators using their exact unique purpose text."""
    pages = []
    for number, page in enumerate(doc, 1):
        value = b44.norm(page.get_text())
        matches = [title for title, purpose in PURPOSES.items() if b44.norm(title) in value and b44.norm(purpose) in value]
        if len(matches) == 1 and 'inthischapter' in value and re.search(r'CHAPTER\s+0[1-5]\b', page.get_text()):
            # A populated content page cannot be silently exempted as an opener.
            if len(page.get_text('words')) > 150:
                raise ValueError(('Chapter opener shares a page with substantial content', number, matches[0]))
            pages.append(number)
    return pages


def inspect(data, label, exempt_pages=()):
    doc = b44.fitz.open(stream=data, filetype='pdf')
    openers = opener_pages(doc)
    complete_sources = []
    if _current_sources and len(doc) > 1 and len(doc)-1 in openers:
        penultimate = b44.norm(doc[-2].get_text())
        last = b44.norm(doc[-1].get_text())
        if b44.norm(PURPOSES['Sources and further information']) in penultimate and all(b44.norm(item['url']) in last for item in _current_sources):
            complete_sources = [len(doc)]
    result = _original_inspect(data, label, sorted(set(exempt_pages)|set(openers)|set(complete_sources)))
    result['complete_source_pages'] = complete_sources
    result['chapter_opener_pages'] = openers
    return result

b44.inspect = inspect
_original_fingerprint = b44.fingerprint_inputs

def fingerprint_inputs(route, profile_path, previous, companion_fingerprint):
    _, records = _original_fingerprint(route, profile_path, previous, companion_fingerprint)
    # This file is an output of complete_reference_html, never a source input.
    # Exclude only that generated output so publishing it cannot invalidate its own build.
    records.pop('patient/' + route + '/knowledge-print.html', None)
    records[str(HERE.relative_to(ROOT))] = b44.HASH(HERE.read_bytes())
    return b44.HASH(json.dumps({'files':records,'companion_decisions':companion_fingerprint},sort_keys=True).encode()), records

b44.fingerprint_inputs = fingerprint_inputs
_original_build = b44.build_route

def build_route(route, stage, previous, resume=False):
    row = _original_build(route, stage, previous, resume)
    book = b44.fitz.open(stage/route/'handbook.pdf')
    pages = opener_pages(book)
    if len(pages) != 5 or pages != [item['page'] for item in row['contents']]:
        raise ValueError((route,'Five full-page chapter openers must match the opening contents',pages,row['contents']))
    row['layout_contract'] = {'version':'0.84.46','chapter_openers':pages,'five_distinct_purposes':PURPOSES,
        'clinical_retention_pipeline':'Unchanged v0.84.44 checks; explicit source inventory required',
        'guide_contract':'All 14 selected v46 routes have a verified three-page guide plus a standalone wallet-card sheet',
        'source_files':{str(HERE.relative_to(ROOT)):b44.HASH(HERE.read_bytes()),str(CSS_FILE.relative_to(ROOT)):b44.HASH(CSS_FILE.read_bytes())}}
    (stage/route/'build.json').write_text(json.dumps(row,indent=2)+'\n')
    return row

b44.build_route = build_route

def select_audit():
    if '--companion-audit' in sys.argv:
        index = sys.argv.index('--companion-audit')
        os.environ['SACTCHECK_COMPANION_AUDIT'] = str(Path(sys.argv[index+1]).resolve())
        del sys.argv[index:index+2]
    target = os.environ.get('SACTCHECK_COMPANION_AUDIT')
    if target:
        b44.COMPANION_AUDIT = Path(target)
    elif not b44.COMPANION_AUDIT.exists() and b44.COMPANION_AUDIT.with_suffix('.json.gz').exists():
        b44.COMPANION_AUDIT = b44.COMPANION_AUDIT.with_suffix('.json.gz')
    if b44.COMPANION_AUDIT.suffix == '.gz':
        # Same uncompressed decision bytes and review checks, not a new audit.
        def audit():
            data = gzip.decompress(b44.COMPANION_AUDIT.read_bytes())
            inventory = json.loads(data)
            if inventory.get('schema_version') != 1 or inventory.get('status') != 'reviewed' or inventory.get('errors'):
                raise ValueError('The complete companion-content audit must be reviewed before rendering')
            expected = b44.HASH(json.dumps(b44.ACRONYM_TERMS,ensure_ascii=False,separators=(',',':')).encode())
            if inventory['normalization']['terms_sha256'] != expected:
                raise ValueError('Approved acronym terms changed after companion review')
            return inventory, b44.HASH(data)
        b44.companion_audit = b44.functools.lru_cache(maxsize=1)(audit)

select_audit()
if __name__ == '__main__':
    scope = json.loads((ROOT/'validation/head-neck-v08446/scope.json').read_text())
    if '--routes' not in sys.argv:
        raise SystemExit('Explicit affected routes are required')
    selected = sys.argv[sys.argv.index('--routes')+1].split(',')
    if len(set(selected)) != len(selected) or not set(selected) <= set(scope['clinical_routes']):
        raise SystemExit('Routes must be a distinct subset of the approved v46 clinical scope; all is not permitted')
    b44.main()
