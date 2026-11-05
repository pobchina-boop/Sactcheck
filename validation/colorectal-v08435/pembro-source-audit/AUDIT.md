# Pembrolizumab colorectal source audit — v0.84.35

Checked 5 November 2026. Current official NCCP 00455 v16 and 00558 v13 PDFs were downloaded successfully and their hashes match the retained 29 October source bytes. A current EMA Keytruda product-information PDF was also downloaded. Exact URLs, hashes and retrieval dates are in sources.json. NCCP Table 1 page 6 was rendered and visually inspected for the merged endocrine/hepatic cells and footnotes.

## Findings and corrections

The existing 50-rule protocols had substantial immune-toxicity, organ-function, duration and non-colorectal indication coverage. The CRC indication was selectable and ECOG 0–2 was assessed, but there were no executable checks for adult eligibility, metastatic disease, first-line treatment, histological confirmation, validated MSI/MMR testing, or the actual MSI-H/dMMR result.

Six CRC-specific decision rules were added to each protocol. They activate only for the existing CRC selection: local 00455a (official NCCP 00455k) and 00558k. Stable IDs and all other indication rows are preserved. Explicitly unmet criteria or MSS/pMMR/unknown biomarker results require consultant review; omissions remain unassessed. MSI-H OR dMMR is accepted at the biomarker-domain level, without requiring both. PD-L1 cannot substitute for MSI/MMR. No result grants complete treatment clearance.

The six inputs are displayed and required only in the selected CRC context. Each has explicit input_role, demo_value and source metadata. This prevents irrelevant CRC questions affecting the lung, melanoma and other services.

All 50 pre-existing rule objects, treatment phases and indication rows are checked for exact equality against the pre-audit snapshots. No existing immune-toxicity threshold, grade attribution, non-colorectal eligibility, duration or action was changed.

## Source distinctions retained

- NCCP CRC scope is adult **first-line metastatic MSI-H or dMMR CRC**, ECOG 0–2, with histology and validated testing (pp1,4).
- EMA also licenses a previously treated CRC setting after fluoropyrimidine-based combination treatment. That broader licence does not establish local eligibility or reimbursement under these NCCP entries. The new first-line guard states the distinction explicitly.
- 00455 is 200 mg IV over 30 minutes every 21 days; 00558 is 400 mg IV over 30 minutes every 42 days. There is no dose reduction pathway.
- At 24 months, sustained response without progression permits considering discontinuation; this is not a mandatory cap. The 12-month adjuvant limit belongs to specified non-CRC indications.
- Baseline FBC, renal/liver profile, glucose and thyroid tests; FBC, renal/liver profile and glucose before each cycle; thyroid testing every 3–6 weeks; cortisol when clinically indicated. The 42-day regimen does not change the thyroid interval. Imaging follows the individual consultant plan: no fixed national scan interval is invented.
- Current Table 1 explicitly names NCI-CTCAE v4. The actual source-specific edition is retained.
- Creatinine nephritis thresholds use **ULN**, not fold-change from baseline. Immune hepatitis/nephritis actions require assessed immune attribution; unclassified abnormal values remain review pathways. Stable chronic impairment is separate and does not override toxicity holds.
- Endocrine continuation exceptions, 12-week recovery/steroid criteria, recurrent pneumonitis/colitis, SJS/TEN and serious cardiac/neurological effects remain distinct.
- Minimal emetogenic risk, no routine premedication, contraception for four months after the last dose, and possible immune events after cessation are communicated to the patient-content owner.

## Verification

- **504/504** new actual-engine scenarios pass. They include blank/null inputs, CRC criterion failures and omission handling, MSI-H versus dMMR versus MSS/unknown, PD-L1 non-substitution, other-context isolation, ECOG and duration boundaries, hepatic/renal attribution and thresholds, immune-toxicity grades, endocrine exceptions and competing stop/review actions.
- On the pre-audit protocols, **486/504** pass and **18 fail**, specifically exposing the missing CRC eligibility responses. Eighteen failing cases are not eighteen independent defects.
- Retained source regressions pass: v0.84.22 **233/233**, v0.84.26 **277/277**, v0.84.27 **444/444**. These retained results are separate from the 504 new scenarios.
- **382** protocol publishing/schema tests pass. Deep-system remediation checks pass without weakening assertions.
- criteria-matrix.json maps the 112 current executable rules and 16 manual/service obligations to their sources; not every manual responsibility is claimed as automated.

These are source reconciliation and software checks, not independent oncology, oncology-pharmacy or patient/PPI approval. Patient HTML/PDF integration and browser validation are handled by the parent release task. No commit, push or deployment was performed.

## Subsequent content consistency review

ASSET-CONSISTENCY.md records the independent source-to-content review of the two newly authored colorectal patient profiles, CRC knowledge contexts and phase support. It identified and coordinated corrections to the 00558 passport interval, during/after thyroid wording, generic dose-reduction language, explicit CRC selection and shared infusion-interval wording. The CRC knowledge context also retains the clinical engine's important ULN, immune-attribution and endocrine distinctions. This content review is separate from the 504 actual-engine scenarios and does not claim rendered artifact validation.

## Reproduction

Run `node validation/colorectal-v08435/pembro-source-audit/source-cases.cjs`. Add `--before` to exercise the archived pre-audit protocols; a nonzero exit is expected for that comparison. Existing regression commands are recorded in audit-summary.json and the retained logs. The authoring script is for these explicit six CRC additions only; do not rerun it over subsequent clinical changes without review.
