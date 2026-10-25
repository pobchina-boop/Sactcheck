# Tamoxifen and fulvestrant retrospective source audit — v0.84.20

Checked 25 October 2026. This is a bounded audit proposal for NCCP **00253 tamoxifen v6** and **00361 fulvestrant v4**. Production integration belongs to the release owner. Stable protocol IDs remain `nccp-00253-vcurrent` and `nccp-00361-vcurrent`; explicit version metadata remains v6/v4. Independent clinical and oncology pharmacy review and clinical-use authorization remain false.

## Evidence and provenance

The current official NCCP PDFs and current Irish HPRA/EMA product PDFs were retrieved publicly, extracted with `pdftotext -layout`, and retained as research working files. The page 2 organ-function tables for both NCCP documents were rendered and visually checked. `sources.json` records the exact URLs, byte lengths, SHA-256 hashes and retrieval limitations. The public HSE files downloaded successfully with an ordinary browser User-Agent; no authenticated access was needed.

The February 2026 Rowex SmPC URL printed in NCCP no longer resolved. The current Irish Tamox SmPC dated **30 June 2026** was located from the official HPRA product page, downloaded and read. It supplements NCCP without silently replacing the NCCP indication or exclusion list. The Irish Viatris SmPC dated **19 May 2026** supplies detailed VTE and perioperative risk guidance. UK product wording is used only as a labelled comparison.

## Findings carried into the proposed rules

| Finding | Source distinction | Proposal |
|---|---|---|
| Tamoxifen eye and blood monitoring | NCCP uses clinically indicated later eye/LFT/INR/ECG testing. Current Irish Rowex additionally recommends baseline ophthalmology and regular FBC including platelets, LFT and calcium, without a fixed interval. | Preserve both with explicit attribution; add no invented monthly blood or echo schedule. |
| Concurrent anastrozole | Irish Rowex reports no added efficacy from an adjuvant AI combination; some UK products list a contraindication. | Medication reconciliation and blocked numeric recommendation; preserve sequential switching as a separate situation. |
| Tamoxifen QT/electrolyte risks | Irish Rowex supports risk-triggered ECG/electrolytes. The fixed repeat at steady state after at least four weeks is product-specific UK wording. | Risk/symptom review, severity-sensitive electrolyte action and no universal four-week test or invented QTc dose ladder. |
| Additional tamoxifen product cautions | Severe cytopenias, hypercalcaemia, hereditary angioedema, oestrogen preparations and platelet-aggregation inhibitors are explicitly addressed by Irish Rowex. | Independent review inputs with no automatic numerical dose. Essential antiplatelets must not be stopped without agreement. |
| Tolerability and lipids | Low-grade symptoms can still impair adherence; pre-existing hyperlipidaemia can worsen. | Add independent intolerable-toxicity and hyperlipidaemia review pathways without a cytotoxic grade-based reduction ladder. |
| Fulvestrant Child-Pugh B | NCCP specifies 250 mg/50% of original dose. Current EMA describes no dose adjustment for mild/moderate impairment, with caution. | Display the conflict and block a definitive numeric dose until consultant/pharmacy reconciliation. |
| Fulvestrant existing modified dose | A renal no-adjustment result must not restore a prior reduced prescription. | New current-dose input; any nonstandard current dose requires reconciliation and blocks automatic reset to 500 mg. |
| Fulvestrant combination scope | NCCP00361 is monotherapy; capivasertib/fulvestrant00947 and CDK4/6 combinations have additional eligibility, interactions and monitoring. | New companion-medicine review input; route the intended combination to its full regimen. |

The existing significant-VTE-history NCCP tamoxifen exclusion remains visible. Acute or suspected VTE, severe hepatic impairment and severe skin reactions retain source-specific actions. Perioperative interruption remains an individualized risk–benefit decision; no universal stop interval is imposed. Coumarin anticoagulation in breast-cancer treatment requires review/INR monitoring and is not silently given the prevention contraindication.

The fulvestrant proposal retains exact prior **adjuvant** anti-oestrogen relapse/progression wording, postmenopausal eligibility, ECOG 0–2, Day 1/15 loading then Day 1 every 28 days, two slow 5 mL IM injections at the usual 500 mg dose, renal caution below CrCl 30/dialysis, IM bleeding/anticoagulation caution, neuropathic injection symptoms, and oestradiol immunoassay interference. No arbitrary platelet threshold, anticoagulant stop, cytotoxic count ladder, DPD test, cycle ECG/echo or routine G-CSF is introduced. Severe hepatic impairment remains excluded. Critical visceral disease is a specialist caution, not a rule that every visceral metastasis excludes treatment.

## Patient and service corrections

`service-facts.json` supplies complete replacement values in `patient_updates[code]`, keyed to the existing patient JSON structure. It also provides detailed clinician mechanism/rationale and exact source differences.

- Tamoxifen mechanism now explains ER modulation, active endoxifen formation and the reason for medicine review. Bone effects distinguish pre- and postmenopausal settings. Monitoring separates NCCP from the current Irish product supplement. Daily adherence, symptom support, surgery planning and no self-directed withdrawal of essential interacting medicines are retained.
- Fulvestrant mechanism explains ER antagonism/degradation and loading/depot exposure. The timeline explicitly remains Days 1, 15, 29, 57 and then every 28 days. Injection/bleeding/nerve advice, lab-assay interference and the separate capivasertib combination are linked to practical appointments and questions.
- Female contraception counselling remains tamoxifen during treatment plus nine months afterward and fulvestrant during treatment plus two years afterward. Pregnancy/breastfeeding exclusions remain explicit. The male tamoxifen product advice is recorded only as a source fact and does not broaden this NCCP women's pathway.
- **Important baseline defect:** numerical trial outcomes were still present in both patient `evidence` and `evidence-context` prose even though `metrics` was empty. Replace both complete values using the supplied updates. All patient benefit statements are now qualitative.
- Existing setting-specific surveillance references are preserved from the prior audit. This retrospective audit does not claim to have newly reverified every inherited guideline, nor does it attribute their intervals to NCCP.

## Clinician evidence

`evidence.json` supplies renderer-compatible `profiles[code].treatment_rationale` and `evidence_at_a_glance`, plus exact endpoint/population records in `studies`.

Tamoxifen includes EBCTCG initial adjuvant treatment, ATLAS extended treatment, and separately labelled aTTom meeting-abstract context. Recurrence and breast-cancer mortality are not relabelled DFS/OS. ATLAS benefit and safety populations differ. The overall aTTom mortality comparison reported in the abstract was not statistically significant; pooled or later-period results must not silently replace it. No numerical endometrial-risk confidence interval was reused from the apparently internally inconsistent aTTom abstract.

Fulvestrant keeps CONFIRM's historical dose comparison and nominal final OS testing separate from FALCON's endocrine-naive comparison. FALCON primary PFS improved, but its final OS analysis did **not** show a significant survival advantage. The nonvisceral OS subgroup was also not significant. Neither study supplies a capivasertib/fulvestrant estimate or broadens NCCP00361's mapped indication. Unverified legacy wording about the contents of an erratum was removed.

The current evidence renderer has no dedicated recurrence or breast-cancer-mortality endpoint keys. Those tamoxifen results are preserved as clearly labelled clinician narrative and exact study records; the displayed OS card uses actual ATLAS all-cause mortality. This avoids mislabelling a cause-specific endpoint to fit the UI.

## Verification

`source-cases.cjs` derives expected scenarios from NCCP/HPRA/EMA source claims, uses the actual assessment engine and dose-modification model, and runs against real frozen baseline, proposed or integrated files.

| Mode | Passed | Total | Meaning |
|---|---:|---:|---|
| Frozen baseline | 146 | 170 | 24 expected failures identify absent new pathways and the source-attribution/action differences. |
| Proposed | 170 | 170 | All source scenarios pass, including independent partial inputs and blocked numeric output for unresolved review. |
| Artifact checks | 50 | 50 | Patient numeric-trial separation, source references, timetable and key warnings verified. |

Commands from repository root:

```sh
node validation/endocrine-next-v08420/tam-fulv/source-cases.cjs --mode baseline
node validation/endocrine-next-v08420/tam-fulv/source-cases.cjs --mode proposed
node validation/endocrine-next-v08420/tam-fulv/source-cases.cjs --mode integrated
python validation/endocrine-next-v08420/tam-fulv/verify-artifacts.py
```

Baseline intentionally exits nonzero for the identified gaps. `integrated` must be run after the release owner copies the proposals into production. Software passing is not independent clinical/pharmacy authorization. Full-service PDFs, browser interaction and wider regression are the release owner's integration checks.
