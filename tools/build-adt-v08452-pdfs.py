"""Scoped v0.84.52 companion PDF rendering; stage all documents before publishing."""
from pathlib import Path
import argparse, hashlib, importlib.util, json, logging, re, shutil, tempfile, unicodedata
import fitz
from lxml import html as LH
from weasyprint import HTML as BaseHTML, CSS as BaseCSS
from weasyprint.text.fonts import FontConfiguration
R=Path(__file__).resolve().parents[1]
PRESENTATION=json.loads((R/'data/patient-presentation-v08431.json').read_text())['routes']
SCOPE=json.loads((R/'validation/adt-v08452/scope.json').read_text())
CODES=SCOPE['codes']
ROUTES=SCOPE['clinical_routes']
RETRO_ROUTES=SCOPE['retrospective_patient_routes']
for route in RETRO_ROUTES:PRESENTATION.setdefault(route,'data/patient-knowledge-contexts/'+route+'.json' if '/' in route else 'data/patient-knowledge/'+route+'.json')
FONT_CONFIG=FontConfiguration()
FONTS={'DejaVu':['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'], 'Liberation':['/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf','/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'], 'Nimbus':['/usr/share/fonts/opentype/urw-base35/NimbusSans-Regular.otf','/usr/share/fonts/opentype/urw-base35/NimbusSans-Bold.otf']}
def font_css(profile=None):
 rules=[]
 for family,paths in FONTS.items():
  for weight,name in zip([400,700],paths):
   p=Path(name)
   if not p.is_file():raise FileNotFoundError(p)
   aliases=[family+' Sans']+(['Arial','Helvetica'] if family=='Nimbus' else [])
   for alias in aliases:rules.append('@font-face{font-family:"'+alias+'";src:url("'+p.as_uri()+'");font-weight:'+str(weight)+';font-style:normal}')
 if profile:rules.append('*{font-family:"'+profile+' Sans"!important}')
 return ''.join(rules)
def CSS(*args,**kwargs):
 kwargs['font_config']=FONT_CONFIG
 return BaseCSS(*args,**kwargs)
class HTML(BaseHTML):
 def __init__(self,*args,**kwargs):
  self.source_name=str(kwargs.get('filename') or kwargs.get('base_url') or '')
  super().__init__(*args,**kwargs)
 def write_pdf(self,*args,**kwargs):
  profile='DejaVu' if Path(self.source_name).stem in ['guide','sactcard'] else None
  kwargs['font_config']=FONT_CONFIG
  kwargs['stylesheets']=list(kwargs.get('stylesheets') or [])+[CSS(string=font_css(profile))]
  return super().write_pdf(*args,**kwargs)
def phases(route):
 code,*context=route.split('/')
 if not context:return json.loads((R/'data/phase-support-v0838.json').read_text())['regimens'][code]
 for suffix in ['v08452','v08447','v08446','v08445','v08442','v08441','v08440','v08436','v08435','v08434','v08425']:
  path=R/('data/phase-support-contexts-'+suffix+'.json')
  if path.exists():
   value=json.loads(path.read_text()).get('regimens',{}).get(code,{}).get(context[0])
   if value:return value
 raise ValueError((route,'no authored phase-support context'))

def norm(s):return re.sub(r'\s+','',unicodedata.normalize('NFKC',s).replace('\u00ad','')).casefold()
def inspect(data,label):
 with fitz.open(stream=data,filetype='pdf') as doc:
  for i,p in enumerate(doc):
   if not p.get_text().strip():raise ValueError((label,i,'empty page'))
   for w in p.get_text('words'):
    if w[0]<-1 or w[1]<-1 or w[2]>p.rect.width+1 or w[3]>p.rect.height+1:raise ValueError((label,i,'bounds',w))
  return {'pages':len(doc),'text':''.join(p.get_text() for p in doc),'fonts':sorted({f[3] for p in doc for f in p.get_fonts()})}
def render(route,name,source,stage):
 p=R/'patient'/route/(source+'.html');text=p.read_text()
 text=re.sub(r'<line class="(chemo|immune)"',lambda m:'<line stroke="'+('#a94022' if m[1]=='chemo' else '#682b9f')+'" stroke-width=".42"'+(' stroke-dasharray="1.4 .9"' if m[1]=='chemo' else '')+' class="'+m[1]+'"',text)
 old=p.with_name(name+'.pdf');profile=None
 if old.exists():
  fonts=inspect(old.read_bytes(),str(old))['fonts']
  if any('DejaVuSans' in f for f in fonts) and not any('LiberationSans' in f or 'NimbusSans' in f for f in fonts):profile='DejaVu'
  elif any('LiberationSans' in f for f in fonts):profile='Liberation'
 if name=='consent-form' and profile is None:profile='Liberation'
 styles=[] if 'class="ps-body' in text else [CSS(filename=str(R/'assets/patient/pdf-layout-v0838.css'))]
 if profile:styles.append(CSS(string=font_css(profile)))
 # Keep every source unit and the authored type size. Let adjacent journey
 # sections flow instead of forcing an almost empty investigation tail page.
 layout_overrides=''
 if name=='treatment-journey':layout_overrides='@media print{.monitoring-schedule + .treatment-journey,.journey-print .journey-checks{break-before:auto!important}.journey-print .journey-header{break-after:avoid}}'
 # No inherited out-of-scope 00328 layout exception is applied in this batch.
 if layout_overrides:styles.append(CSS(string=layout_overrides))
 data=HTML(string=text,base_url=str(p)).write_pdf(stylesheets=styles);info=inspect(data,route+'/'+name)
 if name=='consent-form':
  sheets=LH.fromstring(text).xpath('//*[contains(concat(" ",normalize-space(@class)," ")," consent-sheet ")]')
  if len(sheets)!=1 or info['pages']!=1 or norm(sheets[0].text_content())!=norm(info['text']):raise ValueError((route,'consent must retain entire source on one page'))
 dest=stage/route/(name+'.pdf');dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
 inputs={p,Path(__file__)}
 for href in LH.fromstring(text).xpath('//link[@rel="stylesheet"]/@href'):
  if not href.startswith(('https:','http:')):
   linked=(p.parent/href.split('?')[0]).resolve()
   if linked.is_file():inputs.add(linked)
 for image_name in ['qr.png','oncowiki-qr.png']:
  if (p.parent/image_name).exists():inputs.add(p.parent/image_name)
 inputs.add(R/'assets/patient/pdf-layout-v0838.css')
 return dict(renderer_layout_overrides=layout_overrides,source_hashes={str(f.relative_to(R)):hashlib.sha256(f.read_bytes()).hexdigest() for f in sorted(inputs)},route=route,document=name,pages=info['pages'],fonts=info['fonts'],font_profile=profile or 'explicit family aliases; retain authored families',before_sha256=hashlib.sha256(old.read_bytes()).hexdigest() if old.exists() else None,sha256=hashlib.sha256(data).hexdigest(),source_sha256=hashlib.sha256(p.read_bytes()).hexdigest(),bounds_pass=True)
def main():
 parser=argparse.ArgumentParser();parser.add_argument('--routes',required=True);parser.add_argument('--stage',type=Path,required=True);parser.add_argument('--report',type=Path,required=True);parser.add_argument('--documents');parser.add_argument('--publish',action='store_true');a=parser.parse_args();selected=a.routes.split(',')
 if set(selected)-set(ROUTES):parser.error('Outside clinical v48 routes')
 logging.getLogger('weasyprint').setLevel(logging.ERROR);rows=[];stage=a.stage;stage.mkdir(parents=True,exist_ok=True)
 for route in selected:
  names=['consent-form','passport','logistics','supportive-care','treatment-journey']+(["treatment-timeline"] if (R/'patient'/route/'treatment-timeline.html').exists() else [])+(["port-pump"] if (R/'patient'/route/'port-pump.html').exists() else [])+['support-'+p['id'] for p in phases(route)]
  for name in (a.documents.split(',') if a.documents else names):
   if name not in names:raise ValueError((route,name,'outside authored companion scope'))
   source='supportive-care-overview' if name=='supportive-care' else name
   rows.append(render(route,name,source,stage));print(route,name,rows[-1]['pages'],'staged',flush=True)
 import importlib.metadata
 report={'status':'rendered_requires_final_independent_verification','documents':rows,'renderer':{n:importlib.metadata.version(n) for n in ['weasyprint','pymupdf','pydyf']},'font_files':{p:hashlib.sha256(Path(p).read_bytes()).hexdigest() for paths in FONTS.values() for p in paths}}
 a.report.parent.mkdir(parents=True,exist_ok=True);a.report.write_text(json.dumps(report,indent=2)+'\n')
 if a.publish:
  for row in rows:
   for base in ['patient','docs/patient']:
    dest=R/base/row['route']/(row['document']+'.pdf');dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(stage/row['route']/(row['document']+'.pdf'),dest)
if __name__=='__main__':main()
