# AC/taxane family source audit — 17 October 2026

Research reconciliation of seven live official NCCP PDFs. The linked PDF URLs were verified against the current HSE breast SACT catalogue. This is not consultant or oncology-pharmacy validation. The detailed JSON records all source hashes, dose tables, phases, monitoring, findings and 328 proposed acceptance cases. No application files were changed.

## Phase and monitoring map

| Code | Source version / amendment | Cytotoxic sequence | Trastuzumab | Blood tests | Cardiac monitoring in this PDF |
|---|---|---|---|---|---|
| 00252 | v7 / 22 May 2026; last clinical review 12 May 2021 | AC 60/600 mg/m² every 21 days ×4 | None | Baseline and regular FBC, renal and liver profiles; repeat frequency not quantified | Baseline ECG; MUGA/ECHO if >65 years or clinically indicated; repeat when indicated |
| 00260 | v7 / 22 August 2025 | AC every 21 days ×4 → paclitaxel 80 mg/m² weekly ×12 | None | Baseline and regular profiles; repeat frequency not quantified | Baseline ECG/MUGA/ECHO wording groups age >65 and clinical indication ambiguously; repeat when indicated |
| 00278 | v7 / 22 September 2023 | AC every 14 days ×4 → paclitaxel 175 mg/m² every 14 days ×4, starting 14 days after last AC | None | Before each cycle | Baseline ECG; MUGA/ECHO if >65 or indicated; repeat when indicated |
| 00316 | v6 / 13 May 2025 | AC every 14 days ×4 → paclitaxel 175 mg/m² every 14 days ×4, starting 14 days after last AC | Starts with taxane: 4 mg/kg load then 2 mg/kg weekly ×8 weeks; then 6 mg/kg every 21 days to complete one year total | Before each cycle | Baseline ECG; baseline echo omitted from tests subsection. During trastuzumab: ECHO/MUGA every 12 weeks, 4–8 weeks if impairment signs |
| 00432 | v5 / 11 August 2025 | AC every 21 days ×4 → paclitaxel 80 mg/m² weekly ×12 | 4 mg/kg load then 2 mg/kg weekly with taxane; then 6 mg/kg every 21 days to complete one year total | Baseline and regular profiles; repeat frequency not quantified | Baseline ECG, echo if >65 or indicated; trastuzumab ECHO/MUGA every 12 weeks, 4–8 weeks if impairment signs |
| 00433 | v6 / 13 June 2025 | AC every 14 days ×4 → paclitaxel 80 mg/m² weekly ×12 | Same weekly 4/2 schedule and later 6 mg/kg every 21 days | Baseline and regular profiles; repeat frequency not quantified | Baseline ECG, echo if >65 or indicated. Regular tests only say clinically indicated; **no fixed 12-week interval is printed** |
| 00745 | v2a / 22 April 2025 | AC every 14 days ×4 → paclitaxel 80 mg/m² days 1,8,15 of 21-day cycles ×4, beginning 14 days after last AC | Starts with taxane: 8 mg/kg load then 6 mg/kg every 21 days; continue to complete one year total | Before each cycle | Baseline ECG and ECHO/MUGA with LVEF >50%; ECHO/MUGA every 12 weeks, 4–8 weeks if impairment signs |

AC means doxorubicin 60 mg/m² plus cyclophosphamide 600 mg/m². The 450 mg/m² doxorubicin lifetime limit must account for previous exposure. All dose-dense chemotherapy in 00278 and 00316 requires G-CSF. In 00433 and 00745 the mandatory dose-dense requirement applies to AC, not automatically to every subsequent weekly taxane dose. AC is high emetogenic risk, paclitaxel low, and trastuzumab minimal: separate phase prescriptions and patient explanations are necessary.

## Differences that must survive reuse

1. **Cyclophosphamide renal rules:** 00252 and 00278 use CrCl >20: 100%; 10–20: 75%; <10: 50%. 00433 retains >20/10–20 but says omit below 10 (50% only if unavoidable). 00260, 00316, 00432 and 00745 use ≥30/10–29/<10; below 10 is not recommended/omit, with the exceptional 50% option explicitly qualified. Do not copy one family's renal rule into the others.
2. **Doxorubicin liver rules:** 00252/00278 use bilirubin 20–51: 50%; 51–85: 25%; >85: omit, plus AST 2–3× normal: 75%, >3× ULN: 50%. Exactly 51 overlaps. Other audited regimens use bilirubin 20–50: 50%; 51–86: 25%; >86 or Child-Pugh C: omit/not recommended, and no AST bands in the updated tables. Absolute bilirubin is required; the existing 00252 >3×ULN omission rule is unsourced.
3. **Paclitaxel hepatic bands:** ALT <10×ULN is required for all numerical doses; bilirubin ≤1.25, 1.26–2 and 2.01–5×ULN map to 80/60/40 mg/m² for weekly treatment or 175/135/90 mg/m² for fortnightly treatment. ALT ≥10 or bilirubin >5 independently makes paclitaxel not recommended. Decimal gaps need explicit review, not rounding by stealth.
4. **Trastuzumab cardiac rule:** 00316 says hold after an LVEF fall ≥10 percentage points without requiring the current LVEF to be below 50%. The other three HER2 combinations require both the ≥10-point fall and current LVEF <50%. This is a source difference, not a licence to silently harmonise.
5. **Cytotoxic blood counts must not reduce trastuzumab.** Its adverse-event table explicitly allows continuation during reversible chemotherapy-induced myelosuppression with careful monitoring. The old whole-regimen actions do not distinguish this.
6. **00433 has a specific stopping condition:** intolerance after two dose reductions or delay longer than two weeks leads to stopping paclitaxel. The other weekly AC-TH source instead says discuss continuation with the treating clinician after two reductions.
7. **00433 LVEF eligibility differs:** EBC trastuzumab eligibility is LVEF >55%, with a clinical-judgement footnote for the trial range ≥50%. This must not become a flat 50% eligibility threshold.

## Visual table verification matters

Plain text extraction loses some underlines that change `>` to `≥`. The saved PNGs were checked directly:

| Code | Routine platelets threshold | Recovery after ANC delay | Recovery after platelet delay |
|---|---|---|---|
| 00278 | >100 | ≥100 | ≥100 |
| 00316 | >100 | ≥100 | ≥100 |
| 00432, AC | ≥100 | ≥100 | ≥100 |
| 00433, AC | ≥100 | ≥100 | >100 |
| 00745 | >100 | ≥100 | >100 |

Recovery ANC is >1, whereas the routine row uses ≥1. The 75% reduction after a second delay is positioned in the thrombocytopenia row. Exact platelet 100 cases are incomplete/conflicting in some sources and must be surfaced. Weekly taxane tables in 00260/00432/00433 also overlap at platelet 90 (both full-dose and delay rows). The initial baseline ANC exclusion of <1.5 is separate from later-cycle dose thresholds.

## Existing encoding findings

The six combination JSON files have only 4–5 executable rules and six inputs each. Their phase selector does not change rule conditions. They lack renal/hepatic, cardiac, eligibility, missed-dose and many toxicity rules; no structured treatment phases are present. The two HER2-negative AC-T files even offer an irrelevant trastuzumab-maintenance option.

00252 incorrectly delays platelets 70–74 by using <75 rather than <70; requires both intermediate blood values for its reduction rule; lacks the 10–20 CrCl band and AST reductions; and attributes pregnancy/lactation and diarrhoea/mucositis dose rules to NCCP pages that do not contain them. Supplemental rules need their own verified source.

## Longitudinal content boundaries

00252 explicitly places radiotherapy after chemotherapy if radiotherapy is required. These PDFs do not specify routine CT/TAP, tumour-marker, DEXA or a complete post-treatment surveillance programme. Baseline and repeat cardiac assessments can be supplemented from current trastuzumab product information/cardio-oncology guidance, with the additional source made explicit. The 00433 source alone cannot support a 12-week echo claim.

The schedule is a date-free education map. Illustrative cycle labels must preserve elapsed time across transitions. One year of trastuzumab starts at the first trastuzumab administration; it is not a new year after cytotoxic chemotherapy ends. Ports/PICCs may be discussed as team-selected access but are not mandated in these PDFs. No take-home infusion pump is specified for these regimens.
