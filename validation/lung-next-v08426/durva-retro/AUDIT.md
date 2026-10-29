# Durvalumab retrospective full-suite audit — v0.84.26

Checked 29 October 2026. Scope: NCCP 00576 v5 (10 mg/kg every 14 days) and 00655 v3a (1500 mg every 28 days). Fresh original NCCP and EMA PDFs downloaded; NCCP/SmPC hashes match the previous audit. No source-version change. The older printed review date on 00576 is retained, not relabelled as a new version. Independent clinical, oncology pharmacy and clinical-use approval remain false.

## Clinically meaningful correction

NCCP Table 1 page 3 and footnote b page 6 specify that AST/ALT >3×ULN with bilirubin >2×ULN requires permanent discontinuation absent an alternative cause; where an alternative cause is confirmed, apply AST/ALT recommendations without the concurrent bilirubin elevation. The existing independent bilirubin rules incorrectly overrode this exception when bilirubin exceeded 3×ULN.

Both proposals qualify the standalone bilirubin branches. For the combined pattern, unknown attribution holds for investigation; a clinician-confirmed alternative cause invokes transaminase-only recommendations. ALT/AST >3 through ≤10×ULN holds; >10×ULN permanently stops. The exact boundaries of 3, 10, 2 and 3×ULN are tested. Isolated bilirubin >1.5 through ≤3×ULN holds and >3×ULN stops; that behaviour remains available when ALT is missing or ≤3. Explicitly excluding an alternative cause still invokes the combined permanent stop. Independent myocarditis or other-organ stop rules are never suppressed. Laboratory values do not themselves establish immune attribution.

Existing rule IDs and field aliases are retained. No numeric dose-reduction ladder is added. All inputs stay optional; blank input remains incomplete. Rule counts: 00576 85 rules /77 inputs; 00655 87 rules /80 inputs.

## Full-suite authoring and evidence

Complete previous patient, clinician, consent-support, journey, selector, supportive-care and protocol-metadata authoring is retained for both codes, with release/check metadata refreshed. Source IDs resolve locally. Relative stages remain date-free, with baseline testing distinct from ongoing monitoring; patient evidence metrics remain empty.

Added explicitly supplemental 2023 PACIFIC-based expert imaging recommendations, with the consultant plan governing. Post-CRT imaging confirms suitability before durvalumab; chest/abdomen contrast CT, if suitable, is recommended every 3 months in year 1, at least every 6 months in year 2, and at least annually through years 3–5 when relapse intervention would be appropriate. Routine asymptomatic brain imaging is not recommended after staging. These are not NCCP-mandated intervals or automatic engine prerequisites.

The 2026 PACIFIC-R five-year observational report is recorded as qualitative clinician context. It has no randomised comparator and includes sequential CRT and PD-L1 <1% patients: it cannot expand these NCCP indications or replace PACIFIC's randomised efficacy evidence. Existing PACIFIC OS/PFS records retain their comparator/population limitations and now state the 11 January 2021 cutoff and post-CRT randomisation time origin. The q14 schedule was directly tested in PACIFIC; q28 uses pharmacokinetic bridging. No patient prognosis figures are added.

## Scope and retained source distinctions

Both protocols remain adult unresectable stage III NSCLC, PD-L1 ≥1%, no progression after definitive concurrent platinum CRT. The current EMA licence contains other indications; neither SCLC nor newer perioperative/metastatic settings are imported. Source ECOG 0–1, ≥2 concurrent platinum cycles, radiotherapy ≥60 Gy, and first-dose window within 42 days remain intact. Courses remain capped at 12 months/26 cycles for q14 and 12 months/13 cycles for q28. For weight ≤30 kg on q28, the source's separately prescribed weight-based alternatives remain a review/hold pathway, never an automatic schedule choice.

Restart remains consultant reviewed with recovery to grade ≤1, prednisone-equivalent ≤10 mg/day and the 12-week window; steroid taper generally lasts at least one month. Organ-specific permanent stops, controlled-endocrine exceptions, unresolved myositis at 30 days/respiratory insufficiency, and grade-4 nonimmune laboratory exceptions remain separate. CTCAE 4.03 source grading is preserved. No borrowed cytotoxic ANC/platelet thresholds or routine HER2-style cardiac schedule is introduced. Minimal-emetogenic support does not create routine cytotoxic antiemetics.

## Verification and handoff

`node validation/lung-next-v08426/durva-retro/source-cases.cjs`: **566/566 passed**, including all 408 existing checks and 158 additional hepatic attribution boundary, dose-renderer and full-suite checks. Tests use actual `js/assessment-engine`, strict protocol validation and `js/protocol-dose-schedule`. The combined-liver hold appears as a hold in rendered drug actions, not an unintended permanent stop. `--integrated` runs the same checks against canonical files after root integration.

Critical original NCCP pages were rendered and visually inspected: 00576 page 3; 00655 pages 3, 4 and 6. This checked merged transaminase cells, bilirubin boundaries, endocrine/renal rows, and footnote-b wording. Research PDFs/text and image evidence are under `research/`; URL/version/PDF/text hashes are in `sources.json`.

Only this assigned directory was edited. Canonical integration, PDF regeneration/layout, consent-generator output, patient portal/browser interaction and broad regression are root-owned pending checks. These source/software checks are not independent clinical approval. Particular independent review should confirm the footnote-b attribution gate, the source-versus-current-SmPC boundaries, optional supplemental imaging plan and patient material rendering.
