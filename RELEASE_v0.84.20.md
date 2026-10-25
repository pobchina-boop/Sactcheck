# SACTCheck v0.84.20

This release adds capivasertib/fulvestrant as a newly published executable NCCP regimen and completes five service suites, alongside five endocrine retrospective reviews. It is a cumulative update over GitHub v0.84.18 (`6c1050b8a2ced301fe770fe67fd518b5a78566e5`) and includes the delivered v0.84.19 package.

## Scope

| New full suite | NCCP code | Source version |
|---|---|---|
| Capivasertib + fulvestrant | 00947 | 1 |
| Intravenous vinorelbine | 00232 | 5 |
| Oral vinorelbine | 00259 | 6 |
| Carboplatin every 28 days | 00251 | 6 |
| Carboplatin every 21 days | 00261 | 7 |

Retrospective reviews: tamoxifen 00253 v6, anastrozole 00254 v5, fulvestrant 00361 v4, letrozole 00371 v4 and exemestane 00376 v4. Sources checked 25 October 2026. Every suite includes assessment, dose/schedule, clinician rationale and evidence, patient reference, medicine mechanisms/body maps, date-free timelines, monitoring, consent, guide/passport/card, practical logistics and support scripts.

## Material source findings

- Capivasertib preserves its four-days-on/three-days-off pattern, 400/320/200 mg twice-daily levels, and separate fulvestrant loading/maintenance visits. Glucose, HbA1c, diabetes, metformin, DKA, toxicity recovery/history and CYP3A pathways are explicit. Fulvestrant hepatic source conflict requires review.
- Vinorelbine retains separate oral/IV eligibility, schedules and dosing. Oral escalation depends on the first-three-dose nadirs; no patient-led escalation or route conversion. Current IV product/NCCP platelet, infusion-time and hepatic differences require reconciliation.
- Carboplatin retains q28 strict-count boundaries and q21 inclusive boundaries, source AUC selection, Calvert restrictions and creatinine >110% of isotope-baseline review. q28 early counts on Days 13–15 and Day 21 remain distinct. Breast off-label consent and local approval are explicit.
- Both standard carboplatin AUC4–6 schedules use HIGH emetic risk and the dedicated NCIS V8 carboplatin row, without routine olanzapine. Printed metoclopramide frequency is not silently changed to PRN or an indefinite duration.
- Endocrine review separates baseline and ongoing checks, product/NCCP differences, menopause/ovarian suppression, tissue-specific effects, organ-function instructions and treatment-duration decisions.
- Clinician evidence preserves population, comparator, endpoint and maturity. CAPItello-291 final OS is not significant; TNT is directly q21/AUC6 and indirect for q28. Patient information has qualitative benefit discussions without numerical trial outcomes.

## Coverage and remaining work

Current early/advanced NCCP breast pages contain 84 unique codes, including shared/multisite entries: 82 now have authored suites. Remaining new suites are bevacizumab 00212 and 00215. The earlier 71/71 figure referred only to entries whose local tumour group was exactly Breast; that local subset is now 72/72. Local 00798 is retained although absent from the two current catalogue pages; it requires source surveillance, not automatic deletion.

There are 104 authored suites across the platform, 66 reviewed through the current retrospective standard, and 38 remaining in the platform queue. The exact-Breast retrospective queue has ten entries: 00272, 00285, 00322, 00414, 00525, 00619, 00776, 00794, 00892 and 00936.

Suggested next work: complete the two shared bevacizumab suites and review the five endocrine-targeted combinations 00322, 00414, 00525, 00619 and 00892. Then review trastuzumab SC 00272/00285, trastuzumab deruxtecan 00776, sacituzumab govitecan 00794 and tucatinib combination 00936.

## Verification

- Source-based integration: capivasertib 229, aromatase inhibitors 300, tamoxifen/fulvestrant 170, vinorelbine 258, carboplatin 302: **1,259 total**.
- `npm run test:ci`: release gate, security checks, protocol build, full regression, Pages build and built-site security.
- 80 PDF documents / 150 pages, identical `patient/` and `docs/patient/` copies, page-boundary checks and 40 QR decodes.
- Browser QA: new-regimen discovery, clinic workflow, capivasertib high-glucose hold, cycle-1 versus ongoing fulvestrant visits, patient timeline, carboplatin calculated creatinine ratio and exact 110% boundary, dedicated antiemetic support.
- 3,081 out-of-scope patient files preserved against delivered v0.84.19. Explicit scoped hash migrations and reproducible builders are included.
- Clean v0.84.18 overlay checks are recorded separately in `validation/endocrine-next-v08420/clean-overlay-validation.json`.

Independent consultant, oncology-pharmacy and patient/PPI review remains pending. Software checks and source reconciliation do not establish clinical authorisation. The feasibility notice remains visible.
