"""Run fixed, bounded Java river jobs then independently verify their policies.

Exactly 500/2000/10000 iterations per original scenario, no adaptive reruns.
Only explicit operator-selected existing Java and the project-owned JAR execute.
"""
import argparse
from datetime import datetime, timezone
from hashlib import sha256
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("solver_oracle", ROOT / "scripts/solver-oracle.py")
oracle = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = oracle
spec.loader.exec_module(oracle)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--java", required=True, type=Path)
    parser.add_argument("--jar-sha256", required=True)
    args = parser.parse_args()
    if ROOT.resolve() != Path.cwd().resolve():
        raise ValueError("Run from the isolated strategy worktree root")
    jar = ROOT / ".solver-tools/java-build/pok-river-solver.jar"
    if not args.java.is_file() or sha256(jar.read_bytes()).hexdigest() != args.jar_sha256:
        raise ValueError("Selected Java or pinned owned solver JAR unavailable")
    source = ROOT / "fixtures/strategy/scenarios.json"
    scenarios = json.loads(source.read_bytes())["scenarios"]
    assert len(scenarios) == 6
    directory = ROOT / "artifacts/solver-scenarios"
    directory.mkdir(parents=True, exist_ok=True)
    report = {"schemaVersion": 1, "observedAt": datetime.now(timezone.utc).isoformat(), "oracle": oracle.VERSION, "sourceSha256": sha256(source.read_bytes()).hexdigest(), "solverJarSha256": args.jar_sha256,
              "predeclaredPlan": {"iterations": [500, 2000, 10000], "jobs": 18, "threads": 1, "maxHeapMiB": 256, "deadlineMs": 15000, "parentTimeoutMs": 17000, "maximumNashConvChips": 0.5, "metricToleranceChips": 0.001, "noAdaptiveReruns": True},
              "dependencies": {name: oracle.version(name) for name in ["scipy", "numpy", "pokerkit"]}, "scenarios": []}
    started = time.perf_counter()
    for scenario in scenarios:
        entry = {"id": scenario["id"], "version": scenario["version"], "runs": []}
        for iterations in report["predeclaredPlan"]["iterations"]:
            if time.perf_counter() - started > 240:
                raise TimeoutError("Overall four-minute verification budget exceeded")
            request = {**scenario["request"], "iterations": iterations}
            label = f"{scenario['id']}-{iterations}"
            request_file = directory / (label + ".request.json")
            output_file = directory / (label + ".result.json")
            oracle_file = directory / (label + ".oracle.json")
            request_file.write_text(json.dumps(request, indent=2) + "\n", encoding="utf8")
            command = [str(args.java), "-Xms32m", "-Xmx256m", "-XX:ActiveProcessorCount=1", "-XX:+UseSerialGC", "-Djava.awt.headless=true", "-cp", str(jar) + ";" + str(ROOT / ".solver-tools/java-deps/*"), "pok.solver.PokRiverMain"]
            job_started = time.perf_counter()
            run = subprocess.run(command, input=json.dumps(request), text=True, encoding="utf8", capture_output=True, timeout=17, shell=False, creationflags=subprocess.CREATE_NO_WINDOW)
            if run.returncode:
                raise ValueError(f"Owned Java job failed ({run.returncode}); no completed strategy claimed")
            frames = [json.loads(line) for line in run.stdout.splitlines() if line.strip().startswith("{")]
            result = next(frame for frame in reversed(frames) if frame.get("type") == "result")
            output_file.write_text(json.dumps(result, indent=2, allow_nan=False) + "\n", encoding="utf8")
            check_started = time.perf_counter()
            game = oracle.RiverOracle(request)
            verification = game.verify_java(result, maximum_nash_conv_chips=0.5)
            verification.update(method="Independent complete finite river sequence-form primal/dual LP and exact best responses; separate PokerKit rankings/tree/payouts", inputSha256=sha256(request_file.read_bytes()).hexdigest(), outputSha256=sha256(output_file.read_bytes()).hexdigest())
            oracle_file.write_text(json.dumps(verification, indent=2, allow_nan=False) + "\n", encoding="utf8")
            entry["runs"].append({"iterations": iterations, "status": verification["status"], "solverElapsedMs": result["elapsedMs"], "totalWallSeconds": round(time.perf_counter() - job_started, 4), "oracleSeconds": round(time.perf_counter() - check_started, 4), "requestFile": request_file.relative_to(ROOT).as_posix(), "resultFile": output_file.relative_to(ROOT).as_posix(), "oracleFile": oracle_file.relative_to(ROOT).as_posix(), "verification": verification, "trace": result.get("trace", [])})
            print(f"{label}: {verification['status']} NashConv={verification['independentStrategyQuality']['nashConvChips']:.9f} chips; max EV difference={verification['maximumConditionalEvDifferenceChips']:.9f}", flush=True)
        report["scenarios"].append(entry)
    report["elapsedSeconds"] = round(time.perf_counter() - started, 3)
    report["status"] = "PASS" if all(s["runs"][-1]["status"] == "PASS" for s in report["scenarios"]) else "PARTIAL"
    report["limitations"] = ["Quality gate applies to the complete specified zero-sum two-player river abstraction, not other bet sizes, streets or multiway games.", "Global NashConv is not a per-hand error bound. Per-combination EV equality is separately checked against the reported strategy, not labelled equilibrium action regret.", "All three fixed iteration checkpoints are retained, including any earlier checkpoint above the quality gate; final packs use the predetermined 10000-iteration result.", "LP numeric feasibility/value tolerance is 1e-8 chips; Java float metric/EV agreement tolerance is 0.001 chips for these 100-chip pots.", "Zero-opponent-reach conditional EV is undefined; any labelled solver fallback there is excluded from conditional-EV agreement claims.", "No GPU, model, paid API, server listener or deployment is involved."]
    output = ROOT / "docs/strategy/SOLVER_QUALITY.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2, allow_nan=False) + "\n", encoding="utf8")
    print(f"Final fixed-budget quality: {report['status']}; report {output.relative_to(ROOT)}")
    if report["status"] != "PASS":
        sys.exit(1)


if __name__ == "__main__":
    main()
