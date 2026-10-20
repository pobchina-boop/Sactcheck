#!/usr/bin/env python3
"""Replace local patient contact text in existing PDFs while retaining clinical pages and QR images."""
import fitz, re, json, hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PHONE=re.compile(r'087\s*181\s*9645|021\s*492\s*(?:2000|2324)')
FONTS={False:'/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',True:'/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'}
font_objects={bold:fitz.Font(fontfile=file) for bold,file in FONTS.items()}
out=ROOT/'validation/interface-v0844/contact-pdf-changes.json'
report=json.loads(out.read_text()) if out.exists() else []
by_path={item['path']:item for item in report}
cache={}
for base in ['patient','docs/patient']:
 for path in sorted((ROOT/base).rglob('*.pdf')):
  old=path.read_bytes(); sha=hashlib.sha256(old).hexdigest()
  if sha in cache:
   new,changes=cache[sha]
   if changes:path.write_bytes(new);report.append({'path':str(path.relative_to(ROOT)),'before':sha,'after':hashlib.sha256(new).hexdigest(),'changes':changes,'duplicate':True})
   continue
  doc=fitz.open(stream=old,filetype='pdf');changes=[]
  for page in doc:
   text=page.get_text()
   if not PHONE.search(text):continue
   spans=[s for b in page.get_text('dict')['blocks'] for line in b.get('lines',[]) for s in line['spans']]
   edits=[]
   for span in spans:
    old_text=span['text'];new_text=PHONE.sub('Insert numbers here',old_text)
    if 'CUH' in new_text:new_text=new_text.replace('CUH contact plan','Your contact plan').replace('CUH AOS:','Oncology:').replace('CUH ·','Local ·')
    if new_text==old_text:continue
    rect=fitz.Rect(span['bbox']);bold='bold' in span['font'].lower();font=font_objects[bold];size=span['size']
    # Keep the original baseline and at least the original allocated width.
    # Extra whitespace is used only before the next span on this same line.
    right=page.rect.width-24
    for other in spans:
     o=fitz.Rect(other['bbox'])
     if o.x0>=rect.x1-0.1 and o.y0<rect.y1 and o.y1>rect.y0 and other is not span:right=min(right,o.x0-3)
    wanted=font.text_length(new_text,fontsize=size)
    available=max(rect.width,right-rect.x0)
    if wanted>available:
     new_text=new_text.replace('Insert numbers here','Insert number');wanted=font.text_length(new_text,fontsize=size)
    size=min(size,size*available/wanted) if wanted else size
    if size<min(5,span['size'])*0.98:raise ValueError(f'Contact placeholder would be too small: {path}, {page.number}, {new_text}')
    # White fill is restricted to the original glyph rectangle; graphics remain.
    # Adjacent line bounding boxes can overlap; redact the centre of this
    # line to remove its glyphs without deleting characters on the next line.
    glyph_strip=fitz.Rect(rect.x0+0.1,rect.y0+rect.height*.22,rect.x1-0.1,rect.y1-rect.height*.22)
    page.add_redact_annot(glyph_strip,fill=False,cross_out=False)
    edits.append((span,new_text,bold,size))
   if edits:
    page.apply_redactions(images=0,graphics=0)
    for span,new_text,bold,size in edits:
     name='ContactBold' if bold else 'ContactRegular';page.insert_font(fontname=name,fontfile=FONTS[bold])
     rgb=tuple(((span['color']>>shift)&255)/255 for shift in [16,8,0])
     page.insert_text(fitz.Point(span['origin']),new_text,fontname=name,fontsize=size,color=rgb)
     changes.append({'page':page.number+1,'old':span['text'],'new':new_text,'font_size':round(size,2),'bbox':span['bbox']})
   for link in page.get_links():
    if re.search(r'353871819645|353214922000|353214922324',link.get('uri','')):page.delete_link(link)
  if changes:
   new=doc.tobytes(garbage=4,deflate=True)
   check=fitz.open(stream=new,filetype='pdf')
   if any(PHONE.search(page.get_text()) for page in check):raise ValueError(f'Contact survived: {path}')
   assert len(check)==len(doc)
   path.write_bytes(new);report.append({'path':str(path.relative_to(ROOT)),'before':sha,'after':hashlib.sha256(new).hexdigest(),'changes':changes})
  else:new=old
  cache[sha]=(new,changes)
# Preserve the original baseline when re-run after a generator refreshed an asset.
for item in report:
 original=by_path.get(item['path'])
 if original and original is not item:item['before']=original['before']
 by_path[item['path']]=item
report=list(by_path.values())
out.write_text(json.dumps(report,indent=2))
print(json.dumps({'updated_pdf_files':len(report),'unique_sources':sum(not x.get('duplicate') for x in report),'audit':str(out)}))
