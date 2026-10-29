# Historical v23 test migration

Actual integrated canonical metadata inspected29 October2026:

- source_checked_date:2026-10-29; sactcheck_encoding_version/full_suite_release:0.84.26.
- gfr_ml_min:exact_continuous, exact_value_required:true; NCCPsourceURL.
- etoposide_crcl_exact_ml_min:source_threshold_numeric, exact_value_required:false; NCCPsourceURL. Boundaries and aliases unchanged.
- Original81 rules: original NCCPsourceURL, checked_date2026-10-29.
- Three added rules: EMA product-information URL, checked_date2026-10-29; myocardial suspicion p14, pericardial suspicion p15, myositis taper failure p14.

`historical-v23-metadata-migration.patch` changes only historical metadata expectations. It selects v26 values only when --integrated reads the explicit0.84.26 canonical encoding. Default proposed-mode historical fixtures retain their exact v23 expectations. Source provenance is per-rule exact: this does NOT allow every rule to claim either arbitrary source. All273 original clinical expectations remain intact.

## Endpoint count: keep the historical assertion at two

The old source-cases.cjs defines A by reading its own `__dirname/authoring.json`, even in --integrated mode. That file is the historical v23 authoring with two endpoints. Changing its assertion to three would be incorrect. The historical assertion and2018/2021 analysis checks must remain unchanged unless root deliberately changes the authoring loader.

The new v26 source-cases.cjs separately reads v26authoring and requires three endpoints, with explicit assertions on absent long-term control data and18/26 rollover. All297 integrated checks pass. Thus leave the old test's endpoints.length===2 in place; new v26 test validates the third endpoint. No clinical threshold test needs weakening.

If root intentionally wants the old integrated test to read current authoring, replace its A source path conditionally with `validation/lung-next-v08426/atezo-combo-retro/authoring.json` only for explicit v26integrated mode, then assert three only in that mode. This alternative is unnecessary and not included in the patch.
