# SACTCheck v0.63.1

## National NCCP antiemetic guidance migration

### Purpose

This release removes the active local antiemetic prescription sheet links from SACTCheck while preserving the established emetogenic risk ratings and traffic light presentation.

The national NCCP provides separate antiemetic guidance for Medical Oncology and Haemato Oncology. SACTCheck therefore routes supportive care links according to the active oncology context rather than sending every regimen to one document.

### What changed

1. Medical Oncology contexts now open the national NCCP Medical Oncology antiemetic guidance.

2. Haemato Oncology contexts now open the national NCCP Haemato Oncology antiemetic guidance.

3. The existing emetogenic risk classification remains unchanged.

4. The existing traffic light display remains unchanged.

5. The active local high, moderate, low and docetaxel supportive prescription PDFs have been removed from the application assets.

6. Regimen supportive care labels now use national NCCP wording rather than local prescription sheet wording.

7. Shared protocols resolve the antiemetic link from the active tissue context. A shared regimen viewed in Haemato Oncology therefore opens the Haemato Oncology document even if the same protocol is also used in a Medical Oncology context.

8. The separate NCCP emetogenic classification source remains available as the provenance source for the risk category itself.

### Scope and safeguards

1. 382 protocol JSON files were assessed against the v0.63.0 baseline.

2. 324 protocol records required supportive care source metadata changes because they contained an active antiemetic guidance link.

3. Every semantic protocol change is confined to supportive care source metadata and antiemetic source metadata.

4. No treatment threshold, dose action, eligibility rule, organ function rule, toxicity rule or deterministic assessment condition was changed.

5. The central emetogenic classification and traffic light mapping are identical to the v0.63.0 baseline.

6. No active local antiemetic prescription PDF remains in the supportive care asset directory.

### Clinical boundary

The antiemetic link is supportive guidance. The current NCCP regimen, the relevant national antiemetic guidance, local medicines governance and individual patient factors remain authoritative for prescribing decisions.
