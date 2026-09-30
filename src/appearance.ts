import { useSyncExternalStore } from 'react';
import { NOTEBOOK_NAMESPACE } from './preview';

export const APPEARANCE_KEY = NOTEBOOK_NAMESPACE==='stable'?'pok:appearance:v1':`pok:${NOTEBOOK_NAMESPACE}:appearance:v1`;
export const TEXT_SCALES = [100, 112, 125, 150, 175, 200] as const;
export const PALETTES = {
  emerald: { light: '#216349', dark: '#7accaa', felt: '#214f40', feltBright: '#306955' },
  ocean: { light: '#075e81', dark: '#82ccea', felt: '#154c66', feltBright: '#236681' },
  slate: { light: '#42566f', dark: '#a9beda', felt: '#35475c', feltBright: '#495e77' },
  amber: { light: '#805207', dark: '#f1c374', felt: '#644614', feltBright: '#805e25' },
  plum: { light: '#714280', dark: '#d9abe9', felt: '#52315e', feltBright: '#734981' },
  rose: { light: '#993f5b', dark: '#f0aac3', felt: '#673047', feltBright: '#88485f' },
} as const;
export type Palette = keyof typeof PALETTES;
export type Appearance = {
  version: 1; mode: 'system' | 'light' | 'dark'; contrast: boolean; palette: Palette;
  textScale: number; cardScale: number; spacing: 'comfortable' | 'compact';
  font: 'system' | 'verdana' | 'serif'; reducedMotion: boolean; tableFocus: boolean;
};
export const defaultAppearance: Appearance = {
  version: 1, mode: 'system', contrast: false, palette: 'emerald', textScale: 100,
  cardScale: 100, spacing: 'comfortable', font: 'system', reducedMotion: false, tableFocus: false,
};
export function validateAppearance(value: unknown): Appearance {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ...defaultAppearance };
  const v = value as Record<string, unknown>;
  if (v.version !== 1) return { ...defaultAppearance };
  return {
    version: 1,
    mode: ['system', 'light', 'dark'].includes(String(v.mode)) ? v.mode as Appearance['mode'] : 'system',
    contrast: v.contrast === true,
    palette: typeof v.palette === 'string' && Object.hasOwn(PALETTES, v.palette) ? v.palette as Palette : 'emerald',
    textScale: TEXT_SCALES.includes(v.textScale as typeof TEXT_SCALES[number]) ? Number(v.textScale) : 100,
    cardScale: [80, 100, 120, 140].includes(Number(v.cardScale)) ? Number(v.cardScale) : 100,
    spacing: v.spacing === 'compact' ? 'compact' : 'comfortable',
    font: ['system', 'verdana', 'serif'].includes(String(v.font)) ? v.font as Appearance['font'] : 'system',
    reducedMotion: v.reducedMotion === true,
    tableFocus: v.tableFocus === true,
  };
}

export function appearanceTokens(value: Appearance, systemDark = false): Record<string, string> {
  const dark = value.mode === 'dark' || (value.mode === 'system' && systemDark);
  const palette = PALETTES[value.palette];
  const high = value.contrast;
  return {
    '--paper': dark ? (high ? '#000000' : '#101b21') : (high ? '#ffffff' : '#f2f4f1'),
    '--panel': dark ? (high ? '#090909' : '#19272e') : '#ffffff',
    '--surface': dark ? '#24343d' : '#e8eeea',
    '--ink': dark ? '#f2f5f3' : '#1c3028',
    '--muted': dark ? (high ? '#ffffff' : '#b8c8c3') : (high ? '#202b25' : '#50655b'),
    '--line': dark ? (high ? '#ffffff' : '#81988f') : (high ? '#172c23' : '#70877b'),
    '--nav': dark ? '#101c24' : '#193c30',
    '--nav-ink': '#f2f8f4', '--nav-muted': '#c0d6ca', '--nav-hover': '#2c5544',
    '--accent': high ? (dark ? '#fff078' : '#153d72') : dark ? palette.dark : palette.light,
    '--accent-ink': dark ? '#101a23' : '#ffffff',
    '--accent-soft': dark ? '#30433b' : '#e2eee7',
    '--felt': palette.felt, '--felt-bright': palette.feltBright,
    '--felt-ink': '#ffffff', '--felt-line': '#d5e2d9',
    '--table-rim': dark ? '#83938b' : '#9b8a63',
    '--table-outer': dark ? '#344a40' : '#d4c9ae',
    '--card': '#fffdf8', '--card-ink': '#172b25', '--card-red': '#a22030',
    '--card-line': '#7c8a82', '--card-back': palette.felt,
    '--warning-bg': dark ? '#443615' : '#fff2ce', '--warning-ink': dark ? '#ffe8ad' : '#654913',
    '--error-bg': dark ? '#4d2428' : '#ffebe8', '--error-ink': dark ? '#ffd9df' : '#972d20',
    '--success-bg': dark ? '#173c2a' : '#e2f1e1', '--success-ink': dark ? '#c2efd0' : '#24522d',
    '--shadow': dark ? '#00000044' : '#12271c18',
    '--orange': 'var(--accent)', '--rust': 'var(--accent)', '--green': 'var(--accent)', '--warm': '#f2d39a',
    '--text-scale': String(value.textScale / 100), '--card-scale': String(value.cardScale / 100),
    '--font': value.font === 'verdana' ? 'Verdana, "DejaVu Sans", sans-serif' : value.font === 'serif' ? 'Georgia, "Noto Serif", serif' : 'system-ui, "Segoe UI", "Noto Sans", Arial, sans-serif',
    '--space': value.spacing === 'compact' ? '.8' : '1',
  };
}

let current: Appearance | undefined;
const listeners = new Set<() => void>();
let storageAvailable = true;
let watching = false;
function read(): Appearance {
  if (current) return current;
  try { current = validateAppearance(JSON.parse(localStorage.getItem(APPEARANCE_KEY) ?? 'null')); }
  catch { current = { ...defaultAppearance }; storageAvailable = false; }
  return current;
}
export function applyAppearance(value: Appearance) {
  if (typeof document === 'undefined') return;
  const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  const element = document.documentElement;
  Object.entries(appearanceTokens(value, systemDark)).forEach(([name, token]) => element.style.setProperty(name, token));
  element.dataset.theme = value.mode === 'system' ? systemDark ? 'dark' : 'light' : value.mode;
  element.dataset.contrast = value.contrast ? 'high' : 'normal';
  element.dataset.appearanceMotion = value.reducedMotion ? 'reduced' : 'system';
  element.dataset.tableFocus = String(value.tableFocus);
  element.dataset.reflow = value.textScale >= 150 ? 'true' : 'false';
  element.dataset.spacing = value.spacing;
  element.style.fontSize = `${value.textScale}%`;
  element.style.colorScheme = element.dataset.theme;
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!watching && typeof window !== 'undefined') {
    watching = true;
    window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', () => applyAppearance(read()));
    window.addEventListener('storage', event => {
      if (event.key !== APPEARANCE_KEY) return;
      try { current = validateAppearance(JSON.parse(event.newValue ?? 'null')); } catch { current = { ...defaultAppearance }; }
      applyAppearance(current); listeners.forEach(fn => fn());
    });
  }
  applyAppearance(read());
  return () => { listeners.delete(listener); };
}
export function updateAppearance(patch: Partial<Appearance>) {
  current = validateAppearance({ ...read(), ...patch });
  try { localStorage.setItem(APPEARANCE_KEY, JSON.stringify(current)); storageAvailable = true; }
  catch { storageAvailable = false; }
  applyAppearance(current); listeners.forEach(fn => fn());
}
export function useAppearance() {
  const appearance = useSyncExternalStore(subscribe, read, () => defaultAppearance);
  return { appearance, setAppearance: updateAppearance, resetAppearance: () => updateAppearance(defaultAppearance), storageAvailable };
}

export const appearanceEnglish = {
  title: 'Appearance', close: 'Close appearance', preview: 'Preview changes instantly. Your hand and learning progress stay in place.',
  mode: 'Color mode', system: 'Follow system', light: 'Light', dark: 'Dark', palette: 'Table & accent',
  emerald: 'Emerald', ocean: 'Ocean', slate: 'Slate', amber: 'Amber', plum: 'Plum', rose: 'Rose',
  contrast: 'High contrast', highLight: 'High Contrast Light', highDark: 'High Contrast Dark', standard: 'Standard contrast',
  text: 'Text size', smaller: 'Decrease text size', larger: 'Increase text size', resetText: 'Reset text size',
  cards: 'Card size', small: 'Small', normal: 'Standard', large: 'Large', largest: 'Extra large',
  spacing: 'Spacing', comfortable: 'Comfortable', compact: 'Compact', font: 'Reading font',
  systemFont: 'System sans serif', verdana: 'Verdana sans serif', serif: 'Georgia serif',
  motion: 'Reduce motion', focus: 'Table focus', focusHelp: 'Give the table more space. The explanation stays available below it.',
  fullscreen: 'Enter fullscreen', exitFullscreen: 'Exit fullscreen', fullscreenHelp: 'Press Escape or use this button to exit fullscreen.',
  fullscreenUnavailable: 'Fullscreen is not supported in this browser. Browser zoom and table focus remain available.',
  fullscreenError: 'The browser did not allow fullscreen. You can continue using table focus.',
  reset: 'Reset appearance', resetHelp: 'Resets these display preferences only. Your notebook is unchanged.',
  storageError: 'This browser could not save appearance preferences. Changes remain active for this visit.',
  fallback: 'Appearance descriptions are currently shown in English for this language.',
  sample: 'Your decision', sampleHelp: '20 chips to call into 80 chips: 20% break-even equity.',
} as const;
export type AppearanceKey = keyof typeof appearanceEnglish;
export const appearanceRomanian: Record<AppearanceKey, string> = {
  title: 'Aspect', close: 'Închide aspectul', preview: 'Previzualizare imediată. Mâna și progresul rămân neschimbate.',
  mode: 'Mod de culoare', system: 'Urmează sistemul', light: 'Luminos', dark: 'Întunecat', palette: 'Masă și accent',
  emerald: 'Smarald', ocean: 'Ocean', slate: 'Ardezie', amber: 'Chihlimbar', plum: 'Prună', rose: 'Trandafir',
  contrast: 'Contrast ridicat', highLight: 'Contrast ridicat luminos', highDark: 'Contrast ridicat întunecat', standard: 'Contrast standard',
  text: 'Mărimea textului', smaller: 'Micșorează textul', larger: 'Mărește textul', resetText: 'Resetează mărimea textului',
  cards: 'Mărimea cărților', small: 'Mică', normal: 'Standard', large: 'Mare', largest: 'Foarte mare',
  spacing: 'Spațiere', comfortable: 'Confortabilă', compact: 'Compactă', font: 'Font pentru citire',
  systemFont: 'Sans serif de sistem', verdana: 'Verdana sans serif', serif: 'Georgia serif',
  motion: 'Redu mișcarea', focus: 'Concentrare pe masă', focusHelp: 'Oferă mesei mai mult spațiu. Explicația rămâne disponibilă dedesubt.',
  fullscreen: 'Intră pe tot ecranul', exitFullscreen: 'Ieși din ecran complet', fullscreenHelp: 'Apasă Escape sau acest buton pentru a ieși din ecran complet.',
  fullscreenUnavailable: 'Browserul nu acceptă ecranul complet. Zoomul și concentrarea pe masă rămân disponibile.',
  fullscreenError: 'Browserul nu a permis ecranul complet. Poți continua cu concentrarea pe masă.',
  reset: 'Resetează aspectul', resetHelp: 'Resetează doar preferințele de afișare. Caietul rămâne neschimbat.',
  storageError: 'Browserul nu a putut salva aspectul. Modificările rămân active în această vizită.',
  fallback: 'Descrierile aspectului sunt momentan afișate în engleză pentru această limbă.',
  sample: 'Decizia ta', sampleHelp: 'Plată de 20 de jetoane într-un pot de 80: prag de echitate 20%.',
};
