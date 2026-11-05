"""Read-only, same-source PDF font/renderer diagnosis.

Render into a new directory outside the checkout. No application file or stored
PDF is replaced. Baseline typography differs by document; the legacy connector
presentation and print stylesheet are part of its rendering contract.
"""
from __future__ import annotations

import argparse
import datetime
import hashlib
import importlib.metadata
import json
import logging
from pathlib import Path
import re
import subprocess
import tempfile
import unicodedata

import pymupdf
from weasyprint import CSS, HTML
from weasyprint.text.fonts import FontConfiguration

ROOT = Path(__file__).resolve().parents[3]
PROFILES = {
    'DejaVu': [
        ('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
         '57f73e11f51999432bf7ab22ce55b6f945d5eca1bf824404cfa9ec2e3718c84e'),
        ('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
         'a4c5bc453ca281d90ea079e596da7ae0dfeb5777497c29ec254e76d97ff6f890')],
    'Liberation': [
        ('/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
         'bade59d822652f76e6941aa87b40a87c13d1cc70db98ededb5011127efafd1d3'),
        ('/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
         '1b5f2da6f4cadce4c05b9ecebe3a6fcd374eb95ae443605e799f4c3287978939')],
}
CASES = {
    'patient/00212/consent-form.html': 'DejaVu',
    'patient/00214/consent-form.html': 'Liberation',
    'patient/00212/guide.html': 'DejaVu',
    'patient/00214/guide.html': 'DejaVu',
}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def compact(text: str) -> str:
    return re.sub(r'\s+', '', unicodedata.normalize('NFKC', text))


def pin_css(profile: str) -> str:
    rules = []
    for weight, (filename, expected) in zip((400, 700), PROFILES[profile]):
        font = Path(filename)
        if not font.is_file() or sha(font.read_bytes()) != expected:
            raise ValueError('Missing or changed pinned font: ' + filename)
        rules.append('@font-face{font-family:"SACT Snapshot Sans";src:url("' +
                     font.as_uri() + '");font-style:normal;font-weight:' +
                     str(weight) + ';}')
    return ''.join(rules) + '*{font-family:"SACT Snapshot Sans"!important}'


def inspect(document) -> dict:
    words, text, fonts, bounds = [], [], set(), True
    for number, page in enumerate(document):
        text.append(page.get_text())
        fonts.update(font[3] for font in page.get_fonts())
        for word in page.get_text('words'):
            words.append([number] + list(word[:5]))
            bounds &= word[0] >= -1 and word[1] >= -1
            bounds &= word[2] <= page.rect.width + 1 and word[3] <= page.rect.height + 1
    return {'pages': len(document), 'fonts': sorted(fonts), 'words': words,
            'text': ''.join(text), 'text_within_page': bool(bounds)}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-dir', type=Path,
                        help='A new or empty directory outside the checkout.')
    args = parser.parse_args()
    output = args.output_dir or Path(tempfile.mkdtemp(prefix='sact-font-probe-'))
    output = output.resolve()
    if output == ROOT or ROOT in output.parents:
        parser.error('Write diagnostics outside the checkout.')
    output.mkdir(parents=True, exist_ok=True)
    if any(output.iterdir()):
        parser.error('Output directory must be empty; no previous evidence is overwritten.')
    logging.getLogger('weasyprint').setLevel(logging.ERROR)
    for profile in PROFILES:
        pin_css(profile)  # Validate every pinned font before rendering anything.
    report = {
        'generated_utc': datetime.datetime.now(datetime.UTC).isoformat(),
        'baseline_commit': subprocess.check_output(
            ['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
        'renderer': {name: importlib.metadata.version(name)
                     for name in ('weasyprint', 'pymupdf', 'pydyf', 'fonttools', 'pillow')},
        'raster_dpi': 108, 'font_profiles': PROFILES,
        'clinical_source_audit': False, 'stored_pdfs_replaced': False,
        'cases': [], 'expected_profile_checks': [],
    }
    for relative, expected_profile in CASES.items():
        source = ROOT / relative
        original_bytes = source.with_suffix('.pdf').read_bytes()
        markup = source.read_text()
        legacy = 'class="ps-body' not in markup
        if legacy:
            # Same transformation as build-targeted-v0849-pdfs.py: CSS outside
            # an SVG does not establish these strokes in WeasyPrint.
            markup = re.sub(
                r'<line class="(chemo|immune)"',
                lambda m: '<line stroke="' +
                ('#a94022' if m[1] == 'chemo' else '#682b9f') +
                '" stroke-width=".42"' +
                (' stroke-dasharray="1.4 .9"' if m[1] == 'chemo' else '') +
                ' class="' + m[1] + '"', markup)
        with pymupdf.open(stream=original_bytes, filetype='pdf') as original:
            old = inspect(original)
            for profile in ('ambient', 'DejaVu', 'Liberation'):
                config = FontConfiguration()
                styles = [CSS(filename=str(ROOT / 'assets/patient/pdf-layout-v0838.css'),
                              font_config=config)] if legacy else []
                if profile != 'ambient':
                    styles.append(CSS(string=pin_css(profile), font_config=config))
                rendered = HTML(string=markup, base_url=str(source)).write_pdf(
                    stylesheets=styles, font_config=config)
                name = source.parent.name + '-' + source.stem + '-' + profile
                (output / (name + '.pdf')).write_bytes(rendered)
                with pymupdf.open(stream=rendered, filetype='pdf') as current:
                    new = inspect(current)
                    tokens_equal = ([w[0:1] + w[5:] for w in old['words']] ==
                                    [w[0:1] + w[5:] for w in new['words']])
                    deltas = [abs(a[i] - b[i])
                              for a, b in zip(old['words'], new['words'])
                              for i in range(1, 5)] if tokens_equal else []
                    rasters = []
                    if len(original) == len(current):
                        for number in range(len(original)):
                            before = original[number].get_pixmap(
                                matrix=pymupdf.Matrix(1.5, 1.5), alpha=False)
                            after = current[number].get_pixmap(
                                matrix=pymupdf.Matrix(1.5, 1.5), alpha=False)
                            rasters.append({
                                'page': number + 1, 'identical': before.samples == after.samples,
                                'before_samples_sha256': sha(before.samples),
                                'after_samples_sha256': sha(after.samples)})
                            if profile == expected_profile:
                                before.save(output / (name + '-stored-p' + str(number + 1) + '.png'))
                                after.save(output / (name + '-pinned-p' + str(number + 1) + '.png'))
                    row = {
                        'source': relative, 'profile': profile, 'expected_profile': expected_profile,
                        'source_sha256': sha(source.read_bytes()), 'stored_sha256': sha(original_bytes),
                        'rendered_sha256': sha(rendered), 'legacy_print_contract': legacy,
                        'old_pages': old['pages'], 'new_pages': new['pages'],
                        'old_fonts': old['fonts'], 'new_fonts': new['fonts'],
                        'old_word_count': len(old['words']), 'new_word_count': len(new['words']),
                        'text_preserved': compact(old['text']) == compact(new['text']),
                        'exact_page_and_word_sequence': tokens_equal,
                        'max_word_box_delta_pt': max(deltas) if deltas else None,
                        'text_within_page': new['text_within_page'], 'rasters': rasters,
                        'output': name + '.pdf'}
                    report['cases'].append(row)
                    if profile == expected_profile:
                        passed = (row['text_preserved'] and tokens_equal and
                                  row['max_word_box_delta_pt'] == 0 and new['text_within_page'] and
                                  bool(rasters) and all(r['identical'] for r in rasters))
                        report['expected_profile_checks'].append(
                            {'source': relative, 'profile': profile, 'passed': passed})
    report['different_font_controls'] = []
    for relative, expected in CASES.items():
        other = 'Liberation' if expected == 'DejaVu' else 'DejaVu'
        row = next(item for item in report['cases']
                   if item['source'] == relative and item['profile'] == other)
        detected = (not row['exact_page_and_word_sequence'] or
                    row['max_word_box_delta_pt'] != 0 or
                    any(not page['identical'] for page in row['rasters']))
        report['different_font_controls'].append(
            {'source': relative, 'different_profile': other, 'difference_detected': detected})
    report['passed'] = (all(row['passed'] for row in report['expected_profile_checks']) and
                        all(row['difference_detected'] for row in report['different_font_controls']))
    (output / 'results.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'output': str(output), 'passed': report['passed'],
                      'checks': report['expected_profile_checks']}, indent=2))
    return 0 if report['passed'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
