# SACTCheck v0.84.46 — five new services and five retrospective audits

Prepared as a manual update over v0.84.45, commit
`628100a672ec51ccf25c7d27933fa9b43ac8f935`. No commit, push or deployment was performed.
This is a software/source reconciliation package, not independent clinical or
oncology-pharmacy authorisation. Existing clinical approval flags remain false.

## Scope

| NCCP protocol | New head-and-neck service | Retrospective service |
|---|---|---|
| 00261 | Carboplatin every 3 weeks with radiotherapy | Breast carboplatin |
| 00483 | Nivolumab every 2 weeks | Lung nivolumab every 2 weeks |
| 00484 | Nivolumab every 4 weeks | Lung nivolumab every 4 weeks |
| 00455 | Pembrolizumab every 3 weeks | Lung pembrolizumab every 3 weeks |
| 00558 | Pembrolizumab every 6 weeks | Lung pembrolizumab every 6 weeks |

These are five new indication-specific service suites for existing protocols,
not five new catalogue entries. Four existing nivolumab melanoma routes receive
the consequences of shared monitoring/history corrections. There are 14 affected
patient routes, 239 authored routes overall and 377 catalogue protocols;
haematology remains hidden. Unrelated patient routes and anatomical source artwork
remain protected by exact baseline comparisons.

## Findings carried through the suite

- Nivolumab retains previous permanent-discontinuation decisions independently
  of the current symptom grade, with explicit restart-history and review gates.
- HNSCC eligibility and platinum progression history have explicit checks;
  uncertain interval boundaries require review rather than an invented dose or
  definitive treatment clearance.
- Four-weekly nivolumab thyroid testing is corrected to before each cycle;
  two-weekly nivolumab retains its distinct monthly source schedule.
- Carboplatin HNSCC indication/context conflicts, AUC, cycle and concurrent-RT
  confirmations can no longer bypass the context-specific checks.
- Current pembrolizumab rules were confirmed against retrieved NCCP sources.
  Patient consent duplication was removed without removing unique risks.
- The dedicated NCIS carboplatin AUC >=4 supportive-care row is retained with
  individual prescription boundaries and no invented medicine duration.

The full clinical audit, source versions, table citations, exact hashes and
independently specified boundary cases are in `clinical/audit.md` and
`clinical/clinical-migration.json`. Current HPRA carboplatin and NCIS supportive
sources are documented separately in `retrospective/sources.json`; not every
historical supplemental SmPC was freshly retrieved.

## Consistency and retained outputs

| Surface | Coverage and evidence |
|---|---|
| Assessment | Five source audits; three protocol files corrected; 27 new rules exercised |
| Clinician knowledge and evidence | Five new context rows; 14 current monitoring matrices; actual renderer tests |
| Consent | Context-specific schedules, material risks and review boundaries retained |
| Support and treatment journey | Current authored phase plans, monitoring and dedicated carboplatin antiemetics aligned |
| Portal and Oncowiki | Three treatment essentials first, then detailed information and patient record |
| Three-page pack and wallet | 14 current packs; detailed anatomical anchors; front/back 85.6 x 54 mm cards; exact QR destinations |
| Full handbook | 14 consolidated books with five chapter openers, contents, folios and all unique companion instructions |
| Downloads | 140 distinct PDFs / 815 pages, 280 verified patient/docs copies |

Book consolidation accounts for every journey/logistics/applicable access-care
source. The retained-content inventory records 622 exact clinical units and 42
explicit UI/navigation/metadata exclusions, with no missing clinical units.
Print spacing changes retain font sizes, artwork, anatomy geometry and wallet
dimensions. PDF page counts are document totals, not the length of one handbook.

`consistency-matrix.json` records the checks and remaining limits for each of the
14 affected routes. Authoring proposal manifests are retained stage evidence;
this release report and the final regression/PDF records describe integration.

## Validation and practical limits

- Fresh clinical scenarios: 386/386 checks, including 380 clinical cases and six
  structural/governance/monitoring checks.
- Retrospective patient checks: 119 passed across nine existing profiles.
- Cross-service consistency: 593 checks across 14 affected routes.
- Historical clinical replays: 443 nivolumab and 302 carboplatin cases retained;
  explicit compatibility amendments are recorded without rewriting old reports.
- Exact migration: 502 intended protected changes; 10,284 baseline members and
  91 historical evidence files checked. The migration record pins before and
  after bytes and cannot approve unknown files or unrelated anatomical changes.
- PDF verification includes page bounds, complete source text, card dimensions,
  anatomy preservation, published mirrors, and QR decoding from PNG/PDF pixels.
- The full uninterrupted local `npm run test:ci` passed with exit code 0.
  `regression-final.json` retains the actual command, Node runtime, logs and
  earlier failures/fixes. The separate handbook chronology test passed all four
  tests. These local results do not claim a GitHub Actions or deployment pass.

Desktop browser observations and exact limits are in `browser-review.json`.
The native Chromium suite was blocked at launch; narrow mobile automated journeys
and real-device installation/camera/printing remain unverified. An earlier local
v46 data cache limited the final clinician-knowledge visual retest; final served
JSON and the actual renderer were checked independently. Do not label those
missing browser checks as passes.

The package is not deployed. New canonical QR URLs cannot be verified as this
release until the manual commit is deployed. Example contact numbers remain
clearly labelled and need replacement by the treating service before patient use.
The existing local recovery snapshot is not an independently stored or offline
backup; no new protected remote backup is claimed.

Use `INSTALL.txt` and `COMMIT.txt` for manual application and GitHub text. The
ZIP's outer overlay manifest verifies every delivered file and the expected base.
