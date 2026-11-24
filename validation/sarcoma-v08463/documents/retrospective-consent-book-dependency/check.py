from pathlib import Path
import hashlib, importlib.util, inspect, json, sys, os
root=Path('/workspace/scratch/5f030e9fb533/Sactcheck')
out=Path(__file__).parent
os.environ['SACTCHECK_COMPANION_AUDIT']=str(root/'validation/sarcoma-v08462/pdf/companion-content-retention.json')
spec=importlib.util.spec_from_file_location('v62book',root/'tools/build-patient-documents-v08462.py')
m=importlib.util.module_from_spec(spec);sys.modules[spec.name]=m;spec.loader.exec_module(m)
b=m.b44;b.COMPANION_AUDIT=root/'validation/sarcoma-v08462/pdf/companion-content-retention.json'
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
baseline=json.loads((root/'validation/sarcoma-v08463/baseline-v62-working-files.json').read_text())
report_path=root/'validation/sarcoma-v08462/pdf/handbook-build.json'
report=json.loads(report_path.read_text());assert sha(report_path)==baseline[str(report_path.relative_to(root))]['sha256']
original_text=Path.read_text;original_bytes=Path.read_bytes;accessed=[]
def read_text(p,*args,**kwargs):
    if p.is_relative_to(root):
        rel=str(p.relative_to(root));accessed.append(rel);assert '/consent-form.' not in rel and '/consent.html' not in rel,rel
    return original_text(p,*args,**kwargs)
def read_bytes(p,*args,**kwargs):
    if p.is_relative_to(root):
        rel=str(p.relative_to(root));accessed.append(rel);assert '/consent-form.' not in rel and '/consent.html' not in rel,rel
    return original_bytes(p,*args,**kwargs)
results=[]
for row in report['results']:
    route=row['route'];accessed.clear();Path.read_text=read_text;Path.read_bytes=read_bytes
    try:
        model,profile,profile_path=b.read_profile(route)
        companions=b.companion_plan(route)
        printed,proof=b.build_reading_body(route,model,profile,companions)
    finally:Path.read_text=original_text;Path.read_bytes=original_bytes
    inputs=sorted(set(accessed));assert inputs
    other_functions={name:inspect.getsource(getattr(b,name)) for name in ['build_guide','anatomy_document','records_document']}
    for text in other_functions.values():assert 'consent-form' not in text and 'consent.html' not in text
    pdfs={}
    for prefix in ['patient','docs/patient']:
        for name in ['guide.pdf','sactcard.pdf','knowledge.pdf','handbook.pdf']:
            f=f'{prefix}/{route}/{name}';assert sha(root/f)==baseline[f]['sha256'];pdfs[f]=baseline[f]['sha256']
    results.append({'route':route,'broad_historical_fingerprint_includes_consent_html':any('/consent-form.html' in f for f in row['inputs']),
      'rendered_body_accessed_no_consent_files':True,'actual_source_reads':inputs,'reading_body_sha256':hashlib.sha256(printed.encode()).hexdigest(),
      'other_assembly_functions_sha256':{k:hashlib.sha256(v.encode()).hexdigest() for k,v in other_functions.items()},
      'historical_contents':row['contents'],'preserved_pdfs':pdfs})
value={'status':'passed','release':'0.84.63','historical_build_report':str(report_path.relative_to(root)),'historical_build_report_sha256':sha(report_path),
 'finding':'The old builder broadly fingerprints every route HTML, including separate consent forms. Its actual body rendering does not read those forms; companion source names exclude them. The remaining assembly reads guides, passport/records and wallet assets. Consent-only restoration therefore changes the broad cache fingerprint but not material consumed by the old books. Historical reports are retained without repinning.',
 'routes':results,'pdfs_preserved':sum(len(x['preserved_pdfs']) for x in results),'pdfs_regenerated':0}
(out/'result.json').write_text(json.dumps(value,indent=2)+'\n');print(json.dumps({'status':value['status'],'routes':len(results),'pdfs_preserved':value['pdfs_preserved'],'pdfs_regenerated':0}))
