# Ameliyathane HemşireNöbet

Portable Electron duty roster: one list, 20 nurses, all in the operating room. Copy the folder (with `electron/`) to a USB stick and run `HemsireNobet.bat`; nothing is installed, no browser is used.

- `boot.js` — Electron entry; picks the newest healthy code package in `veri/kod/<ver>` (falls back to the files here after two failed starts) and loads its `cekirdek.js`.
- `cekirdek.js` / `preload.js` — frameless window, IPC; data in `veri/` next to the app. `guncelle.js` — update check and install (GitHub releases `hemsirenobet-v*`, sha512 verified).
- `arayuz.html`, `uygulama.js`, `app.css` — single list view, month panel, tabs; version button in the title bar opens the update panel. Teknesyum UI shell in `teknesyum-ui/`.
- `motor.js` — roster engine (quota, no back-to-back, leave, wants/avoids, required-requests mode). `veri.js` — default staff and requests.
- `scripts/kod-paketle.js` — builds `dist/kod-<ver>.zip` and `dist/kod.json` for a release. Release: bump `package.json`, run it, `gh release create hemsirenobet-v<ver> dist/kod-<ver>.zip dist/kod.json`.
- Local update test: `NOBET_KOD_URL=http://127.0.0.1:<port>` serves `kod.json` + zip.
