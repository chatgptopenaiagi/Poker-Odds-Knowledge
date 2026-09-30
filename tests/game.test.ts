import { describe, expect, it } from 'vitest';
import { act, createHand, legalActions, nextHand, observe, replayHand, type Action, type HandState } from '../src/game';
import { parseCards, seededRandom } from '../src/cards';

function actions(s: HandState, ...list: Action[]): HandState { return list.reduce((state, action) => act(state, action), s); }
function checkdown(s: HandState): HandState {
  let count = 0;
  while (!s.result) {
    if (++count > 100) throw new Error('Hand did not terminate');
    s = act(s, { type: legalActions(s).canCheck ? 'check' : 'call' });
  }
  return s;
}
function rigged(prefix: string): number[] {
  const cards = parseCards(prefix);
  return [...cards, ...Array.from({ length: 52 }, (_, i) => i).filter(c => !cards.includes(c))];
}
const config = (stacks: number[]) => stacks.map((stack, i) => ({ name: `Seat ${i}`, stack }));
const conservation = (s: HandState) => s.seats.reduce((n, p) => n + p.stack + (s.result ? 0 : p.totalBet), 0);

describe('cash-style NLHE rules', () => {
  it('deals unique cards without mutating options and rejects duplicate decks', () => {
    const deck = Array.from({ length: 52 }, (_, i) => i);
    const s = createHand({ seats: 6, deck, seed: 1 });
    expect(s.seats.every(p => p.hole.length === 2)).toBe(true);
    expect(new Set([...s.deck, ...s.seats.flatMap(p => p.hole)]).size).toBe(52);
    expect(deck.length).toBe(52);
    expect(() => createHand({ seats: 2, deck: Array(52).fill(0) })).toThrow(/each/);
    expect(() => createHand({ seats: 1 })).toThrow(/2 to 6/);
    expect(() => createHand({ seats: 7 })).toThrow(/2 to 6/);
    expect(() => createHand({ seats: 2, stack: 1.5 })).toThrow(/integer/);
  });
  it('heads-up button is small blind, first preflop and last postflop', () => {
    const s = createHand({ seats: 2, button: 0, seed: 1 });
    expect(s.seats.map(p => p.streetBet)).toEqual([5, 10]);
    expect(s.turn).toBe(0);
    const called = act(s, { type: 'call' });
    expect(called.turn).toBe(1);
    expect(legalActions(called).canRaise).toBe(true);
    const flop = act(called, { type: 'check' });
    expect(flop.street).toBe('flop'); expect(flop.turn).toBe(1); expect(flop.board).toHaveLength(3);
    expect(s.revision).toBe(0); expect(s.board).toEqual([]);
  });
  it('six-max starts left of big blind and finishes a complete four-street hand', () => {
    let s = createHand({ seats: 6, button: 0, seed: 2 });
    expect(s.turn).toBe(3);
    const order: number[] = [];
    for (let i = 0; i < 6; i++) { order.push(s.turn!); s = act(s, { type: legalActions(s).canCheck ? 'check' : 'call' }); }
    expect(order).toEqual([3, 4, 5, 0, 1, 2]); expect(s.turn).toBe(1);
    s = checkdown(s); expect(s.board).toHaveLength(5); expect(s.burns).toHaveLength(3);
    expect(s.result?.reason).toBe('showdown'); expect(conservation(s)).toBe(6000);
  });
  it('validates minimum full raises, TO amounts, checks, calls and integer chips', () => {
    let s = createHand({ seats: 3, seed: 3 });
    expect(legalActions(s).minRaiseTo).toBe(20);
    expect(() => act(s, { type: 'raise', to: 19 })).toThrow(/short/);
    expect(() => act(s, { type: 'raise', to: 20.1 })).toThrow(/integer/);
    expect(() => act(s, { type: 'check' })).toThrow(/Cannot check/);
    s = act(s, { type: 'raise', to: 40 });
    expect(s.lastFullRaise).toBe(30); expect(legalActions(s).minRaiseTo).toBe(70);
    expect(s.seats[0].streetBet).toBe(40); expect(s.seats[0].stack).toBe(960);
    s = actions(s, { type: 'call' }, { type: 'call' });
    expect(() => act(s, { type: 'call' })).toThrow(/Nothing to call/);
    expect(legalActions(s).minRaiseTo).toBe(10);
  });
  it('a single short all-in does not reopen an earlier raiser', () => {
    let s = createHand({ seats: config([1000, 25, 1000, 1000, 1000, 1000]), button: 3, seed: 4 });
    s = actions(s, { type: 'raise', to: 20 }, { type: 'raise', to: 25 }, { type: 'fold' }, { type: 'fold' }, { type: 'fold' }, { type: 'call' });
    expect(s.turn).toBe(0); expect(legalActions(s).callAmount).toBe(5);
    expect(legalActions(s).raisingReopened).toBe(false); expect(legalActions(s).canRaise).toBe(false);
    expect(() => act(s, { type: 'raise', to: 35 })).toThrow(/not currently allowed/);
  });
  it('cumulative short all-ins reopen a player facing a full increment', () => {
    let s = createHand({ seats: config([1000, 25, 30, 1000, 1000, 1000]), button: 3, seed: 5 });
    s = actions(s, { type: 'raise', to: 20 }, { type: 'raise', to: 25 }, { type: 'raise', to: 30 }, { type: 'fold' }, { type: 'fold' }, { type: 'call' });
    expect(s.turn).toBe(0); expect(legalActions(s).canRaise).toBe(true); expect(legalActions(s).minRaiseTo).toBe(40);
    expect(act(s, { type: 'raise', to: 40 }).currentBet).toBe(40);
  });
  it('calling an intervening short raise resets that player’s reopening threshold', () => {
    let s = createHand({ seats: config([1000, 25, 1000, 30, 1000, 1000]), button: 3, seed: 6 });
    s = actions(s, { type: 'raise', to: 20 }, { type: 'raise', to: 25 }, { type: 'call' }, { type: 'raise', to: 30 }, { type: 'fold' }, { type: 'fold' });
    expect(s.turn).toBe(0); expect(legalActions(s).canRaise).toBe(true);
    s = act(s, { type: 'call' }); expect(s.turn).toBe(2); expect(legalActions(s).canRaise).toBe(false);
  });
  it('a full raise after a short all-in resets the increment correctly', () => {
    let s = createHand({ seats: config([1000, 25, 1000, 1000, 1000, 1000]), button: 3, seed: 7 });
    s = actions(s, { type: 'raise', to: 20 }, { type: 'raise', to: 25 });
    expect(legalActions(s).minRaiseTo).toBe(35);
    s = act(s, { type: 'raise', to: 50 }); expect(s.lastFullRaise).toBe(25); expect(legalActions(s).minRaiseTo).toBe(75);
  });
  it('a postflop checker cannot raise a sub-minimum all-in opening bet', () => {
    let s = createHand({ seats: config([100, 100, 15]), seed: 8 });
    s = actions(s, { type: 'call' }, { type: 'call' }, { type: 'check' });
    expect(s.turn).toBe(1);
    s = actions(s, { type: 'check' }, { type: 'raise', to: 5 });
    expect(legalActions(s).minRaiseTo).toBe(15);
    s = act(s, { type: 'call' }); expect(s.turn).toBe(1); expect(legalActions(s).canRaise).toBe(false);
    expect(checkdown(s).result?.reason).toBe('showdown');
  });
  it('an unacted player raises a short opening all-in by a full minimum, and reopens the checker', () => {
    let s = createHand({ seats: config([100, 100, 15]), seed: 808 });
    s = actions(s, { type: 'call' }, { type: 'call' }, { type: 'check' });
    s = actions(s, { type: 'check' }, { type: 'raise', to: 5 });
    expect(s.turn).toBe(0); expect(legalActions(s).minRaiseTo).toBe(15);
    expect(() => act(s, { type: 'raise', to: 10 })).toThrow(/short raise must be all-in/);
    s = act(s, { type: 'raise', to: 15 });
    expect(s.turn).toBe(1); expect(legalActions(s).canRaise).toBe(true); expect(legalActions(s).minRaiseTo).toBe(25);
  });
  it('cumulative short postflop openers reopen a checker without changing the full increment', () => {
    let s = createHand({ seats: config([100, 100, 15, 20]), seed: 809 });
    // Four-handed: seat 3, button 0, small blind 1, big blind 2.
    s = actions(s, { type: 'call' }, { type: 'call' }, { type: 'call' }, { type: 'check' });
    s = actions(s, { type: 'check' }, { type: 'raise', to: 5 }, { type: 'raise', to: 10 }, { type: 'call' });
    expect(s.turn).toBe(1); expect(legalActions(s).canRaise).toBe(true); expect(legalActions(s).minRaiseTo).toBe(20);
    expect(s.lastFullRaise).toBe(10);
  });
  it('returns uncalled chips when all opponents fold and preserves folded contributions', () => {
    let s = createHand({ seats: 3, seed: 9 });
    s = actions(s, { type: 'raise', to: 100 }, { type: 'fold' }, { type: 'fold' });
    expect(s.result?.reason).toBe('fold'); expect(s.returned).toEqual([{ seat: 0, amount: 90 }]);
    expect(s.result?.payouts).toEqual([25, 0, 0]); expect(s.seats.map(p => p.stack)).toEqual([1015, 995, 990]);
    expect(s.board).toEqual([]); expect(conservation(s)).toBe(3000);
  });
  it('all-in runout creates eligible main/side pots and refunds a unique excess', () => {
    const deck = rigged('Kc Ac Qc Kd Ad Qd 5s 2h 3s 4c 6s 9h 7s Ts');
    let s = createHand({ seats: config([300, 200, 100]), seed: 10, deck });
    s = actions(s, { type: 'raise', to: 300 }, { type: 'call' }, { type: 'call' });
    expect(s.result?.reason).toBe('showdown'); expect(s.pots.map(p => p.amount)).toEqual([300, 200]);
    expect(s.pots.map(p => p.eligible)).toEqual([[0, 1, 2], [0, 1]]);
    expect(s.pots.map(p => p.winners)).toEqual([[2], [1]]); expect(s.seats.map(p => p.stack)).toEqual([100, 200, 300]);
    expect(s.returned).toEqual([{ seat: 0, amount: 100 }]); expect(conservation(s)).toBe(600);
  });
  it('lone player with chips can call/fold an all-in but cannot bet into nobody', () => {
    let s = createHand({ seats: config([100, 1000]), seed: 11 });
    s = act(s, { type: 'raise', to: 100 });
    expect(s.turn).toBe(1); expect(legalActions(s).canRaise).toBe(false); expect(legalActions(s).callAmount).toBe(90);
    s = act(s, { type: 'call' }); expect(s.street).toBe('complete'); expect(s.board).toHaveLength(5);
    expect(conservation(s)).toBe(1100);
  });
  it('handles insufficient small/big blinds and nominal preflop bring-in', () => {
    const shortSmall = createHand({ seats: config([3, 1000]), seed: 12 });
    expect(shortSmall.result?.reason).toBe('showdown'); expect(shortSmall.returned).toEqual([{ seat: 1, amount: 7 }]);
    expect(shortSmall.pots.map(p => p.amount)).toEqual([6]); expect(conservation(shortSmall)).toBe(1003);
    const shortBig = createHand({ seats: config([1000, 3]), seed: 13 });
    expect(shortBig.result?.reason).toBe('showdown'); expect(shortBig.returned).toEqual([{ seat: 0, amount: 2 }]);
    const threeWay = createHand({ seats: config([1000, 1000, 3]), seed: 14 });
    expect(legalActions(threeWay).callAmount).toBe(10); expect(legalActions(threeWay).minRaiseTo).toBe(20);
    expect(conservation(checkdown(threeWay))).toBe(2003);
  });
  it('splits a board-playing tie and awards an odd chip clockwise left of button', () => {
    const deck = rigged('2c 3c 4c 2d 3d 4d 5c Ts Js Qs 6c Ks 7c As');
    let s = createHand({ seats: config([10, 10, 10]), smallBlind: 1, bigBlind: 3, deck });
    s = actions(s, { type: 'call' }, { type: 'call' }, { type: 'check' });
    s = actions(s, { type: 'check' }, { type: 'fold' }, { type: 'check' });
    s = checkdown(s);
    expect(s.pots[0].amount).toBe(9); expect(s.pots[0].winners).toEqual([0, 1]);
    expect(s.pots[0].shares).toEqual([{ seat: 1, amount: 5 }, { seat: 0, amount: 4 }]);
    expect(s.seats.map(p => p.stack)).toEqual([11, 12, 7]);
  });
  it('rotates button and skips busted seats; cleanly ends with one funded seat', () => {
    const complete = checkdown(createHand({ seats: config([100, 0, 100, 100]), button: 0, seed: 15 }));
    const next = nextHand(complete, { seed: 16 }); expect(next.button).toBe(2); expect(next.seats[1].hole).toEqual([]);
    const over = createHand({ seats: config([100, 0]), seed: 17 }); expect(over.result?.reason).toBe('session-over'); expect(over.turn).toBeNull();
    expect(() => nextHand(next)).toThrow(/Finish/);
  });
  it('adjusts the transition to heads-up so a surviving big blind is not charged twice', () => {
    const deck = rigged('Kc Ac Qc Kd Ad Qd 5s 2h 3s 4c 6s 9h 7s Ts');
    let s = createHand({ seats: config([100, 200, 200]), deck });
    s = actions(s, { type: 'raise', to: 100 }, { type: 'call' }, { type: 'call' });
    s = checkdown(s);
    expect(s.seats[0].stack).toBe(0); expect(s.bigBlindSeat).toBe(2);
    const next = nextHand(s, { seed: 991 });
    expect(next.button).toBe(2); expect(next.smallBlindSeat).toBe(2); expect(next.bigBlindSeat).toBe(1); expect(next.turn).toBe(2);
  });
  it('replays exactly, preserves id, branches without overwriting, and rejects stale/log-corrupt actions', () => {
    const original = createHand({ seats: 2, seed: 18 });
    const s = checkdown(original);
    expect(replayHand(s)).toEqual(s); expect(replayHand(s, 0)).toEqual(original);
    expect(replayHand(s, 1).revision).toBe(1);
    expect(() => act(act(original, { type: 'call' }, 0), { type: 'check' }, 0)).toThrow(/Stale/);
    const bad = structuredClone(s); bad.log[0].seat = 9;
    expect(() => replayHand(bad)).toThrow(/inconsistent/);
    const missing = structuredClone(s); missing.log.pop(); expect(() => replayHand(missing)).toThrow(/disagrees/);
  });
  it('separates actor observations from hidden holes, burns and future cards', () => {
    const s = actions(createHand({ seats: 3, seed: 19 }), { type: 'call' }, { type: 'call' }, { type: 'check' });
    const changed = structuredClone(s);
    changed.deck.reverse(); changed.burns = [51]; changed.seats[0].hole = [50, 51]; changed.seats[2].hole = [48, 49];
    expect(observe(changed, 1)).toEqual(observe(s, 1));
    const text = JSON.stringify(observe(s, 1)); expect(text).not.toContain('deck'); expect(text).not.toContain('burns'); expect(text).not.toContain('initial');
  });
  it('never reports a fictional payable call for a folded player or a finished hand', () => {
    let s = createHand({ seats: 3, seed: 883 });
    s = actions(s, { type: 'raise', to: 100 }, { type: 'fold' });
    expect(observe(s, 1).callAmount).toBe(0);
    s = act(s, { type: 'fold' });
    for (const seat of s.seats) expect(observe(s, seat.id).callAmount).toBe(0);
  });
  it('keeps analysis/policy RNG use independent from the deal stream', () => {
    const a = createHand({ seats: 6, seed: 20 });
    const analysis = seededRandom(999); for (let i = 0; i < 10000; i++) analysis();
    const b = createHand({ seats: 6, seed: 20 });
    expect(a.initial.deck).toEqual(b.initial.deck); expect(checkdown(a).board).toEqual(checkdown(b).board);
  });
  it('conserves integer chips through 240 deterministic random legal hands, 2–6 seats', () => {
    const random = seededRandom(78291);
    for (let i = 0; i < 240; i++) {
      const count = 2 + i % 5;
      let s = createHand({ seats: config(Array.from({ length: count }, () => 1 + Math.floor(random() * 500))), button: i % count, seed: 1000 + i });
      let steps = 0;
      while (!s.result) {
        const legal = legalActions(s), choice = random();
        const action: Action = choice < 0.12 ? { type: 'fold' } : legal.canRaise && choice > 0.7
          ? { type: 'raise', to: legal.shortAllInOnly ? legal.maxRaiseTo : Math.min(legal.maxRaiseTo, legal.minRaiseTo + Math.floor(random() * (legal.maxRaiseTo - legal.minRaiseTo + 1))) }
          : { type: legal.canCheck ? 'check' : 'call' };
        s = act(s, action); expect(conservation(s)).toBe(s.initialChipTotal);
        expect(s.seats.every(p => p.stack >= 0 && Number.isInteger(p.stack))).toBe(true);
        if (++steps > 200) throw new Error('Random hand did not terminate');
      }
      expect(replayHand(s)).toEqual(s);
    }
  });
});
