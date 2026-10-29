# NCCP 00271 and 00280 source reconciliation — v0.84.23

Checked 26 October 2026 against the current [NCCP lung catalogue](https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/lung-sact-regimens/) and the complete official PDFs. This is software/source reconciliation. Independent consultant, oncology-pharmacy and patient/PPI review remain pending; clinical-use authorisation remains false.

## Sources and visual verification

- **00271 v6**, six pages, revision 1 April 2026, review date 30 August 2027. Official PDF/text and rendered schedule/count/organ-function tables are retained in `research/`.
- **00280 v7**, six pages. The former `280_V6_Cisplatin_and_Etoposide.pdf` URL returns 404. The current catalogue links `280_CISplatin_and_Etoposide.pdf`. Version 7 is dated 29 June 2026; its footer still records last review 24 June 2021, and the version box changes future review to “as required”. These are kept distinct.
- **NCIS Medical Oncology antiemetics v8 (2025)**, six pages: Table 1 and the following multi-day guidance were visually inspected.
- Source PDF SHA-256 and extracted-text SHA-256 are recorded in `sources.json` and proposed metadata. The downloaded documents, extracted text and rendered key pages are retained.
- Important extraction issue: the PDFs use underlined greater-than signs for **≥**. Visual inspection confirmed 00271 full-dose counts **ANC ≥1 AND platelets ≥100**, and 00280 **ANC ≥1.5 AND platelets ≥100**. The text extractor loses the underline; no artificial gap was encoded at those exact boundaries.

## Treatment, indication and eligibility

Both sources are for **extensive-stage SCLC**. They are distinct from 00279 limited-stage SCLC with radiotherapy and 00456/00561 NSCLC thoracic-radiotherapy regimens. These suites do not implicitly include immunotherapy, immunotherapy maintenance or radiotherapy.

00271 gives carboplatin AUC5 on Day 1 before etoposide 100 mg/m² IV on Days 1–3, every 21 days. Its duration wording remains **4–6 cycles or until disease progression or unacceptable toxicity develops**. Eligibility requires being unsuitable for cisplatin, ECOG 0–2, or ECOG 0–3 if younger than 70. The ECOG3 exception needs age context; age is not assumed. Hypersensitivity, pregnancy and breastfeeding remain exclusions.

00280 gives etoposide 100 mg/m² IV on Days 1–3 and cisplatin 75 mg/m² IV on Day 1 **after etoposide**, every 21 days for **4–6 cycles**. The June 2026 source gives a one-hour cisplatin infusion. Eligibility is ECOG 0–3. It excludes pre-existing neuropathy ≥grade2, baseline CrCl <60 mL/min, significant hearing impairment/tinnitus, severe hepatic impairment for etoposide, hypersensitivity, pregnancy and breastfeeding. Pre-existing neuropathy is distinguished from a treatment-emergent event.

Both PDFs explicitly offer an alternative with IV etoposide on Day 1 and **oral etoposide 100 mg/m² per dose twice daily on Days 2–3**, with prescribed capsule strengths and empty-stomach administration. The all-IV and IV/oral schedules are labelled as alternatives, not sequential phases. Both have complete dose/schedule models. Patient content, logistics and support describe the alternatives; primary all-IV treatment remains first. Route is `intravenous_with_explicit_oral_alternative` for root sustainability integration.

00280 permits considering carboplatin substitution for cisplatin toxicity, poor function or age >75. Its fractionation footnote says the total dose may be split over three days but explicitly writes only “25 mg/m² on day 1”. The tool asks for a signed full schedule rather than manufacturing an executable split-dose order. Associated hydration and antiemetics require review for the actual split schedule.

## Count and history audit

| Source | Encoded action | Uncertainty retained |
|---|---|---|
| 00271 ANC 0.5–<1 or platelets 75–<100 | Delay one week until recovery | Full-dose row requires both count domains; one normal value never clears the whole assessment. |
| 00271 ANC <0.5, neutropenic fever or platelets <50 | Delay and **consider** a 25% reduction of both drugs | This is not a definitive calculated dose; dose-modification model remains unquantified. |
| 00271 platelets 50–<75 | Consultant/pharmacy review; no authorisation | This interval is absent from the source table. It is neither assumed normal nor given an invented percentage. |
| 00280 ANC 1–1.49 or platelets 75–99 | Etoposide 75% | Table title mentions both drugs, but the dose column explicitly says **Dose Etoposide**. Do not automatically reduce cisplatin. |
| 00280 ANC <1 or platelets <75 | Delay | Independently entered low counts remain actionable. |
| 00280 ANC >1.49–<1.5 or platelets >99–<100 | Consultant/pharmacy review | Literal fractional seams are not silently rounded. |

Neither current source supplies a separate prior-nadir algorithm. Inputs explicitly request current pre-treatment counts. Previous severe toxicity and fever remain clinically relevant but do not import another regimen’s nadir rules. 00280 has no separate FN percentage row: fever requires prompt assessment/withholding pending review, not an invented 25% reduction. Missing linked history never blocks an independently known exclusion or delay.

## Renal, hepatic and toxicity rules

- **Carboplatin:** Calvert GFR remains exact continuous input with source metadata; GFR ≤20 means do not administer. Source caps the GFR used at125. CrCl <60 warns of increased marrow toxicity. Measured GFR is preferred; estimated dosing needs creatinine within48hours. A rise above110% of isotope-baseline creatinine prompts reassessment. Obesity/low creatinine or other estimate unreliability triggers review. GFR is not silently treated as etoposide CrCl.
- **Cisplatin:** baseline CrCl <60 exclusion is preserved separately from the later renal-modification table. Established-treatment CrCl45–59 gives75%; <45 requires considering carboplatin/clinical decision. The unassigned59–60 fractional interval prompts review. If treatment stage is omitted, the conflicting baseline/modification contexts are explicitly shown rather than choosing a percentage. Legacy <60/≥60 bands remain accepted but cannot select a precise component action.
- **Etoposide:** both sources give CrCl15–50→75%, <15→50%, with subsequent doses based on tolerance/clinical effect. These are source-threshold numeric inputs, not Calvert inputs.
- **Etoposide liver table:** bilirubin26–51 µmol/L or AST60–180 U/L→50%; bilirubin>51 or AST>180 requires a clinical decision. A severe result suppresses a simultaneous moderate-row percentage. Either absolute result can trigger its relevant action independently; missing other domains remain unassessed. Legacy bilirubin/ALT ULN multiples cannot substitute for absolute bilirubin/AST.
- Carboplatin hepatic table says probably no modification; cisplatin hepatic table says no reduction. Neither wording is copied onto etoposide.
- **00280 neuropathy ≥grade2:** after recovery to≤grade1, consultant chooses carboplatin substitution **or** 50% cisplatin; etoposide100%. The choice remains unquantified. Baseline ≥grade2 remains an exclusion.
- **00280 grade3 other toxicity:** excludes mucositis and alopecia; delay to grade1, then both drugs75%. Neuropathy has a separate pathway. Grade4 is not silently assigned the grade3 restart dose: withhold/urgent consultant review.
- The source does **not specify a CTCAE edition**. All grade controls have explicit source-specific “edition unspecified” metadata and descriptions. Generic CTCAE v5 descriptors are removed. The old fabricated 00271 graded diarrhoea/stomatitis reduction rules are removed. Symptom review remains available without manufacturing a percentage. 00280 mucositis remains excluded from the generic75% pathway.
- Hypersensitivity, infection, hearing/neurological symptoms, nephrotoxic/ototoxic medicines and etoposide interactions are retained as review/action pathways. Current medicine databases and local management are still required.

## Monitoring and supportive care

00271: baseline FBC/renal/liver profile and measured or estimated GFR; weekly FBC prior to treatment, renal/liver profile before each cycle, regular hearing/neurological review, particularly after platinum/ototoxic exposure. 00280: baseline and cycle blood/renal/liver profiles, audiology/CrCl when indicated, and hearing/sensory history before every cycle. Cisplatin hydration, fluid balance and electrolyte replacement are explicit. Disease monitoring follows the consultant’s plan; no arbitrary universal scan schedule is added.

00280 source suggests using the1L etoposide infusion as prehydration, then cisplatin, with posthydration containing10mmol magnesium sulphate and20mmol potassium chloride in1L saline over2hours. These are identified as source suggestions requiring local policy and patient-specific fluid/electrolyte review. Mannitol is discretionary; routine furosemide is not advised without fluid overload. 00271 supplies no prescriptive extra hydration schedule, so none is invented.

**Multi-day antiemetics:** carboplatinAUC5 uses the dedicated NCIS carboplatin row (`nccp-v8-carboplatin-v08420`), without default olanzapine. Standard cisplatin uses the high-risk row including olanzapine. Both standard schedules have etoposide on Days1–3. NCIS p5 requires risk-appropriate prevention on each SACT day and for two days afterwards, hence review through **Day5**. The authoring contains the actual Table1 reference components and explicitly requires reconciliation of Days2–3 etoposide prevention, overlapping dexamethasone, delayed platinum effects and the Day5 plan. NCIS does not prescribe one universal complete three-day-platinum/etoposide course; no invented steroid extension or use of the separate five-day cisplatin aprepitant exception is added. Olanzapine/metoclopramide extrapyramidal risk and ondansetron QT risk are stated.

## Evidence and service authoring

The clinical/evidence cards distinguish pooled COCIS findings from the JCOG9702 trial. JCOG9702 used etoposide80mg/m², split cisplatin25mg/m² on Days1–3, four courses and G-CSF, so it cannot supply an exact survival estimate for the current NCCP100mg/m² schedule. Patient metrics remain empty and qualitative. Neither older chemotherapy comparison ranks current immunotherapy combinations. Product information supports mechanism/risk explanations; HPRA oral-capsule information supports route-specific handling and missed-dose advice.

Both full authoring entries include patient knowledge, questions, consent support, drug mechanism visuals, anatomy arrays, daily chronology, whole-course journey/monitoring, practical visits, source links and support plans. No patient dates, duplicate urgent/support anchors, breast-selector inclusion, or inherited pemetrexed/vitamin content is present. All review/approval flags remain false.

## Validation and integration

`source-cases.cjs` passes **211/211** cases in proposed mode. It executes the real assessment engine, dose-modification model and strict validator, covering exact/fractional seams, exclusions, independent partial inputs, missing stage/history, moderate/severe liver conflicts, alternative-route schedules, numeric-input policy, source grading and authoring/source-ID contracts. Both protocols have zero validator warnings. Rules:00271 **36**, 00280 **42**.

Root integration:

1. Copy the two files in `proposed/` over their matching `protocols/lung/` files, preserving filenames and existing `protocol_id` (`nccp-00271-v7`, `nccp-00280-v6`). Source versions are separately6 and7.
2. Merge `authoring.json.regimens` into the v0.84.23 authoring input. Build patient/KB/consent/support/journey outputs using the root-scoped builders.
3. Run `node validation/lung-next-v08423/iv-etop/source-cases.cjs --integrated`.
4. Root owns patient PDF, QR/download parity, browser and whole-repository regression validation; no release PDFs or live files were generated/changed by this bounded task.

Regeneration, if needed: run `build-proposed.py`, `build-authoring.py`, then `polish.py`, all in this folder, followed by the harness. Source hashes refer to the downloaded official PDFs/text, not regenerated release documents.
