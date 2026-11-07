"""Refresh changed standalone patient PDFs from their current authored HTML.

Handbooks, guides and references use the consolidated document builder. This
separate pass prevents an older passport, journey or support PDF from retaining
superseded wording after its HTML has been updated. Wallets and clinician consent
forms are deliberately outside this renderer.
"""
from pathlib import Path
import argparse, concurrent.futures, hashlib, importlib.util, json, re, shutil
import fitz
from lxml import html as LH

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('patient_v43_pdf_helpers',ROOT/'tools/build-patient-documents-v08443.py')
helpers=importlib.util.module_from_spec(spec)
spec.loader.exec_module(helpers)
SHA=lambda b:hashlib.sha256(b).hexdigest()
STEMS={'passport','treatment-journey','logistics','supportive-care'}

# These rules are confined to the disposable HTML sent to the ancillary PDF
# renderer. The shared patient CSS and the source HTML are not changed. No rule
# changes a type size, line height, image/QR dimensions or clinical wording.
NATURAL_PRINT_LAYOUT='''
@media print {
 .sc44-ancillary-print .journey-checks {
   break-before:auto!important;page-break-before:auto!important;
 }
 .sc44-ancillary-print .sc44-support-signoff {
   break-inside:avoid;page-break-inside:avoid;
 }
 .sc44-ancillary-print .sc44-support-signoff>p:first-child {margin-top:0}
 .sc44-ancillary-print .sc44-support-signoff>.sources {break-before:avoid}
 .sc44-ancillary-print .endocrine-footer,
 .sc44-ancillary-print .access-note,
 .sc44-ancillary-print .journey-footer {
   break-before:avoid;page-break-before:avoid;
 }
 .sc44-ancillary-print .sc44-journey-endcolumns {
   display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);
   gap:12px;align-items:start;break-inside:avoid;page-break-inside:avoid;
 }
 .sc44-ancillary-print .sc44-journey-endcolumns>.journey-checks {
   margin:0!important;column-count:1!important;min-width:0;
 }
 .sc44-ancillary-print .sc44-journey-endcolumns>.journey-handoff {
   margin:0!important;min-width:0;
 }
 .sc44-ancillary-print .sc44-journey-endcolumns[data-milestones="2"] {
   grid-template-columns:minmax(0,2fr) minmax(0,1fr);
 }
 .sc44-ancillary-print .sc44-journey-endcolumns[data-milestones="2"]>.journey-checks {
   column-count:2!important;
 }
}
'''

COMPACT_PRINT_LAYOUT='''
@media print {
 .sc44-ancillary-print.clinical-support-page main p {margin:4px 0!important}
 .sc44-ancillary-print.clinical-support-page main h1 {margin:4px 0!important}
 .sc44-ancillary-print.clinical-support-page main h2 {margin:5px 0!important}
 .sc44-ancillary-print.clinical-support-page main h3 {margin:5px 0!important}
 .sc44-ancillary-print.clinical-support-page main ul {margin:4px 0!important}
 .sc44-ancillary-print.clinical-support-page main li {margin:2px 0!important}
 .sc44-ancillary-print.clinical-support-page main th,
 .sc44-ancillary-print.clinical-support-page main td {padding:3px 4px!important}
 .sc44-ancillary-print.clinical-support-page .notice {padding:6px 8px!important}
 .sc44-ancillary-print.clinical-support-page .sources p {margin:3px 0!important}
 .sc44-ancillary-print .journey-header {padding:6px 10px!important}
 .sc44-ancillary-print .journey-header h2 {margin:4px 0!important}
 .sc44-ancillary-print .journey-header p {margin:4px 0!important}
 .sc44-ancillary-print .journey-orientation {padding:5px!important}
 .sc44-ancillary-print .journey-table th,
 .sc44-ancillary-print .journey-table td {padding:3px!important}
 .sc44-ancillary-print .journey-table td>span {padding:3px!important}
 .sc44-ancillary-print .journey-table caption {padding:4px 8px!important}
 .sc44-ancillary-print .journey-checks {margin:5px 0!important}
 .sc44-ancillary-print .journey-milestone {margin:2px 0!important}
 .sc44-ancillary-print .journey-milestone summary {padding:4px 6px!important}
 .sc44-ancillary-print .journey-milestone p {margin:3px 0!important}
 .sc44-ancillary-print .journey-handoff {padding:5px 8px!important}
 .sc44-ancillary-print .access-print h1 {margin-top:0!important;margin-bottom:6px!important}
 .sc44-ancillary-print .access-print h2 {margin:6px 0 3px!important}
 .sc44-ancillary-print .access-print h3 {margin:5px 0 3px!important}
 .sc44-ancillary-print .access-print p {margin:4px 0!important}
 .sc44-ancillary-print .access-print .pk-section {padding:4px 0!important}
 .sc44-ancillary-print .access-print .pk-section li {margin-bottom:0!important}
 .sc44-ancillary-print .endocrine-footer {padding:4px 0!important;margin-top:4px!important}
 .sc44-ancillary-print .access-section {margin:8px 0!important}
 .sc44-ancillary-print .access-steps {gap:6px!important;margin:8px 0!important}
 .sc44-ancillary-print .access-step {padding:7px!important}
 .sc44-ancillary-print .access-step h3 {margin:4px 0!important}
 .sc44-ancillary-print .access-step p {margin:4px 0 0!important}
}
'''

# A final, bounded option for a source-footer overflow on a prose logistics
# sheet: retain the type and use a conventional 12 mm print margin. This is
# never applied to passports, wallets, QR sheets or the landscape journeys.
LOGISTICS_TIGHT_PRINT_LAYOUT='''
@page sc44-logistics-compact {size:A4;margin:12mm}
@media print {
 .sc44-ancillary-print.suite-access {page:sc44-logistics-compact}
 .sc44-ancillary-print.suite-access .access-print h2 {margin:4px 0 2px!important}
 .sc44-ancillary-print.suite-access .access-print p {margin:3px 0!important}
}
'''

def has_class(element,name):
    return name in (element.get('class') or '').split()

def class_nodes(tree,name):
    return tree.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," '+name+' ")]')

def remove_print_navigation(tree):
    """Remove only the web phase-selection controls, not clinical material."""
    if not tree.xpath('//*[@data-support-phase]'):
        return
    for element in list(tree.xpath('//noscript')):
        links=element.xpath('.//a')
        if links and all(re.fullmatch(r'support-[a-z0-9_-]+\.html',a.get('href') or '') for a in links):
            element.drop_tree()
    for element in list(tree.xpath('//*[@id="phase-prompt"]'))+class_nodes(tree,'phase-picker'):
        element.drop_tree()

def group_support_signoff(tree):
    """Keep completion lines and their sources together without losing lines."""
    for source in class_nodes(tree,'sources'):
        previous=source.getprevious()
        if previous is None or previous.tag!='p' or 'Individual changes / rescue duration:' not in previous.text_content():
            continue
        parent=source.getparent()
        if has_class(parent,'sc44-support-signoff'):
            continue
        wrapper=LH.Element('div',{'class':'sc44-support-signoff'})
        parent.insert(parent.index(previous),wrapper)
        wrapper.append(previous);wrapper.append(source)

def group_journey_ending(tree):
    """Use otherwise empty second-column space for an isolated review box."""
    for checks in class_nodes(tree,'journey-checks'):
        handoff=checks.getnext()
        count=len(checks.xpath('.//details'))
        if handoff is None or not has_class(handoff,'journey-handoff') or count not in (1,2):
            continue
        parent=checks.getparent()
        wrapper=LH.Element('div',{'class':'sc44-journey-endcolumns','data-milestones':str(count)})
        parent.insert(parent.index(checks),wrapper)
        wrapper.append(checks);wrapper.append(handoff)

def known_overflow_pages(data,name):
    """Identify reviewed overflow patterns, never meaningful test-card sheets."""
    if name not in {'treatment-journey','logistics','supportive-care'} and not name.startswith('support-'):
        return []
    results=[]
    with fitz.open(stream=data,filetype='pdf') as document:
        if len(document)<2:return results
        for index,page in enumerate(document):
            words=page.get_text('words');text=page.get_text().strip()
            if not words or len(words)>=100 or max(w[3] for w in words)>=page.rect.height*.65:
                continue
            if name=='treatment-journey':
                if text.startswith('Tests in your plan'):
                    continue
                if not (text.startswith('At the next review') or text.startswith('Sources checked') or text.startswith('Care / check')):
                    continue
            results.append({'page':index+1,'words':len(words),'text':text})
    return results

def is_target(stem):
    return stem in STEMS or bool(re.fullmatch(r'support-[a-z0-9_-]+',stem))

def expected_cells(source):
    doc=LH.fromstring(source)
    result=[]
    for cell in doc.xpath('//td|//th'):
        hidden=False
        for ancestor in [cell,*cell.iterancestors()]:
            classes=set((ancestor.get('class') or '').split())
            if classes & {'no-print','screen-only','scv-screen-downloads'}:
                hidden=True;break
        value=' '.join(cell.text_content().split())
        if not hidden and len(helpers.norm(value))>=12:
            result.append(value)
    return result

def expected_ending_blocks(source,name):
    """Verify the exact clinical/source blocks affected by ending reflow."""
    tree=LH.fromstring(source)
    elements=[]
    for handoff in class_nodes(tree,'journey-handoff'):
        elements.extend(handoff.xpath('.//h3|.//li|.//p'))
    if name=='supportive-care' or name.startswith('support-'):
        elements.extend(class_nodes(tree,'sources'))
        elements.extend(p for p in tree.xpath('//p') if any(phrase in p.text_content() for phrase in ['Before signing:','Individual changes / rescue duration:']))
    if name=='logistics':
        for name in ['access-step','access-details','access-note','endocrine-footer']:
            elements.extend(class_nodes(tree,name))
        for section in class_nodes(tree,'pk-section'):
            elements.extend(section.xpath('.//li|.//p'))
    return list(dict.fromkeys(' '.join(e.text_content().split()) for e in elements if e.text_content().strip()))

def page_geometry(document):
    result=[]
    for index,page in enumerate(document):
        words=page.get_text('words')
        result.append({'page':index+1,'size_pt':[round(page.rect.width,2),round(page.rect.height,2)],'words':len(words),
            'text_bounds_pt':[round(min(w[0] for w in words),2),round(min(w[1] for w in words),2),round(max(w[2] for w in words),2),round(max(w[3] for w in words),2)] if words else None})
    return result

def printable_source(source,layout='natural'):
    # The browser chooses a phase using JavaScript. A standalone PDF has no
    # phase picker, so print every explicitly authored phase under its heading.
    # Restrict this to phase sections; other hidden content stays hidden.
    tree=LH.fromstring(source)
    changed=False
    remove_print_navigation(tree)
    # Hash the remaining body wording before rearranging print-only wrappers.
    # It must remain exactly the same sequence: wrappers may move as groups,
    # but no unique instruction, source, checklist or signature line is lost.
    body=tree.xpath('//body')[0]
    clinical_text=helpers.norm(body.text_content())
    body.set('class',((body.get('class') or '')+' sc44-ancillary-print').strip())
    group_support_signoff(tree)
    for section in tree.xpath('//*[@data-support-phase and @hidden]'):
        del section.attrib['hidden'];changed=True
    # These older outline calendars rely on browser CSS inheritance. Explicit
    # paint attributes keep their geometry intact in the PDF renderer too.
    for card in tree.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," access-step ")]'):
        for svg in card.xpath('./svg'):
            for key,value in {'fill':'none','stroke':'#087b7a','stroke-width':'3','stroke-linecap':'round','stroke-linejoin':'round'}.items():
                if key not in svg.attrib:svg.set(key,value);changed=True
    # Keep the explanation heading with its first card. Some PDF engines do
    # not honour break-after across a heading followed by an HTML details node.
    for checks in tree.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," journey-checks ")]'):
        children=list(checks)
        if len(children)>1 and children[0].tag=='h3' and children[1].tag=='details':
            intro=LH.Element('div',{'class':'sc44-journey-intro','style':'break-inside:avoid;page-break-inside:avoid'})
            intro.append(children[0]);intro.append(children[1]);checks.insert(0,intro);changed=True
    if layout in {'joined','compact','tight'}:
        group_journey_ending(tree)
    assert helpers.norm(body.text_content())==clinical_text,'Print preparation changed retained body wording'
    style=LH.Element('style',{'data-sc44-ancillary-layout':layout})
    style.text=NATURAL_PRINT_LAYOUT+(COMPACT_PRINT_LAYOUT if layout in {'compact','tight'} else '')+(LOGISTICS_TIGHT_PRINT_LAYOUT if layout=='tight' else '')
    tree.xpath('//head')[0].append(style)
    return LH.tostring(tree,encoding='unicode',doctype='<!doctype html>')

def remove_empty_pages(data):
    # A trailing layout fragment can produce a completely white PDF page.
    # Delete it only after a full-size raster proves that it contains no ink;
    # a text-free diagram, picture or form must never be removed this way.
    with fitz.open(stream=data,filetype='pdf') as doc:
        empty=[]
        for index,page in enumerate(doc):
            if page.get_text().strip():continue
            pix=page.get_pixmap(matrix=fitz.Matrix(1,1),colorspace=fitz.csRGB,alpha=False)
            if pix.samples and min(pix.samples)==255:empty.append(index)
        if not empty:return data,[]
        for index in reversed(empty):doc.delete_page(index)
        if not len(doc):raise ValueError('Refusing an entirely empty patient document')
        return doc.tobytes(garbage=4,deflate=True),[index+1 for index in empty]

def render_one(job):
    route,name,previous_root,stage,css_digest,resume=job
    html_path=ROOT/'patient'/route/(name+'.html')
    old_path=Path(previous_root)/'patient'/route/(name+'.pdf')
    out=Path(stage)/'patient'/route/(name+'.pdf')
    proof=out.with_suffix('.verification.json')
    source=html_path.read_text()
    fingerprint=SHA((SHA(source.encode())+css_digest+SHA(old_path.read_bytes())+SHA(Path(__file__).read_bytes())).encode())
    if resume and out.exists() and proof.exists():
        prior=json.loads(proof.read_text())
        if prior.get('input_sha256')==fingerprint and prior.get('sha256')==SHA(out.read_bytes()):
            return prior
    with fitz.open(old_path) as old:
        font=helpers.font_profile(old)
        old_pages=len(old)
    attempts=[];removed_blank_pages=[]
    layouts=['natural','joined','compact'] if name=='treatment-journey' else ['natural','compact','tight'] if name=='logistics' else ['natural','compact']
    for layout in layouts:
        data=helpers.render(printable_source(source,layout),html_path.parent,profile=font)
        data,removed_blank_pages=remove_empty_pages(data)
        overflow=known_overflow_pages(data,name)
        with fitz.open(stream=data,filetype='pdf') as current:
            attempts.append({'layout':layout,'pages':len(current),'overflow_pages':[r['page'] for r in overflow]})
        # A joined ending that merely pushes both cards to an extra sheet is
        # readable, but try the bounded spacing pass before accepting it.
        if not overflow and not (layout=='joined' and attempts[-1]['pages']>=attempts[0]['pages']):break
    if overflow:
        raise ValueError((route,name,'reviewed overflow remains after bounded spacing',overflow))
    inspection=helpers.inspect_pdf(data,route+'/'+name)
    with fitz.open(stream=data,filetype='pdf') as current:
        text='\n'.join(page.get_text() for page in current)
        normal=helpers.norm(text)
        missing=[value for value in expected_cells(source) if helpers.norm(value) not in normal]
        if missing:
            raise ValueError((route,name,'missing printed table cells',missing[:12]))
        missing_ending=[value for value in expected_ending_blocks(source,name) if helpers.norm(value) not in normal]
        if missing_ending:
            raise ValueError((route,name,'missing ending instructions or sources',missing_ending[:12]))
        if re.search(r'\bNCCN\b|nccn\.org|the Irish service|the Irish system',text,re.I):
            raise ValueError((route,name,'superseded patient wording remains'))
        geometry=page_geometry(current)
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_bytes(data)
    record={'route':route,'name':name,'source':str(html_path.relative_to(ROOT)),'source_sha256':SHA(source.encode()),'input_sha256':fingerprint,'sha256':SHA(data),'pages':inspection['pages'],'previous_pages':old_pages,'font_profile':font,'bounds':inspection['bounds'],'table_cells_checked':len(expected_cells(source)),'ending_blocks_checked':len(expected_ending_blocks(source,name)),'layout_attempts':attempts,'page_geometry':geometry,'removed_blank_pages':removed_blank_pages,'bytes':len(data)}
    proof.write_text(json.dumps(record,indent=2)+'\n')
    return record

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--previous-root',required=True,type=Path)
    parser.add_argument('--stage',required=True,type=Path)
    parser.add_argument('--report',required=True,type=Path)
    parser.add_argument('--routes',default='all')
    parser.add_argument('--documents',default='all',help='Optional comma-separated document stems for a bounded preview run')
    parser.add_argument('--workers',type=int,default=4)
    parser.add_argument('--resume',action='store_true')
    parser.add_argument('--publish',action='store_true')
    args=parser.parse_args()
    scope=json.loads((ROOT/'validation/patient-design-v08443/scope.json').read_text())['routes']
    routes=scope if args.routes=='all' else args.routes.split(',')
    if any(r not in scope for r in routes):raise ValueError('Unknown authored route')
    css=sorted((ROOT/'assets/patient').rglob('*.css'))
    css_digest=SHA(b''.join(str(p.relative_to(ROOT)).encode()+p.read_bytes() for p in css))
    jobs=[]
    for route in routes:
        for source in sorted((ROOT/'patient'/route).glob('*.html')):
            if not is_target(source.stem):continue
            if args.documents!='all' and source.stem not in args.documents.split(','):continue
            before=args.previous_root/'patient'/route/source.name
            old_pdf=before.with_suffix('.pdf')
            if not old_pdf.exists():continue
            if before.exists() and source.read_bytes()==before.read_bytes():continue
            jobs.append((route,source.stem,str(args.previous_root.resolve()),str(args.stage.resolve()),css_digest,args.resume))
    results=[];errors=[]
    with concurrent.futures.ProcessPoolExecutor(max_workers=args.workers) as pool:
        futures={pool.submit(render_one,job):job[:2] for job in jobs}
        for future in concurrent.futures.as_completed(futures):
            route,name=futures[future]
            try:
                result=future.result();results.append(result)
                print(json.dumps({'done':len(results),'total':len(jobs),'route':route,'document':name,'pages':result['pages']}),flush=True)
            except Exception as exc:
                errors.append({'route':route,'document':name,'error':str(exc)})
                print(json.dumps(errors[-1]),flush=True)
    report={'release':'0.84.44','jobs':len(jobs),'complete':len(results),'errors':errors,'results':sorted(results,key=lambda r:(r['route'],r['name'])),'published':False}
    if not errors and args.publish:
        for row in results:
            staged=args.stage/'patient'/row['route']/(row['name']+'.pdf')
            if SHA(staged.read_bytes())!=row['sha256']:raise ValueError('Staged file changed after verification')
            for base in ['patient','docs/patient']:
                target=ROOT/base/row['route']/(row['name']+'.pdf')
                target.parent.mkdir(parents=True,exist_ok=True)
                shutil.copyfile(staged,target)
        report['published']=True
    args.report.parent.mkdir(parents=True,exist_ok=True)
    args.report.write_text(json.dumps(report,indent=2)+'\n')
    if errors:raise SystemExit(1)

if __name__=='__main__':main()
