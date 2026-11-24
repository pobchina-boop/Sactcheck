# Batch-four independent clinical challenge

18 November2026. Five external drafts; no application/clinical JSON writes. Original three-protocol freeze and subsequent MAP/doxorubicin-cisplatin freeze are pinned separately; the intermediate full checkpoint is retained rather than misrepresented as the original state of all five.

**197 independently authored cases: original 161 passed, 36 failed; corrected 197 passed, 0 failed.** The 36 failures represent four issue groups. The identical harness and expectations were replayed against the five corrected external drafts; original failures remain immutable. The five application protocol files and three shared runtime files remained unchanged during this external review.

| Issue group | Failed original scenarios | Mechanism and correction requested |
| --- | --- | --- |
| Mifamurtide schedule phase | 9 | Below-three-day intervals escaped the early-week guard when week was unknown or>12; later/unknown3–<7-day intervals lacked weekly schedule review. Global minimum interval and phase-specific review requested. |
| Ifosfamide required protection and checks | 20 | Recovery/restart or missing stage bypassed explicitly absent mesna, hydration, growth factor, neurological or urine checks. Explicitfalse must remain restrictive independent of phase; requested restart also needs missing confirmations addressed. |
| Mifamurtide legacy negative UI control | 3 | Raw visible:false was overwritten by assessment-engine derived visibility. The legacy negative control therefore remained visible/enabled. Use supported derived visibility while preserving old API true=not-resected and the new positive control’s Yes/No meaning. |
| MAP overdue rescue clock | 4 | A start-anchored24/48-hour MTX sample existed with folinic rescue not started, but a missing/contradictory current-time field avoided the urgent guard. The sample supplies a lower bound for elapsed time; clarify urgently and hold further MTX without withholding folinic rescue or calculating its dose. |

Passing cases include exact renal/indexed-unit/source boundaries, separate component actions, current abnormal results despite restart approvals, differing IE versus high-dose-ifosfamide neuro histories, IE day29 recovery rules, MAP count thresholds by phase, persistent doxorubicin/cisplatin stop histories after recovery, distinct renal restart handling, MTX rescue concentration/time boundaries, clearance-endpoint ambiguity, fixed11-dose non-clearance,96-hour prior-escalation history, and MAP source Day29 versus calendar week29.

The actual UI source was instrumented only in memory to expose its existing render/collect functions. Engine-derived definitions and synthetic controls are tested. This is not a real-browser, screenshot or visual interaction pass. The three UI failures are real derived-visibility failures, not a raw-JSON assertion alone.

An initial exploratory ifosfamide fixture used undeclared phase `restart`; the declared option is `recovery`. The invalid trial is saved separately and excluded from clinical defect counts. Corrected valid11-probe evidence and the full197-case original run are retained. No original failure report will be overwritten.

Full current NCCP texts and relevant product excerpts are pinned as web-extracted evidence. Original PDF binary hashes and actual table pixels remain unverified. Source conflicts, particularly MAP renal measurements/rescue tables and mifamurtide age/support interpretation, remain explicit professional-review requirements. Passing software cases is not independent oncology/pharmacy approval.

The final replay includes the actual engine-supported always-false visibility condition for the legacy mifamurtide field. The positive field remains visible, and the legacy API meaning is preserved. All corrected protocol bytes, runtime hashes and report hashes are listed in `final-review-summary.json`; each corrected draft is archived beside its original. This is a current external-draft validation result, not an applied release or clinical authorization.
