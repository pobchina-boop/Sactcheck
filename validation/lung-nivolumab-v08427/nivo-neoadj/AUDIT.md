# NCCP 00849 neoadjuvant nivolumab audit — v0.84.27

Checked 29 October 2026. Independent consultant, oncology-pharmacy and patient/PPI review remains pending. Software checks are not clinical validation.

## Scope and sources

NCCP 00849 v2 covers nivolumab only and explicitly links five alternative chemotherapy companions: 00304 v8, 00310 v8, 00281 v7, 00318 v6 and 00317 v7. Original PDFs and extracted text are hashed in sources.json. Critical nivolumab, gemcitabine, paclitaxel and pemetrexed tables were visually inspected. Current EMA Opdivo information supplements the NCCP source, including myocarditis–myositis–myasthenia overlap rules. Primary CheckMate 816 final overall-survival publication (NEJM 2025, DOI10.1056/NEJMoa2502931) freshly checked.

The prescribed course has at most three 21-day neoadjuvant cycles. No automatic postoperative nivolumab is added. Current EMA also has a separate perioperative indication; this does not expand NCCP00849. Source stage II–IIIA AJCC7/ECOG0–1/predominantly non-squamous wording is retained as an explicit MDT suitability issue despite the five listed chemotherapy options. Trial eligibility was broader than NCCP and does not supply separate randomized efficacy estimates for each backbone.

## Decision pathways

The proposal has 90 optional inputs and 164 source-labelled rules. All prior input keys remain available. One mutually exclusive backbone selector gates chemotherapy rules. A separate Day1/Day8 selector gates gemcitabine count actions. Missing backbone/day yields explicit review, never assumed normal chemotherapy clearance.

- Nivolumab Grade3 colitis and Grade3 immune creatinine toxicity are HOLD, not permanent stop. Named confirmed immune hepatitis Grade3/4 and renal Grade4 are permanent stops. Numeric labs alone request attribution/baseline/grade review. Unknown infusion culprit holds and investigates rather than assigning permanent nivolumab discontinuation.
- NCCP thyroid/hypophysitis Grade2/3 withholding requires symptomatic disease; missing symptom context requests review. Myocarditis Grade2 holds and Grade3/4 stops. Current EMA overlap syndrome uses the highest component grade: Grade2 hold, Grade3/4 permanent stop. Suspected cardiac/muscle/neuromuscular toxicity requires urgent assessment.
- Paclitaxel00304 count thresholds remain distinct from00712. Hepatic transaminases≥10×ULN and/or bilirubin>5×ULN contraindicate paclitaxel. Fractional gaps1.25–1.26 and2–2.01 require reconciliation. Source dose percentages refer to original dose and are not stacked.
- Gemcitabine Day1 requires ANC>1 and platelets>100. Day8 ANC0.5–1 or platelets50–100 selects75%; below0.5 or50 omits. Concurrent omit conditions take priority. Subsequent75% refers to original cycle-initiation dose, not automatic restart.
- Gemcitabine00310v8 bilirubin≥27 permits either80% original dose or full dose with active monitoring; the consultant chooses. 00281v7 instead specifies800mg/m² with tolerated escalation. Renal00310<30 expects no adjustment, whereas00281<30 considers reduction and exact30 is unassigned. These sources are not collapsed into one rule.
- 00281 cisplatin45–59 permits75% in the table but baseline eligibility excludesCrCl<60. Values>59 to60 are unassigned between printed rows. Consultant reconciliation remains explicit; carboplatin substitution is not automatic.
- Pemetrexed companion rules retain distinct platelet, renal, bleeding, mucositis and prior-reduction pathways. Both generic verifiedCrCl and specific pemetrexedCrCl<45 restrict treatment; a discordant higher alias cannot hide the lower value.
- CarboplatinGFR≤20 prohibits administration, >20 to≤30 requires extreme caution, and CalvertGFR caps125. Estimated-dose creatinine freshness and>110% isotope-baseline change require reassessment. Continuous CalvertGFR remains separate from threshold CrCl.

## Full-service authoring

The base00849 patient route is a selector only. Five complete context bundles have their own active medicines, consent prompts, anatomy,21-day schedule, three-cycle passport groups, monitoring, support and surgery/follow-up journey. Gemcitabine routes include a separate Day8 low-risk support plan. Pemetrexed vitamins/steroids appear only in pemetrexed routes; paclitaxel premedication only in its route. Base clinical support contains seven explicit backbone/day plans and all five companion references, rather than defaulting to the taxane plan.

No patient survival metrics are published. Clinician evidence uses the final randomized CheckMate816 OS estimate with population/comparator/follow-up and applicability limits. Printed timelines require no patient-entered dates. Steroid and antiemetic references must be reconciled into an individual prescription; no automatic additive courses.

## Verification

175/175 proposed-mode real-engine, dose-renderer and authoring checks pass. Tests cover immune grades/causality, maximum cycles, no automatic postoperative treatment, backbone/day isolation, exact count/liver/renal boundaries, alias conflicts, overlap syndrome and complete context content. Root must run `source-cases.cjs --integrated` after canonical integration, then the shared full-suite/PDF/browser checks.
