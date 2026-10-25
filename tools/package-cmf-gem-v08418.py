"""Package the reviewed v0.84.18 delta over verified Git baseline e6bd944."""
from pathlib import Path
import hashlib,json,subprocess,sys,zipfile
R=Path(__file__).resolve().parents[1]
def git(*args):return subprocess.check_output(['git',*args],cwd=R,text=True)
assert git('rev-parse','--short=7','HEAD').strip()=='e6bd944','Review the release baseline before packaging'
assert not git('diff','--name-only','--diff-filter=D','HEAD').strip(),'This update must not require deletions'
paths=set(git('diff','--name-only','--diff-filter=AM','HEAD').splitlines()+git('ls-files','--others','--exclude-standard').splitlines())
def include(p):
 if p.split('/')[0] in ['.openai','_site','node_modules','.git']:return False
 if any(part.startswith('.') for part in p.split('/')):return False
 if '__pycache__' in p or p.endswith(('.pyc','.zip')):return False
 if p.startswith('validation/cmf-gem-v08418/') and '/sources/' in p:return p.endswith('/manifest.json')
 return True
paths=sorted(p for p in paths if include(p) and (R/p).is_file())
assert 'index.html' in paths and 'package.json' in paths
manifest={'release':'0.84.18','baseline':'v0.84.17 e6bd944ac3132d517959aa9c227d6bac74a6a9b7','mode':'Merge into repository root and replace matching files; retain all other files. No deletions.','files':[{'path':p,'bytes':(R/p).stat().st_size,'sha256':hashlib.sha256((R/p).read_bytes()).hexdigest()} for p in paths]}
out=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else R.parent/'SACTCheck-v0.84.18-update.zip'
out.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for p in paths:z.write(R/p,p)
 z.writestr('UPDATE_MANIFEST_v0.84.18.json',json.dumps(manifest,indent=2)+'\n')
with zipfile.ZipFile(out) as z:
 assert z.testzip() is None
 for row in manifest['files']:assert hashlib.sha256(z.read(row['path'])).hexdigest()==row['sha256']
 assert len(z.namelist())==len(paths)+1
print(json.dumps({'zip':str(out),'payload_files':len(paths),'zip_bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'manifest_verified':True}))
