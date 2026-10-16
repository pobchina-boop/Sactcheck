# SACTCheck v0.83.3 — colorectal clinical audit corrections

Apply to v0.83.2, commit `894e830240699de7e0ea5f2037f8b220bb11eca3`.

This release corrects the defects identified during the live v0.83.2 audit of FOLFIRI (00227), FOLFIRI + bevacizumab (00449), and mFOLFOX6 + bevacizumab (00446). The fixes were tested locally. This package does not itself commit, push or deploy the site.

## Corrections

| Audit finding | Changed behaviour |
| --- | --- |
| Proteinuria boundaries | Both bevacizumab combinations distinguish the source's proceed, hold and discontinue ranges. Exactly 2 is not held; over 4 is discontinued. Dipstick and clinically assessed grade-4 proteinuria pathways are distinct. |
| 00446 organ function | Oxaliplatin follows the combination's own CrCl contraindication. The borrowed 50%/dialysis-timing recommendation is removed. The 5-FU absolute bilirubin/AST contraindications and initial hepatic reductions are encoded. |
| 00449 renal dosing | The 00227-specific 50–66% irinotecan recommendation is removed from 00449 and retained for 00227. A clinical renal-severity selector replaces unsupported numerical dose bands in 00449. No measured renal value is required. |
| Antiemetics | Both bevacizumab combinations resolve to moderate risk in the protocol and central mapping, so the card, clinic workflow and prescribing support use the same classification. The knowledge base already states moderate risk. |
| Missing infusional 5-FU action | Bolus and infusional 5-FU retain separate identities, dose levels and omission decisions. Generic fluorouracil actions expand to both routes. Competing dose reductions use the lower dose, without summing reductions. |
| Independent bevacizumab decisions | Blood-count and cytotoxic-toxicity holds/stops affect the chemotherapy backbone. They do not automatically hold or stop bevacizumab. Its own criteria remain independently assessed. |
| Source/display fidelity | Combination rules identify their own source and corrected pages/tables. Selected renal labels remain labels in the comparison, dose trigger, summary and PDF; internal representative numbers are not displayed as measurements. |
| Single-value assessment | A low current ANC, low platelet count, or active qualifying diarrhoea/stomatitis can trigger the hold immediately. Duration may escalate the decision, but is not required to establish that initial hold. Missing domains remain unknown. |

Additional checks found and corrected the inherited 00446 stomatitis two-week stopping/grade-specific reduction rules, which are absent from its mapped source. The encoded pathway now delays chemotherapy until grade 1 or less. The assessment PDF now includes component actions and doses, source references and the current public version. The mobile CTCAE selectors stay within the page width.

## Source interpretation boundaries

The source leaves exactly CrCl 30 mL/min in 00446, and exactly bilirubin 85 µmol/L or AST 180 U/L in the 5-FU tables, unassigned. These values require clinical review; the software does not invent an inclusive boundary. The scenario interpreter also respects the exclusive renal bands.

The FOLFIRI ANC table describes recovery within two weeks and a persistent-low-count stop at four weeks. Recovery after more than two weeks requests a Consultant restart decision. A currently low count still triggers a hold. The severe renal category for 5-FU is clinically assessed; the combination documents do not supply a numeric cutoff or percentage reduction for that instruction. Dialysis does not imply a fabricated measured CrCl.

Three supplementary irinotecan/bowel precautions retained in 00449 are explicitly attributed to NCCP 00227 page 2, rather than falsely presented as 00449 exclusions. Bowel disease/obstruction requests Consultant review. This does not assert a full source-fidelity audit of every existing rule in these or other regimens.

Protocol doses are reference doses, not patient-specific prescriptions. The current prescribed dose level, recovery requirements, competing toxicities and source must be checked before prescribing. Historical encoding/module versions remain historical; the audit correction is recorded separately as v0.83.3. Consultant and oncology-pharmacy authorisation flags remain false.

## Sources checked on 16 October 2026

- [NCCP 00227 v9, FOLFIRI](https://healthservice.hse.ie/documents/6563/227_v9_FOLFIRI.pdf): pages 2–4, Tables 1–4.
- [NCCP 00449 v6a, bevacizumab + FOLFIRI](https://healthservice.hse.ie/documents/6481/449_v6a_Bevacizumab5_FOLFIRI.pdf): pages 3–6, Tables 1–6; safety precautions on pages 7–8.
- [NCCP 00446 v7b, bevacizumab + mFOLFOX6](https://healthservice.hse.ie/documents/6478/446_v7b_Bevacizumab_5_plus_mFOLFOX-6.pdf): pages 2–6, Tables 1–6; safety precautions on pages 7–8.

## Verification

See `validation/clinical-fixes-v0833/VALIDATION.md` for executed checks and limits. The source-based engine suite is part of `npm run release:gate`, and therefore `npm run test:ci`. Browser checks use actual form entry and assert the visible outputs. They use synthetic values only.

The patient content, including 00568, date-free Day 1–14 graphs, port/pump guidance, knowledge pages and consent assets is unchanged. The protected-asset hashes and six desktop/mobile clinic-to-patient journeys are checked. The clinical corrections take effect after this package is applied and deployed; a live post-deployment check remains necessary.
