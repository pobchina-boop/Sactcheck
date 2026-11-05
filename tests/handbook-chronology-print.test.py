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

 def test_existing_non_reference_sections_keep_their_page_content_and_drawings(self):
  filename=ROOT/'patient/00555/handbook.pdf';original=pymupdf.open(filename)
  names=['guide.pdf','knowledge.pdf','treatment-journey.pdf','supportive-care.pdf','logistics.pdf','passport.pdf','sactcard.pdf']
  toc=original.get_toc();sections=[(entry[1],name) for entry,name in zip(toc,names)]
  preserved,proof=handbooks.existing_handbook_sections(filename,sections)
  self.assertEqual(len(preserved),6)
  self.assertTrue(all(row['non_folio_text_preserved'] for row in proof))
  for index,(_,name) in enumerate(sections):
   if name=='knowledge.pdf':continue
   first=toc[index][2]-1;last=toc[index+1][2]-1 if index+1<len(toc) else len(original)
   self.assertEqual(len(preserved[name]),last-first)
   for offset,page in enumerate(preserved[name]):
    baseline=original[first+offset];clip=pymupdf.Rect(0,0,page.rect.width,page.rect.height-25)
    self.assertEqual(page.get_pixmap(clip=clip).samples,baseline.get_pixmap(clip=clip).samples,
                     f'{name} page {offset+1}: body artwork and text must remain pixel-identical')
    self.assertNotIn(f'Handbook {first+offset+1} / {len(original)}',page.get_text())

if __name__=='__main__':unittest.main()
