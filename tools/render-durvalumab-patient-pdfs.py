"""Render the scoped patient resources from their canonical HTML, including the QR on the wallet."""
import argparse
import shutil
from pathlib import Path

import fitz
import qrcode
from weasyprint import HTML

ROOT = Path(__file__).resolve().parents[1]
ROUTES = ('00897', '00926', '00953')
DOCS = {
    'guide': 'guide', 'sactcard': 'sactcard', 'knowledge': 'knowledge-print',
    'handbook': 'handbook-print', 'passport': 'passport', 'consent-form': 'consent-form',
    'supportive-care': 'supportive-care-overview', 'logistics': 'logistics',
    'treatment-journey': 'treatment-journey',
}


def render_route(code):
    folder = ROOT / 'patient' / code
    mirror = ROOT / 'docs/patient' / code
    for filename, route in [('qr.png', ''), ('oncowiki-qr.png', 'knowledge.html')]:
        qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=12, border=5)
        qr.add_data('https://sactcheck.com/patient/' + code + '/' + route)
        qr.make(fit=True)
        qr.make_image().save(folder / filename)
    documents = dict(DOCS)
    for source in sorted(folder.glob('support-*.html')):
        documents[source.stem] = source.stem
    for name, html in documents.items():
        source = folder / (html + '.html')
        pdf = folder / (name + '.pdf')
        data = HTML(filename=str(source)).write_pdf()
        with fitz.open(stream=data, filetype='pdf') as doc:
            if any(not page.get_text().strip() for page in doc):
                raise ValueError(f'{code} {name} contains a blank page')
            if name in {'guide', 'sactcard'} and len(doc) != (3 if name == 'guide' else 1):
                raise ValueError(f'{code} {name} unexpected pagination: {len(doc)}')
            print(code, name, len(doc), flush=True)
        pdf.write_bytes(data)
        shutil.copyfile(pdf, mirror / pdf.name)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('codes', nargs='*')
    args = parser.parse_args()
    for route in args.codes or ROUTES:
        if route not in ROUTES:
            parser.error('Unknown combination: ' + route)
        render_route(route)
