# Durvalumab source audit — v0.84.22

Checked 26 October 2026. Source reconciliation and software checks are complete for the proposed files; independent consultant/pharmacy approval and clinical-use authorisation remain **false**.

## Sources and setting

Fresh official binary PDFs, SHA256s, extracted text and visually inspected table images are recorded in `sources.json` and `research/`. NCCP00576 remains version5 (9pages); NCCP00655 remains version3a (9pages). The older review date printed on00576 is not a retrieval date. No version-number change is invented.

Both current NCCP PDFs cover **unresectable stageIII NSCLC, PD-L1≥1%, no progression following definitive concurrent platinum CRT**. Eligibility explicitly includes age≥18, ECOG0–1, ≥2 concurrent platinum cycles and ≥60Gy radiation. Sequential CRT and mixed small-cell/non-small-cell histology are excluded. Current EMA indications are broader, but these two NCCP suites are not broadened to perioperative disease, metastatic combinations, SCLC or other tumour types.

| Domain | Source finding | Proposed correction |
|---|---|---|
| q14 course |00576 p1:10mg/kg Day1 every14days, maximum12months/26cycles; start≤42days afterCRT|Structured single consolidation phase; course and start-window reviews|
| q28 course |00655 p1:1500mg Day1 every28days, maximum12months/13cycles; same start window|Distinct schedule, cycle cap and patient chronology|
| Low weight |00655 p1:bodyweight≤30kg requires10mg/kgq2w OR20mg/kgq4w until>30kg|Do not give fixed1500mg; requires a separately prescribed dose/interval, no automatic selection/calculation|
| Hepatitis merged rows |Both p3:hold AST/ALT>3–≤10×ULN, including>5–10; stop>10 or bilirubin>3|Correct legacy>5 permanent-stop threshold; exact3/5/10 boundaries tested|
| Concurrent liver abnormality |AST/ALT>3 AND bilirubin>2:stop; p6footnote b says confirmed alternative cause uses AST/ALT-only recommendation|Cause status explicit; missing cause holds/reviews and remains unassessed rather than assigning a permanent-stop diagnosis|
| Renal toxicity |p4:>1.5–3×baseline ORULN holds;>3×baseline or>3–6×ULN stops;>6×ULN stops|Separate baseline/ULN ratios plus compatible legacy ratio field; no absolute-creatinine misinterpretation|
| Endocrine events |p4:hyperthyroid/thyroiditis and adrenal/pituitary grades2–4 hold until stable; hypothyroidism/type1diabetes grades2–4 nochange with replacement/insulin|Distinct organ/event inputs; no generic endocrine hold; acute metabolic emergency separately flagged|
| Skin |p4:grade2 lasting>1week orgrade3 holds;grade4 stops|Exact7day boundary and omitted duration tested; confirm an event-specific skin term withgrade4 defined|
| Neuro/muscle/heart |p5–6:specific event-dependent actions, including meningitisG2hold/G3–4stop, transversemyelitisanygradestop; myositis unresolvedby30days orrespiratoryinsufficiency stops|Event-specific rules replace the unsafe generic neurological-stop grouping; independent urgent pathways|
| General severe/recurrent irAE |p6:recurrentG3 oranyG4 stop except endocrinopathy controlled by replacement hormones|Explicit exception/unknown review; controlledendocrine exception cannot erase a different organ-specific stop|
| Nonimmune G4 |p6footnote e:isolatedG4labs need clinicaljudgement|Do not force permanentstop while lab-only status is unknown or confirmed; clinicalG4stop retained|
| Restart |p6:resume within12weeks aftergrade≤1 andsteroids≤10mg/day; source taper≥1month|Boundarycases; allcriteria stilllead toconsultantreview; no invented automaticstop solelyfor>12weeks|
| Support/monitoring |p2,p7–8:regularFBC/renal/liver/glucose/thyroid; baselineHBV/HCV/PDL1;minimalemetic, nopremedication specified|Full longitudinal endocrine/pulmonary monitoring, no copied HER2cardiac calendar or cytotoxic ANC/platelet thresholds; no routine steroid/antiemetic prescription|
| Pregnancy/lactation |EMA4.6:notrecommendedpregnancy; breastfeeding/treatmentbenefit-riskdecision;contraceptionduring+≥3months|Replace legacy blanketNCCPpregnancy/breastfeedingcontraindication with accurately attributed specialistreview|

The source grades are explicitly **CTCAE4.03** (Table1footnote a,p6). Proposed event inputs label this standard and do not silently apply CTCAE5 skin terminology. The app’s other grading aids require the same source-sensitive presentation when integrated.

## Evidence and communication

Clinician evidence uses PACIFIC’s **same exploratory five-year update/data cutoff11January2021** for OS and PFS: OSHR0.72(95%CI0.59–0.89), medians47.5vs29.1months; PFSHR0.55(0.45–0.68), medians16.9vs5.6months. Five-yearOS42.9%vs33.4%;PFS33.1%vs19.0%. Original primary-analysis HRs are not mixed into these estimates.

PACIFIC randomised10mg/kgq2weeks, not1500mgq4weeks. The q28card explicitly explains exposure bridging, not a separate PACIFIC efficacy trial or individual-equivalence guarantee. The EMA2020variation includes a general fixed-dose PK rationale in an SCLC assessment; CASPIAN outcomes are not substituted for PACIFIC. The current SmPC independently lists the locallyadvancedNSCLCq14/q28 schedules.

PACIFIC enrolled irrespective ofPD-L1. Overalltrial results are not labelled aPD-L1≥1%subgroup result. The exploratory/posthoc1%subgroup threshold, missing tissue and limited subgroup precision are explained without inventing individual benefit. **Patient evidence.metrics is empty** in both entries; quantitative trial evidence is clinician-only.

Both complete service entries explain definitive concurrent chemotherapy/radiotherapy **first**, then durvalumab consolidation with curative-intent context and possible long-term control, without promising cure. The bodymap, urgent symptoms, consent, teachback, logistics, support, phases/daygroups and date-free journeys share the same sequence, dose interval and maximum course. Pulmonary reporting explicitly recognises radiation/immune/infective/progression alternatives. Hormone monitoring continues during treatment and clinically indicated follow-up. Routine serial echocardiography is not invented.

## Tests and integration

`node validation/lung-core-v08422/durvalumab/source-cases.cjs` exercises the **actual** `js/assessment-engine.js`, strict validator and dose-schedule renderer on proposed complete JSONs. It currently reports **408/408pass**. It covers boundaries, independent partial inputs, blank/unassessed domains, competing hold/stop findings, specific neurological events, endocrine and laboratory exceptions, weight/course limits, evidence separation and full service structure.

After root copies the two proposed JSONs, run the same command with `--integrated`; results are saved separately. This audit does not claim integration or browser/PDF checks before their actual execution.

Important historical regression: `tests/ici-safety-v027.test.js` expects00655ALT/AST6×ULN to permanentlystop. That expectation conflicts with both fresh NCCP p3mergedcells and must become **withhold**, with >10×ULN as the isolatedtransaminase stop boundary. Existing canonical protocolIDs and filenames are preserved;00655 remains `protocols/lung/00655-durvalumab-maintenance.json`.

## Deliberate limits

- Unknown inputs remain unassessed. No mandatory checklist, default normal value, automatic restart clearance, complete-dose calculation or fabricated clinical approval is introduced.
- NCCP prioranti-PD-1/PD-L1 text points to separate NCCP policy. The proposal flags review; it does not invent a blanket lifetime exclusion or encode a current reimbursement decision.
- The source’s nonspecific adequate-organ-function condition and regular-test frequency remain clinical review items; numeric thresholds/cadences are not invented.
- Severe baseline renal/hepatic impairment has limiteddata. No numerical dose reduction is inferred.
- Acute respiratory symptoms and possible diabetic ketoacidosis are safety-review triggers, not automatic diagnoses of immune toxicity. Exact source-grade hold/stop criteria remain separately visible.
- Independent clinical/pharmacy validation is still pending. Software source-case success does not confer clinical authorisation.
