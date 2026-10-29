from pathlib import Path
import difflib,json
D=Path(__file__).resolve().parent; root=D.parents[2]; rel='validation/lung-next-v08423/atezo/source-cases.cjs'; s=(root/rel).read_text(); t=s
needle="const out=[];"
t=t.replace(needle,"const currentV26=integrated&&P.metadata.sactcheck_encoding_version==='0.84.26';\nconst expectedChecked=currentV26?'2026-10-29':'2026-10-26';\n"+needle)
t=t.replace("assert.equal(P.metadata.source_checked_date,'2026-10-26');","assert.equal(P.metadata.source_checked_date,expectedChecked);")
t=t.replace("assert.equal(d.renal_input.mode,'exact_continuous');assert.equal(d.renal_input.exact_value_required,true);", "assert.equal(d.renal_input.mode,currentV26&&k==='etoposide_crcl_exact_ml_min'?'source_threshold_numeric':'exact_continuous');assert.equal(d.renal_input.exact_value_required,!(currentV26&&k==='etoposide_crcl_exact_ml_min'));")
old="assert(P.rule_engine.rules.every(r=>r.source.url===P.metadata.source_url&&r.source.checked_date==='2026-10-26'));"
new="""const supplemental=new Map([['ICI_MYOCARDITIS_SUSPECTED','14'],['ICI_PERICARDIAL_SUSPECTED','15'],['ICI_MYOSITIS_STEROID_TAPER_FAILURE','14']]);for(const r of P.rule_engine.rules){assert.equal(r.source.checked_date,expectedChecked,r.id);if(currentV26&&supplemental.has(r.id)){assert.equal(r.source.url,'https://www.ema.europa.eu/en/documents/product-information/tecentriq-epar-product-information_en.pdf',r.id);assert.equal(String(r.source.page),supplemental.get(r.id),r.id);}else assert.equal(r.source.url,P.metadata.source_url,r.id);}if(currentV26)for(const id of supplemental.keys())assert(ids.includes(id),id);"""
assert old in t;t=t.replace(old,new)
(D/'historical-v23-metadata-migration.patch').write_text(''.join(difflib.unified_diff(s.splitlines(True),t.splitlines(True),fromfile='a/'+rel,tofile='b/'+rel)))
