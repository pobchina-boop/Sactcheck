# Immune-regimen source audit — v0.84.40

Current checks: **571/571 passed**. Positive witnesses:00431 **83/83** rules;00812 **75/75**. These exercise the actual assessment engine, local laboratory conversion and dose renderer. Independent approvals remain false.

Baseline checks: 287/569 pass; 282 unmet updated expectations. This is not a count of distinct clinical defects.

## Retained current sources

- NCCP00431 v11, 11 pages, retrieved2026-11-06: [https://healthservice.hse.ie/documents/6734/431_Nivolumab_1mg_Ipilimumab_3mg.pdf](https://healthservice.hse.ie/documents/6734/431_Nivolumab_1mg_Ipilimumab_3mg.pdf). PDF SHA-256 `301ea53270f9609ea4f8e1a042eb3d1d91ebfc8240a1a95af2d30d4472b19cfe`.
- NCCP00812 v3a, 8 pages, retrieved2026-11-06: [https://healthservice.hse.ie/documents/6426/812_V3a_Cemiplimab.pdf](https://healthservice.hse.ie/documents/6426/812_V3a_Cemiplimab.pdf). PDF SHA-256 `850b4b9122fcef20727f7e102c3ff02207fed801213b0142542dc05c86c8131b`.

The earlier403 byte-capture limitation was resolved through an ordinary HTTPS request with a conventional User-Agent and the official assets.hse.ie redirect. TLS verification remained enabled. Full PDF bytes, text and source table renders are retained.

## Findings

- **00431-SOURCE**: Current NCCP is v11 (20Aug2026), whereas encoding claimed v10. New HCC indication introduces distinct liver rules, Child-Pugh eligibility, first-maintenance timing and monotherapy duration. Canonical nccp-00431-v10 ID retained as a compatibility identifier; metadata/source version explicitly11. HCC patient service is not marked complete. (source pages[1, 3, 6, 11]).
- **00431-GRADES**: Replace generic grade3 hold logic with organ-specific pneumonitis, colitis, hepatitis, nephritis, endocrine, rash, myocarditis and overlap hold/permanent-stop rules. CTCAEv4 is explicitly required by source. Existing generic v5 attribution removed. (source pages[5, 6, 7, 8, 9]).
- **00431-HISTORY**: Add recurrence, refractory-to-steroid, life-threatening, persistent grade2/3, inability-to-taper and SJS/TEN pathways. Recovery/consultant confirmation cannot override permanent stops; both combination components hold together. Myocarditis restart remains specialist uncertainty. (source pages[4, 5, 6, 7, 8, 9]).
- **00431-SCHEDULE**: Encode four21-day induction cycles and four alternative IV/SC maintenance schedules. Melanoma first14-day maintenance waits21days;28-day waits42days. HCC first maintenance waits21days for all alternatives and monotherapy up to24months. Switching14→28 waits14days;28→14 waits28days. SC existed in sourcev10 but was omitted from old encoding. (source pages[1, 2, 3]).
- **00431-HCC-LABS**: HCC current AST and ALT each match their own baseline rather than mixing the highest of different enzymes. Normal baseline/current>3–10; baseline>1–3/current>5–10; baseline>3–5/current>8–10 hold. AST/ALT>10 or bilirubin>3 permanently stops independently of missing baseline. Undefined baseline>5 and missing baseline route to review. (source pages[6]).
- **00812-GRADES**: Add recurrent grade2 pneumonitis stop; first grade3 colitis hold versus recurrence stop; grade3 nephritis stop; bilirubin>3 stop; skin>1week boundary; SJS/TEN suspicion versus confirmation; idelalisib history; neurological/carditis/HLH and infusion rules. (source pages[3, 4, 5, 6]).
- **00812-ENDOCRINE**: Preserve endocrine exceptions: grade3–4 thyroid/thyroiditis/diabetes and grade2–4 pituitary/adrenal are held with possible resumption after grade0–1 or clinical stability. Generic grade4 and persistent12-week non-endocrine stop rows must not erase the exceptions. Source specifies current CTCAE without naming an edition. (source pages[3, 4, 5]).
- **00812-TAPER**: Add organ-specific sustained recovery and steroid≤10mg/day taper gates, persistent grade2/3≥12weeks excluding endocrine, and steroid>10mg/day at12weeks permanent-stop criteria. The source does not give00431 a12-week grace period; rules remain separate. (source pages[3, 4, 5]).
- **00812-INDICATION**: Retain cervical post-platinum indication separately from advanced CSCC. Measurable disease and transplant caution belong to CSCC; post-platinum requirement belongs to cervical. Adjuvant CSCC is not in this NCCPv3a and is not added. (source pages[1, 2]).
- **BOTH-BASELINE**: Distinguish baseline organ impairment (no routine reduction) from treatment-emergent immune toxicity. Do not use a creatinine baseline-or-ULN ratio to invent a CTCAE nephritis grade. Blood counts/endocrine tests remain context where source gives no standalone dosing threshold. (source pages00431pp3,9;00812pp1–3).

## Boundaries and unresolved choices

Recovery flags never override a permanent stop. No rule calculates a reduced immune-checkpoint dose. The renderer may label an explicit “Not to be administered” action as quantified; that is an administration prohibition, not a dose reduction. Grade/recovery uncertainty remains visible.

HCC source information is preserved because the current00431 document is shared; this audit does not declare a completed HCC patient suite. Existing cervical eligibility remains distinct from skin eligibility.

## Validation and integration

Run `SACT_TEST_ROOT=<checkout> SACT_CANDIDATE_ROOT=<stage-or-checkout> node source-cases.cjs`. Add `--baseline` to compare the retained originals. When copied under `validation/skin-melanoma-v08440/immune-source-audit`, the default checkout resolution works. Reports and full before/current case outputs are retained.

Whole-release, browser, patient-PDF/QR and live deployment checks are outside this bounded audit and must be completed by the integrating task. Independent oncology/pharmacy/PPI approval remains pending.
