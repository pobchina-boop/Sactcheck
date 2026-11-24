#!/usr/bin/env python3
"""Read-only coverage-accounting check; no clinical engine execution."""
import hashlib, json, pathlib, sys
base = pathlib.Path(__file__).resolve().parents[1]
output = pathlib.Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else pathlib.Path(__file__).parent / 'coverage-accounting.json'
assert not output.exists(), 'Refuse to overwrite preserved evidence'
rows = []
for suite, filename, key in [('author-712', 'ie-vac-source-case-results.json', 'rule_coverage'), ('author-571', 'iri-tmz-ivado-vit-case-results.json', 'coverage')]:
    traces = json.loads((base / 'final-graded' / (suite + '-trace.json')).read_text())
    report = json.loads((base / 'final-graded/drafts' / filename).read_text())
    for code, value in report[key].items():
        if not value['untriggered']:
            continue
        seen = {f['ruleId'] for t in traces if t['protocol_id'].split('-')[1] == code for f in t['observed']['findings']}
        missing = set(value['untriggered'])
        recorded_but_not_counted = sorted(missing & seen)
        truly_absent = sorted(missing - seen)
        assert len(truly_absent) == 9
        assert recorded_but_not_counted == (['IFO_NEURO_LOCALISATION_UNRESOLVED', 'IFO_SEVERE_CURRENT_NEURO_HOLD'] if code == '00754' else [])
        rows.append({'suite': suite, 'code': code, 'historical_report_untriggered_count': len(missing), 'seen_in_trace_but_not_counted_after_assertion_abort': recorded_but_not_counted, 'not_observed_in_historical_trace': truly_absent})
cases = json.loads((base / 'current-contract-cases.json').read_text())['cases']
assert len({(x['code'], json.dumps(x['input'], sort_keys=True)) for x in cases}) == 32
out = {'status': 'verified', 'clinical_approval': False, 'pharmacy_approval': False, 'raw_coverage_failures_preserved': 3, 'current_contract_distinct_code_and_input_pairs': 32, 'script_sha256': hashlib.sha256(pathlib.Path(__file__).read_bytes()).hexdigest(), 'coverage': rows, 'interpretation': 'IVADo updates its seen set only after yes/no assertions. Two genuinely observed new rules are consequently absent from its coverage accumulator after old assertions abort. All three raw coverage assertions still fail, and nine branches per protocol genuinely remain absent from those historical trace sets. This is not a claim of exhaustive final-candidate coverage.'}
output.write_text(json.dumps(out, indent=2) + '\n')
print(json.dumps({'status': out['status'], 'raw_coverage_failures_preserved': 3, 'coverage': rows}, indent=2))
