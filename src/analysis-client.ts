import type { EquityRequest, EquityResult } from './equity';

export interface WorkerLike { postMessage(value: unknown): void; terminate(): void; onmessage: ((event: MessageEvent) => void) | null; onerror: ((event: ErrorEvent) => void) | null; }
/** Exactly one worker per client. Termination cancels expensive work immediately.
 * Generation IDs also reject queued responses from a retired worker. */
export class AnalysisClient {
  private worker: WorkerLike | null = null;
  private generation = 0;
  private reject: ((error: Error) => void) | null = null;
  constructor(private factory: () => WorkerLike = () => new Worker(new URL('./equity.worker.ts', import.meta.url), { type: 'module' })) {}
  cancel() { this.generation++; this.worker?.terminate(); this.worker = null; this.reject?.(new Error('Calculation cancelled')); this.reject = null; }
  run(request: EquityRequest, progress?: (completed: number, target: number) => void): Promise<EquityResult> {
    this.cancel(); const id = String(this.generation); const worker = this.factory(); this.worker = worker;
    return new Promise((resolve, reject) => {
      this.reject = reject;
      worker.onmessage = (event) => {
        const data = event.data;
        if (String(this.generation) !== id || data.id !== id) return;
        if (data.type === 'progress') progress?.(data.completed, data.target);
        if (data.type === 'result' || data.type === 'error') {
          this.reject = null; this.worker = null; worker.terminate();
          if (data.type === 'result') resolve(data.result); else reject(new Error(data.error));
        }
      };
      worker.onerror = (event) => { if (String(this.generation) === id) { this.reject = null; this.worker = null; worker.terminate(); reject(new Error(event.message || 'Worker failed')); } };
      worker.postMessage({ type: 'calculate', id, request });
    });
  }
}
