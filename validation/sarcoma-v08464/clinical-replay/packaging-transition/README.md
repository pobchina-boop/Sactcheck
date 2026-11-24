# Single-file lossless audit storage transition

Only `compatibility/all-observation-deltas.json` (39,759,020 bytes) is physically stored as `compatibility/all-observation-deltas.json.gz` (1,071,090 bytes). The original repository security size limit remains unchanged. The exact 872 complete before/after observation records and their original bytes are preserved.

The old archive manifest, final evidence manifest, final clinical acceptance report and every frozen source/review script remain unchanged. Their raw-path hash is interpreted by the one-path adapter in `tools/lib/sarcoma-v08464-transitions.cjs`. The adapter authenticates the compression specification, gzip bytes and the exact decompressed length/SHA, with bounded decompression. All other paths use ordinary raw-file authentication. The old final report's reader hash is a historical code pin; `code-transition.json` enumerates all four storage-only source edits and the current hash.

The current wrappers automatically authenticate the compressed evidence. To run a frozen Python review requiring the original raw layout, materialize to a new directory outside the repository:

```js
const T = require('./tools/lib/sarcoma-v08464-transitions.cjs');
T.materializeEvidence(process.cwd(), '/tmp/new-sactcheck-v64-evidence');
```

The materializer copies the compatibility archive, restores the exact raw JSON and leaves frozen scripts unchanged. Existing destinations and repository-internal destinations are rejected. Run the unchanged Python script from that copy if a further source-ledger replay is needed. No such additional clinical replay is needed for this storage change.

The post-compression wrapper runs preserve the same 1,269/1,285 raw author result, 225/225 independent result and32/32 current contract. All1,490 full trace records and32 current-contract result records are byte-identical to the preceding installed replay. The16 historical mismatches remain failed. Source-security now passes; its preceding oversized-file failure remains preserved separately by release integration.

New logs here are packaging-review evidence only; they do not change the immutable25 runtime-log specification. `post-compression-acceptance.json` and the independent review record qualify this storage transition. No clinical/PDF/source approval changes.
