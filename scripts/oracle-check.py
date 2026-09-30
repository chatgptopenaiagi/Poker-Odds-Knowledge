"""Independent PokerKit evaluator ordering oracle on a deterministic legal corpus."""
from datetime import datetime, timezone
from importlib.metadata import version
from pathlib import Path
import json
import time
from pokerkit import StandardHighHand

ROOT = Path(__file__).resolve().parents[1]
started = time.perf_counter()
corpus = json.loads((ROOT / "artifacts" / "evaluator-corpus.json").read_text(encoding="utf-8"))
assert version("pokerkit") == "0.7.6"
checked = []
disagreements = []
for row in corpus["hands"]:
    oracle = StandardHighHand.from_game(row["cards"])
    if row["category"].lower() != oracle.entry.label.value.lower():
        disagreements.append({"cards": row["cards"], "category": row["category"], "oracleCategory": oracle.entry.label.value})
    checked.append((row["score"], oracle.entry.index, row["cards"]))
checked.sort()
for previous, current in zip(checked, checked[1:]):
    if (previous[0] == current[0]) != (previous[1] == current[1]) or previous[1] > current[1]:
        disagreements.append({"previous": previous, "current": current})
result = {
    "schemaVersion": 1, "status": "FAIL" if disagreements else "PASS",
    "observedAt": datetime.now(timezone.utc).isoformat(), "oracle": "PokerKit", "version": version("pokerkit"),
    "seed": corpus["seed"], "hands": len(checked), "categoryChecks": len(checked), "adjacentOrderingAndTieChecks": len(checked)-1,
    "disagreements": disagreements, "durationSeconds": round(time.perf_counter()-started, 3),
    "scope": "Generated and targeted legal 5/6/7-card hands; full ordering and ties against independent Python implementation. Not exhaustive 7-card verification.",
}
(ROOT / "artifacts" / "oracle-result.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
print(json.dumps(result))
assert not disagreements, "Evaluator disagreements found"
