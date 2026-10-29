# v0.84.25 taxane lung context audit

Checked 29 October 2026 against freshly downloaded official PDFs and current product information. Baseline commit: a3f8a2744c5753413f230004118056ce8b20baf9 (v0.84.24). No existing breast patient files were edited by this task.

## Indication and evidence findings

- **00203a docetaxel 75 mg/m²:** previously treated locally advanced/metastatic **NSCLC**, not the breast indication 00203h. NCCP v7 has an NSCLC maximum of **six 21-day cycles**, with earlier stopping for progression or unacceptable toxicity. The lung guide, passport, timeline and monitoring map carry that limit. A new indication-specific clinical review detects proposed cycles beyond six and does not apply that cap to breast/prostate indications.
- **00226d weekly paclitaxel:** relapsed/refractory **SCLC**, not NSCLC. NCCP v9 explicitly identifies off-label use. The default schedule is Days **1, 8, 15, 22 every 28 days**; the consultant may select Days 1, 8, 15. Each weekly dose needs review. No fixed cycle maximum is invented.
- TAX317's dose-specific 75 mg/m² median OS was 7.5 versus 4.6 months in historical post-platinum NSCLC. This is presented only in clinician evidence, with population, comparator, dose cohort and limitations. It is not an individual prediction or a modern comparative ranking. TAX320 did not show a significant overall-survival difference between its three groups; no generic claim of benefit against every comparator is made.
- The cited Yamamoto SCLC phase II trial enrolled 22, with 21 eligible and five partial responses. Its **six weekly doses in an eight-week cycle** do not match the NCCP 28-day pattern. The suite states that mismatch and lack of a control group. No comparative survival metric or breast efficacy result is transferred to SCLC.

## Decision rule findings and repairs

### 00203

- Retained ANC <1.5 delay and separate baseline exclusion; febrile neutropenia or ANC <0.5 for **more than seven days** triggers the source dose-reduction pathway; recurrence/persistence at 60 mg/m² stops treatment.
- Preserved the conservative hepatic table review. The source has an ambiguous printed bilirubin “<1–1.5” row and overlap/gaps (including ALP exactly 6). Independent severe thresholds remain bilirubin >1.5, AST/ALT >10 or ALP >6. No invented 50%/75% dose is calculated.
- Added the missing explicit grade 3 skin dose action at 75 mg/m² → 60 mg/m². Grade 4 skin is not extrapolated into that grade 3 row.
- Corrected pregnancy and lactation source attribution to current Taxotere SmPC section 4.6; these are product-information supplements, not NCCP page 2 exclusions.
- Added missed-premedication reconciliation and severe acute infusion reaction/no-rechallenge actions, with the relevant NCCP pages.
- Removed an inapplicable continuation-phase suppressor from monotherapy rules, while retaining the legacy valid phase identifier. All original input names remain available.
- Optional renal profile is monitoring information, not an exact Calvert input or a renal-dose calculation. The source expects no adjustment including haemodialysis. Platelets remain monitored without inventing a numeric docetaxel threshold.

### 00226

- Visually confirmed that platelets exactly 90 appears in both printed full-dose and delay rows. Added explicit consultant/pharmacy review; automatic full-dose clearance now requires a value above 90.
- Preserved literal hepatic lower bounds 1.26 and 2.01. Values strictly between 1.25–1.26 or 2–2.01 receive review, not rounding. ANC strictly between 0.99 and 1.0 similarly receives review.
- Febrile neutropenia now holds treatment even without an entered current dose. Dose history refines the subsequent 80 → 65 → 50 mg/m² pathway; it is not needed to recognise the acute restriction.
- Grade 2 neuropathy without previous-reduction context gets explicit review. Grade 2 other toxicity without recovery/history context remains held. A current grade 2 result independently holds even after two previous reductions; current grade ≥3 cannot be hidden by a contradictory lower historical maximum.
- The current other-toxicity grade is always visible, including when the recorded highest grade is 0, 1, 3 or 4. The assessment engine evaluates the independent current-grade rules regardless of input visibility, so retaining the former highest-grade-equals-2 visibility clause made a complete normal form impossible. The fix changes input visibility/help rather than suppressing the independent safety rules. Current and highest grades stay separate; blank is not interpreted as grade 0.
- Added ECOG 0–2 eligibility review and explicit off-label consent/approval reconciliation. Both inputs are visible and optional, but an unanswered domain remains unassessed. NCCP v9 page 1 marks **all four listed weekly indications, including breast 00226a**, with footnote i; pages 5–6 require patient information, consent and hospital acknowledgement under local policy. This check is not confined to SCLC. Help text now explains that scope explicitly.
- Corrected the source citation of two existing immediate count-hold rules to the actual v9 page 2/table 2.

### Shared safeguards

- All demonstration values are blank; omitted domains are never assumed normal. Inputs remain optional. Source grading is identified as **edition unspecified**, with clinically useful prompts, instead of attributing the NCCP rows to CTCAE v5 without evidence.
- A conservative software guard holds dose selection when a source-table ambiguity coexists with an otherwise numeric reduction. It is labelled as a reconciliation guard, not a new NCCP dose row; the real dose renderer is tested to show no dose now rather than a definitive numeric combined dose.
- Breast indications and shared safety rules remain present. Existing breast source cases are included in the new regression coverage. The existing patient evidence and assets are preserved by the parent integration workflow.

## Supporting care and source differences

Both medicines remain low emetogenic risk with the NCIS V8 reference, separate from infusion-reaction premedication. Docetaxel uses the source three-day dexamethasone course; missing doses require prescriber review. The single 20 mg IV replacement is a consultant option, not an automatic substitution. Weekly paclitaxel keeps the source first-dose and later-dose premedication distinctions and explicit product/local-policy reconciliation.

The current Taxotere SmPC hepatic advice differs from the NCCP Giraud-based table; the conflict is recorded. Conventional paclitaxel SmPC retreatment thresholds, dose modification and generic premedication differ from the weekly NCCP pathway; no unqualified product-wide rule replaces the weekly regimen. Supplemental drug risks are kept distinct from NCCP numeric rules.

## Deliverables and verification

- `proposed/00203-docetaxel-75-21-day.json`: 28 inputs, 27 rules.
- `proposed/00226-paclitaxel-monotherapy-weekly.json`: 21 inputs, 40 rules.
- `authoring.json`: complete lung-context clinician/patient content, evidence, consent-discussion text, anatomy, support plans, logistics, chronology and longitudinal monitoring.
- `consent-profile-updates.json`: source-checked drug-risk additions preserving existing profiles and their breast applicability.
- `sources.json`: URLs, versions, retrieval dates, PDF/text SHA256 and exact table/section references.
- `source-cases.cjs`: **358/358 proposed-mode and 358/358 integrated checks passed** using the real assessment engine and dose-schedule model, including the final visibility fix. Coverage includes normal baseline/routine forms for all four 00226 indications using only the real form definitions' visible fields, preserved discordant-current restrictions, and blanks remaining unassessed. The script also runs with `--integrated` against canonical files.
- Key source tables rendered with Poppler and visually checked. Parent owns browser/PDF generation and full-suite integration checks.

No independent consultant, oncology-pharmacy or PPI approval is implied. Clinical-use authorisation and independent-review flags remain false. Software verification is not clinical validation.
