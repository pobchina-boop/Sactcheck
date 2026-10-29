"""Build the cumulative v0.84.26 overlay from the recorded GitHub baseline."""
from pathlib import Path
import hashlib, json, subprocess, sys, zipfile

R = Path(__file__).resolve().parents[1]
out = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else R.parent / 'deliverables-v08426'
out.mkdir(parents=True, exist_ok=True)
baseline = json.loads((R/'validation/lung-next-v08426/baseline-hashes.json').read_text())
base = baseline['github_base_commit']
manifest_name = 'UPDATE_MANIFEST_v0.84.26.json'
def git(*args):
    return subprocess.check_output(['git', '-C', str(R), *args]).decode().split('\0')

assert not any(git('diff', base, '--name-only', '--diff-filter=D', '-z')), 'Review deleted files before packaging'
names = set(git('diff', base, '--name-only', '-z')) | set(git('ls-files', '--others', '--exclude-standard', '-z'))
excluded = {'.git', '.openai', '_site', 'dist', 'node_modules', '__pycache__'}
names = sorted(n for n in names if n and n != manifest_name
               and not excluded.intersection(Path(n).parts) and not n.endswith('.pyc') and not Path(n).name.startswith('.'))
# Retain URLs, hashes, authored audit findings and executable cases. Full external
# source downloads and exploratory renders are research inputs, not release assets.
def research_input(name):
    p = Path(name)
    if not name.startswith('validation/lung-next-v08426/'):
        return False
    if p.name in {'initial-log.txt','initial-results.json','recheck-log.txt','recheck-results.json','recheck2-log.txt','recheck2-results.json','historical-tests.log','historical-results.json','historical-recheck.log','historical-recheck-results.json','release-gate.log','web-primary-snapshots.json'}:
        return True
    if 'render-check' in p.parts or 'pdf-qa' in p.parts or p.suffix.lower() in {'.png','.jpg'}:
        return True
    if 'research' in p.parts and p.suffix.lower() in {'.pdf','.txt','.png','.jpg','.html'}:
        return True
    return p.parent.name == 'pembro-mono' and p.suffix.lower() in {'.pdf','.txt','.png'}
names = [n for n in names if not research_input(n)]
assert all((R/n).is_file() for n in baseline['files']), 'Baseline file deletion requires review'
names = [n for n in names if n not in baseline['files'] or hashlib.sha256((R/n).read_bytes()).hexdigest()!=baseline['files'][n]]
assert not any(n.startswith('SACTCheck_DROP_IN/') for n in names), 'Legacy drop-in is outside scope'
files = {}
for name in names:
    p = R / name
    assert p.is_file() and not p.is_symlink(), name
    data = p.read_bytes()
    files[name] = {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
manifest = {
    'release': '0.84.26', 'baseline_commit': base, 'required_base_release':'0.84.25', 'required_base_overlay_sha256':baseline['overlay_sha256'],
    'application': 'Apply v0.84.25 first, then extract this overlay at repository root; replace matching files; retain all others.',
    'deletions': [], 'file_count': len(files), 'files': files,
    'manifest_note': 'The manifest itself is included in the ZIP but excluded from its own digest table.'
}
(R / manifest_name).write_text(json.dumps(manifest, indent=2) + '\n')
archive = out / 'SACTCheck_v0.84.26_UPDATE.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for name in [*names, manifest_name]:
        z.write(R / name, name)
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    for name, spec in files.items():
        data = z.read(name)
        assert len(data) == spec['bytes'] and hashlib.sha256(data).hexdigest() == spec['sha256'], name
sha = hashlib.sha256(archive.read_bytes()).hexdigest()
(out / 'SACTCheck_v0.84.26_UPDATE.sha256').write_text(sha + '  ' + archive.name + '\n')
for name in ['APPLY_UPDATE_v0.84.26.txt', 'COMMIT_SUMMARY_v0.84.26.txt', 'COMMIT_DESCRIPTION_v0.84.26.txt', 'RELEASE_v0.84.26.md']:
    (out / name).write_bytes((R / name).read_bytes())
print(json.dumps({'archive': str(archive), 'files': len(files), 'bytes': archive.stat().st_size, 'sha256': sha}))
