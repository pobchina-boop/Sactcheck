# NCCP00319 carboplatin + oral etoposide audit — v0.84.23

Checked 26 October 2026 against current NCCP00319 **v5**, revised 12 September 2025, review due 12 September 2030, six pages. The canonical `nccp-00319-v5` identifier and filename are retained. Proposed implementation: **37 executable rules, 29 optional inputs; 155/155 source-based checks passed**. Software reconciliation is complete within the bounded component. Independent consultant, oncology-pharmacy and patient/PPI approval remain pending; clinical-use authorisation remains false.

## Source inspection

The complete current PDF was retrieved from the official URL, extracted with `pdftotext -layout` and read. Pages 1–4 were rendered and visually inspected: treatment/route, Calvert guidance, counts, renal/hepatic and adverse-event tables. NCIS Medical Oncology V8 pages 4–5 were also rendered and visually inspected. PDF/text hashes are in `sources.json` and protocol metadata. Raw PDFs, extracted text and render images are research working material, not release deliverables.

The initial web text extraction omitted underlines under `>` in the adequate-count row. Visual inspection confirms **ANC ≥1.0 AND platelets ≥100**, not strict greater-than signs. Those exact boundaries do not produce invented ambiguity findings. The **platelet 50 to <75** gap remains real in the visual source.

## Scope and source fidelity

| Domain | Current source | Encoding / handling |
|---|---|---|
| Indication | Extensive-disease SCLC, 00319a; unsuitable for cisplatin | Explicit indication and cisplatin-suitability inputs; out-of-scope choices require review |
| Performance status | ECOG0–2, or0–3 when age<70 | Age-aware ECOG3 assessment; missing age cannot establish eligibility |
| Course | Carboplatin Day1; oral etoposide Days1–3; 21-day cycles until progression or unacceptable toxicity | No borrowed IV etoposide schedule and no invented 4–6-cycle cap |
| Dose/route | Carboplatin AUC5,500mL glucose5%,30-minute IV infusion, before etoposide. Etoposide100mg/m² **per dose, twice daily** orally Days1–3, empty stomach | Explicit real-engine schedule includes frequency and all three days. Pharmacy determines capsule count/rounding; no IV-to-oral conversion |
| Exclusions | Component/excipient hypersensitivity, pregnancy, breastfeeding | Independent optional inputs. Mild carboplatin-reaction exception described as specialist controlled desensitisation, never automatic clearance |
| Adequate counts | ANC≥1 AND platelets≥100 | Exact visually verified boundaries; partial normal entries never clear whole regimen |
| Intermediate counts | ANC0.5–<1 and/or platelets75–<100 | Delay one week until recovery |
| Severe counts/FN | ANC<0.5 or neutropenic fever and/or platelets<50 | Delay; *consider*25% reduction with consultant. No automatic percentage computation |
| Unassigned count band | Platelets50–<75 not represented in Table1 | Consultant/pharmacy review, no assumed full dose or invented adjacent row |
| Calvert | AUC×(GFR+25), GFR capped125, measured GFR preferred | Exact continuous GFR metadata; high entry prompts cap verification, no patient-specific dose calculator |
| Carboplatin renal | ≤20 no administration;20–≤30 extreme caution;CrCl<60 higher marrow risk | ≤20 prohibition controls overlap at20. >20–≤30 review; increased-risk finding never overrides a restriction |
| Renal sample | Estimated dose uses creatinine within48h; isotope dose can remain only while creatinine≤110%of baseline | >48h and>110% exact boundaries assessed; method-specific context retained |
| Estimate limitations | Obesity/low creatinine may overestimate GFR; measured GFR preferred | Independent concern flag. Optional source weight/creatinine methods require specialist selection, no invented numerical calculator |
| Etoposide renal | >50 unchanged;10–50 inclusive75%original, increase if tolerated; haemodialysis consider75%, not dialysed | Exact numeric CrCl added; no numeric extrapolation below10; dialysis does not authorise carboplatin |
| Etoposide hepatic | Bilirubin<50µmol/L AND normal albumin AND normal renal function: no adjustment expected. Bilirubin≥50 OR low albumin: consider50%, increase if tolerated | Absolute bilirubin, albumin and renal-context inputs; abnormal bilirubin or low albumin independently actionable. Optional50% remains consultant review |
| Other toxicity | Grade≥3 excluding mucositis/alopecia: delay until Grade1, then75%both drugs | Explicit exclusions; severe mucositis gets review with no borrowed75% rule. Source does not name a grading edition; generic CTCAE5 removed |
| Monitoring | Baseline blood/renal/liver, isotope GFR preferred, audiology if indicated; weekly FBC prior to treatment; renal/liver before each cycle; regular neurological/hearing review | Carried into patient guide, clinical knowledge, journey, logistics and oral adherence review; no fixed universal scan schedule |
| Support | Carboplatin high; oral etoposide minimal–low; usually no premedication except prior hypersensitivity | Separate Day1 and Days2–3/post-treatment plans; dedicated carboplatinAUC≥4 NCIS row plus multi-day principle |

Every independently actionable known field can produce a finding without unrelated mandatory data. Legacy fields remain accepted. The old `etoposide_renal_band` includes ranges crossing the current10/50 boundaries, so ambiguous old bands require exact CrCl; `15_49` remains within the75%band. Legacy bilirubin×ULN does not substitute for the current absolute50µmol/L threshold. The old infection/FN combined field does not automatically manufacture a confirmed neutropenic-fever dose reduction.

No percentages are multiplied across organ-function and toxicity findings. `dose_calculation: specialist_review` prevents misleading final doses where original/current dose, tolerance, capsule rounding, competing reductions or consultant choice must be reconciled. Exact reference percentages remain visible in the action text.

## Oral education and evidence

The prescription is clearly mixed-route: Day1 IV carboplatin and twice-daily oral etoposide on Days1–3 only. Patient content includes empty-stomach use, pharmacist-confirmed capsule strengths/count/timing, adherence record, whole-capsule handling, storage, leakage, return of unused medicine and team contact. It contains no automatic replacement, extension or IV/oral conversion instructions.

The manufacturer leaflet supports taking the next scheduled dose after a missed dose and no doubling. BC Cancer explicitly advises no second dose after vomiting within one hour without team advice. Sources give different catch-up windows and product-specific storage details; the suite does not import BC Cancer catch-up windows or US product refrigeration instructions. Supplied-product instructions and the treating team's written plan govern. Macmillan's current capsule advice confirms not chewing, opening or crushing. Source links are explicitly attributed.

Johnson1991 (PMID1845847) is a randomised83-patient study of **cisplatin** plus IV etoposide versus **cisplatin with Day1 IV/Days2–3 oral etoposide**, repeated every four weeks, including limited and extensive disease. It is not this carboplatin/all-oral/21-day regimen. COCIS2012 (PMID22473169) compares platinum choice across four trials/663patients, not the exact oral schedule. Consequently, patient metrics and regimen-specific clinical endpoint arrays are empty. Qualitative evidence describes the applicability limits and differing toxicity profiles; it assigns no direct survival estimate to00319.

The current manufacturer oral etoposide SmPC differs from the NCCP2025 regimen in general renal/count advice:15–50 versus NCCP10–50 renal band, and a general pretreatment ANC1500cells/mm³ threshold versus the specific NCCP Table1. NCCP explicitly states it adopted Giraud2023 IV-etoposide renal/hepatic recommendations with lead-reviewer agreement. This discrepancy is visible in the clinical selection cautions and requires pharmacy reconciliation; tables were not silently merged.

## Support reconciliation

NCIS Medical Oncology **V8**, dated10 February2025, is distinct from the V6 nausea/vomiting classification document cited in the regimen. V8's dedicated carboplatinAUC≥4 row is aprepitant125mgDay1/80mgDays2–3, ondansetron16mgDay1, dexamethasone12mgDay1/8mgDays2–4 and subsequent metoclopramide10mg three times daily. It has no routine olanzapine row entry. It does not specify a metoclopramide end day or PRN qualifier.

V8p5 requires daily risk-appropriate prevention during multi-day SACT and for two days afterwards. Thus Day1 high-risk carboplatin, Days2–3 minimal–low oral etoposide and the Day4–5 support tail are explicit. The tool does not invent a universal Day5drug/dose, extend every high-risk medicine, duplicate steroids or borrow the five-day cisplatin aprepitant exception. The prescriber/pharmacist must reconcile one written schedule. This is the intended dedicated-script mapping, with independent pharmacy validation pending.

## Integration instructions

1. Copy `proposed/00319-carboplatin-and-oral-etoposide-therapy-21-day.json` to the canonical lung protocol path.
2. Merge `authoring.json.regimens['00319']` into the v0.84.23 authoring record. Its schema follows v0.84.22 entry00318. Route is **`mixed_oral_iv`** and `include_in_breast_selector` is false.
3. Reuse dedicated `nccp-v8-carboplatin-v08420` Day1 risk script; display both authored support plans. Ensure phase support links and generic risk UI do not flatten the multi-day distinction.
4. Shared oral builders must render etoposide twice daily Days1–3, no capsules afterDay3, and no fixed cycle count. The real dose/schedule model already reports100mg/m²twice daily with days1,2,3.
5. Shared consent profile needs IV-specific etoposide hypotension/infusion-reaction wording, while retaining general allergy risk for capsules. Do not remove carboplatin's infusion-allergy risk. Root owns this shared edit.
6. Root runs service builders, patient/consent/knowledge/support paths, screenshots and PDF/QR/boundary checks. This bounded task did not mutate live/shared files or produce release PDFs.
7. Run `node validation/lung-next-v08423/oral-etop/source-cases.cjs --integrated` after copying. Default mode runs the proposed protocol; results are written separately. All155tests passed in proposed mode. The checks cover positive/negative decisions, numeric boundaries, absent context, single entries, source-ID integrity, schema, oral schedule and support separation.

No commit, push or deployment was performed by this bounded component.
