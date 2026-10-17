# Breast longitudinal mapping and future genomic decision support

Updated 17 October 2026 for v0.83.7.

## Delivered in this release

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
