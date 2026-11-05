# Mobile fixes and blocked clinical batch

This is development-branch work based on main `0906fc73338de99a9b9ed65a12922691852652f2` (v0.84.33). It is **not a production release**. No new colorectal context or current-source retrospective is marked complete; clinical protocols, coverage counts and published patient/PDF assets are unchanged.

## Completed fixes

The personal-plan reminder now uses explicit dark text on its existing pale background. The computed minimum contrast increased from 1.091:1 to 10.928:1 without changing layout, anatomy or clinical content. A regression checks every affected reference route, both mobile/desktop widths, screen/print media and descendant text against a 4.5:1 minimum. It failed on the baseline defect and passes with the fix.

The historical browser test now follows the documented current architecture. Route 00568 deliberately replaced its personal calendar with a complete reference chronology in v0.83.1, and its audited evidence changed in v0.84.21. The test asserts the exact current chronology, maintenance medicines, safety warning, evidence statement and trial link, and rejects the retired controls/19.4% card. Dates, phase filtering, selected-day accessibility and clearing are still tested on supported calendar route 00310. No assertions are skipped or made optional.

`AGENTS.md` now records five-suite/five-retrospective scope verification, current NCCP provenance, threshold/component audits, anatomical content, three-page packs, wallet cards, QR destinations, complete handbooks, baseline comparisons and the required development-branch fallback when audits/checks are blocked.

## Capability checks and clinical scope

Git read access, Node/npm, Python, Chromium/Playwright, WeasyPrint, PyMuPDF, lxml, Pillow and QR generation/decoding tools are available; `pip check` passed. Git write access is verified by the final development-branch push. The current runtime still has restricted networking with no custom destination rules activated.

| Capability | Observed result |
| --- | --- |
| Official NCCP PDFs for all five proposed new contexts | HTTP 403; no source downloaded |
| Authenticated GitHub Actions API | Forbidden; authorization beyond the policy denial is unverified |
| `sactcheck.com` live release | HTTP 403; live version/assets unverified |
| Required source currentness audits | Blocked |
| Production deployment | Not attempted; development branch only |

The environment draft retains `api.github.com` and `sactcheck.com` and now adds `healthservice.hse.ie`. These are saved requirements, not active access. Apply the pending rules through environment settings before retrying source retrieval or release verification. No new token or secret was requested.

The current candidate inventory records 31/41 completed colorectal contexts. Its first five outstanding entries are **00212, 00214, 00215, 00244 and 00382**. This is a deterministic inventory-order proposal, not a ranked national catalogue. Several are already developed in other tumour contexts; the pending work is colorectal context completion. Their official source binaries are not retained locally, and current versions/currency cannot be established while retrieval is blocked.

There is no ordered five-item retrospective backlog in the repository. The proposed repeat-audit group is **00207, 00225, 00328, 00330 and 00331**. All were audited previously; missing progress metadata must not be described as absence of prior review. Their retained official PDFs match recorded hashes from 25 October 2026, which supports a historical comparison but not a new current-source pass.

See [source/access evidence](source-access.json), [scope and capability record](capabilities-and-scope.json), [backlog/provenance inventory](backlog-source-inventory.json), and the [historical threshold comparison](historical-retrospective-review.md). The latter records a retained-source 00328 component-hold discrepancy and 00330/00331 recovery/source-attribution questions. They require current official confirmation; no clinical rule was changed or safeguard relaxed.

## Validation

- Built-site browser checks passed: four reference/calendar journeys plus 328 contrast samples across all 41 affected routes, two widths and screen/print media. See [browser log](browser/built-run.txt) and [computed contrast results](browser/contrast-results.json).
- Software CI passed: all 266 current `test:ci` leaf commands and 798 existing-release source-based cases. This does not validate the blocked next batch. See [CI summary](ci/summary.json) and [full command results](ci/MOBILE_DEV-results.json).
- Fresh PDF/QR/full-handbook regressions passed: 71 companion PDFs, ten guide/card/reference/handbook bundles, 111 scoped PDFs, 40 QR checks, 1,878 retained reference-text blocks and seven handbook sections. See [PDF summary and limitations](pdf/README.md).
- Controlled fresh rendering of a representative guide before/after the CSS fix preserved all three pages with identical text, bounds, dimensions and raster output. See [controlled comparison](controlled-pdf-comparison.json).
- The all-111-PDF previous-release comparison found renderer font drift: 103 retain page counts, while eight reference/handbook PDFs repaginate (fresh Liberation/Noto versus publication Nimbus/DejaVu). Retained authored text and handbook sections pass, but fresh output is not claimed to match the publication pixel-for-pixel or byte-for-byte. See the [full comparison](pdf/README.md) and [representative guide comparison](previous-release-pdf-comparison.json). All 3,366 published PDFs, 2,777 HTML files and 241 images remain unchanged; generated drift outputs were not substituted.

Current-source audits for the requested five new contexts and five retrospectives remain **unrun/blocked**, regardless of passing existing software regressions. Real iOS/Android home-screen installation, camera scanning and physical printing remain unverified.

## Review material

- Mobile: [before](review/00555-mobile-before.png) / [after](review/00555-mobile-after.png).
- Desktop: [before](review/00555-desktop-before.png) / [after](review/00555-desktop-after.png).
- [Detailed anatomy page rendering](review/00555-anatomy-page.png).
- Preserved [three-page guide](../../patient/00555/guide.pdf), [front/back wallet-card sheet](../../patient/00555/sactcard.pdf), [complete printable handbook](../../patient/00555/handbook.pdf), and [full treatment reference](../../patient/00555/knowledge.html).

The review documents illustrate preserved v0.84.33 content, not completed new-batch patient packs. Do not merge this branch into main or label it a production release while required audits/checks remain blocked.
