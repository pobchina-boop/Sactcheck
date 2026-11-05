# SACTCheck development and release workflow

## Repository and version

- Use the existing checkout. Cloud tasks are already isolated; do not create a Git worktree unless requested.
- Preserve existing user changes and instructions. Read nested `AGENTS.md` files before changing their directories; append new guidance without discarding existing requirements.
- At the start of release work, inspect `git status`, fetch `origin main`, and report the full remote commit SHA and its `package.json` version. Compare local HEAD with that commit before updating anything. Do not reset, overwrite, or invent a requested version that is absent remotely.
- Derive the active release from `package.json` and the canonical release module; derive protocol and patient counts from their current indexes/registry. Historical README text, versioned filenames, cached build output, and previous task reports are not evidence of the current release.

## Local development and validation

- The static application has no npm dependencies. Use the Node major specified by the current CI workflow when available; report a different tested runtime. Do not introduce dependency manifests or lockfiles merely for setup.
- Run `npm run build:pages` and `npm run security:site`, then serve `_site` with `python3 -m http.server 8000 --bind 127.0.0.1 --directory _site`. Confirm HTTP content, not just a process or port. Compare the served release and protocol index with the selected checkout; select patient routes from its current registry.
- Run the current `npm run test:ci` for release validation; inspect its definition and current release-specific scripts so newly added suites are included. Distinguish passing, failing, skipped, and unrun checks. Diagnose historical test/selector failures without disabling assertions.
- During environment setup, keep application source, tests, manifests, lockfiles, and tracked generated assets unchanged. Some tests and generators rewrite tracked reports, HTML, JSON, and PDFs. Run them in a fresh disposable copy outside the checkout (excluding `.git` and `_site`) and keep logs/results there. During an actual requested release, generate required assets intentionally, inspect every diff, and commit the intended outputs.
- Keep TLS, signatures, and checksum verification enabled. Use inherited platform Git/proxy authentication; do not ask for tokens merely because a CLI prompts for login. Never put secret values in documentation, logs, or chat.

## Mobile, PDFs, QR codes, and visual evidence

- Exercise the affected clinician and patient journeys in a real browser at narrow mobile and desktop widths, including navigation, tabs, forms, expandable content, urgent-help links, and PDF downloads. Check overflow, clipping, readable text, visible controls, console errors, and failed local assets. Inspect screenshots; a successful build or browser launch is insufficient.
- Check iPhone/Safari and Android/Chrome Add to Home Screen instructions, the manifest, saved-icon destination, and treatment-specific QR routes. Chromium emulation does not establish real Safari, Android installation, camera scanning, or device printing behavior. Report untested device checks explicitly.
- Use the existing release's PDF generators and verifiers, discovered from the current tools and release scope. Generate a representative PDF, inspect its rendered pages, and validate page count, text retention, bounds, print sizing, and equality of published/compatibility copies. Run the full affected release PDF checks before release.
- Decode QR PNGs and QRs rasterized from PDFs; compare exact destinations with the intended regimen and canonical HTTPS route. Check that those deployed destinations respond correctly. Creating an image or finding a QR filename is not QR validation.
- Optional authoring tools are installed separately at `/workspace/.sactcheck-tools/venv` with pinned requirements in `/workspace/.sactcheck-tools/python-requirements.txt`. They provide WeasyPrint, PyMuPDF, Pillow, qrcode, and zxing-cpp. Node Playwright and `/usr/bin/chromium` support local visual checks. Confirm availability in each restored environment and use the saved environment install instructions when needed. Do not assume live processes survive restoration.

## Complete a requested release

1. Establish the requested scope and verified baseline, implement the authorized changes, and update release metadata and affected generated assets consistently.
2. Run repository/release validation, PDF and QR checks, and mobile/desktop functional and visual checks. Inspect the final diff and retain useful results. Report blockers and repository defects; do not label a mobile release ready based only on a local build.
3. Prepare a concise commit summary and description explaining the concrete behavior change, validation, and remaining limitations. Commit the intended changes and push to the authorized release branch. Continue these steps as part of a requested release without repeatedly asking for permission already given. Never force-push or change unrelated branches to overcome an access problem.
4. Verify the GitHub Actions run for the exact pushed SHA, including the Pages deployment job, using existing authenticated access. A successful Git push proves neither Actions API permission nor deployment success. The current Pages workflow deploys pushes to `main`; a setup or feature branch does not deploy automatically.
5. After deployment succeeds, fetch the canonical deployed release module and representative pages/assets/PDFs; compare them with the release artefacts and test the QR destinations. Check for stale cached content. Report the pushed SHA, release version, deployment result, and any remaining mobile/device limits.
6. If Git write access, required checks, Actions status, canonical-site access, or device validation is unavailable, identify the precise missing capability and mark the corresponding stage blocked or unverified. Do not claim end-to-end release readiness.

The onboarding write-access test is limited to a temporary setup branch; it does not authorize changing or deploying `main` as part of setup.
