"""Refresh only existing one-page consent aids, validating before publication.

Use the same WeasyPrint HTML/relative assets and print stylesheet as the release
PDF builders. Rendering is staged: any validation failure prevents every output
PDF from being replaced. --output-root supports a review-only export elsewhere.
"""
from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import importlib.metadata
import json
import logging
from pathlib import Path
import re
import tempfile
import unicodedata

from lxml import html as LH
import pymupdf
from weasyprint import CSS, HTML

ROOT = Path(__file__).resolve().parents[1]
SHEET = '//*[contains(concat(" ",normalize-space(@class)," ")," consent-sheet ")]'
CAPTION_COLOR = int('526975', 16)


def compact(text: str, *, display_case: bool = False) -> str:
    """Ignore line wrapping, soft hyphens and standard Unicode ligatures.

    CSS text-transform uppercases source headings/type labels on paper, so only
    the source-versus-PDF comparison ignores case. Old/new PDF comparison does
    not ignore case, words, punctuation, numbers or their order.
    """
    result = re.sub(r'\s+', '', unicodedata.normalize('NFKC', text).replace('\u00ad', ''))
    return result.casefold() if display_case else result


def discover() -> tuple[dict[str, Path], list[str]]:
    eligible, redirects = {}, []
    for file in sorted((ROOT / 'patient').glob('**/consent-form.html')):
        route = file.parent.relative_to(ROOT / 'patient').as_posix()
        sheets = LH.fromstring(file.read_bytes()).xpath(SHEET)
        if not sheets:
            redirects.append(route)
            continue
        if len(sheets) != 1:
            raise ValueError(f'{route}: expected exactly one consent-sheet')
        eligible[route] = file
    if not eligible:
        raise ValueError('No consent-sheet sources found; an empty run is not validation')
    return eligible, redirects


def inspect_pdf(data: bytes, label: str) -> dict:
    with pymupdf.open(stream=data, filetype='pdf') as document:
        if len(document) != 1:
            raise ValueError(f'{label}: expected one page, got {len(document)}')
        page = document[0]
        if abs(page.rect.width - 595.276) > 1 or abs(page.rect.height - 841.89) > 1:
            raise ValueError(f'{label}: expected A4 portrait, got {tuple(page.rect)}')
        text = page.get_text()
        if not text.strip():
            raise ValueError(f'{label}: empty consent PDF')
        for word in page.get_text('words'):
            if word[0] < -1 or word[1] < -1 or word[2] > page.rect.width + 1 or word[3] > page.rect.height + 1:
                raise ValueError(f'{label}: text outside page: {word[:5]}')
        colors = [span['color'] for block in page.get_text('dict')['blocks']
                  for line in block.get('lines', []) for span in line['spans'] if span['text'].strip()]
        return {'pages': len(document), 'dimensions_pt': [page.rect.width, page.rect.height],
                'text': text, 'colors': colors,
                'fonts': sorted({font[3] for font in page.get_fonts()})}


class RenderErrors(logging.Handler):
    def __init__(self):
        super().__init__(logging.ERROR)
        self.errors = []

    def emit(self, record):
        self.errors.append(record.getMessage())


def render(route: str, stage: str) -> dict:
    source = ROOT / 'patient' / route / 'consent-form.html'
    published = source.with_suffix('.pdf')
    mirror = ROOT / 'docs' / 'patient' / route / 'consent-form.pdf'
    if not published.is_file() or not mirror.is_file():
        raise ValueError(f'{route}: both existing PDF copies are required for comparison')
    old_bytes = published.read_bytes()
    if old_bytes != mirror.read_bytes():
        raise ValueError(f'{route}: existing published and compatibility PDFs differ')
    old = inspect_pdf(old_bytes, f'{route}: existing')
    source_sheet = LH.fromstring(source.read_bytes()).xpath(SHEET)
    if len(source_sheet) != 1:
        raise ValueError(f'{route}: expected one consent-sheet')

    logger = logging.getLogger('weasyprint')
    errors = RenderErrors()
    logger.addHandler(errors)
    try:
        rendered = HTML(filename=str(source)).write_pdf(
            stylesheets=[CSS(filename=str(ROOT / 'assets/patient/pdf-layout-v0838.css'))])
    finally:
        logger.removeHandler(errors)
    if errors.errors:
        raise ValueError(f'{route}: renderer errors: {errors.errors}')
    new = inspect_pdf(rendered, f'{route}: rendered')
    if compact(old['text']) != compact(new['text']):
        raise ValueError(f'{route}: rendered text differs from existing PDF; no output replaced')
    if compact(source_sheet[0].text_content(), display_case=True) != compact(new['text'], display_case=True):
        raise ValueError(f'{route}: rendered PDF does not retain the complete source consent text')
    if CAPTION_COLOR not in new['colors'] or any(color in new['colors'] for color in [0x687B84, 0x667B85]):
        raise ValueError(f'{route}: corrected footer/signature text colors are not present')

    staged = Path(stage) / route / 'consent-form.pdf'
    staged.parent.mkdir(parents=True, exist_ok=True)
    staged.write_bytes(rendered)
    return {'route': route, 'pages': new['pages'], 'dimensions_pt': new['dimensions_pt'],
            'existing_compatibility_identical': True,
            'all_existing_pdf_text_preserved': True, 'all_source_text_preserved': True,
            'source_case_normalized_for_css_text_transform': True,
            'text_within_page': True, 'caption_color': '#526975',
            'before_fonts': old['fonts'], 'after_fonts': new['fonts'],
            'before_sha256': hashlib.sha256(old_bytes).hexdigest(),
            'after_sha256': hashlib.sha256(rendered).hexdigest(),
            'source_sha256': hashlib.sha256(source.read_bytes()).hexdigest()}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--routes', help='Comma-separated consent routes; defaults to all eligible sources. Redirects are excluded.')
    parser.add_argument('--report', required=True, type=Path, help='Write a fresh validation report; historical reports are not changed.')
    parser.add_argument('--workers', type=int, default=3, help='Parallel renderer processes (default: 3).')
    parser.add_argument('--output-root', type=Path, default=ROOT, help='Destination containing patient/ and docs/patient/; defaults to the checkout. Use a temporary directory for review.')
    args = parser.parse_args()
    if args.workers < 1:
        parser.error('--workers must be at least 1')
    eligible, redirects = discover()
    routes = list(eligible) if not args.routes or args.routes == 'all' else args.routes.split(',')
    if not routes or len(set(routes)) != len(routes) or any(route not in eligible for route in routes):
        parser.error('Choose distinct routes containing an actual consent-sheet: ' + ', '.join(routes))
    report = {'version': json.loads((ROOT / 'package.json').read_text())['version'],
              'renderer': {'weasyprint': importlib.metadata.version('weasyprint'),
                           'pymupdf': importlib.metadata.version('pymupdf')},
              'eligible_source_count': len(eligible), 'excluded_redirect_routes': redirects,
              'selected_routes': routes, 'output_root': str(args.output_root.resolve()),
              'checks': [], 'failures': [], 'outputs_written': False}
    logging.getLogger('weasyprint').setLevel(logging.ERROR)
    with tempfile.TemporaryDirectory(prefix='sact-consent-pdfs-') as stage:
        with concurrent.futures.ProcessPoolExecutor(max_workers=args.workers) as pool:
            jobs = {pool.submit(render, route, stage): route for route in routes}
            for future in concurrent.futures.as_completed(jobs):
                route = jobs[future]
                try:
                    report['checks'].append(future.result())
                    print(f'{route}: A4, one page, complete source/existing text retained', flush=True)
                except Exception as error:
                    report['failures'].append({'route': route, 'error': str(error)})
                    print(f'{route}: FAILED: {error}', flush=True)
        report['checks'].sort(key=lambda row: row['route'])
        if not report['failures']:
            for route in routes:
                data = (Path(stage) / route / 'consent-form.pdf').read_bytes()
                targets = [args.output_root / base / route / 'consent-form.pdf' for base in ['patient', 'docs/patient']]
                for target in targets:
                    target.parent.mkdir(parents=True, exist_ok=True)
                    temporary = target.with_suffix('.pdf.tmp')
                    temporary.write_bytes(data)
                    temporary.replace(target)
                if targets[0].read_bytes() != targets[1].read_bytes():
                    raise ValueError(f'{route}: written PDF copies differ')
                next(row for row in report['checks'] if row['route'] == route)['compatibility_identical'] = True
            report['outputs_written'] = True
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2) + '\n')
    print(f'{len(report["checks"])} validated; {len(report["failures"])} failed; outputs written: {report["outputs_written"]}')
    return 1 if report['failures'] else 0


if __name__ == '__main__':
    raise SystemExit(main())
