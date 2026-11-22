# Ameliyathane HemşireNöbet

Portable Electron duty roster: one list, 20 nurses, all in the operating room. Copy the folder (with `electron/`) to a USB stick and run `HemsireNobet.bat`; nothing is installed, no browser is used.

- `boot.js` — Electron entry; picks the newest healthy code package in `veri/kod/<ver>` (falls back to the files here after two failed starts) and loads its `cekirdek.js`.
- `cekirdek.js` / `preload.js` — frameless window, IPC; data in `veri/` next to the app. `guncelle.js` — update check and install (GitHub releases `hemsirenobet-v*`, sha512 verified).
- `arayuz.html`, `uygulama.js`, `app.css` — single list view, month panel, tabs; version button in the title bar opens the update panel; AltGr+click shows help for any control; About tab. Teknesyum UI shell in `teknesyum-ui/`.
- `motor.js` — roster engine (separate duty-count and pay-point targets (Fri 2, Sat 3, Sun 2), Thursday-then-weekend-free, history of past months, fewest-wishes-first priority, per-weekday balance, juniors (çömez) per-day limit, required-requests mode). `veri.js` — default staff and requests.
- `scripts/kod-paketle.js` — builds `dist/kod-<ver>.zip` and `dist/kod.json` for a release. `scripts/portable-paketle.js` builds the portable zip. Release: bump `package.json`, run both, `gh release create hemsirenobet-v<ver>` with the three files.
- Local update test: `NOBET_KOD_URL=http://127.0.0.1:<port>` serves `kod.json` + zip.
