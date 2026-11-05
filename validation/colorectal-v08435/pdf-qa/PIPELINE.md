# v0.84.35 PDF pipeline

The v0.84.35 tools extend the working v0.84.34 pipeline without regenerating earlier routes. Sources are the current authored HTML and patient profiles. The parent integration task must finish and freeze these inputs before rendering.

Routes: 00455/colorectal, 00558/colorectal, 00551, 00890, 00900, 00732, 00585, 00733, 00447 and 00448.

1. Generate companion PDFs with `tools/build-colorectal-v08435-pdfs.py`. This stages all selected documents, checks nonempty pages and word bounds, and requires consent to retain its full source text on one A4 page before publishing mirrored copies.
2. Generate guides, wallet sheets, full references and bound handbooks with `tools/build-patient-handbooks-v08435.py`. The scoped reference print rules preserve the existing rich anatomical illustration, numbered anchors, connectors and all descriptions. Tables keep cycle labels and timing bands together. Standalone source addresses and seven ordered sections make the handbook readable offline.
3. Run `tools/verify-colorectal-v08435-pdfs.py`. It checks guide and wallet page counts, anatomical and summary text, full-reference paragraph/table retention, mirrored copies, page bounds, support sheets, wallet dimensions, exact image/PDF QR destinations, and render-input hashes.
4. Render and individually inspect representative final pages; automated assertions alone do not establish visual quality.

Use the supplied authoring Python environment with WeasyPrint, PyMuPDF, Pillow and zxing-cpp. Font configuration is shared explicitly between CSS and PDF rendering. Guide/wallet font profile is DejaVu Sans; companion documents preserve their existing DejaVu/Liberation profile where available, with explicit Nimbus aliases for authored Arial/Helvetica text. New consent forms use Liberation Sans. Font hashes and renderer versions are recorded in companion-build.json.

No PDF generation or validation is claimed until corresponding build/results reports exist. Decoded URLs do not establish that new canonical routes have been deployed. Physical printing, camera scanning, real-device installation and independent clinical/pharmacy/PPI review remain separate checks.
