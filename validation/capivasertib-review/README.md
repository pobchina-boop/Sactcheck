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
