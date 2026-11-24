"""Build source-reviewed Enhertu print documents with the existing retention, QR and layout checks.

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
import sys

import fitz
import qrcode
from weasyprint import HTML
from lxml import html as LH

ROOT = Path(__file__).resolve().parents[1]
ROUTES = ('00776',)
INVENTORY = ROOT / 'validation/enhertu-review-v08462/companion-inventory.json.gz'


def module(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'tools' / filename)
    result = importlib.util.module_from_spec(spec)
    sys.modules[name] = result
    spec.loader.exec_module(result)
    return result


def review_inventory(stage):
    """Recompute exact source matches and retain every unmatched clinical clause."""
    audit = module('enhertu62_inventory', 'audit-patient-companions-ribociclib-v08461.py')
    dst = stage / 'companion-inventory.json'
    old = sys.argv
    try:
        sys.argv = ['inventory', '--routes', ','.join(ROUTES), '--output', str(dst), '--reviewed']
        audit.main(ROUTES, '0.84.62')
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
    if not (src / 'oncowiki-qr.png').exists():
        qrcode.make(f'https://sactcheck.com/patient/{route}/knowledge.html').save(src / 'oncowiki-qr.png')
    for name, count in [('guide', 3), ('sactcard', 1)]:
        output = seed / (name + '.pdf')
        HTML(filename=str(src / (name + '.html'))).write_pdf(output)
        with fitz.open(output) as doc:
            if len(doc) != count:
                raise ValueError(f'{route}/{name}: expected {count} pages, got {len(doc)}')
            wallet = doc[-1].get_text().lower().replace('\n', ' ')
            if 'new cough' not in wallet or 'call oncology now' not in wallet or '087 12345678' in wallet:
                raise ValueError(f'{route}/{name}: drug-specific wallet action missing or example numbers retained')
    shutil.copy2(src / 'handbook.pdf', seed / 'handbook.pdf')


def install_scoped_layout(book):
    """Keep the Enhertu reusable form together without changing shared styles/fonts."""
    original_document = book.document

    def document(tree, body, body_class="book44"):
        result = original_document(tree, body, body_class)
        css = ('<style data-enhertu-print-keep="0.84.62">'
               '.book44.book44-records .ribo-cycle,'
               '.book44.book44-records .ribo-cycle.book44-first-cycle{'
               'break-before:page!important;page-break-before:always!important;'
               'break-inside:avoid!important;page-break-inside:avoid!important}'
               '</style>')
        return result.replace('</head>', css + '</head>')

    book.document = document
    original_fingerprint = book.fingerprint_inputs

    def fingerprint_inputs(route, profile_path, previous, companion_fingerprint):
        _, records = original_fingerprint(route, profile_path, previous, companion_fingerprint)
        for name in ('tools/build-enhertu-review-pdfs-v08462.py', 'tools/enhertu-patient-review-v08462.cjs'):
            records[name] = book.HASH((ROOT / name).read_bytes())
        return book.HASH(json.dumps({'files': records, 'companion_decisions': companion_fingerprint}, sort_keys=True).encode()), records

    book.fingerprint_inputs = fingerprint_inputs


def install_ancillary_layout(ancillary):
    """Start the two-column check cards with their spanning heading."""
    original_html = ancillary.HTML
    css = ('@media print{.journey-print.journey-compact .journey-checks{'
           'break-before:page!important;page-break-before:always!important;'
           'break-inside:avoid!important;page-break-inside:avoid!important}}')

    class EnhertuHTML(original_html):
        def write_pdf(self, *args, **kwargs):
            source = Path(self.source_name)
            if source.parent.name == '00776' and source.stem == 'treatment-journey':
                kwargs['stylesheets'] = list(kwargs.get('stylesheets') or []) + [ancillary.CSS(string=css)]
            return super().write_pdf(*args, **kwargs)

    ancillary.HTML = EnhertuHTML
    original_render = ancillary.render

    def render(route, name, source, stage):
        result = original_render(route, name, source, stage)
        if route == '00776' and name == 'treatment-journey':
            result['renderer_layout_overrides'] += css
            result['source_hashes']['tools/build-enhertu-review-pdfs-v08462.py'] = ancillary.hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
        return result

    ancillary.render = render


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--stage', required=True, type=Path)
    parser.add_argument('--publish', action='store_true', help='Copy the verified documents into the canonical and compatibility repository mirrors')
    args = parser.parse_args()
    stage = args.stage.resolve()
    stage.mkdir(parents=True, exist_ok=True)
    os.chdir(ROOT)
    logging.getLogger('weasyprint').setLevel(logging.ERROR)
    review_inventory(stage)
    os.environ['SACTCHECK_COMPANION_AUDIT'] = str(INVENTORY)
    book = module('enhertu62_book', 'build-patient-documents-v08461.py').b44
    install_scoped_layout(book)
    ancillary = module('enhertu62_ancillary', 'build-sarcoma-v08461-pdfs.py')
    install_ancillary_layout(ancillary)
    previous = stage / 'current-source'
    products = stage / 'products'
    products.mkdir(exist_ok=True)
    reports = []
    for route in ROUTES:
        seed_current_pack(route, previous)
        reports.append(book.build_route(route, products, previous))
        shutil.copy2(previous / 'patient' / route / 'sactcard.pdf', products / route / 'sactcard.pdf')
        
        for name in ['passport','consent-form','logistics','treatment-journey','support-treatment','supportive-care']:
            if name in ['passport', 'consent-form']:
                # Enhertu uses the existing five-page passport and two-page
                # consent-aid contracts, as do the ribociclib/osi benchmarks.
                source = ROOT / 'patient' / route / (name + '.html')
                source_html = source.read_text()
                data = HTML(string=source_html, base_url=str(source)).write_pdf()
                info = ancillary.inspect(data, route + '/' + name)
                expected = 5 if name == 'passport' else 2
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
