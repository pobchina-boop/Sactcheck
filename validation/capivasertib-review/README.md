# Capivasertib plus fulvestrant · NCCP 00947

This feasibility update builds on olaparib review commit 71d089b071bff6f8ed3ff6eb3cad49a5e6577105. It adds two phase-specific patient planners and three-page packs to the existing suite. The portal explains both medicines, links to a five-symptom action sheet and offers a reusable home glucose record. Both sheets also appear as bookmarked supplements to the 21-page core handbook. The active prescription and clinic dates govern treatment. No personal data is collected.

The clinic workflow includes a fasting-glucose and ketoacidosis prompt, a pharmacy interaction reminder, and the source-specific day-1 blood counts for the fulvestrant intramuscular injection. Automated treatment actions continue to come from the existing 00947 protocol. The combination’s agent-specific consent discussion and enhanced handbook are available from the clinic and patient interfaces. Patient video production remains deferred.

## Sources reviewed 24 November 2026

- NCCP 00947 version 1. Pages 1–2 cover administration and precautions, pages 3–4 glucose monitoring, page 5 injection thresholds, page 6 hyperglycaemia, page 8 interactions, and page 9 ketoacidosis. The newly downloaded official PDF matched the October audit SHA-256, a9b3241b62bb6fd36af59f55ae66bac9e50ef3d4d010af3448eac788086857f5. [NCCP protocol](https://assets.hse.ie/media/documents/00947_Capivasertib_Fulvestrant.pdf)
- EMA Truqap product information, sections 4.2, 4.4 and 4.5 and the patient leaflet sections 3–4. These cover missed or vomited doses, glucose monitoring, symptoms and CYP3A4 interactions. [EMA product information](https://www.ema.europa.eu/en/documents/product-information/truqap-epar-product-information_en.pdf)
- HSE emergency services contact advice. [When to call 112 or 999](https://www.hse.ie/emergencies/when-to-call-112-or-999/)

## Reproduction

Run the scoped authoring Python environment on `tools/capivasertib-planner/build.py` to generate both HTML planners and the canonical and compatibility PDF copies. Both calendars derive administration days from the protocol. Their combined packs reuse the existing anatomical and wallet-card pages. Use `node tests/capivasertib-planner.test.cjs` and the existing 00947 integrated source scenarios to verify the application.

Independent oncology, pharmacy and patient review and physical printing remain pending.

## Review results and release hold

The integrated 00947 assessment passed 229 of 229 source checks and exercised 120 of 120 rules. The patient-interface suite passed 46 tests. The published site resolved all 54 local links across the five affected patient entry points. Both three-page packs decoded to the 00947 portal. All 21 original handbook pages rendered identically after adding the two pages. The release gate, Pages build, deployable-site validation and repository security check passed. The local browser preflight encountered a socket permission error, leaving interactive desktop and mobile verification pending.

The full CI command then stopped in the legacy catalogue test at `tests/catalogue-ui-v027.test.js:26`. An isolated replay against its six original inputs from the olaparib parent commit produced the same failure. It expects an older monotherapy filename. The 00588 URL in the olaparib parent also returned HTTP 404. The current HSE breast and oral SACT registers link to NCCP 00588 version 6, reviewed 2 November 2026. The downloaded eight-page PDF has SHA-256 `552b8bc3ac1aa3ce7814391076a4fecb1c2f1790bb577c2d92bad587cee4671f`. [Current HSE 00588 PDF](https://healthservice.hse.ie/documents/6397/588_Olaparib_tablet_monotherapy.pdf)

The version history records an amendment to the review schedule. Extracted text across the four dose-modification tables matched the retained version 5b after normalising spacing, bullet glyphs and the spelling of CrCl. The historical 00588 source registration, links across its patient and clinician materials, and associated catalogue test still need a version 6 source migration before release. The 00947 protocol URL returned HTTP 200 and the same audited 11-page PDF recorded above.
