# Appearance and reading controls

The compact Appearance drawer changes only display preferences. It uses the separate versioned local key `pok:appearance:v1`, never a game reducer action or a study-notebook reset. Preferences apply immediately and synchronize between same-origin tabs. Malformed/future versions fall back to safe defaults; unavailable browser storage produces an explicit warning. Reset affects appearance only.

Supported choices: system/light/dark, six named palettes, high-contrast light/dark presets, text at 100/112/125/150/175/200 percent, cards at 80/100/120/140 percent, comfortable/compact spacing, three system font stacks, reduced motion, table focus and native fullscreen. Fullscreen uses the real browser API; Escape or the exit button leaves it. Unsupported/denied requests have descriptive outcomes.

Text/layout dimensions use rem units. Narrow screens and text size at least 150% switch the same ordered table DOM into a readable board-and-seat grid. The range matrix scrolls within its own area; editable range notation is its existing text alternative. Suit symbols and labels remain distinct beyond color. Buttons have visible keyboard focus, selected state, and a minimum 2.75rem height. The native modal dialog contains focus and returns focus to its trigger on close. Reduced motion follows the OS by default and can be forced on.

All surfaces consume semantic tokens, including inputs, errors, notices, menus, cards, ranges and lessons. Palette selection is bounded to coordinated reviewed values rather than unsafe arbitrary colors. The automated contrast check measures eighteen relevant normal-text token pairs for all 24 palette/mode/contrast combinations (4.5:1 minimum) and form boundaries (3:1). It does not constitute WCAG certification or substitute for screen-reader/linguistic review.

Integration: call `useAppearance()` unconditionally in the root component. Open `AppearanceDrawer` from `src/AppearanceDrawer.tsx` using `locale` and `onClose`; pass `translate(key, fallback)` for catalog-backed `appearance.*` strings. The English and Romanian source maps live in `src/appearance.ts`. The drawer discloses English fallback if other locale text is not supplied.

Browser verification is tracked in the release test report separately from pure token/unit checks. No font CDN, external artwork, game-state access or random-number call is used by appearance code.
