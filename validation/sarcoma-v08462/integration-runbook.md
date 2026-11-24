# v0.84.62 integration and preservation

Start from the delivered v61 working state:21,755 files; manifest SHA cfb11d986f28b5b130d0fcd08f9a14fa027fbda38099979a290dc245cf53563b; migration SHA528f37878559fa616565f0dfd53728ebc870a56c0392d6cdd760270908acead5. Actual Git anchor remains c01f1a2b236afced0c3ebfdb6b6ff864e58e7d4c (v59). Reconstruct the baseline from its authenticated preceding migration, never current files alone.

Scope: five new patient routes00374,00228/liposarcoma,00205/sarcoma,00462,00554; separate clinical/KB corrections00391/00392 with their patient assets protected. Expected totals377 protocols,278 registered codes,311 bundle routes,319 visual routes. Exact national ID aliases are separate from patient context selection.

The 675 author / 154 independent replay wrappers preserve original scripts/results and authenticate the explicit integration metadata / 00554 grading transition. A separate source-pinned 00374 phase transition retains those original outputs, accepts only the enumerated added eligibility/premedication findings, and replays an additional 27 author assertions plus 18 independent assertions over 15 distinct inputs. The eribulin preservation tests see immutable original clinical inputs in a shadow root with the current engine; no current-to-current substitute. The ifosfamide wrapper replays347 original cases with114 cases on the current pair and the remaining cases on five frozen external candidates; it separately replays26 current-pair CNS/UI cases. Future candidates are not claimed integrated here. The retrospective classification gate requires81 passes and exactly the unchanged00719-13 deferred cue/adjudication; it does not hide the raw failed expectation.

Package.json is frozen before PDF generation. All five overview wallet/reference/handbook links are declared before the first HTML freeze; placeholders are prohibited. Validate compact monitoring rows and complete reference cards separately. Preserve exact breast/old-pair assets, complete generic/agent consent risks and source-specific grading.

After final document generation, run the existing scoped final publication on the five routes, then require zero pending publication changes. The book builder emits knowledge-print browser HTML after rendering PDFs; those derived outputs need the final publication pass too. Preserve exact before/after output evidence when applying this step after document freeze. Then run the current scoped command, global design check and static build with fresh bounded logs. Known historical/site-security/browser failures remain recorded; do not repeat them in the unchanged environment. On a capable full checkout, run history availability before full CI and retain all original assertions.

```bash
GIT_NO_LAZY_FETCH=1 GIT_TERMINAL_PROMPT=0 python3 tools/run-bounded-check.py --seconds 180 --output validation/sarcoma-v08462/logs/scoped-final -- npm run test:sarcoma-v08462
GIT_NO_LAZY_FETCH=1 GIT_TERMINAL_PROMPT=0 python3 tools/run-bounded-check.py --seconds 120 --output validation/sarcoma-v08462/logs/pages-final -- npm run build:pages
```

Finish every report, release note and in-repository log before migration. Move pure transient rendering stages intact to external evidence only after checking dependencies and recording exact hashes/paths; retain required verifier fixtures. Then:

```bash
node tools/record-sarcoma-migration-v08462.cjs
GIT_NO_LAZY_FETCH=1 GIT_TERMINAL_PROMPT=0 python3 tools/run-bounded-check.py --seconds 120 --output ../sarcoma62-evidence/preservation-final -- npm run test:sarcoma-preservation-v08462
```

Final preservation/HTTP/archive acceptance logs belong outside the frozen source tree. ZIP application files at repository-relative roots, supply separate evidence/commit instructions, persist and post each completed batch immediately, then continue. No automatic commit/push/deployment is authorised.
