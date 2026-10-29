# v0.84.25 vinorelbine and bevacizumab lung context audit

Checked 29 October 2026. Three current official NCCP PDFs (00232 v5, 00259 v6, 00215 v7), route-specific HPRA product information, current EMA Avastin information, antiemetic guidance and primary lung trials were retrieved or read. Critical NCCP and product dose tables were visually inspected; hashes and page references are in sources.json. All clinical/pharmacy authorisation remains false.

## Changes

- Correct the IV vinorelbine explicit indication map: breast 00232a, NSCLC 00232b and ovarian 00232c. The old ovarian metadata incorrectly used 00232a and omitted breast. Retain legacy `00232-lung`/`00232-gyn` identifiers.
- Restore explicit breast 00259a and lung 00259b oral-vinorelbine codes. Both vinorelbine proposals add an optional tumour-context selector and a review action for an unresolved/other indication. All pre-existing executable dose rules, protocol identities and treatment phases are byte-for-byte preserved in the proposal.
- Add separate complete lung authoring records for guide/reference, consent aid, anatomy, passport, card, practical logistics, chronology, longitudinal monitoring, support and clinician knowledge/evidence. Root integrates these at patient/CODE/lung; existing breast content is not overwritten.
- Remove the unqualified CTCAE v5 label from four 00215 grade inputs. The NCCP table does not state an edition. The historic interface reference is retained separately, while assessment guidance requires the documented event and verified grading policy. No dose thresholds change.

## Clinical distinctions retained

IV vinorelbine uses Days 1 and 8 every 21 days, with blood counts before every administration including Day 8. Its ANC exclusion/table and platelet/product conflicts remain explicit and block automatic numeric doses. Severe liver impairment and product infusion-time differences still require consultant/pharmacy reconciliation. Grade2 neuropathy has conditional recovery/reduction; grade3 stops; grade4 is urgently held rather than inventing a source row.

Oral vinorelbine is once weekly, initially60mg/m² for three administrations, then conditional80mg/m² with120/160mg caps. Escalation depends on nadir history. A single <0.5 or repeated0.5–<1 nadir changes the plan; exactly1 is not silently rounded into an omitted row. Count thresholds, route-specific hepatic bands, capsule handling/vomited-dose safety and potential re-escalation are retained. Oral moderate/high antiemetic support remains separate from minimal IV support, with explicit prescribed duration for a weekly regimen. No invented daily chemotherapy schedule.

Bevacizumab00215f uses platinum treatment for up to six combined cycles then appropriate bevacizumab continuation. 00215g uses separately assessed erlotinib in validated EGFR-mutated first-line non-squamous NSCLC without an automatic six-cycle switch. No ovarian15-month/22-cycle cap or breast efficacy is imported. Bevacizumab is a component; partner prescriptions and risks remain separate. Pulmonary haemoptysis, wound/surgery timing, BP persistence/control and proteinuria units remain explicit. No toxicity dose-reduction arithmetic is introduced.

## Evidence limits

ELVIS supports IV Days1/8 q21d in older adults with advanced NSCLC; its six trial cycles are not the NCCP course limit. The primary report states191 randomised and161 analysed, avoiding secondary-source inconsistencies. Oral Gridelli2004 is a separate56-patient single-arm weekly60→80 study; its activity does not establish comparative survival or equivalence to IV. Jassem2001 oral-versus-weekly-IV evidence and the2025 pooled analysis (including its April2026 correction) were checked and appropriately limited.

ECOG4599 and JO25567 are presented as separate complete combinations. ECOG4599 improved OS in a selected historical non-squamous population, with increased serious bleeding and treatment-related deaths. JO25567 improved PFS with added bevacizumab but did not demonstrate significant OS improvement. Patient materials use qualitative evidence only; trial results are not individual prognosis or rankings of modern options.

## Validation

- 00232: 33 optional inputs; 37 executable rules; stable protocol ID `nccp-00232-v5`.
- 00259: 49 optional inputs; 80 executable rules; stable protocol ID `nccp-00259-v6`.
- 00215: 54 optional inputs; 60 executable rules; stable protocol ID `nccp-00215-v7`.

Proposed mode: 843/843 passed, including 431 preserved source-derived regression cases and 412 contextual/structure/missing-input checks (the contextual count includes two regression-run assertions). Command: `node validation/targeted-lung-v08425/vino-bev/source-cases.cjs`; use `--integrated` after root applies proposals.

The tests use the real assessment engine and dose renderer. Software QA is not independent clinical validation. Root must still perform final integrated regression, patient-route preservation, PDF render/QR and browser checks.

Integrated validation: `node validation/targeted-lung-v08425/vino-bev/source-cases.cjs --integrated` passed **843/843** on 29 October 2026 after root applied the proposals. `integrated-results.json` records this run.
