# Sarcoma batch four — current-source preparation

Prepared on 18 November 2026 for future authoring. No application data changed, dose calculator created, protocol assessment audited or independent clinical approval claimed. These are source-reference facts and unresolved questions, not patient prescriptions.

All five current sarcoma-listing links were followed. The saved numbered text covers every line of each source: 1,507 lines total, with no gaps. `source-manifest.json` contains versions, URLs, capture references, line counts and SHA256 hashes. Hashes identify web-extracted text, not original PDF binaries. Original PDF bytes and visual table-layout checks remain unverified. No unchanged blocked download/browser/screenshot loop was repeated.

|Code|Current version|Pages|Scope and age boundary|
|---|---|---|---|
|00420|4|5|Neoadjuvant/adjuvant osteosarcoma; no explicit numeric age eligibility in this source. ECOG 0–2 and adequate organ function.|
|00463|4|11|Localised or metastatic high-grade osteosarcoma of extremity/axial skeleton, excluding craniofacial sites; all disease sites must be amenable to complete surgical resection. Age ≤40; ECOG 0–2.|
|00100|6|4|Postoperative multi-agent chemotherapy adjunct after macroscopically complete resection of high-grade, resectable, non-metastatic osteosarcoma. NCCP eligibility age 2–30.|
|00596|2|6|Relapsed Ewing sarcoma or osteosarcoma; no explicit numeric age boundary. ECOG 0–2, adequate hepatic/renal/marrow function.|
|00680|2|5|Recurrent/primary refractory Ewing sarcoma and relapsed osteosarcoma; no explicit numeric age boundary. Detailed eligibility prose describes Ewing only, despite the listed osteosarcoma indication.|

00100 is the live listing-linked **version 6**, not the older mirror version 5a. Its footer says last reviewed 10 March 2021, but version history records the 20 May 2026 amendment to an “as required” review schedule and antiemetic links. Do not mistake the older footer for the current version number or invent a prospective review date.

## 00420 — doxorubicin/cisplatin

Source lines 24–54,69–99,115–149 and175–184 establish the following:

- Doxorubicin 25 mg/m² on each of days 1–3; cisplatin 100 mg/m² on day 1 over two hours. Six 21-day cycles, usually three before and three after surgery with pathology review. Arithmetic planned totals are doxorubicin 450 mg/m² and cisplatin 600 mg/m² if all six full courses are delivered; only the doxorubicin 450 mg/m² lifetime ceiling is explicitly stated as such.
- Cisplatin hydration/electrolyte replacement requires an individual prescription; source examples are not home drinking targets. Routine furosemide solely to increase urine flow is discouraged without fluid overload.
- Counts: full row ANC>1.5 AND platelets>100; intermediate ANC1–1.5 OR platelets70–100; either ANC<1 or platelets<70 delays. Prior febrile neutropenia WITH nadir ANC<0.5 reduces **doxorubicin only** after recovery; cisplatin remains a separate decision. Mucositis≥3 affects doxorubicin; neuropathy≥2 omits cisplatin pending review.
- Doxorubicin uses absolute bilirubin, not ×ULN; cisplatin renal rows use CrCl in mL/min. Haemodialysis is a separate branch, not a low CrCl surrogate.

Questions to retain: cardiac caution says LVEF<50%, while test text requires >50% for administration, leaving exact50% unclear. Doxorubicin CrCl10 and bilirubin decimal intervals are unallocated. Cisplatin integer ranges40–49/50–59/≥60 leave decimal gaps if interpreted literally; do not silently round. Preserve consultant review instead of extrapolating.

Patient content should connect heart/lifetime exposure, kidney/electrolytes, hearing and nerve checks to the relevant medicine; give generic chemotherapy risks plus drug-specific heart/extravasation and kidney/hearing/neuropathy risks. Audiology and extra cardiac imaging are conditional, not an invented universal timed panel.

## 00463 — MAP

Source lines 23–39 and60–111 define different treatment phases:

|Phase|Authored schedule|
|---|---|
|Induction, weeks1–10|Doxorubicin37.5 mg/m² and cisplatin60 mg/m² on days1/2 of weeks1/6; methotrexate12 g/m² over4hours at weeks4/5/9/10.|
|Surgery|Week11 reference plan; consultant may add up to two methotrexate doses if surgery is delayed.|
|Postoperative, weeks12–29|Doxorubicin days1/2 of weeks12/17/22/26; cisplatin days1/2 of weeks12/17; methotrexate weeks15/16/20/21/24/25/28/29.|

Calculated full reference totals are doxorubicin450 mg/m², cisplatin480 mg/m² and twelve methotrexate administrations. These are planned-schedule arithmetic, not evidence that every patient will receive those totals or that methotrexate has a source-defined lifetime cap. Optional delayed-surgery doses must remain separate. Do not turn MAP into a single repeating21-day cycle or merge its clock with mifamurtide’s36-week postoperative schedule.

Methotrexate support/monitoring, source lines126–254:

- Prehydration/alkalinisation begins before infusion; urine pH≥7 is required before and during methotrexate/rescue, checked six-hourly; fluid balance checks are four-hourly. Dose support is hospital prescribed and clearance dependent.
- Methotrexate sampling times24/48/72/96/120 hours are measured from **infusion start**, not end. Daily creatinine is specified. Delayed clearance is a potential emergency; continued hydration/alkalinisation, folinic rescue escalation and possible glucarpidase require urgent specialist management.
- Folinic acid reference starts24 hours after methotrexate starts, normally every6hours. Higher rescue requirements depend on both concentration and elapsed time; prior escalation/history matters at96hours. No automated rescue prescription should be built from this ambiguous source extraction.

Material source conflicts requiring explicit specialist resolution:

1. Eligibility recommends CrCl≥50 mL/min before high-dose methotrexate (line260); complications say patients below70 mL/min/1.73m² should not receive it (lines453–456). These are both different thresholds and different units. A renal-toxicity row even prints CrCl≥50 alongside delay instructions (385–390), suggesting an unresolved sign/context issue. Never equate indexed GFR with unindexed CrCl or “correct” the source silently.
2. Hydration endpoint is <0.1 µmol/L (138–142); other text/rescue rows use <0.15 µmol/L and six additional hours. Lines155–157 print a molar exponent inconsistent with the parenthetic0.15 µmol/L. Postoperative wording includes “or11 doses to84h”, whereas delayed-clearance sections require ongoing rescue. Do not interpret a fixed dose count as permission to stop despite persistent methotrexate.
3. Table2 concentration bands overlap at2 and20 µmol/L; visual column mapping is unverified. Creatinine rise>50% at24hours triggers increased rescue, whereas >100% flags severe toxicity. Preserve both levels and time windows rather than flattening them.
4. Table3’s alternative rescue formula follows a >100 µmol/L heading but gives time-specific upper limits20/2/0.2 at24/48/72hours. Formula application, units and escalation/continuation are specialist-only.
5. Doxorubicin bilirubin bands contain decimal gaps and omit exact87 µmol/L from the >87 stop row. LVEF<50 or shortening fraction<28 requires repeat assessment, with persistent dysfunction stopping further doxorubicin; this differs from other sarcoma protocols.
6. Methotrexate toxicity text mentions “Day29 of MAP cycle” despite a week-based multi-phase schedule. Do not map it automatically to calendar week29. The abnormal-LFT table also needs verified row/column interpretation.

Other distinctions: doxorubicin/cisplatin count thresholds ANC0.75/platelets75 differ from methotrexate ANC0.25/platelets50. Prior reductions, repeated delay and G-CSF history govern further cisplatin changes. Cisplatin renal review uses creatinine>1.5×baseline or indexed GFR<70; neuropathy grade1 versus≥2, and hearing loss reaching2kHz/lower, have distinct actions. Methotrexate third-space fluid retention affects clearance. Patient materials must explain why blood-level results can extend admission and why rescue continues after the chemotherapy infusion finishes; no fixed discharge promise.

## 00100 — mifamurtide

Source lines21–51,65–105 and118–177; current EMA clinical excerpt provides corroboration and additional risk details.

- Given after resection and surgical recovery, alongside postoperative multi-agent chemotherapy. It is an option for discussion with the patient/parent, not a mandatory replacement for chemotherapy. Exclusions include metastatic presentation, incomplete resection and prior therapy beyond allowed preoperative multi-agent chemotherapy.
- Reference schedule2 mg/m² over one hour: twice weekly at least three days apart for12weeks, then weekly24weeks;48infusions over36weeks. Not IV bolus. Filtering during preparation and avoiding an administration in-line filter are different instructions.
- EMA specifies trial age2–30 **at initial diagnosis**, whereas NCCP eligibility simply says2–30. Retain the distinction for clinical review rather than extending adult eligibility.
- CrCl≥30 and Child–PughA/B have no routine dose adjustment; moderate hepatic impairment still needs caution. Severe organ impairment lacks pharmacokinetic data; no automatic dialysis dose is supplied. Monitoring continues beyond completion of concurrent chemotherapy until mifamurtide ends.
- Routine/chronic corticosteroids, including routine dexamethasone, should be avoided because they may oppose immune stimulation. Calcineurin inhibitors and high-dose NSAIDs are contraindicated. Separate administration timing from doxorubicin/other lipophilic medicines. A generic moderate-emetogenic steroid course must not be inserted automatically.
- Source fixed premedication examples include paracetamol1g/chlorphenamine10mg despite eligibility extending to age2; paediatric dose appropriateness must be individually reviewed, not universally copied to a child’s prescription.

This activates innate immune cells and is not a checkpoint inhibitor. Do not attach a checkpoint-inhibitor adverse-event algorithm merely because it is immunotherapy. Relevant patient risks include fever/chills, fatigue, nausea, headache, pulse/blood-pressure changes, breathing reactions, allergy and inflammatory symptoms. Fever/chills persisting>8hours require sepsis assessment, but that is **not** advice to wait8hours when febrile, acutely unwell or neutropenic. Current EMA text also recommends clotting-parameter monitoring after the first and again after several doses; the NCCP test list does not mention this. Preserve source attribution and obtain a reconciled monitoring plan.

## 00596 — IE

Source lines22–62,76–94,113–203 and222–245:

- Relapsed Ewing sarcoma and osteosarcoma. Etoposide100 mg/m² then ifosfamide1800 mg/m² on each of days1–5, every21days for up to seven cycles. Per-cycle arithmetic totals are etoposide500 mg/m² and ifosfamide9 g/m².
- Mesna360 mg/m² before and4/8hours after **ifosfamide start** on each treatment day. Hydration continues24hours after ifosfamide; fluid balance, weights, urine output and electrolytes are monitored. G-CSF is required every cycle. Neuroassessment before each ifosfamide dose; haematuria before each dose and every8hours on treatment days. Etoposide infusion observation includes hypotension risk, especially its first15minutes.
- Count threshold ANC≥0.75 AND platelets≥100. Low counts delay; lack of recovery by day29 leads to dose-reduction discussion, not automatic treatment with persistently unsafe counts.
- Ifosfamide CrCl≥50 has no expected reduction; <50 or dialysis is a **clinical decision**, unlike the categorical not-recommended branches in00391/00392. Severe hepatic impairment is not recommended. AST>300 or bilirubin>51.3 is a separate discretionary hepatic review.
- Etoposide CrCl10–50 references75% of original, with possible increase if tolerated; >50 no adjustment; dialysis is separately discussed. No non-dialysis <10 row is supplied. Hepatic bilirubin26–51 or AST60–180 maps to reduction; higher values require clinical decision. AST units are not printed in that table header; verify units and decimal gaps before encoding.
- Grade3–4 neurological toxicity has an occurrence/history-based ifosfamide discussion (slower next infusion, methylene-blue management, grade4 discontinuation consideration, recurrent substitution consideration). This must not be replaced by00680’s categorical grade≥3 stop rule or turned into an automatic methylene-blue prescription. Mucositis/stomatitis grade3–4 affects both drugs.

Source overall emetic risk is high despite individual drug labels moderate/low. Review aprepitant–ifosfamide encephalopathy interaction. Patient explanations should distinguish mesna’s bladder protection from ongoing kidney/brain risks and the post-infusion support period from the end of chemotherapy.

## 00680 — high-dose ifosfamide

Source lines21–34,47–88,103–178 and181–202:

- Ifosfamide3 g/m² over24hours on days1–5, repeated every21days, maximum four cycles. Per-cycle total15 g/m²; calculated maximum planned course60 g/m² is not a universal lifetime ceiling.
- Mesna400 mg/m² one hour before the first day1 dose, continuous3 g/m²/day during days1–5, and final800 mg/m² on day6 after the last ifosfamide. Footnote allows an oral final dose but does not specify oral bioavailability conversion; never automatically treat IV/oral doses as interchangeable.
- Hydration continues24hours after completion, with strict fluid balance and weights. Required G-CSF; neurological assessment before each dose and haematuria before each dose/every8hours. High emetic risk with aprepitant interaction review.
- Counts: full row strictly ANC>1.5 AND platelets>100; intermediate inclusive ranges1–1.5/70–100; either low count delays. Prior nadir<0.5 WITH neutropenic fever must be separated from current unresolved fever/counts.
- CrCl≥50 has no expected adjustment; <50 and haemodialysis require clinical decisions, not an invented proportional dose. Severe hepatic impairment is not recommended; significant absolute AST/bilirubin adds review. Mucositis≥3 references80%; neurotoxicity≥3 discontinues ifosfamide.

The indication table includes relapsed osteosarcoma, but detailed eligibility only describes Ewing and defines primary refractory timing as progression during first-line therapy or within12weeks of completion. Preserve both labelled contexts and flag the missing osteosarcoma-specific eligibility detail. Do not extrapolate an age cutoff from cited study populations.

## Next implementation boundary

These files are preparation only. Author each exact indication/context, phase, generic-plus-agent consent, monitoring/support plan and patient materials with the unresolved source issues visible. Then independently test boundaries, partial information, recovery/history, simultaneous abnormalities and component actions. MAP rescue/renal conflicts and paediatric mifamurtide support require clinical/pharmacy clarification; current web text availability alone does not resolve them.
