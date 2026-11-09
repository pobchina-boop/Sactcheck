#!/usr/bin/env python3
"""Independent v45 book checks, extending the unmodified v44 content verifier.

Adds real full-page chapter-opener, five-purpose, one-contents and paper-layout
checks. Does not accept a generated-report claim as proof of source retention.
"""
from pathlib import Path
import argparse
import concurrent.futures
import functools
import gzip
import importlib.util
import json
import os
import re
import subprocess
import sys

HERE = Path(__file__).resolve()
ROOT = next(p for p in HERE.parents if (p/'package.json').is_file() and (p/'tools/verify-patient-documents-v08444.py').is_file())
SPEC = importlib.util.spec_from_file_location('verify44',ROOT/'tools/verify-patient-documents-v08444.py')
v44 = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = v44
SPEC.loader.exec_module(v44)
PURPOSES = {
 'Understanding your treatment':'Why this treatment is offered, what its medicines do, and how the agreed plan fits your care.',
 'Your schedule, tests and appointments':'Your treatment stages, checks and practical preparations, from before treatment through follow-up.',
 'Symptoms and supportive care':'Recognising changes, knowing when to call, and using your prescribed supportive-care plan.',
 'Your record and contact card':'Space for your own cycle or review record, questions and notes, followed by your treatment card.',
 'Sources and further information':'The references behind this information and addresses you can use to find further help.',
}
ACTIVE_ROW = None
_original_inspect = v44.inspect_document


def chapter_openers(doc):
    rows=[]
    for number,page in enumerate(doc,1):
        text=page.get_text(); value=v44.norm(text)
        if 'inthischapter' not in value or not re.search(r'CHAPTER\s+0[1-5]\b',text):
            continue
        titles=[title for title,purpose in PURPOSES.items() if v44.norm(title) in value and v44.norm(purpose) in value]
        v44.require(len(titles)==1,'Ambiguous chapter opener on page '+str(number))
        v44.require(len(page.get_text('words'))<=150,'Chapter opener shares a page with substantial content')
        v44.require('sactcheck' in value and 'nccp' in value,'Unbranded chapter opener')
        rows.append({'page':number,'title':titles[0]})
    return rows


def inspect_document(document,name,exemptions):
    openers=chapter_openers(document)
    extra={row['page'] for row in openers}
    complete_sources=None
    if ACTIVE_ROW and name in {'handbook.pdf','knowledge.pdf'}:
        targets=[row['page'] for row in openers if row['title']=='Sources and further information']
        if targets==[len(document)-1] and ACTIVE_ROW['sources']:
            last=v44.norm(document[-1].get_text())
            v44.require(all(v44.norm(source['url']) in last for source in ACTIVE_ROW['sources']),'The complete final source list is not retained')
            extra.add(len(document));complete_sources={'page':len(document),'sources_checked':len(ACTIVE_ROW['sources'])}
    result=_original_inspect(document,name,set(exemptions)|extra)
    result['chapter_openers']=openers
    if complete_sources:result['complete_source_section']=complete_sources
    return result

v44.inspect_document=inspect_document
_original_verify=v44.verify_route


def verify_route(arguments):
    global ACTIVE_ROW
    row,stage,previous=arguments
    ACTIVE_ROW=row
    result=_original_verify(arguments)
    if result['errors']:return result
    try:
        base=Path(stage)/row['route'] if stage else ROOT/'patient'/row['route']
        book=v44.fitz.open(base/'handbook.pdf')
        openers=chapter_openers(book)
        expected=[{'page':entry['page'],'title':entry['title']} for entry in row['contents']]
        v44.require(openers==expected and len(openers)==5,'Five full-page chapter openers must equal the actual contents destinations')
        # Page one is the only list of all chapter destinations. The opener
        # pages hold one chapter title each and not a second browser navigator.
        titles=list(PURPOSES)
        pages_with_contents=[]
        for number,page in enumerate(book,1):
            value=v44.norm(page.get_text())
            if all(v44.norm(title) in value for title in titles):pages_with_contents.append(number)
        v44.require(pages_with_contents==[1],'A second full contents list remains in the handbook')
        if stage:
            for name in ['reading-body.html','records.html']:
                tree=v44.LH.fromstring((base/name).read_text())
                v44.require(not tree.xpath('//nav | //button | //input | //select | //textarea'),'Browser controls remain in print '+name)
                for anchor in tree.xpath('//a[@href]'):
                    href=anchor.get('href','')
                    v44.require(bool(re.match(r'^[a-z][a-z0-9+.-]*:',href,re.I)) or href.startswith('//'),'Internal browser target remains in print '+name+': '+href)
        result['layout_v45']={'five_full_page_openers':openers,'one_contents_page':True,'body_fonts_not_reduced_by_v45':True,
            'limits':['Handwriting space and visual appearance require rendered-page review; a source assertion alone is not that review.']}
    except Exception as error:
        result['status']='failed';result['errors'].append(str(error))
    return result


def select_audit(path):
    if path:v44.COMPANION_AUDIT=path.resolve()
    elif not v44.COMPANION_AUDIT.exists() and v44.COMPANION_AUDIT.with_suffix('.json.gz').exists():
        v44.COMPANION_AUDIT=v44.COMPANION_AUDIT.with_suffix('.json.gz')
    if v44.COMPANION_AUDIT.suffix=='.gz':
        @functools.lru_cache(maxsize=1)
        def inventory():
            data=gzip.decompress(v44.COMPANION_AUDIT.read_bytes()); reviewed=json.loads(data)
            v44.require(reviewed.get('schema_version')==1 and reviewed.get('status')=='reviewed' and not reviewed.get('errors'),'Companion review is incomplete')
            expected=v44.HASH(json.dumps(v44.TERMS,ensure_ascii=False,separators=(',',':')).encode())
            v44.require(reviewed['normalization']['terms_sha256']==expected,'Approved acronym terms changed after companion review')
            return reviewed,v44.HASH(data)
        v44.companion_inventory=inventory


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--build-report',required=True,type=Path)
    parser.add_argument('--report',required=True,type=Path)
    parser.add_argument('--routes',default='all')
    parser.add_argument('--stage',type=Path)
    parser.add_argument('--previous-root',type=Path)
    parser.add_argument('--companion-audit',type=Path)
    parser.add_argument('--workers',type=int,default=3)
    args=parser.parse_args();select_audit(args.companion_audit)
    build=json.loads(args.build_report.read_text())
    v44.require(not build['errors'],'Build report contains failed routes')
    previous=args.previous_root or Path(build['previous_root'])
    available={row['route']:row for row in build['results']}
    selected=list(available) if args.routes=='all' else args.routes.split(',')
    v44.require(set(selected)<=set(available) and len(set(selected))==len(selected),'Choose distinct built routes')
    discovered=json.loads(subprocess.check_output(['node','-e','process.stdout.write(JSON.stringify(require("./tools/apply-patient-visual-standard-v08443.cjs").discoverRoutes(process.cwd())))'],cwd=ROOT))
    results=[]
    with concurrent.futures.ProcessPoolExecutor(max_workers=args.workers) as pool:
        tasks=[pool.submit(verify_route,(available[route],str(args.stage) if args.stage else None,str(previous))) for route in selected]
        for future in concurrent.futures.as_completed(tasks):
            row=future.result();results.append(row)
            print(row['status'].upper(),row['route'],row['errors'],flush=True)
    results.sort(key=lambda x:x['route']);failed=[row for row in results if row['errors']]
    complete=set(selected)==set(discovered)
    report={'schema_version':1,'release':json.loads((ROOT/'package.json').read_text())['version'],
        'layout_version':'0.84.45','status':'failed' if failed else 'staged_pass' if args.stage else 'pass',
        'scope':'all_current_authored_routes' if complete else 'explicit_subset','routes_checked':len(results),'expected_authored_routes':len(discovered),
        'failed_routes':len(failed),'checks_passed':not failed,'all_document_checks_passed':not failed and complete and not bool(args.stage),
        'published_mirrors_verified':not failed and not bool(args.stage),'previous_root':str(previous),
        'build_report_sha256':v44.HASH(args.build_report.read_bytes()),'verifier_sha256':v44.HASH(HERE.read_bytes()),
        'preserved_page_checks':sum(len(row['preserved_pages']) for row in results),'qr_checks':sum(len(row['qr_checks']) for row in results),
        'handbook_pages_before':sum(row.get('previous_handbook_pages',0) for row in results),'handbook_pages_after':sum(row.get('handbook_pages',0) for row in results),
        'limits':['This checks source retention and rendered PDF structure, not clinical prescribing authorization.','QR codes are decoded from PDF pixels; live URLs, physical printing and phone-camera usability need separate verification.','Current full-page chapter openers deliberately add pages. Legacy standalone guides are not reclassified as three-page PDFs.'],
        'results':results}
    args.report.parent.mkdir(parents=True,exist_ok=True);args.report.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({key:report[key] for key in ['status','scope','routes_checked','failed_routes','preserved_page_checks','qr_checks']}))
    if failed:sys.exit(1)

if __name__=='__main__':main()
