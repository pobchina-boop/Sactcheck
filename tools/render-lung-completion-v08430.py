"""Generate only this release's canonical and phase-specific patient routes."""
from pathlib import Path
import os,json,subprocess
R=Path(__file__).resolve().parents[1];A=json.loads((R/'data/lung-completion-v08430-authoring.json').read_text())['regimens']
builders=['tools/build-patient-knowledge.cjs','tools/build-phase-support-v0838.cjs','tools/build-complete-pathways.cjs']
canonical=[c for c,x in A.items() if not x['patient'].get('patient_context_selector')]
routes=[(','.join(canonical),'')]+[(c,s) for c,x in A.items() for s in x.get('patient_contexts',{})]
subprocess.run(['node','tools/build-breast-journeys.cjs'],cwd=R,check=True)
for codes,context in routes:
 env=dict(os.environ,SACT_SUITE_CODES=codes,SACT_SUITE_CONTEXT=context)
 for builder in builders:subprocess.run(['node',builder],cwd=R,env=env,check=True)
subprocess.run(['python','tools/build-lung-completion-routes-v08430.py'],cwd=R,check=True)
