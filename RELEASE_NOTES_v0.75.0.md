# SACTCheck v0.75.0

## Patient-facing treatment guide
The patient-facing entry point is now centred on a single A4-style **regimen treatment guide**. It presents the regimen name and NCCP identity, constituent medicines, encoded treatment schedule, chief toxicities grouped as general / agent-specific / immunotherapy-related, urgent-contact language, and a regimen-only QR link for deeper information. The longitudinal treatment passport is deliberately left as a future module.

## Schedule fidelity
Treatment-day ranges are expanded rather than collapsed. An encoded Day 1-3 sequence is displayed as Day 1, Day 2 and Day 3. Sequential phases preserve their encoded labels, with induction and maintenance made explicit when present. Phase-level frequency is carried into the patient schedule where available.

## Drug-content isolation
Agent-profile matching is conservative for HER2-directed medicines. Trastuzumab, trastuzumab deruxtecan/T-DXd/Enhertu, trastuzumab emtansine/T-DM1/Kadcyla and pertuzumab are treated as isolated families for content matching, preventing substring-based cross-inheritance.

## Supportive-care reconciliation
The high-risk local supportive-medicine source is no longer filtered down to only selected antiemetic items. The generated prescribing-support PDF retains the complete supplied nine-item proforma: aprepitant 125 mg Day 1; aprepitant 80 mg Days 2-3; dexamethasone 8 mg Days 2-4; omeprazole 20 mg Days 1-4; nystatin; chlorhexidine mouthwash; cyclizine PRN; metoclopramide PRN; and loperamide PRN. Moderate- and low-risk supplied local proformas are also encoded completely.

Carboplatin AUC >=4 and trastuzumab deruxtecan now use separate high-risk branches. A carboplatin regimen cannot display trastuzumab-deruxtecan wording simply because the two previously shared one implementation branch.

## Homepage interface
The workflow engine no longer injects a second SACTCheck brand lock-up into the hero. The right-hand hero card is rebuilt as a visible four-step pathway: select regimen, clinician workspace, patient guide, verify source.

## QR routing
Patient URLs remain canonical public links of the form `https://sactcheck.com/?patientSupport=<REGIMEN_ID>`. The URL carries the regimen identifier only and no patient data.

## Verification performed
- JavaScript syntax checks: PASS
- patient-support-v0750 regression tests: PASS
- regimen-workflow-v0750 regression tests: PASS
- interface-v0750 regression tests: PASS
- supportive-care PDF render verification: PASS (single-page A4, all nine high-risk local source items visible, no carboplatin/T-DXd label bleed)

Clinical note: this remains prescribing and information support. The current NCCP regimen, current local policy and independent clinical judgement remain authoritative.
