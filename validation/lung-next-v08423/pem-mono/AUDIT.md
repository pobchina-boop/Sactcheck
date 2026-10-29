# NCCP 00222 pemetrexed monotherapy · v0.84.23 source and suite audit

Checked 26 October 2026 against the current official lung catalogue, the full NCCP 00222 version 5 PDF, EMA ALIMTA product information and primary trial reports. This is source reconciliation and software testing; independent consultant, oncology-pharmacy and patient/PPI review remain pending. Clinical-use authorisation is false.

## Source verification

The live source remains **version 5**, updated **7 October 2025**, with **5 pages** and review due **7 October 2030**. The official PDF was downloaded fresh, all pages read using extracted text, and the count and renal/hepatic/adverse-event tables on pages 2 and 3 rendered and visually inspected. The binary/text hashes, paths and retrieval information are in `sources.json`. NCIS Medical Oncology antiemetics V8 Table 1, page 4, was also downloaded, rendered and visually inspected. The current EMA product information was retrieved in full; sections 4.2–4.6 and 5.1 were used for support, interactions, pregnancy and evidence context.

## Material clinical changes

1. **Replace the incomplete 15-rule legacy assessment with 32 source-linked rules.** Preserve canonical `nccp-00222-v5`, the original filename, all legacy input keys and all legacy renal options. All 29 inputs remain optional, each has `demo_value`, and omitted data remain unassessed.
2. **Separate the indications.** The prior canonical array had only 00222a with a merged maintenance/second-line description. Both 00222a (maintenance without progression immediately after platinum) and 00222b (second-line) now have explicit entries. Both require NSCLC other than predominantly squamous histology. ECOG source eligibility is 0–2. Additional immunotherapy triggers a scope review instead of allowing this standalone protocol to represent pembrolizumab/pemetrexed maintenance.
3. **Use current counts, not nadirs.** Version 5 explicitly removed nadir wording. ANC 1–<1.5 and platelets 75–<100 require team review and consideration of clinical wellness. ANC 0.5–<1 or platelets 50–<75 delay treatment. ANC <0.5, confirmed FN and platelets <50 require recovery plus dose-reduction discussion. A separate confirmed platelets <50/qualifying bleeding event selects the 50% rather than 25% reduction. A low platelet count with bleeding status missing independently holds and does not assume the lower reduction.
4. **Preserve the actual bleeding grading source.** The page 2 footnote identifies **CTC v2.0, NCI 1998, bleeding ≥grade 2**. The combined event input requires both low platelets and qualifying bleeding to be clinically confirmed. The Table 3 toxicity grading edition is otherwise unspecified: the old generic CTCAE 5 descriptions have been removed, and named-event grading is explicitly not a complete grading table. No conversion from CTC v2 or unspecified source grading to CTCAE 5 is inferred.
5. **Add an exact verified CrCl input and retain legacy bands.** Below 45 mL/min is excluded; at 45 and above the NCCP renal table gives no adjustment. Haemodialysis and severe hepatic impairment are not recommended. Mild/moderate hepatic impairment has no expected adjustment. The NCCP table supplies no numerical definition of severe hepatic dysfunction, so no invented bilirubin/ALT/AST cutoff is used. The exact CrCl metadata is `source_threshold_numeric`. A reassuring field does not erase a separate entered contraindicating renal band.
6. **Complete source-specific adverse-event pathways.** Grade ≥3 diarrhoea or any diarrhoea requiring hospitalisation: hold to at/below pre-therapy baseline, then 75% of previous pemetrexed dose. Grade ≥3 mucositis: hold to baseline then 50%. First grade 2 neurotoxicity: hold to baseline then 100% pemetrexed; no platinum reduction belongs to this monotherapy. Grade ≥3 or any recurrence of neurotoxicity: discontinue. Other grade ≥3 toxicity: immediate hold even if reduction history is missing; restart guidance at 75% requires history. Grade ≥3 after two reductions is a consideration of discontinuation, not an automatic permanent stop. Severe allergy remains a clinician decision.
7. **Correct pregnancy provenance.** Breastfeeding is an NCCP exclusion. The old combined pregnancy/breastfeeding absolute exclusion misrepresented 00222: the EMA SmPC says avoid pregnancy use unless clearly necessary following maternal/fetal risk assessment. The preserved pregnancy input now holds pending specialist necessity/risk review and cites SmPC 4.6. It does not manufacture an absolute NCCP exclusion.
8. **Keep support appropriate to pemetrexed alone.** Low-risk antiemetics use the NCIS V8 low-risk reference: ondansetron 8 mg orally on the treatment day; metoclopramide 10 mg orally three times daily as required on subsequent days, with suitability and duration specified by the prescriber. No platinum NK1/olanzapine or delayed dexamethasone course is carried across automatically. Folic acid 350–1000 micrograms daily, B12 1000 micrograms IM and rash-prevention dexamethasone-equivalent 4 mg twice daily retain their exact NCCP timing. The support draft includes only one steroid entry and requires reconciliation.
9. **Add renal/NSAID interaction review without automated medicine-stop decisions.** EMA SmPC 4.5 gives avoidance windows at CrCl 45–79 for NSAIDs/high-dose aspirin and longer windows for long-half-life NSAIDs; necessary coadministration requires close marrow/GI monitoring. High NSAID/aspirin doses also need caution at normal renal function. The rule requires medicine/dose/timing/renal review, rather than rounding the printed renal ranges or making an autonomous medication change.

All modification percentages are source guidance conditional on recovery and a confirmed previous-dose/Consultant plan. No unsupported absolute dose is calculated. Generic fever/active-infection withholding is explicitly labelled as clinical safety synthesis and does not by itself manufacture confirmed FN or its numeric reduction.

## Comparison with v0.84.22 pemetrexed/platinum suites

The 00317/00318 schema, partial-input hold patterns and suite types were used as implementation references. Their clinical content was not blindly copied. This protocol has one anti-cancer drug, no platinum renal bands, no platinum baseline hearing/neuropathy exclusions, no high emetic risk, no cisplatin hydration, no mesothelioma or neoadjuvant indication, no fixed platinum-cycle cap and no separate platinum neurotoxicity reduction. Folate, B12 and pemetrexed rash prevention continue across a phase change after reconciliation of the existing schedule.

## Evidence distinctions

- **JMEN (Ciuleanu 2009):** switch maintenance after four non-pemetrexed platinum-doublet cycles without progression. The displayed whole-trial OS result is 13.4 versus 10.6 months in 663 randomised patients, measured from maintenance randomisation. It includes squamous histology and is explicitly not labelled as the non-squamous subgroup. The SmPC separately describes the non-squamous subgroup and confirms the induction regimen; these population/time-origin differences are not merged. The primary report's investigator PFS and SmPC independent-review PFS have different populations/values; no mixed or unlabeled numeric PFS is displayed.
- **PARAMOUNT final OS (Paz-Ares 2013):** continuation maintenance after four pemetrexed/cisplatin induction cycles. Of 939 induction patients, 539 non-progressing patients with ECOG 0–1 were randomised. Displayed OS 13.9 versus 11.0 months starts at maintenance randomisation, not the first induction dose. NCCP ECOG 0–2 eligibility is broader than this trial population.
- **Hanna 2004:** historical second-line, all-histology advanced NSCLC after one prior chemotherapy regimen, 571 patients. Median OS 8.3 versus 7.9 months against docetaxel was not statistically different. The card does not claim a proven survival gain, modern non-squamous subgroup benefit or pembrolizumab combination benefit. The 2023 republication surfaced in search but was not misrepresented as a new trial.

Clinician numerical endpoints retain trial, setting, comparator, population and time origin. Patient `evidence.metrics` is empty; patient evidence is qualitative. All three historical trials predate current immune/molecular treatment pathways and do not rank contemporary alternatives or predict individual survival.

## Full service authoring

`authoring.json` supplies one complete `{regimens:{'00222':...}}` entry with patient medicine explanation and risks, six chapter sections, twelve `{q,a}` questions, a six-region body map, consent prompts, relative cycle timeline, practical support, vitamins/steroids/antiemetics, five date-free longitudinal journey lanes, clinical selection/monitoring/rationale and three contextual clinical evidence endpoints. The lung selector is enabled and breast selector excluded. One low-risk support plan includes five medicines. The passport explicitly states that recording-page count is not a fixed treatment duration.

Baseline FBC/renal/liver tests and repeat tests before each cycle are distinct. Scans follow the Consultant plan without an invented interval. Symptoms remain actionable between visits and after the final dose; folate continues 21 days after the final pemetrexed. Pemetrexed/pembrolizumab maintenance and its immune monitoring remain explicitly separate.

## Remaining clinical interpretation

- Haematological reduction rows say reduce by a percentage without declaring an original versus previous dose basis; obtain the Consultant plan and history rather than outputting an absolute dose.
- The printed allergy row reads `Grade 3 ≥`; interpreting this as grade ≥3 is stated in the rule and requires independent review.
- The row after the individual adverse events says grade ≥3 toxicity after two reductions: consider discontinuation. It is surfaced as a discussion alongside, not in place of, the individual immediate hold/stop rules.
- Severe hepatic impairment is a source category without numeric thresholds. The SmPC baseline chemistry values are not silently substituted into the NCCP category.
- NSAID windows remain conditional reference advice. The printed SmPC integer renal groups are not used to autonomously classify decimal boundaries or prescribe drug interruptions.
- This source audit and testing do not establish clinical suitability or independent approval.

## Verification and integration

`node validation/lung-next-v08423/pem-mono/source-cases.cjs` passes **131/131** checks against the real assessment engine, dose-modification model and strict schema validator. The strict validator reports **zero errors and zero warnings**. Cases cover exact count and renal seams, positive/negative flags, missing values, independent holds, recurrence and reduction-history uncertainty, conflicting renal entries, preservation of every legacy renal option, simultaneous restrictive domains, supportive-care scope, source grading, trial labels, authoring types/source IDs and approval flags.

The proposed canonical file is `proposed/00222-pemetrexed-monotherapy.json`; copy it to `protocols/lung/00222-pemetrexed-monotherapy.json`. Merge the authoring entry into the v0.84.23 authoring file, regenerate the legacy 00222 service suite and run:

```sh
node validation/lung-next-v08423/pem-mono/source-cases.cjs --integrated
```

The integrated mode uses the live canonical JSON and writes `integrated-results.json`. Root owns shared builders, the global regression pass, rendered patient/PDF/QR checks, preview testing, release packaging and approval status updates. No live/shared files, releases, commits, pushes or deployments were performed by this bounded task.
