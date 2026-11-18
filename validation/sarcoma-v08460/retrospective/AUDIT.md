# Five retrospective source audits — v0.84.60

Scope: 00453, 00602, 00807, 00894 and 00945 only. Checked 18 November 2026. Baseline supplied by the parent: c01f1a2b236afced0c3ebfdb6b6ff864e58e7d4c. No protocol or patient-route changes were made by this audit.

All five links in the current HSE Genitourinary SACT listing were followed and resolve to the audited PDFs. Current official NCCP web text was retrieved afresh and compared with the existing structured rules. Complete extracted line coverage is saved in `sources/*-current-merged.txt`: 00453 284 lines, 00602 418, 00807 162, 00894 225 and 00945 431. These are hashes of extracted evidence, not current PDF-byte hashes. The earlier v0.84.59 PDFs are retained evidence from 17 November, not fresh binary downloads. A current PDF-byte identity claim is not made. The screenshot API returned text-only image markers, so no fresh visual inspection is claimed from those calls.

| Code | Current source | Reconciliation |
|---|---|---|
| 00453 | NCCP v3, pages 1–4; renal/hepatic Table 1 | High-dose/transplant schedule, cell threshold, second-course interval, GFR versus CrCl separation, etoposide bilirubin/albumin context, fluid and renal measurement limits agree in the checked rules. |
| 00602 | NCCP v1, pages 1–5; Tables 1–4 | Baseline ANC differs from on-treatment ANC; paclitaxel and ifosfamide platelet thresholds remain distinct. Current table explicitly permits ifosfamide CrCl ≥50; no equality defect. Cisplatin and paclitaxel printed decimal gaps remain explicit review cases. |
| 00807 | NCCP v2, pages 1–4; HPRA BCG-medac SmPC sections 4.2–4.4 | Intravesical schedule and procedure timing are preserved; product-specific 2–3 week review and acute UTI/immunosuppression/trauma gates remain distinct from asymptomatic bacteriuria. |
| 00894 | NCCP v1a, pages 1–3 | Sequential instillation, induction/maintenance timing, TURBT exclusion and gemcitabine-specific severe adverse effect handling agree. Mirabegron remains correctly identified as a beta-3 agonist despite the NCCP wording error. |
| 00945 | NCCP v2, pages 1–6, Tables 1–7; EMA Padcev SmPC 4.2 | Two schedules, component-specific count/renal/skin/glucose/lung/neuropathy/immune rules and recovery conditions reviewed. Existing strict equality reviews are preserved. NCCP prints EV lung grade >3; current EMA says ≥3. Existing explicit safety reconciliation remains necessary. |

No confirmed new clinical-rule defect was identified within the checked cases. This statement is limited to this source-and-rule comparison, not a claim of comprehensive clinical validation, browser verification or independent pharmacist/clinician approval. Existing governance blocks remain.

`source-cases.cjs` is adapted from the preceding release only after fresh source reconciliation, with added endpoint, attribution and interaction checks. Its first run produced 172/173 passes. The single failure uses an incorrect test input name for the 00453 prior grade-4 non-haematological toxicity flag; it required correction against the declared field and a fresh run. After the service recovered, the fixture was corrected to the declared `previous_grade4_nonhaem` input, every fixture key was validated against the input definitions, and the scoped run passed **173/173**. The initial result remains in `attempt-01-results.json`; current results and errors/elapsed times are saved separately. A follow-up read/save failed before process creation with `exec-server transport disconnected`; one minimal `pwd` reconnection check failed identically. No audit subprocess was left running from those failed calls, and no retry loop was started.

Independent clinical/pharmacy approval: false. Current full-CI and browser acceptance: not established by this audit.

Primary source URLs:

- https://healthservice.hse.ie/documents/6485/453_v3_CarboAUC7Etop750.pdf
- https://healthservice.hse.ie/documents/6411/602_v1_TIP.pdf
- https://healthservice.hse.ie/documents/6424/807_v2_Intravesical_BCG.pdf
- https://healthservice.hse.ie/documents/7616/894_NCCP_Gemcitabine_DOCEtaxel_intravesical.pdf
- https://healthservice.hse.ie/documents/10493/945_Enfortumab_vedotin_Pembro.pdf
- https://assets.hpra.ie/products/Human/19330/Licence_PA0623-004-001_30092024155729.pdf
- https://www.ema.europa.eu/en/documents/product-information/padcev-epar-product-information_en.pdf
- https://www.ema.europa.eu/en/medicines/human/EPAR/betmiga
