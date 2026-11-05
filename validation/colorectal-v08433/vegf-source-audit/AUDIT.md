# v 0.84.33 — aflibercept/FOLFIRI and bevacizumab/5-FU/folinic acid source audit

Checked 4 November 2026 against the current HSE/NCCP gastrointestinal catalogue and the downloaded official PDFs. Baseline commit: `7963400d502f0407d3fa3a733d774db2d3f07ef6`. Stable assessment IDs remain `nccp-00238-v6` and `nccp-00791-v2`.

| Regimen | Current document | Pages | SHA-256 |
|---|---|---:|---|
|00238 Aflibercept/FOLFIRI|[NCCP v 6](https://healthservice.hse.ie/documents/6336/238_v6_Aflibercept_and_FOLFIRI.pdf)|8|`a66feb31328fdfdeb2ffb778745b0f413294899b1145de31438c1fdf428c9678`|
|00791 Bevacizumab 5 mg/kg/5-FU/folinic acid|[NCCP v 2](https://healthservice.hse.ie/documents/6416/791_v2_Bevacizumab_5mgkg_5FU.pdf)|9|`349d4ba26b2851888ab666be51a2ac56f9a820158d7d0239cf480f7ffbe1b169`|

The source PDFs, extracted text, before JSON snapshots, machine-readable findings, trial evidence and executable acceptance checks are retained in this folder. `implement.py` records the one-off clinical rewrite; **do not rerun it after root integration**, because it predates later small in-place validation fixes and the shared release integration.

## Principal corrections

00238 had inherited dose-level, nadir and time-to-stop rules from standard FOLFIRI 00227. Its own NCCP Table 2 instead uses recurrence-specific percentages. The borrowed dose-level table and time-stop rules have been removed. Low current ANC or platelets now independently holds the combination. Febrile neutropenia, severe diarrhoea and severe stomatitis/PPE use this regimen's distinct component changes, with no automatic midpoint from the 15–20% irinotecan range and no restart dose calculated from assumed treatment history.

Aflibercept proteinuria, hypertension, infusion reactions, surgery timing and permanent vascular stops are now separated from FOLFIRI actions. Severe diarrhoea persisting despite both chemotherapy reductions stops FOLFIRI without silently making that an aflibercept stop. Severe infusion hypersensitivity, in contrast, stops the whole combination. The supportive-care risk was corrected from low to moderate because irinotecan is the highest emetogenic component.

00791 had imported five organ-function rules from other fluorouracil regimens. Current v 2 Table 3 does not use their bilirubin 85/AST 180 contraindication cutoffs or one-third/half-dose scheme. It expects no adjustment for renal impairment/dialysis; mild/moderate hepatic impairment without renal impairment needs no expected adjustment; severe hepatic impairment is not recommended. Combined or incompletely characterised organ impairment receives review rather than an invented percentage.

00791 now encodes its full dose levels and current component history, distinct ANC and platelet pathways, GI recovery windows, source-specific grading, proteinuria measurements, BP context and component-specific vascular stops. A further reduction below level−2 explicitly discontinues the exhausted component; folinic acid follows the bolus when it must be omitted.

## Differences that must remain distinct

| Domain |00238 aflibercept/FOLFIRI|00791 bevacizumab/5-FU/folinic acid|
|---|---|---|
|Current ANC hold|<1.5 ×10⁹/L|<1.0 ×10⁹/L|
|Current platelet hold|<75 ×10⁹/L|<75 ×10⁹/L|
|Timed haematology stop|No borrowed two/four-week algorithm|Persistent ANC<1 after 2 weeks; platelets<75 after 4 weeks|
|24-hour protein at exactly 2 g|Hold aflibercept|Meets bevacizumab proteinuria domain; other restrictions still govern|
|Protein-related reduction|Second episode, recovered<2: permanent aflibercept 2 mg/kg, history confirmed|No bevacizumab adverse-event dose reduction; hold/stop only|
|Fluorouracil liver thresholds|Own bilirubin/AST table; exact 85/180 unassigned|Severity-based v 2 table; no imported 85/180 cutoffs|
|Irinotecan|15–20% reduction range selected clinically|No irinotecan in this regimen|
|Folinic/5-FU schedule|Day 1 then 46-hour pump, every 14 days|Day 1 then 46-hour pump, every 14 days|

## Remaining source uncertainties are explicit

- 00238 lists impaired renal function as an exclusion but also provides renal-dose recommendations, including an irinotecan 50–66% range below 10 mL/min/dialysis. Consultant/pharmacy review is required; no midpoint is computed.
- 00238 count-recovery prose uses “or”. The implementation does not clear treatment if either current count remains below threshold; both results must be reviewed.
- 00238 exact bilirubin 85µmol/L or AST 180 U/L is outside the strict< and> bands. Moderate/severe initial reductions are not substituted for absolute contraindications or actual dose history.
- 00791 describes platelet recovery within 2 weeks and stopping after 4 weeks. The interval between requires review.
- 00791 Table 6 symptom grades differ from modern CTCAE 5.0. The source definitions and source label are preserved. Numeric GI-toxicity changes require explicit reconciliation of the source-table grade, documented recovery/timing and each current 5-FU dose level.
- 00791 uncontrolled initiating-treatment BP is described as sustained>150/100 on antihypertensives, without explicit AND/OR logic. Numeric readings request context; explicit clinical uncontrolled/symptomatic status drives the hold.

## Clinical evidence and patient work

`trial-evidence.json` contains primary URLs, population, comparator, exact endpoints and limitations. VELOUR supports second-line aflibercept/FOLFIRI in oxaliplatin-exposed metastatic colorectal cancer, including patients previously treated with bevacizumab. Its OS confidence interval is 95.34%, not 95%.

The NCCP 00791 citation relates to a single-arm stop-and-go strategy incorporating bevacizumab/mFOLFOX 6 induction, bevacizumab/LV 5 FU 2 maintenance and oxaliplatin reintroduction. Whole-strategy outcomes are **not** an isolated 00791 comparative benefit. No such quantified benefit is assigned. NCCP explicitly identifies this bevacizumab regimen as unlicensed in Ireland and requires patient information/consent and local governance. Schedule, monitoring, support and consent findings were sent to the patient-assets and root integration agents.

## Verification

Run from the repository root:

```sh
node validation/colorectal-v08433/vegf-source-audit/source-cases.cjs
```

Current implementation: **279/279 acceptance checks pass**, covering source boundaries, recurrence, actual dose history, missing recovery inputs, numeric-output suppression, component scope and source grading. The same suite against before snapshots (`--baseline`) passes 27 and fails 252. Those expected failures include absent new pathways/inputs and source metadata assertions; they are not 252 separate clinical defects.

Independent consultant review, oncology-pharmacy review and clinical-use authorisation remain **false**. Source reconciliation and software tests do not constitute clinical approval.
