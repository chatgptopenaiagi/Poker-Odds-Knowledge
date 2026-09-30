import { describe, expect, it } from 'vitest';
import { BOT_PROFILES, chooseBotAction } from '../src/bots';
import { act, createHand, observe } from '../src/game';

describe('information-isolated heuristic training policies', () => {
  it('uses only actor information and a separate deterministic policy seed', () => {
    const s = createHand({ seats: 6, seed: 871 });
    const obs = observe(s, s.turn!);
    const hidden = structuredClone(s);
    hidden.seats[0].hole.reverse(); hidden.seats[1].hole = [20, 21]; hidden.deck.reverse(); hidden.burns = [40];
    const other = observe(hidden, s.turn!);
    expect(other).toEqual(obs);
    for (const p of BOT_PROFILES) {
      expect(chooseBotAction(obs, p.id, 95, 0.4)).toEqual(chooseBotAction(other, p.id, 95, 0.4));
    }
  });
  it('all profiles submit legal actions through complete multiway hands', () => {
    for (const p of BOT_PROFILES) for (let i = 0; i < 40; i++) {
      let s = createHand({ seats: 2 + i % 5, stack: 100, seed: i + 100 });
      let steps = 0;
      while (!s.result) {
        const action = chooseBotAction(observe(s, s.turn!), p.id, i * 1000 + steps);
        s = act(s, action);
        if (++steps > 200) throw new Error('Bot hand did not finish');
      }
      expect(s.seats.reduce((n, seat) => n + seat.stack, 0)).toBe(s.initialChipTotal);
    }
  });
  it('refuses non-acting observations and checks for free with weak sampled equity', () => {
    const s = createHand({ seats: 2, seed: 874 });
    expect(() => chooseBotAction(observe(s, 1))).toThrow(/not the current actor/);
    const called = act(s, { type: 'call' });
    expect(chooseBotAction(observe(called, 1), 'loose-passive', 2, 0)).toEqual({ type: 'check' });
  });
});
