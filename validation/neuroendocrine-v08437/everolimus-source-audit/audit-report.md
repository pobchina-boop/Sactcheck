# Everolimus source audit — v0.84.37

Audited 5 November 2026. Two freshly retrieved official PDFs plus the current NCCP NET catalogue; no source-access blocker. This is a software/source-concordance audit. Independent consultant/pharmacy authorisation remains false.

Protocol: `00320`; rules 11 → 90; 568/568 executable source cases pass, all rules exercised. Running the same source expectations against the saved baseline gives 172 passes/396 failures. These are test outcomes, not a count of distinct clinical defects.

## Sources

| Source | Snapshot | Evidence |
|---|---|---|
| NCCP00320 | v6; versiondate24February2026; review24February2031;6pages | `sources/00320.pdf`; visually inspected Tables1–3 on rendered pages2–3 |
| EMA Afinitor | Current online50-page productinformation retrieved5November2026; section10dateblank | `sources/afinitor-ema.pdf`; exactSHA retained, not assumed to be the NCCP-reference2025edition |
| NET catalogue | Currentb/cindications and linkedPDF verified | `sources/catalogue.html` |

All URLs and SHA-256 hashes are in `source-manifest.json`. The original protocol is preserved under `protocol-before/`.

## Findings and implementation

### EV01 — Blood counts/FN

Before: No ANC, platelet, nadir, fever or FN pathway.

After: Baseline review separated from treatment toxicity. Current ANC<1 or platelets<75 holds; same-episode severity determines same-dose versus5mg after recovery. Grade3FN requiresANC≥1.25 AND no fever; grade4stops even after recovery.

Evidence: NCCPp2Table1;EMA p4Table1. Coverage: Counts, nadirs, FN3/FN4, omitted recovery, prior-dose matrices.

### EV02 — Stomatitis

Before: All grade≥2 merely held. No permanent stop or recurrence/restart.

After: Grade4stop; grade2/3hold; recovered firstG2same actual dose; secondG2/G3 source5mg with safeguards. Third/later recurrence remains review.

Evidence: NCCPp3Table3. Coverage: Currentgrades0–4, peak/occurrence matrix, missing/invalid history.

### EV03 — Pneumonitis

Before: All grade≥2 unconditionally held; no four-week rule/G4stop.

After: Preserves consider interruption forG2; four-weekG2failure stops; G3hold until≤1 with discretionary restart; recurrentG3considerstop; G4stop. A priorG3 partly improving toG2 cannot accidentally useG2 four-weekstop.

Evidence: NCCPp3Table3;pp4–5complications. Coverage: 3.99/4/4.01weeks, delayed/timely/missing recovery, recurrentG3, historicalG4.

### EV04 — Other non-haematological toxicity

Before: Genericgrade≥3hold; noG2tolerability/recurrence orG4stop.

After: First tolerableG2 noadjustment; intolerable/recurrentG2hold; secondG2recovery5mg; G3hold/considerrestart; recurrentG3considerstop; G4stop. PartialG3→G2improvement remainshold.

Evidence: NCCPp3Table3. Coverage: Tolerability×occurrence, recovery, historical/current grades, contradictions.

### EV05 — Glucose/lipids

Before: No metabolic rule.

After: Separate clinician-graded hyperglycaemia and dyslipidaemia; G2noadjustment/G3hold/G4stop. No fabricated biochemical or recovery cutoff; an explicit consultant recovery decision precedes a guarded5mg target.

Evidence: NCCPp3Table3;EMAp4Table1. Coverage: Both domains0–4, previousgrade3/4, approved/absent/false recovery, activeG3 despiteapproval.

### EV06 — Renal/hepatic and unsupported LFT cutoff

Before: Unattributed ALT/AST>5 and bilirubin>3 holds; hepatic75/50/25% without context could increase an already reduced dose.

After: Unsupported standalone LFT rules removed; values retained as context. Explicit routine renal no-adjustment and AKI review. ChildPughA/B/C standard-dose targets7.5/5/2.5mg require baseline or actual previous dose; classC benefit-risk approval enforced.

Evidence: NCCPp3Table2;EMA pp5,6,8sections4.2/4.4. Coverage: A/B/C×timing×previousdose; C missing/falseapproval; ALT/bili3/5boundaries; renal/AKI.

### EV07 — Combined-dose and history safety

Before: No guards against re-escalation, missing episode history or concurrent hepatic/toxicity changes.

After: Numeric recovery requires prior dose≥5mg, no hepatic impairment and restart timing. Hepatic/toxicity combinations and interactions suppress numeric component output. Same-dose/discretionary restart is manual. Currentgrade>sameepisodepeak triggersreview without hiding urgentholds/stops.

Evidence: EMA p8section4.4 evidencegap; NCCP consultantmodification requirement. Coverage: All8fixed5mg routes×dose/history/context; concurrentholds/stops;20contradictioncases; invalid inputs.

### EV08 — Source version, schedule and clinical scope

Before: Version6 metadata but old organ-only source note, generic schedule and unspecified routine monitoring.

After: FreshNCCPv6hash/date and EMA snapshot attributed separately; continuous10mg standard, no tablet-free28-daycycle; q4weekroutinebloods; individual imaging/markers; all3indicationrecordsretained. CTCAEv5 orientation is not mislabeled asNCCP grading; EMA table actuallyusesv3.0.

Evidence: NCCPpp1–2,6;EMA p4Table1footnote. Coverage: Indication equality, schedule/monitoring/provenance/governance invariants.

### EV09 — Infection/support/interaction precautions

Before: No explicit infection/HBV/lung/AKI/interaction safeguards.

After: Unresolvedpreexistinginfectionhold; activeinfection/feverreview; invasive systemicfungalstop(EMA); HBV/lung/perioperative/radiation/interactionreview. No mandatory universal antiemetics, steroids orPJPprophylaxis invented.

Evidence: NCCPpp4–5;EMA pp5–10sections4.4–4.5. Coverage: Independent findings and strongest-action component suppression.

## Source limits preserved

- Baseline low counts are not falsely presented as a specific NCCP baseline eligibility minimum.
- NCCP printed bands0.5–0.99/50–74.9 are clarified by EMA Table1 as0.5≤ANC<1 and50≤platelets<75; decimal gaps are not silently rounded.
- Numeric recovery requires both current counts and both same-episode nadirs for ordinary count toxicity. This conservative software gate prevents a missing opposing cytopenia from becoming restart clearance. FN additionally requires no fever and the separateANC1.25recovery target.
- Source “consider” decisions remain review-only; no automaticG3pneumonitis restart/discontinuation orG3othernonhaem restart/discontinuation. Grade2pneumonitis failure to recover within4completedweeks is a stop; this is not imported into a priorG3episode.
- No numeric metabolic recovery target is supplied by NCCP/EMA. Consultant recovery confirmation is an individual decision, not a source-derivedgrade≤1threshold.
- EMA Table1 usesCTCAEv3.0; retainedv5orientation descriptors explicitly state their different provenance. No automatedgrade conversion is asserted.
- No clinical safety/efficacy data support adverseevent dose adjustment in hepatic impairment (EMA4.4); simultaneous hepatic/toxicity changes therefore block numeric restart.
- Third/later recurrences, actual lower doses, unreviewed interacting medicines, and contradictory same-episode histories remain specialist review.
- The standard10mg schedule is continuous. Existing28day administrative periods do not establish tablet breaks or a finite course.
- Preserve00320aRCC,00320bpancreaticNET,00320cnonfunctionalG1/G2GINET. EMA lungNET licensing does not extend the NCCP00320c context.

## Validation and handover

Run `node validation/neuroendocrine-v08437/everolimus-source-audit/source-cases.cjs`. `--before` intentionally returns failure for the historical encoding. Results retain individual input/expectation/component-dose output and page/table provenance. Source-case rules are not generated from the current encoding.

Own00320 passes strict schema and generated-form validation. The full protocol-validator now passes382publishing checks after the00642owner fixed the concurrent visibility issue. The broaderrelease suite/browser/PDF/QR/deployment checks are not asserted by this bounded audit.

The patient-content author received exact source schedule, food/missed-dose instructions, monitoring/support details and NETscope limits. `legacy-organ-rule-migration.json` documents the intentional replacement of unsafe historic assertions; no oldorgan-ruleIDs were deleted.

Protocol SHA-256: `5b0ef5bf0efad071f149d4d64d51a87eaeb63c972be36ecca616921982cad26a`.
