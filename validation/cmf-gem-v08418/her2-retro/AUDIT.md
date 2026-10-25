# HER2 retrospective source audit · v0.84.18

Checked 25 October 2026 against the official NCCP documents below and baseline commit `e6bd944ac3132d517959aa9c227d6bac74a6a9b7` (v0.84.17). Production files were not edited by this audit. Review copies are under `proposed/`; parent integration and full-service regression are separate steps. Independent consultant, oncology-pharmacy and patient review remain pending.

## Sources and scope

| NCCP code | Current source | Pages | Scope |
|---|---|---:|---|
| 00316 | [v6](https://healthservice.hse.ie/documents/6717/316_v6_Dose_Dense_AC-TH.pdf) | 7 | Dose-dense AC → fortnightly paclitaxel plus weekly trastuzumab |
| 00433 | [v6](https://healthservice.hse.ie/documents/6471/433_v6_Dose_Dense_AC-TH_Weekly.pdf) | 8 | Dose-dense AC → weekly paclitaxel plus weekly trastuzumab |
| 00745 | [v2a](https://healthservice.hse.ie/documents/6624/745_v2a_DDAC_TH_21_day.pdf) | 8 | Dose-dense AC → weekly paclitaxel plus q21-day trastuzumab |
| 00512 | [v5](https://healthservice.hse.ie/documents/6515/512_v5_PACLitaxel_Trastuzumab_Weekly.pdf) | 6 | Lower-risk adjuvant weekly paclitaxel plus weekly trastuzumab |
| 00815 | [v3](https://healthservice.hse.ie/documents/6427/815_v3_Paclitaxel_weekly_Trastuzumab_3weekly.pdf) | 8 | Lower-risk adjuvant weekly paclitaxel plus q21-day IV or locally approved SC trastuzumab |

`source-provenance.json` records exact URLs, retrieval date, versions, page counts, byte counts and SHA-256 hashes. `source-matrix.json` records source-specific indications, schedules, monitoring and decision-table distinctions. Downloaded source PDFs/text remain in the research directory recorded in that provenance file.

## Corrections proposed

The largest gap was 00815, whose 26-rule baseline becomes 48 rules. It previously flagged ECOG 2 outside eligibility despite NCCP allowing 0–2; lacked the baseline ANC <1.5 exclusion and explicit HER2/indication, severe liver, significant cardiac disease, cardiac-monitoring and active-reaction pathways; and treated hepatic dose bands as fixed 60/40 mg/m² rather than percentages of the original prescribed dose. The proposal adds these pathways, missing-phase handling for isolated bilirubin or toxicity, and explicit interpretation of incomplete LVEF information.

For all five, baseline and ongoing assessment are distinct. A historical baseline LVEF below 50% no longer automatically contraindicates ongoing treatment when a current result is satisfactory. Explicit baseline assessment still enforces eligibility. Missing stage or a missing current value after a previously abnormal baseline requires review. Current LVEF/change/symptom rules remain separate. ANC 1–<1.5 with missing stage now prompts clarification because initiation and ongoing count thresholds differ.

00433's prior-FN 75% recommendation is limited to AC. Weekly paclitaxel requires its own count-nadir/duration and G-CSF review. In 00512, FN alone no longer mandates a dose-level reduction: urgent interruption/assessment remains, with G-CSF considered and count criteria applied separately. 00512's combination phase remains weekly trastuzumab; q21 continuation rules cannot silently become a q21 combination schedule.

00815 has explicit SC 600 mg alternatives for combination and continuation, subject to local approval, with no IV loading dose. Missed-dose advice distinguishes IV and SC; SC administrations must remain at least 21 days apart. NCCP 00815 p4 contains an internal discrepancy: after an IV 8 mg/kg reload it says 6 mg/kg weekly, conflicting with the q21 schedule. The proposal flags that discrepancy and attributes the q21 interval to [EMA Herceptin SmPC section 4.2](https://www.ema.europa.eu/en/documents/product-information/herceptin-epar-product-information_en.pdf). It never creates an automatic 6 mg/kg weekly order.

## Source distinctions retained

| Decision | Distinction to retain |
|---|---|
| Cardiac hold | 00316 prints a fall ≥10 points alone. The other four use a fall ≥10 **and** current LVEF <50%. Do not normalize these without clinical source reconciliation. |
| Starting LVEF | 00433/00512 use >55%, with 50–55% clinical judgement; 00815 uses ≥55%, with 50–<55% judgement. 00745 specifies >50% while excluding <50%, so exactly 50% requires review. |
| Blood counts | 00316/00745 have a platelet-100 boundary gap. Weekly-paclitaxel tables in 00433/00512/00815 overlap at platelet 90. These remain review decisions. |
| Cyclophosphamide renal bands | 00433 uses >20 / 10–20 / <10 mL/min; 00316/00745 use ≥30 / 10–29 / <10, including an unresolved 29–30 boundary. |
| Paclitaxel hepatic bands | 00512/00815 specify 75% or 50% of the **original** dose; 00316 uses 135/90 mg/m², and 00433/00745 use 60/40 mg/m² reference doses. Prior reductions must not be silently reversed. |
| Toxicity | Do not transfer every weekly-neuropathy, other-grade-2, reduction-count or delay-duration rule across all five. The detailed table is source-specific. |

## Phase support and patient tools

`phase-support.json` gives exact source pages and medicine schedules. AC is highly emetogenic, paclitaxel low, and trastuzumab minimal. Keep AC antiemetics/G-CSF, taxane reaction prophylaxis, and HER2-only continuation separate. 'No routine premedication' in the AC reaction-prophylaxis section does not mean no antiemetic treatment.

00316 requires growth-factor support for both the dose-dense AC and fortnightly taxane phases. 00433/00745 require it for dose-dense AC; weekly paclitaxel support is individualized. The weekly taxane sources distinguish first-dose dexamethasone from later doses; the fortnightly regimen uses a different steroid schedule. Optional changes and H2 omission remain consultant decisions.

Existing 00316/00433/00745/00512 knowledge files already contain phase anatomy and monitoring structures. 00815 lacks both, and its context must explicitly retain adjuvant node-negative disease and tumour ≤3 cm. The parent builder should add the full phase map, baseline/ongoing cardiac schedule, SC alternative, separate support, and APT limitations. Heart-monitoring elapsed time starts with trastuzumab, survives phase/route changes, and continues during antibody-only treatment. The one-year total includes the combination phase; it is not an additional year after paclitaxel.

00433's NCCP tests say cardiac assessment as clinically indicated. Its regular three-month surveillance should be explicitly attributed to EMA/local practice rather than claimed as a printed NCCP interval. The other four explicitly state 12-week cardiac checks; 00512 also names LFTs and creatinine at that point. EMA post-treatment surveillance is a supplemental source, not an anthracycline monitoring rule copied into every phase.

## Trial evidence

Detailed endpoints, CIs, populations, sources and limitations are in `evidence-audit.json`.

| Primary study | Result | Appropriate interpretation |
|---|---|---|
| [APT final 10-year analysis](https://pubmed.ncbi.nlm.nih.gov/36858723/) | 406 treated; median follow-up 10.8 years. Ten-year iDFS 91.3% (88.3–94.4), RFI 96.3% (94.3–98.3), OS 94.3% (91.8–96.8), BCSS 98.8% (97.6–100). | Single-arm lower-risk adjuvant study; not a comparative treatment benefit or an individual prediction. The trial permitted a single micrometastatic node after amendment. NCCP eligibility remains node-negative ≤3 cm. APT used weekly antibody during combination; 00815 q21/SC combination is an NCCP adaptation. |
| [CALGB 9741](https://pubmed.ncbi.nlm.nih.gov/12668651/) | 2,005 women; factorial q2- vs q3-week chemotherapy. At median 36 months, 4-year DFS 82% vs 75%; DFS RR 0.74 (P=.010), OS RR 0.69 (P=.013). | Evidence for dose density pooled across factorial schedules. It did not contain trastuzumab and does not give a regimen-specific survival percentage for these current HER2 suites. |
| [B-31/N9831 joint analysis](https://ascopubs.org/doi/10.1200/JCO.2014.55.5730) | 4,046; median follow-up 8.4 years. Ten-year OS 84.0% vs 75.2%, HR 0.63 (0.54–0.73); DFS 73.7% vs 62.2%, HR 0.60 (0.53–0.68). | Supports adding trastuzumab to AC followed by paclitaxel in operable HER2-positive disease. It does not validate every dose-dense, q21, SC or neoadjuvant schedule, and is not evidence for concurrent AC/trastuzumab. |

## Validation and integration

- `source-cases.cjs proposed`: **116/116 passed**.
- The frozen v0.84.17 baseline passed 63/116, with 53 scenarios exposing the corrected gaps.
- Run `node validation/cmf-gem-v08418/her2-retro/source-cases.cjs integrated` after copying proposals.
- The dose renderer needs to read the variant input named by `metadata.dose_schedule_variant_input`, falling back to `trastuzumab_schedule`; 00815 uses `trastuzumab_route`.
- Legacy `tests/clinical-audit-v0838.test.cjs` cases labelled 'Baseline LVEF49/50' need explicit `assessment_stage:'baseline'`; missing stage is now intentionally a review case.
- Preserve all clinical authorization flags as false. Software-source matching does not constitute independent clinical approval.
