# SACTCheck v0.84.23

Five new small-cell lung service suites and a full upgrade of legacy pemetrexed monotherapy, built on committed v0.84.22 (`3266b513b9cc8f2af204b42e9676f75817db2e01`).

| NCCP | Suite | Audited version | Scope |
|---|---|---|---|
| 00689 | Atezolizumab / carboplatin / etoposide | 4 | New suite; induction and maintenance |
| 00908 | Serplulimab / carboplatin / etoposide | 1b | New suite; current EMA supplements labelled |
| 00271 | Carboplatin / IV etoposide | 6 | New suite; IV schedule and explicit oral alternative |
| 00280 | Cisplatin / etoposide | 7 | New suite; baseline and on-treatment renal rules separated |
| 00319 | Carboplatin / oral etoposide | 5 | New suite; twice-daily Days 1–3 capsule plan |
| 00222 | Pemetrexed monotherapy | 5 | Legacy upgrade; maintenance versus second-line |

## Full service scope

Each suite includes a source-audited clinical decision tool, indication-aware knowledge and evidence, consent support, patient portal/reference, visual guide, passport, treatment card, logistics, date-free treatment journey, monitoring map and phase-specific supportive-care drafts. Application release, catalogue metadata, patient registry, source tracker, clinical validation register and sustainability context are updated together.

The six protocols contain 322 source-specific rules. Tests preserve distinct ANC/platelet boundaries, baseline versus treatment thresholds, renal and hepatic dosing contexts, unassigned source bands, attribution of immune toxicity and consultant choices. No automatic multiplication of dose-reduction fractions or silent conversion between oral and IV etoposide is introduced. A single bilirubin entry supplies absolute and ULN values. CTCAE editions remain source-specific; unspecified editions are not silently relabelled.

Evidence remains population-specific: ASTRUM-005 is not a comparison with atezolizumab; maintenance and second-line pemetrexed studies are distinct; the historical oral-etoposide study is not an exact match for the NCCP carboplatin regimen. Patient outcome charts do not acquire unsupported numerical estimates.

Support plans distinguish carboplatin AUC5 Day 1, subsequent etoposide days, immune-only maintenance and low-risk pemetrexed monotherapy. Multi-day antiemetic gaps require a reconciled local plan. Folate, B12 and rash-prevention steroids are retained without duplicating chemotherapy-phase prescriptions.

## Verification

- 1,115 integrated source-derived checks passed: 273 atezolizumab, 345 serplulimab, 211 IV-etoposide regimens, 155 oral etoposide and 131 pemetrexed monotherapy.
- Full `test:ci` passed, including existing breast/lung regressions, security, catalogue and deployable-site checks.
- 52 PDFs / 94 pages reviewed; bounds checks passed; compatibility copies match; 24 QR checks passed.
- Browser checks covered incomplete assessment, bilirubin conversion and attribution, knowledge/evidence, consent, oral dosing, support phase selection and all six patient portals.
- 4,024 patient files outside the six-suite scope remained byte-identical to baseline.
- Clean-baseline overlay application, manifest hashes and full CI checked before delivery; see `validation/lung-next-v08423/package-verification.json`.

There are now 124 registered patient portals and 122 modern authored suites. The authored-suite development review inventory is 122/122, with no outstanding rows in that inventory. This is not a claim of complete lung coverage or independent clinical approval. The two remaining legacy registry entries are 00382 and 00831.

## Review boundary

Feasibility evaluation only. Independent consultant, oncology-pharmacy and patient/PPI review remains pending. `clinical_use_authorised` remains false. Neither commits nor deployment are included in this delivery. Apply all files, approving replacements, using `APPLY_UPDATE_v0.84.23.txt`.
