# Oral breast source audit — v0.84.19

Audit date: 25 October 2026. Frozen baseline: `6c1050b8a2ced301fe770fe67fd518b5a78566e5` (v0.84.18). Scope: NCCP 00605 talazoparib and 00720 neratinib only. Production files were not edited by this audit task. Consultant review, oncology pharmacy review and clinical-use authorisation remain false.

## Sources and inspection

| Source | Current retrieved version | Inspection |
|---|---|---|
| [NCCP 00605](https://healthservice.hse.ie/documents/6414/605_v2_Talazoparib_Therapy.pdf) | v2; 6 pages; published 1 May 2021; review 6 September 2028 | All pages; schedule and eligibility pp1–2; every table on p3; interaction, supportive and safety sections pp4–5. PDF table p3 inspected visually. |
| [NCCP 00720](https://healthservice.hse.ie/documents/6596/720_v2_Neratinib.pdf) | v2; 7 pages; published 9 February 2022; review 3 May 2029 | All pages; schedule p1, tests p2, all dose/organ/toxicity tables pp3–4, loperamide and inhibitor table p5, safety/interactions p6. PDF pp3–5 inspected visually. |
| [EMA Talzenna](https://www.ema.europa.eu/en/documents/product-information/talzenna-epar-product-information_en.pdf) | Current linked English product information, 64 pages | Breast monotherapy administration, CrCl intervals, hepatic handling, interactions, pregnancy/breastfeeding and EMBRACA. Prostate combination doses/evidence excluded. |
| [EMA Nerlynx](https://www.ema.europa.eu/en/documents/product-information/nerlynx-epar-product-information_en.pdf) | Current linked English product information, 33 pages | Organ impairment, contraindications, interactions and acid-suppression timing, adverse effects, reproductive advice, evidence. |

Original PDFs were successfully retrieved and hashed. `sources.json` records full SHA-256, byte count, URL, retrieval date, version, pages and inspected sections. Original PDFs/text and rendered table pages are in the separate `research-v19/oral/` scratch directory. No invented PDF hashes or document-version dates were used.

## Findings and proposed behaviour

| Area | Source-grounded finding | Proposed behaviour |
|---|---|---|
| Talazoparib renal UI | Baseline two-option selector collapsed all CrCl ≥15 to decision value15. The 0.75 mg starting band was unreachable from that UI. NCCP integer bands are clarified by EMA continuous boundaries. | Numeric CrCl; <15 no recommendation; 15≤CrCl<30 starting0.5 mg; 30≤CrCl<60 starting0.75 mg; ≥60 no renal reduction. Starting-dose text is not automatically applied as another toxicity reduction. Indexed eGFR is not substituted. |
| Talazoparib blood recovery | Hold Hb<8, ANC<1, platelets<50; respective restart thresholds ≥9, ≥1.5, ≥75. | Independent hold/restart inputs and exact boundary cases. Recovery prompts next-lower-current-dose review; missing recovery cannot clear. |
| Talazoparib grade3/4 toxicity | Withhold until ≤grade1, then consider lower dose or discontinuation. | Preserves discretionary choice; does not calculate a universal reduction. |
| Talazoparib hepatic / MDS | No hepatic adjustment for breast monotherapy; confirmed MDS/AML requires stopping. Current source has no fixed four-week cytopenia restart rule. | No imported prostate dosing or borrowed four-week rule. Suspected MDS/AML routes to investigation; confirmed disease permanently discontinues. |
| Talazoparib eligibility | Germline BRCA, HER2-negative, prior anthracycline/taxane or unsuitable, endocrine requirement if HR+, ECOG≤2, ≤3 advanced chemotherapy regimens; named platinum, cardiac, CNS and other exclusions. | Explicit eligibility/exclusion context and conservative review. |
| Neratinib count connective | Printed table uses ANC≤0.9 **and** platelets≤99. | Delay one week when both low. Discordant or absent counterpart produces review; source AND is not silently rewritten as OR. |
| Neratinib severe liver conflict | NCCP p3 permits33% original dose for Child-Pugh C; EMA contraindicates severe hepatic impairment. | Withhold and display source conflict; no computed33%/80 mg prescription. Independent oncology/pharmacy resolution required. |
| Neratinib severe renal conflict | NCCP expects no adjustment for CrCl<30/dialysis; EMA does not recommend use. | Withhold and display source conflict; no inferred full dose. |
| Neratinib diarrhoea timing | G2≥5 days and G3 between2 days and3 weeks depend on optimal therapy. G3≤2 and “between2” overlap exactly at2 days. | Explicit2-day review; duration/optimal treatment/complications collected. Grade2≥5 has no invented upper duration limit. Grade3>21 days and grade4 permanently stop. |
| Neratinib restart | Recovery≤7 days permits prior same dose; >7 reduced. Recurrence≥G2 at120 mg permanently stops. | Recovery grade/time/history required, no automatic restart. First episode at120 is distinguished from recurrence. |
| Neratinib hepatic toxicity | Source is ALT, not ALT/AST. G3 ALT>5–20×ULN or bilirubin>3–10×ULN; G4 above20/10. | Correct ALT label, explicit ULN boundaries and CTCAE4.0 provenance. RecurrentG3 after reduction permanently stops. |
| Neratinib other toxicity | Grade3 hold/recover within3 weeks then lower; grade4 stop; delay>3 weeks or intolerance120 mg stop. | General and retained hand-foot grade inputs use general pathway. Separate diarrhoea/hepatic tables take precedence through restrictive findings. |
| Oral interactions | Talazoparib P-gp next lower current dose; wait3–5 inhibitor half-lives before restoring prior dose. Neratinib strong/moderate inhibitor initial40 mg; moderate escalation80/120/max160 under supervision. | Review only; 40/80 mg history selectable, usual toxicity ladder remains240/200/160/120. Stopped inhibitor does not blindly reset an already reduced patient to240 mg. |
| Neratinib absorption | Avoid PPIs; neratinib≥2h before or≥10h after H2 blockers; separate antacids≥3h; avoid grapefruit/pomegranate. | Named interactions in assessment and service facts; no generic PPI supportive-care proforma. |
| Monitoring and support | Talazoparib FBC/renal/LFT q4weeks. Neratinib FBC monthly6months thenq3months; LFT week1/monthly3months thenq6weeks; cardiac/LVEF when clinically indicated. | Distinct patient timelines, no inherited trastuzumab echo calendar. Minimal/low oral emesis pathways; neratinib loperamide first dose, weeks1–2 4 mgTDS, weeks3–8 4 mgBD, weeks9–52 4 mgPRN, titrated1–2 stools/day. |
| Duration / adherence | Continuous talazoparib until progression/unacceptable toxicity; neratinib one year. | 28-day display is a review block without tablet-free interval. Whole formulation/food/missed-dose advice is medicine-specific. |

## Deliverables and test result

- `proposed/00605-talazoparib.json`: stable regimen identifier,36 inputs,45 source rules.
- `proposed/00720-neratinib-extended-adjuvant.json`: stable regimen identifier,44 inputs,55 source rules.
- `source-cases.cjs`: independent source-derived threshold, missing/partial context, contradiction, dose-model, eligibility and governance checks. It does not infer expected outcomes from proposed rule content.
- `baseline-results.json`:57/219 pass;162 failures document the pre-change gaps and conservative changes. This is a software expectation comparison, not162 distinct clinical errors.
- `proposed-results.json`:219/219 pass,0 fail.
- `service-facts.json`: machine-readable schedule, monitoring, support, administration, contraception, body-map and interaction facts, each with source links/pages/sections.
- `evidence.json`: EMBRACA primary PFS and final OS; ExteNET indication-matched descriptive subgroup iDFS, subgroup OS uncertainty and overall trial final OS; CONTROL tolerability context without replacing the NCCP schedule.

Run from repository root:

```sh
node validation/breast-final-v08419/oral/source-cases.cjs baseline
node validation/breast-final-v08419/oral/source-cases.cjs proposed
node validation/breast-final-v08419/oral/source-cases.cjs integrated
```

The integration owner must run integrated mode after copying proposals and complete the service/browser/PDF regression. No independent human clinical or pharmacy validation is implied by these automated results. The NCCP/EMA conflicts and exact2-day diarrhoea overlap remain explicitly unresolved; their review state is intentional.
