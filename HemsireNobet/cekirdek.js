const { app, BrowserWindow, Menu, ipcMain, shell, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

const N = global.NOBET || { kok: __dirname, kod: __dirname, veri: path.join(__dirname, "veri"), durumYol: path.join(__dirname, "veri", "kod", "durum.json"), kars: (a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }) };
const KOK = N.kod;
const VERIDIZIN = N.veri;
const guncelle = require("./guncelle.js");
const SURUM = require("./package.json").version;
let bekleyen = null;
try { fs.mkdirSync(VERIDIZIN, { recursive: true }); } catch (e) {}
app.setPath("userData", path.join(VERIDIZIN, "profil"));

const etiket = () => {
  try {
    return { ...JSON.parse(fs.readFileSync(path.join(KOK, "teknesyum-ui", "css", "labels.tr.json"), "utf-8")), "app.title": require("./package.json").productName };
  } catch (err) { return {}; }
};

const veriYol = k => path.join(VERIDIZIN, String(k).replace(/[^A-Za-z0-9:_-]/g, "_").replace(/:/g, "@") + ".json");

if (!app.requestSingleInstanceLock()) app.quit();

let ana = null;

function pencere() {
  const p = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1000,
    minHeight: 640,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    autoHideMenuBar: true,
    icon: path.join(KOK, "simge.ico"),
    title: etiket()["app.title"],
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
      backgroundThrottling: false,
      preload: path.join(KOK, "preload.js")
    }
  });
  p.maximize();
  p.loadFile(path.join(KOK, "arayuz.html"));
  p.once("ready-to-show", () => p.show());
  const bildir = () => p.webContents.send("pencere:durum", p.isMaximized());
  p.on("maximize", bildir);
  p.on("unmaximize", bildir);
  p.webContents.on("did-finish-load", () => {
    bildir();
    try {
      const d = JSON.parse(fs.readFileSync(N.durumYol, "utf-8"));
      if (d.tries) { d.tries = 0; fs.writeFileSync(N.durumYol, JSON.stringify(d)); }
    } catch (err) {}
  });
  return p;
}

const hedef = e => BrowserWindow.fromWebContents(e.sender);

app.on("second-instance", () => {
  if (!ana || ana.isDestroyed()) return;
  if (ana.isMinimized()) ana.restore();
  ana.focus();
});

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  ipcMain.on("pencere:kucult", e => { const w = hedef(e); if (w) w.minimize(); });
  ipcMain.on("pencere:buyult", e => {
    const w = hedef(e);
    if (!w) return;
    if (w.isMaximized()) w.unmaximize(); else w.maximize();
  });
  ipcMain.on("pencere:kapat", e => { const w = hedef(e); if (w) w.close(); });
  ipcMain.on("pencere:ac", (e, u) => { if (/^https:\/\//.test(u)) shell.openExternal(u); });
  ipcMain.handle("pencere:yazdir", e => new Promise(ok => {
    const w = hedef(e);
    if (!w) return ok(false);
    w.webContents.print({ silent: false, printBackground: true, landscape: false }, s => ok(s));
  }));
  ipcMain.handle("pencere:dosyaYaz", async (e, { ad, metin, tur }) => {
    const w = hedef(e);
    const r = await dialog.showSaveDialog(w, { defaultPath: path.join(app.getPath("documents"), ad), filters: [{ name: tur, extensions: [ad.split(".").pop()] }] });
    if (r.canceled || !r.filePath) return "";
    fs.writeFileSync(r.filePath, "﻿" + metin, "utf-8");
    return r.filePath;
  });
  ipcMain.handle("guncelle:surum", () => SURUM);
  ipcMain.handle("guncelle:denetle", async () => {
    try {
      const b = await guncelle.denetle(SURUM, N.kars);
      bekleyen = b.yeni ? b : null;
      return { ok: true, yeni: b.yeni, surum: b.surum, notlar: b.notlar };
    } catch (err) { return { ok: false, hata: String(err && err.message || err) }; }
  });
  ipcMain.handle("guncelle:uygula", async e => {
    if (!bekleyen) return { ok: false, hata: "Önce güncelleme denetlenmeli" };
    const w = hedef(e);
    try {
      await guncelle.uygula(bekleyen, N, p => { if (w && !w.isDestroyed()) w.webContents.send("guncelle:ilerle", p); });
      setTimeout(() => { app.relaunch(); app.exit(0); }, 700);
      return { ok: true };
    } catch (err) { return { ok: false, hata: String(err && err.message || err) }; }
  });
  ipcMain.handle("etiket:hepsi", () => etiket());
  ipcMain.handle("veri:hepsi", () => {
    const o = {};
    for (const f of fs.readdirSync(VERIDIZIN)) if (f.endsWith(".json")) {
      try { o[f.slice(0, -5)] = fs.readFileSync(path.join(VERIDIZIN, f), "utf-8"); } catch (err) {}
    }
    return o;
  });
  ipcMain.on("veri:yaz", (e, { k, m }) => { try { fs.writeFileSync(veriYol(k), m, "utf-8"); } catch (err) {} });
  ana = pencere();
  app.on("activate", () => { if (!BrowserWindow.getAllWindows().length) ana = pencere(); });
});

app.on("window-all-closed", () => app.quit());
