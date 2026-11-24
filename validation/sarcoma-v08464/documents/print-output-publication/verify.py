from pathlib import Path
from lxml import html
import hashlib,json,re,copy
ROOT=Path(__file__).parent
manifest=json.loads((ROOT/'manifest.json').read_text())
CSS=['patient-visual-standard-v08443.css','patient-visual-language-v08444.css']
def url(value):
    return re.sub(r'^(?:\.\./)+(assets|js|data)/',r'\1/',value)
def space(value):return re.sub(r'\s+',' ',value or '').strip()
def tree(source):
    t=html.fromstring(source)
    for c in t.xpath('//comment()'):c.getparent().remove(c)
    sheets=[]
    for link in list(t.xpath('//head/link')):
        if any(link.get('href','').split('?')[0].endswith('/'+name) for name in CSS):
            sheets.append(sorted((k,url(v) if k=='href' else v) for k,v in link.attrib.items()));link.getparent().remove(link)
    assert len(sheets)==2
    body=t.find('body');marker=body.attrib.pop('data-patient-visual-standard',None);assert marker in [None,'v08443']
    for node in t.iter():
        for k in ['href','src']:
            if k in node.attrib:node.set(k,url(node.get(k)))
    return t,sheets,marker
def nodes(t):
    return [(t.getroottree().getpath(n),n.tag,sorted(n.attrib.items()),space(n.text),space(n.tail)) for n in t.iter()]
def visible(source):
    t=html.fromstring(source)
    for n in t.xpath('//style|//script|//head'):n.getparent().remove(n)
    return re.findall(r'\S+',' '.join(t.itertext()))
results=[]
for r in manifest['files']:
    before=(ROOT/'before'/r['file']).read_bytes();after=(ROOT/'after'/r['file']).read_bytes()
    assert hashlib.sha256(before).hexdigest()==r['before_sha256'];assert hashlib.sha256(after).hexdigest()==r['after_sha256']
    a,sa,ma=tree(before);b,sb,mb=tree(after);assert sa==sb;assert ma is None and mb=='v08443'
    an,bn=nodes(a),nodes(b)
    if an!=bn:
        diff=[{'before':x,'after':y} for x,y in zip(an,bn) if x!=y];(ROOT/'unexpected-dom-difference.json').write_text(json.dumps({'file':r['file'],'before_nodes':len(an),'after_nodes':len(bn),'first_differences':diff[:5]},indent=2));raise AssertionError(r['file']+' unexpected DOM change')
    assert visible(before)==visible(after),r['file']+' visible word sequence changed'
    results.append({**r,'all_visible_words_unchanged':True,'all_dom_elements_attributes_text_and_svg_coordinates_unchanged_after_exact_publication_normalization':True,'normalized_dom_nodes':len(an)})
(ROOT/'dom-text-proof.json').write_text(json.dumps({'status':'passed','permitted_changes':['Two unchanged stylesheet links moved to canonical publication order','Exact body visual-standard marker added','HTML/SVG serialization only','Compatibility assets/js/data URL rebasing to the same canonical root paths'],'files':results},indent=2)+'\n')
print('Exact10-file visible-word/DOM/attribute/SVG-coordinate proof passed.')
