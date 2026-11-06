from pathlib import Path
import json,hashlib,shutil
O=Path(__file__).resolve().parent;R=O.parents[2];research=R.parent/'neuro-v39-research'
p=R/'protocols/neuro-oncology/00813-bevacizumab-5-mg-kg-monotherapy-14-day.json'
d=json.loads(p.read_text());results=json.loads((O/'source-case-results.json').read_text());before_results=json.loads((O/'source-case-before-results.json').read_text());old=json.loads((O/'00813-before.json').read_text())
assert results['failed']==0
# This changes only audit-status metadata after all clinical assertions pass.
d['metadata']['validation']['software_tests_completed']=True
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
sha=lambda file:hashlib.sha256(file.read_bytes()).hexdigest()
sources=[row for row in json.loads((research/'source-index.json').read_text()) if row['code']=='00813']
sources[0]['local_file']='sources/00813-nccp.pdf';sources[0]['baseline_protocol']='00813-before.json';sources[0]['visual_table_inspection']='sources/00813-tables.png'
for row in json.loads((research/'supplemental-source-index.json').read_text()):
 if row['id'] in ['avastin-ema-smPC','catalogue']:
  row['path']='sources/'+Path(row['path']).name;sources.append(row)
shutil.copyfile(research/'sources/catalogue.html',O/'sources/catalogue.html')
(O/'source-index.json').write_text(json.dumps(sources,indent=2)+'\n')
findings=[
 {'id':'B01','severity':'high','topic':'Grade 3 hypertension persistence','before':'Every hypertension grade ≥3 triggered discontinuation despite prose requiring persisting grade 3.','after':'Grade 2–3 triggers therapy/review; explicit persistence or grade 4 triggers discontinuation.','source':'NCCP p4 Table 3'},
 {'id':'B02','severity':'high','topic':'Unsupported severe BP stop threshold','before':'The legacy >200/110 boolean produced discontinuation without this threshold appearing in NCCP 00813.','after':'Urgent hold/review preserves safety; separate crisis, unresponsive medically significant hypertension, and source-defined initiation checks govern outcomes.','source':'NCCP p4 Table 3/footnote; EMA p6'},
 {'id':'B03','severity':'high','topic':'Urine testing sequence','before':'A 2+/3+ dipstick could repeatedly permit proceeding without distinguishing the next dose after an abnormal screen.','after':'Initial/routine screen, next dose after abnormal screen, and post-hold reassessment are distinct. Required quantification and the three-day collection window are explicit.','source':'NCCP p4 Table 2'},
 {'id':'B04','severity':'high','topic':'Distinct urine units and quantitative boundaries','before':'No separate urine concentration input; screening and quantitative timing/validity were incomplete.','after':'g/L screening is separate from g/24 h total. Tests cover 1 g/L, ≤2, >2–4, >4 g/24 h, invalid/absent collection confirmation and discordant results.','source':'NCCP p4 Table 2'},
 {'id':'B05','severity':'high','topic':'Previous discontinuation persists after recovery','before':'No source-specific prior-stop history was available.','after':'Prior stop reasons remain active despite normal BP, urine or grade values. No automatic restart or invented lower dose is supplied.','source':'NCCP p4 Tables 2–3; EMA pp5–7'},
 {'id':'B06','severity':'high','topic':'Grade 4 proteinuria and nephrotic syndrome','before':'Quantitative >4 g/24 h alone did not cover the independent grade 4/nephrotic pathway.','after':'Explicit clinician-confirmed source grade 4 proteinuria and nephrotic syndrome checks remain actionable independently of a lower numerical result.','source':'NCCP p4 Table 3; EMA p7'},
 {'id':'B07','severity':'high','topic':'Tracheoesophageal fistula at any grade','before':'Only generic grade 4 fistula was assessed.','after':'Any-grade tracheoesophageal fistula triggers permanent discontinuation; other internal fistulae require consideration of discontinuation.','source':'NCCP p4 Table 3; EMA p6'},
 {'id':'B08','severity':'high','topic':'Surgery interval and healing','before':'One compound boolean did not expose the interval/healing conjunction.','after':'<28 days, incomplete healing and wound complications independently withhold. ≥28 days without healing confirmation cannot clear treatment. Elective surgery timing remains individualised.','source':'NCCP p2; EMA p6'},
 {'id':'B09','severity':'high','topic':'Bleeding site and current versus historical thrombosis','before':'Generic grades did not cover current intracranial bleeding or recent haemoptysis, and arterial history could be confused with a new event.','after':'Intracranial bleeding, >2.5 mL red-blood haemoptysis, new arterial events, lower-grade VTE and source-specific major bleeding actions are separated.','source':'NCCP pp2,4; EMA p7'},
 {'id':'B10','severity':'moderate','topic':'Eligibility and breastfeeding','before':'Recurrent glioblastoma context/organ adequacy were not assessed explicitly and breastfeeding was omitted.','after':'Exact indication and clinical organ adequacy are reviewed without fabricated ANC/platelet thresholds; breastfeeding is an exclusion. Existing ECOG/imaging/ICH/stroke exclusions are retained.','source':'NCCP pp1–2'},
 {'id':'B11','severity':'moderate','topic':'Infusion and suspected acute neurological events','before':'Confirmed PRES existed; acute infusion reaction and suspected neurological concern were absent.','after':'Stop the active infusion and treat reactions; urgent hold/review for new neurological symptoms. Confirmed PRES stops therapy and restart safety remains unknown.','source':'EMA pp6,8; urgent clinical assessment interpretation'},
 {'id':'B12','severity':'moderate','topic':'Monitoring and supportive-care specificity','before':'Required monitoring and conditional cardiac/INR considerations were not decision inputs.','after':'FBC/renal/liver/urine checks, BP before and after treatment, conditional ECHO and warfarin INR timing are explicit. Minimal emetic risk and no routine premedication are preserved.','source':'NCCP pp2–3,5'},
 {'id':'B13','severity':'moderate','topic':'Risk and interaction review','before':'Several cautions were not available to the decision tool.','after':'Cardiovascular, renal/proteinuria, bleeding/clotting, pelvic RT/perforation, aneurysm, dental/IV bisphosphonate and interaction concerns are review pathways.','source':'NCCP p2; EMA pp7–9'},
 {'id':'B14','severity':'moderate','topic':'No arbitrary dose reductions','before':'Standard schedule was prose-only and actions had no explicit numeric-modification guard.','after':'Structured 5 mg/kg Day 1 every 14 days without fixed cycle count; every toxicity action blocks inferred numeric dose adjustment. Renal/hepatic guidance does not override eligibility or toxicity.','source':'NCCP pp1,3 Table 1'},
 {'id':'B15','severity':'moderate','topic':'Source grading and provenance','before':'Generic grade selectors risked being interpreted as CTCAE v5 without source reconciliation; source pages were broad placeholders.','after':'Clinician-confirmed source grading is explicitly labelled, with no automatic v3-to-v5 conversion. Every rule has a URL, page, section and retained PDF SHA.','source':'NCCP p4; EMA adverse-event sections'},
 {'id':'B16','severity':'moderate','topic':'Fertility and ongoing precautions','before':'No dedicated advice-plan review was encoded.','after':'Contraception/fertility discussion and breastfeeding restrictions are part of the review; women are advised contraception during and up to six months after, and no breastfeeding for at least six months after the last dose.','source':'EMA p10 section 4.6'}
]
old_ids=[r.get('id',r.get('rule_id')) for r in old['rule_engine']['rules']]
new_ids=[r['id'] for r in d['rule_engine']['rules']]
report={
 'release':'0.84.39','code':'00813','status':'Source reconciled and software cases passed; independent clinical/pharmacy review pending',
 'scope':'One staged protocol and its audit evidence only; active v0.84.38 checkout unchanged',
 'source_date':'2026-11-05','protocol_file':str(p.relative_to(R)),
 'before_sha256':sha(O/'00813-before.json'),'after_sha256':sha(p),
 'source_sha256':d['metadata']['source_pdf_sha256'],'source_version':'NCCP 00813 v2, 24 July 2024',
 'before_rule_count':len(old_ids),'after_rule_count':len(new_ids),'input_count':len(d['input_definitions']),
 'all_existing_rule_ids_retained':set(old_ids)<=set(new_ids),
 'of590_rules_before':[v for v in old_ids if v.startswith('OF590')],
 'of590_rules_after':[v for v in new_ids if v.startswith('OF590')],
 'source_cases':{k:results[k] for k in ['total','passed','failed']},
 'before_comparison':{**{k:before_results[k] for k in ['total','passed','failed']},'interpretation':'Failed expectations include newly introduced capabilities and provenance, not a count of separate clinical defects. Source-criterion witness assertions apply only to the candidate.'},
 'rule_positive_witness_count':len(json.loads((O/'criterion-matrix.json').read_text())),
 'schema':{'errors':0,'warnings':0},'source_pdf_table_visual_check':'NCCP page 4 rendered and inspected; table boundaries/conjunctions checked against raw text',
 'clinical_approval':{'consultant_reviewed':False,'oncology_pharmacy_reviewed':False,'clinical_use_authorised':False},
 'findings':findings,'uncertainties':d['source_audit']['uncertainties'],
 'not_claimed':['Independent clinical or pharmacy sign-off','Patient/PPI approval','Browser/PDF/QR service integration completed by this bounded audit','Deployment or live-site verification'],
 'test_command':'SACT_TEST_ROOT=<main-checkout> node validation/neuro-oncology-v08439/bevacizumab-source-audit/source-cases.cjs',
 'source_files':'source-index.json','criterion_matrix':'criterion-matrix.json'
}
(O/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
lines=['# NCCP 00813 source audit — v0.84.39','',report['status']+'.','',f"The retained baseline has {report['before_rule_count']} rules; the candidate has {report['after_rule_count']} rules and {report['input_count']} decision inputs. All existing rule IDs remain represented. No OF590 rules existed in this protocol.",'',f"**Validation:** {results['passed']}/{results['total']} checks passed; schema has no errors or warnings. Every rule has a positive source-case witness. The baseline fails {before_results['failed']}/{before_results['total']} comparable expectations; this is not a count of distinct clinical defects.",'','## Source evidence','', '- NCCP 00813 v2: published 2 May 2023; revised 24 July 2024; review due 24 July 2029. Fresh official PDF retrieved 5 November 2026. Page 4 was rendered and visually inspected.','- Current EMA Avastin product information was independently retrieved. Its product-wide safety instructions supplement the disease-specific NCCP regimen. No unsupported glioblastoma dose or indication was imported from EMA.','- Source URLs, redirects, retrieval timestamps, checksums and local files are in `source-index.json`.','', '## Findings','']
for f in findings:lines.extend([f"### {f['id']} · {f['topic']}",'',f"Before: {f['before']}",f"After: {f['after']}",f"Source: {f['source']}.",''])
lines.extend(['## Deliberate uncertainty','']+['- '+s for s in report['uncertainties']]+['','## Verification boundaries','','The assessment engine and dose renderer were exercised. These checks establish implemented software behaviour against the recorded sources; independent clinical and oncology-pharmacy approval remains pending. Shared patient, consent, browser and PDF/QR integration is performed by the release owner. This audit did not commit, push or deploy.','','## Reproduction','','```bash',report['test_command'],'```','','The retained before snapshot, complete case results and criterion matrix allow review without relying on an aggregate pass count.'])
(O/'report.md').write_text('\n'.join(lines)+'\n')
print(json.dumps({k:report[k] for k in ['after_sha256','source_cases','before_comparison','after_rule_count']},indent=2))
