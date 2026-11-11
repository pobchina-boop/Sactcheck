# Current-source audit for 0.84.48

Date: 10 November 2026. Baseline: 0.84.47, commit 5380c7d8665645d54b06c76011d420efc4e767a6. Scope: new full head-and-neck suites for existing protocols00332 and00419, plus retrospective clinical-source review of00314,00552,00417,00418,00696. This is software/source reconciliation, not independent clinical or oncology-pharmacy approval and not a claim that browser, patient, PDF or deployment verification has passed.

All seven current official PDFs were freshly downloaded by the parent task. The five retrospective PDFs have exactly the same SHA-256 values as their retained0.84.47 source files. Exact URLs, hashes, page counts and versions are in `sources.json`. The live head-and-neck catalogue identifies00419a; cervical is00419b.00419 is now version6 (version-history amendment23September2026, footer last-review4August2026), superseding encoded version4. The current URL uses documents/6458, not6459.

## New00332: AUC1.5 concurrent radiotherapy

Reviewed pp1–6: seven weekly doses, concurrent radiotherapy only, ECOG0–2, hypersensitivity/pregnancy/breastfeeding/platinum-progression exclusions, blood counts, renal method and trend, neurological/hearing monitoring, moderate antiemesis, interactions and off-label consent. Principal corrections: seven-dose course and radiation-stop guard; explicit pregnancy/lactation and platinum-progression exclusions; carboplatin-specific count actions; missing renal method/freshness/cap safeguards; removal of invented generic automatic FN or grade3 dose reductions.

Table1 p3 says ANC>1 AND platelets>100 for full dose and ANC<1 OR platelets<100 for a one-week delay or until recovery. It leaves exact1 and100 unassigned. The proposal routes exact equality to source clarification, instead of the old inclusive-delay rule. Higher thresholds may be needed for some patients, particularly ECOG2; no new numeric threshold is invented. P4: GFR≤20 prohibits carboplatin; CrCl<60 increases marrow toxicity risk. Calvert GFR cap125, estimated creatinine within48hours, and isotope creatinine comparison at110% are preserved distinctly.

Unresolved source inconsistency: p1 indication anchors3–8weeks after induction completion; treatment text anchors day22–56 to the start of induction cycle3. The proposal does not calculate a date from an assumed anchor. P6 requires off-label indication disclosure, local consent and DTC/equivalent acknowledgement.

## New00419: AUC2 concurrent radiotherapy

Reviewed pp1–6. Version6 gives six weekly doses;00419a stageIII/IV HNSCC and00419b cervical, both with cisplatin contraindicated/not tolerated. Retain the shared gynaecology file and internal indication IDs, update protocol ID to nccp-00419-v6, and add a legacy alias during integration. Both modalities remain distinct: withholding carboplatin does not automatically stop radiotherapy.

P3 Table1: ANC≥1 AND platelets≥100 full-dose band; ANC0.5–0.99 or platelets50–99 delay until recovery; ANC<0.5, platelets<50 or FN delay and consider25% subsequent carboplatin reduction. This replaces the old platelet<75 rule. ANC is day-of-treatment; platelets are any-stage in-cycle. Proposed nadir inputs distinguish ongoing low current counts from recovered counts: recovered platelets trigger history/dose review, not indefinite delay. Missing current counts require recovery assessment. Fractional gaps0.99–1 and99–100 require review rather than rounding.

P4 specifies GFR≤20 prohibition; >20 through30 extreme caution; <60 marrow risk;48-hour estimate freshness and110% isotope trend. Six-cycle/RT guards, cisplatin-unsuitable prerequisite, source exclusions, exceptional mild-HSR desensitisation conditions and moderate antiemesis replace generic inherited assumptions. No low-risk maintenance phase exists. P6 specifies unlicensed posology and indication.

Unresolved applicability: p1 directs head-and-neck patients to00552 four weeks after RT, but00552 specifically indicates nasopharyngeal disease. Do not automatically assign00552 to every00419a HNSCC patient; confirm diagnosis and the separate plan. Footer ICD10C11 and broaderHNSCC wording should not be interpreted as extending the nasopharyngeal adjuvant indication.

## Retrospective00314 v4b

Reviewed pp1–5. Schedule remains cisplatin25mg/m² and fluorouracil1000mg/m²/day on days1–4 every28days. Baseline ANC>1.5, platelet comparator ambiguity, creatinine≤1.5ULN, transaminases≤5ULN and bilirubin≤1.5ULN remain distinct from treatment-day tables. P2 uses day-of ANC and cycle platelet nadir to select fluorouracil750 or375mg/m²/day. P3 cisplatin≥60 full,45–59 at75%,<45 clinical decision;59–60 fractional gap is retained. FU bilirubin85/AST180 exact equalities remain unresolved; higher values contraindicate FU. Baseline CrCl<60, neuropathy≥2 and significant hearing impairment exclusions remain protected. DPD/renal-phenotype warning, severe-hepatic conflict, hydration, high antiemesis, infection, hearing and fluoropyrimidine interaction/cardiac warnings are preserved. No new definite source defect identified.

## Retrospective00552 v6

Reviewed pp1–7. Nasopharyngeal adjuvant course remains AUC5 plus FU1000mg/m²/day days1–4, every28days up to3cycles, starting four weeks after chemoradiation with recovery review. P3 blood-count/FN rules preserve discretionary25% reduction of both drugs. P4 current renal/hepatic recommendations correctly replace older fixed85/180 FU rules; oral grade3 recovery75–100% review, grade4 cessation, weight loss strictly>10% with nutritional-support distinction, and PPE grade3 table are retained. Full/partial/unresolvedDPD and renal phenotyping remain distinct. High antiemesis, diarrhoea/PPE care, cardiac/platinum warnings are present. P2 incorrectly cites00417 for prior carboplatin/RT whereas p1 correctly cites00419; the existing uncertainty must remain explicit. No new definite numeric defect identified. Historical dose decisions remain clinician inputs; absence of a remembered earlier event never proves safe re-escalation.

## Retrospective00417 and00418 v7

Reviewed pp1–9 of each. Six21-day combination cycles; weekly cetuximab400mg/m² load then250; platinum day1; FU1000mg/m²/day days1–4. Baseline eligibility is separate from ANC1.5 overlapping treatment rows and fractional platelet gap99–100. Severe cytopenia/FN reductions are discretionary and affect platinum/FU, not automatic cetuximab reduction. FU85/180 strict boundaries and partialDPD review are retained; cisplatin renal/neuropathy rules stay separate from carboplatin Calvert safeguards. Cetuximab first15-minute reaction, severeIR permanent stop, ILD, two-week severe-skin holds,250/200/150 weekly recurrence doses, fourth-event stop, prior-dose/no-escalation and permanent-stop history are retained. Source monthly electrolytes/Mg/Ca for two months after final cetuximab, premedication and ≥1-hour chemo separation are preserved. High emetic combination phase is supported.

One actual provenance defect in00418: `HN47_CARBO_20_30` attributes an extreme-caution20–30 band to NCCP00418p4. That page only specifies≤20 prohibition and<60 marrow risk, with no30 cutoff anywhere in the PDF. Proposed minimal correction keeps the conservative review action but explicitly labels its20–30 boundary as an authored safety policy requiring local validation, rather than claiming it is the NCCP00418 table. See `retrospective-provenance-patch.json`. No numeric relaxation is proposed.

## Retrospective00696 v2

Reviewed pp1–8. Paclitaxel80mg/m² days1/8/15 plus cetuximab500mg/m² days1/15 each28days until progression/toxicity; clinician-selected100mg/m² starts are distinguished. Baseline ANC<1.5 exclusion is separate from treatmentANC≥1; platelets90 overlap remains reviewed. ANC<0.5 for≥7days, platelets<70 and FN select one-level reduction after recovery;80→65→50 differs from the10mg/m² decrement for grade2 neuropathy. Hepatic ALT10/bilirubin5 contraindications,1.25–1.26 and2–2.01 gaps, and lower-current-dose protection remain intact. Cetuximab500/400/300 recurrence doses are every-two-week doses, not weekly250/200/150. Grade3–4IR, ILD, history and maximum14-day hold safeguards are retained. Low emetic classification, combined-day premedication avoidance of duplication, later paclitaxel steroid/H2 discretion, skin care and myalgia care are supported. No new definite NCCP-source defect identified.

## Executed bounded checks

`source-cases.cjs` checks both new protocols and all five retrospectives using independently specified source-boundary scenarios, the real assessment engine and dose-display model. Candidate run:130/130 passing (schema included). These are source-case checks, not whole-release CI. The earlier128-case baseline comparison passed60/128; the68 failures are scenarios exposing old/missing new-protocol behavior, not68 independent defects. Final baseline rerun records the final130-case set separately.

Only scratch proposals and audit files were written. The parent must apply/review proposals, reconcile protocol aliases, run integrated cases, and complete the separate suite/UI/PDF/QR/release checks. Source ambiguities require clinical resolution; no clinical approval is asserted.
