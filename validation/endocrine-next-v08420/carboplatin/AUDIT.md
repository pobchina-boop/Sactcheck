# Carboplatin monotherapy source reconciliation — v0.84.20

Source check: **25 October 2026**. Scope: **NCCP 00251 q28 v6** and **NCCP 00261 q21 v7**, preserving every tumour indication while preparing patient services specifically for metastatic breast cancer.

Both proposed protocol JSONs are schema-valid with no errors or warnings. The independent source oracle passes **302/302** cases and exercises **all 103 rules**. The frozen baseline passes **106/302**, with **196 observed failures** against the same expectations. This is software/source reconciliation, not independent clinical or pharmacy approval. Consultant-reviewed, oncology-pharmacy-reviewed and clinical-use-authorised flags remain false.

## Files and execution

- `proposed/00251-carboplatin-q28d.json`: 44 inputs and 51 rules.
- `proposed/00261-carboplatin-q21d.json`: 46 inputs and 52 rules.
- `sources.json`: official/primary URLs, source hashes, source dates and physical-table observations.
- `service-facts.json`: patient mechanism, schedule, toxicity, support, monitoring, consent and logistics; distinct q21/q28 timelines.
- `evidence.json`: primary TNT trial outcomes, populations and limits; q28 evidence explicitly indirect.
- `source-cases.cjs`: independent expected behaviour, not assertions copied from generated rules.
- `source-cases-baseline.json`, `source-cases-proposed.json`: complete source expectations, inputs and actual results.
- `schema-validation.json`: schema output with zero errors/warnings.
- `build-proposed.py` and `build-facts.py`: reproducible proposal/facts builders using downloaded sources in `research-v20/carboplatin` beside the repository.

From repository root:

```sh
node validation/endocrine-next-v08420/carboplatin/source-cases.cjs --mode baseline
node validation/endocrine-next-v08420/carboplatin/source-cases.cjs --mode proposed
node validation/endocrine-next-v08420/carboplatin/source-cases.cjs --mode integrated
```

Baseline intentionally returns nonzero because it exposes the observed missing/wrong safeguards. Integrated mode reads `protocols/breast` and must run after root integrates proposals. No production files or shared calculator files were changed by this bounded audit.

## Source versions and indications

The current source footers retain “last reviewed 28 July 2021”; their version-control boxes show **12 June 2026** updates, chiefly the review schedule and supportive-care links. These dates represent different things and are both retained. From 20 May 2026 these protocols are reviewed as required.

Both protocols contain ten indication codes a–j: three adjuvant gynaecology indications where combination therapy is unsuitable, three advanced stage3/4 gynaecology indications with source surgery/combination qualifiers, three platinum-sensitive recurrent indications, and metastatic breast cancer. The q21 protocol additionally contains head-and-neck stageIII–IV SCC where cisplatin is unsuitable. The proposed JSONs restore all codes; no breast trial benefit is assigned to the other cancers.

Breast use is **off-label in Ireland**. The source requires explanation/consent and hospital DTC or equivalent acknowledgement in line with policy. Reimbursement “N/A” is not treated as funding or clinical approval. Treatment initiation and dose modifications require the consultant pathway.

Breast/gynaecology treatment is Day1 every28 or21 days, continuing until progression or unacceptable toxicity, with the consultant individualising treatment decisions. The q21 head-and-neck indication alone is **AUC5 every21 days for three cycles with concurrent radiotherapy**. Neither this three-cycle course nor the TNT study's six-cycle course is imposed on metastatic breast treatment.

## Physical table inspection changed a critical boundary

PDF extraction is insufficient for these particular count tables. Both were rendered and visually inspected at page4:

| Source | Full-dose row physically printed | Delay row | Encoded equality |
|---|---|---|---|
| 00251 q28 v6 | ANC>1 and platelets>100 | ANC<1 and/or platelets<100 | Exact ANC1 or platelets100 is an unassigned source boundary requiring review |
| 00261 q21 v7 | ANC≥1 and platelets≥100 | ANC<1 and/or platelets<100 | Equality belongs to the source full-dose count band |

Text extraction drops the lower equality stroke from q21. The audit does not normalise these different sources into one shared table. A low independently entered ANC or platelet count still causes delay when the other value is missing. No source-clear count band clears missing renal, eligibility or toxicity domains.

Both protocols note that some patients, particularly ECOG2/3, need higher individual thresholds. ECOG3 eligibility is restricted to poor performance caused by advanced ovarian/peritoneal/fallopian-tube cancer; it is not extended automatically to breast or head-and-neck cancer.

## Renal method, current creatinine and dose history

- Consultant-selected **AUC4–6** is a range, not a universal AUC5/6 prescription. Prior reductions are reconciled; no automatic re-escalation.
- Calvert is selectedAUC × (verifiedGFR+25), giving **mg**, and NCCP caps GFR used at125mL/min.
- Measured isotope GFR is preferred. Source alternatives are Wright or Cockcroft–Gault; indexed laboratory eGFR is not inserted directly as unindexed mL/min.
- Obesity, low muscle mass/low creatinine and postoperative conditions may make formula estimates unreliable. Adjusted ideal weight in overweight/obese patients when no measured result is available, and considering creatinine62 or steady preoperative creatinine when the result is<63µmol/L, are discretionary source decisions; they are not silent automatic replacements.
- For estimated dosing, creatinine is obtained within48hours of treatment and dose recalculated as required per cycle.
- For carrying forward an isotope-based dose, current creatinine must be≤110% of the value at measurement. The proposal accepts **actual current/baseline values and derives their ratio** using the existing opt-in engine. It does not ask the user to calculate a percentage. >110% requests renal reassessment consideration; missing operands stay unresolved. An injected manual ratio cannot override the actual operands.
- GFR≤20: do not administer. >20 through30: extreme caution and consultant/pharmacy review. Below60: increased myelosuppression risk. A supplied value above125 triggers cap review; no larger automatic dose is emitted.
- The obsolete baseline “serum creatinine change percentage” select had mL/min labels and a gap between110 and111; it is removed.
- Acute kidney injury is explicitly a clinical safety hold interpretation, labelled as such rather than presented as a fabricated numeric NCCP band.

The assessment emits no final milligram prescription in any case. It therefore does not require a shared Calvert-engine change. The generic calculator remains outside this audit: it must not be mistaken for clearance of a patient with unverified method, current renal status, selected AUC, dose history or the SmPC extensive-pretreatment warning.

## Supplementary current product safety

The current HPRA product page for PA2059/032/001 links the **2 July 2024** SmPC; the linked file was retrieved and checked. Its safety sections add source-specific review for other-platinum allergy, severe marrow suppression, bleeding tumours, yellow-fever vaccination, other live vaccines, phenytoin/fosphenytoin, warfarin monitoring, concurrent radiotherapy, new significant liver injury, and extensive prior treatment.

The SmPC says Calvert should not be used after its specified extensive pretreatment: mitomycinC, nitrosourea, doxorubicin/cyclophosphamide/cisplatin, a combination of at least five agents, or qualifying radiotherapy≥4500rad (45Gy) to a20×20cm or multiple fields. The proposal flags this for specialist dosing; it does not implement an alternate formula.

The product's general labelled dose/count/interval wording differs from the explicit NCCP off-label regimen. It is **not silently substituted** for the NCCP q21/q28 count tables or selected AUC4–6. Likewise, the NCCP “no routine hepatic dose modification” statement does not establish safety in new moderate/severe liver injury; a separate product-warning review remains.

No invented neuropathy percentage ladder, automatic febrile-neutropenia dose reduction, routine G-CSF schedule, antibiotic prophylaxis or universal scan/echo/DXA timetable is added.

## Monitoring and support distinctions

Both protocols require baseline FBC, renal and liver profile and preferably isotope GFR, then before-cycle FBC/renal/liver review. The **q28 source additionally requests FBC at Days13–15 and21 in initial cycles** to establish nadir, subsequently before each cycle. Those are test visits, not extra doses, and are not automatically copied into q21.

Neurological and hearing assessments are regular, with additional concern after prior platinum/ototoxic medicines and age>65. For concurrent ototoxic medicines the q28 source says regular audiometry; q21 says consider it. Exact frequency is individualised. Disease-response monitoring follows the consultant plan.

Current NCCP V6 Table7 (physical page12) classifies **carboplatin AUC≥4 as HIGH**, and **AUC<4 as MODERATE**. Both audited standard regimens are AUC4–6. The q21 baseline's MINIMAL mapping is corrected.

Current NCIS V8 Table1 (physical page4) has a **dedicated HIGH carboplatin AUC≥4 row**, distinct from the general high row. It does **not** include routine olanzapine:

| Timing | Source row |
|---|---|
| Day1 | Aprepitant125mgPO; ondansetron16mgPO; dexamethasone12mgPO, each once daily |
| Days2–3 | Aprepitant80mgPO once daily |
| Days2–4 | Dexamethasone8mgPO once daily |
| Subsequent days | Metoclopramide10mgPO three times daily; source row does not state end day or PRN |

The support plan needs the new script ID **`nccp-v8-carboplatin-v08420`** and a pharmacy-defined duration for metoclopramide, with current contraindication/renal/EPS review. Do not turn the row into an indefinite prescription, import the generic high-row olanzapine, or misquote the printed row as PRN. NCIS allows individual ondansetron splitting/reduction and flags QT risk. “Premedication not usually required” concerns routine hypersensitivity premedication; antiemetic prophylaxis remains needed.

## Breast evidence and patient wording

The primary TNT publication was retrieved from an author's university and cross-checked against PubMed. It tested carboplatin **AUC6 Day1 q21**, six cycles with up to two more for responding/tolerating patients, versus docetaxel100mg/m² q21, in376 patients with advanced TNBC or germlineBRCA1/2-associated breast cancer.

Overall ORR was31.4% versus34.0% (P=.66): no overall response superiority. The prespecified germlineBRCA subgroup comprised43 patients, ORR68.0% versus33.3% (treatment–biomarker interactionP=.01). Overall PFS/OS did not show superiority; the PFS restricted-mean comparison wasP=.40, not an invented hazard ratio or a significance claim from the raw medians. There was no demonstrated overall-survival advantage. Planned crossover limits OS interpretation.

BRCA1 methylation, lowBRCA1mRNA and highMyriadHRD score did not establish the same differential benefit. Do not turn “germlineBRCA1/2” into a generic all-HRD/all-gene claim, transfer combination-regimen results to monotherapy, or claim superiority over modern options not tested.

The q21 card clearly identifies its exact AUC6 study population and comparator. The q28 card explicitly labels the evidence **indirect for schedule** and assigns no q28-specific response or survival figure. Patient text describes tumour control/symptom goals and uncertainty, not cure or personal predictions.

## Integration handoff

Root must integrate the two proposed protocol files, add/map the dedicated current NCIS carboplatin support script, build patient/consent/passport/timeline/PDF services from the source-specific facts, and run `--mode integrated` plus the wider suite. The code review, PDF layout/QR checks, browser checks and release packaging belong to root's integration, not to this bounded source audit. This audit makes no statement that those later checks have already passed.

## Select-condition reachability correction

Global regression exposed an unreachable q28 ECOG3 disease-context branch: `head_neck` was compared even though it is correctly absent from q28 selectable contexts. The q28 rule now compares only `breast_metastatic`, `gyn_adjuvant` and `other`; q21 retains `head_neck`. A recursive source check now verifies every select comparison value against the exact protocol form options. The check first reproduced the failure (301/302) and then passed after correction (302/302). No clinical source threshold or production file was changed by this correction.
