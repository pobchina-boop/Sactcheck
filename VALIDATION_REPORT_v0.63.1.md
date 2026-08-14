# SACTCheck v0.63.1 Validation Report

## Validation objective

Confirm that replacing local antiemetic prescription sheet links with national NCCP guidance does not alter the existing emetogenic classification, traffic light display or deterministic clinical assessment engine.

## Source routing

1. Medical Oncology contexts resolve to the NCCP Medical Oncology antiemetic guidance.

2. Haemato Oncology contexts resolve to the NCCP Haemato Oncology antiemetic guidance.

3. Runtime context routing was tested directly for both Medical Oncology and Haemato Oncology.

## Protocol migration audit

1. Protocol JSON assets assessed: 382.

2. Protocols with supportive care source metadata changes: 324.

3. Protocols with changes outside the approved supportive care and antiemetic source metadata fields: 0.

4. Active local antiemetic references remaining in protocol supportive care fields: 0.

5. Local supportive antiemetic PDFs remaining in active assets: 0.

6. Central emetogenic classification changed: No.

## Clinical core protection

The v0.63.0 clinical core baseline was retained for every protocol. The v0.63.1 regression test verifies that the following domains are unchanged:

1. Input definitions.

2. Required inputs.

3. Rule engine content.

4. Treatment data.

5. Eligibility data.

6. Exclusion data.

## Automated validation

The cumulative test suite includes the dedicated v0.63.1 national antiemetic guidance regression test.

The dedicated test verifies:

1. Package version and guidance release metadata.

2. Medical Oncology national guidance routing.

3. Haemato Oncology national guidance routing.

4. Removal of local antiemetic labels and asset references from active protocol supportive care content.

5. Preservation of central emetogenic risk levels and phase specific risk levels.

6. Preservation of the deterministic clinical core for all protocol JSON records.

7. Removal of active local antiemetic prescription PDFs.

## Validation conclusion

The source migration is limited to supportive care link provenance and display wording. The existing emetogenic rating system, traffic light display and deterministic clinical assessment logic are preserved.
