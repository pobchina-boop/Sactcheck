# v0.84.33 triplet source reconciliation

Checked 4 November 2026 against the current [HSE gastrointestinal catalogue](https://healthservice.hse.ie/staff/information-healthcare-workers/nccp/gastro-intestinal-sact-regimens/). This is a source and software reconciliation; independent consultant and oncology-pharmacy sign-off remains pending. Stable protocol identifiers were retained so saved patient links remain valid.

## Source provenance

| Code | Current official source | Pages | Important provenance change |
|---|---|---:|---|
| 00555 | [FOLFOXIRI v7](https://healthservice.hse.ie/documents/6386/555_FOLFOXIRI_therapy.pdf) | 9 | The catalogue now links v7, reviewed 19 August 2026. The previously recorded v6b URL returns 404. Search-engine caches still expose the old document. |
| 00783 | [Bevacizumab 5 mg/kg + FOLFOXIRI v2a](https://healthservice.hse.ie/documents/6660/783_v2a_Bev_5_FOLFOXIRI_therapy.pdf) | 12 | Current version remains 2a. |
| 00691 | [Rectal FOLFIRINOX v4](https://healthservice.hse.ie/documents/6531/691_v4_Folfirinox_Rectal_carcinoma.pdf) | 9 | Current version remains 4. Includes the subsequent capecitabine/radiotherapy phase. |

PDF and extracted-text SHA-256 values are in `sources.json`; unmodified initial protocol snapshots are `*-existing.json`. Local PDF render checks include `00555-p3.png` and `00691-p7.png`. `before-after-evidence.json` records actual old-engine failures and their corrected outcomes.

## Material corrections

### 00555 FOLFOXIRI

- **Counts:** baseline ANC must be at least 2 ×10⁹/L and baseline platelets at least 100 ×10⁹/L (p2). Subsequent cycles use ANC at least 1.0 and platelets at least 75 (p3). The previous 1.5 cycle ANC threshold was incorrect. Failure to recover after two weeks prompts consideration of discontinuation, not an automatic stop.
- **Recurrence matrices:** Tables 1–3 on p3 are different. First/second ANC-delay events reduce irinotecan to 150 mg/m², with oxaliplatin 60 mg/m² at the second event and 5-FU 75%/50% of original. Day-1 platelet events use oxaliplatin 60 and 5-FU 75% at both first and second events; the merged 75% cell was checked visually. Platelet-nadir events instead use 75% then 50% 5-FU. Third events stop treatment.
- **Renal and hepatic update:** v7 no longer excludes all CrCl <30. Oxaliplatin <30 requires consideration of 50%; irinotecan <10 uses a consultant-selected 50–66% initial range. The strict `>10/<10` and `>30/<30` rows leave exact 10 and 30 unassigned. 5-FU severe hepatic impairment is not recommended; mild/moderate advice requires absence of concurrent renal impairment (p4 Table 4). The older absolute 85/180 5-FU rules must not be reapplied to this updated source.
- **Toxicity:** p5 Table 5 separates qualifying diarrhoea recurrence, mucositis/HFS, transient neurotoxicity, persistent grade 3 neurotoxicity, and laryngopharyngeal dysaesthesia. Source “decrease by 25%” instructions require current-dose review; they are not silently converted to 75% of the initial protocol dose.
- **Support:** the source states overall **high** emetic risk (p5). The previous moderate mapping inferred from component grades was wrong. Atropine premedication and the delayed-diarrhoea plan remain distinct. Suspected/confirmed HUS and oxaliplatin anaphylaxis have component-specific actions (p7).

### 00783 bevacizumab + FOLFOXIRI

- **Counts:** ANC 1.5 and platelets 75 for treatment, compared with baseline 1.5/100. The old cycle ANC 1.0 threshold missed the hold at 1.2 (p2 and p4).
- **Proteinuria:** a generic grade-2 hold was removed. Dipstick 2+/3+ or concentration ≥1 g/L permits scheduled bevacizumab with a 24-hour collection within three days before the next dose; 4+ requires a hold. Quantified protein >2 to 4 g/24 h requires a hold and repeat testing every two weeks; >4 requires stopping. Exactly 2 is not in the hold band; exactly 4 remains a hold (p6 Table 6). A grade label alone cannot choose this pathway.
- **Bevacizumab hazards:** source-specific holds/stops include uncontrolled/symptomatic hypertension; grade 4 or persistent grade 3 hypertension; severe pressure above 200/110 despite medication; any arterial or grade 4 venous thromboembolism; grade ≥3 haemorrhage; TE or grade 4 fistula; perforation; PRES; necrotising fasciitis; and surgery/wound-healing timing (pp7–9). These affect bevacizumab, not automatically every cytotoxic component.
- **Organ function:** unlike 00555 v7, this source explicitly assigns irinotecan at CrCl ≥10 and oxaliplatin at ≥30. 5-FU bilirubin >85 µmol/L **or** AST >180 U/L is independently actionable; equality remains unassigned. Clinical moderate/severe impairment reductions are consultant decisions (p5 Table 4).
- **Monitoring/support:** overall high emetic risk (p7). Mandatory baseline/per-cycle bloods and urine/BP monitoring are distinguished from conditional ECG, ECHO after prior anthracycline/chest-wall radiation, and INR monitoring for warfarin (p3).

### 00691 rectal FOLFIRINOX

- **Two source phases:** six 14-day cycles of oxaliplatin 85, folinic acid 400 (200 may be considered), irinotecan 180 and 5-FU 2400 mg/m² over 46 hours; then five weeks of capecitabine 800 mg/m² twice daily on days 1–5 of each seven-day cycle with radiotherapy. The 825 mg/m² alternative is consultant-selected (pp1–2). A context selector required for phase interpretation uses `induction` or `chemoradiation`; missing phase triggers review and never assumes induction.
- **Eligibility/counts:** ECOG 0–1, not 0–2. Current ANC must be at least 1.5 and platelets at least 100. Bowel disease/obstruction and CNS metastases are cautions in this source, unlike their exclusion status in the two FOLFOXIRI documents (pp2,4).
- **Component stops:** third Day-1 ANC event stops **irinotecan**; third Day-1 platelet event stops **oxaliplatin**; third qualifying diarrhoea event stops **irinotecan**. Third severe neutropenic or platelet-nadir Table 3 events stop treatment (p4 Tables 1–3, p6 Table 6). Dashes in other component cells do not mean “stop everything”.
- **Distinct targets:** second severe neutropenic event uses 5-FU 2000 mg/m². Other rows say to reduce the current infusion by 25%; those must not become 75% of original. Transient grade 3 neuropathy uses oxaliplatin 65, while haematological/diarrhoea pathways use 60. Persistent grade 2 says “one dose level” without supplying a unified ladder: that remains a consultant decision (pp4,6).
- **Absolute bilirubin:** investigate the cause; 27–50 µmol/L prompts medically indicated irinotecan 50% dosing, >50 stops irinotecan. This is separate from the >3×ULN exclusion and the 5-FU absolute hepatic table (p6 Table 7).
- **Capecitabine:** CrCl 30–50 uses 75% of the documented starting prescription; <30 or dialysis is not recommended. A value between 50 and 51 is unassigned (p5). Grade 2/3 first and second episodes use 600 then 400 mg/m² twice daily after recovery to grade 0–1. The third grade-2 dose cell is truly blank on visual inspection, not merged 400; grade 3 follows the same sequence. Grade 4 offers discontinuation **or** hold, requiring a consultant choice. Angina/infarction definitively stops capecitabine. Omitted doses are not replaced and toxicity-reduced doses are not re-escalated (pp3,7).
- **Support:** induction is overall high emetic risk; capecitabine is separately minimal-to-low (p7). No universal post-treatment scan interval is invented; disease monitoring and subsequent surgery/adjuvant treatment follow the MDT plan.

## Dose-history and missing-data safeguards

Reference source targets are visible as review advice. Quantified target doses require the documented current component dose to be at least that target, explicit recovery/dose-history reconciliation, and recovered current counts for induction. If a patient is already on a lower dose, the result requires reconciliation instead of raising it. Source ranges, blank cells, conditional percentages and non-unified ladders remain review-only. Invalid unrelated entries do not suppress independently actionable low-count holds.

Schedule integration was tested with the real `protocol-dose-schedule` model, including its required `administration.days` arrays and per-phase `active_drugs`. This caught and fixed an initially invisible schedule. The final model exposes 4 components for 00555, 5 for 00783, and 4 induction plus 1 chemoradiation component for 00691.

## Evidence and verification

`trial-evidence.json` contains primary-source data for GONO/Falcone 2007, TRIBE/Loupakis 2014 plus mature OS/Cremolini 2015, and PRODIGE 23/Conroy 2021. Each includes the population, comparator and endpoint. PRODIGE 23 benefits belong to the entire perioperative strategy, not isolated induction; TRIBE maintenance is distinguished from the NCCP schedule wording.

Run `node validation/colorectal-v08433/triplet-source-audit/source-cases.cjs` from the repository root. **357 of 357 cases pass**, with non-zero exit on failure. Cases cover source boundaries, single-value and invalid-input behaviour, occurrence matrices, history safeguards, component stops, phase isolation, capecitabine recurrence gaps, quantitative proteinuria, surgery timing, HUS laboratory boundaries, and rendered schedules. Results are saved to `source-case-results.json`. Independent clinical/pharmacy review and clinical-use authorisation remain false.

The grading guide review restored practical CTCAE v5 help and materialised descriptions for all ordinary grade fields. Hand-foot syndrome offers only grades 0–3, matching the NCI PPE definition. The NCCP 00783 grade-4 proteinuria stop is explicitly a source-grade selector, not falsely labelled CTCAE v5 proteinuria (which has no grade 4). Source-guide rendering assertions are included in the 357 cases. All clinical fields remain optional for partial assessment; a missing treatment phase still blocks phase-specific interpretation through an explicit review rule.
