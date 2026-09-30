"""Independent oracle sanity tests; run with the isolated solver-oracle Python."""
import importlib.util
import itertools
import json
from pathlib import Path
import sys
import unittest
import numpy as np
from scipy.optimize import linprog

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("solver_oracle", ROOT / "scripts/solver-oracle.py")
oracle = importlib.util.module_from_spec(spec); sys.modules[spec.name] = oracle; spec.loader.exec_module(oracle)


class IndependentOracleTests(unittest.TestCase):
    def setUp(self):
        self.request = {"board": ["2c", "3d", "7h", "9s", "Tc"], "ranges": [[{"cards": ["As", "Ah"], "weight": 1}, {"cards": ["4c", "5c"], "weight": 1}], [{"cards": ["Ks", "Kh"], "weight": 1}]], "pot": 100, "effectiveStack": 200, "betSizes": [50], "raiseTo": [], "maxRaises": 0}

    def test_declared_self_checks(self):
        self.assertEqual(len(oracle.self_tests()), 5)

    def test_sequence_form_matches_separately_built_normal_form(self):
        game = oracle.RiverOracle(self.request)
        # Enumerate all deterministic own-information-set policies. The payoff
        # matrix below uses direct traversal, not the sequence-form sparse matrix.
        infos = [list(x.items()) for x in game.infosets]
        pure = [list(itertools.product(*(range(len(info["actions"])) for _, info in own))) for own in infos]
        self.assertEqual([len(x) for x in pure], [16, 4])
        payoff = np.zeros((len(pure[0]), len(pure[1])))
        for x, a in enumerate(pure[0]):
            for y, b in enumerate(pure[1]):
                policies = [dict(zip([k for k, _ in infos[0]], a)), dict(zip([k for k, _ in infos[1]], b))]
                for i, j, probability in game.pairs:
                    node = game.root
                    while node.actor is not None:
                        hand = i if node.actor == 0 else j
                        choice = policies[node.actor][node.path, hand]
                        node = node.children[choice][1]
                    payoff[x, y] += probability * game.utility(node, i, j)
        # Standard normal-form maximin LP; no sequence constraints involved.
        n = payoff.shape[0]
        solved = linprog(np.r_[np.zeros(n), -1], A_ub=np.c_[-payoff.T, np.ones(payoff.shape[1])], b_ub=np.zeros(payoff.shape[1]), A_eq=np.array([np.r_[np.ones(n), 0]]), b_eq=[1], bounds=[(0, None)] * n + [(None, None)], method="highs")
        self.assertTrue(solved.success)
        self.assertAlmostEqual(-solved.fun, game.solve()["valueOOPChips"], places=9)
        self.assertAlmostEqual(-solved.fun, 50 / 3, places=9)

    def test_joint_conditioning_matches_exact_fraction(self):
        request = {**self.request, "betSizes": [], "ranges": [[{"cards": ["As", "Ah"], "weight": 1}, {"cards": ["Ks", "Kh"], "weight": 2}], [{"cards": ["Ac", "Ad"], "weight": 3}, {"cards": ["Ks", "Qd"], "weight": 5}]]}
        game = oracle.RiverOracle(request)
        self.assertEqual(len(game.pairs), 3)
        self.assertAlmostEqual(game.solve()["valueOOPChips"], -25 / 7, places=9)

    def test_uncalled_raise_is_returned(self):
        game = oracle.RiverOracle(self.request)
        node = oracle.Node("fold-after-raise", None, (50, 150), 0)
        self.assertEqual(game.utility(node, 0, 0), -100)

    def test_impossible_joint_ranges_rejected(self):
        self.request["ranges"] = [[{"cards": ["As", "Ah"], "weight": 1}]] * 2
        with self.assertRaisesRegex(ValueError, "jointly compatible"):
            oracle.RiverOracle(self.request)

    def test_nan_and_missing_policy_rejected(self):
        game = oracle.RiverOracle(self.request); policy = game.solve()["policy"]
        policy["root"]["AhAs"]["CHECK"] = float("nan")
        with self.assertRaisesRegex(ValueError, "probabilities"):
            game.assess(policy)

    def test_six_original_fixtures_are_bounded_and_independently_solvable(self):
        source = json.loads((ROOT / "fixtures/strategy/scenarios.json").read_text())
        self.assertEqual(len(source["scenarios"]), 6)
        for row in source["scenarios"]:
            with self.subTest(row["id"]):
                self.assertTrue(all(4 <= len(hands) <= 12 for hands in row["request"]["ranges"]))
                game = oracle.RiverOracle(row["request"])
                self.assertGreater(len(game.pairs), 1)
                self.assertLess(game.solve()["quality"]["nashConvChips"], 1e-8)


if __name__ == "__main__":
    unittest.main()
