#!/usr/bin/env python3
"""Create and verify the cumulative manual v0.84.44 delivery.

This never commits, pushes, changes refs, or deploys. Run only after the release
validation report records successful final gates. Ordinary ZIP volumes contain
disjoint members of the same complete tree; they are not incremental patches.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import stat
import zipfile
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
PREFIX = "SACTCheck-v08444/"
EXCLUDED_DIRS = {".git", ".openai", "node_modules", "__pycache__", ".pytest_cache", ".cache", ".venv", "venv"}
EXCLUDED_TOP = {"_site", "tmp", "temp", "artifacts", "dist"}
EXCLUDED_NAMES = {".DS_Store", "Thumbs.db", "PACKAGE_MANIFEST.json"}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def file_sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def inventory(root: Path) -> list[dict]:
    rows = []
    for directory, directories, filenames in os.walk(root):
        relative = Path(directory).relative_to(root)
        directories[:] = sorted(d for d in directories
            if d not in EXCLUDED_DIRS and not (relative == Path(".") and d in EXCLUDED_TOP))
        for name in sorted(filenames):
            path = Path(directory) / name
            if name in EXCLUDED_NAMES or name.endswith((".pyc", ".pyo")):
                continue
            if path.is_symlink():
                raise RuntimeError(f"Review symlink before packaging: {path}")
            if not path.is_file():
                raise RuntimeError(f"Non-regular package member: {path}")
            rows.append({"path": path.relative_to(root).as_posix(), "bytes": path.stat().st_size,
                         "sha256": file_sha(path), "mode": stat.S_IMODE(path.stat().st_mode)})
    return sorted(rows, key=lambda item: item["path"])


def verify_archive(path: Path, expected: dict[str, dict], prefix: str = PREFIX) -> dict:
    with zipfile.ZipFile(path) as archive:
        names = archive.namelist()
        if len(names) != len(set(names)) or set(names) != {prefix + name for name in expected}:
            raise RuntimeError(f"Wrong archive member set: {path}")
        for name in names:
            row = expected[name[len(prefix):]]
            digest = hashlib.sha256()
            total = 0
            with archive.open(name) as source:
                for chunk in iter(lambda: source.read(1024 * 1024), b""):
                    total += len(chunk)
                    digest.update(chunk)
            if total != row["bytes"] or digest.hexdigest() != row["sha256"]:
                raise RuntimeError(f"Package bytes differ from source manifest: {name}")
    return {"file": path.name, "bytes": path.stat().st_size, "sha256": file_sha(path),
            "verified_members": len(expected), "status": "pass"}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--volume-limit-mb", type=int, default=475)
    args = parser.parse_args()
    out = args.output.resolve()
    if out == ROOT or ROOT in out.parents:
        raise RuntimeError("Place delivery outside the source checkout")
    if args.volume_limit_mb < 50 or args.volume_limit_mb > 490:
        raise RuntimeError("Volume limit must be between 50 and 490 decimal MB")
    release = json.loads((ROOT / "package.json").read_text())["version"]
    if release != "0.84.44":
        raise RuntimeError("This package tool is pinned to v0.84.44")
    audit_path = ROOT / "validation/patient-design-v08444/release-validation.json"
    audit = json.loads(audit_path.read_text())
    for gate in ("documents", "ancillary_documents", "ci", "publication", "protected_assets", "built_site"):
        if audit.get("gates", {}).get(gate, {}).get("status") != "pass":
            raise RuntimeError(f"Final release gate has not passed: {gate}")
    baseline = json.loads((ROOT / "validation/patient-design-v08444/baseline-v08443-package-manifest.json").read_text())
    rows = inventory(ROOT)
    row_names = {row["path"] for row in rows}
    omitted = sorted(row["path"] for row in baseline["files"] if row["path"] not in row_names)
    if omitted:
        raise RuntimeError(f"Complete delivery omits preserved v43 source members: {omitted[:20]}")
    manifest = {"schema_version": 1, "release": release, "baseline_release": "0.84.42",
                "baseline_commit": baseline["baseline_commit"], "includes_unpublished_release": "0.84.43",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "package_kind": "complete source and generated assets; no Git internals or temporary build output",
                "use": "Copy the complete contents over the verified baseline full-history checkout. Keep its .git directory.",
                "entries_exclude_this_manifest": True, "file_count": len(rows),
                "uncompressed_bytes": sum(row["bytes"] for row in rows), "files": rows}
    manifest_bytes = (json.dumps(manifest, indent=2) + "\n").encode()
    expected = {row["path"]: row for row in rows}
    expected["PACKAGE_MANIFEST.json"] = {"bytes": len(manifest_bytes), "sha256": sha(manifest_bytes)}
    out.mkdir(parents=True, exist_ok=True)
    full = out / "SACTCheck-v0.84.44-complete-update.zip"
    if full.exists():
        raise RuntimeError("Preserve the existing delivery; use a fresh output directory")
    with zipfile.ZipFile(full, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6, allowZip64=True) as archive:
        for i, row in enumerate(rows):
            path = ROOT / row["path"]
            if path.stat().st_size != row["bytes"] or file_sha(path) != row["sha256"]:
                raise RuntimeError(f"Source changed while packaging: {row['path']}")
            archive.write(path, PREFIX + row["path"])
            if (i + 1) % 2500 == 0:
                print(json.dumps({"packaged_files": i + 1, "of": len(rows)}), flush=True)
        archive.writestr(PREFIX + "PACKAGE_MANIFEST.json", manifest_bytes)
    full_result = verify_archive(full, expected)
    print(json.dumps({"full_archive": full_result}), flush=True)

    # Balance standard, independently extractable ZIP volumes by compressed size.
    # The small per-member header allowance keeps each below the transfer limit.
    limit = args.volume_limit_mb * 1_000_000
    buckets: list[list[str]] = []
    loads: list[int] = []
    with zipfile.ZipFile(full) as source:
        entries = sorted(source.infolist(), key=lambda item: (-item.compress_size, item.filename))
        for item in entries:
            weight = item.compress_size + 1024 + 2 * len(item.filename.encode())
            if weight > limit:
                raise RuntimeError(f"Member exceeds an individual volume: {item.filename}")
            fitting = [i for i, load in enumerate(loads) if load + weight <= limit]
            if fitting:
                index = min(fitting, key=lambda i: loads[i])
            else:
                index = len(buckets)
                buckets.append([])
                loads.append(0)
            buckets[index].append(item.filename)
            loads[index] += weight
        results = []
        union: set[str] = set()
        for number, names in enumerate(buckets, 1):
            part = out / f"SACTCheck-v0.84.44-complete-update-part-{number}-of-{len(buckets)}.zip"
            if part.exists():
                raise RuntimeError(f"Refusing to overwrite {part}")
            with zipfile.ZipFile(part, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6, allowZip64=True) as dest:
                for name in sorted(names):
                    info = source.getinfo(name)
                    dest.writestr(info, source.read(name))
            if part.stat().st_size > limit:
                raise RuntimeError(f"Volume too large: {part}")
            part_expected = {name[len(PREFIX):]: expected[name[len(PREFIX):]] for name in names}
            result = verify_archive(part, part_expected)
            if union.intersection(names):
                raise RuntimeError("Volume member overlap")
            union.update(names)
            results.append(result)
            print(json.dumps({"volume": result}), flush=True)
        if union != {PREFIX + name for name in expected}:
            raise RuntimeError("Volumes do not reconstruct the full archive")
    verification = {"schema_version": 1, "release": release, "status": "pass",
                    "source_file_count": len(rows), "uncompressed_bytes": manifest["uncompressed_bytes"],
                    "baseline_files_retained": len(baseline["files"]),
                    "manifest_sha256": sha(manifest_bytes), "full_archive": full_result, "volumes": results,
                    "volume_member_union_matches_full_archive": True, "duplicate_volume_members": 0,
                    "all_member_sizes_and_sha256_verified": True,
                    "no_git_or_remote_changes_performed": True}
    (out / "SACTCheck-v0.84.44-package-verification.json").write_text(json.dumps(verification, indent=2) + "\n")
    (out / "SACTCheck-v0.84.44-PACKAGE_MANIFEST.json").write_bytes(manifest_bytes)
    checksum_rows = [full_result, *results]
    (out / "SACTCheck-v0.84.44-SHA256SUMS.txt").write_text("".join(f"{row['sha256']}  {row['file']}\n" for row in checksum_rows))


if __name__ == "__main__":
    main()
