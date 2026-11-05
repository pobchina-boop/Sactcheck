# Pembrolizumab colorectal source-to-content review — v0.84.35

Independently reviewed on 5 November 2026 against the freshly downloaded NCCP 00455 v16, NCCP 00558 v13 and EMA Keytruda sources retained in this directory. This is a content review of both colorectal patient profiles, the gastrointestinal clinician knowledge contexts and their phase-support plans. It does not replace rendered-page, browser, PDF, QR or independent clinical review.

## Findings passed to the content owners and corrected

| Asset | Finding before review | Correction |
|---|---|---|
| 00558 colorectal passport groups | Four headings incorrectly described a 3-week cycle | All four now say 6-week; 400 mg every 42 days remains consistent with the schedule, timeline and wallet-card text |
| Both three-page summary profiles | A combined “Between / after” thyroid row could suggest that the on-treatment 3–6-week interval was mandatory indefinitely after stopping | Explicit “During” testing and individualized “After” follow-up wording |
| Both CRC clinician knowledge contexts | Generic administration wording referred to previous dose reductions | Pembrolizumab-specific interruption, immune recovery and steroid review; dose reduction is not recommended |
| Both CRC clinician knowledge contexts | Selection guidance did not state histological confirmation and the exact NCCP performance-status range | Adult, histologically confirmed first-line metastatic CRC, validated MSI-H OR dMMR and NCCP ECOG 0–2; the trial's ECOG 0–1 population remains a separate evidence limitation |
| 00455 colorectal support plan | A shared thyroid sentence referred to a 6-week infusion interval within the 3-week regimen | Neutral infusion-interval wording for 00455; the explicit between-infusion thyroid reminder is retained for 00558 |
| Both CRC clinician knowledge contexts | New context key points were mostly patient-level orientation | Added clinically important shared distinctions: no dose reduction; source-specific hold/stop/restart; creatinine multiples of ULN rather than baseline; assessed immune attribution rather than stable impairment; endocrine exceptions; thyroid interval and individual 24-month review |

The authoring owners applied these corrections in their reproducible generators. No patient-profile or shared-knowledge files were independently overwritten by this reviewer.

## Clinical consistency reviewed

| Domain | Source and expected distinction | Review result |
|---|---|---|
| Indication | NCCP pp1,4: adult first-line metastatic MSI-H or dMMR CRC; histology and validated testing | Patient, consent and CRC knowledge scope agree; PD-L1 is not substituted for MSI/MMR; broader EMA licensing is not presented as the NCCP entry |
| Treatment | NCCP treatment table: 200 mg over 30 minutes every 21 days or 400 mg over 30 minutes every 42 days | Schedule, phases, timeline, day groups, passport and wallet text distinguish the two schedules |
| Duration | NCCP treatment text: progression/toxicity; consider stopping after sustained response at 24 months | Rolling course and no fixed final wallet-cycle count; 24 months is an individual review, not an automatic stop; no adjuvant 12-month cap |
| Baseline and cycle tests | NCCP monitoring: baseline FBC/renal/liver/glucose/thyroid; FBC/renal/liver/glucose each cycle | Both profiles and CRC knowledge/phase support retain the required tests |
| Between-cycle and aftercare | NCCP: thyroid every 3–6 weeks, cortisol if indicated; response assessment per consultant | The six-week infusion schedule does not defer earlier thyroid checks; no invented CT or tumour-marker interval; persistent immune/endocrine effects have follow-up after stopping |
| Mechanism and anatomy | NCCP adverse effects and EMA warnings | Detailed PD-1/immune-inflammation explanation, with brain/hormone, lung, heart, liver, kidney, bowel and skin/muscle anchors and regimen-specific warning text |
| Urgent action | NCCP/EMA: potentially severe immune toxicities and infusion reactions, including after cessation | Immediate oncology advice, emergency symptoms and delayed-event warnings retained; patients are not instructed to restart treatment or manage severe effects alone |
| Support | NCCP: minimal emetic risk, no usual routine premedication; EMA/NCCP reproductive precautions | No routine antiemetic/premedication invented; steroid/hormone instructions, alert card and contraception through at least four months after the last dose retained |
| Consent | NCCP/EMA indication and important risks | Benefits, uncertainty, alternatives, severe or persistent multiorgan immune effects, infusion reactions, steroid/hormone treatment, reproductive precautions and urgent contacts are covered |
| Evidence | KEYNOTE-177 and 400 mg exposure bridging | Correct first-line MSI-H/dMMR population and 200 mg every three weeks trial schedule; qualitative PFS benefit is supported; no unproven overall-survival superiority or separate 400 mg colorectal randomized trial is claimed |

## Evidence identity checks

- [KEYNOTE-177 initial report, PMID 33264544](https://pubmed.ncbi.nlm.nih.gov/33264544/): randomized first-line MSI-H/dMMR metastatic colorectal cancer; pembrolizumab 200 mg every three weeks versus chemotherapy. Supports the patient profile's qualitative progression-free-survival statement.
- [KEYNOTE-177 final analysis, PMID 35427471](https://pubmed.ncbi.nlm.nih.gov/35427471/): enrolled ECOG 0–1; overall-survival superiority was not demonstrated at the prespecified significance threshold. No corresponding unsupported survival claim is present in the reviewed CRC profiles.
- [Pembrolizumab six-week exposure modelling, PMID 32305010](https://pubmed.ncbi.nlm.nih.gov/32305010/): supports bridging 400 mg every six weeks; it is not a separate randomized CRC efficacy trial.

The existing lung knowledge context is intentionally separate. Its preservation is checked by the integrating owner; this review does not re-audit historical lung evidence or confer new source-verification dates on it. Shared treatment decisions remain in the source-audited clinical engine. The parent task is responsible for confirming that the reviewed content survives HTML/PDF generation, retains detailed anatomical illustrations and remains readable in the final artifacts.
