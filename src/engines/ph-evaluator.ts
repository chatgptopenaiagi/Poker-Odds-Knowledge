import { assertCards } from '../cards';

export const PH_UPSTREAM_REVISION = '10be452e4c1ee40a6a56f06457f46bff27ca495a';
export const PH_VERSION = `ph-evaluator-0.6.1/${PH_UPSTREAM_REVISION}/pok-wasm-port-1`;
export const PH_MEMORY_BYTES = 393216;
export const PH_WASM_SHA256 = '092a30b76ac3f1a3e20e2d17e6f75a61541fa445109d3ea5fc5b83c5ccc92b6e';
export interface PHEvaluator {
  /** Higher is stronger; equal is a true tie. Ordinal 1..7462, not POK's base-15 encoding. */
  evaluate(cards: readonly number[]): number;
  /** Analysis engine internal use only after all cards/collisions are validated. */
  evaluateUnchecked(cards: readonly number[]): number;
  version: string;
  metrics: { bytes: number; memoryBytes: number; compileAndInstantiateMs: number; fetchMs?: number };
}
type PHExports = {
  memory: WebAssembly.Memory;
  evaluate_5cards(a:number,b:number,c:number,d:number,e:number): number;
  evaluate_6cards(a:number,b:number,c:number,d:number,e:number,f:number): number;
  evaluate_7cards(a:number,b:number,c:number,d:number,e:number,f:number,g:number): number;
};
/** Both upstream's public C header and POK use ranks 2..A with c,d,h,s low bits. */
export function pokCardToPH(card: number): number { assertCards([card]); return card; }
export function normalizePHRank(rank: number): number {
  if (!Number.isInteger(rank) || rank < 1 || rank > 7462) throw new Error('PH evaluator returned an invalid rank.');
  return 7463 - rank;
}
/** Category indexes agree with the public POK category list; boundaries come from upstream rank.c. */
export function phCategory(score: number): number {
  const rank = normalizePHRank(score);
  if (rank > 6185) return 0;
  if (rank > 3325) return 1;
  if (rank > 2467) return 2;
  if (rank > 1609) return 3;
  if (rank > 1599) return 4;
  if (rank > 322) return 5;
  if (rank > 166) return 6;
  if (rank > 10) return 7;
  return 8;
}
export async function instantiatePHEvaluator(bytes: Uint8Array): Promise<PHEvaluator> {
  const started = performance.now();
  const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes as BufferSource))].map(byte=>byte.toString(16).padStart(2,'0')).join('');
  if (digest !== PH_WASM_SHA256) throw new Error('PH module differs from the reviewed build hash.');
  const module = await WebAssembly.compile(bytes as BufferSource);
  if (WebAssembly.Module.imports(module).length) throw new Error('PH module unexpectedly requests external imports.');
  const instance = await WebAssembly.instantiate(module, {});
  const exports = instance.exports as unknown as PHExports;
  if (!(exports.memory instanceof WebAssembly.Memory) || !['evaluate_5cards','evaluate_6cards','evaluate_7cards'].every(name => typeof instance.exports[name] === 'function')) throw new Error('PH module has an incompatible export contract.');
  if (exports.memory.buffer.byteLength !== PH_MEMORY_BYTES) throw new Error('PH module memory differs from its reviewed bounded build.');
  const unchecked = (cards: readonly number[]) => {
    let rank: number;
    if (cards.length === 5) rank = exports.evaluate_5cards(cards[0],cards[1],cards[2],cards[3],cards[4]);
    else if (cards.length === 6) rank = exports.evaluate_6cards(cards[0],cards[1],cards[2],cards[3],cards[4],cards[5]);
    else if (cards.length === 7) rank = exports.evaluate_7cards(cards[0],cards[1],cards[2],cards[3],cards[4],cards[5],cards[6]);
    else throw new Error('PH evaluation requires five through seven cards.');
    return normalizePHRank(rank);
  };
  // Small deterministic load-time ABI smoke check; never consumes a deal or policy stream.
  if (unchecked([35,39,43,47,51]) !== 7462) throw new Error('PH module failed its royal-flush ABI check.');
  return {
    evaluate(cards) { assertCards(cards); return unchecked(cards); }, evaluateUnchecked: unchecked, version: PH_VERSION,
    metrics: { bytes: bytes.byteLength, memoryBytes: exports.memory.buffer.byteLength, compileAndInstantiateMs: performance.now() - started },
  };
}
let loading: Promise<PHEvaluator> | undefined;
/** Called only by an explicitly selected analysis worker. A failed load is explicit and retryable. */
export function loadPHEvaluator(): Promise<PHEvaluator> {
  if (!loading) loading = (async () => {
    const base = (import.meta as ImportMeta & { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/holdem-lab/';
    // Relative Android builds run this worker under assets/, one level below public assets.
    const assetBase = base === './' ? '../' : base;
    const url = new URL(`${assetBase}engines/ph-evaluator.wasm`, globalThis.location.href);
    if (url.origin !== globalThis.location.origin) throw new Error('PH assets must be served from the application origin.');
    const started = performance.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(url, { signal: controller.signal, credentials: 'same-origin', cache: 'force-cache' });
      if (!response.ok) throw new Error(`PH WASM asset could not load (HTTP ${response.status}).`);
      if (Number(response.headers.get('content-length') ?? 0) > 2_000_000) throw new Error('PH WASM asset exceeds its bounded loading budget.');
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.byteLength > 2_000_000) throw new Error('PH WASM asset exceeds its bounded loading budget.');
      const fetchMs = performance.now() - started;
      const result = await instantiatePHEvaluator(bytes); result.metrics.fetchMs = fetchMs; return result;
    } finally { clearTimeout(timer); }
  })().catch(error => { loading = undefined; throw error; });
  return loading;
}
