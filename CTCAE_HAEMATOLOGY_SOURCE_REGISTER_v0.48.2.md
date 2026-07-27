# CTCAE haematology source register — SACTCheck v0.48.2

## Controlled sources

- NCI CTCAE v6.0 PDF: https://dctd.cancer.gov/research/ctep-trials/for-sites/adverse-events/ctcae-v6.pdf
- NCI CTCAE v5.0 PDF: https://dctd.cancer.gov/research/ctep-trials/for-sites/adverse-events/ctcae-v5-5x7.pdf
- NCI CTCAE information and current-version page: https://dctd.cancer.gov/research/ctep-trials/for-sites/adverse-events/ctcae

## Default version policy

- The current NCI CTCAE release is v6.0.
- SACTCheck v0.48.2 uses v6.0 as the default educational reference for haematological terms.
- Any input explicitly marked `ctcae_version: "5.0"` remains displayed and calculated against v5.0.
- Educational grading does not alter the deterministic NCCP assessment engine.
- Non-haematological terms remain on the existing controlled v5.0 descriptor layer pending a separate term-by-term migration.

## Exact CTCAE v6.0 criteria encoded

### Neutrophil count decreased

| Grade | Criterion |
|---|---|
| 1 | ANC <1.5 to 1.0 ×10⁹/L |
| 2 | ANC <1.0 to 0.5 ×10⁹/L |
| 3 | ANC <0.5 to 0.1 ×10⁹/L |
| 4 | ANC <0.1 ×10⁹/L |

### Thrombocytopenia

| Grade | Criterion |
|---|---|
| 1 | Below LLN to 75 ×10⁹/L |
| 2 | <75 to 50 ×10⁹/L |
| 3 | <50 to 10 ×10⁹/L, or platelet transfusion indicated |
| 4 | <10 ×10⁹/L, or life-threatening consequences requiring urgent intervention |
| 5 | Death |

### Anaemia

| Grade | Criterion |
|---|---|
| 1 | Below LLN to 100 g/L (10.0 g/dL) |
| 2 | <100 to 80 g/L (<10.0 to 8.0 g/dL) |
| 3 | <80 g/L (<8.0 g/dL), or transfusion indicated |
| 4 | Life-threatening consequences; urgent intervention indicated |
| 5 | Death |

### White blood cell decreased

| Grade | Criterion |
|---|---|
| 1 | Below LLN to 3.0 ×10⁹/L |
| 2 | <3.0 to 2.0 ×10⁹/L |
| 3 | <2.0 to 1.0 ×10⁹/L |
| 4 | <1.0 ×10⁹/L |

### Lymphopenia

| Grade | Criterion |
|---|---|
| 1 | Present |
| 2–4 | Not defined in CTCAE v6.0 for this term |

### Fever

| Grade | Criterion |
|---|---|
| 1 | 38.0 to 39.0°C |
| 2 | >39.0 to 40.0°C |
| 3 | >40.0°C for 24 hours or less |
| 4 | >40.0°C for more than 24 hours |
| 5 | Death |

### Febrile neutropenia

| Grade | Criterion |
|---|---|
| 3 | ANC <1.0 ×10⁹/L with a single temperature >38.3°C, or temperature ≥38.0°C sustained for more than 1 hour |
| 4 | Life-threatening consequences; urgent intervention indicated |
| 5 | Death |

## Material v5.0 to v6.0 changes displayed in the app

### ANC

- v5.0 Grade 4: ANC <0.5 ×10⁹/L.
- v6.0 Grade 4: ANC <0.1 ×10⁹/L.
- v6.0 introduces revised bands across Grades 1–3.

### Platelets

- v5.0 Grade 3: <50 to 25 ×10⁹/L.
- v5.0 Grade 4: <25 ×10⁹/L.
- v6.0 Grade 3: <50 to 10 ×10⁹/L or transfusion indicated.
- v6.0 Grade 4: <10 ×10⁹/L or life-threatening consequences requiring urgent intervention.

### Lymphopenia

- v5.0 used numeric Grade 1–4 lymphocyte bands.
- v6.0 records lymphopenia as Grade 1 “present” and does not define Grades 2–4 for that term.

## Calculation limitations

- A value-based grade is calculated only when numeric criteria are sufficient.
- Local LLN is still required to distinguish Grade 1 from no event for anaemia, platelets and WBC at higher values.
- Platelet transfusion, red-cell transfusion and life-threatening consequences may assign a higher grade than the laboratory value alone.
- Temperature >40.0°C requires duration to distinguish Grade 3 from Grade 4.
- Febrile neutropenia requires both ANC and temperature/time criteria and remains a separate CTCAE term.
