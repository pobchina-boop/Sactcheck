from pathlib import Path
import importlib.util,json
R=Path(__file__).resolve().parents[3];O=Path(__file__).parent
spec=importlib.util.spec_from_file_location('b',R/'tools/build-patient-handbooks-v08436.py');b=importlib.util.module_from_spec(spec);spec.loader.exec_module(b)
reference='00209,00210,00213,00227,00238,00321,00421,00427,00428,00446,00449,00486,00555,00586,00623,00660,00691,00783,00791,00558/colorectal,00890'.split(',')
support='00209,00227,00321,00421,00427,00428,00486,00586,00623,00660,00448'.split(',')
wallet='00227,00321,00427,00428,00486,00586,00623'.split(',')
pump='00421,00555,00783'.split(',')
matrix={}
for route in sorted(set(reference+support+wallet+pump)):
 refresh=set()
 if route in reference:refresh.add('knowledge.pdf')
 if route in support:refresh.add('supportive-care.pdf')
 if route in wallet:refresh.update(['guide.pdf','sactcard.pdf'])
 if route in pump:refresh.add('logistics.pdf')
 matrix[route]=sorted(refresh)
(O/'affected-asset-matrix.json').write_text(json.dumps({'full_suites':['00216','00692'],'section_refreshes':matrix,'standalone_companions':{'00421':['port-pump'],'00555':['port-pump'],'00783':['port-pump'],'00448':['support-fourteen_day_cycle']}},indent=2)+'\n')
report=O/'handbooks.json';rows=json.loads(report.read_text()) if report.exists() else []
for route,refresh in matrix.items():
 row=b.build(route,set(refresh));rows=[r for r in rows if r['route']!=route]+[row];report.write_text(json.dumps(rows,indent=2)+'\n');print(route,row['handbook_pages'],'pages;',len(row['documents']),'PDFs',flush=True)
