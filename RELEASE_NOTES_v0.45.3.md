# SACTCheck v0.45.3

## Direct adaptive PDF generation

This release replaces the browser print dialogue used by the JSON assessment output with a direct standard PDF generator.

Selecting **Generate PDF** now creates and downloads an A4 PDF document. It does not print the surrounding assessment screen and does not depend on browser print CSS.

## Default one-page output

Routine assessments are laid out to fit on one A4 page by default. The document includes:

- regimen title and NCCP code/version;
- active tumour group and indication;
- treatment course and entered cycle/day context where available;
- anonymous assessment ID and timestamp;
- the non-directive encoded-criteria result;
- every entered printable value beside the encoded criterion and result;
- unassessed-domain disclosure;
- the clinician's final decision and rationale/override;
- the permanent clinical decision-support disclaimer;
- page number and source-verification footer.

## Adaptive pagination

The PDF is not forcibly clipped to one page. When a heavily populated assessment cannot fit safely on one A4 sheet, the generator:

- starts a continuation page automatically;
- repeats the document and table headings;
- retains every entered printable row;
- keeps the clinician-decision and disclaimer sections intact;
- adds `Page X of Y` numbering.

The on-screen preview remains deliberately compact, but the generated PDF uses the complete printable row set.

## Output wording

The output continues to report encoded criteria rather than authorising treatment. It does not use `safe to treat`, `treatment approved` or `cleared for chemotherapy` wording.

## Technical implementation

- Added a local dependency-free PDF generator using standard PDF 1.4 and built-in Helvetica fonts.
- PDF creation works offline and creates no patient-data upload or external network request.
- Removed `window.print()` from the JSON assessment PDF action.
- Added an estimated page count beside the PDF output heading.
- Added focused routine one-page and exhaustive multi-page regression tests.

## Validation status

The complete automated repository suite passed. A routine assessment rendered as one A4 page; a 42-row exhaustive fixture rendered as two A4 pages with all rows, clinician documentation and the disclaimer intact. The generated PDFs were rendered to images and visually inspected for clipping, overlap and page-break errors.

Clinical protocol encodings remain pending independent consultant-oncologist and oncology-pharmacy validation.
