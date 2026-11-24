# Independent evidence-storage acceptance

Accepted the single-file lossless storage transition. The final reader is SHA256 `3fd3a2f697a9a86c037fc2049e220de8ac217207e1a6d2804e728978e1913309`.

Nine focused checks pass. The 1,071,090-byte gzip decompresses to exactly the preserved 39,759,020 raw bytes, SHA256 `5b00160f906930629ecdc5791fd648643bb0077ff0044cdca8ba3ab45a301653`, including all872 observation records. The original401-entry logical manifest and prior acceptance/evidence manifests remain unchanged. The repository20MB guard, five clinical protocols and five published handbooks remain byte-identical.

The adapter accepts only `compatibility/all-observation-deltas.json` as a virtual gzip-backed path. It authenticates the compression manifest, stored bytes and raw bytes, with bounded decompression. Changed compressed data, a changed mapping and an arbitrary `.gz` fallback all reject. A copied set of441 required physical paths independently authenticates the complete five-protocol chain and401 logical archive entries after relocation. External materialization restores all359 archived compatibility files and their exact original bytes, including frozen scripts.

The initial eight-check result is preserved. A subsequent narrow review identified that a lexical outside-directory check could accept a symlinked parent that resolves inside the repository. The final guard resolves the physical root and closest existing destination ancestor. The added ninth check proves a nested destination through such an alias rejects without creating repository content; ordinary external materialization and overwrite rejection still pass. Only the materialization guard changed after the initial checks; no clinical assessment or test expectations changed.

All444 runtime-required/new packaging paths checked in the main review are Git-visible. The two later realpath-guard evidence files were also checked separately and are not ignored. The original failed source-security log is preserved, SHA256 `0a9942d0437f45ca55b71c8a3c061e2accf15f576f6b921ae42b3f3c10cdc6f1`.

`check-adapter.cjs` is execution evidence. Its byte-for-byte comparison requires the separately preserved original raw audit file; that39.8MB file must not be copied back into the application. For a new review, supply the repository root and the external original raw file explicitly:

```text
node check-adapter.cjs /path/to/Sactcheck /external/path/all-observation-deltas.json
```

Keep `before-pins.json` and `original-source-security-failure/stdout.log` beside the script. The production adapter and its materializer were independently verified portable without reliance on the original repository location. This signoff concerns storage and software provenance; it is not clinical or pharmacy approval.
