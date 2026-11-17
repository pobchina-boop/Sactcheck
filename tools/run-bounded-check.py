#!/usr/bin/env python3
"""Run one POSIX command with a deadline and persistent, non-reusable evidence."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import math
import os
from pathlib import Path
import signal
import subprocess
import sys
import time


def now():
    return datetime.now(timezone.utc).isoformat()


def emit(message):
    try:
        print(message, flush=True)
    except BrokenPipeError:
        # Losing a log viewer must not prevent writing local evidence.
        pass


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--seconds', type=float, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--browser', action='store_true')
    parser.add_argument('command', nargs=argparse.REMAINDER)
    args = parser.parse_args()
    command = args.command[1:] if args.command[:1] == ['--'] else args.command
    if os.name != 'posix':
        parser.error('Use Linux, macOS or WSL; process-group cleanup requires POSIX.')
    if not command or not math.isfinite(args.seconds) or args.seconds <= 0:
        parser.error('Supply a command and a positive finite deadline.')
    try:
        args.output.mkdir(parents=True, exist_ok=False)
    except FileExistsError:
        parser.error('Evidence directory already exists; choose a new attempt directory.')
    log_path = args.output / 'stdout.log'
    status_path = args.output / 'status.json'
    started = time.monotonic()
    status = dict(status='starting', started_at=now(), command=command,
                  cwd=str(Path.cwd()), timeout_seconds=args.seconds,
                  github_sha=os.environ.get('GITHUB_SHA'),
                  github_run_id=os.environ.get('GITHUB_RUN_ID'),
                  github_run_attempt=os.environ.get('GITHUB_RUN_ATTEMPT'),
                  runner_python=sys.version, exit_code=None)

    def save():
        status['updated_at'] = now()
        status['elapsed_seconds'] = round(time.monotonic() - started, 3)
        status['log_bytes'] = log_path.stat().st_size if log_path.exists() else 0
        temporary = status_path.with_suffix('.tmp')
        temporary.write_text(json.dumps(status, indent=2) + '\n')
        temporary.replace(status_path)

    received_signal = []

    def interrupted(signum, frame):
        received_signal.append(signum)

    signal.signal(signal.SIGTERM, interrupted)
    signal.signal(signal.SIGINT, interrupted)
    save()
    process = None
    result = 1
    with log_path.open('wb', buffering=0) as log:
        try:
            process = subprocess.Popen(command, stdout=log, stderr=subprocess.STDOUT,
                                       stdin=subprocess.DEVNULL, start_new_session=True)
            status.update(status='running', pid=process.pid, process_group=process.pid)
            save()
            heartbeat_at = 0.0
            while True:
                elapsed = time.monotonic() - started
                code = process.poll()
                if received_signal:
                    status['status'] = 'interrupted'
                    result = 128 + received_signal[0]
                    break
                if code is not None:
                    status['status'] = 'passed' if code == 0 else 'failed'
                    result = code if code >= 0 else 128 - code
                    break
                if elapsed >= args.seconds:
                    status['status'] = 'timed_out'
                    result = 124
                    break
                if elapsed >= heartbeat_at:
                    save()
                    emit(f"[running] {elapsed:.0f}s / {args.seconds:.0f}s; "
                         f"{status['log_bytes']} log bytes; {status_path}")
                    heartbeat_at = elapsed + 30
                time.sleep(min(0.1, max(0.01, args.seconds - elapsed)))
        except OSError as error:
            status.update(status='failed_to_start', error=str(error))
            log.write((str(error) + '\n').encode())
            result = 127
        finally:
            if process is not None:
                # Clean up this run's process group, including children whose leader exited.
                # Never find/kill processes by name or touch other sessions.
                sent = []
                for sig in (signal.SIGTERM, signal.SIGKILL):
                    try:
                        os.killpg(process.pid, sig)
                        sent.append(signal.Signals(sig).name)
                        if sig == signal.SIGTERM:
                            time.sleep(2)
                    except ProcessLookupError:
                        break
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    status['status'] = 'cleanup_unconfirmed'
                    result = 1
                status['child_exit_code'] = process.returncode
                status['cleanup_signals_sent'] = sent
    if args.browser and status['status'] == 'failed':
        # Classify a specific denied socket operation, never an ordinary assertion failure.
        with log_path.open('rb') as log:
            for raw in log:
                line = raw.decode(errors='replace').lower()
                if 'socket' in line and ('operation not permitted' in line or 'eperm' in line):
                    status['status'] = 'blocked_environment'
                    break
    digest = hashlib.sha256()
    with log_path.open('rb') as log:
        for block in iter(lambda: log.read(1024 * 1024), b''):
            digest.update(block)
    status.update(ended_at=now(), exit_code=result, log_sha256=digest.hexdigest())
    save()
    emit(f"[{status['status']}] exit {result}; evidence: {args.output}")
    return result


if __name__ == '__main__':
    sys.exit(main())
