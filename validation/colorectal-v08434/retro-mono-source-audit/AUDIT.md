# v0.84.34 clinical decision audit

Status: source reconciliation and automated engine checks; independent clinical/pharmacy review pending. This is not clinical-use authorisation.

Official NCCP PDFs and EMA supplements are retained with hashes in sources.json. The criterion matrix distinguishes executable decisions from clinical/manual workflow; rule maps preserve the exact conditions and citations. All source-required criteria were reviewed; manual requirements are not claimed as automated coverage.

## Criteria and limitations

| Source section | Criterion | Handling / limitation |
|---|---|---|
| Indication (00207p1;00225p1) | Cetuximab CRC: EGFR-expressing, RAS wild type, failed oxaliplatin/irinotecan AND irinotecan intolerance. Head/neck: radiotherapy context with platinum ineligibility. Panitumumab: adult, RAS wild type after fluoropyrimidine/oxaliplatin/irinotecan failure. | encoded plus manual context: Mutant/unknown RAS exclusion applies to CRC; the separate head/neck context is not excluded by RAS. |
| Eligibility (00207p2;00225p1) | Cetuximab ECOG 0–3; panitumumab 0–2; adequate marrow, renal and liver function. | encoded: No invented ANC, platelet, CrCl or LFT numerical thresholds. |
| Exclusions (same eligibility pages) | Hypersensitivity; mutant/unknown RAS in CRC; panitumumab interstitial pneumonitis/pulmonary fibrosis. | encoded: Separate pulmonary-fibrosis flag added; confirmed ILD stop retained. |
| Skin current/recurrent (00207p3T2;00225p2T2;EMA§4.4) | Grade ≥3 or intolerable skin toxicity: hold. Fourth severe episode: stop. Recovery is required; the previous actual dose must not be escalated. | encoded: Cetuximab: maximum 2 weeks, recovery to grade ≤2, restart at 250/200/150 mg/m². Panitumumab: 1 or 2 withheld doses, recovery to grade <3, restart at 100/80/60% of the original dose. Lower/missing previous dose requires manual review. |
| Failed/late recovery (same skin tables) | Cetuximab unrecovered at the maximum 2 weeks: stop. Panitumumab unrecovered after 2 withheld doses: stop. Explicit failed-recovery input is independent. | encoded: Cetuximab recovery beyond 2 weeks requires review, without automatic restart. A zero/missing interval does not establish recovery. |
| Infusion reactions (00207p3T2;00225p3T3;EMA§4.4) | Cetuximab: grade 1 slow/supervise, grade 2 slow/treat, grade 3–4 permanently stop; reactions in the first 15 minutes require interruption regardless of grade. Panitumumab: mild/moderate reactions require rate reduction for future infusions; severe/life-threatening reactions require permanent discontinuation. | encoded plus manual bedside management: No automated pump-rate or resuscitation instructions. Alpha-gal, red-meat, tick-bite and antibody history review added. |
| Pulmonary/eye (same tables;EMA§4.4) | New respiratory symptoms: hold/investigate. Confirmed ILD: stop. Eye symptoms: prompt ophthalmology review. Ulcerative keratitis: interrupt or stop. | encoded: Clinical diagnosis and the choice of interruption versus discontinuation remain consultant-led. |
| Electrolytes (testsections;EMA§4.4) | Correct magnesium, calcium and potassium; monitor periodically during treatment and monthly for 2 months after the last dose. | encoded correction review + manual testing schedule: No fabricated magnesium hold threshold; a magnesium value alone cannot establish treatment clearance. |
| Organ function (00207p3T1;00225p2T1) | Cetuximab: no expected renal/hepatic/dialysis adjustment. Panitumumab: no expected renal/dialysis or severe hepatic adjustment; no adjustment for mild/moderate hepatic impairment. | encoded caution: Severe renal impairment input is connected to review; no invented CrCl percentage. No expected adjustment does not establish eligibility. |
| Severe skin infection/diarrhoea (00225p4;EMA§4.4) | Severe infected/blistering skin: withhold/review. Severe diarrhoea/dehydration: evaluate renal risk. | encoded: No fabricated numerical hydration or renal hold cutoff. |
| Pregnancy/lactation (EMA§4.6) | Specialist benefit/risk assessment and medicine-specific counseling. | encoded review + manual counseling: No routine clearance; follow contraception and post-treatment breastfeeding intervals. |
| Baseline/testing (00207p2;00225p2) | FBC, renal function and LFTs: before each panitumumab treatment and regularly for cetuximab. Antibody allergy/red-meat/tick/IgE history. Disease monitoring follows the consultant plan. | manual schedule represented in content: No fixed scan/marker intervals; assessment does not verify test completion. |
| Dose/administration (00207p1;00225p1) | Cetuximab: 400 mg/m² loading then 250 mg/m² weekly; start 1 week before radiotherapy and end with radiotherapy. Panitumumab: 6 mg/kg every 14 days. | manual administration represented in protocol: Infusion duration, rate, filter, diluent, flush, dose >1000 mg exception and anaphylaxis facilities require verification at prescribing and administration. |
| Support/premedication (00207p4;00225p3) | Cetuximab: antihistamine/steroid before every dose (suggested chlorphenamine 10 mg IV and dexamethasone 8 mg IV 60 minutes before). Panitumumab: premedication not usually required. Both low emetic risk; skin-care policy applies. | manual prescription represented in content: First 2 cetuximab infusions require vital signs and post-infusion observation; monitoring may cease after 2 tolerated infusions according to the source. Premedication, skin plan and delayed-reaction education are not computed. |
| Drug interactions/full SmPC (NCCP interaction sections;EMA) | Current SmPC and interaction database check. | manual: The regimen engine is not a comprehensive interaction database; unusual combinations require separate assessment. |

## Verification

Run `node validation/colorectal-v08434/retro-mono-source-audit/source-cases.cjs`. Cases test the actual assessment engine and component dose output, rather than echoing predicates. Baseline snapshots and baseline result files preserve the pre-correction behavior.

Current protocol IDs and historical rule IDs are retained. New dose-history inputs are intentional: historical restart tests now supply an actual previous maintenance dose, while new negative cases verify that missing or lower doses produce no numeric restart. Old source-date assertions now compare against each protocol’s declared current source date rather than a fixed historical release date.

Release-wide browser/PDF/UI/content integration and independent professional review are separate gates owned by the parent release task.

## Corrections

Added marrow/organ eligibility review, cetuximab CRC EGFR-expression review, panitumumab adult/prior-treatment eligibility and pulmonary-fibrosis exclusion, severe-renal-input linkage, intolerable-skin pathway, cetuximab ulcerative-keratitis/alpha-gal-risk review, recovery deadline checks and missing-context review. Restart rows now require actual previous dose to prevent inadvertent re-escalation.

NCCP 00207 v6 version-control date 16/09/2026 differs from 27/01/2025 footer. NCCP 00225 v6 version date 21/01/2026; future 2031 review date is not last revision.

## Grading provenance

NCCP adverse-event tables do not identify a grading edition. Input metadata therefore does not attribute CTCAE v5 to those tables. Former interface references are retained separately as orientation aids. Avastin EMA explicitly refers to NCI-CTCAE v3 for VTE and haemorrhage; conversion is not inferred. Vectibix EMA section 4.4 explicitly identifies CTCAE v5.0 for skin toxicity, which is retained for that input. Erbitux names CTCAE for skin toxicity without an edition. Infusion-reaction inputs do not invent an edition.

Reproduction order: reconcile.py, then bev-source-audit/clarify-grading.py. Do not rerun reconstruction scripts over subsequent release metadata or another reviewer’s changes.
