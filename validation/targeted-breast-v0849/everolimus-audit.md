# NCCP 00322 everolimus + exemestane — v0.84.9 source audit

Checked 20 October 2026. The current official [metastatic breast catalogue](https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/breast-sact-regimens-locally-advanced-metastatic/) still links [NCCP 00322 v4](https://healthservice.hse.ie/documents/6720/322_v4_Everolimus_and_Exemestane.pdf), reviewed 13 June 2025, with review due 13 June 2030. The current PDF has five pages. All pages were read; tables 1–3 on pages 2–3 were also inspected visually.

The previous protocol contained two generic rules. Entering an ANC or platelet count did not invoke the regimen's interruption bands. It omitted the source-specific febrile-neutropenia, stomatitis, pneumonitis, metabolic and other-toxicity pathways. Child–Pugh A/B modifications were absent, and the Child–Pugh C output was nonspecific. The recorded source length was six rather than five pages.

## Corrections

- Replaced the placeholder rules with 77 individually attributable decisions. Independent ANC/platelet inputs preserve single-value assessment; omitted domains remain unassessed.
- Distinguished moderate count interruptions with same-dose restart from severe counts requiring a 5 mg reference restart. These are conditional future instructions; the dose renderer does not display an automatic current numeric dose during a hold or review.
- Added grade 3 febrile-neutropenia interruption with recovery ANC ≥1.25 × 10⁹/L and no fever. Grade 4 requires discontinuation. This differs from the afebrile recovery ANC ≥1.0 threshold. An affirmative febrile-neutropenia flag still triggers urgent assessment if its grade is missing or contradictory.
- Added Child–Pugh A/B/C NCCP reductions and the current EMA benefit–risk qualification and maximum 2.5 mg/day for Child–Pugh C. Renal/dialysis no-routine-adjustment wording does not clear acute kidney injury. CrCl remains a numeric entry; this no-adjustment statement is triggered by a valid entered value, without inventing renal dosing bands. A combined hepatic-impairment/toxicity restart dose is not inferred.
- Added stomatitis recurrence, grade 2 pneumonitis failure to recover within four weeks, recurrent grade 3 pneumonitis, metabolic events and other-toxicity tolerability/recurrence decisions. Unknown occurrence is not treated as first occurrence. Diarrhoea, ALT and AST have separate recurrence/tolerability inputs so one event's history cannot alter another event's action.
- Preserved component separation: everolimus toxicity instructions do not automatically hold or reduce exemestane.
- Added the postmenopausal HR-positive/HER2-negative advanced indication, prior non-steroidal-AI progression, absence of symptomatic visceral disease, ECOG 0–2 and the listed exclusion checks.
- Recorded continuous administration of both medicines, four-week laboratory/lipid monitoring and symptom-driven lung assessment. No fixed routine ECG, echo, CT, marker or DXA interval is asserted where the regimen does not supply one.
- Added current EMA safety supplements for infection, invasive systemic fungal infection, interacting medicines, radiotherapy toxicity/recall and wound healing. Supplementary source attribution is distinct from NCCP table attribution.
- Corrected an interface grading hazard: specifying `ctcae_version: 3.0` alone did not stop the shared helper showing newer descriptors. This protocol now supplies source-specific v3 descriptors. In particular, v3 ALT/AST grade 2 begins above 2.5 × ULN, not the newer 3 × ULN boundary. Numeric ANC/platelet inputs use NCCP treatment bands without automatic v6 regrading.

## Source and software verification

**120/120 checks passed**, covering all 77 rules through the actual assessment engine, plus protocol validation, both continuous schedules, numeric boundaries, competing concerns, conditional restart display, source-specific grading and the suite configuration. Synthetic cases only. Run:

```sh
node validation/targeted-breast-v0849/everolimus-source-cases.cjs
```

Results are recorded in `everolimus-source-cases-results.json`. Passing source/engine checks do not establish independent clinical validation or clinical-use authorisation.

The current NCCP and EMA files were successfully downloaded after an initial retrieval block; no current-PDF retrieval limitation remains. The audit retains both source PDFs and records their SHA256 hashes in protocol metadata:

| Source | Version / source date | Check performed |
| --- | --- | --- |
| NCCP 00322 | v4, 13 June 2025 | Current catalogue link followed; all five pages read; tables 1–3 on pages 2–3 visually checked |
| [EMA Afinitor product information](https://www.ema.europa.eu/en/documents/product-information/afinitor-epar-product-information_en.pdf) | EMA page lists update 20 November 2025 | Sections 4.2–4.6 and 5.1 cross-checked; toxicity table on page 4 visually checked; SWISH information on page 23 checked |
| [HPRA exemestane SmPC cited by NCCP](https://assets.hpra.ie/products/Human/27567/Licence_PA2315-087-001_27042023100604.pdf) | 27 April 2023 document | Administration, contraindications, menopause/bone precautions, interactions and mechanism checked |
| [NCI CTCAE v3.0](https://dctd.cancer.gov/research/ctep-trials/for-sites/adverse-events/ctcae-v3.pdf) | Published 9 August 2006 | Printed pages 20, 24, 35, 40–42 and 58: diarrhoea, oral functional stomatitis, febrile neutropenia, laboratory/metabolic terms and pneumonitis |

NCCP SHA256: `34f8562179cfb719d35c06d077e5b2ab7704df7aa42d9e44f7a0057a2823eee8`.

EMA SHA256: `678fc33837cd44d2e9320c5c80ffc02496b10803d7810e1b4f6e2d8e517263a0`.

The NCCP hepatic table gives percentages of the original dose. The current EMA SmPC expresses the corresponding standard-dose values and adds the Child–Pugh C benefit–risk restriction; both are represented without obscuring that qualification. No unresolved contradiction in these checked dose-modification tables was identified. Clinical judgement is still required for combined impairment/toxicity, alternative starting doses and any restart.

## Patient content and evidence limits

`everolimus-suite-config.json` supplies both mechanisms, continuous schedules, agent-specific anatomy/symptoms and consent risks, logistics, early mouth-care support, baseline/ongoing monitoring and a five-column longitudinal map. This regimen is advanced-disease endocrine plus targeted treatment; it must not inherit adjuvant completion phases, HER2 cardiac-monitoring intervals or cyclic chemotherapy rest weeks.

[BOLERO-2 final PFS](https://pubmed.ncbi.nlm.nih.gov/24158787/) reports investigator-assessed median PFS 7.8 versus 3.2 months, HR 0.45. [Its overall-survival analysis](https://pubmed.ncbi.nlm.nih.gov/25231953/) did not show a statistically significant OS improvement. The trial predates routine CDK4/6 treatment, so its result is not direct randomised evidence for modern post-CDK4/6 sequencing.

[SWISH](https://pubmed.ncbi.nlm.nih.gov/28314691/) was a single-arm mouthwash study using historical comparison. The EMA report gives grade ≥2 stomatitis in 2/85 evaluable participants at eight weeks. Its alcohol-free dexamethasone regimen is retained as study context requiring local prescription/formulation review, not an automatically generated prescription. Oral candidiasis remains a relevant risk.

Independent consultant and oncology-pharmacy validation remains pending. No clinical-use authorisation is implied.
