"""Inventory authored suites; do not equate authoring with clinical approval."""
from pathlib import Path
import csv,json
R=Path(__file__).resolve().parents[1];rows=[];done={'00858','00860','00861','00348','00734','00857'}
for p in sorted((R/'data/patient-knowledge').glob('*.json')):
 d=json.loads(p.read_text());code=d['code'];agents='; '.join(a['name'] for a in d['agents']);s=agents.lower()
 family='HER2-directed breast' if any(x in s for x in ['trastuzumab','pertuzumab']) else 'Breast endocrine / CDK4/6' if any(x in s for x in ['letrozole','anastrozole','exemestane','tamoxifen','fulvestrant','ribociclib','abemaciclib','palbociclib','everolimus']) else 'Breast cytotoxic / targeted' if (R/'protocols/breast').glob(code+'-*') and any((R/'protocols/breast').glob(code+'-*')) else 'Other tissue libraries'
 status='completed_in_0.84.13' if code in done else 'pending_source_and_audience_review'
 rows.append(dict(code=code,title=d['title'],authored_release=d.get('suite_release','gold_standard_00568'),family=family,new_rationale_evidence_status=status,patient_numeric_evidence_present=bool(d.get('evidence')),longitudinal_map_present=bool(d.get('longitudinal_mapping')),clinical_approval='not_established_by_this_inventory',next_action='Review exact indication/line, primary comparative evidence, effect size/maturity, alternatives, patient audience, phase schedules and monitoring before publication.' if code not in done else 'Independent clinical/pharmacy review remains pending.'))
out=R/'validation/tnbc-v08413';(out/'retrospective-inventory.json').write_text(json.dumps(dict(release='0.84.13',authored_suites=len(rows),previous_authored_suites=len(rows)-5,reviewed_this_release=6,new_suites=5,retrospective_revised=1,remaining_review_queue=len(rows)-6,definition='Authored patient knowledge record with full-suite services, including original 00568. Counts do not mean clinical validation.',rows=rows),ensure_ascii=False,indent=2)+'\n')
with (out/'retrospective-inventory.csv').open('w',newline='') as f:
 w=csv.DictWriter(f,fieldnames=rows[0]);w.writeheader();w.writerows(rows)
print(len(rows),'authored suites;',len(rows)-6,'remaining for indication-specific evidence/rationale review')
