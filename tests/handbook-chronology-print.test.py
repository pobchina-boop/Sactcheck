"""Run with the managed authoring Python environment; no tracked outputs change."""
from pathlib import Path
import importlib.util,re,unittest
from lxml import html
from weasyprint import HTML,CSS
import pymupdf

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('handbooks',ROOT/'tools/build-patient-handbooks-v08433.py')
handbooks=importlib.util.module_from_spec(spec);spec.loader.exec_module(handbooks)

class PrintableChronologyTest(unittest.TestCase):
 def test_actual_chart_preserves_text_and_day_coverage(self):
  tree=html.fromstring((ROOT/'patient/00555/knowledge.html').read_text())
  chart=tree.xpath('//*[@class="wiki-cycle-chart"]')[0]
  original=[(row[0].text_content(),row[1].text_content()) for row in chart if 'wiki-cycle-track' in row.get('class','')]
  handbooks.printable_chronology(tree)
  table=tree.xpath('//table[@class="wiki-cycle-print-table"]')[0]
  self.assertEqual(len(table.xpath('./thead/tr/th')),15)
  for row,(label,instruction) in zip(table.xpath('./tbody/tr'),original):
   self.assertEqual(row.xpath('./th/span[@class="wiki-cycle-print-label-text"]')[0].text_content(),label)
   self.assertIn(instruction,row.text_content())
   self.assertEqual(sum(int(cell.get('colspan','1')) for cell in row),15)
  early=table.xpath('./tbody/tr[@data-cycle-track="early"]')[0]
  self.assertEqual(early.xpath('./th/span[@class="wiki-cycle-print-instruction"]')[0].text_content(),'Tell the nurse immediately')
  self.assertEqual(early.xpath('./td[@class="wiki-cycle-print-band"]')[0].get('colspan'),'1')
  self.assertEqual(early.xpath('./td[@class="wiki-cycle-print-band"]')[0].text_content(),'Day 1')

 def test_continuations_repeat_the_axis_and_never_split_a_label_from_its_band(self):
  # Deliberately use a small page and tall, individually labelled rows. This
  # forces continuation and detects the old grid-label fragmentation defect.
  rows=''.join('<div class="wiki-cycle-track" data-cycle-track="row{0}"><span class="wiki-cycle-label">Label {0}</span><span class="wiki-cycle-band variable" style="grid-column:2 / 5">Instruction {0}</span></div>'.format(i) for i in range(8))
  tree=html.fromstring('<html><body><div class="wiki-cycle-chart"><div class="wiki-cycle-axis"><span>Day of cycle</span><span>1</span><span>2</span><span>3</span></div>'+rows+'</div></body></html>')
  handbooks.printable_chronology(tree)
  pdf=HTML(string=html.tostring(tree,encoding='unicode')).write_pdf(stylesheets=[CSS(string=handbooks.PRINT),CSS(string='@page{size:A6;margin:10mm}.wiki-cycle-print-table tbody tr{height:25mm}')])
  document=pymupdf.open(stream=pdf,filetype='pdf')
  self.assertGreater(len(document),1)
  pages=[page.get_text() for page in document]
  for i in range(8):
   label_pages=[n for n,text in enumerate(pages) if f'Label {i}\n' in text]
   instruction_pages=[n for n,text in enumerate(pages) if f'Instruction {i}\n' in text]
   self.assertEqual(label_pages,instruction_pages)
   self.assertEqual(len(label_pages),1)
   self.assertIn('Day of cycle',pages[label_pages[0]],'continued chart must repeat its day axis')

 def test_bound_reference_uses_only_the_handbook_global_folio(self):
  source=HTML(string='<html><body><p>Complete clinical reference content</p></body></html>')
  standalone=pymupdf.open(stream=source.write_pdf(stylesheets=[CSS(string=handbooks.PRINT)]),filetype='pdf')
  bound=pymupdf.open(stream=source.write_pdf(stylesheets=[CSS(string=handbooks.PRINT),handbooks.BOUND_FOLIO]),filetype='pdf')
  self.assertTrue(re.search(r'\n1\s*$',standalone[0].get_text()))
  self.assertNotRegex(bound[0].get_text(),r'\n1\s*$')
  self.assertIn('Complete clinical reference content',bound[0].get_text())

 def test_consolidated_book_retains_clinical_content_and_exact_anatomy_and_cards(self):
  import hashlib,json,gzip
  # Keep the historical extraction proof: the v43 preservation routine must
  # still recover the six non-reference source sections without changing their
  # body pixels. The user subsequently authorised v44 consolidation, so the
  # current book is tested against that structure below, not concatenated PDFs.
  spec43=importlib.util.spec_from_file_location('patient_documents43',ROOT/'tools/build-patient-documents-v08443.py')
  current_builder=importlib.util.module_from_spec(spec43);spec43.loader.exec_module(current_builder)
  baseline='67aaa3579794278074478b3f6cce4e57c803e4db'
  source=current_builder.baseline_file(baseline,'patient/00555/handbook.pdf')
  self.assertIsNotNone(source,'The explicit pinned baseline must be available')
  original=pymupdf.open(stream=source,filetype='pdf')
  sections=current_builder.node('model','00555')['sections']
  preserved,proof=current_builder.old_sections(source,sections)
  self.assertEqual(len(preserved),7)
  self.assertEqual(len([name for name in preserved if name!='knowledge.pdf']),6)
  self.assertTrue(all(row['original_body_streams_retained'] for row in proof))
  toc=original.get_toc()
  for index,section in enumerate(sections):
   name=section['document']
   if name=='knowledge.pdf':continue
   first=toc[index][2]-1;last=toc[index+1][2]-1 if index+1<len(toc) else len(original)
   self.assertEqual(len(preserved[name]),last-first)
   for offset,page in enumerate(preserved[name]):
    baseline_page=original[first+offset];clip=pymupdf.Rect(0,0,page.rect.width,page.rect.height-25)
    self.assertEqual(page.get_pixmap(clip=clip).samples,baseline_page.get_pixmap(clip=clip).samples,
                     f'{name} page {offset+1}: body artwork and text must remain pixel-identical')
    self.assertNotIn(f'Handbook {first+offset+1} / {len(original)}',page.get_text())

  spec_guard=importlib.util.spec_from_file_location('patient_document_guard43',ROOT/'tools/verify-patient-documents-v08443.py')
  guard=importlib.util.module_from_spec(spec_guard);spec_guard.loader.exec_module(guard)
  spec_content=importlib.util.spec_from_file_location('patient_document_content44',ROOT/'tools/verify-patient-documents-v08444.py')
  content=importlib.util.module_from_spec(spec_content);spec_content.loader.exec_module(content)
  report_path=ROOT/'validation/head-neck-v08445/books-unaffected-build.json.gz'
  raw_report=gzip.decompress(report_path.read_bytes())
  report=json.loads(raw_report)
  verified=json.loads(gzip.decompress((ROOT/'validation/head-neck-v08445/books-unaffected-verification.json.gz').read_bytes()))
  self.assertEqual(report['release'],'0.84.45')
  self.assertEqual(verified['status'],'pass')
  self.assertEqual(verified['build_report_sha256'],hashlib.sha256(raw_report).hexdigest())
  self.assertTrue(verified['published_mirrors_verified'],'Check final published PDFs, not only a staged build')
  rows=[row for row in report['results'] if row['route']=='00555']
  self.assertEqual(len(rows),1)
  row=rows[0]
  current=pymupdf.open(ROOT/'patient/00555/handbook.pdf')
  reference=pymupdf.open(ROOT/'patient/00555/knowledge.pdf')
  guide=pymupdf.open(ROOT/'patient/00555/guide.pdf')
  for document in row['documents']:
   path=ROOT/'patient/00555'/document['document']
   self.assertEqual(hashlib.sha256(path.read_bytes()).hexdigest(),document['sha256'],
                    document['document']+' must match the final build record')
  self.assertEqual(len(current),row['handbook_pages'])
  self.assertGreater(len(current),3,'The full handbook remains distinct from the three-page distilled pack')
  chapters=['Understanding your treatment','Your schedule, tests and appointments',
            'Symptoms and supportive care','Your record and contact card','Sources and further information']
  top=[entry for entry in current.get_toc() if entry[0]==1]
  self.assertEqual([entry[1] for entry in top],chapters)
  self.assertEqual(top,[[1,entry['title'],entry['page']] for entry in row['contents']])
  self.assertEqual([entry[2] for entry in top],sorted(set(entry[2] for entry in top)),
                   'Each chapter starts on its own page, in contents order')
  for _,title,page in top:
   self.assertIn(guard.norm(title),guard.norm(current[0].get_text()),'One opening contents list names every chapter')
   self.assertIn(guard.norm(title),guard.norm(current[page-1].get_text()),'Contents points to the actual chapter heading')
  for number,page in enumerate(current,1):
   self.assertIn(f'Handbook {number} / {len(current)}',page.get_text())

  # Use pinned Git bytes, not the freshly generated guide or the report itself,
  # as the independent source for detailed anatomy and contact/wallet content.
  original_guide=pymupdf.open(stream=current_builder.baseline_file(baseline,'patient/00555/guide.pdf'),filetype='pdf')
  original_card=pymupdf.open(stream=current_builder.baseline_file(baseline,'patient/00555/sactcard.pdf'),filetype='pdf')
  self.assertEqual(len(guide),3)
  self.assertEqual(len(original_guide),3)
  for number in [2,3]:
   guard.compare_page(original_guide[number-1],guide[number-1],f'Distilled guide page {number}',exact_streams=True)
  self.assertEqual(row['anatomy']['mode'],'Original unscaled anatomical page')
  self.assertEqual(row['anatomy']['source_page'],2)
  anatomy_page=row['anatomy_page'];wallet_page=row['wallet_page']
  self.assertTrue(top[2][2]<=anatomy_page<top[3][2]<=wallet_page<top[4][2])
  for name,document in [('handbook.pdf',current),('knowledge.pdf',reference)]:
   guard.compare_page(original_guide[1],document[anatomy_page-1],name+' complete detailed anatomical page')
   anatomy_matches=[i+1 for i,page in enumerate(document)
                    if guard.contiguous(guard.stream_hashes(original_guide[1]),guard.stream_hashes(page))]
   self.assertEqual(anatomy_matches,[anatomy_page],name+' must include the complete anatomical page exactly once')
  self.assertEqual(row['wallet']['pages'],len(original_card))
  self.assertLessEqual(wallet_page+len(original_card),top[4][2])
  for offset,page in enumerate(original_card):
   bound=current[wallet_page-1+offset]
   guard.compare_page(page,bound,f'Contact/wallet page {offset+1}')
   dimensions=guard.card_dimensions(page)
   self.assertTrue(dimensions,'The baseline wallet card must expose its physical card dimensions')
   self.assertEqual(guard.card_dimensions(bound),dimensions)
  self.assertEqual(guard.source_sequence(original_card,current,0,len(current)),[wallet_page-1],
                   'The complete unscaled contact/wallet document appears exactly once')

  # The consolidated narrative may omit duplicate pages, never unique clinical
  # statements. Remove generated folios and use only the explicit approved
  # full-name/acronym equivalents: chapter reordering can move the first-use
  # expansion. Numeric values and all clinical qualifiers remain literal.
  def narrative(document):
   return content.norm(''.join(re.sub(r'\b(?:Handbook|Reference)\s+\d+\s*/\s*\d+\b','',page.get_text()) for page in document))
  text=narrative(current)
  self.assertNotIn('yourcompletereference',text)
  self.assertNotIn('readwhatyouneedwhenyouneedit',text)
  units=row['clinical_content']['unique_source_inventory']
  self.assertTrue(units,'A nonempty audited source inventory is required')
  for unit in units:
   self.assertEqual(hashlib.sha256(content.norm(unit['text']).encode()).hexdigest(),unit['sha256'])
   self.assertIn(content.norm(unit['text']),text,'Unique clinical statement omitted: '+unit['text'])
  # Independent regimen-specific fixtures retain dose/timing, rescue limits,
  # pump precautions and urgent advice even if the composition audit changes.
  essential=[
   'On Day 1, irinotecan 165 mg/m² is infused over 90 minutes, followed by oxaliplatin 85 mg/m² and folinic acid 200 mg/m² over two hours. Fluorouracil 3,200 mg/m² is then delivered continuously over 48 hours. This regimen has no fluorouracil bolus. The team confirms your prescribed doses and disconnection time.',
   'Irinotecan delayed-diarrhoea rescue must be supplied as a written prescription: loperamide 4 mg initially, then 2 mg every 2 hours until 12 hours after the last liquid stool, for no longer than 48 hours at this high-dose schedule. Fever, dehydration, severe pain or persistent diarrhoea needs urgent oncology assessment. Do not carry this schedule into capecitabine treatment without a new prescription.',
   'The pump runs for approximately 48 hours from connection. Keep the device and line secure and dry as taught. The team confirms the actual disconnection appointment. Call for a leaking, disconnected or unexpectedly stopped pump. Do not reconnect, alter settings or disconnect it yourself unless specifically trained and instructed.',
   'There are no guaranteed “safe days”. Act on fever, sudden illness or a new serious symptom whenever it occurs. Do not wait for the next appointment.',
  ]
  for statement in essential:
   for name,document in [('handbook.pdf',current),('knowledge.pdf',reference)]:
    self.assertIn(content.norm(statement),narrative(document),name+' clinical instruction omitted: '+statement)
  source_data=json.loads((ROOT/'data/patient-knowledge/00555.json').read_text())
  cea=[item for item in source_data['monitoring_test_details'] if item['label']=='Carcinoembryonic antigen (CEA) — colorectal plans']
  self.assertEqual(len(cea),1)
  self.assertEqual(cea[0]['scope'],'conditional')
  for key in ['label','timing','purpose','detail']:
   self.assertIn(content.norm(cea[0][key]),text,'CEA guidance must retain its conditional scope, purpose and timing')

if __name__=='__main__':unittest.main()
