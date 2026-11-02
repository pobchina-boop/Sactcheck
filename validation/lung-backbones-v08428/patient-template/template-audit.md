# Patient-facing template audit and v0.84.28 implementation

The previous template contained useful clinical content but presented several competing routes at once: a multi-link portal navigation bar, separate tools, a second navigation strip in the knowledge page, and a long contents list. Patients had to decide which document to open before seeing a concise account of their treatment. This is a desk-based content, usability and evidence review, not a patient study.

## What changed

The opening page now answers: what treatment am I having, when do I attend, what changes during the course, what must I do between visits, and whom do I call? Its primary download is a two-sided A4 treatment summary that can accompany consent or first-visit information. The consent aid and discussion draft link directly to that summary. The signed local consent process remains separate.

The front carries regimen names, plain-language schedule (for example every three weeks rather than q21), phases/review points, preparation and urgent actions. The reverse contains the anatomical symptom map, a SACT card section, QR code and readable URL. Daytime and out-of-hours contacts are blank for the treating team to complete; no local hospital numbers were inferred. The printed essential information does not require a smartphone.

The portal offers three optional expandable sections: symptoms/body map; days/tests/practical plans; and medicines/further documents. Urgent advice remains visible with a sticky link. Deep links reveal their containing section. Native disclosure controls work without JavaScript; JavaScript adds anchor reveal and printing. The full reference retains detailed content with a collapsed topic index. The mobile body-map text is enlarged to 16px and symptom boxes stack vertically.

The pilot covers the five new lung suites, four revised platinum doublets, the new 00621 lung context and existing 00568. It does not replace every patient portal. The original shared 00621 patient bundle and breast navigation entry are preserved. Chemo-only summaries explicitly distinguish a separately prescribed immunotherapy or radiotherapy regimen; no radiotherapy dates are invented. Combined chemo/radiotherapy remains a useful next template test because those dedicated suites are in the remaining queue.

## Evidence and interpretation

The accompanying evidence-review.md contains eight primary study entries and guidance with links and limitations. Jambor's 2025 experiment supports a written or pictorial schedule alongside spoken information, with similar results for the two timeline types. Enzinger's trial shows that extra written/video material alone need not improve understanding of treatment benefit. A small pocket-card trial did not show better recall. The layout is our design inference from this evidence, not a validated intervention.

## Verification and limits

All eleven summaries are two A4 pages. Text extraction checks include the treatment purpose, schedule, phase text, preparation and urgent paragraph. The full batch comprises 93 PDFs with identical compatibility copies, page-boundary checks and 44 QR decodes. All eleven front/reverse layouts were inspected in contact sheets, with full-size review of the 00568 and 00343 summaries. Browser inspection covered desktop disclosure navigation, a direct symptom anchor and the passport download route. A 390px iframe exercised responsive phone-width layout: 375px content width and 375px scroll width, without horizontal overflow. This is not real-device, screen-reader or end-user validation.

Printed main text is approximately 11–12pt; anatomy labels are 10pt and card/source text is smaller. HSE guidance favours at least 12pt for body text. The compact two-sided version therefore needs patient review and an accessible large-print alternative before broad adoption. No claim of full accessibility compliance is made. The SACT section is a carry reference, not a validated emergency card and not a replacement for medicine-specific alert cards.

Before wider rollout, involve patients and carers with varied literacy, vision, languages and digital confidence. Ask them to identify their regimen and treatment/rest days, explain a phase change, find the out-of-hours route, act on fever or sudden illness, and locate optional information. Test the printed sheet without QR access as well as the phone view. Record task success, misunderstandings and time to locate urgent advice; do not rely on satisfaction alone. Independently review clinical wording and local contact arrangements with nursing, pharmacy and oncology colleagues.
