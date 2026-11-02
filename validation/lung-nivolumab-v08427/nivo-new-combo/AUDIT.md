# Nivolumab combination source audit — v0.84.27

Checked 29 October 2026. Supplied proposals, complete service authoring, consent-profile updates and source-based executable cases for 00712 and 00792. Independent clinical and oncology-pharmacy approval remain pending; clinical-use flags are false.

## Sources and scope

Fresh official NCCP PDFs retained in research/ are 00712 v3a (11 pages) and 00792 v2 (10 pages). sources.json records original PDF and extracted-text SHA256 values. The previous worker inspected critical tables; the resumed audit independently rechecked the rendered 00712 p7 and 00792 p4 tables against proposals. The current official HSE lung catalogue was also checked: 00712a remains first-line metastatic squamous NSCLC without sensitising EGFR mutation or ALK translocation; 00792a remains first-line unresectable malignant pleural mesothelioma. The current source indication does not establish eligibility for another tumour type.

Current Opdivo/Yervoy product information is separately attributed for myotoxicity overlap and other product-specific precautions. NCCP and product information are not silently treated as identical. Source-grade guidance uses CTCAE v4, not a substituted later edition.

## Schedule and assessment changes

00712 has a 42-day first cycle: nivolumab Days 1/22, ipilimumab Day 1, and paclitaxel/carboplatin Days 1/22 only. Subsequent cycles contain nivolumab/ipilimumab without chemotherapy. The two chemotherapy administrations are not two full 42-day cycles. 00792 is corrected from the old 21-day cycle to a 42-day cycle, with nivolumab Days 1/22 and ipilimumab Day 1. ECOG eligibility remains source-specific: 0–2 for 00712 and 0–1 for 00792. Duration is limited to the source's maximum 24 months without progression, or earlier progression/unacceptable toxicity.

Both immune medicines are withheld together when a joint immune hold applies. Combination Grade 3 colitis permanently stops both, unlike nivolumab monotherapy. Grade 2/3 immune renal toxicity holds; Grade 4 stops. Endocrine actions distinguish symptomatic thyroid/pituitary Grade 2/3, adrenal Grade 2 and diabetes Grade 3 from their respective permanent-stop bands. Current product-information overlap syndrome is explicitly separate: Grade 2 hold, Grade 3/4 stop.

Numeric liver and renal results require explicit immune attribution before an immune permanent-stop pathway. Unattributed abnormalities prompt cause review. Baseline-ratio and ULN-ratio creatinine fields remain distinct; a high baseline ratio alone is not silently classified as Grade 4 ULN toxicity. Independent chemotherapy renal restrictions remain active. Severe infusion reactions identify the culprit before assigning a drug-specific permanent stop; unknown culprit triggers whole-regimen hold/review.

## Printed source ambiguities retained

00712 p7 has three material issues. Day 1 requires ANC ≥1.5, whereas Table 3's full-dose row begins at ≥1.0: ANC 1.0–<1.5 therefore holds for reconciliation. The platelet delay row is printed ≥50 and overlaps the ≥100 full-dose row: 50–<100 holds, and ≥100 now explicitly shows a consultant-review finding about the overlap rather than silently implying source clearance. Paclitaxel hepatic bands have gaps between 1.25/1.26 and 2/2.01 times ULN; those values require review without silent rounding. The terminal ALT ≥10 and bilirubin >5 row does not state AND/OR; either concerning result holds for consultant/pharmacy reconciliation rather than calculating a definitive dose. These remain independent-review items.

Phase controls exclude inactive chemotherapy actions during immune continuation while retaining review of residual abnormalities. Support plans separate first-cycle chemotherapy visits, combination immune visits and nivolumab-only visits; 00792 does not acquire cytotoxic chemotherapy support. Paclitaxel premedication is distinct from antiemetic prophylaxis.

## Evidence and patient materials

Clinician evidence uses the final six-year CheckMate 9LA report (2025) and five-year CheckMate 743 report (2026), with comparator, follow-up, population and applicability limitations. The current 743 report confirms 14% versus 6% five-year OS and HR0.74 (95%CI0.62–0.88), with median follow-up66.8months. Exploratory adjusted/biomarker analyses are not substituted for the main randomised comparison. The prior worker recorded the two 2026 correction notices in sources.json. Trial nivolumab schedules and histological populations are distinguished from the fixed-dose service schedules; patient numeric outcome metrics are intentionally empty.

Patient authoring covers active medicines, anatomy, urgent symptoms, treatment phases, relative timelines, baseline/ongoing tests, consent support, practical guidance, passport and phase-specific supportive care. The shared ipilimumab consent update adds sourced serious, delayed and lasting immune risks without invented event frequencies.

## Verification and remaining work

307/307 proposed checks pass through the actual assessment engine and dose renderer, including source boundaries, missing attribution, alternative causes, phase-specific negative controls, preserved concurrent actions, dose schedules, authored source graph and governance. 00712 now has76rules/61inputs;00792 has51rules/49inputs. Run source-cases.cjs --integrated after canonical integration. Root owns generated-page/PDF verification, browser checks, full regression and packaging. Software checks do not establish independent clinical validation.
