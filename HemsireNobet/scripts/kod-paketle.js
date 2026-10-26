const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const kok = path.resolve(__dirname, "..");
const surum = require(path.join(kok, "package.json")).version;
const dist = path.join(kok, "dist");
const sahne = path.join(dist, "kod-" + surum);
const dosyalar = ["cekirdek.js", "guncelle.js", "preload.js", "motor.js", "veri.js", "uygulama.js", "arayuz.html", "app.css", "simge.ico", "package.json"];

fs.rmSync(sahne, { recursive: true, force: true });
fs.mkdirSync(sahne, { recursive: true });
for (const f of dosyalar) fs.copyFileSync(path.join(kok, f), path.join(sahne, f));
fs.cpSync(path.join(kok, "teknesyum-ui"), path.join(sahne, "teknesyum-ui"), { recursive: true });

const ad = "kod-" + surum + ".zip";
const zip = path.join(dist, ad);
fs.rmSync(zip, { force: true });
execFileSync(path.join(process.env.SystemRoot || "C:\Windows", "System32", "tar.exe"), ["-a", "-cf", zip, "-C", sahne, "."], { windowsHide: true });
fs.rmSync(sahne, { recursive: true, force: true });

const veri = fs.readFileSync(zip);
const kod = { version: surum, kabuk: 1, file: ad, sha512: crypto.createHash("sha512").update(veri).digest("hex"), size: veri.length };
fs.writeFileSync(path.join(dist, "kod.json"), JSON.stringify(kod, null, 2) + "\n");
console.log(kod.file, kod.size, "bayt");
