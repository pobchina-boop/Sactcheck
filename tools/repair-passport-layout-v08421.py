"""Narrow, idempotent repair of eight legacy passport instruction/header lines.

No clinical text, form fields, page order or QR content is changed. Original
files are identified by the release's baseline hashes; this script can rerun
on already repaired passports without accumulating edits.
"""
from pathlib import Path
import fitz,json,hashlib,shutil
R=Path(__file__).resolve().parents[1]
O=R/'validation/breast-completion-v08421'
codes=json.loads((O/'scope.json').read_text())['passport_layout_codes']
normal='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
bold='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
instruction='Record the worst symptom in each interval: dates, number of episodes/readings and effect on daily activities. A blank cell means not recorded, not "no symptom".'
rows=[]
for c in codes:
 f=R/f'patient/{c}/passport.pdf';doc=fitz.open(f);changed=0
 before=hashlib.sha256(f.read_bytes()).hexdigest()
 for page in doc:
  spans=[s for b in page.get_text('dict')['blocks'] if 'lines' in b for l in b['lines'] for s in l['spans']]
  bad=[s for s in spans if s['text'].startswith('Record the worst symptom') and s['bbox'][2]>page.rect.width]
  if not bad:continue
  assert not list(page.widgets() or []),'Unexpected form fields: preserve and investigate before repair'
  first=bad[0];others=[s for s in spans if s['text'].startswith('cell means not recorded')]
  assert len(others)==1,(c,page.number)
  # Redact both incomplete source lines, including any content outside the page.
  for s in bad+others:page.add_redact_annot(fitz.Rect(s['bbox'])+(-.1,-.1,.1,.1),fill=(1,1,1))
  header=[s for s in spans if 239<s['bbox'][1]<250]
  if any(s['text'].startswith('Symptom / body') for s in header):
   page.add_redact_annot(fitz.Rect(43,239,552,253),fill=(.89,.95,.95))
  page.apply_redactions(images=0,graphics=0)
  page.insert_font(fontname='RepairRegular',fontfile=normal);page.insert_font(fontname='RepairBold',fontfile=bold)
  spare=page.insert_textbox(fitz.Rect(42,187,553,216),instruction,fontname='RepairRegular',fontsize=9.1,color=(.06,.19,.28),lineheight=1.25)
  assert spare>=0,(c,page.number,spare)
  for s in header:
   is_label=s['text'].startswith('Symptom / body')
   page.insert_text(s['origin'],'Symptoms / body area' if is_label else s['text'],fontname='RepairBold' if is_label else 'RepairRegular',fontsize=7.8 if is_label else s['size'],color=(.06,.19,.28))
  changed+=1
 if changed:
  tmp=f.with_suffix('.repair.pdf');doc.save(tmp,garbage=4,deflate=True);doc.close();tmp.replace(f)
 else:doc.close()
 compat=R/f'docs/patient/{c}/passport.pdf';shutil.copyfile(f,compat)
 with fitz.open(f) as check:
  for p in check:
   for b in p.get_text('blocks'):assert b[0]>=-1 and b[2]<=p.rect.width+1 and b[3]<=p.rect.height+1,(c,p.number,b[:4])
 rows.append(dict(code=c,pages_repaired=changed,before=before,after=hashlib.sha256(f.read_bytes()).hexdigest(),compatibility_identical=f.read_bytes()==compat.read_bytes()))
if any(r['pages_repaired'] for r in rows):(O/'passport-layout-repairs.json').write_text(json.dumps(rows,indent=2)+'\n')
print(f'{len(codes)} passports verified; {sum(r["pages_repaired"] for r in rows)} instruction/header pages repaired.')
