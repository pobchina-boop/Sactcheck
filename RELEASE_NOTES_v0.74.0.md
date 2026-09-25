# SACTCheck v0.74.0

## Main change
SACTCheck is now presented as one regimen engine feeding two connected experiences: a clinician workspace and a patient-facing support pathway.

## Loading / lag
Core regimen-card actions are attached with a MutationObserver as soon as each card enters the DOM. They no longer wait for slower metadata or supportive-care enrichment passes.

Workflow and patient content data are also pre-warmed in the background.

## Patient passport
Adds a print-first, patient-agnostic regimen passport:
- exact treatment and schedule,
- plain-language regimen-specific toxicity,
- Know / Contact / Urgent action language,
- a 0-4 patient symptom communication scale,
- blank cycle/visit record,
- blank treating-centre contact fields,
- regimen-only QR/link.

The 0-4 scale is explicitly not a CTCAE assessment.

## Privacy
No patient name, MRN, DOB, symptom score, diary entry or treatment date is entered into or persisted by SACTCheck. Blank printable fields are designed for handwriting after printing.

## Branding / UI
Uses the existing SACTCheck shield mark and the strapline:
`SACT support at point of care`

Removes the unused Add regimen / protocol importer affordance from the normal interface.

## Clinical boundary
The release does not alter protocol JSON or deterministic clinical rules.
