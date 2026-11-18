# v0.84.60 deployment validation repair

Base: ee5f22c222afc35b6c220bbdd9f3c8a3041d6777. Apply only over batch 1 v0.84.60.

Correct the exact registry expectation for the six v59 GU and five v60 sarcoma additions and register their existing asset migrations with the architecture gate. Move runner-dependent environment expressions into steps in the optional manual workflow. Add a narrowly scoped authenticated repair overlay without modifying frozen clinical or asset migration evidence.

Passed locally: exact 272-route registry, missing/duplicate/unknown-route rejection, 33 recorded assets, baseline preservation, batch clinical tests (265 author,112 independent,173 retrospective), build, repository security and seven exact HTTP comparisons. Node v24.22.1 used; GitHub uses Node20. Workflow YAML parsing and manual-only trigger checked; not executed on GitHub here.

Full CI and architecture/site historical validation are BLOCKED by unavailable historical Git objects, with original errors retained. A bulk historical-object fetch did not complete successfully. An initial site validation was interrupted during historical access, then rerun with lazy fetch disabled to expose the missing-object failure. Browser/device/live acceptance was not run for this test/workflow-only repair. No clinical data, patient HTML or PDF changed. No commit, push or deployment performed.

After copying this repair to the repository root, commit and push; inspect the exact new GitHub Actions run. Keep later batches on hold until deployment is checked and their compatibility with this repair is reconciled. This package fixes identified defects; it is not evidence that all subsequent CI checks have passed.

## Follow-up after GitHub commit b07bb063e9652f3cf3cdb3b41af5063c469e9f07

GitHub run 44402099062 passed architecture, patient-guide and anatomy gates, then failed the system-health audit because its migration list ended at v57. This follow-up adds v58-v60 to the system-health audit and v59-v60 to the deployed-site validator. All three consumers now include the same available release sequence. The focused regression verifies 63 index/guide/passport assets across the 21 v58-v60 routes against continuous recorded migration hashes. No asset or clinical content is changed. Complete historical checks remain blocked locally as previously recorded; a successful full deployment is not claimed.

This cumulative second repair can be applied over v0.84.60 with or without the first repair. Commit summary: Complete v0.84.60 audit and deployment route registration.
