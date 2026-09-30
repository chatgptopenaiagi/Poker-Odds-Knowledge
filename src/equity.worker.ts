/// <reference lib="webworker" />
import { calculateEquityAsync, type EquityRequest } from './equity';
let generation = 0;
self.onmessage = async (event: MessageEvent<{ type: 'calculate' | 'cancel'; id: string; request?: EquityRequest }>) => {
  const { type, id, request } = event.data;
  const current = ++generation;
  if (type === 'cancel') { self.postMessage({ type: 'cancelled', id }); return; }
  if (type !== 'calculate' || !request) { self.postMessage({ type: 'error', id, error: 'Invalid worker request.' }); return; }
  try {
    const result = await calculateEquityAsync(request, progress => {
      if (current === generation) self.postMessage({ type: 'progress', id, ...progress });
    }, () => current !== generation);
    if (current === generation) self.postMessage({ type: 'result', id, result });
  } catch (error) {
    if (current === generation) self.postMessage({ type: 'error', id, error: error instanceof Error ? error.message : 'Calculation failed.' });
  }
};
