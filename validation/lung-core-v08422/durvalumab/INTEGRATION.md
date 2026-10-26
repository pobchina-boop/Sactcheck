# Integration handoff

Owned files are confined to `validation/lung-core-v08422/durvalumab/`. No shared/live files were edited by this audit agent.

1. Copy the two complete files in `proposed/` to the exact `source_path` values in `proposed/integration-manifest.json`. Preserve protocol IDs and filenames.
2. Merge `authoring.json.regimens[00576]` and `[00655]` into the v0.84.22 service-authoring record and run the root generic builder. Patient records include phase arrays, daygroups covering every reference-cycle day, bodymaps, longitudinal monitoring, support, consent/teachback and date-free chronology. No patient trial metrics.
3. Both selectors are lung/stageIII-consolidation/NSCLC/PD-L1≥1; neither belongs in the breast selector. Retain the exact source-specific interval and caps. Existing00655treatment-relationship content must still show concurrentCRT first, then durvalumab. Do not generate a concurrent chemotherapy+durvalumab band.
4. Support plan `durvalumab_consolidation` is minimal emetic risk, empty routine medicine list, no routine premedication. Keep the precedingCRT supportive plan separate.
5. Update the historical00655AST6×ULN assertion in `tests/ici-safety-v027.test.js` to hold. Other canonical basic findings (PNEUMONITIS_G2, endocrine status) are retained where practical. The audit source-case harness is the authoritative expanded boundary set.
6. Run `node validation/lung-core-v08422/durvalumab/source-cases.cjs --integrated`; inspect `integrated-results.json`. Root owns full regression, patient/PDF renders, QR/bounds checks and release packaging.

Generator scripts write only bounded proposals/authoring. They use the current existing live JSON as a structural base, so the checked-in proposed JSONs and manifest are the concrete reviewable integration files.

Source evidence: `sources.json`; PDF byte hashes and downloaded originals in `research/`; critical merged-cell images `research/00576-table3.png`, `00655-table3.png`, `00655-table4.png`.

Source classifications: Nccp rules carry URL,page,section and checkeddate. Pregnancy/breastfeeding and acute metabolic-risk information carry explicit EMA attribution. Proposalmetadata keeps consultant_reviewed,oncology_pharmacy_reviewed,clinical_use_authorised=false.
