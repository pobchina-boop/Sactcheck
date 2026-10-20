# Breast longitudinal mapping and future genomic decision support

Original delivery notes: 17 October 2026, v0.83.7. Treatment-selection rationale requirement added 20 October 2026 following product-owner agreement.

## Delivered in v0.83.7

Five source-linked educational maps cover TCHP (00722), the pembrolizumab/carbo–paclitaxel/AC pathway (00857), adjuvant abemaciclib (00619), metastatic pertuzumab/trastuzumab maintenance (00726), and metastatic ribociclib (00525). Patient pages, printable maps and clinician knowledge use the same structured definitions.

The horizontal axis contains relative treatment stages. Surgery, radiotherapy, systemic therapy and relevant monitoring have separate lanes. Surgery is presented as an individual choice of operation, not lumpectomy followed automatically by mastectomy. Conditional treatments and tests are identified. No dates or personal information are required.

Each check explains its expected timing, purpose and what to ask the team. Clinical notes retain source differences and risk-dependent exceptions. The map distinguishes an expected event from an appointment that has actually been ordered, booked or completed.

Breast navigation supports setting, receptor context and complete-suite coverage. This organises the existing catalogue; it does not select treatment. Only these five protocols received a new source/rule audit in this release. The other breast navigation entries retain their previous clinical review status.

## Next development: operational milestone tracking

Extend the shared definitions to later breast batches and other tissues. Preserve regimen, indication, stage, risk factors, source version and treatment-phase context; do not create one generic scan schedule for all breast cancer.

An operational hospital system needs a separate authorised patient record and an accountable owner for each event. Model expected, ordered, booked, completed, result reviewed and next action as distinct states. A due date is not evidence that a scan happened. Record the source of completion and the clinician who reviewed the result. Capture postponements, treatment interruptions and pathway changes explicitly.

Before introducing reminders, define responsibility for missing appointments, results and escalation; integration with clinical ordering/results systems; identity, consent, access controls and audit history; and how patients can see an agreed plan without having to maintain it themselves. Do not infer a normal result from missing data. Co-design the patient presentation with PPI contributors and evaluate the workload it adds or removes.

Keep the relative educational map available even when no patient record is connected. Patient entry of treatment dates must not become a prerequisite for basic information.

## Future feature: Oncotype and other genomic assays

No genomic-score triage, eligibility recommendation or chemotherapy decision is enabled in v0.83.7. This is a separate future workstream.

Start with a clinician-led decision specification that distinguishes whether an assay is appropriate from how an existing result informs a shared decision. Confirm current Irish access/reimbursement criteria and current primary international guidance before encoding thresholds.

The specification should include disease setting, invasive histology, hormone-receptor and HER2 status, nodal status, menopausal context, tumour features, previous systemic treatment, assay identity/version, report availability and the actual reported score. Missing or conflicting information must stop automatic interpretation. Different assays and scores must not be treated as interchangeable.

Use independently reviewed decision tables that preserve trial populations, node/menopause interactions and uncertainty. Separate prognostic risk from predicted treatment benefit. Explain absolute benefit, harms and patient preferences without presenting a score as an instruction to accept or decline chemotherapy. Do not use Oncotype as a substitute for the separate NCCP eligibility criteria for adjuvant CDK4/6 treatment.

Validate with consultant and oncology-pharmacy review, boundary cases, exclusions, deliberately incomplete inputs, conflicting reports and patient/PPI testing. Begin with an explanation and review aid; activation as treatment-selection support requires its own governance decision and prospective evaluation.

## Agreed next-update requirement: why this treatment?

Status: agreed product requirement, not yet implemented. Add a prominent treatment-selection rationale to both clinician knowledge and patient information. Paul specifically requested explanation of why one treatment is chosen over another, including fitness, tumour grade, risk profile and histology, so the platform also supports learning and the treatment discussion.

The current expanded cards describe indication, treatment intent, components and evidence. These elements do not consistently explain the choice among reasonable alternatives. A dedicated section must connect the clinical features to the treatment objective, the evidence supporting a particular approach and its trade-offs.

### Shared content model

Use one source-linked rationale definition with explicitly separated clinician and patient fields. The table below describes the full clinical content model, not a requirement to expose every field in the patient presentation. Preserve the exact NCCP code, indication, formulation, schedule and active phase. Do not copy a rationale across cards solely because they share drugs. Patient renderers and exports must select only the approved patient fields, rather than inherit the clinician evidence panel.

| Element | Required explanation |
|---|---|
| Treatment aim and setting | What this approach is intended to achieve and where it sits in the whole pathway. |
| Line of treatment and prior exposure | State the source-defined first-line, second-line or later-line context and required prior therapies. Keep treatment line separate from neoadjuvant/adjuvant setting and induction/maintenance phase. Describe where line is not applicable or not specified instead of inferring it. |
| Histology and biology | Which histological or biomarker features matter for this exact indication; explain their relevance without implying every biomarker is predictive of benefit. |
| Stage, grade and baseline risk | Keep stage and grade distinct; explain how each relevant feature contributes to the decision. Distinguish prognostic information from evidence predicting treatment benefit. |
| Fitness and tolerability | Source-supported relevance of performance status, frailty, comorbidity, organ function, previous toxicity and prior treatment. Keep chronological age distinct from fitness. |
| Combination and sequence | Why the components are combined, why treatment occurs before/after surgery, and why a component stops or a later phase starts. |
| Evidence and benefit | Applicable trial population, comparator, outcome, follow-up, effect size and limitations. Show absolute benefit where valid and available, with the same endpoint/time horizon and appropriate uncertainty. |
| Alternatives and trade-offs | Factors favouring this regimen, factors favouring another eligible approach, treatment burden and meaningful adverse-effect differences. State when there is no direct comparison. |
| Patient priorities | Explain where visit burden, route, practical circumstances, fertility concerns and preferences enter shared decision-making, when relevant. Do not infer a patient's priorities. |
| Access and local context | Distinguish evidence/guideline positioning from NCCP protocol availability, Irish access/reimbursement and local practice. |
| Remaining decisions | What the MDT or treating team still needs to establish, and which missing information prevents a personalised conclusion. |

### Clinician presentation

Place “Why this regimen?” near the top of the knowledge section, before detailed administration and toxicity content. Start with a short decision summary, followed by expandable clinical factors, evidence and alternatives. Every comparative statement must have an applicable source and a checked date. Explain whether a preference is supported by a direct trial, guideline recommendation, indirect evidence or individual clinical judgement.

Do not describe an option as preferred solely because an NCCP regimen exists. Do not infer individual benefit from a trial hazard ratio, multiply outcomes from separate studies, or imply cross-trial equivalence. Where an applicable absolute estimate is unavailable, say so instead of filling the space with an unsupported number.

### Evidence at a glance: treatment line and magnitude of benefit

Additional product-owner requirement, 20 October 2026: make line of treatment and the practical magnitude of benefit immediately understandable in the clinician knowledge base. Present a compact evidence panel beside the treatment-selection rationale, with expanded methodology and limitations available below it. Subsequent clarification on the same date: this comparative evidence panel belongs only in the clinician knowledge section; do not offer it as optional detail in the patient interface.

The visible panel should identify the exact indication, treatment line/prior exposure, pivotal study and named comparator. Show the most relevant one or two efficacy outcomes and a concise harms/quality-of-life context. Avoid a dense panel of every endpoint or implying that all regimens have demonstrated a survival advantage.

| Evidence field | Presentation and interpretation rule |
|---|---|
| Overall survival (OS) | Where reported, show both arms' median OS and/or survival proportions at the same stated time point, plus the reported HR and 95% CI. State analysis maturity and whether an OS benefit was demonstrated. |
| Disease-control outcome | Use the endpoint applicable to the trial/setting: PFS, EFS, DFS, iDFS or another explicitly defined outcome. Preserve its definition and show both arms at the same follow-up/time point. |
| Absolute difference | Show a difference in months between reported medians or a percentage-point difference between same-time survival/event-free proportions. Label it precisely; a difference in trial medians is not an individual's expected added lifespan. |
| Relative effect | Show HR with 95% CI, with concise explanation available. Do not turn a hazard reduction into an absolute survival gain or a percentage of patients cured. |
| Response | Where useful, show ORR/pCR and the comparator; keep response distinct from demonstrated improvement in survival. |
| Harms and lived experience | Include source-supported serious toxicity, discontinuation or quality-of-life findings relevant to the choice. A missing quality-of-life result is not evidence of no effect. |
| Applicability | State population, biomarkers, prior treatment, comparator, formulation/backbone and any material difference between trial treatment and the NCCP schedule. |
| Provenance | Link the primary report and relevant later follow-up; record data cut-off, follow-up duration, analysis population, endpoint status and last checked date. Do not combine numbers from incompatible analyses into one comparison. |

Distinguish not reported, not reached, immature, no statistically demonstrated difference and no direct comparative evidence. Preserve non-inferiority and single-arm designs as such; neither provides an automatic estimate of superiority or survival gain. Keep exploratory subgroup findings visibly separate from prespecified confirmatory results. Do not use a cross-trial leaderboard to rank regimens.

The clinician summary should lead with the actual result and its main limitation. Keep comparative survival figures, OS/PFS/EFS/DFS/iDFS statistics, response-rate comparisons, hazard ratios and prognostic estimates out of patient-facing content for this feature, including expandable sections and patient exports. Trial averages must not be presented as personalised prognosis. A patient who wants to understand numerical benefit can be encouraged to discuss how the evidence applies to them with their treating team; do not automatically expose the clinician panel.

Methodological references for endpoint naming and patient explanations: FDA, Clinical Trial Endpoints for the Approval of Cancer Drugs and Biologics (December 2018), https://www.fda.gov/regulatory-information/search-fda-guidance-documents/clinical-trial-endpoints-approval-cancer-drugs-and-biologics ; FDA, Patient-Friendly Language for Cancer Clinical Trials, https://www.fda.gov/about-fda/oncology-center-excellence/patient-friendly-language-cancer-clinical-trials . These describe endpoints; regimen-specific outcome numbers must come from the applicable primary study and follow-up.

### Endpoint visual language: clinician knowledge only

Product-owner requirement, 20 October 2026: use a consistent visual language, recognised endpoint acronyms and colour coding to make the type and magnitude of benefit understandable at a glance. Status: proposed design saved for the next update; not implemented in the live platform.

Keep established endpoint names rather than invent a new clinical abbreviation or composite benefit score. Use five stable colour families, each paired with a visible acronym, full name and icon. Colours identify the outcome being measured, not whether treatment works, evidence quality or a treatment recommendation. Keep them distinct in meaning from the assessment engine and antiemetic traffic lights.

| Family / proposed light-theme accent | Endpoint labels | Meaning and distinction | Icon cue |
|---|---|---|---|
| Survival / navy `#244A73` | OS — Overall survival | Time to death from any cause, measured from the trial's defined starting point. | Hourglass |
| Progression / teal `#006B68` | PFS — Progression-free survival | Time to progression or death; retain the study's progression definition and assessment method. | Scan |
| Disease events / violet `#6C48A5` | EFS — Event-free survival; DFS — Disease-free survival; iDFS — Invasive disease-free survival | Use distinct badges and definitions within the same family. List the events counted by the exact study; these endpoints are not interchangeable or simply synonyms for recurrence. | Shield |
| Response / ochre `#8A5A00` | ORR — Objective response rate; pCR — Pathological complete response | ORR concerns the proportion meeting objective response criteria; pCR concerns response in examined tissue. Preserve trial-specific criteria, denominator, confirmation and anatomical scope. Do not equate either with cure or proven longer survival. | Target for ORR; microscope for pCR |
| Wellbeing / plum `#91446D` | QoL — Quality of life | Name the instrument, domain, time point, score direction and clinically meaningful threshold where established. PRO describes patient-reported measurement and is not interchangeable with QoL or one specific endpoint. | Person |

Use the same families for any later DOR (duration of response) or other endpoints, but define each separately before use. Do not populate every endpoint on every card. The visible regimen panel should retain one or two decision-relevant outcomes; place the complete key in a keyboard- and touch-accessible legend.

Separate three dimensions in every endpoint tile: (1) what was measured, (2) the actual comparison and absolute difference, and (3) the interpretation and maturity of the evidence. Label the exact treatment arms and time point beside any comparison. Use text such as “Benefit demonstrated”, “No statistically demonstrated difference”, “Favours comparator”, “Non-inferiority demonstrated” or “No direct comparative evidence” only when justified by the study design and analysis. Record maturity separately: “Interim / immature”, “Final analysis”, “Not reported”, or the source-specific status. “Median not reached” is a result, not a synonym for immature evidence. Do not generate a success badge simply from an HR below 1 or a nominal p-value; preserve endpoint hierarchy, multiplicity and exploratory/confirmatory status.

Show absolute differences in months or percentage points with the correct endpoint and time horizon. Keep HR/95% CI available with the trial details; HR is an effect measure, not an endpoint. Avoid stars, traffic-light drug rankings, a universal benefit gauge or equal-length bars that imply OS, PFS and response are comparable quantities. Any actual chart must have a labelled scale and source data; do not invent survival curves from reported medians.

Accessibility acceptance: meaning remains clear without colour, in monochrome printing, on mobile and with a screen reader. Always pair colour with labels and icons; support tap/keyboard access to definitions, rather than hover alone. Check actual light/dark-theme contrast and non-colour differentiation before release; the proposed hex palette is not a completed accessibility audit. Relevant design reference: W3C, Understanding WCAG 2.2 Success Criterion 1.4.1, https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html . Endpoint references: FDA guidance linked above; NCI pathological complete response definition, https://www.cancer.gov/publications/dictionaries/cancer-terms/def/pathologic-complete-response . Exact regimen endpoints must still be verified against their primary reports.

### Patient presentation

Use “Why might my team recommend this treatment?” with a short plain-language explanation. Explain why the treatment fits this type of cancer, its aim, why several medicines may be used, practical trade-offs and how the next step is decided. Describe the treatment's place in the patient's pathway without copying the clinician treatment-line/evidence table. Define terms such as grade, stage and receptor status in plain language when used. Any expanded patient detail must follow the same audience boundary and exclude comparative trial outcome figures.

Preserve accurate treatment intent, material risks, side-effect guidance and information needed for informed consent. Keeping the comparative evidence panel in clinician knowledge must not become a reason to remove necessary patient safety information or imply a guarantee of benefit. This requirement concerns presentation of this new feature, not a blanket removal of existing consent information.

The public page describes general reasons. It must not claim to know why an individual patient's team chose the regimen. Include a brief prompt to confirm which reasons apply in their own case and which alternatives were discussed. No dates, scores, laboratory values or personal information should be required to read the explanation. Do not introduce a patient questionnaire or automatic regimen recommendation as part of this feature.

### Rollout and acceptance

Pilot the section in the next approved breast batch, proposed as 00858, 00860, 00861, 00348 and 00734, with a consistency review of existing 00857. Retrospectively enrich existing cards in source-reviewed groups; do not assume all prior cards meet the new rationale standard. This agreement does not mark the next batch as built or the current release as changed.

Acceptance requires: clinician and patient versions are both visible; scope and phase match the source; clinical selection factors are explained rather than merely listed; alternatives have sources and limitations; stage/grade and prognosis/predicted benefit are not conflated; unsupported comparisons or precision are absent; and local links and readable presentation work. Independent oncology/pharmacy review and PPI feedback remain separate from software/content completion.

For the evidence panel, also verify treatment-line scope, arm labels, units, time points, endpoint definitions, absolute-difference arithmetic, HR/CI transcription, missing/immature-result labels and exact source attribution. Independently check numerical extraction before publication. Verify that the panel appears only in clinician knowledge and that its fields do not propagate into patient pages, expandable patient content, printable maps/PDFs or generated patient/consent summaries. Confirm that material risk and consent information is preserved. No data are populated solely to make every card look complete.

For PPI evaluation, assess whether a reader can explain the treatment aim, why it may suit their cancer, one relevant trade-off and a question to ask their team. Evaluate understanding rather than treating page visits as evidence of learning.

## v0.84.13 delivery and staged retrospective work — 20 October 2026

Five TNBC full suites (00858/00860/00861/00348/00734) and the existing 00857 content pathway now carry treatment-selection rationale, source-specific phase maps and monitoring. A clinician-only endpoint display distinguishes effect size, statistical interpretation, maturity and exact-schedule applicability; patient comparative efficacy figures are excluded from these six pathways. Retrospective expansion is deliberately staged: 73 remaining authored suites are itemised in validation/tnbc-v08413/retrospective-inventory.csv. Do not describe the whole library as retrospectively reviewed. No automatic genomic-score selection, appointment scheduling or reminder system is enabled.
