# Platinum retrospective source audit — v0.84.28

Checked 2 November 2026. Scope: NCCP 00317 pemetrexed/cisplatin, 00318 pemetrexed/carboplatin, 00271 carboplatin/etoposide and 00280 cisplatin/etoposide. These are retrospective refinements, not four newly completed lung regimens.

## Retrieval and comparison

All four official PDFs were freshly downloaded successfully from each canonical metadata source URL. The SHA-256 of every binary is identical to the source retained for the previous source audit. Versions are 00317 v7, 00318 v6, 00271 v6, 00280 v7. Stable protocol IDs intentionally retain existing compatibility aliases, including `nccp-00271-v7` and `nccp-00280-v6`; the source version lives in metadata and is not inferred from that alias.

Full extracted text is retained in `research/<code>.txt`; exact URLs, byte counts and PDF SHA-256 values are in `research/retrieval.json`. Visually rechecked 00317 page 3, 00318 page 4, 00271 page 4, and 00280 pages 3–4. Full extracted text reviewed, including eligibility, administration, monitoring, toxicities, support, oral alternatives and references. These are source reconciliation checks, not independent clinical validation.

A useful extraction pitfall was reconfirmed: underlined greater-than symbols in the 00271 and 00280 count tables represent **greater than or equal to**. Plain PDF text extraction drops the underline. Existing ANC/platelet thresholds correctly include the boundary; no spurious equality “gap” has been added.

## Rule findings

No change to clinical rule conditions, actions, priorities or dose quantities was warranted by the freshly retrieved editions. All 156 current rules are preserved (39 + 39 + 36 + 42). The following existing source-specific behaviours were rechecked:

- **00317 / 00318:** current counts, not obsolete nadir counts; missing bleeding status does not choose a reduction; pemetrexed clearance below 45 excludes use even where the platinum component has its own alternative dose; severe hepatic impairment and dialysis restrictions remain component-specific. Baseline neuropathy/hearing exclusions, treatment neuropathy recurrence, differential mucositis doses and consultant-choice allergy pathways remain distinct. Neoadjuvant three-cycle limit does not transfer to the standalone four-to-six-cycle course.
- **00317:** cisplatin renal 40–49 and 50–59 rows remain separate from pemetrexed's 45 boundary and baseline renal exclusion. Fractional values outside the literal integer ranges trigger review rather than silent rounding.
- **00318:** carboplatin GFR and pemetrexed creatinine clearance are not treated as the same confirmed measure. Carboplatin ≤20 restriction and >20–≤30 extreme-caution band remain separate; estimated creatinine recency and isotope-baseline changes require review.
- **00271:** the source count-table gap at platelets 50–<75 still requires clarification; considered dose reduction is not returned as a definitive quantity. GFR ≤20 excludes carboplatin; etoposide has its own clearance bands. FBC is weekly prior to treatment, unlike 00280's per-cycle regular tests.
- **00280:** baseline cisplatin exclusion below clearance 60 remains distinct from continuation-dose rows. Unknown stage cannot silently assume continuation. Neuropathy requires recovery and a consultant choice between substitution and reduction. Etoposide mucositis does not inherit an invented generic 75% rule. Severe liver results override moderate-row quantification.
- **00271 / 00280:** etoposide liver dosing uses absolute bilirubin and AST values; ALT or an unqualified ULN value cannot replace those inputs. Day 1 IV / Days 2–3 oral is an explicit alternative with the prescribed oral dose twice daily, not an automatic route conversion. Multi-day support extends beyond the final SACT day according to the written prescribed plan. RT or ICI additions require their own full regimen.

Source proposals update audit provenance and full-suite release only. Fresh binaries are development evidence; release packaging may omit binaries and PNGs while retaining retrieval hashes/text and this report.

## Patient-facing changes

The full detailed patient reference, anatomical risks, evidence limitations, support medicines, relative monitoring journey and prescriptions are retained. Each of the four receives `patient.patient_summary` using the new common summary schema: plain-language purpose, 3-week schedule, three broad stages, three preparation prompts, card schedule and a chemotherapy safety alert. Detailed conditional context is not squeezed into tab navigation.

A separate `treatment_scope_notice` must be displayed prominently by the summary renderer:

- Pemetrexed/platinum summaries cover chemotherapy alone. If nivolumab is prescribed before surgery, the correct complete 00849 backbone bundle is needed, with its three-cycle course and immunotherapy-specific safety information.
- Etoposide/platinum summaries cover extensive-stage chemotherapy. Limited-stage chemoradiotherapy and ICI combinations are separate plans.

00317 and 00318 include `related_treatment_plans` pointing to the exact 00849 backbone and to 00222 maintenance. These are conditional links, not automatic next treatments. A concise teach-back question is added to each complete reference. No survival estimate or individual benefit claim is inserted into a patient summary/card. Blank contact fields must be completed by the treating team; this audit does not invent hospital telephone numbers.

## Validation

`node validation/lung-backbones-v08428/platinum-retro/source-cases.cjs` passes **457/457** cases: 216 pemetrexed source cases, 211 etoposide source cases, and 30 summary/provenance/scope contracts. `--integrated` also passes against the unchanged current canonical clinical rules. This pre-integration run establishes clinical-rule compatibility; final build, PDF, QR and browser verification remain the release owner's responsibility.

Independent consultant, oncology-pharmacy and patient/PPI review remain pending. `clinical_use_authorised` stays false.
