# SACTCheck v0.69.0 — Sustainability Module

## Purpose
Adds an evidence-linked sustainability awareness layer to the existing SACTCheck regimen library without changing NCCP clinical decision logic.

## Clinician-facing changes
- Adds a global **Sustainability** button to the SACTCheck landing workflow.
- Adds a **Sustainability** action to active regimen cards.
- Opens a dedicated mobile-friendly sustainability workspace.
- Carries regimen, NCCP protocol identifier, tumour context and route classification into the sustainability page when available.
- Uses six visual domains: clinical value/treatment optimisation, route/administration, attendance/travel, medicines/waste, deprescribing, and lifestyle/supportive care.
- Introduces evidence-maturity language: measured, modelled, mechanism-supported and not quantified.
- Includes the supplied evidence set as source-linked expandable groups.

## Safety / governance design
- No universal carbon score.
- No red/amber/green environmental ranking of regimens.
- No invented kg CO2e estimate.
- No environmental recommendation that overrides efficacy, safety, patient preference, NCCP treatment criteria or clinical judgement.
- Regimen metadata is used only to expose likely footprint drivers; it is not converted into a carbon estimate.
- Two supplied references remain explicitly marked as requiring bibliographic verification: `10.1177/107881552251370560` and `10.1017/PY25215`.

## Technical scope
Changed: `js/library-ux.js`
Added: `sustainability.html`
Added: release/application/validation documentation.

No protocol JSON, assessment engine, rule engine, protocol loader, clinical validation workspace or NCCP change-tracker logic was modified.
