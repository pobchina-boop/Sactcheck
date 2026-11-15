# SACTCheck v0.84.55 — consent, loading and search repair

This manual review package restores the general consent risk checklists and reduces catalogue-loading work. It includes the previously delivered v0.84.53 and v0.84.54 changes. It adds no new regimen suites or clinical threshold audits; the next prostate five remain queued.

## Consent changes

All 279 existing authored consent forms now place the applicable NCCP treatment-type checklist before the existing agent-specific risks. The published NCCP medical oncology consent form was checked on 15 November 2026 against the previously supplied June 2026 draft. The shared content includes 19 chemotherapy, 12 immunotherapy, 11 targeted-therapy and 8 endocrine checklist items. Combination treatments receive all applicable modules. These are discussion checklists: relevance, probability and severity still need individual explanation.

Additional immune-risk prompts cover neurological and eye problems, pancreatitis, type 1 diabetes/ketoacidosis, severe skin reactions, immune blood disorders, delayed or persistent effects, treatment with immunosuppression or hormone replacement, and potentially fatal reactions. Current EMA Keytruda product information supports these general discussion prompts; the selected medicine's own product information remains authoritative. No pooled frequency estimates were introduced.

The existing clinical body text and agent-specific content are retained. The completed PDFs use normal page flow: 210 forms have two pages and 69 have three pages. All 279 HTML sources and 558 published/compatibility PDF copies are covered by source-content, text, page-bound, font and checksum checks. The complete forms remain SACTCheck discussion aids pending independent clinical/pharmacy review, not approved NCCP forms.

## Loading and search changes

The 377 unchanged protocol records are also provided in one validated gzip catalogue (2,541,988 bytes), replacing 377 individual protocol payload requests on the supported fast path. The protocol index and other application assets still load separately. Hash, size, schema, identifiers and source-path checks protect the bundle. Unsupported browsers or a failed bundle fall back to the existing individual-file loader.

The cache now coalesces simultaneous requests, returns successful network responses without waiting for cache writes, and no longer automatically prewarms every protocol at startup. Search retains text entered before the catalogue is ready, shows loading/failure status, and applies that text when loading completes. Redundant fuzzy searches and card decoration were removed. These are measured payload/request reductions; no laptop/browser elapsed-time improvement has been measured here.

## Baseline and limits

The verified remote v0.84.54 is `534fcc4a802e4978c100f78df8b874325d4b0a1a`. All 866 payload files exactly match the delivered v0.84.54 package; the remote has an additional package-manifest file. The working checkout remains at the pinned v0.84.52 base with the cumulative v0.84.53–55 overlay. No commit, push or deployment was performed.

Clinical protocol JSON, assessment thresholds, patient knowledge, monitoring, handbooks, anatomical illustrations, three-page packs, wallet cards and QR assets are unchanged from the prepared v0.84.54 baseline. Historical clinical/source audit records remain frozen. The v0.84.54 source-clarification blocker for 00493 remains unresolved.

Validation evidence is in `validation/usability-consent-v08455/`. Repository checks were run in documented resumed stages after correcting a generated stylesheet-order mismatch, an obsolete loader-version assertion and a file-count mismatch in the new provenance helper. The final validation report records the exact results. Chromium failed before navigation with `socket() failed: Operation not permitted`; desktop/mobile interactions, real-device printing and deployed download behavior remain unverified. Node 24.22.1 was available locally; CI specifies Node 20.

Next new clinical contexts remain 00101, 00257, 00313, 00546 and 00203/prostate; 00588/prostate remains later work. This shared repair must not be counted as the next 5+5 clinical batch or as independent clinical approval.

A checksum-verified recovery snapshot was made before changes. It is on the same cloud filesystem; no independent offline copy was made.
