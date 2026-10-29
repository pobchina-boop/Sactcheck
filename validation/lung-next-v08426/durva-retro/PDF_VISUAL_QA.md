# Durvalumab final PDF visual QA — v0.84.26

Read-only review, 29 October 2026. PDF skill read; no authoring marker needed. All 17 PDFs under patient/00576 and patient/00655 rendered with Poppler at 1400-pixel maximum dimension, all 31 pages inspected on contact sheets. Enlarged individual inspections covered the anatomy guide, practical guide, consent form, symptom table, course timeline and journey milestones. Rendered evidence and machine-readable SHA256/page manifest are in `pdf-qa/`.

**Result: pass. No blocking visual defect found.**

- All pages have legible text, intact boxes/tables, usable margins and intact footer/page identifiers; no clipped paragraphs, overlapping text, broken glyphs or empty unintended pages observed. Spacious single-page support/logistics outputs are intentional.
- Guides show connected numbered anatomy callouts for lungs, head/hormones/nerves, heart/muscles, liver, bowel, kidneys/urine and skin. The schematic-marker limitation remains visible. Callout text and urgent symptom guidance are readable and do not imply guaranteed toxicity.
- Both schedules remain distinct: 00576 every 14 days, up to 12 months/26 cycles; 00655 every 28 days, up to 12 months/13 cycles. Both identify the 42-day post-CRT start window. The 00655 separate course graphic correctly overlaps preceding chemotherapy and radiotherapy and places durvalumab later, with an explicit not-to-scale time-axis statement. The 00576 journey likewise states that concurrent CRT finishes before durvalumab.
- Journey tables distinguish baseline tests, first infusion, later cycles, between-visit symptoms and post-completion/hold follow-up. The added imaging milestone asks patients to follow their agreed plan rather than treating supplemental intervals as mandatory bookings. Stages require no patient-entered dates; passport recording sheets intentionally include visit fields.
- Consent remains marked prototype/governance review required. Support remains a clinician draft, with no routine antiemetic or premedication populated for minimal-emetogenic durvalumab. Independent-review status and urgent-contact placeholders remain explicit.
- Passport tables are readable with all symptom columns present; the four recording sheets are explained as reusable, not a four-cycle treatment limit. QR symbols are visually intact; root's separate automated 40-QR verification supplies decode evidence, not this visual review.

## File identity and page coverage

Every page of every file listed below was visually inspected. These hashes identify the exact reviewed PDFs; later regeneration requires hash comparison/reinspection.

| PDF | Pages inspected | SHA256 |
|---|---:|---|
| `patient/00576/consent-form.pdf` | 1–1 | `af1d827ff1dacbf148331a453f02b8b06076794dce50a4380159f905b4ca787a` |
| `patient/00576/guide.pdf` | 1–2 | `8c37f9327f6a753976ec2033cf30afb95c0febd3300d199d0367adf58ac8d4b0` |
| `patient/00576/logistics.pdf` | 1–1 | `072cf25626464616e223c7158a0fd39e431ae24afc7460bae40fe44f2286f15c` |
| `patient/00576/passport.pdf` | 1–5 | `b634aa26b5402b463565d86bef4f159c2c45b178c6df4b38dbc1dfbe8b926333` |
| `patient/00576/sactcard.pdf` | 1–1 | `084d60841f29fda8d5b1bfe5bc7a142fa3e7e1bd52e5e3fb8f3dd0db64f2825d` |
| `patient/00576/support-durvalumab_consolidation.pdf` | 1–1 | `a09a624c7f1e17c872af7fcdb9cc30af12596c5936cfaf11ac58c44c9c3aec21` |
| `patient/00576/supportive-care.pdf` | 1–1 | `c2c10e7243c7d1b4819743a1ff125c6d96f8c24d227e09298ce2ce37124c797d` |
| `patient/00576/treatment-journey.pdf` | 1–3 | `fe915eb3249ebba790dcc4498d964c961ddff4abe38dd3171d472dbc3199917b` |
| `patient/00655/consent-form.pdf` | 1–1 | `fc74f0cf5d63a8601424fb6e0ada8284720d5352c0ad2924272c69fa3ac6275f` |
| `patient/00655/guide.pdf` | 1–2 | `7b45c373432d2ecdf2e72c916251d9a4c75bfd5aab5b1136dd1142a4971ef5a0` |
| `patient/00655/logistics.pdf` | 1–1 | `b6c8ab14ad86395a7081f013041392d30bf83d3741274fc9ef5690439a05bd3b` |
| `patient/00655/passport.pdf` | 1–5 | `58b542874fc6ee894ed02d25a904b32ecc56271f438ced76db295a587123f9de` |
| `patient/00655/sactcard.pdf` | 1–1 | `2f15ff3aff8fa15214454550ba49438b9ed0259c84d3862fc67b7e88a3c26402` |
| `patient/00655/support-durvalumab_consolidation.pdf` | 1–1 | `defb0f54440885912d19ab86bcf7b6e3a455ca847a81c04d3bf1211969851587` |
| `patient/00655/supportive-care.pdf` | 1–1 | `cfb832fc45daea8e198d42008f93f54d30705715d31f722033deddd391f237ad` |
| `patient/00655/treatment-journey.pdf` | 1–3 | `de247d1e5b797114c78252f3b8fe8735e611ca40be6e8748da92ec549f742e8f` |
| `patient/00655/treatment-timeline.pdf` | 1–1 | `126be93b4876608907600d222f63c3ba4a19b7b7e1bce779f4966014186f8c57` |

No canonical files or PDFs were changed during this review. Software and visual checks do not provide independent clinical authorisation.
