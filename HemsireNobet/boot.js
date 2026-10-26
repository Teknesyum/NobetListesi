const path = require("path");
const fs = require("fs");

const KOK = __dirname;
const VERI = path.join(KOK, "veri");
const KODDIZIN = path.join(VERI, "kod");
const DURUM = path.join(KODDIZIN, "durum.json");

const oku = () => { try { return JSON.parse(fs.readFileSync(DURUM, "utf-8")); } catch (e) { return {}; } };
const yaz = d => { try { fs.mkdirSync(KODDIZIN, { recursive: true }); fs.writeFileSync(DURUM, JSON.stringify(d)); } catch (e) {} };
const parca = s => String(s).split(".").map(x => parseInt(x, 10) || 0);
const kars = (a, b) => { const x = parca(a), y = parca(b); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0); return 0; };

const d = oku();
d.bozuk = d.bozuk || [];
const kokSurum = require("./package.json").version;
let kod = KOK;

if (d.surum && (d.tries || 0) >= 2 && !d.bozuk.includes(d.surum)) {
  d.bozuk.push(d.surum);
  d.tries = 0;
  yaz(d);
}
if (d.surum && kars(d.surum, kokSurum) > 0 && !d.bozuk.includes(d.surum) && fs.existsSync(path.join(KODDIZIN, d.surum, "cekirdek.js"))) {
  kod = path.join(KODDIZIN, d.surum);
  d.tries = (d.tries || 0) + 1;
  yaz(d);
}

global.NOBET = { kok: KOK, kod, veri: VERI, durumYol: DURUM, kars };

try {
  require(path.join(kod, "cekirdek.js"));
} catch (e) {
  if (kod === KOK) throw e;
  d.bozuk.push(d.surum);
  d.tries = 0;
  yaz(d);
  global.NOBET.kod = KOK;
  require(path.join(KOK, "cekirdek.js"));
}
