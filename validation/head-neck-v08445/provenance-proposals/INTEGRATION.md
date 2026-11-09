# Proposed v0.84.45 provenance bridge

This proposal does not record or approve current assets. The integrating agent must review the final diff, sources, clinical cases, PDF/QR checks and browser screenshots before recording final hashes.

## Fixed baseline and scope

- Exact Git44 commit: `a4575d67a985c97a1dfa545813a8c1a25b2ed5a2`.
- Exact tree: `917b15594ef865cb85c7178d5252813311bbd383`.
- Ten exact clinical protocol paths, 19 exact clinical patient routes, six new routes and 234 total shared-presentation routes. Route membership is derived from the immutable Git44 v43 inventory plus six explicit additions, and both sorted route sets are pinned by SHA-256.
- All before blob IDs and sizes are checked against `git ls-tree` for Git44; all recorded before SHA-256 values are subsequently verified from actual Git blob bodies.
- The helper never obtains an expected after hash from a current file. Current bytes must match an explicit recorded transition. An unchanged asset must match its Git44 blob exactly.
- Every existing protected member and every current member of `patient`, `docs/patient`, `protocols`, `data`, `assets/patient` and `js` is checked. New assets inside an otherwise permitted route cannot evade membership checks.
- Historical migration, scope and baseline-manifest records remain byte-identical to Git44. Clinical JSON outside the ten exact protocols, patient-source JSON outside the19clinical routes, detailed anatomy artwork and unrelated wallet/QR/consent-form assets are excluded from migration.

## Files to integrate

| Proposal | Destination |
|---|---|
| `retrospective-v08445.cjs` | `tests/helpers/retrospective-v08445.cjs` |
| `patient-design-migration-v08445.test.cjs` | `tests/patient-design-migration-v08445.test.cjs` |
| `draft-migration-v08445.cjs` | Optional: `tools/draft-migration-v08445.cjs` |
| `integration/tests/helpers/retrospective-v08444.cjs` | `tests/helpers/retrospective-v08444.cjs` |
| `integration/tests/patient-design-migration-v08443.test.cjs` | `tests/patient-design-migration-v08443.test.cjs` |
| `integration/tests/patient-design-migration-v08444.test.cjs` | `tests/patient-design-migration-v08444.test.cjs` |
| `integration/tests/ui-asset-migration.test.cjs` | `tests/ui-asset-migration.test.cjs` |

No live shared helper/test has been changed by this proposal. Review the literal `SHARED_PATHS` list against the final intended diff before integrating; add a specific path only with an explained scope and appropriate tests. There is no generic permission for all tools, all assets, all protocols or all routes. A newly required head/neck detailed illustration needs an explicit exact-path decision; this proposal does not admit arbitrary artwork.

The v44 helper forwards validated hashes and byte counts to v45. Earlier helpers already chain into v44. The v43 and early UI union tests include the explicit v45 record in their exact changed/new-file inventory. Historic record creation, negative tests, old baseline hashes and source identity checks remain intact.

The historical v44 numeric/identity contract now compares its original source against **frozen Git44 patient JSON**, preserving every old numeric and anatomy assertion. It does not demand that deliberately source-corrected v45 data pretend to be v44. The new v45 inventory proves current patient and protocol bytes, and the independent current release clinical cases establish the corrected source behavior. Unaffected numeric data stays byte-exact through the v45 protected inventory. Bulk Git readers avoid spawning a separate process for each old patient source; a partial clone may still need to retrieve old Git objects.

## Recording and verification

1. Finish clinical and presentation work, source audit, browser QA and PDF/QR verification.
2. Review the exact modified/new file inventory and the literal allowlist. Do not change older v43/v44 hash records.
3. Run the draft tool with `--output validation/head-neck-v08445/reviewed-diff-draft.json`. It rejects paths outside the permitted scope, missing files and symbolic links, and writes only `candidate_requires_review`. It refuses to overwrite the actual approval record.
4. After reviewing the exact draft and associated evidence, the integrating agent may deliberately save it as `validation/head-neck-v08445/asset-migrations.json` with `status: recorded`. This final step is an assertion of completed review; do not automate it from a successful hash calculation alone.
5. Run the new v45 test without filters, then the updated v43/v44/UI tests and wider release checks. Missing records are failures, never skips. Run independent source cases against the actual integrated checkout, not merely proposals.

The final v45 test streams recorded baseline blobs, checks all current protected paths and validates the exact changed-file set. Negative fixtures cover wrong release/base/tree/scope, changed blob IDs and lengths, false new-file claims, forged before SHA-256, mutated after records, path traversal, unapproved drawings/wallets/protocols, and unrecorded new assets.

## Proposal validation so far

- Helper and four modified historical test/helper proposals pass syntax checks.
- Six v45 fixture groups pass against real Git44 objects, including deliberate tampering and membership rejection.
- The seventh test correctly fails because a final reviewed `asset-migrations.json` does not yet exist. This proposal is therefore **not a passing release gate**, and no current migration has been represented as approved.
- The complete historic-numeric test remains in the proposed v44 test and must be rerun after integration; its frozen reader preserves the original assertion scope.
