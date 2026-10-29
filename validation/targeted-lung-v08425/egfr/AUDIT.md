# v0.84.25 EGFR source audit

Scope: NCCP 00221 afatinib and 00565 dacomitinib. Checked 29 October 2026. Root owns integration and final document/browser QA. These are source-reconciled proposals, not independently approved clinical content. Consultant, pharmacy, PPI and clinical-use flags remain false.

## Source status and visual inspection

- Afatinib: current HSE-linked NCCP v5, amendment 21 March 2025, review date 21 March 2030; four pages. No version change from repository. Current EMA Giotrif product information updated 11 May 2026.
- Dacomitinib: current HSE-linked NCCP v3, amendment 23 June 2021, review date 23 June 2026; five pages. The review date has passed; the presently linked file is still v3. This audit does not imply a newer NCCP version or independent reapproval. EMA Vizimpro product information updated 17 December 2024; EMA page update 19 October 2026 refers to procedural history, not a new product-information version.
- Downloaded full PDFs and extracted layout-preserving text. Visually checked both NCCP renal/hepatic and toxicity tables (pages 2–3) and both EMA dosing/renal/hepatic tables (pages 3–4). Inspected oral antiemetic V6 Table 5/page8 and Table8/page13. Original files, extracted text and table images are in research/; hashes and primary URLs in sources.json. Research originals should be excluded from the distributable overlay.

## Afatinib findings

The previous nine-rule prototype omitted prolonged/intolerable grade 2 adverse reactions, dose escalation conditions, previous-dose/recovery context, GI perforation, serious skin/eye problems, pre-existing ILD exclusion and P-gp interactions. It also assigned an unsupported numerical ECOG cutoff, treated grade≥2 suspected ILD as permanent discontinuation and implied a universal ALT/AST >5×ULN hold.

The new proposal has 42 optional inputs and 33 source-cited rules. All legacy fields and the stable protocol ID remain. No blank value is interpreted as normal.

- Standard 40 mg once daily; no planned rest interval. Optional 50 mg only after 3 weeks tolerating 40 mg without specified grade>1 reactions and with no prior reduction. Maximum 50 mg; escalation requires Consultant choice.
- Tolerable non-prolonged grade 1–2 has no mandatory hold. Grade2 diarrhoea **>48 h**, rash **>7 days (168 h)**, intolerable grade 2 or grade≥3 triggers interruption. Exactly 48 h/168 h does not satisfy the strict prolonged threshold. Recovery must reach grade 0/1 before Consultant considers 10 mg-decrement restart. Cannot tolerate 20 mg: consider permanent discontinuation; no invented 10 mg level.
- Suspected ILD holds for evaluation; confirmed ILD permanently stops. Known pre-existing ILD is an NCCP exclusion, distinct from a new suspected event.
- NCCP CrCl≥15 needs no adjustment; <15/dialysis says no adjustment expected using Giraud. EMA uses **indexed eGFR**15–29 for close monitoring and does **not recommend** <15/dialysis. The two renal measures are not converted. The legacy severe/dialysis rule is retained by ID but now exposes the source conflict and blocks numerical dosing pending review.
- NCCP Child–PughC says no adjustment expected; EMA has not studied it and does not recommend treatment. The old caution is now explicit Consultant/pharmacy review. Newly developed severe hepatic impairment is a separate stopping event.
- Confirmed GI perforation permanently stops; severe blistering/exfoliation and ulcerative keratitis hold for urgent assessment; LVEF below local lower limit prompts cardiac/medicine review.
- Afatinib table does not name a CTCAE edition; removed the inherited unsupported v5 claim. Grades remain clinician assigned with source provenance.
- FBC/renal/liver profile monthly; LVEF at baseline/during treatment when indicated. Food separation is 3 h before/1 h after; missed dose skipped if next due within 8 h; no replacement after vomiting. Women’s contraception≥1 month after final dose, no breastfeeding during treatment.

## Dacomitinib findings

The former nine-rule prototype missed grade 2 duration/support conditions, initial-versus-ongoing hepatic dose context, restart recovery distinctions and interactions. It used ECOG>2 instead of the actual NCCP0–1 range and prematurely permanently stopped unconfirmed ILD.

The new proposal has 39 optional inputs and 30 rules.

- Daily 45 mg; defined reductions 30 mg then 15 mg. Grade2 diarrhoea not improving to grade≤1 **within 24 h despite treatment** or grade 2 skin symptoms persisting **72 h despite treatment** triggers a hold. Boundary checks include exactly24/72 h, below, above and missing supportive-treatment context.
- Recovered grade 2 diarrhoea/skin: same-dose versus lower-dose restart is a Consultant decision. Prior grade≥3 diarrhoea/skin requires recovery≤1 and one-level reduction. Other grade≥3 toxicity requires recovery≤2 then one-level reduction. These paths are kept separate.
- Initial Child–PughC source dose 30 mg; optional 45 mg after≥4 weeks if individually tolerated. Unknown initiation/current-dose context cannot automatically select a dose. Explicit initial-start context can carry 30 mg into the dose renderer; severe renal or other blocking review suppresses that numerical action. All simultaneous findings remain visible.
- Mild/moderate renal function CrCl≥30 needs no starting adjustment. CrCl<30 or dialysis has no established dosing recommendation. Normal aliases cannot erase an independently entered severe band/dialysis flag.
- NCCP requires ECOG 0–1, so ECOG≥2 now requests review. Confirm first-line scope and a validated activating EGFR result.
- Suspected ILD holds; confirmed ILD permanently stops at any grade. Pre-existing history is caution, not a listed absolute exclusion.
- H2-blocker timing conflict: NCCP says **≥6 h before or 10 h after**; EMA says **2 h before or≥10 h after**. Patient materials direct a written pharmacist-approved schedule and do not select a conflicting universal interval. PPIs should be avoided; CYP2D6 substrates require individual interaction review. The generic antiemetic document’s acid-suppression footnote does not override this medicine-specific interaction.
- NCCP explicitly uses CTCAE v4, replacing the inherited unsupported v5 labelling. Pregnancy/breastfeeding use SmPC precautions with review, not invented NCCP listed exclusions.
- Blood count, renal, liver and bone profile at baseline/regularly; no fixed interval invented. With or without food. Missed/vomited dose: no replacement, next prescribed dose next day. Women’s contraception≥17 days after treatment; no breastfeeding during treatment.

## Evidence and service authoring

Two complete targeted-service records include patient reference, anatomy, continuous oral timeline, review passport content, consent profile/aid content, supportive plan, logistics, longitudinal tests, clinician rationale and source-linked evidence. Patient metric arrays are deliberately empty; study numbers stay in clinician evidence.

Afatinib LUX-Lung 3 primary PFS 11.1 vs 6.9 months (HR 0.58) is distinct from mature overall-population OS 28.2 vs 28.2 months (not statistically significant). LUX-Lung 7 planned mature OS 27.9 vs 24.5 months was also not statistically significant; it compares gefitinib and is not evidence of superiority over modern therapies. Do not extend exon19 subgroup results to every mutation or import squamous post-platinum LUX-Lung 8 into NCCP 00221a.

Dacomitinib ARCHER 1050 primary PFS 14.7 vs 9.2 months (HR 0.59); extended OS 34.1 vs 27.0 months, HR 0.748, cutoff13 May 2019, median follow-up47.9 months. The comparator is gefitinib, the study excluded CNS-metastasis history and enrolled common Ex19del/L858R mutations. Dose-reduction subgroup associations do not establish causal survival benefit.

Both drugs are minimal-low oral emetic risk in current NCCP V6. Support uses individually selected as-required antiemetics, early diarrhoea/hydration support and skin/mouth care. No fixed cytotoxic NCIS prescription is copied.

## Migration and checks

Exact retained/replaced rule IDs and metadata choices are in migration.json. All four OF590 IDs are retained. organ_function_reconciliation metadata is preserved; this release’s source audit supersedes old action wording without falsely assigning a new NCCP version.

`node validation/targeted-lung-v08425/egfr/source-cases.cjs` passes **474/474** source-derived checks using the real assessment engine and dose renderer. Includes blank inputs, threshold edges, suspected/confirmed diagnoses, discordant aliases, dose/recovery history, concurrent limitations, evidence, provenance and full-suite schema. `--integrated` checks canonical proposals after root’s null-to-empty normalization. These are software checks, not clinical validation.

Integrated canonical validation completed successfully: **474/474**, with all independent review flags still false.
