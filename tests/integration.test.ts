import { describe, expect, it } from 'vitest';
import { act, createHand, observe, replayHand, type Action, type HandState } from '../src/game';
import { parseCards } from '../src/cards';
import { calculateEquity, type EquityRequest } from '../src/equity';
import { expandRange } from '../src/ranges';
import { chooseBotAction } from '../src/bots';

function rigged(prefix: string): number[] {
  const first = parseCards(prefix);
  return [...first, ...Array.from({ length: 52 }, (_, i) => i).filter(c => !first.includes(c))];
}
function actorRequest(state: HandState, actor: number): EquityRequest {
  const o = observe(state, actor);
  return { hero: o.hole, board: o.board, opponents: o.seats.filter(s => !s.folded && s.id !== actor).map(() => ({ range: expandRange('random') })), method: 'monte-carlo', samples: 300, seed: 744 };
}

describe('rules/equity/review integration', () => {
  it('reproduces the all-in side-pot example and separately prices main and side eligibility', () => {
    let s = createHand({ id: 'side-pot-demo-1', seats: [{ name: 'Queens', stack: 300 }, { name: 'Kings', stack: 200 }, { name: 'Aces', stack: 100 }], deck: rigged('Kc Ac Qc Kd Ad Qd 5s 2h 3s 4c 6s 9h 7s Ts') });
    for (const a of [{ type: 'raise', to: 300 }, { type: 'call' }, { type: 'call' }] as Action[]) s = act(s, a);
    expect(s.seats.map(p => p.stack)).toEqual([100, 200, 300]);
    expect(replayHand(s)).toEqual(s);
    // Seat 1 loses the main pot to aces but wins every chip in its side pot.
    const ids = [1, 0, 2];
    const result = calculateEquity({ hero: s.seats[1].hole, board: s.board, opponents: [{ hand: s.seats[0].hole }, { hand: s.seats[2].hole }], method: 'exact', pots: s.pots.map((p, i) => ({ id: `pot-${i}`, amount: p.amount, eligible: p.eligible.map(id => ids.indexOf(id)) })) });
    expect(result.equity).toBe(0); expect(result.perPot.map(p => p.heroShare)).toEqual([0, 1]);
    expect(result.perPot.map(p => p.expectedChips)).toEqual([0, 200]);
  });
  it('changing simulator secrets does not affect sampled equity or policy from an unchanged observation', () => {
    let s = createHand({ seats: 3, seed: 97 });
    s = act(s, { type: 'call' }); s = act(s, { type: 'call' }); s = act(s, { type: 'check' });
    const other = structuredClone(s); const actor = s.turn!;
    other.deck.reverse(); other.burns.reverse();
    for (const seat of other.seats) if (seat.id !== actor) seat.hole.reverse();
    const a = calculateEquity(actorRequest(s, actor)), b = calculateEquity(actorRequest(other, actor));
    expect(a.equity).toBe(b.equity); expect(a.samples).toBe(b.samples); expect(a.knownCards).toEqual(b.knownCards);
    expect(chooseBotAction(observe(s, actor), 'balanced-training', 32, a.equity)).toEqual(chooseBotAction(observe(other, actor), 'balanced-training', 32, b.equity));
  });
  it('branches from an original information set without rewriting the completed hand', () => {
    let s = createHand({ seats: 2, seed: 322 });
    s = act(s, { type: 'call' }); s = act(s, { type: 'check' });
    const original = structuredClone(s);
    const branch = act(replayHand(s, 1), { type: 'raise', to: 30 });
    expect(s).toEqual(original); expect(branch.log[1].action.type).toBe('raise'); expect(s.log[1].action.type).toBe('check');
    expect(branch.initial.deck).toEqual(s.initial.deck);
  });
});
