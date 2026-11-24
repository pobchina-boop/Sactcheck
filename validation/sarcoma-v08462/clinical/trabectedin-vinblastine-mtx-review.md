# External clinical review: trabectedin and vinblastine/methotrexate

Checked 18 November 2026. Proposed release 0.84.62. These are external review drafts, not integrated app changes, prescriptions, completed clinical approval or a released suite. The baseline commit is `c01f1a2b236afced0c3ebfdb6b6ff864e58e7d4c` (committed version 0.84.59); the current working tree is 0.84.60.

Complete current NCCP web-extracted text was reviewed for both protocols. Source text hashes, current versions, original app hashes and draft hashes are in `trabectedin-vinblastine-mtx-draft-manifest.json`. Neither original PDF binary nor fresh table pixels was available; the text hashes are not original-PDF hashes. Source-source disagreements are retained, not silently resolved by choosing a numeric dose.

## 00374: trabectedin v4 → v4a

Current NCCP: https://healthservice.hse.ie/documents/6729/374_Trabectedin_monotherapy.pdf (6 pages; footer last review 26 May 2026, version amendment 31 August 2026).

Current EMA: https://www.ema.europa.eu/en/documents/product-information/yondelis-epar-product-information_en.pdf

| Finding in existing app | Source and draft response |
|---|---|
| Haemoglobin and albumin eligibility gates absent | p1 Table1: Hb ≥9 g/dL and albumin ≥25 g/L at baseline and every retreatment; separate current-result holds added. |
| Current bilirubin, ALT/AST and ALP incorrectly treated as prior-cycle reduction events | Current Table1 gates withhold. Prior-cycle peaks are separate inputs and reviewed next-cycle reduction rules. |
| Numeric CrCl <30 not captured | p1 Table1 and EMA require ≥30 for monotherapy. NCCP p3 Table5 says no adjustment expected below30/on dialysis. Draft holds and names the conflict; no dose calculation. |
| Prior neutropenia severity/duration/fever and platelet nadir absent | p2 Table2: ANC <0.5 for >5 days or associated fever/infection; platelets <25. Exact-boundary and missing-history branches added. |
| Transaminase reduction source difference hidden | NCCP lists prior ALT/AST >2.5×ULN; EMA adds not recovered by Day21. Both recovered and unrecovered cases require source/prescription review. |
| Dose history, no re-escalation and lower dose limit missing | p3 Table4: 1.5→1.2→1 mg/m². After toxicity reduction, no re-escalation. EMA considers discontinuation if further reductions needed. |
| Any muscle symptom incorrectly caused permanent stop | Symptoms trigger assessment/hold. Confirmed rhabdomyolysis interrupts until full recovery; previous history and recovered restart review remain visible. |
| Cardiac current versus previous events conflated | p3 Table3 separates current delay, previous-cycle reduction and permanent stop for symptomatic/persistent dysfunction. Complications/EMA have stricter discontinuation criteria, explicitly flagged for clinical adjudication. |
| Pre-existing cardiomyopathy and active infection incompletely actioned | NCCP exclusions retained independently of a missing/later assessment phase. |
| Capillary-leak diagnosis not distinguished from symptoms | Possible CLS holds for investigation; confirmed CLS after excluding other causes discontinues under EMA4.4. |
| Emetogenic risk low and steroid instruction vague | NCCP p4 says moderate. Mandatory dexamethasone example is20 mg IV30 minutes before trabectedin for antiemesis/apparent hepatoprotection. |
| Cardiac/biochemical surveillance incomplete | Baseline and2–3-month cardiac imaging; CPK weekly first2cycles then between treatments. EMA additionally specifies weekly FBC/liver parameters first2cycles. |
| Indication/schedule abbreviated | Adult advanced STS after anthracycline and ifosfamide failure or unsuitability;1.5 mg/m²24-hour IV every21days, central access strongly recommended. No first-line doxorubicin/trabectedin claim imported. |

The source's cardiac LVEF decline wording is not replaced by an invented numeric algorithm. A clinician-confirmed criterion is explicit, with previous permanent-stop history retained. Moderate hepatic classification is not inferred from invented bilirubin bands and never overrides Table1.

## 00554: vinblastine/methotrexate v2 → v3

Current NCCP: https://healthservice.hse.ie/documents/6742/554_vinblastine_MTX_SAMV.pdf (4 pages; reviewed14 September2026).

Current exact referenced MTX product, 5 g/50 mL: https://assets.hpra.ie/products/Human/22092/Licence_PA0822-206-007_11092026121412.pdf (11 September2026).

Vinblastine1 mg/mL product: https://assets.hpra.ie/products/Human/22094/Licence_PA0822-208-001_11042025094405.pdf (11 April2025).

| Finding in existing app | Source and draft response |
|---|---|
| Obsolete MTX renal65% at60–80 and old bands | Current NCCP: ≥50 full,20–50 half, with overlap at50. Current low-dose HPRA: >60 full,30–59 half,<30 contraindicated. The50–60 interval requires explicit review; no rounding through the59–60 gap. |
| CrCl20–<30 organ-table advice conflicts with regimen exclusion | CrCl <30 remains a contraindication/review against the regimen exclusion; no exceptional dose automatically bypasses it. Dialysis not recommended. |
| Obsolete MTX hepatic75%/AST180 rules | Current NCCP says no adjustment expected except bilirubin >86 avoid. HPRA contraindicates >85.5; the narrow85.5–86 interval holds for reconciliation. |
| Vinblastine bilirubin/AST reduction/omission bands obsolete | NCCP bilirubin >51 gives50% original VBL; HPRA specifies DIRECT bilirubin >3 mg/dL. Analyte and rounded thresholds differ and need review. MTX unaffected by this rule. |
| Count thresholds lacked precise source separation | Full count row requires ANC >0.9 and platelets >99. ANC0.5–0.9 or platelets50–99 calls for50% review; ANC <0.5 or platelets <50 delays. A severe other count overrides a reduction review. |
| ≥14-day delay reduction absent | Reduce BASELINE vinblastine by25%; not MTX and not25% from an already reduced dose. |
| Generic ECOG >2 threshold unsupported | Current source lists no ECOG eligibility cutoff. Removed from this external draft, preserving clinical suitability review. |
| Mucositis pathway overlap and ambiguous100% | Grade1 MTX50% review; grade2 means omit MTX (100% reduction). Grades3/4 and restart lack numeric source rows, so hold/review without fabricated restart dosing. |
| Oral ulcer product contraindication not distinguished | Separate current oral/GI ulcer finding preserves MTX SmPC contraindication; it is not assumed that every grade1 mucositis is an ulcer. |
| Fluid collections insufficiently distinguished | Large third-space collections are regimen exclusions; significant new fluid retention triggers MTX review because elimination can be prolonged. |
| Neuropathy action overgeneralised | Grade >2 may require VBL reduction at consultant discretion; no mandatory omission or MTX change inferred. |
| Pulmonary history/IV-only route not explicit | MTX pulmonary symptoms prompt withdrawal/investigation; clinician-suspected drug-induced lung disease retains no-restart history. Vinblastine is IV only; other routes can be fatal. |
| Schedule/support context incomplete | Days1,8,15 in28-day cycles, Day22 rest, total12cycles. VBL6 mg/m² IV50 mL over10min; MTX30 mg/m² IV bolus. Baseline chestX-ray. No high-dose MTX rescue or routine G-CSF imported. |

Indication remains **advanced aggressive fibromatosis**, distinct from metastatic soft-tissue sarcoma. All original indication IDs and context metadata are preserved.

## Validation and adoption boundary

`test-trabectedin-vinblastine-mtx.cjs` uses the application's actual assessment, dose-action and local-laboratory engines. It exercises current-result versus previous-cycle inputs, inclusive/exclusive limits, local ULN conversions, partial input/coverage reporting, recurrence/recovery history, component attribution, source conflicts and demo defaults. Every authored rule has a triggering case. The deterministic result file records all individual cases, not merely a count.

The test also verifies the original application protocol SHA-256 values remain unchanged. Draft metadata keeps consultant review, oncology-pharmacy review and clinical-use authorisation false. All dose actions block numeric prescription. Passing software tests does not resolve a clinical source conflict or verify rendered browser/patient/PDF workflows.

If later adopted, migrate `nccp-00374-v4` → `nccp-00374-v4a` and `nccp-00554-v2` → `nccp-00554-v3` in the index, registry and dependent sidecars together, retaining old-ID aliases. Preserve `00374-sarcoma` and `00554-sarcoma`. This writer only creates files under the external draft directory; adoption and shared metadata changes belong to parent integration.
