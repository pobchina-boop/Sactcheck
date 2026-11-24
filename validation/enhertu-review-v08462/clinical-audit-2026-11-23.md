# Enhertu 00776 source and content audit — 23 November 2026

## Scope and conclusion

The active Irish anchor remains NCCP 00776 version 3b: trastuzumab deruxtecan 5.4 mg/kg monotherapy for its two specified advanced breast cancer settings. Its current PDF bytes match the source hash already stored in the protocol. The source does not need a new regimen version merely because this software correction is being made.

The principal reproducible clinical defect is that a manually entered LVEF fall can contradict, or remain blank despite, the baseline and current values. A baseline of 55% and a current value of 43% represents a 12 percentage-point fall. The regimen's initial-assessment branch requires interruption and repeat cardiac assessment within three weeks. The app must derive that fall when both values are provided, reject or prominently reconcile contradictory entries, and never substitute a blank fall with a reassuring assumption.

This audit verifies current sources and identifies content/logic requirements. It is not independent consultant, oncology-pharmacy, patient/PPI or regulatory authorisation. The final implementation and end-to-end checks are separate workstreams.

## Source inventory

1. NCCP 00776 v3b, 6 pages. Published 31 July 2024; review date 12 February 2030; version-history amendment 21 May 2026. Current URL: https://assets.hse.ie/media/documents/Trastuzumab_776_Deruxtecan_5.4mg_Therapy.pdf . Retrieved current bytes on 23 November 2026. SHA-256 `822e5b568e1b8b2b618b7fa93cacdd485192fef3c5bfdff6005f1b22570b7c6a`.
2. EMA Enhertu product information, current retrieved PDF, 59 pages: https://www.ema.europa.eu/en/documents/product-information/enhertu-epar-product-information_en.pdf . Current Irish medicines.ie entry states revision October 2026. Retrieved 23 November 2026. SHA-256 `3c4c744afc1ef29bbcad254e39bd7fd8b4be34bb4ddecf254258c2ab2c9863c8`.
3. NCCP Supportive Care Antiemetic Medicines for inclusion in NCIS (Medical Oncology), v8, dated 10 February 2025, 6 pages: https://assets.hse.ie/media/documents/Supportive_Care_Antiemetics_for_inclusion_NCIS_Medical_Oncology.pdf . Retrieved 23 November 2026. SHA-256 `98069ef2cba15ce85275e4d407db9d30dcee17316e5811b880f10ad5823cb32f`.
4. NCCP SACT Antiemetic Guidance v6, 10 February 2025, 14 pages: https://assets.hse.ie/media/documents/Classification_Document_for_Systemic_Anti-_Cancer_Therapy_SACT_Induced_Nausea__pWgDCrm.pdf . Current source read through web retrieval, including p4 definition of risk without prophylaxis, p6 risk categories and p12 medicine classification.
5. HPRA-linked Irish Enhertu patient alert card, v2 August 2022, 8 small-format pages: https://assets.hpra.ie/products/Human/37088/f01a5860-046f-4da6-96e4-e566b11d0d47.pdf . Retrieved via HPRA product 37088's current educational materials link, 23 November 2026. SHA-256 `a9719d4e59aa7a15b81fd8e6cbb58c790d98f0b7551b302f4372d2c3e71d298b`.
6. HPRA-linked HCP ILD guide, v3 March 2023: https://assets.hpra.ie/products/Human/37088/5a01f1d7-242e-4fd3-a054-f9337b29d109.pdf . Current product directory: https://www.hpra.ie/find-a-medicine/for-human-use/authorised-medicines/details/37088 . Source reinforces early recognition and immediate reporting, including mild symptoms, and carrying the separate patient alert card.
7. DESTINY-Breast03 long-term report, 2024: https://pmc.ncbi.nlm.nih.gov/articles/PMC11333275/ (DOI 10.1038/s41591-024-03021-7).
8. DESTINY-Breast04 long-term report, 2025: https://www.nature.com/articles/s41591-025-03981-4 . Original 2022 results remain historically valid when explicitly labelled with their original analysis and population.

The historical `www.hpra.ie/img/uploaded/swedocuments/...` patient-card link now returns 404. Use the current HPRA asset URL and retain the product-directory fallback. Do not substitute a UK card or label SACTCheck's own card as the official risk-minimisation card.

## Source rules to preserve

| Domain | Required interpretation | Source |
| --- | --- | --- |
| Scope | 00776a: unresectable/metastatic HER2-positive breast cancer after at least one prior anti-HER2 regimen. 00776b: HER2-low advanced breast cancer after metastatic chemotherapy, or recurrence during/within six months of adjuvant chemotherapy. | NCCP pp1–2 |
| Dose and cycle | 5.4 mg/kg IV, day 1 every 21 days, while benefit and tolerability support continuing. No fixed one-year course. | NCCP p1 |
| Infusion | First infusion 90 minutes; subsequent infusions may take 30 minutes when the previous infusion was tolerated. Slow/interrupt for reactions; severe reaction permanently stops treatment. | NCCP p1; EMA §4.2 |
| Dose reductions | 5.4 → 4.4 → 3.2 mg/kg; a further required reduction means discontinuation. No dose re-escalation. | NCCP p3 |
| Baseline | Confirm HER2/indication and prior treatment; FBC, renal/liver profile, echo/MUGA, pregnancy testing where relevant, cardiac/pulmonary history. NCCP first-dose LVEF eligibility is ≥50%; ECOG0–2. | NCCP pp1–2 |
| During treatment | FBC, renal/liver profile before every cycle. Cardiac scan every 12 weeks; 4–8-weekly may be appropriate with signs of impairment. A qualifying LVEF fall needs recheck within three weeks. Symptoms require investigation when they arise. | NCCP pp2,4 |
| Grade 1 ILD | Interrupt until grade0. Resolution within 28 days permits same dose; later recovery requires one reduction. Consider corticosteroids promptly under specialist care. | NCCP p4; EMA §4.4 |
| Symptomatic ILD | Grade≥2 requires permanent discontinuation and prompt clinician-managed corticosteroids. A later grade0 entry must not erase previous symptomatic drug-related ILD. | NCCP p4; EMA §4.4 |
| ANC | 0.5 to <1.0×10⁹/L: interrupt to grade≤2 then same dose. <0.5: interrupt to recovery then one-level reduction. CTCAE version5.0 defines this source table. | NCCP pp4–5 |
| Febrile neutropenia | ANC<1.0 with temperature>38.3°C, or ≥38°C for >1 hour, invokes interruption then one reduction. These prescribing criteria must never become instructions for a patient to delay an urgent call. | NCCP p4 |
| LVEF initially 40–45% | Drop<10 points: treatment may continue with repeat within three weeks. Drop10–20 points: interrupt, repeat within three weeks. | NCCP p4 |
| LVEF >45% | A 10–20-point fall alone permits continuing within this cardiac branch; all other findings still apply. | NCCP p4 |
| Severe LVEF fall | Current<40% OR absolute fall>20 points: interrupt and recheck within three weeks; confirmed finding requires permanent discontinuation. | NCCP p4 |
| Cardiac recovery | After the initial 40–45%/10–20-point interruption, confirmed recovery to within10 points of baseline permits same-dose resumption. Exact10 is included in “within10”; this repeat pathway is distinct from the initial hold boundary. Missing/contradictory repeat information remains unassessed. | NCCP p4; EMA §4.2 |
| Heart failure | Symptomatic congestive heart failure permanently discontinues treatment. A reassuring repeat flag cannot override it. | NCCP p4 |
| Reproductive care | Effective contraception during treatment, then ≥7 months for women who could become pregnant; ≥4 months for men with partners who could become pregnant. No breastfeeding during treatment or for ≥7 months after. Discuss fertility before starting. | NCCP p5; EMA §4.6 |

## Source differences that must remain visible

- EMA's licence is broader than 00776. It includes additional settings, other tumour types and a pertuzumab combination. The 00776 video and route must not inherit these indications or imply Irish reimbursement for them.
- Severe renal impairment and dialysis: NCCP's Giraud-based table expects no dose adjustment; EMA cannot determine dosing requirements because data are absent. The app's specialist-review output correctly preserves this difference. Moderate renal impairment also needs closer toxicity/ILD surveillance.
- Moderate hepatic impairment: NCCP expects no adjustment with close observation. EMA cannot determine dose requirements above bilirubin1.5×ULN. Retain review without inventing a numeric dose. NCCP does not recommend use in severe hepatic impairment.
- NCCP's eligibility text says age>18 while the indication says adults. The boundary needs review rather than a hidden rewrite.
- Neither this NCCP document nor the retrieved EMA dose table supplies a numerical platelet dose-modification ladder. Low platelets still need assessment; do not import a US-label rule without explicit authority.
- A recorded historical pretreatment LVEF<50 in an explicitly ongoing assessment is outside the initial evidence/eligibility boundary. Flag specialist review; do not pretend the initial eligibility threshold is itself an ongoing dose-table instruction. Current dysfunction and all stricter rules remain applicable.

## Generated supportive medicines: actual content and rationale

The active authored source is `data/phase-support-v0838.json`, `regimens['00776'][0]`, mirrored in `data/breast-completion-v08421-authoring.json`, `regimens['00776'].support_plans[0]`. It generates `patient/00776/support-treatment.html`, its PDF and the phase-selection page.

| Medicine in current generated plan | Current schedule | Patient explanation to include |
| --- | --- | --- |
| Aprepitant | 125mg orally day1; 80mg daily days2–3 | Blocks one of the pathways carrying vomiting signals; protects against early and delayed sickness. Follow scheduled doses even when feeling well. |
| Ondansetron | 16mg orally before treatment day1 | Blocks serotonin-related sickness signals. Constipation/headache can occur; existing heart rhythm risks and interactions are checked by the team. |
| Dexamethasone | 12mg orally day1; 8mg daily days2–4 | A corticosteroid used here to strengthen nausea prevention. It may disturb sleep, cause indigestion or increase glucose; the team tailors timing/dose. It is a separate use from the high-dose steroid treatment of suspected lung inflammation. |
| Metoclopramide | 10mg orally up to three times daily; rescue duration completed by prescriber | Rescue medicine for sickness despite prevention. Use only the dose and duration on the personal plan; contact the team for uncontrolled symptoms or unusual restlessness/involuntary movements. |
| Conditional H2-blocker/PPI | Current national footnote permits consideration; no single drug or dose specified | If prescribed, reduces stomach acid and indigestion, which can feel like nausea. Keep it in the personal medication plan. Do not introduce a mandatory generic prescription. |

NCCP NCISv8 has a **dedicated Enhertu triple-therapy row**. The generic high-risk row includes olanzapine, but the dedicated Enhertu row does not. It may be prescribed individually; do not silently present it as the default. If used, its sedation and combination risk with metoclopramide should be reviewed.

The current script lacks the optional acid-suppression explanation. Root is addressing this as conditional support. No verified CUH-specific Enhertu script was supplied in this task, so the national source must not be relabelled as a CUH prescription. Personalised/local medicines already issued to the patient remain part of their plan.

“High emetogenic risk” means the national category is >90% vomiting risk **without preventive antiemetics**. It is not an assertion that this proportion will vomit with prophylaxis, nor an individual prediction. Delayed sickness can occur after leaving the infusion unit. Inability to keep fluids or medicines down requires prompt contact.

## Patient-video mapping to the fixed order

1. **Name:** Enhertu and the complete medicine name trastuzumab deruxtecan. State the 00776 advanced-breast monotherapy scope. Avoid conflating it with Herceptin/trastuzumab or Kadcyla/trastuzumab emtansine.
2. **Schedule:** day1 infusion of a three-week cycle, normal intervals, duration based on ongoing benefit/tolerance, clinician-managed delays/reductions.
3. **Checks and suitability:** explain what blood count, kidney/liver tests and heart scans check, their timing, HER2 testing, existing lung/heart conditions, allergies, pregnancy/breastfeeding, all medicines/supplements. Describe tests after problems or at completion as individual, not a fabricated universal post-treatment schedule.
4. **Mechanism:** antibody–drug conjugate (ADC). Antibody attaches to HER2; the cell takes in the linked chemotherapy payload; payload inhibits topoisomeraseI and damages DNA. Targeting does not eliminate effects on healthy cells. This is not a checkpoint immunotherapy.
5. **Treatment day:** assessment, identity and medicine checks, preventive antiemetics, cannula or existing appropriate line, first90/later30-minute infusion if tolerated, additional appointment/observation time. Immediately tell nurse about flushing, rash, chills, wheeze, faintness, breathlessness or line pain/swelling.
6. **Support medicines:** explain the generated plan above, scheduled versus rescue use, steroid purpose, optional acid suppression, and individual changes. Do not use patient education as an issued prescription.
7. **Common effects and recognition:** nausea/vomiting, fatigue, reduced appetite, constipation/diarrhoea, hair thinning/loss, mouth soreness, low blood counts and infection/anaemia/bleeding symptoms; explain practical early reporting and hydration/mouth-care/activity measures without promising prevention.
8. **Urgent effects:** dedicate a prominent separate section to new/worsening cough, breathlessness, fever or breathing changes. Immediate contact even if mild; do not wait until next visit or self-treat with spare steroids. Also heart symptoms, fever/shivers/sudden illness, uncontrolled vomiting, dehydration or significant bleeding. Severe breathing difficulty, chest pain or collapse:112/999. Local urgent number and out-of-hours plan must be filled by the treating team.
9. **At home and later:** carry the official Enhertu lung alert card alongside SACTCheck's card; keep a thermometer/medication list/contact plan; report symptoms between cycles and after final treatment; discuss fertility/contraception/breastfeeding, driving if dizzy/fatigued, and missed appointments. Ask who follows up pending results and next scans.
10. **Teach-back and resources:** can the viewer name the medicine, next visit/checks, support schedule, lung warning symptoms and urgent number? Link portal/printed pack and official PIL/card. This is a checklist for understanding, not a quiz required for access.

## Numerical safety statements

The current EMA 5.4mg/kg monotherapy pooled safety set spans multiple tumour types, n3057. Reported common-effect frequencies include nausea70.3%, fatigue56.9%, vomiting36.5%, alopecia34.4%, constipation33.0% and diarrhoea30.3%. These are observed trial-pool rates, not individual predictions or the untreated emetogenic category. A full catalogue of percentages would overwhelm a short video.

Infusion reactions were reported in31/3057 (1.0%) at5.4mg/kg monotherapy, predominantly grade1–2 (EMA §4.8, printedp16). If the film quantifies risk, say approximately1in100 in the pooled5.4mg/kg studies and preserve that context. Do not substitute the2.3% pertuzumab-combination figure.

For pulmonary risk, emphasise potentially fatal harm and immediate action. Do not transfer a single trial's rate to every patient. The patient summary currently cites16.7% without naming the trial in that sentence; it belongs to the2024 DESTINY-Breast03 report. Label the population/timepoint explicitly or use qualitative wording. DB04's long-term analysis is a different population and reports12.1% adjudicated drug-related ILD/pneumonitis.

## Evidence consistency review

Clinician `evidence_at_a_glance` currently preserves separate, correctly labelled DB03 and DB04 analyses. DB03's2024 update: investigator-assessed PFS29.0vs7.2months and OS52.6vs42.7months. DB04's2025 report: overall-cohort OS22.9vs16.8months and investigator PFS8.8vs4.2months. Their existing hazard ratios and confidence intervals match the retrieved primary reports. These must not be combined or described as a personal prognosis.

The patient DB04 paragraph expressly identifies original2022 PFS/OS figures, which remain historically accurate. It can be supplemented by a separately labelled later update. The broad top patient evidence block should remove its ambiguous unqualified16.7% ILD figure.

## Review of all 11 original patient source entries

The entries below were each traced to the relevant underlying primary document on 23 November 2026. Several are duplicate references to the same report; they are not 11 independent sources. “Reviewed” means the claim-relevant material was retrieved and assessed, not that every page of every trial or guideline was exhaustively audited. Intermittent PMC challenges, PubMed extraction failures and publisher redirects are recorded separately; a challenge page is not accepted as article content.

| Existing source ID | Underlying source and material reviewed | Disposition |
| --- | --- | --- |
| `nccp` | Current 00776 v3b PDF, pp1–6, including eligibility, administration, monitoring, modification tables and version history | Direct primary PDF archived and SHA verified; current checked date is supported. |
| `smpc` | Current EMA Enhertu product information §§4.1–4.8, §5.1 relevant breast populations and patient leaflet | Direct primary PDF archived and SHA verified; current checked date is supported for the stated monotherapy safety review. Broader licensed indications are not imported into 00776. |
| `destiny-breast03-longterm` | Cortés et al. 2024, PMID38825627; same primary report as PMC11333275 and DOI10.1038/s41591-024-03021-7 | Trial identity, analysis time point, investigator-assessed PFS, OS and ILD population reviewed. PubMed itself intermittently returned only a footer in extraction; this is underlying-article verification through the primary full-text mirror, not proof of stable endpoint rendering. |
| `destiny-breast04` | Modi et al. 2022, PMID35665782; full primary article at https://pmc.ncbi.nlm.nih.gov/articles/PMC10561652/ | Original HR-positive and overall population results verified separately. The 2022 adverse-event analysis is not the 2025 long-term analysis. |
| `ESMO_EBC2024` | Pan-Asian adapted ESMO early-breast guideline, https://pmc.ncbi.nlm.nih.gov/articles/PMC11145753/ , recommendation8f | Regular bone-density evaluation applies to aromatase inhibitors or ovarian suppression. This is contextual support for other treatments, not an Enhertu-specific metastatic monitoring schedule. No mandatory DEXA interval is imported. |
| `ESMO_MBC2023` | https://pmc.ncbi.nlm.nih.gov/articles/PMC10186487/ , recommendations2f–h | Relevant primary indexed text verified: response assessment generally every2–4months, individualised to disease and treatment; less frequent in indolent disease; earlier when progression suspected. Direct full-page retrieval intermittently challenged. This supports the general response-planning paragraph, not a fixed NCCP scan order. |
| `ABC5_MARKERS` | https://pmc.ncbi.nlm.nih.gov/articles/PMC7510449/ ; DOI10.1016/j.annonc.2020.09.010, image/disease-assessment guidance | Primary indexed guideline text verified: elevated tumour markers may aid response evaluation, particularly non-measurable disease; an isolated rise is not a sufficient reason to change treatment. Full-page retrieval intermittently challenged. No universal marker timetable is inferred. |
| `trial-0` | Duplicate of `destiny-breast03-longterm` | Same source verification; not an additional independent trial. |
| `trial-1` | Duplicate of `destiny-breast04` | Same source verification; original2022 results remain explicitly historical. |
| `db03_current` | https://www.nature.com/articles/s41591-024-03021-7 ; same report as `destiny-breast03-longterm` | Primary full-text mirror reviewed. Latest direct publisher reopen redirected to an inaccessible identity page; retain accessible PMC fallback. |
| `db04_current` | https://www.nature.com/articles/s41591-025-03981-4 | Primary long-term report retrieved and reviewed earlier in this audit. Later reopen redirected to publisher identity handling. Overall-population OS22.9vs16.8months and investigator PFS8.8vs4.2months remain separately labelled. |

No existing entry was silently treated as a newly read source merely by updating a global date. The authored source list may retain old or absent per-entry dates where the application requires direct endpoint verification beyond the underlying claim review documented here.

## Additional supportive-medicine verification

Current EMA Emend/aprepitant product information: https://www.ema.europa.eu/en/documents/product-information/emend-epar-product-information_en.pdf . Retrieved PDF SHA-256 `afd6062a51e59b36e448c9117685894e4529fcde2f5e673f4401f91bb32d7081`; relevant §§4.2,4.4–4.6 reviewed.

- Aprepitant can reduce hormonal contraceptive effectiveness. The SmPC describes reduced efficacy during and for28days afterwards, and instructs alternative non-hormonal backup during treatment and for **two months after the last aprepitant dose**. Repeated21-day courses overlap this period. This is additional to the longer Enhertu contraception precautions and should be addressed to the person using hormonal contraception, not framed as a man's aprepitant reducing his partner's contraceptive efficacy.
- The national dexamethasone12mg day1 then8mg days2–4 schedule already accounts for interaction with aprepitant. Do not halve that established schedule again. Emend §4.2 explicitly states that its dexamethasone regimen accounts for interactions.
- Warfarin users need clinician/pharmacist INR monitoring during and for14days after each three-day aprepitant course (§4.4). The general instruction to review the complete medication list remains appropriate; the patient film need not enumerate every interaction.
- Current HPRA oral ondansetron4mg SmPC, via product20858, https://assets.hpra.ie/products/Human/20858/Licence_PA0749-009-001_17122023224440.pdf , supports constipation/headache, QT-risk and interaction counselling. The national Enhertu schedule still provides the regimen dose; this separate product source supports counselling, not replacement of the national row.
- **Individual hepatic prescribing boundary:** the same ondansetron SmPC §4.2, printed page3, caps the total daily dose at8mg in moderate or severe hepatic impairment. The national reference16mg day1 must therefore be adjusted by the individual prescriber/pharmacist when that restriction applies. Retain the national row as a reference, make the review requirement explicit, and do not imply the fixed template is appropriate for every organ-function state.
- Current HPRA dexamethasone2mg-tablet SmPC, via product14245, https://assets.hpra.ie/products/Human/14245/Licence_PA1691-014-001_05052026154715.pdf , supports glucose, mood, sleep and gastrointestinal cautions. Frequency and severity depend on dose/duration, so patient wording says these effects *may* occur.
- EMA metoclopramide referral https://www.ema.europa.eu/en/medicines/human/referrals/metoclopramide-containing-medicines supports short-term use (licensed maximum five days) and neurological adverse-effect counselling. The generated rescue template's prescriber-completed duration is not permission for indefinite use.
- NCI patient information https://www.cancer.gov/about-cancer/treatment/types/chemotherapy supports explaining that the degree of chemotherapy side effects does not measure treatment efficacy. This contextual principle supports the hair-loss sentence and is not an Enhertu-specific efficacy endpoint.

## Review of updated patient profile and patient-review content

Reviewed `data/enhertu-patient-review-v08462.json` and the updated `data/patient-knowledge/00776.json`. The revised red flags, low-count symptoms, common-effects categories, delayed sickness, infusion advice, lung alert card and reproductive periods agree with the source material above. The EMA5.4mg/kg table/patient leaflet specifically includes altered taste, mouth inflammation/ulceration, gastrointestinal effects, hair loss, fatigue and blood-count changes. Practical self-care suggestions are presented as optional help, without a promise of preventing toxicity.

The five red-flag groups distinguish immediate lung/infection contact, cardiac symptoms, bleeding and inability to maintain fluids. Chest pain, severe breathing difficulty or collapse appropriately invoke emergency care. HSE's general cancer side-effect guidance is https://www2.hse.ie/conditions/cancer/if-you-have-side-effects/ ; it supports urgent contact for temperature≥37.5°C or≤36°C, shivering, uncontrolled vomiting, at least four diarrhoeal episodes a day, bleeding and mouth ulcers limiting intake. Hospital-specific instructions may be stricter. These patient-contact thresholds must not be replaced with the protocol's narrower dose-rule definition of febrile neutropenia.

Requested editorial precision: use “written support plan” in patient explanations unless explicitly identifying an unissued prescribing template; add the aprepitant two-month backup advice with its separate source; retain immediate contact wording for new lung symptoms consistently. Bone-health and cancer-response statements remain individualised and do not manufacture an Enhertu-specific DXA or fixed CT schedule.

The revised17-scene video script was read in full after the pregnancy-test, patient-facing support-plan and aprepitant wording corrections. It follows sections1–7 in the required order, then urgent lung/cardiac/infection/bleeding warnings, home precautions, reproductive care and teach-back. The text is source-consistent within the defined00776 scope. `patient-and-video-content-review.json` records the reviewed file hashes and explicitly excludes audio quality, visual rendering and publication status from this text review.

## Independent targeted implementation probes

`independent-clinical-probes.cjs` and `independent-clinical-probes-results.json` record **46/46 passed** against the final supplied schema/code, including a protocol SHA-256 and check timestamp. These examples were authored by the clinical audit workstream from the source boundaries, independently of the engineer's regression set.

They cover the original55→43LVEF failure with omitted, false and stale manual falls; correct initial-versus-repeat handling at exactly10points; severe falls despite a normal-looking current value; missing and contradictory recheck information; prior starting eligibility versus ongoing function; symptomatic heart failure/ILD precedence; ANC, ILD28-day and organ-function source boundaries. The added mixed-risk examples verify suppression of a future numeric dose when grade4neutropenia coincides with a separate cardiac, pulmonary, infusion-reaction hold or renal/hepatic review. Isolated neutropenia retains its conditional later reduction after recovery; permanent-stop states show no numeric dose.

This is a targeted clinical-source/software verification layer. It does not establish exhaustive safety, a human consultant/pharmacy signoff, suitability for a particular patient, completion of visual/PDF/QR checks or live publication. Root owns those separate verification and release records.
