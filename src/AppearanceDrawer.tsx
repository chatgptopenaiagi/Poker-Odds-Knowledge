import { useEffect, useRef, useState } from 'react';
import { appearanceEnglish, appearanceRomanian, PALETTES, TEXT_SCALES, useAppearance, type Appearance, type AppearanceKey, type Palette } from './appearance';

export function AppearanceDrawer({ locale, onClose, translate }: {
  locale: string; onClose: () => void; translate?: (key: `appearance.${AppearanceKey}`, fallback: string) => string;
}) {
  const { appearance: a, setAppearance, resetAppearance, storageAvailable } = useAppearance();
  const dialog = useRef<HTMLDialogElement>(null);
  const [fullscreen, setFullscreen] = useState(!!document.fullscreenElement);
  const [error, setError] = useState('');
  const text = (key: AppearanceKey) => translate?.(`appearance.${key}`, appearanceEnglish[key]) ?? (locale === 'ro' ? appearanceRomanian[key] : appearanceEnglish[key]);
  const supported = !!document.fullscreenEnabled && typeof document.documentElement.requestFullscreen === 'function';
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const target = dialog.current!;
    target.showModal();
    const changed = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', changed);
    return () => { document.removeEventListener('fullscreenchange', changed); target.close(); previous?.focus(); };
  }, []);
  async function toggleFullscreen() {
    setError('');
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
    catch { setError(text('fullscreenError')); }
  }
  const scaleIndex = TEXT_SCALES.indexOf(a.textScale as typeof TEXT_SCALES[number]);
  return <dialog ref={dialog} className="appearance-drawer" aria-labelledby="appearance-title" onKeyDown={event => {
    if (event.key !== 'Tab') return;
    const focusable = [...dialog.current!.querySelectorAll<HTMLElement>('button:not(:disabled),select:not(:disabled),input:not(:disabled),a[href],[tabindex="0"]')].filter(element => element.getClientRects().length);
    const first = focusable[0], last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }} onCancel={event => { event.preventDefault(); onClose(); }}>
    <header className="drawer-header"><h2 id="appearance-title">{text('title')}</h2><button type="button" aria-label={text('close')} onClick={onClose}>×</button></header>
    <p>{text('preview')}</p>
    {!translate && !['en', 'ro'].includes(locale) && <p className="notice">{text('fallback')}</p>}
    <section className="appearance-preview" aria-label={text('sample')}><span className="preview-card" dir="ltr">A♠</span><div><strong>{text('sample')}</strong><p>{text('sampleHelp')}</p></div></section>
    <fieldset><legend>{text('mode')}</legend><div className="appearance-options">{(['system', 'light', 'dark'] as const).map(mode => <button key={mode} type="button" aria-pressed={a.mode === mode} onClick={() => setAppearance({ mode })}>{text(mode)}</button>)}</div></fieldset>
    <fieldset><legend>{text('palette')}</legend><div className="palette-grid">{Object.keys(PALETTES).map(palette => <button key={palette} type="button" aria-pressed={a.palette === palette} onClick={() => setAppearance({ palette: palette as Palette })}><span className="palette-swatch" style={{ background: PALETTES[palette as Palette].light }} aria-hidden="true"/>{text(palette as Palette)}{a.palette === palette && <span aria-hidden="true"> ✓</span>}</button>)}</div></fieldset>
    <fieldset><legend>{text('contrast')}</legend><div className="appearance-options"><button type="button" aria-pressed={!a.contrast} onClick={() => setAppearance({ contrast: false })}>{text('standard')}</button><button type="button" aria-pressed={a.contrast && a.mode === 'light'} onClick={() => setAppearance({ contrast: true, mode: 'light' })}>{text('highLight')}</button><button type="button" aria-pressed={a.contrast && a.mode === 'dark'} onClick={() => setAppearance({ contrast: true, mode: 'dark' })}>{text('highDark')}</button></div></fieldset>
    <fieldset><legend>{text('text')}</legend><div className="text-scale-controls"><button type="button" aria-label={text('smaller')} disabled={scaleIndex === 0} onClick={() => setAppearance({ textScale: TEXT_SCALES[scaleIndex - 1] })}>A−</button><output aria-live="polite">{a.textScale}%</output><button type="button" aria-label={text('larger')} disabled={scaleIndex === TEXT_SCALES.length - 1} onClick={() => setAppearance({ textScale: TEXT_SCALES[scaleIndex + 1] })}>A+</button><button type="button" onClick={() => setAppearance({ textScale: 100 })}>{text('resetText')}</button></div></fieldset>
    <div className="form-grid"><label>{text('cards')}<select aria-label={text('cards')} value={a.cardScale} onChange={e => setAppearance({ cardScale: Number(e.target.value) })}>{([80, 100, 120, 140] as const).map((n, i) => <option key={n} value={n}>{text((['small', 'normal', 'large', 'largest'] as const)[i])} · {n}%</option>)}</select></label><label>{text('spacing')}<select aria-label={text('spacing')} value={a.spacing} onChange={e => setAppearance({ spacing: e.target.value as Appearance['spacing'] })}><option value="comfortable">{text('comfortable')}</option><option value="compact">{text('compact')}</option></select></label></div>
    <label>{text('font')}<select aria-label={text('font')} value={a.font} onChange={e => setAppearance({ font: e.target.value as Appearance['font'] })}><option value="system">{text('systemFont')}</option><option value="verdana">{text('verdana')}</option><option value="serif">{text('serif')}</option></select></label>
    <label className="check-label"><input type="checkbox" checked={a.reducedMotion} onChange={e => setAppearance({ reducedMotion: e.target.checked })}/>{text('motion')}</label>
    <label className="check-label"><input type="checkbox" checked={a.tableFocus} onChange={e => setAppearance({ tableFocus: e.target.checked })}/>{text('focus')}</label><p className="muted">{text('focusHelp')}</p>
    <button type="button" disabled={!supported && !fullscreen} onClick={toggleFullscreen}>{text(fullscreen ? 'exitFullscreen' : 'fullscreen')}</button><p className="muted">{text(supported ? 'fullscreenHelp' : 'fullscreenUnavailable')}</p>
    {error && <p className="error" role="alert">{error}</p>}{!storageAvailable && <p className="notice" role="status">{text('storageError')}</p>}
    <footer><button type="button" onClick={resetAppearance}>{text('reset')}</button><p className="muted">{text('resetHelp')}</p><button className="primary" type="button" onClick={onClose}>{text('close')}</button></footer>
  </dialog>;
}

