# Aromatase-inhibitor retrospective audit — v0.84.20

Source check: 25 October 2026. Scope: NCCP anastrozole 00254, letrozole 00371 and exemestane 00376. This audit supplies proposals; it does not grant clinical-use authorisation or independent consultant/pharmacy approval.

The downloaded current official documents remain **00254 v5, 00371 v4 and 00376 v4**. All three physical PDF page 2 organ-function tables were rendered and visually inspected. The downloaded tables agree with the established drug-specific rules. PDF and extracted-text SHA-256 values are recorded in `sources.json` and the proposals. The old statement that no PDF could be downloaded or visually inspected is now obsolete.

## What the actual baseline already did correctly

The frozen baseline already contained 79 source-aware rules across these three protocols. It blocked or referred premenopausal/uncertain endocrine states, pregnancy, breastfeeding, hypersensitivity, return of ovarian function, important interactions and relevant treatment-history gaps. Its hepatic recommendations were already distinct: anastrozole severe impairment not recommended; letrozole Child–Pugh C 2.5 mg every other day; exemestane no routine hepatic reduction with caution. The letrozole numeric frequency was already blocked by competing exclusions and reviews. Baseline tests verify these behaviours rather than describing them as newly added.

The baseline also already avoided chemotherapy-cycle blood-count rules, CTCAE-based reduction ladders, invented routine cardiac imaging and automatic treatment restarts. These features are retained.

## Changes supported by this audit

| Finding | Proposed handling | Evidence |
| --- | --- | --- |
| Letrozole Child–Pugh C returned its standard organ-adjusted frequency even if the clinician supplied an already reduced/custom current schedule; baseline had no field to interpret that history. | Optional current-prescription field; custom/reduced or uncertain dosing plus Child–Pugh C requires reconciliation and suppresses numeric output. No automatic escalation or second halving. | NCCP 00371 physical p2 specifies 50% of the **original** dose, represented as 2.5 mg every other day. Guard is a conservative application safeguard, not a new NCCP dosing table. |
| Patient and KB letrozole text mentioned additional neoadjuvant selection criteria, but assessment could not review entered conflicts. | Optional indication-scoped HER2, chemotherapy-suitability and immediate-surgery fields. Known conflicts produce review; unrelated settings are not restricted. Missing criteria remain unassessed. | HPRA Letrozole Teva §4.1 is narrower than NCCP 00371d: HER2-negative, chemotherapy unsuitable and immediate surgery not indicated. |
| Exemestane patient indication and duration attributed the product-label tamoxifen-switch details to NCCP. | Distinguish broad NCCP adjuvant/extended/advanced indications from Aromasin’s specific adjuvant sequence. Earlier tamoxifen years count towards the agreed total; an extension is separate. | NCCP 00376 p1 versus Aromasin §4.1–4.2. |
| All three patient evidence objects had empty metrics arrays but retained numerical trial outcomes in their prose. | Replace the whole patient evidence object with qualitative setting-specific benefit explanations. Keep numbers in clinician evidence only. | Direct inspection of frozen patient JSON and v0.84.2 KB. |
| Letrozole patient urgency omitted its tendon warning. | Add new tendon pain/swelling and sudden loss of function, with prompt assessment and protection of the affected tendon. | NCCP 00371 p3 and HPRA §4.4. |
| The KB used the same generic mechanism paragraph for all AIs. | Explain nonsteroidal reversible anastrozole/letrozole versus steroidal irreversible exemestane, without implying clinical superiority or ovarian suppression. | Linked product information pharmacodynamic sections. |
| BIG 1-98 clinician evidence stopped at its earlier 8.7-year analysis. | Add the primary 12.6-year follow-up, where the DFS CI includes no difference; describe observational extension, weighting, crossover and attrition. | Ruhstaller et al., JCO 2019, PMID 30475668. |

## Source conflicts and limits preserved explicitly

- **Anastrozole hepatic impairment:** NCCP says no reduction for mild/moderate impairment and does not recommend severe impairment; the linked SmPC advises caution in moderate/severe impairment. This is not converted into an invented percentage reduction or an absolute SmPC contraindication.
- **Anastrozole indications:** the linked Teva SmPC is narrower than the NCCP adjuvant catalogue. Confirm the supplied product and prescribing authority; the NCCP indications are not silently removed.
- **Letrozole severe renal impairment:** NCCP says no adjustment, including expected no adjustment on haemodialysis; the linked SmPC has insufficient evidence below CrCl 10 mL/min. Review remains distinct from a fabricated numerical reduction.
- **Letrozole severe hepatic impairment:** NCCP provides every-other-day dosing; the linked SmPC requires close supervision without that numerical frequency. Both sources are identified in the existing rule and retained.
- **Exemestane strong CYP3A4 induction:** reduced exposure requires review. The Irish SmPC does not supply an automatic 50 mg instruction; a US product instruction is not imported.
- **Exemestane source date:** NCCP’s reference describes an August 2025 product update, but the actual linked PDF and current HPRA product-page link resolve to the SmPC dated 9 January 2025. The audit does not claim to have seen an August version.
- **Duration:** NCCP continuous schedules do not mean identical duration in adjuvant, extended, neoadjuvant and advanced settings. Letrozole neoadjuvant response is reviewed during the source 4–8-month window; inadequate response prompts surgery/alternative review. An adjuvant switch does not reset the whole treatment clock.

## Monitoring and full-suite integration

Baseline FBC, renal and liver profiles and indicated biochemical menopause confirmation remain distinct from subsequent clinically indicated testing. Bone density, fracture risk, lipids and symptoms need a documented plan, with no fixed chemotherapy-cycle cadence. Exemestane additionally has SmPC vitamin-D assessment advice. Routine ECG/echo is not specified for these monotherapies; investigate cardiac symptoms and manage risk when indicated. Companion medicines retain their own monitoring requirements.

NICE NG101 baseline DXA advice for adjuvant AI has an exception for patients already receiving adjuvant bisphosphonates. The 2025 joint bone-loss statement supports risk-based reassessment, generally one to two years in lower-risk patients and around two years on bone-protective treatment. These are externally attributed bone-care intervals, not NCCP cycle tests or automatic AI stop thresholds.

`service-facts.json` provides full patient-key replacements while retaining valid unrelated anatomy and source material. Apply these consistently to knowledge, guide, consent, supportive care, passport, logistics and date-free timeline generation. Replace obsolete KB source limitations. `evidence.json` contains six clinician-only trial records: ATAC; BIG 1-98 latest follow-up; MA.17; P024; IES; historical advanced exemestane versus megestrol. Early-breast recurrence estimates are not presented as metastatic prognosis, neoadjuvant response as survival, or BCFS as overall survival.

## Verification

Run from repository root:

```sh
node validation/endocrine-next-v08420/ai/source-cases.cjs --mode baseline
node validation/endocrine-next-v08420/ai/source-cases.cjs --mode proposed
node validation/endocrine-next-v08420/ai/source-cases.cjs --mode integrated
```

Baseline: **290/300 passed, with 10 observed missing-safeguard failures; all 79 existing rules covered**. Proposed: **300/300 passed, all 83 rules covered**. The clinical oracle is identical across modes; only historical metadata expectations vary. All ten baseline failures concern the absent letrozole current-prescription or neoadjuvant-scope guards, including cases where those reviews must suppress a hepatic dose instruction. Actual baseline findings and dose displays are recorded in the failure report. They exercise single/omitted values, exact renal and age boundaries, menopause/OFS, original indications/history, drug-specific organ recommendations, current prescription context, neoadjuvant scope and competing restrictions suppressing numeric doses. The totals comprise 295 decision scenarios and five structural/source checks. Strict schema checks pass with stable protocol IDs and all new inputs optional. Integrated mode is ready for root integration; this audit does not claim an integrated pass before the proposals are copied into production.

The inherited v0.84.2 AI test file contains historical metadata assertions for the old check date, encoding release and absent PDF checksum; migrate those assertions if that historical suite remains active. No production file was changed by this audit.
