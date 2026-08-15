# SACTCheck v0.67.1 validation report

## Scope

Release identity and cache synchronisation only.

## Findings

The v0.67.0 source correctly reported v0.67.0 in the main application, but active modules retained their historical implementation versions. The NCCP Change Tracker, for example, retained its v0.62.1 module identity and its own cache key. This separation is technically valid but can be mistaken for the overall SACTCheck release and can also allow an older browser cached module to persist after a later application release.

v0.67.1 separates the cumulative application release from module implementation versions and adds a cumulative cache key to all three major active modules.

## Validation results

1. Package release is v0.67.1.
2. Main page title, header, footer and release metadata report v0.67.1.
3. A central application release record reports v0.67.1.
4. The knowledge base retains its v0.67.0 content module identity while loading with the v0.67.1 application cache key.
5. The clinical validation workspace retains its v0.67.0 module identity while loading with the v0.67.1 application cache key.
6. The NCCP Change Tracker retains its v0.62.1 module identity while exposing the cumulative app release separately and loading with the v0.67.1 application cache key.
7. The focused v0.67.1 version consistency regression test passed.
8. The complete cumulative test suite passed.
9. Repository security validation passed across 1057 text files.
10. Static site build copied all 382 protocol JSON files.
11. Deployable site validation passed.
12. All clinical protocol JSON files are byte identical to the v0.67.0 release.
