# SACTCheck v0.84.56 — prostate 5 + 5

This manual review update adds five full service contexts on existing NCCP protocols, with five repeat source audits. It applies over the verified v0.84.55 commit `8fea74b7b5c8daf0a2c4101cdb96b50265c368d7`. It introduces zero new protocols and leaves the catalogue at 377. There are now 247 registry codes and 284 authored patient routes. The registry has 276 bundle routes: five new routes plus the previously authored 00203/lung route now explicitly registered.

| New service context | Source | Main changes |
| --- | --- | --- |
| 00101 cabazitaxel + prednisolone | NCCP v8 | Component-specific toxicity, dose-history, liver, renal and interaction rules; superseded runtime overlay disabled for this audited profile; source-specific CTCAE v4.0 prompts; weekly first-cycle blood counts; complete patient suite. |
| 00257 radium-223 | NCCP v8 | First versus later injection blood-count gates, six-injection limit, treatment interactions and intervals, fracture/bone-health plan. |
| 00313 docetaxel 50 mg/m² every 14 days + prednisolone | NCCP v5 | Source-specific dose ladder, liver uncertainty, steroid premedication and monitoring. |
| 00546 docetaxel 75 mg/m² every 21 days + prednisolone | NCCP v4 | Replaces stale v3 source and link; corrects the regimen card to 21 days; preserves saved-ID compatibility. |
| 00203/prostate docetaxel 75 mg/m² every 21 days | NCCP v7 | Adds the prostate context while preserving breast/lung content and their indication-specific rules. |

The clinician assessment, workflow, evidence/knowledge, consent, monitoring, supportive care, portal, three-page guide, wallet card and complete handbook are linked for each context. All five consents are two pages; all risk text is retained. The four chemotherapy contexts include the general NCCP chemotherapy checklist followed by agent-specific risks. Radium-223 uses general consent counselling and radiopharmaceutical risks rather than an inappropriate chemotherapy module. These are SACTCheck discussion aids, not approved NCCP consent forms.

Five repeat audits cover 00103/00577 abiraterone, 00233 enzalutamide, 00574 apalutamide and 00693 darolutamide. Fresh official source bytes match the v0.84.51 snapshots; all 184 earlier boundary cases pass. Their existing patient suites and handbooks are retained unchanged. A narrow additional repair replaces copied source links in the five v0.84.54 knowledge entries.

## Evidence and limitations

The 169 new source-boundary cases pass, including missing injection-stage handling. PDF checks cover complete text, page bounds, typography, anatomical image retention, physical card size, decoded QR destinations, companion-content retention and identical download mirrors. Full handbooks have 19–20 pages. All five three-page packs and representative handbook/consent pages were visually inspected. This does not imply that every page has received independent editorial or clinical review.

All required software CI stages passed in documented resumed runs; 787 local HTTP checks passed. The machine-readable final software results are in `validation/prostate-v08456/software/final-validation.json`. Historical reports remain frozen; new executions and any repaired release-specific test expectations are recorded separately. The local runtime is Node 24.22.1; CI specifies Node 20.

Chromium aborted before navigation with `socket() failed: Operation not permitted`. Desktop/mobile interactions, actual iPhone/Safari and Android installation, camera scans, physical printing and live deployment remain unverified. The package is for review and manual application; nothing was committed, pushed or deployed here. Test success is not independent clinical approval. Consultant, oncology-pharmacy and patient/PPI review remain pending, and example contact numbers must be replaced before patient use.

Remaining prostate work includes 00588/prostate (olaparib). The existing 00493/Prostap6 source clarification remains unresolved. This batch does not establish whole-catalogue clinical validity or measured patient benefit.

