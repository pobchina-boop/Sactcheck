# Lung patient-template proposal audit — v0.84.31

Checked 3 November 2026. Five existing patient bundles were compared with the treatment and testing sections of their official NCCP PDFs. All five retained their recorded versions. Source links and method are recorded in sources.json. This is a focused schedule/monitoring and patient-presentation review, not a new rule-by-rule clinical revalidation or independent clinical approval. Prior patient and assessment source-review dates must remain intact; the new summary has its own check date.

## Sources checked

- [00568 v5](https://healthservice.hse.ie/documents/6891/568_V5_Pembrolizumab_PEMEtrexed_CARBOplatin.pdf): treatment pp1–2; tests pp2–3.
- [00353 v5](https://healthservice.hse.ie/documents/6914/353_V5_Osimertinib_Monotherapy.pdf): treatment p1; tests p3.
- [00655 v3a](https://healthservice.hse.ie/documents/6883/655_V3a_Durvalumab_1500mg.pdf): sequence/course p1; tests pp2–3.
- [00689 v4](https://healthservice.hse.ie/documents/6882/689_V4_Atezolizumab_Etoposide_CARBOplatin.pdf): phase and formulation choices pp1–4; tests pp5–6.
- [00271 v6](https://healthservice.hse.ie/documents/6931/271_CarboplatinAUC5Etop100.pdf): route alternatives p1; tests p3.

## Findings and integration requirements

1. **Continuous treatment needs an actual continuous display.** 00353 has cycle_days:null and an empty day_groups array by design. Feeding it directly into the v0.84.30 renderer creates a null-day heading and empty chronology. Proposed cycle_heading/cycle_blocks describe daily treatment without an invented review interval. Preserve its existing distinctions between adjuvant, advanced and out-of-scope post-chemoradiation/combination treatment. Cycle-2 ECG is a source label; it must not become a fabricated Day28 appointment.
2. **A fixed course longer than the stamp capacity is still fixed.** 00655 permits up to13 cycles/12 months, exceeding the current card maximum of8 stamps. Keep a rolling record but replace the generic statement “not a fixed treatment course” with an explicit course-limit note for this card. Do not change thirteen to eight or silently describe treatment as indefinite.
3. **Induction is not maintenance.** 00568 and00689 need explicit phase-qualified day blocks. Existing full pages already contain phase information; the compact presentation must retain it. Four induction cycles are not the total-course limit. In00689 the Day2–3 etoposide instructions apply only during induction; atezolizumab-only maintenance does not include these doses. IV/SC atezolizumab and IV/oral etoposide remain prescribed choices, not interchange instructions. Alternative q28day maintenance belongs to00593.
4. **An uncertain intended course is not a prescribed six-cycle course.** 00271 source allows4–6 cycles. A rolling card avoids implying that six cycles have been prescribed. Preserve chemotherapy-only extensive-stage SCLC scope and explicitly confirmed etoposide route.
5. **Monitoring precision retained.** The summaries distinguish each-cycle and3–6weekly testing in00568/00689, regular tests without invented intervals in00655/00353, and the particular weekly-before-treatment blood-count wording in00271. Full existing journeys retain more detailed kidney-dose verification, vitamin support, hearing/nerve review and conditional tests. No universal CT or tumour-marker interval is added.

No contradictory source version or new clinical-dose defect was identified within this focused review. The above are concrete integration risks with the new compact renderer, not allegations that the existing full pages lack their currently recorded phase and monitoring content. No canonical files were modified by this research task.

## Output

proposals.json contains five objects keyed by code, each with patient_summary and integration_notes; 00353 also carries a concise scope notice. All summaries have summary_source_checked separately. build-proposals.py regenerates these proposals from the reviewed text and retained source metadata. The release owner must apply the proposals, preserve source citations/full-content links, check anatomy and QR destination, render all pages and test the interactions. Physical printing and clinical/pharmacy/PPI review remain outstanding.
