# Fresh independent-work preservation checks

The literal current `npm run test:ci` completed with exit 0 in 532.876 seconds in a fresh disposable copy. The current definition expands to 269 ordered leaf commands; because the literal `&&` chain completed, every command in that chain succeeded. This is not a reused historical result and not a per-command marker run.

- All 20 existing UI preservation cases passed, with zero failures/skips.
- All eight new colorectal-readiness cases passed separately, with zero failures/skips.
- All 798 retained v0.84.33 source-regression cases were freshly rerun and passed. They verify existing implementation/fixtures, not a new audit against current official NCCP documents.
- All 977 critical input hashes remained unchanged in both disposable copy and checkout. All 10,550 initially tracked checkout files were unchanged.
- All 7303 fresh built public files match the current source bytes, including stored patient PDFs. No built artefact is a substitute for deployed-asset verification.

Tested Node v24.22.1, npm 11.9.0 and Python 3.12.14. The workflows remain configured for Node 20; no Node20/nvm/fnm executable was available locally.

Required current clinical source access remains blocked. New clinical source-boundary validation and the ten requested current-source audits are **not complete**. This passing preservation run does not complete any clinical context, increment the colorectal count or establish deployment/live/mobile-device readiness.

Evidence: [summary](summary.json), [run and exact current definition](run.json), [literal CI log](repository-ci-log.txt), [new readiness log](readiness-tests-log.txt), [frozen input hashes](inputs-before.json), [post-run checks](inputs-after.json), [public byte comparison](public-artifact-comparison.json). Full Git history was seeded from the local checkout into the disposable copy without changing its working files; [seed evidence](git-seed.json). All generator writes stayed in that copy.
