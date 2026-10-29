# Tepotinib NCCP 00823 — v0.84.25 source audit

Checked 29 October 2026 against the current official NCCP 00823 **version 2**, dated 12 September 2025, and EMA Tepmetko product information last updated **8 October 2026**. The protocol identity remains `nccp-00823-v2`; this is a rule/content reconciliation, not an NCCP version change. Independent Consultant, oncology-pharmacy and patient/PPI review remain pending. Clinical use is not authorised by this audit or its tests.

The original protocol had 12 inputs and 12 rules. The proposal has **37 optional inputs and 35 rules**. The proposed and integrated protocols each pass **354/354 source-derived software checks** through the real assessment engine and dose-schedule renderer. The real targeted patient templates also accept the authoring record and render the expected HTML outputs without undefined fields. Visual PDF and browser checks are owned by the release integrator and are not claimed here.

## Source and formulation findings

- NCCP 00823a and the current EU indication both require advanced MET exon 14 skipping NSCLC **after immunotherapy and/or platinum-based chemotherapy**. The validated biomarker, adult age, ECOG 0–2, absence of activating EGFR/ALK alterations and exclusion of active CNS metastases are now explicit. First-line or adjuvant treatment has not been added from broader trial recruitment.
- The usual prescribed dose is **450 mg active tepotinib**, given as two 225 mg tablets daily with food. VISION's **500 mg salt dose corresponds to 450 mg active moiety**; it is not a competing tablet dose.
- The only source reduction level is **225 mg daily**. There is no supported repeated halving to 112.5 mg, automatic escalation back to 450 mg, fixed course length or invented 21/28-day cycle.
- The tablets are continuous while clinical benefit is observed. The missed-dose boundary is the next dose being **within 8 hours**; the source does not provide a replacement-dose algorithm for vomiting, so patient material directs pharmacy advice without doubling.
- NCCP v2's new caution section includes ILD and QTc risk. The current SmPC additionally explains creatinine transporter effects and specific P-gp/BCRP/metformin interactions. It does not justify a generic prohibition on all CYP3A inhibitors, enzyme inducers or acid-suppressing medicines.

## Clinically meaningful rule changes

| Domain | Source requirement and encoded handling |
| --- | --- |
| Suspected ILD | Withhold at **any grade** and investigate. A clinical grade does not prove diagnosis. |
| Confirmed ILD | Permanently discontinue at **any grade**. Confirmed disease is not erased by a false suspicion flag or a normal grade alias. |
| Isolated ALT/AST >5 to ≤20 ×ULN | Withhold and determine bilirubin/cause. For the isolated enzyme event, wait for return to the patient's baseline; recovery **within 7 days** allows the same dose, later recovery uses the source reduced level. Restart remains an authorised clinical decision. |
| Isolated ALT/AST >20 ×ULN | Permanent stopping is encoded only with bilirubin not raised. If bilirubin is raised, contradictory or missing, retain an urgent hold and establish the appropriate pathway. |
| Combined liver event | ALT/AST **>3 ×ULN** plus bilirubin **>2 ×ULN**, **with cholestasis and haemolysis excluded**, triggers permanent stopping. Unknown or present alternative causes do not silently satisfy that qualifier; the output holds and requires review. |
| Other grade ≥3 reactions | Source pathway is reduction to 225 mg until grade ≤2, with a temporary interruption of **no more than 21 days** also available for Consultant consideration. The old universal withholding text was inaccurate. Grade 4 does not acquire an invented automatic permanent-stop rule. |
| Already at 225 mg | Grade ≥3 toxicity prompts explicit Consultant/pharmacy review; no lower dose is inferred. |
| Interruption >21 days | Explicit review of the source limit; no invented day-22 permanent-stop or restart rule. |
| Severe renal impairment / dialysis | NCCP expects no dose adjustment at CrCl <30 mL/min or on haemodialysis; current EMA SmPC says severe renal use is **not recommended because unstudied**. Both statements are shown and a specialist plan is required. Normal numeric/band aliases cannot erase independent dialysis or severe renal evidence. |
| Child–Pugh C | Not recommended, requiring specialist review; this is distinguished from a formal hypersensitivity contraindication. |
| Creatinine rise | Assess further to distinguish a tubular secretion effect from true kidney impairment; neither is assumed. |
| QT and interactions | ECG/electrolyte and medication review as indicated. No tepotinib-specific numeric QT hold threshold is invented. P-gp narrow-index substrates, BCRP substrates and metformin have their own review prompts. |

All rule actions name the **tepotinib** component and carry the relevant NCCP/SmPC page or section. No unresolved source conflict or restart choice calculates a dose. Concurrent findings remain visible; confirmed ILD or a qualified permanent liver stop dominates lower-priority dose/review pathways.

## Compatibility and historical-validator migration

All 12 original input IDs remain present and optional. Every default is blank (`null` in the proposal, normalised to `''` during integration). Missing clinical data is not treated as normal.

The existing renal select uses `decision_value`: `ge30 → 0`, `lt30 → 1`, `dialysis → 2`. The new `RENAL_SOURCE_CONFLICT` rule deliberately tests normalised values 1/2 as well as the numeric CrCl threshold. This was verified through the assessment engine, not just direct rule inspection.

Retained historical organ-function IDs:

- `OF590_00823_TEPO_CHILD_C`: action is now `consultant_review`, preserving the source's not-recommended language without claiming a formal contraindication.
- `OF590_00823_TEPO_LFT_STOP`: now requires the absent-cholestasis/haemolysis qualifier.
- `OF590_00823_TEPO_ALT20`: now requires the isolated-enzyme context without raised bilirubin.
- `OF590_00823_TEPO_ALT5`: preserves immediate withholding for the source >5–20 interval while making bilirubin and restart requirements explicit.

Removed `TARGET_PNEUMONITIS_G2` (unsafe conflation of suspicion, severity and confirmation) and duplicate generic `TARGET_HEPATITIS`. `TARGET_DIARRHOEA_G3`, `TARGET_RASH_G3` and `TEPOTINIB_OEDEMA_G3` are retained with the source's reduction/optional-interruption pathway. New rule IDs are listed in the proposed JSON and result files.

`metadata.organ_function_reconciliation` is dated v0.84.25 with resolution `source_conflict_explicit_specialist_review`. `metadata.targeted_lung_reconciliation` documents the source-version stability, current SmPC update and unresolved differences. Review flags remain false.

Neither the NCCP adverse-event table nor the current SmPC names a CTCAE edition. The prior blanket `ctcae_version: 5.0` labels have been removed. The grade prompts use the SmPC's generic severity language and require the clinically assessed term and local grading standard. The oedema grade-4 prompt explicitly avoids claiming that CTCAE peripheral oedema has a grade-4 category.

## Evidence, monitoring and patient services

The clinician evidence card uses the **previously treated VISION subgroup (n=149)**: confirmed independent-review response **45.0%** and median duration of response **12.6 months**, from the peer-reviewed 2023 long-term report and current EMA Table 3 (cutoff 20 November 2022). There is **no randomised comparator** and no claimed comparative overall-survival benefit. Duration of response applies to responders, not everyone receiving treatment.

The newer 2025 ≥3-year follow-up treatment-sequencing abstract and the 2026 ASCO long-responder subset abstract were checked and labelled as conference abstracts. First-line outcomes, Asian-only outcomes and a subset selected for long responses are not presented as the expected outcome for a new NCCP 00823a patient. The 2025 abstract retains the previously treated response rate of 45.0%. The ELCC 81P full-text endpoint returned 403; no unverified figures from that inaccessible page were added. Patient-facing evidence uses plain-language rationale with an empty quantitative metrics array.

The full authoring record includes clinician rationale/selection, evidence, consent profile, patient reference, body-map labels, guide/passport/card content, practical logistics, date-free chronology, whole-treatment journey and baseline/ongoing monitoring. Blood count, electrolytes and renal/liver profiles are baseline and regular checks; ECG and pregnancy tests are used when indicated. No universal weekly or monthly cadence has been invented.

Support is separated from anticancer dosing. NCCP 00823 page 3 supplies the minimal-to-low oral emetic category; NCCP V6 Table 5 supplies as-needed oral antiemetic options. NCIS V8 is identified as parenteral guidance. No routine infusion antiemetic prescription is copied into the tablet plan. Diarrhoea support, oedema review, medicine interactions, one-week post-treatment contraception and breastfeeding precautions are included, with local individual prescription confirmation.

## Verification and provenance files

- `proposed/00823-tepotinib-therapy.json`
- `proposed/tepotinib-consent-profile.json`
- `authoring.json`
- `sources.json`
- `source-cases.cjs`, `source-results.json`, `integrated-results.json`
- `build-proposal.py` (reproducible bounded proposal authoring; writes only this directory)
- `research/nccp.pdf`, `nccp.txt`, `nccp-table.png`
- `research/smpc.pdf`, `smpc.txt`, `smpc-table.png`

Critical source tables on NCCP page 3 and EMA page 3 were rendered locally and visually inspected, including all inequality signs and liver qualifiers. Source PDF/text hashes are recorded in `sources.json`; externally authored research snapshots should be excluded from the release overlay.

Validation commands, both passing 354 checks:

```text
node validation/targeted-lung-v08425/tepotinib/source-cases.cjs
node validation/targeted-lung-v08425/tepotinib/source-cases.cjs --integrated
```

Remaining independent review: Consultant assessment of the renal discrepancy and conservative unresolved-liver holds; oncology-pharmacy review of dose/restart, interaction and supportive plans; patient/PPI review of wording and usable printed documents. Software passes are not substitutes for those reviews.
