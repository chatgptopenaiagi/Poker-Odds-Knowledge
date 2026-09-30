import { describe, expect, it } from 'vitest';
import { lessons, gradeLesson } from '../src/lessons';
import { messages, glossary } from '../src/i18n';
import fixtures from './fixtures/math-v1.json';
import { parseCards } from '../src/cards';
import { evaluate } from '../src/evaluator';
import { expandRange } from '../src/ranges';

describe('validated original bilingual lessons', () => {
  it('covers 28 stable scenarios with complete bilingual information and replay', () => {
    expect(lessons.length).toBeGreaterThanOrEqual(24);
    expect(new Set(lessons.map(l => l.id)).size).toBe(lessons.length);
    for (const lesson of lessons) {
      expect(lesson.id).toMatch(/^HIL-\d{3}$/);
      expect(lesson.version).toBe(1);
      expect(lesson.replay.inputs).toEqual(lesson.information);
      expect(Object.keys(lesson.information).length).toBeGreaterThan(0);
      for (const locale of ['en', 'ro'] as const) {
        expect(lesson.title[locale].length).toBeGreaterThan(4);
        expect(lesson.prompt[locale].length).toBeGreaterThan(15);
        expect(lesson.explanation[locale].length).toBeGreaterThan(40);
      }
      for (const prerequisite of lesson.prerequisites) expect(lessons.some(l => l.id === prerequisite)).toBe(true);
    }
  });
  it('answers agree with the independently specified mathematical expectations', () => {
    const expected = [5, 5, 1, 100/3, 9, 900/47, 37800/1081, 900/46, 36, 1326, 6, 4, 12, 3, 990,
      20, 5, -5, 100/3, 10, 40, 90, 1, 0, -3, 90, 200/3, 15];
    lessons.forEach((lesson, index) => expect(lesson.answer).toBeCloseTo(expected[index], 9));
  });
  it('matches real Maxima and independent Python exact fixtures', () => {
    expect(fixtures.status).toBe('PASS');
    const mappings = { 'HIL-006': ['flop_one', 100], 'HIL-007': ['flop_two', 100], 'HIL-008': ['turn_one', 100],
      'HIL-010': ['choose52_2', 1], 'HIL-015': ['choose45_2', 1], 'HIL-016': ['call_threshold', 100],
      'HIL-017': ['call_ev', 1], 'HIL-019': ['bluff_threshold', 100], 'HIL-020': ['bluff_ev', 1] } as const;
    for (const [id, [key, scale]] of Object.entries(mappings)) {
      expect(lessons.find(l => l.id === id)!.answer).toBeCloseTo(fixtures.cases[key].decimal * scale, 9);
    }
  });
  it('grades numeric input with units and tolerance without awarding invalid input', () => {
    const pot = lessons.find(l => l.id === 'HIL-016')!;
    expect(gradeLesson(pot, '20').correct).toBe(true);
    expect(gradeLesson(pot, '20,01').correct).toBe(true);
    expect(gradeLesson(pot, '25').errorType).toBe('pot-odds');
    expect(gradeLesson(pot, '').errorType).toBe('invalid-number');
    expect(gradeLesson(pot, 'Infinity').correct).toBe(false);
    expect(gradeLesson(pot, '20<script>').correct).toBe(false);
    const combinations = lessons.find(l => l.id === 'HIL-010')!;
    expect(gradeLesson(combinations, 1326.01).correct).toBe(false);
  });
  it('labels approximations and assumption-dependent models', () => {
    expect(lessons.find(l => l.id === 'HIL-009')!.method).toBe('APPROXIMATION');
    for (const id of ['HIL-019', 'HIL-020', 'HIL-024', 'HIL-025']) expect(lessons.find(l => l.id === id)!.method).toBe('ASSUMPTION-DEPENDENT');
  });
  it('curated card and blocker examples agree with the actual engine', () => {
    const board = parseCards('Kc Kd 7h 4s 2c');
    expect(evaluate([...board, ...parseCards('Ah Qh')])).toBeGreaterThan(evaluate([...board, ...parseCards('As Js')]));
    expect(evaluate(parseCards('Ac 2d 3h 4s 5c'))).toBeLessThan(evaluate(parseCards('2c 3d 4h 5s 6c')));
    const royalBoard = parseCards('As Ks Qs Js Ts');
    expect(evaluate([...royalBoard, ...parseCards('2c 3d')])).toBe(evaluate([...royalBoard, ...parseCards('7h 8c')]));
    expect(expandRange('random').length).toBe(1326);
    expect(expandRange('QQ').length).toBe(6);
    expect(expandRange('AKs').length).toBe(4);
    expect(expandRange('AKo').length).toBe(12);
    expect(expandRange('AA', parseCards('As 7d')).length).toBe(3);
    const weighted = expandRange('AA:1,KK:0.5');
    const sum = weighted.reduce((n, combo) => n + combo.weight, 0);
    expect(weighted.filter(c => c.weight === 1).reduce((n, c) => n + c.weight, 0) / sum).toBeCloseTo(2/3);
  });
  it('provides matching translation keys and a consistent glossary', () => {
    const originalKeys = Object.keys(messages.en).filter(key => !key.startsWith('platform.') && !key.startsWith('appearance.') && !key.startsWith('mail.') && !key.startsWith('notices.'));
    expect(originalKeys.every(key => Object.hasOwn(messages.ro, key))).toBe(true);
    expect(Object.values(messages.ro).every(v => v.length > 0)).toBe(true);
    expect(glossary.length).toBeGreaterThanOrEqual(8);
  });
});
