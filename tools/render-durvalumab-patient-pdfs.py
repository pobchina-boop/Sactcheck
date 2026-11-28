"""Render the scoped patient resources from their canonical HTML, including the QR on the wallet."""
import argparse
import json
import shutil
from pathlib import Path

import fitz
import qrcode
from weasyprint import HTML

ROOT = Path(__file__).resolve().parents[1]
ROUTES = ('00897', '00926', '00953')
ROUTE_LISTS = ROOT / 'tools/lib'
CERVICAL_ROUTES = tuple(json.loads((ROUTE_LISTS / 'cervical-patient-routes-v08472.json').read_text()))
NEW_GYNAE_ROUTES = tuple(json.loads((ROUTE_LISTS / 'gynae-patient-routes-v08473.json').read_text())) + tuple(json.loads((ROUTE_LISTS / 'ovarian-patient-routes-v08474.json').read_text())) + tuple(json.loads((ROUTE_LISTS / 'gynae-patient-routes-v08475.json').read_text()))
AUTHORED_GYNAE = CERVICAL_ROUTES + NEW_GYNAE_ROUTES
ILLUSTRATED_GI = ('00344',)
GYNAE = ('00862', '00929', '00303', '00306', '00308', '00624', '00819', '00620', '00716', '00769', '00771', '00772','00817','00811','00799','00766','00499','00312','00375','00676','00300','00246','00247','00248','00249','00264','00266','00267','00301','00904')
DOCS = {
    'guide': 'guide', 'sactcard': 'sactcard', 'knowledge': 'knowledge-print',
    'handbook': 'handbook-print', 'passport': 'passport', 'consent-form': 'consent-form',
    'supportive-care': 'supportive-care-overview', 'logistics': 'logistics',
    'treatment-journey': 'treatment-journey',
}


def render_route(code, selected=None):
    folder = ROOT / 'patient' / code
    mirror = ROOT / 'docs/patient' / code
    qr_files = [('qr.png', ''), ('oncowiki-qr.png', 'knowledge.html')]
    for filename, route in qr_files:
        if selected is not None and (folder / filename).exists():
            continue
        qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=12, border=5)
        qr.add_data('https://sactcheck.com/patient/' + code + '/' + route)
        qr.make(fit=True)
        qr.make_image().save(folder / filename)
    documents = dict(DOCS)
    if (folder / "port-pump.html").exists():
        documents["port-pump"] = "port-pump"
    for source in sorted(folder.glob('consent-*.html')):
        documents[source.stem] = source.stem
    for source in sorted(folder.glob('support-*.html')):
        documents[source.stem] = source.stem
    for source in sorted(folder.glob('antiemetic-*.html')):
        if source.stem != 'antiemetic-prescriptions':
            documents[source.stem] = source.stem
    if selected is not None:
        missing = selected - documents.keys()
        if missing:
            raise ValueError(f'{code}: unknown documents {sorted(missing)}')
    for name, html in documents.items():
        if selected is not None and name not in selected:
            continue
        source = folder / (html + '.html')
        pdf = folder / (name + '.pdf')
        data = HTML(filename=str(source)).write_pdf()
        if (code in (*GYNAE, *ILLUSTRATED_GI, *AUTHORED_GYNAE) and name in {'handbook', 'knowledge'}) or (code == '00953' and name == 'handbook'):
            # Both references retain the full-size anatomy. The handbook also includes the wallet card.
            with fitz.open(stream=data, filetype='pdf') as book, fitz.open(folder / 'guide.pdf') as guide:
                book.insert_pdf(guide, from_page=1, to_page=2 if name == 'handbook' else 1)
                # The assembled references in new suites reproduce byte-for-byte.
                data = book.tobytes(garbage=3, deflate=True, no_new_id=code in NEW_GYNAE_ROUTES)
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
    parser.add_argument('--documents', help='Comma-separated PDF stems for a scoped rebuild')
    args = parser.parse_args()
    selected = set(args.documents.split(',')) if args.documents else None
    for route in args.codes or ROUTES:
        if route not in (*ROUTES, *GYNAE, *ILLUSTRATED_GI, *AUTHORED_GYNAE):
            parser.error('Unknown combination: ' + route)
        render_route(route, selected)
