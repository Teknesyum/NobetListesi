const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const kok = path.resolve(__dirname, "..");
const surum = require(path.join(kok, "package.json")).version;
const dist = path.join(kok, "dist");
const ust = path.join(kok, "dist-portable");
const sahne = path.join(ust, "HemsireNobet");
const dosyalar = ["boot.js", "cekirdek.js", "guncelle.js", "preload.js", "motor.js", "tatil.js", "veri.js", "uygulama.js", "arayuz.html", "app.css", "simge.ico", "simge.png", "package.json", "HemsireNobet.bat"];

const html = fs.readFileSync(path.join(kok, "arayuz.html"), "utf-8");
for (const m of html.matchAll(/<script src="([^"]+)"/g)) if (!dosyalar.includes(m[1])) throw new Error("portable listede yok: " + m[1]);
for (const m of html.matchAll(/<link[^>]+href="([^"]+.css)"/g)) if (!m[1].startsWith("teknesyum-ui/") && !dosyalar.includes(m[1])) throw new Error("portable listede yok: " + m[1]);
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
