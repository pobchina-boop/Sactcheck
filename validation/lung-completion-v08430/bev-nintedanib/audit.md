# NCCP 00214 and 00372 source audit — v0.84.30

Checked 2 November 2026. This is source reconciliation and software validation, not independent clinical or pharmacy approval. Patient/PPI review remains pending.

## Sources and method

Fresh copies of NCCP 00214 v8 (8 pages) and 00372 v6 (7 pages) were retrieved from their current official HSE URLs. PDF and extracted-text SHA-256 values are recorded in `sources.json`. The schedules and difficult dose tables were rendered and inspected visually: 00214 page 4; 00372 pages 1–3. Current EMA Avastin and Vargatef product information was also retrieved. AVAiL and LUME-Lung 1 primary publications were checked through PubMed.

The version changes in these NCCP documents concern review arrangements; the footer still identifies the previous substantive review dates. A current retrieval date is not presented as a fresh expert endorsement of every recommendation.

## 00214 — bevacizumab 7.5 mg/kg every 21 days

| Finding | Resolution |
|---|---|
| Existing record showed colorectal wording on the lung card and used a synthetic lung indication ID. | Restore official 00214a colorectal and 00214b lung IDs and separate dose-reference contexts. Patient material is explicitly scoped to lung and the bevacizumab component. |
| Existing eight-rule assessment omitted initial blood/organ eligibility, source protein measurements and several serious-event pathways. | 56 source-linked rules cover eligibility, component/partner scope, BP control/persistence, urine protein, surgery/wounds, bleeding, venous versus arterial thrombosis, fistula site/severity, GI perforation, PRES and other source precautions. |
| Generic proteinuria grade≥2 rule withheld treatment. | Replace with the actual Table 2 pathway: 2+/3+ dipstick or spot protein≥1 g/L prompts timed collection within 3 days before the next dose; 4+ is withheld pending quantification. Quantified total protein≤2 g/24 h, >2–4 and >4 retain distinct actions. Spot concentration is never converted into daily excretion. |
| Generic numerical BP≥160/100 rule was treated as a source hold. | Hold depends on uncontrolled or symptomatic hypertension. Persistent grade 3 and grade 4 have separate stop pathways. Numerical source prose >150/100 has ambiguous discordant-component logic, so a raised component prompts review without manufacturing an automatic hold threshold. |
| All fistulae and recent thrombosis were collapsed. | Separate TE/grade 4 fistula, other fistula review, grade 4 venous events and any arterial event. |
| No source-defined renal/hepatic percentage adjustment. | Preserve the original no-prescriptive-adjustment provenance, but encode initial eligibility separately and require review for impairment. No bevacizumab toxicity dose reduction is invented. |
| NSCLC treatment phases absent. | Up to six platinum-combination cycles, then possible bevacizumab continuation every 21 days. The partner regimen must supply its own complete schedule and support plan. No fixed total-cycle wallet count. |
| Evidence risk of substituting a 15 mg/kg or colorectal trial. | Use AVAiL 7.5 mg/kg cisplatin/gemcitabine evidence. Label improved PFS and absence of a statistically significant OS improvement in final analysis. No survival figure is printed in the patient pack. |

The 00215 rule structure was reused only after checking the relevant pathways against freshly retrieved 00214 v8; sources, pages, indications, dose and schedule were reconciled. Existing shared bevacizumab consent content was retained, not overwritten with lung-only wording.

## 00372 — nintedanib/docetaxel and continuation

| Finding | Resolution |
|---|---|
| Existing record omitted a major phase transition. | Combination is docetaxel 75 mg/m² Day 1 plus nintedanib 200 mg twice daily Days 2–21, every 21 days, up to six cycles. Continuation requires at least four completed combination cycles and consultant approval, then nintedanib twice daily continuously in 28-day cycles. |
| Nintedanib Day 1 omission could leak into continuation. | Separate `combination` and `continuation` patient contexts and dose-reference phases. No nintedanib on the actual docetaxel day in combination; no planned Day 1 omission or tablet-free week in continuation. |
| ECOG≤2 and generic platelet≥75 threshold were not this source's rules. | ECOG 0–1 is restored. Unsupported numerical platelet hold removed; source toxicity-grade and clinical-assessment pathways remain. |
| Source ANC threshold differs between Table 1 (≥1.5) and complication prose (>1.5). | Exactly 1.5 ×10⁹/L requires explicit specialist reconciliation; below 1.5 delays docetaxel, with separate baseline exclusion. |
| CrCl table uses >30 and <30, leaving exactly 30 unassigned. | Distinguish <30 not-studied review from exact-30 source-gap review. No arbitrary full-dose permission at that boundary. |
| Old blanket transaminase>3 hold was incorrect. | Use >2.5 with bilirubin≥1.5 OR transaminase>5. Retain recovery≤2.5 plus normal bilirubin before reduced-dose restart. |
| Old liver stop rule omitted the alternative-cause qualifier. | Liver-injury pattern >3 / bilirubin≥2 / ALP<2 is interrupted and investigated. Permanent stopping is encoded when no alternative cause is established; unknown or established alternative cause does not automatically clear treatment. |
| Docetaxel liver table has awkward AND/OR layout; 75 mg/m² is already the starting dose. | Potential severe patterns and the 75 mg/m² row generate specialist review. No fabricated percentage reduction or unqualified bilirubin-only contraindication. Severe clinical liver impairment remains an exclusion. |
| Toxicity dose levels and component boundaries were incomplete. | Nintedanib interruption and 200→150→100 mg twice-daily sequence is separate from docetaxel 75→60 mg/m² then discontinuation for persistent source events. Missing dose/phase prevents automatic numeric adjustment. Grade 4 skin toxicity is urgent review because the source row specifies grade 3. |
| Oral safety and current SmPC additions incomplete. | Missed-dose/no-double-dose handling, minimum-dose intolerance, bleeding, surgery/wounds, ischaemic colitis, nephrotic proteinuria, renal deterioration, active brain metastases and suspected PRES added with explicit EMA attribution. Suspected PRES requires discontinuation. |
| Monitoring was too generic. | Combination FBC before cycles and around nadir; post-combination FBC when indicated. Liver tests each combination cycle and monthly in continuation. BP baseline/periodic/as indicated. Imaging/tumour-marker dates remain individual. |
| Support plans could carry steroids/G-CSF into maintenance. | Combination docetaxel dexamethasone course and G-CSF consideration are distinct from the oral minimal-to-low antiemetic and diarrhoea plan. Continuation has no automatic docetaxel premedication. |
| Nintedanib was absent from consent agent profiles. | Add a source-based nintedanib consent profile, preserving shared existing drug profiles. |
| Evidence could conflate all-histology PFS with adenocarcinoma OS. | LUME-Lung 1 endpoints are population-labelled. It is not presented as evidence for starting nintedanib alone. |

The vomiting/nausea row combines symptoms with a “despite antiemetic treatment” qualifier. Where supportive-treatment history is missing, the tool asks for review rather than assigning an automatic reduction. Patients are told to call early; duration criteria for clinician dose modification are never instructions to wait at home.

## Integration contract

- `00372`: `metadata.dose_schedule_context_input = "treatment_phase"`, `dose_schedule_context_kind = "phase"`; values `combination` and `continuation`.
- Canonical patient record has `patient_context_selector: true`; root routing must advertise only the two real context bundles, not a combined canonical guide PDF.
- Docetaxel-specific action rules are combination-gated, with unknown-phase review where appropriate. Continuation does not inherit docetaxel dose actions.
- `00214`: lung-only patient root route requires a scope guard and notice. Clinical assessment retains both source indications.
- Historical `organ_function_reconciliation.release` stays 0.59.0, with `reconciled_release` 0.84.30. The conflicting OF590 00372 rules are replaced, not retained alongside the new pathways.
- Replacement renal/hepatic IDs: `NINT_RENAL_LT30`, `NINT_RENAL_EXACT30`, `NINT_CHILD_BC`, `NINT_LFT_HOLD`, `NINT_LFT_PERMANENT`, `NINT_LFT_CAUSE_REVIEW`, `DOC_HEPATIC_75`, `DOC_HEPATIC_SEVERE_REVIEW`.

## Validation

`node validation/lung-completion-v08430/bev-nintedanib/source-cases.cjs`

200/200 proposed-source cases passed. The same runner supports `--integrated` against the canonical repository after root integration. Cases include exact boundary values, missing context, source ambiguities, phase-specific component actions, schedules, patient day coverage and indefinite versus finite wallet records. Fresh source files and original protocol snapshots are retained in this research directory; source PDFs/rendered images should not be included in the end-user application ZIP.
