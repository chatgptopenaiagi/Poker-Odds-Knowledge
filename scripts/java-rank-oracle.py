"""Cross-check real Java comparator outputs against installed PokerKit 0.7.6."""
from datetime import datetime, timezone
from hashlib import sha256
from importlib.metadata import version
import json
from pathlib import Path
import time
from pokerkit import StandardHighHand

root = Path(__file__).resolve().parents[1]
raw = (root / "artifacts/java-rank-corpus.json").read_bytes()
source = json.loads(raw)
assert version("pokerkit") == "0.7.6"
categories = ["high card", "one pair", "two pair", "three of a kind", "straight", "flush", "full house", "four of a kind", "straight flush"]
started = time.perf_counter()
checked, disagreements, counts = [], [], {5: 0, 6: 0, 7: 0}
for row in source["hands"]:
    cards = row["cards"]
    hand = StandardHighHand.from_game("".join(cards))
    score = row["javaScore"]
    if score // 15**5 != categories.index(hand.entry.label.value.lower()):
        disagreements.append({"cards": cards, "kind": "category"})
    checked.append((score, hand.entry.index)); counts[len(cards)] += 1
checked.sort()
for previous, current in zip(checked, checked[1:]):
    if (previous[0] == current[0]) != (previous[1] == current[1]) or previous[1] > current[1]:
        disagreements.append({"kind": "ordering or tie", "previous": previous, "current": current})
report = {"schemaVersion": 1, "observedAt": datetime.now(timezone.utc).isoformat(), "status": "FAIL" if disagreements else "PASS", "oracle": "PokerKit", "version": version("pokerkit"), "corpusSha256": sha256(raw).hexdigest(), "seed": source["seed"], "hands": len(checked), "handSizes": counts, "categoryChecks": len(checked), "orderingAndTieChecks": len(checked)-1, "disagreementCount": len(disagreements), "disagreements": disagreements[:20], "elapsedSeconds": round(time.perf_counter()-started, 4), "scope": "Independent PokerKit comparison of actual Java reference-comparator outputs. Generated and structured legal 5/6/7-card hands; not exhaustive evaluation and not strategy convergence evidence."}
(root / "docs/strategy/JAVA_POKERKIT_VERIFICATION.json").write_text(json.dumps(report, indent=2)+"\n", encoding="utf8")
print(json.dumps(report, indent=2))
assert not disagreements
