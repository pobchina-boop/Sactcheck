# External v63 clinical correction after fresh retrospective review

This is a subsequent, explicit transition from the previously accepted external v63 candidates. It does not replace their source snapshots, original results or prior acceptance records. No application file has been edited. The three protocol IDs remain unchanged, and no alias is needed.

Six nonnumeric `consultant_review` rules are appended. Every existing JSON value, including the prior product/CNS overlay, source-specific dose/stop/restart rules, input definitions, phase calendars, baseline missing-input checks and age logic, is structurally unchanged.

## Confirmed source-context omissions

- **00100:** high-grade resectable osteosarcoma is an indication, not merely a first-visit checkbox. Explicit false diagnosis, surgical-recovery or postoperative-plan information must remain actionable during treatment/restart. Three review cues address the known-negative values without broadening the baseline missing-input gate. The plan cue distinguishes the original postoperative treatment plan from chemotherapy having finished: the source expressly allows mifamurtide to continue beyond chemotherapy completion with monitoring. Current age and age at diagnosis retain their prior, separate treatment; no new age cutoff or automatic discontinuation was introduced.
- **00596:** the source administers both cytotoxics on Days1–5. A planned treatment or requested restart with a missing/outside calendar day needs reconciliation. The existing field means day of cycle and also supports the Day29 count-recovery rule. It was not redefined as an infusion ordinal, reduced by delay days, automatically reset or used to create a catch-up dose. Pure recovery without requested restart remains distinct. Required support for doses already administered continues.
- **00680:** explicitly unconfirmed indication criteria cannot become irrelevant after baseline. A narrow review cue retains the source indication boundary without inferring a new diagnosis, percentage adjustment or permanent-stop rule.

These account for ten of the eleven fresh calibrated retrospective failures. They were losses of actionable context; the original engine results were incomplete partial assessments, not proven whole-patient clearance.

## Separately adjudicated local policy

The remaining00680 finding is a declared generic other non-haematological grade3 value with no actionable effect. NCCP states treatment continues until unacceptable toxicity and that modifications require consultant discussion, but supplies no universal grade3 other-event dosing algorithm. The additional prompt is therefore explicitly labelled **local conservative review policy pending clinician approval**. It requests the named event, whether current or historical, recovery and individual clinical significance. It does not prescribe an automatic hold, percentage reduction or permanent stop. Existing specific mucositis, neurological, organ and named-product rules remain controlling.

## Source and evidence boundaries

The exact retained complete same-day NCCP extracted-text captures are copied under `sources/`. The00596 and00680 URLs were successfully re-opened; the00100 URL returned an accessibility error on this attempt. Its existing complete current capture remains preserved, and the current EMA Mepact product information was successfully reopened and confirms the relevant indication and post-chemotherapy monitoring distinction. No repeated unchanged blocked request was made. These are extracted-text artifacts, not binary PDF checksums or visual table verification.

The fresh independent100-case suite passed unchanged against the three candidates. The focused author suite passed87/87 after correcting two undeclared dose-field names in25 fixtures; the original62/87 report and initial script are retained, and `fixture-correction-ledger.json` records the exact correction. No clinical candidate, expected clinical behavior or dose value changed to resolve those fixture errors. Strict schema passes all three, with the existing `REVIEW_DATE_MISSING` warning retained.

Prior acceptance replays and their exact transition adjudications are stored separately. A historical structural assertion that forbids all subsequent edits is not silently refreshed to current hashes; any expected new review output is described as an explicit authorized addition. Original clinical/pharmacy approvals remain false.
