from pathlib import Path
from collections import Counter
import hashlib,json,re,unicodedata,sys,subprocess
import pymupdf as fitz

base=Path(sys.argv[1] if len(sys.argv)>1 else '/workspace/Sactcheck')
fresh=Path(sys.argv[2] if len(sys.argv)>2 else '/tmp/sactcheck-mobile-dev-pdf')
out=Path(sys.argv[3]) if len(sys.argv)>3 else base/'validation/mobile-next-batch/pdf'
out.mkdir(parents=True,exist_ok=True)
subprocess.run(['git','-C',str(base),'diff','--exit-code','0906fc73338de99a9b9ed65a12922691852652f2','--','patient','docs'],check=True,stdout=subprocess.DEVNULL)
scope=json.loads((fresh/'validation/colorectal-v08433/scope.json').read_text())['presentation_routes']
def norm(s):
    return re.sub(r'\s+','',unicodedata.normalize('NFKC',s)).replace('\u00ad','')
def tokens(s):
    return Counter(re.findall(r'\w+',unicodedata.normalize('NFKC',s).replace('\u00ad','').lower()))
rows=[]
for code in scope:
    for file in sorted((fresh/'patient'/code).glob('*.pdf')):
        old=base/'patient'/code/file.name
        with fitz.open(old) as a,fitz.open(file) as b:
            ta=''.join(p.get_text() for p in a);tb=''.join(p.get_text() for p in b)
            old_fonts=sorted({f[3] for p in a for f in p.get_fonts()})
            new_fonts=sorted({f[3] for p in b for f in p.get_fonts()})
            dims_a=[list(p.rect) for p in a];dims_b=[list(p.rect) for p in b]
            old_toc=a.get_toc();new_toc=b.get_toc()
            row=dict(code=code,file=file.name,old_pages=len(a),fresh_pages=len(b),same_page_count=len(a)==len(b),same_page_dimensions=dims_a==dims_b,same_normalized_text=norm(ta)==norm(tb),same_word_multiset=tokens(ta)==tokens(tb),same_toc_labels=[x[1] for x in old_toc]==[x[1] for x in new_toc],old_fonts=old_fonts,fresh_fonts=new_fonts,sha256_equal=hashlib.sha256(old.read_bytes()).digest()==hashlib.sha256(file.read_bytes()).digest())
            if tokens(ta)!=tokens(tb):
                row['word_deltas']={'removed':list((tokens(ta)-tokens(tb)).items())[:30],'added':list((tokens(tb)-tokens(ta)).items())[:30]}
            rows.append(row)
report=dict(baseline_commit='0906fc73338de99a9b9ed65a12922691852652f2',scope='Existing v0.84.33 scoped assets; no new clinical batch completion is claimed.',documents=len(rows),same_page_count=sum(x['same_page_count'] for x in rows),same_dimensions=sum(x['same_page_dimensions'] for x in rows),same_normalized_text=sum(x['same_normalized_text'] for x in rows),same_word_multiset=sum(x['same_word_multiset'] for x in rows),same_toc_labels=sum(x['same_toc_labels'] for x in rows),byte_identical=sum(x['sha256_equal'] for x in rows),rows=rows)
(out/'previous-release-comparison.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='rows'},indent=2))
print('Discrepancies:')
for row in rows:
    if not all(row[k] for k in ('same_page_count','same_page_dimensions','same_word_multiset','same_toc_labels')):print(json.dumps(row))
