# Sarcoma v0.84.60 clinical source review

Five existing protocols were reconciled against complete text from the current NCCP catalogue-linked PDFs on 18 November 2026. Screenshot requests returned reference IDs and text markers without inspectable image pixels; visual table-layout inspection remains unverified. This is an encoding review draft; independent consultant and oncology-pharmacy approval remain outstanding.

## Source provenance

| Code | Current version | Version/review date | Pages | Source qualification |
|---|---:|---|---:|---|
| 00500 | 3 | 18 November 2025 | 4 | Printed next review 18 November 2030 |
| 00391 | 5 | 20 May 2026 | 6 | Review as required from that date |
| 00392 | 5 | 20 May 2026 | 6 | Review as required from that date |
| 00501 | 4 | 18 November 2025 | 6 | Printed next review 18 November 2030 |
| 00511 | 2 | 10 March 2021 | 3 | Printed review due 10 March 2026 has elapsed; the current catalogue still links this version |

`source-manifest.json` records exact official URLs, saved text hashes and page-render references. Hashes identify the saved **web-extracted text**, not PDF binaries. Direct binary retrieval returned HTTP 403. The screenshot tool supplied only text markers without inspectable image pixels or downloadable bytes; no visual table pass, PNG or PDF binary/hash is claimed. Historical material was not substituted for a current source.

## Clinically material changes

| Scope | Reconciled behavior |
|---|---|
| All doxorubicin entries | Hepatic decisions use absolute bilirubin in µmol/L. The previous assumed-ULN conversion is removed. The 50–51 decimal gap, Child–Pugh C, renal exact-10 gap and haemodialysis branch remain explicit. |
| 00500 | Baseline LVEF ≥50% differs from the on-treatment stop threshold <45%. The source's >20% baseline-LVEF reduction wording requires clinical confirmation rather than an invented percentage-point conversion. Age >70, delay >14 days, febrile-neutropenia occurrence and grade-3/4 toxicity recovery are distinct branches. |
| 00391 versus 00392 | At ANC exactly 1.5 or platelets exactly 100, 00391 uses the intermediate 80% row while 00392 meets the full-count boundary. Current low counts still delay despite a previous neutropenic-fever history. |
| Ifosfamide combinations | CrCl exactly 50 is unallocated; below 50 and haemodialysis are not recommended. Mucositis modifies both cytotoxics; grade ≥3 neurotoxicity stops ifosfamide only. G-CSF and PPI prophylaxis, mesna, hydration, neurological and urine monitoring are restored explicitly. |
| 00501 counts/history | Day 1 platelets must reach 100; Day 8 must reach 75, with ANC ≥1 for both. A delayed Day 8 dose may be reviewed by Day 15; this is not a routine third dose. Prior-cycle FN is separate from holding the remainder of the current cycle. |
| 00501 organ function | Gemcitabine bilirubin ≥27 has two source options: an 80% original starting dose with possible escalation, or full dose with active monitoring. This regimen's original dose is 675 mg/m². Docetaxel's ambiguous hepatic row cannot yield an automatic numeric dose. |
| 00501 adverse events | First/second grade-2 neuropathy occurrences affect both medicines. SCAR and suspected drug-induced pneumonitis stop gemcitabine; severe docetaxel hypersensitivity stops docetaxel without rechallenge. Premedication and off-label consent are explicit. |
| 00511 | CrCl 45 overlaps 75% and 80% rows and requires clarification. Haemodialysis does not inherit the <30 mL/min 70% row. Severe kidney/liver disease remains an exclusion. Admission with neutropenic sepsis leads to 80% of the **previous** dose. |

All encoded percentages and dose levels require prescription/history review; no automatic numeric dose is emitted by these new rules. Component attribution is explicit. No protocol IDs or NCCP version IDs changed.

## Validation

`node validation/sarcoma-v08460/clinical/source-cases.cjs` passed **265 of 265 cases** against the actual assessment engine, dose-action model and raw-laboratory adapter. Coverage includes just-below/equal/just-above boundaries, count conflicts, source gaps, baseline versus treatment stages, prior events versus current toxicity, recovery, component-specific discontinuation, steroid doses and local laboratory ULN conversion.

The initial 201-case development pass exposed an absent link from an entered bilirubin result to gemcitabine's absolute-concentration threshold when the docetaxel ULN form was used. The protocol now derives the absolute bilirubin field from that same raw result while calculating the ratio using the actual local ULN; the regression checks a local bilirubin ULN of 24 µmol/L, not an assumed 20. The absolute bilirubin input is hidden with the existing ui_derived_from contract, so the clinician sees one raw-result control and the derived concentration cannot be independently overwritten.

Partial-input cases explicitly verify `complete:false`, `coverageComplete:false`, `partialAssessment:true`, missing-domain inventories and a recommendation that denies overall clearance. The engine may label an individually assessed normal domain `proceed_with_caution`; its overall text explicitly states that unassessed domains prevent an overall proceed decision. Demo values do not suppress ambiguous-source review branches.

These checks do not establish browser behavior, PDF/QR correctness, live publication or clinical authorisation. Those stages belong to the release integration evidence.

## Unresolved source questions

- Original current PDF binary acquisition and SHA-256 provenance remain unavailable; actual visual inspection of the current NCCP table layouts is unverified.
- Clarification is needed for doxorubicin bilirubin >50 to <51 µmol/L, CrCl exactly 10 mL/min and the meaning of >20% LVEF reduction.
- Ifosfamide CrCl exactly 50 mL/min is not assigned a row.
- Docetaxel's second hepatic row prints an ambiguous bilirubin range with AND/OR grouping. ALP exactly 6×ULN is unallocated; high abnormal patterns receive a conservative hold/review without asserting a fabricated independent numerical contraindication.
- Dacarbazine CrCl 45 overlaps two dose percentages. Its severe-kidney-disease exclusion must be reconciled with the <30 table row; no dialysis dose is supplied. The header's 1.2 mg/m² conflicts with the title and treatment table's 1.2 g/m², and printed ICD C43 conflicts with the sarcoma indication. The source's overdue review date is retained.

The programme must obtain independent consultant and oncology-pharmacy review before clinical use. No completion metadata should imply that these unresolved source questions were independently approved.

## Independent retrospective corrections before freeze

A separate reviewer replayed 112 scenarios against an immutable snapshot. Eleven failures exposed three 00501 gaps: recovery-stage low counts were not actionable, neuropathy was omitted from a broad severe-toxicity recovery check, and a planned Day 8 label could bypass the late-dose guard. The author preserved the failing snapshot, added phase-independent minimum-count delays and intended-day review, required both neuropathy and other toxicity recovery grades, and checked the entered cycle day across planned and delayed Day 8 paths. Forty additional author regressions passed. The reviewer then replayed the identical 112 expectations against corrected SHA256 19921ef1f94d49a132ac2be32065da0d14e0be5100d9549d32c7b48518a73d5b:112/112 passed. This is independent software/source-boundary review, not consultant or oncology-pharmacy approval. Original and corrected reviewer evidence is held in the release retrospective evidence, with originals preserved.
