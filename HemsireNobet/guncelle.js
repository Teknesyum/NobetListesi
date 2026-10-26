const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFile } = require("child_process");

const DEPO = "Teknesyum/NobetListesi";
const ONEK = "hemsirenobet-v";
const YEREL = /^http:\/\/127\.0\.0\.1:\d+$/;

function indir(url, ilerle, yon) {
  return new Promise((ok, no) => {
    const lib = url.startsWith("http://") ? http : https;
    const r = lib.get(url, { headers: { "User-Agent": "HemsireNobet", Accept: url.startsWith("https://api.github.com/") ? "application/vnd.github+json" : "*/*" } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && (yon || 0) < 5) {
        res.resume();
        return ok(indir(new URL(res.headers.location, url).href, ilerle, (yon || 0) + 1));
      }
      if (res.statusCode !== 200) { res.resume(); return no(new Error("Sunucu " + res.statusCode + " döndü")); }
      const toplam = +res.headers["content-length"] || 0;
      const parcalar = [];
      let al = 0;
      res.on("data", c => { parcalar.push(c); al += c.length; if (ilerle && toplam) ilerle(al / toplam); });
      res.on("end", () => ok(Buffer.concat(parcalar)));
      res.on("error", no);
    });
    r.on("error", no);
    r.setTimeout(20000, () => r.destroy(new Error("Bağlantı zaman aşımına uğradı")));
  });
}

async function bilgiAl() {
  const yerel = process.env.NOBET_KOD_URL;
  if (yerel && YEREL.test(yerel)) {
    const k = JSON.parse((await indir(yerel + "/kod.json")).toString("utf-8"));
    k.url = yerel + "/" + k.file;
    return k;
  }
  const liste = JSON.parse((await indir("https://api.github.com/repos/" + DEPO + "/releases?per_page=20")).toString("utf-8"));
  const s = liste.find(r => !r.draft && !r.prerelease && String(r.tag_name).startsWith(ONEK));
  if (!s) throw new Error("Yayımlanmış sürüm bulunamadı");
  const kodJson = s.assets.find(a => a.name === "kod.json");
  if (!kodJson) throw new Error("Sürümde kod.json yok");
  const k = JSON.parse((await indir(kodJson.browser_download_url)).toString("utf-8"));
  const z = s.assets.find(a => a.name === k.file);
  if (!z) throw new Error("Sürümde " + k.file + " yok");
  k.url = z.browser_download_url;
  k.notlar = s.body || "";
  return k;
}

async function denetle(mevcut, kars) {
  const k = await bilgiAl();
  return { yeni: kars(k.version, mevcut) > 0, surum: k.version, dosya: k.file, boyut: k.size, sha512: k.sha512, url: k.url, notlar: k.notlar || "" };
}

const TAR = process.env.SystemRoot && fs.existsSync(path.join(process.env.SystemRoot, "System32", "tar.exe")) ? path.join(process.env.SystemRoot, "System32", "tar.exe") : "tar";

function tar(args) {
  return new Promise((ok, no) => execFile(TAR, args, { windowsHide: true, maxBuffer: 1 << 24 }, (e, so) => (e ? no(e) : ok(so))));
}

async function uygula(b, N, ilerle) {
  const adim = (y, tavan, m) => ilerle && ilerle({ yuzde: y, adim: m });
  adim(0.02, 0.1, "Yeni sürüm indiriliyor");
  const veri = await indir(b.url, o => adim(0.02 + o * 0.6, 0.62, "Yeni sürüm indiriliyor"));
  adim(0.64, 0.7, "Dosya doğrulanıyor");
  if (b.boyut && veri.length !== b.boyut) throw new Error("Dosya boyutu beklenenden farklı");
  if (crypto.createHash("sha512").update(veri).digest("hex") !== b.sha512) throw new Error("Dosya özeti tutmuyor, güncelleme durduruldu");
  const kok = path.join(path.dirname(N.durumYol));
  fs.mkdirSync(kok, { recursive: true });
  const zip = path.join(kok, b.surum + ".zip");
  const hedef = path.join(kok, b.surum);
  const gecici = hedef + ".tmp";
  fs.writeFileSync(zip, veri);
  adim(0.72, 0.8, "Dosyalar açılıyor");
  const adlar = (await tar(["-tf", zip])).split(/\r?\n/).filter(Boolean);
  if (!adlar.length || adlar.some(a => path.isAbsolute(a) || a.split(/[\\/]/).includes(".."))) throw new Error("Pakette geçersiz yol var");
  fs.rmSync(gecici, { recursive: true, force: true });
  fs.mkdirSync(gecici, { recursive: true });
  await tar(["-xf", zip, "-C", gecici]);
  if (!fs.existsSync(path.join(gecici, "cekirdek.js"))) throw new Error("Pakette cekirdek.js yok");
  fs.rmSync(hedef, { recursive: true, force: true });
  fs.renameSync(gecici, hedef);
  fs.rmSync(zip, { force: true });
  adim(0.92, 0.96, "Yeni sürüm kaydediliyor");
  let d = {};
  try { d = JSON.parse(fs.readFileSync(N.durumYol, "utf-8")); } catch (e) {}
  d.surum = b.surum;
  d.tries = 0;
  d.bozuk = (d.bozuk || []).filter(x => x !== b.surum);
  fs.writeFileSync(N.durumYol, JSON.stringify(d));
  adim(1, 1, "Program yeniden başlıyor");
}

module.exports = { denetle, uygula };
