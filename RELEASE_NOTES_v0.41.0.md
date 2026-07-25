# SACTCheck v0.41.0 — Complete Sarcoma Library

Release date: 25 July 2026

## Summary

This release completes the current NCCP Sarcoma catalogue as 25 active JSON assessment protocols. Nineteen dedicated Sarcoma protocol files were added, and six existing canonical protocols shared with Breast, Gynaecology, Gastrointestinal or Genitourinary catalogues were reconciled for explicit Sarcoma/GIST use. No Sarcoma regimen is represented as a placeholder or draft card.

The complete SACTCheck catalogue now contains 270 distinct protocols.

## Clinical scope

The Sarcoma landing page includes:

- soft-tissue sarcoma;
- osteosarcoma and other bone-sarcoma pathways;
- Ewing sarcoma and relapsed bone-sarcoma pathways;
- rhabdomyosarcoma;
- gastrointestinal stromal tumour (GIST);
- Kaposi sarcoma;
- aggressive fibromatosis;
- specialist immunomodulatory and targeted treatments.

The release includes dacarbazine, doxorubicin/cisplatin, doxorubicin/ifosfamide, doxorubicin monotherapy, eribulin, gemcitabine/docetaxel, IE–VAC, IE, high-dose ifosfamide, irinotecan/temozolomide, IVADo, imatinib, MAP, mifamurtide, pazopanib, pegylated liposomal doxorubicin, regorafenib, sunitinib, trabectedin, vinblastine/methotrexate and VIT pathways.

## Source-specific assessment additions

- Ifosfamide protocols include Mesna, hydration, urine-output/fluid-balance, haematuria, renal and encephalopathy pathways.
- MAP includes phase-specific blood thresholds, urine alkalinisation, urine pH, methotrexate clearance, folinic-acid rescue, interaction screening and cardiac/hepatic pathways.
- Anthracycline regimens include cumulative exposure, LVEF, cardiac symptoms and source-specific bilirubin modifications.
- Cisplatin regimens include protocol-specific CrCl tiers, hydration/electrolyte, hearing and neuropathy review.
- Trabectedin includes hepatic, CK, rhabdomyolysis and cardiac pathways.
- GIST oral therapies include haematological, hepatic, renal, cardiovascular, dermatological and toxicity interruption/reduction pathways as applicable.
- PLD pathways include source-specific count thresholds, hepatic reductions, PPE and stomatitis assessment.
- Irinotecan-containing protocols include delayed-diarrhoea and acute cholinergic-syndrome support.

## Platform standards retained

- single-value partial assessment for every independently actionable input;
- no unrelated mandatory fields;
- omitted domains remain explicitly unassessed and are never assumed normal;
- CTCAE Grade 0–4 descriptions and practical assessment guidance beside grade controls;
- actual ALT, AST and bilirubin entry with automatic local-ULN conversion;
- protocol-specific CrCl/eGFR bands where source guidance is categorical;
- central emetogenic-risk and supportive-care mappings, including phase-specific profiles;
- searchable generic names, acronyms and common trade names;
- direct links to the current official NCCP PDFs;
- canonical shared-protocol handling without duplicate protocol records.

## Verification

- 25 active Sarcoma protocols;
- 472 Sarcoma input definitions;
- 391 source-specific Sarcoma decision rules;
- 327 rule-linked Sarcoma inputs assessed individually in single-entry regression testing;
- 270 distinct protocols in the full catalogue;
- no duplicate protocol IDs or NCCP codes;
- no Sarcoma placeholders or drafts;
- full historical regression suite passed before packaging;
- finished ZIP extracted and the full suite rerun successfully;
- ZIP integrity validation passed.

## Governance boundary

These are encoded clinical decision-support prototypes. Automated testing demonstrates structural consistency and expected engine behaviour; it does not constitute consultant, oncology-pharmacy or institutional clinical approval. All treatment decisions must continue to be verified against the current official NCCP regimen and local policy.
