# PDF and QR regression evidence

These checks cover the existing v0.84.33 patient assets affected by the shared contrast CSS. They do not certify the blocked next clinical batch or current NCCP source validity.

The existing generators were run in a fresh disposable copy at `/tmp/sactcheck-mobile-dev-pdf`, with `/workspace/.sactcheck-tools/venv/bin/python`:

1. `tools/build-colorectal-v08433-pdfs.py`: 71 companion PDFs.
2. `tools/build-patient-handbooks-v08433.py`: 10 guide/card/reference/handbook bundles, after companion generation completed.
3. `tools/verify-colorectal-v08433-pdfs.py`: 20 guide/card documents, 40 QR checks and all 111 scoped PDFs (882 fresh pages). Anatomical text, three-page guides, one-page wallet sheets, matched patient/docs copies, nonempty pages and text boundaries passed.
4. `tools/verify-colorectal-v08433-handbooks.py`: 10 routes, 1,878 retained authored text blocks, no missing or out-of-page text; all bound handbooks retain seven sections in their PDF table of contents.

The fresh large PDFs remain in the disposable copy. No generated PDF was substituted into published patient/docs assets. Git comparison against main commit `0906fc73338de99a9b9ed65a12922691852652f2` confirms all 3,366 tracked PDFs, 2,777 HTML files and 241 image assets in those directories are unchanged. See `published-asset-preservation.json`.

## Previous-release comparison and renderer limitation

`previous-release-comparison.json` compares all 111 generated PDFs with preserved main assets: 103 retain their page count; eight knowledge/handbook PDFs repaginate. All guide/card page counts remain three/one, and all seven handbook section labels remain present. Fonts differ between the prepared renderer and the original publication: fresh Arial resolves to Liberation Sans and some fallback glyphs use Noto, while the committed release uses Nimbus Sans/DejaVu Sans. Reflow changes repeated table headings, page numbers and whitespace. The independent authored-block verifier still retains all 1,878 required reference blocks.

This is **not** a claim of byte or raster identity with the published release: none of the fresh PDFs is byte-identical. The current renderer is not fully reproducible against that release. A temporary command-scoped Arial-to-Nimbus experiment did not restore its mixed-font layout and was discarded; no repository font configuration or production output was changed.

The separate controlled baseline-CSS versus fixed-CSS experiment uses the same renderer on both sides and preserves all three guide pages with identical text, bounds, dimensions and raster pixels. This isolates the contrast fix from renderer differences; it does not erase the previous-release limitation above.

To repeat the whole-PDF comparison after completing generation:

```bash
/workspace/.sactcheck-tools/venv/bin/python \
  validation/mobile-next-batch/pdf/compare-previous-release.py \
  /workspace/Sactcheck /tmp/sactcheck-mobile-dev-pdf \
  /workspace/Sactcheck/validation/mobile-next-batch/pdf
```

The comparison refuses a source checkout whose patient/docs assets differ from the pinned baseline. Raw differences are retained rather than hidden by a success label. Physical printing and live QR destinations were not verified by these local checks.
