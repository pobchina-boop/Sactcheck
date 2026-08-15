# SACTCheck v0.66.0

## Knowledge base expansion

This release expands the structured regimen knowledge base from 24 to 27 profiles.

### New profiles

1. FLOT, NCCP 00344 Version 9, perioperative treatment of resectable locally advanced gastric or oesophagogastric junction adenocarcinoma.
2. Osimertinib, NCCP 00353 Version 5, covering T790M positive advanced disease, first line metastatic EGFR mutated NSCLC and adjuvant treatment.
3. Olaparib tablet monotherapy, NCCP 00588 Version 5b, covering ovarian, prostate, breast and pancreatic cancer indications.

Each profile includes treatment context, patient selection, component rationale, supportive care, monitoring, priority toxicity, administration, evidence limitations and an explicit two pass evidence completeness audit.

## Evidence expansion

The principal evidence library increases from 50 to 61 records.

### FLOT

FLOT4 AIO is added as the protocol defining randomised evidence for perioperative FLOT in resectable gastric or oesophagogastric junction adenocarcinoma.

### Osimertinib

The profile deliberately separates the evidence supporting each encoded indication.

1. AURA3 supports the T790M positive advanced setting after earlier EGFR targeted therapy.
2. FLAURA supports first line osimertinib monotherapy in advanced EGFR mutated NSCLC.
3. ADAURA supports adjuvant osimertinib after complete resection.
4. FLAURA2 is displayed separately as subsequent combination evidence for osimertinib plus chemotherapy.

FLAURA2 is not allowed to create an unencoded combination treatment pathway within the osimertinib monotherapy protocol.

Final overall survival publications for FLAURA and ADAURA are linked.

### Olaparib

Because NCCP 00588 spans four tumour groups, each indication receives its own evidence mapping.

1. SOLO1 for first line BRCA mutated advanced ovarian maintenance.
2. SOLO2 for platinum sensitive relapsed BRCA mutated ovarian maintenance.
3. PROfound for biomarker selected metastatic castration resistant prostate cancer.
4. OlympiA for adjuvant high risk germline BRCA mutated HER2 negative early breast cancer.
5. POLO for maintenance treatment of germline BRCA mutated metastatic pancreatic cancer after first line platinum.
6. PAOLA 1 as contextual combination evidence for olaparib plus bevacizumab.

PAOLA 1 is explicitly separated from the NCCP 00588 monotherapy pathway because olaparib plus bevacizumab is represented by a separate NCCP regimen in SACTCheck.

Long term or final outcome publications are linked where they materially affect interpretation.

## Current knowledge base totals

1. 27 structured regimen profiles.
2. 61 principal evidence records.
3. 32 reusable medicine profiles.
4. 376 enabled protocol records remain in the active application library.
5. 382 protocol JSON assets remain present.

## Clinical rule integrity

No protocol JSON file is changed in this release.

No deterministic treatment threshold, dose action, organ function rule, treatment schedule, eligibility rule or clinical input definition is altered.

The expansion is confined to knowledge content, evidence mapping, the clinical validation register knowledge status and release presentation.

## Source governance

The official NCCP source addresses used by the three profiles are inherited from the current registered v0.65.0 protocol records and remain subject to the NCCP Change Tracker.

The evidence records are source linked and remain draft knowledge content pending independent clinical and oncology pharmacy review.

The current official NCCP protocol remains authoritative for treatment decisions.
