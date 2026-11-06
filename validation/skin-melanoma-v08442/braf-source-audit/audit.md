# BRAF regimen source audit — proposed v0.84.42

Current HSE sources were freshly downloaded and read end-to-end on 6 November 2026. Three source-specific candidate protocols are staged; the checkout has not been changed. All 384 candidate checks pass (178 rule-execution witnesses, 206 independent boundary/history/component checks and invariants). This does not establish clinical authorisation.

| Regimen | Current source | Baseline → candidate rules | Checks |
|---|---|---:|---:|
| 00102 | v6, 2025-02-24, 5 pages | 15 → 44 | 97 |
| 00237 | v6, 2026-01-20, 5 pages | 16 → 47 | 90 |
| 00373 | v3, 2024-11-05, 9 pages | 16 → 87 | 197 |

## Principal findings

**BRAF01: 00102, 00237, 00373 — NCCP all p1 eligibility; 00373 p2 exclusions.** Generic ECOG>=3 rule applied to all three; 00373 actually restricts ECOG0–1. Most source exclusions/cautions lacked fields. Keep monotherapy0–2 and combination0–1 separate; add adult indication, hypersensitivity, prior BRAF failure versus intolerance, source-specific electrolytes/HTN/QT/concurrent anticancer exclusions.

**BRAF02: 00102, 00237, 00373 — NCCP all p3 renal/hepatic tables.** No executable renal/hepatic categories; generic unrelated CK/LVEF holds were shared. CrCl>=30 no adjustment; <30/dialysis none expected, with clinical review. Dabrafenib moderate/severe liver: 50% MAY be considered; vemu severe: no adjustment expected but liver biochemistry twice weekly. Cobi no hepatic adjustment. Do not output calculated prescription.

**BRAF03: 00102, 00373 — NCCP00102 p3 Table1 /00373 p4 Table3.** Only current grade>=3 hold; no intolerable grade2, recurrence, minimum dose, recovered permanent-stop history. Add grade2 tolerability, first/second/third recurrence, first-grade4 consultant choice versus recurrent-grade4 stop, previous480mg floor. In combination00373 Table1 further reduction after480 mandates permanent vemu stop; monotherapy below480 is not recommended and needs consultant disposition. Retain highest event grade after recovery.

**BRAF04: 00237 — NCCP00237 pp2–3 Tables1/3.** No dose levels or grade4 choice; generic severe toxicity rule discarded dose history. 150/100/75/50mg BID references; grade2 intolerable/grade3 interrupt until0–1 then one level down; grade4 consultant chooses stop OR interrupt/reduce. Re-escalation can be considered after control; max150/min50. Do not import vemu mandatory recurrence rules.

**BRAF05: 00102, 00373 — NCCP00102 p4 Table3 /00373 p8 Table6.** Generic QT>500 whole-regimen hold omitted baseline distinction, delta, recurrence and permanent cessation. Separate baseline >500 not-recommended; on-treatment >500 and >60ms change permanent stop; first/second/third history for <60ms; recovery strictly<500. In combination, vemurafenib only. Historical stop persists after current QT normalises.

**BRAF06: 00102, 00373 — Same NCCP QT tables; printed <60 and >60 criteria.** Exactly60ms boundary has no printed row. Explicit source gap; keep vemu withheld and require clinician/pharmacy interpretation. Do not silently convert <60 to <=60.

**BRAF07: 00237 — NCCP00237 pp2/4 vs EMA Tafinlar pp4/9 §§4.2/4.4.** Legacy>=38 hold had no source reconciliation; reading NCCP alone would incorrectly regress38–38.49 to no hold. Current EMA explicitly says monotherapy>=38; preserve hold38–38.49 with discrepancy label. NCCP>=38.5 separately documented. At least24h symptom-free before restart; recurrent first-symptom interruption and severe/recurrent reduced-dose review.

**BRAF08: 00237 — NCCP00237 p2 uveitis; p4 creatinine/pancreatitis.** Generic new-eye-symptom whole-regimen hold disregarded local-treatment control; creatinine/pancreatitis missing. Prompt eye assessment; controlled uveitis no dose change; uncontrolled withhold until resolved then reduce one level. Creatinine>1.5ULN caution, rising creatinine review, abdominal pain prompt amylase/lipase workup.

**BRAF09: 00373 — NCCP00373 p1 baseline eligibility; p5 Table4.** Blanket LVEF<=50 whole-regimen hold conflated baseline and on-treatment thresholds. Baseline must>50; on-treatment asymptomatic40–49 with<10-point fall does not mandate interruption. Hold cobi for<40 or40–49 with>=10-point fall; symptomatic separate. Retain historical symptoms,2/4-week recovery and third-event stop.

**BRAF10: 00373 — NCCP00373 p5 Table4, rendered image inspected.** Printed restart <10-point fall overlaps permanent-stop LVEF<40 row in unusual inputs; baseline eligibility may already exclude such baseline. Flag overlapping source criteria, keep withheld, no numerical restart. Confirm actual baseline and specialist interpretation.

**BRAF11: 00102, 00237, 00373 — NCCP00373 p6 Table5; monotherapy source tables do not support shared CK5 rule.** CK>=5ULN universal whole-regimen hold on all three. Remove unsupported universal numerical cutoff. Combination: asymptomatic grade<=3 and rhabdo excluded no change; symptomatic/rhabdo or asymptomaticgrade4 hold COBI. Separate 4-week recovery/stop; retain episode symptoms and missed recovery deadline despite subsequent resolution.

**BRAF12: 00373 — NCCP00373 p6 Table5 haemorrhage.** Generic severe-haemorrhage whole-regimen hold omitted attribution/permanent stop. Grade3 hold cobi during assessment; grade4/cerebral hold then permanently stop if attributed to cobi; vemu may continue. Retain recovered grade4 event history.

**BRAF13: 00373 — NCCP00373 p7 Table5 liver abnormalities.** No component-specific liver-grade recovery/recurrence pathway. G1–2 monitor; G3 hold VEMU only, restart one level lower after<=1. G4 hold BOTH, within4-week<=1 recovery: cobi one level/vemu two levels lower. Failure to recover within4weeks or recurrentG4 discontinue both; late recovery must not clear prior stop.

**BRAF14: 00373 — NCCP00373 p7 Table5 skin/diarrhoea.** Generic severe-toxicity rule could not distinguish component exceptions. Photosensitivity holds both but cobi can restart unchanged; acneiform rash cobi pathway, non-acneiform vemu pathway; grade>=3 diarrhoea despite support holds both and recurrence requires both reductions.

**BRAF15: 00373 — NCCP00373 p4 Table3; EMA Cotellic p7§4.4.** Generic dose logic did not distinguish cobi third-occurrence CONSIDER stop from vemu mandated stop; retinal diagnosis absent. Reference cobi60/40/20; no re-escalation. Third general AE consider permanent stop; below20 stop. Diagnosed serous retinopathy hold cobi until visual symptoms<=1, ophthalmic review.

**BRAF16: 00102, 00373 — EMA Zelboraf p5§4.4; NCCP directs to SmPC for additional adverse effects.** Grade3–4 hypersensitivity generic rule lacked correct component and separate severe dermatologic permanent-stop exception. Severe vemu HSR or severe dermatologic reaction (SJS/TEN/DRESS) permanently stops vemu; overrides generic first-grade4 choice.

**BRAF17: 00102, 00237, 00373 — NCCP tests/supportive care; EMA Zelboraf pp5–6; Cotellic pp7–8.** Monitoring not sufficiently source-specific; duration/treatment breaks could be conflated. Use regimen-specific baseline/during/after tests. Cobi routineLVEF baseline/1month/q3months differs from post-reduced-dose-restart2/4/10/16weeks. Add baseline/monthly CPK/creatinine. Separate response imaging from secondary-malignancy surveillance.

**BRAF18: 00102, 00373 — NCCP00102p2 vs EMA Zelboraf pp5–6§4.4.** NCCP at-risk baseline ECG and week8 thenq12week dermatology differs from current SmPC. Preserve fuller current SmPC all-patient baseline ECG/electrolytes and monthly prescriber skin examination through6months post-treatment; distinguish specialist dermatology visits and record source reconciliation.

**BRAF19: 00102, 00237, 00373 — NCCP supportive care; EMA Zelboraf pp9–10§4.6,Tafinlarp14§4.6,Cotellicp10§4.6.** Generic contraception/fertility text risks shortening combination requirement or importing trametinib timing into dabrafenib monotherapy. Dabra alternative effective contraception2weeks, male spermatogenesis may be irreversibly impaired. Vemu effective contraception>=6months/hormonal efficacy may fall. Cobi2methods>=3months, but combination must retain longer vemu requirement. Fertility unknown in humans for these agents; counsel before treatment rather than promise reversibility.

**BRAF20: 00102, 00237, 00373 — Current EMA component SmPC§4.5; NCCP drug interaction section.** A generic interaction flag alone does not mean an automatic interaction database has been checked. Require pharmacist medication review; document major CYP/warfarin/digoxin/contraceptive/radiotherapy risks in clinician/patient material. Candidate retains explicit review field; it does not claim exhaustive interaction detection.

## Patient and consent material

### 00102

960mg BID about12h apart continuously; 28-day assessment convention, not a rest week. Until progression/unacceptable toxicity. Preferably food; avoid taking both daily doses fasting; swallow whole. Take only when at least4h before next; no doubling; no extra dose after vomiting.

Contraception>=6months; hormonal method efficacy may decrease; discuss fertility before therapy, human fertility effect unknown; breastfeeding decision must be made with specialist.

Retain detailed anatomical anchoring: Skin: rash/photosensitivity, new skin lesions, severe blistering reaction; Heart: palpitations/syncope and QT-related risk; Eyes: new pain/photophobia/visual changes; GI/pancreas: unexplained abdominal pain; nausea/diarrhoea; Liver/kidneys: blood monitoring and symptoms needing review; Whole body: arthralgia/fatigue; severe allergy emergency.

### 00237

150mg BID about12h apart continuously; no planned treatment break. At least1h before or2h after food; swallow capsules whole, do not mix/open/crush. Skip if less than6h until next dose; do not double.

Alternative effective contraception during and2weeks after monotherapy; hormonal contraceptive efficacy reduced. Possible irreversible impaired spermatogenesis; discuss preservation before start. Do not import trametinib16weeks.

Retain detailed anatomical anchoring: Whole body: fever/chills, dehydration, low blood pressure;38°C contact/hold safety plan per current EMA; Skin: new lesions/cuSCC/melanoma, rash; Eyes: uveitis symptoms requiring prompt review; Abdomen: possible pancreatitis; urgent unexplained pain; Kidneys: creatinine/urine/dehydration monitoring; Joints and fatigue.

### 00373

28-day cycle: cobi60mg OD days1–21, then7days off; vemu960mg BID every day including22–28. Continue until progression/unacceptable toxicity. Cobi with or without food; vemu preferably with food, avoid both daily doses fasting. Swallow whole. Cobi take only if>=12h before next; vemu>=4h; never double or replace vomited doses.

Cobi two effective methods>=3months, but vemu>=6months means combined advice must retain longer component requirement; hormonal efficacy interaction review. Human fertility data lacking, discuss preservation; no breastfeeding under NCCP.

Retain detailed anatomical anchoring: Heart: LVEF reduction and separate QT rhythm risk; Eyes: serous retinopathy/new blurred vision; Muscle/kidneys: muscle pain/weakness/dark urine and CPK/rhabdomyolysis; Skin: photosensitivity and phenotype-specific rash/new lesions; GI: diarrhoea/dehydration; Liver: blood tests/jaundice; Bleeding: unexplained or cerebral warning symptoms.

## Integration and validation

Run `python3 build-candidates.py` to rebuild staging; it refuses to write to its source root. Review the three candidate JSON files before copying them. `node source-cases.cjs` checks staging with the checkout engine. To test a different integrated tree set `SACT_TEST_ROOT` and `SACT_CANDIDATE_ROOT` to that tree. Sources, hashes, every finding and the existing/new/retired input mapping are in `audit.json`; all cases/results are in `source-case-results-candidate.json`.

The baseline run is a deliberately failing contract comparison; renamed fields/IDs also fail, so its failure count must not be represented as clinical error counts. Review the source findings and actual previous rules. All consultant/pharmacy/clinical-use approval flags remain false. Root still needs full release regression, UI/field rendering, patient content, PDF/QR and visual integration checks. No clinical doses are calculated by these rule actions.
