#!/usr/bin/env python3
"""Stage or surgically install the accepted v63 patient payload.

Default mode writes an external preview only. Application mode requires the
release version and exact accepted clinical inputs (or enumerated provenance
changes). This helper never writes clinical protocols or generated documents.
"""
import argparse
import copy
import hashlib
import importlib.util
import json
import sys
import math
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
VERSION = '0.84.63'
CODES = ('00420', '00463', '00100', '00596', '00680')
SHARED = ('data/regimen-workflow-v0750.json', 'data/phase-support-v0838.json',
          'data/breast-treatment-journeys-v0837.json', 'data/patient-presentation-v08431.json')
AUDIT = 'validation/sarcoma-v08463/patient-authoring/'
PRODUCT_URL = 'https://assets.hpra.ie/products/Human/15731/Licence_PA2299-028-001_11092023124600.pdf'
PRODUCT_NOTE = (
    'Identify the actual supplied ifosfamide product and reconcile its current product information with the exact NCCP regimen before administration or restart. '
    'The reviewed HPRA Mitoxana 1 g product (PA2299/028/001; 11 September 2023) lists serum creatinine above 120 micromol/L, bilirubin above 17 micromol/L, '
    'or transaminases/alkaline phosphatase above 2.5 times the local upper limit of normal as contraindications. '
    'These named-product restrictions are more restrictive than parts of the NCCP dose-modification tables. Do not use a national reference dose band or an approval checkbox to override a known supplied-product contraindication. '
    'An unknown or different product requires identification and oncology/pharmacy reconciliation; these thresholds must not silently become universal ifosfamide rules or replacement doses. '
    'Creatinine clearance is not serum creatinine, and a raw liver-enzyme value requires its actual local reference range.')
CNS_NOTE = (
    'Current ifosfamide central nervous system toxicity requires interruption and immediate clinical assessment. '
    'A broad neurological grade alone does not establish encephalopathy: distinguish central/brain symptoms from peripheral symptoms, and review unresolved localisation. '
    'Recovery of a current value does not erase prior severe toxicity, prior discontinuation or the source-specific requirements for any future rechallenge.')


def read(path):
    return json.loads(path.read_text())


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def encoded(value):
    return (json.dumps(value, ensure_ascii=False, indent=2) + '\n').encode()


def nested_parent(obj, pointer):
    parts = pointer.strip('/').split('/')
    for part in parts[:-1]:
        obj = obj[part]
    return obj, parts[-1]


def validate_clinical(repo, payload, manifest, apply):
    records = {}
    for code, item in manifest['clinical_inputs'].items():
        source = payload / item['path']
        assert sha(source) == item['sha256'], f'Accepted clinical source changed: {code}'
        expected = read(source)
        current_path = repo / item['application_path'] if apply else source
        current = read(current_path)
        assert current['protocol_id'] == item['protocol_id'], f'Wrong clinical ID: {code}'
        assert str(current['metadata']['nccp_version']) == item['version'], f'Wrong source version: {code}'
        if item.get('exact_integrated_pin'):
            # After separately authenticated metadata/grade transitions, accept
            # only the complete frozen final bytes; no broad normalisation.
            assert sha(current_path) == item['sha256'], f'Final integrated clinical input changed: {code}'
            assert current == expected
            assert item['source_software_candidate_sha256']
            assert item['accepted_transition_evidence']
            for evidence in item['accepted_transition_evidence']:
                assert sha(payload / evidence['path']) == evidence['sha256']
            records[code] = dict(accepted_sha256=item['source_software_candidate_sha256'],
                integrated_candidate_sha256=item['sha256'], installed_sha256=sha(current_path),
                application_path=item['application_path'], protocol_id=item['protocol_id'],
                source_version=item['version'], exact_integrated_pin=True,
                accepted_transition_evidence=item['accepted_transition_evidence'])
            continue
        normalised = copy.deepcopy(current)
        transitions = []
        proposal = read(payload / 'metadata-proposals' / (code + '.json'))
        assert proposal['candidate_sha256'] == item['sha256']
        for change in proposal['allowed_changes']:
            assert change['path'].startswith('/metadata/') or change['path'] == '/clinical_governance/disclaimer'
            parent, key = nested_parent(normalised, change['path'])
            old_parent, old_key = nested_parent(expected, change['path'])
            assert (old_key in old_parent) == change['before_exists']
            assert old_parent.get(old_key) == change['before']
            if key in parent and parent[key] == change['proposed_after']:
                transitions.append(change['path'])
                if change['before_exists']:
                    parent[key] = copy.deepcopy(change['before'])
                else:
                    parent.pop(key)
        assert normalised == expected, f'Unaccepted clinical change: {code}; no patient output written'
        records[code] = dict(accepted_sha256=item['sha256'], installed_sha256=sha(current_path),
                             application_path=item['application_path'], protocol_id=item['protocol_id'],
                             source_version=item['version'], enumerated_provenance_changes=transitions)
    return records


def restore(dst, src, key):
    if key in src:
        dst[key] = copy.deepcopy(src[key])
    else:
        dst.pop(key, None)


def protected_files(repo, outputs):
    """Protect all existing patient assets, other source data and clinical files."""
    result = {}
    for folder in ('protocols', 'data', 'patient', 'docs/patient'):
        for path in (repo / folder).rglob('*'):
            if path.is_file():
                name = path.relative_to(repo).as_posix()
                if name not in outputs:
                    result[name] = sha(path)
    return result


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--repo', required=True)
    ap.add_argument('--payload', default=str(HERE / 'source-payload'))
    ap.add_argument('--output', default=str(HERE / 'preview-overlay'))
    ap.add_argument('--apply', action='store_true')
    args = ap.parse_args()
    repo = pathlib.Path(args.repo).resolve()
    payload = pathlib.Path(args.payload).resolve()
    out = repo if args.apply else pathlib.Path(args.output).resolve()
    if not args.apply and (out == repo or repo in out.parents):
        raise SystemExit('REFUSED: preview must be outside the application.')
    if not args.apply and (out == payload or payload in out.parents or out in payload.parents):
        raise SystemExit('REFUSED: preview must not overlap the immutable source payload.')
    if args.apply and read(repo / 'package.json').get('version') != VERSION:
        raise SystemExit('REFUSED: application requires package version ' + VERSION)
    manifest = read(payload / 'manifest.json')
    assert manifest['release'] == VERSION
    for name, expected_hash in manifest['files'].items():
        source = (payload / name).resolve()
        assert payload in source.parents and sha(source) == expected_hash, f'Changed source payload: {name}'
    clinical = validate_clinical(repo, payload, manifest, args.apply)
    overlay = payload / 'accepted-patient/overlay'
    profiles = {c: read(overlay / f'data/patient-knowledge/{c}.json') for c in CODES}
    kb = read(overlay / 'data/regimen-knowledge-base-v08463-addendum.DRAFT.json')
    context_notes = read(payload / 'clinical-context-correction/kb-append-only-notes.json')
    assert context_notes['software_acceptance_sha256'] == manifest['subsequent_clinical_acceptance_sha256']
    assert context_notes['clinical_and_pharmacy_approval'] is False
    fragments = read(overlay / 'draft-integration/workflow-fragments.json')
    support = read(overlay / 'draft-integration/base-phase-support.json')
    journeys = read(overlay / 'draft-integration/journey-fragments.json')
    presentation = read(overlay / 'draft-integration/presentation-routes.json')
    cuh_dir = payload / 'cuh-support'
    spec = importlib.util.spec_from_file_location('cuh_reference', cuh_dir / 'reference.py')
    cuh = importlib.util.module_from_spec(spec)
    previous_bytecode_setting = sys.dont_write_bytecode
    try:
        sys.dont_write_bytecode = True
        spec.loader.exec_module(cuh)
    finally:
        sys.dont_write_bytecode = previous_bytecode_setting
    cuh_checks = [cuh.attach(phase, code, VERSION, cuh_dir) for code, rows in support.items() for phase in rows]
    deduplicated_support = []
    for code, phase_rows in support.items():
        for phase in phase_rows:
            phase['additional_support'] = list(dict.fromkeys(phase['additional_support']))
            for medicine in phase['medicines']:
                if medicine.get('note') and medicine['note'] in phase['additional_support']:
                    deduplicated_support.append(dict(code=code, phase=phase['id'], removed_from='medicines[].note',
                        retained_at='additional_support', text_sha256=hashlib.sha256(medicine['note'].encode()).hexdigest(), text=medicine['note']))
                    medicine['note'] = ''
    for fragment in fragments:
        fragment['phases'] = copy.deepcopy(support[fragment['code']])
    originals = [read(repo / name) for name in SHARED]
    workflow, phases, journey_data, presentation_data = copy.deepcopy(originals)
    outputs, profile_checks, plan_ids = {}, [], []

    for code, d in profiles.items():
        original = copy.deepcopy(d)
        assert d['suite_release'] == VERSION and d['protocol_id'] == clinical[code]['protocol_id']
        assert str(d['protocol_version']) == clinical[code]['source_version']
        assert d['independent_clinical_approval'] is False
        provenance = d['source_provenance']
        provenance['external_draft'] = not args.apply
        provenance['accepted_clinical_input'] = clinical[code]
        provenance['patient_source_acceptance'] = dict(checkpoint_sha256=manifest['patient_acceptance_checkpoint_sha256'],
                                                       independent_contracts_passed=33, human_clinical_approval=False)
        d['declared_document_downloads'] = ['guide.pdf', 'sactcard.pdf', 'knowledge.pdf', 'handbook.pdf']
        assert d['patient_summary']['template_version'] == VERSION
        assert len(d['anatomy']) == 8
        distances = [math.hypot((a[4]-b[4])*66.442/100, (a[5]-b[5])*146/100)
                     for i, a in enumerate(d['anatomy']) for b in d['anatomy'][i+1:]]
        assert min(distances) >= 7
        if code in ('00463', '00100'):
            assert d['schedule_kind'] == 'reference-course'
            assert d['patient_summary']['card_cycle_count'] is None
            assert d['long_course_schedule'] == original['long_course_schedule']
            assert d['phases'] == original['phases'] and d['timeline'] == original['timeline']
        # Educational/clinical wording must remain exactly the accepted content.
        restored = copy.deepcopy(d)
        restored['source_provenance'] = original['source_provenance']
        restored.pop('declared_document_downloads')
        assert restored == original, f'Unexpected patient wording change: {code}'
        profile_checks.append(dict(code=code, accepted_patient_wording_unchanged=True,
                                   monitoring_cards=len(d['monitoring_test_details']),
                                   named_summary_rows=len(d['patient_summary']['monitoring']),
                                   marker_minimum_mm=round(min(distances), 3), schedule_kind=d['schedule_kind']))
        outputs[f'data/patient-knowledge/{code}.json'] = d

    for item in kb['regimen_profiles']:
        code = item['patient_route']
        assert code in CODES and item['protocol_id'] == clinical[code]['protocol_id']
        item['accepted_clinical_input'] = clinical[code]
        item['patient_selection']['important_cautions'].extend(context_notes['notes'].get(code, []))
        urls = {r['url'] for r in item['patient_resources']}
        for label, filename in [('Treatment/contact wallet', 'sactcard.pdf'), ('Full treatment reference', 'knowledge.pdf')]:
            url = f'patient/{code}/{filename}'
            if url not in urls:
                item['patient_resources'].append(dict(label=label, url=url))
        if code in ('00596', '00680'):
            item['patient_selection']['important_cautions'].extend([PRODUCT_NOTE, CNS_NOTE])
            item['monitoring_and_toxicity']['ifosfamide_source_reconciliation'] = dict(
                product_information=PRODUCT_NOTE, current_neurological_toxicity=CNS_NOTE,
                severe_history='Retain the exact IE occurrence/rechallenge rules.' if code == '00596' else 'This high-dose regimen discontinues ifosfamide for grade 3 or worse neurological toxicity; do not copy IE re-exposure logic.',
                source_url=PRODUCT_URL, source_date='2023-09-11', actual_supplied_product_requires_verification=True,
                source_authority_conflict_resolved=False, clinical_approval=False)
            item.setdefault('references', []).append(dict(label='HPRA Mitoxana 1 g, PA2299/028/001, product-specific reconciliation', url=PRODUCT_URL))
    outputs['data/regimen-knowledge-sarcoma-v08463.json'] = kb

    for item in fragments:
        code = item['code']
        assert code in CODES and item['protocol_id'] == clinical[code]['protocol_id']
        if code in ('00596', '00680'):
            item['clinical_source_boundaries'].extend([PRODUCT_NOTE, CNS_NOTE])
        item['clinical_source_boundaries'].extend(context_notes['notes'].get(code, []))
        d = profiles[code]
        source = d['source_provenance']['current_source']
        selector = dict(protocol_id=item['protocol_id'], source_version=d['protocol_version'],
                        source_url=item['phases'][0]['source_url'], source_checked=d['source_checked'],
                        phases=[], clinical_source_boundaries=item['clinical_source_boundaries'],
                        accepted_clinical_input=clinical[code])
        for phase in item['phases']:
            plan_id = f'sarcoma63_{code}_{phase["id"]}'
            plan_ids.append(plan_id)
            warnings = list(dict.fromkeys(phase['additional_support']))
            plan = dict(label=phase['label'], risk_level=phase['emetogenic_risk'], day1=[], subsequent=[],
                        warnings=warnings, source_url=phase['source_url'], source_checked=phase['source_checked'],
                        prescription_note='The oncology team specifies and reconciles the complete anti-sickness and protective prescription. These source instructions do not calculate a dose or add a generic steroid course.')
            if code == '00100':
                plan['prescription_note'] += ' Mifamurtide is an innate immune activator, not a checkpoint inhibitor. Do not generate routine steroid support or transfer fixed adult premedication doses to children.'
            plan['local_reference'] = copy.deepcopy(phase['local_reference'])
            workflow['antiemetic_plans'][plan_id] = plan
            selector['phases'].append(dict(id=phase['id'], label=phase['label'], active_medicines=phase['active_medicines'],
                                           plan_id=plan_id, notes=[]))
        if code == '00596':
            selector['licensing_and_consent'] = d['consent_licensing_note']
        if code in ('00463', '00100'):
            selector['schedule_kind'] = 'reference-course'
            selector['long_course_schedule'] = d['long_course_schedule']
        workflow['supportive_phase_selectors'][code] = selector
    assert len(plan_ids) == 9 and len(set(plan_ids)) == 9
    phases['regimens'].update(support)
    journey_data.update(journeys)
    presentation_data['routes'].update(presentation)
    edited = [workflow, phases, journey_data, presentation_data]
    restored = copy.deepcopy(edited)
    for name in plan_ids:
        restore(restored[0]['antiemetic_plans'], originals[0]['antiemetic_plans'], name)
    for code in CODES:
        restore(restored[0]['supportive_phase_selectors'], originals[0]['supportive_phase_selectors'], code)
        restore(restored[1]['regimens'], originals[1]['regimens'], code)
        restore(restored[2], originals[2], code)
        restore(restored[3]['routes'], originals[3]['routes'], code)
    assert restored == originals, 'Unrelated shared-data change refused'
    outputs.update(dict(zip(SHARED, edited)))
    # Only these ten data files may be changed by application mode.
    expected_outputs = set(outputs)
    assert len(expected_outputs) == 10 and all(n.startswith('data/') for n in expected_outputs)
    protected = protected_files(repo, expected_outputs) if args.apply else {}
    guard = repo / (AUDIT + 'protected-application-manifest.json')
    if args.apply and guard.exists():
        old_guard = read(guard)
        assert all(protected.get(name) == digest for name, digest in old_guard.items()), 'Previously protected application files changed; review the transition first'
    data_checksums = {name: hashlib.sha256(encoded(value)).hexdigest() for name, value in outputs.items()}
    outputs[AUDIT + 'input-manifest.json'] = dict(source_payload_manifest_sha256=sha(payload / 'manifest.json'),
                                                accepted_clinical_inputs=clinical, patient_checkpoint_sha256=manifest['patient_acceptance_checkpoint_sha256'])
    outputs[AUDIT + 'prepared-content-checks.json'] = dict(release=VERSION, application_mode=args.apply,
        profiles=profile_checks, unchanged_unrelated_shared_data=True, selected_plan_ids=plan_ids,
        clinical_protocols_written=False, data_output_sha256=data_checksums,
        full_html_pdf_visual_checks='Pending scoped release integration and document verification', independent_clinical_approval=False)
    outputs[AUDIT + 'workflow-fragments.json'] = fragments
    outputs[AUDIT + 'cuh-reference-completeness.json'] = dict(
        phases=cuh_checks, complete_historical_reference_rows=sum(x['complete_rows'] for x in cuh_checks),
        source_adjudication_sha256=sha(cuh_dir / 'SUPPORT-REFERENCE-ADJUDICATION.md'),
        source_manifest_sha256=sha(cuh_dir / 'support-source-manifest.json'),
        reference_is_not_automatic_prescription=True, original_clinical_profile_text_unchanged=True)
    outputs[AUDIT + 'exact-support-deduplication.json'] = dict(
        removed_duplicate_occurrences=len(deduplicated_support), retained_every_distinct_instruction=True,
        entries=deduplicated_support)
    outputs[AUDIT + 'source-prose-transition.json'] = dict(
        patient_wording='All five accepted profile clinical/educational fields unchanged; only source metadata and declared download filenames added.',
        clinician_changes=['Append exact accepted clinical source pins to five KB entries and selected workflow selectors.',
                           'Append named-product organ restrictions and current CNS/peripheral distinction for00596/00680; retain every earlier clause.',
                           'Declare genuine final wallet/reference links before document generation.',
                           'Restore complete supplied CUH rows as a separate historical display-only reference with source-reviewed phase/interaction exceptions; no automatic doses added.',
                           'Remove exact repeated support text from the medicine-table note when the identical full text is retained in the phase-specific support list.'],
        accepted_patient_checkpoint_sha256=manifest['patient_acceptance_checkpoint_sha256'])
    if args.apply:
        outputs[AUDIT + 'protected-application-manifest.json'] = read(guard) if guard.exists() else protected
    # All guards and object assertions precede the first write.
    for name, value in outputs.items():
        target = (out / name).resolve()
        assert out in target.parents and (args.apply or repo not in target.parents)
        target.parent.mkdir(parents=True, exist_ok=True)
        data = encoded(value)
        if not target.exists() or target.read_bytes() != data:
            temporary = target.with_name(target.name + '.tmp')
            temporary.write_bytes(data)
            temporary.replace(target)
    if args.apply:
        assert protected == protected_files(repo, expected_outputs), 'Protected application file changed during apply'
    print(json.dumps(dict(output=str(out), application_mode=args.apply, profiles=5, support_plans=9,
                          preserved_shared_keys=True, protected_files=len(protected), clinical_files_written=False)))


if __name__ == '__main__':
    main()
