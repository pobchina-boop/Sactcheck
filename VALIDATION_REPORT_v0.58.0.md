# SACTCheck v0.58.0 Validation Report

Validation date: 5 August 2026

## Release scope

Cumulative expansion of the source-linked regimen knowledge base from five to ten detailed profiles. No deterministic assessment rules or protocol JSON content were modified.

## Automated validation

| Check | Result |
|---|---|
| Focused v0.58.0 compatibility and expansion suite | Passed |
| Complete historical `npm test` suite | Passed |
| Repository security check | Passed — 889 text files scanned |
| GitHub Pages build | Passed — 382 protocol JSON files copied |
| Deployable-site validation | Passed |
| JavaScript syntax check | Passed |
| Protocol JSON hash comparison with v0.57.0 | Passed — 382/382 unchanged |

## Knowledge-base validation

- Schema version: 1.2
- Release: 0.58.0
- Detailed regimen profiles: 10
- Drug profiles: 24
- Evidence records: 18
- New full-module profiles: 5
- New primary evidence mappings: MOSAIC, PRODIGE 24/CCTG PA.6, TRYPHAENA, monarchE and IMbrave150
- Primary publication links use stable PubMed URLs.
- DOI links are present for each new primary evidence record.
- Each new profile includes patient-selection, supportive-care, monitoring/toxicity and administration modules.
- User-facing knowledge content contains no AI-origin label.

## Regression protection

- The original five v0.56.1 knowledge profiles remain in their frozen source file and continue to render through the cumulative v0.58.0 module.
- The v0.57.0 search-first layout, 175 ms debounce, indexed matching and conditional fuzzy search remain unchanged.
- Single-value and partial clinical assessments remain covered by the full historical test suite.
- Official NCCP protocol links remain available as the operational source.

## Clinical review status

The five new profiles are source-checked drafts pending consultant oncology and oncology-pharmacy review. Their interface status communicates this explicitly. Publication summaries are contextual and do not alter treatment eligibility, dose actions or assessment status.
