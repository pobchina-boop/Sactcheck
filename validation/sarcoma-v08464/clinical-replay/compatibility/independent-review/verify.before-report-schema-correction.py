#!/usr/bin/env python3
"""Bounded independent ledger verification plus exactly one 32-case replay.

Usage: python3 independent-review/verify.py [new-output-directory]
No historical clinical suite is rerun; original files are read only.
The output directory must not already exist.
"""
import collections
import copy
import hashlib
import json
import pathlib
import subprocess
import sys

BASE = pathlib.Path(__file__).resolve().parents[1]
OUT = pathlib.Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else BASE / 'independent-review' / 'verification'
OUT.mkdir(parents=True, exist_ok=False)

def read(name):
    return json.loads((BASE / name).read_text())

def sha(file):
    return hashlib.sha256(file.read_bytes()).hexdigest()

def check(value, message):
    if not value:
        raise AssertionError(message)

def authored(obs):
    return {f['ruleId']: f for f in obs['findings'] if not f.get('domainAssessment') and not f['ruleId'].startswith('PARTIAL_')}

def actions(obs):
    return {r['componentId']: r['actionType'] for r in obs['doseRows']}

def quantified(obs):
    rows = []
    for r in obs['doseRows']:
        rows += [r] + r.get('allActions', [])
    return {(r['componentId'], r.get('ruleId'), r['actionType'], r.get('protocolDose')) for r in rows if r.get('quantified')}

def no_message(f):
    out = copy.deepcopy(f)
    out['action'].pop('message', None)
    return out

REPORT_PATHS = {
    'author-712': 'drafts/ie-vac-source-case-results.json',
    'author-571': 'drafts/iri-tmz-ivado-vit-case-results.json',
    'independent-213': 'independent/current-results.json',
    'independent-12': 'independent/retained-input-current-results.json',
}
PINNED = {
    'ADJUDICATION.md': 'c95d70d0167801ab2cb2c56e51f844075a92311e420925c06f71cf8f2ba4f9dd',
    'source-and-lineage.json': '708ddfde4f64642ded1de2115182c7ec723d9ad7f9b33ce6aa5bfc442f454f29',
    'raw-failure-ledger.json': 'cbcbe10d54100b88f9c959f1477c56bd386fd59b21b950633a3c28a81dbf7a81',
    'all-observation-deltas.json': '5b00160f906930629ecdc5791fd648643bb0077ff0044cdca8ba3ab45a301653',
    'dynamic-demo-input-transitions.json': 'cca20e9f537bb7c1384a41d85c6a9caa49df0b66238ed47bfea91251238c2860',
    'current-contract.cjs': '6fca4eddfe2c172759062b3aa071bb4d999f46dfb717eb49aef92301c0b543e1',
    'current-contract-cases.json': '2fd407412fa4710a08d7bc7b81b73a813caa59a53e909a352e10b831b97ad8cd',
    'current-contract-results.json': '530dd0bdcf517491e3b6b4e7df791e4f271d7c72595131e8c9209c95296f3e57',
}
FINAL_HASHES = {
    '00675': 'dc03763ece16532721443d05109bbffd2e2c21694e055ce52f55c224fcdef6a5',
    '00747': 'fc950dce5165a25b3434544fcf962ed4a4db1d7fe06af213d8a1acfa7e9d1550',
    '00504': 'c34996d66178272114426b97daecc6f3ec08cc7e698b4541203127f70e6e3a77',
    '00754': 'c8565b510144b9c77439af8fd4ddd9d09eb829df6437f95ecef7aeb658cbe84c',
    '00757': '77963df198f34dd4b15c19e2181ffef8109035f04028e53028c1cf5a192c4782',
}
ALLOWED_ADDITIONS = {
    'IFO_PRODUCT_PHASE_UNRESOLVED', 'IFO_PRODUCT_IDENTIFICATION_REQUIRED',
    'IFO_PRODUCT_LABS_MISSING', 'IFO_PRODUCT_UNITS_UNVERIFIED',
    'IFO_PRODUCT_UNKNOWN_ABNORMAL', 'IFO_NEURO_LOCALISATION_UNRESOLVED',
    'IFO_SEVERE_CURRENT_NEURO_HOLD',
}
ALLOWED_REMOVALS = {'IFO_CURRENT_CNS_PRODUCT_INTERRUPT', 'IFO_CURRENT_NEURO'}
MESSAGE_IDS = {'IFOSFAMIDE_SEVERE_HEPATIC', 'IFO_CYC_SEVERE_LIVER', 'IFO_HEPATIC_DISCRETION', 'IFO_HEPATIC_SIGNIFICANT', 'IFO_RENAL', 'IFO_RENAL_CONFLICT'}

try:
    for name, expected in PINNED.items():
        check(sha(BASE / name) == expected, 'Pinned input changed: ' + name)
    freeze = read('pre-review-freeze.json')
    check(len(freeze['files']) == freeze['file_count'] == 342, 'Frozen file count')
    for f in freeze['files']:
        file = BASE / f['path']
        check(file.stat().st_size == f['bytes'] and sha(file) == f['sha256'], 'Frozen evidence changed: ' + f['path'])
    sources = read('source-and-lineage.json')
    for s in sources['sources']:
        check(sha(BASE / 'sources' / pathlib.Path(s['copy_path']).name) == s['sha256'], 'Source pin')
    protocols, shadow_original_hashes = {}, {}
    original_hashes = {x['code']: x['original_application']['sha256'] for x in sources['clinical_lineages']}
    for code, expected in FINAL_HASHES.items():
        f, = (BASE / 'final-graded/drafts/protocols').glob(code + '-*.json')
        check(sha(f) == expected, 'Final candidate pin ' + code)
        # Shadow application JSONs deliberately retain original application bytes.
        # The engine receives each final draft explicitly; it does not load this tree.
        shadow_hash = sha(BASE / 'final-graded/Sactcheck/protocols/sarcoma' / f.name)
        check(shadow_hash == original_hashes[code], 'Authenticated shadow original pin ' + code)
        shadow_original_hashes[code] = shadow_hash
        protocols[code] = json.loads(f.read_text())
    runtime_pins = {str(f.relative_to(BASE)): sha(f) for f in sorted((BASE / 'final-graded/Sactcheck/js').glob('*.js'))}

    stages = {stage: {s: read(f'{stage}/{s}-trace.json') for s in REPORT_PATHS} for stage in ['original-accepted', 'final-pregrading', 'final-graded']}
    reports = {stage: {s: read(f'{stage}/{p}') for s, p in REPORT_PATHS.items()} for stage in stages}
    deltas = read('all-observation-deltas.json')
    delta_map = {(d['suite'], d['trace_index']): d for d in deltas['records']}
    dynamic = read('dynamic-demo-input-transitions.json')
    dynamic_map = {(d['suite'], d['trace_index']): d for d in dynamic['records']}
    check(len(delta_map) == len(deltas['records']) == deltas['count'] == 872, 'All 872 deltas unique')
    check(len(dynamic_map) == dynamic['count'] == 10, 'Ten dynamic inputs')
    counts = collections.Counter()
    classifications = collections.Counter()
    added_counts, removed_counts, message_counts = collections.Counter(), collections.Counter(), collections.Counter()
    partial_details, dynamic_details, suite_counts = [], [], []
    observed_delta_keys = set()
    for suite in REPORT_PATHS:
        before = stages['original-accepted'][suite]
        after = stages['final-graded'][suite]
        check(after == stages['final-pregrading'][suite], 'Exact saved grading trace parity ' + suite)
        check(len(before) == len(after), 'Observation count ' + suite)
        local_changed = 0
        for i, (a, b) in enumerate(zip(before, after)):
            counts['engine_observations'] += 1
            check(a['protocol_id'] == b['protocol_id'], 'Protocol ID stable')
            same_input = a['input'] == b['input']
            counts['identical_input' if same_input else 'changed_input'] += 1
            old, new = a['observed'], b['observed']
            check(old['invalid'] == new['invalid'] and old['errors'] == new['errors'], 'No new invalid/error')
            check(not (not old['complete'] and new['complete']), 'No incomplete-to-complete transition')
            check(quantified(new) <= quantified(old), 'New quantified dose')
            oa, na = actions(old), actions(new)
            if same_input:
                check({k: v for k, v in oa.items() if k != 'ifosfamide'} == {k: v for k, v in na.items() if k != 'ifosfamide'}, 'Non-ifosfamide component action changed')
            if old == new:
                check((suite, i) not in delta_map, 'Spurious delta')
                continue
            local_changed += 1
            counts['changed_observations'] += 1
            observed_delta_keys.add((suite, i))
            d = delta_map[(suite, i)]
            code = a['protocol_id'].split('-')[1]
            check(d['code'] == code and d['before'] == old and d['after'] == new, 'Exact delta observations')
            check(d['before_input'] == a['input'] and d['after_input'] == b['input'] and d['identical_input'] == same_input, 'Exact delta inputs')
            of, nf = authored(old), authored(new)
            added, removed = set(nf) - set(of), set(of) - set(nf)
            check(added == set(d['added_rules']) and removed == set(d['removed_rules']), 'Rule delta inventory')
            check(added <= ALLOWED_ADDITIONS and removed <= ALLOWED_REMOVALS, 'Unaccepted added/removed rule')
            messages = {}
            for rid in of.keys() & nf.keys():
                if of[rid] != nf[rid]:
                    check(rid in MESSAGE_IDS and no_message(of[rid]) == no_message(nf[rid]), 'Existing finding action changed ' + rid)
                    messages[rid] = {'before': of[rid], 'after': nf[rid]}
            check(messages == d['message_only_existing_rules'], 'Message-only inventory')
            component_changes = [{'component': k, 'before': oa.get(k), 'after': na.get(k)} for k in sorted(oa.keys() | na.keys()) if oa.get(k) != na.get(k)]
            check(component_changes == sorted(d['component_action_changes'], key=lambda x: x['component']), 'Component delta inventory')
            if same_input:
                for rid in added:
                    check(nf[rid]['action']['components'] == ['ifosfamide'], 'Added rule component attribution')
            product = any(r.startswith('IFO_PRODUCT_') for r in added)
            neuro = bool(removed or added & {'IFO_NEURO_LOCALISATION_UNRESOLVED', 'IFO_SEVERE_CURRENT_NEURO_HOLD'})
            only_partial = not added and not removed and not messages
            expected_class = [
                'accepted_named_product_reconciliation' if product else None,
                'accepted_broad_neuro_CNS_semantic_transition' if neuro else None,
                'source_conflict_explanation_only' if messages else None,
                'partial_domain_context_changed' if only_partial else None,
                'dynamic_demo_input_transition' if not same_input else None,
            ]
            check(d['classification'] == expected_class, 'Classification not independently reproduced')
            classifications[' + '.join(x for x in expected_class if x)] += 1
            added_counts.update(added); removed_counts.update(removed); message_counts.update(messages.keys())
            if only_partial:
                check({k: v for k, v in old.items() if k != 'findings'} == {k: v for k, v in new.items() if k != 'findings'}, 'Partial-only change affects clinical action or dose')
                check(of == nf, 'Partial-only authored findings unchanged')
                partial_details.append({'suite': suite, 'trace_index': i, 'code': code})
            if not same_input:
                dd = dynamic_map[(suite, i)]
                changes = {k: {'before_present': k in a['input'], 'before': a['input'].get(k), 'after': b['input'].get(k)} for k in a['input'].keys() | b['input'].keys() if (k in a['input']) != (k in b['input']) or a['input'].get(k) != b['input'].get(k)}
                check(changes == dd['changes'], 'Exact dynamic input transition')
                check(len(changes) == 12 and all(x['after'] == '' for x in changes.values()), 'Expected 12 blanked/added demo inputs')
                dynamic_details.append({'suite': suite, 'trace_index': i, 'code': code, 'changes': changes})
        r0, r1 = reports['original-accepted'][suite], reports['final-graded'][suite]
        check(sum(bool(x['passed']) for x in r0['results']) == r0['passed'], 'Original raw count')
        check(sum(bool(x['passed']) for x in r1['results']) == r1['passed'], 'Final raw count')
        check(sum(not x['passed'] for x in r1['results']) == r1['failed'], 'Final fail count')
        suite_counts.append({'suite': suite, 'original_passed': r0['passed'], 'original_failed': r0['failed'], 'original_rows': len(r0['results']), 'final_passed': r1['passed'], 'final_failed': r1['failed'], 'final_rows': len(r1['results']), 'engine_observations': len(after), 'changed_observations': local_changed})
    check(observed_delta_keys == set(delta_map), 'Exact full delta set')
    check(dict(counts) == {'engine_observations': 1490, 'identical_input': 1480, 'changed_observations': 872, 'changed_input': 10}, 'Independent observation totals')
    check(len(partial_details) == 167, 'Partial-only count')
    check({(d['suite'], d['trace_index']) for d in dynamic_details} == set(dynamic_map), 'Dynamic set equality')

    ledger = read('raw-failure-ledger.json')
    check(len(ledger['entries']) == 16, 'Sixteen raw failures')
    failures = {(s, i): x for s, r in reports['final-pregrading'].items() for i, x in enumerate(r['results']) if not x['passed']}
    check(set(failures) == {(e['suite'], e['report_index']) for e in ledger['entries']}, 'All raw failures preserved in ledger')
    semantic, coverage = [], []
    for e in ledger['entries']:
        check(failures[(e['suite'], e['report_index'])] == e['raw_failure'], 'Failure text unchanged')
        check(e['old_expectation_retained'], 'Original expectation retained')
        if e['classification'] == 'historical_broad_neuro_CNS_assumption':
            a = stages['original-accepted'][e['suite']][e['trace_index']]
            b = stages['final-graded'][e['suite']][e['trace_index']]
            check(e['input'] == a['input'] == b['input'], 'Exact original neuro input')
            check(e['before'] == a['observed'] and e['after'] == b['observed'], 'Exact historical neuro observation')
            semantic.append({k: e[k] for k in ['suite', 'report_index', 'trace_index', 'code', 'name']})
        elif e['classification'] == 'historical_rule_coverage_fixture_scope':
            check('input' not in e and 'trace_index' not in e, 'Coverage is not a patient scenario')
            coverage.append({k: e[k] for k in ['suite', 'report_index', 'code', 'name']})
        else:
            raise AssertionError('Unknown failure classification')
    check(len(semantic) == 13 and len(coverage) == 3, '13 clinical semantic mismatches and 3 coverage mismatches')
    check(len(reports['final-graded']['author-712']['results']) - len(reports['original-accepted']['author-712']['results']) == 2, 'Two appended coverage report rows')
    check([e['report_index'] for e in coverage if e['suite'] == 'author-712'] == [712, 713], 'Exact two extra rows')

    cases = read('current-contract-cases.json')['cases']
    original_cases = read('initial-control-fixture-error/current-contract-cases.json')['cases']
    corrected = []
    for i, (a, b) in enumerate(zip(original_cases, cases)):
        if a != b:
            c = copy.deepcopy(a)
            check(c['code'] == '00754' and not c.get('historical') and c['input'].pop('haemodialysis') is False, 'Only three new IVADo fixture keys corrected')
            check(c == b, 'No other fixture or expectation correction')
            corrected.append(i)
    check(len(original_cases) == len(cases) == 32 and len(corrected) == 3, '32 cases / exactly 3 fixture corrections')
    check(read('initial-control-fixture-error/current-contract-results.json')['passed'] == 29, 'Original 29/32 preserved')
    kinds = collections.Counter(c['kind'] for c in cases)
    historical = [c for c in cases if c.get('historical')]
    check(len(historical) == 23, '23 unchanged clinical inputs')
    for c in cases:
        check(set(c['input']) <= set(protocols[c['code']]['input_definitions']), 'All contract inputs declared')
    script_hashes = {}
    for rel in ['drafts/ie-vac-source-cases.cjs', 'drafts/iri-tmz-ivado-vit-cases.cjs']:
        if (BASE / 'original-accepted' / rel).exists():
            hs = [sha(BASE / stage / rel) for stage in stages]
            check(len(set(hs)) == 1, 'Historical author script bytes unchanged')
            script_hashes[rel] = hs[0]

    command = ['node', str(BASE / 'current-contract.cjs'), str(BASE / 'final-graded/drafts/protocols'), str(BASE / 'final-graded/Sactcheck'), str(OUT / 'current-contract-replay.json')]
    replay = subprocess.run(command, capture_output=True, text=True, timeout=60)
    (OUT / 'replay.log').write_text(replay.stdout + replay.stderr)
    check(replay.returncode == 0, 'Current 32-case replay failed')
    replay_report = json.loads((OUT / 'current-contract-replay.json').read_text())
    check(replay_report == read('current-contract-results.json'), 'Exact replay report equals pinned source-owner result')
    check(replay_report['passed'] == 32 and replay_report['failed'] == 0, '32 current checks')
    for c, r in zip(cases, replay_report['results']):
        check(c['input'] == r['input'] and r['protocol_sha256'] == FINAL_HASHES[c['code']], 'Case and candidate exact')
        obs = {'doseRows': r['observed']['rows']}
        check(not quantified(obs), 'No nested quantified action in current contract')
        if c.get('historical'):
            h = c['historical']
            old = stages['original-accepted'][h['suite']][h['trace_index']]
            new = stages['final-graded'][h['suite']][h['trace_index']]
            check(old['input'] == new['input'] == c['input'], 'Historical case unchanged')
            check(r['observed']['rows'] == new['observed']['doseRows'], 'Actual full current component rows equal frozen ledger')
            check(r['observed']['action'] == new['observed']['actionType'], 'Actual current global action exact')
    for name, expected in PINNED.items():
        check(sha(BASE / name) == expected, 'Original input modified during review')
    for path, expected in runtime_pins.items():
        check(sha(BASE / path) == expected, 'Runtime modified during review')

    result = {
        'status': 'accepted_bounded_software_and_source_compatibility',
        'clinical_approval': False, 'pharmacy_approval': False, 'application_writes': False,
        'verifier_sha256': sha(pathlib.Path(__file__)),
        'input_pins': PINNED, 'frozen_package_sha256': sha(BASE / 'pre-review-freeze.json'),
        'frozen_files_verified': 342, 'frozen_bytes_verified': freeze['bytes'],
        'final_candidate_hashes': FINAL_HASHES, 'runtime_pins': runtime_pins,
        'shadow_application_original_hashes': shadow_original_hashes,
        'candidate_load_contract': 'current-contract.cjs reads final-graded/drafts/protocols explicitly and passes those parsed objects to the runtime engine. Shadow application protocol bytes are original baseline authentication inputs, not clinical candidates.',
        'suites': suite_counts, 'observation_counts': dict(counts),
        'classifications': dict(classifications), 'added_rule_counts': dict(added_counts),
        'removed_rule_counts': dict(removed_counts), 'message_only_rule_counts': dict(message_counts),
        'semantic_failures_preserved': semantic, 'coverage_failures_preserved': coverage,
        'dynamic_inputs': dynamic_details, 'partial_only_count': len(partial_details),
        'current_contract': {'passed': 32, 'failed': 0, 'historical_inputs': 23, 'new_controls': 9, 'kinds': dict(kinds), 'exact_pinned_result_reproduced': True, 'initial_29_of_32_fixture_errors_preserved': True, 'corrected_case_indexes': corrected},
        'no_new_quantified_action_including_nested_actions': True,
        'all_1480_same_input_non_ifos_component_actions_unchanged': True,
        'all_1490_pregrading_to_graded_saved_observations_identical': True,
        'all_872_delta_records_and_classifications_verified': True,
        'source_limits': sources['source_limits'],
        'historical_author_script_hashes': script_hashes,
        'replay_command': ['node', '../current-contract.cjs', '../final-graded/drafts/protocols', '../final-graded/Sactcheck', '<new-output-path>'],
        'scope_limit': 'Saved historical trace comparison plus 32 current engine checks only. No historical suite rerun; no new clinical acceptance or deployment assertion.'
    }
    (OUT / 'independent-verification.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({k: result[k] for k in ['status', 'observation_counts', 'classifications', 'current_contract']}, indent=2))
except Exception as exc:
    (OUT / 'verification-failure.json').write_text(json.dumps({'status': 'failed', 'error': str(exc), 'verifier_sha256': sha(pathlib.Path(__file__)), 'clinical_approval': False}, indent=2) + '\n')
    raise
