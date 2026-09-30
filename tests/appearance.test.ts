import { describe, expect, it } from 'vitest';
import { appearanceTokens, defaultAppearance, PALETTES, TEXT_SCALES, validateAppearance, appearanceEnglish, appearanceRomanian } from '../src/appearance';
import catalogs from '../src/locales/appearance.json';

function luminance(hex: string) {
  const values = hex.slice(1).match(/../g)!.map(n => parseInt(n, 16) / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4);
  return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
}
function contrast(first: string, second: string) {
  const a = luminance(first), b = luminance(second);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}
describe('appearance tokens and versioned display preferences', () => {
  it('keeps all palette/mode/contrast text combinations above AA normal-text contrast', () => {
    const pairs = [['--ink', '--paper'], ['--ink', '--panel'], ['--ink', '--surface'], ['--muted', '--paper'], ['--muted', '--panel'], ['--muted', '--surface'], ['--accent-ink', '--accent'], ['--accent', '--panel'], ['--nav-ink', '--nav'], ['--nav-muted', '--nav'], ['--nav-muted', '--nav-hover'], ['--felt-ink', '--felt'], ['--felt-ink', '--felt-bright'], ['--card-ink', '--card'], ['--card-red', '--card'], ['--warning-ink', '--warning-bg'], ['--error-ink', '--error-bg'], ['--success-ink', '--success-bg']];
    for (const palette of Object.keys(PALETTES) as (keyof typeof PALETTES)[]) for (const mode of ['light', 'dark'] as const) for (const high of [false, true]) {
      const t = appearanceTokens({ ...defaultAppearance, palette, mode, contrast: high });
      for (const [foreground, background] of pairs) expect(contrast(t[foreground], t[background]), `${palette}/${mode}/${high}: ${foreground} on ${background}`).toBeGreaterThanOrEqual(4.5);
      for (const surface of ['--panel', '--paper']) expect(contrast(t['--line'], t[surface])).toBeGreaterThanOrEqual(3);
    }
  });
  it('resolves system mode without mutating stored preferences', () => {
    const original = structuredClone(defaultAppearance);
    expect(appearanceTokens(original, true)['--paper']).toBe('#101b21');
    expect(appearanceTokens(original, false)['--paper']).toBe('#f2f4f1');
    expect(original).toEqual(defaultAppearance);
  });
  it('validates every option and rejects malformed or future-version storage safely', () => {
    expect(validateAppearance(null)).toEqual(defaultAppearance);
    expect(validateAppearance({ ...defaultAppearance, version: 2 })).toEqual(defaultAppearance);
    expect(validateAppearance({ version: 1, mode: '<script>', palette: '__proto__', textScale: 999, cardScale: -1, reducedMotion: 'false' })).toEqual(defaultAppearance);
    const prefs = { ...defaultAppearance, mode: 'dark' as const, palette: 'rose' as const, textScale: 200, cardScale: 140, contrast: true, spacing: 'compact' as const, font: 'verdana' as const, reducedMotion: true, tableFocus: true };
    expect(validateAppearance(JSON.parse(JSON.stringify(prefs)))).toEqual(prefs);
    for (const scale of TEXT_SCALES) expect(validateAppearance({ ...defaultAppearance, textScale: scale }).textScale).toBe(scale);
  });
  it('has complete bilingual source keys and no game or learning fields in its storage schema', () => {
    expect(Object.keys(appearanceRomanian).sort()).toEqual(Object.keys(appearanceEnglish).sort());
    expect(Object.keys(defaultAppearance).sort()).toEqual(['version','mode','contrast','palette','textScale','cardScale','spacing','font','reducedMotion','tableFocus'].sort());
  });
  it('checks all 41 translated catalogs plus Chinese script variant without claiming linguistic review', () => {
    const expected = Object.keys(appearanceEnglish).map(key => `appearance.${key}`).sort();
    expect(Object.keys(catalogs)).toHaveLength(42);
    for (const [locale, catalog] of Object.entries(catalogs)) {
      expect(Object.keys(catalog).sort(), locale).toEqual(expected);
      for (const [key, value] of Object.entries(catalog)) {
        expect(value.trim().length, `${locale}/${key}`).toBeGreaterThan(0);
        expect(value, `${locale}/${key}`).not.toMatch(/[<>\u202a-\u202e\u2066-\u2069]/);
      }
      // Target numbers remain the same; translators may place them in a different order.
      expect(catalog['appearance.sampleHelp'].match(/\d+/g)?.sort(), locale).toEqual(['20','20','80']);
      if (locale !== 'en') expect(Object.values(catalog).filter(value => Object.values(catalogs.en).includes(value)).length, `${locale} is not an English copy`).toBeLessThan(12);
    }
  });
});
