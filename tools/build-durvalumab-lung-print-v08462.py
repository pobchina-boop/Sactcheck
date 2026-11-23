"""Build print documents for the two lung consolidation schedules from edited source.

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

ROOT = Path(__file__).resolve().parents[1]
ROUTES = ('00576', '00655')
INVENTORY = ROOT / 'validation/durvalumab-v08462/lung-companion-inventory.json.gz'


def module(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'tools' / filename)
    result = importlib.util.module_from_spec(spec)
    sys.modules[name] = result
    spec.loader.exec_module(result)
    return result


def review_inventory(stage):
    """Recompute exact source matches and retain every unmatched clinical clause."""
    audit = module('lung62_inventory', 'audit-patient-companions-ribociclib-v08461.py')
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


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--stage', required=True, type=Path)
    parser.add_argument('--publish', action='store_true', help='Copy the verified documents into the two repository mirrors')
    args = parser.parse_args()
    stage = args.stage.resolve()
    stage.mkdir(parents=True, exist_ok=True)
    os.chdir(ROOT)
    logging.getLogger('weasyprint').setLevel(logging.ERROR)
    review_inventory(stage)
    os.environ['SACTCHECK_COMPANION_AUDIT'] = str(INVENTORY)
    book = module('lung62_book', 'build-patient-documents-v08461.py').b44
    ancillary = module('lung62_ancillary', 'build-sarcoma-v08461-pdfs.py')
    previous = stage / 'current-source'
    products = stage / 'products'
    products.mkdir(exist_ok=True)
    reports = []
    for route in ROUTES:
        seed_current_pack(route, previous)
        reports.append(book.build_route(route, products, previous))
        shutil.copy2(previous / 'patient' / route / 'sactcard.pdf', products / route / 'sactcard.pdf')
        ancillary.render(route, 'treatment-journey', 'treatment-journey', products)
    if args.publish:
        for route in ROUTES:
            for name in [*book.GENERATED, 'sactcard.pdf', 'treatment-journey.pdf']:
                for tree in ('patient', 'docs/patient'):
                    shutil.copy2(products / route / name, ROOT / tree / route / name)
            shutil.copy2(ROOT / 'patient' / route / 'oncowiki-qr.png', ROOT / 'docs/patient' / route / 'oncowiki-qr.png')
    (stage / 'document-review.json').write_text(json.dumps(reports, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    main()
