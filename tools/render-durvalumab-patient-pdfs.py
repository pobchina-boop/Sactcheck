"""Render the scoped patient resources from their canonical HTML, including the QR on the wallet."""
import argparse
import shutil
from pathlib import Path

import fitz
import qrcode
from weasyprint import HTML

ROOT = Path(__file__).resolve().parents[1]
ROUTES = ('00897', '00926', '00953')
ILLUSTRATED_GI = ('00344',)
GYNAE = ('00862', '00929', '00303', '00306', '00308', '00624', '00819', '00620', '00716', '00769', '00771', '00772','00817','00811','00799','00766','00499')
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
    if (folder / "port-pump.html").exists():
        documents["port-pump"] = "port-pump"
    for source in sorted(folder.glob('support-*.html')):
        documents[source.stem] = source.stem
    for source in sorted(folder.glob('antiemetic-*.html')):
        if source.stem != 'antiemetic-prescriptions':
            documents[source.stem] = source.stem
    for name, html in documents.items():
        source = folder / (html + '.html')
        pdf = folder / (name + '.pdf')
        data = HTML(filename=str(source)).write_pdf()
        if (code in (*GYNAE, *ILLUSTRATED_GI) and name in {'handbook', 'knowledge'}) or (code == '00953' and name == 'handbook'):
            # Both references retain the full-size anatomy. The handbook also includes the wallet card.
            with fitz.open(stream=data, filetype='pdf') as book, fitz.open(folder / 'guide.pdf') as guide:
                book.insert_pdf(guide, from_page=1, to_page=2 if name == 'handbook' else 1)
                data = book.tobytes(garbage=3, deflate=True)
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
        if route not in (*ROUTES, *GYNAE, *ILLUSTRATED_GI):
            parser.error('Unknown combination: ' + route)
        render_route(route)
