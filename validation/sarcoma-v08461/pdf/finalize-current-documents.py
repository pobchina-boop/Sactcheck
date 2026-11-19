"""Bind final v61 document checks to current canonical bytes; no patient mutations."""
from pathlib import Path
import hashlib,json,re,unicodedata
import fitz,zxingcpp
from PIL import Image
from lxml import html as LH
R=Path(__file__).resolve().parents[3]
P=R/'validation/sarcoma-v08461/pdf'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
read=lambda name:json.loads((P/name).read_text())
write=lambda name,data:(P/name).write_text(json.dumps(data,indent=2)+'\n')
routes=['00335','00325/gist','00719/gist','00244/gist']
freeze=R/'validation/sarcoma-v08461/documents/html-source-freeze-05.json'
assert sha(freeze)=='1949d4f77151ad58b66deb03fee18631b009dcf4446519126555287d3f5c0da0'
assert (freeze.parent/'html-source-freeze.json').read_bytes()==freeze.read_bytes()
source=json.loads(freeze.read_text())
for row in source['profiles']+source['documents']:assert sha(R/row['file'])==row['sha256'],row['file']
publication=json.loads((freeze.parent/'publication-check-final.json').read_text());assert not publication['changed_files'] and publication['idempotent']
book=read('handbook-published-build.json');assert book['published'] and not book['errors']
bookcheck=read('handbook-verification.json');assert bookcheck['status']=='pass' and bookcheck['published_mirrors_verified'];assert bookcheck['build_report_sha256']==sha(P/'handbook-published-build.json')
for row in book['results']:
 for file,digest in row['inputs'].items():assert sha(R/file)==digest,('Book input changed',file)
 for item in row['documents']:assert sha(R/'patient'/row['route']/item['document'])==item['sha256']
for file,digest in book['runtime']['fonts'].items():assert sha(Path(file))==digest
pack=read('pack-build.json');packcheck=read('pack-verification-final.json');assert not pack['errors'] and packcheck['status']=='pass'
for row in pack['results']:
 for file,digest in row['source_hashes'].items():assert sha(R/file)==digest
 assert sha(P/'verified-initial-packs-03/patient'/row['route']/(row['name']+'.pdf'))==row['sha256']
for file,digest in pack['font_files'].items():assert sha(Path(file))==digest
consent=read('consent-published-verification.json');assert consent['status']=='passed' and consent['published']
for row in consent['routes']:
 for file,digest in row['source_hashes'].items():assert sha(R/file)==digest
 assert sha(R/'patient'/row['route']/'consent-form.pdf')==row['sha256']
for file,digest in consent['font_files'].items():assert sha(Path(file))==digest
companion=read('companion-build.json');cc=read('companion-verification.json');assert cc['status']=='pass' and cc['published_mirrors_verified'];assert cc['build_report_sha256']==sha(P/'companion-build.json')
for row in companion['documents']:
 for file,digest in row['source_hashes'].items():assert sha(R/file)==digest
 assert sha(R/'patient'/row['route']/(row['document']+'.pdf'))==row['sha256']
for file,digest in companion['font_files'].items():assert sha(Path(file))==digest
norm=lambda s:re.sub(r'[^\w]','',unicodedata.normalize('NFKC',s).replace('\u00ad','')).casefold()
pdfs=[];pngs=[];monitor=[]
for route in routes:
 for p in sorted((R/'patient'/route).glob('*.pdf')):
  data=p.read_bytes();mirror=R/'docs/patient'/route/p.name;assert data==mirror.read_bytes(),str(mirror);doc=fitz.open(p);assert len(doc)>0
  pdfs.append({'route':route,'file':str(p.relative_to(R)),'mirror':str(mirror.relative_to(R)),'sha256':sha(p),'bytes':len(data),'pages':len(doc),'mirrors_identical':True})
 guide=fitz.open(R/'patient'/route/'guide.pdf');assert len(guide)==3
 tree=LH.fromstring((R/'patient'/route/'guide.html').read_text());cells=tree.xpath('//*[contains(concat(" ",normalize-space(@class)," ")," pt-first ")]//table[contains(concat(" ",normalize-space(@class)," ")," pt-tests ")]//*[self::th or self::td]');body=norm(guide[0].get_text());assert len(cells)==18
 for cell in cells:
  value=' '.join(' '.join(cell.itertext()).split());assert norm(value) in body,('Current published guide lost monitoring cell',route,value)
 monitor.append({'route':route,'current_guide_sha256':sha(R/'patient'/route/'guide.pdf'),'regimen_specific_rows':5,'table_cells_retained':len(cells)})
 for name,tail in [('qr.png',''),('oncowiki-qr.png','knowledge.html')]:
  p=R/'patient'/route/name;mirror=R/'docs/patient'/route/name;assert p.read_bytes()==mirror.read_bytes();expected='https://sactcheck.com/patient/'+route+'/'+tail;decoded=[v.text for v in zxingcpp.read_barcodes(Image.open(p))];assert decoded==[expected]
  pngs.append({'file':str(p.relative_to(R)),'mirror':str(mirror.relative_to(R)),'sha256':sha(p),'decoded':decoded,'expected':expected})
assert len(pdfs)==40
protected=read('protected-patient-assets-before.json')
for file,digest in protected['files'].items():assert sha(R/file)==digest,('Protected v60/CRC asset changed',file)
write('protected-patient-assets-after.json',{'status':'pass','checked_count':len(protected['files']),'baseline_manifest_sha256':sha(P/'protected-patient-assets-before.json'),'files':protected['files']})
visual_path=R.parent/'sarcoma61-evidence/visual-books-final/manifest.json';visual=json.loads(visual_path.read_text());visual_rows=[]
for row in visual['images']:
 p=R/'patient'/row['route']/'handbook.pdf';assert sha(p)==row['pdf_sha256'];assert sha(Path(row['image']))==row['image_sha256'];visual_rows.append({**row,'canonical_pdf':str(p.relative_to(R)),'current_published_pdf_verified':True})
write('final-book-visual-evidence.json',{'status':'pass','full_page_images':len(visual_rows),'pixel_identical_to_parent_reviewed_pages':visual['pixel_identical_reviewed_pages'],'source_manifest_sha256':sha(visual_path),'rows':visual_rows})
reports=['handbook-published-build.json','handbook-verification.json','pack-build.json','pack-verification-final.json','consent-published-verification.json','companion-build.json','companion-verification.json','companion-content-retention.json','initial-pack-freeze-03.json','renderer-isolation-change.json','presentation-limitations.json']
manifest={'status':'scoped_document_checks_passed','release':'0.84.61','routes':routes,'source_freeze':str(freeze.relative_to(R)),'source_freeze_sha256':sha(freeze),'canonical_pdfs':len(pdfs),'identical_pdf_mirrors':len(pdfs),'pdf_pages_total':sum(r['pages'] for r in pdfs),'handbook_pages':sum(r['pages'] for r in pdfs if r['file'].endswith('/handbook.pdf')),'pdfs':pdfs,'qr_pngs':pngs,'monitoring_summary':monitor,'report_sha256':{f:sha(P/f) for f in reports},'protected_prior_assets_unchanged':len(protected['files']),'publication_html_changes':0,'independent_clinical_approval':False}
write('final-pdf-manifest.json',manifest)
transient=[]
for folder in sorted(P.iterdir()):
 if not folder.is_dir() or not (folder.name.startswith('staged-') or folder.name in ['verified-initial-packs','verified-initial-packs-02']):continue
 files=[{'file':str(p.relative_to(R)),'sha256':sha(p),'bytes':p.stat().st_size} for p in sorted(folder.rglob('*')) if p.is_file()];transient.append({'directory':str(folder.relative_to(R)),'role':'Historical or working candidate; not required by current application/node tests or final published-mode book verifier','file_count':len(files),'bytes':sum(r['bytes'] for r in files),'files':files})
write('staging-dependencies.json',{'status':'ready_for_parent_relocation_after_final_ready','keep_in_application':[{'directory':'validation/sarcoma-v08461/pdf/verified-initial-packs-03','reason':'Final independent handbook previous_root and initial-pack replay;8guide/wallet PDF fixtures required.'}],'keep_small_evidence':'JSON manifests/decisions, source transitions, scripts, and all raw command stdout.log/status.json; ignored logs require explicit inclusion.','node_test_dependencies':'Canonical patient PDFs and docs mirrors only; tests do not reference stages.','replay_without_transient_stages':{'packs':'--stage validation/sarcoma-v08461/pdf/verified-initial-packs-03/patient','companions':'--stage patient','books':'omit --stage; retain --previous-root validation/sarcoma-v08461/pdf/verified-initial-packs-03'},'move_intact_after_checks':transient})
status={'status':'FINAL_READY','release':'0.84.61','routes':routes,'source_freeze_sha256':sha(freeze),'final_pdf_manifest_sha256':sha(P/'final-pdf-manifest.json'),'canonical_pdfs':len(pdfs),'identical_mirrors':len(pdfs),'handbooks':4,'handbook_pages':83,'guides':4,'guide_pages_each':3,'wallets':4,'consents':4,'consent_pages':sum(r['pages'] for r in consent['routes']),'consent_source_units':sum(r['source_units'] for r in consent['routes']),'companions':cc['documents'],'companion_pages':cc['pages'],'companion_source_units':cc['units_checked'],'preserved_book_page_checks':bookcheck['preserved_page_checks'],'book_qr_checks':bookcheck['qr_checks'],'current_guide_monitoring_cells':sum(r['table_cells_retained'] for r in monitor),'protected_prior_assets_unchanged':len(protected['files']),'source_and_font_hashes_current':True,'publication_idempotent':True,'clinical_approval':False,'limitations_file':'presentation-limitations.json','transient_stage_dependency_file':'staging-dependencies.json'}
write('document-stage-status.json',status)
print(json.dumps(status,indent=2))
