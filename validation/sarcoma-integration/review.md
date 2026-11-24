# Sarcoma integration review, 24 November 2026

The candidate adds the 15 routes recorded in asset-migrations.json to AstraZeneca review commit b373bf45522a1fec556eabf657daf3f72ab485c4. Nine sarcoma routes were already on main at f3b923b247b5663b2bd90b2ffb352fccc5a347ea (v0.84.62). The candidate retains the existing default breast routes for 00205 and 00228 and adds separate sarcoma and liposarcoma routes. The historical pazopanib 00445 PDF URL returned HTTP 404 on 24 November. This candidate omits that regimen.

## Checks on the combined candidate

| Check | Result |
| --- | --- |
| Catalogue and source JSON | All 378 bundled protocols match their source files. All 361 records outside the 17 named updates equal their AstraZeneca-branch counterparts. The 17 include two prior ifosfamide corrections. |
| AstraZeneca patient, protocol and media assets | All 623 files tested match the reviewed Git blobs. Eight shared data collections retain their checked AstraZeneca entries. |
| Registration and publication | All 15 additions and all prior routes register. There are 328 canonical routes for 292 codes. Build and deployable-site integrity checks passed. |
| Patient documents | All 165 PDF downloads match their mirrors. The 15 handbooks total 375 pages. All 60 checked QR images in the portals, reference pages, guides and wallet cards decode to their intended URLs. |
| Selected AstraZeneca functions | All 306 olaparib source cases, six olaparib indication routes, 101 durvalumab checks and the capivasertib–fulvestrant planner check passed. |
| Saved sarcoma replay commands | The v0.84.62, .63 and .64 batch commands pass on the combined candidate. The saved evidence retains adjudicated historical case mismatches, including the trabectedin premedication severity expectations. The original counts remain available in the batch reports. |
| NCCP source retrieval | The 15 source PDFs were retrieved and fingerprinted. See nccp-source-receipts.json. This verifies the files retrieved and leaves the recorded source-table, clinical and pharmacy review statuses in force. |

## Release blockers

The complete test:ci command stops at the olaparib-era assertion comparing every other antiemetic record with its frozen baseline. The 00205 change adds the sarcoma protocol ID to that record. Its risk level, script and explanatory fields are preserved. Additional older olaparib and Enhertu tests assume the former patient count, unrelated support records or complete catalogue files remain fixed. The dedicated checks above pass within their stated scope. The original release assertions remain enabled.

Local validation used Node 24.22.3. The GitHub workflow specifies Node 20. Chromium could not open a socket in the validation environment, so desktop and mobile interaction, screenshots, and the full clinical release remain unverified. The review branch does not trigger a Pages deployment.
