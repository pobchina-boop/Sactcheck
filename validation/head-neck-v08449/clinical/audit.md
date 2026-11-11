# NCCP head-and-neck source audit — 0.84.49

Baseline: a54aa0e5306c06c0e02f203b30b6f094ad13382c (0.84.48). Retrieved 11 November 2026. Sources/index.json records the original URLs, redirects, response status and SHA256 of each retained PDF. This is a source reconciliation and software test report, not independent clinical, oncology pharmacy or patient/PPI approval.

## New authored services

| Code | Retrieved version | Source sections | Main corrections |
|---|---|---|---|
|00514|3|pp1–3, Tables1–3|Gemcitabine1250 D1/D8 every21 days, max6; low emetic risk. Separate day1 delay/day8 omit/reduce; equality overlap reviewed. Bilirubin >27 (strict), source grade >3 (strict), subsequent75% original gemcitabine after specified previous myelosuppression.|
|00517|2|pp1–4, Tables1–3|Gemcitabine1250 D1/D8 with cisplatin80 D1, 4–6cycles. Baseline eligibility separated from on-treatment dose table; cisplatin renal and nerve actions remain component-specific; bilirubin≥27 source800mg/m² gemcitabine. Day8 no cisplatin support.|
|00903|1|pp1–4, Tables1–3|Gemcitabine1000 D1/D8 plus cisplatin80 D1, maximum3 induction cycles. Subsequent CRT starts21–28 days from Day1 of last induction cycle. Day8 delay means omit, not reschedule. Cisplatin40–49=50mg/m² and50–59=65mg/m²; no percentage conversion. Grade≥2 non-haematological interruption threshold.|
|00589|5|pp1–5, Tables1–3|Carboplatin70mg/m² each D1–4, FU600mg/m²/day D1–4, q21x3 with RT. Moderate emetic risk. New hepatic severity table replaces obsolete numeric liver thresholds. Unique baseline creatinine>120 orCrCl≤50 exclusion; ANC1.5 overlap reviewed.|
|00591|4|pp1–6, Tables1–3|CarboplatinAUC4 D1, FU600mg/m²/day D1–4, q21x3 withRT. High emetic risk. Updated hepatic/renal table, source-specific count bands, fractional gaps reviewed. No imported00589 baseline renal exclusion.|

00517 discrepancy remains OPEN: the current HSE head-and-neck index links to version2; the October2025 NCIS list names version3. The retained, reproducible encoding follows the linkedv2. No claim is made to have retrieved or reconciledv3. Reconcile with NCCP before clinical use. The discrepancy is included in the clinical metadata and patient source notes.

Common checks: DPD first-dose status, renal effects on uracil phenotyping, partial versus complete deficiency, hydration, current/prior toxicity, prior permanent stop, component-specific findings, missing context, severe skin/pulmonary/haemolytic safety warnings. Product-information safety warnings are identified as prescribing safety review, not a quantitative NCCP dose table. No automatic restart, dose stacking or fixed dose is inferred from discretionary source text.

Printed boundaries are preserved:00514/517 day8 exactANC1/PLT100 overlap;00517 renal59–60 gap/exact60;00903 renal49–50 and59–60 gaps;00589 ANC1.5 overlap andPLT99–100 gap;00591 ANC.99–1 andPLT99–100 gaps. Review findings do not claim clearance. Tests use independent expected constants, not a sweep generated from current rules.

## Retrospective five

00315v7a,00323v7b,00324v6b,00332v4 and00419v6 (HNSCC context) were freshly retrieved. Their PDF hashes match the retainedv48 originals. The prior TPF and carboplatin scenario suites are rerun and saved under this release. Current clinical encodings, consent risks, monitoring, support phases, knowledge, three-page anatomical packs, QR/wallet dimensions and consolidated handbooks are retained when unchanged; there is no invented requirement to modify all five.

## Patient and clinician consistency

New content distinguishes recurrent/metastatic treatment, induction followed by separately prescribed chemoradiation, and concurrent RT.No unrelated protocol is introduced. The two carboplatin doses are never interchanged. Gemcitabine schedules retain D8 count checks;00517 includes the source D8 creatinine, whereas00903 requires D8 FBC. Consent retains agent-specific serious risks, fertility and alternatives; gemcitabine off-label use is stated for00514/517. Knowledge evidence separates a randomized induction study from an earlier single-arm study and avoids extrapolating numeric benefits to different schedules. RT continuation, hydration, renal interpretation and local adjunct prescriptions remain team-reviewed. CUH adjunct reference, including PPI, is preserved where present; multi-day antiemetic prescribing is not silently replaced by a single-day script.
