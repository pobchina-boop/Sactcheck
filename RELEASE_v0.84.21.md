# SACTCheck v0.84.21

This update completes the two outstanding breast catalogue service suites and all 38 remaining development retrospectives. It closes the recorded software/content audit findings while retaining feasibility status and all independent approval requirements.

| Coverage measure | Result |
|---|---:|
| Current NCCP breast catalogue entries with authored suites, including shared regimens | 84/84 |
| Local entries classified exactly as Breast with authored suites | 72/72 |
| Authored suites with completed development retrospective | 106/106 |
| Remaining development retrospective queue | 0 |
| Required patient page/PDF presence checks across authored suites | 1,802/1,802 |
| Executable protocols across the platform | 377 |

The current catalogue reconciliation was captured on 25 October 2026. These counts describe content and software coverage, not independent clinical validation or every indication within a shared regimen. Olaparib patient materials remain explicitly limited to the breast-adjuvant setting.

## Changes

- Add NCCP 00212 and 00215 bevacizumab service suites, preserving 10 mg/kg every 14 days versus 15 mg/kg every 21 days, their distinct indications and separately prescribed chemotherapy support.
- Complete the 38 retrospective suites listed in `validation/breast-completion-v08421/scope.json`, including shared gastrointestinal and lung entries in the remaining platform queue.
- Carry source-specific rationale, evidence applicability, treatment phases, monitoring and supportive care through clinician knowledge, patient information, consent, passports, cards and downloadable timelines. Numeric trial estimates remain in clinician evidence with their populations and limitations; patient evidence is qualitative.
- Refresh changed NCCP documents for 00212, 00207, 00447 and 00448. Expand missing 00568 assessment pathways and distinguish its triplet induction from two-medicine maintenance.
- Repair structured schedules for 00526, 00798, 00568 and 00586; repair 56 clipped pages across eight legacy passports; fix dead navigation/source references and the 00568 compatibility consent PDF.
- Reject malformed boolean, numeric and select inputs without losing independently established urgent findings or conservative source rules for unknown phases. An invalid field never produces complete treatment clearance.

## Verification

The release evidence is stored in `validation/breast-completion-v08421`. It includes 532 new integrated source cases, 328 regenerated suite PDFs/615 pages with matching compatibility copies, 160 decoded QR checks, and a platform scan of 946 patient PDFs/1,770 pages. The scan also checks 19,509 local links and 2,418 protected asset hashes. An additional 00947 logistics PDF was refreshed for its repaired source reference.

Engine probes cover all 377 protocols: 35,386 malformed-input cases and 2,287 blank-numeric cases, plus maintenance phase completeness and invalid-phase urgent-hold checks. Representative browser review covers the corrected 00212 schedule and PDF, 00568 phase-specific support, and the 00588 indication gate. PDF visual review is representative; page bounds, download-copy parity and suite QR checks are automated across the stated document set.

`preservation-check.json` records 2,039 unchanged patient/data files outside scope. `findings-closure.json` maps audit A01-A09 to repairs and evidence. `release-validation.json` records the full CI and clean-overlay results.

## Applying the update

Extract the cumulative archive into the existing repository root and approve replacement of matching files. Keep all other files. See `APPLY_UPDATE_v0.84.21.txt`. The package includes any v0.84.20 replacements absent from the recorded GitHub baseline, so it is also compatible with the complete v0.84.20 package. No commit, push or deployment is included.

Independent consultant, oncology-pharmacy and patient/PPI review remain pending. The application retains its feasibility notice and false clinical-authorisation flags.
