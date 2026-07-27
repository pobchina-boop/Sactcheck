# SACTCheck GitHub security and production-protection setup

This guide is for the repository owner after committing the hardening files.

## 1. Confirm the automated checks run

Push this update to a temporary branch and open a pull request into `main`. Confirm these checks complete:

- **Validate and test**
- **CodeQL JavaScript analysis** (where CodeQL is available)

Do not make CodeQL a required merge check until its first successful run has appeared.

## 2. Restrict GitHub Actions

Repository → **Settings** → **Actions** → **General**:

- Allow GitHub-owned actions and reusable workflows.
- Set **Workflow permissions** to **Read repository contents and packages permissions**.
- Leave **Allow GitHub Actions to create and approve pull requests** disabled.

The Pages workflow grants `pages: write` and `id-token: write` only to the deployment workflow.

## 3. Protect `main` with a ruleset

Repository → **Settings** → **Rules** → **Rulesets** → **New ruleset** → **New branch ruleset**.

Suggested name: `Protect production main`

Target branch: `main`

Set enforcement to **Active** and enable:

- Restrict deletions
- Require a pull request before merging
  - required approvals: `0` while Paul is the sole maintainer
  - dismiss stale approvals when new commits are pushed: enabled if collaborators are added later
- Require status checks to pass
  - add `Validate and test`
  - require branches to be up to date before merging
- Require conversation resolution before merging
- Block force pushes
- Require linear history

Do **not** require signed commits yet unless GitHub Desktop has first been configured to create verified signed commits. Otherwise the owner may be locked out of routine merges.

For emergency recovery, retain a narrowly controlled repository-administrator bypass. Use it only to restore a known-good tagged release.

## 4. Protect release tags

Create a tag ruleset targeting `v*`:

- Restrict updates
- Restrict deletions
- Block force pushes

Release tags should be immutable rollback points.

## 5. Enable repository security features

Repository → **Settings** → **Advanced Security** or **Code security and analysis**:

Enable where available:

- Dependency graph
- Dependabot alerts
- Dependabot security updates
- Secret scanning
- Push protection
- Private vulnerability reporting

The included Dependabot configuration checks GitHub Actions weekly.

## 6. Switch Pages to the protected Actions deployment

Repository → **Settings** → **Pages**:

- Source: **GitHub Actions**

Repository → **Settings** → **Environments** → `github-pages`:

- Deployment branches: selected branches
- Allow only `main`

Every push to `main` will then:

1. run secret/file checks;
2. regenerate and compare protocol artefacts;
3. run the complete regression suite;
4. build a clean `_site` from allowlisted public files;
5. deploy only after successful validation.

The production artefact excludes `.git`, workflows, tests, tools, package metadata and repository security files.

## 7. Recommended daily workflow

1. Create or switch to `develop`.
2. Make changes and commit to `develop` or a short feature branch.
3. Push the branch.
4. Open a pull request into `main`.
5. Wait for **Validate and test** to pass.
6. Review the changed-files list, especially protocol JSON and generated metadata.
7. Merge the pull request.
8. Confirm the Pages deployment succeeded.
9. Smoke-test the production URL.
10. Create an immutable version tag for formal study releases.

## 8. Account security

On the GitHub account:

- enable two-factor authentication using an authenticator app or security key;
- save recovery codes offline;
- review active sessions and authorised OAuth/GitHub Apps;
- remove unused personal access tokens and deploy keys;
- never commit a token, password, domain credential or analytics secret.

## 9. Study-data boundary

The public repository, Actions logs and public issue tracker must never contain:

- names;
- MRNs;
- dates of birth;
- patient screenshots;
- real treatment records;
- access tokens or passwords.

Do not enter patient-identifiable information.
