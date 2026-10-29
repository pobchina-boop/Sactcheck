# NCCP 00689 source and full-suite audit — v0.84.23

Checked 2026-10-26 against the current NCCP **v4**, 13-page PDF. This is a source reconciliation and software/content audit. Independent consultant, oncology-pharmacy and patient/PPI review remain pending; all clinical-use authorisation flags remain **false**.

## Deliverables and integration

- `proposed/00689-atezolizumab-carboplatin-etoposide.json` replaces the same canonical live filename. Canonical `nccp-00689-v4` and original input keys remain. There are **81 rules and 80 optional inputs**.
- `authoring.json` contains the complete `{regimens:{"00689":…}}` entry for the v0.84.22-style builder: patient, clinical, evidence, journey, selector, phase/day support, route and risk. It deliberately excludes the breast selector. Eight patient chapters, eight existing-visual anatomy regions, four passport groups, two phases and three support plans are authored.
- `sources.json` identifies the downloaded PDF, text hash, primary trial analyses and current NCIS source. Raw sources and table renders are under `research/`.
- Run `node validation/lung-next-v08423/atezo/source-cases.cjs` before integration, then the same command with `--integrated` after the root agent copies the proposed canonical file. **273/273 proposed cases pass**, including strict validator (zero errors/warnings), real assessment engine, schedule viewer and content contracts. The harness writes mode-specific result JSON.
- Root owns live integration, shared builders, clinical/consent registrations, published website/PDF generation and release package. This bounded task edits no live/shared files.

## Source retrieval and visual findings

Official regimen: https://healthservice.hse.ie/documents/6882/689_V4_Atezolizumab_Etoposide_CARBOplatin.pdf

The complete PDF was downloaded and converted to text. Tables 1–7 were visually checked on pages 2, 3, 6, 7, 8, 9 and 10. The saved high-resolution `research/count-table.png` is important: extraction loses the line beneath greater-than symbols. The full-dose row is **ANC ≥1.0 AND platelets ≥100**, not strictly greater. Exactly 1.0 and 100 must not be invented gaps. **Platelets 50–<75 remain genuinely unassigned**; the implementation requests consultant/pharmacy direction without inventing a percentage.

NCCP NCIS Medical Oncology antiemetics **V8, 10 February 2025** was separately downloaded and Table 1/page 4 plus the multi-day note/page 5 visually checked. Saved `ncis-4.png` and `ncis-5.png` show the dedicated carboplatin AUC≥4 row and the per-treatment-day/two-days-after principle.

## Clinical source coverage and corrections

| Source area | Reconciled behaviour |
|---|---|
| Indication/eligibility, pp1,5 | Adult first-line ES-SCLC, no prior systemic therapy for ES-SCLC, ECOG0–1 and adequate organ/marrow function. Source exclusions and autoimmune caution represented. Prior anti-PD-1/PD-L1 requires review of linked guidance, not invented automatic eligibility. |
| Chronic immunosuppression, p5 | Explicit medical-condition context distinguishes immunosuppressive therapy from short antiemetic dexamethasone. A dose of steroid alone never creates the source exclusion. |
| Treatment Tables1–4, pp1–3 | Four 21-day induction cycles, then atezolizumab-only 21-day maintenance until progression/unacceptable toxicity. IV atezolizumab1200mg and SC1875mg are explicit alternatives; neither dose is converted into the other. The dose viewer displays both. |
| Etoposide formulation, pp2–3 | Reference IV100mg/m² Days1–3. Alternative Day1 IV then100mg/m² **twice daily orally** Days2–3, empty stomach. Capsule quantities require the prescription; no mg-for-mg substitution. Patient materials explain both; no four-week calendar conversion is offered. |
| Alternative maintenance, pp1,3 | Atezolizumab1680mgIV every28days is a separate NCCP00593 prescribing decision. This suite remains the21-day reference. Missed-dose wording preserves the source3-week interval. |
| Counts Table5, p6 | ANC0.5–<1 and platelets75–<100 delay one week until recovery. ANC<0.5, neutropenic fever or platelets<50 delay and **consider**25% chemotherapy reduction. The optional reduction is not automatically prescribed. Platelets50–<75 are a source-gap review. |
| Phase handling | Independent actionable cytotoxic values with phase omitted produce a phase-review finding. Explicit maintenance never produces carboplatin/etoposide dose actions. Abnormal maintenance results still prompt clinical assessment. Urgent immune rules survive unrelated invalid or missing inputs. |
| Carboplatin renal, pp4,7 | GFR≤20: do not administer; >20–≤30: extreme caution; CrCl<60: increased marrow risk. GFR cap125, measured GFR preferred, formula creatinine within48hours and isotope-reference creatinine≤110% represented. Method context is explicit and no final Calvert dose is calculated. |
| Etoposide renal, p7 | Exact CrCl10–50 has the75%-of-original reference; >50 no adjustment expected; non-dialysis<10 unassigned. Dialysis: not dialysed, consider75%. Simultaneous renal/hepatic changes and existing lower doses require reconciliation, not multiplication or automatic escalation. |
| Legacy renal compatibility | Old `etoposide_crcl_ml_min` band tokens and dialysis side effect are retained. New `etoposide_crcl_exact_ml_min` accepts verified numeric values and decimal boundaries. Both paths can raise adverse findings; conflicting bands/exact values raise a dedicated review and no reassuring field erases the other. Legacy representatives are not patient GFRs or dose-calculator inputs. |
| Hepatic Table6, p7 | Bilirubin≥50µmol/L OR reduced albumin: consider50% etoposide, increase only if tolerated and prescribed. Bilirubin<50 is not alone sufficient for the no-adjustment row; normal albumin and normal renal function are also required. |
| Baseline organ impairment, p7 | Atezolizumab Table6 says no adjustment needed/expected in renal and hepatic impairment including dialysis. Clinical text separates this from immune injury; it does not impose an unsupported renal dose reduction. |
| Immune laboratory attribution | Previous isolated ALT/AST, bilirubin or creatinine could automatically permanently stop atezolizumab. Now confirmed immune attribution is required for that pathway; unexplained/suspected abnormalities prompt timely review before further treatment. Baseline or established alternative cause does not diagnose immune injury. |
| Pneumonitis, hepatitis, colitis, rash, nephritis | Source hold/stop thresholds and boundaries retained, with Grade0–1 recovery within12weeks and ≤10mg/day prednisolone-equivalent conditions in relevant restart text. No automatic restart clearance. |
| Endocrine Table7 | Symptomatic thyroid pathways distinguish decreasing TSH on replacement from controlled hyperthyroidism with improving function. Adrenal insufficiency/Grade2–3 hypophysitis include stability on replacement. Grade4 hypophysitis permanent-stop is added. Type1 fasting glucose>13.9mmol/L requires immune diabetes context and control on insulin before resumption. |
| Neurological Table7 | Existing generic Grade≥2 stop omitted Grade1 serious syndromes and overgeneralised facial paresis. Any-grade myasthenic syndrome/gravis, GBS or meningoencephalitis now stops; facial paresis Grade1–2 holds until full resolution (stop if not fully resolved), Grade3–4 stops; myelitis Grade2–4 stops. |
| Pancreatic Table7 | Grade2–3 pancreatitis or clinician-graded Grade3–4 immune enzyme elevation>2×ULN holds. Isolated enzyme elevation does not diagnose pancreatitis. Grade4 or **any recurrent pancreatitis** stops. Restart wording preserves the source enzyme/symptom alternatives. |
| Other organ Table7 | Myocarditis≥2, myositis4/recurrent3, pericardial≥2 and suspectedHLH stop; pericardial1 holds with cardiac assessment; myositis2–3 holds. Recurrent Grade3 myositis has its own input rather than borrowing an unrelated recurrence. |
| Other immune/endocrine exception | Other Grade4/recurrent3 has the controlled-endocrinopathy exception. Missing exception context yields hold/review rather than an unjustified permanent-stop decision. Specific organ-stop findings still apply. |
| Infusion/SC reactions | Responsible medicine is explicit. Unattributed combination reaction prompts interruption/review; it cannot permanently stop atezolizumab merely because another medicine caused it. Atezolizumab Grade1–2 route-appropriate interruption/rate action and Grade3–4 permanent stop retained. No IV rate advice is silently applied to a SC injection. |
| Grading provenance | Source says **current NCI-CTCAE without naming an edition**. `ctcae_version` is omitted; source-specific metadata states edition unspecified and that this is not a complete grading table. Generic CTCAE5 descriptions are removed. Source-defined stool/life-threatening descriptors retained. |
| Partial assessment | Removed cycle-number-only fallback proceed. Every input optional with explicit `demo_value`. A blank form does not assess suitability. Legacy non-decision context inputs remain compatible; no universal cortisol/ACTH/scan interval is invented. |

## Full-suite content

Patient guide, consent support, knowledge base, anatomy risk content, passport and treatment journey share the same phases and explicit route choices. Induction is approximately12weeks for four21-day cycles if there are no delays; maintenance has no fixed total duration in NCCP00689. Baseline FBC/renal/liver/glucose/thyroid/hepatitisB/C and renal assessment are distinct from cycle bloods and thyroid every3–6weeks. Scans follow the consultant plan. Urgent symptoms link to the current HSE chemotherapy page; delayed immune effects and the immunotherapy alert card remain visible after chemotherapy and after final treatment.

Agent explanations are regimen-specific: PD-L1 immune inhibition for atezolizumab, platinum DNA damage for carboplatin and topoisomeraseII/DNA injury for etoposide. Separate risks cover immune organ inflammation/lasting hormone replacement, marrow suppression/infection/bleeding, nausea, hair loss, mouth/bowel symptoms, infusion reactions and etoposide hypotension. The already published anatomical visual is reused; no new image is generated.

Support uses `nccp-v8-carboplatin-v08420` for induction Day1 AUC5, without silently importing the generic HEC olanzapine row. Etoposide Days2–3 has a separate low-risk reference and explicit overlap reconciliation plus cover for two days after the last chemotherapy day. The oral alternative needs an explicit local prescription. Atezolizumab-only maintenance has an empty routine-medicines list: no automatic chemotherapy steroid/aprepitant course, while required hormone replacement/tapers are not stopped by a generic maintenance instruction.

## Evidence interpretation

IMpower133 primary publication (Horn et al.,2018; DOI10.1056/NEJMoa1809064) and updated OS report (Liu et al.,2021; DOI10.1200/JCO.20.01055) were verified from primary publication/PubMed records. The clinical card distinguishes updated OS (median follow-up22.9months; descriptive updated analysis) from the2018 primary investigator-assessed PFS result. It gives population, arms, endpoint definitions, confidence intervals and analysis date/context.

The trial used **IV atezolizumab and IV etoposide**, not separately randomised SC/PO substitutions. NCCP-listed alternatives are identified without attaching a separately proven formulation-specific survival effect. No comparison ranks this regimen against another immunotherapy trial. Patient evidence metrics are empty and the explanation is qualitative; the medians are not personalised life expectancy or promised additional survival.

## Remaining review requirements

- Independent clinician/pharmacy verification of the unresolved platelet50–<75 and non-dialysis etoposideCrCl<10 source bands, combined organ impairment, route prescriptions and overlapping multi-day antiemetics.
- Clinical review of attribution, named-event grading and event-specific restart exceptions. The current-edition instruction is not an authored CTCAE5/6 conversion.
- Root-level generated-page/PDF, interaction, QR/download and broader regression checks after integration. Passing these source cases does not itself authorise clinical deployment.

Etoposide manufacturer product information was checked for the secondary-leukaemia warning; patient wording makes no unsupported frequency claim. The oral product source supports shared etoposide safety and is not used to overwrite the NCCP renal/count or IV-dose rules. Known dialysis uses its dedicated source row and is not labelled an undefined non-dialysis<10 band.
