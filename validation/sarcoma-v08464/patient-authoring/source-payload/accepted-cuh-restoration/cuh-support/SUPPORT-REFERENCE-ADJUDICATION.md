# Bounded v63/v64 support-reference mapping review

Date: 18 November 2026. Read-only clinical-source review; no application or patient-content mutation by this memo. The adjacent `support-source-manifest.json` pins the exact retained primary-source text captures. Their hashes identify extracted text/JSON captures, not original PDF binaries. No source-table pixel inspection is asserted.

Historical supplied CUH proformas can be retained as complete attributed references. Their inclusion is not an individual prescription, an automatic new course, or evidence that every listed adjunct is universally appropriate. The current source-specific schedule, delayed-emesis cover and individually reconciled prescription remain distinct from the historical reference list. Preserve PPI, mouth-care and PRN rows as source content while making exclusions and reconciliation instructions visible beside the relevant rows. Do not silently remove conflicting wording or select a new dose.

| Regimen/phase | Source-supported risk | Historical reference mapping and boundary |
|---|---|---|
| 00420 Day 1 | Cisplatin high; doxorubicin moderate | High reference. |
| 00420 Days 2–3 | Doxorubicin moderate active-agent risk | Moderate reference, explicitly preserving required delayed-emesis coverage from Day 1 cisplatin. This is not authority to downgrade or end the multiday plan. |
| 00463 doxorubicin/cisplatin | High cisplatin-containing treatment | High reference. |
| 00463 doxorubicin-only or separate high-dose methotrexate | Each agent moderate | Moderate reference. Methotrexate/PPI interaction requires individual pharmacy reconciliation; an inherited omeprazole row is not an automatic prescription. |
| 00100 both mifamurtide frequency phases | Moderate | Moderate reference, with routine corticosteroid rows explicitly inapplicable pending a specific clinical indication. Do not transfer fixed adult supportive doses to children. |
| 00596 IE | Source explicitly says overall high, although individual ifosfamide is moderate and etoposide low | High reference with multiday reconciliation and ifosfamide/aprepitant interaction review. |
| 00680 high-dose ifosfamide | High | High reference; retain ifosfamide/aprepitant review. |
| 00675/00747 IE and VAC | Source explicitly says both portions overall high | High reference, with ifosfamide/vinca interaction review. |
| 00675/00747 final VC, with or without protocol-specified dactinomycin substitution | No separately verified VC aggregate grade | Retain the overall-regimen high reference as historical context. Do not claim a new independent VC risk grade or automatically restart all medicines. |
| 00504 irinotecan/temozolomide | Irinotecan moderate; temozolomide moderate–high | High reference is an upper-risk historical option pending an individual moderate–high plan; it is not a source-certified aggregate risk classification. |
| 00754 ifosfamide-containing days in cycles 1–4 and 5–9 | Ifosfamide high | High reference. Dropping doxorubicin does not remove the high-risk ifosfamide component. |
| 00754 isolated vincristine days | Minimal active-agent risk | Do not automatically restart the preceding high-risk prescription. Preserve the preceding cycle plan and clinical interaction review. |
| 00757 VIT Days 1–5 | Temozolomide moderate–high; irinotecan moderate | Same upper-risk historical reference limitation as 00504. |
| 00757 Day 8 vincristine alone | Minimal active-agent risk | Retain whole-cycle high reference with the heading **Reference for the initial combination days; not a new Day 8 prescription**. Preserve ongoing cycle diarrhoea/support instructions, without assigning a new high-risk grade to Day 8. |

## Exact source locations

- 00420: NCCP v4 p3 lines150–155 (agent risk), p1 administration calendar.
- 00463: NCCP v4 p9 lines419–425 (agent risk), source pre/postoperative phase calendars. HPRA methotrexate PA0822/206/007, 11 September 2026, p5 §4.4 lines202–207: PPIs can delay high-dose methotrexate elimination. This supports reconciliation, not an invented replacement acid-suppressant or hold interval.
- 00100: NCCP v6 p3 lines118–134 (moderate risk and steroid avoidance), p4 interactions. EMA Mepact §4.5 states chronic/routine corticosteroids should be avoided because of immune stimulation. Fixed adult supportive examples must not become universal paediatric doses.
- 00596: NCCP v2 p4 lines194–203 (overall high risk, ifosfamide/aprepitant, G-CSF).
- 00680: NCCP v2 p4 lines166–178 (high risk, ifosfamide/aprepitant, G-CSF).
- 00675: NCCP v2 p6 lines316–334 (overall IE/VAC high, component grades, ifosfamide/vinca-aprepitant interaction); later VC is not given a separate aggregate classification.
- 00747: NCCP v2 p6 lines300–318 (same distinction).
- 00504: NCCP v2 p4 lines199–209 (agent risk), p5 lines223–250 (atropine/glaucoma, delayed diarrhoea, infection cautions).
- 00754: NCCP v3 p7 lines330–346 (agent risk and ifosfamide/aprepitant), administration tables for retained ifosfamide on Days1–2 and isolated vincristine days.
- 00757: NCCP v2 p5 lines275–310 (agent risk, atropine/glaucoma, constipation, azole/vincristine, diarrhoea); p6 infection cautions. Day8 is vincristine-only in the source calendar.

## Required source-specific exceptions

1. Preserve each regimen's mesna, hydration, G-CSF, renal/neurological monitoring and source-specific histories. Historical antiemetic references must not overwrite them.
2. Do not auto-apply a CUH PPI to high-dose methotrexate. Reconcile the actual product and local interruption/restart plan; no automatic substitute or invented timing.
3. Mifamurtide requires avoidance of chronic/routine corticosteroids and age-appropriate supportive prescriptions. Complete reference retention must not expose a routine steroid as applicable by default.
4. Ifosfamide/aprepitant and relevant vinca-alkaloid interactions remain explicit; a historical NK1 row does not override their review.
5. For 00504/00757, preserve the regimen-specific **prescribed** irinotecan diarrhoea plan. The generic CUH loperamide row remains archival and is not the applicable algorithm. Maintain acute-versus-delayed diarrhoea distinctions, atropine glaucoma exclusion, contact/escalation instructions and individual age-appropriate dosing. Do not transfer the 00757 missed-dose instruction to00504.
6. Preserve existing temozolomide infection/PJP assessment and liver monitoring. Do not turn conditional assessment into an unqualified universal prophylaxis prescription.
7. The original supplied CUH loperamide form was subsequently located and read by the parent and contains both frequency statements. Retain its provenance and the visible reconciliation note; do not relabel either statement as a transcription error or silently replace it with a generic schedule.

These template mappings are display/reference choices, not independent consultant/pharmacy approval or prescribing authority. Clinical and pharmacy acceptance remain pending.
