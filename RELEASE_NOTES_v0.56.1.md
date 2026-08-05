# SACTCheck v0.56.1 — Five-Regimen Knowledge Base Pilot

## Summary

SACTCheck v0.56.1 expands the Regimen info function from a basic evidence card into five detailed, source-linked regimen information pages. It is a cumulative repository update and includes every v0.56.0, v0.55.0 and v0.54.0 feature.

The release also corrects the source `index.html` references so the knowledge-base stylesheet, data and JavaScript load from the repository root rather than depending on a previously generated `_site` copy.

## Five detailed regimen pages

The first gold-standard pilot pages are:

1. NCCP 00382 Version 3 — Trifluridine and tipiracil (Lonsurf®)
2. NCCP 00568 Version 5 — Pembrolizumab, pemetrexed and carboplatin AUC5
3. NCCP 00655 Version 3a — Durvalumab 1500 mg monotherapy after definitive concurrent chemoradiotherapy
4. NCCP 00857 Version 3 — Pembrolizumab, carboplatin and weekly paclitaxel followed by doxorubicin and cyclophosphamide
5. NCCP 00624 Version 3 — Carboplatin and pegylated liposomal doxorubicin

## Information-page content

Each of the five pages now contains:

- regimen role and treatment setting;
- concise clinical overview;
- regimen component list;
- drug type, class and mechanism of action;
- explanation of how the components work together;
- schedule context and important orientation points;
- primary supporting publication;
- trial population, intervention and comparator;
- primary endpoint;
- selected numerical findings;
- evidence-to-protocol match statement;
- important limitations;
- stable PubMed and DOI links;
- linked follow-up publications where relevant;
- current NCCP protocol access;
- review status.

## Evidence mappings

The detailed pilot uses the following principal evidence records:

- RECOURSE for trifluridine/tipiracil;
- KEYNOTE-189 for pembrolizumab, pemetrexed and platinum chemotherapy;
- PACIFIC for durvalumab after concurrent chemoradiotherapy;
- KEYNOTE-522 for perioperative pembrolizumab and chemotherapy in high-risk early triple-negative breast cancer;
- CALYPSO for carboplatin and pegylated liposomal doxorubicin in platinum-sensitive recurrent ovarian cancer.

The page identifies schedule, population or regimen differences rather than presenting every mapping as exact. In particular, the RECOURSE evidence is labelled as support for trifluridine/tipiracil monotherapy, not for a bevacizumab combination, and the PACIFIC page identifies the difference between the original trial schedule and the current fixed-dose NCCP schedule.

## Content and clinical boundary

The Regimen info function is educational decision support. It does not:

- modify a deterministic protocol rule;
- change treatment eligibility or dose modification;
- replace the current NCCP protocol;
- calculate a patient-specific final dose;
- generate a treatment instruction;
- infer that a trial population is identical to an individual patient.

The current official NCCP protocol remains the operational treatment source.

## Technical changes

- Added `regimen_profiles` schema support to the knowledge-base data.
- Updated the knowledge-base data schema to version 1.1.
- Added dedicated overview, component-rationale, schedule, trial-design, key-findings, limitation and follow-up-publication UI sections.
- Added responsive styling for the expanded information page.
- Updated source and built-site version references to v0.56.1.
- Added a focused five-regimen evidence regression suite.
- Preserved the exact function name **Clinical scenario interpreter**.

## Clinical protocol integrity

No protocol JSON content was edited for this release. NCCP thresholds, encoded rules, recommendations, dose levels and protocol-dose calculations remain unchanged from v0.56.0.

Independent clinical and oncology-pharmacy review remains required before formal approval of the information-page content.

## Validation result

The complete security, protocol-publishing, historical regression, focused v0.56.1, GitHub Pages and deployable-site pipeline passed. All 382 protocol-directory JSON files remain byte-for-byte unchanged from v0.56.0, and no nested `protocols/protocols` directory is present.
