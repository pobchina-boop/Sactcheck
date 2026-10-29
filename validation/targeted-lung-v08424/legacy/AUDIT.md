# v0.84.24 legacy source audit

Source check: 29 October 2026. Proposals retain the deployed protocol identities and legacy fields. This is source reconciliation and software verification; independent clinical, pharmacy and patient/PPI review is still pending and clinical use is not authorised.

## Deliverables

- `proposed/00382-trifluridine-tipiracil.json`: NCCP v4 proposal, 24 rules and 30 optional inputs.
- `proposed/00831-atezolizumab-bevacizumab-hcc.json`: NCCP v2a proposal, 78 rules and 77 optional inputs.
- `authoring.json`: full patient/clinical/evidence/journey/support/selector authoring for both.
- `source-cases.cjs` and `source-results.json`: **490/490 passed** with the real assessment engine and dose renderer. Run with `--integrated` after final canonical copy.
- `sources.json`, original PDFs, extracted text and critical-table images in `research/`.
- `consent-profile-updates.json`: three scoped consent-generator profile updates; existing shared atezolizumab pooled-monotherapy frequency data preserved.

## Trifluridine/tipiracil: source version and scope

The current HSE GI index now links to **NCCP 00382 v4**, last reviewed **1 July 2026**, with an as-required review schedule. The former v3 download URL is stale. Stable `nccp-00382-v3` identity is retained deliberately; metadata records the current v4 source and the identity difference. The v4 indication remains **00382a colorectal monotherapy**. The separate EMA gastric/GEJ monotherapy and CRC plus bevacizumab indications are described as separate contexts, not added as NCCP indications or reimbursement claims.

The patient service may use the cyclic oral renderer (`service_kind=targeted`) but labels the medicine **oral cytotoxic chemotherapy**, not a kinase-targeted agent. The real dose renderer sees one fixed-combination component with an explicit `active_drugs` declaration and dosing days 1–5/8–12 in a 28-day cycle. Days 6–7 and 13–28 are tablet-free. The standard 35 mg/m² **per dose**, twice daily, maximum 80 mg per dose, food timing, no catch-up dosing and BSA-table prescribing are retained. The 50 mg total daily table row can require unequal morning/evening tablet amounts; no naive tablet-count calculator is introduced.

The new-cycle minima (ANC 1.5, platelets 75 ×10⁹/L) are distinguished from on-treatment interruption (<0.5 / <50). Unknown timing prompts review. Historical `assessment_context` values `start_next_cycle`/`during_cycle` are supported along with new timing fields. Current counts are not silently repurposed as a previous-cycle nadir. Prior ANC <0.5 or platelets <25 requires a **greater-than-7-day resulting delay** before the source reduction applies; exactly seven days does not qualify. Febrile neutropenia is separate. Grade 3–4 non-haematological pathways preserve the controlled grade-3 GI exceptions and require the toxicity type/response before calculating a qualifying pathway.

The exact numeric renal field preserves decimal boundaries; old `crcl_ml_min` band inputs and dialysis remain supported. Conflicting normal aliases do not remove severe findings. NCCP v4 says CrCl <30 should be reduced **according to the drug label**: current EMA SmPC supports 20 mg/m² twice daily at CrCl 15 to <30, with one reduction to 15. It says **CrCl <15 or dialysis is not recommended**. These are withholding/specialist-review pathways, not an invented licensed contraindication or a dose extrapolation below the studied range. The SmPC defines baseline moderate/severe hepatic impairment by bilirubin >1.5 ×ULN and does not recommend treatment. The old runtime hotfix that removed this label-based limit and extended the <30 pathway below 15 must not overwrite the new encoding; root has been alerted.

Dose reduction advice does not generate absolute doses without an adjudicated current-dose/renal context, and multiple limitations are not multiplied. Standard minimum is 20 mg/m² per dose; severe-renal minimum 15. Authorisation to restart is never inferred from a patient calendar or partial assessment.

NCCP v4 changes oral sickness classification to **moderate–high**. Oral guidance V6 Table 5 gives a choice of one daily oral 5-HT3 antagonist (granisetron total 1–2 mg or ondansetron total 8–16 mg); the plan presents alternatives and requires individual prescribing, including duration/rest-day coverage. It does not copy parenteral NCIS corticosteroid/NK1 regimens.

RECOURSE final follow-up is used for clinician evidence: 800 randomised, 712 deaths (89%), 8 October 2014 cutoff, median OS 7.2 versus 5.2 months, HR 0.69. It is clearly distinguished from the initial 7.1/5.3 analysis. **No SUNLIGHT combination survival number is assigned to monotherapy**, and TAGS gastric results are not used as colorectal benefit. Patient evidence is qualitative only.

## Atezolizumab/bevacizumab HCC

The current NCCP source remains **00831 v2a**; clinical review was 9 December 2024 and the 18 September 2025 amendment corrects reimbursement text. The source explicitly supports 1200 mg IV atezolizumab **or** 1875 mg SC, followed by bevacizumab 15 mg/kg IV, every 21 days. SC atezolizumab does not remove the bevacizumab infusion. This is immunotherapy plus anti-VEGF therapy, with no source dose reductions. The HCC indication comes from NCCP and Tecentriq product information; Avastin's own EU indication list is not incorrectly described as listing HCC.

The accepted HCC organ positions, including right-sided liver and chest/abdominal landmarks, are preserved in authoring. `patient/00831/contact-card.pdf` is an established link and must remain available; root will alias the refreshed card and its docs copy. Existing anatomy image/connector design should remain unchanged.

Baseline Child-Pugh A/ECOG 0–1, prior systemic-therapy exclusion, varices screening **and management**, recent variceal bleeding, liver decompensation and component-specific safety are now explicit. IMbrave150's six-month variceal assessment/bleeding criteria are presented as trial-selection context, not automatic lifelong ineligibility. Screening completion alone cannot clear untreated high-risk varices.

Liver abnormalities can be caused by HCC/cirrhosis, progression, obstruction, infection or treatment. Isolated LFTs no longer diagnose immune hepatitis or select permanent immune discontinuation. The HCC rows require clinical immune attribution and confident pairing with the affected enzyme's own baseline: normal baseline >3 to ≤10; baseline >1–3 then >5 to ≤10; baseline >3–5 then >8 to ≤10. Immune AST/ALT >10 or bilirubin >3 retains permanent cessation. Unknown attribution, severe results, baseline >5 or uncertain enzyme pairing prompts withholding/review rather than guessing a baseline. Similarly, creatinine >1.5 to 3 / >3 only becomes the immune-nephritis hold/stop rule with clinical attribution; isolated kidney injury still requires assessment/hold and does not diagnose nephritis.

NCCP Table 3 explicitly specifies **CTCAE v4.0**. Imported v5 metadata was removed. Bevacizumab NCCP Table 6 does not specify an edition; it is not silently converted to v5. Supplemental Avastin haemorrhage/VTE criteria cite its CTCAE v3 source.

Specific corrections include:

- 2+/3+ dipstick or urine protein ≥1 g/L requires a 24-hour collection within three days before the next bevacizumab dose; 4+ holds. Quantified ≤2 does not trigger a hold; >2 to 4 holds; >4 discontinues under NCCP. Negative dipstick cannot cancel a high timed result, nor can a low timed result silently cancel a discordant 4+ dipstick.
- NCCP's >4 g/24 h cessation and the SmPC's independent nephrotic-syndrome permanent-stop rule remain separately attributed; no false claim that they are identical.
- Grade 2–3 hypertension permits clinical management/considered interruption; uncontrolled/symptomatic hypertension holds; grade 4 or persistent grade 3 stops bevacizumab.
- An unspecified active bleeding flag holds for urgent grading rather than automatically permanently stopping. Grade 3–4 haemorrhage requires permanent bevacizumab cessation.
- Broad legacy perforation/fistula flag holds for clarification. Confirmed GI perforation, TE fistula and any grade-4 fistula have explicit cessation rules; lesser unspecified fistulae are not all treated identically.
- Arterial events and grade-4 VTE stop bevacizumab; lesser VTE requires review. Major surgery <28 days or an unhealed wound holds; day 28 alone does not establish healing. Planned surgery needs an individual interruption plan without an invented universal preoperative interval.
- Missing hypophysitis grade-4, recurrent pancreatitis, facial-paresis, named neurological syndrome/myelitis, nephrotic syndrome and persistent-hypertension branches are added. A broad neurological grade no longer chooses an unconfirmed permanent-stop syndrome.
- Controlled endocrine exceptions are not guessed. A failure to meet the source 12-week recovery/steroid conditions means **no restart and Consultant review**, not an unsupported universal permanent-stop statement from a combined flag.

Monitoring distinguishes baseline FBC/renal/liver/glucose/TFTs/varices/protein/BP, each-cycle FBC/renal/liver/glucose/protein, BP before and after treatment, TFTs every six weeks, and conditional INR/ECHO. No cytotoxic blood-count thresholds or prophylactic antiemetics are imported. Both agents have minimal emetogenic risk; no routine premedication or routine antiemetic prophylaxis is specified.

Clinician evidence uses updated IMbrave150 (31 August 2020 cutoff; median follow-up 15.6 months): OS 19.2 versus 13.4 and PFS 6.9 versus 4.3 months. The IV trial population, Child-Pugh A/ECOG 0–1 selection, bleeding exclusions and lack of individual-prognosis or cross-trial claims are explicit. SC formulation support is not represented as a separate HCC survival trial. Patient evidence contains no numerical survival claims.

## Consent-generator audit

The existing Lonsurf profile had only marrow/FN/GI risks. The scoped update adds dosing-calendar/no-catch-up counselling, fatigue/appetite/mouth effects, renal toxicity and reproductive counselling, with source scope. Existing atezolizumab pooled-monotherapy frequency fields and rare-event estimates are byte-for-byte preserved; added source-reconciled text covers delayed/lasting effects, alert-card use, formulation reactions and contraception. Bevacizumab bleeding text now conditionally explains HCC varices, strengthens nephrotic/kidney counselling and adds reproductive/ovarian-function counselling. No shared immune frequency estimates or unrelated medicine profiles are changed.

## Limits and remaining integration

Root owns final canonical copy, runtime-override guard, clinical consent profile merge, service indices, HTML/PDF build, rendering/interaction checks, QR/download copies and release packaging. The 490 source cases are proposal-mode verification; rerun with `--integrated` on final canonical files. All source documents and full current product labels remain authoritative, and the clinical team must judge attribution, individual risk, support prescriptions and restart decisions. BSA/tablet rounding, competing constraints and atypical organ impairment are intentionally not automated into definitive doses.
