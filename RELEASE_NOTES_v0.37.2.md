# SACTCheck v0.37.2 — Tissue UI and automatic local ULN calculations

## Release purpose

This release begins the tissue-specific visual design system and removes manual multiplication-of-ULN entry for the locally supplied ALT, AST and bilirubin limits. It also confines additional endocrine screening bloods to immunotherapy-containing protocols and keeps them optional.

## Tumour-site UI

- Adds a visual tumour-site navigator above the catalogue.
- Uses a stable icon and colour for Breast, GI, Lung, Gynaecology, Genitourinary/Men’s cancers, Neuro-oncology, Sarcoma, Haematology, Skin/Melanoma and Head & Neck.
- Adds a tissue landing banner with treatment-class counts and one-tap section filtering.
- Carries the selected tissue colour and icon onto regimen cards.
- Keeps global regimen search, NCCP-code search, alias search and treatment-category filtering intact.
- Empty future sections such as Neuro-oncology and Sarcoma remain visible so the information architecture is ready for later protocol expansion.

## Automatic local ULN calculations

The central CUH laboratory profile now defaults to:

- ALT ULN: 34 U/L
- AST ULN: 42 U/L
- Bilirubin ULN: 20 µmol/L
- TSH reference range: 0.38–5.33 mIU/L
- Free T4 reference range: 8–18 pmol/L

For protocol rules encoded as ALT, AST, highest transaminase or bilirubin multiples of ULN:

- clinicians enter the actual laboratory result;
- SACTCheck calculates the multiple of ULN automatically;
- combined ALT/AST rules use the highest calculated multiple from the values supplied;
- either ALT or AST can be entered independently;
- the actual result, local ULN calculation and decision multiple are shown in the result comparison and copyable summary;
- local ALT, AST and bilirubin ULNs can be adjusted centrally in the assessment interface and reset to CUH defaults.

The internal NCCP thresholds remain encoded as source-faithful multiples of ULN. The new interface changes how the decision value is obtained, not the protocol cutoff.

## Optional immunotherapy bloods

Immunotherapy-containing protocols now display a separate optional section for:

- TSH
- Free T4
- Cortisol
- Cortisol sample time
- ACTH result
- Glucose
- Blood ketones

These fields:

- do not appear on non-immunotherapy regimens;
- never become mandatory;
- never block a single-value or partial assessment;
- remain explicitly unassessed when blank;
- may be entered individually.

## Quality assurance

- All existing automated protocol and engine tests passed.
- The v0.37.2 test suite verifies the CUH laboratory defaults, automatic ALT/AST/bilirubin calculations, highest-transaminase behaviour, optional immunotherapy-only bloods, tissue navigation assets and cache-version updates.
- 94 existing ALT/AST/bilirubin ULN input definitions are covered by the automatic actual-result adapter.
- Protocol JSON validation and the complete historical regression suite passed after the migration.

## Clinical boundary

This remains a development and shadow-validation release. The automatic calculations are deterministic, but the encoded clinical rules, local laboratory profile, aliases and supportive-care mappings still require the planned independent consultant, oncology-pharmacy and governance review before formal clinical deployment.
