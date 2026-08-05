# Validation Report — SACTCheck v0.54.0

## Release

**Constrained Scenario Interpreter**

## Focused validation

The release-specific test verifies that a de-identified Lonsurf scenario extracts and proposes:

- ANC 0.3 ×10⁹/L
- Current afebrile status is recognised but is not mapped to the historical febrile-neutropenia field; a warning is shown and the field remains unassessed
- Cycle 3
- Current dose 30 mg/m² twice daily

It also verifies:

- Possible MRN/identifier wording produces a privacy warning.
- The interpreter script and stylesheet are loaded before the generic assessment interface.
- The opened regimen includes the Scenario interpreter control and panel.
- Confirmed values are applied through the existing assessment form.
- The immunotherapy heading is “Immunotherapy toxicity map”.
- Organ-specific navigation wording is present.

## Full pipeline

- Repository security scan passed: 832 text files scanned.
- Protocol index and metadata publishing passed.
- 381 protocol publishing tests passed.
- Complete historical regression suite passed.
- Release-specific constrained scenario interpreter tests passed.
- GitHub Pages build passed.
- Deployable-site validation passed.
- 382 protocol JSON files were copied to the deployable site.
- ZIP integrity passed.
- No nested `protocols/protocols` directory is present.

## Clinical-file integrity

A byte-for-byte SHA-256 comparison confirmed that all 382 protocol JSON files are unchanged from v0.53.0.

## Residual limitations

- This is deterministic local language extraction, not an unrestricted generative model.
- It recognises a controlled clinical vocabulary and may abstain on unfamiliar wording.
- It does not independently determine the correct regimen from the whole catalogue.
- It does not infer missing facts.
- It does not generate a free-text treatment recommendation.
- Spoken dictation is not included in this iteration.
- A future hosted language-model layer would require a secure authenticated backend, data-protection assessment, prompt and retrieval logging, and separate clinical validation.

## Conclusion

The release is suitable as a constrained scenario-entry aid for technical and shadow validation. It does not constitute independent clinical validation or authorisation for autonomous treatment decisions.
