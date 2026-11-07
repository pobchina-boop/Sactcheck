# Install SACTCheck v0.84.44

This is the complete cumulative replacement for the previously prepared v0.84.43 ZIP. It includes that UI and visual update plus the later handbook, wording, molecular illustration, named-test and pagination instructions. **Install it once over v0.84.42; v0.84.43 does not need to be installed or pushed first.**

## Baseline

- Repository: `pobchina-boop/Sactcheck`
- Baseline application: `0.84.42`
- Baseline main commit: `67aaa3579794278074478b3f6cce4e57c803e4db`
- Baseline tree: `ba65db9ba843ef3d191f7acd5af2b195f453e229`
- Incoming application and patient publication: `0.84.44`
- Clinical decision-rule release: retained at `0.84.42`

The package contains the full source and generated patient assets. Git internals, temporary render files, caches and disposable site builds are excluded. Historical source audits and preservation evidence are included deliberately.

## Apply the complete ZIP

1. Keep a copy of the current checkout and any local edits. Confirm that its starting point is the baseline above. If there are later changes, reconcile them before replacing files.
2. Extract `SACTCheck-v0.84.44-complete-update.zip` to a separate directory.
3. Open its `SACTCheck-v08444` folder. Copy **the contents of that folder** into the existing repository root, replacing matching files. The destination should contain `index.html`, `package.json`, `patient`, `docs`, `assets`, `tools` and `tests` directly. Do not put the new folder inside the old application folder.
4. Preserve the destination repository's `.git` directory. The ZIP does not contain or replace it. The historical provenance checks need the existing full Git history; the source ZIP alone is not a replacement for that history.
5. Inspect the diff and use `COMMIT_MESSAGE_v08444.txt` for the proposed GitHub summary and description. Run `npm run test:ci` in the intended deployment environment before publishing. The release's own local validation details and explicit limits are in `validation/patient-design-v08444/release-validation.json`.

No patient PDF regeneration is needed to use the delivered update. The generated canonical PDFs and their compatibility download copies are included.

## If using the smaller ZIP volumes

The numbered `complete-update-part-N-of-M.zip` files are ordinary ZIP archives containing disjoint files under the same `SACTCheck-v08444` root. **Download every part and extract all of them into the same empty directory.** Their union is exactly the complete update. Do not install just one part, and do not concatenate the ZIP files.

The package verification report checks every file's size and SHA-256, verifies that the volumes have no overlapping members, and confirms that their union matches the full ZIP. The supplied `SACTCheck-v0.84.44-SHA256SUMS.txt` identifies the exact delivery archives.

## What remains a separate decision

This delivery does not perform a commit, push, merge, pull request or deployment. It does not add lanreotide, depot octreotide or short-acting octreotide as new regimens. Those remain separate clinical authoring and validation items.

The local software and document checks do not substitute for independent clinical, oncology-pharmacy or patient review. Current browser and device limitations are recorded alongside the results; no production comparison or successful deployment is implied.
