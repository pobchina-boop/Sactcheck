# Batch four patient and clinician source drafts

Five complete external educational profiles for proposed v0.84.63: 00420 doxorubicin/cisplatin, 00463 methotrexate/doxorubicin/cisplatin, 00100 mifamurtide, 00596 ifosfamide/etoposide and 00680 high-dose ifosfamide. These files have not been installed in SACTCheck, published, rendered as PDFs or clinically approved.

The source is the five complete current national-regimen text captures, the retained targeted regulatory excerpts and seven primary evidence publications in `sarcoma-batch4-sources-20261118`. The clinical input is pinned to checkpoint `212e4b98722b1719b6dcb85b671ca21fe0e479c948cbe4ca5a3b65dc4d8fc76a`. Original PDF-byte hashes and source-table pixels have not been verified.

## Files for integration

- `overlay/data/patient-knowledge/*.json`: five full patient reference profiles, mechanisms, agent risks, general risk discussions, source references, 38 distinct test cards, treatment summaries and eight-marker anatomical maps.
- `overlay/data/regimen-knowledge-base-v08463-addendum.DRAFT.json`: structured clinician rationale, selection, support, monitoring, administration and 11 numeric endpoint cards across the five regimens.
- `overlay/draft-integration/`: journey, support/workflow and presentation fragments, exact input hashes, protected-application hashes, checks and required integration actions.
- `overlay/handbook-source/*.md`: five complete readable handbook source companions.
- `overlay/three-page-guide-source/*.md`: source organised into three intended guide pages. These are not paginated or visually verified PDF files.
- `actual-renderer-checks.json`: the original 90 assertions using the existing application evidence renderer and consent classifier. All 11 evidence-card structures rendered, and mifamurtide did not receive checkpoint-inhibitor consent. These were not recounted as the subsequent independent content challenge.

## Clinical distinctions retained

|Code|Course and content boundary|
|---|---|
|00420|Six 21-day cycles, usually three before and three after surgery; doxorubicin days 1–3 and cisplatin day 1. Lifetime anthracycline exposure and current cardiac risk remain relevant.|
|00463|Surgery-linked reference weeks 1–29, not a repeating 21-day cycle. Exact pre/postoperative drug weeks are in `long_course_schedule`. Methotrexate levels and rescue use infusion-start time. Rescue must not automatically stop for low counts or a delay to further chemotherapy. Conflicting source renal and rescue wording is retained for specialist reconciliation; no rescue calculator, fixed clearance or discharge date.|
|00100|After complete resection in the stated nonmetastatic age context, 48 infusions over 36 weeks: two weekly for 12 weeks at least three days apart, then weekly for 24 weeks. Independent chemotherapy clock, innate immune activation, no automatic checkpoint consent or routine steroid support.|
|00596|Days 1–5 every 21 days, up to seven cycles. Etoposide before ifosfamide, mesna from ifosfamide start, required growth-factor support and hydration after completion. The osteosarcoma indication has no invented relapse qualifier. Irish unlicensed etoposide indication, patient information/consent and local committee acknowledgement are explicit.|
|00680|Five 24-hour infusions per cycle, maximum four cycles; mesna before/during/after and continued hydration. Grade 3 or worse neurological toxicity discontinues ifosfamide; the separate ifosfamide/etoposide re-exposure approach is not copied.|

## Checks and remaining work

The reproducible author refuses output inside the application. Eight existing application inputs/protocol files were hashed before and after generation and remained unchanged. All patient source references resolve internally, patient medical acronyms are expanded, each profile has eight unique anatomical markers, and minimum marker separation is 10.56–12.048 mm on the reference silhouette. The 38 monitoring cards have individual purposes and timings rather than repeated baseline paragraphs.

The actual Node evidence renderer accepts and renders every numeric endpoint. The actual consent classifier selects generic chemotherapy for the four cytotoxic profiles and no checkpoint module for mifamurtide. Its final printable consent still requires insertion of the authored innate-immune risk discussion and separate concurrent-chemotherapy discussion. The etoposide licensing note must also reach the printable consent.

The existing patient builder has release allowlists and must use the authored schedule label during integration. MAP and mifamurtide must never be labelled repeating “203-day cycle” or “252-day cycle”; their relative course-day values describe whole-course phase mapping only. Check the final portal, knowledge pages, journey, consent, three-page guide and handbook after integration. Browser appearance, actual PDF page counts/margins and QR destinations have not been checked here.

The linked doxorubicin product information was readable and recommends baseline pumping-function imaging and repeats after approximately each accumulated 100 mg/m²; this supplements the national conditional-imaging wording and requires a reconciled clinical plan. Ifosfamide product information also specifies blood counts before each administration; both source timings are disclosed. The national-source-linked cisplatin product PDF returned 404 on direct open although indexed text remains available. A current complete cisplatin product read is not claimed; recheck the supplied product before release.

An independent source-content challenge found six correction groups: original 22/33 content contracts passed and 11 failed. The original 31 files and checkpoint are preserved in `sarcoma-batch4-patient-before-independent-fixes-20261118`. The corrected source distinguishes mifamurtide combined-treatment organ monitoring, contraindicated interacting medicines versus steroid avoidance, and its completely resected nonmetastatic pathway; adds the separate HPRA high-dose methotrexate renal contraindication; explains EURAMOS non-proportional hazards; and provides named, timed monitoring in all five standalone summaries. See `content-correction-notes.md`. Independent replay of the unchanged 33 contracts is supplied separately. These automated and source checks do not constitute clinical, pharmacy or patient approval.

Rebuild from the workspace root:

```bash
python sarcoma-batch4-patient-drafts-20261118/author-sarcoma-patients-v08463.py --repo Sactcheck
node sarcoma-batch4-patient-drafts-20261118/check-patient-drafts.cjs Sactcheck
```
