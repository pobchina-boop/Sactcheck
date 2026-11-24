#!/usr/bin/env python3
"""Stage or surgically install the accepted v64 patient payload.

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
VERSION = '0.84.64'
CODES = ('00675', '00747', '00504', '00754', '00757')
SHARED = ('data/regimen-workflow-v0750.json', 'data/phase-support-v0838.json',
          'data/breast-treatment-journeys-v0837.json', 'data/patient-presentation-v08431.json')
AUDIT = 'validation/sarcoma-v08464/patient-authoring/'


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
    if apply and not manifest.get('application_clinical_freeze_ready'):
        raise SystemExit('REFUSED: final installed clinical/metadata/grading chain is not yet authenticated.')
    records = {}
    for code, item in manifest['clinical_inputs'].items():
        source = payload / item['path']
        assert sha(source) == item['sha256'], f'Accepted clinical source changed: {code}'
        expected = read(source)
        current_path = repo / item['application_path'] if apply else source
        current = read(current_path)
        assert current['protocol_id'] == item['protocol_id'], f'Wrong clinical ID: {code}'
        assert str(current['metadata']['nccp_version']) == item['version'], f'Wrong source version: {code}'
        assert sha(current_path) == item['sha256'] and current == expected, f'Clinical input changed: {code}'
        if apply:
            assert item.get('exact_integrated_pin') is True
            assert item.get('accepted_transition_evidence'), 'Exact metadata/grading evidence required'
        for evidence in item.get('accepted_transition_evidence', []):
            assert sha(payload / evidence['path']) == evidence['sha256']
        records[code] = dict(accepted_sha256=item['source_software_candidate_sha256'],
            integrated_candidate_sha256=item['sha256'] if item.get('exact_integrated_pin') else None,
            installed_sha256=sha(current_path) if apply else None,
            external_preview_input_sha256=sha(source), application_path=item['application_path'],
            protocol_id=item['protocol_id'], source_version=item['version'],
            exact_integrated_pin=item.get('exact_integrated_pin', False),
            accepted_transition_evidence=item.get('accepted_transition_evidence', []))
    return records


def restore(dst, src, key):
    if key in src:
        dst[key] = copy.deepcopy(src[key])
    else:
        dst.pop(key, None)


def reconcile_00504_reference_context(support):
    """Apply the reviewed context-only correction without rewriting raw evidence."""
    sentence = ('On a vincristine-only visit, ongoing delayed-diarrhoea support '
                'remains relevant without starting a new irinotecan course.')
    original = copy.deepcopy(support)
    phases = support['00504']
    assert len(phases) == 1 and phases[0]['id'] == 'combination'
    rows = [x for x in phases[0]['local_reference']['items'] if x['medicine'] == 'Loperamide']
    assert len(rows) == 1
    row = rows[0]
    before = row['source_clarification']
    assert before.endswith(' ' + sentence) and before.count(sentence) == 1
    row['source_clarification'] = before[:-len(' ' + sentence)]
    for code in CODES:
        if code != '00504':
            assert support[code] == original[code], 'Unrelated supportive phase changed'
    assert sentence not in json.dumps(support['00504'])
    assert sum(sentence in x.get('source_clarification', '')
               for phase in support['00757'] for x in phase['local_reference']['items']) == 2
    return dict(code='00504', phase='combination', medicine='Loperamide',
                field='source_clarification', removed_sentence=sentence,
                before=before, after=row['source_clarification'],
                raw_cuh_fields_and_all_other_phases_unchanged=True,
                review='validation/sarcoma-v08464/documents/support-context-transition-03.json')


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
    context_transition = read(payload / 'patient-context-wording-transition.json')
    assert sha(payload / 'patient-context-wording-transition.json') == manifest['patient_context_wording_transition']['sha256']
    context_checks = []
    for entry in context_transition['records']:
        code = entry['code']
        before_context = entry['before_context_paragraph']
        after_context = entry['after_context_paragraph']
        assert profiles[code]['treatment_scope_notice'] == before_context
        changed_paths = []
        def replace_context(value, pointer=''):
            if isinstance(value, dict):
                return {key: replace_context(item, pointer + '/' + key) for key, item in value.items()}
            if isinstance(value, list):
                return [replace_context(item, pointer + '/' + str(i)) for i, item in enumerate(value)]
            if isinstance(value, str) and before_context in value:
                assert value.count(before_context) == 1
                changed_paths.append(pointer)
                return value.replace(before_context, after_context)
            return value
        accepted_profile = copy.deepcopy(profiles[code])
        profiles[code] = replace_context(accepted_profile)
        assert changed_paths == entry['context_field_occurrences']
        context_checks.append(dict(code=code, changed_field_paths=changed_paths,
            original_profile_sha256=hashlib.sha256(encoded(accepted_profile)).hexdigest(),
            wording_only_profile_sha256=hashlib.sha256(encoded(profiles[code])).hexdigest(),
            before_context=before_context, after_context=after_context,
            source_snapshot_sha256=entry['source_snapshot_sha256'], source_url=entry['source_url']))
    assert len(context_checks) == 5
    kb = read(overlay / 'data/regimen-knowledge-base-v08464-addendum.DRAFT.json')
    fragments = read(overlay / 'draft-integration/workflow-fragments.json')
    support = read(overlay / 'draft-integration/base-phase-support.json')
    journeys = read(overlay / 'draft-integration/journey-fragments.json')
    presentation = read(overlay / 'draft-integration/presentation-routes.json')
    original_support = copy.deepcopy(support)
    restored_cuh = payload / 'accepted-cuh-restoration'
    cuh_dir = restored_cuh / 'cuh-support'
    support = read(restored_cuh / 'overlay/draft-integration/base-phase-support.json')
    templates = read(cuh_dir / 'templates.json')['templates']
    cuh_checks = []
    for code, rows in support.items():
        assert len(rows) == len(original_support[code])
        for original, phase in zip(original_support[code], rows):
            unchanged = copy.deepcopy(phase)
            reference = unchanged.pop('local_reference')
            assert unchanged == original, 'CUH restoration changed accepted clinical/support wording'
            template = templates[reference['template_id']]
            assert len(reference['items']) == len(template['items'])
            for old, current in zip(template['items'], reference['items']):
                assert all(current[k] == v for k, v in old.items()), 'Original CUH field changed'
            assert reference['display_only_reference'] and reference['requires_individual_prescription']
            assert reference['automatic_prescription'] is False
            cuh_checks.append(dict(code=code, phase=phase['id'], complete_rows=len(reference['items']),
                original_fields_preserved=True, complete_reference_not_automatic_prescription=True))
    assert len(cuh_checks) == 12 and sum(x['complete_rows'] for x in cuh_checks) == 108
    support_context_correction = reconcile_00504_reference_context(support)
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
        provenance['patient_context_wording_transition_sha256'] = manifest['patient_context_wording_transition']['sha256']
        provenance['patient_source_acceptance'] = dict(checkpoint_sha256=manifest['patient_acceptance_checkpoint_sha256'],
                                                       accepted_original_draft_files=86, human_clinical_approval=False)
        d['declared_document_downloads'] = ['guide.pdf', 'sactcard.pdf', 'knowledge.pdf', 'handbook.pdf']
        assert d['patient_summary']['template_version'] == VERSION
        assert len(d['anatomy']) == 8
        distances = [math.hypot((a[4]-b[4])*66.442/100, (a[5]-b[5])*146/100)
                     for i, a in enumerate(d['anatomy']) for b in d['anatomy'][i+1:]]
        assert min(distances) >= 7
        # Educational/clinical wording must remain exactly the accepted content.
        restored = copy.deepcopy(d)
        restored['source_provenance'] = original['source_provenance']
        restored.pop('declared_document_downloads')
        assert restored == original, f'Unexpected patient wording change: {code}'
        profile_checks.append(dict(code=code, accepted_patient_wording_unchanged=False, approved_context_only_transition=True,
                                   monitoring_cards=len(d['monitoring_test_details']),
                                   named_summary_rows=len(d['patient_summary']['monitoring']),
                                   marker_minimum_mm=round(min(distances), 3), schedule_kind=d['schedule_kind']))
        outputs[f'data/patient-knowledge/{code}.json'] = d

    for item in kb['regimen_profiles']:
        code = item['patient_route']
        assert code in CODES and item['protocol_id'] == clinical[code]['protocol_id']
        item['accepted_clinical_input'] = clinical[code]
        urls = {r['url'] for r in item['patient_resources']}
        for label, filename in [('Treatment/contact wallet', 'sactcard.pdf'), ('Full treatment reference', 'knowledge.pdf')]:
            url = f'patient/{code}/{filename}'
            if url not in urls:
                item['patient_resources'].append(dict(label=label, url=url))
    outputs['data/regimen-knowledge-base-v08464-addendum.json'] = kb

    for item in fragments:
        code = item['code']
        assert code in CODES and item['protocol_id'] == clinical[code]['protocol_id']
        d = profiles[code]
        source = d['source_provenance']['current_source']
        selector = dict(protocol_id=item['protocol_id'], source_version=d['protocol_version'],
                        source_url=item['phases'][0]['source_url'], source_checked=d['source_checked'],
                        phases=[], clinical_source_boundaries=item['clinical_source_boundaries'],
                        accepted_clinical_input=clinical[code])
        for phase in item['phases']:
            plan_id = f'sarcoma64_{code}_{phase["id"]}'
            plan_ids.append(plan_id)
            warnings = list(dict.fromkeys(phase['additional_support']))
            plan = dict(label=phase['label'], risk_level=phase['emetogenic_risk'], day1=[], subsequent=[],
                        warnings=warnings, source_url=phase['source_url'], source_checked=phase['source_checked'],
                        prescription_note='The oncology team specifies and reconciles the complete anti-sickness and protective prescription. These source instructions do not calculate a dose or add a generic steroid course.')
            plan['local_reference'] = copy.deepcopy(phase['local_reference'])
            workflow['antiemetic_plans'][plan_id] = plan
            selector['phases'].append(dict(id=phase['id'], label=phase['label'], active_medicines=phase['active_medicines'],
                                           plan_id=plan_id, notes=[]))
        workflow['supportive_phase_selectors'][code] = selector
    assert len(plan_ids) == 12 and len(set(plan_ids)) == 12
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
    outputs[AUDIT + 'patient-context-wording-transition.json'] = dict(transition_sha256=manifest['patient_context_wording_transition']['sha256'], records=context_checks, every_other_profile_clinical_field_unchanged=True, independent_clinical_approval=False)
    outputs[AUDIT + 'cuh-reference-completeness.json'] = dict(
        phases=cuh_checks, complete_historical_reference_rows=sum(x['complete_rows'] for x in cuh_checks),
        source_adjudication_sha256=sha(cuh_dir / 'SUPPORT-REFERENCE-ADJUDICATION.md'),
        source_manifest_sha256=sha(cuh_dir / 'support-source-manifest.json'),
        reference_is_not_automatic_prescription=True, original_clinical_profile_text_unchanged=True)
    outputs[AUDIT + 'exact-support-deduplication.json'] = dict(
        removed_duplicate_occurrences=len(deduplicated_support), retained_every_distinct_instruction=True,
        entries=deduplicated_support)
    outputs[AUDIT + 'support-context-correction.json'] = support_context_correction
    outputs[AUDIT + 'source-prose-transition.json'] = dict(
        patient_wording='Five parent-approved exact context paragraphs replaced at their existing repeated field locations; all other accepted clinical/educational wording unchanged. Original86-file draft and prior helper remain immutable; source metadata and declared downloads are recorded separately.',
        clinician_changes=['Append exact accepted clinical source pins to five KB entries and selected workflow selectors.',
                           'Retain all accepted named-product, CNS, age/population, oral-dose, day34 and supportive-care source boundaries unchanged.',
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
    print(json.dumps(dict(output=str(out), application_mode=args.apply, profiles=5, support_plans=12,
                          preserved_shared_keys=True, protected_files=len(protected), clinical_files_written=False)))


if __name__ == '__main__':
    main()
