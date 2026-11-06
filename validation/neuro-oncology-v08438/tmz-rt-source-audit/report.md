# Temozolomide RT/adjuvant source audit — v0.84.38

Scope: NCCP00334v4 (standard concurrentRT/adjuvant) and00461v3 (older-patient shortenedRT/adjuvant). Current official PDFs were retrieved on5November2026; source hashes and the original JSON are retained. Independent clinical/pharmacy approval remains pending.

819 of 819 source-based engine, dose-renderer, schedule and grading checks pass; all104 decision rules exercised. The prior encoding failed154 of these contract cases; that is not a unique-defect count.

## Corrections

- **Timing And Phase:** Baseline and treatment-emergent findings previously shared pathways or lacked a phase guard. Added separate timing, phase and unknown-context handling. (00334/00461 NCCP pp2–4; EMA p7)
- **Fractional Count Gaps:** Former closed bands ending at ANC1.499 or platelets99 missed fractional values below1.5/100. Replaced with exact inequalities. (Both NCCP p3)
- **Nadir Vs Current:** 00334 used current counts as reduction triggers but omitted treatment-day recovery gates. Current counts now govern withholding; prior-cycle nadirs govern subsequent reduction review. (00334 Table3 p3; EMA4.4 p7)
- **Dose History:** Reduction now requires documented prior dose, recovery, current counts, toxicity and stop history; no invented dose below100mg/m². (00334 Table2–3 p3)
- **Permanent Stop Persistence:** Confirmed prior stop criteria remain active after recovery; 00461 preceding-course Grade4 events do not disappear when current symptoms improve. (Both NCCP pp3–4)
- **Cycle2 Only Escalation:** Cycle2 eligibility and the prohibition on late escalation were missing. Added review-only escalation with prior/current toxicity separated. (Both NCCP p3)
- **Hepatic Exclusion:** Significant hepatic dysfunction exclusion was not represented and could be obscured by no-adjustment wording. Added explicit exclusion and Child-PughC conflict review. (Both NCCP pp2,4)
- **Source Grade Semantics:** Older CTC/source grade pathways had been labelled CTCAEv5, including a fabricated nauseaGrade4 definition. Named source grading now carries explicit edition uncertainty; no automatic translation. (Both NCCP p3–4)
- **Older Cross Phase:** 00461 Grade4 and three-week non-recovery rules were not phase guarded. Their current and historical events now belong to the correct adjuvant/concurrent pathway. (00461 pp3–4)
- **Off Label Consent:** 00461 explicit Irish off-label consent/hospital-policy requirements were absent from decision inputs. (00461 p6)
- **Hbv And Safety:** Added positive-serology management, baseline/scheduled-test completeness, delayed liver injury, interaction and opportunistic infection review. (NCCP pp2,4–5; EMA4.4–4.5 pp6–8)
- **Pjp Scope:** PJP finding previously targeted whole_regimen, which could imply stopping radiotherapy. It now targets temozolomide and separately reviews persistent lymphopenia. (NCCP pp1–2,4; EMA p6)
- **Schedule Structure:** Both assessments lacked structured source dose/phase schedule. Added distinct concurrent and adjuvant phases with six-cycle limits. (Both NCCP p1)

## Differences preserved

- Standard00334 concurrent platelet permanent-stop threshold is below10×10⁹/L;00461 uses below25.
- Standard00334 other concurrent Grade3 toxicity stops treatment;00461 other Grade3 toxicity holds until recovery.
- Standard00334 adjuvant reduction uses prior nadir ANC below1/platelets below50 and recurrence/minimum-dose history.00461 has its own delay/stop tables with a maximum three-week delay.
- The older-patient current treatment section and revision history specify six adjuvant cycles; a stale2–12 entry remains visible as a source conflict.
- A previous severe nadir in00461 is explicitly sent for attribution review because the table does not state whether it represents nadir or next-cycle counts.

## Monitoring and support handoff

Baseline for both: FBC, renal/liver profile, glucose, HBsAg and anti-HBc.00334: weekly FBC duringRT, renal/liver tests beforeweek4.00461: weekly FBC throughweek7 inclusive, renal/liver tests1and4weeks afterRT; week7counts also serve adjuvantCycle1Day1. Both: Day1 testing each28-day adjuvantcycle. EMA supplements are separately labelled: Day22FBC and weekly recovery monitoring; liver review after eachcycle and vigilance for delayedinjury. PJP prophylaxis is required duringconcurrentRT; persistentlymphopenia needs continuingreview. No fixed MRI or tumour-marker schedule is invented.

## Limitations

Source conflicts, including Child-PughC eligibility, contraception duration and older-patient table headings/cyclecount/escalation, remain explicit specialist decisions. Numeric restart doses appear only in the fully guarded00334 reduction pathway. These are software/source fidelity checks, not independent clinical validation or final prescribing authority.
