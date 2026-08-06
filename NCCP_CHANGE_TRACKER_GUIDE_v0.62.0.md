# NCCP Change Tracker guide

## Purpose

The NCCP Change Tracker turns protocol maintenance into a visible and controlled workflow.

Its purpose is not to decide that an NCCP change is clinically correct or to rewrite treatment rules automatically. Its purpose is to detect source change, show the evidence for that signal, prioritise review and preserve the governance trail.

## Source register

Each enabled SACTCheck protocol has a canonical source record containing:

1. NCCP regimen code
2. Stated NCCP version
3. Protocol title
4. Tumour group
5. Indication summary
6. Official source address
7. SACTCheck encoding version
8. Source identity SHA 256 fingerprint
9. Local protocol JSON SHA 256 fingerprint
10. Remote PDF SHA 256 fingerprint after capture
11. Extracted text SHA 256 fingerprint after capture
12. Last remote check
13. Review status
14. Clinical rule update safety status

## Change types

### New protocol

A catalogue source does not match the canonical SACTCheck register.

### Updated protocol

The registered version or source address changes.

### Silent source replacement

The PDF or extracted text fingerprint changes while the visible version and address remain the same.

### Removed or moved source candidate

A source that was previously confirmed on a successfully scanned catalogue page is no longer found there.

## Priority categories

### Potentially treatment changing

Possible dose, schedule, eligibility, laboratory, organ function, contraindication, treatment hold, dose reduction or toxicity action content.

### Safety or workflow change

Possible monitoring, premedication, hydration, administration, supportive care, observation or reaction management content.

### Information change

Evidence, reference, background or administrative content.

### Formatting or file change

The PDF fingerprint changes but normalised extracted text does not.

### Review required

The automated process cannot safely classify the significance.

## Review states

Recommended review states are:

1. Awaiting clinical review
2. Under clinical review
3. Oncology pharmacy review required
4. Reviewed with no SACTCheck action required
5. Encoding update required
6. Knowledge update required
7. Incorporated into a named release

## Mandatory review sequence

1. Open the previous and current sources
2. Confirm the actual changed section
3. Determine whether it affects clinical assessment, knowledge content, supportive care or administration
4. Record the reviewer and decision
5. Update content only when required
6. Add or amend regression tests
7. Run the complete validation suite
8. Link the completed change to the release

## Important limitations

The published NCCP web catalogue may not contain every national regimen.

A missing catalogue link does not prove that a regimen is clinically obsolete.

Automated PDF text extraction may introduce formatting artefacts.

Keyword priority classification is not a substitute for clinical interpretation.

Website availability problems can interrupt a scan.

The current official NCCP source and local prescribing governance remain authoritative.
