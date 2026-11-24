# Original v63 assertions: authenticated bounded replay

The accepted clinical checkpoint contains **650 author assertions = 347 mifamurtide/ifosfamide + 303 MAP/doxorubicin–cisplatin**, plus **197 independent assertions**. The earlier message describing358+292 was inaccurate; retained original records were not edited.

| Exact historical suite | Original clinical snapshot | Accepted product/CNS snapshot | Six-rule correction candidate |
|---|---:|---:|---:|
| Mifamurtide/ifosfamide |347 pass,0 fail|337 pass,10 fail|336 pass,11 fail|
| MAP/doxorubicin–cisplatin |303 pass,0 fail|303 pass,0 fail|303 pass,0 fail|
| Independent |197 pass,0 fail|191 pass,6 fail|191 pass,6 fail|

The correction introduces **no new clinical assertion failure**. Its one newly failed historical assertion is an exhaustive rule-coverage check: the original mifamurtide fixtures do not exercise the three newly appended context rules. The pre-existing00680 coverage failure additionally lists its two new context rules. The separate focused correction suite is needed to verify those new paths.

The eight earlier author failures demand the old NEURO_NOW rule ID from unlocalised grade-only fixtures. Accepted CNS semantics now require localisation and preserve current severe-event holds. Two earlier coverage failures predate the product/CNS additions. Six independent renal cases still expect an exact consultant_review component action despite missing product context; the already accepted product gate withholds treatment. These failures were present before this correction and remain preserved, not relabelled as passing tests.

Before-versus-after engine traces show the appended IE_ADMINISTRATION_DAY_REVIEW finding in treatment/restart cases with a missing or out-of-range cycle day. A mifamurtide demo call also gains the three new context findings. Three cycle-day observations replace/remove derived partial-domain summaries: a day-only input changes NO_RESTRICTION to CONTEXT_REQUIRED, and two independent restart fixtures replace their derived summary with the explicit clinical calendar finding. Every earlier authored clinical finding and every overall action/completeness result is unchanged. The JSON delta report contains every affected input, added finding and removed derived summary.

All original scripts execute byte-for-byte, with no fixture or expectation mapping. Three isolated stages retain raw results, logs and observation-only engine traces. Historical repository-byte assertions read explicitly staged authenticated original application protocol bytes; current runtime JS is copied unchanged, and actual current application files are separately hashed and checked unchanged. No application files were modified. No clinical or pharmacy approval is claimed.

Changed engine-observation calls: {"author-347": 35, "independent-197": 35}.
