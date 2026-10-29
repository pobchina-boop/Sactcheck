"""Carry current NCCP course boundaries into the six audited catalogue cards."""
from pathlib import Path
import json

R = Path(__file__).resolve().parents[1]
file = R / 'data/regimen-card-overrides.json'
data = json.loads(file.read_text())
courses = {
    '00689': ('phased_course', '4 induction cycles, then atezolizumab maintenance'),
    '00908': ('phased_course', '4 induction cycles, then serplulimab maintenance'),
    '00271': ('cycle_range', '4–6 cycles or until progression/unacceptable toxicity'),
    '00280': ('cycle_range', '4–6 cycles'),
    '00319': ('until_progression', 'Until progression or unacceptable toxicity'),
    '00222': ('until_progression', 'Until progression or unacceptable toxicity'),
}
for code, (kind, duration) in courses.items():
    p = json.loads(next((R / 'protocols/lung').glob(code + '-*.json')).read_text())
    contexts = []
    for indication in p['indications']:
        identifier = indication.get('id') or indication.get('indication_id') or indication.get('code')
        contexts.append(dict(id=identifier, indication_id=identifier, cycle_length_days=21,
                             intent='advanced_disease', duration_type=kind, duration_text=duration))
    data['protocols'][p['protocol_id']] = dict(
        schema_version='1.0.0', contexts=contexts,
        provenance=dict(method='v08423_NCCP_source_mapping', reviewed=False,
                        source=p['metadata']['source_url'],
                        note='Source-specific route and phase context; independent clinical/pharmacy review pending.'))
file.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
