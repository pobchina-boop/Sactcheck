from pathlib import Path
import json,hashlib
H=Path(__file__).resolve().parent
A=json.load(open(H/'authoring.json'))['regimens'];report=json.load(open(H/'source-results.json'))
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
sources=[]
for code,drug,trade,version,nccp_date,review,product_date in [('00221','afatinib','Giotrif','5','2025-03-21','2030-03-21','2026-05-11'),('00565','dacomitinib','Vizimpro','3','2021-06-23','2026-06-23','2024-12-17')]:
 for kind in ['nccp','smpc']:
  s=A[code]['patient']['sources'][0 if kind=='nccp'else 1];pdf=H/'research'/f'{drug}-{kind}.pdf';txt=pdf.with_suffix('.txt')
  sources.append(dict(id=f'{code}-{kind}',code=code,kind='operational_nccp'if kind=='nccp'else'product_information_supplement',title=s['title'],url=s['url'],version=version if kind=='nccp'else'EMA product information',version_date=nccp_date if kind=='nccp'else product_date,review_due=review if kind=='nccp'else None,retrieved='2026-10-29',pdf_sha256=digest(pdf),text_sha256=digest(txt),local_pdf=str(pdf.relative_to(H)),local_text=str(txt.relative_to(H)),pages_checked='All NCCP pages; tables on pages 2–3 visually inspected'if kind=='nccp'else'Sections 4.1–4.6 and 5.1; dosing/organ tables on PDF pages 3–4 visually inspected',visual_evidence=[f'research/{drug}-{kind}-p{p}.png'for p in ([2,3]if kind=='nccp'else[3,4])],scope_note='Current link from HSE lung catalogue confirmed on retrieval date; source version is not independent approval.'if kind=='nccp'else'Current EMA product information downloaded; supplemental source distinct from NCCP.'))
 for s in A[code]['patient']['sources'][4:]:sources.append(dict(id=code+'-'+s['id'],code=code,kind='primary_trial_publication',title=s['title'],url=s['url'],retrieved='2026-10-29',method='Primary publication abstract and available full text checked through web search; endpoint/population/comparator retained.',clinical_use_authorised=False))
for name,alias,url,pages in [('oral-antiemetic','NCCP SACT antiemetic guidance V6 2025','https://healthservice.hse.ie/documents/7152/Classification_Document_for_Systemic_Anti-_Cancer_Therapy_SACT_Induced_Nausea__pWgDCrm.pdf','8, 13'),('ncis-antiemetic','NCCP NCIS antiemetic medicines V8 2025','https://healthservice.hse.ie/documents/7180/Supportive_Care_Antiemetics_for_inclusion_NCIS_Medical_Oncology.pdf','Parenteral scope and regimen tables')]:
 pdf=H/'research'/(name+'.pdf');txt=pdf.with_suffix('.txt');sources.append(dict(id=name,kind='supportive_care',title=alias,url=url,retrieved='2026-10-29',pdf_sha256=digest(pdf),text_sha256=digest(txt),pages_checked=pages,notes='Afatinib and dacomitinib are minimal-low oral risk; Table 5 supports as-required antiemetics. No routine parenteral course copied; dacomitinib acid-suppression interaction overrides generic supportive suggestions.'))
manifest=dict(release='0.84.25',checked='2026-10-29',codes=['00221','00565'],sources=sources,governance='Independent Consultant, oncology pharmacy and PPI review pending',clinical_use_authorised=False)
(H/'sources.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
migration={'00221':{'protocol_id_preserved':'nccp-00221-v5','source_version_change':False,'legacy_inputs_preserved':True,'organ_function_reconciliation_metadata_preserved':True,'rules':{'OF590_00221_AFA_LT15':'ID retained; proceed_with_caution → consultant_review with explicit NCCP/EMA conflict; numeric CrCl/eGFR and dialysis flags added without converting between measures.','OF590_00221_AFA_CHILD_C':'ID retained; proceed_with_caution → consultant_review because NCCP no adjustment expected conflicts with EMA not recommended.','ECOG_OUTSIDE_USUAL_RANGE':'Removed: afatinib NCCP v5 does not specify a numerical ECOG eligibility threshold. Existing ECOG input retained.','TARGET_PNEUMONITIS_G2':'Replaced by ILD_SUSPECTED (any grade≥1 or suspicion holds) and ILD_CONFIRMED (confirmation permanently stops); grade alone no longer permanently stops.','TARGET_HEPATITIS':'Removed unsupported universal ALT/AST >5×ULN hold; LIVER_RESULTS_CONTEXT reviews abnormal values without assumed causality, SEVERE_LFT_HOLD uses clinically confirmed severe event.'}},'00565':{'protocol_id_preserved':'nccp-00565-v3','source_version_change':False,'legacy_inputs_preserved':True,'organ_function_reconciliation_metadata_preserved':True,'rules':{'OF590_00565_DACO_RENAL_SEV':'ID retained; consultant_review retained; SmPC CrCl<30 and dialysis added as independent triggers, numeric dose explicitly blocked.','OF590_00565_DACO_CHILD_C':'ID retained; dose_reduce → consultant_review when initiation/current-dose context is unknown. Message retains starting30mg and optional≥4-week escalation. New DACO_CHILD_C_START requires explicit treatment_start and carries30mg into dose table. Concurrent blocking review suppresses it.','ECOG_OUTSIDE_USUAL_RANGE':'Threshold corrected from >2 to >1 because NCCP requires ECOG0–1.','TARGET_PNEUMONITIS_G2':'Replaced by ILD_SUSPECTED and ILD_CONFIRMED as above; same source-specific approach at any grade.','TARGET_HEPATITIS':'Replaced by clinical context/confirmed-severe event pathways; NCCP does not provide universal numeric5×ULN threshold.','PREGNANCY_BREASTFEEDING':'SmPC clinical precaution, not NCCP absolute listed exclusion; consultant_review with numeric-dose block.'}}}
(H/'migration.json').write_text(json.dumps(migration,ensure_ascii=False,indent=2)+'\n')
audit='''# v0.84.25 EGFR source audit

Scope: NCCP 00221 afatinib and 00565 dacomitinib. Checked 29 October 2026. Root owns integration and final document/browser QA. These are source-reconciled proposals, not independently approved clinical content. Consultant, pharmacy, PPI and clinical-use flags remain false.

## Source status and visual inspection

- Afatinib: current HSE-linked NCCP v5, amendment 21 March 2025, review date 21 March 2030; four pages. No version change from repository. Current EMA Giotrif product information updated 11 May 2026.
- Dacomitinib: current HSE-linked NCCP v3, amendment 23 June 2021, review date 23 June 2026; five pages. The review date has passed; the presently linked file is still v3. This audit does not imply a newer NCCP version or independent reapproval. EMA Vizimpro product information updated 17 December 2024; EMA page update 19 October 2026 refers to procedural history, not a new product-information version.
- Downloaded full PDFs and extracted layout-preserving text. Visually checked both NCCP renal/hepatic and toxicity tables (pages 2–3) and both EMA dosing/renal/hepatic tables (pages 3–4). Inspected oral antiemetic V6 Table 5/page8 and Table8/page13. Original files, extracted text and table images are in research/; hashes and primary URLs in sources.json. Research originals should be excluded from the distributable overlay.

## Afatinib findings

The previous nine-rule prototype omitted prolonged/intolerable grade2 adverse reactions, dose escalation conditions, previous-dose/recovery context, GI perforation, serious skin/eye problems, pre-existing ILD exclusion and P-gp interactions. It also assigned an unsupported numerical ECOG cutoff, treated grade≥2 suspected ILD as permanent discontinuation and implied a universal ALT/AST >5×ULN hold.

The new proposal has 42 optional inputs and 33 source-cited rules. All legacy fields and the stable protocol ID remain. No blank value is interpreted as normal.

- Standard40mg once daily; no planned rest interval. Optional50mg only after3weeks tolerating40mg without specified grade>1 reactions and with no prior reduction. Maximum50mg; escalation requires Consultant choice.
- Tolerable non-prolonged grade1–2 has no mandatory hold. Grade2 diarrhoea **>48h**, rash **>7days (168h)**, intolerable grade2 or grade≥3 triggers interruption. Exactly48h/168h does not satisfy the strict prolonged threshold. Recovery must reach grade0/1 before Consultant considers10mg-decrement restart. Cannot tolerate20mg: consider permanent discontinuation; no invented10mg level.
- Suspected ILD holds for evaluation; confirmed ILD permanently stops. Known pre-existing ILD is an NCCP exclusion, distinct from a new suspected event.
- NCCP CrCl≥15 needs no adjustment; <15/dialysis says no adjustment expected using Giraud. EMA uses **indexed eGFR**15–29 for close monitoring and does **not recommend** <15/dialysis. The two renal measures are not converted. The legacy severe/dialysis rule is retained by ID but now exposes the source conflict and blocks numerical dosing pending review.
- NCCP Child–PughC says no adjustment expected; EMA has not studied it and does not recommend treatment. The old caution is now explicit Consultant/pharmacy review. Newly developed severe hepatic impairment is a separate stopping event.
- Confirmed GI perforation permanently stops; severe blistering/exfoliation and ulcerative keratitis hold for urgent assessment; LVEF below local lower limit prompts cardiac/medicine review.
- Afatinib table does not name a CTCAE edition; removed the inherited unsupported v5 claim. Grades remain clinician assigned with source provenance.
- FBC/renal/liver profile monthly; LVEF at baseline/during treatment when indicated. Food separation is3h before/1h after; missed dose skipped if next due within8h; no replacement after vomiting. Women’s contraception≥1month after final dose, no breastfeeding during treatment.

## Dacomitinib findings

The former nine-rule prototype missed grade2 duration/support conditions, initial-versus-ongoing hepatic dose context, restart recovery distinctions and interactions. It used ECOG>2 instead of the actual NCCP0–1 range and prematurely permanently stopped unconfirmed ILD.

The new proposal has39 optional inputs and30 rules.

- Daily45mg; defined reductions30mg then15mg. Grade2 diarrhoea not improving to grade≤1 **within24h despite treatment** or grade2 skin symptoms persisting **72h despite treatment** triggers a hold. Boundary checks include exactly24/72h, below, above and missing supportive-treatment context.
- Recovered grade2 diarrhoea/skin: same-dose versus lower-dose restart is a Consultant decision. Prior grade≥3 diarrhoea/skin requires recovery≤1 and one-level reduction. Other grade≥3 toxicity requires recovery≤2 then one-level reduction. These paths are kept separate.
- Initial Child–PughC source dose30mg; optional45mg after≥4weeks if individually tolerated. Unknown initiation/current-dose context cannot automatically select a dose. Explicit initial-start context can carry30mg into the dose renderer; severe renal or other blocking review suppresses that numerical action. All simultaneous findings remain visible.
- Mild/moderate renal function CrCl≥30 needs no starting adjustment. CrCl<30 or dialysis has no established dosing recommendation. Normal aliases cannot erase an independently entered severe band/dialysis flag.
- NCCP requires ECOG0–1, so ECOG≥2 now requests review. Confirm first-line scope and a validated activating EGFR result.
- Suspected ILD holds; confirmed ILD permanently stops at any grade. Pre-existing history is caution, not a listed absolute exclusion.
- H2-blocker timing conflict: NCCP says **≥6h before or10h after**; EMA says **2h before or≥10h after**. Patient materials direct a written pharmacist-approved schedule and do not select a conflicting universal interval. PPIs should be avoided; CYP2D6 substrates require individual interaction review. The generic antiemetic document’s acid-suppression footnote does not override this medicine-specific interaction.
- NCCP explicitly uses CTCAEv4, replacing the inherited unsupported v5 labelling. Pregnancy/breastfeeding use SmPC precautions with review, not invented NCCP listed exclusions.
- Blood count, renal, liver and bone profile at baseline/regularly; no fixed interval invented. With or without food. Missed/vomited dose: no replacement, next prescribed dose next day. Women’s contraception≥17days after treatment; no breastfeeding during treatment.

## Evidence and service authoring

Two complete targeted-service records include patient reference, anatomy, continuous oral timeline, review passport content, consent profile/aid content, supportive plan, logistics, longitudinal tests, clinician rationale and source-linked evidence. Patient metric arrays are deliberately empty; study numbers stay in clinician evidence.

Afatinib LUX-Lung3 primary PFS11.1vs6.9months (HR0.58) is distinct from mature overall-population OS28.2vs28.2months (not statistically significant). LUX-Lung7 planned mature OS27.9vs24.5months was also not statistically significant; it compares gefitinib and is not evidence of superiority over modern therapies. Do not extend exon19 subgroup results to every mutation or import squamous post-platinum LUX-Lung8 into NCCP00221a.

Dacomitinib ARCHER1050 primary PFS14.7vs9.2months (HR0.59); extended OS34.1vs27.0months, HR0.748, cutoff13May2019, median follow-up47.9months. The comparator is gefitinib, the study excluded CNS-metastasis history and enrolled common Ex19del/L858R mutations. Dose-reduction subgroup associations do not establish causal survival benefit.

Both drugs are minimal-low oral emetic risk in current NCCP V6. Support uses individually selected as-required antiemetics, early diarrhoea/hydration support and skin/mouth care. No fixed cytotoxic NCIS prescription is copied.

## Migration and checks

Exact retained/replaced rule IDs and metadata choices are in migration.json. All four OF590 IDs are retained. organ_function_reconciliation metadata is preserved; this release’s source audit supersedes old action wording without falsely assigning a new NCCP version.

`node validation/targeted-lung-v08425/egfr/source-cases.cjs` passes **474/474** source-derived checks using the real assessment engine and dose renderer. Includes blank inputs, threshold edges, suspected/confirmed diagnoses, discordant aliases, dose/recovery history, concurrent limitations, evidence, provenance and full-suite schema. `--integrated` checks canonical proposals after root’s null-to-empty normalization. These are software checks, not clinical validation.
'''
(H/'AUDIT.md').write_text(audit)
print('Wrote sources.json, migration.json and AUDIT.md')
