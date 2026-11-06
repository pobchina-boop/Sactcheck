# v0.84.42 immune source audit — 00105, 00535 and 00551

Audit date: 6 November 2026. Read-only baseline: `cd94a2043d59da86ffec3dbb63ac49df6399e112`, v0.84.41. This deliverable proposes three protocol JSON replacements for owner review; it does not publish or authorise clinical use. Independent clinical, oncology-pharmacy and patient/PPI approval remain pending.

## Source provenance and scope

All three metadata-linked legacy HSE addresses returned 403 to the initial direct retrieval. The current official HSE asset addresses below returned HTTP 200 and their complete PDFs are retained beside this report. The web retrieval also exposed the current official documents. A legacy-address failure was therefore resolved, not counted as source verification by inference.

| Code | Current document | Dates printed in source | Canonical retrieved PDF |
|---|---|---|---|
|00105|Version 7, 6 pages|Version 7 dated 24/02/2025; next review 24/02/2030|https://assets.hse.ie/media/documents/105_V7_Ipilimumab_.pdf|
|00535|Version 7, 9 pages|Last reviewed 29/06/2026|https://assets.hse.ie/media/documents/535_Avelumab.pdf|
|00551|Version 7a, 13 pages|Version 7 dated 11/02/2026; amendment 7a 20/08/2026; review 11/02/2027|https://assets.hse.ie/media/documents/551_Nivolumab_3mgkg_Ipilimumab_1mgkg.pdf|

SHA-256:

- 00105: `0676ee81b0e97531299b191a6775b3f41260a1ede29ae9661c96c628a602304f`
- 00535: `09b1334c7f203c91a799547b77746f308d38bb1b284797b026a65bf3e9f4792b`
- 00551: `6822cf3e3086fa9de1513ad982ff14b7238e5345e342a6c505cef5c5983c9c9b`

The full relevant treatment, eligibility, organ-function, toxicity, recovery, monitoring and supportive-care tables were read, including continuation pages and footnotes. Rendered source pages 00105 p3 and 00551 p8 were inspected to verify table grouping; PNGs are retained. `asset-retrieval.json`, `sources.json`, the PDF bytes, layout-preserving text and baseline protocol copies support reproduction.

## Findings and proposed corrections

| Code / source locator | Baseline finding | Candidate behaviour |
|---|---|---|
|00105 p1 eligibility|ECOG 2 escaped the old ECOG≥3 rule.|Review ECOG>1; retain adult scope and consultant assessment of baseline organ function without inventing universal count cutoffs.|
|00105 pp3–4 Tables 1–2|Only generic severe holds, with important permanent stops and named organs absent.|Grade 3–4 colitis/hepatitis/neuropathy and severe other immune events permanently stop; grade 2 hepatic/other moderate immune reactions hold. Grade 3 rash holds, grade 4 rash and grade 3 pruritus permanently stop.|
|00105 p3 Table 1|Grade 2 colitis control/persistence/recurrence absent.|Withhold when uncontrolled, recurrent or source-defined persistence of 5–7 days is confirmed. Otherwise review; do not invent one universal day threshold.|
|00105 pp3–4|Endocrine, eye and diabetes exceptions missing.|Severe uncontrolled gland toxicity holds; severe gland toxicity controlled with replacement is reviewed under the source exception. Grade 4 diabetes remains a permanent stop. Grade≥2 eye toxicity not responding to topical immunosuppression permanently stops.|
|00105 p3 neurological row|Duration and motor/sensory distinctions absent.|Grade 2 neurological symptoms lasting>4 days hold; ≤4 days or missing duration require review, not clearance. The printed duration attachment is not sufficiently precise to infer safe treatment of short-duration motor weakness. Urgent cardiac/neurological red flags withhold pending grading.|
|00105 p4 Table 1 footnote b|No course-limit or recovery sequence.|Four-dose maximum; beyond 16 weeks no further dose. Exactly 16 weeks requires date/timing review. Omitted recovery/consultant restart confirmation withholds; failure of recovery discontinues.|
|00105 p4 organ function and supportive care|Generic renal-ratio threshold unsupported; emetogenicity marked minimal.|Baseline organ impairment reviewed separately from new immune toxicity. Ratios alone do not substitute CTCAE-v4 organ grading. **Low** emetogenicity, confirmed also by NCCP antiemetic classification v6 Table 7 p12.|
|00535 pp1–2|Encoded source v6b; MCC and GU qualification incomplete.|Record current v7. MCC requires metastatic histology and≥1 previous chemotherapy line for metastatic disease. Preserve GU alias and progression-free first-line platinum maintenance, including 4–10-week initiation window.|
|00535 pp3–5 Table 2|Severe/recurrent pathways incomplete.|Source-specific hold/stop for pneumonitis, colitis, rash, hepatitis and nephritis; recurrent grade 2 pneumonitis and recurrent grade 3 colitis/rash permanently stop. Grade 3 colitis holds here, unlike nivolumab/ipilimumab.|
|00535 pp4–5 Table 2|Liver bands missing; creatinine denominator ambiguously baseline/ULN and generic≥1.5 threshold.|After immune-causation confirmation, AST/ALT>3 to≤5×ULN or bilirubin>1.5 to≤3×ULN holds; above upper limits permanently stops. Creatinine>1.5 to≤6×ULN holds;>6×ULN permanently stops. Exact lower limits do not satisfy an open threshold. Isolated ratios without causation receive review.|
|00535 p4 Table 2|Pancreatitis/myocarditis handling absent.|Suspected disease withholds pending assessment; confirmed disease permanently stops. No invented grade threshold substitutes for confirmation.|
|00535 pp4–6 Table 2|Endocrine and temporal exceptions absent.|Grade 3–4 thyroid toxicity holds rather than blanket grade-4 permanent stop. Symptomatic grade 3–4 adrenal toxicity holds. Grade≥3 hyperglycaemia holds; insulin metabolic control required before restart. Persistent grade 2–3 immune toxicity≥12 weeks stops; immune-toxicity steroid requirement≥10 mg/day for>12 weeks stops. These boundaries differ from baseline steroid caution>10 mg/day.|
|00535 pp3,6–7|Infusion-rate and first-four premedication requirements absent.|Grade 1 reaction reduces **rate**, not dose, by 50%; grade 2 withholds then slower restart after recovery; grade 3–4 permanently stops. Antihistamine plus paracetamol confirmed for first four infusions.|
|00551 p13 footnote i, pp1,4–5|Low-dose-ipilimumab melanoma off-label governance and baseline BRAF availability not explicitly assessed.|Melanoma-only confirmation of advanced disease, informed consent for unlicensed Irish dosing posology, D&T/equivalent acknowledgement and baseline BRAF status. A BRAF mutation is **not** required. Internal shared aliases remain unchanged.|
|00551 p8 endocrine table|Asymptomatic G2 adrenal entry avoided withholding without evidence that replacement was established.|Only explicit stable replacement **and** no symptoms activates the continuation-review exception. Otherwise G2 adrenal toxicity holds pending management; G3/4 permanently stops regardless. This is the sole changed pre-existing rule predicate.|
|00551 pp1–3|First-maintenance missing indication/schedule/timing not explicitly reviewed.|Add context review. Preserve melanoma/RCC q14 first dose after 21 days, q28 after 42 days; CRC first maintenance after 21 days and its distinct formulation restrictions.|

## Exact 00551 migration and shared-context preservation

`00551-rule-migration.json` gives the full old/new `ADRENAL_GRADE_HOLD` record and six additions prefixed `SK42_`. The other **82 existing rules** are unchanged. Indication objects, colorectal and RCC eligibility, original combination and maintenance schedules, CRC IV480 restriction, severe-organ/refractory/recurrence decisions and switch-interval rules remain intact.

The old adrenal hold predicate was `adrenal_grade in [2] AND endocrine_symptoms == true`. The proposal is `adrenal_grade == 2 AND (replacement not confirmed OR symptoms true OR symptoms missing)`. Stable replacement plus explicitly absent symptoms generates consultant review instead of withholding. Source p8 both names G2 adrenal insufficiency and permits continued treatment on replacement when symptoms are absent. A false symptoms checkbox alone does not establish that exception.

`v35-established-replacement.diff` changes only the historical 00551 G2 adrenal replacement scenario to include `adrenal_stable_on_replacement:true`. It leaves 00900 and thyroid/hypophysitis scenarios unchanged. This supplies the clinical fact named by the existing test, rather than deleting an assertion.

## Patient, consent and monitoring facts

| Item |00105 ipilimumab|00535 avelumab|00551 melanoma nivo3/ipi1|
|---|---|---|---|
|Schedule|3 mg/kg IV over 90 minutes every 21 days, up to four doses; source course window ends at four doses or 16 weeks, whichever first.|800 mg IV over 60 minutes on day 1 every 14 days until progression/unacceptable toxicity.|Nivolumab 3 mg/kg IV over 30 minutes then ipilimumab 1 mg/kg IV over 30 minutes, every 21 days×4, then nivolumab alone.|
|Maintenance|None specified.|Ongoing q14 schedule.|IV240 or SC600 every 14 days: first dose 21 days after last combination. IV480 or SC1200 every 28 days: first dose 42 days after last combination. IV480 infusion 60 minutes; SC 3–5 minutes. Preserve different CRC timing.|
|Testing|FBC, renal/liver profile, glucose and TFTs at baseline and before each cycle.|Same baseline and before-each-cycle panel.|Same; melanoma baseline BRAF status; cortisol as clinically indicated. No fixed tumour-marker/imaging schedule is invented.|
|Other monitoring|Vital signs every 30 minutes during infusion and for one hour afterwards; source response assessment after induction.|Observe for infusion reactions and immune symptoms.|Monitor for delayed adverse events for at least five months after last dose.|
|Support|Low emetogenicity. Premedication not usually required; consider after mild/moderate infusion reaction according to source/local policy.|Minimal emetogenicity. Antihistamine/paracetamol first four infusions; later discretion if uneventful fourth infusion.|Low emetogenic induction because ipilimumab is low; minimal nivolumab maintenance.|
|Contraception|This NCCP PDF does not specify a duration; use confirmed current SmPC/team advice, not an invented interval.|During treatment and for at least one month after the last dose (p7).|At least five months after last nivolumab dose (p4).|
|Consent boundary|Adult unresectable/metastatic melanoma. Immune effects can affect multiple organs; severe reactions may mean permanent cessation.|The funded MCC indication is previously chemotherapy-treated metastatic disease; do not silently describe unrestricted first-line MCC.|Explicitly explain unlicensed Irish melanoma dosing posology and local governance. This is **not** regimen00431 nivo1/ipi3.|

Regimen-specific anatomical explanations should cover gut/diarrhoea, skin/rash/blistering, lung/breathlessness, liver, kidney, endocrine glands/diabetes and neurological/cardiac warning symptoms; ipilimumab eye involvement belongs in its additional urgent guidance. The clinical tables do not establish comparative event frequencies by themselves. The parent patient-evidence task separately verifies primary trials and creates web/print material.

## Verification results and integration requirements

- Independent candidate source scenarios: **483/483 passing** through the application assessment engine and dose renderer, including all 58 ipilimumab and 69 avelumab rules with positive witnesses. Invalid/missing values, exact boundaries, recovery precedence, schema, full demo-form generation and all six new 00551 rules are included. Source-level review and independent authority remain explicitly different.
- Baseline first run: **259/478 passing, 219 failing**. These are failed probes, not 219 distinct clinical defects; they include missing new pathways and validation assertions. The candidate adds two positive-coverage checks; the final suite adds three demo-form checks. Before/after JSON outputs are retained.
- Existing v0.84.40 retrospective suite: **183/183 passing** with candidate JSON reads; no old expectation changed.
- Existing v0.84.35 nivolumab/fruquintinib suite: **598/599** on its unmodified expectations; the single adrenal replacement scenario above fails for the documented reason. With the narrow source-driven scenario correction, **599/599** pass.
- Original 00551 indications and 82 unchanged rules are asserted against retained baseline snapshots, not merely checked for hash changes. Raw PDFs have independently checked SHA-256 hashes.
- The three JSON candidates pass strict schema and profile demo checks. Added fields are optional and have explicit demonstration values; they are not defaults for real patient input. Source grade provenance is CTCAE v4 for ipilimumab and v4.03 for avelumab.
- Root should update bounded clinical/source-input/migration release allowlists to v0.84.42 as applicable; no helper changes were made here. New ipilimumab and avelumab source-specific fields must remain visible in the real assessment form. Full browser, service, PDF, QR, consistency and regression validation belongs to the parent integration step.
- Root should reconcile the global emetogenicity map/script for ipilimumab: the protocol proposal fixes it to low but other maps can override it. This is a source-backed correction, not a presentation-only change.
- The avelumab creatinine field deliberately retains its compatibility identifier but now explicitly requests **ULN, not baseline**. Existing local-lab raw-result adapter does not automatically attach to this identifier. No untested global adapter change is bundled; browser testing should ensure its label/units remain clear. ALT/AST/bilirubin use the established raw-result adapters.

## Deliberately unresolved judgment and limits

The proposal does not calculate immune corticosteroid prescriptions, decide a patient's causation or CTCAE grade, auto-authorise restart, reinterpret ambiguous ipilimumab neurological/eye qualifiers as a definitive dose, or borrow PD-1 lab thresholds for ipilimumab. Severe responding eye inflammation requires specialist review because the general severe-immune rule and eye-specific response qualifier need clinical reconciliation. A grade-2 colitis persistence window remains a clinician-confirmed source criterion. At the exact 16-week course boundary, actual date/authorised timing is reviewed. No current ipilimumab SmPC contraception duration is claimed from the regimen PDF.

These source audits are complete for the stated proposed encoding scope. Independent clinical/pharmacy review, parent integration, final patient/PDF/QR visual checks and live deployment verification are separate and are not asserted by this report.
