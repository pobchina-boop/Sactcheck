# TPF/TCF source audit proposal for v0.84.48

Current official NCCP PDFs 00315 v7a, 00323 v7b and 00324 v6b were compared with baseline v0.84.47 (`5380c7d8665645d54b06c76011d420efc4e767a6`). This directory contains **review proposals only**; application files were not changed. Official PDF bytes were retrieved successfully, and all three SHA-256 hashes were independently recomputed. Exact URLs, dates, hashes and page/table citations are in `audit-proposal.json` and every proposed rule.

`00315-proposed.json`, `00323-proposed.json` and `00324-proposed.json` are complete protocol proposals, preserving unrelated baseline fields. `build_proposal.py` records the reproducible changes. `source-cases.cjs` runs the existing assessment engine, dose renderer and laboratory conversion adapter against those proposals. **181 checks passed, 0 failed**, including partial inputs, component actions, exact boundaries, phase, recurrence, recovery, dose history and unrounded raw laboratory conversions. Results are in `source-case-results.json`. No broad CI, browser or rendering checks were run by this research task.

## Main corrections

| Domain | 00315 v7a | 00323 v7b / 00324 v6b |
|---|---|---|
| Treatment counts | ANC ≥1.5 and platelets ≥100 in p3 Table2; low counts delay, consider 25% reduction of all three drugs | Platelets >100 proceeds and <100 delays: exactly100 is unassigned. ANC≥1.5 table conflicts with >1.5 narrative; review equality |
| Baseline | ANC>1.5, ECOG0–1; renal impairment is a caution | ANC>1.5, ECOG0–1; CrCl<60 and severe hepatic impairment exclude initial treatment |
| Complicated neutropenia despite G-CSF | Delay until recovery then reduce all three drugs25%; persistence after reduction/G-CSF needs further Consultant discussion | Docetaxel75→60mg/m², then60→45mg/m² for subsequent events; platelet nadir<25 requires docetaxel75→60 after recovery |
| G-CSF | Required every cycle (pp1,3,6) | May be used; subsequent-cycle coverage recommended after complicated neutropenia (pp3,5) |
| Cisplatin renal | CrCl50–59:75% original;40–49:50%;<40:not recommended; haemodialysis50% may be considered | Treatment-day ≥60:100%;45–59:75%;<45:clinical decision, consider carboplatin. This does not override baseline CrCl<60 exclusion |
| Fluorouracil hepatic | Remove obsolete85µmol/L/180U/L cutoffs. Severe:not recommended; mild/moderate no adjustment expected only **without renal impairment** | Bilirubin>85µmol/L or AST>180U/L contraindicates. Exact85/180 is unspecified. Qualitative initial1/3 or1/2 reductions cannot override those limits |
| Docetaxel liver | Separate AST/ALT,ALP,bilirubin. First combined row considers75% original. Second row is ambiguous, retain review. AST>10 OR ALT>10 OR ALP>6 OR bilirubin>1.5: not recommended | First combined row says **75mg/m², not75%**. Stop unless strictly indicated/Consultant discussed if bilirubin>ULN OR both AST and ALT>3.5 plusALP>6 |
| Toxicity recovery | Table5 explicitly delays until ≤grade1 before listed subsequent-cycle reductions | Source gives no numeric recovery cutoff for diarrhoea/mucositis/skin/neuropathy. Proposal requests clinical recovery confirmation. PPE recovery≤1 is explicit |

The proposal removes generic grade≥2 mucositis withholding as a purported source rule, distinguishes significant hearing impairment from a generic combined neuro/hearing grade, encodes pregnancy/lactation and ECOG2 eligibility rather than leaving them inert, and preserves permanent fluorouracil cessation after recurrent/severe mucositis even when current symptoms resolve.

Historical worst toxicity grade, occurrence and current recovery are separate inputs. Skin/neuropathy recurrence at docetaxel60mg/m² triggers the source treatment-stop pathway. A lower existing dose cannot be automatically raised to60. A grade4 skin reaction is not silently given the grade3 dose rule. Repeated20% or25% changes remain Consultant/pharmacy review when the source does not establish the compounding base.

## Schedule and workflow facts

- **00315:** docetaxel75mg/m² and cisplatin75mg/m² day1, both over60minutes; fluorouracil1000mg/m²/day days1–4 continuously96hours, every21days for3cycles. Daily22-hour fluorouracil infusions are an alternative. Definitive chemoradiation and/or surgery is planned.
- **00323:** docetaxel75mg/m² day1 over60minutes; cisplatin100mg/m² day1 over2hours; fluorouracil1000mg/m²/day days1–4 continuously96hours, every21days for3cycles. Follow-on carboplatinAUC1.5 weekly with radiotherapy for7weeks begins3–8weeks (days22–56) after the **start of induction cycle3**, if no progression and adequate marrow. Surgery is then considered. Source p1 prints00322; current catalogue's weeklyAUC1.5 source is00332. Retain and resolve this cross-reference discrepancy.
- **00324:** docetaxel75mg/m² day1 over60minutes; cisplatin75mg/m² day1 over2hours; fluorouracil750mg/m²/day days1–5 as **22-hour daily infusions**, every21days for4cycles. Do not rewrite this as an authored120-hour continuous pump. If no progression and adequate marrow, radiotherapy begins4–7weeks **after chemotherapy completion**; later surgery is considered. MDT-confirmed unresectability is required.

All three require baseline and each-cycle FBC/renal/liver profile, conditional ECG for compromised cardiac function and conditional audiology/CrCl, and pre-first-treatment DPD testing unless already tested. Renal impairment may elevate uracil and cause false DPD phenotyping; consider genotype. No universal imaging interval is specified. Older sources additionally state hearing/neuropathy history before each cycle.

Docetaxel dexamethasone is8mg orally twice daily for3days from the day before treatment, with at least3doses before administration. A missed course permits consideration of20mgIV immediately before treatment only at Consultant discretion. Cisplatin pre/post hydration follows local policy and source suggestions; routine furosemide is not recommended without fluid overload. 00315 encourages oral hydration for24hours and permits discretionary trial-derived ciprofloxacin500mg twice daily days5–15; it is not a universal requirement.

## Remaining limits

00323/00324 are still current catalogue-linked PDFs but print review13May2025. Record the date honestly without inferring withdrawal. 00315 review date is5December2030. Preserve integer-band gaps (e.g. CrCl59–60 and, for00315,49–50) rather than rounding into a dose category. 00315 Table4’s second-row AND/OR grouping and bilirubin≤1–1.5 wording require Consultant interpretation; ALP exactly6 is unassigned.

The new raw AST and bilirubin fields derive both their absolute result and their ULN ratio from one clinician entry; ALP requires a local ULN and has no assumed default. The181 bounded checks exercise these existing adapters directly, including just-above-threshold values that must not be rounded into equality. Parent integration still requires browser verification, final metadata reconciliation and consistent knowledge, consent, support, patient, PDF and QR outputs. Independent clinical/oncology-pharmacy and PPI approval has not been performed or implied.
