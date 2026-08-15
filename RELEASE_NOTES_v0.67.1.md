# SACTCheck v0.67.1

## Release version synchronisation

This maintenance release fixes release identity drift between the cumulative SACTCheck application version and individual module implementation versions.

The public application now has one explicit cumulative release identity. The main header, footer and page metadata report v0.67.1. Individual modules may retain their own implementation version internally, but those values are no longer treated as the public SACTCheck release.

Active knowledge base, validation workspace and NCCP Change Tracker assets now receive a cumulative application cache key. This forces a fresh module load after deployment and reduces the chance that an older cached tracker or validation file makes the application appear to remain on an earlier release.

A central app release record and a focused regression test have been added. Future builds now fail the version consistency test if the public release identity, page metadata or active cache keys drift from the package release.

No clinical protocol rule, threshold, dose action, indication, organ function pathway, emetogenic classification or knowledge content is changed.
