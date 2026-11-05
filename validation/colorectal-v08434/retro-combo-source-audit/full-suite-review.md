# Independent full-suite consistency review: 00328 / 00330 / 00331

Reviewed 5 November 2026 against retained current NCCP sources and the current CAMPTO supplement. Read-only: all requested corrections are for the parent task.

## C1 — moderate: patient monitoring, treatment map and clinician KB

Codes: 00328. Source: NCCP00328 p4 Table2.

Weekly FBC during a cytopenia-related treatment delay is present in the clinical protocol but absent from patient monitoring summaries and KB monitoring.

**Correction:** Add conditional weekly blood-count monitoring while treatment is delayed for low counts; regenerate affected web/PDF/map outputs.

## C2 — moderate: clinician KB administration / infusion workflow

Codes: 00328, 00330, 00331. Source: Current CAMPTO SmPC p2 §4.2.

Current KB describes order and duration but does not state irinotecan must not be administered earlier than one hour after the end of cetuximab infusion.

**Correction:** Add explicit source-attributed interval to clinician administration instructions; patient appointment text may mention a planned interval without dosing instructions.

## C3 — moderate: phase-specific supportive prescription

Codes: 00328, 00330, 00331. Source: NCCP00328 p7;00330 p5;00331 complications section.

Atropine notes warn against glaucoma but omit the source caution in asthma.

**Correction:** Add asthma caution and clinical review to atropine notes; retain distinction between cholinergic syndrome and delayed diarrhoea.

## C4 — moderate: detailed patient bowel advice and distilled expectations

Codes: 00328, 00330, 00331. Source: NCCP00328 p6;00330 p5;00331 support section.

Patient text asks patients to follow their written plan and seek urgent advice for severe symptoms, but does not explicitly direct starting their supplied rescue plan and electrolyte fluids at the first liquid stool.

**Correction:** State act at the first liquid stool using the individually supplied plan and fluids; contact the team early, do not wait for severe diarrhoea. Do not turn generic numeric clinician reference into an unissued patient prescription.

## C5 — minor: supportive-care HTML footer

Codes: 00328, 00330, 00331. Source: Current generated output consistency.

Generated support pages still display SACTCheck v0.83.8 while current patient/consent pages show0.84.34.

**Correction:** Use active release for affected output footer or explicitly identify0.83.8 as template revision so it cannot be mistaken for clinical content version.

## Retained consistency

The weekly versus fortnightly schedules, 46-hour pump limited to FOLFIRI, separate Day 8 support, source-specific IV premedication, post-treatment mineral surveillance, detailed anatomical anchors, consent risks and patient/clinician dose-decision boundaries are retained. Engine count thresholds and component hold/restart behavior have 525 passing source-derived cases.

The generated guides are three pages each and consent PDFs one page each. The complete handbooks contain 40, 35 and 34 pages respectively. Their extracted text contains the current release and correct agents; this is not a claim of visual pagination or QR validation.

The parent must address the five findings, regenerate affected outputs and run final visual/PDF/QR/package checks. Independent clinician and pharmacy review remains separate.


C1–C4 applied to the three authored patient profiles, scoped clinician KB rows and scoped phase-support prescriptions. Rich anatomy is unchanged. No numeric patient self-dosing instructions were added. Parent regeneration and final PDF/browser review remain pending.
