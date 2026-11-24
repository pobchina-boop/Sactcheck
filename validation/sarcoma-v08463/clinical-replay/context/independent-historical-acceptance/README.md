# Independent acceptance of the historical regression adjudication

**Accepted as a narrow software contract:** the unchanged source-owner contract replays **20/20**, and all **14 original clinical inputs and complete current observations exactly match** the pinned historical failure ledger. An independent pass also checks every top-level and nested component action: no numerical dose, no completed assessment/clearance, and no ifosfamide-specific hold transferred to etoposide.

The source interpretation preserves the important distinction between the two regimens. NCCP00596 describes severe neurological-event review and subsequent treatment considerations; NCCP00680 explicitly discontinues ifosfamide at neurological grade3 or higher. The latter source-specific stop remains present. A broad neurological grade does not itself establish current CNS involvement. The uncertainty hold and missing product/laboratory/unit holds are explicitly conservative reconciliation policies, not newly invented universal NCCP dose thresholds.

The six supplied-product controls preserve their original low CrCl and contradictory renal-band inputs. They remove the missing-product holds while retaining both NCCP renal review and conflict findings. They also set `cycle_day:1`; therefore they resolve calendar context as well as product information. This is documented rather than described as a single-variable product experiment. Consultant review remains required, with no computed treatment dose.

The linked HPRA product record identifies Mitoxana PA2299/028/001; retained SmPC §4.3 (lines66–68) has product-specific laboratory restrictions, while §4.4 (lines98–110) distinguishes current CNS toxicity. NCCP00596 lines147–165 and184–193, and NCCP00680 lines140–145 and164–165 support the regimen-specific renal/neurological distinctions. Extracted-text artifacts and their source hashes are preserved in `source-evidence/`. Source conflicts, exact supplied-product verification and clinician/pharmacy governance remain outside this software signoff.

The old raw results remain **639/650 author**, **191/197 independent**, and **121/123 CNS semantic**. The three finite historical coverage assertions and two older CNS-only structural assertions are not turned into passes by this acceptance. Separate current coverage evidence and append-only verification retain their own scope.

`independent-verification.json` is the hash-bound signoff. `input-manifest.json` pins the exact contract, source adjudication, original ledger, candidates, runtime and source evidence. Candidate hashes are unchanged from the bounded correction supplied by the source owner.

Reproduce the independent checks with Node.js using a new result name:

```bash
node verify-independent-acceptance.cjs replay-verification.json
```

The unmodified source-owner contract can separately be replayed with `node adjudicated-prior-contract.cjs another-contract-result.json`. Existing outputs are never overwritten. No application checkout or network is required.

No application or git writes were made. Application replay is still pending. **Clinical approval and pharmacy approval remain false.** This signoff covers the exact historical delta and supplied controls only; it is not whole-suite clinical acceptance.
