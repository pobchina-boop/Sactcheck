from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import subprocess,json,hashlib,fitz
from PIL import Image,ImageDraw
R=Path(__file__).resolve().parents[4];H=R/'validation/targeted-lung-v08425/taxanes';OUT=H/'research/pdf-qa';OUT.mkdir(parents=True,exist_ok=True)
jobs=[(c,p) for c in ['00203','00226'] for p in sorted((R/'patient'/c/'lung').glob('*.pdf'))]
def render(t):
 c,p=t;prefix=OUT/(c+'-'+p.stem)
 for f in OUT.glob(prefix.name+'-*.png'):f.unlink()
 subprocess.run(['pdftoppm','-scale-to','1600','-png',str(p),str(prefix)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 d=fitz.open(p);(OUT/(prefix.name+'.txt')).write_text('\n'.join(page.get_text() for page in d));return {'path':str(p.relative_to(R)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'pages':len(d),'renders':[str(f.relative_to(R)) for f in sorted(OUT.glob(prefix.name+'-*.png'))]}
with ThreadPoolExecutor(max_workers=4) as e:records=list(e.map(render,jobs))
pages=[p for x in records for p in x['renders']]
for i in range(0,len(pages),4):
 canvas=Image.new('RGB',(2300,3300),'#d7dde4');draw=ImageDraw.Draw(canvas)
 for j,p in enumerate(pages[i:i+4]):
  im=Image.open(R/p);im.thumbnail((1130,1590));x=(j%2)*1150+10;y=(j//2)*1650+40
  canvas.paste(im,(x,y));draw.text((x,y-25),Path(p).name,fill='black')
 canvas.save(OUT/f'contact-{i//4+1:02}.png')
(OUT/'manifest.json').write_text(json.dumps({'pdfs':records,'pages':len(pages)},indent=2)+'\n');print('Rendered',len(jobs),'PDFs;',len(pages),'pages;',(len(pages)+3)//4,'contact sheets')
