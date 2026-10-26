# v0.84.21 retrospective audit: HER2 antibodies, ADCs and tucatinib combination

Checked 25 October 2026. Scope: NCCP00272, 00285, 00776, 00794 and 00936. These are proposals for source-reconciled development content. Independent consultant, oncology-pharmacy and patient/PPI review remains pending; clinical use is not authorised.

## Sources and versions

All five current official NCCP PDFs and five current EMA product-information PDFs were retrieved afresh. Local copies, extracted text, SHA-256 hashes and page counts are recorded in `sources.json` and `sources/`. Current NCCP versions remain 00272 v4, 00285 v4, 00776 v3b, 00794 v3 and 00936 v1. No source version was silently advanced. Trial links are primary reports, with later analyses explicitly distinguished from original analyses.

## Findings and proposed corrections

| Code | Finding | Proposed resolution |
|---|---|---|
| 00272 | Metastatic pathway reused early-disease completion language and mixed SC blood checks with T-DM1 text. | Remove fixed-year completion and irrelevant T-DM1 wording; retain benefit/toxicity-based duration, six-week bloods and twelve-week LVEF. HannaH numbers are clearly labelled early-disease formulation evidence, never metastatic benefit. |
| 00285 | Early SC monitoring contained a metastatic response-imaging prompt; journey reused mixed early/metastatic completion and T-DM1 text. | Early-specific breast surveillance and symptom-led investigations; one year total including prior IV trastuzumab, six-week bloods and twelve-week LVEF. Preserve longer cardiac follow-up after anthracycline exposure. |
| 00776 | Empty patient metric array did not prevent numerical trial outcomes in patient interpretation. HER2-low evidence had newer follow-up. | Qualitative patient evidence; separate clinician DB03 HER2-positive and DB04 HER2-low populations, assessor, cutoff and maturity. Retain current correct ILD, neutropenia, renal and cardiac pathways. |
| 00794 | Patient prose still contained numeric outcomes; final ASCENT report uses the full randomised population, unlike original primary analysis. | Qualitative patient evidence; clinician full-population 2024 final results, expressly distinct from the original no-brain-metastases population. Retain correct Day 1/Day 8 ANC and diarrhoea hold rules. |
| 00936 | Suite and schedule only described IV trastuzumab although NCCP includes locally approved SC; IV reload rule did not capture formulation. No patient longitudinal monitoring grid; original trial values remained. | Add both permitted routes, separate visit/observation/missed-dose advice, explicit monitoring grid and updated HER2CLIMB final evidence. Isolated rule proposal captures formulation, gates IV reload, and prevents a numeric IV suggestion for SC. |

## Source-critical safety review

**Trastuzumab SC, 00272/00285** — NCCP pp1–3: fixed 600 mg every 21 days, no loading dose; alternate thighs, inject over 2–5 minutes, observe 30 minutes after first injection and 15 minutes after later injections. Missed SC dose is rearranged promptly with at least three weeks between administrations. Early total duration is one year, including previous IV doses; metastatic treatment continues until progression or unacceptable toxicity. FBC/renal/LFTs are baseline and every six weeks for trastuzumab alone; LVEF is baseline and twelve-weekly, with earlier investigation for concern. LVEF <50% **and** a fall of ≥10 percentage points triggers hold and repeat after three weeks. Early baseline >55% is not a generic metastatic exclusion. EMA Herceptin cardiac follow-up and formulation guidance supplement the NCCP source; route changes do not reset elapsed-time surveillance.

**T-DXd, 00776** — NCCP pp2–4 and EMA §4.4: suspected ILD requires prompt interruption/investigation; asymptomatic grade 1 requires hold until grade 0. Resolution within 28 days permits the same dose; >28 days requires one-level reduction after complete resolution. Symptomatic grade ≥2 requires permanent discontinuation, with no rechallenge. Specialist-directed corticosteroid treatment is not a patient self-treatment plan. Current code already preserves these distinctions and previous symptomatic-ILD history. FBC/renal/LFTs each 21-day cycle, baseline and twelve-weekly LVEF, symptom review at every contact, and risk-sensitive renal/lung monitoring remain. The NCCP indication remains the anchor despite broader current EMA indications.

**Sacituzumab, 00794** — NCCP pp2–5: Day 1 ANC must be ≥1.5 ×10⁹/L; Day 8 ANC must be ≥1.0 ×10⁹/L. Unknown day between these cutoffs requires review. Grade 3–4 diarrhoea at the scheduled dose requires hold until grade ≤1; assess infection, dehydration and electrolyte losses. Life-threatening infusion reaction requires permanent discontinuation. Glucose/electrolytes/Mg/Ca/phosphate every second cycle and additional checks for losses are distinct from cycle bloods. Current EMA §4.4 supports considering cycle-1 G-CSF in people at increased febrile-neutropenia risk; routine UGT1A1 testing is not required when status is unknown. Existing source conflict over the second severe non-neutropenic dose reduction remains visible rather than being converted to an invented definitive dose. No threshold change is proposed.

**Tucatinib/capecitabine/trastuzumab, 00936** — NCCP pp1–4 explicitly includes IV and locally approved SC trastuzumab. IV 8 mg/kg loading then 6 mg/kg differs from SC 600 mg without loading. IV more than one week late needs its own reloading prescription; SC late doses remain at least three weeks apart and never use IV reloading. The proposal guards this route distinction. Continuous tucatinib must remain distinct from capecitabine Days 1–14 with Days 15–21 off. Complete DPD deficiency excludes capecitabine; partial deficiency requires an individually reduced starting-dose plan and source reconciliation. Renal impairment can distort uracil phenotyping; genotype may help. NCCP renal-dose boundaries and their decimal gap are retained. FBC/renal before cycles and LFTs every three weeks remain; trastuzumab product information supplies baseline cardiac assessment and regular LVEF surveillance where NCCP says clinically indicated. New chest pain, dehydration or severe diarrhoea requires prompt assessment; component rules are not interchangeable.

## Evidence authoring decisions

- HannaH 2019: six-year EFS and OS compare SC versus IV in early breast cancer with chemotherapy. They do not quantify trastuzumab benefit versus no treatment and are not metastatic survival estimates. Numeric clinician endpoints retain that caveat.
- DESTINY-Breast03 2024: the updated investigator-assessed PFS and secondary OS use the November 2023 cutoff. They are distinct from the previously published primary BICR PFS analysis.
- DESTINY-Breast04 2025: later overall-cohort OS and investigator-assessed PFS use March 2023 cutoff and 32-month median follow-up. Do not substitute HR-positive-only results or combine HER2-low with HER2-positive numbers.
- ASCENT 2024: final all-randomised-population results replace the old patient card's mixed original-population figures. The original primary population excluded brain metastases; its results remain a separately labelled source.
- HER2CLIMB 2022: final OS and updated investigator PFS are descriptive after unblinding/permitted crossover. The 2023 corrigendum concerns an author affiliation, not the efficacy results. Modern post-T-DXd sequencing is not automatically established by this trial.

All five patient evidence sections have empty metric arrays and qualitative interpretations. Agent-specific mechanisms, risk lists and body-map warnings were reviewed and retained; 00936 now links each agent to its product information. No trial median is presented as an individual prognosis. No automatic clinical approval is claimed.

## Deliverables and validation

- `authoring.json`: five complete v20-builder-compatible `regimens` entries; new rationale, evidence, monitoring, journeys, selector and support payloads.
- `sources.json`, `sources/`: ten fresh official source PDFs/text with hashes plus primary trial links.
- `proposed/00936-tucatinib-trastuzumab-capecitabine.json`: isolated formulation-safety protocol proposal (filename matches current repository file).
- `proposed-changes.json`: bounded change specification and limitations.
- `source-cases.cjs`, `proposed-results.json`: **71/71 passed**, covering SC cardiac/interval boundaries, T-DXd ILD and ANC boundaries, SG Day 1/Day 8 ANC and diarrhoea, DPD/renal source conditions, IV-versus-SC reload isolation, governance flags, patient evidence and monitoring structure.
- `build-authoring.py`, `propose-route.py`: reproducible proposal generators. These write only inside this audit directory.

The SC 00936 proposal deliberately requires pharmacy verification of its fixed-dose prescription; it suppresses the IV numeric suggestion rather than introducing a generic shared-engine route override. The root integration should run `node validation/breast-completion-v08421/her2-retro/source-cases.cjs integrated` after accepting the proposal. Full application, document-generation, QR and browser checks belong to the root release integration and have not been claimed here.
