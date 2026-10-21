# T-DM1 retrospective source audit — v0.84.14

Checked 21 October 2026 against official NCCP documents and EMA product information. Base commit: `b96d39271fa8d179554f69fa29b85092849d7762`. These are software/source checks; clinical and oncology-pharmacy authorisation remains false.

## Findings requiring implementation

**00206:** Starting LVEF entered as `lvef_percent` escaped the separate `baseline_lvef_percent` eligibility rule. Missing assessment stage also allowed a continuation interpretation. The proposal gates historical baseline data, assesses the current starting value, and requests stage where interpretation differs. A platelet result of 50–74 with unknown previous hold needs explicit history. Existing output already requested generic context in that case; the proposal supplies the specific reason. Remove the irrelevant SC hyaluronidase sentence from allergy advice.

**00659:** Add clinically significant cardiac disease and gross residual/recurrent disease exclusions, full postoperative eligibility confirmation, overdue cardiac monitoring, and the missing DILI causality/permanent-stop branch. Missing stage with grade-2 neuropathy and grade-2 heart failure without LVEF need specific contextual review. Current bilirubin stopping already prevented dosing for the DILI combination, but did not identify permanence.

**Both:** Separate severe infusion reactions, life-threatening reactions and confirmed true hypersensitivity. Include previous permanent trastuzumab cessation for a reaction. EMA starting laboratory evidence limits should prompt review, rather than inventing absolute NCCP contraindications. Proposed fields are optional; unrelated single-value assessments remain possible.

## Source distinctions retained

Metastatic and adjuvant platelet, liver and cardiac tables are intentionally different. Existing thresholds largely matched. Preserve the metastatic printed bilirubin discrepancy and blocking reconciliation rather than silently substituting a source. Do not add an unsupported ANC cutoff. Retain the distinction between drug-related ILD and adjuvant radiation pneumonitis.

## Patient and longitudinal corrections

The metastatic journey contains copied early-breast, SC blood-test and plain-trastuzumab endocrine wording. Replace those passages with T-DM1-specific content. Both pathways require baseline blood/renal/liver and heart assessment, blood tests each cycle, and 12-week cardiac assessment. Show illustrative uninterrupted cycles 5, 9 and 13 while preserving actual elapsed-time due dates, including after treatment switches. Earlier testing depends on symptoms/results. NCCP does not prescribe a universal CT calendar. The adjuvant pathway has 14 postoperative cycles and a source initiation window; the metastatic course has no fixed 14-cycle endpoint. A generic low-count/infection timeline should foreground T-DM1 platelet/bleeding monitoring without inventing a symptom-free interval.

## Files and verification

- `proposed-corrections.json`: optional inputs, replacement/additional rules and text correction; application files were not edited by this audit.
- `source-audit.json`: official source URLs, versions, page map and baseline hashes.
- `source-cases.cjs`: 122 independently specified real assessment-engine cases, plus checks that blocked treatment does not print a numerical restart dose.
- `baseline-acceptance-results.json`: 95/122 pass against the original application. The 27 differences include unsupported new fields and clarification improvements; they are not 27 distinct unsafe clinical rules.
- `proposal-acceptance-results.json`: 122/122 pass against an in-memory application of the proposed changes.

Run the script without `--proposal` after integration to check actual application files. The final release must record that result separately from the in-memory proposal check. Routine partial results can remain cautious or request context; these are not a universal permission to prescribe.

## Official sources

- NCCP 00206 v5: https://healthservice.hse.ie/documents/6547/206_Trastuzumab_Emtansine_21days.pdf
- NCCP 00659 v2: https://healthservice.hse.ie/documents/6680/659_v2_Trastuzumab_Emtansine_EBC_21days.pdf
- EMA Kadcyla SmPC: https://www.ema.europa.eu/en/documents/product-information/kadcyla-epar-product-information_en.pdf

Web PDF text was reviewed. Screenshot requests returned source references, but no locally inspected original PDF image or original binary checksum is claimed.
