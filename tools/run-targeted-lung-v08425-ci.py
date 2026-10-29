"""Execute every npm test:ci leaf command, preserving order and exit evidence."""
from pathlib import Path
import json,re,subprocess,time,sys
R=Path(__file__).resolve().parents[1]
P=json.loads((R/'package.json').read_text())['scripts']
O=R/'validation/targeted-lung-v08425';O.mkdir(exist_ok=True)
name=sys.argv[1] if len(sys.argv)>1 else 'CI'
def expand(script,stack=()):
 assert script not in stack,stack
 result=[]
 for command in P[script].split(' && '):
  match=re.fullmatch(r'npm (?:run )?([\w:-]+)',command.strip())
  result.extend(expand(match[1],stack+(script,)) if match and match[1] in P else [command])
 return result
commands=expand('test:ci');rows=[]
with (O/(name+'-log.txt')).open('w') as log:
 for i,command in enumerate(commands,1):
  log.write(f'\n[{i}/{len(commands)}] {command}\n');log.flush();start=time.monotonic()
  result=subprocess.run(command,shell=True,executable='/bin/bash',cwd=R,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
  log.write(result.stdout);log.flush()
  row=dict(command=command,exit_code=result.returncode,seconds=round(time.monotonic()-start,3));rows.append(row)
  if result.returncode:print('FAIL',command,flush=True)
report=dict(release='0.84.25',script='test:ci',shell='/bin/bash',commands=len(rows),passed=sum(r['exit_code']==0 for r in rows),failed=sum(r['exit_code']!=0 for r in rows),results=rows)
(O/(name+'-results.json')).write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='results'}),flush=True)
sys.exit(bool(report['failed']))
