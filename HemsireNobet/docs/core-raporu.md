# Teklif: Portable Electron app cannot follow update panel, version button, scale and language switch

**State:** open
**Tür:** Teklif
**İlk görüldüğü yer:** HemşireNöbet, 2026-10-26
**Amaç:** Ameliyathane HemşireNöbet is a USB-portable Electron app with no installer, no network and no update channel. The standard demands a version button that checks for updates, a sync/update panel, a scale control and a TR/EN switch in the title bar, which have nothing to act on here. Print uses Canvas/CanvasText because paper must be light while the UI is dark-only. Native select popups cannot be themed with tokens.

## Durum

`scan.js` result for the project: 9 files, 0 open, 0 errors, 0 ignored. The app follows tokens, five states, transitions, focus-visible, toast stack, maximized main window and the standard title bar (name, Teknesyum and Destek Ol chips, window buttons).

Left out on purpose, because there is nothing for them to act on:

1. Version button, update panel and sync surface. The folder is copied to a USB stick and has no update server. The version span stays empty and hidden.
2. Scale control (`okunurluk` scale) and TR/EN switch. The app is Turkish-only for one hospital team; the screen is a fixed operating-room roster that must fit the window without scrolling, so a scale control would break the one-screen rule.
3. Print sheet in `Canvas`/`CanvasText`. Paper must be light and ink-saving while the UI is dark-only, so `@media print` uses system colors, not `--tk-*` colors.
4. Native `<select>` popup (name picker in every roster cell) is drawn by the OS and cannot take tokens; only the closed cell is themed.

The project `ignore` list was emptied and `.claude/teknesyum-ui.json` `note:` explains the portable case.

## Teklif

1. A "portable" project type in `teknesyum-ui.json` (`"tur": "portable"`): data folder next to the app, no installer, no update channel. The scanner then skips `guncelleme/*`, `guncelleme/surum-tetik` and `kabuk/ustcubuk-sirasi` slots for sync, update badge, scale and language, instead of forcing an ignore entry or a dead button.
2. Allow system colors (`Canvas`, `CanvasText`) inside `@media print` as a documented exception to the token rule.
3. A `ui-duzeni` paragraph on fixed one-screen layouts: when the content must fit without scrolling, the okunurluk scale control is optional.
4. Document that the OS-drawn select popup is exempt from token checks.

## Core İçin Öneri

Add the `portable` project type and its scanner exemptions (item 1) and the print-color exception (item 2) to the plugin and to the `ui-duzeni` shelf book. Items 3 and 4 are shelf wording only. Until then a portable project has to document the gap in its `note:` field, as this one does.
