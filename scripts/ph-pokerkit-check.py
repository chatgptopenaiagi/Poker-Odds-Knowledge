"""Independent external oracle for the deterministic real PH WASM corpus.

Uses the existing isolated PokerKit environment. No package installation, no
model, no network, no live player data and no changes to that environment.
"""
from datetime import datetime, timezone
from importlib.metadata import version
from hashlib import sha256
from pathlib import Path
import json
import platform
import time
from pokerkit import StandardHighHand

ROOT = Path(__file__).resolve().parents[1]
started = time.perf_counter()
assert version("pokerkit") == "0.7.6", "Reviewed oracle version changed"
corpus_bytes = (ROOT / "artifacts" / "ph-oracle-corpus.json").read_bytes()
corpus = json.loads(corpus_bytes)
assert len(corpus["hands"]) == 10000
categories = ["High card", "One pair", "Two pair", "Three of a kind", "Straight", "Flush", "Full house", "Four of a kind", "Straight flush"]

def category_from_raw(rank):
    for boundary, category in [(6185, 0), (3325, 1), (2467, 2), (1609, 3), (1599, 4), (322, 5), (166, 6), (10, 7)]:
        if rank > boundary:
            return category
    return 8

checked = []
disagreements = []
for row in corpus["hands"]:
    cards = "".join(row["cards"])
    oracle = StandardHighHand.from_game(cards)
    ordinal = row["phOrdinal"]
    category = categories[category_from_raw(7463 - ordinal)]
    if category.lower() != oracle.entry.label.value.lower():
        disagreements.append({"id": row["id"], "cards": row["cards"], "phCategory": category, "oracleCategory": oracle.entry.label.value})
    # PokerKit uses a zero-based, higher-is-better index over the same 7462
    # distinct standard-high values. Verify this precise normalization too.
    if ordinal - 1 != oracle.entry.index:
        disagreements.append({"id": row["id"], "phOrdinal": ordinal, "pokerkitIndex": oracle.entry.index})
    checked.append((ordinal, oracle.entry.index, row["id"]))
checked.sort()
for previous, current in zip(checked, checked[1:]):
    if (previous[0] == current[0]) != (previous[1] == current[1]) or previous[1] > current[1]:
        disagreements.append({"previous": previous, "current": current})
result = {
    "schemaVersion": 1, "status": "FAIL" if disagreements else "PASS",
    "observedAt": datetime.now(timezone.utc).isoformat(), "oracle": "PokerKit", "version": version("pokerkit"), "python": platform.python_version(),
    "engine": corpus["engine"], "corpusSha256": sha256(corpus_bytes).hexdigest(), "seed": corpus["seed"], "hands": len(checked), "categoryChecks": len(checked), "normalizedIndexChecks": len(checked), "adjacentOrderingAndTieChecks": len(checked)-1,
    "disagreementCount": len(disagreements), "disagreements": disagreements[:30], "durationSeconds": round(time.perf_counter()-started, 3),
    "scope": "10,000 deterministic legal seven-card hands evaluated by compiled PH C/WASM, cross-checked with installed independent PokerKit 0.7.6. Not exhaustive seven-card or strategy verification.",
}
(ROOT / "artifacts" / "ph-pokerkit-result.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf8")
print(json.dumps(result, indent=2))
assert not disagreements, "PH/PokerKit disagreement found"
