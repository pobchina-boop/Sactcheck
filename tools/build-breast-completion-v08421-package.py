"""Build the cumulative v0.84.21 overlay from the recorded GitHub baseline."""
from pathlib import Path
import hashlib, json, subprocess, sys, zipfile

R = Path(__file__).resolve().parents[1]
out = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else R.parent / 'deliverables-v08421'
out.mkdir(parents=True, exist_ok=True)
base = '60e7bbfb1c3a58a9ca1ad5ddc6c93a7931aa77dc'
manifest_name = 'UPDATE_MANIFEST_v0.84.21.json'
def git(*args):
    return subprocess.check_output(['git', '-C', str(R), *args]).decode().split('\0')

assert not any(git('diff', base, '--name-only', '--diff-filter=D', '-z')), 'Review deleted files before packaging'
names = set(git('diff', base, '--name-only', '-z')) | set(git('ls-files', '--others', '--exclude-standard', '-z'))
excluded = {'.git', '.openai', '_site', 'dist', 'node_modules', '__pycache__'}
names = sorted(n for n in names if n and n != manifest_name
               and not excluded.intersection(Path(n).parts) and not n.endswith('.pyc'))
assert not any(n.startswith('SACTCheck_DROP_IN/') for n in names), 'Legacy drop-in is outside scope'
files = {}
for name in names:
    p = R / name
    assert p.is_file() and not p.is_symlink(), name
    data = p.read_bytes()
    files[name] = {'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
manifest = {
    'release': '0.84.21', 'baseline_commit': base,
    'complete_v08420_archive_sha256': 'e992a4e968b54fc0d239287c99420ff811e1e2e72b304b1cfc28dbffd201a075',
    'application': 'Extract at repository root; replace matching files; retain all others.',
    'deletions': [], 'file_count': len(files), 'files': files,
    'manifest_note': 'The manifest itself is included in the ZIP but excluded from its own digest table.'
}
(R / manifest_name).write_text(json.dumps(manifest, indent=2) + '\n')
archive = out / 'SACTCheck_v0.84.21_UPDATE.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as z:
    for name in [*names, manifest_name]:
        z.write(R / name, name)
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    for name, spec in files.items():
        data = z.read(name)
        assert len(data) == spec['bytes'] and hashlib.sha256(data).hexdigest() == spec['sha256'], name
sha = hashlib.sha256(archive.read_bytes()).hexdigest()
(out / 'SACTCheck_v0.84.21_UPDATE.sha256').write_text(sha + '  ' + archive.name + '\n')
for name in ['APPLY_UPDATE_v0.84.21.txt', 'COMMIT_SUMMARY_v0.84.21.txt', 'COMMIT_DESCRIPTION_v0.84.21.txt', 'RELEASE_v0.84.21.md']:
    (out / name).write_bytes((R / name).read_bytes())
print(json.dumps({'archive': str(archive), 'files': len(files), 'bytes': archive.stat().st_size, 'sha256': sha}))
