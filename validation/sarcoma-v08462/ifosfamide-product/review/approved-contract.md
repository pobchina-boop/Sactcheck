# Ifosfamide source conflict — 18 November 2026

This is a read-only classification and proposed subsequent change. It does not alter the application, released v0.84.60 archive, frozen review reports or existing source-specific NCCP dose tables. The GIST v0.84.61 release contains no ifosfamide and is outside this correction.

## Verified product evidence and limits

The live HPRA page lists **Mitoxana 1 g**, **PA2299/028/001**, Baxter Holding B.V., as authorised and marketed. Its linked SmPC is dated **11 September 2023**. Section4.3 (printed page2) lists renal/hepatic contraindications at **serum creatinine >120 µmol/L**, **bilirubin >17 µmol/L**, or **transaminases/alkaline phosphatase >2.5×ULN**. Section4.4 (printed page3) directs interruption of administration when CNS toxicity develops. This current-administration direction is distinct from a permanent prohibition on later rechallenge. The numerical organ wording belongs to this named product; the actual hospital-supplied product remains unknown.

The SmPC also prints alternative mg/100mL values; its creatinine pair is not an exact conversion. Keep the µmol/L wording explicit and do not invent a conversion-based boundary. CrCl is not serum creatinine; absolute AST is not a multiple of the local ULN. Both source captures are retained with hashes. Evidence is extracted text and a verified live link; there is no PDF-binary hash or visual page inspection claim.

- [Live HPRA product](https://www.hpra.ie/find-a-medicine/for-human-use/authorised-medicines/details/15731)
- [Current linked SmPC](https://assets.hpra.ie/products/Human/15731/Licence_PA2299-028-001_11092023124600.pdf)

## Affected campaign assessments

The exact paths, current hashes, NCCP URLs and read-only engine observations are in `manifest.json` and `classification-probes.json`.

| Code | Current location/status | NCCP organ handling currently represented | Current CNS handling | Required further work |
|---|---|---|---|---|
|00391|Application, already released v0.84.60|CrCl<50 not recommended; severe hepatic not recommended; discretionary high AST/bilirubin reduction discussion|Grade≥3 stops; suspected encephalopathy flag holds; grade1/2 alone bypasses that flag|Explicit subsequent release: named-product organ reconciliation plus current grade1/2 interruption|
|00392|Application, already released v0.84.60|As00391, retained source-specific regimen|Same grade1/2 gap|Same explicit subsequent-release correction|
|00596|Batch4 external draft|CrCl<50/dialysis clinical decision; severe hepatic not recommended; discretionary high AST/bilirubin discussion|Any current grade>0 holds; occurrence-specific future rechallenge review|Named-product organ reconciliation; preserve IE future management|
|00680|Batch4 external draft|CrCl<50/dialysis clinical decision; severe hepatic not recommended; discretionary high AST/bilirubin discussion|Any current grade>0 holds; current/prior grade≥3 source stop|Named-product organ reconciliation; preserve high-dose source stop|
|00675|Batch5 external draft|CrCl<50/dialysis clinical decision; discretionary hepatic discussion|Current grade≥3 holds; grade1/2 gap|Narrow CNS correction and unchanged independent213-case replay first; separate organ reconciliation|
|00747|Batch5 external draft|As00675, distinct three-week calendar|Same grade1/2 gap|Same separation of CNS correction and product conflict|
|00754|Batch5 external draft|CrCl<50/dialysis clinical decision; severe hepatic not recommended; discretionary high AST/bilirubin discussion|Any current grade>0 or CNS symptoms holds; current/prior grade≥3 source stop|Named-product organ reconciliation; correct misleading generic statement about absence of formal contraindication|

All seven lack explicit supplied-product identification and the complete set of product organ inputs. Their NCCP-only reconciliation cannot be represented as complete reconciliation of all applicable product safety information. The permissive NCCP reference rows must not clear a documented named-product contraindication.

## Proposed implementation contract — awaiting parent integration decision

1. Preserve current archives and failing evidence. Make every clinical change an explicit pathwise transition in the appropriate later release; do not revise old passing reports to imply they tested these new scenarios.
2. Add a supplied-ifosfamide product selector with **Mitoxana PA2299/028/001**, **another identified product requiring review**, and **unknown/unconfirmed**. A generic approval checkbox must not cancel a known product contraindication. The code cannot verify a local prescription or product outside the retained source.
3. For known Mitoxana, a value beyond a listed product threshold produces a visible **ifosfamide-only hold and source-conflict review**, explicitly naming the product contraindication. Keep the hold even if other consultant/plan checkboxes are true. Do not issue a replacement percentage, universal ifosfamide contraindication or automatic permanent discontinuation.
4. For unknown product, a relevant abnormal value cannot be cleared by the NCCP table: hold planned ifosfamide pending product identification/reconciliation. For another identified product, retain explicit specialist review of that product's actual information; do not silently apply Mitoxana thresholds as universal, or mark the alternate product cleared.
5. Require actual serum creatinine in µmol/L and bilirubin in µmol/L, plus actual local AST/ALT/ALP results and ULNs or clearly labelled verified ratios for this assessment. Reuse existing raw bilirubin controls and hidden derived fields. Preserve NCCP CrCl and absolute AST fields. Never substitute eGFR/CrCl, assume a laboratory ULN, duplicate conflicting UI controls or convert the printed creatinine equivalence into an invented threshold.
6. Missing product/laboratory assessment prevents a planned ifosfamide dose or restart from appearing cleared. Missing phase remains partial/reviewed, not assumed to be an ifosfamide day. In alternating IE/VAC, scope the administration hold to ifosfamide and the actual phase; do not withhold unrelated VAC components solely because an ifosfamide product field is absent. A documented current CNS event remains visible whatever phase or checkbox is selected.
7. Current CNS grade1/2 must interrupt further ifosfamide administration independently of an optional suspected-encephalopathy checkbox. Retain each NCCP protocol's distinct severe-event, recovery and future rechallenge rules. Do not convert interruption into a universal lifetime ban.
8. Add explicit clinician knowledge/source-conflict text and appropriate patient explanation that kidney/liver tests and the supplied product are checked before treatment. Update precise source provenance and unresolved limits; no claim of consultant/pharmacy approval.

## Independent acceptance plan

Author and independently replay exact below/equal/above boundaries for serum creatinine120, bilirubin17 and each enzyme ratio2.5; test missing product and all product selections, unknown/missing units, raw-lab/ULN adapters, contradictory absolute/ratio inputs, missing subsets, baseline/current/restart stages and alternating phases. Test grade0/1/2/3 with suspected flag missing/false/true, prior severe event after current recovery and normal counts with the organ conflict. Assert component-only findings and visible dose-panel holds; no automatic numeric dose or clearance via approval flags. Preserve original failing and corrected observations as separate immutable reports.

The existing batch5 independent213-case suite remains unchanged and separate from these newly discovered organ cases. Its original result is183/213; calendar, diarrhoea and current-CNS corrections will be replayed without changing expectations. Existing batch4 197/197 and v0.84.60 112/112 reports do not cover this new product-conflict acceptance plan.
