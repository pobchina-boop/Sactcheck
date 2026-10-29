# Erlotinib and gefitinib full-suite source audit — v0.84.26

Checked 29 October 2026 against freshly downloaded official NCCP and EMA documents. Original PDFs, text snapshots, SHA256 provenance and page references are in `research/` and `sources.json`. Both NCCP page-2 dose tables were visually inspected using the retained PNGs; inequalities were verified against the image. Independent Consultant and oncology-pharmacy review is still pending. Software checks are not clinical validation.

## Scope and deliverables

Complete proposals retain protocol identities and compatible legacy fields. Complete `authoring.json` covers patient portal, mechanism, anatomy, relative journey, clinical knowledge, indication-specific evidence, supportive care and card contexts. Separate new consent-profile proposals preserve serious lung, liver, eye, skin and gastrointestinal risks. Both medicines are continuous daily oral targeted therapies, with no invented chemotherapy cycle or fixed course cap. Root owns canonical integration, clinical-suite rendering and PDF verification.

- 00219 erlotinib: 34 optional inputs, 28 source-specific rules; NCCP v6.
- 00220 gefitinib: 30 optional inputs, 24 source-specific rules; NCCP v5.
- Proposed-mode and canonical integrated-mode verification: **367 / 367 passed in each mode**, using the actual assessment engine, protocol validator and dose-schedule renderer. `node validation/lung-next-v08426/egfr/source-cases.cjs --integrated` tests canonical integration and writes a separate report.

## Erlotinib findings

The old single indication conflated first-line and maintenance. Three source indications are now separate: 00219a first-line activating-EGFR advanced NSCLC, 00219b switch-maintenance after stable disease following first-line chemotherapy, and 00219c after failure of at least one previous chemotherapy regimen. Global NCCP eligibility still requires a validated activating EGFR mutation, even though the c-row does not repeat it. The broader historical EMA wild-type exception is not silently added. ECOG source eligibility is **0–3**, correcting the old >2 review threshold.

NCCP v6 history records a **20 May 2026 administrative amendment** to review schedule and antiemetic links; the footer's last clinical-review date remains **10 March 2021**. The proposal does not misrepresent the threshold table as newly clinically reviewed in 2026.

The 150 mg daily schedule requires at least **1 hour before or 2 hours after food**. Missed doses are not replaced; a dose vomited within a few hours is not repeated. FBC, renal and liver profiles are **every 60 days**, with extra renal/electrolyte tests (including potassium) for diarrhoea/dehydration and closer liver monitoring when indicated. No routine serial echo schedule is invented.

Grade 3 diarrhoea unresponsive to antidiarrhoeal treatment for **24 hours** triggers interruption until **grade <1 (grade 0)**, followed by Consultant-directed next-level reduction. Grade 4 requires **>24 hours** of unresponsiveness for the source discontinuation instruction. Exactly 24 hours is not >24; severe symptoms still trigger prompt review. The source says discontinue, not an invented permanent-stop/rechallenge policy. Dehydration independently triggers a hold and intensive IV rehydration. Current grade alone cannot infer response to medication or duration.

Grade 3 skin toxicity may require interruption. Grade 4 may require 7–14 days of interruption, reduction on resuming or discontinuation: these source choices remain explicit Consultant review. Uncontrolled grade 3/4 toxicity needs source-step reduction **150 → 100 → 50 mg**, without multiplying percentages or inventing a dose below 50 mg. Restart is not calculated when recovery, current dose or another limitation remains unresolved.

CrCl **<15 mL/min** must not be used; exactly 15 does not meet this numerical condition. The separate source severe-renal exclusion remains available. Severe hepatic dysfunction is excluded; source language refers to AST/SGOT **and** ALT/SGPT >5 ×ULN. A highest-ALT/AST alias alone does not prove both tests or clinical severe impairment, so abnormal results require review and a separate severe-dysfunction assessment. EMA severe on-treatment liver changes trigger interruption.

Smoking lowers exposure; cessation support and medication review are included, without an automatic 300 mg escalation. Avoid PPI combinations. If antacids are necessary, EMA timing is at least 4 hours before or 2 hours after erlotinib. The EMA historical ranitidine example is erlotinib at least 2 hours before or 10 hours after; it is not a recommendation to prescribe ranitidine or universally transfer its timing to other H2 blockers. Pharmacy must resolve actual available medicines. CYP interactions, grapefruit and warfarin/INR review are covered.

## Gefitinib findings

00220a remains adults with activating-EGFR advanced NSCLC, ECOG **0–2**. NCCP v5 is dated **14 July 2025**, review due 14 July 2030. Baseline includes FBC, renal/liver profile, chest X-ray and CT; subsequent blood tests are **as clinically indicated**, not an invented monthly schedule.

Dose is **250 mg daily with or without food**. A missed dose may be taken unless **less than 12 hours** remain before the next dose; exactly 12 hours is outside the skip condition. No double dose. Pharmacy-supervised water dispersion is included without crushing: may take 20 minutes, drink within 60 minutes and rinse the glass. No copied erlotinib acid-suppression interval or unsourced repeat-vomiting instruction.

Poorly tolerated diarrhoea/skin reactions may use interruption **up to 14 days**, followed by reinstatement of **250 mg**, not a generic 50% or 75% toxicity reduction. Inability to tolerate after interruption triggers discontinuation and an alternative plan. More than 14 days prompts review, not an invented automatic restart.

**Hepatic source conflict is preserved:** NCCP Child–Pugh B/C table says 50% original dose; current EMA describes increased exposure with cirrhosis-related B/C and close monitoring without a 50% dose instruction. The usual tablet is 250 mg. No automatic 125 mg, splitting instruction or unsourced alternate-day regimen is emitted; Consultant/pharmacy must reconcile the prescription. Metastases/Child–Pugh A does not trigger this reduction. Severe liver changes require review and consideration of stopping; generic >5 ×ULN automatic hepatitis attribution is removed.

**Renal qualification is preserved:** NCCP expects no adjustment including haemodialysis; EMA says no adjustment at CrCl >20 and cautions at **≤20 mL/min** because of limited data. The latter and dialysis require review rather than unconditional clearance. The legacy `targeted_renal_band='dialysis'` internally normalises to decision_value 1; both are handled. A normal alias cannot erase an adverse numerical value.

## Shared safety and evidence

Suspected ILD/new respiratory symptoms interrupt treatment pending diagnostic evaluation; confirmed ILD stops treatment. A pneumonitis grade is not diagnostic confirmation. Discordant negative flags cannot erase independent positive findings. Keratitis, serious skin changes, bowel perforation, hepatic events, interactions, pregnancy/breastfeeding and hypersensitivity have explicit component actions. Erlotinib bowel perforation has an explicit permanent-stop instruction; gefitinib requires urgent hold/review without claiming an identical source permanent-stop mandate.

Erlotinib pregnancy is specialist benefit–risk review rather than an invented NCCP absolute exclusion; breastfeeding stops during treatment and for at least 2 weeks afterwards. Gefitinib retains the narrower NCCP pregnancy/breastfeeding exclusion. Its product information does not supply a universal post-treatment contraception interval; no period is borrowed from another drug.

Clinician evidence reports OPTIMAL first-line PFS **13.1 vs 4.6 months, HR 0.16**, and final OS **22.8 vs 27.2 months, HR 1.19 (95% CI 0.83–1.71)**, not statistically significant. These are not maintenance or later-line estimates. SATURN and BR.21 are separately identified as historical biomarker-unselected evidence with limited quantitative applicability to NCCP activating-EGFR eligibility.

IPASS evidence uses only the EGFR-positive subgroup **n=261**: PFS **9.5 vs 6.3 months, HR 0.48**; OS **21.6 vs 21.9 months, HR 1.00 (95% CI 0.76–1.33)**, not significant. Whole-trial results are not substituted. OS was 78% mature and 64.3% of mutation-positive chemotherapy patients received subsequent EGFR TKI. No head-to-head superiority over current EGFR agents or individual survival prediction is implied. Patient evidence has no numeric trial metrics.

Support follows oral minimal-to-low emetic guidance and individual as-required medicines; no copied parenteral NCIS prophylaxis, mandatory antibiotic or automatic supportive prescription. All patient source IDs resolve.

## Integration notes

Legacy `TARGET_PNEUMONITIS_G2` and `TARGET_HEPATITIS` generic rules are replaced by explicit suspected/confirmed ILD and liver context/severity pathways. Existing `TARGET_DIARRHOEA_G3`, `TARGET_RASH_G3`, organ-function IDs and field aliases are retained where clinically compatible but actions change to source-defined review where generic reductions were unsupported. Regression tests expecting those old automatic decisions must be updated against this audit, not used to restore incorrect behavior. All approvals remain false. Canonical integrated cases have passed after root copied the proposals. Root retains ownership of wider full-suite/browser/PDF regression.
