# Plan

Portable Electron roster tool: one list, 20 nurses, all in the operating room.

1. Copy the Teknesyum shell (titlebar, tokens, forms, states) from Asistan/HemşireNöbet.
2. `boot.js` / `cekirdek.js` / `preload.js`: frameless window, data in `veri/` next to the app, no sync, no network.
3. `arayuz.html` + `uygulama.js` + `app.css`: one list view, staff panel, summary, print/copy/CSV.
4. `motor.js` + `veri.js`: unchanged engine and default data.
5. `electron/` (copy of the Electron binaries) + `HemsireNobet.bat`: the folder runs from a USB stick with no install.
6. `node scan.js`, run the app, screenshot, report deviations to Core.
7. Update: boot.js picks the newest healthy code package, guncelle.js installs it from GitHub releases; version button in the title bar.
