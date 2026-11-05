# Ten-context colorectal consistency matrix

Baseline `2e5de4a6dd9e2fcbefa18623ff21db7b9eaec40b`, release `0.84.33`. Current official sources: **blocked**. This is a static inventory, not completed clinical, PDF, QR or visual validation. No context or repeat audit is counted complete.

| Code | Work | Root patient audience | Missing essential files | Stored NCCP version / checked | Current clinical audit |
| --- | --- | --- | --- | --- | --- |
| 00212 | requested_context_completion | other_tumour_context | knowledge.pdf, handbook.pdf | 7 / 2026-10-25 | blocked |
| 00214 | requested_context_completion | other_tumour_context | None by filename | 8 / 2026-11-02 | blocked |
| 00215 | requested_context_completion | other_tumour_context | knowledge.pdf, handbook.pdf | 7 / 2026-10-29 | blocked |
| 00244 | requested_context_completion | missing | index.html, knowledge.html, knowledge.pdf, consent.html, consent-form.html, consent-form.pdf, passport.html, passport.pdf, guide.pdf, sactcard.pdf, handbook.pdf, logistics.html, logistics.pdf, supportive-care.html, supportive-care.pdf, treatment-journey.html, treatment-journey.pdf | 5 / not recorded | blocked |
| 00382 | requested_context_completion | colorectal | knowledge.pdf, handbook.pdf | 4 / 2026-10-29 | blocked |
| 00207 | repeat_clinical_audit | mixed_colorectal_and_other | knowledge.pdf, handbook.pdf | 6 / 2026-10-25 | blocked |
| 00225 | repeat_clinical_audit | colorectal | knowledge.pdf, handbook.pdf | 6 / 2026-10-25 | blocked |
| 00328 | repeat_clinical_audit | colorectal | knowledge.pdf, handbook.pdf | 7 / 2026-10-25 | blocked |
| 00330 | repeat_clinical_audit | colorectal | knowledge.pdf, handbook.pdf | 6 / 2026-10-25 | blocked |
| 00331 | repeat_clinical_audit | colorectal | knowledge.pdf, handbook.pdf | 7 / 2026-10-25 | blocked |

Every row in [the full JSON matrix](consistency-matrix.json) records protocol and clinician/evidence/consent/monitoring/support paths, shared templates, source URLs and stored provenance, patient/context routes, PDF hashes/geometry/mirrors, prior work, and each uncompleted clinical decision category. PDF page geometry does not establish retained text, fonts, anatomy, bounds or QR validity.

## Shared presentation and release requirements

Before overall MVP completion, audit every tumour-group context across clinical rules, shared templates, patient outputs, PDFs and source versions. Standardise presentation without homogenising clinical decisions.

Preserve detailed anatomical drawings; the treatment/monitoring first page, anatomical toxicity second page, and front/back wallet/card/QR/contacts/webapp third page; and the complete offline handbook. Identify placeholder contacts. Resolve font/renderer differences before replacing PDFs with pagination drift. All current-source, engine boundary/component, browser, PDF/QR and visual checks remain required.
