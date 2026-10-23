# Early-breast source audit — v0.84.16

Five current NCCP PDFs were retrieved and compared with the encoded rules on 21 October 2026. This is source/software reconciliation; independent clinical and pharmacy approval is pending.

The largest defects were wrong fixed TCHP templates in 00350 (an antibody framework with a separately chosen chemotherapy regimen) and 00775 (paclitaxel/carboplatin TRAIN-2). Their candidates replace the wrong models rather than adding patches around them. The three retrospective candidates preserve existing input names and rule IDs where possible.

Important differences must remain visible: 00350/00775 allow baseline LVEF≥50% after completed anthracyclines; 00722/00731 require≥55% without that printed exception; 00258 specifies>55% with clinical judgement at50–55%. All use separate on-treatment cardiac assessment. TCH/TCHP tables use strict count thresholds and leave exact boundaries unassigned.

00350 lists an adjuvant indication with pertuzumab reimbursement not approved. It cannot produce a complete chemotherapy assessment or a combined-visit antiemetic script without a selected companion regimen. Its printed review date has passed; the current public file is still version3. 00258 has a baselineecho wording discrepancy between TESTS and eligibility. 00775 has a neuropathy/reaction-table overlap requiring specialist clarification.

168 source expectation cases pass against the proposed candidates. Baseline passes51; the difference includes changed keys/IDs and new context cases and must not be reported as117 clinical errors. Existing full-suite tests remain the owner's integration gate.

## Deliverables

- `source-matrix.json`: exact indication, schedule, monitoring, support, administration and numeric table mapping with page references.
- `sources/manifest.json`: downloaded sourceURLs and SHA256 provenance; sourcePDFs and text remain local research inputs.
- `candidates/*.json`: five full candidate protocol objects; no shared protocol files were edited by this audit.
- `source-cases.cjs`: `--proposed` runs candidates; `--baseline` runs preserved baseline; default runs integrated actual protocolfiles.
- `findings.json`: machine-readable findings and validation limits.

Before integration, the owner should compare metadata and preserve any concurrent authoring changes. The build-proposals helper reads live source files and therefore should not be rerun after integration without reviewing its baseline assumptions.
