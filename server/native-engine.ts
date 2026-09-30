import { spawn } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const OMPEVAL_REVISION = '4aec210ff75b0851af0ee170b35a7899e1a4fe8f';
export const NATIVE_STATE_CAP = 250_000;
const exePath = fileURLToPath(new URL('../native/bin/pok-ompeval.exe', import.meta.url));
const manifestPath = fileURLToPath(new URL('../native/bin/build-manifest.json', import.meta.url));
const inputCap = 262_144, outputCap = 524_288;
let active = false;
export type NativeRequest =
  | { schema: 1; op: 'info' }
  | { schema: 1; op: 'evaluate'; hands: number[][] }
  | { schema: 1; op: 'equity'; ranges: number[][][]; board: number[]; dead: number[]; maxStates: number; deadlineMs: number };
export type NativeProgress = { type: 'progress'; states: number; expectedStates: number; progress: number };
export type NativePlayer = { equity: number; wins: number; ties: number; losses: number; tieShare: number };
export type NativeResult = {
  type: 'result'; schema: 1; ok: true; engine: 'ompeval'; revision: string; adapterVersion: string;
  ranks?: number[]; categoryDivisor?: number; rankOrder?: 'higher-is-better';
  method?: 'EXACT_ENUMERATION'; states?: number; expectedStates?: number; compatibleAssignments?: number;
  runoutsPerAssignment?: number; rangeCombinationCounts?: number[]; players?: NativePlayer[];
  winsByPlayerMask?: number[]; evaluations?: number; elapsedMs?: number; limitations?: string[];
  seed: null; uncertainty?: null; threads: 1; maxStates: number; memoryLimitBytes: number;
  peakProcessMemoryBytes?: number;
};
export class NativeEngineError extends Error {
  constructor(public readonly code: string) { super(code); this.name = 'NativeEngineError'; }
}
function error(code: string): never { throw new NativeEngineError(code); }
function integer(value: unknown, lo: number, hi: number): value is number { return typeof value === 'number' && Number.isSafeInteger(value) && value >= lo && value <= hi; }
function cards(value: unknown, lo: number, hi: number): value is number[] {
  return Array.isArray(value) && value.length >= lo && value.length <= hi && value.every(c => integer(c, 0, 51)) && new Set(value).size === value.length;
}
export function validateNativeRequest(value: unknown): asserts value is NativeRequest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) error('invalid_request');
  const v = value as Record<string, unknown>;
  const allowed = v.op === 'info' ? ['schema', 'op'] : v.op === 'evaluate' ? ['schema', 'op', 'hands'] : ['schema', 'op', 'ranges', 'board', 'dead', 'maxStates', 'deadlineMs'];
  if (v.schema !== 1 || Object.keys(v).some(k => !allowed.includes(k))) error('invalid_request');
  if (v.op === 'info') return;
  if (v.op === 'evaluate') {
    if (!Array.isArray(v.hands) || !v.hands.length || v.hands.length > 10_000 || !v.hands.every(h => cards(h, 5, 7))) error('invalid_hands');
    return;
  }
  if (v.op !== 'equity' || !cards(v.board, 0, 5) || ![0, 3, 4, 5].includes(v.board.length) || !cards(v.dead, 0, 40) || !cards([...v.board, ...v.dead], 0, 45)) error('invalid_cards');
  if (!integer(v.deadlineMs, 100, 15_000) || !integer(v.maxStates, 1, NATIVE_STATE_CAP)) error('invalid_budget');
  if (!Array.isArray(v.ranges) || v.ranges.length < 2 || v.ranges.length > 6 || !v.ranges.every(r => Array.isArray(r) && r.length > 0 && r.length <= 1326 && r.every(c => cards(c, 2, 2)))) error('invalid_ranges');
  for (const range of v.ranges as number[][][]) {
    const identities = range.map(c => Math.min(...c) * 52 + Math.max(...c));
    if (new Set(identities).size !== identities.length) error('duplicate_combination');
  }
}

/** Reads only the fixed project-owned executable and adjacent build manifest. No executable is downloaded or started. */
export async function nativeEngineAvailability(): Promise<{ available: boolean; code: string; revision: string; sha256?: string }> {
  if (process.platform !== 'win32') return { available: false, code: 'windows_build_required', revision: OMPEVAL_REVISION };
  try {
    const details = await stat(exePath);
    if (!details.isFile() || details.size > 10 * 1024 * 1024 || (await stat(manifestPath)).size > 4096) throw new Error();
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    const sha256 = createHash('sha256').update(await readFile(exePath)).digest('hex');
    if (manifest.revision !== OMPEVAL_REVISION || manifest.schema !== 1 || manifest.sha256 !== sha256) return { available: false, code: 'binary_manifest_mismatch', revision: OMPEVAL_REVISION };
    return { available: true, code: 'built_and_hash_verified', revision: OMPEVAL_REVISION, sha256 };
  } catch { return { available: false, code: 'native_build_missing', revision: OMPEVAL_REVISION }; }
}

function validateResult(raw: unknown, request: NativeRequest): NativeResult {
  const r = raw as NativeResult;
  if (!r || r.type !== 'result' || r.schema !== 1 || r.ok !== true || r.engine !== 'ompeval' || r.revision !== OMPEVAL_REVISION || r.threads !== 1 || r.seed !== null || r.maxStates !== NATIVE_STATE_CAP || r.memoryLimitBytes !== 268435456) error('invalid_native_result');
  if (request.op === 'evaluate') {
    if (r.categoryDivisor !== 4096 || r.rankOrder !== 'higher-is-better' || !Array.isArray(r.ranks) || r.ranks.length !== request.hands.length || !r.ranks.every(x => integer(x, 4096, 40959))) error('invalid_native_ranks');
  }
  if (request.op === 'equity') {
    if (r.method !== 'EXACT_ENUMERATION' || !integer(r.states, 1, request.maxStates) || r.expectedStates !== r.states || !Array.isArray(r.players) || r.players.length !== request.ranges.length || !Array.isArray(r.winsByPlayerMask) || r.winsByPlayerMask.length !== 2 ** request.ranges.length || r.winsByPlayerMask[0] !== 0 || !r.winsByPlayerMask.every(x => integer(x, 0, r.states!)) || r.winsByPlayerMask.reduce((a, b) => a + b, 0) !== r.states || !Number.isFinite(r.elapsedMs) || r.uncertainty !== null) error('invalid_native_equity');
    for (let p = 0; p < r.players.length; p++) {
      let ties = 0, tieShare = 0;
      r.winsByPlayerMask.forEach((count, mask) => { const n = mask.toString(2).replaceAll('0', '').length; if ((mask & (1 << p)) && n > 1) { ties += count; tieShare += count / n; } });
      const wins = r.winsByPlayerMask[1 << p], player = r.players[p];
      if (player.wins !== wins || player.ties !== ties || player.losses !== r.states - wins - ties || Math.abs(player.tieShare - tieShare) > 1e-8 || Math.abs(player.equity - (wins + tieShare) / r.states) > 1e-12 || !Number.isFinite(player.equity) || !Number.isFinite(player.tieShare)) error('invalid_native_player');
    }
  }
  return r;
}

/** Bounded local child; this function is not an HTTP route and grants no authentication by itself. */
export async function runNative(request: NativeRequest, options: { signal?: AbortSignal; onProgress?: (progress: NativeProgress) => void } = {}): Promise<NativeResult> {
  validateNativeRequest(request);
  const input = JSON.stringify(request);
  if (Buffer.byteLength(input) > inputCap) error('input_too_large');
  if (options.signal?.aborted) error('cancelled');
  if (active) error('native_busy');
  active = true;
  try {
    const available = await nativeEngineAvailability();
    if (!available.available) error(available.code);
    if (options.signal?.aborted) error('cancelled');
    return await new Promise<NativeResult>((resolve, reject) => {
      const child = spawn(exePath, [], { shell: false, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'], cwd: fileURLToPath(new URL('../native/bin/', import.meta.url)) });
      let stdout = '', stderrBytes = 0, stdoutBytes = 0, failure: string | undefined, final: unknown;
      const stop = (code: string) => { failure ??= code; child.kill(); };
      const cancel = () => stop('cancelled');
      options.signal?.addEventListener('abort', cancel, { once: true });
      const timer = setTimeout(() => stop('native_timeout'), request.op === 'equity' ? request.deadlineMs + 1000 : 5000);
      child.stdout.setEncoding('utf8');
      child.stdout.on('data', (chunk: string) => {
        stdoutBytes += Buffer.byteLength(chunk); if (stdoutBytes > outputCap) { stop('output_budget_exceeded'); return; }
        stdout += chunk;
        let newline: number;
        while ((newline = stdout.indexOf('\n')) >= 0) {
          const line = stdout.slice(0, newline); stdout = stdout.slice(newline + 1);
          try {
            const frame = JSON.parse(line);
            if (frame.type === 'result') { if (final) stop('duplicate_result'); final = frame; }
            else if (frame.type === 'progress' && !final && integer(frame.states, 0, NATIVE_STATE_CAP) && integer(frame.expectedStates, 1, NATIVE_STATE_CAP) && typeof frame.progress === 'number' && frame.progress >= 0 && frame.progress <= 1) {
              try { options.onProgress?.(frame as NativeProgress); } catch { stop('progress_consumer_failed'); }
            } else stop('invalid_native_frame');
          } catch { stop('invalid_native_json'); }
        }
      });
      child.stderr.on('data', (chunk: Buffer) => { stderrBytes += chunk.length; if (stderrBytes > 16_384) stop('stderr_budget_exceeded'); });
      child.stdin.on('error', () => { /* premature child exit is handled by close */ });
      child.on('error', () => { failure ??= 'native_spawn_failed'; });
      child.on('close', code => {
        clearTimeout(timer); options.signal?.removeEventListener('abort', cancel);
        if (failure) { reject(new NativeEngineError(failure)); return; }
        const raw = final as { ok?: boolean; code?: string } | undefined;
        if (raw?.ok === false && typeof raw.code === 'string' && /^[a-z_]{1,60}$/.test(raw.code)) { reject(new NativeEngineError(raw.code)); return; }
        if (code !== 0 || stdout.trim() || !final) { reject(new NativeEngineError('native_process_failed')); return; }
        try { resolve(validateResult(final, request)); } catch (e) { reject(e); }
      });
      child.stdin.end(input);
    });
  } finally { active = false; }
}
