from pathlib import Path
import json,hashlib
h=Path(__file__).resolve().parent;a=json.load(open(h/'authoring.json'))['regimens'];docs=[];notes=[]
for code,num,drug,brand,ver,pages in [('00219','219','erlotinib','tarceva','6',5),('00220','220','gefitinib','iressa','5',4)]:
 p=json.load(open(h/f'proposed/{code}-{drug}-monotherapy.json'));notes.append(p['metadata']['source_version_note'])
 for stem,url,label,pg in [(num,p['metadata']['source_url'],f'NCCP {code} version {ver}',f'1 eligibility/schedule; 2 dose tables and monitoring; 3–{pages} support, complications, references/version history'),(brand,f'https://www.ema.europa.eu/en/documents/product-information/{brand}-epar-product-information_en.pdf','EMA current '+brand+' product information','Sections 4.2–4.6; 5.1 trial tables; package leaflet')]:
  docs.append(dict(label=label,url=url,retrieved='2026-10-29',local_pdf=f'research/{stem}.pdf',pdf_sha256=hashlib.sha256((h/f'research/{stem}.pdf').read_bytes()).hexdigest(),local_text=f'research/{stem}.txt',text_sha256=hashlib.sha256((h/f'research/{stem}.txt').read_bytes()).hexdigest(),page_references=pg,visual_inspection=f'research/{num}-table.png'if stem==num else None))
for d in docs:
 if 'iressa' in d['url']:d['product_information_last_updated']='2023-07-17';d['ema_page_last_updated']='2026-10-19';d['version_note']='The 19 October 2026 EPAR page update concerns procedural history; the product-information link remains last updated 17 July 2023.'
 if 'tarceva' in d['url']:d['product_information_last_updated']='2025-03-05'
trials={s['url']:s for x in a.values()for s in x['patient']['sources']if s['id'] not in ['nccp','smpc']}
(h/'sources.json').write_text(json.dumps(dict(checked='2026-10-29',retrieval='Fresh official NCCP and EMA PDFs; pdftotext; page-2 dose-table PNGs visually inspected. Fresh primary trial web searches.',documents=docs,supplemental_and_trials=list(trials.values()),source_version_notes=notes),indent=2)+'\n')
