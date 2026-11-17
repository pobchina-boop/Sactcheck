# Applying the v0.84.58 review package

This is a cumulative update from v0.84.57, commit `0eba2249a65dce9bcdf6be1b2115869b9563cd38`. It contains all ten new suites and five retrospective audits in one package. It is not a complete standalone repository.

1. Extract the ZIP. Keep your existing repository and any unrelated local work backed up.
2. Copy the **contents of UPDATE** into the existing SACTCheck repository root. Accept replacement of matching files. Do not place the UPDATE folder itself inside the repository. No tracked files need deletion.
3. Check that `package.json` and `data/app-release.json` show 0.84.58. Review `git status` and the included file manifest.
4. Use a complete checkout retaining historical Git objects for the unchanged full checks. `npm run test:ci` now stops early with an explicit blocker when historical objects are unavailable. The included manual-validation workflow can run browser and regression jobs on a suitable runner; it has not been dispatched.
5. Use `COMMIT_MESSAGE.txt` for the title/body when you choose to commit. No commit, push, PR, Actions dispatch or deployment has been performed by this task. A push to main may trigger the repository's existing deployment workflow.

Read `REVIEW_REPORT.md` before use. The focused and document checks pass, but full historical regression/site validation, browser/device testing and independent clinical/pharmacy approval remain outstanding. Clinical-use authorisation remains false. Example contact numbers need local replacement before patient use.

The ZIP's MANIFEST.json hashes every UPDATE file. The external .sha256 file verifies the ZIP itself. Raw successful, failed, blocked and interrupted logs are included under `validation/gu-v08458/software/`.
