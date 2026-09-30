import { writeFileSync } from 'node:fs';
import { evaluateUnchecked, HAND_CATEGORIES } from '../src/evaluator';
const counts = Array.from({ length: 9 }, () => 0), expected = [1302540, 1098240, 123552, 54912, 10200, 5108, 3744, 624, 40];
const start = performance.now();
for (let a = 0; a < 48; a++) for (let b = a + 1; b < 49; b++) for (let c = b + 1; c < 50; c++) for (let d = c + 1; d < 51; d++) for (let e = d + 1; e < 52; e++) counts[Math.floor(evaluateUnchecked([a, b, c, d, e]) / 15 ** 5)]++;
const result = { status: counts.every((n, i) => n === expected[i]) ? 'PASS' : 'FAIL', hands: counts.reduce((a, b) => a + b, 0), elapsedMs: performance.now() - start, categories: HAND_CATEGORIES.map((category, i) => ({ category, observed: counts[i], expected: expected[i] })) };
writeFileSync('artifacts/evaluator-census.json', JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
if (result.status !== 'PASS') process.exitCode = 1;
