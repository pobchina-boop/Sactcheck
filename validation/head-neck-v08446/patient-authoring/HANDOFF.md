# v0.84.46 head and neck patient proposals and integration

Five new indication-specific routes: `00261/head_neck`, `00483/head_neck`, `00484/head_neck`, `00455/head_neck`, `00558/head_neck`. No new NCCP protocol is created by these patient services.

## Clinical distinctions retained

- 00261: AUC5 every21days for3cycles with concurrent radiotherapy when cisplatin is unsuitable. No inferred radiation dose/calendar and no automatic borrowing of the cisplatin same-day hold rule. The separate radiation plan and consent remain explicit.
- 00483: nivolumab240mg IV/30minutes OR600mg SC/3–5minutes every14days.
- 00484: nivolumab480mg IV/60minutes OR1200mg SC/3–5minutes every28days. The30-minute GEJ exception is not reused for head/neck.
- Nivolumab HNSCC follows platinum progression/recurrence within6months and lack of curative local options. The NSCLC cycle8/4 progression milestone is not assigned to head/neck. Response assessment is individualised. Thyroid monthly for00483, but before each cycle and when clinically indicated for00484; immune follow-up at least5months; contraception at least5months.
- 00455/00558: pembrolizumab200/400mg IV/30minutes every21/42days, first-line recurrent/metastatic HNSCC with PD-L1CPS≥1. Nasopharyngeal disease and progression within6months after curatively intended systemic therapy are explicitly outside this indication. Do not substitute the lung TPS threshold. Thyroid remains every3–6weeks; the6-week drug interval does not remove due checks.24-month stopping is an individual consideration, not mandatory. Contraception at least4months.
- Carboplatin current Irish HPRA product information retrieved9Nov2026, SHA256`ba2e29c3b2d118a90401bb7c1c02de86f0e4d5e23f5efbdd63fed7966a6feab2`, retained by parent under`../batch46-work/sources/00261-hpra.pdf`. It supports the preserved6-month contraception advice for women/3months for men and breastfeeding restriction.

## Content and attribution

Ten deep chapters per route have distinct purposes. The rich body illustration is retained through the existing anatomical renderer. Carboplatin has8anchors; immune profiles9, including separate skin/muscle/eye warnings. The compact pack is separate from the full handbook. Carboplatin has3record boxes; immune cards are rolling records without a fixed course count.

Current official NCCP PDFs were supplied by the root under`../batch46-work/sources/`; manifest records exact source hashes. NCI head/neck, oral complications and nutrition pages were retrieved9Nov2026. Text was independently authored. CheckMate141 and KEYNOTE-048 primary reports were verified; qualitative evidence and schedule/formulation applicability are explicit, with no borrowed numerical benefit estimate. Supplementary EMA medicine links retain their existing checked dates and were not separately re-audited by this authoring task.

## Integration

`integrate.py --apply` writes only new patient-context JSON, presentation routes, journey definitions and context phase-support plans. It was run after the final schema corrections. `--kb-base` is optional and must contain the reviewed complete parent knowledge profiles. Without it, KB remains deliberately untouched. The release owner must merge the **current**`clinician-profile-proposals.json` head_neck rows, retaining every existing context. Standalone consent is generated from the patient profile;`consent-proposals.json` additionally records discussion/material risks and review status.

Root permitted integration and scoped HTML generation. `build-breast-journeys.cjs`, `build-patient-knowledge.cjs`, `build-complete-pathways.cjs`, and `build-phase-support-v0838.cjs` ran with the five-code head_neck scope. Final log is`../batch46-work/generate-new-patient-final.log`. No protocol rules, shared generator source, release metadata or remote Git were changed by this authoring task.

## Verification and limitations

`check.cjs` passes source references, actual KB/evidence/pack/anatomy markup, ten chapters, passport symptom keys, monitoring records, journey schema and context-contamination assertions. It now checks structured questions and chronology entries, because successful generation alone initially missed undefined visible text. After fixing and regenerating, all40HTML documents passed visible-text and disease-contamination checks in`html-check-results.json`.

The release owner/PDF agent owns PDF pagination, readable type, complete handbook consolidation, source-retention proofs, image/PDF QR decoding, print dimensions, browser interaction, current-route HTTP checks and whole release regression. These are not claimed as completed by authoring checks. Independent clinical, pharmacy and patient/PPI review remains pending.

## 00484 thyroid timing correction

Root browser review caught that the initial new00484context had incorrectly borrowed00483monthly thyroid timing. NCCP00484v13ap6 requires thyroid tests before each cycle and when clinically indicated. `fix-00484-thyroid.py` corrected the isolated proposals plus only the active00484head_neckprofile/journey, preserving visual_release0.84.46. The authoring script now reproduces the correction; `check.cjs` asserts00484each-cycle versus00483monthly. Scoped00484HTML generators were rerun and eight outputs inspected for visible text; report:`00484-thyroid-correction-check.json`. Root must merge the latest corrected00484clinician context; active KB parents were not overwritten.
