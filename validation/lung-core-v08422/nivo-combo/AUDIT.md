# Nivolumab/ipilimumab with pemetrexed/platinum — v0.84.22 source reconciliation

Checked 26 October 2026. Scope: NCCP 00713 and 00714, assessment proposals and full service-suite authoring. Changes are confined to this validation directory; the release integrator owns live-file replacement and rendered/PDF verification. Independent consultant, oncology-pharmacy and patient/PPI review remain pending. Clinical-use authorisation remains false.

## Source provenance

Both current official NCCP PDFs were downloaded successfully by ordinary curl through the HSE redirect to assets.hse.ie, extracted with `pdftotext -layout`, and inspected as actual rendered tables. `sources.json` records real PDF SHA-256 values and text-snapshot hashes. No hash is invented from a URL or browser excerpt.

- 00713: v4, 14 pages, v4 amendment 6 October 2025, review date 9 December 2029. Source PDF and text in `research/00713.*`; rendered Table 2/3 page in `research/00713-tables23.png`.
- 00714: v4, 13 pages, v4 amendment 4 September 2025, review date 9 December 2029. Source PDF and text in `research/00714.*`; rendered renal/toxicity tables in `research/00714-table4.png`.
- Current NCIS Medical Oncology antiemetic V8 PDF reopened online; Table 1 visually inspected. Local V8 extraction `research/ncis-layout.txt` is a reference copy from the earlier audit, not falsely described as a new binary download.
- NCCP immune Table 1 explicitly specifies CTCAE **v4**. NCI's official v4 PDF was checked for liver/creatinine numeric grading; the old ambiguous baseline-or-ULN input no longer drives a permanent-stop dose action.
- CheckMate 9LA final six-year primary publication (ESMO Open, 29 May 2025; DOI 10.1016/j.esmoop.2025.105123) checked. A current primary-source search again found this final follow-up; later real-world reviews are not used to replace randomized comparative evidence.

## Material corrections

| Domain | Legacy problem | Reconciliation |
|---|---|---|
| Course | 21-day generic course with no phases | **One 42-day induction cycle**, chemotherapy Days 1 and 22 only; immune-only cycles from Cycle 2. Nivolumab every 21 days; ipilimumab every 42 days, Day 1 only. |
| Duration | No source-specific stop/review endpoint | Until progression, unacceptable toxicity or up to 24 months without progression; at least five months immune vigilance after last dose. |
| Indication | Old non-squamous wording attributed to NCCP | Current NCCP removed that restriction from text in May 2025. Preserve the current wording but explicitly require review of pemetrexed suitability for actual histology. EMA pemetrexed remains non-squamous-specific; do not silently license a squamous pemetrexed backbone. |
| Eligibility | ECOG >2 triggered review | Source range is 0–1; ECOG ≥2 now review. Source cautions/exclusions and prior PD-1/PD-L1 reference retained with appropriate uncertainty. |
| Counts | Only low ANC/platelet generic hold; whole regimen affected | Current-count Table 3 (nadir wording removed in v4): ANC <0.5 reduction-after-recovery; 0.5–<1 hold; 1–<1.5 consultant review. Platelets <50 reduction-after-recovery; 50–<75 hold; 75–<100 review; bleeding <50 changes restart reduction. Previous febrile neutropenia covered. Applies to chemotherapy only. |
| Immune colitis | Grade 3 only held | Grade 2 holds; **grade 3/4 permanently stop both immune medicines**. |
| Immune renal | Ambiguous ratio >3 automatically stopped | **Grade 2/3 hold; grade 4 stops**. Separate creatinine/ULN and creatinine/baseline ratios; >6×ULN is grade 4. A baseline ratio alone never identifies grade 4. Legacy mixed denominator is review only. |
| Immune liver | Missing bilirubin severe-stop path; overlapping rules | CTCAE v4 AST/ALT >3–≤5 or bilirubin >1.5–≤3 hold; greater values reach severe immune-hepatitis pathway. Cause must be investigated; values do not establish immune attribution. |
| Other immune toxicity | Endocrine, skin, myocarditis, recurrence/taper and joint holds missing | Source-specific grade holds/stops added, including source distinction between adrenal and thyroid/pituitary grades; SJS/TEN; persistent/recurrent events; worsening despite steroid treatment; restart while immunosuppressed; joint nivolumab/ipilimumab hold. |
| Infusion reaction | Source 'discontinue infusion' encoded permanent drug discontinuation | Severe reaction stops the infusion immediately and prompts emergency/specialist management; does not falsely assert permanent discontinuation from that wording. |
| Cisplatin renal | 45–59 / 30–44 bands | Current source ≥60, 50–59 (75%), 40–49 (50%), <40 not recommended; haemodialysis 50% may be considered but pemetrexed is not recommended. Old spanning bands produce review only. |
| Pemetrexed liver | Shared-template thresholds risk | These sources say mild/moderate no adjustment expected; **severe not recommended**, with no numeric definition. Do not copy 00568's different numerical pemetrexed liver thresholds. |
| Chemotherapy adverse events | Mucositis and generic severe holds only | Diarrhoea/hospitalisation, mucositis, neurotoxicity/recurrence, other toxicity, prior reductions and allergy covered with component-specific restart text. |
| Phase transition | Continued chemotherapy actions/support after chemo ended | Chemotherapy actions excluded in immune-only phase. Persisting abnormal results/toxicity still produce clinical review; they do not generate inactive chemotherapy dose adjustments or an assumed safe result. |
| Antiemetics | Moderate generic mapping | Both induction visits high risk. 00713 uses dedicated carboplatin AUC≥4 row (no routine olanzapine); 00714 generic high-risk row includes olanzapine. Immune-only Day 1 low risk (ipilimumab), Day 22 minimal (nivolumab alone). |

## Numeric boundaries and unresolved source choices

- Carboplatin source caution wording overlaps GFR 20 with an explicit “≤20 do not administer” instruction. Encoding uses prohibition at 20, extreme caution >20–≤30. The caution/restriction does not itself authorise a pemetrexed dose.
- Cisplatin's printed integer bands leave decimal values 49–50 and 59–60 unspecified. Such values produce review rather than rounding or silently assigning a percentage. The output states the actual source percentage only for clearly specified bands; final dose calculation remains specialist review.
- Carboplatin AUC is a source **choice of 5 or 6**. The schedule preserves this as a string choice, with no invented single AUC or patient-specific final dose. Calvert uses verified renal method; source GFR cap 125, recent creatinine requirement and isotope-reference 110% trigger documented.
- Table 2 fixed dose levels and Table 3/5 percentage restart descriptions require reconciliation to the patient's prior doses/reductions. No rule calculates a definitive restart dose, combines reductions or assumes recovery.
- Pemetrexed “severe hepatic impairment” has no numerical definition in these PDFs; consultant assessment is explicit.
- Numeric liver criteria invoke the source immune-hepatitis pathway but require investigation/attribution. Severe renal impairment at baseline and immune nephritis are distinct questions.
- Prior PD-1/PD-L1 treatment refers to separate NCCP guidance rather than a categorical blanket exclusion. The rule prompts review instead of inventing eligibility.
- Source premedication repeats B12 every three cycles if pemetrexed continues. This regimen has only two planned pemetrexed administrations: give initial B12 and do not automatically extend the B12/rash schedule into immune-only continuation. Folate continues 21 days after final pemetrexed.
- The chemotherapy rash steroid reference and antiemetic dexamethasone reference are displayed with an explicit single-prescription reconciliation requirement; aprepitant interaction considered. They are not additive prescriptions.
- NCIS high-risk metoclopramide rows do not specify an end day or PRN qualifier. The draft retains that uncertainty for prescriber/pharmacy duration selection. Low-risk row explicitly has PRN.

## Full-suite authoring

`authoring.json` follows the established v0.84.21 builder contract for both protocols. It supplies:

- Four medicine explanations, agent-specific risks, eight body-map points, qualitative patient evidence, urgent contact content, consent discussion, practical logistics, and eight detailed patient chapters.
- A 42-day reference chronology with separate Day 1/Day 22 visits (`visit22`, avoiding the historical paclitaxel label collision), meaningful day groups, one induction passport page and three immune-continuation pages, and explicit `passport_visit_note`.
- Six date-free journey stages: baseline; Cycle 1 Day 1; Cycle 1 Day 22; Cycle 2+ Day 1; Cycle 2+ Day 22; completion/follow-up. Lanes distinguish blood count/renal/liver every treatment, glucose/TFT each 42-day cycle, baseline cortisol/viral screening, vitamin/steroid tail and platinum follow-up.
- Clinician rationale and final six-year comparative evidence. Overall CheckMate 9LA survival HR 0.74 (95% CI 0.63–0.87), six-year rates 16% versus 10%; descriptive non-squamous subgroup 17% versus 12%. No claim that these represent an individual benefit or a direct cisplatin-versus-carboplatin comparison. Patient material has no numerical survival metric.
- Three support plans per protocol: `induction`, `maintenance-day1`, `maintenance-day22`; lung selector fields explicitly exclude breast. Renal/hydration details differ between platinum choices.

## Validation and integration

Run proposed cases:

```sh
node validation/lung-core-v08422/nivo-combo/source-cases.cjs
```

Run against actual integrated app protocol files:

```sh
node validation/lung-core-v08422/nivo-combo/source-cases.cjs --integrated
```

The harness loads the **real** `js/assessment-engine.js` and `js/protocol-dose-schedule.js`; it does not reimplement clinical rule evaluation. Proposed and integrated runs: **402/402 passed each**. It covers exact numeric boundaries, every immune-grade pathway, omission/false behavior, phase isolation, continuation review, no mandatory fields, source hashes/governance flags, rendered schedule model, authoring/source-reference integrity and support distinctions. Results are written to `proposed-results.json` or `integrated-results.json`.

`proposed/integration-manifest.json` maps stable protocol IDs and exact filenames. Full replacement is intentional because legacy rules were rebuilt from the current source. `build_proposals.py` and `build_authoring.py` reproduce the owned proposals and authoring. The integrated run passed after live-file replacement. The release integrator still owns site/PDF/QR checks. None of these software checks constitute clinical approval.

Runtime compatibility checks confirm all phase risk script IDs exist. `maintenance` without a visit stays explicitly unresolved with no script selected; `maintenance_day1` resolves low and `maintenance_day22` minimal. The three-plan support selector is the explicit prescribing-support route. Induction medicine display identifies ipilimumab as Day 1 only. The recognised `include_in_breast_selector: false` flag accompanies the lung selector.
