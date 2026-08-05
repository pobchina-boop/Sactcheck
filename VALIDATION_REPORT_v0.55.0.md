# Validation Report — SACTCheck v0.55.0

## Release

**Global Clinical Scenario Interpreter**

## Cumulative baseline

This release is built directly on v0.54.0 and includes the complete in-regimen constrained scenario interpreter and Immunotherapy toxicity map refinements from that release. The user can therefore update directly from v0.53.0 to v0.55.0 without applying v0.54.0 separately.

## Release-specific validation

The v0.55.0 focused test verifies:

- the standalone Clinical scenario interpreter appears on the main library screen;
- the interpreter ranks Lonsurf as the leading protocol for a metastatic colorectal cancer scenario mentioning Lonsurf;
- exact NCCP 00382 wording governs protocol matching;
- a weekly paclitaxel breast scenario returns possible paclitaxel protocols rather than silently selecting one;
- possible patient-identifiable information produces a blocking warning;
- the global module performs no external fetch and does not call the assessment engine directly;
- the selected scenario is transferred to the in-regimen interpreter with automatic candidate extraction;
- the in-regimen interpreter remains versioned and functional under v0.55.0.

## Catalogue audit

The repeatable global-interpreter audit examined all 376 indexed and published protocol records using seven representative scenarios:

- Lonsurf plus bevacizumab wording where no single encoded protocol contains both medicines;
- pembrolizumab, pemetrexed and carboplatin for metastatic non-squamous NSCLC;
- carboplatin and pegylated liposomal doxorubicin for ovarian cancer;
- daratumumab and bortezomib for multiple myeloma;
- exact NCCP-number matching;
- ambiguous weekly paclitaxel wording;
- identifier-containing text.

All seven scenarios passed their predefined matching and safety checks.

## Full pipeline

- Repository security scan passed: 851 text files scanned.
- Protocol index and metadata publishing passed.
- 381 protocol publishing tests passed.
- Complete historical regression suite passed.
- v0.54.0 in-regimen scenario-interpreter tests passed under the cumulative release.
- v0.55.0 global scenario-interpreter tests passed.
- Global scenario-interpreter catalogue audit passed across 376 indexed protocols.
- GitHub Pages build passed.
- Deployable-site validation passed.
- ZIP integrity passed.
- No nested `protocols/protocols` directory is present.

## Clinical-file integrity

A byte-for-byte SHA-256 comparison confirmed that all 382 protocol JSON files are unchanged from v0.54.0.

## Residual limitations

- Matching uses a controlled local clinical vocabulary rather than an unrestricted language model.
- It may abstain or return several possible protocols when terminology is unfamiliar or incomplete.
- A protocol that is not present in the current SACTCheck catalogue cannot be assessed.
- Separate component protocols may be returned where the scenario names medicines not encoded together in a single protocol.
- The clinician must still verify the exact indication, treatment phase, schedule and current NCCP version.
- Spoken dictation and a secure hosted language-model service are not included.

## Conclusion

The release is suitable for technical and shadow validation as a local regimen-finding and structured-entry aid. It does not constitute autonomous clinical decision-making, independent clinical validation or authorisation to prescribe or administer treatment.
