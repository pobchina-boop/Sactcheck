# SACTCheck v0.72.0 - Regimen Workflow Engine

## Concept change
SACTCheck now has a formal second engine alongside the deterministic clinical assessment engine.

The existing clinical engine answers:
**What do the encoded NCCP rules say about this clinical assessment?**

The new Regimen Workflow Engine answers:
**Given this selected regimen, what clinic workflow should SACTCheck surface?**

The regimen is therefore the central object for assessment, consent, supportive care, administration safety, patient information and source verification.

## First workflow outputs

### 1. Supportive-care / emetogenic prescribing support
The workflow engine consumes the existing NCCP emetogenic-risk resolver and generates an appropriate current NCCP V8 prescribing-support template for:
- high emetogenic risk,
- high-risk anthracycline/cyclophosphamide,
- high-risk carboplatin AUC >=4 / trastuzumab deruxtecan,
- moderate risk,
- low risk,
- minimal risk.

The generated form opens in the browser PDF viewer rather than automatically downloading.

The old 2021 CUH proformas were used as a workflow/layout reference, but their medication lists are not copied forward unchanged. The engine uses current NCCP V8 antiemetic content instead. Routine nystatin, chlorhexidine and loperamide from the old local sheets are therefore not automatically inserted because they are not part of the NCCP V8 standard antiemetic table.

Optional acid suppression is not blindly generated. An interaction-override architecture is included, with erlotinib as the first evidence-backed rule: routine PPI co-administration is flagged because the current SmPC reports substantially reduced erlotinib exposure with omeprazole.

### 2. Extravasation
Parenteral medicines are mapped to the current NCCP extravasation classification and 2023 NCCP management guidance where a curated mapping exists.

The workflow panel can show:
- vesicant DNA-binding,
- vesicant non-DNA-binding,
- irritant,
- neutral/non-vesicant,

together with the NCCP compress strategy and drug-specific antidote note where available.

The output explicitly remains subordinate to local extravasation policy and clinical judgement.

### 3. Existing consent workflow
The v0.71.3 two-page consent system remains unchanged and is surfaced as a workflow module.

### 4. Patient regimen hub
A patient-information / QR module is represented in the workflow manifest as **planned**. This establishes the data contract for the next development phase without prematurely publishing patient-facing content.

## UI / brand refresh
The homepage now reflects the broader product concept:

**SACTCheck**
**SACT support at the point of care**
**One regimen. One clinical workflow.**

The visual workflow becomes:
**Assess -> Consent -> Support -> Inform**

The existing SACTCheck logo mark is integrated into the mission lockup and workflow drawer. Regimen cards receive a new **Clinic workflow** action. The unused regimen-import/add-regimen control is removed from the clinician-facing experience.

## Safety boundary
v0.72.0 does not modify:
- protocol JSON,
- laboratory thresholds,
- treatment eligibility,
- dose-modification rules,
- toxicity decision rules,
- v0.70.0/v0.70.1 source reconciliation.

Supportive-care and extravasation outputs remain clinician-controlled, source-linked and pending independent oncology/pharmacy validation before formal clinical deployment.
