"""Retention, source-attribution and schedule safeguards for the authored content."""
from pathlib import Path
import hashlib
import json

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
checks = []


def read(path):
    return json.loads(path.read_text())


def check(name, condition):
    checks.append({'check': name, 'passed': bool(condition)})
    assert condition, name


def strings(value):
    if isinstance(value, str):
        yield value
    elif isinstance(value, list):
        for item in value:
            yield from strings(item)
    elif isinstance(value, dict):
        for item in value.values():
            yield from strings(item)


def source_uses(value):
    if isinstance(value, dict):
        for key, item in value.items():
            if key.endswith('source_ids'):
                yield from item
            else:
                yield from source_uses(item)
    elif isinstance(value, list):
        for item in value:
            yield from source_uses(item)


profiles = {n: read(ROOT / f'data/patient-knowledge/{n}.json') for n in ('00216', '00692')}
kb = {p['protocol_id'][5:10]: p for p in read(ROOT / 'data/regimen-knowledge-base-v08436-addendum.json')['regimen_profiles']}
support = read(HERE / 'phase-support-updates.json')['regimens']
changes = []
for n, p in profiles.items():
    old = read(HERE / 'before' / f'{n}.json')
    check(n + ' original anatomy object and all pin text retained exactly', p['anatomy'] == old['anatomy'])
    check(n + ' full authored timeline retained exactly', p['timeline'] == old['timeline'])
    check(n + ' phase source IDs all resolve', set(source_uses(p)) <= {s['id'] for s in p['sources']})
    check(n + ' consent detail retained and extended', p['consent_support'].startswith(old['consent_support']))
    check(n + ' three-page pack template and rolling card', p['patient_summary']['template_version'] == '0.84.36' and p['patient_summary']['card_cycle_count'] is None)
    check(n + ' mandatory before during after checks', len(p['patient_summary']['monitoring']) >= 3)
    check(n + ' complete six-chapter reference retained', len(p['chapters']) == len(old['chapters']) == 6)
    for i, chapter in enumerate(old['chapters']):
        updated = p['chapters'][i]
        check(n + ' chapter ' + chapter['id'] + ' title and all prior items retained', chapter['title'] == updated['title'] and len(updated['items']) >= len(chapter['items']))
        for j, item in enumerate(chapter['items']):
            new = updated['items'][j]
            check(n + f' chapter {i} item {j} title retained', item['title'] == new['title'])
            if new['text'] != item['text']:
                changes.append({'code': n, 'path': f'chapters[{i}].items[{j}].text', 'before': item['text'], 'after': new['text']})
                check(n + f' chapter {i} item {j} has an explicit correction or preserves prefix', (n, i, j) in [('00692', 0, 1), ('00692', 2, 0)] or new['text'].startswith(item['text']))
    check(n + ' guide and handbook linked from clinician KB', all(any(r['url'] == f'patient/{n}/{f}' for r in kb[n]['reference_links']) for f in ['guide.pdf', 'handbook.pdf', 'sactcard.pdf']))

p = profiles['00216']
body = ' '.join(strings(p))
check('00216 shared breast and colorectal scope retained', 'breast' in p['context_label'].lower() and 'colorectal' in p['context_label'].lower())
check('00216 adjuvant and advanced duration separated', 'eight cycles' in p['patient_summary']['schedule'] and 'Advanced-disease' in p['patient_summary']['schedule'])
check('00216 21-day schedule preserved', p['cycle_days'] == 21 and 'Days 1–14' in p['patient_summary']['schedule'] and 'seven days off' in p['patient_summary']['schedule'])
check('00216 nightly diarrhoea has stop-and-contact advice', any('Diarrhoea during the night' == x['title'] and 'Stop capecitabine' in x['text'] for x in p['chapters'][3]['items']))
check('00216 no pump and no automatic cycle restart', p['port_pump'] is False and 'does not by itself mean it is safe to restart' in body)
check('00216 source off-label consent explained', 'unlicensed in Ireland' in p['consent_support'])
check('00216 no mandatory ECG misattribution', 'NCCP does not mandate' in p['monitoring_schedule']['rows'][3]['cells'][0])
check('00216 X-ACT not extrapolated to breast', 'does not estimate benefit for breast cancer' in p['evidence']['interpretation'])
check('00216 CREATE-X separate breast evidence', len(kb['00216']['evidence_by_context']) == 1 and kb['00216']['evidence_by_context'][0]['trial'] == 'CREATE-X')

p = profiles['00692']
body = ' '.join(strings(p))
check('00692 two separate 22-hour pump schedule', p['pump_schedule'] == 'two_22_hour_infusions' and 'second 22-hour' in p['schedule_summary'])
check('00692 weekly Day 8 remains distinct', 'Day 8' in p['schedule_summary'] and [x['id'] for x in support['00692']] == ['day1', 'day2', 'day8'])
check('00692 unsupported Day 2 folinic assertion removed', 'Day 2 includes folinic' not in body and 'second folinic-acid/fluorouracil' not in body)
check('00692 Day 2 requires complete prescription confirmation', 'full Day 2 prescription' in p['schedule_summary'] and support['00692'][1]['active_medicines'] == ['Fluorouracil'])
check('00692 observation conflict retained in clinician support', 'NCCP 00692 v2 p1 permits' in ' '.join(support['00692'][0]['additional_support']) and 'every infusion' in ' '.join(support['00692'][2]['additional_support']))
check('00692 source-specific follow-up minerals and nerves', 'monthly' in json.dumps(p['monitoring_schedule']).lower() and 'two months' in body and 'every two cycles' in body)
check('00692 myocardial / breathing emergencies explicit', '112/999' in p['urgent_extra'] and '112/999' in p['patient_summary']['cycle_expectations'][1])
check('00692 DPD renal caution has its own official source', 'dpd-renal' in p['chapters'][1]['items'][0]['source_ids'])
check('00692 no postoperative recurrence-prevention claim', 'Ask whether the aim is to reduce recurrence risk' not in body)
check('00692 OPUS subgroup limits retained', '87 extended RAS' in kb['00692']['evidence_at_a_glance']['population'] and 'not establish statistically significant' in kb['00692']['evidence_at_a_glance']['qualitative_result'])

report = {'release': '0.84.36', 'checks_passed': len(checks), 'checks': checks, 'existing_chapter_text_changes': changes,
          'limits': ['These checks validate authored content, retention and known schedule distinctions. PDF layout, QR decoding, browser journeys and independent clinical/pharmacy/PPI review are separate release gates.']}
(HERE / 'content-check-results.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(f'{len(checks)} authored-content and retention checks passed; {len(changes)} existing chapter text changes recorded.')
