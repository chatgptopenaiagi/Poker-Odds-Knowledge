"""Audit first; package only with --package after the final clean Git checkpoint.

No Git history, runtime configuration, databases, browser profiles or environments
are copied. A local release is not a remote publication or production deployment.
Uses only Python's standard library. Archive members are re-read and verified.
"""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import re
import subprocess
import sys
import zipfile
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts" / "strategy-release"
PRIVATE_FILES = {
    "CLA_ACCEPTANCE.md", "DELIVERY_MANIFEST.md", "docs/ENVIRONMENT.md",
    "README.md", "TEST_REPORT.md", "ENGINE_INTEGRATION_REPORT.md",
    "docs/MATH_VALIDATION.md", "docs/POK_PUBLICATION.md",
    "docs/PLATFORM_RESUME.md", "docs/POK_APPEARANCE_CHECKPOINT.md",
    "scripts/audit-publication.py",  # Contains historical private scanner fixtures.
    "scripts/package-release.py", "scripts/package-engines.py",
    # Verified workstation-only deployment helpers stay in the original checkout.
    "scripts/Deploy-Holdem-Lab.ps1", "scripts/Deploy-Engine-Preview.ps1",
    "scripts/Deploy-Strategy-Preview.ps1", "scripts/verify-deployment.ps1",
    "scripts/Verify-Engine-Preview.ps1", "scripts/Verify-Strategy-Preview.ps1",
}
PRIVATE_PARTS = {
    ".git", "node_modules", ".venv", ".data", ".pok-local", ".pok-strategy",
    ".solver-tools", ".android-tools", "artifacts", "test-results",
    "playwright-report", ".gradle", ".idea", "__pycache__", "publication",
    "dist", "online-dist", "engine-dist", "strategy-dist",
    "strategy-online-dist", "android-dist", "server-build",
}
PRIVATE_ENDINGS = (".sqlite", ".sqlite-wal", ".sqlite-shm", ".db", ".log",
                   ".pyc", ".keystore", ".jks", ".local", ".map")
TEXT_ENDINGS = {".md", ".txt", ".json", ".ts", ".tsx", ".js", ".mjs", ".cjs",
                ".css", ".html", ".svg", ".py", ".ps1", ".java", ".sql",
                ".yml", ".yaml", ".xml", ".toml", ".properties", ".gradle",
                ".c", ".cpp", ".h", ".hpp", ".bat", ".cmd"}
SECRET_PATTERNS = {
    "private-key": re.compile(rb"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    "provider-token": re.compile(rb"\b(?:sk-[A-Za-z0-9_-]{24,}|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})\b"),
    "user-profile-path": re.compile(rb"(?i)[A-Z]:[\\/]+Users[\\/]+(?!Public\b|Default\b)[^\s\"'<>]+"),
    "private-launch-evidence": re.compile(rb"(?i)(?:CLA session ID|snapshot_id)[\s\"':=]+[a-f0-9]{32}"),
}
LOCAL_PATH = re.compile(rb"(?i)[A-Z]:[\\/]+(?:xampp|Codex-Projects|PYTORCH)[\\/]+[^\s\"'`<>]+")
EMAIL = re.compile(rb"(?<![\w.-])[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+")
TEST_DOMAINS = {"example.com", "example.org", "example.net", "localhost.local"}


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def git(*args: str) -> bytes:
    return subprocess.check_output(["git", "-C", str(ROOT), *args], stderr=subprocess.PIPE)


def json_bytes(value: object) -> bytes:
    return (json.dumps(value, ensure_ascii=False, indent=2) + "\n").encode("utf-8")


def safe_name(name: str) -> str:
    path = PurePosixPath(name.replace("\\", "/"))
    if path.is_absolute() or not path.parts or any(p in {"..", "."} for p in path.parts) or ":" in name:
        raise ValueError("Unsafe archive member name")
    return path.as_posix()


def excluded(name: str) -> bool:
    p = PurePosixPath(name)
    return (name in PRIVATE_FILES or bool(set(p.parts) & PRIVATE_PARTS)
            or (p.name.startswith(".env") and p.name != ".env.example")
            or p.name == "local.properties" or p.name == "CODEX_MISSION.txt"
            or name.endswith(PRIVATE_ENDINGS)
            or name.startswith(("native/bin/", "native/build/"))
            or name.startswith("mobile/") and "/build/" in name)


def read_owned(name: str) -> bytes:
    name = safe_name(name)
    path = ROOT / name
    if not path.resolve().is_relative_to(ROOT.resolve()):
        raise ValueError(f"Path leaves the project: {name}")
    for parent in (path, *path.parents):
        if parent == ROOT:
            break
        if parent.is_symlink() or (hasattr(parent, "is_junction") and parent.is_junction()):
            raise ValueError(f"Linked path refused: {name}")
    if not path.is_file() or path.stat().st_size > 100_000_000:
        raise ValueError(f"Missing or oversized artifact: {name}")
    return path.read_bytes()


def legal_notice(name: str) -> bool:
    base = PurePosixPath(name).name.lower()
    return ("license" in base or "notice" in base
            or name.startswith(("vendor/", "native/vendor/", "public/THIRD_PARTY"))
            or name.startswith(".solver-tools/java-deps/") and any(
                part in name for part in (".jar!/META-INF/maven/", ".jar!/META-INF/scm/")))


def audit_file(name: str, data: bytes) -> list[dict]:
    """Return locations/fingerprints only; never echo a suspected credential."""
    findings: list[dict] = []

    def add(kind: str, match: re.Match[bytes], severity: str = "BLOCK") -> None:
        findings.append({"file": name, "kind": kind, "severity": severity,
                         "line": data[:match.start()].count(b"\n") + 1,
                         "matchSha256Prefix": sha(match.group())[:12]})

    for kind, pattern in SECRET_PATTERNS.items():
        for match in pattern.finditer(data):
            add(kind, match)
    # Workstation deployment helpers are explicitly excluded rather than silently
    # rewritten; no archive gets an exception for its original absolute path.
    for match in LOCAL_PATH.finditer(data):
        add("workstation-path", match)
    if PurePosixPath(name).suffix.lower() in TEXT_ENDINGS or legal_notice(name):
        for match in EMAIL.finditer(data):
            domain = match.group().rsplit(b"@", 1)[1].decode("ascii").lower()
            if domain in TEST_DOMAINS or domain.endswith((".test", ".invalid", ".example")):
                continue
            if name.endswith("BackupPolicyTest.java") and match.group().lstrip(b"/") == b"evil" + b"@" + b"localhost.evil":
                # Reviewed generated adversarial URI userinfo, not an account.
                continue
            add("upstream-legal-contact" if legal_notice(name) else "email-address", match,
                "RETAINED_LEGAL_NOTICE" if legal_notice(name) else "BLOCK")
    return findings


def audit_nested(name: str, data: bytes) -> list[dict]:
    findings = audit_file(name, data)
    if name.endswith((".jar", ".apk")):
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            members = archive.infolist()
            if len(members) > 20000 or sum(m.file_size for m in members) > 250_000_000:
                raise ValueError("Nested package exceeds audit work budget")
            for member in members:
                if member.is_dir():
                    continue
                safe_name(member.filename)
                if member.filename.endswith((".keystore", ".jks", ".env", ".sqlite")):
                    raise ValueError("Private file inside runtime artifact")
                findings.extend(audit_file(name + "!/" + member.filename, archive.read(member)))
    return findings


def tree(folder: str) -> dict[str, bytes]:
    root = ROOT / folder
    if not root.is_dir():
        raise ValueError(f"Build is missing: {folder}")
    output: dict[str, bytes] = {}
    for path in sorted(root.rglob("*")):
        if path.is_file():
            relative = path.relative_to(root).as_posix()
            if relative.endswith((".map", ".log")) or any(x in relative.split("/") for x in (".git", "node_modules", ".env")):
                raise ValueError(f"Non-public build content: {folder}/{relative}")
            output[safe_name(relative)] = read_owned(path.relative_to(ROOT).as_posix())
    if "index.html" not in output:
        raise ValueError(f"No index.html in {folder}")
    return output


def native_files() -> dict[str, bytes]:
    verification = json.loads(read_owned("engine-adapters/java/BUILD_VERIFICATION.json"))
    result = {}
    artifact = verification["artifact"]
    name = ".solver-tools/java-build/" + artifact["name"]
    data = read_owned(name)
    if sha(data) != artifact["sha256"] or len(data) != artifact["bytes"]:
        raise ValueError("Solver JAR differs from tested verification record")
    result[name] = data
    manifest = read_owned(".solver-tools/java-build/build-manifest.json")
    if json.loads(manifest)["sha256"] != artifact["sha256"]:
        raise ValueError("Runtime build manifest differs from tested JAR")
    result[".solver-tools/java-build/build-manifest.json"] = manifest
    for dep in verification["dependencies"]:
        name = ".solver-tools/java-deps/" + dep["coordinate"].rsplit("/", 1)[1] + ".jar"
        data = read_owned(name)
        if sha(data) != dep["sha256"] or len(data) != dep["bytes"]:
            raise ValueError("Java dependency differs from tested verification record")
        result[name] = data
    for notice in verification["notices"]:
        name = "engine-adapters/java/notices/" + notice["file"]
        data = read_owned(name)
        if sha(data) != notice["sha256"]:
            raise ValueError("Java notice differs from reviewed verification record")
        result[name] = data
    for name in ("engine-adapters/java/README.md", "engine-adapters/java/BUILD_VERIFICATION.json",
                 "engine-adapters/java/dependencies.json", "engine-adapters/java/Configure-Runtime.ps1",
                 "engine-adapters/java/Guard-Solver.ps1"):
        result[name] = read_owned(name)
    return result


def write_archive(path: Path, files: dict[str, bytes], stamp: tuple) -> dict:
    with zipfile.ZipFile(path, "x", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name, data in sorted(files.items()):
            info = zipfile.ZipInfo(safe_name(name), date_time=stamp)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, data)
    with zipfile.ZipFile(path) as archive:
        if archive.testzip() is not None or set(archive.namelist()) != set(files):
            raise ValueError("Archive integrity or membership mismatch")
        for name, expected in files.items():
            if archive.read(name) != expected:
                raise ValueError("Archive byte verification failed")
    return {"file": path.name, "bytes": path.stat().st_size, "sha256": sha(path.read_bytes()),
            "files": len(files), "reopenedByteVerification": "PASS",
            "members": [{"file": name, "bytes": len(data), "sha256": sha(data)}
                        for name, data in sorted(files.items())]}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--dry-run", action="store_true", help="Default: audit; do not create archives")
    mode.add_argument("--package", action="store_true", help="Create once, only after a clean final commit")
    parser.add_argument("--apk", help="Optional reviewed APK relative to this project; no device-test inference")
    parser.add_argument("--screenshots", nargs="*", default=[], help="Explicit reviewed PNGs, project-relative")
    args = parser.parse_args()
    actual_root = Path(git("rev-parse", "--show-toplevel").decode().strip()).resolve()
    if actual_root != ROOT.resolve():
        raise ValueError("Script is outside its verified Git root")
    commit = git("rev-parse", "HEAD").decode().strip()
    branch = git("branch", "--show-current").decode().strip()
    tracked = [x for x in git("ls-files", "-z").decode().split("\0") if x]
    untracked = [x for x in git("ls-files", "--others", "--exclude-standard", "-z").decode().split("\0") if x]
    # Dry run deliberately sees current untracked implementation files so new
    # reports cannot evade review merely because the parent has not committed yet.
    selected = sorted({p for p in (tracked if args.package else tracked + untracked) if not excluded(p)})
    dirty = bool(git("status", "--porcelain", "--untracked-files=no").strip())
    untracked_selected = sorted(p for p in untracked if not excluded(p))
    readiness = []
    if dirty:
        readiness.append("Tracked worktree changes: final source commit is not ready.")
    if untracked_selected:
        readiness.append("Untracked implementation files: commit the reviewed final source first.")
    source = {p: read_owned(p) for p in selected}
    source["README-STRATEGY-RELEASE.md"] = (
        "# Poker Odds Knowledge — local Strategy preview\n\n"
        "Start with docs/strategy/USER_GUIDE.md and docs/strategy/SECURITY_AND_ROLLBACK.md. "
        "The source is a filtered clean Git checkpoint, with lockfiles and original implementation. "
        "Historical CLA/environment reports and older machine-specific release reports remain in the "
        "original local repository; they are deliberately omitted here, as are workstation-specific deployment helpers. "
        "Use the generic operator procedure in the guide. The manifest lists the exact exclusions. "
        "This generated index does not replace or modify the original local README.\n\n"
        "Offline play and six verified river packs require no account or Java. Optional local solves "
        "require the online source/runtime archive, project-local npm dependencies, optional JVM artifact "
        "archive, an approved Java 21+ runtime and PowerShell 7, and private runtime configuration. "
        "No credentials, JDK, installed Node dependencies, Git history or user notebooks are included.\n\n"
        "This is a local experimental delivery, not a public service or professional security certification. "
        "See the named reports for actual test scope and Android build/device status.\n"
    ).encode("utf-8")
    groups = {"source": source}
    failures = []
    for label, folder in (("offline", "strategy-dist"), ("online-assets", "strategy-online-dist")):
        try:
            groups[label] = tree(folder)
        except ValueError as error:
            failures.append(str(error))
    compiled = {}
    compiled_root = ROOT / "server-build"
    if compiled_root.is_dir():
        for path in sorted(compiled_root.rglob("*")):
            if path.is_file():
                name = path.relative_to(ROOT).as_posix()
                if path.suffix not in {".mjs", ".sql"}:
                    raise ValueError("Unexpected compiled server file")
                compiled[name] = read_owned(name)
        if "server-build/main.mjs" not in compiled or "server-build/migrations/strategy-v1.sql" not in compiled:
            failures.append("Compiled server or strategy migration is missing")
        groups["compiled-server"] = compiled
    else:
        failures.append("Compiled server build is missing")
    try:
        groups["local-jvm"] = native_files()
    except (ValueError, OSError) as error:
        failures.append(str(error))
    packs = "public/strategy/packs.json"
    if (ROOT / packs).is_file():
        groups["solution-packs"] = {"packs.json": read_owned(packs)}
    else:
        failures.append("Verified solution pack catalog is missing")
    evidence = {p: data for p, data in source.items() if p.startswith(("docs/strategy/", "docs/architecture/"))
                or p in ("engine-adapters/java/VERIFICATION.json", "engine-adapters/java/BUILD_VERIFICATION.json")}
    for name in args.screenshots:
        if not name.startswith("artifacts/") or not name.lower().endswith(".png"):
            raise ValueError("Screenshots must be explicit reviewed project artifact PNGs")
        evidence["screenshots/" + PurePosixPath(name).name] = read_owned(name)
    groups["evidence"] = evidence
    if args.apk:
        apk = safe_name(args.apk)
        if not apk.endswith(".apk") or not apk.startswith(("artifacts/", "mobile/pok-android/")):
            raise ValueError("APK must be a reviewed project-owned build")
        groups["android"] = {"pok-strategy-debug.apk": read_owned(apk)}
    findings = []
    for label, files in groups.items():
        for name, data in files.items():
            for finding in audit_nested(name, data):
                findings.append({"archive": label, **finding})
    blocked = [f for f in findings if f["severity"] == "BLOCK"]
    audit = {"schemaVersion": 1, "checkedUtc": datetime.now(timezone.utc).isoformat(),
             "mode": "package" if args.package else "dry-run", "sourceCommit": commit,
             "branch": branch, "status": "BLOCKED" if blocked or failures else "PASS",
             "sourceCheckpointReady": not readiness, "readiness": readiness,
             "groups": {key: {"files": len(value), "uncompressedBytes": sum(map(len, value.values()))}
                        for key, value in groups.items()},
             "excludedTrackedFiles": sorted(p for p in tracked if excluded(p)),
             "untrackedSourceFiles": untracked_selected, "failures": failures, "findings": findings,
             "scope": "Selected local archives only; no Git history publication, external upload, or security certification.",
             "contacts": "Public upstream contacts are retained only in reviewed vendored source, legal notices and hash-pinned official JAR metadata; generic test addresses are not personal data."}
    (ROOT / "artifacts").mkdir(exist_ok=True)
    (ROOT / "artifacts/strategy-release-audit.json").write_bytes(json_bytes(audit))
    print(json.dumps({"audit": "artifacts/strategy-release-audit.json", "status": audit["status"],
                      "checkpointReady": not readiness, "blockingFindings": len(blocked),
                      "buildFailures": failures, "archivesCreated": False}))
    if not args.package:
        return 1 if blocked or failures else 0
    if blocked or failures or readiness:
        raise ValueError("Packaging refused: resolve the dry-run audit and final checkpoint first")
    if OUT.exists():
        raise ValueError("Release directory already exists; retain it and choose a new reviewed release checkpoint")
    # The compiled entry was exercised by the real authenticated JVM browser
    # flow. It retains relative migrations and requires pinned npm dependencies.
    online = dict(source)
    online.update({"strategy-online-dist/" + p: data for p, data in groups["online-assets"].items()})
    online.update(groups["compiled-server"])
    groups["online-source-runtime"] = online
    del groups["online-assets"]
    del groups["compiled-server"]
    stamp_dt = datetime.fromtimestamp(int(git("show", "-s", "--format=%ct", "HEAD").decode()), timezone.utc)
    stamp = (max(1980, stamp_dt.year), stamp_dt.month, stamp_dt.day, stamp_dt.hour, stamp_dt.minute, stamp_dt.second)
    OUT.mkdir()
    records = []
    for label, files in groups.items():
        records.append({"edition": label, **write_archive(OUT / f"POK-Strategy-{label}-{commit[:8]}.zip", files, stamp)})
    # The separately usable APK is verified too; the ZIP above supplies a stable
    # named member without implying emulator/device execution.
    if "android" in groups:
        apk_file = OUT / "POK-Strategy-debug.apk"
        apk_file.write_bytes(groups["android"]["pok-strategy-debug.apk"])
        records.append({"edition": "android-installable", "file": apk_file.name,
                        "bytes": apk_file.stat().st_size, "sha256": sha(apk_file.read_bytes())})
    manifest = {"schemaVersion": 1, "product": "Poker Odds Knowledge", "releaseKind": "local experimental preview",
                "buildId": "POK-STRATEGY-1-preview-" + commit[:8], "sourceCommit": commit, "branch": branch,
                "createdUtc": datetime.now(timezone.utc).isoformat(), "sourceLocation": "source archive root",
                "offlineUrl": "http://localhost/holdem-strategy-validation/", "localOnlineUrl": "http://127.0.0.1:4322/holdem-lab/",
                "remotePublication": "NOT_RUN: this mission does not authorize a push or release upload",
                "publicHosting": "NOT_RUN", "paidModelCalls": "NOT_RUN",
                "androidIncluded": "android" in groups, "androidExecution": "See Android runtime report; packaging is not execution evidence",
                "archives": records, "privacyAudit": "artifacts/strategy-release-audit.json",
                "sourcePolicy": "git ls-files at clean sourceCommit, filtered private evidence; original local history retained outside archives",
                "onlineRuntime": "Source server and compiled server/migrations with lockfile; requires project-local npm ci and approved Node runtime. Launcher prefers compiled entry, exercised by authenticated browser/JVM solve and cancellation. No node_modules or credentials bundled.",
                "nativeRuntime": "Optional local JVM archive; requires approved Java 21+ and PowerShell 7, then explicit private runtime configuration. No JDK included.",
                "licenses": "THIRD_PARTY_NOTICES.md, ENGINE_LICENSES.md, docs/architecture/SOLVER_RESEARCH.md and retained artifact notices. No new public license for POK asserted.",
                "verification": "Named JSON reports inside evidence archive describe actual test scope and exclusions; no pass count inferred from archive contents."}
    (OUT / "DELIVERY_MANIFEST.json").write_bytes(json_bytes(manifest))
    (OUT / "PRIVACY_AUDIT.json").write_bytes(json_bytes(audit))
    sums = [(path.name, sha(path.read_bytes())) for path in sorted(OUT.iterdir()) if path.is_file()]
    (OUT / "SHA256SUMS.txt").write_text("".join(f"{digest}  {name}\n" for name, digest in sums), encoding="utf-8")
    # Re-read the final release checksum list, including both manifests.
    for name, digest in sums:
        if sha((OUT / name).read_bytes()) != digest:
            raise ValueError("Final release checksum verification failed")
    print(json.dumps({"output": "artifacts/strategy-release", "archives": len(groups), "checksumVerification": "PASS", "sourceCommit": commit}))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ValueError, OSError, subprocess.CalledProcessError) as error:
        print(f"Packaging stopped: {error}", file=sys.stderr)
        raise SystemExit(1)
