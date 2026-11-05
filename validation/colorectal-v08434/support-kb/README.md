# v0.84.34 knowledge and supportive-care reconciliation

Checked 5 November 2026. This records content preparation, not independent clinical/pharmacy approval.

## Outputs and integration

- `data/regimen-knowledge-base-v08434-addendum.json`: ten protocol profiles. Append to the KB addendum loader. Existing bevacizumab breast/lung context objects are retained byte-for-byte in JSON value comparisons; the new colorectal context has `context_id: gastrointestinal` and `/patient/<code>/colorectal/` links.
- `data/phase-support-contexts-v08434.json`: three colorectal bevacizumab component plans.
- `default-support-updates.json`: seven default-regimen support arrays for merging into `data/phase-support-v0838.json.regimens`. This task deliberately did not write that shared file.
- `build-assets.py`: reproducible authoring from the authored patient profiles and existing detailed KB/support records. Run before parent integration, or ensure shared support arrays are not unintentionally duplicated on subsequent regeneration.
- `verify-assets.py`: 103 assertions, including historical bev context retention, required KB domains, exact context links, oral risk classes and Day 8 distinctions. These do not establish clinical rule-engine correctness or rendered PDF quality.

## Sources

Fresh NCCP regimen PDFs in sibling source-audit directories were read for indications, baseline eligibility, monitoring, organ-function and supportive-care differences. NCCP antiemetic classification V6 and NCIS Medical Oncology V8 were downloaded via the official HSE links. PDF table pages were rendered and inspected visually; URLs and SHA-256 hashes are recorded in `sources.json`.

The current antiemetic V6 p8 Table5 distinguishes oral minimal-low as-required treatment from oral moderate-high daily 5-HT3 prophylaxis. NCIS V8 p4 is the parenteral schedule; it must not be automatically used for Lonsurf. Source-specific cetuximab antihistamine/steroid premedication is reconciled with antiemetic steroid to avoid duplicate dosing.

## Clinical distinctions retained or added

1. Bevacizumab-only minimal emetic risk does not classify the companion fluoropyrimidine chemotherapy. Each complete combination needs its own prescription and support plan. No NSCLC six-cycle limit or ovarian cap is imported into colorectal.
2. 00212 current NCCP expects no renal/hepatic dose adjustment, whereas 00214 and 00215 state no studies and retain explicit initial count/organ eligibility. No automatic generic on-treatment reduction is derived from those eligibility thresholds.
3. Regorafenib: oral minimal-low; skin care, fortnightly liver tests for the first two months, BP weekly for six weeks then each cycle, conditional tests and interactions. The current EMA light-meal instruction resolves conflicting NCCP food wording; the apparent hypertension table typo remains explicit uncertainty.
4. Lonsurf: oral moderate-high, exact morning/evening calendar and no catch-up doses; no routine steroid imported from parenteral guidance. No mandatory Day15 blood-count schedule is invented. NCCP cycle-start tests and EMA additional blood-count/renal-risk assessment remain distinguished.
5. Cetuximab weekly versus fortnightly schedules remain separate; 00328/00330 Day8 contains cetuximab alone. No Day8 or 5-FU pump is introduced into 00331. The 00328 46-hour pump remains specific to FOLFIRI.
6. The irinotecan delayed-diarrhoea reference prescription is explicit: 4mg loperamide initially then2mg every2hours, continue12hours after the last liquid stool, never more than48hours at that high-dose schedule; urgent escalation and electrolyte fluids are retained. This is separate from acute cholinergic atropine use.
7. Dose-history, combination-hold and recovery cautions are signposted in the clinician KB. The source-audit agents own numerical rule verification; KB prose is not a replacement for the validated engine or prescribing judgement.

## Evidence and limits

Bevacizumab CRC trial interpretation is authored in the context profiles: E3200 applies to10mg/kg every14days with the studied FOLFOX4 population; NO16966 pooled different bevacizumab dose/backbone schedules; no exact15mg/kg every21days survival figure is assigned. Existing detailed retrospective evidence records are retained with their historical check dates. Regorafenib CORRECT, Lonsurf RECOURSE, gastric TAGS and bevacizumab-combination SUNLIGHT contexts remain distinct. No evidence records from other tumour groups are removed.

Stable protocol IDs can contain historical version suffixes (e.g.00212-v6a/00382-v3/00207-v5); displayed current source versions and source-register updates remain the parent integration task. Do not rename IDs independently in a KB-only change.
