# Colorectal retrospective source audit v0.84.32

Targeted retrospective source/version, threshold, schedule, monitoring, supportive-care and patient-content audit; not independent clinical validation. No shared implementation files edited.

All five current official PDFs are byte-identical to the previous source snapshots. Current catalogue links were checked on2026-11-04.

## 00209 PARTIAL_INPUT_HOLD_GUARDS (high)
p4 Table2; p5-6 adverse-event tables
Low ANC/platelet and current diarrhoea/stomatitis hold rules require delay duration. Pure rule-engine evaluation of isolated ANC0.9, platelets60, diarrhoea grade2 or stomatitis grade2 produces consultant_review with no matching findings, so the source-specific hold instruction is missing. This is not a claim that the UI clears treatment.
Make hold condition independent of duration. Keep duration-specific stop rules at higher priority; say confirm delay duration before restarting.

## 00321 PARTIAL_INPUT_HOLD_GUARDS (high)
p3 Table2; p4 Table4; p5 Table6
Low day1 counts and current diarrhoea/stomatitis/HFS hold rules require optional delay duration. Isolated ANC0.9, platelets60, diarrhoea2, stomatitis2 or HFS2 yield no finding.
Make immediate hold independent of duration, while retaining stop rules at two weeks. Preserve baseline ANC1.5/platelets100 versus subsequent-cycle ANC1.2/platelets75 distinctions.

## 00321 RENAL_DECIMAL_BOUNDARY (medium)
p4 Table3
Capecitabine table states30-50=>75%,51-80=>no adjustment; existing encoding has no explicit pathway for unrounded50<CrCl<51.
Add consultant review for this source-table gap, do not round to infer a dose. This parallels the existing00586/00623 boundary guards.

## 00321 CONDITIONAL_INR_PATIENT_MONITORING (medium)
p2 TESTS
Patient knowledge/monitoring has no warfarin/INR mention although source requires baseline and regular INR when on warfarin, as clinically indicated.
Add conditional INR to monitoring and medication review; do not imply all patients need INR.

## 00623 WARFARIN_MONITORING_CADENCE (medium)
p3 TESTS
Patient chapter only says warfarin can need closer INR checks, and monitoring grid lacks the explicit source cadence.
Add if taking warfarin: weekly INR until stable warfarin dose established, then before each cycle. Preserve existing BP before and post-treatment and urine protein monitoring.

## 00209 ICE_PRECAUTION (low)
p2 administration footnote
Patient materials give general cold precautions but omit explicit avoidance of ice chips during bolus fluorouracil in the oxaliplatin-containing schedule.
Add no ice chips with this regimen; retain clinically assessed breathing symptoms rather than automatically labelling them cold dysaesthesia.

## 00227 SOURCE_CONFLICT_RETAIN (retain)
p2 exclusions; p3 Table2; p4 Table3
Existing exact hepatic boundary review at bilirubin85/AST180 and ANC recovery after>2wk review are appropriate. Source ANC table itself says hold maximum2wk but discontinue after4wk. Source excludes impaired renal function yet Table3 provides CrCl>=10 no adjustment and<10 dose range.
Keep source conflicts visible; do not collapse2wk/4wk into single threshold or auto-select dose from50-66%. Consider explicit renal source-conflict review if not surfaced elsewhere.

## 00227 DIARRHOEA_RECOVERY_CONFLICT (medium)
p3 DOSE MODIFICATIONS; p4 Table4
Source narrative says treatment-related diarrhoea fully resolved before irinotecan, while Table4 permits resumption below grade2. Existing generic proceed condition accepts current grade1.
Add review at grade1 diarrhoea to expose narrative/table ambiguity, particularly before restart. Do not claim grade1 alone proves irinotecan readiness.

## 00586 SCHEDULE_RECONFIRMED (retain)
p1 treatment;p2 tests;p3 renal
Correct existing schedule is capecitabine825mg/m2 twice daily Days1-5 in7-day cycles with RT, maximum5-6cycles. Weekly cycle bloods are source-based. Existing renal50-51gap guard and graded recurrent toxicity logic are present.
Retain this distinct regimen; do not change to7days continuous tablets or importCAPOX14day course. New patient summary should distinguish radiation appointments from tablet days and retain prescribed duration.

## 00623 RENAL_CONFLICT_RECONFIRMED (retain)
p4 Table2; p2-4 capecitabine instructions
Current source gives capecitabine100% forCrCl>=30, while supplementary capecitabine SmPC1250mg/m2 dosing distinguishes30-50. Existing RENAL_SOURCE_CONFLICT/RENAL_GAP correctly avoid automatic normal dose. Within-cycleANC<1/platelets<75 differs from subsequent recoveryANC>=1.5.
Preserve source-conflict review and within-cycle versus subsequent-dose logic; do not inheritCAPOX renal dose silently.

