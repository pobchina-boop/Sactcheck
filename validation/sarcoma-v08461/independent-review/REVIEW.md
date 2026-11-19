# Independent review of four batch-two clinical drafts

The four corrected external drafts pass **119/119 independently authored interaction cases**, after the same cases found **23 failures across three defect groups** in the original drafts. The harness, assessment engine and dose viewer hashes were unchanged between failing and passing runs. This is an independent agent/software review, not independent clinician or oncology-pharmacy approval.

Scope: 00335 imatinib GIST; 00325 sunitinib 42 days; 00719 sunitinib 21 days; 00244 regorafenib with both colorectal and GIST indications preserved. **00445 was excluded because its current source remains blocked.** No application files, patient routes or shared runtime code were changed by this reviewer. The authors corrected only the staged external drafts.

## Concrete findings corrected before application

|Draft|Defect demonstrated|Verified correction|
|---|---|---|
|00325|Current daily doses above the routine 50 mg, including 1000 mg, generated no clinical dose review when an inducer exception was absent.|Doses above routine require explicit exception/context review; values above the source 87.5 mg interaction ceiling hold pending reconciliation. The legitimate 87.5 mg inducer scenario remains a specialist review, with no automatic escalation.|
|00719|Known previous grade 3–4 toxicity plus missing current recovery grade could return only partial-domain findings unless a second restart checkbox was ticked.|Known severe history remains held until recovery is documented, regardless of phase or an omitted/false duplicate restart checkbox.|
|00244|Selecting a single restart reason could suppress a second documented restriction. Recovered liver toxicity hid an incomplete required 7-day HFSR interruption; recovered HFSR hid a previous liver event explicitly not recovered.|Concurrent event restrictions now remain active independently of the selected reason. A normal current domain or consultant-approval tick does not waive another known unresolved event.|

`initial-probes.json` retains the first minimal reproductions. `original-results.json` retains all original 96 passes and 23 failures; these are 5 dose-context, 6 missing-recovery and 12 concurrent-event scenarios, not 23 unrelated defects. `current-results.json` records the corrected 119 passes. No assertion was weakened or changed to obtain the replay pass; no fixture errors occurred.

## Independent coverage

The harness imports neither the author’s test scripts nor their case data. It uses the current real assessment engine and protocol dose viewer with the external draft JSON.

- **00335:** strict bilirubin/ALT/AST recovery combinations with an already reduced 200 mg dose; current low counts despite a recovery tick; missing current grade after recurrent severe toxicity; permanent TMA no-restart criterion; severe current retention despite a resolved flag; organ impairment/escalation alongside infection; low-risk adjuvant exclusion.
- **00325:** permanent cardiac and SJS/TEN history despite current recovery; HFS-specific versus general-toxicity recovery; Child–Pugh C conflict with dialysis and recovered HFS; upper dose/interaction context; current cardiac decline despite recovery approval.
- **00719:** all three phase selections and missing/false/true restart-checkbox states with missing recovery grade; 25 mg floor following grade 4 toxicity; baseline 55% LVEF boundary alongside recovered toxicity; clinical heart failure despite normal current EF; irreversible history despite normal current inputs; dialysis plus mixed blood-count results.
- **00244:** five restart labels crossed with incomplete/exact7-day HFSR interruption; unrecovered liver history under each alternative reason; seven irreversible-history scenarios in both CRC and GIST contexts; Gilbert exception versus independent severe-enzyme stops; hypertension-specific interruption timing; later recovery after failed four-week recovery; simultaneous permanent stop/active toxicity/infection; actual dose floor versus historical reduction counts.
- **Every draft:** partial inputs remain incomplete, pregnancy exclusions persist, and an unrelated invalid input does not erase a valid contraindication.

All assessed dose-viewer rows remain unquantified: these specialist-review pathways do not generate automatic numeric prescriptions. The completed 7-day regorafenib recovery scenarios also retain only partial-domain continuation findings, rather than an unintended ongoing minimum-break hold. Overall assessment remains incomplete where other domains are unentered.

## CRC preservation and scope

All **26/26** previously pinned files for `data/patient-knowledge/00244.json` and `patient/00244/*` remain byte-identical, including consent, guide, handbook, support, portal, wallet and QR assets. The draft’s existing 00244a indication object remains identical to the application’s CRC metadata; 00244b remains distinct. `crc-preservation-results.json` records every compared hash. This is preservation evidence, not a new clinical/PDF/visual audit of that CRC service.

## Source and readiness limits

The review uses the complete current official NCCP texts captured in the same campaign: 00335 v4, 00325 v6, 00719 v2 and 00244 v5. Copies and hashes are in `sources/` and `reviewed-source-manifest.json`. They are web-text hashes, not original PDF hashes. Original PDF binaries and visual table-layout verification remain unverified.

Existing source uncertainty remains explicit, including imatinib NCCP/Glivec cytopenia and dose-history differences, sunitinib 42-day Child–Pugh C disagreement with current product information, and regorafenib food wording/printed hypertension threshold ambiguity. This draft review did not create a source interpretation that resolves those uncertainties automatically.

Patient GIST materials, consent/support generation, browser journeys, PDF/QR checks, final application integration and release acceptance are separate work. This 119-case pass does not mark four complete patient service suites or the blocked fifth source complete.

## Reproduction

The original command intentionally reproduces historical failures; it is not a current acceptance gate. Preserve prior result files before any future run. When moving this evidence directory, provide both roots explicitly:

```sh
SACTCHECK_ROOT=/path/to/Sactcheck SACTCHECK_DRAFT_ROOT=/path/to/sarcoma-batch2-drafts-20261118 node independent-cases.cjs
SACTCHECK_ROOT=/path/to/Sactcheck SACTCHECK_DRAFT_ROOT=/path/to/sarcoma-batch2-drafts-20261118 node independent-cases.cjs --current
```

`input-manifest.json` and the original/corrected snapshots retain all four exact inputs; `current-results.json` includes current protocol/runtime/harness hashes. `run-log.json` records elapsed time, both statuses and unchanged-harness verification. No commit or push was performed.
