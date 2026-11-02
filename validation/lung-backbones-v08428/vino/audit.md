# Vinorelbine/cisplatin source audit: v0.84.28

Checked 2 November 2026. Scope: NCCP 00339 v7 and 00343 v7, existing deterministic rules, treatment schedules, standalone clinical/patient authoring, phase support and source-based boundary cases. Independent clinical/pharmacy/PPI review remains pending; clinical use not authorised.

## Retrieval and limitations

- 00339 current official PDF: https://healthservice.hse.ie/documents/6918/339_Vin_30CIS_80.pdf . Web extraction returned six pages, v7, with June 2026 version-control amendment. Footer retains an older last-reviewed date; this audit records the printed version without interpreting that date as a fresh clinical review.
- 00343 current official PDF: https://healthservice.hse.ie/documents/6916/343_V7_Vin25Cis50.pdf . Six pages, v7, December 2025 substantive update; printed next-review date December 2030.
- Initial bare-URL requests returned HTTP403. The ordinary download=1 links with a standard browser User-Agent succeeded for both PDFs. Text was extracted locally and both page3 dose tables were rendered and visually inspected. Fresh SHA256 hashes are retained in proposal metadata and sources/manifest.json. The00339 liver row visually has no explicit AND/OR connector; review handling remains deliberate.
- Primary evidence: JBR.10 updated randomized adjuvant analysis https://pubmed.ncbi.nlm.nih.gov/19933915/ and original study-group schedule https://www.ctg.queensu.ca/public/asco/br10-asco-2004.pdf . Its 28-day split-cisplatin schedule is relevant to00343, not proof of identical outcomes for00339. No metastatic survival estimate is transplanted from adjuvant evidence.

## Material legacy corrections

Both existing records used generic copied pathways. ECOG2 was permitted despite source eligibility0–1. Adjuvant and advanced disease were merged into one indication. Actual infusion days, doses and four-cycle course were absent. Both had bilirubin-driven automatic permanent discontinuation unsupported by these source tables. The new proposals replace those rules, distinguish baseline neuropathy from treatment-emergent grading, retain recovery-dependent reductions and expose discretionary choices.

00339 differs from00343: Day1 low counts delay the cycle; later low counts omit vinorelbine. The Day15 footnote affects later cycles and uses a platelet threshold different from the current-dose table. The renal table leaves exactly60 and fractional gaps unresolved. Liver thresholds have no explicit AND/OR connector, so this encoding requests review instead of asserting a dose.

00343 now uses its separate ANC/history pathways. Prior fever/sepsis with ANC<1.5 or two consecutive weekly neutropenic holds alters later doses. The three-held-dose stopping criterion specifically requires ANC<1; it has its own input so broader neutropenic holds cannot accidentally trigger stopping. No generic platelet threshold has been invented where this table provides ANC rules only. Current renal bands and separately discretionary dialysis consideration replace legacy bands. Severe hepatic impairment is a clinical category with a possible66% dose, not a bilirubin-only irreversible stop.

## Patient service assets

Two standalone records include explicit treatment goal, weekly attendance, four cycles, regimen-specific anatomy, urgent symptoms, monitoring, seven knowledge chapters, evidence limitations, consent-support text, practical plan and staged treatment journey. No immune therapy, automatic postoperative immune therapy, folate/B12 or pemetrexed rash prophylaxis is inherited. Neither regimen automatically includes radiotherapy. The patient-summary contract has purpose, schedule, three phases, three preparation items, card schedule and card alert.

Cisplatin days use high emetic-risk support; vinorelbine-only days use minimal risk without automatic repetition of the cisplatin course. Aprepitant/vinca CYP3A interaction, constipation prevention, hydration and electrolytes require a reconciled local prescription. The five-drug high-risk antiemetic reference derives from retained NCISV8 content; no new independent antiemetic source download was completed for this bounded task.

## Verification

Run `node validation/lung-backbones-v08428/vino/source-cases.cjs` against proposals; add `--integrated` after owner integration. 232 cases pass: threshold boundaries, missing stage/history/day, independent restrictions, exact schedule, optional-input governance, complete source IDs and renderer authoring. This does not replace full-suite integration/PDF checks or independent clinical validation.
