# Integration mapping

1. Copy each `proposed/<existing filename>.json` to the `source_path` in `proposed/integration-manifest.json`, preserving `nccp-00713-v4` and `nccp-00714-v4`.
2. Merge `authoring.json.regimens` into the v0.84.22 release authoring input. It has the established patient/clinical/evidence/journey/selector/support_plans/route/risk keys.
3. Both treatment phases are 42-day cycles. `induction` has **planned_cycles: 1**, two pemetrexed/platinum administrations [1,22]. `maintenance` (UI: immune continuation) has nivolumab [1,22] and ipilimumab 1. Do not create an extra 42-day induction cycle.
4. Passport is four groups: one induction and three immune-continuation pages. `cycle_display: reference-chronology`; `passport_visit_note` states Day 1/Day 22 and drug distinctions. Timeline Day 22 ID is `visit22`, not the legacy `treatment22` paclitaxel hook.
5. Three support plans: `induction` (high), `maintenance-day1` (low, nivo+ipi), `maintenance-day22` (minimal, nivo only). `phase_profiles` uses `induction`, `maintenance_day1`, `maintenance_day22`. Root may map its exact support-script IDs; preserve the risk and active-drug distinctions. High cisplatin reference ID is `nccp-parenteral-high`; carboplatin uses existing `nccp-v8-carboplatin-v08420`.
6. Lung selector input sets `tissue: lung`, `include_in_breast: false`, and builder-recognised `include_in_breast_selector: false`. Source indication wording is broad NSCLC, with a visible pemetrexed-histology review caveat; do not silently substitute squamous eligibility.
7. Run `node validation/lung-core-v08422/nivo-combo/source-cases.cjs --integrated` and retain `integrated-results.json`.
8. Follow the release's site/print/PDF/QR validation. Independent consultant, oncology-pharmacy and patient/PPI review remain pending; clinical-use authorisation false throughout.

Source PDFs, extracted text, rendered table images, real PDF hashes and audit notes are in this directory. No live protocol, common engine, generator, selector or rendered service-suite file was changed by this bounded authoring task.
