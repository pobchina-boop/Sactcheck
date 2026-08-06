# SACTCheck v0.61.0 — Three-Regimen Expansion and Evidence-Completeness Audit

**Release date:** 6 August 2026  
**Baseline:** v0.60.3  
**Release type:** cumulative knowledge-base and evidence-governance update

## Summary

v0.61.0 expands the structured regimen knowledge base from **15 to 18 profiles** and increases the principal evidence mapping from **22 to 42 records**. It adds a second-pass evidence-completeness audit to every profile so a page is not treated as complete merely because one landmark trial is present.

## Three new profiles

1. **NCCP 00321 v9 — XELOX/CAPOX**
   - Covers adjuvant stage III colon cancer, advanced/metastatic colorectal cancer and adjuvant stage II/III gastric adenocarcinoma after D2 gastrectomy.
   - Maps NO16968, NO16966 and CLASSIC, with IDEA treatment-duration context and mature follow-up publications.

2. **NCCP 00226 v9 — weekly paclitaxel 80 mg/m²**
   - Covers the protocol’s metastatic breast, later-line ovarian, relapsed/refractory small-cell lung and later-line bladder indications.
   - Makes the evidence-strength gradient explicit: randomised phase III evidence for breast cancer, smaller phase II evidence for ovarian cancer and SCLC, and contextual retrospective evidence for bladder cancer.

3. **NCCP 00776 v3b — trastuzumab deruxtecan 5.4 mg/kg**
   - Covers both HER2-positive and HER2-low unresectable/metastatic breast cancer settings.
   - Maps DESTINY-Breast03 and DESTINY-Breast04 and links mature DESTINY-Breast03 follow-up.
   - Keeps interstitial lung disease/pneumonitis and cardiac monitoring prominent in the clinical profile.

## Audit of the existing fifteen profiles

All previously complete profiles now contain a visible `evidence_audit` section covering:

- foundational or protocol-defining evidence;
- evidence for each encoded indication;
- mature efficacy follow-up;
- later add-on, combination or sequencing evidence;
- schedule and population applicability;
- important negative, limiting or residual evidence gaps.

Material gaps closed in this release include:

- metastatic pancreatic evidence added to the shared modified FOLFIRINOX profile;
- NeoSphere added to explain the pertuzumab contribution within the TCHP evidence chain;
- metastatic colorectal, advanced gastric/GEJ and duration evidence added to mFOLFOX-6;
- colorectal, gastric/GEJ and pancreatic contextual evidence added to FOLFIRI;
- cervical and endometrial disease evidence added to the shared carboplatin/paclitaxel profile;
- five-year KEYNOTE-407 follow-up linked;
- SUNLIGHT retained and clearly separated from the encoded Lonsurf monotherapy pathway.

## Evidence-governance interface

- Adds visible evidence-relationship labels.
- Adds a per-regimen **Evidence completeness audit** section.
- Separates direct protocol evidence from contextual combination, sequencing or practice-changing later evidence.
- Displays declared uncertainties rather than implying that every indication has equivalent evidence strength.

## Clinical boundary

This release changes knowledge and evidence presentation only. It does **not** modify:

- any of the 382 protocol JSON files;
- laboratory or toxicity thresholds;
- dose-modification actions;
- renal or hepatic pathways;
- treatment-clearance logic;
- the clinical scenario interpreter.

The official current NCCP protocol, local governance and independent oncology judgement remain authoritative. All profiles remain pending consultant oncology and oncology-pharmacy review.
