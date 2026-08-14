# SACTCheck v0.63.0 Release Notes

## Primary clinical validation workspace

SACTCheck v0.63.0 adds a structured workspace for complete primary clinical review of the protocol library before independent consultant oncology and oncology pharmacy validation.

## What the validation workspace does

### 1. Tissue by tissue review planning

The workspace groups the enabled library by tissue and shows progress for each group.

Why this is valuable: the reviewer can complete the library systematically rather than relying on an informal list of regimens already checked. Shared protocols remain visible in every tissue context in which they are used.

### 2. Separate review contexts for shared protocols

The 376 enabled protocol records generate 451 tissue review contexts because a shared protocol can support more than one tumour group.

Why this is valuable: reviewing weekly paclitaxel in breast cancer does not automatically imply that its ovarian, lung or genitourinary context has also been reviewed.

### 3. Thirteen structured review domains

Every tissue context is reviewed across source identity, indication, regimen components, eligibility, haematology, renal assessment, hepatic assessment, other safety rules, monitoring, supportive care, administration, SACTCheck engine behaviour, output clarity and knowledge base evidence.

Why this is valuable: it reduces the chance that a protocol is called reviewed after only its blood thresholds have been checked.

### 4. Explicit not applicable state

A review domain can be marked not applicable only after the current NCCP source has been checked.

Why this is valuable: the absence of a renal, hepatic or other rule becomes a documented clinical conclusion rather than an assumed omission.

### 5. Discrepancy and correction log

Each review context can contain multiple issues with severity, domain, notes and resolution status.

Why this is valuable: source mismatches remain visible until they are implemented, tested and closed. This creates a practical correction queue from the review process.

### 6. Specialist escalation states

A domain can be marked as requiring oncology pharmacy review or consultant review.

Why this is valuable: uncertain source interpretation can be escalated rather than forced into a binary pass or fail decision.

### 7. Primary review completion rule

A tissue context reaches Primary clinical review complete only when every domain is confirmed or explicitly not applicable and there are no open discrepancies or specialist review requests.

Why this is valuable: completion has a defined mechanism and cannot be achieved by checking only part of a regimen.

### 8. Direct source and live assessment access

The reviewer can open the current NCCP source and the live SACTCheck assessment from the same validation record.

Why this is valuable: the source document and the actual encoded interface can be compared directly during review.

### 9. Local review log with export and import

Review progress is stored locally in the reviewer browser. The full log can be exported as JSON, exported as CSV and imported on another device or into a later SACTCheck build.

Why this is valuable: primary review can progress over multiple sessions without altering the published protocol library. Regular exports provide a portable governance record.

### 10. Separation from formal clinical validation

Completing the primary review workspace does not change the public formal validation status of a protocol.

Why this is valuable: the product distinguishes the clinical product owner review from later independent consultant oncology and oncology pharmacy validation.

## Library scope

1. Enabled protocol records: 376
2. Tissue review contexts: 451
3. Protocol JSON assets: 382
4. Protocol JSON changes in this release: 0
5. Existing NCCP Change Tracker preserved
6. Existing 18 regimen knowledge base preserved
7. Existing library wide organ function reconciliation preserved

## Safety boundary

The validation workspace is a structured review and logging system. It does not approve treatment, modify a clinical rule automatically or replace the current NCCP protocol, local governance or independent specialist validation.
