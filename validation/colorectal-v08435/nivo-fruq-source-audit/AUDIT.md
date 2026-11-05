# Nivolumab/ipilimumab and fruquintinib current-source audit — v0.84.35

Audit completed against freshly retrieved official sources on 5 November 2026. This is a software/source reconciliation, not independent consultant/pharmacy approval. It does not authorise clinical use.

## Evidence and source changes

| Protocol | Current source | Version amendment | Printed review date | Findings |
|---|---|---|---|---|
| 00551 | NCCP v7a, 13 pages | 20 August 2026 | 11 February 2027 | Old URL returned 404; current catalogue URL retrieved. CRC first maintenance interval corrected to 3 weeks in this source version. CRC code is **00551c**, despite the app's stable legacy ID00551a. |
| 00900 | NCCP v1a, 11 pages | 1 October 2025 | 23 April 2026 | Current official retrieval still v1a; its printed review date has passed. That is recorded, not silently described as a new source issue. |
| 00890 | NCCP v2a, 6 physical pages | 15 July 2026 | 30 July 2030 | Old URL returned 404. New hypertension complication section includes BP weekly in month1, then monthly/as indicated. Source footer incorrectly reports “6 of5”; physical page number retained. |
| Fruzaqla | Current EMA product-information PDF | Issue date not printed in retrieved content | — | Sections4.2–4.6 supplement specific safety and interaction obligations; all supplementary rules identify EMA provenance. |

`sources.json` contains exact URLs, dates and SHA-256 hashes. Original PDFs, extracted text and original protocol snapshots are retained. Selected source table pages were rasterised and visually inspected: 00551 pages3,8,10; 00900 page6; 00890 pages3–4. Tables were also reconciled against full extracted source text, including preceding/following pages and footnotes.

## Substantive corrections

1. **Treatment contexts and phases:** 00551's colorectal maintenance permits240mg IV every14days,600mg SC every14days or1200mg SC every28days;480mg IV every28days is explicitly limited to RCC/melanoma. CRC's first maintenance dose is3weeks after combination, including the4weeklySC schedule. RCC/melanoma retain their separate3/6week transition rules. 00900 is a distinct first-line flat-dose combination, IV maintenance only, up to24months. Both combinations stop at4cycles before maintenance. No source interchangeability is assumed.
2. **Source-specific immune decisions:** pneumonitis, colitis, hepatitis, nephritis, endocrine, rash, myocarditis, other immune injury, steroid-refractory injury and recurrence now have separate source actions. Grade3colitis permanently stops treatment even during post-combination nivolumab. Thyroid/pituitary symptoms and stable hormone replacement are distinguished; adrenal and diabetes grades retain their different boundaries. Both components are held during the combination phase when either is held.
3. **Source-grade fidelity:** the NCCP combination sources explicitly specify CTCAEv4. Existing global descriptor sets otherwise usev5. The established source-specific descriptor bypass now points to the NCCPv4 source rather than falsely relabellingv5 descriptors. Clinicians must confirm the source grade; isolated endocrine, creatinine and liver numbers remain available as contextual inputs/review and are not asserted to be numeric NCCP hold/stop thresholds. Baseline abnormalities and cause must be considered.
4. **Organ impairment is not copied between protocols:** 00551 has caution/not-studied language for moderate/severe liver and severe renal impairment;00900's separate Giraud-derived table gives no adjustment/none-expected language. Review messages preserve those differences and do not calculate unsupported reductions. Fruquintinib's renal/mild-to-moderate hepatic policies are separate from treatment-emergent injury; severe hepatic impairment is excluded.
5. **Fruquintinib is not a regorafenib template:** the5→4→3mg floor, persistent toxicity at3mg, inclusive≥2g/24h protein hold and strict<1g/24h recovery, bleeding recovery, grade2PPES same-dose versusgrade3reduced restart, and paired ALT/AST>3×ULN plus bilirubin>2×ULN **without cholestasis** are explicit. Grade4“other” toxicity is discontinued, with the source's conditional consultant restart exception preserved. No2mg dose, blanket fistula stop or regorafenib escalation scheme is imported.
6. **Missing data and ambiguity:** omitted endocrine symptoms, recovery/authorisation and relevant quantitative urine results do not become reassuring assumptions. Exact12hours for a missed fruquintinib dose remains unspecified in bothNCCP andEMA; the tool asks for the prescription/pharmacy plan. Numeric BP requires clinical grade/control rather than an invented source dose cutoff. The published00551 general switching paragraph mentions480mgIV, but its CRC paragraph and table footnote exclude that option; the tool surfaces the discrepancy.
7. **Support and monitoring:** combination emetogenic risk corrected tolow with minimal-risk nivolumab maintenance separately identified; valid existing low-risk script mapping used. Baseline/serial tests,≥5months immune follow-up, fruquintinib BP/TFT/urine and conditional warfarin-INR monitoring were reconciled and passed to patient/KB/support owners.

`criterion-matrix.json` records each audited source section, executable coverage and remaining manual obligations. Source steroid doses, preparation, infusion equipment/observation, interactions and recovery management require a prescribed clinician/pharmacy plan; absence of an automatic calculator is explicit. HCC-specific hepatitis rows appearing in00551 are not imported into a CRC rule.

## Actual-engine validation

Command:

```sh
node validation/colorectal-v08435/nivo-fruq-source-audit/source-cases.cjs
```

**599/599 assertions passed.** All203 audited rules were exercised:79 for00551,69 for00900 and55 for00890; none unexercised. Tests use the production assessment engine and dose-modification model. Expected clinical actions come from independently authored source tables/cases, not generated predicates. They include strict/inclusive boundaries; stage/context isolation; source grades; symptom/recovery/recurrence/dose-floor conditions; missing/null/invalid values; permanent-stop precedence; component scope; absence of invented dose percentages; and verification that the legacy runtime reconciliation does not mutate these new rules.

The identical599 contracts run on the retained original JSON give302passes/297failures. This is a before/after software contract comparison, **not297distinct clinical defects**: it includes new fields, source provenance, naming, metadata and clinically missing paths. Original rule counts were14/14/15. New rule counts alone are not an assertion of clinical completeness.

`node tests/protocol-validator.test.js` also passes (382 publishing assertions). Full-release browser, PDF, QR, security and broad regression checks are owned by the parent release workflow. The current source reconciliation is not evidence of live deployment, physical printing, real camera scanning or iPhone/Android installation.

## Handoff and limits

Confirmed schedule/source/monitoring/toxicity distinctions were sent to the new patient-profile owner and to the clinician KB/support owner. Their current three-regimen entries were reviewed; final clinician KB now includes ECOG, CTCAE, colitis/endocrine, organ-function and fruquintinib distinctions. The support owner corrected00551 supportive-care page references to11.

These3clinical JSONs preserve stable protocol IDs and existing shared-regimen contexts. CRC's misleading stable indication ID is not migrated silently: the correct NCCP code is stored alongside it and the clinician selector names the context. Main/shared runtime/other protocols were not edited by this audit. Final release counts/assets/ZIP are managed by the parent. Independent consultant, oncology-pharmacy and patient/PPI review remain pending.

## Retained platform regression migration

The final integration check also passed both `tests/library-wide-organ-function-reconciliation-v0590.test.js` and `tests/nccp-antiemetic-guidance-v0631.test.js`. Their expected results were updated only for the source-audited migration:

- `validation/colorectal-v08435/organ-function-migrations.json` identifies the five retrospective protocols plus00890 by current source URL/version, retained source-PDF hash, original-JSON hash and required replacement rule IDs. The paired organ auditor checks the same evidence. The historical74-protocol register remains unchanged. Exactly four obsolete00890 `OF590_` rules are replaced; the retained total moves from207 to203, with all remaining rules still exercised.
- The antiemetic fixture pins the exact00551v7a and00900v1a PDFs and verifies low-risk combination support, minimal-risk nivolumab continuation, the existing low-risk script ID and current metadata. Other classification expectations remain intact.

The ordinary organ test regenerates its JSON/CSV/Markdown audit reports; those intended report updates are included in the parent integration scope. No clinical protocol edits were made as part of these two fixture migrations.
