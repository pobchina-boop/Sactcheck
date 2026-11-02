# Gemcitabine/platinum source audit — v0.84.28

Checked 2 November 2026. Scope: NCCP00281 and00310 existing assessment rules, standalone lung content, evidence, consent support, anatomy, journey and day-specific support drafts. Files here are proposals; independent oncology/pharmacy approval is pending.

## Sources and retrieval

- 00281: official `https://healthservice.hse.ie/documents/6926/281_V7_GemCis75.pdf`, version7,6pages, review18November2026, amendment7November2025. Fresh web PDF text read in full. Dose table screenshot requested for page3.
- 00310: old v7 URL no longer provides current document. Fresh current `https://assets.hse.ie/media/documents/310_GemCARBOAUC_5.pdf` is version8,8pages. It is also the redirect target of `https://healthservice.hse.ie/documents/6713/310_GemCARBOAUC_5.pdf`. Footer date last reviewed18November2021; review policy becomes as-required from19August2026. Do not interpret that footer as a new2026 clinical review date. Current version matches the v27 neoadjuvant companion source but differs from the old standalone record.
- Direct PDF byte requests returned HTTP403. No fresh PDF checksum or local-PDF visual examination is claimed. Web screenshot responses were obtained for281page3 and310pages4–5; local renderer QA of source pages was unavailable. The proposal metadata explicitly records the retrieval limitation.
- Primary trial: Zatloukal et al. Lung Cancer2003;41:321–331, PMID12928123, DOI10.1016/S0169-5002(03)00233-2. Abstract opened and read. Scagliotti et al. PMID12409326 additionally inspected through primary indexed abstract; not used as numerical evidence in the drafts.

## Findings and proposed corrections

1. **Prior severe haematological-event reduction incorrectly applied to both drugs.** Both sources label Table1 as gemcitabine dose modification. Legacy rule used gemcitabine and platinum components. Proposal limits the subsequent75%-of-original row to gemcitabine, requires consultant recovery/prior-dose review and never authorises resuming a currently omitted dose.
2. **Baseline marrow eligibility absent.** Both sources require ANC>1.5 and platelets>100 at initiation. This is separate from subsequent Day1 ANC>1 and platelets>100. Baseline restriction and missing-stage review added. Equality boundaries remain strict.
3. **Missing treatment day could produce an unqualified result.** Added review when counts are entered without Day1/Day8. Day8 gemcitabine75% at ANC0.5–1 or platelets50–100; omission below0.5/50 remains independently more restrictive.
4. **Day8 restart equality conflict.** Initial75% table includes ANC0.5/platelets50, but restart after omission requires strictly>0.5/>50. Added explicit restart context preventing restart at equality. No rounding into a permitted dose.
5. **00281 renal source conflicts.** Baseline CrCl<60 is excluded, yet on-treatment table provides75% cisplatin at45–59. Proposal displays this conflict as consultant review; baseline exclusion remains independently restrictive. Printed cisplatin rows leave>59 through60 unassigned and gemcitabine rows leave exact30 unassigned. Numeric verified input replaces coarse bands so these gaps can be represented. Saved renal band strings must not be silently mapped into an exact value.
6. **00281 neuropathy action needed withholding and stage context.** Baseline neuropathy≥2 excludes cisplatin. Treatment-emergent neuropathy≥2 requires recovery≤1 then consultant choice of carboplatinAUC5 substitution or50% cisplatin reduction. No automatic substitution; gemcitabine retains its own independent restrictions. Missing stage now prompts withholding/review.
7. **Gemcitabine pulmonary suspicion was missing.** Both sources instruct discontinuation when drug-induced pneumonitis is suspected, beyond the existing Grade≥2 pathway. Added clinician-confirmed suspicion input and gemcitabine action; does not diagnose from a symptom alone.
8. **Generic non-haematological toxicity exception missing.** Source excludes nausea/vomiting from the Grade≥3 generic dose row. Label/guidance and action now explicitly retain this distinction, without suggesting severe vomiting is safe.
9. **00310 Calvert safeguards incomplete.** Added GFR125 cap review, increased myelosuppression risk below60, stale calculated-GFR creatinine (>48h) review, and isotope-baseline creatinine>110% reassessment. Existing≤20 prohibition and>20 to≤30 extreme-caution thresholds retained. Dialysis timing6–12h remains gemcitabine-specific; hidden conditional display removed so dialysis can be recorded without a potentially inappropriate calculated GFR.
10. **00310 hypersensitivity exception absent.** Routine hypersensitivity exclusion retained, with source's exceptional prior-mild-reaction desensitisation route described as a separate specialist pathway, never automatic permission to rechallenge.
11. **00281 combined pregnancy/breastfeeding input overstates source.** Source specifically excludes breastfeeding. Combined legacy input now prompts urgent specialist review with the distinction stated; no unattended pregnancy clearance.
12. **Duration/indication contamination risk.** Standalone4–6-cycle plans separated from three-cycle00849 neoadjuvant immunotherapy route. Clinical rules add separate-plan review and neoadjuvant cycle limit.00310 urothelial indication preserved in clinical protocol but not represented as lung patient content. Off-label lung wording retained in patient/consent text.
13. **Grading attribution overstatement.** Sources do not name a CTCAE edition in their toxicity-action tables. Removed claim that their source action rows are explicitly CTCAEv5; named-event clinical grading remains necessary.
14. **Premature proceed rule removed.** A cycle number alone must not imply complete assessment; blank and partial input checks remain incomplete.

## Evidence interpretation

Zatloukal randomized176 patients (87cisplatin/89carboplatin), stageIIIB/IV, chemotherapy-naive, Karnofsky≥70. Both arms used gemcitabine1200mg/m² Days1/8; cisplatin80mg/m² or carboplatinAUC5 Day1 every21days. These are not identical to NCCP2811250/75 or3101000/AUC5. Primary objective was tolerability. Descriptive secondary median survival8.75/7.97months and response41%/29% do not prove superiority or individual benefit; no unsupported hazard ratio or absolute survival gain supplied. Patient-facing evidence remains qualitative and contains no survival chart. Neoadjuvant CheckMate816 results were removed from the standalone patient content.

## Full-suite draft assets

Each authoring record has standalone lung patient content, two active agents,21-day chronology,6conditional passport groups, Day1 andDay8 support plans, clinician rationale/selection/monitoring/evidence, relative journey, logistics, anatomical risks and concise `patient_summary`. Nivolumab thyroid/cortisol/immune-card instructions and automatic surgery phases removed. Contacts remain fields for the local team; no phone number invented. Source provides no universal scan interval, so none is fabricated.

## Owner integration requirements

-00310 needs a lung-specific context guard: urothelial use must not receive a lung guide. Both records' neoadjuvant selection must route to the existing00849 backbone guide, retaining its immune rules and three-cycle duration.
-Use current shared phase/day supportive-care schema when integrating `phase_day_profiles`; draft entries express clinical day-specific mapping rather than assuming the owner’s renderer format.
-Re-run source cases with `--integrated` after owner acceptance. Proposed cases:147/147 pass. Full regression/browser/PDF/QR checks are the release owner's integration responsibilities.
