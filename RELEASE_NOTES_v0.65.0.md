# SACTCheck v0.65.0

## Knowledge base expansion

This release expands the structured regimen knowledge base from 21 to 24 profiles.

### New profiles

1. Docetaxel 75 mg/m² plus prednisolone, NCCP 00546 Version 3, metastatic castration resistant prostate cancer.
2. Pembrolizumab 200 mg plus axitinib, NCCP 00583 Version 3b, first line advanced renal cell carcinoma.
3. Avelumab monotherapy, NCCP 00535 Version 6b, covering both the current metastatic Merkel cell carcinoma and urothelial carcinoma maintenance indications.

Each profile includes treatment context, patient selection, component rationale, supportive care, monitoring, priority toxicity, practical administration, evidence limitations and an explicit evidence completeness audit.

## Evidence expansion

The principal evidence library increases from 45 to 50 records.

New evidence records include TAX 327, KEYNOTE 426, JAVELIN Bladder 100, JAVELIN Merkel 200 Part A and JAVELIN Merkel 200 Part B.

Later follow up was deliberately checked rather than relying only on the original pivotal publication. Updated TAX 327 survival, final KEYNOTE 426 5 year results, longer JAVELIN Bladder 100 follow up and long term Merkel cell follow up are linked.

JAVELIN Merkel 200 Part B is labelled as contextual subsequent evidence. It does not create a first line Merkel cell prescribing pathway because the current encoded NCCP 00535a indication specifies prior chemotherapy for metastatic disease.

## Source reconciliation identified during the audit

The deeper review identified a source metadata defect in the existing Avelumab record.

The current NCCP Version 6b source identifies:

1. 00535a as metastatic Merkel cell carcinoma after one or more lines of chemotherapy for metastatic disease.
2. 00535b as first line maintenance treatment of locally advanced or metastatic urothelial carcinoma that is progression free following platinum based chemotherapy.

The SACTCheck urothelial metadata had been carrying 00535a. It is corrected to 00535b.

The Avelumab record is also updated to the current official NCCP PDF address.

No deterministic treatment threshold, dose action, organ function rule, treatment schedule or clinical input definition is altered.

## Current knowledge base totals

1. 24 structured regimen profiles.
2. 50 principal evidence records.
3. 30 reusable medicine profiles.
4. 376 enabled protocol records remain in the active application library.
5. 382 protocol JSON assets remain present.

## Validation

The complete cumulative test suite passed.

The dedicated v0.65.0 test confirms all three profiles, all five new evidence records, mature follow up links, the contextual boundary around first line Merkel cell evidence and the corrected Avelumab source mapping.

Repository security validation passed.

The static site build passed and copied all 382 protocol JSON assets.

Deployable site validation passed.

A comparison against v0.64.0 found exactly one protocol JSON file changed. That file is NCCP 00535 Avelumab monotherapy. The changes are restricted to the current source address, source check date, the urothelial regimen code and its regimen card indication identifier.

Independent consultant oncology and oncology pharmacy validation remain pending.
