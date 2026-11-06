"""Integrate explicitly reviewed skin-completion profiles; preserve other contexts."""
from pathlib import Path
import copy
import html
import json
import qrcode

R = Path(__file__).resolve().parents[1]
O = R / 'validation/skin-melanoma-v08442'
V = '0.84.42'

def read(p):
    return json.loads((R / p).read_text())

def save(p, data):
    p = R / p
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')

scope = read(O / 'scope.json')
presentation = read('data/patient-presentation-v08431.json')
journeys = read('data/breast-treatment-journeys-v0837.json')
anatomy_file = R / 'js/patient-anatomy-data-v08431.js'
anatomy = json.loads(anatomy_file.read_text().split('=', 1)[1].rstrip(';\n'))
registry_file = R / 'js/patient-asset-registry-v0810.js'
registry = registry_file.read_text()
new_definitions = []

for route in scope['presentation_routes']:
    code, *ctx = route.split('/')
    context = ctx[0] if ctx else ''
    source_profile = O / 'patient-content/profiles' / (route + '.json')
    d = json.loads(source_profile.read_text())
    protocol_path = next((R / 'protocols').rglob(code + '-*.json'))
    protocol = read(protocol_path)
    assert d['code'] == code and d['suite_release'] == V, route
    assert d['patient_summary']['template_version'] == V, route
    assert len(d['anatomy']) >= 8 and len(d['chapters']) >= 8, route
    assert d.get('patient_context', '') == context, route
    d['protocol_id'] = protocol['protocol_id']
    d['protocol_version'] = protocol['metadata']['nccp_version']
    d['patient_context_selector'] = False
    profile = ('data/patient-knowledge-contexts/' + route + '.json'
               if context else 'data/patient-knowledge/' + code + '.json')
    save(profile, d)
    presentation['routes'][route] = profile
    presentation['legacy_layout_fields'].pop(route, None)
    ms = d['monitoring_schedule']
    journeys[route.replace('/', ':')] = {
        'code': code, 'title': d['title'] + ': treatment and checks', 'release': V,
        'checked': '2026-11-06', 'status': d['review_status'],
        'schedule_type': 'relative-educational', 'has_patient_dates': False,
        'setting': d['context_label'], 'summary': d['schedule_summary'],
        'stages': ms['columns'],
        'lanes': [dict(label=row['label'], kind='monitoring', cells=row['cells'],
                       source_ids=[code], note=ms.get('note', '')) for row in ms['rows']],
        'milestones': [dict(title=p['label'], when=p.get('short', 'According to the treatment plan'),
                            why=d['purpose'], clinical=p['detail'],
                            action='Confirm the current phase, prescription, tests and support medicines.',
                            source_ids=[code]) for p in d['phases']],
        'clinical_notes': [ms.get('note', '')],
        'sources': [dict(s, id=code if s['id'] == 'nccp' else s['id']) for s in d['sources']],
    }
    if not context:
        anatomy[code] = {'code': code, 'anatomy': d['anatomy']}
    for base in ['patient', 'docs/patient']:
        (R / base / route).mkdir(parents=True, exist_ok=True)
    for name, suffix in [('qr.png', ''), ('oncowiki-qr.png', 'knowledge.html')]:
        qr = qrcode.make('https://sactcheck.com/patient/' + route + '/' + suffix)
        for base in ['patient', 'docs/patient']:
            qr.save(R / base / route / name)
    if "'" + code + "':" not in registry:
        definition = dict(title=d['title'], guide=True, passport=True, sactCard=True,
                          knowledge=True, consentDraft=True, supportiveCare=True,
                          phaseSupport=True, longitudinal=True)
        if code == '00535':
            definition.update(contextOnly=True, patientContexts=['merkel_cell'],
                              scopeGuard=True, scope='Merkel cell skin cancer only; other shared indications require separate information')
        new_definitions.append("    '" + code + "':" + json.dumps(definition, ensure_ascii=False) + ',')
    if code == '00535':
        # The root is a context selector, never a second disease-specific patient pack.
        stub = copy.deepcopy(d)
        stub.update(patient_context_selector=True, patient_context='', title='Avelumab: choose the treatment context')
        save('data/patient-knowledge/00535.json', stub)

save('data/patient-presentation-v08431.json', presentation)
save('data/breast-treatment-journeys-v0837.json', journeys)
anatomy_file.write_text('globalThis.SACTCheckAnatomyData=' + json.dumps(anatomy, ensure_ascii=False, separators=(',', ':')) + ';\n')
if new_definitions:
    registry = registry.replace('const DEFINITIONS=Object.freeze({', 'const DEFINITIONS=Object.freeze({\n' + '\n'.join(new_definitions))
registry = registry.replace("const RELEASE='0.84.41'", "const RELEASE='0.84.42'")
registry = registry.replace("const CONTENT_RELEASE='0.84.41'", "const CONTENT_RELEASE='0.84.42'")
if "Object.freeze(['00535','00551','00483'" not in registry:
    registry = registry.replace("const CONTEXT_CODES=Object.freeze(['00483'", "const CONTEXT_CODES=Object.freeze(['00535','00551','00483'")
needle = "    if(code==='00415')return ['advanced','adjuvant'].includes(selected)?selected:'';"
if "if(code==='00535')return" not in registry:
    registry = registry.replace(needle,
        "    if(code==='00535')return ['merkel_cell','skin','skin/melanoma','skin_melanoma'].includes(selected)?'merkel_cell':'';\n"
        "    if(code==='00551')return ['melanoma','skin','skin/melanoma','skin_melanoma'].includes(selected)?'melanoma':(['colorectal','gastrointestinal'].includes(selected)?'colorectal':'');\n" + needle)
if "if(d.code==='00551')return" not in registry:
    registry = registry.replace("    if(d.code==='00415')return", "    if(d.code==='00535')return [d.code+'/merkel_cell'];\n    if(d.code==='00551')return [d.code,d.code+'/melanoma'];\n    if(d.code==='00415')return", 1)
needle = "      if(MELANOMA_CODES.includes(def.code))return"
if "if(def.code==='00535')return" not in registry:
    registry = registry.replace(needle,
        "      if(def.code==='00535')return `patient/${def.code}/merkel_cell/${CONTEXT_ASSETS[asset]}`;\n"
        "      if(def.code==='00551')return `patient/${def.code}/${selected==='melanoma'?'melanoma/':''}${CONTEXT_ASSETS[asset]}`;\n" + needle)
registry_file.write_text(registry)

updates = read(O / 'patient-content/phase-support-updates.json')
support = read('data/phase-support-v0838.json')
support['regimens'].update(updates['regimens'])
save('data/phase-support-v0838.json', support)
save('data/phase-support-contexts-v08442.json', {'release': V, 'regimens': updates['context_regimens']})

selector = R / 'assets/patient/context-selector-v08425.js'
s = selector.read_text()
if "'merkel_cell/'" not in s:
    s = s.replace("['melanoma_advanced/'", "['melanoma/','merkel_cell/','melanoma_advanced/'")
selector.write_text(s)

for code, title, description, choices, other in [
    ('00535', 'avelumab', 'The treatment purpose and eligibility depend on the cancer being treated.',
     [('merkel_cell', 'merkel_cell/', 'Merkel cell skin cancer', 'The authored patient suite is for the current NCCP Merkel cell indication after previous chemotherapy.')],
     'Avelumab also has urothelial and renal treatment contexts. This skin-cancer pack does not cover those plans; ask your team for the matching information.'),
    ('00551', 'nivolumab 3 mg/kg and ipilimumab 1 mg/kg', 'Confirm the cancer and treatment phase. This dosing schedule is distinct from the nivolumab 1 mg/kg / ipilimumab 3 mg/kg melanoma protocol.',
     [('colorectal', './', 'Colorectal cancer after chemotherapy', 'Open the existing dMMR/MSI-H colorectal treatment information.'),
      ('melanoma', 'melanoma/', 'Advanced melanoma', 'Open the melanoma information, including the specific consent requirements for this dosing schedule.')],
     'The renal-cancer context requires its own matching patient information and is not covered by these two packs.'),
]:
    esc = html.escape
    cards = ''.join('<article><h2>' + esc(label) + '</h2><p>' + esc(detail) + '</p><a data-context="' + ctx + '" data-route="' + route + '" href="' + route + '">Open this patient information</a></article>' for ctx, route, label, detail in choices)
    page = '<!doctype html><html lang="en-IE"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Confirm treatment context · ' + esc(title) + '</title><style>body{font:18px/1.6 system-ui;color:#173b48;background:#f0f6f7;margin:0}main{max-width:760px;margin:auto;padding:24px}article{background:white;padding:24px;margin:18px 0;border-radius:12px}a{color:#07666c}</style></head><body><main><a href="../../">SACTCheck home</a><h1>Confirm your ' + esc(title) + ' treatment</h1><p>' + esc(description) + '</p>' + cards + '<article><h2>Another treatment setting</h2><p>' + esc(other) + '</p></article><p>Public reference; independent clinical review pending. Your treating team confirms your plan.</p></main><script src="../../assets/patient/context-selector-v08425.js"></script></body></html>'
    for base in ['patient', 'docs/patient']:
        (R / base / code).mkdir(exist_ok=True, parents=True)
        (R / base / code / 'scope.html').write_text(page)
        if code == '00535':
            (R / base / code / 'index.html').write_text(page)

print('Integrated seven skin-completion routes; retained existing colorectal and other shared contexts.')
