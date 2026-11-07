# SACTCheck patient and workflow design standard

The approved presentation uses the original SACTCheck shield/wordmark, navy headings, teal rules and pale panels. It applies to completed regimen suites and is part of the shared generation path for future work.

## Two different patient documents

The **complete treatment handbook** is a full offline reference. It has a branded cover, one actual numbered contents list, clearly separated chapters, PDF bookmarks, linked contents and global handbook folios. Its length follows the useful clinical content. The current five chapter groups cover treatment; schedule, tests and appointments; symptoms and supportive care; records and contacts; and sources. Incorporate unique treatment, monitoring, phase-specific medicine and access/pump instructions once, rather than concatenating overlapping standalone documents. Include one reusable record for each distinct phase and the complete wallet/contact sheet.

The **distilled patient pack** is the existing concise handout. Modern suites retain three pages: treatment schedule/checks; detailed anatomical side-effect map; wallet panels, QR, contacts and phone instructions. The 119 earlier suites retain their complete two-page guide plus their separate wallet sheet. A visual refresh must not discard their additional clinical material to force a different page count.

Patient portals and reference pages must expose the full handbook and reference PDF downloads. The shared transformer adds only missing controls, keeps existing links, and hides the controls in print. A generated file is not a complete patient-facing feature until it is reachable from the relevant page.

## Shared implementation

| Purpose | Shared implementation |
| --- | --- |
| Patient publication and current-route checks | `tools/patient-publication-v08444.cjs` |
| Original patient wording and first-use explanations | `tools/patient-editorial-v08444.cjs` |
| Labelled investigation and molecular visuals | `tools/patient-visual-language-v08444.cjs` |
| Shared visual foundation and route discovery | `tools/patient-visual-standard-v08443.cjs`, `tools/apply-patient-visual-standard-v08443.cjs` |
| Screen and print visual rules | `assets/patient/patient-visual-standard-v08443.css`, `assets/patient/patient-visual-language-v08444.css` |
| Consolidated chapters and PDF assembly | `tools/build-patient-documents-v08444.py`, `assets/patient/patient-handbook-v08444.css` |
| Concise guide print layout | `assets/patient/patient-distilled-print-v08444.css` |
| Supporting document PDF rendering | `tools/render-patient-ancillary-v08444.py` |
| Independent PDF, QR and preservation checks | `tools/verify-patient-documents-v08444.py`, `tools/verify-patient-ancillary-v08444.py` |
| Supportive Guidance/Generate script tabs | `assets/patient/phase-support-v0838.js` |

Run `npm run patient:ui` after intentional patient-content generation. Run `npm run patient:design:check` to confirm the shared presentation is current and idempotent. Generator hooks apply the same design after context routing, including verified frozen source guides.

The initial v0.84.43 presentation-only builder and evidence remain historical records against baseline `67aaa3579794278074478b3f6cce4e57c803e4db`. Do not use that frozen clinical-body approach for a later content revision. The v0.84.44 builder reads current authored HTML and source JSON for the reading content, while preserving verified unchanged anatomy and wallet pages at their original scale. Fresh legacy guides must include the established auxiliary print layout so their anatomical bitmap remains visible and correctly sized. Current phase medicines are included in authored order; superseded on-disk sheets must not be revived.

Future clinical changes should use the current authored source rendering path rather than reusing a prior clinical PDF. The public version comes from `package.json`; the design module's versioned filename does not freeze future document labels.

## Graphic rules

- Numeric treatment dots and bars preserve the authored start/end days and displayed phase.
- Different phases and alternative schedules retain distinct labels and windows.
- Continuous treatment is labelled as ongoing; a displayed reference window does not imply a treatment break.
- Finite-course graphics require an explicit authored course. Wallet stamps are not evidence of the total course.
- Symptom bands remain qualified; a graphic must never imply guaranteed safe days.
- Graphics supplement the existing instructions and remain understandable with text and numbers alone.
- The anatomical image, numbered symptom explanations, urgent instructions, QR destinations and wallet dimensions remain protected.

## Workflow rules

Workflow rows share aligned icon, title and action columns. Patient platform and NCCP source open only through explicit activation. The single visible Solid Tumour SACT selector occupies the available width while haematology is hidden.

Generate consent opens the existing completed branded context-specific form. Supportive care starts with Guidance; Generate script creates the selected authored plan with patient/prescriber fields and source links. It must neither substitute a generic chemotherapy plan for PRRT nor fill unspecified specialist doses. Plans with no medicine rows are labelled as individual support plans.

## Release evidence

The cumulative v0.84.44 scope is the same 228 authored treatment routes across 199 regimen codes, with the five context-selection root pages preserved. There are 109 modern three-page packs and 119 earlier two-page guides with separate wallet sheets. All 228 routes receive a complete reference and a content-dependent handbook. The new editorial/source changes are documented independently from the retained clinical decision rules.

Software completion and a consistent design do not change the recorded clinical review status. Manual ZIP delivery is the current workflow; no commit, push or deployment is implied by generating these files.


## Patient clarity and consolidation: v0.84.44

The 7 November 2026 revision extends the approved SACTCheck visual design. These rules supersede an older preference to retain overlapping standalone documents verbatim inside a handbook.

- Explain each detailed topic once in a logical chapter. Assemble a coherent handbook from shared content, retaining each source's unique instructions and meaningful differences.
- Inventory the standalone journey, logistics and applicable port/pump pages as well as the reference, guide and phase plans. Some earlier bespoke companions contain clinically important details absent from the reference. Match exact statements or document an explicit equivalent; import every unique instruction with its full conditional context. Pin source hashes, freeze reviewed decisions before rendering, and verify the final destinations independently.
- Use a single opening contents page, useful chapter starts and continuous folios. Remove accidental blank pages, orphaned captions and duplicated navigation. Let the useful content determine the length.
- Present treatment through labelled timelines, cycle graphics, investigation symbols and concise tables. Supporting words explain the visual and give exact instructions where necessary; urgent advice remains explicit.
- Introduce unfamiliar abbreviations at first use in each standalone output. Use direct care language: your treatment team, your hospital, or a direct description of the action.
- Name relevant monitoring tests and show their purpose and timing. Keep conditional tumour markers distinct from required safety tests and preserve the verified indication and schedule.
- Use the checked lysine and arginine molecular assets and shared labelled investigation symbols. Never infer a schedule or mandatory test from an icon.
- Write original SACTCheck patient explanations from verified clinical facts. Replace NCCN-based passages independently; retain concise grouped references and internal source provenance.
- Keep the full handbook and standalone distilled pack distinct. Preserve complete offline instructions, detailed anatomy, QR destinations and wallet dimensions.

Run `npm run patient:ui` after intentional generation and `npm run patient:design:check` before delivery. Stage PDF generation, run the appropriate independent verifier, review every reported pagination or geometry exception, and only then invoke publication. Recheck canonical/download mirrors after publication. Release evidence and the immutable prior-package manifest are under `validation/patient-design-v08444/`. Current generators discover authored routes; the 228-route migration record is deliberately fixed to this release and is not a reason to omit new routes from future builds.

The reviewed companion-retention input has the logical name `validation/patient-design-v08444/companion-content-retention.json`. Its exact original bytes are stored as `.json.gz`, together with the large staged and final build reports. `evidence-storage.json` records both compressed and original sizes and hashes. Their source hashes must match the current authored files. Keep final output hashes and verification results in a separate report so publication cannot silently change its own reviewed inputs. Complete duplicate monitoring tables may be removed only when every clinical row and timing column maps exactly to the retained matrix; source-label badges alone do not create a different clinical row. Remove empty topic headings only when their original answer was removed as a verified duplicate.

Use `python3 tools/patient-evidence-storage-v08444.py verify` to check the stored reports. For the unchanged PDF verifier or standalone chronology test, run the command through `python3 tools/patient-evidence-storage-v08444.py run -- <command>`. The helper verifies the original bytes, materializes missing inputs temporarily and removes only unchanged files that it created. For a new build, select only `--input companion-content-retention.json` and write new build reports to the external staging directory. New reports are outputs to review and archive deliberately; never delete or silently replace them as temporary inputs. Keep the full software pipeline and final source package in their compressed storage state so the existing repository size limit remains effective.
