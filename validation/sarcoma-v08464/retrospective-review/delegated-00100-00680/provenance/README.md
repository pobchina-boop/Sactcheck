# External clinical integration handoff: v0.84.63 and v0.84.64

These are authenticated external candidates, **not integrated releases**. The handoff records every original application file from git commit`c01f1a2b236afced0c3ebfdb6b6ff864e58e7d4c` (v0.84.59), checks it against the initial campaign manifest, and preserves that byte snapshot independently of later candidates. All ten application files still matched those originals when this handoff was built. Recheck the appropriate release immediately before application; a mismatch requires deliberate reconciliation, not overwriting or recapturing the changed file as its own baseline.

`integration-handoff.json` provides exact absolute source paths, local preserved copies, hashes and transition files. Its stages are:

1. `00-original-application`: verified original git bytes, not a current candidate copied as baseline.
2. `10-base-clinical`: latest independently challenged clinical draft before the product overlay.
3. `20-product-overlay`: explicit Mitoxana/NCCP organ reconciliation, when applicable.
4. `30-cns-semantic-overlay`: separate central versus broad neurological-event correction, when applicable.
5. `40-final-candidate`: the exact external clinical candidate to evaluate for later integration.

The final stage is identical to the latest applicable clinical stage; it is not a second implementation. The accepted00391/00392 safety pair belongs to the parent's v0.84.62 transition and is intentionally outside these two new-suite batches. Its accepted bytes and previous seven-suite evidence remain immutable.

| Intended release | Code | Original protocol ID | Candidate protocol ID | Required new alias |
|---|---|---|---|---|
|0.84.63|00420|nccp-00420-v4|nccp-00420-v4|None|
|0.84.63|00463|nccp-00463-v4|nccp-00463-v4|None|
|0.84.63|00100|nccp-00100-v6|nccp-00100-v6|None|
|0.84.63|00596|nccp-00596-v2|nccp-00596-v2|None|
|0.84.63|00680|nccp-00680-v2|nccp-00680-v2|None|
|0.84.64|00675|nccp-00675-v2|nccp-00675-v2|None|
|0.84.64|00747|nccp-00747-v2|nccp-00747-v2|None|
|0.84.64|00504|nccp-00504-v2|nccp-00504-v2|None|
|0.84.64|00754|nccp-00754-v3|nccp-00754-v3|None|
|0.84.64|00757|nccp-00757-v2|nccp-00757-v2|None|

All ten old/candidate versions agree with the retrieved current NCCP source versions. No version update or new alias is justified for these ten. Preserve any pre-existing aliases; do not manufacture aliases for nonexistent versions. Unlike earlier campaign batches, this handoff has no verified footer/change-log version disagreement requiring an ID adjudication.

Source discrepancies remain explicit despite the unchanged version IDs. MAP retains contradictory renal units/thresholds and rescue timing/threshold advice without a numeric rescue calculator.00504 retains the day35/one-week wording conflict and irinotecan renal eligibility/product inconsistency. VIT retains its125/150mg/m² escalation wording discrepancy and age/listing boundary. IE/VAC retains phase, radiation and no-re-escalation exceptions independently for each calendar. The Mitoxana product organ restrictions differ from the NCCP ifosfamide tables; actual supplied product and local prescription require oncology/pharmacy reconciliation. Source labels and supplementary product dates must identify the current live-linked product document rather than blindly repeat an older NCCP reference date. The linked historical Irish Cosmegen licence is withdrawn; patient/knowledge content identifies the current UK supplement and requires local product review. None of these discrepancies is resolved by changing a protocol ID.

Every source text has its own SHA-256. No text or retrieval-JSON hash is a PDF-binary hash, and no page-marker extraction is visual table inspection. Clinical/pharmacy approval and actual local product verification remain unverified.

## Integration metadata boundary

Each `proposed-metadata-transitions/<code>.json` is a **prospective proposal**, keyed to the exact final candidate hash. It lists individual JSON paths, exact prior values and suggested integrated-state values. It may be applied only after deliberate local integration and appropriate acceptance checks, with the resulting before/after hash and explicit applied transition recorded separately. It is not permission to rewrite immutable historical snapshots or broaden the clinical rules.

The proposals correct obsolete encoding-release/maturity labels, external-draft status text and source-artifact paths. They retain clinical approval=false, source-conflict-authority resolution=false, visual-source verification=false and PDF-binary hash=null. Patient document generation, index/card/register rebuilds and integrated clinical/UI checks must have their own recorded evidence. A future integrated protocol hash is expected to differ after these explicit metadata transitions; it must not replace the archived source-author hash in old evidence.

Run `python verify-handoff.py` to authenticate the external chain. Before application, use `python verify-handoff.py --release 0.84.63 --application-preflight` (or0.84.64) to compare only that release's five live application paths with their independently preserved originals. A failed comparison is a stop for reconciliation, not a request to refresh the expected hash from the live file.

The base v63 evidence is650/650 author and197/197 independent cases. The corrected base v64 evidence is1283/1283 author and225/225 independent cases. The accepted seven-product overlay has469/469 author,347/347 independent product-contract and26/26 pair-semantic checks. The later five-semantic transition has120/120 author checks; its separate independent report must be pinned before final integration. Keep these stages distinct instead of presenting one blended total as a single final-candidate test run.

The source-author scripts in earlier folders generate older stages. Do not run them directly over an integrated final candidate and silently remove the later product/CNS corrections. Apply the complete authenticated chain or use the exact final candidate, then record any permitted provenance transition explicitly.
