"""Build source-reviewed Olaparib print documents with the existing retention, QR and layout checks.

Run after the targeted patient-knowledge and complete-pathways generators.
The full handbook and reference use the ordinary audited publication pipeline.
"""
from pathlib import Path
import argparse
import gzip
import importlib.util
import json
import logging
import os
import shutil
import subprocess
import sys

import fitz
import qrcode
from weasyprint import HTML
from lxml import html as LH

ROOT = Path(__file__).resolve().parents[1]
ROUTES = ('00588', '00588/prostate', '00588/ovarian_first_line', '00588/ovarian_relapsed', '00588/pancreatic', '00746')
INVENTORY = ROOT / 'validation/olaparib-v08463/companion-inventory.json.gz'


def module(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'tools' / filename)
    result = importlib.util.module_from_spec(spec)
    sys.modules[name] = result
    spec.loader.exec_module(result)
    return result


def review_inventory(stage):
    """Recompute exact source matches and retain every unmatched clinical clause."""
    audit = module('olaparib63_inventory', 'audit-patient-companions-ribociclib-v08461.py')
    dst = stage / 'companion-inventory.json'
    old = sys.argv
    try:
        sys.argv = ['inventory', '--routes', ','.join(ROUTES), '--output', str(dst), '--reviewed']
        audit.main(ROUTES, '0.84.63')
    finally:
        sys.argv = old
    data = json.loads(dst.read_bytes())
    if data['errors'] or data['status'] != 'reviewed':
        raise ValueError('Companion audit needs review')
    INVENTORY.parent.mkdir(exist_ok=True, parents=True)
    INVENTORY.write_bytes(gzip.compress(dst.read_bytes(), mtime=0))


def seed_current_pack(route, temp):
    src = ROOT / 'patient' / route
    seed = temp / 'patient' / route
    seed.mkdir(parents=True, exist_ok=True)
    qrcode.make(f'https://sactcheck.com/patient/{route}/knowledge.html').save(src / 'oncowiki-qr.png')
    qrcode.make(f'https://sactcheck.com/patient/{route}/').save(src / 'qr.png')
    for name, count in [('guide', 3), ('sactcard', 1)]:
        output = seed / (name + '.pdf')
        HTML(filename=str(src / (name + '.html'))).write_pdf(output)
        with fitz.open(output) as doc:
            if len(doc) != count:
                raise ValueError(f'{route}/{name}: expected {count} pages, got {len(doc)}')
            wallet = doc[-1].get_text().lower().replace('\n', ' ')
            if 'breathlessness' not in wallet or 'call oncology now' not in wallet or '087 12345678' in wallet:
                raise ValueError(f'{route}/{name}: drug-specific wallet action missing or example numbers retained')
    if (src / 'handbook.pdf').exists():
        shutil.copy2(src / 'handbook.pdf', seed / 'handbook.pdf')


def install_scoped_layout(book):
    """Keep the Olaparib reusable form together without changing shared styles/fonts."""
    original_document = book.document

    def document(tree, body, body_class="book44"):
        result = original_document(tree, body, body_class)
        css = ('<style data-olaparib-print-keep="0.84.63">'
               '.book44.book44-records .ribo-cycle,'
               '.book44.book44-records .ribo-cycle.book44-first-cycle{'
               'break-before:page!important;page-break-before:always!important;'
               'break-inside:avoid!important;page-break-inside:avoid!important}'
               '.book44 .journey-table th,.book44 .journey-table td{'
               'hyphens:auto!important;hyphenate-limit-chars:6 3 3;'
               'overflow-wrap:normal!important;word-break:normal!important}'
               '.book44 .monitoring-schedule .journey-table th,'
               '.book44 .monitoring-schedule .journey-table td{padding:2mm 1.4mm!important}'
               '.book44 .monitoring-schedule .journey-table td>span{padding:.6mm!important}'
               '</style>')
        return result.replace('</head>', css + '</head>')

    book.document = document
    original_publication = book.publication_pass

    def publication_pass(source, route, kind, profile):
        result = original_publication(source, route, kind, profile)
        if route in ROUTES and kind in ('handbook-cover', 'reference-cover'):
            result = result.replace('Your team must replace example numbers before patient use.',
                                    'Your team must complete and check both contact numbers before patient use.')
        if route in ROUTES and kind == 'complete-print-reference':
            # This generated HTML has a real published route of its own.
            # Apply the ordinary authoring pass before saving it, so a later
            # patient:ui run neither moves styles nor corrects its canonical URL.
            script = """
const fs=require('fs'), p=require('./tools/patient-publication-v08444.cjs');
const x=JSON.parse(fs.readFileSync(0,'utf8')), file='patient/'+x.route+'/knowledge-print.html';
const html=p.decorateGenerated(file,x.html);
if(p.decorateGenerated(file,html)!==html)throw Error('Olaparib print reference is not idempotent: '+file);
process.stdout.write(html);
"""
            result = subprocess.check_output(['node', '-e', script], cwd=ROOT,
                input=json.dumps({'route': route, 'html': result}).encode()).decode()
        return result

    book.publication_pass = publication_pass
    original_fingerprint = book.fingerprint_inputs

    def fingerprint_inputs(route, profile_path, previous, companion_fingerprint):
        _, records = original_fingerprint(route, profile_path, previous, companion_fingerprint)
        for name in ('tools/build-olaparib-review-pdfs-v08463.py', 'tools/olaparib-patient-review-v08463.cjs'):
            records[name] = book.HASH((ROOT / name).read_bytes())
        return book.HASH(json.dumps({'files': records, 'companion_decisions': companion_fingerprint}, sort_keys=True).encode()), records

    book.fingerprint_inputs = fingerprint_inputs


def install_ancillary_layout(ancillary):
    """Start the two-column check cards with their spanning heading."""
    original_html = ancillary.HTML
    css = ('@media print{.journey-print.journey-compact .journey-checks{'
           'break-before:page!important;page-break-before:always!important;'
           'break-inside:avoid!important;page-break-inside:avoid!important}}')

    class OlaparibHTML(original_html):
        def write_pdf(self, *args, **kwargs):
            source = Path(self.source_name)
            if any(source.parent == ROOT / 'patient' / route for route in ROUTES) and source.stem == 'treatment-journey':
                kwargs['stylesheets'] = list(kwargs.get('stylesheets') or []) + [ancillary.CSS(string=css)]
            return super().write_pdf(*args, **kwargs)

    ancillary.HTML = OlaparibHTML
    original_render = ancillary.render

    def render(route, name, source, stage):
        result = original_render(route, name, source, stage)
        if route in ROUTES and name == 'treatment-journey':
            result['renderer_layout_overrides'] += css
            result['source_hashes']['tools/build-olaparib-review-pdfs-v08463.py'] = ancillary.hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
        return result

    ancillary.render = render


def main():
    global ROUTES
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--stage', required=True, type=Path)
    parser.add_argument('--routes', help='Explicit subset of the six olaparib routes for bounded layout review')
    parser.add_argument('--publish', action='store_true', help='Copy the verified documents into the canonical and compatibility repository mirrors')
    args = parser.parse_args()
    if args.routes:
        selected = tuple(args.routes.split(','))
        if len(set(selected)) != len(selected) or not set(selected) <= set(ROUTES):
            raise ValueError('Unapproved olaparib document route')
        ROUTES = selected
    stage = args.stage.resolve()
    stage.mkdir(parents=True, exist_ok=True)
    os.chdir(ROOT)
    logging.getLogger('weasyprint').setLevel(logging.ERROR)
    review_inventory(stage)
    os.environ['SACTCHECK_COMPANION_AUDIT'] = str(INVENTORY)
    book = module('olaparib63_book', 'build-patient-documents-v08461.py').b44
    book.VERSION = '0.84.63'
    book.NEW_ROUTES_WITHOUT_PRIOR_BOOK = frozenset(['00588/ovarian_first_line','00588/ovarian_relapsed','00588/pancreatic','00746'])
    install_scoped_layout(book)
    ancillary = module('olaparib63_ancillary', 'build-sarcoma-v08461-pdfs.py')
    install_ancillary_layout(ancillary)
    previous = stage / 'current-source'
    products = stage / 'products'
    products.mkdir(exist_ok=True)
    reports = []
    # A new route has no earlier support PDF. Render and verify that actual
    # companion first, then let the unchanged handbook inventory read it.
    for route in ROUTES:
        reports.append(ancillary.render(route, 'support-treatment', 'support-treatment', products))
        if args.publish:
            for tree in ('patient', 'docs/patient'):
                destination = ROOT / tree / route / 'support-treatment.pdf'
                destination.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(products / route / 'support-treatment.pdf', destination)
        elif not (ROOT / 'patient' / route / 'support-treatment.pdf').is_file():
            raise ValueError((route, 'New-route support PDF has been staged; use --publish to seed its verified local companion before building the handbook'))
    for route in ROUTES:
        print('Building olaparib documents:', route, flush=True)
        seed_current_pack(route, previous)
        reports.append(book.build_route(route, products, previous))
        shutil.copy2(previous / 'patient' / route / 'sactcard.pdf', products / route / 'sactcard.pdf')
        
        for name in ['passport','consent-form','logistics','treatment-journey','supportive-care']:
            if name in ['passport', 'consent-form']:
                # One reusable record per authored medicine group plus its cover.
                # Page count follows content; blank sheets never define a course.
                source = ROOT / 'patient' / route / (name + '.html')
                source_html = source.read_text()
                data = HTML(string=source_html, base_url=str(source)).write_pdf()
                info = ancillary.inspect(data, route + '/' + name)
                profile_path = ROOT / ('data/patient-knowledge-contexts' if '/' in route else 'data/patient-knowledge') / (route + '.json')
                profile = json.loads(profile_path.read_text())
                expected = 1 + len(profile.get('passport_groups') or [1,2,3,4]) if name == 'passport' else 2
                if info['pages'] != expected:
                    raise ValueError((route, name, 'Unexpected pagination', info['pages']))
                tree = LH.fromstring(source_html)
                core = tree.xpath('//main')[0]
                text = ancillary.norm(info['text'])
                missing = [ancillary.norm(e.text_content()) for e in core.xpath('.//p|.//li|.//td|.//th|.//h1|.//h2|.//h3') if ancillary.norm(e.text_content()) not in text]
                if missing:
                    raise ValueError((route, name, 'Missing source clauses', missing))
                (products / route / (name + '.pdf')).write_bytes(data)
                reports.append({'route': route, 'document': name, 'pages': expected,
                    'bounds_pass': True, 'all_source_clauses_retained': True,
                    'source_sha256': ancillary.hashlib.sha256(source.read_bytes()).hexdigest(),
                    'sha256': ancillary.hashlib.sha256(data).hexdigest()})
            else:
                reports.append(ancillary.render(route, name, 'supportive-care-overview' if name=='supportive-care' else name, products))
    if args.publish:
        for route in ROUTES:
            for name in [*book.GENERATED, 'sactcard.pdf', 'treatment-journey.pdf', 'passport.pdf', 'consent-form.pdf', 'logistics.pdf', 'support-treatment.pdf', 'supportive-care.pdf']:
                for tree in ('patient', 'docs/patient'):
                    shutil.copy2(products / route / name, ROOT / tree / route / name)
            shutil.copy2(ROOT / 'patient' / route / 'oncowiki-qr.png', ROOT / 'docs/patient' / route / 'oncowiki-qr.png')
    (stage / 'document-review.json').write_text(json.dumps(reports, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    main()
