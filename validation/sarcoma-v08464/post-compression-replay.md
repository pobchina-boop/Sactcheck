# Replay the preserved storage review

Run from the repository root:

```sh
node validation/sarcoma-v08464/post-compression-review-replay.cjs .
```

The wrapper copies the unchanged independent check script, its before-pins file and the original size-guard failure log to a fresh temporary directory. The exact lossless adapter materializes the raw audit JSON in that external directory, after verifying its original SHA-256 and length. The unchanged review script then receives explicit repository and raw-file paths. It writes its result outside the frozen application evidence; no original review report is overwritten.

This repeats nine storage and portability checks. It adds no clinical cases and provides no clinical or pharmacy approval. Normal clinical replay wrappers read the authenticated gzip directly and need no materialized raw file. Keep the ten additional log exceptions in the separate post-compression inclusion record and the earlier 25-log specification unchanged.
