# IV breast source audit — v0.84.19

Checked 25 October 2026 against the downloaded current NCCP PDFs and current EMA product-information PDFs listed, hashed and page-mapped in `sources.json`. Scope is NCCP00688 and NCCP00738. Baseline: `6c1050b8a2ced301fe770fe67fd518b5a78566e5`; frozen baseline protocol copies live in `../baseline/`. Raw source PDFs remain outside the repository and are not distributed.

This is source reconciliation and software verification. Consultant review, oncology-pharmacy review and clinical-use authorisation remain false. Any source interpretation requiring clinical judgment produces a review, hold or stop; this audit does not authorise treatment or rechallenge.

## Current source and jurisdiction

| Regimen | Current NCCP document | Revision date | Published | Review due |
|---|---|---|---|---|
| 00688 atezolizumab + nab-paclitaxel | v2a, 10 pages | 14 August 2025 | 20 January 2022 | 16 December 2027 |
| 00738 bevacizumab + paclitaxel | v3, 10 pages | 28 April 2025 | 11 July 2022 | 31 January 2029 |

Both remain listed in the retrieved Irish NCCP advanced-breast catalogue. Current EMA product information retains the TNBC atezolizumab/nab-paclitaxel indication and first-line metastatic breast bevacizumab/paclitaxel indication. US regulatory history is not used to infer Irish withdrawal. Catalogue presence, a source reimbursement entry and EU marketing authorisation are different from individual local funding/approval.

## 00688 discrepancies and proposed correction

The baseline schedule and assessment metadata had inherited a single-agent atezolizumab model, including 1680 mg Day 1 and unrelated source/reimbursement metadata. The actual NCCP combination is atezolizumab 840 mg Days 1/15 followed by nab-paclitaxel 100 mg/m² Days 1/8/15, every 28 days. Day 8 is chemotherapy alone. Nab-paclitaxel is specified for up to six cycles; extension is a consultant decision. Atezolizumab can continue separately until progression or unacceptable toxicity. The corrected proposal retains the existing stable protocol identifier.

- Eligibility now distinguishes prior advanced systemic treatment, the ≥12-month interval after adjuvant/neoadjuvant chemotherapy, ECOG 0–1, baseline grade ≥2 neuropathy, infection, symptomatic CNS/ILD, severe liver impairment and pregnancy/breastfeeding. The prior-PD-1/PD-L1 source link is handled as a review, not an invented eligibility interval.
- PD-L1 must be the appropriate immune-cell result; NCCP requests Ventana SP142. A CPS or tumour-cell percentage cannot be substituted for the ≥1% immune-cell criterion. An isolated percentage with no assay requires review.
- Starting immunosuppressive corticosteroids >10 mg/day prednisolone equivalent is separated from steroids prescribed to treat an immune event after therapy starts. Inhaled/topical steroids and controlled hormone replacement are not silently assigned the systemic immunosuppression meaning.
- Nab count holds differ by day: Day 1 ANC <1.5 or platelets <100; Day 8/15 ANC <0.5 or platelets <50. The monoclonal does not inherit a chemotherapy dose reduction. Missing day is reviewed; chemotherapy rules do not fire in a confirmed atezolizumab-only phase.
- Historical neutropenic events use the actual source occurrence ladder 75 mg/m², then 50, then stop. Nadir platelets <50 use 75 at first occurrence and stop at second. Missing episode count, unrecovered counts and competing reductions prevent an automatic restarted dose. A missed Day 15 is not automatically moved to another day.
- Grade 3/4 nab neuropathy requires a hold until ≤1, then occurrence-specific review; a third occurrence stops nab-paclitaxel. These thresholds do not convert a baseline grade 2 exclusion into an ongoing grade 2 stop.
- CrCl <30 mL/min has insufficient data for a dose recommendation. A review is returned; no percentage is invented and indexed eGFR is not treated as CrCl.
- ALT and AST are now distinct inputs. Nab hepatic rules use AST and bilirubin; immune hepatitis uses ALT or AST or bilirubin and an immune-attribution context. The shared AST value can feed both relevant pathways. A biochemical abnormality alone does not prove immune hepatitis.
- Suspected immune-nephritis attribution is similarly required before choosing the immune-specific creatinine-ratio stop. A baseline/other/unknown creatinine rise receives prompt cause/denominator review rather than automatic permanent atezolizumab cessation.
- Corrected immune-event gaps include any-grade serious neurological syndromes, grade 4 hypophysitis, recurrent pancreatitis and active infusion-reaction interruption. General restart remains a consultant decision, with event-specific exceptions, recovery/taper timing and steroid dose. The pericardial and HLH rows retained from the broader model are explicitly attributed to the current EMA supplement, not falsely to NCCP00688.
- NCCP's immune table explicitly uses CTCAE v4. Source grading is identified as such; a generic grade selector is not represented as a complete clinical grading instrument.

### Boundaries that remain explicit

| Source issue | Proposed behaviour |
|---|---|
| NCCP p3 allows Day 1 ANC ≥1.5 and platelets ≥100; p8 restart wording uses >1.5 and >100 | An exact-equality restart is reviewed. The initial Day 1 inclusive threshold remains distinct. |
| Nab hepatic interruption row allows AST ≤10, but restarting requires AST <10 | Exact AST 10 cannot be used to authorise restart after hepatic hold. |
| Nab hepatic toxicity must resolve within three weeks | >3 weeks unresolved stops; exactly three weeks requires timing/recovery review. |
| Nab AST >10 or bilirubin >5 | Stop nab under its table; evaluate the monoclonal independently. |
| Nab moderate hepatic row specifies 75 mg/m² and allows reconsideration of 100 after two tolerated reduced-dose cycles | The tool does not calculate an immediate restart/escalation; recovery, previous dose and consultant decision are required. |
| Unknown cause of high liver results or creatinine | Clinical review of attribution; no automatic permanent immune-therapy stop based on lab value alone. |

## 00738 discrepancies and proposed correction

NCCP00738 uses bevacizumab 10 mg/kg Days 1/15 and paclitaxel **80 mg/m²** Days 1/8/15 every 28 days. Treatment continues until progression or unacceptable toxicity. The active-drug context allows safe assessment if either component has separately been held or stopped; it does not automatically prescribe maintenance.

- Preserves the baseline ANC ≥1.5 eligibility criterion separately from the ongoing count table. Missing assessment stage is reviewed where it matters.
- The paclitaxel count ladder is 80 → 65 → 50 mg/m². ANC <0.5 requires a duration assessment: the printed mandatory reduction row requires ≥7 days. An unknown/shorter duration is held for assessment without assuming that reduction.
- Platelets exactly 90 are present in both printed full-dose and delay bands. A review is added instead of choosing the less restrictive band. ANC between 0.99 and 1.0 is similarly unassigned and is not rounded.
- Hepatic rows require ALT <10 and bilirubin 1.26–2 (60 mg/m²) or 2.01–5 (40 mg/m²). ALT ≥10 or bilirubin >5 is contraindicated under the source table. Missing ALT and the decimal gaps (1.25,1.26) and (2,2.01) require review. Hepatic doses are not conflated with the haematological 65/50 ladder.
- Grade 2 neuropathy specifies 10 mg/m² less than the actual current paclitaxel dose, not an unconditional 70 or a one-level 65 mg/m² dose. Grade ≥3 neuropathy stops paclitaxel. Delay >14 days or intolerance after two reductions also stops that component.
- Dipstick 2+/3+ or a spot concentration ≥1 g/L triggers a 24-hour collection within three days before the next bevacizumab dose, not automatic withholding merely from that screening result. Dipstick 4+ requires holding. Quantitative >2 to ≤4 g/24h holds; >4 stops. Spot g/L and total g/24h remain separate inputs.
- Adds missed grade 4/nephrotic proteinuria, any-grade tracheoesophageal fistula, arterial thromboembolism, hypertensive crisis/encephalopathy, PRES and necrotising-fasciitis stopping pathways. Existing severe bleeding, GI perforation, fistula and venous-event pathways remain agent specific.
- Grade 2/3 hypertension needs treatment/control review and consideration of withholding. Persistent grade 3 or grade 4 requires discontinuation. The narrative initiation threshold requires sustained hypertension on antihypertensive medication; a single number is not treated as the full clinical definition.
- Surgery precautions are separate: withhold in the source's 28-day period before major elective surgery or seven days before minor surgery, under the consultant's plan; do not initiate within 28 days after major surgery or before complete wound healing. Exact elapsed boundaries are not a clearance decision. Wound problems remain a hold irrespective of elapsed days.
- Prior anthracyclines/chest irradiation or significant cardiac history prompt baseline cardiac review. No fixed three-monthly HER2 echo schedule is invented.
- Current suspected febrile neutropenia is urgent withhold/assessment, distinct from historical resolved FN and G-CSF consideration.

## Carry-through to the complete service suite

`service-facts.json` supplies machine-readable schedules, durations, day-specific support, monitoring and patient red flags with source-page pointers. It distinguishes nab-paclitaxel from solvent-based paclitaxel and both from antibody-only visits.

00688 ordinarily needs no routine taxane steroid/antihistamine premedication. Its baseline endocrine/viral tests, every-second-cycle TFT and clinically indicated cardiac testing should not become generic monthly endocrine tests or fixed serial echocardiography. NCCP regular tests are before each cycle; nab count requirements additionally require the relevant Day 1/8/15 result and locally agreed pre-dose workflow.

00738 first paclitaxel premedication is dexamethasone 8 mg IV, chlorphenamine 10 mg IV and famotidine 20 mg IV. From Day 8 the source table omits routine dexamethasone, retaining it for risk/reaction under consultant guidance; chlorphenamine continues and famotidine can be omitted under guidance when no reaction. Bevacizumab alone does not inherit these premedicines. The NCCP regimen's antiemetic cross-reference must be reconciled separately with the current national antiemetic guidance by the integrating service work.

Immune red flags persist after atezolizumab has ended. Bevacizumab material needs explicit hypertension/proteinuria, bleeding/clot, bowel and wound/surgery advice alongside paclitaxel infection/neuropathy advice. Detailed actionable grading and prescribing remain clinician content.

## Evidence and benefit statements

`evidence.json` separates primary PFS, final OS and formulation-specific evidence. IMpassion130's PD-L1-positive PFS benefit is supported, but its final subgroup OS is exploratory because ITT OS did not pass the prespecified hierarchical test. IMpassion131 used solvent paclitaxel and did not reproduce a PFS or OS benefit; it does not justify a formulation substitution.

E2100 is predominantly HER2-negative metastatic evidence, not a TNBC-only study, and used paclitaxel 90 mg/m² rather than NCCP00738's 80. The original publication showed PFS and response improvement without a statistically significant OS improvement. Its numbers are kept together rather than mixed with different EMA assessment/reanalysis estimates. Neither median differences nor hazard ratios are translated into guaranteed individual benefit.

The linked IMpassion130 final-paper corrigendum record was identified. Its full text could not be retrieved through the DOI tool; no content was assumed. The final OS values used were separately checked against the current EMA product information.

## Verification and remaining integration

Run from the repository root:

```sh
node validation/breast-final-v08419/iv/source-cases.cjs baseline
node validation/breast-final-v08419/iv/source-cases.cjs proposed
node validation/breast-final-v08419/iv/source-cases.cjs integrated
```

The same 177 independently selected cases run against each mode, with separate JSON reports. Frozen baseline: **58 pass / 119 fail** (expected defects and missing pathways). Proposal: **177 pass / 0 fail**. Cases exercise blank/partial assessments, original schedules, biomarker method, day-specific count boundaries, missing context, overlapping and decimal source boundaries, active-agent context, renal/hepatic attribution, historical versus current toxicity and clinically material stop pathways. Review-path checks also inspect the dose model to prevent an invented absolute prescription.

Production integration, rendered UI/absolute-unit handling, consent/support/patient documents and full-suite regression remain the parent implementation's responsibility. The proposals intentionally leave software-tests-completed false until that wider integration is verified, and all clinical approval flags false. New numerical fields and select controls must be included in that UI verification. No clinical source document is bundled in the release.
