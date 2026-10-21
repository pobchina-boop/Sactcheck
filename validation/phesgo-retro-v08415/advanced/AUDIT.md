# Advanced Phesgo retrospective audit — 0.84.15

Checked 21 October 2026 against current official NCCP PDFs and EMA Phesgo SmPC. Scope: 00785 maintenance, 00796/docetaxel, 00797/weekly paclitaxel. Research/proposals only; no application files edited. Independent clinical and oncology-pharmacy approval remains pending.

## Findings and proposed changes

| Finding | Observed frozen baseline | Proposal |
|---|---|---|
| Pretreatment/current LVEF distinction | `baseline` + current LVEF 49 gives `proceed_with_caution` without a specific cardiac finding. Historical baseline 49/current 55 during treatment instead triggers a baseline hold. | Apply initiation criteria to current measurements at initiation; scope historical-baseline criterion to initiation/unspecified stage; ask for missing stage. Preserve independent ongoing hold criteria. |
| Invalid stage | `assessment_stage: "later"` or `7` bypasses stage-specific criteria. | Protocol-scoped invalid-stage review. No generic engine change. Independent cardiac hold remains higher priority. |
| Reaction coverage | Phesgo hypersensitivity grades 1–3 produce no reaction-specific finding. | Pause/assess/manage, and require treating-team decision before re-exposure. Serious reaction prompts specialist review; grade 4/bronchospasm/ARDS retains permanent stop. Add optional significant injection-reaction input. |
| Continuation context | No explicit progression input; maintenance lacks an explicit chemotherapy-completion input. | Optional progression review in all three, completion review in 00785. This adds visible context checks; it does not replace full indication review. |
| 00796 cardiac reassessment | Recommendation omits NCCP's repeat-LVEF timing. | Include repeat **within 3 weeks** and attribute minimum interruption/resumption guidance to the SmPC. |
| 00797 supportive decision text | Moderate cytopenia advice omits consideration of later reduction; febrile-neutropenia action omits G-CSF consideration. | Restore these qualifiers without assigning a numeric restart dose. |
| Copying/content residue | Allergy text mentions absent carboplatin; 00797 neuropathy mentions TRAIN-2. Antibody-only notes refer to subsequent chemotherapy. | Remove irrelevant text. Clarify diarrhoea interruption/restart advice without an automatic percentage reduction. |

These are repeated pathways and content refinements, **not 44 distinct clinical errors**. Existing missing-input handling, six-week reload boundary, ongoing cardiac thresholds, chemotherapy/continuation separation, 00797 hepatic bands/platelet overlap, and docetaxel intermediate-hepatic ambiguity are retained.

## Reproducible checks

`source-cases.cjs` uses the real assessment engine and dose renderer. Expected scenarios were derived from the cited primary-source sections, then tested against frozen baseline and separate proposed JSON. It does not patch expectations into the application.

- Frozen baseline: **63/107** expectations met, **44** unmet, including new context/content expectations.
- Audit proposal: **107/107** passed.
- The default runner mode reads **actual integrated app protocols**, not the proposal. Run it after integration. Passing these checks is software/source verification, not clinical validation or a completeness estimate.

```sh
node validation/phesgo-retro-v08415/advanced/source-cases.cjs
node validation/phesgo-retro-v08415/advanced/source-cases.cjs baseline
node validation/phesgo-retro-v08415/advanced/source-cases.cjs proposed
```

`proposed-changes.json` contains minimal rule/input replacements and additions, plus narrow phase-note replacements. `proposed/*.json` are full reviewable candidates. Baseline files and hashes remain frozen.

## Primary sources and provenance

- [NCCP 00785 v3](https://healthservice.hse.ie/documents/6659/785_v3_Pertuzumab_trastuzumab_Phesgo.pdf): pages 1–3 indication, tests, dosing and cardiac criteria; pages 4–5 support/reactions.
- [NCCP 00796 v4](https://healthservice.hse.ie/documents/6419/796_v4_PertuzumabTrasDoc_Phesgo.pdf): pages 1–3 indication, duration, tests; pages 4–5 dose/toxicity tables; pages 5–6 premedication.
- [NCCP 00797 v4](https://healthservice.hse.ie/documents/6420/797_v4_PertuzumabTrasPhesgo_PACLitaxel.pdf): pages 1–3 indication, weekly schedule, tests; pages 4–5 toxicity; pages 5–6 premedication.
- [EMA Phesgo SmPC](https://www.ema.europa.eu/en/documents/product-information/phesgo-epar-product-information_en.pdf): sections 4.2/4.4, especially pages 4–8.
- [Current NCCP advanced breast catalogue](https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/breast-sact-regimens-locally-advanced-metastatic/) confirms the linked versions. The catalogue uses 00785a although its PDF indication table prints 00785; retaining 00785a is appropriate.

Current NCCP PDF content was successfully browsed; local downloads returned HTTP 403. `sources.json` distinguishes previous .12 hashes from current verification and does not claim fresh NCCP PDF hashes. EMA download succeeded. Source versions/review dates agree with existing metadata; no NCCP version bump is proposed.
