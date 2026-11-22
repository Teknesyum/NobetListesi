const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const kok = path.resolve(__dirname, "..");
const surum = require(path.join(kok, "package.json")).version;
const dist = path.join(kok, "dist");
const ust = path.join(kok, "dist-portable");
const sahne = path.join(ust, "HemsireNobet");
const dosyalar = ["boot.js", "cekirdek.js", "guncelle.js", "preload.js", "motor.js", "veri.js", "uygulama.js", "arayuz.html", "app.css", "simge.ico", "simge.png", "package.json", "HemsireNobet.bat"];

if (!fs.existsSync(path.join(kok, "electron", "electron.exe"))) throw new Error("electron/electron.exe yok");
fs.rmSync(ust, { recursive: true, force: true });
fs.mkdirSync(sahne, { recursive: true });
for (const f of dosyalar) fs.copyFileSync(path.join(kok, f), path.join(sahne, f));
for (const d of ["teknesyum-ui", "electron"]) fs.cpSync(path.join(kok, d), path.join(sahne, d), { recursive: true });

fs.mkdirSync(dist, { recursive: true });
const zip = path.join(dist, "HemsireNobet-portable-" + surum + ".zip");
fs.rmSync(zip, { force: true });
execFileSync(path.join(process.env.SystemRoot || "C:\\Windows", "System32", "tar.exe"), ["-a", "-cf", zip, "-C", ust, "HemsireNobet"], { windowsHide: true });
fs.rmSync(ust, { recursive: true, force: true });
console.log(path.basename(zip), fs.statSync(zip).size, "bayt");
