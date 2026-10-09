# The SACTCheck reference regimen

00568 is the reference implementation to refine before broad expansion. This release is its patient-knowledge and consent-discussion foundation, not a declaration that the whole suite has completed clinical validation.

| Audience | Function | Position after this release |
|---|---|---|
| Clinician | NCCP source and deterministic thresholds | Existing; unchanged, ANC-only regression checked |
| Clinician | Knowledge and evidence | Existing; opening journey checked |
| Clinician | Consent discussion generator | Distinct editable/printable 00568 draft restored |
| Clinician | Emetogenic/supportive prescription output | Existing; unchanged; existing regression suite passes |
| Clinician | Administration, interactions and extravasation | Existing workflow functions; retain in final suite checklist |
| Patient | At-a-glance visual guide and anatomy | Approved 00568 assets preserved |
| Patient | Agent-specific toxicity explanation | Existing body map plus new medicine explanation cards |
| Patient | Cycle chronology | New interactive Day 1–21 view with phase/date controls |
| Patient | Extended knowledge | New static page and structured content profile |
| Patient | Practical support and urgent contacts | Existing card retained; knowledge page adds safety prompts and links |
| Patient | Treatment passport and wallet card | Existing 00568 assets preserved |
| Patient | Decision tree | Future, clinician-reviewed deterministic escalation only |
| Patient | Constrained chatbot | Future; no chatbot or model integration in this release |

## Reusable implementation

`data/patient-knowledge/<code>.json` separates content from presentation. It carries schema/content versions, review status, source-check date, canonical protocol ID, agents, phases, cycle length, timeline rows, day explanations, supportive-care topics, questions and source links. `tools/build-patient-knowledge.cjs` produces static patient and consent-discussion pages. `assets/patient/patient-knowledge.css` and `.js` provide shared visuals and optional interaction. Content is readable without JavaScript through the full-cycle text disclosure.

`js/patient-asset-registry-v0810.js` remains the routing authority. The new `knowledge` and `consent-draft` assets are explicitly available only for 00568. Unsupported drafts return null. No new parallel route registry was introduced. The old consent compatibility API remains for other regimens; 00568's workflow now bypasses its patient-information redirect.

To add a regimen: obtain its exact catalogue ID and current official source; author and review its data; register the asset capabilities; generate pages; add its portal navigation; review mobile and print output; run full regression and human-journey tests. Do not copy 00568 medical content or timing into a different regimen. Other cycle lengths and phase structures require their own visual and clinical acceptance even though cycle length is a data field. Existing approved anatomy is a separately protected asset.

No automatic live content scraping changes patient advice. A schema or source update requires a reviewed data change and regeneration. `--check` fails if committed HTML differs from the generated content. The release gate exercises this check.

## Make 00568 the approved reference

Review each statement against NCCP, the individual medicine information and local service policy. Confirm patient language, risk attribution, benefit/uncertainty framing, readability and contact instructions with the clinical team and PPI. Test the complete consultation-to-home journey, including the printed versions. Approval of layout does not establish clinical validation of other regimens.

Before adding a symptom decision tree, define severity triggers, precedence for multiple symptoms, an explicit uncertain/unlisted-symptom route, service availability and a safe failed-connection route. It must not infer safe blood counts from cycle day or dismiss an immune symptom as ordinary chemotherapy toxicity. Test red flags, normal temperature with acute illness, delayed immune effects and inability to reach the service.

A later chatbot should retrieve only reviewed content, show its source/version, decline unsupported answers, avoid medication changes and route urgent symptoms to human assessment. It must never be required to reach emergency advice. Its safety evaluation, privacy model and applicable governance need separate review before implementation.

## Legacy retained and pathways replaced

Retained: existing `/docs/patient/` redirects and byte-identical PDF copies, historic module filenames and traceability versions, the generic patient-support fallback, direct-route locally stored QR images, and the old consent compatibility API for regimens not yet rebuilt.

Replaced for 00568 only: the clinician consent button's previous patient-information redirect. It now opens the distinct discussion draft. No legacy files are deleted. No service worker, new runtime CDN or AI dependency is added.
