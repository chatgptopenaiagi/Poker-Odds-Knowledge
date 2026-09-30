"""Run reviewed fixed Maxima fixtures and cross-check Python exact arithmetic.

No input is accepted from argv, web pages, imported JSON or user expressions.
Only trusted installed Maxima and the adjacent fixed batch are invoked.
"""
from datetime import datetime, timezone
from fractions import Fraction
from math import comb
from pathlib import Path
import json
import os
import re
import subprocess
import sys
import tempfile
import time

ROOT = Path(__file__).resolve().parents[1]
MAXIMA = Path(r"C:\maxima-5.50.0\bin\maxima.bat")
SCRIPT = ROOT / "scripts" / "maxima-fixtures.mac"
EXPECTED = {
    "choose52_2": Fraction(comb(52, 2)), "choose45_2": Fraction(comb(45, 2)),
    "flop_one": Fraction(9, 47), "flop_two": 1 - Fraction(comb(38, 2), comb(47, 2)),
    "turn_one": Fraction(9, 46), "call_threshold": Fraction(20, 100),
    "call_ev": Fraction(1, 4) * 100 - 20, "bluff_threshold": Fraction(50, 150),
    "bluff_ev": Fraction(2, 5) * 100 - Fraction(3, 5) * 50,
    "call_identity": Fraction(0), "bluff_identity": Fraction(0),
    "call_zero": Fraction(0), "bluff_zero": Fraction(0),
}

def run_fixed(arguments: str, env: dict[str, str]) -> str:
    # cmd /d disables AutoRun; batch and arguments are fixed reviewed constants.
    # No shell=True and no data-derived expressions. Reject command metacharacters
    # if a future developer moves this project to an unsupported directory.
    if not re.fullmatch(r"[A-Za-z0-9_:/ .\\-]+", str(SCRIPT)):
        raise RuntimeError("Batch path contains unsupported shell characters")
    # Pass cmd its native command line: Python's list2cmdline escaping is for
    # ordinary Windows executables and incorrectly backslash-escapes cmd quotes.
    command = f'C:\\Windows\\System32\\cmd.exe /d /s /c ""{MAXIMA}" {arguments}"'
    process = subprocess.Popen(command,
        cwd=ROOT, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        text=True, encoding="utf-8", errors="replace", creationflags=subprocess.CREATE_NO_WINDOW)
    try:
        out, _ = process.communicate(timeout=30)
    except subprocess.TimeoutExpired:
        # Stop only the process tree created immediately above; no name-based kill.
        subprocess.run([r"C:\Windows\System32\taskkill.exe", "/PID", str(process.pid), "/T", "/F"],
            capture_output=True, timeout=10, creationflags=subprocess.CREATE_NO_WINDOW)
        raise RuntimeError("Owned Maxima check exceeded 30 seconds")
    if process.returncode:
        raise RuntimeError(f"Fixed Maxima call exited {process.returncode}")
    return out

def main() -> None:
    started = time.perf_counter()
    assert sys.version_info[:2] == (3, 14), "Use the isolated Python 3.14 environment"
    if not MAXIMA.is_file():
        raise RuntimeError("Trusted existing Maxima launcher missing")
    with tempfile.TemporaryDirectory(prefix="hil-maxima-") as isolated:
        env = dict(os.environ, MAXIMA_USERDIR=isolated, MAXIMA_TEMPDIR=isolated)
        version_output = run_fixed("--no-init --version", env)
        build = next((line.strip() for line in version_output.splitlines() if line.startswith("Maxima ")), "UNKNOWN")
        output = run_fixed(f'--no-init --very-quiet --batch="{SCRIPT.as_posix()}"', env)
    raw = [line.strip() for line in output.splitlines() if line.startswith("HIL|")]
    observed = {}
    for line in raw:
        _, key, result = line.split("|", 2)
        observed[key] = Fraction(result.strip())
    assert observed.keys() == EXPECTED.keys(), f"Incomplete Maxima fixtures: {sorted(observed)}"
    assert observed == EXPECTED, "Maxima/Python rational disagreement"
    # Independent identity checks at a finite exact grid, without symbolic reuse.
    count = 0
    for pot in [1, 20, 80, 100, 731]:
        for call in [1, 7, 20, 50]:
            for probability in [Fraction(0), Fraction(1, 7), Fraction(1, 4), Fraction(2, 5), Fraction(1)]:
                assert probability * pot - (1-probability) * call == probability * (pot+call)-call
                count += 1
    report = {
        "schemaVersion": 1, "observedAt": datetime.now(timezone.utc).isoformat(),
        "status": "PASS", "maximaBuildIdentity": build, "pythonVersion": sys.version.split()[0],
        "route": "existing Maxima CLI; fixed batch; --no-init; isolated MAXIMA_USERDIR; cmd /d; 30s timeout",
        "cases": {k: {"rational": str(v), "decimal": float(v), "maxima": str(observed[k])} for k, v in EXPECTED.items()},
        "pythonIdentityChecks": count, "sanitizedRawOutput": raw,
        "durationSeconds": round(time.perf_counter() - started, 3),
        "domains": "Card counts nonnegative integers; 0<=E,F<=1; P,C,P0,B>=0; denominators positive; no rake/future betting for terminal formulas.",
    }
    target = ROOT / "tests" / "fixtures" / "math-v1.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({k: report[k] for k in ["status", "observedAt", "maximaBuildIdentity", "pythonVersion", "pythonIdentityChecks", "durationSeconds"]}))

if __name__ == "__main__":
    main()
