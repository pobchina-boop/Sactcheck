# NCCP00353 osimertinib monotherapy: v0.84.24 source audit

Checked 29 October 2026. **45 optional inputs, 40 source-referenced rules; 273/273 real-engine cases pass.** Strict protocol validation passes with no warnings. All independent clinical, oncology-pharmacy and clinical-use approvals remain false.

## Source reconciliation

The current [HSE lung catalogue](https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/lung-sact-regimens/) was opened and its osimertinib link followed. It still points to **NCCP00353 v5, 1 March 2024**, review 1 March 2029, six pages. No NCCP version change was found. The historical hse.ie PDF URL is still indexed but returns 404 directly; the live healthservice.hse.ie document is used. The current catalogue lists exactly 00353a/b/c.

The [EMA EPAR](https://www.ema.europa.eu/en/medicines/human/EPAR/tagrisso) reports a product-information update of **18 August 2026**. Its live PDF was downloaded; section 10 itself does not print a revision date. NCCP Tables 1–2 (pages 3–4), EMA dose/organ tables (pages 4–5), and oral antiemetic Table 5 (NCCP V6, page 8) were rendered and visually inspected. Original PDFs, text snapshots, rendered inspection pages and SHA256 hashes are in this directory and `sources.json`.

## Material clinical corrections

- **Indications and duration:** replace the conflated 00353a entry with a T790M-positive advanced indication, b first-line activating-EGFR advanced indication, and c completely resected stage IB–IIIA Ex19del/L858R adjuvant indication. Daily oral treatment has no chemotherapy cycle or rest week. Adjuvant treatment beyond three years was not studied; advanced therapy continues to progression or unacceptable toxicity. Card contexts preserve these differences.
- **Eligibility:** NCCP ECOG is 0–1, not the previous rule’s 0–2. Add indication-appropriate mutation confirmation and adjuvant stage/resection, exclusions and timing. Without chemotherapy, start within 10 weeks of complete resection; with adjuvant chemotherapy, finish at most four platinum-doublet cycles and start 2–10 weeks after the last dose. Boundaries 2 and 10 are included. Prior neoadjuvant chemotherapy, neoadjuvant/adjuvant radiation or EGFR inhibitor treatment are source adjuvant exclusions.
- **Lung toxicity:** suspected ILD or an entered positive pneumonitis grade interrupts pending diagnosis. Confirmed ILD/pneumonitis permanently stops under NCCP even at grade 1. The old grade ≥2 permanent-stop rule confused suspicion and diagnosis and missed confirmed grade 1 disease.
- **Heart rhythm:** add the omitted >500 ms on at least two separate ECGs pathway. Hold until QTc is strictly <481 ms, or until baseline recovery when baseline is ≥481 ms. The source restart is 40 mg once daily, after authorisation. QTc prolongation with serious arrhythmia permanently stops. A single >500 ms reading prompts urgent assessment/confirmation without inventing the two-ECG criterion. Baseline >470 ms is a trial exclusion/caution, not the treatment threshold. Exactly 500 does not meet >500; exactly 481 does not meet <481.
- **Cardiac function:** preserve the legacy `lvef_change` input, but change the unsupported generic automatic hold to prompt cardiac/LVEF review. These NCCP/EMA monotherapy sources do not specify an automatic LVEF percentage reduction or universal numerical discontinuation threshold. The observed ≥10-point decline to <50% in EMA safety data is not converted into a dosing rule.
- **Skin and marrow syndromes:** add suspected versus confirmed SJS/TEN and aplastic anaemia pathways. Suspected SJS/TEN interrupts; confirmed SJS/TEN and confirmed aplastic anaemia permanently stop. Suspected aplastic anaemia prompts urgent assessment and consideration of interruption/discontinuation, preserving the source’s conditional wording.
- **Other adverse reactions:** grade ≥3 holds for up to three weeks. Recovery to grade 0–2 within 21 days permits Consultant choice of 80 mg or 40 mg, not an automatic reduction. Failure to recover at three weeks permanently stops. Recovery after the source window remains specialist review. Current severe toxicity cannot be erased by a discordant recovery flag.
- **Liver interpretation:** remove the unsupported generic ALT/AST >5 × ULN automatic hold. Preserve both lab aliases as contextual review inputs; isolated results do not establish severe hepatic impairment, drug-induced hepatitis or a CTCAE grade.
- **Interactions and eyes:** add St John’s wort contraindication, strong-inducer review without automatic dose escalation, QT medicine/electrolyte review and prompt ophthalmology referral for possible keratitis.
- **Other source cautions:** retain prior ILD/steroid-treated radiation pneumonitis and close monitoring for age >65 or weight <50 kg in clinical/canonical caution text. They are not invented automatic dose reductions.

## Explicit source conflicts and uncertainties

1. **Severe liver impairment:** NCCP Table 1 allows consideration of 50% of the original dose; current EMA 4.2 says use is not recommended because safety/efficacy are unestablished. Legacy rule `OF590_00353_OSI_HEP_SEV` is retained by ID but now requests Consultant/pharmacy review with `dose_calculation: specialist_review`. It does not calculate half-dose.
2. **Renal/dialysis:** NCCP expects no adjustment at any renal grade or haemodialysis. EMA says safety/efficacy are unestablished below Cockcroft–Gault CrCl 15 mL/min or on dialysis and urges caution in severe/end-stage impairment. A numeric source-threshold field and preserved dialysis alias expose this evidence gap without borrowing another TKI’s dose reduction. Exactly 15 is outside the <15 evidence-gap rule; separately assessed severe impairment still prompts caution.
3. **Grading edition:** NCCP Table 2 names CTCAE v4.0; EMA’s current table names v5.0. This NCCP module retains v4.0, with NCI v4.03 descriptors and explicit metadata explaining the difference. The old silent CTCAE5 labelling is removed. Rash/diarrhoea/pneumonitis grades are not inferred from a single laboratory result.
4. **ILD rechallenge:** NCCP permanently stops diagnosed ILD. EMA Table 1 also says permanent discontinuation, while section 4.4 mentions exceptional individual benefit/risk consideration of reintroduction. The module does not authorise rechallenge.
5. **Missed-dose boundary:** NCCP and leaflet say skip if less than 12 hours until the next dose; EMA 4.2 says “within 12 hours.” Patient text follows NCCP/leaflet and asks pharmacy to confirm the exact 12-hour boundary. Neither source gives a dedicated vomited-dose algorithm; the guide asks for advice before an extra dose rather than inventing one.
6. **Monitoring cadence:** NCCP ECG at baseline and “cycle 2,” then cycle 3+ if indicated, is preserved as a review label. No unsupported 21/28-day cycle or fixed scan cadence is created. Local services must book the actual early ECG review.

The real dose renderer displays **Withhold now / No dose now** for the QTc pathway. Although the source’s future 40 mg instruction is retained, it is not emitted as an independently calculable restart. This remains conservative when QTc, severe liver and dialysis limitations coexist; no dose fractions multiply and independent adverse findings survive.

## Evidence and licence boundaries

Current EMA indications include post-platinum-chemoradiation unresectable NSCLC (LAURA) and osimertinib with platinum/pemetrexed (FLAURA2). Neither is silently added to NCCP00353 v5 or assigned its evidence/support plan.

Clinician evidence has five labelled records, all timed from randomisation: ADAURA five-year OS in overall IB–IIIA (88% versus 78%) and II–IIIA (85% versus 73%), cutoff 27 January 2023; FLAURA final median OS (38.6 versus 31.8 months), cutoff 25 June 2019; AURA3 primary PFS (10.1 versus 4.4 months), cutoff 15 April 2016; and AURA3 final OS (26.8 versus 22.5 months), cutoff 15 March 2019. Exact primary-source URLs, populations, comparators, HR confidence intervals and limitations appear in authoring. AURA3 OS was not statistically significant, and extensive crossover complicates interpretation. Adjuvant stage subsets are not merged. These studies do not rank modern combinations head to head or establish individual prognosis. Patient metrics remain empty; patient evidence is qualitative.

## Suite and consent authoring

`authoring.json` supplies complete targeted patient chapters, agent mechanism/risks, anatomy, tablet logistics, qualitative evidence, consent aid, passport context, clinical knowledge, relative monitoring journey, selector, three card contexts and oral supportive-care plan. Source IDs resolve. Continuous-oral fields have `cycle_days: null`; no patient dates are requested.

Current NCCP V6 Table 8 places osimertinib in oral minimal-low risk; Table 5 supports as-required antiemetics. NCIS V8 is checked separately and describes parenteral schedules. The support plan has only osimertinib active and no copied cytotoxic prophylaxis prescription; any rescue drug requires local QT/interaction/renal review. Skin care, diarrhoea support, adherence, contraception and urgent symptoms are included.

`proposed/osimertinib-consent-profile.json` updates the consent generator’s existing osimertinib profile. It removes the unsupported generic “rare” ILD description and adds serious skin/marrow effects, eyes, reproductive precautions and interactions without unsupported incidence percentages. Source reconciliation and independent approval remain separate.

## Verification and integration

Run from checkout:

```sh
node validation/targeted-lung-v08424/osimertinib/source-cases.cjs
node validation/targeted-lung-v08424/osimertinib/source-cases.cjs --integrated
```

Proposed mode: **273 passed, 0 failed** in `source-results.json`, using the actual assessment engine and dose renderer. Includes all blank inputs, source thresholds, negative controls, contextual omissions, concurrent limitations, independent discordant aliases, indication/timing/route checks, source-resolved authoring and consent coverage. The legacy renal select’s `decision_value` conversion is explicitly honoured: UI value `dialysis` normalises to numeric 1, and the source rule is tested through that real engine path.

Canonical integration, service build, consent-generator integration, browser interaction tests and generated-PDF inspection belong to the root workflow. No canonical/shared files were edited by this agent. The proposal is not independent clinical, pharmacy or patient/PPI approval. For deterministic local reproduction run `build-authoring.py` then `finalise-authoring.py`; source PDFs/text must already exist. The finaliser is idempotent.
