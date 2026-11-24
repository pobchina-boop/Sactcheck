#!/usr/bin/env python3
"""All-five early print probes; save every overflow page instead of failing fast.

Requires an actual authenticated application HTML freeze. This is a diagnostic,
never publication: production pack/content/QR verifiers still have to pass.
"""
from pathlib import Path
import argparse, concurrent.futures, copy, hashlib, importlib.util, json, re
import fitz
from lxml import html as LH
from PIL import Image, ImageDraw
from weasyprint import HTML, CSS

R = Path(__file__).resolve().parents[1]
ROUTES = ['00675', '00747', '00504', '00754', '00757']
SHA = lambda data: hashlib.sha256(data).hexdigest()
spec = importlib.util.spec_from_file_location('v64pack', R/'tools/render-sarcoma-packs-v08464.py')
pack = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pack)


def frozen(path):
    value = json.loads(path.read_text())
    assert value['release'] == '0.84.64' and set(value['routes']) == set(ROUTES)
    records = {}
    for key in ['profiles', 'documents', 'qr_assets', 'generator_sources', 'shared_content_inputs', 'render_assets']:
        assert key in value and value[key], ('Missing source-freeze class', key)
        for item in value[key]:
            records[item['file']] = item['sha256']
    for file, digest in records.items():
        assert SHA((R/file).read_bytes()) == digest, ('Stale frozen source', file)
    assert 'tools/probe-sarcoma-layout-v08464.py' in records, 'Pin the actual diagnostic tool before probing'
    return {'file': str(path), 'sha256': SHA(path.read_bytes()), 'records_checked': len(records)}


def probe(job):
    route, output = job
    out = Path(output)/route
    out.mkdir(parents=True)
    rows, errors, thumbs = [], [], []
    for name in ['guide', 'sactcard']:
        source = R/'patient'/route/(name+'.html')
        inputs = pack.source_hashes(source)
        text = source.read_text()
        text = re.sub(r'<line class="(chemo|immune)"', lambda m: '<line stroke="'+('#a94022' if m[1]=='chemo' else '#682b9f')+'" stroke-width=".42"'+(' stroke-dasharray="1.4 .9"' if m[1]=='chemo' else '')+' class="'+m[1]+'"', text)
        tree = LH.fromstring(text)
        sections = tree.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," pt-page ")]') if name == 'guide' else [None]
        if name == 'guide' and len(sections) != 3:
            raise ValueError((route, 'Three authored pack sections required', len(sections)))
        for index, section in enumerate(sections):
            isolated = copy.deepcopy(tree)
            if section is not None:
                body = isolated.find('body')
                for child in list(body): body.remove(child)
                main = LH.Element('main', {'class': 'pt-sheet'})
                main.append(copy.deepcopy(section)); body.append(main)
            profile = 'Nimbus' if name == 'guide' and index == 0 else 'DejaVu'
            scoped = isolated.xpath('//style[@id="sarcoma-summary-v08464"]/text()') if name == 'guide' and index == 0 else []
            assert len(scoped) <= 1
            css = '\n'.join(scoped)
            html = LH.tostring(isolated, encoding='unicode')
            data = pack.h.render(html, source.parent, styles=css, profile=profile)
            pdf = out/(name+'-section'+str(index+1)+'.pdf'); pdf.write_bytes(data)
            doc = fitz.open(stream=data, filetype='pdf')
            geometry, issues, images = [], [], []
            if len(doc) != 1: issues.append({'kind': 'authored_section_overflow', 'actual_pages': len(doc), 'expected_pages': 1})
            for number, page in enumerate(doc, 1):
                for word in page.get_text('words'):
                    if word[0] < -1 or word[1] < -1 or word[2] > page.rect.width+1 or word[3] > page.rect.height+1:
                        issues.append({'kind': 'page_text_bounds', 'page': number, 'word': list(word)})
                image = out/(pdf.stem+'-p'+str(number)+'.png')
                page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5)).save(image)
                images.append({'file': str(image), 'sha256': SHA(image.read_bytes()), 'page': number})
                thumbs.append((image, name+' section '+str(index+1)+' p'+str(number)))
            rendered = HTML(string=html, base_url=str(source.parent)).render(stylesheets=[CSS(string=pack.h.font_css(profile)+'\n'+css, font_config=pack.h.FONT_CONFIG)], font_config=pack.h.FONT_CONFIG)
            for page in rendered.pages:
                for box in page._page_box.descendants():
                    if box.element is None or type(box).__name__ not in ['BlockBox', 'TableCellBox']: continue
                    cl = box.element.get('class', '')
                    card = 'hcc-organ-card' in cl
                    wallet = cl in ['pt-wallet-front', 'pt-wallet-back'] and box.style['height'] != 'auto'
                    texts = [x for x in box.descendants() if type(x).__name__ == 'TextBox']
                    if not (card or wallet) or not texts: continue
                    bottom = box.position_y+box.margin_top+box.border_height()-box.padding_bottom-max(t.position_y+t.height for t in texts)
                    right = box.position_x+box.margin_left+box.border_width()-box.padding_right-max(t.position_x+t.width for t in texts)
                    entry = {'class': cl, 'target': box.element.get('data-hcc-target'), 'bottom_clearance_px': bottom, 'right_clearance_px': right}
                    if bottom < -.7 or right < -.7: issues.append({'kind': 'internal_clipping', **entry})
                    if wallet:
                        entry['mm'] = [box.border_width()*25.4/96, box.border_height()*25.4/96]
                        if abs(entry['mm'][0]-85.6) > .2 or abs(entry['mm'][1]-54) > .2: issues.append({'kind': 'wallet_size', **entry})
                    geometry.append(entry)
            rows.append({'document': name, 'authored_section': index+1, 'font_profile': profile, 'source_hashes': inputs, 'pdf': str(pdf), 'pdf_sha256': SHA(data), 'pages': len(doc), 'images': images, 'geometry': geometry, 'errors': issues})
            errors.extend(issues)
        assert pack.source_hashes(source) == inputs, ('Input changed during diagnostic', route, name)
    sheet = Image.new('RGB', (3*260, 375*((len(thumbs)+2)//3)), '#e1e6e9'); draw = ImageDraw.Draw(sheet)
    for i, (file, label) in enumerate(thumbs):
        image = Image.open(file).convert('RGB'); image.thumbnail((245, 347)); x=(i%3)*260; y=(i//3)*375
        draw.text((x+6, y+6), label, fill='black'); sheet.paste(image, (x+7, y+23))
    file = out/'contact-sheet.png'; sheet.save(file)
    result = {'route': route, 'status': 'failed' if errors else 'geometry_pass_requires_content_qr_visual_review', 'errors': errors, 'documents': rows, 'contact_sheet': str(file), 'contact_sheet_sha256': SHA(file.read_bytes())}
    (out/'manifest.json').write_text(json.dumps(result, indent=2)+'\n')
    return result


def main():
    p=argparse.ArgumentParser(); p.add_argument('--freeze', type=Path, required=True); p.add_argument('--output', type=Path, required=True); p.add_argument('--workers', type=int, default=3); a=p.parse_args()
    freeze=frozen(a.freeze)
    assert not a.output.exists(), 'Use a fresh diagnostic directory'
    a.output.mkdir(parents=True); results=[]
    with concurrent.futures.ProcessPoolExecutor(max_workers=a.workers) as pool:
        tasks={pool.submit(probe, (route, str(a.output.resolve()))): route for route in ROUTES}
        for task in concurrent.futures.as_completed(tasks):
            try: row=task.result()
            except Exception as error: row={'route': tasks[task], 'status': 'failed', 'errors': [str(error)]}
            results.append(row); print(row['route'], row['status'], flush=True)
    assert frozen(a.freeze) == freeze, 'Freeze changed during probes'
    failed=any(row['errors'] for row in results)
    report={'status': 'failed' if failed else 'geometry_pass_requires_content_qr_visual_review', 'freeze': freeze, 'all_five_attempted': len(results)==5, 'results': results, 'publication': False}
    (a.output/'manifest.json').write_text(json.dumps(report, indent=2)+'\n')
    raise SystemExit(int(failed))

if __name__=='__main__': main()
