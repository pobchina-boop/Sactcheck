# SACTCheck v0.75.1

## Connected-support panel visibility hotfix

The v0.75.0 right-hand homepage mission card contained the intended four-step
content, but legacy v0.72 `#studyHero` CSS selectors had greater specificity than
some v0.75 light-theme selectors. Step labels and descriptions therefore inherited
white text and appeared blank against the pale card.

v0.75.1 scopes explicit high-specificity colour rules to the mission card and
restores readable header copy, step titles, explanatory text and footer tags.

No clinical decision logic is changed by this hotfix. The release remains cumulative
with the v0.75 patient-facing A4 guide, regimen schedule, toxicity categorisation,
QR routing and supportive-care reconciliation work.
