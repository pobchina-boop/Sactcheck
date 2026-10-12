# SACTCheck v0.81.9 - one-page consent generator refinement

## Scope
This is a focused consent-output refinement on the existing v0.81.9 baseline.

## Changes
- Clinic Workflow consent routing now opens a dedicated one-page regimen-specific SACT consent prototype for NCCP 00568.
- The existing longer `patient/00568/consent.html` discussion adjunct is retained separately and is not deleted.
- The new one-page form uses SACTCheck navy/teal styling consistent with the printable supportive-care scripts.
- Generic SACT risks are shown as concise tick boxes.
- Agent-specific material risks are grouped directly under Pembrolizumab, Pemetrexed and Carboplatin.
- Pembrolizumab immune-mediated risks are visually separated from cytotoxic chemotherapy risks.
- The page includes a compact consent confirmation/signature area and an explicit governance-review boundary.
- A static one-page A4 PDF is included alongside the browser/print version.

## Deliberately unchanged
- regimen cards
- assessment engine
- NCCP dose/threshold logic
- antiemetic prescriptions
- Treatment Passport
- SACTCard
- patient anatomy / visual guide
- patient knowledge page
