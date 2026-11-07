#!/usr/bin/env python3
"""Read-only, independent checks for the consolidated v0.84.44 patient books.

Checks current authored statements, exact preserved anatomical/contact pages,
real contents destinations, QR pixels, page bounds and published mirror bytes.
The v43 migration verifier remains unchanged; its low-level PDF resource
comparison and barcode helpers are reused without its old assembly contract.
"""
from pathlib import Path
import argparse
import collections
import concurrent.futures
import copy
import functools
import hashlib
import importlib.util
import json
import math
import re
import subprocess
import sys
import unicodedata

import pymupdf as fitz
from lxml import html as LH

ROOT = Path(__file__).resolve().parents[1]
HASH = lambda value: hashlib.sha256(value).hexdigest()
GENERATED = ["guide.pdf", "knowledge.pdf", "handbook.pdf"]
COMPANION_AUDIT = ROOT/"validation/patient-design-v08444/companion-content-retention.json"
CHAPTERS = ["Understanding your treatment", "Your schedule, tests and appointments",
    "Symptoms and supportive care", "Your record and contact card", "Sources and further information"]
SPEC = importlib.util.spec_from_file_location("pdf_resource_guard43", ROOT/"tools/verify-patient-documents-v08443.py")
guard = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(guard)
TERMS = json.loads(subprocess.check_output(["node", "-e", 'process.stdout.write(JSON.stringify(require("./tools/patient-editorial-v08444.cjs").TERMS))'], cwd=ROOT))
EXPANSIONS = sorted([(re.sub(r'[^\w]', '', unicodedata.normalize('NFKC',full+short)).casefold(),re.sub(r'[^\w]', '', short).casefold()) for short,full in TERMS], key=lambda pair: -len(pair[0]))


def require(condition, message):
    if not condition:
        raise ValueError(message)


def norm(value):
    value = unicodedata.normalize("NFKC",value).replace("\u00ad","")
    value = re.sub(r"[^\w]", "", value).casefold()
    for expansion,short in EXPANSIONS:
        value = value.replace(expansion,short)
    return value


def text(element):
    candidate = copy.deepcopy(element)
    for child in list(candidate.xpath(".//script | .//style | .//svg")):
        child.drop_tree()
    return re.sub(r"\s+", " ", candidate.text_content()).strip()


def pdf_text(document):
    return "".join(re.sub(r"(?:Handbook|Reference)\s+\d+\s*/\s*\d+", "", page.get_text()) for page in document)


def authored_html(route, name, source_json):
    path = ROOT/"patient"/route/name
    script = r"""
const fs=require('fs'); const x=JSON.parse(fs.readFileSync(0,'utf8'));
const result=require('./tools/patient-editorial-v08444.cjs').applyEditorial(x.html,{route:x.route,documentKind:x.name,data:x.data,root:process.cwd()});
process.stdout.write(typeof result==='string'?result:result.html);
"""
    value = subprocess.check_output(["node", "-e", script], cwd=ROOT, input=json.dumps({"html": path.read_text(), "route": route, "name": name, "data": source_json}).encode()).decode()
    return LH.fromstring(value)


def current_source_statements(tree):
    """Independent source inventory, before the builder's layout/removal pass."""
    excluded = {"pk-top", "pk-controls", "pk-day-detail", "pk-contents", "pk-nav", "no-print", "pk-help-link",
        "access-links", "journey-scroll-hint", "scv-document-downloads", "pt-toolbar", "suite-toolbar",
        "pk-footer", "journey-footer", "access-note", "sources", "book44-source-metadata"}
    browser_only = {
        "Your date stays on this page only. It is not saved or added to a QR code.",
        "On a small screen, swipe the chart sideways. Each day is a keyboard-accessible button.",
        "On a small screen, swipe the map sideways. The checks below give the same timing in words.",
        "Select a day to explore what to watch for. These are possible patterns, not a promise about when symptoms start or stop.",
        "The anatomical side-effect map follows.",
    }
    statements = []
    for element in tree.xpath('//main//p | //main//li | //main//td | //main//th'):
        chain = [element] + list(element.iterancestors())
        if any(value.tag in {'noscript','nav','script','style'} or set(value.get('class', '').split()) & excluded or value.get('id') in {'sources', 'anatomical-effects', 'pk-active-medicines'} for value in chain):
            continue
        if element.tag == 'li' and element.xpath('.//p | .//li | .//table'):
            continue
        if element.xpath('.//*[@id="pk-active-medicines"]'):
            continue
        value = text(element)
        if re.fullmatch(r'nccp\d{5}cliniciandraft', norm(value)):
            continue
        if len(norm(value)) < 18 or value in browser_only or value.startswith(('Sources:', 'Sources checked ', 'NCCP ')) and 'clinician draft' in value:
            continue
        if value.startswith(('Sources:', 'Sources checked ')):
            continue
        statements.append(value)
    return statements


def check_statements(statements, rendered, label):
    combined = norm(rendered)
    missing = [value for value in statements if norm(value) not in combined]
    require(not missing, label+': authored statements missing: '+str(missing[:6]))
    return len(set(norm(value) for value in statements))


@functools.lru_cache(maxsize=1)
def companion_inventory():
    """Read the frozen review independently of the builder and its unit list."""
    data = COMPANION_AUDIT.read_bytes()
    reviewed = json.loads(data)
    require(reviewed.get('schema_version') == 1 and reviewed.get('status') == 'reviewed' and not reviewed.get('errors'),
        'Companion review is incomplete')
    require(reviewed['normalization']['terms_sha256'] == HASH(json.dumps(TERMS,ensure_ascii=False,separators=(',',':')).encode()),
        'Approved acronym terms changed after companion review')
    return reviewed, HASH(data)


def verify_companions(route, row, reference, book):
    """Re-inventory all companions and verify every final clinical destination.

    Source coverage comes from fresh XPath extraction, not the builder's list.
    Reviewed equivalents are exact quoted destinations; no fuzzy similarity or
    blanket clinical exclusions can turn a missing statement into a pass.
    """
    reviewed, audit_hash = companion_inventory()
    files = [entry for entry in reviewed['source_files'] if entry['route'] == route]
    units = [entry for entry in reviewed['units'] if entry['route'] == route]
    names = ['treatment-journey.html','logistics.html','port-pump.html']
    expected_files = {str((ROOT/'patient'/route/name).relative_to(ROOT)) for name in names if (ROOT/'patient'/route/name).is_file()}
    require({entry['file'] for entry in files} == expected_files and len(files) == len(expected_files),
        'Companion review does not cover every current standalone source')
    summary = row.get('companion_content',{})
    require(summary.get('inventory_sha256') == audit_hash, 'Build did not use the frozen companion review')
    plan_hash = HASH(json.dumps({'source_files':files,'units':units},sort_keys=True).encode())
    require(summary.get('route_plan_sha256') == plan_hash, 'Companion decisions differ from the rendered route')
    counts = collections.Counter()
    raw_total = 0
    for record in files:
        source = ROOT/record['file']
        digest = HASH(source.read_bytes())
        require(digest == record['sha256'] == row['inputs'].get(record['file']), 'Reviewed companion source has changed: '+record['file'])
        tree = LH.fromstring(source.read_text())
        extracted = collections.defaultdict(list)
        for element in tree.xpath('//main//p | //main//li | //main//td | //main//th'):
            ancestors = [element]+list(element.iterancestors())
            if any(ancestor.get('id') in {'sources','anatomical-effects'} or set(ancestor.get('class','').split()) &
                {'book44-source-metadata','journey-footer','access-note','pk-top','no-print'} for ancestor in ancestors):
                continue
            if element.tag == 'li' and element.xpath('.//p | .//li | .//table'):
                continue
            value = text(element)
            if len(norm(value)) < 18 or value.startswith('Sources:'):
                continue
            extracted[norm(value)].append(tree.getroottree().getpath(element))
        decisions = [unit for unit in units if unit['source_file'] == record['file']]
        require(len(decisions) == len(extracted) == record['unique_units'], 'Companion unique-unit coverage differs: '+record['file'])
        require({norm(unit['source_text']) for unit in decisions} == set(extracted), 'A current companion statement has no review decision: '+record['file'])
        actual_raw = sum(len(paths) for paths in extracted.values())
        require(actual_raw == record['raw_units'], 'Companion raw occurrence count differs: '+record['file'])
        raw_total += actual_raw
        for unit in decisions:
            require(HASH(norm(unit['source_text']).encode()) == unit['source_sha256'], 'Companion statement hash mismatch')
            require(unit['hashes']['source_file_sha256'] == digest and unit.get('reason'), 'Companion decision is not source-bound')
            require(unit['source_xpaths'] == extracted[norm(unit['source_text'])], 'Companion XPath inventory differs')
            require(unit['status'] in {'exact','equivalent','missing','excluded_ui_or_metadata'}, 'Unresolved companion decision')
            counts[unit['status']] += 1
    require(summary.get('source_files') == len(files) and summary.get('raw_source_units') == raw_total and
        summary.get('unique_source_units') == len(units) and summary.get('reviewed_status_counts') == dict(counts) and
        summary.get('unresolved_units') == 0, 'Builder companion account does not match independent source extraction')

    documents = {'knowledge.pdf':reference,'handbook.pdf':book}
    page_texts = {name:[norm(re.sub(r'(?:Handbook|Reference)\s+\d+\s*/\s*\d+','',page.get_text())) for page in doc] for name,doc in documents.items()}
    combined = {name:''.join(pages) for name,pages in page_texts.items()}
    checks = []
    counterpart_checks = 0
    imported_clause_checks = 0
    for unit in units:
        status = unit['status']
        targets = []
        if status == 'excluded_ui_or_metadata':
            value = unit['source_text']
            metadata = value.startswith('National Cancer Control Programme') or re.match(r'^NCCP \d{5} · (?:Draft|Source reconciled)',value)
            navigation = value.startswith(('On a small screen, swipe the map sideways.','Open practical treatment guide','Back to your treatment portal'))
            require(bool(metadata or navigation), 'Non-navigation clinical statement excluded from companion review')
            require(not unit['missing_clauses'] and not unit['destination_texts'], 'Excluded metadata has contradictory clinical decisions')
        elif status == 'exact':
            targets.append({'variants':[unit['source_text']],'documents':list(documents),'kind':'exact'})
        else:
            require(status != 'equivalent' or bool(unit['destination_texts']), 'Equivalent companion instruction lacks a concrete counterpart')
            for destination in unit['destination_texts']:
                require(HASH(norm(destination['text']).encode()) == destination['sha256'], 'Companion counterpart hash differs')
                destination_name = destination['source_file'].split('/')[-1]
                require(destination_name in {'reading-body.html','handbook.pdf'}, 'Unknown reviewed counterpart scope')
                targets.append({'variants':[destination['text']], 'documents':['handbook.pdf'] if destination_name == 'handbook.pdf' else list(documents),
                    'kind':'reviewed_equivalent'})
            if status == 'missing':
                require(bool(unit['missing_clauses']), 'Unique companion instruction has no exact source clause')
                displays = unit.get('display_clauses') or unit['missing_clauses']
                require(len(displays) == len(unit['missing_clauses']), 'Reviewed display/source clause alignment differs')
                for index,clause in enumerate(unit['missing_clauses']):
                    require(norm(clause) and norm(clause) in norm(unit['source_text']), 'Imported clause is not from its reviewed source')
                    related_id = (unit.get('deduplication') or {}).get('supply_gap_covered_by_group_id')
                    if related_id is not None:
                        related = [candidate for candidate in units if candidate.get('group_id') == related_id and candidate['status'] == 'missing']
                        require(len(related) == 1 and len(unit['missing_clauses']) == 1, 'Ambiguous reviewed supply counterpart')
                        require((related[0].get('deduplication') or {}).get('canonical_for_related_supply_gap_group_id') == unit.get('group_id'),
                            'Reviewed supply counterpart is not reciprocal')
                        alternatives = related[0].get('display_clauses') or related[0]['missing_clauses']
                        heading = related[0]['source_heading']
                    else:
                        alternatives = [clause,displays[index]]
                        heading = unit['source_heading']
                    targets.append({'variants':alternatives,'documents':list(documents),'kind':'retained_unique_clause','heading':heading})
                    imported_clause_checks += 1
        proof = {'source_file':unit['source_file'],'source_sha256':unit['source_sha256'],'reviewed_status':status,'counterparts':[]}
        for target in targets:
            locations = {}
            for name in target['documents']:
                found = [value for value in target['variants'] if norm(value) in combined[name]]
                require(found, name+': missing reviewed companion counterpart: '+unit['source_file']+' '+target['variants'][0][:220])
                pages = [index+1 for index,value in enumerate(page_texts[name]) if any(norm(candidate) in value for candidate in found)]
                if target.get('heading'):
                    require(any(norm(target['heading']) in page_texts[name][page-1] for page in pages),
                        name+': restored companion clause detached from its source heading/condition: '+unit['source_file']+' '+target['heading'])
                    for number in pages:
                        page = documents[name][number-1]
                        words = [word for word in page.get_text('words') if 25 <= word[1] < page.rect.height-30]
                        occupied = max((word[3] for word in words),default=0)-min((word[1] for word in words),default=0)
                        require(len(words) >= 110 or occupied >= 300,
                            name+': sparse restored-companion tail on page '+str(number))
                locations[name] = pages
                counterpart_checks += 1
            proof['counterparts'].append({'kind':target['kind'],'accepted_text_sha256':[HASH(norm(value).encode()) for value in target['variants']],
                'verified_pdf_pages':locations})
        checks.append(proof)
    return {'inventory':str(COMPANION_AUDIT.relative_to(ROOT)),'inventory_sha256':audit_hash,'source_files_checked':len(files),
        'raw_source_units_checked':raw_total,'unique_source_units_checked':len(units),'reviewed_status_counts':dict(counts),
        'retained_unique_source_clauses_checked':imported_clause_checks,'final_pdf_counterparts_checked':counterpart_checks,
        'unresolved_units':0,'units':checks}


def inspect_document(document, name, exemptions):
    short, bounds = [], []
    for number, page in enumerate(document, 1):
        words = page.get_text('words', clip=guard.INFINITE)
        require(words, name+': empty page '+str(number))
        for word in words:
            if word[0] < -0.75 or word[1] < -0.75 or word[2] > page.rect.width+0.75 or word[3] > page.rect.height+0.75:
                bounds.append({'page': number, 'text': word[4], 'bbox': list(word[:4])})
        body = [word for word in words if 25 <= word[1] < page.rect.height-30]
        height = max((word[3] for word in body), default=0)-min((word[1] for word in body), default=0)
        if number not in exemptions and len(body) < 110 and height < 200:
            short.append({'page': number, 'words': len(body), 'occupied_height_pt': round(height,1), 'text': ' '.join(word[4] for word in body)})
    require(not bounds, name+': out-of-page text '+str(bounds[:6]))
    require(not short, name+': near-empty orphan page '+str(short[:3]))
    return {'pages': len(document), 'bounds': bounds, 'near_empty_pages': short, 'intentional_page_exemptions': sorted(exemptions)}


def verify_qr(document, pages):
    values, proofs = set(), []
    for number in pages:
        decoded, scale = guard.decode_pdf(document[number-1])
        values.update(decoded)
        if decoded:
            proofs.append({'page': number, 'values': decoded, 'render_scale': scale})
    return values, proofs


def verify_route(arguments):
    row, stage_value, previous_value = arguments
    route = row['route']; previous = Path(previous_value)
    stage = Path(stage_value) if stage_value else None
    result = {'route': route, 'status': 'failed', 'errors': [], 'preserved_pages': [], 'qr_checks': []}
    try:
        for filename, expected in row['inputs'].items():
            path = Path(filename) if Path(filename).is_absolute() else ROOT/filename
            require(path.is_file() and HASH(path.read_bytes()) == expected, 'Build input changed: '+filename)
        source = json.loads((ROOT/row['source_json']).read_text())
        require(source['code'] == route.split('/')[0], 'Source regimen identity mismatch')
        candidates = {}
        docs = {entry['document']: entry for entry in row['documents']}
        for name in GENERATED:
            path = stage/route/name if stage else ROOT/'patient'/route/name
            data = path.read_bytes()
            require(HASH(data) == docs[name]['sha256'], 'Candidate hash differs from build report: '+name)
            if not stage:
                require(data == (ROOT/'docs/patient'/route/name).read_bytes(), 'PDF mirror mismatch: '+name)
            candidates[name] = fitz.open(stream=data, filetype='pdf')
            require(len(candidates[name]) == docs[name]['pages'], 'Reported page count differs: '+name)
        guide, reference, book = [candidates[name] for name in GENERATED]
        originals = {name: fitz.open(previous/'patient'/route/name) for name in ['guide.pdf','handbook.pdf','sactcard.pdf']}
        require(len(originals['handbook.pdf']) == row['previous_handbook_pages'], 'Previous page count mismatch')
        require(row['pages_saved'] == len(originals['handbook.pdf'])-len(book), 'Page reduction calculation differs')
        require(row['handbook_pages'] == len(book), 'Handbook page count differs')

        source_guide = authored_html(route, 'guide.html', source)
        modern = source_guide.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," pt-first ")]')
        guide_statements = current_source_statements(source_guide)
        if modern:
            require(len(guide) == len(originals['guide.pdf']) == 3, 'Modern distilled guide must remain three pages')
            for number in [2,3]:
                proof = guard.compare_page(originals['guide.pdf'][number-1], guide[number-1], 'Exact guide page '+str(number), exact_streams=True)
                result['preserved_pages'].append({'document': 'guide.pdf', 'page': number, **proof})
            first = LH.fromstring('<html><body><main>'+LH.tostring(modern[0], encoding='unicode')+'</main></body></html>')
            guide_checks = check_statements(current_source_statements(first), guide[0].get_text(), 'Current distilled first page')
        else:
            guide_checks = check_statements(guide_statements, pdf_text(guide), 'Current complete legacy guide')
        def native_anatomy(pdf):
            return [{'page':i+1,'digest':bytes(item['digest']).hex(),'bbox':list(item['bbox']),
                'size_pt':[fitz.Rect(item['bbox']).width,fitz.Rect(item['bbox']).height]}
                for i,page in enumerate(pdf) for item in page.get_image_info(hashes=True) if item['width']==846 and item['height']==1859]
        original_figures,current_figures = native_anatomy(originals['guide.pdf']),native_anatomy(guide)
        require(original_figures and len(original_figures)==len(current_figures), 'Guide anatomical bitmap missing or duplicated')
        for original_figure,current_figure in zip(original_figures,current_figures):
            require(original_figure['digest']==current_figure['digest'], 'Guide anatomical pixels changed')
            require(all(abs(a-b)<.1 for a,b in zip(original_figure['size_pt'],current_figure['size_pt'])), 'Guide anatomical physical size or aspect changed')
        result['guide_anatomical_bitmap_checks'] = {'original':original_figures,'current':current_figures,'pixels_and_physical_scale_unchanged':True}
        result['guide_current_statement_checks'] = guide_checks

        anatomy_page = row['anatomy_page']; wallet_page = row['wallet_page']
        require(1 < anatomy_page < wallet_page <= len(book), 'Invalid anatomical/contact page positions')
        require(row['anatomy']['mode'] in ['Original unscaled anatomical page','Full detailed portal map added to the book'], 'Unknown anatomical-page mode')
        if row['anatomy']['mode'].startswith('Original'):
            source_page = row['anatomy']['source_page']
            expected = originals['guide.pdf'][source_page-1]
            for name, doc in [('handbook.pdf',book),('knowledge.pdf',reference)]:
                proof = guard.compare_page(expected, doc[anatomy_page-1], name+' anatomical page')
                result['preserved_pages'].append({'document': name, 'page': anatomy_page, **proof})
        else:
            portal = authored_html(route, 'index.html', source)
            maps = portal.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," patient-bodymap-card ")]')
            require(len(maps) == 1, 'Exactly one current anatomical map required')
            statements = [text(element) for element in maps[0].xpath('.//p | .//strong') if len(norm(text(element))) >= 10]
            result['new_anatomy_statement_checks'] = check_statements(statements, book[anatomy_page-1].get_text(), 'Full portal anatomical map')
            image_source = (ROOT/'patient'/route/maps[0].xpath('.//img')[0].get('src').split('?')[0]).resolve()
            source_image = fitz.Pixmap(str(image_source))
            images = [item for item in book[anatomy_page-1].get_image_info() if item['width']==source_image.width and item['height']==source_image.height]
            require(len(images)==1, 'Detailed original anatomical bitmap is missing or duplicated')
            rect = fitz.Rect(images[0]['bbox'])
            height = re.search(r'--pdf-map-height\s*:\s*([\d.]+)mm', maps[0].get('style',''))
            width = re.search(r'--pdf-map-width\s*:\s*([\d.]+)mm', maps[0].get('style',''))
            expected_height = float(height[1]) if height else 150
            expected_width = float(width[1]) if width else expected_height*source_image.width/source_image.height
            require(abs(rect.width*25.4/72-expected_width)<.15 and abs(rect.height*25.4/72-expected_height)<.15, 'Anatomical bitmap is letterboxed inside a different marker frame')
            offsets = {item['target']:item['badge_offset_mm'] for item in row['anatomy'].get('numbered_marker_offsets_mm',[])}
            map_words = book[anatomy_page-1].get_text('words')
            pin_checks = []
            for pin in maps[0].xpath('.//span[@data-hcc-pin]'):
                left = float(re.search(r'left\s*:\s*([\d.]+)%',pin.get('style',''))[1])/100
                top = float(re.search(r'top\s*:\s*([\d.]+)%',pin.get('style',''))[1])/100
                dx,dy = offsets.get(pin.get('data-hcc-pin'),[0,0])
                x,y = rect.x0+left*rect.width+dx*72/25.4,rect.y0+top*rect.height+dy*72/25.4
                matches = [word for word in map_words if word[4]==text(pin)]
                distance = min((math.hypot((word[0]+word[2])/2-x,(word[1]+word[3])/2-y) for word in matches),default=10000)
                require(distance<2.2*72/25.4, 'Anatomical number does not align with its image-relative target: '+pin.get('data-hcc-pin'))
                pin_checks.append({'target':pin.get('data-hcc-pin'),'number':text(pin),'badge_distance_mm':round(distance*25.4/72,3),'collision_offset_mm':[dx,dy]})
            result['new_anatomy_geometry_checks']={'source_bitmap_dimensions':[source_image.width,source_image.height],'printed_dimensions_mm':[rect.width*25.4/72,rect.height*25.4/72],'marker_checks':pin_checks}
        for offset, page in enumerate(originals['sactcard.pdf']):
            number = wallet_page+offset
            proof = guard.compare_page(page, book[number-1], 'Exact contact/wallet page '+str(number))
            require(guard.card_dimensions(page) == guard.card_dimensions(book[number-1]), 'Wallet card dimensions changed')
            result['preserved_pages'].append({'document': 'handbook.pdf', 'page': number, **proof})

        top = [entry for entry in book.get_toc() if entry[0] == 1]
        expected_toc = [[1, entry['title'], entry['page']] for entry in row['contents']]
        require(top == expected_toc and [entry[1] for entry in top] == CHAPTERS, 'Real chapter bookmarks differ from contents')
        cover_text = norm(book[0].get_text())
        for level, title, page in top:
            require(norm(title) in cover_text, 'Chapter absent from opening contents: '+title)
            require(norm(title) in norm(book[page-1].get_text()), 'Contents points to wrong chapter page: '+title)
        require(len(book[0].get_links()) >= len(CHAPTERS), 'Opening contents links are incomplete')
        for number, page in enumerate(book, 1):
            require(('Handbook '+str(number)+' / '+str(len(book))) in page.get_text(), 'Missing global handbook folio')
        for number, page in enumerate(reference, 1):
            require(('Reference '+str(number)+' / '+str(len(reference))) in page.get_text(), 'Missing global reference folio')

        reference_text, book_text = pdf_text(reference), pdf_text(book)
        all_text = '\n'.join(pdf_text(doc) for doc in candidates.values())
        require(not re.search(r'\bNCCN\b|nccn\.org|nccn-patient', all_text, re.I), 'Obsolete restricted-source attribution remains in patient PDF')
        require(not re.search(r'\bthe Irish (?:system|service|leaflet)\b|\bYour Irish PRRT\b', all_text, re.I), 'Distancing service wording remains')
        require('yourcompletereference' not in norm(book_text) and 'readwhatyouneedwhenyouneedit' not in norm(book_text), 'Duplicate handbook navigator remains')
        current_knowledge = authored_html(route, 'knowledge.html', source)
        statements = current_source_statements(current_knowledge)
        result['current_knowledge_statement_checks'] = check_statements(statements, reference_text, 'Current authored knowledge source')
        check_statements(statements, book_text, 'Current handbook source')
        named_tests = [value for item in source.get('monitoring_test_details',[]) for key in ['label','timing','purpose','detail'] if isinstance((value:=item.get(key)),str) and value]
        result['named_monitoring_statement_checks'] = check_statements(named_tests, book_text, 'Explicit authored monitoring tests') if named_tests else 0
        phase_checks = {}
        for name in row['current_support_files']:
            filename = name.replace('.pdf','.html')
            tree = authored_html(route, filename, source)
            values = current_source_statements(tree)
            values += [text(value) for value in tree.xpath('//main/h2 | //main/h3') if len(norm(text(value))) >= 10]
            phase_checks[filename] = check_statements(values, book_text, 'Current phase support plan '+filename)
        result['phase_support_statement_checks'] = phase_checks
        units = row['clinical_content']['unique_source_inventory']
        require(units and all(HASH(norm(unit['text']).encode()) == unit['sha256'] for unit in units), 'Invalid unique clinical statement inventory')
        result['audited_unique_statement_checks'] = check_statements([unit['text'] for unit in units], book_text, 'Audited unique source inventory')
        result['companion_content_checks'] = verify_companions(route,row,reference,book)

        if stage:
            # This is a staged audit/rendering artifact. Canonical print HTML
            # remains generated by the established patient source generator.
            printed = LH.fromstring((stage/route/'knowledge-print.html').read_text())
            require(len(printed.xpath('//*[@id="anatomical-effects"]')) == 1, 'Staged complete HTML needs its anatomy map once')
            require(len(printed.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," book44-sources ")]')) == 1, 'Staged complete HTML needs its source section once')

        old_guide_values, _ = verify_qr(originals['guide.pdf'], range(1,len(originals['guide.pdf'])+1))
        guide_values, guide_proofs = verify_qr(guide, range(1,len(guide)+1))
        require(guide_values == old_guide_values and guide_values, 'Guide QR destinations changed or disappeared')
        old_card_values, _ = verify_qr(originals['sactcard.pdf'], range(1,len(originals['sactcard.pdf'])+1))
        card_values, card_proofs = verify_qr(book, range(wallet_page,wallet_page+len(originals['sactcard.pdf'])))
        require(card_values == old_card_values and card_values, 'Contact-card QR destinations changed or disappeared')
        result['qr_checks'] = [{'document': 'guide.pdf', **proof} for proof in guide_proofs]+[{'document': 'handbook.pdf', **proof} for proof in card_proofs]

        result['documents'] = {}
        for name, doc in candidates.items():
            exemptions = {1}
            if name == 'handbook.pdf':
                exemptions.update([anatomy_page]+list(range(wallet_page,wallet_page+len(originals['sactcard.pdf']))))
            elif name == 'knowledge.pdf':
                exemptions.add(anatomy_page)
            elif modern:
                exemptions.update([2,3])
            complete_sources = None
            if name in {'handbook.pdf','knowledge.pdf'}:
                source_targets = [page for level,title,page in doc.get_toc() if level == 1 and title == 'Sources and further information']
                if len(source_targets) == 1 and source_targets[0] == len(doc) and row['sources']:
                    last_page = norm(doc[-1].get_text())
                    for source in row['sources']:
                        require(norm(source['url']) in last_page,name+': the complete source list must be present on its final page')
                    complete_sources = {'page':len(doc),'sources_checked':len(row['sources']),'reason':'Complete labelled source section, not a short continuation'}
                    exemptions.add(len(doc))
            result['documents'][name] = inspect_document(doc,name,exemptions)
            if complete_sources:
                result['documents'][name]['complete_source_section'] = complete_sources
        result.update(status='pass', previous_handbook_pages=len(originals['handbook.pdf']), handbook_pages=len(book), pages_saved=row['pages_saved'], published_mirrors_verified=not bool(stage), input_hashes_checked=len(row['inputs']), semantic_consolidation_operations=len(row['semantic_consolidation']['changes']), duplicate_record_copies_removed=len(row['records']['removed_duplicate_record_copies']))
    except Exception as error:
        result['errors'].append(str(error))
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--build-report', required=True, type=Path)
    parser.add_argument('--report', required=True, type=Path)
    parser.add_argument('--routes', default='all')
    parser.add_argument('--stage', type=Path)
    parser.add_argument('--previous-root', type=Path)
    parser.add_argument('--workers', type=int, default=3)
    args = parser.parse_args()
    build = json.loads(args.build_report.read_text())
    require(not build['errors'], 'Build report contains failed routes')
    previous = args.previous_root or Path(build['previous_root'])
    available = {row['route']: row for row in build['results']}
    selected = list(available) if args.routes == 'all' else args.routes.split(',')
    require(set(selected) <= set(available) and len(set(selected)) == len(selected), 'Select distinct routes present in the build report')
    results = []
    with concurrent.futures.ProcessPoolExecutor(max_workers=args.workers) as pool:
        tasks = [pool.submit(verify_route, (available[route], str(args.stage) if args.stage else None, str(previous))) for route in selected]
        for future in concurrent.futures.as_completed(tasks):
            row = future.result(); results.append(row)
            print(row['status'].upper(),row['route'],str(row['errors']) if row['errors'] else '',flush=True)
    results.sort(key=lambda row: row['route'])
    failed = [row for row in results if row['errors']]
    complete = set(selected) == set(guard.SCOPE['routes'])
    report = {'schema_version': 1, 'release': '0.84.44', 'status': 'failed' if failed else 'staged_pass' if args.stage else 'pass',
        'scope': 'all_228_authored_routes' if complete else 'explicit_subset', 'routes_checked': len(results), 'failed_routes': len(failed),
        'all_document_checks_passed': not failed and complete and not bool(args.stage), 'checks_passed': not failed,
        'published_mirrors_verified': not failed and not bool(args.stage), 'previous_root': str(previous), 'build_report_sha256': HASH(args.build_report.read_bytes()),
        'preserved_page_checks': sum(len(row['preserved_pages']) for row in results), 'qr_checks': sum(len(row['qr_checks']) for row in results),
        'handbook_pages_before': sum(row.get('previous_handbook_pages',0) for row in results), 'handbook_pages_after': sum(row.get('handbook_pages',0) for row in results),
        'duplicate_record_copies_removed': sum(row.get('duplicate_record_copies_removed',0) for row in results),
        'companion_source_files_checked': sum(row.get('companion_content_checks',{}).get('source_files_checked',0) for row in results),
        'companion_raw_source_units_checked': sum(row.get('companion_content_checks',{}).get('raw_source_units_checked',0) for row in results),
        'companion_unique_source_units_checked': sum(row.get('companion_content_checks',{}).get('unique_source_units_checked',0) for row in results),
        'companion_unique_source_clauses_restored': sum(row.get('companion_content_checks',{}).get('retained_unique_source_clauses_checked',0) for row in results),
        'companion_final_pdf_counterparts_checked': sum(row.get('companion_content_checks',{}).get('final_pdf_counterparts_checked',0) for row in results),
        'runtime': {'python': sys.version, 'pymupdf': fitz.VersionBind},
        'limits': ['Clinical/source review and prescribing authorization are separate from these document checks.', 'QRs are decoded from rendered PDF pixels; live endpoint availability, physical printing and phone-camera usability require separate checks.', 'Exact source page geometry, text coordinates, streams, images and font programs are checked for the preserved anatomy and wallet pages. Fresh narrative layout is checked by source statements, bounds, pagination and visual review.'],
        'results': results}
    args.report.parent.mkdir(parents=True,exist_ok=True)
    args.report.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({key: report[key] for key in ['status','scope','routes_checked','failed_routes','checks_passed','all_document_checks_passed','preserved_page_checks','qr_checks','handbook_pages_before','handbook_pages_after']}))
    if failed:
        sys.exit(1)


if __name__ == '__main__':
    main()
