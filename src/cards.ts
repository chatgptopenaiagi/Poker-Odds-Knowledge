/** Card encoding: rank=floor(card/4)+2; suits clubs, diamonds, hearts, spades. */
export const RANKS = '23456789TJQKA';
export const SUITS = 'cdhs';
export function assertCards(cards: readonly number[], expected?: number): void {
  if (expected !== undefined && cards.length !== expected) throw new Error(`Expected ${expected} cards.`);
  if (cards.some(c => !Number.isInteger(c) || c < 0 || c > 51)) throw new Error('Invalid card.');
  if (new Set(cards).size !== cards.length) throw new Error('Duplicate cards are not allowed.');
}
export function cardText(card: number): string {
  assertCards([card]);
  return RANKS[Math.floor(card / 4)] + SUITS[card % 4];
}
export function parseCards(text: string): number[] {
  const value = text.replace(/10/g, 'T').replace(/♣/g, 'c').replace(/♦/g, 'd').replace(/♥/g, 'h').replace(/♠/g, 's').replace(/[\s,]+/g, '');
  if (!/^(?:[2-9TJQKA][cdhs])*$/i.test(value)) throw new Error('Use cards such as As Kh Td (rank followed by c, d, h or s).');
  const cards: number[] = [];
  for (let i = 0; i < value.length; i += 2) cards.push(RANKS.indexOf(value[i].toUpperCase()) * 4 + SUITS.indexOf(value[i + 1].toLowerCase()));
  assertCards(cards);
  return cards;
}
/** Mulberry32 for reproducible teaching/tests only; never shared with analysis/policy streams. */
export function seededRandom(seed: number): () => number {
  if (!Number.isFinite(seed)) throw new Error('Seed must be finite.');
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let n = state;
    n = Math.imul(n ^ (n >>> 15), n | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}
/** Rejection sampling removes modulo bias from a cryptographic uint32. */
export function cryptoInteger(bound: number): number {
  if (!Number.isInteger(bound) || bound < 1 || bound > 4294967296) throw new Error('Invalid random bound.');
  const limit = Math.floor(4294967296 / bound) * bound;
  const buffer = new Uint32Array(1);
  let value: number;
  do { globalThis.crypto.getRandomValues(buffer); value = buffer[0]; } while (value >= limit);
  return value % bound;
}
export function shuffledDeck(seed?: number | (() => number)): number[] {
  const random = typeof seed === 'function' ? seed : seed === undefined ? undefined : seededRandom(seed);
  const cards = Array.from({ length: 52 }, (_, i) => i);
  for (let i = cards.length - 1; i > 0; i--) {
    const j = random ? Math.floor(random() * (i + 1)) : cryptoInteger(i + 1);
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}
