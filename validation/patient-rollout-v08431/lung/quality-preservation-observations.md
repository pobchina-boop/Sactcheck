# Read-only quality-preservation review

Review snapshot: current v0.84.31 working tree, 3 November 2026. Scope: five lung summaries, original full knowledge pages, authored anatomy arrays and the new shared anatomy hook. This task made no canonical changes.

## What remains intact

For all five codes (00568,00353,00655,00689,00271), the current knowledge.html, consent-form.html, passport.html, treatment-journey.html and qr.png bytes still match the frozen v0.84.30 baseline. Each authored anatomy array also exactly matches the committed v0.84.29 source, unchanged by v0.84.30. Counts are respectively8,6,7,8,7 organ/effect cards. Evidence is in preservation-observations.json.

The original full OncoWiki pages remain substantial: approximately95KB for00568,36KB for00353,66KB for00655,91KB for00689 and75KB for00271. They contain mechanism explanations, detailed treatment/monitoring, practical preparation, support, living with treatment, evidence, questions and sources. Four have multiple original inline SVG visualisations. These assets should remain the depth layer; they must not be regenerated through the compact three-page renderer.

The new anatomical renderer reuses the existing full-body raster, authored agent names, symptom descriptions, numbered locations and coordinates. It is not the old generic rounded-rectangle stick figure. Preserve that fidelity in both the pack and application overlay; do not reduce it to plain symptom badges or a generic silhouette.

## Required minimal integration changes

1. **QR destination:** qr.png is still unchanged from baseline; no new QR generation appears in the current rollout tools. To meet Paul's clarified design, create a dedicated onco-wiki-qr.png pointing exactly to `https://sactcheck.com/patient/{code}/knowledge.html` for each selected code and use it in the new wallet/three-page sheet. This avoids silently changing every legacy document that also uses qr.png. Decode the generated artifact and rendered PDF QR. Keep old qr.png intact unless the root explicitly regenerates every affected legacy asset. I could not decode current QR bytes here because OpenCV is absent in this subtask environment; unchanged-byte status is verified, not its decoded destination.
2. **Prominent full-information route:** the new compact index currently puts its full knowledge.html link inside collapsed “More about my medicines”. Put an always-visible “Open full OncoWiki” action beside the three-page download. Also put short contextual links to the existing full-cycle, source, symptom and preparation sections where the target IDs actually exist. Do not claim that the compact index is the entire patient information resource.
3. **Consent boundary:** add a short line on page1: “Keep this summary with your consent discussion and prescribed treatment plan. Your team confirms your setting, phase and medicines.” Link to the existing consent discussion aid from the compact web page. The full consent risk content already remains intact; don't merge it into a reduced anatomy list.
4. **Protected visual precedence:** patient-support-v0750.js currently returns any authored shared map before evaluating dedicatedRegimenMap and the bespoke00831 HCC map. The new export covers all authored canonical maps, so it can bypass richer pre-existing visuals outside the five selected lung regimens. Preserve bespoke/dedicated precedence or restrict the override to explicitly reviewed cards. In particular preserve00831's drug key, immune-versus-vascular distinction and separate jaw/PRES alert. The shared renderer's decorative alternating colours must not silently replace a map where colours previously conveyed drug classes.
5. **Important00568 support detail:** the compact preparation says only to continue folic acid and B12. The full page retains precise timing, but these are safety-critical actions worth a compact sentence on page1: “Start prescribed folic acid and B12 before pemetrexed. B12 repeats every three cycles; folic acid continues for21 days after the last dose.” Refer to the written prescription for doses and full lead-in instructions. Reflow and verify three pages; do not reduce the toxicity font to make room.
6. **Anatomical anchors:** retain authored labels/coordinates and explicit agent attribution, and inspect rendered connectors after layout. Blood-count/skin/nerve effects are schematic, not discrete-organ claims. Ensure white space and connector overlap never force descriptions out of the page. The authored toxicity list is selected effects, while consent and OncoWiki preserve the fuller risk discussion.

## Summary information appropriately deferred to OncoWiki

-00568: full vitamin/steroid instructions, immune symptom explanations, biomarker context and study evidence.
-00353: exact missed-dose and tablet handling instructions, cardiac-test context, treatment-setting limits, interaction checks and evidence by indication.
-00655: detailed recovery after chemoradiotherapy, immune/endocrine complications, and separately labelled supplemental imaging recommendations.
-00689: precise IV/SC and IV/oral prescription alternatives, multiday antiemetic plan, induction/maintenance distinctions and delayed immune effects.
-00271: prescribed oral etoposide instructions, kidney-dose verification, hearing/nerve review, full support plan and evidence context.

Deferring these from a three-page distillation is reasonable only when the complete source material remains present, reachable through the QR and clearly signposted. It is not permission to delete the original chapters or visualisations.
