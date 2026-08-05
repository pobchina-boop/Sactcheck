# v0.56.0 Regimen Information and Evidence Audit

## Coverage

- 24 drug profiles
- 18 source-linked evidence mappings
- All evidence mappings resolve to an existing SACTCheck protocol identifier
- All publication links use stable PubMed URLs
- Every record contains explicit review status and limitations
- Every published regimen card contains a Regimen info entry point
- The opened assessment engine contains the same Regimen info entry point

## Safety checks

- Evidence content is stored outside protocol JSON files.
- Evidence summaries cannot alter deterministic assessment findings.
- The official NCCP protocol remains visible and is described as the operational source.
- Unmapped regimens display an explicit empty state.
- AI-assisted draft text is marked pending clinical or pharmacy review.
- No full abstract, publication table or figure is reproduced.
