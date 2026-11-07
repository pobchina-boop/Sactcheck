"""Independently check refreshed ancillary PDFs against their current HTML."""
from pathlib import Path
import argparse, concurrent.futures, hashlib, json, re
import fitz
from lxml import html as LH

ROOT=Path(__file__).resolve().parents[1]
SHA=lambda b:hashlib.sha256(b).hexdigest()

def normal(text):
    return re.sub(r'[^a-z0-9]','',text.lower())

def pixel_signature(pix):
    if pix.colorspace is None:return None
    if pix.colorspace.n!=3:pix=fitz.Pixmap(fitz.csRGB,pix)
    if pix.alpha:pix=fitz.Pixmap(pix,0)
    return (pix.width,pix.height,SHA(pix.samples))

def qr_locations(doc,wanted):
    found=[]
    for i,page in enumerate(doc):
        for item in page.get_images(full=True):
            sig=pixel_signature(fitz.Pixmap(doc,item[0]))
            if sig not in wanted:continue
            for rect in page.get_image_rects(item[0]):
                found.append({'page':i+1,'pixels':sig,'width_pt':round(rect.width,3),'height_pt':round(rect.height,3)})
    return found

def verify(job):
    row,stage,previous,published=job
    route,name=row['route'],row['name']
    source=ROOT/row['source'];pdf=Path(stage)/'patient'/route/(name+'.pdf')
    assert SHA(source.read_bytes())==row['source_sha256'],str(source)+' source changed'
    assert SHA(pdf.read_bytes())==row['sha256'],str(pdf)+' PDF changed'
    tree=LH.fromstring(source.read_text())
    expected=[]
    for cell in tree.xpath('//td|//th'):
        chain=[cell,*cell.iterancestors()]
        if any(set((e.get('class') or '').split())&{'no-print','screen-only','scv-screen-downloads'} for e in chain):continue
        value=' '.join(cell.text_content().split())
        if normal(value):expected.append(value)
    with fitz.open(pdf) as doc:
        text='\n'.join(p.get_text() for p in doc);body=normal(text)
        missing=[value for value in expected if normal(value) not in body]
        assert not missing,(route,name,'missing source table cells',missing[:12])
        assert not re.search(r'\bNCCN\b|nccn\.org|(?:the|long) Irish (?:service|system|leaflet)',text,re.I),(route,name,'superseded wording')
        sparse=[]
        for i,page in enumerate(doc):
            words=page.get_text('words');assert words,(route,name,i+1,'empty page')
            for word in words:assert word[0]>=-1 and word[1]>=-1 and word[2]<=page.rect.width+1 and word[3]<=page.rect.height+1,(route,name,i+1,'text outside page',word)
            if len(doc)>1 and len(words)<100 and max(w[3] for w in words)<page.rect.height*.65:
                sparse.append({'page':i+1,'words':len(words),'occupied_bottom_fraction':round(max(w[3] for w in words)/page.rect.height,3),'text':page.get_text()[:1500]})
        wanted=set()
        for leaf in ['qr.png','oncowiki-qr.png']:
            image=ROOT/'patient'/route/leaf
            if image.exists():wanted.add(pixel_signature(fitz.Pixmap(str(image))))
        with fitz.open(Path(previous)/'patient'/route/(name+'.pdf')) as old:
            old_qr=qr_locations(old,wanted);new_qr=qr_locations(doc,wanted)
        def qkey(q):return(q['pixels'],q['width_pt'],q['height_pt'])
        assert sorted(map(qkey,old_qr))==sorted(map(qkey,new_qr)),(route,name,'QR pixels or physical size changed',old_qr,new_qr)
        if published:
            for prefix in ['patient','docs/patient']:
                target=ROOT/prefix/route/(name+'.pdf')
                assert SHA(target.read_bytes())==row['sha256'],str(target)+' published mirror differs'
        return {'route':route,'document':name,'sha256':row['sha256'],'pages':len(doc),'table_cells_checked':len(expected),'qr_images_checked':len(new_qr),'sparse_page_candidates':sparse}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--build-report',required=True,type=Path)
    parser.add_argument('--stage',required=True,type=Path)
    parser.add_argument('--previous-root',required=True,type=Path)
    parser.add_argument('--report',required=True,type=Path)
    parser.add_argument('--workers',type=int,default=3)
    args=parser.parse_args();built=json.loads(args.build_report.read_text())
    assert not built['errors'] and built['complete']==built['jobs'],'Incomplete ancillary PDF build'
    rows=[];errors=[]
    with concurrent.futures.ProcessPoolExecutor(max_workers=args.workers) as pool:
        futures={pool.submit(verify,(row,str(args.stage),str(args.previous_root),built['published'])):row for row in built['results']}
        for future in concurrent.futures.as_completed(futures):
            row=futures[future]
            try:rows.append(future.result())
            except Exception as exc:errors.append({'route':row['route'],'document':row['name'],'error':str(exc)})
    result={'release':'0.84.44','complete':len(rows),'expected':built['jobs'],'errors':errors,'table_cells_checked':sum(r['table_cells_checked'] for r in rows),'qr_images_checked':sum(r['qr_images_checked'] for r in rows),'sparse_page_candidates':sum(len(r['sparse_page_candidates']) for r in rows),'results':sorted(rows,key=lambda r:(r['route'],r['document']))}
    args.report.parent.mkdir(parents=True,exist_ok=True);args.report.write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({k:result[k] for k in ['complete','expected','errors','table_cells_checked','qr_images_checked','sparse_page_candidates']}))
    if errors:raise SystemExit(1)

if __name__=='__main__':main()
