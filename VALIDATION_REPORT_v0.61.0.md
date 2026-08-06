# SACTCheck v0.61.0 Validation Report

**Validated:** 6 August 2026  
**Baseline:** v0.60.3

## Scope

Validation covered the three new knowledge profiles, the evidence-completeness audit across all eighteen profiles, evidence-relationship rendering, cumulative regression behaviour, repository security and deployable GitHub Pages output.

## Automated results

| Validation domain | Result |
|---|---:|
| Complete regimen profiles | 18 |
| Principal evidence records | 42 |
| Reusable medicine profiles | 27 |
| New profiles | 3 |
| Existing profiles audited | 15 |
| Protocol JSON files | 382 |
| Protocol JSON files changed from v0.60.3 | 0 |
| Focused v0.61.0 test | Passed |
| Full cumulative test suite | Passed |
| JavaScript syntax check | Passed |
| Repository security scan | Passed — 963 text files scanned |
| GitHub Pages build | Passed |
| Deployable-site validation | Passed |

## Focused assertions

The v0.61.0 regression test verifies:

- the three new protocol profiles are present;
- every profile includes an evidence-audit status, coverage summary and declared uncertainties;
- every evidence record has a relationship label, publication link and limitations;
- XELOX/CAPOX contains separate evidence for all three encoded disease settings and duration context;
- weekly paclitaxel contains evidence for breast, ovarian, SCLC and bladder contexts with retrospective limitations declared where applicable;
- trastuzumab deruxtecan contains DESTINY-Breast03 and DESTINY-Breast04 and highlights ILD risk;
- specified material gaps in earlier profiles are closed;
- RECOURSE and SUNLIGHT remain present together with their different evidence boundaries;
- all protocol JSON hashes remain unchanged from v0.60.3.

## Residual limitations

- This is a structured evidence-completeness audit, not a formal systematic review or guideline-development process.
- Weekly paclitaxel has materially different evidence strength across its four NCCP indications.
- The FOLFIRI oesophageal indication still lacks an exact all-histology randomised FOLFIRI trial within this audit; adjacent upper-GI evidence is clearly labelled.
- Several shared-protocol evidence records use a closely related regimen or schedule rather than an exact dose-for-dose match.
- Independent consultant oncology and oncology-pharmacy validation is still required before clinical authorisation.

## Conclusion

The release passed software, integrity, security and deployment validation. The evidence presentation is more complete and more explicit about limitations, but automated validation does not constitute independent clinical validation.
