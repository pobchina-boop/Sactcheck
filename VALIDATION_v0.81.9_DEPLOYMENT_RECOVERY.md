# Validation — v0.81.9 deployment recovery

- Git tree comparison showed that among the 39 protected index/guide/passport assets, only `patient/00568/index.html` differs from the last successfully deployed commit `61697507`; all protected PDFs are the same Git blobs.
- The failed latest manifest had replaced the v0.81.8 guide fingerprints with stale hashes. This patch restores the previously passing guide hashes/byte counts while preserving the new 00568 index fingerprint.
- Focused static regression test passes.
- No protected PDF bytes are included or modified in this patch.
- Live Pages success is not claimed until the patch is pushed and the GitHub Action completes.
