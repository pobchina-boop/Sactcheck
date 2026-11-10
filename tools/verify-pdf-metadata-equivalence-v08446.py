"""Prove a pk-data visual_release-only edit cannot alter the v46 PDF input.

No prescribing content, markup, CSS, font or PDF bytes may change. Reconciliation
is explicit and only follows byte comparisons plus identical complete print-body
composition from the before and after HTML using the real v46 builder.
"""
from pathlib import Path
import argparse
import copy
import hashlib
import importlib.util
import json
import os
import re
import sys

R = Path(__file__).resolve().parents[1]
SHA = lambda value: hashlib.sha256(value).hexdigest()
SCRIPT = re.compile(r'(<script\b[^>]*\bid=["\x27]pk-data["\x27][^>]*>)(.*?)(</script\s*>)', re.I | re.S)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--patch-report', required=True, type=Path)
    parser.add_argument('--build-report', required=True, type=Path)
    parser.add_argument('--stage', required=True, type=Path)
    parser.add_argument('--companion-audit', required=True, type=Path)
    parser.add_argument('--report', required=True, type=Path)
    parser.add_argument('--reconcile', action='store_true')
    args = parser.parse_args()
    os.environ['SACTCHECK_COMPANION_AUDIT'] = str(args.companion_audit.resolve())
    spec = importlib.util.spec_from_file_location('metadata_book46', R/'tools/build-patient-documents-v08446.py')
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    b = module.b44
    patch = json.loads(args.patch_report.read_text())
    build_bytes = args.build_report.read_bytes()
    build = json.loads(build_bytes)
    existing = {row['route']: row for row in build['results']}
    files, before_sources, approved = [], {}, {}

    for item in patch['files']:
        filename = item['path']
        before = Path(item['saved_before_path']).read_bytes()
        after = (R/filename).read_bytes()
        assert SHA(before) == item['before_sha256'], ('Before snapshot mismatch', filename)
        assert SHA(after) == item['after_sha256'], ('After snapshot mismatch', filename)
        left, right = list(SCRIPT.finditer(before.decode())), list(SCRIPT.finditer(after.decode()))
        assert len(left) == len(right) == 1, ('Exactly one pk-data script required', filename)
        a, z = left[0], right[0]
        assert re.search(r'type=["\x27]application/json["\x27]', a[1]), ('Non-JSON script', filename)
        old, new = json.loads(a[2]), json.loads(z[2])
        expected = copy.deepcopy(old)
        assert 'visual_release' not in expected, ('Unexpected original visual_release', filename)
        expected['visual_release'] = '0.84.46'
        assert expected == new, ('Additional JSON change', filename)
        before_outside = before.decode()[:a.start(2)] + before.decode()[a.end(2):]
        after_outside = after.decode()[:z.start(2)] + after.decode()[z.end(2):]
        assert before_outside == after_outside, ('Rendered markup/style changed', filename)
        model, profile, profile_path = b.read_profile(item['route'])
        assert new == profile, ('Embedded profile differs from source', filename)
        files.append({'path': filename, 'before_sha256': SHA(before), 'after_sha256': SHA(after),
            'unchanged_outside_json_sha256': SHA(before_outside.encode()),
            'only_json_change': {'visual_release': {'before': 'absent', 'after': '0.84.46'}},
            'application_json_script_non_rendered': True})
        if filename.startswith('patient/') and filename.endswith('/knowledge.html'):
            before_sources[item['route']] = before.decode()
            approved[filename] = (SHA(before), SHA(after))

    original_tree_for = b.tree_for
    comparisons, amendments = [], []
    for route, before_html in before_sources.items():
        model, profile, profile_path = b.read_profile(route)
        companions = b.companion_plan(route)
        current_html, current = b.build_reading_body(route, model, profile, companions)

        def frozen_tree_for(selected_route, name, selected_profile):
            if selected_route == route and name == 'knowledge.html':
                return b.LH.fromstring(b.publication_pass(before_html, route, name, selected_profile)), R/'patient'/route/name
            return original_tree_for(selected_route, name, selected_profile)

        b.tree_for = frozen_tree_for
        try:
            prior_html, prior = b.build_reading_body(route, model, profile, companions)
        finally:
            b.tree_for = original_tree_for
        assert prior_html == current_html, ('Complete WeasyPrint body input changed', route)
        for key in ['source_units', 'anatomy_units', 'timelines', 'sources', 'support_files']:
            assert prior[key] == current[key], ('Clinical reading inventory changed', route, key)
        row = existing[route]
        fingerprint, hashes = b.fingerprint_inputs(route, profile_path, Path(build['previous_root']), companions[0]['route_plan_sha256'])
        assert set(hashes) == set(row['inputs']), ('Input files changed', route)
        changed = {name: (row['inputs'][name], value) for name, value in hashes.items() if value != row['inputs'][name]}
        assert changed and all(name in approved and pair == approved[name] for name, pair in changed.items()), ('Unapproved input mutation', route, changed)
        for document in row['documents']:
            name = document['document']
            for path in [args.stage/route/name, R/'patient'/route/name, R/'docs/patient'/route/name]:
                assert SHA(path.read_bytes()) == document['sha256'], ('PDF changed', str(path))
        comparisons.append({'route': route, 'identical_complete_weasyprint_body_sha256': SHA(current_html.encode()),
            'identical_clinical_units': len(current['source_units']), 'identical_anatomy_units': len(current['anatomy_units']),
            'identical_sources': len(current['sources']), 'all_other_build_inputs_unchanged': True,
            'staged_and_both_published_pdf_hashes_unchanged': True, 'before_fingerprint': row['fingerprint'],
            'after_fingerprint': fingerprint, 'approved_raw_input_hash_changes': changed})
        amendments.append((row, fingerprint, hashes))
        print('PROVED', route, flush=True)

    report = {'release': '0.84.46', 'status': 'proved', 'method': 'Independent before/after script payload and complete real-builder print-body input comparison',
        'build_report_before_sha256': SHA(build_bytes), 'patch_report_sha256': SHA(args.patch_report.read_bytes()),
        'verifier_sha256': SHA(Path(__file__).read_bytes()), 'files': files, 'routes': comparisons,
        'no_pdf_rerender_required': True, 'reason': 'Application/json scripts are removed before print composition; all complete WeasyPrint body strings, clinical inventories, sources, styles, fonts and PDF bytes are unchanged.'}
    args.report.write_text(json.dumps(report, indent=2)+'\n')
    proof_hash = SHA(args.report.read_bytes())
    if args.reconcile:
        for row, fingerprint, hashes in amendments:
            previous_fingerprint = row['fingerprint']
            row.update(fingerprint=fingerprint, inputs=hashes)
            row['nonrendering_input_equivalence'] = {'proof': str(args.report), 'proof_sha256': proof_hash,
                'before_fingerprint': previous_fingerprint, 'after_fingerprint': fingerprint,
                'pdf_outputs_unchanged': True, 'only_change': 'pk-data visual_release metadata'}
            (args.stage/row['route']/'build.json').write_text(json.dumps(row, indent=2)+'\n')
        build['nonrendering_input_equivalence'] = {'proof': str(args.report), 'proof_sha256': proof_hash,
            'previous_build_report_sha256': SHA(build_bytes), 'affected_routes': sorted(before_sources)}
        args.build_report.write_text(json.dumps(build, indent=2)+'\n')
    print(json.dumps({'proved_routes': len(comparisons), 'proved_files': len(files), 'reconciled': args.reconcile,
        'proof_sha256': proof_hash, 'build_report_sha256': SHA(args.build_report.read_bytes())}))


if __name__ == '__main__':
    main()
