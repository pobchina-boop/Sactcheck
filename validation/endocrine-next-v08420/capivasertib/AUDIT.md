# NCCP00947 capivasertib + fulvestrant — v0.84.20 source audit

Checked 25 October 2026. NCCP version 1, published 4 August 2026; review due 4 August 2027. This is a new protocol addition, not a revision of an existing 00947 assessment. Independent clinical and oncology-pharmacy validation remains outstanding; clinical-use authorisation is **false**.

## Sources and verification

- [NCCP00947v1](https://healthservice.hse.ie/documents/10966/00947_Capivasertib_Fulvestrant.pdf): all 11 pages read and rendered. The monitoring table on page 4, renal/hepatic table and dose ladder on page 5, glucose table on page 6 and diarrhoea/skin tables on page 7 received individual visual inspection. Other pages were also checked in rendered contact sheets. The downloaded PDF hash is recorded in `sources.json` and protocol metadata.
- Current [EMA Truqap product information](https://www.ema.europa.eu/en/documents/product-information/truqap-epar-product-information_en.pdf): sections 4.2–4.8 and 5.1–5.2 checked, including current glucose/ketone safety, interactions, renal definitions and trial evidence.
- Current [EMA Faslodex product information](https://www.ema.europa.eu/en/documents/product-information/faslodex-epar-product-information_en.pdf): hepatic/renal dosing, injection safety, estradiol assay interference, contraception and mechanism checked.
- CAPItello-291 primary PFS report, [Turner et al., NEJM 2023](https://www.nejm.org/doi/full/10.1056/NEJMoa2214131), and primary final-OS congress abstract, [Rugo et al., ESMO Open 2026 abstract 417O](https://www.esmoopen.com/article/S2059-7029%2826%2901382-7/fulltext), DOI 10.1016/j.esmoop.2026.107440. Final-OS numeric results and conclusion were retrieved from the official indexed abstract; direct full-text/PDF access returned HTTP403. This access limit is preserved in `evidence.json`; no secondary article is substituted as the primary citation. The original OS table reproduced in a public educational slide deck was visually checked as corroboration.

The HSE PDF initially returned HTTP403 with default urllib. An ordinary browser User-Agent successfully downloaded the public source; no authenticated access or login workaround was used.

## Clinical reconciliation

The indication remains ER-positive/HER2-negative **advanced disease with a qualifying PIK3CA, AKT1 or PTEN alteration**, following endocrine recurrence/progression. An all-comer CAPItello-291 result cannot remove this restriction. Pre/perimenopausal ovarian suppression is required; LHRH in men is a consideration rather than an invented mandatory rule.

The schedule is capivasertib twice daily for **four days followed by three days off every week**, inside each 28-day cycle. Fulvestrant is **intramuscular**, on days 1 and 15 of cycle 1 and day 1 of subsequent cycles. The first and continuing cycles are encoded separately. The capivasertib ladder is 400 → 320 → 200 mg twice daily; no 300 mg step or lower invented dose is introduced. A pause does not restart loading or automatically return a patient to the initial dose.

The day-1 ANC/platelet thresholds protect fulvestrant IM injection safety. They must not become a capivasertib myelosuppression reduction. Severe renal/hepatic impairment excludes the combination even though the fulvestrant-only table expects no renal dose change below CrCl 30 or in haemodialysis. Capivasertib's severe-renal definition is supplemented from EMA section 5.2, page 19. Indexed eGFR is not silently treated as creatinine clearance.

**Unresolved source disagreement:** NCCP page 5 recommends fulvestrant 250 mg for Child-Pugh B; current EMA Faslodex section 4.2, page 3, recommends no adjustment for mild/moderate impairment, with caution. Both are stated in the review finding. The application must not calculate a definitive fulvestrant dose from this disagreement.

Hyperglycaemia follows the source's **CTCAE v4.03** numerical fasting-glucose table, with cutoffs 8.9, 13.9 and 27.8 mmol/L. Diarrhoea, rash and other toxicities follow the separate **CTCAE v5.0** tables. Exact boundaries, fasting/pre-dose qualification, peak event grade, present result, elapsed recovery time, 24-hour grade-4 persistence and 28-day grade-2/3 pathways remain distinct. A random glucose value must not generate a definitive source grade or restart pathway. Suspected DKA causes immediate capivasertib interruption; confirmed DKA causes permanent discontinuation even if the current glucose is lower.

Grade-2 diarrhoea interruption is conditional on clinical need. Grade-2 rash interruption depends on failure to improve, and same-level restart requires clinical tolerability. Recurrent intolerable grade ≥3 rash prompts consideration of permanent stopping; the source does not make that conditional decision automatic. The page-7 grade-3 rash table says “discontinue” after failure to recover within 28 days, while the corresponding diarrhoea table explicitly specifies permanent discontinuation. The encoding preserves this distinction. The general-other-toxicity table supplies no universal 28-day cessation rule; one is not invented.

CYP3A4 inhibitor changes preserve the **actual** previous prescription: 320 mg inhibitor guidance never increases an existing 200 mg twice-daily dose. Stopping an inhibitor requires its 3–5 half-life interval before considering return to the dose taken before the interaction, with intervening toxicity reductions reconciled. Strong/moderate inducers and other relevant substrate/transport interactions need pharmacy review.

Monitoring is unusually important here: fasting glucose weeks 1, 2, 4, 6 and 8, then monthly, preferably pre-dose on a dosing week's day 3 or 4; HbA1c every three months. Diabetes requires daily glucose checks initially and diabetes/prediabetes/baseline hyperglycaemia adds a week-4 HbA1c. Established hyperglycaemia requires checks on both dosing and non-dosing days. The NCCP page-4 reference to Table 5 for glucose modifications is a cross-reference error; the actual glucose table is Table 4 on page 6.

Metformin guidance includes an **unless otherwise clinically indicated** exception. Service material must preserve the individual diabetes plan and must not tell every patient to stop existing diabetes medicines during capivasertib-free days. Creatinine monitoring after metformin initiation is weekly for up to three weeks, then cycle day 1.

NCCP specifies capivasertib contraception for at least four weeks after treatment for females and sixteen weeks for males; fulvestrant requires two years after its last dose. The combination's female contraception advice therefore needs the longer fulvestrant period. Routine steroid/chemotherapy premedication is not added. Oral minimal-to-low emetic risk, early diarrhoea treatment, dermatology-led rash treatment and conditional secondary prophylaxis remain separate support choices.

## Evidence boundaries

In the altered population, primary median PFS was 7.3 versus 3.1 months (HR 0.50, 95% CI 0.38–0.65). Final 2026 OS was **not significantly improved**: medians 28.5 versus 30.4 months, HR 0.83 (95% CI 0.63–1.10), P=.201. The clinical card must not describe OS as immature or promise a survival advantage. Numerical outcomes belong on the clinician evidence surface only. They do not support cross-trial ranking or predict an individual's outcome.

Trial ECOG was 0–1 whereas NCCP permits 0–2. Type 1 diabetes, insulin-requiring Type 2 diabetes and HbA1c >8% were not studied. These are evidence gaps requiring individual review, not newly invented absolute NCCP exclusions.

## Software validation

Proposed file: `proposed/00947-capivasertib-fulvestrant.json`.

- 65 optional inputs; 120 rules, including 18 explicit invalid-select-value guards.
- Strict protocol validator: valid, **zero errors and zero warnings** (`schema-results.json`).
- Independent source-derived scenarios: **229/229 pass**, **120/120 rules exercised** (`proposed-results.json`).
- Cases cover blank/partial inputs, numeric invalid values, invalid enums, exact blood-count/renal/glucose boundaries, independent domains, conditional toxicity decisions, recovery history, permanent-stop history, actual-dose protection, component-specific output and withholding of definitive numerical prescriptions for review/hold findings.
- Production is deliberately not changed by these builders. After integration run `node validation/endocrine-next-v08420/capivasertib/source-cases.cjs --mode integrated`.

The assertions are derived from the source scenarios and call the real assessment and dose-schedule modules. They are not generated from rule conditions. All 120 rules being exercised is coverage evidence, not proof that all possible combinations have been tested or that clinical review has occurred.

The engine currently accepts unknown select strings; without explicit guards, an invalid domain could appear assessed without a restriction. The new protocol handles every select input with a visible unresolved-input review. A shared engine change is outside this bounded task.

## Integration deliverables

- `build-proposed.py`: reproducible source-audited proposed protocol only.
- `source-cases.cjs`: independent checks, `--mode proposed` or `--mode integrated`.
- `service-facts.json`: indication, mechanisms, agent-specific risks, phases, monitoring, supportive care, consent, reproduction and visit logistics.
- `evidence.json`: primary PFS and final-OS evidence with source-access limitations and display boundaries.
- `sources.json`: source versions, hashes and conflict register.
- `schema-results.json`, `proposed-results.json`: completed software-check outputs.

No production protocol, catalogue, shared script, support document, deployment or GitHub content was changed by this audit task. The suite owner should integrate the proposed protocol, build the remaining patient/clinician surfaces, then run integrated regression and visual/document checks.
