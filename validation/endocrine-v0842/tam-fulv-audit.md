# Tamoxifen and fulvestrant source audit — v0.84.2

Checked 18 October 2026. NCCP 00253 v6 and 00361 v4 are both four-page documents. The renal/hepatic tables on page 2 were visually checked. Canonical identifiers and existing bookmark aliases remain intact. Independent clinical and oncology-pharmacy review are pending.

## Findings and corrections

- **00253 — Significant past thromboembolic disease was not encoded as an NCCP exclusion; only active/recent VTE was considered.** Added independent history exclusion, separate acute symptom pathway, and visible difference from the less restrictive product risk–benefit text. Source: NCCP p1; manufacturer SmPC §4.4.

- **00253 — Severe hepatic impairment previously produced only generic review without stating that treatment is not recommended.** Withhold for review with the exact no-recommendation source position; mild/moderate and renal/dialysis no-adjustment pathways kept separate. Source: NCCP p2 Table1.

- **00253 — No current QT-risk assessment or follow-up ECG timing was available.** Added risk-triggered ECG/electrolytes, repeat ECG at steady state (at least4weeks), and follow-up based on symptoms/interacting medicines; no invented QT numerical cutoff. Source: NCCP p2; current manufacturer SmPC §4.4.

- **00253 — Abnormal vaginal bleeding and generic CTCAE grade≥3 previously triggered an automatic treatment hold that NCCP does not specify.** Prompt gynaecology/individual toxicity review; retained explicit acute clot/SCAR/hepatic/pregnancy safety restrictions. Source: NCCP pp2–3.

- **00253 — Medicine review lacked coumarin interaction/INR, concurrent anastrozole, CYP3A4 induction and surgical risk distinctions.** Source-specific actions, no blanket warfarin contraindication for cancer treatment and no universal six-week perioperative stop rule. Source: Manufacturer SmPC §§4.3–4.5.

- **00361 — Only two legacy rules were present: generic grade3 haematology review and generic severe liver review. Child-Pugh B reduction was absent.** Replaced with22source-linked rules; Child-Pugh B shows250mg peradministration and Child-Pugh C gives no-dose exclusion. Source: NCCP pp1–3.

- **00361 — Dose schedule had no structured loading/ongoing phases.** Added500mg D1/D15 first28-daycycle, then D1q28 as currentNCCP; two5mL IMinjections taking1–2min each. Source: NCCP p1.

- **00361 — NCCP CPB250mg differs from EMA no adjustment for mild/moderate hepatic disease.** Keep NCCP recommendation explicit with product discrepancy and mandatory Consultant/pharmacy reconciliation in displayed explanation. Source: NCCP p2 Table1 versus EMA Faslodex §4.2.

- **00361 — IM bleeding/anticoagulant caution and nerve injury warning were missing.** Added named caution inputs; did not invent ANC or platelet hold thresholds. Numeric blood counts remain monitoring-only. Source: NCCP pp1,3.

- **00361 — Post-menopausal/ER/prior-endocrine eligibility and ECOG0–2 were not assessed.** Independent optional eligibility checks, no absent-as-normal assumptions; keep narrower NCCP indications visibly distinct from broader EMA endocrine-naive licence. Source: NCCP p1; EMA §4.1.

- **both — Source pagecounts incorrectly recorded6, with legacy source-maturity flags.** Current PDFs both4pages; metadata sourcechecked2026-10-18; independent clinical and pharmacy approval flags remainfalse. Source: CurrentNCCP PDFheaders and visualtablecheck.

## Source hierarchy and unresolved differences

For fulvestrant, NCCP assigns Child-Pugh B 250 mg per administration. The EMA product information recommends no adjustment in mild or moderate hepatic impairment, with caution. The decision output shows the NCCP dose and names this discrepancy; Consultant/pharmacy reconciliation remains necessary. Severe hepatic impairment is an exclusion in both.

NCCP explicitly uses 28-day fulvestrant cycles, including the extra day-15 dose in cycle 1. This is the timetable used for the card; the product information uses “one month”. The narrower NCCP post-menopausal, prior anti-oestrogen indications have not been expanded to all EMA-licensed uses.

Tamoxifen's significant thromboembolic-history exclusion is retained from NCCP even though product information for breast-cancer treatment uses individual risk–benefit wording. Warfarin use alone is not converted to the separate primary-prevention contraindication. For breast-cancer surgery, there is no universal six-week interruption rule.

NCCP recommends an annual gynaecological examination. ACOG distinguishes routine clinical care from automatic ultrasound or biopsy of the endometrium in asymptomatic, average-risk patients. New abnormal bleeding requires prompt investigation.

## Monitoring and longitudinal content

Tamoxifen: baseline blood count, kidney and liver profiles; ECG when indicated. In patients with QT risk, the current manufacturer information supports ECG/electrolytes before treatment and repeat ECG after steady state, at least four weeks, then according to risks or symptoms. Liver profile, INR and ophthalmic review are clinically indicated checks. Neither three-monthly CT nor tumour markers are automatically scheduled for asymptomatic adjuvant care.

Fulvestrant: baseline blood count, kidney and liver profiles; subsequent liver checks when clinically indicated. Injection visits assess tolerability, bleeding and nerve symptoms. No generic chemotherapy count thresholds, routine pre-injection full blood count, ECG or echo schedule has been imposed. Response scans follow the individual advanced-disease plan. The drug-specific NCCP document does not prescribe a fixed DXA interval.

## Verification

143/143 source-derived scenarios passed, including isolated inputs, no-input states, exclusions, bleeding/anticoagulation cautions, eligibility boundaries, current dose rendering, conflicting hepatic inputs and exact treatment phase schedules. Both protocols passed strict schema validation with zero warnings. The protocols contain 27 and 22 source-linked rules respectively.

Evidence files: `tam-fulv-source-cases.cjs`, `tam-fulv-source-cases-results.json`, `tam-fulv-patient-brief.json`, `tam-fulv-audit.json`.

Direct PDF downloads were unavailable; official PDF text and screenshot inspection were used. No PDF byte hash is claimed. This delegated audit did not perform an interactive browser walkthrough or independent clinical/pharmacy sign-off.

## Sources

- https://healthservice.hse.ie/documents/6357/253_Tamoxifen_Monotherapy.pdf
- https://healthservice.hse.ie/documents/6816/361_Fulvestrant_Therapy.pdf
- https://www.medicines.org.uk/emc/product/11608/smpc
- https://www.ema.europa.eu/en/documents/product-information/faslodex-epar-product-information_en.pdf
- https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2014/06/tamoxifen-and-uterine-cancer
