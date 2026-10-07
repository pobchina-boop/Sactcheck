# Validation — SACTCheck v0.81.5

Focused local validation completed:
- JavaScript syntax check passed for the two changed antiemetic modules
- v0.81.5 focused antiemetic regression test passed
- package/app/registry release markers are aligned to v0.81.5
- patient content release intentionally remains v0.81.4
- the legacy expandable `.antiemetic-script-v0780` renderer no longer creates a details/dropdown control
- the single `.emetogenic-badge` control owns the printable Rx-script click and uses the larger bordered design
- printed-PDF presentation guard suppresses the local source object and removes CUH/local provenance wording without changing the underlying prescription data

Live GitHub Pages deployment is not claimed until the patch is committed and the Pages workflow is checked.
