"""Independent finite heads-up river oracle, not an application solver backend.

Builds its own public betting tree, evaluates terminal cards with PokerKit, and
solves sequence-form primal/dual LPs with SciPy/HiGHS. Neither Java traversal,
Java rank tables, CFR updates nor reported terminal payoffs are reused.
"""
from __future__ import annotations

import argparse
from dataclasses import dataclass, field
from fractions import Fraction
from hashlib import sha256
from importlib.metadata import version
import json
from pathlib import Path
import time
from typing import Any

import numpy as np
from scipy.optimize import linprog
from scipy.sparse import coo_matrix, csr_matrix, hstack
from pokerkit import StandardHighHand

VERSION = "pok-independent-river-sequence-lp-1"
TOL = 1e-8
CARD_SET = {rank + suit for rank in "23456789TJQKA" for suit in "cdhs"}


def card_key(cards: list[str]) -> str:
    return "".join(sorted(cards))


@dataclass
class Node:
    path: str
    actor: int | None
    invested: tuple[int, int]
    folded: int | None = None
    children: list[tuple[str, "Node"]] = field(default_factory=list)


def validate_request(source: dict) -> dict:
    r = {key: source[key] for key in ["board", "ranges", "pot", "effectiveStack", "betSizes", "raiseTo", "maxRaises"]}
    r["dead"] = source.get("dead", [])
    known = r["board"] + r["dead"]
    if len(r["board"]) != 5 or len(set(known)) != len(known) or any(c not in CARD_SET for c in known):
        raise ValueError("Exactly five unique board cards and valid disjoint dead cards required")
    for key in ["pot", "effectiveStack"]:
        if type(r[key]) is not int or not 1 <= r[key] <= 100000:
            raise ValueError("Positive bounded integer pot and stack required")
    if r["maxRaises"] not in (0, 1):
        raise ValueError("Oracle supports zero or one full raise")
    for key in ["betSizes", "raiseTo"]:
        if len(r[key]) > 3 or len(set(r[key])) != len(r[key]) or any(type(n) is not int or not 0 < n <= r["effectiveStack"] for n in r[key]):
            raise ValueError("Invalid bounded bet/raise abstraction")
        r[key] = sorted(r[key])
    if len(r["ranges"]) != 2:
        raise ValueError("Two concrete weighted ranges required")
    ranges = []
    for raw_range in r["ranges"]:
        if not 1 <= len(raw_range) <= 32:
            raise ValueError("Oracle bounded to 32 concrete combinations per range")
        combos, seen = [], set()
        for row in raw_range:
            cards = row["cards"]
            if len(cards) != 2 or len(set(cards)) != 2 or any(c not in CARD_SET for c in cards):
                raise ValueError("Invalid concrete hand")
            key = card_key(cards)
            if key in seen:
                raise ValueError("Duplicate concrete hand")
            seen.add(key)
            weight = Fraction(str(row["weight"]))
            if weight < 0 or weight > 10**12:
                raise ValueError("Invalid range weight")
            if weight and not set(cards).intersection(known):
                combos.append({"cards": cards, "key": key, "weight": weight})
        if not combos:
            raise ValueError("Range empty after explicit blockers")
        ranges.append(combos)
    r["ranges"] = ranges
    return r


def build_tree(r: dict) -> tuple[Node, list[Node]]:
    nodes = []

    def terminal(path: str, invested: tuple[int, int], folded=None):
        node = Node(path, None, invested, folded)
        nodes.append(node)
        return node

    def visit(path="root", actor=0, invested=(0, 0), checked=False, raises=0, last_raise=0):
        if len(nodes) > 500:
            raise ValueError("Public tree exceeds oracle budget")
        node = Node(path, actor, invested)
        nodes.append(node)
        other = 1 - actor
        call = invested[other] - invested[actor]
        if call < 0:
            raise ValueError("Invalid action order")
        if call == 0:
            child = terminal(path + "/CHECK", invested) if checked else visit(path + "/CHECK", other, invested, True, raises, last_raise)
            node.children.append(("CHECK", child))
            for size in r["betSizes"]:
                if size > r["effectiveStack"] - invested[actor]:
                    continue
                chips = list(invested)
                chips[actor] += size
                label = f"BET:{size}"
                node.children.append((label, visit(path + "/" + label, other, tuple(chips), False, raises, size)))
        else:
            node.children.append(("FOLD", terminal(path + "/FOLD", invested, actor)))
            matched = list(invested)
            matched[actor] = invested[other]
            node.children.append((f"CALL:{call}", terminal(path + f"/CALL:{call}", tuple(matched))))
            if raises < r["maxRaises"]:
                for target in r["raiseTo"]:
                    if target - invested[other] < last_raise or target > r["effectiveStack"]:
                        continue
                    chips = list(invested)
                    chips[actor] = target
                    label = f"RAISE_TO:{target}"
                    node.children.append((label, visit(path + "/" + label, other, tuple(chips), False, raises + 1, target - invested[other])))
        return node

    root = visit()
    return root, nodes


class RiverOracle:
    def __init__(self, request: dict):
        self.request = request
        self.r = validate_request(request)
        self.root, self.nodes = build_tree(self.r)
        self.hands = self.r["ranges"]
        # Compatible whole assignments receive product weight, normalized once.
        pairs = [(i, j, a["weight"] * b["weight"]) for i, a in enumerate(self.hands[0]) for j, b in enumerate(self.hands[1]) if not set(a["cards"]).intersection(b["cards"])]
        mass = sum(p[2] for p in pairs)
        if not mass:
            raise ValueError("No jointly compatible assignments")
        self.pairs = [(i, j, float(w / mass)) for i, j, w in pairs]
        self.rank = [[StandardHighHand.from_game("".join(hand["cards"] + self.r["board"])).entry.index for hand in hands] for hands in self.hands]
        self.infosets: list[dict[tuple[str, int], dict]] = [{}, {}]
        self.sequence_count = [1, 1]
        terminals = []

        def walk(node: Node, histories: list[list[int]]):
            if node.actor is None:
                terminals.append((node, histories))
                return
            actor = node.actor
            for hand in range(len(self.hands[actor])):
                count = len(node.children)
                indexes = list(range(self.sequence_count[actor], self.sequence_count[actor] + count))
                self.sequence_count[actor] += count
                self.infosets[actor][node.path, hand] = {"parent": histories[actor][hand], "sequences": indexes, "actions": [a for a, _ in node.children]}
            for choice, (_, child) in enumerate(node.children):
                next_histories = [list(h) for h in histories]
                next_histories[actor] = [self.infosets[actor][node.path, hand]["sequences"][choice] for hand in range(len(self.hands[actor]))]
                walk(child, next_histories)

        walk(self.root, [[0] * len(hands) for hands in self.hands])
        self.constraints = []
        for actor in (0, 1):
            rows, cols, values = [0], [0], [1.0]
            for row, info in enumerate(self.infosets[actor].values(), 1):
                rows.append(row); cols.append(info["parent"]); values.append(-1.0)
                for col in info["sequences"]:
                    rows.append(row); cols.append(col); values.append(1.0)
            matrix = coo_matrix((values, (rows, cols)), shape=(len(self.infosets[actor]) + 1, self.sequence_count[actor])).tocsr()
            rhs = np.zeros(matrix.shape[0]); rhs[0] = 1.0
            self.constraints.append((matrix, rhs))
        rows, cols, values = [], [], []
        for node, histories in terminals:
            for i, j, probability in self.pairs:
                rows.append(histories[0][i]); cols.append(histories[1][j])
                values.append(probability * self.utility(node, i, j))
        self.payoffs = coo_matrix((values, (rows, cols)), shape=tuple(self.sequence_count)).tocsr()
        self.payoffs.sum_duplicates()

    def utility(self, node: Node, i: int, j: int) -> float:
        half = self.r["pot"] / 2
        if node.folded is not None:
            return -half - node.invested[0] if node.folded == 0 else half + node.invested[1]
        if node.invested[0] != node.invested[1]:
            raise ValueError("Showdown must return unmatched chips first")
        comparison = (self.rank[0][i] > self.rank[1][j]) - (self.rank[0][i] < self.rank[1][j])
        return comparison * (half + node.invested[0])

    @staticmethod
    def lp(c, **kwargs):
        result = linprog(c, method="highs", options={"time_limit": 20, "dual_feasibility_tolerance": 1e-9, "primal_feasibility_tolerance": 1e-9}, **kwargs)
        if not result.success or not np.isfinite(result.fun):
            raise ValueError(f"Independent LP did not finish: {result.message}")
        return result

    def solve(self) -> dict:
        A = self.payoffs
        E, e = self.constraints[0]; F, f = self.constraints[1]
        n0, n1 = self.sequence_count
        # max f'v with E x=e, x>=0, F'v <= A'x; v is free.
        zero0 = csr_matrix((E.shape[0], F.shape[0]))
        primal = self.lp(np.r_[np.zeros(n0), -f], A_ub=hstack([-A.T, F.T]), b_ub=np.zeros(n1), A_eq=hstack([E, zero0]), b_eq=e, bounds=[(0, None)] * n0 + [(None, None)] * F.shape[0])
        # min e'u with F y=f, y>=0, A y <= E'u; u is free.
        zero1 = csr_matrix((F.shape[0], E.shape[0]))
        dual = self.lp(np.r_[np.zeros(n1), e], A_ub=hstack([A, -E.T]), b_ub=np.zeros(n0), A_eq=hstack([F, zero1]), b_eq=f, bounds=[(0, None)] * n1 + [(None, None)] * E.shape[0])
        if abs(-primal.fun - dual.fun) > TOL:
            raise ValueError("Independent primal/dual values disagree")
        x, y = primal.x[:n0], dual.x[:n1]
        quality = self.assess_realizations(x, y)
        if quality["nashConvChips"] > TOL:
            raise ValueError("LP solution fails independent best-response check")
        return {"valueOOPChips": -primal.fun, "dualValueOOPChips": dual.fun, "dualityGapChips": abs(-primal.fun - dual.fun), "quality": quality, "policy": self.policy_from_realizations([x, y])}

    def policy_from_realizations(self, realizations) -> dict:
        policy = {}
        for actor in (0, 1):
            for (path, hand), info in self.infosets[actor].items():
                parent = realizations[actor][info["parent"]]
                raw = [max(0.0, float(realizations[actor][seq])) for seq in info["sequences"]]
                probs = [n / sum(raw) for n in raw] if parent > 1e-12 and sum(raw) > 1e-12 else [1 / len(raw)] * len(raw)
                policy.setdefault(path, {})[self.hands[actor][hand]["key"]] = dict(zip(info["actions"], probs))
        return policy

    def realizations_from_policy(self, policy: dict):
        realizations = [np.zeros(n) for n in self.sequence_count]
        for actor in (0, 1):
            realizations[actor][0] = 1
            for (path, hand), info in self.infosets[actor].items():
                key = self.hands[actor][hand]["key"]
                try:
                    supplied = policy[path][key]
                except KeyError as error:
                    raise ValueError(f"Missing policy at {path}/{key}") from error
                if set(supplied) != set(info["actions"]):
                    raise ValueError(f"Policy action abstraction differs at {path}")
                probs = np.array([supplied[action] for action in info["actions"]], dtype=float)
                if not np.isfinite(probs).all() or min(probs) < -1e-8 or max(probs) > 1 + 1e-8 or abs(sum(probs) - 1) > 1e-6:
                    raise ValueError(f"Invalid probabilities at {path}/{key}")
                probs = np.maximum(probs, 0); probs /= sum(probs)
                realizations[actor][info["sequences"]] = realizations[actor][info["parent"]] * probs
        return realizations

    def assess_realizations(self, x, y) -> dict:
        E, e = self.constraints[0]; F, f = self.constraints[1]
        residual = max(float(np.max(np.abs(E @ x - e))), float(np.max(np.abs(F @ y - f))))
        if residual > 1e-7:
            raise ValueError("Strategy violates sequence realization constraints")
        value = float(x @ self.payoffs @ y)
        br0 = -self.lp(-(self.payoffs @ y), A_eq=E, b_eq=e, bounds=(0, None)).fun
        br1 = -self.lp(self.payoffs.T @ x, A_eq=F, b_eq=f, bounds=(0, None)).fun
        nash = max(0.0, br0 + br1)
        return {"profileEVChips": [value, -value], "bestResponseEVChips": [br0, br1], "deviationGainsChips": [max(0.0, br0 - value), max(0.0, br1 + value)], "nashConvChips": nash, "exploitabilityChips": nash / 2, "exploitabilityPotPercent": nash / 2 / self.r["pot"] * 100, "equilibriumValueIntervalOOP": [-br1, br0], "realizationResidual": residual}

    def assess(self, policy: dict) -> dict:
        return self.assess_realizations(*self.realizations_from_policy(policy))

    def policy_from_java(self, output: dict) -> dict:
        """Translate action-labelled output, while independently checking its tree.

        Java IDs are not used as information sets: the oracle reconstructs paths.
        Java payoffs/ranks/EVs are never used to construct the payoff matrix.
        """
        supplied = output["nodes"]
        by_id = {n["id"]: n for n in supplied}
        if len(by_id) != len(supplied):
            raise ValueError("Duplicate Java public node ID")
        policy, visited, mapped = {}, set(), {}

        def translate(node: Node, java_id: str):
            if java_id in visited or java_id not in by_id:
                raise ValueError("Cyclic or missing Java child")
            visited.add(java_id)
            actual = by_id[java_id]
            mapped[node.path] = actual
            if tuple(actual["committed"]) != node.invested:
                raise ValueError(f"Java contributions differ at {node.path}")
            if node.actor is None:
                if actual.get("actions"):
                    raise ValueError("Java terminal contains actions")
                return
            if actual["actor"] != node.actor:
                raise ValueError(f"Java actor differs at {node.path}")
            actual_actions = {}
            for index, action in enumerate(actual["actions"]):
                kind = action["type"]
                if kind in ("CHECK", "FOLD"):
                    key = kind
                elif kind == "CALL":
                    key = f"CALL:{node.invested[1-node.actor] - node.invested[node.actor]}"
                elif kind == "BET":
                    key = f"BET:{action['amount']}"
                elif kind in ("RAISE", "RAISE_TO"):
                    key = f"RAISE_TO:{action['raiseTo']}"
                else:
                    raise ValueError("Unknown Java action type")
                if key in actual_actions:
                    raise ValueError("Duplicate Java action")
                actual_actions[key] = (index, action)
            if set(actual_actions) != {key for key, _ in node.children}:
                raise ValueError(f"Java action tree differs at {node.path}")
            hands = {}
            for item in actual["policies"]:
                key = card_key(item["cards"])
                if key in hands or len(item["probabilities"]) != len(actual_actions):
                    raise ValueError("Malformed Java per-hand policy")
                hands[key] = {action: item["probabilities"][idx] for action, (idx, _) in actual_actions.items()}
            if set(hands) != {h["key"] for h in self.hands[node.actor]}:
                raise ValueError(f"Java concrete hand set differs at {node.path}")
            policy[node.path] = hands
            for action, child in node.children:
                translate(child, actual_actions[action][1]["child"])

        translate(self.root, "root")
        if visited != set(by_id):
            raise ValueError("Unreachable extra Java nodes supplied")
        # Checks every probability and sequence constraint before returning.
        self.realizations_from_policy(policy)
        self.java_nodes = mapped
        return policy

    def verify_java(self, output: dict, maximum_nash_conv_chips=0.5) -> dict:
        policy = self.policy_from_java(output)
        quality = self.assess(policy)
        solved = self.solve()
        tolerance = max(1e-4, self.r["pot"] * 1e-5)
        checks, errors = {}, []
        if output.get("status") != "COMPLETE" or output.get("ok") is not True:
            errors.append("Solver did not report a completed successful job")
        for field, expected in [("nashConvChips", quality["nashConvChips"]), ("exploitabilityChips", quality["exploitabilityChips"]), ("exploitabilityPercentPot", quality["exploitabilityPotPercent"])]:
            supplied = float(output[field])
            checks[field] = {"reported": supplied, "independent": expected, "absoluteDifference": abs(supplied - expected)}
            limit = tolerance / self.r["pot"] * 100 if field.endswith("PercentPot") else tolerance
            if not np.isfinite(supplied) or abs(supplied - expected) > limit:
                errors.append(f"Reported {field} differs from independent result")
        for field, expected in [("profileEvChips", quality["profileEVChips"]), ("upstreamBestResponseValues", quality["bestResponseEVChips"])]:
            difference = max(abs(float(a) - b) for a, b in zip(output[field], expected))
            checks[field] = {"maximumAbsoluteDifference": difference}
            if not np.isfinite(difference) or difference > tolerance:
                errors.append(f"Reported {field} differs from independent result")
        rank_checks = 0
        supplied_ranks = [{card_key(h["cards"]): h["rank"] for h in hands} for hands in output["ranges"]]
        for i, j, _ in self.pairs:
            a, b = supplied_ranks[0][self.hands[0][i]["key"]], supplied_ranks[1][self.hands[1][j]["key"]]
            expected = (self.rank[0][i] > self.rank[1][j]) - (self.rank[0][i] < self.rank[1][j])
            if (a < b) - (a > b) != expected:
                errors.append("Reported showdown rank ordering/tie differs from PokerKit")
            rank_checks += 1

        # Independent conditional continuation/action EV, grouped by own hand.
        reach = {self.root.path: [[1.0] * len(hands) for hands in self.hands]}
        continuation = {}
        def value(node, i, j):
            key = node.path, i, j
            if key not in continuation:
                if node.actor is None:
                    continuation[key] = self.utility(node, i, j)
                else:
                    hand = self.hands[node.actor][i if node.actor == 0 else j]["key"]
                    continuation[key] = sum(policy[node.path][hand][action] * value(child, i, j) for action, child in node.children)
            return continuation[key]

        maximum_ev_error, ev_checks, unreachable = 0.0, 0, 0
        maximum_reach_error, reach_checks = 0.0, 0
        for node in self.nodes:
            actual = self.java_nodes[node.path]
            if node.actor is None:
                if node.folded is not None:
                    expected = self.utility(node, 0, 0)
                    if max(abs(actual["payoffs"][0] - expected), abs(actual["payoffs"][1] + expected)) > TOL:
                        errors.append("Terminal fold payout differs")
                else:
                    amount = self.r["pot"] / 2 + node.invested[0]
                    if actual["winPayoffs"] != [[amount, -amount], [-amount, amount]] or actual["tiePayoffs"] != [0, 0]:
                        errors.append("Terminal showdown payout differs")
                continue
            actor = node.actor; other = 1 - actor
            for action, child in node.children:
                probabilities = [list(row) for row in reach[node.path]]
                probabilities[actor] = [p * policy[node.path][self.hands[actor][hand]["key"]][action] for hand, p in enumerate(probabilities[actor])]
                reach[child.path] = probabilities
            actual_hands = {card_key(row["cards"]): row for row in actual["policies"]}
            actual_action_index = {}
            for index, action in enumerate(actual["actions"]):
                kind = action["type"]
                key = kind if kind in ("FOLD", "CHECK") else f"CALL:{node.invested[other]-node.invested[actor]}" if kind == "CALL" else f"BET:{action['amount']}" if kind == "BET" else f"RAISE_TO:{action['raiseTo']}"
                actual_action_index[key] = index
            for hand, combo in enumerate(self.hands[actor]):
                weights = [(opponent, float(h["weight"]) * reach[node.path][other][opponent]) for opponent, h in enumerate(self.hands[other]) if not set(combo["cards"]).intersection(h["cards"])]
                mass = sum(w for _, w in weights)
                own_reach = reach[node.path][actor][hand] * float(combo["weight"])
                actual_hand = actual_hands[combo["key"]]
                maximum_reach_error = max(maximum_reach_error, abs(actual_hand["ownReach"] - own_reach), abs(actual_hand["opponentReachMass"] - mass))
                reach_checks += 2
                if mass <= 1e-12:
                    unreachable += 1
                    continue  # no conditional EV exists; solver's declared fallback is not graded as observed reach
                expected_actions = []
                for action, child in node.children:
                    expected = sum(weight * value(child, hand if actor == 0 else opponent, opponent if actor == 0 else hand) * (1 if actor == 0 else -1) for opponent, weight in weights) / mass
                    expected_actions.append(expected)
                    supplied = actual_hands[combo["key"]]["actionEvChips"][actual_action_index[action]]
                    if supplied is None or not np.isfinite(supplied):
                        errors.append("Missing finite action EV at positive opponent reach")
                    else:
                        maximum_ev_error = max(maximum_ev_error, abs(supplied - expected))
                    ev_checks += 1
                expected = sum(policy[node.path][combo["key"]][action] * v for (action, _), v in zip(node.children, expected_actions))
                supplied = actual_hands[combo["key"]]["evChips"]
                if supplied is None or not np.isfinite(supplied):
                    errors.append("Missing finite node EV at positive opponent reach")
                else:
                    maximum_ev_error = max(maximum_ev_error, abs(supplied - expected))
                ev_checks += 1
        if maximum_ev_error > tolerance:
            errors.append("Per-combination continuation/action EV differs")
        reach_tolerance = max(1e-6, max(float(h["weight"]) for hands in self.hands for h in hands) * 1e-6)
        if maximum_reach_error > reach_tolerance:
            errors.append("Per-combination own/opponent reach differs")
        if quality["nashConvChips"] > maximum_nash_conv_chips:
            errors.append("Independent strategy quality exceeds predeclared gate")
        return {"status": "PASS" if not errors else "FAIL", "errors": errors, "thresholds": {"metricToleranceChips": tolerance, "maximumNashConvChips": maximum_nash_conv_chips, "lpPrimalDualToleranceChips": TOL, "reachTolerance": reach_tolerance}, "tree": self.describe(), "equilibriumValueOOPChips": solved["valueOOPChips"], "dualityGapChips": solved["dualityGapChips"], "independentStrategyQuality": quality, "reportedMetricComparisons": checks, "pokerKitCompatiblePairRankChecks": rank_checks, "conditionalEvChecks": ev_checks, "reachChecks": reach_checks, "maximumReachDifference": maximum_reach_error, "undefinedZeroOpponentReachRows": unreachable, "maximumConditionalEvDifferenceChips": maximum_ev_error}

    def describe(self) -> dict:
        return {"publicNodes": len(self.nodes), "publicTerminals": sum(n.actor is None for n in self.nodes), "informationSets": [len(s) for s in self.infosets], "sequences": self.sequence_count, "compatibleWeightedAssignments": len(self.pairs), "positiveCombosAfterKnownBlockers": [len(h) for h in self.hands], "payoffNonzeros": self.payoffs.nnz, "utilityConvention": "Centered zero-sum chips: winner pot/2 plus opponent new investment; loser negative pot/2 minus own new investment. Uncalled chips are returned. Tied matched showdowns are zero."}


def self_tests() -> list[dict]:
    base = {"board": ["2c", "3d", "7h", "9s", "Tc"], "dead": [], "ranges": [[{"cards": ["As", "Ah"], "weight": 1}], [{"cards": ["Ks", "Kh"], "weight": 1}]], "pot": 100, "effectiveStack": 200, "betSizes": [], "raiseTo": [], "maxRaises": 0}
    tests = []
    simple = RiverOracle(base); solution = simple.solve()
    assert abs(solution["valueOOPChips"] - 50) < TOL
    tests.append({"name": "Certain winner checkdown centered value", "status": "PASS", "valueOOPChips": 50})
    tied = {**base, "board": ["Ts", "Js", "Qs", "Ks", "As"], "ranges": [[{"cards": ["2c", "3c"], "weight": 1}], [{"cards": ["4c", "5c"], "weight": 1}]], "betSizes": [50], "raiseTo": [150], "maxRaises": 1}
    tie_solution = RiverOracle(tied).solve(); assert abs(tie_solution["valueOOPChips"]) < TOL
    tests.append({"name": "Board-playing tie with bluff/raise branches", "status": "PASS", "valueOOPChips": 0})
    polarized = {**base, "ranges": [[{"cards": ["As", "Ah"], "weight": 1}, {"cards": ["4c", "5c"], "weight": 1}], base["ranges"][1]], "betSizes": [50], "raiseTo": [150], "maxRaises": 1}
    game = RiverOracle(polarized); solved = game.solve()
    assert game.assess(solved["policy"])["nashConvChips"] < TOL
    uniform = {path: {hand: {action: 1 / len(actions) for action in actions} for hand, actions in hands.items()} for path, hands in solved["policy"].items()}
    assert game.assess(uniform)["nashConvChips"] > 1
    tests.append({"name": "Nontrivial imperfect-information LP and exact best responses", "status": "PASS", "equilibriumValue": solved["valueOOPChips"], "uniformNashConv": game.assess(uniform)["nashConvChips"]})
    perm = dict(zip("cdhs", "dhsc")); convert = lambda cards: [c[0] + perm[c[1]] for c in cards]
    renamed = {**polarized, "board": convert(polarized["board"]), "ranges": [[{**h, "cards": convert(h["cards"]), "weight": h["weight"] * 7} for h in hands] for hands in polarized["ranges"]]}
    assert abs(RiverOracle(renamed).solve()["valueOOPChips"] - solved["valueOOPChips"]) < TOL
    tests.append({"name": "Suit permutation and per-range scale invariance", "status": "PASS"})
    malformed = json.loads(json.dumps(solved["policy"])); del malformed["root"]
    try:
        game.assess(malformed)
        raise AssertionError("Missing strategy accepted")
    except ValueError:
        pass
    tests.append({"name": "Missing information-set strategy fails closed", "status": "PASS"})
    return tests


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--request", type=Path)
    parser.add_argument("--policy", type=Path, help="Canonical oracle policy, keyed by public action path and sorted concrete hand")
    parser.add_argument("--java-output", type=Path, help="Actual full Java result containing nodes and per-combination average strategies")
    parser.add_argument("--output", type=Path)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    start = time.perf_counter()
    report: dict[str, Any] = {"schemaVersion": 1, "oracle": VERSION, "dependencies": {name: version(name) for name in ["scipy", "numpy", "pokerkit"]}, "method": "Independent complete finite river sequence-form LP, primal/dual values and exact LP best responses; numerical tolerance 1e-8 chips"}
    if args.self_test:
        report["selfTests"] = self_tests()
    if args.request:
        raw = args.request.read_bytes(); request = json.loads(raw)
        game = RiverOracle(request)
        report.update(inputSha256=sha256(raw).hexdigest(), tree=game.describe(), equilibrium=game.solve())
        if args.policy:
            report["suppliedStrategyQuality"] = game.assess(json.loads(args.policy.read_bytes()))
        if args.java_output:
            raw_java = args.java_output.read_bytes()
            output = json.loads(raw_java)
            report["javaOutputSha256"] = sha256(raw_java).hexdigest()
            report["javaVerification"] = game.verify_java(output)
    if not args.self_test and not args.request:
        parser.error("Select --self-test or --request")
    report["elapsedSeconds"] = round(time.perf_counter() - start, 4)
    encoded = json.dumps(report, indent=2, allow_nan=False) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True); args.output.write_text(encoded, encoding="utf8")
    print(encoded)
    if report.get("javaVerification", {}).get("status") == "FAIL":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
