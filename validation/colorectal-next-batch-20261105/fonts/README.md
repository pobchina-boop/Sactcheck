# Renderer and font diagnosis — 5 November 2026

No clinical PDF was replaced. These checks reproduce existing, unchanged source
documents to isolate typography and rendering behavior. They do not establish
current NCCP source validity or complete any new colorectal context. The examples
are the existing **00212 breast** and **00214 lung** routes; their content must
remain separate from future colorectal routes.

The immediate font difference is reproducible and has a concrete solution for
the four examples below: select the existing document's font profile explicitly,
verify the font-file SHA-256 hashes, and pass the **same `FontConfiguration`** to
the `CSS` objects and `HTML.write_pdf`. A single global replacement font is
unsuitable because even one route can contain PDFs from different font profiles.

## Evidence

| Unchanged source | Stored pages | Qualified explicit font | Word sequence and every word box | 108 dpi raster |
| --- | ---: | --- | --- | --- |
| 00212 consent aid | 1 | DejaVu Sans 2.37, regular/bold | Exact; maximum delta **0.0 pt** | **1/1** identical |
| 00214 consent aid | 1 | Liberation Sans, regular/bold | Exact; maximum delta **0.0 pt** | **1/1** identical |
| 00212 existing guide | 2 | DejaVu Sans 2.37, regular/bold | Exact; maximum delta **0.0 pt** | **2/2** identical |
| 00214 approved three-page pack | 3 | DejaVu Sans 2.37, regular/bold | Exact; maximum delta **0.0 pt** | **3/3** identical |

All four qualified cases pass full retained text, page count, exact page/word
sequence, text bounds and pixel comparisons. The complete probe renders **12
variants**, including ambient-font and deliberately different-font controls.
The current ambient renderer reproduces the 00214 consent aid exactly, but
changes the 00214 pack's geometry: its 1,154 word tokens remain in sequence while
the maximum word-box change reaches 455.0123 pt. Replacing DejaVu with Liberation
globally would therefore be inappropriate even when page counts remain three.
See [results.json](results.json). All four deliberately different-font controls are detected. Three
[guard checks](guard-checks.json) also pass: reject output inside the checkout,
reject nonempty output directories and reject an unreviewed font-file hash.

Two additional parts of the established legacy rendering pipeline are required:

- Legacy `.suite-guide` documents need
  `assets/patient/pdf-layout-v0838.css`. Omitting it made the 00212 diagnostic
  guide grow from two to three pages in an initial scratch experiment.
- Legacy SVG connector lines need the explicit stroke presentation already used
  by `tools/build-targeted-v0849-pdfs.py`. Applying only fonts and layout gave
  identical text geometry but removed anatomical connector lines. Reusing that
  established SVG preparation restored **complete raster identity**, including
  the detailed anatomical illustration, numbered anchors and connectors.

The probe uses those existing legacy rules in memory; it never rewrites the
source HTML. New `.ps-body` packs retain their existing rendering contract.

## Reproduce without changing the checkout

Use a new or empty output directory outside the checkout:

```bash
cd /workspace/Sactcheck
/workspace/.sactcheck-tools/venv/bin/python validation/colorectal-next-batch-20261105/fonts/diagnose.py --output-dir /tmp/sact-font-probe-review
```

The diagnostic refuses a nonempty output directory or an output path within the
checkout. It fails if a pinned font file is missing or its hash differs. An exit
code of zero requires all four qualified profiles to preserve word positions
and every raster page exactly. A different font or renderer installation must
be investigated; do not relax these assertions.

The successful run used Python 3.12.14, WeasyPrint 70.0, pydyf 0.13.0, Pango
15603 and PyMuPDF 2.1. Font versions, exact paths, SHA-256 values and package
versions are recorded in [renderer-manifest.json](renderer-manifest.json).
DejaVu, Liberation, Nimbus and Noto fonts are already installed. No fonts,
packages or network settings were changed.

## Pages actually rendered and viewed

The seven unretouched PNGs below were opened for visual inspection. The
reproduced 00212 anatomy page retains all six anchors and connector lines.
The reproduced 00214 anatomy page retains the detailed illustration and all six
regimen-specific explanations. Its wallet page retains both card panels, cutting
and folding instructions, cycle record, QR and clearly marked example contacts.
The current consent aid retains its complete risk list, fields, signatures and
darker captions.

| Page | Stored PDF | Explicitly pinned reproduction |
| --- | --- | --- |
| 00212 legacy anatomy page | [PNG](00212-guide-DejaVu-stored-p1.png) | [PNG](00212-guide-DejaVu-pinned-p1.png) |
| 00214 pack anatomy page | [PNG](00214-guide-DejaVu-stored-p2.png) | [PNG](00214-guide-DejaVu-pinned-p2.png) |
| 00214 consent aid | [PNG](00214-consent-form-Liberation-stored-p1.png) | [PNG](00214-consent-form-Liberation-pinned-p1.png) |

[00214 reproduced wallet page](00214-guide-DejaVu-pinned-p3.png).

## Limits before replacing any affected PDF

This is **four qualified same-source examples**, not proof that all ten requested
contexts or every PDF can already be regenerated safely. The
[existing target inventory](existing-target-pdf-fonts.json) records 79 existing
root-route PDFs across the ten requested codes; these are not evidence of
completed colorectal contexts. There is no root PDF directory for 00244.
Existing mixed Nimbus/DejaVu/Noto reference and handbook profiles still require
their own controlled comparisons before replacement. The previous UI release's
intentional chronology changes must not be conflated with font substitution.

After current official clinical sources become accessible, qualify each changed
document and context, preserve the approved three-page/anatomical presentation,
and separately check new clinical text, anatomy, all page bounds, physical wallet
dimensions, mirrored PDFs and QR decoding. Exact raster reproduction proves the
rendering method for unchanged examples; it does not validate newly written
clinical content, live QR destinations, actual printer output or PDF screen-reader
reading order.
