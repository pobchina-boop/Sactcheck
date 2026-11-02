# SACTCheck v0.84.27

Five new regimen records: 00483, 00484, 00712, 00792 and 00849. Five retrospective audits: 00713, 00714, 00568, 00569 and 00579.

00849 supplies five complete alternative patient bundles: paclitaxel/carboplatin (00304), gemcitabine/carboplatin (00310), gemcitabine/cisplatin (00281), pemetrexed/carboplatin (00318), and pemetrexed/cisplatin (00317), each with nivolumab. Its root is a selector, not an all-drug patient bundle. Clinical supportive-care selection accounts for both backbone and treatment day.

The batch covers existing assessment rules, indication boundaries, trial evidence and limitations, clinical knowledge, consent, anatomy guides, patient references, passports, cards, date-free monitoring journeys and supportive care. Material source ambiguities remain explicit review findings. Current NCCP and product-information differences are not silently merged.

There are 144 canonical patient records: 143 complete canonical bundles and one backbone selector. Ten additional context bundles (five previous lung contexts and five new backbone contexts) give 153 complete bundles. These counts do not mean that every lung indication is complete or clinically approved.

Validation evidence is retained under `validation/lung-nivolumab-v08427/`, including source audits, executable cases, PDF/QR reports, scoped migration hashes and release checks. The package preserves 4,742 out-of-scope patient files. Source retrieval limitations for the pembrolizumab retrospective audit are documented explicitly in its audit rather than represented as fresh downloaded PDF hashes.

Apply v0.84.25, then v0.84.26, then this overlay. See the separate apply instructions and copyable GitHub commit text. No commit, push or deployment was performed. Independent clinical, pharmacy and patient/PPI review remain pending.

Validation: 1,845/1,845 integrated source cases; 124 PDFs / 218 pages; 57 QR checks; representative browser and visual PDF review; all 246 CI commands pass, including the exact npm test:ci command after clean v24 → v25 → v26 → v27 application.
