# SACTCheck v0.46.0 Validation Report

## Release scope

- Baseline: SACTCheck v0.45.3
- Release: SACTCheck v0.46.0
- Tumour library: Head and Neck
- Official catalogue checked: 26 July 2026
- Official catalogue URL: https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/head-and-neck-sact-regimens/

## Inventory reconciliation

- Current unique NCCP Head and Neck regimen codes represented: **30**
- New canonical protocol files: **21**
- Existing/shared canonical protocols reconciled: **9**
- Duplicate NCCP codes introduced: **0**
- Complete SACTCheck indexed library: **359 protocols**

The shared regimens retain one canonical protocol file and receive Head and Neck-specific indication and regimen-card contexts. This avoids duplicate cards while ensuring that the description and default indication follow the selected tissue filter.

## Encoded clinical content

Across the 30 Head and Neck protocols:

- Clinical input definitions: **528**
- Assessment rules: **444**
- Independently exercised single-value rule-linked inputs: **376**
- All displayed inputs remain optional for partial assessment.
- Missing domains remain explicitly unassessed and are not assumed normal.

The release includes platinum/fluorouracil chemoradiation, cetuximab combinations, induction TPF/TCF, gemcitabine/cisplatin pathways, methotrexate, immune-checkpoint therapy, pembrolizumab/platinum/fluorouracil and thyroid targeted therapies.

## Automated verification

- Protocol index build: **passed**
- Protocol schema/publishing tests: **364 passed**
- Head and Neck focused release test: **passed**
- Complete historical and release-specific repository test suite: **passed**
- Final process exit code: **0**
- Direct adaptive PDF regression tests: **passed**
- Contextual shared-indication regression tests: **passed**
- Regimen-card metadata coverage: **359/359 protocols**
- Central supportive-care mapping: **359/359 protocols**

## Source and reconciliation notes

- Every Head and Neck protocol has an official HSE/NCCP document URL.
- NCCP 00893 is indexed using the catalogue code 00893 and the official `893` source document. A source-document internal numbering inconsistency should be independently confirmed during clinical/pharmacy review.
- Regimen versions, schedules, treatment contexts and source-derived numerical pathways remain subject to independent Consultant Medical Oncologist and oncology-pharmacy validation.

## Governance status

All clinical encodings remain:

> encoded prototype pending independent clinical and oncology-pharmacy validation

Automated software testing verifies internal consistency and boundary behaviour. It does not constitute independent clinical validation or authorisation for autonomous treatment decisions.
