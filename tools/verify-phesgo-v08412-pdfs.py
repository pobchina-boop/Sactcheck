"""Verify delivered PDFs and actual printed QR destinations (PyMuPDF, Pillow, zxing-cpp)."""
from pathlib import Path
import hashlib
import json
import fitz
from PIL import Image
import zxingcpp

root = Path(__file__).resolve().parents[1]
import runpy
jobs = runpy.run_path(str(root / 'tools/build-phesgo-v08412-pdfs.py'))['jobs']
codes = list(dict.fromkeys(c for c, _, _ in jobs))
expected_pages = {'guide': 2, 'consent-form': 1, 'passport': 5, 'sactcard': 1, 'supportive-care': 1, 'logistics': 1, 'treatment-journey': 3}
rows, qr = [], []
for code in codes:
    expected_url = f'https://sactcheck.com/patient/{code}/' + ('scope.html' if code == '00588' else '')
    decoded = [x.text for x in zxingcpp.read_barcodes(Image.open(root / 'patient' / code / 'qr.png'))]
    assert expected_url in decoded, (code, decoded)
    qr.append({'code': code, 'asset': 'qr.png', 'decoded': expected_url, 'pass': True})
    for name in [n for c, n, _ in jobs if c == code]:
        file = root / 'patient' / code / f'{name}.pdf'
        doc = fitz.open(file)
        pages = expected_pages.get(name, 1 if name.startswith('support-') else None)
        if pages is not None: assert len(doc) == pages, (code, name, len(doc), pages)
        else: assert 1 <= len(doc) <= 7, (code, name, len(doc))
        assert file.read_bytes() == (root / 'docs/patient' / code / f'{name}.pdf').read_bytes()
        for i, page in enumerate(doc):
            assert page.get_text().strip(), (code, name, i, 'empty page')
            for block in page.get_text('blocks'):
                assert block[0] >= -1 and block[1] >= -1 and block[2] <= page.rect.width + 1 and block[3] <= page.rect.height + 1, (code, name, i, 'text outside page')
        if name in ['guide', 'passport', 'sactcard']:
            page = doc[1 if name == 'guide' else 0]
            pix = page.get_pixmap(matrix=fitz.Matrix(3, 3))
            decoded = [x.text for x in zxingcpp.read_barcodes(Image.frombytes('RGB', [pix.width, pix.height], pix.samples))]
            assert expected_url in decoded, (code, name, decoded)
            qr.append({'code': code, 'asset': name + '.pdf', 'decoded': expected_url, 'pass': True})
        rows.append({'code': code, 'document': name, 'pages': len(doc), 'bounds_pass': True,
                     'compatibility_identical': True, 'sha256': hashlib.sha256(file.read_bytes()).hexdigest()})
out = root / 'validation/phesgo-v08412'
(out / 'pdf-validation.json').write_text(json.dumps({'documents': len(rows), 'pages': sum(r['pages'] for r in rows), 'checks': rows}, indent=2) + '\n')
(out / 'qr-validation.json').write_text(json.dumps(qr, indent=2) + '\n')
print(f'{len(rows)} patient PDFs / {sum(r["pages"] for r in rows)} pages; identical compatibility copies; {len(qr)} QR decodes passed.')
