# Lutathera / PRRT 00642 source audit — v0.84.37

The clinician schedule panel now has a source-backed structured component: 7,400 MBq by IV infusion on Day 1, every 56 days for four administrations, over approximately 30–40 minutes. Four additional regressions prove that the reference schedule renders and that its activity cannot replace a hold, permanent stop or specialist-only restart decision.

The original assessment contained 12 rules. The revised assessment contains 86 rules and retains partial assessment: an absent result is unassessed, not normal. All activity changes remain decisions for the authorised PRRT service. No assessed result automatically calculates a patient-specific MBq prescription.

Four current official sources were retrieved on 5 November 2026 and retained with hashes in `source-manifest.json`: the current catalogue-linked NCCP 00642 v2 (revision 27 May 2025), EMA product information updated 14 August 2026, and the Irish HSE long and short patient leaflets linked by the national PRRT service page. The two leaflets have internal file modification dates of November 2023; these are file metadata, not claims of a current clinical review. Transient retrieval failures resolved on normal retries. No source retrieval remains blocked.

The most consequential corrections are:

- **Supportive care:** the previous mapping classified PRRT as minimal emetic risk with no routine prophylaxis. NCCP identifies moderate risk and requires a 5-HT3 antagonist before the amino-acid infusion. The new dedicated PRRT script avoids importing a generic dexamethasone-containing moderate-risk plan. Renal-protective lysine/arginine, potassium checks, and the full amino-acid dose after a reduced PRRT infusion are explicit.
- **Renal decisions:** a mixed eGFR/CrCl 30–49 category could not represent the actual source boundaries. The tool now uses Cockcroft–Gault CrCl with actual body weight, distinguishes the below-30 contraindication from baseline 30 to below 40 being not recommended, and tests changes from the patient's pretreatment baseline. A 40% creatinine rise or CrCl fall can require withholding even when the current absolute CrCl remains above 40.
- **Marrow decisions:** platelet and neutrophil thresholds, life-threatening anaemia, and the isolated-lymphopenia exception were absent. Their recovery and recurrence pathways are now explicit. A normal current count cannot erase a previous qualifying recurrent event.
- **Hepatic decisions:** bilirubin above 3×ULN and albumin below 30 g/L together with INR above 1.5 are assessed directly. Baseline benefit–risk review is separated from treatment-emergent withholding.
- **Treatment history:** first qualifying toxicity, incomplete recovery, recurrent toxicity, documented previous activity and prolonged interruption now have separate outputs. The source's 3,700 MBq restart and possible subsequent 7,400 MBq return are explained as specialist options, without automatically authorising either.
- **Eligibility and administration:** adult G1/G2 GEP-NET, SSTR imaging, previous SSA treatment, ECOG, surgery, pregnancy, marrow radiation, heart failure, SSA withholding, hormonal crisis, significant intercurrent illness and the 12-week major-surgery interruption are addressed.

## Source disagreements retained

| Issue | Sources | Implementation |
|---|---|---|
| Platelets exactly 75 ×10⁹/L | NCCP Table 3 prints grade 2 as 50–75; its caution section and EMA use below 75. | Explicit specialist review at 75; below 75 is withheld. No inferred grading or automatic restart at the disputed boundary. |
| ANC decimal boundary | NCCP prints 0.5–0.99 for grade 3; EMA uses below 1 to 0.5. | The continuous EMA below-1 band prevents a 0.99–1.0 gap. |
| Maximum interruption | NCCP tables say a treatment delay of 16 weeks or longer; its schedule permits an interval up to 16 weeks. EMA says a dosing interval beyond 16 weeks. | Total elapsed interval is explicitly requested. At exactly 16 weeks, specialist reconciliation is required. A toxicity-related interval beyond 16 weeks triggers stopping. Extra delay is never silently confused with the total interval. |
| Amino-acid lead time | Current NCCP and EMA say 30 minutes; the older HSE long leaflet describes approximately one hour. | Current NCCP/EMA timing governs the authored regimen; patients follow their service's booked procedure. |
| Blood tests after completion | NCCP: four-weekly for at least three months, then three-monthly for the following year. HSE long leaflet: fortnightly for eight weeks. EMA later follow-up is six-monthly. | Retain the NCCP monitoring schedule and explain that the Irish service may arrange more frequent early checks. Do not reduce monitoring to the less frequent EMA schedule. |
| SSA lead time | NCCP/EMA say 30 days for long-acting SSA; HSE leaflets say ideally four weeks and explicitly reserve the decision to the referring NET consultant. | Thirty-day assessment threshold; the patient's written symptom-control and withholding plan remains essential. |
| Radiation precautions | Irish service leaflets give contact and sleeping restrictions extending to three weeks; generic EMA defaults differ. | Written medical-physics instructions and the official radiation card govern. The SACTCheck wallet is supplementary. |
| Disease monitoring | NCCP leaves imaging and markers to the consultant. The Irish long leaflet describes particular dosimetry and CT/MRI appointments. | These are labelled service plans, not universal NCCP testing requirements. |

## Verification

`source-cases.cjs` executes 405 source-based cases through the actual assessment and dose-output engines: 405 pass and all 86 new rules are exercised. The same tests against the retained original protocol pass 239 and fail 166. Those figures include checks for explicit source rule provenance, so **166 is not a count of distinct clinical defects**.

`semantic-comparison.cjs` separately compares clinical action results without relying on new rule identifiers. Its results are retained in `semantic-action-comparison.json`. This distinguishes corrected behaviour from renamed rules and includes retained historical renal, liver and haemoglobin decisions.

`source-criteria-matrix.json` covers 39 source criteria, including requirements implemented as monitoring or specialist-service narrative rather than invented numerical rules. `rule-source-matrix.json` maps every executable rule to its source and passing cases. The strict protocol validator passes with zero errors and zero warnings. NCCP Tables 3 and 5 and EMA Table 3 were also visually inspected as rendered PDF pages.

Shared supportive-care maps, knowledge, consent, patient documents, release wiring and overall regression validation are integrated by the parent release task. This scoped audit does not establish that those independent release checks passed. Consultant, oncology-pharmacy and patient/PPI review remain pending; no clinical-use approval is asserted.
