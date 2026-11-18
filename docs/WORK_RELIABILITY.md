# Dependable batch delivery

Current sarcoma campaign, 18 November 2026: Paul requested sequential batches of five saved for manual application at the end. This overrides the ten-new-suite cadence below for this campaign. Keep five retrospective audits per batch. Application ZIP members are repository-relative at the archive root, with no UPDATE or project-name wrapper; supply external instructions, commit text and audit evidence separately.

Paul's instruction, 17 November 2026: preserve a dependable, consistent process.
If a check cannot finish, save its log and useful work so a later batch can fix it.

## Start with the last handover

Read `validation/work-reliability/open-issues.json`, the latest batch handover and
its actual files before starting. Verify the checkout, release and source hashes.
A previous pass applies only to its recorded inputs. Never infer a pass from an
old exit-code file, an empty log, a running process or a lost execution session.

Keep the ten new suites plus five retrospective audits. Build the ten in two internal groups of five, checkpoint between them and
deliver one cumulative ZIP with one commit summary/description. The five
retrospective audits are additional. Clinical
assessment, workflow, consent, knowledge, monitoring and patient/PDF/QR coverage
remain required. Missing checks stay incomplete; time limits do not lower the
clinical acceptance standard. Do not expand a batch into an unrelated redesign.

## Preserve the ten-new-plus-five-retrospective delivery process

Paul clarified that healthy work should continue until it produces the completed
output, even if he closes his laptop. Do not impose an arbitrary 60-minute batch
cutoff or return a partial package merely because elapsed time is long.

- Keep the requested scope stable: ten new suites plus five retrospective audits,
  current-standard handbooks and the usual ZIP with commit summary/description.
- Check tool availability early. Run browser preflight once. A denied socket
  operation is a recorded blocker; do not repeat identical failed launches or
  try to bypass environment security restrictions.
- Save a recoverable checkpoint after each completed suite and at least every
  20 minutes. Preserve changed files/patches, logs, source evidence and next steps
  outside transient scratch. Checkpoints are internal recovery, not substitutes
  for the final completed package while work is progressing normally.
- Continue useful work while it makes progress. Distinguish slow progress from
  repeated identical errors, a lost session or a demonstrably stuck subprocess.
- Diagnose a stuck stage once, save the evidence and complete independent work.
  A blocked check must not cause an endless retry loop or silently hold the whole
  download. Deliver available review work with the actual blocker clearly stated
  when completion genuinely depends on an unavailable capability.
- If Paul says stop/output, prioritize the current checkpoint immediately. Do not
  launch another full regression cycle before delivering it.
- Give meaningful progress updates at least every minute while actively working.
  Tool heartbeats show runner liveness, not proof of clinical progress. Do not
  call healthy long-running tests stuck solely because their output is sparse.

## Guard subprocesses without timing out the whole batch

Use Linux, macOS or WSL. Choose a fresh evidence directory for each attempt:

```bash
python3 tools/run-bounded-check.py --seconds 30 --browser --output /tmp/sact-attempt-01/browser -- node tools/browser-preflight.cjs
python3 tools/run-bounded-check.py --seconds 600 --output /tmp/sact-attempt-01/focused -- npm run SELECTED_EXISTING_BATCH_SCRIPT
```

The second command is a template: select the real script from current
`package.json`. Do not run the placeholder. Choose subprocess limits from known runtimes with generous headroom; do not
use the example limit to interrupt a check known to take longer. The runner saves `status.json` and raw `stdout.log`, updates status
every 30 seconds, and stops its own process group on timeout or interruption.
It never retries, reuses a prior output directory or turns a blocked check green.
It does not terminate unrelated tasks or control ChatGPT billing.

Record failures with their command, input revision/source hashes, elapsed time,
last useful output, attempted fix and proposed next step. Retry only after a
specific material change with a stated reason; use a new directory. A repeated identical
failure becomes a logged blocker rather than an open-ended retry loop. Keep
required source and regression assertions intact. Fix stale expectations only
after reviewing their intended behavior and provenance.

If an execution session becomes unknown, record `interrupted_unverified`; stop
polling that session and preserve the last checkpoint. Inspect owned processes
when accessible, but do not claim termination without evidence. Do not start a
duplicate full run merely because the previous tool result disappeared.

## Browser checks and complete regression on a suitable runner

`.github/workflows/manual-validation.yml` is a manually triggered validation
workflow. After adding it to GitHub, choose **Actions → Manual validation with
saved evidence → Run workflow**, selecting the intended branch. It has read-only
repository permissions and does not itself deploy. Ordinary pushes to main can
still trigger the repository's existing Pages workflow.

The browser job installs pinned Playwright/Chromium separately from application
dependencies, checks local browser connectivity, builds `_site`, and runs the
existing mobile/desktop tests. A separate job runs current `npm run test:ci` with
a 75-minute command deadline and an 85-minute job ceiling. Browser steps have
individual deadlines inside a 40-minute job ceiling. Both jobs attempt to retain
logs/results on failure. They run independently and do not automatically retry.
Do not hold the already prepared review ZIP waiting for this optional external
run; describe it as pending, and review its result before release readiness.

These are upper bounds, not runtime estimates. Installation/network failures or
a runner outage can still prevent checks. A preflight pass is not a UI pass;
automated Chromium tests do not replace visual review, affected-route coverage,
Safari/real-device checks, source audits, PDF/QR checks or clinical review.

## Save enough to resume

Use `docs/BATCH_HANDOVER_TEMPLATE.md` in each checkpoint. Include:

- Exact baseline SHA, source versions/hashes, intended release and changed files.
- Completed suites, partly completed suites and untouched backlog separately.
- Each check as passed, failed, blocked, timed out, interrupted or not run.
- Logs including ignored `.log` files: include evidence paths explicitly when
  packaging. `git ls-files --others --exclude-standard` alone can omit them.
- Saved code patches/files and the last completed stage; logs alone cannot
  reconstruct unfinished work. Include file checksums and an explicit review
  status. Only mark backlog complete when its acceptance criteria are met.
- The next bounded action, avoiding unnecessary repeats of verified unchanged work.

Persist each completed batch before starting the next. For a larger overnight
goal, keep the same small checkpoints and continue through the agreed group.
Use a stopping time only if Paul explicitly requests one. Do not promise that
an entire tissue group will be finished in one night, or start it merely because
he asked whether it would be possible.

No software can guarantee a final chat message after the host is forcibly lost.
SIGKILL, VM loss, storage loss or interrupted uploads can leave a running status;
treat it as incomplete. Persisting frequent checkpoints limits lost work. This
runner provides bounded commands and recoverable evidence while the host works;
it cannot guarantee background execution or completion notifications.

## Historical Git preflight added in v0.84.58

`npm run test:ci` first checks availability of pinned historical Git objects with lazy fetching disabled. Missing objects stop the run with an explicit full-checkout requirement; a 30-second limit guards each Git command. This does not waive or replace any historical content/hash assertion. On a complete checkout the original regression sequence follows unchanged. A preflight pass is availability evidence only.
