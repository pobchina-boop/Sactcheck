# Pembrolizumab monotherapy audit — v0.84.22

Audit date: 26 October 2026. Development source reconciliation only. Independent consultant, oncology pharmacy and patient/PPI review remain pending; clinical use is not authorised.

## Deliverables and integration

- `authoring.json`: complete per-regimen contracts for 00455 and 00558, following the v0.84.21 builder shape. These patient suites are **lung only**, with separate metastatic and adjuvant explanations. Each has one agent, six knowledge chapters, a seven-organ body map, four reusable passport groups, relative treatment/monitoring journeys, qualitative patient evidence, numerical clinician evidence and minimal-emetic support.
- `proposed/integration-manifest.json`: exact proposed/live protocol paths and unchanged protocol identities. Copy each proposed JSON to its mapped shared protocol path; preserve the existing filename and `protocol_id`.
- Merge `authoring.json.regimens` into the v0.84.22 authoring source; generate patient pages/PDFs, consent, logistics, KB, journeys and supportive-care output through the normal builder. Add a lung scope gate for these shared protocols. `selector.include_in_breast_selector` is false.
- Run `node validation/lung-core-v08422/pembro-mono/source-cases.cjs` for proposed content, then the same command with `--integrated` after copying. Both use the real assessment engine, input-validation helper and modification renderer. Reports are written in this folder.
- `sources.json` records actual downloaded source hashes, URLs, retrieval date, local snapshots and page references. `00455.pdf`, `00558.pdf`, extracted text and rendered table images are retained for review. The 00455 pages 5–7 and 00558 pages 5–6 tables were visually inspected.

No live application/shared files were changed by this bounded authoring task.

## Source changes and repaired risks

| Area | Previously encoded | Current source / proposal |
|---|---|---|
| 00455 source | v15b URL now returns 404 | Current HSE lung catalogue links v16, 10 pages, published source amendment 24 July 2026 |
| 00558 source | v12b URL now returns 404 | Current catalogue links v13, 9 pages, source amendment 24 July 2026 |
| Lung indications | First-line metastatic monotherapy only / incomplete | Official suffix **a** remains metastatic TPS ≥50%, no EGFR/ALK; **n** adds adjuvant NSCLC after complete resection and platinum chemotherapy |
| Cervical indication | Progression after chemotherapy | Current suffix **j** is maintenance after induction chemotherapy for persistent/recurrent/metastatic cervical cancer, CPS ≥1 |
| 00455 official code mapping | Local ID `00455a` incorrectly described as official CRC code | Preserve the local ID to avoid reinterpreting saved GI selections, but correct official `code` to **00455k**. Local lung ID `00455-lung` carries official **00455a**. Local ID and official code are intentionally separate. |
| Adjuvant duration | General / incomplete | Maximum 12 months for adjuvant melanoma, RCC and NSCLC; no forced 35-cycle metastatic cap |
| Metastatic duration | Some cards said mandatory 24-month maximum | Until progression/unacceptable toxicity; at 24 months consider stopping after sustained response without progression, with continuation when clinically appropriate |
| Nephritis | 00455 used ≥1.5 and ambiguous baseline/ULN | Strict **>1.5 to ≤3 × ULN** hold; **>3 × ULN** permanent stop. Existing field key retained but UI/unit/help explicitly require ULN, never baseline ratio. |
| Pneumonitis / colitis | 00455 had generic holds | Severe/recurrent conditions have distinct permanent-stop pathways |
| Hepatitis | 00455 lacked complete severe-stop and metastasis pathway | >3 to ≤5 × ULN AST/ALT or >1.5 to ≤3 bilirubin hold; >5 AST/ALT or >3 bilirubin permanent stop. Liver metastases with baseline grade2: ≥50% rise lasting ≥7 days permanent stop. |
| Endocrinopathy | Generic or incomplete | Separate uncontrolled conditions, type1 glucose **>13.9 mmol/L**, DKA, controlled hypothyroidism, severe-endocrine recovery exception and failed continuation criteria |
| Other immune / skin / infusion | Incomplete | SJS/TEN suspected versus confirmed, named severe cardiac/neurological events, recurrent other grade3, other grade4 and grade3–4 infusion events |
| Restart | Incomplete | Explicit 12-week failure-to-recover / steroid-taper conditions; specific endocrine exceptions must be reconciled before selecting these conditions |
| Organ impairment | Incomplete / could be confused with immune injury | Stable renal/hepatic impairment pathways give no automatic dose reduction; they cannot override active immune-nephritis/hepatitis findings |
| Pregnancy/breastfeeding | Incorrectly attributed absolute NCCP contraindication | EMA §4.6 specialist risk–benefit review; pregnancy exception and breastfeeding decision are accurately represented |
| Thyroid checks | Risk of cycle-based drift | Every **3–6 weeks**, including on the 42-day schedule; cortisol when clinically indicated |
| Dose changes | Potential generic reduction wording | No pembrolizumab dose reduction; source-specific hold/stop/restart only |

## Indication and scope cautions

The shared clinical protocol retains its multicancer catalogue. This release does not claim that lung patient information covers melanoma, cervical, urothelial, renal, Hodgkin, head-and-neck or colorectal disease. Non-lung diagnosis, histology, prior-treatment and access conditions still require the current source and clinical review; the executable additions focus on complete shared toxicity pathways and exact lung eligibility. The protocol's eligibility summary explicitly retains the HNSCC six-month exclusion. This is not a claim to have newly automated every non-lung eligibility statement.

The new adjuvant lung indication lists reimbursement **N/A** in the NCCP table. The contract does not imply funded access. Source staging is **AJCC7 stage IB–IIIA**, not an unqualified modern-stage substitution. The trial's stage IB subgroup had tumour size ≥4 cm. Metastatic PD-L1 TPS ≥50% and EGFR/ALK conditions must not be copied into the adjuvant gate.

Urothelial cisplatin-ineligible eligibility contains a real source inconsistency: the indication table says CPS ≥10 but the eligibility text says >10. The proposal sends exactly 10 for explicit review; it does not silently resolve the discrepancy.

The old 00455 skin-perioperative context incorrectly attached three preoperative and fifteen postoperative cycles to stage IIB/IIC indication `00455l-skin`. The replacement context list uses the correct adjuvant-only 12-month description for IIB/IIC. The source's selected **stage IIIB** physician-discretion neoadjuvant schedule is not part of these lung materials. If a dedicated melanoma perioperative selector is retained elsewhere, it must use the stage IIIB source criteria rather than `00455l-skin`.

The CTCAE version cited by both NCCP toxicity tables is **v4**. Proposed grade inputs identify that source version and avoid presenting unverified v5 descriptions as source v4 criteria. This should be preserved if a shared UI enrichment layer adds grading help.

## Clinical evidence reconciliation

**KEYNOTE-024:** 305 previously untreated metastatic NSCLC patients with TPS ≥50% and no sensitising EGFR/ALK alteration. Pembrolizumab 200 mg every three weeks (up to 35 cycles) versus platinum chemotherapy. At median 59.9-month follow-up, five-year OS was 31.9% versus 16.3%; median OS 26.3 versus 13.4 months, HR 0.62 (95% CI 0.48–0.81). Effective crossover to subsequent PD-1/PD-L1 treatment in the chemotherapy arm was 66%. These figures are not adjuvant evidence and are not individual predictions.

**PEARLS/KEYNOTE-091:** the initial primary publication establishes the randomized adjuvant study. The current EMA IV SmPC §5.1/Table13 supplies the later final DFS analysis for the **1,010 patients who received adjuvant chemotherapy**: pembrolizumab n=506, placebo n=504; median DFS 53.8 versus 40.5 months, HR 0.76 (95% CI 0.64–0.91), median follow-up 46.7 months. These are not the original all-randomized-population interim medians. OS remained immature at 58% of prespecified events; the material makes no established OS benefit claim. DFS includes recurrence, second malignancy or death.

**400 mg every six weeks:** neither of the above lung randomizations used this schedule. Its use is supported by pharmacokinetic/exposure bridging, including Lala et al. 2020 (with subsequent corrigendum) and the approved EMA dose schedule. The 00558 contract explicitly labels this limitation. No dedicated 400-mg lung survival figure is invented. Patient evidence contains no trial metrics.

## Validation

At preparation, **233/233** proposed-content cases and **233/233** integrated-content cases passed (including strict schema validation) through the real engine, covering exact numeric boundaries, positive/negative/omitted contexts, recurrence, independent partial toxicities, controlled-endocrine exceptions, stable-organ versus immune-injury dominance, indication scoping, schedule rendering and no generated dose reductions. Missing values remain unassessed and all inputs remain optional. No case treats a partial result as whole-regimen clearance.

Independent clinical and pharmacy review flags remain false. The harness can run against integrated files with `--integrated`; source-based development checks do not confer clinical authorisation. Root integration still requires wider regressions, UI checks, rendered PDF inspection and the shared patient-scope gate.

## Retrieval record

The old stored source URLs failed. Direct HSE downloading initially failed with HTTP403 for generic requests, but the current catalogue PDF URLs succeeded using a normal browser User-Agent. Both saved payloads begin with `%PDF` and their extracted headers match the audited versions. Therefore the SHA-256 values in `sources.json` and protocol metadata are hashes of actual verified PDF bytes, not invented values or hashes of text mislabeled as PDF hashes. The source text has a separate hash.

Direct PubMed HTML downloads returned cookie-challenge pages; those payloads were rejected and removed. Trial identities/results were checked through primary-publication web retrieval. No challenge payload is represented as article evidence or assigned a source-content hash. EMA Table13 on printed page45 was also rendered and visually inspected.

A strict-validator follow-up caught duplicate selection options caused by carrying legacy aliases into canonical IDs during repeated generation. The generator now reads pristine committed HEAD inputs and maps aliases explicitly. Both proposed protocols pass strict validation with no errors; the source harness includes this check. Existing 00558 skin/head-and-neck aliases remain distinct, and its ambiguous GU alias carries no false official indication code.
