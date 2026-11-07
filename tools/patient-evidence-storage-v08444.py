#!/usr/bin/env python3
"""Verify exact gzip evidence or temporarily expose it to unchanged PDF tools.

The three archived JSON byte streams are immutable v0.84.44 evidence. This
helper does not render documents, change their fingerprints, or exempt files
from repository security checks. Keep only packed evidence at rest.

Examples:
  python tools/patient-evidence-storage-v08444.py verify --report /tmp/storage.json
  python tools/patient-evidence-storage-v08444.py run \
    --input companion-content-retention.json -- python tools/build-patient-documents-v08444.py ...
  python tools/patient-evidence-storage-v08444.py run -- python tools/verify-patient-documents-v08444.py ...

Only missing inputs are created. Existing identical inputs are left alone.
Changed or replaced inputs are retained and cause a nonzero cleanup result;
newly generated report outputs must be archived deliberately, never discarded.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import gzip
import hashlib
import json
import os
from pathlib import Path
import stat
import subprocess
import sys
import tempfile


ROOT = Path(__file__).resolve().parents[1]
EVIDENCE_DIRECTORY = "validation/patient-design-v08444"
MANIFEST = ROOT / EVIDENCE_DIRECTORY / "evidence-storage.json"
PINNED_INPUTS = {
    "companion-content-retention.json": (
        21_513_109, "5e35639edb1a8777d6a6cabee9b47b17783254a5dcd41e17b5b9b78181fd60c5"),
    "document-build-staged.json": (
        43_593_400, "49ab5d16ffe9021e2f8e4f0b392e1160ade64e35d747db26f29db3b35ba61547"),
    "document-build.json": (
        43_593_399, "979c2f4a368d605b4ab5ed97d48202f258703ba07715239a6e708a2af8486977"),
}


class StorageError(RuntimeError):
    pass


def require(condition, message):
    if not condition:
        raise StorageError(message)


def file_sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def checked_path(relative):
    path = ROOT / relative
    require(path.is_relative_to(ROOT), "Evidence path escapes the checkout")
    for component in [path, *path.parents]:
        if component == ROOT:
            break
        require(not component.is_symlink(), f"Evidence paths must not use symlinks: {relative}")
    return path


def regular_stat(path):
    info = path.lstat()
    require(stat.S_ISREG(info.st_mode), f"Evidence must be a regular file: {path}")
    return info


def load_manifest():
    checked_path(f"{EVIDENCE_DIRECTORY}/evidence-storage.json")
    regular_stat(MANIFEST)
    manifest = json.loads(MANIFEST.read_text())
    require(manifest.get("schema_version") == 1 and manifest.get("release") == "0.84.44",
            "Unexpected evidence-storage manifest version")
    entries = manifest.get("files")
    require(isinstance(entries, list) and len(entries) == len(PINNED_INPUTS),
            "The manifest must contain exactly the three pinned evidence files")
    records = {}
    for entry in entries:
        require(isinstance(entry, dict), "Invalid evidence-storage entry")
        name = entry.get("name")
        require(name in PINNED_INPUTS and name not in records,
                "Unknown or duplicate evidence input in storage manifest")
        logical = f"{EVIDENCE_DIRECTORY}/{name}"
        size, digest = PINNED_INPUTS[name]
        require(entry.get("logical_path") == logical and entry.get("stored_path") == logical + ".gz",
                f"Unexpected storage path for {name}")
        require(entry.get("encoding") == "gzip" and entry.get("logical_bytes") == size
                and entry.get("logical_sha256") == digest,
                f"Frozen logical evidence identity changed: {name}")
        require(isinstance(entry.get("stored_bytes"), int) and 0 < entry["stored_bytes"] <= 20 * 1024 * 1024,
                f"Stored evidence exceeds the unchanged repository size limit: {name}")
        require(isinstance(entry.get("stored_sha256"), str) and len(entry["stored_sha256"]) == 64
                and all(c in "0123456789abcdef" for c in entry["stored_sha256"]),
                f"Invalid stored evidence hash: {name}")
        checked_path(entry["logical_path"])
        checked_path(entry["stored_path"])
        records[name] = entry
    require(set(records) == set(PINNED_INPUTS), "Incomplete evidence-storage manifest")
    return records


def decoded_bytes(entry):
    stored = checked_path(entry["stored_path"])
    info = regular_stat(stored)
    require(info.st_size == entry["stored_bytes"] and file_sha(stored) == entry["stored_sha256"],
            f"Compressed evidence bytes differ: {entry['name']}")
    blocks = []
    total = 0
    digest = hashlib.sha256()
    with gzip.open(stored, "rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            total += len(block)
            require(total <= entry["logical_bytes"], f"Decompressed evidence exceeds pinned size: {entry['name']}")
            digest.update(block)
            blocks.append(block)
    require(total == entry["logical_bytes"] and digest.hexdigest() == entry["logical_sha256"],
            f"Frozen decompressed evidence bytes differ: {entry['name']}")
    return b"".join(blocks)


def identical_logical_file(path, entry):
    info = regular_stat(path)
    require(info.st_size == entry["logical_bytes"] and file_sha(path) == entry["logical_sha256"],
            f"Refusing differing existing logical evidence: {entry['logical_path']}")
    return info


def verify_storage(records):
    rows = []
    for name in PINNED_INPUTS:
        entry = records[name]
        decoded_bytes(entry)
        logical = checked_path(entry["logical_path"])
        require(not logical.exists(), f"Evidence is still materialized; packed storage required: {entry['logical_path']}")
        rows.append({**entry, "compressed_hash_verified": True, "logical_hash_verified": True,
                     "logical_file_absent": True, "below_unchanged_20_mib_limit": True})
    return {"schema_version": 1, "release": "0.84.44", "status": "pass",
            "checked_at_utc": datetime.now(timezone.utc).isoformat(),
            "manifest": {"file": MANIFEST.relative_to(ROOT).as_posix(), "sha256": file_sha(MANIFEST)},
            "files_checked": len(rows), "logical_bytes_verified": sum(r["logical_bytes"] for r in rows),
            "stored_bytes_verified": sum(r["stored_bytes"] for r in rows),
            "all_logical_inputs_absent": True, "frozen_raw_bytes_preserved": True,
            "security_size_rule_unchanged": True, "files": rows}


def create_input(entry, payload):
    logical = checked_path(entry["logical_path"])
    # A complete temporary inode is linked into place without replacing an
    # existing file. No partially written logical input is ever exposed.
    descriptor, temporary_name = tempfile.mkstemp(prefix=".patient-evidence-", suffix=".tmp", dir=logical.parent)
    temporary = Path(temporary_name)
    try:
        with os.fdopen(descriptor, "wb") as stream:
            stream.write(payload)
            stream.flush()
            os.fsync(stream.fileno())
        os.chmod(temporary, 0o644)
        require(temporary.stat().st_size == entry["logical_bytes"]
                and file_sha(temporary) == entry["logical_sha256"], "Temporary evidence write failed integrity check")
        os.link(temporary, logical)
        info = regular_stat(logical)
        return {"path": logical, "entry": entry, "device": info.st_dev, "inode": info.st_ino}
    finally:
        temporary.unlink(missing_ok=True)


def cleanup_inputs(created):
    removed, retained, already_absent = [], [], []
    for item in reversed(created):
        path, entry = item["path"], item["entry"]
        if not path.exists() and not path.is_symlink():
            already_absent.append(entry["logical_path"])
            continue
        try:
            checked_path(entry["logical_path"])
            info = identical_logical_file(path, entry)
            require((info.st_dev, info.st_ino) == (item["device"], item["inode"]),
                    "The child replaced the temporary input inode")
            path.unlink()
            removed.append(entry["logical_path"])
        except (OSError, StorageError) as error:
            retained.append({"file": entry["logical_path"], "reason": str(error)})
    return {"removed_created_inputs": removed, "already_absent_inputs": already_absent,
            "retained_changed_outputs": retained}


def run_with_inputs(records, selected, command):
    require(command, "Supply a command after --")
    require(len(selected) == len(set(selected)), "Select each input at most once")
    entries = [records[name] for name in selected]
    payloads = {entry["name"]: decoded_bytes(entry) for entry in entries}
    existing = []
    # Validate every existing input before creating any missing input.
    for entry in entries:
        logical = checked_path(entry["logical_path"])
        if logical.exists():
            identical_logical_file(logical, entry)
            existing.append(entry["logical_path"])
    created = []
    exit_code = None
    failure = None
    try:
        for entry in entries:
            if entry["logical_path"] not in existing:
                created.append(create_input(entry, payloads[entry["name"]]))
        print(json.dumps({"evidence_inputs_materialized": [x["entry"]["logical_path"] for x in created],
                          "existing_identical_inputs_retained": existing}), flush=True)
        exit_code = subprocess.run(command, cwd=ROOT, check=False).returncode
    except BaseException as error:
        failure = error
    finally:
        cleanup = cleanup_inputs(created)
        print(json.dumps({"evidence_storage_cleanup": cleanup, "child_exit_code": exit_code}), flush=True)
    require(not cleanup["retained_changed_outputs"],
            "Changed or replaced materialized inputs were preserved; archive outputs deliberately. Cleanup refused.")
    if failure is not None:
        raise failure
    return exit_code if exit_code >= 0 else 128 - exit_code


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    commands = parser.add_subparsers(dest="action", required=True)
    verify = commands.add_parser("verify", help="Verify all stored/raw hashes and require packed storage")
    verify.add_argument("--report", type=Path, help="Write a compact JSON validation result")
    run = commands.add_parser("run", help="Temporarily materialize exact evidence for an unchanged command")
    run.add_argument("--input", action="append", choices=list(PINNED_INPUTS),
                     help="Repeat for selected basenames; default is all three inputs")
    run.add_argument("command", nargs=argparse.REMAINDER)
    args = parser.parse_args()
    records = load_manifest()
    if args.action == "verify":
        result = verify_storage(records)
        if args.report:
            protected = {MANIFEST.resolve(), Path(__file__).resolve()}
            protected.update((ROOT / entry[key]).resolve() for entry in records.values()
                             for key in ["logical_path", "stored_path"])
            require(args.report.resolve() not in protected, "Validation report must not overwrite storage inputs")
            args.report.parent.mkdir(parents=True, exist_ok=True)
            args.report.write_text(json.dumps(result, indent=2) + "\n")
        print(json.dumps(result, indent=2))
        return 0
    command = args.command[1:] if args.command and args.command[0] == "--" else args.command
    return run_with_inputs(records, args.input or list(PINNED_INPUTS), command)


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except KeyboardInterrupt:
        print("Evidence command interrupted after cleanup.", file=sys.stderr)
        raise SystemExit(130)
    except (OSError, ValueError, StorageError) as error:
        print(f"Evidence storage failed: {error}", file=sys.stderr)
        raise SystemExit(1)
