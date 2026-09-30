import { describe, expect, it } from 'vitest';
import { defaults, exportData, MAX_IMPORT_BYTES, parseBackup, validateData, type SavedData } from '../src/storage';
import { act, createHand, legalActions, nextHand, replayHand } from '../src/game';
import { parseCards } from '../src/cards';

function fixture(): SavedData {
  const data = defaults();
  let hand = createHand({ id: 'backup-test-1', seats: 2, seed: 1901 });
  while (!hand.result) hand = act(hand, { type: legalActions(hand).canCheck ? 'check' : 'call' });
  data.hand = hand; data.hands = [hand];
  data.attempts = [{ id: 'attempt-1', lessonId: 'HIL-016', version: 1, answer: 20, correct: true, errorType: 'none', timestamp: '2026-09-30T00:00:00Z' }];
  data.scenarios = [{ id: 'scenario-1', title: 'Card removal study', hero: 'As Ad', board: '2c 3d 4h', dead: '', opponents: ['KK'] }];
  return data;
}
describe('backup validation (pure JSON; no mocked or real IndexedDB in these unit checks)', () => {
  it('roundtrips settings, completed deck/action log and study records', () => {
    const data = fixture(); const restored = parseBackup(exportData(data));
    expect(restored).toEqual(data); expect(replayHand(restored.hands[0])).toEqual(data.hands[0]);
  });
  it('roundtrips a clean session-over state with fewer than two funded seats', () => {
    const data = defaults(); data.hand = createHand({ seats: [{name:'One',stack:100},{name:'Two',stack:0}], seed:5 });
    expect(parseBackup(exportData(data)).hand).toEqual(data.hand);
  });
  it('reloads a pending next hand after winnings grow one stack beyond the 1M new-session setting cap', () => {
    const prefix=parseCards('Kc Qc Ac Kd Qd Ad 5s 2h 3s 4c 6s 9h 7s Ts');
    const deck=[...prefix,...Array.from({length:52},(_,i)=>i).filter(c=>!prefix.includes(c))];
    let completed=createHand({seats:3,stack:1_000_000,deck});
    completed=act(completed,{type:'raise',to:1_000_000});
    completed=act(completed,{type:'call'});
    completed=act(completed,{type:'fold'});
    expect(completed.seats[0].stack).toBe(2_000_010);
    const data=defaults();data.settings.stack=1_000_000;data.hands=[completed];data.hand=nextHand(completed,{seed:112});
    expect(data.hand.result).toBeNull();
    expect(parseBackup(exportData(data))).toEqual(data);
  });
  it('caps imported aggregate chips at 6M while applying the UI stack/blind relationship to new-session settings', () => {
    const excess=defaults();excess.hand=createHand({seats:[{name:'One',stack:6_000_000},{name:'Two',stack:1}],seed:115});
    expect(()=>validateData(excess)).toThrow(/total chips/);
    const settings=defaults();settings.settings.stack=5;settings.settings.bigBlind=10;
    expect(()=>validateData(settings)).toThrow(/settings/);
  });
  it('recomputes claimed final stacks and payouts through the legal reducer', () => {
    const data = fixture(); const raw = JSON.parse(exportData(data));
    raw.hand.seats[0].stack = 999999; raw.hand.result.payouts[0] = 999999;
    const restored = validateData(raw); expect(restored.hand).toEqual(data.hand);
  });
  it('rejects unsupported schemas, malformed JSON and oversized byte payloads', () => {
    expect(() => validateData({ ...defaults(), schema: 99 })).toThrow(/version/);
    expect(() => parseBackup('{')).toThrow();
    expect(() => parseBackup(' '.repeat(MAX_IMPORT_BYTES + 1))).toThrow(/5 MB/);
  });
  it('rejects HTML/script payloads, prototype keys and excessive nesting', () => {
    const data = fixture(); data.scenarios[0].title = '<img src=x onerror=alert(1)>';
    expect(() => validateData(data)).toThrow(/HTML/);
    expect(() => parseBackup('{"schema":1,"__proto__":{"polluted":true}}')).toThrow(/Unsafe/);
    let deep: unknown = 'leaf'; for (let i = 0; i < 35; i++) deep = { child: deep };
    expect(() => validateData(deep)).toThrow(/nesting/);
    const script = fixture(); script.scenarios[0].title = 'javascript:alert(1)';
    expect(() => validateData(script)).toThrow(/HTML/);
  });
  it('rejects duplicate cards, impossible stacks, invalid actions and truncated action logs', () => {
    for (const change of [
      (r: any) => { r.hand.initial.deck[0] = r.hand.initial.deck[1]; },
      (r: any) => { r.hand.initial.seats[0].stack = -1; },
      (r: any) => { r.hand.log[0].action = { type: 'raise', to: 999999 }; },
      (r: any) => { r.hand.log.pop(); },
    ]) {
      const raw = JSON.parse(exportData(fixture())); change(raw); expect(() => validateData(raw)).toThrow();
    }
  });
  it('validates the actual initial replay configuration, not only claimed top-level fields', () => {
    for (const change of [
      (r: any) => { r.hand.initial.bigBlind = 100001; },
      (r: any) => { r.hand.initial.smallBlind = 100001; },
      (r: any) => { r.hand.initial.button = 4; },
      (r: any) => { r.hand.initial.id = 'renamed-behind-top-level-id'; },
    ]) {
      const raw = JSON.parse(exportData(fixture())); change(raw); expect(() => validateData(raw)).toThrow();
    }
  });
  it('rejects duplicate completed hand and drill attempt identifiers', () => {
    const data = fixture(); data.hands.push(data.hands[0]); expect(() => validateData(data)).toThrow(/Duplicate/i);
    const attempts = fixture(); attempts.attempts.push(attempts.attempts[0]); expect(() => validateData(attempts)).toThrow(/Duplicate/i);
  });
  it('rejects incomplete hands in the completed-hand history', () => {
    const data = fixture(); data.hands = [createHand({ id: 'pending', seats: 2, seed: 6 })];
    expect(() => validateData(data)).toThrow();
  });
  it('rejects impossible study cards and empty educational ranges', () => {
    const duplicate = fixture(); duplicate.scenarios[0].board = 'As 3d 4h'; expect(() => validateData(duplicate)).toThrow();
    const empty = fixture(); empty.scenarios[0].opponents = ['AA:0']; expect(() => validateData(empty)).toThrow();
    const collision = fixture(); collision.scenarios[0].opponents = ['KcKd','KcKh']; expect(() => validateData(collision)).toThrow(/compatible/);
  });
  it('regrades imported drill answers and rejects unknown lesson versions', () => {
    const data = fixture(); data.attempts[0].answer = 90; data.attempts[0].correct = true;
    const restored = validateData(data); expect(restored.attempts[0].correct).toBe(false); expect(restored.attempts[0].errorType).toBe('pot-odds');
    data.attempts[0].version = 99; expect(() => validateData(data)).toThrow(/Unsupported lesson/);
  });
});
