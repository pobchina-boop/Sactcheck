from pathlib import Path
import json,hashlib
A=Path(__file__).resolve().parent; S=A.parents[2]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
after=json.loads((A/'source-case-results.json').read_text());before_results=json.loads((A/'source-case-before-results.json').read_text())
assert after['failed']==0
records=[]
for code in ['00742','00804']:
 f=next((S/'protocols/neuro-oncology').glob(code+'*')); b=A/'protocol-before'/f.name
 p=json.loads(f.read_text()); old=json.loads(b.read_text())
 p['metadata']['validation']['source_boundary_tests_completed']=True
 p['metadata']['validation']['source_boundary_test_evidence']='validation/neuro-oncology-v08439/lomustine-bev-source-audit/source-case-results.json'
 p['metadata']['validation']['software_tests_scope_note']='Source-boundary/assessment/dose-output checks passed. Full release, browser, PDF and QR checks must be completed after integration; software_tests_completed remains false until then.'
 f.write_text(json.dumps(p,ensure_ascii=False,indent=2)+'\n')
 ids=lambda x:{r.get('id',r.get('rule_id')) for r in x['rule_engine']['rules']}
 records.append({'code':code,'file':str(f.relative_to(S)),'before_sha256':sha(b),'after_sha256':sha(f),'inputs_before':len(old['input_definitions']),'inputs_after':len(p['input_definitions']),'rules_before':len(old['rule_engine']['rules']),'rules_after':len(p['rule_engine']['rules']),'added_rule_ids':sorted(ids(p)-ids(old)),'removed_rule_ids':sorted(ids(old)-ids(p)),'source_conflicts':p['metadata']['source_conflicts']})
findings=[
 {'id':'LB01','priority':'high','finding':'Grade 3 hypertension previously triggered discontinuation without establishing persistence.','resolution':'Separate grade 2/3 review from persisting grade 3 or grade 4 discontinuation; preserve uncontrolled/symptomatic treatment-day hold and product-specific permanent-stop pathways.','source':'NCCP p4 Table4; EMA SmPC4.4 pp6-7'},
 {'id':'LB02','priority':'high','finding':'Platelet range 80-99 omitted fractional values above 99; prior hold recovery was not independently represented.','resolution':'Use >=80 and <100 for the unallocated source band; existing count-related holds require both ANC>=1 and platelets>=100. No unsupported reduction percentage.','source':'NCCP p3 Table1'},
 {'id':'LB03','priority':'high','finding':'DLCO<60 was used as an automatic stopping threshold unsupported by these documents.','resolution':'Replace with source-qualified FVC or DLCO<70% pulmonary-risk review. New symptoms still prompt assessment.','source':'00742 p6; lomustine SmPC4.4 p3'},
 {'id':'LB04','priority':'high','finding':'Severe hepatic impairment, repeat interval, cumulative exposure and restart context were absent.','resolution':'Add severe-hepatic not-recommended hold/review, minimum 42-day repeat interval, cumulative product limit 1000 mg/m2, and prior dose/nadir/count review.','source':'NCCP p3 Table2; lomustine SmPC4.2 pp1-2'},
 {'id':'LB05','priority':'high','finding':'Intracranial haemorrhage, recent stroke/MI and minimal-enhancement/gliomatosis exclusions were absent.','resolution':'Add explicit regimen exclusions, retain individual relevance and distinguish baseline indication/eligibility review from clearance.','source':'NCCP pp1-2'},
 {'id':'LB06','priority':'high','finding':'Nephrotic syndrome and tracheoesophageal fistula were not independent stop pathways.','resolution':'Separate nephrotic syndrome from dipstick4+ and quantified protein; any TE fistula stops even below grade4. Add other internal-fistula review.','source':'NCCP p4 Tables3-4; EMA SmPC4.4 pp5-7'},
 {'id':'LB07','priority':'high','finding':'Separate lomustine Day1 and bevacizumab-only administrations lacked executable context.','resolution':'Guard lomustine administration rules on bevacizumab-only visits; delayed toxicity still requires consultant assessment. Preserve 5mg/kg Days1/15/29 versus 7.5mg/kg Days1/22 within 42-day cycles, up to6 cycles.','source':'NCCP p1'},
 {'id':'LB08','priority':'high','finding':'Lomustine renal reduction could produce false precision from a nominal schedule without knowing the original capped dose.','resolution':'Show NCCP 75% of ORIGINAL dose at CrCl30-50 inclusive as consultant review, block automatic numeric multiplication and reconcile previous actual dose, cap and reductions. Below30 or haemodialysis is not recommended.','source':'NCCP p3 Table2'},
 {'id':'LB09','priority':'high','finding':'Surgery timing did not independently establish wound healing.','resolution':'At least28 days after major surgery AND complete healing are required; missing healing remains unassessed. Preserve 00742-specific preoperative guidance; do not transplant it into00804.','source':'00742 p5; EMA SmPC4.4 p6'},
 {'id':'LB10','priority':'moderate','finding':'Monitoring, drug interactions, support readiness and product-supply safety needed explicit review.','resolution':'Add review flags and handoff for weekly CBC for at least6 weeks after lomustine, PFT planning, warfarin INR, BP/protein, single-course capsule supply, and separate antiemetic plans for oral lomustine versus bevacizumab-only visits.','source':'NCCP pp2-3,5; lomustine SmPC4.2-4.5 pp2-3'},
 {'id':'LB11','priority':'high','finding':'Current common lomustine SmPC conflicts or ambiguities cannot be resolved by copying a dose table.','resolution':'Preserve NCCP ANC versus product WBC recovery difference, overlapping nadir platelet rows, PFT scheduling difference, and contraception6months versus women7/men4months. Require product-specific clinical/pharmacy reconciliation.','source':'NCCP p3 Table1/p5; lomustine common SmPC revision2026-01-16 sections4.2/4.4/4.6'},
 {'id':'LB12','priority':'moderate','finding':'Consent could conflate treatment licensing and infusion method.','resolution':'Document glioblastoma outside current EMA Avastin indications, NCCP unlicensed lomustine supply, and separate off-label rapid-infusion method.','source':'NCCP p1; EMA SmPC4.1'}
]
limits=[
 'This is staged protocol implementation and source-boundary validation only; no production checkout files, shared support scripts, patient assets or release metadata were changed by this agent.',
 'No independent consultant, oncology-pharmacy or patient/PPI validation; clinical_use_authorised remains false.',
 'Full software release, browser/UI, PDFs, QR decoding and deployed-route checks remain for parent integration. The two JSONs reference a NEW support script that must be authored/registered before release.',
 'Current-source coverage does not prove that every clinical state is safely automated. Source uncertainty and clinically judged severity remain explicit.',
 'Conservative holds for suspected serious toxicity/infection are assessment safety pathways derived from warnings, not newly invented NCCP numeric dose tables.',
 'No numeric restart dose is fabricated. Reference schedule retains lomustine90mg/m2 cap160mg; renal75% recommendation requires the actual original capped dose/history.',
 'The before/after case counts differ because missing/blank checks enumerate current fields.336 failing historical checks are test assertions, not336 unique clinical defects.',
 'The source downloads reflect retrieval on2026-11-05; later product/catalogue revisions require renewed verification.'
]
patient={
 'schedule':'00742: bevacizumab5mg/kg D1/15/29;00804:7.5mg/kg D1/22. Both lomustine90mg/m2 max160mg D1 only, q42days up to6cycles. No daily lomustine. No RT schedule inferred.',
 'support_script_required':'nccp-lomustine-bev-v08439: oral moderate-high lomustine Day1, minimal bevacizumab-only days; verify local medicines and pharmacy mapping.',
 'monitoring':'Show baseline and ongoing bloods, BP and urine protein; product weekly CBC for at least6weeks after lomustine; delayed marrow nadir commonly4-6weeks; conditional renal/liver/PFT/echo/INR plans; no fabricated mandatory MRI frequency.',
 'toxicity_anatomy':'Preserve full approved detailed anatomy. Anchor marrow/infection/bleeding, lungs/delayed fibrosis, brain/headache/seizure/PRES, blood vessels/BP/clots/bleeding, kidneys/proteinuria, gut/perforation/fistula, wound healing, nausea and fertility. Do not replace with simplified body diagram.',
 'three_page_pack':'Page1 schedule, phases and tests; page2 complete regimen-specific anatomical toxicity; page3 front/back wallet, six-cycle tracker, cutting/print instructions, automatic regimen QR, labelled placeholder contacts and webapp steps. Complete printable handbook must retain all content offline.',
 'consent':'Discuss treatment intent, evidence limitations and EMA off-label glioblastoma context; lomustine unlicensed supply; rapid bevacizumab infusion is a separate governance issue.',
 'contraception':'Do not use generic six-month wording for everyone without reconciliation: NCCP six months versus current lomustine common product women seven months/men four months; bevacizumab component/actual product must also be checked.',
 'clv_reference_boundary':'The supplied glioma patient reference does not establish medulloblastoma/PNET disease education for00806 CLV. That third protocol needs separate disease-appropriate patient evidence.',
 'research_handoff':'All five current NCCP PDFs, texts, hashes and detailed requirements are retained under neuro-v39-research/source-requirements.json.00805/00813/00806 remain implementation tasks for other owners.'
}
report={'release':'0.84.39','status':'STAGED_SOURCE_RECONCILIATION_TESTED_NOT_INTEGRATED','date':'2026-11-05','baseline_checkout_head':'c19bef57ca5ae49816ad851f2b551b76af32fa5d','runtime':'Node24.22.1','protocols':records,'findings':findings,'tests':{k:v for k,v in after.items() if k!='cases'},'historical_probe':{k:v for k,v in before_results.items() if k!='cases'},'sources':json.loads((A/'source-index.json').read_text()),'integration_handoff':patient,'limitations':limits}
(A/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
lines=['# Lomustine / bevacizumab source audit — staged v0.84.39','', 'This staged audit covers NCCP00742 v3 and00804 v2. The production checkout was not modified by this agent. Both remain pending independent clinical and oncology-pharmacy validation.','', '## Evidence and validation','', '- Fresh official NCCP PDFs and catalogue plus current EMA Avastin and manufacturer common lomustine SmPC were retrieved on2026-11-05 with ordinary HTTPS and retained with hashes.','- Each protocol now has62 inputs and68 decision rules, compared with26 inputs and31 rules before.','-826/826 source-boundary and assessment/dose-output checks passed; all68 rules per protocol were exercised. The real checkout assessment engine, dose renderer and protocol validator were used.','- Historical probe:346/682 checks passed,336 failed. Different input counts explain different totals; failures are not unique defects.','- No automatic numeric restart or dose multiplication is emitted from incomplete dose history. The reference schedule and160mg cap remain available.','', '## Findings','']
for f in findings:lines += [f'### {f["id"]}: {f["finding"]}', '',f['resolution'], '',f'Source: {f["source"]}.','']
lines += ['## Source conflicts retained','']
for x in records[0]['source_conflicts']:lines += [f'- **{x["topic"]}:** {x["resolution"]}']
lines += ['', '## Integration handoff','']
for k,v in patient.items():lines += [f'- **{k.replace("_"," ")}:** {v}']
lines += ['', '## Limits','']+[f'- {x}' for x in limits]
lines += ['', '## Re-run','', '```bash','SACT_TEST_ROOT=/path/to/checkout node validation/neuro-oncology-v08439/lomustine-bev-source-audit/source-cases.cjs','```','', 'Without SACT_TEST_ROOT, the script uses the package root containing the integrated protocols and JS. build.py is an authoring helper and requires retained research via SACT_RESEARCH_ROOT; it is not a runtime/build dependency. report.json records exact protocol/source hashes and added/removed rule identifiers.','']
# Readable prose spacing; keep code blocks and identifiers intact.
text='\n'.join(lines)
for a,b in [('NCCP00742','NCCP 00742'),('and00804','and 00804'),('on2026','on 2026'),('with26','with 26'),('and31','and 31'),('has62','has 62'),('and68','and 68'),('all68','all 68'),('-826/','- 826/'),('probe:346','probe: 346'),(',336',', 336'),('and160mg','and 160 mg')]:text=text.replace(a,b)
(A/'report.md').write_text(text)
(A/'patient-integration-handoff.json').write_text(json.dumps(patient,indent=2)+'\n')
print('Wrote report, hashes, staged source-test metadata, patient handoff')
