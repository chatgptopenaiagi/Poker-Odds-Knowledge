import { describe, expect, it } from 'vitest';
import { cardText, parseCards, seededRandom, shuffledDeck } from '../src/cards';
import { evaluate, handCategory, referenceEvaluate, referenceFive } from '../src/evaluator';

describe('original direct evaluator and independent best-of-21 oracle', () => {
  const cases = [
    ['As Jd 9c 7h 3c', 'High card'], ['As Ad 9c 7h 3c', 'One pair'], ['As Ad 9c 9h 3c', 'Two pair'],
    ['As Ad Ac 7h 3c', 'Three of a kind'], ['As 2d 3c 4h 5c', 'Straight'], ['As Js 9s 7s 3s', 'Flush'],
    ['As Ad Ac 7h 7c', 'Full house'], ['As Ad Ac Ah 3c', 'Four of a kind'], ['As Ks Qs Js Ts', 'Straight flush'],
  ];
  it.each(cases)('classifies %s as %s', (cards, category) => {
    expect(handCategory(evaluate(parseCards(cards)))).toBe(category);
    expect(evaluate(parseCards(cards))).toBe(referenceFive(parseCards(cards)));
  });
  it('orders every category and uses no suit tiebreak', () => {
    const scores = cases.map(([cards]) => evaluate(parseCards(cards)));
    expect(scores).toEqual([...scores].sort((a, b) => a - b));
    expect(evaluate(parseCards('As Kd Qc Jh 9c'))).toBe(evaluate(parseCards('Ah Kc Qd Js 9d')));
  });
  it('handles two trips, three pairs, wheel, kickers, and playing the board', () => {
    expect(evaluate(parseCards('As Ah Ad Ks Kh Kd 2c'))).toBe(evaluate(parseCards('Ac As Ah Kc Ks')));
    expect(evaluate(parseCards('As Ah Ks Kh Qs Qh 2c'))).toBe(evaluate(parseCards('Ac Ad Kc Kd Qc')));
    expect(evaluate(parseCards('As 2d 3c 4h 5s'))).toBeLessThan(evaluate(parseCards('2s 3d 4c 5h 6s')));
    expect(evaluate(parseCards('As Ah Ks 8d 7s'))).toBeGreaterThan(evaluate(parseCards('Ac Ad Qs Jd Ts')));
    const board = parseCards('As Ks Qs Js Ts');
    expect(evaluate([...parseCards('2c 2d'), ...board])).toBe(evaluate([...parseCards('9h 9d'), ...board]));
  });
  it('agrees on 6000 deterministic legal five/six/seven card hands', () => {
    const rng = seededRandom(417031);
    for (let i = 0; i < 6000; i++) {
      const cards = shuffledDeck(rng).slice(0, 5 + i % 3);
      expect(evaluate(cards), cards.map(cardText).join(' ')).toBe(referenceEvaluate(cards));
    }
  });
  it('rejects duplicate and impossible cards and lengths', () => {
    expect(() => parseCards('As As')).toThrow(/Duplicate/);
    expect(() => parseCards('A 12x')).toThrow();
    expect(() => evaluate([52, 1, 2, 3, 4])).toThrow();
    expect(() => evaluate([0, 1, 2, 3])).toThrow();
  });
  it('crypto and seeded shuffles contain exactly 52 unique cards', () => {
    for (const deck of [shuffledDeck(), shuffledDeck(123)]) expect([...deck].sort((a, b) => a - b)).toEqual(Array.from({ length: 52 }, (_, i) => i));
    expect(shuffledDeck(19)).toEqual(shuffledDeck(19));
    expect(shuffledDeck(19)).not.toEqual(shuffledDeck(20));
  });
});
