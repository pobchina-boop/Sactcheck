# SACTCheck v0.38.1 — GU catalogue display and alias hotfix

## Corrections

- Made tissue badges context-aware. When a user selects Genitourinary, shared regimens now display the GU icon and colour rather than the first tumour group encoded in the protocol.
- Reordered multi-tissue card labels around the active tissue, for example `Genitourinary · Also: Breast`, so valid shared NCCP regimens no longer appear to be misfiled.
- Preserved shared-regimen inclusion where the same NCCP protocol genuinely contains indications across more than one tumour site.
- Corrected visible prednisolone title casing on abiraterone cards and assessment headers.
- Restricted trade-name matching to drugs actually present in the regimen title or administration components. Drug names mentioned only in indication/history text no longer create false aliases.
- Removed false examples such as Taxotere on abiraterone and Opdivo on gemcitabine/carboplatin when nivolumab or docetaxel appeared only in descriptive indication text.

## Validation

- Added dedicated regression tests for context-aware GU display, title casing and alias precision.
- Full automated regression suite passed.
- Release archive integrity verified after packaging.
