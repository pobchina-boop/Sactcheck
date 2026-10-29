from pathlib import Path
import subprocess,concurrent.futures,json,hashlib
from PIL import Image,ImageOps,ImageDraw
R=Path(__file__).resolve().parents[4];Q=Path(__file__).resolve().parent/'pdf-qa';Q.mkdir(exist_ok=True)
pdfs=[p for c in ['00221','00565'] for p in sorted((R/'patient'/c).glob('*.pdf'))]
def render(p):
 name=p.parent.name+'-'+p.stem;out=Q/name
 for old in Q.glob(name+'-*.png'):old.unlink()
 subprocess.run(['pdftoppm','-scale-to','1800','-png',str(p),str(out)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 pages=sorted(Q.glob(name+'-*.png'));return dict(path=str(p.relative_to(R)),sha256=hashlib.sha256(p.read_bytes()).hexdigest(),pages=[str(f.relative_to(R)) for f in pages],page_count=len(pages))
with concurrent.futures.ThreadPoolExecutor(max_workers=4)as ex:docs=list(ex.map(render,pdfs))
for code in ['00221','00565']:
 pages=[(d['path'],p)for d in docs if '/'+code+'/'in d['path'] for p in d['pages']]
 for group in range(0,len(pages),4):
  tilew,tileh=720,1060;sheet=Image.new('RGB',(tilew*2,tileh*2),'#d1d5db');draw=ImageDraw.Draw(sheet)
  for j,(doc,page)in enumerate(pages[group:group+4]):
   im=Image.open(R/page).convert('RGB');im.thumbnail((tilew-16,tileh-40));x=(j%2)*tilew+(tilew-im.width)//2;y=(j//2)*tileh+32;sheet.paste(im,(x,y));draw.text(((j%2)*tilew+8,(j//2)*tileh+8),Path(doc).name+' / '+Path(page).stem.split('-')[-1],fill='black')
  sheet.save(Q/f'contact-{code}-{group//4+1}.png')
(Q/'render-manifest.json').write_text(json.dumps(docs,indent=2)+'\n')
print(len(docs),'PDFs',sum(d['page_count'] for d in docs),'pages',len(list(Q.glob('contact*.png'))),'sheets')
