# SACTCheck v0.62.0

## NCCP Change Tracker

SACTCheck v0.62.0 introduces a source surveillance and review system for the active regimen library.

The tracker is designed to answer four practical questions.

1. Has the NCCP published a source that is not yet registered in SACTCheck?
2. Has an existing protocol version, address, PDF or extracted text changed?
3. How important might the change be for clinical content review?
4. Has the detected change been reviewed, tested and incorporated into a controlled SACTCheck release?

The release registers all 376 enabled protocols in the active application index. Each record contains the NCCP regimen code, stated version, title, tumour group, source address, SACTCheck encoding version, source identity fingerprint and local protocol JSON fingerprint.

The repository contains 382 protocol JSON assets in total. The source tracker follows the 376 enabled protocols exposed through `protocols/index.json` rather than shared profiles, templates or non catalogue JSON assets.

## Current baseline state

The local source register is complete and every enabled indexed protocol has an official source address.

Remote PDF and extracted text fingerprints are intentionally marked as awaiting first capture. The build environment used to prepare this release could not access the NCCP website directly. The included GitHub workflow performs that capture in the repository environment and submits generated changes for review.

The dashboard does not claim that a protocol is current until a remote comparison has completed.

## Feature 1: New protocol detection

### Function

The scheduled scan reads the configured NCCP catalogue pages and identifies PDF sources that do not match an existing SACTCheck source record.

### Strength

This makes newly published treatment sources visible to the maintenance team without relying only on occasional manual catalogue checks.

### Safety boundary

A newly discovered source is placed in the review feed. It does not automatically create a regimen card, knowledge profile or clinical assessment pathway.

## Feature 2: Updated protocol detection

### Function

The tracker compares the stated source version and source address for every registered protocol. A changed version or changed address is shown as an updated protocol requiring review.

### Strength

This provides a reproducible signal that an existing encoding may need reconciliation against a newer source.

### Safety boundary

The detected source is preserved and displayed, but the existing clinical rule set remains unchanged until authorised review and regression testing are complete.

## Feature 3: Silent replacement detection

### Function

The tracker calculates a SHA 256 fingerprint for the PDF file and a second SHA 256 fingerprint for normalised extracted text. A change can therefore be detected even when the visible version label and source address remain unchanged.

### Strength

This addresses a weakness of version label only surveillance. A replaced document can be detected even when the public identifier appears unchanged.

### Safety boundary

A PDF fingerprint change with unchanged normalised text is classified as a likely formatting or file packaging change. Any changed extracted text remains subject to human review.

## Feature 4: Removed or moved source detection

### Function

After a successful catalogue scan establishes that a registered source is present, a later scan can flag loss of that catalogue presence.

### Strength

This prompts review of whether the protocol was retired, moved, renamed or temporarily unavailable.

### Safety boundary

The tracker presents this as a review candidate. It does not automatically remove the regimen from SACTCheck because the published online catalogue may not be comprehensive and temporary website problems can occur.

## Feature 5: Clinical significance triage

### Function

Changed text is screened for terms associated with dose, schedule, eligibility, laboratory thresholds, renal or hepatic function, toxicity actions, monitoring, supportive care, administration, evidence and administrative content.

The tracker assigns an initial category.

1. Potentially treatment changing
2. Safety or workflow change
3. Information change
4. Formatting or file change
5. Review required when the automated category is uncertain

### Strength

This helps reviewers prioritise potentially important changes instead of treating every revised document as equally urgent.

### Safety boundary

The automated category is a triage aid only. It is not a clinical interpretation and it cannot approve a change.

## Feature 6: Previous and current source comparison

### Function

The workflow preserves source fingerprints and extracted text snapshots. When a source changes, the review feed can display the previous and current source identity together with focused text excerpts around the first detected difference.

### Strength

This reduces the effort required to locate a change within two long protocol documents and provides a transparent basis for further review.

### Safety boundary

The complete current NCCP source must still be opened and reviewed. A focused excerpt is not a substitute for full protocol assessment.

## Feature 7: Mandatory human review gate

### Function

No tracker process writes to a protocol JSON file. A detected change must pass through the following sequence.

1. Detect the source change
2. Preserve the previous and current source
3. Review and classify the difference
4. Approve any required content change
5. Update the relevant encoding or knowledge content
6. Run regression testing
7. Publish a reviewed SACTCheck release

### Strength

This keeps clinical interpretation and release authority with authorised reviewers while still gaining the efficiency of automated surveillance.

## Feature 8: Change history and provenance

### Function

The tracker provides fields for detection date, review status, reviewer, reviewer note and the SACTCheck release that incorporates an approved change.

### Strength

This creates a traceable maintenance record for governance, validation, research and future external review.

## What is new and what has changed dashboard

The application now includes a dedicated NCCP Change Tracker screen with:

1. Registered protocol count
2. Changes requiring review
3. Remote capture status
4. Source resolution status
5. Feature explanations
6. Change type and priority filters
7. Previous and current source comparison
8. Canonical source register search
9. A visible governance boundary

A header button and homepage button open the tracker directly.

## Per regimen source status

The generic regimen assessment screen now shows the source tracker status for the selected protocol.

Possible states include:

1. Baseline registered
2. Remote source captured
3. Remote scan failed
4. Source resolution required

The user can open the tracker with the relevant NCCP number already entered in the source register search.

## GitHub surveillance workflow

The new workflow runs every Monday and can also be started manually.

It performs the following steps.

1. Reads the configured NCCP catalogue pages
2. Captures current PDF fingerprints
3. Extracts protocol text using `pdftotext`
4. Compares current sources with the stored register
5. Generates the change feed and focused source report
6. Runs tracker regression tests
7. Creates a review branch and pull request when tracked source data changes

The workflow never edits clinical protocol files.

## Clinical content impact

No protocol threshold, dose action, organ function pathway, toxicity rule, knowledge profile or assessment engine behaviour is changed in v0.62.0.

All 382 protocol JSON assets remain unchanged from v0.61.0.

## Validation status

The complete cumulative test suite passed. The repository security scan passed across 982 text files. The GitHub Pages build and deployable site validation also passed.


The tracker comparison engine was tested with controlled fixtures covering:

1. New protocol detection
2. Updated version and source address detection
3. Silent PDF replacement detection
4. Removed source candidate detection
5. Initial fingerprint capture without a false change alert
6. High priority treatment threshold triage
7. Medium priority monitoring and workflow triage
8. Source register coverage
9. Human review gate enforcement
10. Protocol JSON integrity

Independent consultant oncology and oncology pharmacy review remains pending. The official current NCCP protocol and local governance remain authoritative.
