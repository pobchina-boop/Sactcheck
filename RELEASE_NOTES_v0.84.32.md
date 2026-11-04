# SACTCheck v0.84.32

Five new colorectal full suites: 00660 5-FU/folinic acid; 00421 continuous 5-FU with radiotherapy; 00427 modified Roswell Park; 00428 modified QUASAR; 00486 FLOX.

Five retrospective audits: 00209 mFOLFOX6; 00321 CAPOX; 00227 FOLFIRI; 00586 capecitabine with radiotherapy; 00623 bevacizumab/capecitabine.

The update includes assessment thresholds and dose actions, knowledge/evidence, consent support, supportive care, treatment and monitoring plans, patient portals, anatomical three-page packs, wallet cards/QR codes, passports and full printable handbooks. It corrects partial-input hold rules, adds current-dose history safeguards, preserves regimen-specific boundaries and exposes source conflicts for consultant review. FLOX supportive-care selection follows the actual treatment day. NCCP 00421 source metadata is updated to v6.

Across 39 patient routes, document identity, individual-plan wording and placeholder/backup contacts are clearer. Rich anatomical illustration is retained; FOLFOX/CAPOX anchors are expanded. Full printable references remain available in logical sequence.

Validation: 262 regression commands; 205 new source-based clinical cases; 117 QR checks; 39 three-page packs and wallet sheets; 39 reference/handbook pairs; 66 companion PDFs. See `validation/colorectal-v08432/` for the audit, source hashes, scope and results.

Colorectal working coverage is 26/41 candidate contexts, with 15 remaining. Independent clinical, pharmacy and patient/PPI approval remains pending; this release does not authorise routine clinical use.

## Apply the update

1. Start from the committed v0.84.31 repository (base `0a8ee052fb3315d11cb07d9a9747b6e1c7322229`). Preserve any later local changes before applying.
2. Extract `SACTCheck-v0.84.32-update.zip`.
3. Copy the extracted contents into the repository root and replace matching files, retaining directory paths. Do not upload the ZIP itself as the website update. Do not delete unrelated files. No file deletions are required.
4. Inspect the changed files. Run `npm run test:ci` if using a local checkout.
5. Commit and push using the text below. Deployment occurs through the repository's existing workflow; it has not been performed as part of this package.

## GitHub commit summary

```text
v0.84.32: expand colorectal suites and reconcile clinical decision rules
```

## GitHub commit description

```text
Add complete service suites for 5-FU/folinic acid (00660), continuous 5-FU with RT (00421), modified Roswell Park (00427), modified QUASAR (00428) and FLOX (00486).

Complete retrospective audits of mFOLFOX6, CAPOX, FOLFIRI, capecitabine/RT and bevacizumab/capecitabine. Reconcile blood-count, liver, renal and recurrent-toxicity rules; correct incomplete-input holds; require current component dose levels before calculating level reductions; and expose ambiguous source boundaries for consultant review. Update 00421 to source v6 and make FLOX supportive care treatment-day specific.

Connect assessment, evidence/knowledge, consent, supportive care, treatment/monitoring plans, patient portals, passports and printable assets. Improve source/document identity, individual-plan wording and placeholder/backup contacts across 39 patient routes. Preserve detailed anatomical toxicity information and regimen-specific wallet-card QR codes; expand FOLFOX/CAPOX anchors and retain complete offline handbooks.

Validation: 262 regression commands passed; 205 new source-based clinical cases; 117 QR checks; 39 three-page packs and wallet sheets; 39 reference/handbook pairs; 66 companion PDFs. Audit findings, source hashes and coverage records included.

Working colorectal coverage: 26/41 candidate contexts, 15 remaining. Independent clinical, pharmacy and patient/PPI review remains pending.
```
