# SACTCheck v0.74.0 - Clinician / Patient Product Guidance

## Product concept
SACTCheck now has two connected experiences driven by the same regimen object.

**Clinician workspace**
- exact NCCP regimen selection
- deterministic assessment
- supportive-medication workflow
- extravasation / administration safety
- source verification
- consent-support entry point

**Patient-facing support**
- regimen-specific toxicity at a glance
- exact treatment and schedule in plain language
- patient-language toxicity passport
- urgent symptom guidance
- patient-agnostic regimen QR/link
- print-first treatment passport

## Patient-facing design principle
The patient layer is not a generic chemotherapy leaflet. It is generated from the exact selected regimen.

The first view prioritises *what matters* rather than simply listing everything. Urgency and seriousness are visually separated from frequency. A rare toxicity can therefore remain prominent when delayed recognition is dangerous.

The toxicity passport uses a simple 0-4 patient communication scale:
0 none; 1 mild; 2 moderate; 3 severe; 4 emergency.

This is explicitly not a CTCAE assessment and does not determine whether treatment proceeds.

## Print-first privacy model
The printable passport is generated from regimen information only.

No patient name, MRN, date of birth, symptom score or treatment date is requested or persisted online. Blank fields in the printable passport are intended for handwriting after printing.

The regimen QR identifies only the regimen-specific patient-support page.

## Workflow engine
The inherent properties of the regimen drive the available workflow:
- assessment
- consent / treatment discussion support
- emetogenic and supportive-medication pathway
- administration / extravasation guidance
- patient-facing treatment information
- patient passport
- source verification

## Interface
The homepage presents an explicit **Clinician workspace / Patient-facing support** switch.

Regimen cards expose the two primary pathways immediately when the card renders. They no longer wait for slower metadata-enrichment passes before showing Clinic workflow and Patient support.

The product strapline is:

**SACT support at point of care**

## Governance
Patient content supports, rather than replaces, formal consent and direct oncology advice.

Current NCCP sources, current medicine information, local policy and clinician/pharmacy review remain authoritative. No v0.74.0 interface change alters deterministic treatment thresholds, dose modifications, eligibility rules or protocol JSON.
