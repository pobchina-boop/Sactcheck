"""Build the shared full handbook and the separate distilled patient guide.

The optional, explicit --baseline mode is a presentation migration: it proves
the authored clinical JSON is unchanged and preserves existing PDF body streams.
Without it, references are rendered from current authored HTML. No clinical
schedule, dose, course duration, or symptom timing is invented by this builder.
All files are staged and validated before --publish updates either public copy.
"""
from pathlib import Path
import argparse, collections, concurrent.futures, copy, hashlib, html, importlib.util
import json, logging, os, re, shutil, subprocess, sys, unicodedata
import fitz
from lxml import html as LH
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration

ROOT = Path(__file__).resolve().parents[1]
VISUAL = ROOT / 'tools/patient-visual-standard-v08443.cjs'
SCOPE = ROOT / 'validation/patient-design-v08443/scope.json'
VERSION = json.loads((ROOT / 'package.json').read_text())['version']
FONT_CONFIG = FontConfiguration()
FONTS = {
    'DejaVu': ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'],
    'Liberation': ['/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'],
    'Nimbus': ['/usr/share/fonts/opentype/urw-base35/NimbusSans-Regular.otf', '/usr/share/fonts/opentype/urw-base35/NimbusSans-Bold.otf'],
}
SHA = lambda value: hashlib.sha256(value).hexdigest()

def norm(value):
    return re.sub(r'[^\w]', '', unicodedata.normalize('NFKC', value).replace('\u00ad', '')).casefold()

def font_css(profile=None):
    rules = []
    for family, paths in FONTS.items():
        for weight, filename in zip([400, 700], paths):
            file = Path(filename)
            if not file.exists():
                raise FileNotFoundError(file)
            for alias in [family + ' Sans'] + (['Arial', 'Helvetica'] if family == 'Nimbus' else []):
                rules.append('@font-face{font-family:"' + alias + '";src:url("' + file.as_uri() + '");font-weight:' + str(weight) + ';font-style:normal}')
    if profile:
        rules.append('*{font-family:"' + profile + ' Sans"!important}')
    return ''.join(rules)

def render(source, base, styles='', profile=None):
    return HTML(string=source, base_url=str(base)).write_pdf(
        stylesheets=[CSS(string=styles + '\n' + font_css(profile), font_config=FONT_CONFIG)],
        font_config=FONT_CONFIG)

def node(action, route, data=None):
    value = subprocess.check_output(['node', str(VISUAL), action, route],
        input=json.dumps(data or {}).encode(), cwd=ROOT)
    return json.loads(value) if action == 'model' else value.decode()

def baseline_file(baseline, filename):
    if not baseline:
        return None
    result = subprocess.run(['git', 'show', baseline + ':' + filename], cwd=ROOT, capture_output=True)
    return result.stdout if result.returncode == 0 else None

def inspect_pdf(data, label, allow_existing_bounds=False):
    with fitz.open(stream=data, filetype='pdf') as document:
        bounds = []
        for i, page in enumerate(document):
            if not page.get_text().strip():
                raise ValueError((label, i + 1, 'empty page'))
            for word in page.get_text('words'):
                if word[0] < -1 or word[1] < -1 or word[2] > page.rect.width + 1 or word[3] > page.rect.height + 1:
                    bounds.append({'page': i + 1, 'word': word[:5]})
        if bounds and not allow_existing_bounds:
            raise ValueError((label, 'out-of-page text', bounds[:8]))
        return {'pages': len(document), 'bounds': bounds,
                'fonts': sorted({font[3] for page in document for font in page.get_fonts()}),
                'sha256': SHA(data)}

def body_signature(document):
    return [dict(text_sha256=SHA(page.get_text().encode()),
        content_stream_sha256=[SHA(document.xref_stream(x)) for x in page.get_contents()],
        size=[round(page.rect.width, 4), round(page.rect.height, 4)]) for page in document]

def font_profile(document):
    fonts = {font[3] for page in document for font in page.get_fonts()}
    if any('LiberationSans' in f for f in fonts):
        return 'Liberation'
    if any('DejaVuSans' in f for f in fonts):
        return 'DejaVu'
    return 'Nimbus'

def old_sections(data, sections):
    """Retain the entire existing book body, including phase/pump appendices."""
    if not data:
        return {}, []
    old = fitz.open(stream=data, filetype='pdf')
    toc = old.get_toc()
    if len(toc) != 7 or any(row[0] != 1 for row in toc):
        raise ValueError('Existing handbook must have seven explicit section bookmarks')
    out, proof = {}, []
    for i, section in enumerate(sections):
        start = toc[i][2] - 1
        end = toc[i + 1][2] - 2 if i + 1 < len(toc) else len(old) - 1
        doc = fitz.open()
        doc.insert_pdf(old, from_page=start, to_page=end)
        for offset, page in enumerate(doc):
            expected = f'Handbook {start + offset + 1} / {len(old)}'
            before, contents, retained = page.get_text(), page.get_contents(), []
            found = 0
            for xref in contents:
                stream = doc.xref_stream(xref)
                match = re.fullmatch(rb'\s*q\s+BT\s+1 0 0 1 ([\d.]+) 10 Tm\s+/helv 7 Tf \.2 \.3 \.3 RG \.2 \.3 \.3 rg \[<([\da-fA-F]+)>\]TJ\s+ET\s+Q\s*', stream)
                if match and bytes.fromhex(match[2].decode()).decode('ascii') == expected:
                    found += 1
                else:
                    retained.append(xref)
            if found != 1:
                raise ValueError(('Cannot isolate the old global folio', section['id'], offset, found))
            doc.xref_set_key(page.xref, 'Contents', '[' + ' '.join(f'{x} 0 R' for x in retained) + ']')
            if norm(before.replace(expected, '', 1)) != norm(page.get_text()):
                raise ValueError('Removing an old folio changed clinical body text')
        out[section['document']] = doc
        proof.append({'section': section['document'], 'pages': len(doc), 'original_body_streams_retained': True, 'body': body_signature(doc)})
    return out, proof

def standalone_legacy_brand(data, model):
    """Add only margin decoration; do not rescale or reflow legacy anatomy."""
    doc = fitz.open(stream=data, filetype='pdf')
    before = body_signature(doc)
    for page in doc:
        commands = f'q .07 .25 .38 rg 0 {page.rect.height - 3} {page.rect.width} 3 re f .13 .72 .70 rg 0 0 3 {page.rect.height - 3} re f Q\n'
        words = page.get_text('words')
        if words and min(w[1] for w in words) >= 25:
            page.insert_font(fontname='helv')
            commands += f'q .07 .25 .38 rg BT /helv 7 Tf 1 0 0 1 18 {page.rect.height - 14} Tm (SACTCheck  |  YOUR TREATMENT GUIDE) Tj ET Q\n'
        append_overlay(page, commands)
    for page, record in zip(doc, before):
        streams = page.get_contents()
        if [SHA(doc.xref_stream(x)) for x in streams[1:1 + len(record['content_stream_sha256'])]] != record['content_stream_sha256']:
            raise ValueError('Legacy guide body streams changed')
    return doc.tobytes(garbage=4, deflate=True), {'mode': 'preserved legacy pages with margin branding', 'preserved_pages': len(doc), 'before': before}

def build_guide(route, model, baseline):
    source = ROOT / 'patient' / route / 'guide.html'
    old_data = baseline_file(baseline, 'patient/' + route + '/guide.pdf')
    if not old_data:
        data = render(source.read_text(), source)
        return data, {'mode': 'current authored source render'}
    old = fitz.open(stream=old_data, filetype='pdf')
    if not model['modernGuide']:
        return standalone_legacy_brand(old_data, model)
    if len(old) != 3:
        raise ValueError((route, 'modern guide baseline must contain three pages'))
    tree = LH.fromstring(source.read_text())
    first = tree.xpath('//*[contains(concat(" ", normalize-space(@class), " "), " pt-first ")]')
    if len(first) != 1:
        raise ValueError((route, 'one modern first page required'))
    body = tree.find('body')
    for child in list(body):
        body.remove(child)
    main = LH.Element('main', {'class': 'pt-sheet'})
    main.append(copy.deepcopy(first[0]))
    body.append(main)
    page_data = render(LH.tostring(tree, encoding='unicode', method='html'), source, profile=font_profile(old))
    page = fitz.open(stream=page_data, filetype='pdf')
    if len(page) != 1:
        raise ValueError((route, 'first-page infographic exceeds one page', len(page)))
    inspect_pdf(page_data, route + '/guide-first')
    old_words = collections.Counter(re.findall(r'\w+', unicodedata.normalize('NFKC', old[0].get_text()).replace('\u00ad', '').casefold()))
    new_words = collections.Counter(re.findall(r'\w+', unicodedata.normalize('NFKC', page[0].get_text()).replace('\u00ad', '').casefold()))
    missing = old_words - new_words
    if missing:
        raise ValueError((route, 'original first-page words missing', dict(missing)))
    final = fitz.open()
    final.insert_pdf(page)
    final.insert_pdf(old, from_page=1, to_page=2)
    retained = body_signature(old)[1:]
    if body_signature(final)[1:] != retained:
        raise ValueError((route, 'anatomy/wallet body stream mismatch'))
    return final.tobytes(garbage=4, deflate=True), {'mode': 'new visual first page; original anatomy and wallet pages', 'pages': 3, 'original_first_page_words_retained': True, 'retained_pages': retained, 'font_profile': font_profile(old)}

def reference_body(route, baseline, sections):
    old_data = baseline_file(baseline, 'patient/' + route + '/knowledge.pdf')
    if old_data:
        return fitz.open(stream=old_data, filetype='pdf'), None, {'mode': 'all original reference pages retained', 'sha256': SHA(old_data)}
    source = ROOT / 'patient' / route / 'knowledge.html'
    tree = LH.fromstring(source.read_text())
    for el in list(tree.xpath('//script')):
        el.getparent().remove(el)
    for el in tree.xpath('//details'):
        el.set('open', 'open')
    for el in tree.xpath('//*[@hidden]'):
        el.attrib.pop('hidden')
    spec = importlib.util.spec_from_file_location('book42', ROOT / 'tools/build-patient-handbooks-v08442.py')
    helper = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(helper)
    printable_milestones(tree)
    helper.printable_legacy_chronology(tree)
    # Every authored paragraph/list/table remains present in the offline reference.
    addresses = []
    for anchor in tree.xpath('//a[@href]'):
        url = anchor.get('href')
        if url.startswith('https://') and url not in addresses:
            addresses.append(url)
    written = LH.Element('section', {'class': 'print-sources'})
    title = LH.Element('h2'); title.text = 'Written source addresses'; written.append(title)
    for url in addresses:
        line = LH.Element('p'); line.text = url; written.append(line)
    tree.find('body').append(written)
    styles = helper.PRINT + '\n@page{@bottom-center{content:none!important}}.scv-portal-visual{break-inside:avoid}.scv-phase-path{break-inside:avoid}'
    print_style = LH.Element('style', {'data-sactcheck-print': '0.84.43'}); print_style.text = styles
    tree.find('head').append(print_style)
    printed = LH.tostring(tree, encoding='unicode', method='html')
    data = render(printed, source, styles=styles)
    inspection = inspect_pdf(data, route + '/knowledge-body')
    doc = fitz.open(stream=data, filetype='pdf')
    full_text = norm(''.join(page.get_text() for page in doc))
    missing = []
    for el in tree.xpath('//main//p | //main//td | //main//th | //main//li | //main//h2 | //main//h3'):
        if any(set(ancestor.get('class', '').split()) & {'journey-scroll-hint', 'access-links', 'pk-controls', 'pt-toolbar', 'suite-toolbar', 'pk-top', 'pk-help-link', 'no-print'} for ancestor in [el] + list(el.iterancestors())):
            continue  # Browser scrolling/download controls have no paper action.
        value = norm(el.text_content())
        if len(value) >= 30 and value not in full_text:
            missing.append(el.text_content()[:180])
    if missing:
        raise ValueError((route, 'reference text missing', missing[:12]))
    return doc, printed, {'mode': 'complete authored HTML rendered offline', 'pages': len(doc), 'authored_text_retained': True, 'inspection': inspection}

def printable_milestones(tree):
    """Retain named milestone axes without falsely converting them into days."""
    for chart in tree.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," wiki-cycle-chart ")]'):
        axes = chart.xpath('./*[contains(concat(" ",normalize-space(@class)," ")," wiki-cycle-axis ")]')
        if len(axes) != 1:
            raise ValueError('One authored chronology axis required')
        values = [el.text_content() for el in axes[0]][1:]
        if values == [str(i) for i in range(1, len(values) + 1)]:
            continue
        table = LH.Element('table', {'class': 'v36-cycle-print-table'})
        caption = LH.Element('caption'); caption.text = 'Treatment milestones: ' + ' · '.join(values); table.append(caption)
        head = LH.Element('thead'); row = LH.Element('tr')
        for label in ['Treatment or check', 'Authored milestones', 'What happens']:
            cell = LH.Element('th'); cell.text = label; row.append(cell)
        head.append(row); table.append(head); body = LH.Element('tbody'); table.append(body)
        for track in chart.xpath('./*[contains(concat(" ",normalize-space(@class)," ")," wiki-cycle-track ")]'):
            labels = track.xpath('./*[contains(concat(" ",normalize-space(@class)," ")," wiki-cycle-label ")]')
            bands = track.xpath('./*[contains(concat(" ",normalize-space(@class)," ")," wiki-cycle-band ")]')
            if len(labels) != 1 or len(bands) != 1:
                raise ValueError('Milestone chart row needs one label and one band')
            span = re.search(r'grid-column\s*:\s*(\d+)\s*/\s*(\d+)', bands[0].get('style', ''))
            if not span:
                raise ValueError('Authored milestone positions missing')
            start, end = [int(x) - 2 for x in span.groups()]
            if not 0 <= start < end <= len(values):
                raise ValueError('Milestone range outside authored axis')
            row = LH.Element('tr')
            for i, value in enumerate([labels[0].text_content(), ' → '.join(values[start:end]), bands[0].text_content()]):
                cell = LH.Element('th' if i == 0 else 'td'); cell.text = value; row.append(cell)
            body.append(row)
        chart.getparent().replace(chart, table)

def reading_items(route, section):
    if section['document'] == 'knowledge.pdf':
        relative = 'data/patient-knowledge-contexts/' + route + '.json' if '/' in route else 'data/patient-knowledge/' + route + '.json'
        profile = json.loads((ROOT / relative).read_text())
        items = [{'title': chapter['title'], 'description': ''} for chapter in profile.get('chapters', [])[:5] if chapter.get('title')]
        if items:
            return items
    names = {'guide.pdf': 'guide.html', 'knowledge.pdf': 'knowledge.html', 'treatment-journey.pdf': 'treatment-journey.html', 'supportive-care.pdf': 'supportive-care-overview.html', 'logistics.pdf': 'logistics.html', 'passport.pdf': 'passport.html', 'sactcard.pdf': 'sactcard.html'}
    file = ROOT / 'patient' / route / names[section['document']]
    if not file.exists():
        return None
    tree = LH.fromstring(file.read_text())
    titles = []
    for heading in tree.xpath('//h2 | //h3'):
        value = re.sub(r'\s+', ' ', heading.text_content()).strip()
        if 3 < len(value) < 110 and value not in titles:
            titles.append(value)
    return [{'title': title, 'description': ''} for title in titles[:5]] or None

def current_support_files(route):
    """Read the current authored phase selection, not every old file on disk."""
    source = ROOT / 'patient' / route / 'supportive-care.html'
    tree = LH.fromstring(source.read_text())
    ids = [value for value in tree.xpath('//option/@value') if value]
    if not ids:
        if '/' in route:
            raise ValueError((route, 'A standalone context needs an explicit authored support phase'))
        phases = json.loads((ROOT / 'data/phase-support-v0838.json').read_text())['regimens'][route]
        if len(phases) != 1:
            raise ValueError((route, 'Standalone support must contain exactly one authored plan'))
        ids = [phases[0]['id']]
    if len(ids) != len(set(ids)) or any(not re.fullmatch(r'[a-zA-Z0-9_-]+', value) for value in ids):
        raise ValueError((route, 'Invalid or duplicate current phase ID'))
    names = ['support-' + value + '.pdf' for value in ids]
    for name in names:
        if not (ROOT / 'patient' / route / name).is_file():
            raise ValueError((route, 'Current authored phase PDF missing', name))
    return names

def append_missing_document(body, filename):
    """Keep existing complete sheets once; append genuinely omitted sheets."""
    with fitz.open(filename) as supplement:
        current = [norm(page.get_text()) for page in body]
        present = [any(norm(page.get_text()) in text for text in current) for page in supplement]
        if all(present):
            return None
        if any(present):
            raise ValueError((str(filename), 'Partially included supplement needs explicit reconciliation'))
        record = {'file': filename.name, 'pages': len(supplement), 'sha256': SHA(filename.read_bytes()), 'body': body_signature(supplement)}
        body.insert_pdf(supplement)
        return record

def add_global_folios(doc, label):
    for i, page in enumerate(doc):
        value = f'{label} {i + 1} / {len(doc)}'
        page.insert_font(fontname='helv')
        append_overlay(page, f'q .12 .28 .34 rg BT /helv 7 Tf 1 0 0 1 {page.rect.width - 108} 10 Tm ({value}) Tj ET Q\n')

def append_overlay(page, commands):
    """Isolate the old graphics state in separate streams; retain every body byte.

    WeasyPrint may finish with a transformed coordinate system. A separate q/Q
    pair around the unchanged old streams restores normal PDF coordinates for
    the new folio. It does not rewrite, rescale, clip or wrap text in the body.
    """
    doc = page.parent
    old = page.get_contents()
    new = []
    for content in [b'q\n', b'Q\n', commands.encode('ascii')]:
        xref = doc.get_new_xref()
        doc.update_object(xref, '<<>>')
        doc.update_stream(xref, content)
        new.append(xref)
    doc.xref_set_key(page.xref, 'Contents', '[' + ' '.join(f'{x} 0 R' for x in [new[0]] + old + new[1:]) + ']')

def build_route(route, stage, baseline, resume):
    logging.getLogger('weasyprint').setLevel(logging.ERROR)
    model = node('model', route)
    source_json = ROOT / model['sourcePath']
    if baseline:
        original = baseline_file(baseline, model['sourcePath'])
        if original != source_json.read_bytes():
            raise ValueError((route, 'baseline-preservation mode requires unchanged authored clinical JSON'))
    inputs = [Path(__file__), VISUAL, ROOT / 'package.json', ROOT / 'assets/patient/patient-visual-standard-v08443.css', ROOT / 'data/patient-document-sections-v08443.json', source_json, ROOT / 'patient' / route / 'guide.html', ROOT / 'patient' / route / 'knowledge.html']
    density = ROOT / 'data/patient-visual-layout-v08443.json'
    if density.exists():
        inputs.append(density)
    fingerprint = SHA(json.dumps({'baseline': baseline, 'files': {str(p.relative_to(ROOT)): SHA(p.read_bytes()) for p in inputs}}, sort_keys=True).encode())
    destination = stage / route
    report_file = destination / 'build.json'
    if resume and report_file.exists():
        old = json.loads(report_file.read_text())
        if old.get('fingerprint') == fingerprint and all((destination / item['document']).exists() and SHA((destination / item['document']).read_bytes()) == item['sha256'] for item in old['documents']):
            return old
    destination.mkdir(parents=True, exist_ok=True)
    guide, guide_proof = build_guide(route, model, baseline)
    reference, printed, reference_proof = reference_body(route, baseline, model['sections'])
    preserved, preservation_proof = old_sections(baseline_file(baseline, 'patient/' + route + '/handbook.pdf'), model['sections'])
    bodies, chapters, entries, appended = [], [], [], []
    support_names = current_support_files(route)
    for section in model['sections']:
        filename = section['document']
        if filename == 'guide.pdf':
            body = fitz.open(stream=guide, filetype='pdf')
        elif filename in preserved:
            body = preserved[filename]
        elif filename == 'knowledge.pdf':
            body = reference
        else:
            body = fitz.open(ROOT / 'patient' / route / filename)
        supplements = support_names if filename == 'supportive-care.pdf' else ['port-pump.pdf'] if filename == 'logistics.pdf' and (ROOT / 'patient' / route / 'port-pump.pdf').exists() else []
        for name in supplements:
            addition = append_missing_document(body, ROOT / 'patient' / route / name)
            if addition:
                appended.append({'section': filename, **addition})
        chapter_html = node('chapter', route, {'number': section['number'], 'title': section['title'], 'items': reading_items(route, section), 'contentPages': len(body)})
        chapter_data = render(chapter_html, ROOT)
        info = inspect_pdf(chapter_data, route + '/chapter-' + str(section['number']))
        if info['pages'] != 1:
            raise ValueError((route, section['id'], 'chapter opening overflow'))
        chapters.append(fitz.open(stream=chapter_data, filetype='pdf'))
        bodies.append(body)
    page_number = 2
    for section, body in zip(model['sections'], bodies):
        entries.append({'title': section['title'], 'page': page_number, 'content_page': page_number + 1, 'content_pages': len(body)})
        page_number += 1 + len(body)
    cover_html = node('cover', route, {'contents': entries})
    cover_data = render(cover_html, ROOT)
    if inspect_pdf(cover_data, route + '/cover')['pages'] != 1:
        raise ValueError((route, 'cover overflow'))
    handbook = fitz.open(stream=cover_data, filetype='pdf')
    for chapter, body in zip(chapters, bodies):
        handbook.insert_pdf(chapter)
        handbook.insert_pdf(body)
    handbook.set_toc([[1, entry['title'], entry['page']] for entry in entries])
    handbook.set_metadata({'title': model['title'] + ' — complete patient handbook', 'author': 'SACTCheck', 'subject': 'Full offline reference, treatment plans, support and records; v' + VERSION})
    for entry in entries:
        for rect in handbook[0].search_for(entry['title']):
            handbook[0].insert_link({'kind': fitz.LINK_GOTO, 'from': rect, 'page': entry['page'] - 1})
    add_global_folios(handbook, 'Handbook')
    standalone = fitz.open()
    standalone.insert_pdf(chapters[1])
    standalone.insert_pdf(reference)
    standalone.set_toc([[1, model['sections'][1]['title'], 1]])
    standalone.set_metadata({'title': model['title'] + ' — complete treatment reference', 'author': 'SACTCheck'})
    add_global_folios(standalone, 'Reference')
    outputs = {'guide.pdf': guide, 'knowledge.pdf': standalone.tobytes(garbage=4, deflate=True), 'handbook.pdf': handbook.tobytes(garbage=4, deflate=True)}
    documents = []
    for name, data in outputs.items():
        before = baseline_file(baseline, 'patient/' + route + '/' + name)
        result = inspect_pdf(data, route + '/' + name, allow_existing_bounds=True)
        # Retained source pages may have historical geometry defects. New cover,
        # chapter, guide-first and newly rendered reference pages passed above.
        result.update(document=name, before_sha256=SHA(before) if before else None)
        (destination / name).write_bytes(data)
        documents.append(result)
    if printed:
        (destination / 'knowledge-print.html').write_text(printed)
    (destination / 'cover.html').write_text(cover_html)
    report = {'route': route, 'fingerprint': fingerprint, 'source_json': model['sourcePath'], 'source_json_sha256': SHA(source_json.read_bytes()), 'documents': documents, 'handbook_pages': len(handbook), 'contents': entries, 'guide': guide_proof, 'reference': reference_proof, 'preserved_handbook_sections': preservation_proof, 'current_support_files': support_names, 'appended_supplements': appended, 'mirrors': ['patient/' + route, 'docs/patient/' + route]}
    report_file.write_text(json.dumps(report, indent=2) + '\n')
    return report

def job(args):
    route, stage, baseline, resume = args
    try:
        result = build_route(route, Path(stage), baseline, resume)
        return {'ok': True, 'result': result}
    except Exception as error:
        import traceback
        return {'ok': False, 'route': route, 'error': str(error), 'trace': traceback.format_exc()}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--routes', required=True, help='all or comma-separated authored treatment routes')
    parser.add_argument('--baseline', help='Exact Git commit for a clinical-content-preserving UI migration')
    parser.add_argument('--stage', type=Path, required=True)
    parser.add_argument('--report', type=Path, required=True)
    parser.add_argument('--workers', type=int, default=3)
    parser.add_argument('--resume', action='store_true')
    parser.add_argument('--publish', action='store_true')
    args = parser.parse_args()
    # Discover future authored suites through the same generator entry point.
    # The frozen v43 scope remains audit evidence, not a permanent route limit.
    all_routes = json.loads(subprocess.check_output(['node', '-e', 'process.stdout.write(JSON.stringify(require("./tools/apply-patient-visual-standard-v08443.cjs").discoverRoutes(process.cwd())))'], cwd=ROOT))
    selected = all_routes if args.routes == 'all' else args.routes.split(',')
    if not selected or len(set(selected)) != len(selected) or set(selected) - set(all_routes):
        parser.error('Select distinct authored routes from the current scope')
    if args.baseline and not re.fullmatch(r'[0-9a-f]{40}', args.baseline):
        parser.error('Baseline must be an exact commit SHA')
    args.stage.mkdir(parents=True, exist_ok=True)
    results, errors = [], []
    with concurrent.futures.ProcessPoolExecutor(max_workers=args.workers) as pool:
        futures = [pool.submit(job, (route, str(args.stage), args.baseline, args.resume)) for route in selected]
        for future in concurrent.futures.as_completed(futures):
            item = future.result()
            if item['ok']:
                result = item['result']; results.append(result)
                print(result['route'], result['handbook_pages'], 'handbook pages; full content retained', flush=True)
            else:
                errors.append(item); print('FAILED', item['route'], item['error'], flush=True)
    results.sort(key=lambda row: row['route'])
    report = {'release': VERSION, 'baseline': args.baseline, 'requested_routes': selected, 'completed': len(results), 'errors': errors, 'published': False, 'runtime': {'python': sys.version, 'weasyprint': __import__('weasyprint').__version__, 'pymupdf': fitz.VersionBind, 'fonts': {f: SHA(Path(f).read_bytes()) for files in FONTS.values() for f in files}}, 'results': results}
    if not errors and args.publish:
        for row in results:
            for name in ['guide.pdf', 'knowledge.pdf', 'handbook.pdf', 'knowledge-print.html']:
                source = args.stage / row['route'] / name
                if source.exists():
                    for base in ['patient', 'docs/patient']:
                        destination = ROOT / base / row['route'] / name
                        destination.parent.mkdir(parents=True, exist_ok=True)
                        shutil.copyfile(source, destination)
        # lxml normalizes HTML serialization. Canonicalize marked visual blocks
        # after publication so this pipeline also passes the shared --check.
        subprocess.run(['node', str(ROOT / 'tools/apply-patient-visual-standard-v08443.cjs'), '--write', '--routes', ','.join(selected)], cwd=ROOT, check=True, stdout=subprocess.PIPE)
        subprocess.run(['node', str(ROOT / 'tools/apply-patient-visual-standard-v08443.cjs'), '--check', '--routes', ','.join(selected)], cwd=ROOT, check=True, stdout=subprocess.PIPE)
        report['published'] = True
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'completed': len(results), 'failed': len(errors), 'published': report['published'], 'report': str(args.report)}))
    if errors:
        sys.exit(1)

if __name__ == '__main__':
    main()
