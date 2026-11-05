# v0.84.34 clinical decision audit

Status: source reconciliation and automated engine checks; independent clinical/pharmacy review pending. This is not clinical-use authorisation.

Official NCCP PDFs and EMA supplements are retained with hashes in sources.json. The criterion matrix distinguishes executable decisions from clinical/manual workflow; rule maps preserve the exact conditions and citations. All source-required criteria were reviewed; manual requirements are not claimed as automated coverage.

## Criteria and limitations

| Source section | Criterion | Handling / limitation |
|---|---|---|
| Indication/partner/phase (pp1–2) | Adult mCRC requires fluoropyrimidine-based partner; breast/renal/ovarian/lung indications retain different qualifying conditions and phase limits. | encoded plus manual confirmation: Indication, partner-confirmed and treatment-context rules; no partner doses calculated. |
| Eligibility (00212p2;00214p2;00215p3) | ECOG 0–2. 00214/215 ANC ≥1.2, platelets >100, creatinine ≤1.5 ULN, bilirubin ≤26 µmol/L, AST/ALP ≤5 ULN. 00212 v7 adequate organ function without the older numerical cutoffs. | encoded: Adverse values request eligibility review, not automatic ongoing chemotherapy reductions. Current clinical context still assessed by clinician. |
| Exclusions (00212p2;00214p2;00215p3) | Hypersensitivity including CHO/recombinant antibodies; pregnancy and breastfeeding. | encoded: Hypersensitivity question includes source allergy category; breastfeeding also current EMA§4.6. |
| Risk history (00212pp2,6;00214pp2,6;00215pp3,7) | Pelvic/chest radiation, anthracyclines, cardiovascular disease, renal proteinuria, bleeding/clotting, prior VTE, recent ATE, surgery/inflammation/perforation risk, aneurysm/dissection and age >65. | encoded aggregated review: High-risk history is a clinician-assessed composite, not independently computed for each history component. Age>65 independent review. |
| Protein screening (00212p4T2;00214p4T2;00215p5T2) | Negative/1+ or <1 g/L: proceed in this domain. 2+/3+ or ≥1 g/L: collect 24-hour urine within 3 days before the next dose. 4+: withhold pending quantification. | encoded: Reassuring screen does not clear other domains; valid same-episode 24-hour total supersedes screen. Sampling episode/timing must be confirmed manually. |
| Protein quantification (sameT2) | ≤2 g/24 h: proceed in this domain; >2 through 4: hold and recheck every 2 weeks; >4: discontinue. Grade 4 proteinuria independently requires discontinuation. | encoded: Preserves exact 2 and 4 boundaries; g/L concentration never treated as g/24h excretion; no arbitrary percentage. |
| Hypertension (00212p4T3,p6;00214p4T3,p5;00215p5T3,p7) | Uncontrolled/symptomatic: hold. Grade 2–3: treat/review. Persisting grade 3 or grade 4: discontinue. >150/100: treat; >200/110 and uncontrolled: stop. Crisis/encephalopathy: permanently stop. | encoded with declared ambiguity: Discordant systolic/diastolic components in prose not defined. Either elevated component triggers review only. Numerical BP cannot infer persistence, symptoms or failed medication. |
| Fistula/perforation (Table3;EMA§4.4pp6–7) | Tracheo-oesophageal or grade 4 fistula: stop. Other fistula: individual review. Gastrointestinal perforation: permanently stop. | encoded: Source distinctions preserved; no automated rechallenge. |
| Thromboembolism/bleeding (Table3;complications;EMA§4.4p7) | ATE: permanently stop. Grade 4 VTE: stop; grade ≤3 VTE: close monitoring. Grade ≥3 haemorrhage: stop. Recent haemoptysis >2.5 mL: exclude. | encoded: Grade and event site clinically established. NCCP table does not name a grading edition; no silent CTCAE version conversion. |
| Surgery/wounds (00212p5;00214p5;00215p6) | At least 28 days after major surgery AND fully healed. Hold for wound complications; planned major/minor procedures require the source-specific 28/7-day window or consultant plan. Necrotising fasciitis: stop. | encoded plus manual timing: The postoperative 28-day boundary is tested. Planned-procedure input requires confirmation of the applicable window; the engine does not calculate operation dates. NCCP 00214 permits cycle 1 omission if chemotherapy starts within 4 weeks of surgery. |
| PRES (complications;EMA§4.4) | Imaging-confirmed PRES: discontinue; rechallenge safety is unknown. | encoded confirmed diagnosis: Brain MRI/diagnosis and urgent symptom assessment remain clinician-led. |
| Organ function (00212p3T1;00214p3T1;00215p4T1) | 00212: no expected renal/hepatic/dialysis dose adjustment. The older organ-function wording in 00214/215 describes limited evidence. | encoded review: No fabricated anticancer renal/hepatic dose. Suitability independent of absent adjustment. |
| Interactions (00214p6;00215p7;EMA§4.5) | Do not combine EGFR antibodies with bevacizumab and chemotherapy in metastatic CRC. Sunitinib: microangiopathic haemolytic anaemia risk. Concurrent radiotherapy: safety is not established. | encoded: 00212 v7 omits the older interaction prose: attribution explicitly identifies supplementary current 00214, rather than incorrectly citing 00212 page 7. |
| Infusion reaction (EMA§4.4p8) | Stop infusion and treat the reaction; no systematic premedication. | encoded severe reaction plus manual administration: Severe reaction: hold. All acute infusion reactions require bedside policy. No infusion-rate calculator. |
| Baseline/regular monitoring (00212p3;00214p3;00215p4) | FBC, renal function, LFTs, urine, BP and cardiac review. Consider echocardiography after chest radiotherapy/anthracyclines. BP before each cycle and after treatment. Warfarin: INR weekly until stable, then before each cycle. | manual schedule represented in content: Assessment does not book tests, verify their completion or clear unentered results. |
| Response/surveillance (tests section) | Consultant treatment plan; no universal imaging/marker frequency. | manual: No fabricated routine CT or tumour-marker interval. |
| Administration/prescribing (treatment/support sections) | Correct mg/kg dose and 14/21-day interval; 90→60→30-minute infusions if tolerated; no IV push; anaphylaxis facilities; consultant initiation/modification; minimal emetogenic risk. | manual workflow represented in content: Dose preparation, fluids, infusion compatibility, rapid-infusion protocol, medication reconciliation and partner antiemetics require professional verification. |
| Supplementary counseling (EMA§4.4–4.6) | Dental/osteonecrosis precautions, contraception/fertility, no breastfeeding until at least 6 months after treatment, avoidance of pregnancy, and other SmPC precautions. | manual counseling: Not represented as comprehensive binary decision rules; medicine-specific counseling and complete interaction check required. |

## Verification

Run `node validation/colorectal-v08434/bev-source-audit/source-cases.cjs`. Cases test the actual assessment engine and component dose output, rather than echoing predicates. Baseline snapshots and baseline result files preserve the pre-correction behavior.

Current protocol IDs and historical rule IDs are retained. New dose-history inputs are intentional: historical restart tests now supply an actual previous maintenance dose, while new negative cases verify that missing or lower doses produce no numeric restart. Old source-date assertions now compare against each protocol’s declared current source date rather than a fixed historical release date.

Release-wide browser/PDF/UI/content integration and independent professional review are separate gates owned by the parent release task.

## Corrections and source ambiguities

Added numeric BP review to 00212/00215 without inventing AND/OR hold semantics; age>65 ATE caution; six-cycle combination phase reviews in 00215; explicit EGFR-antibody combination prohibition; aneurysm/inflammation history clarification. 00212 v7 removed old interaction prose, so retained precautions now explicitly cite supplementary current 00214 page 6. Current Avastin EMA retrieval succeeded after earlier HTTP 429, and retained supplement precautions were rechecked.

NCCP 00212 v7 reviewed 20/08/2026;00214 v8 and00215 v7 have May 2026 version-control updates while footers retain older last-reviewed dates. Record both rather than treating footer as newer evidence. Thresholds of 00214/215 are eligibility references, not chemotherapy-component dose modifications;00212 v7 no longer has those values.

## Grading provenance

NCCP adverse-event tables do not identify a grading edition. Input metadata therefore does not attribute CTCAE v5 to those tables. Former interface references are retained separately as orientation aids. Avastin EMA explicitly refers to NCI-CTCAE v3 for VTE and haemorrhage; conversion is not inferred. Vectibix EMA section 4.4 explicitly identifies CTCAE v5.0 for skin toxicity, which is retained for that input. Erbitux names CTCAE for skin toxicity without an edition. Infusion-reaction inputs do not invent an edition.

Reproduction order: reconcile.py, then bev-source-audit/clarify-grading.py. Do not rerun reconstruction scripts over subsequent release metadata or another reviewer’s changes.
