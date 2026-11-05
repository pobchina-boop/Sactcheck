"""Read existing target PDFs/QRs; never generate or replace a clinical document."""
from __future__ import annotations

import datetime
import hashlib
import json
from pathlib import Path
import re
import subprocess
from urllib.parse import unquote, urlparse

from lxml import html
from PIL import Image
import pymupdf
import zxingcpp

ROOT = Path(__file__).resolve().parents[3]
BASELINE = '2e5de4a6dd9e2fcbefa18623ff21db7b9eaec40b'
CODES = ['00212', '00214', '00215', '00244', '00382',
         '00207', '00225', '00328', '00330', '00331']
OUTPUT = Path(__file__).resolve().parent / 'existing-documents.json'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def git_hashes(files):
    """Stream Git's immutable baseline bytes, without changing index/worktree."""
    process = subprocess.Popen(['git', 'cat-file', '--batch'], cwd=ROOT,
                               stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                               stderr=subprocess.PIPE)
    result = {}
    for name in files:
        process.stdin.write((BASELINE + ':' + name + '\n').encode())
        process.stdin.flush()
        header = process.stdout.readline().decode().strip().split()
        if len(header) != 3 or header[1] != 'blob':
            raise ValueError('Missing baseline blob: ' + name)
        remaining = int(header[2])
        digest = hashlib.sha256()
        while remaining:
            chunk = process.stdout.read(min(1024 * 1024, remaining))
            if not chunk:
                raise ValueError('Incomplete baseline blob: ' + name)
            digest.update(chunk)
            remaining -= len(chunk)
        if process.stdout.read(1) != b'\n':
            raise ValueError('Invalid Git blob delimiter')
        result[name] = digest.hexdigest()
    process.stdin.close()
    if process.wait() != 0:
        raise ValueError(process.stderr.read().decode())
    return result


def route_check(text, code):
    url = urlparse(text)
    path = unquote(url.path)
    local = ROOT / path.lstrip('/')
    if path.endswith('/'):
        local /= 'index.html'
    return {'destination': text, 'https': url.scheme == 'https',
            'canonical_host': url.netloc == 'sactcheck.com',
            'same_regimen_path': path.startswith('/patient/' + code + '/'),
            'local_target_exists': local.is_file(),
            'live_response_verified': False,
            'live_blocker': 'Canonical host inaccessible: HTTPS proxy tunnel 403 Forbidden.'}


def decode(image):
    return sorted({item.text for item in zxingcpp.read_barcodes(
        image, formats=zxingcpp.BarcodeFormat.QRCode) if item.valid})


def inspect_pdf(file):
    rows, violations, nonempty = [], [], True
    with pymupdf.open(file) as document:
        for number, page in enumerate(document):
            words = page.get_text('words')
            nonempty &= bool(words)
            bounds = [page.rect.width, page.rect.height]
            portrait = abs(bounds[0] - 595.276) < 1 and abs(bounds[1] - 841.89) < 1
            landscape = abs(bounds[1] - 595.276) < 1 and abs(bounds[0] - 841.89) < 1
            rows.append({'page': number + 1, 'size_pt': bounds,
                         'a4': portrait or landscape,
                         'orientation': 'portrait' if portrait else 'landscape' if landscape else 'other',
                         'words': len(words)})
            for word in words:
                if word[0] < -1 or word[1] < -1 or word[2] > bounds[0] + 1 or word[3] > bounds[1] + 1:
                    violations.append({'page': number + 1, 'word': word[4],
                                       'bbox': list(word[:4])})
        return {'pages': len(document), 'page_details': rows,
                'every_page_has_text': bool(nonempty), 'text_bounds_violations': violations,
                'text_within_page': not violations}


def qr_pdf(file, code, png_values):
    found, attempts = [], []
    with pymupdf.open(file) as document:
        for dpi in (144, 216, 288):
            attempts.append(dpi)
            for number, page in enumerate(document):
                pixmap = page.get_pixmap(matrix=pymupdf.Matrix(dpi / 72, dpi / 72), alpha=False)
                image = Image.frombytes('RGB', (pixmap.width, pixmap.height), pixmap.samples)
                for value in decode(image):
                    found.append({'page': number + 1, 'dpi': dpi,
                                  **route_check(value, code),
                                  'matches_same_code_png': value in png_values})
            if found:
                break
    return {'file': file.relative_to(ROOT).as_posix(),
            'attempted_dpi': attempts, 'decoded': found,
            'qr_found': bool(found),
            'all_match_known_same_code_png': bool(found) and all(
                row['matches_same_code_png'] for row in found)}


def card_measurements(code):
    folder = ROOT / 'patient' / code
    source = folder / 'sactcard.html'
    if not source.is_file():
        return {'available': False}
    tree = html.fromstring(source.read_bytes())
    approved = bool(tree.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," pt-wallet ")]'))
    compact_legacy = 'targeted-suite-v08424' in tree.xpath('string(//body/@class)').split()
    expected = [85.6, 54.0] if approved else [110.0, 55.0 if compact_legacy else 65.0]
    css = 'assets/patient/patient-pack-v08431.css' if approved else 'assets/patient/complete-pathways-v0830.css'
    selector = '.pt-wallet section' if approved else '.suite-pocket'
    candidates = []
    with pymupdf.open(folder / 'sactcard.pdf') as document:
        for number, page in enumerate(document):
            for drawing in page.get_drawings():
                rect = drawing['rect']
                width, height = rect.width * 25.4 / 72, rect.height * 25.4 / 72
                if abs(width - expected[0]) < .1 and abs(height - expected[1]) < .1:
                    candidates.append({'page': number + 1,
                                       'width_mm': width, 'height_mm': height})
    text = ' '.join(tree.text_content().split())
    return {'available': True, 'source_html': source.relative_to(ROOT).as_posix(),
            'layout': 'approved front/back wallet pair' if approved else 'existing legacy folded card',
            'css': css, 'selector': selector, 'expected_panel_mm': expected,
            'legacy_min_height_mm': None if approved else expected[1],
            'compact_legacy_override': 'assets/patient/targeted-lung-v08424.css: .targeted-suite-v08424.suite-card .suite-pocket' if compact_legacy else None,
            'pdf_vector_measurements': candidates,
            'expected_panel_geometry_found_in_pdf': bool(candidates),
            'source_mentions_cutting': bool(re.search(r'\bcut', text, re.I)),
            'source_mentions_folding': bool(re.search(r'\bfold', text, re.I)),
            'source_marks_placeholder_contacts': bool(re.search(r'EXAMPLE|Insert numbers|insert.*number', text, re.I)),
            'physical_print_verified': False}


def main():
    files = subprocess.check_output(['git', 'ls-tree', '-r', '--name-only', BASELINE],
                                    cwd=ROOT, text=True).splitlines()
    images = [name for name in files if Path(name).suffix.lower()
              in {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'}]
    pdfs = sorted(path.relative_to(ROOT).as_posix()
                  for code in CODES for path in (ROOT / 'patient' / code).rglob('*.pdf'))
    baseline = git_hashes(images + pdfs)
    image_checks = [{'file': name, 'sha256': sha((ROOT / name).read_bytes()),
                     'baseline_sha256': baseline[name],
                     'unchanged': sha((ROOT / name).read_bytes()) == baseline[name]}
                    for name in images]
    report = {'generated_utc': datetime.datetime.now(datetime.UTC).isoformat(),
              'baseline_commit': BASELINE, 'clinical_batch_validated': False,
              'current_source_audit': False, 'pdfs_regenerated': False,
              'pdf_scope': 'All existing PDFs recursively under the ten requested regimen-code directories, including other-indication nested routes.',
              'qr_and_wallet_scope': 'Existing root-route QR PNGs and guide/card PDFs only; nested images retain baseline byte-identity checks.',
              'image_checks': image_checks, 'contexts': []}
    for code in CODES:
        folder = ROOT / 'patient' / code
        guide = folder / 'guide.html'
        title = html.fromstring(guide.read_bytes()).xpath('string(//title)') if guide.exists() else ''
        context = {'code': code, 'root_route_exists': folder.is_dir(),
                   'existing_guide_title': title,
                   'context_warning': 'Existing root route does not establish a completed colorectal context or a new clinical audit.',
                   'pdfs': [], 'qr_pngs': [], 'pdf_qrs': []}
        for name in [name for name in pdfs if name.startswith('patient/' + code + '/')]:
            file = ROOT / name
            digest = sha(file.read_bytes())
            mirror = ROOT / 'docs' / name
            context['pdfs'].append({
                'file': name, 'sha256': digest, 'baseline_sha256': baseline[name],
                'patient_route': file.parent.relative_to(ROOT / 'patient').as_posix(),
                'unchanged_from_baseline': digest == baseline[name],
                'mirror_exists': mirror.is_file(),
                'mirror_identical': mirror.is_file() and file.read_bytes() == mirror.read_bytes(),
                **inspect_pdf(file)})
        png_values = set()
        for png in sorted(folder.glob('*qr*.png')):
            values = decode(Image.open(png))
            rows = [route_check(value, code) for value in values]
            for value in values:
                png_values.add(value)
            context['qr_pngs'].append({
                'file': png.relative_to(ROOT).as_posix(), 'decoded': rows,
                'qr_found': bool(values),
                'oncowiki_destination_exact': None if png.name != 'oncowiki-qr.png' else
                values == ['https://sactcheck.com/patient/' + code + '/knowledge.html']})
        for name in ('guide.pdf', 'sactcard.pdf'):
            file = folder / name
            if file.is_file():
                context['pdf_qrs'].append(qr_pdf(file, code, png_values))
        context['wallet'] = card_measurements(code)
        context['missing_required_surfaces'] = [
            name for name in ('guide.pdf', 'sactcard.pdf', 'passport.pdf',
                              'consent-form.pdf', 'knowledge.pdf', 'handbook.pdf')
            if not (folder / name).is_file()]
        report['contexts'].append(context)
    checked_pdfs = [row for context in report['contexts'] for row in context['pdfs']]
    pngs = [row for context in report['contexts'] for row in context['qr_pngs']]
    qr_pdfs = [row for context in report['contexts'] for row in context['pdf_qrs']]
    destinations = [value for context in report['contexts']
                    for container in context['qr_pngs'] + context['pdf_qrs']
                    for value in container['decoded']]
    valid_destinations = all(row['https'] and row['canonical_host'] and
                             row['same_regimen_path'] and row['local_target_exists']
                             for row in destinations)
    report['summary'] = {
        'existing_pdfs': len(checked_pdfs),
        'root_route_pdfs': sum(len(Path(row['file']).parts) == 3 for row in checked_pdfs),
        'nested_route_pdfs': sum(len(Path(row['file']).parts) > 3 for row in checked_pdfs),
        'existing_pdf_pages': sum(row['pages'] for row in checked_pdfs),
        'pdfs_unchanged': sum(row['unchanged_from_baseline'] for row in checked_pdfs),
        'identical_pdf_mirrors': sum(row['mirror_identical'] for row in checked_pdfs),
        'pdfs_with_in_bounds_text': sum(row['text_within_page'] for row in checked_pdfs),
        'a4_pages': sum(page['a4'] for row in checked_pdfs for page in row['page_details']),
        'portrait_pages': sum(page['orientation'] == 'portrait' for row in checked_pdfs for page in row['page_details']),
        'landscape_pages': sum(page['orientation'] == 'landscape' for row in checked_pdfs for page in row['page_details']),
        'tracked_images': len(image_checks),
        'images_unchanged': sum(row['unchanged'] for row in image_checks),
        'qr_pngs': len(pngs), 'qr_pngs_decoded': sum(row['qr_found'] for row in pngs),
        'guide_card_pdfs_checked': len(qr_pdfs),
        'guide_card_pdfs_with_decoded_qr': sum(row['qr_found'] for row in qr_pdfs),
        'pdf_qrs_match_same_code_png': sum(row['all_match_known_same_code_png'] for row in qr_pdfs),
        'all_decoded_destinations_local_and_canonical_for_same_code': valid_destinations,
        'wallet_geometries_measured': sum(context['wallet'].get('expected_panel_geometry_found_in_pdf', False)
                                           for context in report['contexts']),
        'missing_contexts_are_not_counted_complete': True}
    passed = (all(row['unchanged'] for row in image_checks) and
              all(row['unchanged_from_baseline'] and row['mirror_identical'] and
                  row['text_within_page'] and row['every_page_has_text'] and
                  all(page['a4'] for page in row['page_details']) for row in checked_pdfs) and
              all(row['qr_found'] and row['oncowiki_destination_exact'] is not False for row in pngs) and
              all(row['all_match_known_same_code_png'] for row in qr_pdfs) and valid_destinations and
              all(context['wallet'].get('expected_panel_geometry_found_in_pdf', False)
                  for context in report['contexts'] if context['wallet']['available']))
    report['existing_preservation_checks_passed'] = passed
    OUTPUT.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report['summary'], indent=2))
    return 0 if passed else 1


if __name__ == '__main__':
    raise SystemExit(main())
