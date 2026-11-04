# Breast patient-template research · v0.84.31

Checked 3 November 2026. Five existing suites: 00722, 00485, 00525, 00216 and 00250. This is a focused source check of patient schedules, monitoring and treatment scope, not a fresh assessment-rule audit or independent clinical approval. Existing clinical source-review/release dates must remain intact; only the new summary has a new checked date.

## Sources verified

All five current official PDF links opened successfully through web retrieval, with versions matching existing records. The source pages supporting summary content are:

- [00722 v2 TCHP](https://healthservice.hse.ie/documents/6598/722_v2_TCHP.pdf), pp1 and4: six neoadjuvant cycles; baseline bloods/GFR/cardiac function; bloods before cycles; echo/MUGA every12weeks and completion of trastuzumab therapy. Current source describes postoperative trastuzumab; patient proposal defers actual postoperative choice to pathology/team review rather than promising a universal maintenance treatment.
- [00485 v6 AC–weekly paclitaxel](https://healthservice.hse.ie/documents/6500/485_v6_Dose_DenseAC-T.pdf), pp1–2: four fortnightly AC cycles then12weekly paclitaxel doses; latter tabulated as four21day cycles with D1/8/15 dosing. Bloods before each cycle; cardiac/nerve assessments according to indication. G-CSF required for dose-dense AC. Do not label a uniform14day chronology for the entire course.
- [00525 v6 metastatic ribociclib](https://healthservice.hse.ie/documents/6629/525_v6_Ribociclib_Metastatic_hghzyyD.pdf), pp1–3: separate ribociclib and endocrine schedules. Early blood monitoring, cycle-specific electrolyte checks and Day14ECG retained. Not the adjuvant400mg programme.
- [00216 v8 capecitabine](https://healthservice.hse.ie/documents/6558/216_v8_Capecitabine.pdf), pp1–2: multiple breast/colorectal settings, eight-cycle adjuvant recommendation versus ongoing advanced treatment. Shared canonical pack must retain both settings; rolling record avoids assigning eight cycles to everyone. DPD baseline and pre-cycle blood tests retained.
- [00250 v9 TC](https://healthservice.hse.ie/documents/6353/250_DOCEtaxel-cycloPHOS_TC.pdf), pp1–2: adjuvant-only source, four to six cycles, radiation afterwards when required. Repeat bloods are specified as clinically indicated, not a fixed every-cycle schedule in this PDF.

## Corrections for root integration

`corrections.json` supplies15 exact file/JSON-pointer/before/after replacements in canonical patient records and treatment journeys. They distinguish TC source requirements from the local pre-treatment blood booking plan, remove inherited neoadjuvant surgery statements from the adjuvant TC journey, and clarify AC–taxane monitoring wording. Root must regenerate emitted pages and journey PDFs and mirror relevant changes into any authoring inputs that would otherwise restore old wording.

TC clinical protocol rules were inspected specifically for testing-frequency statements: no every-cycle/weekly cadence rule was found. Its count thresholds need current results for assessment, which is separate from a claim that the NCCP TESTS section mandates a particular routine cadence. No dose/count-rule change is proposed here.

TCHP summary explicitly includes the end-of-trastuzumab cardiac check; its source specifies more frequent cardiac checks when impairment is suspected. Earlier checks remain clinically directed. Echo timing must not restart at surgery or a route/phase change.

## Rendering and scope requirements

`proposals.json` maps codes directly to the new patient_summary object. `build-proposals.py` reproduces it. 00485 additionally supplies `cycle_heading` and `cycle_blocks`; root must use these instead of its generic cycle_days chart. Use a phase-labelled rolling wallet record because 4 AC cycles plus12weekly doses do not fit a single interchangeable stamp count. Preserve its existing detailed chronology variants.

TC uses a rolling card until the team confirms4 versus6cycles; TCHP uses6stamps; metastatic ribociclib and shared capecitabine use rolling records. Keep all existing source scopes, safety details, regimen-specific anatomy and supportive-care content. No new numerical patient benefit estimates, universal scans or tumour-marker timetable are introduced.

No canonical files were edited by this research task. PDF layout, QR decoding, runtime browser behavior and regression verification are root integration responsibilities.

## Targeted clinician consistency follow-up

The live TC clinician KB profile is `data/regimen-knowledge-base-v08417-addendum.json` `/regimen_profiles/5`. Its baseline and before_each_cycle fields repeated the unsupported fixed blood cadence, and its longitudinal table inherited preoperative wording. Six exact replacements are provided in `clinician-consistency-corrections.json`. The baseline and clinical-review requirements remain explicit; the scope is to distinguish actual NCCP cadence from local booking practice. The TC phase-support entry contains no cadence or neoadjuvant setting contradiction. Earlier v0840 KB content is shadowed by v08417 in current runtime load order and should retain its historical provenance. No evidence endpoint, dose/count rule, supportive prescription or approval flag is changed.
