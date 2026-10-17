# SACTCheck v0.83.6 — ten colorectal full suites

Base: v0.83.5, commit `da9974b8674e8160701f831f94af2f2086dd2e11`. Prepared 16–17 October 2026.

## Regimens

| NCCP | Regimen | Published version audited |
| --- | --- | --- |
| 00207 | Weekly cetuximab; separate head/neck radiotherapy indication | 5 |
| 00732 | Fortnightly cetuximab | 2 |
| 00328 | Weekly cetuximab + fortnightly FOLFIRI | 7 |
| 00585 | Fortnightly cetuximab + FOLFIRI | 5b |
| 00330 | Weekly cetuximab + fortnightly irinotecan | 6 |
| 00331 | Fortnightly cetuximab + irinotecan | 7 |
| 00692 | Weekly cetuximab + FOLFOX-4 | 2 |
| 00733 | Fortnightly cetuximab + modified FOLFOX-6 | 2a |
| 00210 | FOLFOX-4 | 9b |
| 00213 | Irinotecan every three weeks | 7 |

## Full-suite scope

Every regimen has audited clinical rules; a clinical knowledge/evidence profile; a six-chapter patient reference with FAQs and drug explanations; a date-free cycle graph; eight symptom targets; consent discussion and draft consent resources; supportive-care review; a patient guide, five-page treatment passport and contact card; and practical access/pump or visit guidance. The shared 00568 reference and all 24 prior protected packages remain unchanged.

FOLFOX-4 uses separate 22-hour infusions on Days 1 and 2, with a further treatment/renewal on Day 2 and planned completion around Day 3. This differs from the 46-hour FOLFIRI and modified-FOLFOX6 pumps. Port insertion, access, connection, living with a device and professional disconnection remain general educational guidance, with local nursing arrangements controlling the actual process.

00207 has one shared indication selector across the clinical assessment. Its colorectal RAS selection is separate from the head/neck radiotherapy indication. The whole-course graphic shows the first cetuximab dose one week before radiation, then concurrent weekly cetuximab through the radiation course. Neither this graphic nor the cycle graphs require a patient date.

The knowledge base includes cetuximab's drug profile and ten regimen/evidence records. Trial population, biomarker and schedule differences are explicit. Older weekly trials are not presented as direct comparisons of every fortnightly NCCP schedule. MOSAIC stage III results are not applied to stage II or metastatic disease.

Interaction prompts cover cetuximab, irinotecan and fluorouracil; existing antiemetic and extravasation services remain connected. Sustainability profiles record source-supported delivery information and leave travel totals and environmental impact unquantified. Workflow links now reliably carry the active regimen; long source URLs wrap on mobile.

## Clinical reconciliation that needs reviewer attention

- **00330:** the diarrhoea restart table's cetuximab 400/300 mg/m² values conflict with its weekly maintenance schedule. No automatic cetuximab restart dose is calculated from this table.
- **00328/00585:** ANC recovery wording differs between two and four weeks. Persistent diarrhoea and component-specific recovery are handled separately. 00328's severe-renal exclusion and its fluorouracil adjustment note are shown together, with the exclusion retained.
- **00692/00210:** the printed FOLFOX-4 table lists folinic acid on Day 1 only. Day 2 folinic orders require source/local confirmation; the tool does not invent them.
- **Organ-function differences:** oxaliplatin renal instructions differ across these NCCP regimens. FOLFOX-4 monotherapy has an unresolved exactly-30 mL/min boundary. Fluorouracil bilirubin 85 / AST 180 equality and non-quantified reductions remain review prompts.
- **Ranges:** specialist-review instructions such as 50–66% or 15–20% are retained as ranges. The dose display does not turn them into a single automatic dose.
- **00733:** extended RAS selection remains necessary despite older KRAS indication wording; the source's legacy diarrhoea grading is identified explicitly.
- **Cetuximab licensing and antiemetics:** current EMA fortnightly product information differs from historical NCCP licensing footnotes. The national emetogenic map says minimal risk for monotherapy while regimen PDFs say low risk; this discrepancy is disclosed.

The audit used official web PDF text and page/table extracts. Direct NCCP PDF binary requests returned HTTP 403, so file identity and visual table layout were not independently verified from downloaded originals. Reconfirm the current official PDFs before clinical adoption.

## Verification and release use

See `../validation/colorectal-v0836/VALIDATION.md`, `AUDIT_RESULTS.html`, `source-map.json` and the case records for actual results and reproduction commands. Software verification does not constitute independent consultant or oncology-pharmacy authorisation. Clinical, pharmacy and patient/PPI review remain pending, and `clinical_use_authorised` remains false.

This advances software-package coverage to 21 of 41 candidate colorectal cards and registers 34 protected patient pipelines overall. The 41-card list is a repository-derived candidate inventory, not a claim of a complete national treatment catalogue.

Apply the drop-in contents over the stated committed base, merge newer local edits if present, and run `npm run test:ci` before your normal commit and push. No commit, push or deployment was performed by this task. Copyable commit text is in `COMMIT_v0836.txt`.
