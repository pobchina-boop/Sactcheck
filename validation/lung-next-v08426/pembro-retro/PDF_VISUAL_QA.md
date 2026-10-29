# Pembrolizumab final PDF visual QA · v0.84.26

Read-only review on 29 October 2026 using the PDF skill. No PDF authoring marker or canonical edits. All 30 pages across 16 final patient PDFs were rendered at 1.25× with PyMuPDF and each page opened for visual inspection. Rendered images and machine-readable manifest are in pdf-qa/. Final hashes were rechecked after inspection.

**Result: no blocking visual defects found.** No clipped text, overlapping cards, cropped tables, broken symbols or lost page content were seen. Body text, headings and risk tables remain legible. Consent forms are compact single pages with separate treatment-context, risk and signature areas. Empty hospital-contact fields are intentional local-completion placeholders, not missing patient data. Passport cover pages clearly state that the four reusable record sheets are not a prescribed four-cycle course; all eight individual record sheets were inspected.

The anatomy guides show numbered connectors to brain/hormone region, lungs, heart, liver, kidneys, bowel and skin/muscles; connector routing and labels are readable and consistent, with schematic-marker limitation stated. Both guides retain clear urgent symptom instructions. QR graphics are visually clear; machine decoding is covered separately by root validation, not claimed from this visual review.

Timelines correctly distinguish 200 mg every 3 weeks from 400 mg every 6 weeks, IV infusion over approximately 30 minutes, baseline and pre-cycle blood checks, and thyroid testing every 3–6 weeks on either schedule. Adjuvant maximum 12 months is separate from metastatic individual review around 24 months; no mandatory 24-month stop or 12-week thyroid interval is implied. New abnormal-laboratory attribution/review language is visible. The maps are explicitly relative stages rather than booking calendars. Consent explanation distinguishes adjuvant recurrence benefit from unestablished final overall-survival benefit. No personal survival percentages appear in these PDFs.

Support sheets show pembrolizumab alone, minimal emetic risk, no pre-populated routine antiemetic or infusion premedication, and individual prescribing review. Supporting index PDFs are intentionally sparse single-page indexes, not truncated scripts. Lung-facing scope and pending governance review remain visible. Independent clinical authorisation is not implied by this layout check.

## Exact inspected files

| PDF | Pages | SHA256 |
|---|---:|---|
| patient/00455/consent-form.pdf | 1 | `6e78a54824c60a8c9c558189c2cf1faf4333a0da8775f1ef9bbf6c57f4334d10` |
| patient/00455/guide.pdf | 2 | `697d2f6d294f24b8db4c67b0d07614625e06b336074a84d2448998aa93539145` |
| patient/00455/logistics.pdf | 1 | `0866dbe6943d143b92f6702211bb83803f525c8d91a43ce45a4e249990676ca8` |
| patient/00455/passport.pdf | 5 | `0b28f62da0cc826761020e946aa20bf3a20fb57f80489639c1b2a530ac3d02fa` |
| patient/00455/sactcard.pdf | 1 | `dbe015ea87baea39e697a41d3fc58cd0311aff0e9b9a6a1b91f6e2549374cd26` |
| patient/00455/support-monotherapy-q21d.pdf | 1 | `b06e7f7ec1dd42fe13af97649f4748d966c6ca7030e948380e887231b5e8d1fc` |
| patient/00455/supportive-care.pdf | 1 | `28197108ce204b8a6d26c8ed125c853328585b3102c67b2d33a768e6cd488706` |
| patient/00455/treatment-journey.pdf | 3 | `6c86e722ca5f3d764ba66757b0ea862caa6ca61b85cc075922389db1b8cabbff` |
| patient/00558/consent-form.pdf | 1 | `cadcde13b83a8e716d35419c14238e2c40b2e4844baf6e2a9a236f963887c27f` |
| patient/00558/guide.pdf | 2 | `08ec05c5cc5d844ad32a408ec21b62eb90aa6105831efa56d4d7790a40a51cf9` |
| patient/00558/logistics.pdf | 1 | `add56e0d8110d453a1fcfb1c47b6408f32862ebf35b497c26be3d05b5037928d` |
| patient/00558/passport.pdf | 5 | `b6506565e3747ce20eb65b3584ecdd1a92a9a4e8d61ab3e502e4cbcd42117ce9` |
| patient/00558/sactcard.pdf | 1 | `971bf331e9f1ed3a8d95458be8147f7582a1a916e90d9f01357b3016e0f2a228` |
| patient/00558/support-monotherapy-q42d.pdf | 1 | `0d5d19bbc0bd5b6f76bf32bf40e8960557d715794d06ece7ba9c48de65aaa679` |
| patient/00558/supportive-care.pdf | 1 | `9e7ff091873c9a657fdf4cfe8b446d82aa022a67030409a78fd26687071dbf16` |
| patient/00558/treatment-journey.pdf | 3 | `9cf3136201565114d3207a1c1aee2b392681a1825f28d48fff34edffbc1a7180` |
