#!/usr/bin/env python3
"""Add complete local-reference display overlays; preserve accepted v64 drafts."""
import argparse
import copy
import hashlib
import importlib.util
import json
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--draft-root', default=str(HERE.parent / 'sarcoma-batch5-patient-drafts-20261118'))
    ap.add_argument('--output', default=str(HERE / 'overlay'))
    args = ap.parse_args()
    draft = pathlib.Path(args.draft_root).resolve()
    output = pathlib.Path(args.output).resolve()
    application = HERE.parent / 'Sactcheck'
    assert draft != output and draft not in output.parents and output not in draft.parents
    assert application != output and application not in output.parents
    assert output != HERE and output not in (HERE / 'cuh-support').parents and HERE / 'cuh-support' not in output.parents
    accepted_checkpoint = draft / 'final-draft-checksums.json'
    assert sha(accepted_checkpoint) == 'c67df2b1a9b1e839a883f711b54c7c195dd5900220eb92de0742905911df31e6', 'Unexpected accepted v64 checkpoint'
    for name, expected in json.loads(accepted_checkpoint.read_text())['files'].items():
        source = (draft / name).resolve()
        expected_hash = expected['sha256'] if isinstance(expected, dict) else expected
        assert draft in source.parents and sha(source) == expected_hash, 'Accepted v64 source changed: ' + name
    source_files = {p.relative_to(draft).as_posix(): sha(p) for p in draft.rglob('*') if p.is_file() and '__pycache__' not in p.parts}
    phases = json.loads((draft / 'overlay/draft-integration/base-phase-support.json').read_text())
    workflow = json.loads((draft / 'overlay/draft-integration/workflow-fragments.json').read_text())
    old_phases, old_workflow = copy.deepcopy(phases), copy.deepcopy(workflow)
    spec = importlib.util.spec_from_file_location('cuh_reference64', HERE / 'cuh-support/reference.py')
    module = importlib.util.module_from_spec(spec)
    sys.dont_write_bytecode = True
    spec.loader.exec_module(module)
    checks = [module.attach(p, code, '0.84.64', HERE / 'cuh-support') for code, rows in phases.items() for p in rows]
    plans = {}
    for row in workflow:
        row['phases'] = copy.deepcopy(phases[row['code']])
        for phase in row['phases']:
            plans['sarcoma64_' + row['code'] + '_' + phase['id']] = dict(
                label=phase['label'], risk_level=phase['emetogenic_risk'], day1=[], subsequent=[],
                warnings=phase['additional_support'], source_url=phase['source_url'], source_checked=phase['source_checked'],
                local_reference=phase['local_reference'], prescription_note='Retain the separately reconciled national-regimen support and individual prescription. The complete CUH block is historical reference information and does not calculate or automatically start treatment.')
    restored = copy.deepcopy(phases)
    for rows in restored.values():
        for row in rows:
            row.pop('local_reference')
    assert restored == old_phases, 'Original phase paragraph, risk, medication or calendar changed'
    restored = copy.deepcopy(workflow)
    for row in restored:
        for phase in row['phases']:
            phase.pop('local_reference')
    assert restored == old_workflow
    files = {'draft-integration/base-phase-support.json': phases,
             'draft-integration/workflow-fragments.json': workflow,
             'draft-integration/workflow-plans.json': plans}
    for name, value in files.items():
        path = output / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
    after = {p.relative_to(draft).as_posix(): sha(p) for p in draft.rglob('*') if p.is_file() and '__pycache__' not in p.parts}
    assert source_files == after, 'Accepted v64 source draft changed'
    report = dict(status='External support-only overlay; integration and rendering review pending',
                  original_final_checkpoint_sha256=sha(draft / 'final-draft-checksums.json'),
                  source_manifest_sha256=sha(HERE / 'cuh-support/support-source-manifest.json'),
                  phases=checks, complete_reference_rows=sum(x['complete_rows'] for x in checks),
                  original_authored_phase_fields_unchanged=True, all_accepted_v64_files_unchanged=True,
                  accepted_source_file_count=len(source_files), clinical_files_or_profiles_written=False,
                  application_written=False, outputs={name: sha(output / name) for name in files})
    (HERE / 'cuh-support-transition.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(dict(phases=len(checks), complete_reference_rows=report['complete_reference_rows'], accepted_source_files_preserved=len(source_files), application_written=False)))


if __name__ == '__main__':
    main()
