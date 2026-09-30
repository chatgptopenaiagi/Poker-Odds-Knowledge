import { writeFileSync } from 'node:fs';
import { parseCards } from '../src/cards';
import { calculateEquity } from '../src/equity';
import { expandRange } from '../src/ranges';
const requests = [
  { name: 'Fixed-hand flop exact', request: { hero: parseCards('AsAh'), board: parseCards('2c7dJh'), opponents: [{ hand: parseCards('KsKh') }] } },
  { name: 'Six-way flop 20000 Monte Carlo', request: { hero: parseCards('AsKh'), board: parseCards('2c7dJh'), opponents: Array.from({ length: 5 }, () => ({ range: expandRange('random') })), method: 'monte-carlo' as const, samples: 20_000, seed: 12349 } },
];
const results = requests.map(({ name, request }) => {
  const result = calculateEquity(request);
  return { name, method: result.method, samples: result.samples, attempts: result.attempts, elapsedMs: result.elapsedMs, samplesPerSecond: Math.round(1000 * result.samples / result.elapsedMs), equity: result.equity, interval: result.interval, engineVersion: result.engineVersion };
});
writeFileSync('artifacts/equity-node-benchmark.json', JSON.stringify({ measuredAt: new Date().toISOString(), context: 'Real local Node process; browser worker timings are separate evidence.', results }, null, 2) + '\n');
console.log(JSON.stringify(results));
