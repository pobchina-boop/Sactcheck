# SACTCheck Primary Clinical Validation Guide v0.63.0

## Purpose

This guide describes how to perform the initial clinical product owner review of the complete SACTCheck library tissue by tissue.

The aim is to identify and correct encoding discrepancies before independent consultant oncology and oncology pharmacy validation.

## Recommended review sequence

1. Breast
2. Gastrointestinal
3. Lung
4. Gynaecology
5. Genitourinary
6. Head and Neck
7. Sarcoma
8. Skin and Melanoma
9. Neuro oncology
10. Neuroendocrine
11. Tumour Agnostic Therapy
12. Haematology
13. Lymphoma context where applicable

The order can be changed according to clinical availability.

## How to review one regimen

### Step 1. Open the validation workspace

Select Validation workspace from the SACTCheck header.

Enter the reviewer name and role.

### Step 2. Select one tissue

Choose a tissue card. The protocol review queue is filtered to that tissue.

Shared regimens appear in each relevant tissue context. Review the context rather than assuming that one completed review covers all indications.

### Step 3. Open the review record

Select Review this context.

Confirm the NCCP code, title, version and tissue context.

### Step 4. Open the current NCCP source

Read the complete source document. Do not rely only on a section already visible in SACTCheck.

### Step 5. Open the SACTCheck assessment

Compare the source with the actual encoded inputs, rules and outputs.

### Step 6. Review all thirteen domains

For each domain choose one status:

1. Not reviewed
2. Confirmed against source
3. Not applicable to this regimen
4. Correction required
5. Oncology pharmacy review required
6. Consultant review required

Add a concise source based note when useful, especially for threshold boundaries, unusual schedules, qualitative renal or hepatic guidance and not applicable decisions.

### Step 7. Log every discrepancy

Use Add issue for every mismatch between the NCCP source and SACTCheck.

Record the domain, severity, concise title and exact problem.

Examples include an incorrect platelet threshold, missing bilirubin input, incorrect treatment day, wrong dose action or missing monitoring requirement.

### Step 8. Resolve corrections only after implementation

An issue should remain open until the SACTCheck correction has been made and tested.

Add a resolution note when closing it.

### Step 9. Complete the tissue context

Primary clinical review complete is generated only when every review domain is confirmed or not applicable and there are no open issues or unresolved specialist review requests.

### Step 10. Export the validation log

Export the full JSON log after each review session and retain dated copies.

A CSV summary can be used for rapid progress review.

## Review domains

1. Source identity and version
2. Indication and treatment context
3. Regimen components, dose and schedule
4. Eligibility and exclusions
5. Haematology and recovery rules
6. Renal assessment
7. Hepatic assessment
8. Other safety and toxicity rules
9. Monitoring and supportive care
10. Administration and sequencing
11. SACTCheck input and rule behaviour
12. Output clarity and traceability
13. Knowledge base and evidence

## Completion standard

A protocol context should not be considered complete because the regimen title and blood thresholds are correct.

Completion requires confirmation that all clinically relevant source domains have been reviewed and that unsupported domains have been explicitly marked not applicable.

## Formal validation boundary

Primary clinical review is not equivalent to independent formal validation.

The published SACTCheck status remains pending formal consultant oncology and oncology pharmacy validation until those governance steps are completed and incorporated into a controlled release.

## Data boundary

Do not enter patient names, medical record numbers, dates of birth or clinical case information into the validation workspace.

The workspace is for protocol validation only.
