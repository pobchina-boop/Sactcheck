# Gemcitabine and vinorelbine source audit — v0.84.29

Checked 2 November 2026. New suites:00284 lung and00614. Retrospective:00232/00259 lung contexts. Canonical breast patient assets for00232/00259 are preserved. Source reconciliation and software checks do not establish independent consultant/pharmacy or clinical-use approval.

## Fresh sources and method

All four official NCCP PDFs downloaded using their canonical URL with `?download=1` and a browser user-agent. `sources.json` records SHA-256 of downloaded bytes and extracted text. Source PDFs and extracted text are under `sources/`. Key tables were rendered locally and visually inspected:00284p3,00614p6,00232p2,00259p4. Versions remain00284v5,00614v4,00232v5,00259v6. No source-version increase was inferred from a later crawl date.

## Findings and changes

###00284 gemcitabine alone

The existing assessment had generic count thresholds and no separate baseline/Day1/Day8/Day15 pathways. The source requires baseline ANC>1.5/platelets>100; subsequent cycle initiation ANC>1/platelets>100; within-cycle75% at ANC0.5–1 or platelets50–100; omit below0.5/50. Restart after omission requires strict>0.5 AND>50. Added prior-event75% of ORIGINAL cycle-initiation dose, baseline organ checks, the exactCrCl30 table gap, bilirubin≥27 dose advice, and named severe organ/skin toxicity pathways.

The printed nonhaematological table says **Grade>3** and **Grade>4**. This is confirmed visually, not an extraction error. The product information addresses severeGrade3/4. Severe toxicity now triggers a hold and explicit source reconciliation; no silent replacement of `>` with `≥`, no automatic50% dose calculation and no mechanically inferred permanent stop. Product-information cycle-initiation ANC≥1.5 also differs from NCCP subsequent Day1>1; this discrepancy is flagged.

The shared source has pancreatic adjuvant and lung indications. The fixed six-cycle duration belongs to pancreatic adjuvant treatment. The new patient guide is explicitly lung-only, with repeat28day cycles under team review; the passport/card uses a rolling record. Complete macroscopic resection is contextualised to pancreatic adjuvant eligibility, not imposed on advanced lung cancer. Registry must scope-guard this lung-only guide.

Baseline blood count/renal/liver tests, pre-dose FBC on all three treatment days and renal/liver tests each cycle are kept distinct. Audiometry/clearance are conditional. No universal scan/tumour-marker interval is invented.

###00614 carboplatin/vinorelbine

Existing generic code incorrectly used ANC<1.5 as if it were this source's table, imported oral-monotherapy bilirubin reductions/permanent stops, and lacked recurrent mucositis and prolonged marrow-delay actions. Replaced with the actual00614 table, retaining the separate vinorelbine SmPC ANC<1.5 conflict as a hold/reconciliation rather than asserting source agreement.

Added marrow-event and recurrent mucositis branches, severe hepatic impairment as a consultant-assessed category (consider66% original vinorelbine, no numeric hepatic classification inferred), vinorelbine-only neuropathy omission/reduction, carboplatin GFR≤20 exclusion, <60 marrow-risk review,125 input cap and48hour/110% creatinine checks. Removed the unsupported00614GFR20–30 special row: its source explicitly supplies≤20 and<60 notes, not that additional band.

Four21day cycles are source-defined; the card has four completion slots. Day1 contains both agents; Day8 vinorelbine alone. The source permits IV or oral vinorelbine alternatives; patient text requires the prescribed route and avoids suggesting both. Oral combination escalation from cycle2or3 differs from weekly oral monotherapy after the third administration. Explicit Day1/high, Day8/IV minimal and Day8/oral route-specific support plans avoid repeating carboplatin prophylaxis on Day8. Aprepitant-vinorelbine CYP3A4 interaction is flagged. Root integration must select Day8 support using the prescribed route and keep absent choices unresolved.

###00232 and00259 retrospective

Fresh source review confirms existing route-specific thresholds, IV ANC/platelet exclusion/table conflicts, oral history-dependent dose escalation/re-escalation and oral hepatic boundaries. Added explicit pre-dose blood-count review input/hold. Preserved all previous rules and named-event safeguards. IV product information requires counts on each administration, includingDay8; oral NCCP requires counts before each weekly dose. Both now have the compact summary with required versus individual-plan monitoring, rolling cycle records and no invented finite course. Existing lung evidence and consent risk coverage retained; breast patient content is not overwritten.

## Evidence interpretation

00284:Ricci et al.,Lung Cancer2000,PMID10688490,46older adults, single-arm gemcitabine1000mg/m²Days1/8/15q28d. Descriptive OS6.75months(95%CI5.3–8.2) is kept in clinician evidence with explicit absence of a randomised comparator; no survival percentage is shown to patients. It is not pancreatic evidence.

00614:O'Brien et al.,Ann Oncol2004,PMID15151949,52patients, carboplatin plus alternatingIV/oral vinorelbine. Descriptive PFS5.1months and OS9.3months do not establish comparative benefit or identical results for each route variant. No patient numeric prognosis.

00232 ELVIS IV and00259 weekly oral phaseII evidence remain separate; the IV survival effect is not transferred to oral therapy. Existing2025pooled oral evidence/correction notes are retained, not represented as newly discovered efficacy evidence.

## Structured dose-view integration

The new protocols now include explicit, independently selectable treatment schedules. Gemcitabine uses the exact NCCP source indication IDs 00284a (pancreatic adjuvant, six cycles) and 00284b (advanced lung, no fixed total), each with 1000 mg/m² IV on Days 1, 8 and 15 every 28 days. The selector uses `indication_id`; retired synthetic values such as `00284-lung` remain invalid/unresolved and are not silently reinterpreted.

Carboplatin/vinorelbine uses `vinorelbine_route` to select `iv` or `oral`, each four 21-day cycles. Each alternative has carboplatin AUC 5 on Day 1 plus vinorelbine on Days 1 and 8. Source starting vinorelbine is 25 mg/m² IV or 60 mg/m² oral. IV physician discretion to initiate/increase to 35 mg/m² and oral conditional escalation to 80 mg/m² from cycle 2 or 3 are explicit notes, not automatic or additional simultaneous administrations. The oral source capsule caps are 120 mg at 60 mg/m² and 160 mg at 80 mg/m².

A displayed starting schedule must not become a presumed current prescription after dose changes. The severe-hepatic row retains 66% of the documented original starting vinorelbine dose without calculating a numeric mg/m² dose. Other percentage reductions with unresolved original/current denominator remain specialist-review text; neither prose parsing nor the displayed reference dose can produce an assumed numeric reduction. Carboplatin-only rules remain independent. Retrospective IV and oral monotherapy dose schedules remain available, including the distinct first three weekly oral doses and conditional later escalation.

Dose-view tests verify nonempty complete models, exact doses/days/routes/cycle intervals, finite versus indefinite durations, mutually exclusive alternatives, discarded old indication IDs and nonnumeric reductions when the prescribed dose or denominator is unresolved.

## Validation and limitations

215 proposed source cases pass, covering exact boundaries, source gaps, route/day logic, recurrence history, organ-specific component attribution, oral dose caps, missing information, pre-dose checks and indication-specific course length. Root must run the same script with`--integrated` after applying proposals and then run full repository regression checks. Patient/PPI, consultant and pharmacy approval remain pending.

No global files or canonical protocols were directly changed by this research task. `baseline-protocols.json` freezes the v0.84.28 inputs so repeated proposal generation cannot append duplicate rules to already-integrated files. `build-proposals.py` and `build-authoring.py` regenerate the owned proposals and service authoring. The local source-render PNGs are audit intermediates, not patient illustrations.
