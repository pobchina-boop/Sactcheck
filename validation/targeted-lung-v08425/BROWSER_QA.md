# Browser QA — v0.84.25

Local managed Sites preview, 29 October 2026. Synthetic values only; no patient identifiers. No publication or deployment performed.

- Shared weekly-paclitaxel knowledge selector clearly offers Breast cancer and Lung cancer. Lung opens /patient/00226/lung/knowledge.html with relapsed/refractory SCLC, off-label status, four-visit/three-visit qualification and matching resources. Timeline safety-review expansion shows rationale and action text.
- Tepotinib blank assessment returns Assessment incomplete, zero evaluated rules and explicit unassessed domains. CrCl 25 mL/min plus the <30 band returns Clinical review required, names the NCCP/SmPC conflict and withholds an automatic normal or reduced dose. Partial-assessment boundaries remain visible.
- Tepotinib clinician evidence displays the VISION previously treated subgroup, objective response and duration of response, cutoff/time-origin information and the absence of a comparator. Browser review found missing spacing in numeric units; renderer now displays percent as % and separates text units. Integration checks cover this.
- Docetaxel opened from All requires an indication choice. Selecting Lung displays TAX317/TAX320, the NSCLC six-cycle maximum and /lung/ guide. Selecting Breast restores breast evidence, ongoing treatment wording and the original guide path. No stale lung journey remains.
- Ceritinib consent workflow opens the matching discussion aid: NCCP post-crizotinib scope, 450 mg daily with food, all eight listed risks and the early liver-monitoring schedule. It remains a discussion aid, not treatment authorisation.
- Ceritinib patient portal displays continuous dosing and relative monitoring. Anatomy screenshot inspected: numbered markers and connector labels are readable, pancreas/gut markers are separate and all shown text is within cards. The portal's visual-guide link opens the matching PDF.
- Ceritinib support starts unselected. Selecting the daily oral phase reveals its prescription draft, oral moderate-high risk, interaction/QT precautions and matching phase PDF/print links.

Automated context tests additionally cover all five shared regimens, all nine resource types, unknown contexts, tumour switching, safe selector queries and indication-specific sustainability. All 80 final PDF files received rendered visual QA in the audit groups. Browser QA does not establish clinical approval.
