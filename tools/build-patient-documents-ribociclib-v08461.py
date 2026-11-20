"""Ribociclib review; retain all existing clinical and PDF contracts."""
from pathlib import Path
import importlib.util, sys, subprocess
R=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('book61',R/'tools/build-patient-documents-v08461.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
if __name__=='__main__':
 if '--routes' not in sys.argv or set(sys.argv[sys.argv.index('--routes')+1].split(','))-{'00525','00892'}:raise SystemExit('Explicit ribociclib routes required')
 m.b44.main()
 if "--publish" in sys.argv:subprocess.run(["node",str(R/"tools/patient-publication-v08444.cjs"),"--routes",sys.argv[sys.argv.index("--routes")+1],"--write"],cwd=R,check=True)
