# Historical source comparison for the proposed five repeat audits

**Current-source audit status: BLOCKED.** Live NCCP retrieval is denied by the environment network policy. This comparison uses retained official PDFs retrieved on 25 October 2026 and the current encoded protocols. It does not establish that those PDFs are still current, complete a new NCCP audit, authorize clinical use, or replace independent clinical/pharmacy review. No clinical files were edited.

## Retained source provenance

| Code | Retained NCCP version | Pages | SHA-256 |
| --- | --- | --- | --- |
| 00207 | 6 | 5 | `06bbdf5a1d097665e64f61c3c7ef88f0ef957afdd7726b4924bfb3a293c623b9` |
| 00225 | 6 | 4 | `d4689a2963ebdb49bce726e38fdfee7241e50c90d787ba08032d5c00bcf2eddf` |
| 00328 | 7 | 10 | `78b2244839885f97731178aa53d9c94ec8d5e0130e2b48ccd0983c8b362d2703` |
| 00330 | 6 | 6 | `073773262f77d12f13dedff2b1eaa541dee86a18e829a13a97fa9e2cdd3911c1` |
| 00331 | 7 | 7 | `5de527e0e0dccf9cf0f74dcb3efdc10f8b205f7e4341ae1e71a941d089e25117` |

00207 PDF/text and source manifest: `validation/breast-completion-v08421/source-schedule/research/00207.pdf`, adjacent `.txt`, and `source-schedule/sources.json`. The other four are in `validation/breast-completion-v08421/gi-retro/research/`, with provenance in `gi-retro/sources.json`. All actual retained PDF hashes match those manifests. Stable protocol IDs may contain an older version; the source version above comes from the PDF and current metadata, not the identifier suffix.

## 00207 cetuximab monotherapy: limited comparison

Inspected indications and eligibility on pages 1–2 and organ/adverse-event Tables 1–2 on page 3. ECOG 0–3 and colorectal-only RAS restrictions are represented; head/neck RAS does not control the radiotherapy indication. The source's severe-skin recurrence sequence is encoded as hold at grade ≥3, restart after documented recovery within the two-week window at 250/200/150 mg/m² for first/second/third occurrences, and discontinue on the fourth occurrence. Infusion grade 1/2 actions, grade 3/4 permanent stopping and confirmed ILD stopping match the inspected source. Renal, hepatic and dialysis flags do not introduce a fabricated dose reduction where Table 1 expects none.

No substantiated numerical mismatch was found within this inspected scope. The source says recovery “to grade 2”; code accepts grade 2 or lower. The boundary comparison exercised grade 2 and did not attempt to establish a new interpretation of every possible clinical state.

## 00225 panitumumab monotherapy: limited comparison

Inspected page 1 eligibility, page 2 Tables 1–2 and page 3 Table 3. Encoded ECOG >2 review, mutant/unknown RAS exclusion, grade ≥3 skin hold, one/two-dose withholding, restart below grade 3, original-dose percentages 100/80/60, fourth-episode stopping, failed recovery, infusion severity, ILD and ulcerative-keratitis actions match the selected historical conditions. Organ-function instructions preserve the source's no-expected-adjustment statements.

The two monotherapy protocols passed **61 historical-source software comparisons**, including boundary, recurrence, explicit history/recovery and component-dose checks. Results are in [historical-mono-cases.json](historical-mono-cases.json). This is software evidence about selected retained-source expectations, not a current-source clinical pass.

Coverage item for review: the 00225 prior-treatment requirement (failure of fluoropyrimidine, oxaliplatin and irinotecan) is present in indication text but has no dedicated structured confirmation field/rule. This is an eligibility-coverage question, not a proven numerical-threshold discrepancy. Both monotherapy sources say “adequate marrow reserve” without numeric ANC/platelet limits; do not borrow chemotherapy thresholds or infer omitted results are normal. The source's post-treatment monthly electrolyte monitoring is retained elsewhere in supportive-care/patient content despite generic top-level monitoring strings.

## 00328, 00330 and 00331 findings

The [companion irinotecan comparison](historical-irinotecan-review.md) records exact excerpts, code paths, boundary cases and limitations. Its findings must remain labelled historical until live sources can be checked:

- **00328 component-hold gap:** retained v7 page 5 Table 5 calls for FOLFIRI delay for current diarrhoea ≥grade 2. Current engine inputs `{diarrhoea_grade: 2, toxicity_delay_weeks: 1}` (also grade 3) yield an irinotecan-only `DIARRHOEA_NOT_RESOLVED` component action, omitting the fluorouracil hold from the component rows. The two-week stop does target the whole FOLFIRI group. This is a substantiated discrepancy against the retained source, requiring current-source confirmation before clinical changes.
- **00330/00331 extra-restriction/source-traceability question:** retained page 3 Table 3 describes restart after recovery to diarrhoea grade ≤2, whereas current JSON requires grade 0 and holds at grade ≥1, citing page 5. This may reflect a conservative supplementary requirement whose current basis is not established here. Do not relax safeguards automatically; verify current NCCP/SmPC sources and the attribution.
- Existing historical regression scenarios can pass while missing these component-level questions. A passing global action does not prove every implicated drug receives the correct action.

## Required continuation

Re-fetch the official catalogue and each exact linked PDF, record current versions and hashes, resolve supplementary-source conflicts, then add independently source-derived component and boundary cases before updating clinical and patient material. Preserve this report as incomplete work on the development branch while current-source access is blocked.
