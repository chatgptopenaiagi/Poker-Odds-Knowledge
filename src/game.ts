import { shuffledDeck } from './cards';
import { evaluate } from './evaluator';

export const RULES_VERSION = 'hil-nlhe-1.0.0';
export type Street = 'preflop' | 'flop' | 'turn' | 'river' | 'complete';
export type Action = { type: 'fold' | 'check' | 'call' | 'raise'; to?: number };
export interface SeatConfig { name: string; stack: number }
export interface CreateHandOptions {
  id?: string; seats: number | SeatConfig[]; button?: number; smallBlind?: number;
  bigBlind?: number; stack?: number; seed?: number; deck?: number[];
}
export interface Seat extends SeatConfig {
  id: number; hole: number[]; folded: boolean; streetBet: number; totalBet: number;
  acted: boolean; reopenAt: number;
}
export interface LoggedAction { revision: number; seat: number; street: Street; action: Action }
export interface Pot { amount: number; eligible: number[]; winners: number[]; shares: { seat: number; amount: number }[] }
export interface HandResult { reason: 'showdown' | 'fold' | 'session-over'; payouts: number[]; winners: number[]; summary: string }
export interface HandState {
  version: 1; rulesVersion: string; id: string; initial: CreateHandOptions;
  button: number; smallBlind: number; bigBlind: number; street: Street; turn: number | null;
  smallBlindSeat: number | null; bigBlindSeat: number | null;
  seats: Seat[]; board: number[]; deck: number[]; burns: number[]; revision: number;
  log: LoggedAction[]; pots: Pot[]; result: HandResult | null; currentBet: number;
  lastFullRaise: number; initialChipTotal: number; returned: { seat: number; amount: number }[];
}
export interface LegalActions {
  seat: number | null; canFold: boolean; canCheck: boolean; callAmount: number;
  canRaise: boolean; minRaiseTo: number; maxRaiseTo: number; shortAllInOnly: boolean;
  currentBet: number; raisingReopened: boolean;
}
export interface PublicSeat { id: number; name: string; stack: number; folded: boolean; streetBet: number; totalBet: number }
export interface Observation {
  version: 1; seat: number; hole: number[]; cards: number[]; board: number[]; street: Street;
  button: number; smallBlind: number; bigBlind: number; pot: number; callAmount: number;
  effectiveStack: number; position: 'button' | 'blind' | 'early' | 'late';
  seats: PublicSeat[]; players: PublicSeat[]; legal: LegalActions; currentBet: number;
  revision: number; actions: LoggedAction[];
}

const clone = <T>(value: T): T => structuredClone(value);
function integer(value: number, name: string, minimum = 0): void {
  if (!Number.isSafeInteger(value) || value < minimum) throw new Error(`${name} must be an integer of at least ${minimum}`);
}
function clockwise(state: Pick<HandState, 'seats'>, after: number, predicate: (s: Seat) => boolean): number[] {
  const ids: number[] = [];
  for (let step = 1; step <= state.seats.length; step++) {
    const id = (after + step) % state.seats.length;
    if (predicate(state.seats[id])) ids.push(id);
  }
  return ids;
}
function living(state: HandState): Seat[] { return state.seats.filter(s => !s.folded); }
function able(state: HandState): Seat[] { return living(state).filter(s => s.stack > 0); }
function pay(state: HandState, id: number, amount: number): void {
  const s = state.seats[id];
  const actual = Math.min(s.stack, amount);
  s.stack -= actual; s.streetBet += actual; s.totalBet += actual;
}
function draw(state: HandState): number {
  const c = state.deck.shift();
  if (c === undefined) throw new Error('Deck exhausted');
  return c;
}
function validateDeck(deck: number[]): void {
  if (deck.length !== 52 || new Set(deck).size !== 52 || deck.some(c => !Number.isInteger(c) || c < 0 || c > 51)) {
    throw new Error('Deck must contain each of the 52 cards exactly once');
  }
}
function assertState(state: HandState): void {
  for (const s of state.seats) {
    integer(s.stack, 'Stack'); integer(s.streetBet, 'Street contribution'); integer(s.totalBet, 'Contribution');
  }
  const chips = state.seats.reduce((sum, s) => sum + s.stack + (state.result ? 0 : s.totalBet), 0);
  if (chips !== state.initialChipTotal) throw new Error('Internal chip conservation failure');
}

export function createHand(options: CreateHandOptions): HandState {
  if (typeof options.seats === 'number' && (!Number.isInteger(options.seats) || options.seats < 2 || options.seats > 6)) throw new Error('Supported table size is 2 to 6 seats');
  const configs = typeof options.seats === 'number'
    ? Array.from({ length: options.seats }, (_, i) => ({ name: i === 0 ? 'You' : `Bot ${i}`, stack: options.stack ?? 1000 }))
    : clone(options.seats);
  if (configs.length < 2 || configs.length > 6) throw new Error('Supported table size is 2 to 6 seats');
  for (const c of configs) { integer(c.stack, 'Stack'); if (typeof c.name !== 'string' || !c.name || c.name.length > 80) throw new Error('Invalid player name'); }
  const sb = options.smallBlind ?? 5, bb = options.bigBlind ?? 10;
  integer(sb, 'Small blind', 1); integer(bb, 'Big blind', 1);
  if (sb > bb) throw new Error('Small blind cannot exceed big blind');
  integer(options.button ?? 0, 'Button');
  if ((options.button ?? 0) >= configs.length) throw new Error('Button seat is invalid');
  const deck = options.deck ? [...options.deck] : shuffledDeck(options.seed);
  validateDeck(deck);
  const state: HandState = {
    version: 1, rulesVersion: RULES_VERSION, id: options.id ?? `hand-${globalThis.crypto.randomUUID()}`,
    initial: { id: options.id, seats: clone(configs), button: options.button ?? 0, smallBlind: sb, bigBlind: bb, ...(options.seed === undefined ? {} : { seed: options.seed }), deck: [...deck] },
    button: options.button ?? 0, smallBlind: sb, bigBlind: bb, street: 'preflop', turn: null, smallBlindSeat: null, bigBlindSeat: null,
    seats: configs.map((c, id) => ({ ...c, id, hole: [], folded: c.stack === 0, streetBet: 0, totalBet: 0, acted: false, reopenAt: 0 })),
    board: [], deck, burns: [], revision: 0, log: [], pots: [], result: null,
    currentBet: bb, lastFullRaise: bb, initialChipTotal: configs.reduce((n, s) => n + s.stack, 0), returned: [],
  };
  integer(state.initialChipTotal, 'Total chips');
  state.initial.id = state.id;
  const funded = state.seats.filter(s => s.stack > 0);
  if (funded.length < 2) {
    state.street = 'complete';
    state.result = { reason: 'session-over', payouts: configs.map(() => 0), winners: funded.map(s => s.id), summary: 'Fewer than two funded seats remain. Reset the training session to continue.' };
    return state;
  }
  if (state.seats[state.button].stack === 0) state.button = clockwise(state, state.button, s => s.stack > 0)[0];
  state.initial.button = state.button;
  const order = clockwise(state, state.button, s => !s.folded);
  for (let round = 0; round < 2; round++) for (const id of order) state.seats[id].hole.push(draw(state));
  const small = funded.length === 2 ? state.button : order[0];
  const big = clockwise(state, small, s => !s.folded)[0];
  state.smallBlindSeat = small; state.bigBlindSeat = big;
  pay(state, small, sb); pay(state, big, bb);
  advance(state, big);
  assertState(state);
  return state;
}

/** Only the current actor can receive actionable controls. Raise sizes are total street contribution (TO). */
export function legalActions(state: HandState): LegalActions {
  const blank: LegalActions = { seat: null, canFold: false, canCheck: false, callAmount: 0, canRaise: false, minRaiseTo: 0, maxRaiseTo: 0, shortAllInOnly: false, currentBet: state.currentBet, raisingReopened: false };
  if (state.turn === null || state.result) return blank;
  const s = state.seats[state.turn];
  const reopening = !s.acted || state.currentBet >= s.reopenAt;
  const maximum = s.streetBet + s.stack;
  const minimum = state.currentBet === 0 ? state.bigBlind : state.currentBet + state.lastFullRaise;
  const callAmount = Math.min(s.stack, Math.max(0, state.currentBet - s.streetBet));
  const canRaise = reopening && maximum > state.currentBet && able(state).some(other => other.id !== s.id);
  return { seat: s.id, canFold: true, canCheck: callAmount === 0, callAmount,
    canRaise, minRaiseTo: minimum, maxRaiseTo: maximum, shortAllInOnly: canRaise && maximum < minimum,
    currentBet: state.currentBet, raisingReopened: reopening };
}

export function act(previous: HandState, action: Action, expectedRevision = previous.revision): HandState {
  if (expectedRevision !== previous.revision) throw new Error('Stale action: this turn has already changed');
  if (previous.result || previous.turn === null) throw new Error('This hand has ended');
  if (!action || !['fold', 'check', 'call', 'raise'].includes(action.type)) throw new Error('Unknown action');
  const legal = legalActions(previous), state = clone(previous), id = previous.turn, s = state.seats[id];
  const street = state.street;
  if (action.type === 'fold') s.folded = true;
  if (action.type === 'check' && !legal.canCheck) throw new Error('Cannot check while facing a bet');
  if (action.type === 'call') {
    if (legal.callAmount === 0) throw new Error('Nothing to call; check instead');
    pay(state, id, legal.callAmount);
  }
  if (action.type === 'raise') {
    if (!legal.canRaise) throw new Error('Raising is not currently allowed');
    integer(action.to as number, 'Raise TO', 1);
    const to = action.to as number;
    if (to <= state.currentBet || to > legal.maxRaiseTo) throw new Error('Raise TO is outside the legal bounds');
    if (to < legal.minRaiseTo && to !== legal.maxRaiseTo) throw new Error('A short raise must be all-in');
    const increment = to - state.currentBet;
    if (increment >= state.lastFullRaise) state.lastFullRaise = increment;
    pay(state, id, to - s.streetBet);
    state.currentBet = to;
  }
  s.acted = true;
  s.reopenAt = state.currentBet + state.lastFullRaise;
  state.revision++;
  state.log.push({ revision: state.revision, seat: id, street, action: { type: action.type, ...(action.type === 'raise' ? { to: action.to } : {}) } });
  advance(state, id);
  assertState(state);
  return state;
}

function returnUncalled(state: HandState): void {
  const ordered = [...state.seats].sort((a, b) => b.streetBet - a.streetBet);
  const top = ordered[0], next = ordered[1];
  const excess = top.streetBet - next.streetBet;
  if (excess > 0) {
    top.streetBet -= excess; top.totalBet -= excess; top.stack += excess;
    state.returned.push({ seat: top.id, amount: excess });
  }
}

function advance(state: HandState, after: number): void {
  if (living(state).length === 1) { returnUncalled(state); settle(state, 'fold'); return; }
  let active = able(state);
  // No player may wager extra chips against opponents who are all already all-in.
  if (active.length === 1) {
    const only = active[0];
    const opponentsBet = Math.max(0, ...living(state).filter(s => s.id !== only.id).map(s => s.streetBet));
    state.currentBet = Math.min(state.currentBet, Math.max(only.streetBet, opponentsBet));
    if (only.streetBet >= state.currentBet) { runout(state); return; }
  }
  if (active.length === 0) { runout(state); return; }
  const pending = clockwise(state, after, s => !s.folded && s.stack > 0 && (!s.acted || s.streetBet < state.currentBet));
  if (pending.length) { state.turn = pending[0]; return; }
  returnUncalled(state);
  if (state.street === 'river') { settle(state, 'showdown'); return; }
  dealNextStreet(state);
  active = able(state);
  if (active.length < 2) { runout(state); return; }
  state.turn = clockwise(state, state.button, s => !s.folded && s.stack > 0)[0];
}

function dealNextStreet(state: HandState): void {
  state.burns.push(draw(state));
  if (state.street === 'preflop') { state.street = 'flop'; state.board.push(draw(state), draw(state), draw(state)); }
  else if (state.street === 'flop') { state.street = 'turn'; state.board.push(draw(state)); }
  else if (state.street === 'turn') { state.street = 'river'; state.board.push(draw(state)); }
  else throw new Error('No further street');
  state.currentBet = 0; state.lastFullRaise = state.bigBlind;
  for (const s of state.seats) { s.streetBet = 0; s.acted = false; s.reopenAt = 0; }
}
function runout(state: HandState): void {
  returnUncalled(state);
  while (state.street !== 'river') dealNextStreet(state);
  settle(state, 'showdown');
}

/** Pots use contribution layers. Folded money is included; folded players never become eligible. */
export function buildPots(state: HandState): Pot[] {
  const levels = [...new Set(state.seats.map(s => s.totalBet).filter(n => n > 0))].sort((a, b) => a - b);
  let previous = 0;
  return levels.map(level => {
    const contributors = state.seats.filter(s => s.totalBet >= level);
    const pot: Pot = { amount: (level - previous) * contributors.length, eligible: contributors.filter(s => !s.folded).map(s => s.id), winners: [], shares: [] };
    previous = level;
    return pot;
  });
}
function settle(state: HandState, reason: 'fold' | 'showdown'): void {
  const pots = buildPots(state), payouts = state.seats.map(() => 0);
  const lone = living(state)[0];
  for (const pot of pots) {
    if (reason === 'fold') pot.eligible = [lone.id];
    if (!pot.eligible.length) throw new Error('Internal error: pot without an eligible player');
    if (reason === 'fold') pot.winners = [lone.id];
    else {
      const scores = pot.eligible.map(id => ({ id, score: evaluate([...state.seats[id].hole, ...state.board]) }));
      const best = Math.max(...scores.map(s => s.score));
      pot.winners = scores.filter(s => s.score === best).map(s => s.id);
    }
    const share = Math.floor(pot.amount / pot.winners.length), remainder = pot.amount % pot.winners.length;
    const ordered = clockwise(state, state.button, s => pot.winners.includes(s.id));
    pot.shares = ordered.map((seat, i) => ({ seat, amount: share + (i < remainder ? 1 : 0) }));
    for (const split of pot.shares) payouts[split.seat] += split.amount;
  }
  for (const s of state.seats) s.stack += payouts[s.id];
  state.pots = pots; state.street = 'complete'; state.turn = null;
  const winners = payouts.flatMap((amount, id) => amount > 0 ? [id] : []);
  state.result = { reason, payouts, winners, summary: reason === 'fold' ? `${lone.name} wins after all opponents fold.` : `Showdown: ${winners.map(id => `${state.seats[id].name} receives ${payouts[id]}`).join('; ')} chips.` };
}

export function observe(state: HandState, seat: number): Observation {
  if (!state.seats[seat]) throw new Error('Invalid actor seat');
  const s = state.seats[seat];
  const seats = state.seats.map(({ id, name, stack, folded, streetBet, totalBet }) => ({ id, name, stack, folded, streetBet, totalBet }));
  const clockwiseIds = clockwise(state, state.button, other => !other.folded);
  const opponents = seats.filter(other => !other.folded && other.id !== seat);
  const effectiveStack = Math.min(s.stack, Math.max(0, ...opponents.map(other => other.stack)));
  const legal = legalActions(state);
  return {
    version: 1, seat, hole: [...s.hole], cards: [...s.hole], board: [...state.board], street: state.street,
    button: state.button, smallBlind: state.smallBlind, bigBlind: state.bigBlind,
    pot: state.seats.reduce((sum, other) => sum + other.totalBet, 0),
    callAmount: s.folded || state.result ? 0 : seat === state.turn ? legal.callAmount : Math.min(s.stack, Math.max(0, state.currentBet - s.streetBet)),
    effectiveStack, position: seat === state.button ? 'button' : clockwiseIds.indexOf(seat) < 2 ? 'blind' : clockwiseIds.indexOf(seat) < clockwiseIds.length / 2 ? 'early' : 'late',
    seats, players: seats.map(other => ({ ...other })), legal: seat === state.turn ? legal : { ...legal, seat: null, canFold: false, canCheck: false, callAmount: 0, canRaise: false },
    currentBet: state.currentBet, revision: state.revision, actions: clone(state.log),
  };
}

export function replay(initial: HandState | CreateHandOptions, actions: (LoggedAction | Action)[]): HandState {
  let state = createHand('initial' in initial ? initial.initial : initial);
  for (const entry of actions) {
    if ('action' in entry) {
      if (entry.seat !== state.turn || entry.revision !== state.revision + 1 || entry.street !== state.street) throw new Error('Replay action log is inconsistent');
      state = act(state, entry.action);
    } else state = act(state, entry);
  }
  return state;
}
export function replayHand(state: HandState, uptoRevision = state.revision): HandState {
  integer(uptoRevision, 'Replay revision');
  if (state.revision !== state.log.length || uptoRevision > state.log.length) throw new Error('Replay revision exceeds or disagrees with the action log');
  return replay(state.initial, state.log.slice(0, uptoRevision));
}
export function nextHand(state: HandState, options: { seed?: number; deck?: number[] } = {}): HandState {
  if (!state.result) throw new Error('Finish this hand first');
  let next = clockwise(state, state.button, s => s.stack > 0)[0] ?? state.button;
  // On the transition into heads-up, avoid assigning the same surviving player
  // the big blind twice merely because the old button busted.
  const funded = state.seats.filter(s => s.stack > 0);
  const initialFunded = (state.initial.seats as SeatConfig[]).filter(s => s.stack > 0).length;
  if (funded.length === 2 && initialFunded > 2 && state.bigBlindSeat !== null) {
    const nextBig = clockwise(state, state.bigBlindSeat, s => s.stack > 0)[0];
    next = funded.find(s => s.id !== nextBig)!.id;
  }
  return createHand({ seats: state.seats.map(s => ({ name: s.name, stack: s.stack })), button: next,
    smallBlind: state.smallBlind, bigBlind: state.bigBlind, ...options });
}
