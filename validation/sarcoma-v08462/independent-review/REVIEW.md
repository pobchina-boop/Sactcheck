# Batch-three independent clinical draft review

18 November 2026. External drafts only; no application files changed. Original checkpoint SHA-256: `732e479ee25867c01ca142551471036aea62ca57beb3cdbc1c9253f8e35b6f31`.

154 independently authored assessment-engine and dose-action scenarios challenge five protocols. The source author’s 590 cases were not imported or counted. Initial valid original-draft result: **129 passed, 25 failed**. These failures represent four issue groups, not 25 distinct defects. All four issue groups were corrected externally. **The identical154-case harness now passes154/154**, with its script hash unchanged and all original failures retained.

| Issue group | Original behaviour | Required response |
| --- | --- | --- |
| Entered dose above source reference | Trabectedin1.51/1000, vinblastine7, methotrexate31, STS PLD51/1000, KS PLD50/1000 mg/m² generated no specific clinical dose review | Reconcile units, selected regimen and actual prescription; do not invent a replacement dose |
| Trabectedin contradictory dose history | Actual previous1.2 mg/m² plus planned re-escalation and a false previous-reduction tick generated no review | Retain explicit escalation/history reconciliation |
| Severe current PLD skin/mouth toxicity with incomplete timing | Grade3 PPE/stomatitis/mucositis with delay missing or outside source table produced review only | Withhold while timing and stop criteria are assessed; do not invent automatic permanent stop without history |
| PLD post-severe count recovery | Prior severe cytopenia plus ANC1.6 and platelets74.5 produced review only | Preserve the explicit requirement to wait for BOTH ANC≥1.5 and platelets≥75, across all four00205 contexts |

Passing challenges include trabectedin current CPK/renal gates despite recovery assertions; current liver/count/albumin/haemoglobin abnormalities overriding an all-criteria tick; rhabdomyolysis full-recovery history; permanent cardiac stops; methotrexate CrCl50 overlap,50–60 source conflict and dialysis; component-specific renal/hepatic/mucositis/neuropathy/lung-history actions; PLD prior discontinuation despite recovered symptoms,450mg/m² as a cardiac-check threshold rather than universal stop, absolute bilirubin versus ULN/band contradictions; eribulin liposarcoma/breast boundaries, base-versus-mesilate dosing, numeric re-escalation, current count/neuropathy holds despite restart assertions and renal-band contradictions.

Both00205 and00228 indication arrays exactly match the existing application arrays. All five existing application protocol bytes still match the pre-draft hashes. All50 existing shared00205/00228 patient profile/HTML/PDF/QR assets remain byte-for-byte unchanged after replay. Both indication arrays remain exactly preserved in the corrected drafts.

Eleven first-run failures were harness assumptions, corrected before the valid run: the dose-modification model omits unaffected component rows, and its eribulin contraindication label `Not to be administered` is marked quantified despite not being an administered dose. The original fixture script and raw118/154 result remain in `first-run-fixture-*`; they are not counted as clinical defects.

Current official NCCP web texts are pinned separately from original PDF bytes. Trabectedin and vinblastine/methotrexate were freshly reopened during this review; PLD and eribulin use the campaign’s current pinned full source captures. Source conflicts, PDF binary retrieval, actual table pixels, browser checks and independent consultant/pharmacy approval remain separate unresolved/unverified matters. Passing these software probes will not constitute clinical-use approval.

## Corrected snapshot

- `00374`: `1775320463cab45b15534e8e787a6f729096f94fb34dcb1b00cb79483dac356c`
- `00554`: `5af9251b6f9cfcde0672bcc89823a85b434d263d8bcc061e36cc36682a022206`
- `00205`: `5df087cc604962a1f0409b1caedd1ce7ac8d3a17d2cd1f22d95f0ad230b12308`
- `00462`: `0b17ba9ef437b001b729ee7348e447f8252664ab4e3dbf2132bfbc85bdae368c`
- `00228`: `71e93cdfe47d9e021e72b0f3eba213ee83e34e2a537db2f936f188d292ab2fc0`

Current output: `current-results.json`; original129/154 output: `original-results.json`. Run with `node independent-cases.cjs --current` using the pinned external draft root, or override `SACTCHECK_ROOT` and `SACTCHECK_DRAFT_ROOT` for explicit portable staging. No source conflicts or professional approvals were resolved by software replay.
