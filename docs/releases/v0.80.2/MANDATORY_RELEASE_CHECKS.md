# SACTCheck mandatory patient pipeline release checks

Saved instruction from Dr Paul O'Brien — 30 September 2026.

Before outputting any SACTCheck regimen update or packaged release, check every regimen included in the release against all four requirements below. Use the established atezolizumab + bevacizumab anatomical patient guide as the visual reference.

1. **Chemo man anatomical image**: Confirm the intended high-quality anatomical figure actually renders, with regimen-appropriate side-effect markers, readable labels, drug differentiation and anatomical linking where applicable. Do not substitute a generic silhouette or organ icon and call the requirement complete. Inspect the rendered in-app guide, dedicated portal and generated output wherever each is provided.
2. **Regimen-specific toxicity information**: Confirm the correct medicines and relevant general, agent-specific and immune toxicities are populated, clearly attributed and consistent with source guidance. Check for missing content and unrelated-drug contamination.
3. **QR code**: Confirm the image renders, decode the generated QR, check the decoded destination, and verify it opens the correct regimen-specific patient portal. Check generated documents as well as the app. A source-string check alone is not an end-to-end QR test. If public deployment is pending or a live check is blocked, state that explicitly and do not claim live verification.
4. **Generated patient passport**: Generate and open the actual patient passport. Verify correct regimen identity, medicines, schedule/cycle structure, relevant symptom recording, emergency contact fields/instructions, QR destination, and readable print/PDF layout. An HTML placeholder or passport heading does not establish that the generated passport is complete.

Include a per-regimen completion checklist with release validation. A regimen is not complete until all four deliverables have been checked. Correct missing or broken items before presenting the release as complete; explicitly identify any unresolved or unverified item.
