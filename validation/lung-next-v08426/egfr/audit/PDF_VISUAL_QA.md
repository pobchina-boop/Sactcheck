# EGFR final PDF visual QA — v0.84.26

Read-only review following the PDF skill. Every page of the 16 final PDFs for patient/00219 and patient/00220 was rendered with Poppler and visually inspected: **30 pages total**. Scratch images are recorded in pdf-manifest.json.

## Result

**Pass after one anatomy correction by root.** Initial guide page 1 in both regimens had overlapping eye (4) and mouth (6) markers that concealed eye marker 4. Reported immediately; root separated eye and mouth anchors and regenerated the two guides. Both pages of both corrected guides were rerendered and inspected. All six numbered callouts are now visible and their connectors identify the corresponding anatomical areas.

No remaining clipping, text overlap, unreadable glyphs, overflow or table-boundary defects were observed. Consent aids, passports, cards, logistics, support drafts and journeys remain legible. Review sheets provide writing space and label their four sheets as reusable review periods rather than four prescribed cycles. Placeholder contact fields are explicit local-completion fields.

Chronology/source review: daily continuous treatment is consistent across documents; no invented fixed course, mandatory echo or chemotherapy cycle. Erlotinib displays food separation, no replacement missed/vomited dose, 60-day blood tests and additional dehydration/liver checks. Gefitinib displays with/without food, the less-than-12-hour missed-dose boundary, pharmacy-led dispersion, clinically indicated blood tests and baseline chest X-ray/CT. Journey stages are relative, not fixed equal-duration appointments. Support PDFs clearly say draft/not issued prescription and do not populate routine oral prophylactic antiemetics. Serious lung, liver, eye, skin/bowel warnings and review-pending governance remain visible.

Minor existing template phrasing: passport free-text box says “Missed tablets / injection changes” for oral-only therapy; this does not prescribe injections and is not a blocking defect. Journey PDF repeats a compact and a source-linked monitoring table on separate pages; both are consistent and legible.

Root reports independent automated page-boundary and QR checks; those are separate from this visual review. Clinical/pharmacy approval remains pending.

## Final PDF fingerprints

| PDF | Pages | SHA256 |
| --- | ---: | --- |
| `patient/00219/consent-form.pdf` | 1 | `0c7122233045ae29fdd90798902f74bf2e2a6f2bc5573a62007070c99f37fc23` |
| `patient/00219/guide.pdf` | 2 | `cd0ad4458b6e9e256e8e690f48c8148b6bb0e21f0dc38451120922701521ddc6` |
| `patient/00219/logistics.pdf` | 1 | `eb0bc1a78590c3b8c0211087167966d0c1388733ee69f32a0457eb3eb4167fd1` |
| `patient/00219/passport.pdf` | 5 | `112f37526df9eea8aa738ce1533f49afbb1a2194c50b63c38d87218f915f54d9` |
| `patient/00219/sactcard.pdf` | 1 | `74401e16454ccff8a37ea39cfacb0425183c02ce73fd2604ee40c555f1018b19` |
| `patient/00219/support-continuous_oral.pdf` | 1 | `04d8e3208162de9312c6e3f5e4b5de9e0941edea902155b02a516690f1460fdb` |
| `patient/00219/supportive-care.pdf` | 1 | `6c2fc02905f808a731abef89d157e3e5b480a0b2d03642cc942448dd3ba73955` |
| `patient/00219/treatment-journey.pdf` | 3 | `7d3bc38cc854fd5bb67c486030eecf2e4250b94c39b38e7653a5915fe5c68940` |
| `patient/00220/consent-form.pdf` | 1 | `3c7b775487502d7bb378d31fdadb27fe8f20ed908364037d8fde660a2a898cba` |
| `patient/00220/guide.pdf` | 2 | `30ac4c52008b0521ca3752904ae6ebe8fa416f84546005533aa0976b5f2ce81d` |
| `patient/00220/logistics.pdf` | 1 | `1a2191d8b85c2104ea32da9148c9381fecec7208cfcdf10b217807ddcfa88eaa` |
| `patient/00220/passport.pdf` | 5 | `0298cd7fa4de5d91353f9096cb022bd154f9b9d9bb568b05c392f7d3e0046c91` |
| `patient/00220/sactcard.pdf` | 1 | `9c6ec32906d100ce51a71be79376a8fc6c5bbae5883d38ac294496bb9cde3704` |
| `patient/00220/support-continuous_oral.pdf` | 1 | `80fb3649c15acd74bf1ffdf399b49c117b4649202068de7f56003cec4af724b4` |
| `patient/00220/supportive-care.pdf` | 1 | `d58b09058a9a969561128ac160d3fe4a8ed3f651dad0b615f83538e818f220e8` |
| `patient/00220/treatment-journey.pdf` | 3 | `f7fcfa0e8cd1d582a7717d517bb2111139ac1ed4803396961ef716a37dad0f60` |
