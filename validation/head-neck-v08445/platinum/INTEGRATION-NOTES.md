# NCCP 00385 and 00387: v0.84.45 source reconciliation

Source audit performed 7 November 2026 against freshly retrieved official NCCP PDFs. This packet contains proposals, not independent clinical/pharmacy approval. It does not establish publication or deployment.

## Source identity

| Regimen | NCCP version/date | Document/review | SHA-256 |
|---|---|---|---|
| Weekly cisplatin 40 mg/m² with RT, 00385 | 5, 25 October 2024 | 7 pages; review 25 October 2029 | `c733bb60880e32814b66aeffcd945202f552a873ec614498a7f5d9c5b9ac90f7` |
| Cisplatin 100 mg/m² with RT, 00387 | 5, 5 December 2025 | 4 pages; review 5 December 2030 | `a5a98482d4295de0de8174cdb9fa51c8475afa3046ae17a1257b8c6d24e7945f` |

Original URLs, resolved HSE asset URLs, timestamps, bytes and HTTP status are in `sources/manifest.json`. Initial Python requests without a browser User-Agent returned 403; ordinary requests with `User-Agent: Mozilla/5.0` and `Accept: application/pdf` succeeded and followed official redirects. No policy or authentication bypass was used. PDFs, extracted text and rendered table-page images are retained. Pages 3–4 of 00385 and 2–3 of 00387 were visually inspected, not only parsed as text.

## Findings and exact source basis

| Area | Baseline problem | Proposal and source |
|---|---|---|
| Weekly platelet threshold | Encoded hold only below 75; 75–99 was reported without restriction | 00385 p3 Table 1 requires delay below 100. ANC remains below 1. These are chemotherapy delays; no automatic instruction to cancel RT. |
| Three-weekly counts | Broad approximate numerical intervals and vague delay text | 00387 p2 Table 1 retains a 75% row for ANC 1–1.49 or platelets 75–99; delay below ANC1 or platelets75. It says delay chemoradiation; output explicitly requires radiation-oncology coordination. |
| Renal dose precision | Vague reduction/substitution text and, for 00387, unsupported 45–59/<45 bands | 00385 p4 and 00387 p2 Table 2: CrCl40–49 gives50% of original dose;50–59 gives75%;below40 not recommended. Exact numeric CrCl is visible. Old bands remain hidden compatibility inputs and ambiguous bands require review. |
| Dialysis | Folded into blanket contraindication | Both renal tables allow consideration of50% of original dose during haemodialysis. Output requires a specialist decision and provides no automatic prescription. |
| Fractional boundaries | Approximate cutoffs implied precision not printed in source | Preserve explicit source endpoints.49<CrCl<50 and59<CrCl<60 require review rather than silent rounding.00387 also reviews1.49<ANC<1.5 and99<platelets<100. These are labelled local boundary guards. |
| Neuropathy versus hearing | A single combined grade selected a generic review | Both Table3 rows distinguish peripheral neuropathy Grade2 (25% reduction) from Grade3–4 (omit). Significant hearing impairment/tinnitus is a separate source exclusion, without a graded percentage algorithm. Combined legacy input cannot select a definitive pathway. |
| Contraindications | Missing00385pregnancy/breastfeeding fields;00387fields were nonactionable context | Pregnancy, breastfeeding, cisplatin/excipient hypersensitivity and significant hearing impairment/tinnitus independently trigger the source exclusion. |
| Baseline renal suitability | Weekly exclusion and three-weekly caution were not distinguished | 00385 p2 lists pre-existing renal impairment as an exclusion.00387 p2 lists it as a caution. Weekly pretreatment exclusion is separate from treatment-related renal adjustment; missing assessment phase is reviewed. |
| Radiotherapy coordination | No executable cancellation path | 00385 p2 and00387 p1 require cisplatin on an RT day, followed by RT. RT cancellation means cisplatin waits until RT resumes. |
| Generic febrile-neutropenia rule | Claimed source-directed reduction/G-CSF without a source row | Retain acute clinical hold/review, remove invented subsequent-reduction/G-CSF instruction. Label local acute-safety guard separately from NCCP source-table rules. Severe other toxicity and infusion-reaction review are similarly labelled. |
| Recovery/dose history | Current normal values could hide prior omissions or unknown dose history | Explicit local guards require recovery and known current dose/history before restart; prior Grade3–4neuropathy omission remains visible. The source gives no automatic rechallenge, repeated-reduction, combination or re-escalation formula. |
| Simultaneous adjustments | Independent rows could be mistaken for a combined dose formula | Numeric renal plus Grade2neuropathy, and00387count-plus-organ pathways, trigger Consultant/pharmacy reconciliation automatically. Current dose below100% prevents automatic re-escalation to a renal-table percentage. |
| Weekly indication identity | Three combined contexts; bladder incorrectly coded00385g; cervical definitive/adjuvant merged | Exact source IDs00385a–e restored: a definitive cervix, b bladder, c nasopharynx, d unresectable HNSCC unable to tolerate three-weekly cisplatin, e postoperative cervix with unexpected positive nodes. Cervix5weekly doses with possible Consultant extension; other indications6weekly doses. |

The source tables do not specify a hepatic dose reduction; liver values remain monitored without invented numeric hepatic thresholds. Neither regimen supplies a universal imaging or tumour-marker interval. Both require FBC/renal/liver testing at baseline and before every cycle, with clinically indicated audiology/CrCl.00385 also repeats audiology if indicated.00387 additionally specifies hearing/neural history each cycle, pretreatment dentistry/nutrition consultation and24-hour oral hydration encouragement. Do not turn indicated audiology into mandatory audiograms every cycle or invent a fixed post-treatment scan schedule.

## Integration

Copy candidate JSON to its original path:

- `candidates/00385-cisplatin-40-mg-m-weekly-with-radiotherapy.json` → `protocols/gynaecology/00385-cisplatin-40-mg-m-weekly-with-radiotherapy.json`
- `candidates/00387-cisplatin-100-mg-m-with-radiotherapy.json` → `protocols/head-neck/00387-cisplatin-100-mg-m-with-radiotherapy.json`

The canonical protocol IDs remain `nccp-00385-v5` and `nccp-00387-v5`. No schema version, file name, approval flag or unrelated protocol is changed. Candidate rules total 41 and 46 respectively. All changes are confined to this packet until the integrating agent deliberately copies them.

00385 context IDs now use actual indication IDs. Regenerate/check catalogue entries and card routing carefully: old `00385-gyn`, `00385-gu` and `00385-head-neck` references elsewhere may require explicit compatibility mapping. In particular, preserve both new head/neck and nasopharyngeal patient routes while correcting the bladder code. Do not conflate the two source indications or their eligibility.

Use `build-candidates.py` only while preparing/reviewing proposals. It rereads the checkout; do not run it after integration if that would overwrite subsequent parent-owned context/metadata refinements. Source cases read the actual checkout by default and support a `--repo` argument:

```sh
node validation/head-neck-v08445/platinum/source-cases.cjs --repo /absolute/path/to/checkout --report validation/head-neck-v08445/platinum/integrated-results.json
```

Before integration, add `--candidates` to test proposals against that checkout’s assessment engine.

## Evidence and limitations

`candidate-results.json`:313 independent clinical cases and 12 structural checks passed (325/325). These include positive/negative values, exact boundaries, fractional gaps, missing/invalid fields, contradictory legacy inputs, dialysis, RT cancellation, hearing/neuropathy separation, dose history, restart and competing hazards. Expected thresholds/actions are written from source pages in the test, not generated from candidate rules. The final structural pass invokes the actual strict protocol schema validator. Integration caught the rule engine’s unsupported schema alias `not_exists`; it was replaced by canonical `missing`, and the schema plus source cases were rerun successfully.

`baseline-results.json` is deliberately failing evidence against the unchanged v0.84.44 checkout. It includes renamed action/metadata/compatibility failures as well as clinical gaps; its failure total is NOT a count of unique clinical defects. Do not present it as such.

Outstanding integration duties: run these tests on actual integrated JSON; ensure generated index/card links and shared patient/consent/support/knowledge assets use these distinctions; exercise visible numeric renal and separate neuropathy/hearing controls in the browser; run repository-wide release checks. Source reconciliation and tests do not substitute for independent Consultant/oncology-pharmacy sign-off.
