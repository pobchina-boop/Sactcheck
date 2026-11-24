# Sarcoma batch 5 — external patient and clinician drafts

Prepared for future release 0.84.64. No application files, clinical rules, release registry, generated patient site or PDFs are changed by these drafts.

| Code | Authored schedule |
|---|---|
| 00675 | Fourteen alternating administrations, normally every 14 days; starts with ifosfamide/etoposide |
| 00747 | Fourteen alternating administrations, normally every 21 days; adult schedule and its own growth-factor plan |
| 00504 | Irinotecan/temozolomide days 1–5 every 21 days; six planned cycles |
| 00754 | Nine 21-day IVADo cycles with three distinct phase calendars |
| 00757 | Vincristine days 1/8 plus irinotecan/temozolomide days 1–5, every 21 days; twelve planned cycles |

The `overlay/` contains five complete profiles, a clinician knowledge addendum, and surgical integration fragments for workflow, support, journeys and presentation routes. It is a candidate data overlay, not a release ZIP. The two author scripts reproduce it externally against the clinical drafts and retained current national source texts.

`source-review/agent-consent-definitions.json` contains eight medicine mechanisms and full risk discussions, the general chemotherapy discussion, source URLs, and explicit current-product retrieval/licensing limits. Dactinomycin remains optional only in the final two even IE/VAC administrations. Pneumocystis prevention is required in the temozolomide regimens and considered individually in IVADo. All five first-page summaries name the tests and source-supported timing; detailed monitoring cards have separate purposes and timing.

The independent focused content review is preserved with original hashed snapshots. Its seven findings are closed in `source-review/independent-consent-support-closure.json`: explicit glaucoma exclusion for atropine; IVADo mesna continuation into day 3 without an extra starting dose; temozolomide liver tests after every cycle including the last; vincristine-only day-8 support; irrelevant mesna-pump wording; clear VIT oral-dose sentences; and accurate qualification of the final VC antiemetic policy.

`check-rendered-candidates.cjs` uses the application's actual chronology and clinician-evidence renderers. It verifies all fourteen alternating administration numbers, both interval calendars, IVADo phase switches and mesna continuation, sixteen supported efficacy endpoint cards and two separately rendered toxicity paragraphs. Results are in `rendered-candidate-checks.json`; small renderer previews are in `render-preview/`. These are content/renderer checks, not visual approval of the finished website or PDFs.

The final five clinical input hashes are now pinned in `final-clinical-inputs.json` after the parent accepted the independently checked CNS/product overlay. The three ifosfamide inputs match the accepted semantic overlay; 00504 and 00757 retain their independently accepted final files. The original candidate snapshots and explicit final input transition remain preserved. This source/software acceptance is separate from independent clinical and pharmacy approval. No current national PDF-binary hash or visual table inspection is claimed: the retained source hashes identify official extracted text.

## Reproduce externally

```bash
python3 author-sarcoma-patients-v08464.py --repo ../Sactcheck --clinical-manifest final-clinical-inputs.json
node check-rendered-candidates.cjs ../Sactcheck
```

Future integration needs a scoped application helper, release/context registry wiring, approved pack dispatcher, complete generic/agent consent transform, stable declared guide/wallet/reference/handbook links, actual HTML generation, full PDF/QR and visual review, and independent clinical/pharmacy acceptance. Do not copy the whole external preparation folder into the repository or claim those remaining stages have passed.
