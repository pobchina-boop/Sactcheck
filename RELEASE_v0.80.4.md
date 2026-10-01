# SACTCheck v0.80.4 - Stability + Patient Portal Family Fix

v0.80.4 is a regression-control release rather than another visual hotfix. It restores the approved rich anatomy format for the seven existing dedicated patient portals, adds six further fixed-route pemetrexed-family portals, repairs the Clinic Workflow data-version mismatch, connects the emetogenic traffic light to printable regimen-derived prescribing support, and removes the second asynchronous interface bootstrap responsible for regimen-card action jumping.

The dedicated portal set is now: 00209, 00222, 00317, 00318, 00382, 00568, 00569, 00619, 00713, 00714, 00722, 00831 and 00857.

Pembrolizumab + pemetrexed without platinum is represented explicitly as the maintenance phase of 00568/00569 rather than being assigned a false standalone NCCP regimen number.

All 13 visual treatment guides are two-page PDFs with embedded anatomy and canonical QR destinations. All 13 Treatment Passports are eight pages. A release-specific regression gate now protects the rich anatomy layout and rejects unexpectedly small guide/passport outputs that could indicate a silent visual downgrade.

Patient-facing content remains a clinical-review prototype. Current NCCP/HSE sources, formal consent, prescribing/pharmacy verification, local policy and clinical judgement remain authoritative.
