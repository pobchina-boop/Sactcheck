# v0.84.40 — five shared ICI retrospective clinical audits

Baseline: `bffd2cda167d7943ce6431ff32d5a1525509f618` (v0.84.39). Current official sources retrieved 2026-11-06, including catalogue-linked full PDF bytes. All five match their prior recorded source bytes (00551 used legacy `source_sha256`). No new source version was substituted. These are repeat assessment audits supporting existing lung/CRC services, not newly completed melanoma services.

| Protocol | Current source | Pages | Audit finding |
|---|---|---:|---|
| 00455 | v16 | 10 | Structured restart assessment lacked recovery, required taper/management and consultant-confirmation gates. Added one explicit requested-restart hold; source endocrine exceptions and all existing numerical, recurrence and 12-week stop thresholds remain unchanged. |
| 00558 | v13 | 9 | Structured restart assessment lacked recovery, required taper/management and consultant-confirmation gates. Added one explicit requested-restart hold; source endocrine exceptions and all existing numerical, recurrence and 12-week stop thresholds remain unchanged. |
| 00483 | v13a | 12 | Grade 2–3 thyroid/pituitary hold rules ignored symptom status, including the existing controlled/asymptomatic field. Added explicit symptom gating and missing-context review; grade 4 stops unchanged. Restart check covered systemic corticosteroid dose but omitted another immunosuppressive treatment. Added the explicit source guard. |
| 00484 | v13a | 12 | Grade 2–3 thyroid/pituitary hold rules ignored symptom status, including the existing controlled/asymptomatic field. Added explicit symptom gating and missing-context review; grade 4 stops unchanged. Restart check covered systemic corticosteroid dose but omitted another immunosuppressive treatment. Added the explicit source guard. |
| 00551 | v7a | 13 | Suspected SJS/TEN had no executable cessation/referral pathway before confirmation; added discontinue/referral, retaining confirmed permanent stop. Maintenance switch interval text was not executable: added source 14/28-day early-dose guards and missing-timing review; first-maintenance and indication-specific formulation rules unchanged. |

## Source mechanism and clinical boundaries

- Pembrolizumab: Table 1 and dose-modification instructions (pp5–6) require event-specific recovery and clinician review. The added requested-restart guard does not turn a generic dose threshold into a universal restart rule, and preserves the controlled endocrine exception and existing 12-week permanent-stop criteria. Numeric hepatitis/nephritis actions remain clinically attributed; the historical creatinine field name remains stable but its actual measure is ULN, not baseline.
- Nivolumab monotherapy: pp6–8 distinguish symptomatic grade2–3 thyroid/pituitary events from asymptomatic hormone replacement and prohibit restart while other immunosuppressants are being given. Missing symptoms now visibly returns consultant_review, complete=false. Grade4 and organ-specific stops remain.
- Nivolumab3/ipilimumab1: p2 specifies later maintenance interval switches separately from first maintenance. Colorectal permitted formulations and first-dose21-day timing remain; RCC/melanoma initial21/42-day distinctions remain. Suspected SJS/TEN on p9 now stops treatment and triggers urgent specialist assessment; confirmed disease remains permanent stop.
- Do not import standalone nivolumab grade3 colitis hold into post-combination maintenance: 00551 p7 and p10 footnote preserve permanent discontinuation in both its combination and maintenance phases.

## Verification

New independent source-derived scenarios: **183/183 pass**, versus **119/183** in retained baseline. The 64 failing baseline scenarios demonstrate the bounded gaps; they are not 64 distinct defects. All newly added or modified rules have positive actual-engine witnesses. Five candidates pass strict schema validation with zero errors and zero warnings. Missing review-date metadata for00455/00551 was populated from current PDF footers.

Historical replays are reported separately:

- Pembrolizumab v08435:504 original cases pass;16 automatic empty-value probes for the added optional inputs also pass (520 total).
- Nivolumab monotherapy v08427:443 baseline cases pass. Candidate changes12 old grade-only assumptions. Supplying symptoms=true in the three original symptomatic thyroid/pituitary matrix inputs preserves all expected actions and produces443/443. The unmodified431/443 candidate result is retained, not hidden.
- Nivolumab/ipilimumab v08435:242/24200551 cases pass. The complete historical599-case script also passed;357 unrelated cases are not counted as newly audited cases.

`source-cases.cjs` exercises the actual assessment engine and component modification renderer; expected clinical actions were independently authored from source tables, not generated from protocol predicates. A test-drafting error initially expected grade3 colitis hold in00551 combination; re-reading the retained p7 source corrected the oracle to permanent stop in both phases before final runs. An initial VM replay wrapper had cross-realm assertion artefacts; the wrapper was corrected to execute in the same realm and final reports replace those harness failures.

## Preservation and handoff

Original indication identities, treatment/phases, monitoring, eligibility, exclusions and supportive-care structures are byte-equivalent at JSON-value level. Historical metadata is retained inside each new retrospective record; current clinical/validation audit releases are0.84.40. Existing stable protocol IDs are retained, even where their legacy version suffix differs from the current cited PDF.

`handoff.json` identifies bounded patient, knowledge and support wording additions and the exact legacy test update. Patient anatomy, three-page design and other assets were not edited by this subtask. The handoff does not imply that source amendments have already propagated through generated portals or PDFs.

## Limits

No independent clinical/pharmacy/PPI approval. No current re-audit of unrelated EMA/trial evidence supplements. No claim of exhaustive rule coverage or full browser/PDF/QR release verification. Parent integration and release checks remain necessary.

## Reproduction

Once placed under `validation/skin-v08440/retrospective-source-audit`, run `node source-cases.cjs`, `node source-cases.cjs --before`, `node validate-structure.cjs` and `node replay-historical.cjs`. For the staged candidates supply `SACTCHECK_REPO` and `SACTCHECK_PROTOCOL_ROOT`. Full hashes, inputs, findings, component actions, source-page citations and historical script hashes are retained in adjacent JSON reports.
