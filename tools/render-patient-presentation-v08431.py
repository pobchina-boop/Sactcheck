from pathlib import Path
import json,subprocess,os,qrcode
R=Path(__file__).resolve().parents[1]
routes=json.loads((R/'data/patient-presentation-v08431.json').read_text())['routes']
for route in routes:
 code,*context=route.split('/');env={**os.environ,'SACT_SUITE_CODES':code,'SACT_SUITE_CONTEXT':context[0] if context else ''}
 for script in ['build-patient-knowledge.cjs','build-complete-pathways.cjs']:
  subprocess.run(['node','tools/'+script],cwd=R,env=env,check=True,stdout=subprocess.DEVNULL)
 qrcode.make('https://sactcheck.com/patient/'+route+'/knowledge.html').save(R/'patient'/route/'oncowiki-qr.png')
 print(route,flush=True)
