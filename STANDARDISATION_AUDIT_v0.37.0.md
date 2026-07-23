# SACTCheck v0.37.0 Standardisation Audit

Audit date: 23 July 2026

## 1. Scope and method

The complete active protocol tree was parsed and audited rather than sampling only recently edited breast regimens. The migration and regression suite inspected protocol identity, catalogue classification, supportive-care mapping, CTCAE controls, renal inputs, source links and assessment-engine behaviour.

Active regimen definition: a JSON protocol with a non-empty NCCP regimen code other than the inactive/template code 00000, excluding index/schema/package files and templates.

## 2. Inventory and duplication

- Active regimen protocols: 121
- Total JSON files parsed in the repository audit: 129
- JSON parse errors: 0
- Duplicate `protocol_id` values: 0
- Duplicate NCCP regimen codes: 0
- Duplicate normalised titles: 0
- Active regimen placeholders/drafts: 0

The repository retains one inactive shared ECOG context placeholder and one protocol field named `ecog_placeholder`. Neither is an active regimen card and neither is counted as a regimen placeholder.

## 3. Catalogue classification

| Catalogue section | Regimens |
|---|---:|
| Chemotherapy & combination SACT | 88 |
| Targeted & HER2 therapies | 22 |
| Immunotherapy | 5 |
| Endocrine (hormonal) therapies | 5 |
| Bone-modifying therapies | 1 |
| Other / unclassified active regimens | 0 |

Pure endocrine protocols were verified as non-cytotoxic and separated from chemotherapy: 00253, 00254, 00361, 00371 and 00376.

The catalogue retains universal search and tumour-site filters. A treatment may therefore be found directly without navigating treatment-section headings.

## 4. Antiemetic and supportive-care mapping

All 121 regimens have a central registry record and protocol-level mapping metadata.

| Mapping | Regimens |
|---|---:|
| High | 28 |
| Moderate | 15 |
| Low | 22 |
| Minimal | 27 |
| Oral moderate-high | 7 |
| Oral minimal-low | 8 |
| Phase-dependent | 13 |
| Variable | 1 |

The single variable regimen is NCCP 00350, where the catalogue title does not specify the companion chemotherapy. The interface instructs the clinician to use the risk of the most emetogenic active component.

### Mappings requiring local clinical/pharmacy confirmation

The following 11 mappings are intentionally flagged for focused review rather than being represented as fully validated:

- 00250 TC
- 00258 TCH
- 00350 pertuzumab/trastuzumab with unspecified chemotherapy
- 00377 oral CMF
- 00378 IV CMF 28-day
- 00381 IV CMF 21-day
- 00722 TCHP
- 00731 trastuzumab SC/pertuzumab with docetaxel/carboplatin
- 00775 TRAIN-2
- 00789 Phesgo TCHP
- 00790 Phesgo TRAIN-2

Carboplatin AUC 4 or greater is mapped to high emetogenic risk; AUC below 4 is mapped to moderate risk. Anthracycline/cyclophosphamide combinations, cisplatin, sacituzumab govitecan and trastuzumab deruxtecan are mapped to high risk. Oral agents use the NCCP oral moderate-high and minimal-low groupings.

### Local prescription-sheet inventory

Included local assets:

- `Antiemetics_High_V2_05.21.pdf`
- `Antiemetics_Moderate_V2_05.21.pdf`
- `Antiemetics_Low_V2_05.21.pdf`
- `Docetaxel_Supportive_Medicines_V2_05.2021.pdf`

These PDFs contain practical local prescriptions but date from 2021. They are not represented as current national prescriptions. The interface labels them as local documents requiring oncology-pharmacy reconciliation with NCCP V6 and current CUH policy.

## 5. CTCAE audit

- Genuine CTCAE/grade controls enriched: 415
- Controls rendered as selectors: 415
- Controls with CTCAE version metadata: 415
- Controls with practical assessment guidance: 415
- Controls with Grade 0-4 explanations: 415

The migration corrected a classifier defect in which the word "non-haematological" was previously being matched as "haematological". All 32 such fields now use an `other_nonhaematological` safety category and explicitly require the named CTCAE adverse event.

Specific combined or specialised controls now show the relevant criteria rather than an unrelated generic description, including diarrhoea/colitis, mucositis/diarrhoea, acneiform rash, allergic reaction, hypersensitivity/anaphylaxis, myocarditis, myositis and Guillain-Barre syndrome.

CTCAE v5.0 remains the controlled version for this release. NCI identifies v6.0 as the current release, but a safe migration requires term mapping and protocol-source review and is therefore outside this standardisation release.

## 6. Renal-input audit

- Protocol-specific categorical renal fields: 32
- Exact continuous renal fields retained: 27
- Categorical renal rule left as number-only input: 0

Each categorical option contains:

- a displayed protocol-specific range;
- an internal decision value for the deterministic rule engine;
- minimum/maximum range metadata;
- a dialysis option where applicable.

The engine was tested to confirm that threshold rules receive the decision value while the assessment record preserves the clinician-facing range label. Exact fields are retained only for carboplatin/Calvert contexts where a continuous value is clinically required.

## 7. Supportive-link reconciliation

All non-phase-dependent/non-variable protocols were checked against the central script registry:

- stale or contradictory per-protocol supportive URLs: 0
- stale supportive labels: 0
- phase-dependent regimens with misleading static script links: 0

This specifically prevents minimal-risk trastuzumab/bevacizumab protocols and oral SACT protocols from opening a legacy parenteral low/moderate script.

## 8. Automated validation

The release-blocking test suite covers:

- schema and protocol validation;
- assessment-engine behaviour;
- all existing regimen regression tests;
- duplicate identity/code/title detection;
- catalogue-section and endocrine separation;
- central supportive-care coverage and URL reconciliation;
- CTCAE category, source and grade-guide completeness;
- renal-band conversion, dialysis field propagation and documentation labels;
- exact-value carboplatin exceptions;
- catalogue treatment filtering and cache/version integrity.

Automated tests do not constitute clinical validation. The application remains clinical decision support and must be verified against the current official NCCP protocol, current local policy, oncology-pharmacy review and consultant judgement.
## 9. Repository package cleanup

The obsolete nested v0.17 preview application previously stored inside `protocols/` was removed. The protocol tree now contains only active protocol data, shared profiles, the authoring template, schema and generated index. This prevents users from opening a stale secondary interface and removes an obsolete nested package version from the release artifact.

