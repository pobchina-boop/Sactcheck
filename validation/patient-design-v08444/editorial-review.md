# Patient editorial revision — v0.84.44

This revision replaces the current patient education passages previously tagged with NCCN sources with independently authored SACTCheck explanations. It also makes selected monitoring tests explicit, introduces medical abbreviations in patient language and consolidates repeated PRRT handbook material. It does not constitute a new clinical audit of every regimen.

## Scope and provenance

The frozen v0.84.43 inventory identified 902 source-tagged objects in 36 JSON profiles, representing 150 distinct payloads. Every payload received an explicit disposition: rewritten patient explanation, retained source-specific monitoring instructions, or retained evidence facts with a revised explanation of uncertainty. Existing NCCP and medicine sources remain attached to retained clinical instructions. Superseded educational references were removed only after this review.

Eighty current patient JSON files changed, including conditional monitoring descriptions for colorectal and liver cancer. Historical regimen versions, source-check dates, clinical review releases and patient template versions remain unchanged. Exact old/new content and hashes are available in `editorial-field-diff.json`, `editorial-object-changes.json` and `editorial-source-paths.json`. Historical source content remains in `editorial-baseline-inventory.json` and the previous release.

The source catalogue is `editorial-source-provenance.json`. It records URLs, relevant sections, source versions where available, access dates and retrieval limitations. The rewritten patient reference collects those sources together instead of repeating a source label after every card.

## Named tests and their limits

The PRRT safety panel names haemoglobin, white-cell differential and platelets; creatinine and calculated creatinine clearance; ALT, AST, albumin, bilirubin and INR; potassium before amino-acid infusion; and the baseline heart assessment. These clarify the existing treatment checks rather than inventing a separate testing timetable. The more frequent NCCP follow-up schedule remains authoritative for this regimen. See [NCCP 00642 v2, printed page 3](https://healthservice.hse.ie/documents/6683/642_v2_Lutetium_Lu177_oxodotretide.pdf) and [EMA Lutathera product information, sections 4.2 and 4.4](https://www.ema.europa.eu/en/documents/product-information/lutathera-epar-product-information_en.pdf).

LDH is explicitly displayed for 00373 at baseline and before each cycle; the existing CPK/creatinine monitoring remains visible. See [NCCP 00373 v3, printed page 2](https://healthservice.hse.ie/documents/6728/373_V3_Cobimetinib_and_Vemurafenib.pdf). Other routes have no new universal LDH requirement.

NET markers are conditional: 5-HIAA for an appropriate serotonin-related question, chromogranin A when clinically informative, and selected pancreatic hormones when relevant. CEA is explicitly limited to colorectal plans, while AFP is conditional on its usefulness in the liver-cancer plan. The clinician supplies dates; no new frequency is inferred. Marker changes must be interpreted with the rest of the clinical assessment. See [NCI NET marker discussion](https://www.cancer.gov/types/gi-neuroendocrine-tumors/hp/gi-neuroendocrine-treatment-pdq), [NCI pancreatic NET tests](https://www.cancer.gov/types/pancreatic/neuroendocrine-tumors/diagnosis), [NCI colon cancer follow-up](https://www.cancer.gov/types/colorectal/hp/colon-treatment-pdq) and [NCI liver cancer AFP interpretation](https://www.cancer.gov/types/liver/hp/adult-liver-treatment-pdq).

## PRRT consolidation

PRRT chapter prose decreased from 2,519 to 1,086 words, and the chapter count fell from ten to seven. The duplicate treatment explanation, practical preparation chapter and service-plan chapter were removed because their content already has a canonical home. `prrt-section-consolidation.json` identifies each removed block and its retained destination.

Medicine mechanisms remain with the medicine cards. Schedule and administration details remain in the treatment plan and logistics. SSA interruption/restart, contraception periods, radiation precautions, official radiation card and scan appointments remain in logistics. Testing remains in the monitoring plan. The remaining PRRT-specific chapters explain delayed kidney/marrow effects, hormone crisis and tumour-breakdown/fluid changes. Emergency action remains in the main urgent-help section.

## Validation and limitations

The editorial transformer was checked in memory against 2,895 current HTML files across 228 routes. The preflight found no visible NCCN references or targeted distancing phrases, no idempotence failures and no changes to script/style blocks. All current source IDs resolve, and protected historical metadata checks passed. These are editorial checks; the release's generated PDF, layout, clinical invariant and QR checks are recorded separately by the release workflow.

The detailed HSE PRRT DOCX could not be freshly read through the browser. Its existing service-specific scan arrangements, extra early blood tests and home restrictions were retained as matters for the individual's written plan, rather than newly asserted as universal schedules. Browser text retrieval did not provide verified source-file bytes; this report does not claim new binary source checksums. Independent oncology, pharmacy and patient/PPI review remains separate.
