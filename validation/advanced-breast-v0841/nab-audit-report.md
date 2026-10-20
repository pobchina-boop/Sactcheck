# Nab-paclitaxel source reconciliation — v0.84.1

Checked 18 October 2026. This is software/source reconciliation with independent clinical and oncology-pharmacy approval still outstanding. It is not permission to prescribe or an assertion of clinical validation.

## Source record

| NCCP code | Source checked in full | Version / pages | SHA-256 |
|---|---|---|---|
| 00230 | https://healthservice.hse.ie/documents/6565/230_v7_nab-PACLitaxel.pdf | v7, 5 pages; revised 1 April 2025 | `e7a14511b2b851244f4222de830a0a827e713a4ce75f381a92842581d1f66052` |
| 00736 | https://healthservice.hse.ie/documents/6619/736_v2_nab-PACLitaxel_weekly.pdf | v2, 6 pages; revised 13 March 2024 | `a6ddffeb61df539d4555bd1625b7f3c743e191ce43d29f5c3f7c85906c94c3aa` |

PDFs and full text were downloaded, and pages 2–3 of both PDFs were rendered and visually inspected to verify table operators, doses and column alignment. Protocol identities remain `nccp-00230-v7` and `nccp-00736-v2`. Public authoritative PDFs were also opened through the research tool. No source date was inferred from a filename alone.

## Audit findings and corrections

| Finding in incoming implementation | Correction | Evidence |
|---|---|---|
| Weekly 00736 copied q21d cytopenia/FN restart doses of 220 and 180 mg/m², exceeding its own 100 mg/m² starting dose | Removed copied recommendations; weekly ladder is 100 → 80 → 60 mg/m², relative to the current prescribed dose. Below the final published level requires review | 00736 p1, p2 Tables 1–2 |
| Weekly count logic copied the q21d ANC1.5/platelets100 table without explaining the actual weekly source | Encoded weekly low-count, mixed-band and overlapping-boundary review, with day/cycle distinction and the separate subsequent-cycle wording | 00736 p2 Table2 and p4 |
| Missing weekly hepatic bilirubin/AST limits and severe-impairment exclusion | Independent bilirubin >5×ULN or AST >10×ULN exclusion; severe category is withheld pending clarification of the internal source conflict | 00736 p1/p3/p4 |
| q21d grade2 caution and weekly grade2 exclusion were conflated | q21d grade2 triggers caution/review without categorical hold; weekly grade2 withheld for baseline-versus-recovery clarification | 00230 p1; 00736 p1/p3 |
| Neuropathy occurrence, resolved event and current dose insufficiently represented | Current grade, highest prior event grade, occurrence and current dose support holds and post-recovery reference doses; first grade4 event is included; second grade4 retains the source alternatives | Both p3 Table4 |
| Second grade4 event hard-coded to discontinue although source offers a choice | Explicit hold and consultant choice between discontinuation and post-recovery reduction, with no numeric restart selected automatically | Both p3 Table4 |
| Dose-history omission could permit re-escalation | Missing/current lower dose blocks a numeric reduction; reference doses never increase an existing lower prescription; hepatic review blocks competing numeric dose tiles | Both p2/p3 reduction notes |
| 00230 two-cycle nonresponse stopping rule absent | Explicit no-response-after-two-completed-cycles input and discontinuation action; response milestone supplied for longitudinal content | 00230 p1 |
| Weekly indication reduced to a schedule description; off-label qualification missing; PDF length incorrectly5 pages | Exact metastatic indication, standard-formulation unsuitability context, six-page source and explicit off-label consent/governance review | 00736 p1/p6 |
| Source-specific monitoring/premedication absent from metadata | Exact baseline and cycle bloods, weekly Day8 FBC, conditional cardiac assessment and no routine allergy premedication recorded | Both p2; 00230 p4; 00736 p3 |

## Source uncertainties intentionally left for review

1. **00736 counts:** Table2 gives ANC ≥1.0 and platelets ≥75 as a full-dose row; p4 says subsequent cycles should wait for ANC >1.5 and platelets >100. Day1 or unspecified day in this disagreement range is withheld pending clarification. The lower weekly thresholds are not silently used to clear a new cycle.
2. **00736 table coverage:** Its intermediate row uses **AND** (ANC0.5–1.0 and platelets50–75), leaving mixed bands unassigned. Exact ANC1.0 and platelets75 overlap the full-dose row. The app holds for review rather than inventing a restart dose.
3. **00736 liver:** p1 excludes severe hepatic impairment; Table3 suggests approximately80% for moderate/severe. The severe category is not cleared for an automatic reduced dose. Strict bilirubin >5×ULN and AST >10×ULN exclusions remain independently actionable.
4. **00736 neuropathy:** p1 excludes grade≥2, while Table4 allows post-hold recovery to grade≤2. Recovered grade2 needs explicit clinical review. Clearly recovered grade≤1 can enter the documented dose-history pathway.
5. **00230 unit:** The ANC1–1.49 Table1 row literally prints220mg without `/m²`. This remains a visible pharmacy clarification, not a silently repaired number.
6. **Both neuropathy:** Second grade4 presents discontinuation OR a further post-recovery reduction. The app cannot select the clinical option. Later occurrences or a dose below the published ladder likewise remain review actions.
7. **Hepatic reduction:** Approximately80% is a source reference, not a rounded prescription. Original/current doses and competing toxicity reductions require reconciliation; no exact hepatic mg/m² dose is invented.

Safety prompts for pregnancy, infection and suspected serious adverse effects are distinguished from numeric NCCP dose tables. The q21d source delegates detailed adverse effects to current product information; these prompts do not claim a source-specific dosing algorithm.

## Content briefing for the full suite

### 00230 q21d

- Source indication00230a: adult metastatic breast cancer after failed first-line metastatic treatment when standard anthracycline-containing therapy is not indicated; ECOG0–2.
- Nab-paclitaxel260mg/m² IV over30minutes on Day1 every21days. Treatment continues until progression/unacceptable toxicity, **with response review after two cycles and discontinuation if no response**. Approximate six-week milestone is conditional on uninterrupted cycles; it is a response-review milestone, not a universally mandated CT booking.
- Baseline FBC, renal and liver profiles. Cardiac assessment such as ECG and echo/MUGA if significant cardiac history or prior anthracycline treatment. Repeat FBC/renal/liver before each cycle; repeat cardiac testing only when clinically indicated. Other imaging follows the individual plan; no fixed universal CT/tumour-marker/echo cadence is specified.
- Grade≥2 neuropathy is a caution; report sensory/motor changes promptly and assess functional impact. This is different from the weekly source exclusion.

### 00736 weekly

- Source indication00736a: metastatic breast cancer after anthracycline failure or when not a candidate for anthracycline therapy; intended for hypersensitivity to/unable to receive standard paclitaxel. It is an **off-label weekly regimen**; explain and document consent/local governance requirements.
- Nab-paclitaxel100mg/m² IV over30minutes on Days1,8,15 every28days. **Day22 is a break**, not a fourth weekly administration. Continue until progression/unacceptable toxicity.
- Baseline FBC/renal/liver; echo/MUGA if clinically indicated such as prior anthracycline/significant cardiac history. FBC/renal/liver before each cycle and **Day8 FBC** specifically in the source. Do not label routine Day15 bloods as an explicit NCCP requirement; local services may arrange additional checks. Cardiac repeat testing and response imaging are individual-plan events, not an invented universal schedule.
- Baseline grade≥2 neuropathy is excluded; during treatment explain current symptoms, holds and the source ambiguity at recovered grade2 to clinicians. Patient content should encourage early reporting rather than exposing dosing-table conflict mechanics.

### Shared agent-specific logistics

- Nab-paclitaxel is albumin-bound and **not interchangeable** with other paclitaxel formulations. Infusion uses a15μm filter; facilities for anaphylaxis management are required.
- **No routine allergy premedication is usually required** in these NCCP sources. Do not copy standard solvent-based paclitaxel steroid/antihistamine premedication. Low emetogenic risk and any locally prescribed antiemetic remain a separate issue.
- No home pump or planned pump-disconnection visit is inherent to either monotherapy. Venous access choice is individualized; a port is not mandatory for every patient.
- Agent-focused toxicity emphasis: peripheral neuropathy/function, cytopenia/infection, infusion reaction/extravasation, myalgia/arthralgia; targeted urgent evaluation of new respiratory or cardiac symptoms when relevant. Avoid implying every generic chemotherapy issue is equally likely.
- Neither protocol alone mandates concurrent radiotherapy. If radiotherapy is part of the individual metastatic treatment plan, its timing and hold decisions require explicit coordination; do not auto-populate a fixed concurrent timeline.

## Verification

`node validation/advanced-breast-v0841/nab-source-cases.cjs` passes **244/244** independently specified clinical/structural scenarios. Cases use the real assessment engine and displayed component-dose model, not merely JSON string matching. They cover count matrices, strict hepatic boundaries, missing inputs, all dose-history levels, no re-escalation, current and recovered neuropathy, source conflicts, immediate safety holds, off-label eligibility, schedule identity, monitoring and premedication differences.

`node tests/protocol-validator.test.js` passed381 protocol-publishing checks after edits; `node tests/breast-remediation-v0366.test.js` passed the existing weekly-regimen regression checks. Integration/release tests are the root task’s responsibility. No live clinical-use authorization is implied.
