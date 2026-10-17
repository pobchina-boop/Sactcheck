SACTCheck v0.83.8 runtime release/cache correction
Prepared 17 October 2026
Baseline: feaf3f9abb07f53a9eee4227abbedfc775e8120e

CAUSE
The published index, package metadata and app-release.json said 0.83.8, but
js/sactcheck-release.js still set the runtime global to 0.83.7. UI modules used
that global to replace the header label, and the data loader selected the 0.83.7
CacheStorage namespace. Successful deployment and the old version tests did not
detect the conflicting startup constant. This affected local and deployed copies.

CORRECTION
1. Set the actual startup release to 0.83.8.
2. Refresh the release/runtime script URLs so the corrected scripts are fetched.
3. Include the active release in protocol/data JSON request URLs as well as the
   CacheStorage name. A new release cache must not be filled from an older HTTP
   cache entry with the same unversioned URL.
4. Execute the startup script in the version-consistency regression test. Test a
   stale-cache upgrade, old-cache cleanup and subsequent current-release reuse.
5. Execute the copied startup script during deployable-site validation and reject
   any runtime/package version mismatch.

APPLY
Apply this small ZIP over the already committed v0.83.8 repository at the root.
Replace the five existing files and add this review record. No deletion is needed.
The release stays v0.83.8. Run npm run test:ci, then commit and push as usual.
After deployment, open https://sactcheck.com/?release=0838-cache-fix1 to request a
fresh homepage. The runtime version should stay at v0.83.8 after the page loads.
For local Live Server, reload the page after applying these files.

VERIFICATION
The existing version test now executes the real startup global rather than
checking only labels. The cache regression seeds stale unversioned JSON and
verifies that the first upgraded request obtains current-release data and the
second request reuses only that current-release result.
Full CI and deployable-site checks are run before packaging.
Interactive browser QA was not run; this correction is verified by executable
startup/cache tests, source comparison and production-artifact validation.

COMMIT SUMMARY
Fix v0.83.8 startup version and stale protocol cache

COMMIT DESCRIPTION
Align the runtime release with v0.83.8 and refresh startup script URLs. Scope
protocol and data JSON requests by release so an upgrade cannot reuse older HTTP
cache entries. Add executable startup/cache regression tests and reject runtime
version mismatches in the deployed-site validation gate.
