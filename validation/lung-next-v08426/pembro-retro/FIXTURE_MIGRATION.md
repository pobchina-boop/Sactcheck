# Integration and regression migration

Copy the two full proposal JSON files to the `source_path` in proposed/integration-manifest.json; consume authoring.json through the release builder. Run `node validation/lung-next-v08426/pembro-retro/source-cases.cjs --integrated`.

The old v22 source cases currently represent immune toxicity using only raw lab values. After this correction, those bare values intentionally produce consultant review. To retain their original intended test meaning, add:

- `pembro_immune_hepatitis_assessed: true` to fixtures for immune hepatitis (AST/ALT, bilirubin and liver-metastasis rise rules).
- `pembro_immune_nephritis_assessed: true` to fixtures for immune nephritis (creatinine thresholds), including stable renal impairment plus an independent immune injury.

Do not add these values globally to unrelated fixtures, blank/demo inputs, or raw-laboratory review tests. Our local `t` helper applies these values only to inherited cases with the corresponding lab/context; its `raw=true` option bypasses migration for explicit attribution tests. The report serialises the actual augmented input, making the clinical assumption visible. Keep all original expected threshold boundaries, endocrine exceptions, dose-renderer assertions and non-lung cases unchanged.

The same principle applies to any older independent regression test that expects immune permanent-stop directly from raw labs: either add explicit clinically assessed immune attribution where that was its intent, or change the expected action to consultant_review if testing unexplained labs. Do not weaken clinical thresholds or restore automatic attribution to satisfy historical tests.

New input names and original rule IDs remain stable. Added rule IDs are LIVER_ATTRIBUTION_REVIEW and RENAL_ATTRIBUTION_REVIEW. Original combined liver-rise and creatinine field aliases are retained. Each protocol now has 61 inputs and 50 rules; all optional, blank demonstration values for new inputs. No shared file was edited by this bounded audit.
