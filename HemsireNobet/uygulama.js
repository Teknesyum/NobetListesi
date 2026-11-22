"use strict";

const $ = s => document.querySelector(s);
const el = (t, p) => Object.assign(document.createElement(t), p || {});
const W = window.pencere;
const ET = window.ETIKET || {};
const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const CETELE_AD = ["PTS", "SALI", "ÇARŞ", "PERŞ", "CUMA", "CTESİ", "PAZAR"];
const HG_PUAN = [1, 1, 1, 1, 2, 3, 2];
const PZT_ILK = [1, 2, 3, 4, 5, 6, 0];
const GUN2 = ["Pz", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct"];
const ALT_ADIM = [30, 50, 100, 150, 200, 250, 300, 400, 500];
const kopya = x => JSON.parse(JSON.stringify(x));
const ILK = kopya(VERI);
const f1 = x => (Math.round(x * 10) / 10).toString();
const isr = x => (x > 0.05 ? "+" : "") + f1(x);
const iki = a => String(a).padStart(2, "0");
const ayAnahtar = (y, a) => "ay-" + y + "-" + iki(a);
const ayKod = (y, a) => y + "-" + iki(a);
const ayKisa = k => { const [y, a] = k.split("-"); return AYLAR[+a - 1] + " " + y; };

function oku(k) { try { return JSON.parse(W.veri.oku(k)); } catch (e) { return null; } }

const AYAR = Object.assign({ altSay: 300, onayIste: false, yesilYol: true, rehber: true, rehberSoruldu: false, resmiTatil: true, yardimGoruldu: false }, oku("ayar") || {});
function ayarYaz(x) { Object.assign(AYAR, x); W.veri.yaz("ayar", JSON.stringify(AYAR)); }

function toast(m, tur, ms) {
  [...$("#toast").children].forEach(x => { if (x.textContent === m) x.remove(); });
  const t = el("div", { className: "tk-toast" + (tur ? " tk-toast-" + tur : ""), role: tur === "danger" ? "alert" : "status" });
  t.append(el("div", { className: "tk-toast-body", textContent: m }));
  t.onclick = () => t.remove();
  $("#toast").append(t);
  if (tur !== "danger") setTimeout(() => t.remove(), ms || 6000);
}

(() => {
  const ad = ET["app.title"] || "Ameliyathane HemşireNöbet";
  const i = ad.indexOf(" ");
  document.title = ad;
  const b = $("#basbarAd");
  b.textContent = i < 0 ? ad : ad.slice(0, i + 1);
  if (i >= 0) b.append(el("span", { className: "tk-titlebar__accent", textContent: ad.slice(i + 1) }));
  const bag = (id, metin, ipucu, adres) => {
    const e = $("#" + id);
    e.textContent = ET[metin] || "";
    e.title = ET[ipucu] || "";
    e.onclick = () => W.ac(adres);
  };
  bag("imza", "sig.brand", "sig.brandTitle", "https://github.com/Teknesyum");
  bag("destek", "sig.support", "sig.supportTitle", "https://github.com/sponsors/Teknesyum");
  $("#pKucult").onclick = () => W.kucult();
  $("#pBuyult").onclick = () => W.buyult();
  $("#pKapat").onclick = () => W.kapat();
  $("#basbar").ondblclick = e => { if (!e.target.closest("button")) W.buyult(); };
  W.durum(buyuk => $("#cerceve").classList.toggle("buyuk", buyuk));
})();

let V = null;
let L = null;
let TOHUM = 1;
let ALT = [];
let ALTTOPLAM = 0;
let SEC = 0;
let KOSU = 0;
let CALISIYOR = false;
let ESKI = false;
let OZEL_GORULDU = false;
let AKTIF = "istek";
let SOLCTRL = false;

function goc(k) {
  if (k.nobet === undefined) k.nobet = k.min !== undefined ? k.min : 7;
  if (k.odeme === undefined) k.odeme = k.max !== undefined ? k.max : 11;
  delete k.min;
  delete k.max;
  const ism = new Set([...(k.istemiyor || []), ...(k.izin || [])]);
  k.istemiyor = [...ism].sort((x, y) => x - y);
  k.istiyor = (k.istiyor || []).filter(d => !ism.has(d));
  k.izin = [];
  return k;
}

let GA = { aylar: {}, elle: {}, manuel: {} };
let GD = { aylar: [], detay: {} };
let GSEC = null;

function gecmisAyarOku() {
  const g = oku("gecmis") || {};
  GA = { aylar: g.aylar || {}, elle: g.elle || {}, manuel: g.manuel || {} };
}

function gecmisAyarYaz() { W.veri.yaz("gecmis", JSON.stringify(GA)); }

const hgPuan = hg => hg.reduce((a, x, i) => a + (+x || 0) * HG_PUAN[i], 0);
const hgTop = hg => hg.reduce((a, x) => a + (+x || 0), 0);

function kayitliAy(py, pa) {
  const pk = oku(ayAnahtar(py, pa));
  if (!pk || !pk.liste || !pk.kisiler) return null;
  const mv = { yil: py, ay: pa, kisi: pk.kisi || 4, tatil: pk.tatil || TATIL.tamGunler(py, pa), kisiler: kopya(pk.kisiler).map(goc), kural: pk.kural, ozel: pk.ozel || [] };
  return { pk, mv };
}

function gecmisHesapla(y, a) {
  const r = {};
  const ekle = (ad, n, p, g) => {
    const x = r[ad] || (r[ad] = { n: 0, p: 0, g: [0, 0, 0, 0, 0] });
    x.n += n;
    x.p += p;
    if (g) for (let q = 0; q < 5; q++) x.g[q] += g[q];
  };
  GD = { aylar: [], detay: {} };
  let py = y, pa = a;
  for (let i = 0; i < 24; i++) {
    pa--;
    if (pa < 1) { pa = 12; py--; }
    const ak = ayKod(py, pa);
    const man = GA.manuel[ak];
    const ka = man ? null : kayitliAy(py, pa);
    if (!man && !ka) continue;
    const dahil = GA.aylar[ak] === true;
    GD.aylar.push({ k: ak, dahil, tur: man ? "elle" : "kayit" });
    const dt = GD.detay[ak] = {};
    if (man) {
      for (const [ad, x] of Object.entries(man.kisiler || {})) {
        const hg = (x.hg || []).map(v => +v || 0);
        const n = hgTop(hg), p = hgPuan(hg);
        const hn = +x.hn || 0, hp = +x.hp || 0;
        dt[ad] = { n, p, hn, hp, hg };
        if (dahil) ekle(ad, n - hn, p - hp, null);
      }
      continue;
    }
    const h = MOTOR.hazirla(ka.mv, false);
    const an = MOTOR.analiz(ka.mv, ka.pk.liste);
    an.forEach((x, i2) => {
      const gb = h.beklenen[i2];
      dt[x.ad] = { n: x.nobet, p: x.odeme, hn: h.nTaban[i2], hp: h.pTaban[i2], hg: x.hg };
      if (dahil) ekle(x.ad, x.nobet - h.nTaban[i2], x.odeme - h.pTaban[i2], x.grup.map((c, q) => c - gb[q]));
    });
  }
  for (const [ad, e] of Object.entries(GA.elle)) {
    const sayi = x => (x === "" || x === undefined || x === null || isNaN(+x) ? null : +x);
    const n = sayi(e.n), hn = sayi(e.hn), p = sayi(e.p), hp = sayi(e.hp);
    if (n === null && p === null) continue;
    ekle(ad, n !== null && hn !== null ? n - hn : 0, p !== null && hp !== null ? p - hp : 0, null);
  }
  return Object.values(r).some(x => Math.abs(x.n) > 1e-9 || Math.abs(x.p) > 1e-9) ? r : null;
}

function istekCarpanHesapla() {
  const say = {};
  let ay = 0;
  for (const m of GD.aylar) {
    if (ay >= 3) break;
    if (!m.dahil || m.tur !== "kayit") continue;
    const [y, a] = m.k.split("-").map(Number);
    const pk = oku(ayAnahtar(y, a));
    if (!pk || !pk.kisiler) continue;
    ay++;
    pk.kisiler.forEach(k => { say[k.ad] = (say[k.ad] || 0) + (k.istiyor || []).length + (k.istemiyor || []).length + (k.izin || []).length; });
  }
  if (!ay) return null;
  const adlar = V.kisiler.map(k => k.ad);
  const ort = adlar.reduce((t, ad) => t + (say[ad] || 0), 0) / Math.max(1, adlar.length);
  if (ort <= 0) return null;
  const c = {};
  adlar.forEach(ad => { c[ad] = Math.max(0.8, Math.min(1.2, 1 - 0.2 * ((say[ad] || 0) / ort - 1))); });
  return c;
}

function yukle(y, a) {
  const kayit = oku(ayAnahtar(y, a));
  const kadro = oku("kadro");
  const taban = kopya(ILK);
  let kisiler;
  if (kayit && kayit.kisiler) kisiler = kayit.kisiler;
  else if (y === ILK.yil && a === ILK.ay) kisiler = taban.kisiler;
  else kisiler = kopya((kadro && kadro.kisiler) || taban.kisiler).map(k => Object.assign(k, { izin: [], istemiyor: [], istiyor: [] }));
  kisiler.forEach(goc);
  const zor = kayit && kayit.zorunlu !== undefined ? kayit.zorunlu : kadro && kadro.zorunlu !== undefined ? kadro.zorunlu : false;
  const kural = MOTOR.kuralNorm((kayit && kayit.kural) || (kadro && kadro.kural) || null, kisiler);
  V = {
    yil: y, ay: a, kisi: (kayit && kayit.kisi) || (kadro && kadro.kisi) || taban.kisi,
    tatil: AYAR.resmiTatil ? TATIL.tamGunler(y, a) : [], kisiler, zorunlu: !!zor, kural,
    ozel: (kayit && kayit.ozel) || [], onceki: [], gecmis: null, istekCarpan: null
  };
  gecmisAyarOku();
  V.gecmis = gecmisHesapla(y, a);
  const py = a === 1 ? y - 1 : y;
  const pa = a === 1 ? 12 : a - 1;
  const pk = oku(ayAnahtar(py, pa));
  if (pk && pk.liste && pk.kisiler && GA.aylar[ayKod(py, pa)] === true) {
    const son = pk.liste[new Date(py, pa, 0).getDate()] || [];
    V.onceki = son.map(i => pk.kisiler[i] && pk.kisiler[i].ad).map(ad => kisiler.findIndex(k => k.ad === ad)).filter(i => i >= 0);
  }
  L = kayit && kayit.liste ? kayit.liste : null;
  TOHUM = (kayit && kayit.tohum) || 1;
  ALT = (kayit && kayit.alt) || [];
  ALTTOPLAM = (kayit && kayit.altToplam) || ALT.length;
  SEC = (kayit && kayit.sec) || 0;
  ESKI = !!(kayit && kayit.eski && L);
  OZEL_GORULDU = false;
  GSEC = null;
}

function sakla() {
  W.veri.yaz(ayAnahtar(V.yil, V.ay), JSON.stringify({ kisi: V.kisi, kisiler: V.kisiler, zorunlu: V.zorunlu, kural: V.kural, ozel: V.ozel, tatil: V.tatil, liste: L, tohum: TOHUM, alt: ALT, altToplam: ALTTOPLAM, sec: SEC, eski: ESKI }));
  W.veri.yaz("kadro", JSON.stringify({ kisi: V.kisi, kisiler: V.kisiler.map(k => ({ ad: k.ad, nobet: k.nobet, odeme: k.odeme, izin: [], istemiyor: [], istiyor: [] })), zorunlu: V.zorunlu, kural: V.kural }));
  W.veri.yaz("son", JSON.stringify({ yil: V.yil, ay: V.ay }));
}

function degisti() {
  if (L) ESKI = true;
  sakla();
  durumCiz();
}

function yol(sel) {
  if (!AYAR.yesilYol) return;
  const e = typeof sel === "string" ? $(sel) : sel;
  if (!e || e.hidden) return;
  e.classList.add("yol");
  clearTimeout(e._yol);
  e._yol = setTimeout(() => e.classList.remove("yol"), 2000);
}

function yolTemizle() { document.querySelectorAll(".yol").forEach(e => e.classList.remove("yol")); }

const tarihMetin = d => d + "." + iki(V.ay) + "." + V.yil;

function anahtar(acik, metin, degis) {
  const b = el("button", { type: "button", className: "dgm", textContent: (metin ? metin + ": " : "") + (acik ? "Açık" : "Kapalı") });
  b.setAttribute("aria-pressed", String(!!acik));
  b.onclick = () => degis(!acik);
  return b;
}

function kutu(acik, metin, degis) {
  const lb = el("label", { className: "kutu" });
  const c = el("input", { type: "checkbox", checked: !!acik });
  c.onchange = () => degis(c.checked);
  lb.append(c, metin);
  return lb;
}

function sayac(deger, min, max, etiket, degis, adimlar) {
  const s = el("span", { className: "sayac" });
  s.setAttribute("role", "group");
  s.setAttribute("aria-label", etiket);
  const eksi = el("button", { type: "button", className: "dgm dgm-kare", textContent: "−" });
  const arti = el("button", { type: "button", className: "dgm dgm-kare", textContent: "+" });
  eksi.setAttribute("aria-label", etiket + " azalt");
  arti.setAttribute("aria-label", etiket + " artır");
  const d = el("span", { className: "sayac-deger", textContent: String(deger) });
  d.setAttribute("aria-live", "polite");
  const git = yon => {
    let y;
    if (adimlar) {
      const i = adimlar.findIndex(x => x >= deger);
      const j = i < 0 ? adimlar.length - 1 : adimlar[i] === deger ? i + yon : yon > 0 ? i : i - 1;
      y = adimlar[Math.max(0, Math.min(adimlar.length - 1, j))];
    } else y = Math.max(min, Math.min(max, deger + yon));
    if (y !== deger) degis(y);
  };
  eksi.onclick = () => git(-1);
  arti.onclick = () => git(1);
  eksi.disabled = adimlar ? deger <= adimlar[0] : deger <= min;
  arti.disabled = adimlar ? deger >= adimlar[adimlar.length - 1] : deger >= max;
  s.append(eksi, d, arti);
  return s;
}

function gunSecici(deger, etiket, degis) {
  const s = el("select", { className: "tk-input ince" });
  s.setAttribute("aria-label", etiket);
  PZT_ILK.forEach(w => s.append(el("option", { value: String(w), textContent: MOTOR.GUN[w], selected: deger === w })));
  s.onchange = () => degis(+s.value);
  return s;
}

const baslik = (m, seviye) => el(seviye || "h2", { className: "bolum-baslik", textContent: m });
const yardim = m => el("p", { className: "yardim", textContent: m });
const satir = (...x) => { const d = el("div", { className: "satir" }); d.append(...x); return d; };

function aySiraKur() {
  const s = $("#aySira");
  s.replaceChildren();
  AYLAR.forEach((m, i) => {
    const b = el("button", { type: "button", className: "dgm ay-dgm", textContent: m.slice(0, 3) });
    b.setAttribute("aria-label", m);
    b.onclick = () => git(V.yil, i + 1);
    b.oncontextmenu = e => {
      e.preventDefault();
      const ak = ayKod(V.yil, i + 1);
      const kayit = oku(ayAnahtar(V.yil, i + 1));
      if (!(kayit && kayit.liste) && !GA.manuel[ak]) return toast(m + " " + V.yil + " için kayıtlı liste yok. Geçmişi Ayarlar › Geçmiş'ten elle girebilirsin.", "warning");
      GA.aylar[ak] = GA.aylar[ak] !== true;
      gecmisAyarYaz();
      yenidenKur(m + " " + V.yil + (GA.aylar[ak] ? " geçmişe katıldı." : " geçmişten çıkarıldı."));
    };
    s.append(b);
  });
}

const CIZGI = el("button", { type: "button", className: "gecmis-cizgi" });
CIZGI.onclick = () => sekme("gecmis");

function ayPanelCiz() {
  $("#yilYazi").textContent = String(V.yil);
  const dgm = [...document.querySelectorAll(".ay-dgm")];
  dgm.forEach((b, i) => {
    const ak = ayKod(V.yil, i + 1);
    const kayit = oku(ayAnahtar(V.yil, i + 1));
    const dolu = !!(kayit && kayit.liste) || !!GA.manuel[ak];
    b.dataset.dolu = dolu ? "1" : "0";
    b.dataset.dahil = GA.aylar[ak] === true && dolu ? "1" : "0";
    b.title = AYLAR[i] + " " + V.yil + (b.dataset.dahil === "1" ? ": geçmiş hesabına katılıyor" : dolu ? ": kayıt var, geçmişe katılmıyor" : "") + (dolu ? ". Sağ tık: geçmişe kat ya da çıkar." : "");
    b.setAttribute("aria-current", String(i + 1 === V.ay));
  });
  const elle = Object.keys(GA.elle).length > 0 || Object.keys(GA.manuel).some(k => GA.aylar[k] === true);
  CIZGI.hidden = !elle;
  if (elle) {
    const ilk = GD.aylar.filter(m => m.dahil).map(m => m.k).sort()[0];
    let yer = V.ay - 1;
    if (ilk) { const [y, a] = ilk.split("-").map(Number); if (y < V.yil) yer = 0; else if (y === V.yil) yer = a - 1; }
    dgm[yer].before(CIZGI);
    CIZGI.title = "Elle girilen geçmiş var. Düzenlemek için tıkla.";
    CIZGI.setAttribute("aria-label", "Elle girilen geçmişi düzenle");
  }
  $("#kisi").textContent = String(V.kisi);
  $("#kisiEksi").disabled = V.kisi <= 1;
  $("#kisiArti").disabled = V.kisi >= 12;
  $("#btnUret").textContent = CALISIYOR ? "Durdur" : "Listeyi Oluştur";
}

let LKEY = "";
const SECLER = [];

function listeCiz() {
  const G = MOTOR.gunSayisi(V);
  $("#baslik").textContent = (AYLAR[V.ay - 1] + " " + V.yil + " Ameliyathane Hemşire Nöbet Listesi").toLocaleUpperCase("tr");
  const key = V.yil + "-" + V.ay + "-" + V.kisi;
  if (key === LKEY) return;
  LKEY = key;
  SECLER.length = 0;
  const t = $("#liste");
  t.replaceChildren();
  const cg = el("colgroup");
  cg.append(el("col", { className: "c-tarih" }), el("col", { className: "c-gun" }));
  for (let i = 0; i < V.kisi; i++) cg.append(el("col"));
  t.append(cg);
  const bas = el("tr");
  ["Tarih", "Gün"].concat(Array.from({ length: V.kisi }, (_, i) => "Nöbetçi " + (i + 1))).forEach(m => bas.append(el("th", { scope: "col", textContent: m })));
  t.append(bas);
  const T = TATIL.ay(V.yil, V.ay);
  for (let d = 1; d <= G; d++) {
    const w = MOTOR.haftaGunu(V, d);
    const tt = T[d];
    const tr = el("tr", { className: tt ? (tt.tam ? "tatil" : "arife") : w === 0 || w === 6 ? "hs" : "" });
    if (tt) tr.title = tt.ad;
    tr.append(el("td", { className: "tarih", textContent: tarihMetin(d) }), el("td", { className: "gun", textContent: MOTOR.GUN[w] }));
    SECLER[d] = [];
    for (let y = 0; y < V.kisi; y++) {
      const s = el("select", { className: "sec" });
      s.setAttribute("aria-label", tarihMetin(d) + " nöbetçi " + (y + 1));
      s.append(el("option", { value: "-1", textContent: "—" }));
      V.kisiler.forEach((k, i) => s.append(el("option", { value: String(i), textContent: k.ad })));
      s.onchange = () => {
        if (!L) return;
        const v = +s.value;
        L[d] = L[d] || [];
        if (v < 0) L[d].splice(y, 1); else L[d][y] = v;
        degisti();
        ciz();
      };
      SECLER[d][y] = s;
      const td = el("td", { className: "hucre" });
      td.append(s);
      tr.append(td);
    }
    t.append(tr);
  }
}

function listeDoldur(liste, oniz) {
  listeCiz();
  const G = MOTOR.gunSayisi(V);
  const H = liste && !oniz ? MOTOR.hazirla(V) : null;
  for (let d = 1; d <= G; d++) {
    for (let y = 0; y < V.kisi; y++) {
      const s = SECLER[d][y];
      const p = liste && liste[d] ? liste[d][y] : undefined;
      s.value = p === undefined ? "-1" : String(p);
      s.disabled = !L || CALISIYOR;
      const kotu = H && p !== undefined && (H.yok[p].has(d) || H.istemez[p].has(d) || (d > 1 && liste[d - 1] && liste[d - 1].includes(p)));
      if (kotu) s.dataset.kotu = "1"; else delete s.dataset.kotu;
    }
  }
}

function ceteleTablo(satirlar, gecmisVar) {
  const t = el("table", { className: "tablo cetele" });
  const b = el("tr");
  b.append(el("th", { scope: "col", textContent: "Ad" }));
  CETELE_AD.forEach((m, i) => { const th = el("th", { scope: "col", textContent: m }); if (i >= 5) th.className = "hs"; b.append(th); });
  b.append(el("th", { scope: "col", textContent: "NÖBET" }));
  if (gecmisVar) b.append(el("th", { scope: "col", textContent: "GEÇMİŞ" }));
  t.append(b);
  const top = [0, 0, 0, 0, 0, 0, 0];
  let tn = 0, tp = 0;
  satirlar.forEach(r => {
    const tr = el("tr");
    tr.append(el("td", { className: "ad", textContent: r.ad }));
    r.hg.forEach((x, i) => {
      top[i] += x;
      const td = el("td", { textContent: String(x) });
      td.className = (x ? "" : "sifir") + (i >= 5 ? " hs" : "");
      tr.append(td);
    });
    tn += r.n;
    tp += r.p;
    const np = el("td", { className: "np", textContent: r.n + "/" + f1(r.p) });
    if (r.hedef) np.title = "Hedef " + r.hedef;
    tr.append(np);
    if (gecmisVar) tr.append(el("td", { className: "gec", textContent: r.gec || "—" }));
    t.append(tr);
  });
  const tr = el("tr", { className: "toplam" });
  tr.append(el("td", { className: "ad", textContent: "Toplam" }));
  top.forEach((x, i) => tr.append(el("td", { className: i >= 5 ? "hs" : "", textContent: String(x) })));
  tr.append(el("td", { className: "np", textContent: tn + "/" + f1(tp) }));
  if (gecmisVar) tr.append(el("td", {}));
  t.append(tr);
  return t;
}

function ceteleCiz() {
  const p = $("#p-liste");
  p.replaceChildren();
  p.append(baslik("Çetele: " + AYLAR[V.ay - 1] + " " + V.yil));
  const an = L ? MOTOR.analiz(V, L) : null;
  const rows = V.kisiler.map((k, i) => {
    const a = an && an[i];
    const g = V.gecmis && V.gecmis[k.ad];
    return {
      ad: k.ad,
      hg: a ? a.hg : [0, 0, 0, 0, 0, 0, 0],
      n: a ? a.nobet : 0,
      p: a ? a.odeme : 0,
      hedef: a ? f1(a.nobetHedef) + "/" + f1(a.odemeHedef) : "",
      gec: g ? isr(g.n) + " / " + isr(g.p) : ""
    };
  });
  const kap = el("div", { className: "istek-kap" });
  kap.append(ceteleTablo(rows, true));
  p.append(kap);
  if (!L) p.append(yardim("Liste henüz oluşturulmadı. Üstteki Listeyi Oluştur düğmesine bas."));
  p.append(yardim("Her sütun o gün tutulan nöbet sayısı. NÖBET: nöbet / ödeme puanı (Cuma 2, Cumartesi 3, Pazar ve tatil 2). GEÇMİŞ: önceki aylarda hakkından fazla (+) ya da eksik (−) tutulan nöbet / puan."));
  const b = el("button", { type: "button", className: "dgm", textContent: "Geçmiş Verileri İncele" });
  b.onclick = () => sekme("gecmis");
  p.append(satir(b));
}

function durumCiz() {
  const d = $("#durum");
  if (CALISIYOR) { d.textContent = "Hazırlanıyor"; delete d.dataset.iyi; return; }
  if (!L) { d.textContent = "Liste yok"; delete d.dataset.iyi; return; }
  if (ESKI) { d.textContent = "Değişiklik var, yeniden oluştur"; d.dataset.iyi = "0"; return; }
  const r = MOTOR.rapor(V, L);
  d.textContent = r.sorun.length ? r.sorun.length + " sorun var" : "Kurallara tam uyuyor";
  d.dataset.iyi = r.sorun.length ? "0" : "1";
}

function sorunCiz() {
  const p = $("#p-sorun");
  p.replaceChildren();
  p.append(baslik("Sorunlar"));
  const ul = el("ul", { className: "sorun-liste" });
  if (!L) ul.append(el("li", { textContent: "Liste henüz oluşturulmadı." }));
  else {
    const r = MOTOR.rapor(V, L);
    if (r.sorun.length) r.sorun.forEach(s => ul.append(el("li", { textContent: s })));
    else { const li = el("li", { textContent: "Hiç sorun yok." }); li.dataset.iyi = "1"; ul.append(li); }
  }
  p.append(ul);
  durumCiz();
}

function analizCiz() {
  const p = $("#p-analiz");
  p.replaceChildren();
  p.append(baslik("Analiz"));
  if (!L) { p.append(yardim("Liste henüz oluşturulmadı.")); return; }
  const an = MOTOR.analiz(V, L);
  const t = el("table", { className: "tablo" });
  const b = el("tr");
  ["Ad", "Nöbet", "Ödeme"].concat(MOTOR.TIP_AD, ["İstek", "İstemez", "Geçmiş"]).forEach(m => b.append(el("th", { scope: "col", textContent: m })));
  t.append(b);
  const hucre = (ana, alt, kotu) => {
    const td = el("td", {});
    td.dataset.kotu = kotu ? "1" : "0";
    td.append(String(ana), el("small", { textContent: alt }));
    return td;
  };
  an.forEach(a => {
    const tr = el("tr");
    const ad = el("td", { className: "ad", textContent: a.ad });
    if (a.gruplar && a.gruplar.length) ad.append(el("small", { textContent: a.gruplar.join(", ") }));
    tr.append(ad);
    tr.append(hucre(a.nobet, "hedef " + f1(a.nobetHedef), Math.abs(a.nobet - a.nobetHedef) >= 1.5));
    tr.append(hucre(a.odeme, "hedef " + f1(a.odemeHedef), Math.abs(a.odeme - a.odemeHedef) >= 2.5));
    a.tip.forEach((x, t2) => tr.append(hucre(x, "~" + f1(a.tipBeklenen[t2]), Math.abs(x - a.tipBeklenen[t2]) >= 1.5)));
    const ist = hucre(a.istekVerilen + "/" + a.istek, a.istek ? (a.istekVerilen === a.istek ? "tamam" : "eksik") : "yok", a.istek > a.istekVerilen);
    if (a.istek && a.istekVerilen === a.istek) ist.dataset.iyi = "1";
    tr.append(ist);
    tr.append(hucre(a.istemezIhlal + "/" + a.istemez, a.ardArda || a.perHs ? "ard arda " + a.ardArda + ", per-hs " + a.perHs : "temiz", a.istemezIhlal > 0 || a.ardArda > 0 || a.perHs > 0));
    const gc = a.gecmis ? a.fark : null;
    tr.append(hucre(gc ? isr(gc.n) : "—", gc ? "ödeme " + isr(gc.p) : "kayıt yok", gc && (Math.abs(gc.n) >= 1.5 || Math.abs(gc.p) >= 2.5)));
    t.append(tr);
  });
  const kap = el("div", { className: "istek-kap" });
  kap.append(t);
  p.append(kap);
  p.append(yardim("Nöbet ve Ödeme: geçmiş aylar düşüldükten sonraki hedef. Pzt…Paz: o günlerdeki nöbet ve beklenen (tatiller Paz sütununda). İstek: verilen / istenen. İstemez: istemediği güne yazılan / toplam. Geçmiş: önceki aylarda hakkından fazla (+) ya da eksik (−)."));
}

function kadroCiz() {
  const p = $("#p-kadro");
  p.replaceChildren();
  p.append(baslik("Kadro"));
  const t = el("table", { className: "tablo" });
  const b = el("tr");
  ["Ad", "Nöbet", "Ödeme"].forEach(m => b.append(el("th", { scope: "col", textContent: m })));
  t.append(b);
  V.kisiler.forEach(k => {
    const tr = el("tr");
    tr.append(el("td", { className: "ad", textContent: k.ad }));
    [["nobet", "nöbet sayısı"], ["odeme", "ödeme puanı"]].forEach(([a, e]) => {
      const i = el("input", { className: "tk-input ince dar", type: "number", min: "0", value: k[a] });
      i.setAttribute("aria-label", k.ad + " " + e);
      i.onchange = () => { k[a] = Math.max(0, +i.value || 0); i.value = k[a]; degisti(); kadroUyari(); };
      const td = el("td");
      td.append(i);
      tr.append(td);
    });
    t.append(tr);
  });
  p.append(t);
  p.append(el("p", { className: "yardim uyari", id: "kadroUyari" }));
  kadroUyari();
  p.append(yardim("Nöbet: kişinin bu ayki nöbet payı (6/10 yazan kâğıtta 6). Ödeme: ödeme puanı payı (10). Cuma 2, Cumartesi 3, Pazar ve tatil 2, diğer günler 1 puan."));
}

function kadroUyari() {
  const u = $("#kadroUyari");
  if (!u) return;
  const G = MOTOR.gunSayisi(V);
  const sn = V.kisiler.reduce((a, k) => a + k.nobet, 0);
  const ger = G * V.kisi;
  u.textContent = "Toplam nöbet " + sn + ", bu ay gereken " + ger + " (" + G + " gün × günde " + V.kisi + " kişi). " + (sn === ger ? "Uyuşuyor." : "Uyuşmuyor: herkesin hedefi aynı oranda " + (sn < ger ? "artırılır." : "azaltılır."));
  u.dataset.kotu = sn === ger ? "0" : "1";
}

const istekDurum = (k, d) => (k.istemiyor.includes(d) ? 2 : k.istiyor.includes(d) ? 1 : 0);

function istekYaz(k, d, q) {
  k.istiyor = k.istiyor.filter(x => x !== d);
  k.istemiyor = k.istemiyor.filter(x => x !== d);
  if (q === 1) k.istiyor.push(d);
  else if (q === 2) k.istemiyor.push(d);
  k.istiyor.sort((x, y) => x - y);
  k.istemiyor.sort((x, y) => x - y);
  k.izin = [];
}

let BOYA = null;
let BOYA_DEGISTI = false;
let ISTEK_YOL = false;
window.addEventListener("mouseup", () => {
  if (BOYA === null) return;
  BOYA = null;
  if (BOYA_DEGISTI) istekBitti();
  BOYA_DEGISTI = false;
});

function istekBitti() {
  degisti();
  if (!ISTEK_YOL) { ISTEK_YOL = true; yol("#btnOzelSonraki"); }
}

let ISTEK_UZERI = null;

function istekCiz() {
  const p = $("#p-istek");
  p.replaceChildren();
  ISTEK_YOL = false;
  const G = MOTOR.gunSayisi(V);
  const T = TATIL.ay(V.yil, V.ay);
  p.append(baslik("İstekler: " + AYLAR[V.ay - 1] + " " + V.yil));
  const lej = el("div", { className: "lejant" });
  const ornek = (c, m, s) => { const x = el("span"); x.append(el("span", { className: "ornek " + c, textContent: s || "" }), m); return x; };
  lej.append(
    ornek("ornek-ist", "İstiyor · sol tık", "✓"),
    ornek("ornek-ism", "İstemiyor · sağ tık", "✗"),
    ornek("ornek-hs", "Hafta sonu"),
    ornek("ornek-tatil", "Resmi tatil"),
    el("span", { textContent: "Sol Ctrl + tık: o kişinin aynı haftagünlerinin tamamı · İsme tık: bütün ay ✗" })
  );
  p.append(lej);
  const kap = el("div", { className: "istek-kap" });
  const t = el("table", { className: "istek" });
  let vurgu = [];
  const temizle = () => {
    vurgu.forEach(x => x.classList.remove("kol", "ctrl"));
    vurgu = [];
    t.querySelectorAll("tr.sat").forEach(x => x.classList.remove("sat"));
  };
  const vurgula = td => {
    temizle();
    ISTEK_UZERI = td;
    if (!td) return;
    const i = td.cellIndex;
    if (i < 1 || i > G) return;
    td.parentElement.classList.add("sat");
    const w = MOTOR.haftaGunu(V, i);
    for (const tr of t.rows) {
      for (let d = 1; d <= G; d++) {
        const c = tr.cells[d];
        if (!c) continue;
        if (d === i) { c.classList.add("kol"); vurgu.push(c); }
        else if (SOLCTRL && MOTOR.haftaGunu(V, d) === w && tr === td.parentElement) { c.classList.add("ctrl"); vurgu.push(c); }
      }
    }
  };
  t._vurgula = () => vurgula(ISTEK_UZERI && t.contains(ISTEK_UZERI) ? ISTEK_UZERI : null);
  t.addEventListener("mouseover", e => vurgula(e.target.closest("td, th")));
  t.addEventListener("focusin", e => vurgula(e.target.closest("td, th")));
  t.addEventListener("mouseleave", () => vurgula(null));
  t.addEventListener("contextmenu", e => { if (e.target.closest(".hc")) e.preventDefault(); });
  const cg = el("colgroup");
  cg.append(el("col", { className: "c-ad" }));
  for (let d = 1; d <= G; d++) cg.append(el("col"));
  cg.append(el("col", { className: "c-top" }));
  t.append(cg);
  const b = el("tr");
  b.append(el("th", { scope: "col", textContent: "Ad" }));
  const isaret = (x, d) => {
    const w = MOTOR.haftaGunu(V, d);
    if (T[d]) x.dataset.tatil = T[d].tam ? "1" : "2";
    else if (w === 0 || w === 6) x.dataset.hs = "1";
  };
  for (let d = 1; d <= G; d++) {
    const w = MOTOR.haftaGunu(V, d);
    const th = el("th", { scope: "col", textContent: String(d) });
    th.append(el("small", { textContent: GUN2[w] }));
    th.title = tarihMetin(d) + " " + MOTOR.GUN[w] + (T[d] ? " · " + T[d].ad : "");
    isaret(th, d);
    b.append(th);
  }
  b.append(el("th", { scope: "col", textContent: "Toplam" }));
  t.append(b);
  V.kisiler.forEach(k => {
    const tr = el("tr");
    const adTd = el("td");
    const ad = el("button", { type: "button", className: "ad-dgm", textContent: k.ad });
    adTd.append(ad);
    tr.append(adTd);
    const top = el("td", { className: "top" });
    const hcler = [];
    const tumMu = () => k.istemiyor.length >= G;
    const topYaz = () => {
      top.textContent = k.istiyor.length + "✓ " + k.istemiyor.length + "✗";
      ad.dataset.tum = tumMu() ? "1" : "0";
      ad.title = tumMu() ? "Bütün ay ✗. Geri almak için tıkla." : "Tıkla: bütün ayı ✗ yap";
    };
    const hcCiz = d => {
      const h = hcler[d];
      const q = istekDurum(k, d);
      h.dataset.d = String(q);
      h.textContent = ["", "✓", "✗"][q];
      h.setAttribute("aria-label", k.ad + " " + tarihMetin(d) + ": " + ["boş", "istiyor", "istemiyor"][q]);
    };
    const uygula = (d, q) => {
      if (istekDurum(k, d) === q) return false;
      istekYaz(k, d, q);
      hcCiz(d);
      return true;
    };
    ad.onclick = () => {
      const hedef = tumMu() ? 0 : 2;
      for (let d = 1; d <= G; d++) if (hedef === 2 || istekDurum(k, d) === 2) uygula(d, hedef);
      topYaz();
      istekBitti();
    };
    for (let d = 1; d <= G; d++) {
      const td = el("td");
      isaret(td, d);
      const h = el("button", { type: "button", className: "hc" });
      hcler[d] = h;
      hcCiz(d);
      h.onclick = e => {
        if (e.detail !== 0) return;
        uygula(d, (istekDurum(k, d) + 1) % 3);
        topYaz();
        istekBitti();
      };
      h.onmousedown = e => {
        const hedef = e.button === 2 ? 2 : e.button === 0 ? 1 : -1;
        if (hedef < 0) return;
        e.preventDefault();
        h.focus();
        const q = istekDurum(k, d) === hedef ? 0 : hedef;
        if (SOLCTRL) {
          const w = MOTOR.haftaGunu(V, d);
          for (let x = 1; x <= G; x++) if (MOTOR.haftaGunu(V, x) === w) uygula(x, q);
          topYaz();
          istekBitti();
          return;
        }
        BOYA = q;
        if (uygula(d, BOYA)) BOYA_DEGISTI = true;
        topYaz();
      };
      h.onmouseenter = () => {
        if (BOYA === null) return;
        if (uygula(d, BOYA)) BOYA_DEGISTI = true;
        topYaz();
      };
      td.append(h);
      tr.append(td);
    }
    topYaz();
    tr.append(top);
    t.append(tr);
  });
  kap.append(t);
  p.append(kap);
  const ileri = el("button", { type: "button", className: "dgm dgm-birincil", id: "btnOzelSonraki", textContent: "Sonraki: Özel Talepler" });
  ileri.onclick = () => sekme("ozel");
  const sifir = el("button", { type: "button", className: "dgm dgm-sil", id: "btnIstekSifir", textContent: "Tüm İstekleri Sıfırla" });
  let onay = null;
  sifir.onclick = () => {
    if (!V.kisiler.some(k => (k.istiyor || []).length || (k.istemiyor || []).length || (k.izin || []).length)) { toast("Bu ay silinecek istek yok.", "info"); return; }
    if (!onay) {
      sifir.textContent = "Emin misin? Bir daha bas";
      onay = setTimeout(() => { onay = null; sifir.textContent = "Tüm İstekleri Sıfırla"; }, 3000);
      return;
    }
    clearTimeout(onay);
    onay = null;
    V.kisiler.forEach(k => { k.istiyor = []; k.istemiyor = []; k.izin = []; });
    degisti();
    istekCiz();
    toast("Bu ayın bütün istekleri sıfırlandı.", "info");
  };
  p.append(satir(ileri, sifir));
  p.append(yardim("Sol tık ✓ istiyor, sağ tık ✗ istemiyor; aynı tık bir daha basılırsa kutu boşalır. Basılı tutup sürüklersen geçtiğin kutular aynı şekilde boyanır. Sol Ctrl basılıyken tıklarsan o kişinin aynı haftagünlerinin hepsi birden değişir. En az istekte bulunanın isteği önceliklidir."));
}

function ozelCiz() {
  const p = $("#p-ozel");
  p.replaceChildren();
  p.append(baslik("Özel Talepler: " + AYLAR[V.ay - 1] + " " + V.yil));
  p.append(yardim("Örnek: şu kişilere en az 1 Perşembe, şunlara en az 1 Cuma. Gün seç, sayıyı ayarla, kişilerin adına tıkla."));
  const degis = () => { degisti(); ozelCiz(); };
  const liste = el("div", { className: "kart-liste" });
  V.ozel.forEach((r, i) => {
    const k = el("div", { className: "kart" });
    k.dataset.kapali = r.acik === false ? "1" : "0";
    const ust = satir(
      anahtar(r.acik !== false, "", v => { r.acik = v; degis(); }),
      el("span", { className: "etiket", textContent: "En az" }),
      sayac(r.enAz || 1, 1, 6, (i + 1) + ". talep en az", v => { r.enAz = v; degis(); }),
      gunSecici(r.gun, (i + 1) + ". talep günü", v => { r.gun = v; degis(); }),
      el("span", { className: "etiket", textContent: r.kisiler.length + " kişi" })
    );
    const sil = el("button", { type: "button", className: "dgm dgm-sil", textContent: "Sil" });
    sil.onclick = () => { V.ozel.splice(i, 1); degis(); };
    ust.append(el("span", { className: "bosluk" }), sil);
    k.append(ust);
    const c = el("div", { className: "cipler" });
    V.kisiler.forEach(q => {
      const b = el("button", { type: "button", className: "cip", textContent: q.ad });
      b.setAttribute("aria-pressed", String(r.kisiler.includes(q.ad)));
      b.onclick = () => { r.kisiler = r.kisiler.includes(q.ad) ? r.kisiler.filter(x => x !== q.ad) : r.kisiler.concat(q.ad); degis(); };
      c.append(b);
    });
    k.append(c);
    liste.append(k);
  });
  if (!V.ozel.length) liste.append(yardim("Bu ay için özel talep yok."));
  p.append(liste);
  const ekle = el("button", { type: "button", className: "dgm", textContent: "Talep Ekle" });
  ekle.onclick = () => { V.ozel.push({ gun: 4, enAz: 1, kisiler: [], acik: true }); degis(); };
  const kop = el("button", { type: "button", className: "dgm", textContent: "Önceki Aydan Kopyala" });
  kop.onclick = () => {
    const t = new Date(V.yil, V.ay - 2, 1);
    const pk = oku(ayAnahtar(t.getFullYear(), t.getMonth() + 1));
    const ad = new Set(V.kisiler.map(q => q.ad));
    const yeni = ((pk && pk.ozel) || []).map(r => Object.assign(kopya(r), { kisiler: (r.kisiler || []).filter(x => ad.has(x)) }));
    if (!yeni.length) return toast(AYLAR[t.getMonth()] + " ayında özel talep yok.", "warning");
    V.ozel = V.ozel.concat(yeni);
    degis();
    toast(yeni.length + " talep kopyalandı.", "success");
  };
  const ileri = el("button", { type: "button", className: "dgm dgm-birincil", id: "btnOzelOlustur", textContent: "Sonraki: Listeyi Oluştur" });
  ileri.onclick = () => uret(true);
  p.append(satir(ekle, kop, el("span", { className: "bosluk" }), ileri));
}

function kuralCiz() {
  const p = $("#p-kural");
  p.replaceChildren();
  const K = V.kural;
  const degis = () => { V.kural = MOTOR.kuralNorm(K, V.kisiler); degisti(); kuralCiz(); };
  p.append(baslik("Kurallar"));
  const ag = el("select", { className: "tk-input ince" });
  ag.setAttribute("aria-label", "Gün ağırlığı");
  [["puan", "Ödeme Puanına Göre (Cum 2, Cmt 3, Paz 2, diğer 1)"], ["esit", "Tüm Günler Eşit"]].forEach(([v, m]) => ag.append(el("option", { value: v, textContent: m, selected: K.odemeModu === v })));
  ag.onchange = () => { K.odemeModu = ag.value; degis(); };
  p.append(satir(
    anahtar(K.ardArda, "Art Arda Nöbet Yasak", v => { K.ardArda = v; degis(); }),
    anahtar(V.zorunlu, "İstekler Zorunlu", v => { V.zorunlu = v; degisti(); kuralCiz(); }),
    el("span", { className: "etiket", textContent: "Gün Ağırlığı" }), ag
  ));
  p.append(baslik("Bu Günden Sonra Boş Kalsın", "h3"));
  const t = el("table", { className: "tablo" });
  const b = el("tr");
  ["Durum", "Nöbet Günü", "Boş Kalacak Günler", "Hangi Haftalar", "Kesin", ""].forEach(m => b.append(el("th", { scope: "col", textContent: m })));
  t.append(b);
  const td = (...x) => { const c = el("td"); c.append(...x); return c; };
  K.sonraBos.forEach((r, i) => {
    const tr = el("tr");
    const bos = el("div", { className: "cipler" });
    for (let o = 1; o <= 6; o++) {
      const w = (r.gun + o) % 7;
      bos.append(kutu(r.bos.includes(w), MOTOR.KISA[w], v => { r.bos = v ? [...r.bos, w] : r.bos.filter(x => x !== w); degis(); }));
    }
    const ks = el("select", { className: "tk-input ince" });
    ks.setAttribute("aria-label", (i + 1) + ". kural kapsamı");
    [["hepsi", "Her " + MOTOR.GUN[r.gun]], ["ilk", "Yalnız ayın ilk " + MOTOR.GUN[r.gun] + " günü"], ["son", "Yalnız ayın son " + MOTOR.GUN[r.gun] + " günü"]].forEach(([v, m]) => ks.append(el("option", { value: v, textContent: m, selected: r.kapsam === v })));
    ks.onchange = () => { r.kapsam = ks.value; degis(); };
    const sil = el("button", { type: "button", className: "dgm dgm-sil", textContent: "Sil" });
    sil.onclick = () => { K.sonraBos.splice(i, 1); degis(); };
    tr.append(
      td(anahtar(r.acik, "", v => { r.acik = v; degis(); })),
      td(gunSecici(r.gun, (i + 1) + ". kural günü", v => { r.gun = v; r.bos = []; degis(); })),
      td(bos), td(ks),
      td(kutu(r.kesin, "Kesin", v => { r.kesin = v; degis(); })),
      td(sil)
    );
    t.append(tr);
  });
  p.append(t);
  const ekle = el("button", { type: "button", className: "dgm", textContent: "Kural Ekle" });
  ekle.onclick = () => { K.sonraBos.push({ gun: 4, bos: [5, 6, 0], kapsam: "hepsi", kesin: false, acik: true }); degis(); };
  const varsay = el("button", { type: "button", className: "dgm", textContent: "Varsayılana Dön" });
  varsay.onclick = () => { Object.assign(K, { ardArda: MOTOR.KURAL.ardArda, odemeModu: MOTOR.KURAL.odemeModu, sonraBos: kopya(MOTOR.KURAL.sonraBos) }); degis(); };
  p.append(satir(ekle, varsay));
  p.append(yardim("Örnek: Perşembe → Cum, Cmt, Paz işaretliyse perşembe nöbetçisinin o hafta sonu boş kalır. Kesin işaretli değilse kural güçlü bir tercihtir, gerekirse çiğnenir ve Sorunlar'da yazar. Gruplar ve aynı gün kuralları İleri Seviye'de."));
}

function ileriCiz() {
  const p = $("#p-ileri");
  p.replaceChildren();
  const K = V.kural;
  const degis = () => { V.kural = MOTOR.kuralNorm(K, V.kisiler); degisti(); ileriCiz(); };
  p.append(baslik("İleri Seviye Kurallar"));
  p.append(yardim("Çömezler gibi gruplar kur; aynı güne en fazla kaç kişisinin yazılacağını ve gruplar arasında aynı gün olsun ya da olmasın kurallarını belirle."));
  p.append(baslik("Gruplar", "h3"));
  const liste = el("div", { className: "kart-liste" });
  K.gruplar.forEach((g, i) => {
    const k = el("div", { className: "kart" });
    k.dataset.kapali = g.acik ? "0" : "1";
    const ad = el("input", { className: "tk-input ince", type: "text", value: g.ad });
    ad.setAttribute("aria-label", (i + 1) + ". grubun adı");
    ad.onchange = () => { g.ad = ad.value.trim() || "Grup " + (i + 1); degis(); };
    const sinirli = g.enFazla !== null;
    const sil = el("button", { type: "button", className: "dgm dgm-sil", textContent: "Sil" });
    sil.onclick = () => { K.gruplar.splice(i, 1); degis(); };
    const ust = satir(
      ad,
      anahtar(g.acik, "", v => { g.acik = v; degis(); }),
      kutu(sinirli, "Aynı gün en fazla", v => { g.enFazla = v ? 1 : null; degis(); })
    );
    if (sinirli) ust.append(sayac(g.enFazla, 0, 12, g.ad + " aynı gün en fazla", v => { g.enFazla = v; degis(); }));
    ust.append(kutu(g.kesin, "Kesin", v => { g.kesin = v; degis(); }), el("span", { className: "bosluk" }), sil);
    k.append(ust);
    const iki2 = el("div", { className: "iki-liste" });
    const uy = el("div"), dg = el("div");
    uy.append(el("h3", { textContent: "Üyeler (" + g.uyeler.length + ")" }));
    dg.append(el("h3", { textContent: "Diğerleri" }));
    const cu = el("div", { className: "cipler" }), cd = el("div", { className: "cipler" });
    V.kisiler.forEach(q => {
      const uye = g.uyeler.includes(q.ad);
      const b = el("button", { type: "button", className: "cip", textContent: q.ad });
      b.setAttribute("aria-pressed", String(uye));
      b.title = uye ? "Gruptan çıkar" : "Gruba ekle";
      b.onclick = () => { g.uyeler = uye ? g.uyeler.filter(x => x !== q.ad) : g.uyeler.concat(q.ad); degis(); };
      (uye ? cu : cd).append(b);
    });
    uy.append(cu);
    dg.append(cd);
    iki2.append(uy, dg);
    k.append(iki2);
    liste.append(k);
  });
  if (!K.gruplar.length) liste.append(yardim("Henüz grup yok."));
  p.append(liste);
  const gEkle = el("button", { type: "button", className: "dgm", textContent: "Grup Ekle" });
  gEkle.onclick = () => {
    const id = "g" + Date.now().toString(36);
    K.gruplar.push({ id, ad: "Grup " + (K.gruplar.length + 1), uyeler: [], enFazla: 1, kesin: false, acik: true });
    degis();
  };
  p.append(satir(gEkle));
  p.append(baslik("Aynı Gün Kuralları", "h3"));
  if (!K.gruplar.length) p.append(yardim("Kural eklemek için önce bir grup kur."));
  else {
    const t = el("table", { className: "tablo" });
    const b = el("tr");
    ["Durum", "Grup", "Kural", "Grup", "Kesin", ""].forEach(m => b.append(el("th", { scope: "col", textContent: m })));
    t.append(b);
    const td = (...x) => { const c = el("td"); c.append(...x); return c; };
    const grupSec = (v, e, f) => {
      const s = el("select", { className: "tk-input ince" });
      s.setAttribute("aria-label", e);
      K.gruplar.forEach(g => s.append(el("option", { value: g.id, textContent: g.ad, selected: g.id === v })));
      s.onchange = () => f(s.value);
      return s;
    };
    K.iliski.forEach((r, i) => {
      const tr = el("tr");
      const tur = el("select", { className: "tk-input ince" });
      tur.setAttribute("aria-label", (i + 1) + ". kural türü");
      [["ayri", "aynı gün olmasın"], ["birlikte", "aynı gün olsun"]].forEach(([v, m]) => tur.append(el("option", { value: v, textContent: m, selected: r.tur === v })));
      tur.onchange = () => { r.tur = tur.value; degis(); };
      const sil = el("button", { type: "button", className: "dgm dgm-sil", textContent: "Sil" });
      sil.onclick = () => { K.iliski.splice(i, 1); degis(); };
      tr.append(
        td(anahtar(r.acik, "", v => { r.acik = v; degis(); })),
        td(grupSec(r.a, (i + 1) + ". kural birinci grup", v => { r.a = v; degis(); })),
        td(tur),
        td(grupSec(r.b, (i + 1) + ". kural ikinci grup", v => { r.b = v; degis(); })),
        td(kutu(r.kesin, "Kesin", v => { r.kesin = v; degis(); })),
        td(sil)
      );
      t.append(tr);
    });
    p.append(t);
    const iEkle = el("button", { type: "button", className: "dgm", textContent: "Kural Ekle" });
    iEkle.onclick = () => {
      const a = K.gruplar[0].id, b2 = (K.gruplar[1] || K.gruplar[0]).id;
      K.iliski.push({ a, b: b2, tur: "ayri", kesin: false, acik: true });
      degis();
    };
    p.append(satir(iEkle));
    p.append(yardim("Aynı grup iki tarafta seçilirse: aynı gün olmasın, o grubun üyeleri aynı güne yazılmasın demek. Kesin işaretli değilse güçlü bir tercihtir."));
  }
}

function yenidenKur(m) {
  V.gecmis = gecmisHesapla(V.yil, V.ay);
  if (L) ESKI = true;
  sakla();
  gecmisCiz();
  ceteleCiz();
  analizCiz();
  ayPanelCiz();
  durumCiz();
  if (m) toast(m);
  yol("#btnUret");
}

function gecmisCiz() {
  const p = $("#p-gecmis");
  p.replaceChildren();
  p.append(baslik("Geçmiş Verileri İncele"));
  p.append(yardim("Önceki aylarda hakkından fazla ya da eksik tutulan nöbetler bu aya yansır. Yalnız Katılıyor yapılan aylar sayılır. Kayıtlı listesi olmayan ayı Elle Ay Ekle ile çetele gibi gir."));
  const iki2 = el("div", { className: "gecmis-iki" });
  const sol = el("div", { className: "ay-liste" });
  const ozet = el("div", { className: "ay-satir" });
  ozet.setAttribute("aria-current", String(GSEC === null));
  const ob = el("button", { type: "button", className: "dgm", textContent: "Bu Aya Yansıyan" });
  ob.onclick = () => { GSEC = null; gecmisCiz(); };
  ozet.append(ob);
  sol.append(ozet);
  GD.aylar.forEach(m => {
    const s = el("div", { className: "ay-satir" });
    s.setAttribute("aria-current", String(GSEC === m.k));
    const b = el("button", { type: "button", className: "dgm" });
    b.append(ayKisa(m.k), el("span", { className: "ay-tur", textContent: m.tur === "elle" ? "elle" : "kayıtlı" }));
    b.onclick = () => { GSEC = m.k; gecmisCiz(); };
    const d = el("button", { type: "button", className: "dgm", textContent: m.dahil ? "Katılıyor" : "Katılmıyor" });
    d.setAttribute("aria-pressed", String(m.dahil));
    d.setAttribute("aria-label", ayKisa(m.k) + " geçmişe " + (m.dahil ? "katılıyor" : "katılmıyor"));
    d.onclick = () => { GA.aylar[m.k] = !m.dahil; gecmisAyarYaz(); yenidenKur(); };
    s.append(b, d);
    sol.append(s);
  });
  if (!GD.aylar.length) sol.append(yardim("Önceki aylarda kayıt yok."));
  const sec = el("select", { className: "tk-input ince" });
  sec.setAttribute("aria-label", "Elle eklenecek ay");
  let py = V.yil, pa = V.ay;
  for (let i = 0; i < 24; i++) {
    pa--;
    if (pa < 1) { pa = 12; py--; }
    const ak = ayKod(py, pa);
    if (!GA.manuel[ak]) sec.append(el("option", { value: ak, textContent: ayKisa(ak) }));
  }
  const ekle = el("button", { type: "button", className: "dgm", textContent: "Elle Ay Ekle" });
  ekle.onclick = () => {
    const ak = sec.value;
    if (!ak) return;
    const kisiler = {};
    V.kisiler.forEach(k => { kisiler[k.ad] = { hg: [0, 0, 0, 0, 0, 0, 0], hn: k.nobet, hp: k.odeme }; });
    GA.manuel[ak] = { kisiler };
    GA.aylar[ak] = true;
    GSEC = ak;
    gecmisAyarYaz();
    yenidenKur();
  };
  sol.append(satir(sec, ekle));
  if (Object.keys(GA.elle).length) {
    const sifir = el("button", { type: "button", className: "dgm dgm-sil", textContent: "Eski Toplamı Temizle" });
    sifir.onclick = () => { GA.elle = {}; gecmisAyarYaz(); yenidenKur("Eski toplam temizlendi."); };
    sol.append(yardim("Eski sürümden kalan elle toplam geçmiş de hesaba katılıyor."), satir(sifir));
  }
  const sag = el("div", { className: "gecmis-detay" });
  if (GSEC === null || !GD.detay[GSEC]) gecmisOzet(sag);
  else if (GA.manuel[GSEC]) gecmisElle(sag, GSEC);
  else gecmisKayit(sag, GSEC);
  iki2.append(sol, sag);
  p.append(iki2);
}

function gecmisOzet(sag) {
  sag.append(baslik("Bu Aya Yansıyan Geçmiş", "h3"));
  const t = el("table", { className: "tablo" });
  const b = el("tr");
  ["Ad", "Nöbet Farkı", "Puan Farkı", "Etkisi"].forEach(m => b.append(el("th", { scope: "col", textContent: m })));
  t.append(b);
  V.kisiler.forEach(k => {
    const g = V.gecmis && V.gecmis[k.ad];
    const tr = el("tr");
    const n = el("td", { textContent: g ? isr(g.n) : "0" });
    n.dataset.kotu = g && Math.abs(g.n) >= 1 ? "1" : "0";
    tr.append(el("td", { className: "ad", textContent: k.ad }), n, el("td", { textContent: g ? isr(g.p) : "0" }), el("td", { textContent: g ? (g.n > 0.05 ? "fazla tuttu, bu ay azalır" : g.n < -0.05 ? "eksik tuttu, bu ay artar" : "dengede") : "geçmiş yok" }));
    t.append(tr);
  });
  sag.append(t);
}

function gecmisKayit(sag, ak) {
  const dt = GD.detay[ak];
  const [y, a] = ak.split("-").map(Number);
  sag.append(baslik(ayKisa(ak) + " Çetelesi", "h3"));
  const rows = Object.entries(dt).map(([ad, x]) => ({ ad, hg: x.hg || [0, 0, 0, 0, 0, 0, 0], n: x.n, p: x.p, gec: isr(x.n - x.hn) + " / " + isr(x.p - x.hp) }));
  const kap = el("div", { className: "istek-kap" });
  kap.append(ceteleTablo(rows, true));
  sag.append(kap, yardim("Son sütun o ay hakkına göre fark: + fazla, − eksik."));
  const ka = kayitliAy(y, a);
  if (!ka) return;
  sag.append(baslik(ayKisa(ak) + " Listesi", "h3"));
  const t = el("table", { className: "tablo" });
  const G = new Date(y, a, 0).getDate();
  for (let d = 1; d <= G; d++) {
    const w = new Date(y, a - 1, d).getDay();
    const tr = el("tr");
    tr.append(el("td", { textContent: d + "." + iki(a) }), el("td", { textContent: MOTOR.GUN[w] }), el("td", { textContent: (ka.pk.liste[d] || []).map(p => ka.pk.kisiler[p] && ka.pk.kisiler[p].ad).filter(Boolean).join(", ") }));
    t.append(tr);
  }
  const k2 = el("div", { className: "istek-kap" });
  k2.append(t);
  sag.append(k2);
}

function gecmisElle(sag, ak) {
  const man = GA.manuel[ak];
  sag.append(baslik(ayKisa(ak) + " · Elle Çetele", "h3"));
  sag.append(yardim("Kâğıttaki çetele gibi her gün için tutulan nöbet sayısını yaz. Hak: o ay tutması gereken nöbet / ödeme puanı."));
  const t = el("table", { className: "tablo cetele" });
  const b = el("tr");
  b.append(el("th", { scope: "col", textContent: "Ad" }));
  CETELE_AD.forEach((m, i) => { const th = el("th", { scope: "col", textContent: m }); if (i >= 5) th.className = "hs"; b.append(th); });
  ["NÖBET", "HAK", "FARK"].forEach(m => b.append(el("th", { scope: "col", textContent: m })));
  t.append(b);
  const adlar = [...new Set(V.kisiler.map(k => k.ad).concat(Object.keys(man.kisiler || {})))];
  const guncel = () => { gecmisAyarYaz(); V.gecmis = gecmisHesapla(V.yil, V.ay); if (L) ESKI = true; sakla(); ceteleCiz(); analizCiz(); durumCiz(); ayPanelCiz(); };
  adlar.forEach(ad => {
    const kk = V.kisiler.find(k => k.ad === ad);
    const x = man.kisiler[ad] || (man.kisiler[ad] = { hg: [0, 0, 0, 0, 0, 0, 0], hn: kk ? kk.nobet : 0, hp: kk ? kk.odeme : 0 });
    const tr = el("tr");
    tr.append(el("td", { className: "ad", textContent: ad }));
    const np = el("td", { className: "np" });
    const fark = el("td", { className: "gec" });
    const yaz = () => {
      const n = hgTop(x.hg), p = hgPuan(x.hg);
      np.textContent = n + "/" + p;
      fark.textContent = isr(n - x.hn) + " / " + isr(p - x.hp);
    };
    const giris = (v, e, f) => {
      const i = el("input", { className: "tk-input ince dar", type: "number", min: "0", step: "1", value: v });
      i.setAttribute("aria-label", ad + " " + e);
      i.onchange = () => { f(Math.max(0, +i.value || 0)); i.value = String(Math.max(0, +i.value || 0)); yaz(); guncel(); };
      const td = el("td");
      td.append(i);
      return td;
    };
    for (let g = 0; g < 7; g++) {
      const td = giris(x.hg[g] || 0, CETELE_AD[g].toLocaleLowerCase("tr"), v => { x.hg[g] = v; });
      if (g >= 5) td.className = "hs";
      tr.append(td);
    }
    tr.append(np);
    const hak = el("td");
    hak.className = "np";
    const hn = giris(x.hn, "hak nöbet", v => { x.hn = v; }).firstChild;
    const hp = giris(x.hp, "hak puan", v => { x.hp = v; }).firstChild;
    hak.append(hn, " / ", hp);
    tr.append(hak, fark);
    yaz();
    t.append(tr);
  });
  const kap = el("div", { className: "istek-kap" });
  kap.append(t);
  sag.append(kap);
  const sil = el("button", { type: "button", className: "dgm dgm-sil", textContent: "Bu Elle Ayı Sil" });
  sil.onclick = () => { delete GA.manuel[ak]; delete GA.aylar[ak]; GSEC = null; gecmisAyarYaz(); yenidenKur(ayKisa(ak) + " elle kaydı silindi."); };
  sag.append(satir(sil));
}

function genelCiz() {
  const p = $("#p-genel");
  p.replaceChildren();
  p.append(baslik("Genel"));
  const l = el("div", { className: "ayar-liste" });
  const sat = (bas, ac, kontrol) => {
    const s = el("div", { className: "ayar-sat" });
    const sol = el("div");
    sol.append(el("strong", { textContent: bas }), yardim(ac));
    s.append(sol, kontrol);
    l.append(s);
  };
  sat("Güncellemeden Önce Sor", "Açıkken yeni sürüm bulununca kurmadan önce sorar; kapalıyken kendiliğinden kurar.",
    anahtar(AYAR.onayIste, "", v => { ayarYaz({ onayIste: v }); genelCiz(); }));
  sat("Yeşil Yol", "Sıradaki adımı 2 saniyelik yeşil bir çerçeveyle gösterir.",
    anahtar(AYAR.yesilYol, "", v => { ayarYaz({ yesilYol: v }); if (!v) yolTemizle(); genelCiz(); }));
  sat("Rehber", "Listeyi Oluştur'a ilk basışta önce Özel Talepler'e yönlendirir.",
    anahtar(AYAR.rehber, "", v => { ayarYaz({ rehber: v, rehberSoruldu: true }); $("#rehberBar").hidden = true; genelCiz(); }));
  sat("Resmi Tatilleri Say", "Açıkken resmi tatiller Pazar gibi sayılır (ödeme puanı 2). 100 yıllık takvim programın içinde.",
    anahtar(AYAR.resmiTatil, "", v => { ayarYaz({ resmiTatil: v }); V.tatil = v ? TATIL.tamGunler(V.yil, V.ay) : []; degisti(); genelCiz(); ciz(); }));
  sat("Alternatif Sayısı", "Kaç farklı liste denenip en iyisinin seçileceği. 300 çoğu ay için yeterli; 500 biraz daha adil, daha yavaş.",
    sayac(AYAR.altSay, 30, 500, "Alternatif sayısı", v => { ayarYaz({ altSay: v }); genelCiz(); }, ALT_ADIM));
  sat("İstek Dengesi", "Son 3 ayda çok istekte bulunanın isteği biraz daha az, az bulunanınki biraz daha çok önemsenir. Etki ±%20 ile sınırlı, birikmez. Varsayılan kapalı.",
    anahtar(V.kural.istekDenge, "", v => { V.kural.istekDenge = v; V.kural = MOTOR.kuralNorm(V.kural, V.kisiler); degisti(); genelCiz(); }));
  p.append(l);
}

const puan = (c, en) => Math.round(1000 * Math.max(en, 1e-9) / Math.max(c, 1e-9));
let ONIZ = null;

function onizle(i) {
  if (CALISIYOR || !ALT.length) return;
  if (i === ONIZ) return;
  ONIZ = i;
  const var1 = i !== null && i !== SEC && ALT[i];
  listeDoldur(var1 ? ALT[i].liste : L, !!var1);
  $("#listePnl").dataset.oniz = var1 ? "1" : "0";
  $("#onizYazi").textContent = var1 ? "Önizleme: " + (i + 1) + ". alternatif, " + puan(ALT[i].maliyet, ALT[0].maliyet) + " puan. Seçmek için tıkla." : "";
}

function altCiz() {
  const p = $("#p-alt");
  p.replaceChildren();
  p.append(baslik("Alternatifler"));
  if (!ALT.length) { p.append(yardim("Henüz alternatif yok. Listeyi Oluştur'a bas.")); return; }
  const en = Math.min(...ALT.map(x => x.maliyet));
  p.append(yardim(ALTTOPLAM + " alternatif denendi, en iyi " + ALT.length + " tanesi 1000 üzerinden puanla sıralandı. Seçili: " + (SEC + 1) + ". Üstüne gelince soldaki listede önizlenir, tıklarsan seçilir."));
  const ul = el("div", { className: "alt-liste", role: "list" });
  ALT.forEach((x, i) => {
    const b = el("button", { type: "button", className: "alt-satir", role: "listitem" });
    b.setAttribute("aria-current", String(i === SEC));
    b.append(el("span", { className: "alt-no", textContent: String(i + 1) }));
    const iz = el("span", { className: "alt-iz" });
    const dolgu = el("span", { className: "alt-dolgu" });
    const pu = puan(x.maliyet, en);
    dolgu.style.transform = "scaleX(" + Math.max(0.04, pu / 1000) + ")";
    iz.append(dolgu);
    b.append(iz, el("span", { className: "alt-puan", textContent: String(pu) }));
    b.setAttribute("aria-label", (i + 1) + ". alternatif, puan " + pu + " / 1000" + (i === SEC ? ", seçili" : ""));
    b.onclick = () => { if (CALISIYOR) return; ONIZ = null; SEC = i; L = kopya(x.liste); ESKI = false; sakla(); ciz(); onizle(null); };
    b.onmouseenter = b.onfocus = () => onizle(i);
    b.onmouseleave = b.onblur = () => onizle(null);
    ul.append(b);
  });
  p.append(ul);
}

function hakkindaCiz() {
  const p = $("#p-hakkinda");
  p.replaceChildren();
  const k = el("article", { className: "hakkinda" });
  k.append(el("h2", { className: "hakkinda-baslik", textContent: "Ameliyathane HemşireNöbet" }));
  const iz = el("div", { className: "hakkinda-izgara" });
  [
    ["r1", "Ne yapar:", "Aylık nöbet listesini kendisi hazırlar. Herkesin nöbet ve ödeme puanı hedefine, isteklerine ve kurallara uyar; yüzlerce alternatif dener, en adilini seçer."],
    ["r2", "Kullanım:", "Üstten ayı seç. 1 İstekler'de ✓ ve ✗ işaretle, 2 Özel Talepler'de en az şu kadar Perşembe gibi talepleri ekle, sonra Listeyi Oluştur'a bas. Liste yalnız bu düğmeyle oluşur."],
    ["r3", "İstekler:", "Sol tık ✓ istiyor, sağ tık ✗ istemiyor. Basılı sürükleyerek boya. Sol Ctrl + tık o haftagününün tamamını değiştirir. İsme tıklamak bütün ayı ✗ yapar."],
    ["r1", "Çetele:", "Liste sekmesinde listenin yanında herkesin Pazartesi'den Pazar'a nöbet sayısı, nöbet / puan ve geçmiş farkı görünür."],
    ["r2", "Geçmiş:", "Önceki aylarda fazla ya da eksik tutulan nöbetler bu aya yansır. Ayarlar › Geçmiş'te ayları kat ya da çıkar, kâğıttaki çeteleyi elle gir."],
    ["r3", "Yardım:", "Sağ Ctrl tuşunu basılı tut: farenin altındaki bölümün ne işe yaradığı ve şu anki adımda ne yapman gerektiği küçük bir kutuda çıkar."],
    ["r1", "Yeşil Yol:", "Sıradaki adım 2 saniyelik yeşil bir çerçeveyle gösterilir. Ayarlar › Genel'den kapatılabilir."],
    ["r2", "İleri Seviye:", "Çömezler gibi gruplar kur; aynı gün en fazla kaç kişi, hangi gruplar aynı gün olsun ya da olmasın belirle."],
    ["r3", "Veriler:", "Programın yanındaki veri klasöründe durur, internete gönderilmez. Güncellemeler başlıktaki sürüm düğmesinden denetlenir."]
  ].forEach(([c, b, m]) => {
    const x = el("p");
    x.append(el("strong", { className: c, textContent: b }), m);
    iz.append(x);
  });
  k.append(iz);
  const imza = el("p", { className: "hakkinda-imza" });
  const a = el("button", { type: "button", className: "dgm", textContent: "github.com/Teknesyum" });
  a.onclick = () => W.ac("https://github.com/Teknesyum");
  const sv = $("#basbarSurum").textContent.replace(/^v/, "");
  imza.append(el("span", { textContent: "Teknesyum tarafından geliştirildi" }), el("span", { id: "hakSurum", textContent: sv ? "Sürüm " + sv : "" }), a);
  k.append(imza);
  p.append(k);
}

const ANA = { hazir: ["istek", "ozel", "liste", "alt", "analiz", "sorun"], ayar: ["kadro", "kural", "ileri", "gecmis", "genel", "hakkinda"] };
const SON_ALT = { hazir: "istek", ayar: "kadro" };
const anaBul = ad => (ANA.hazir.includes(ad) ? "hazir" : "ayar");

function sekme(ad) {
  const ana = anaBul(ad);
  AKTIF = ad;
  SON_ALT[ana] = ad;
  if (ad === "ozel") OZEL_GORULDU = true;
  ["hazir", "ayar"].forEach(a => {
    const b = $("#ana-" + a);
    b.setAttribute("aria-selected", String(a === ana));
    b.tabIndex = a === ana ? 0 : -1;
  });
  ANA.hazir.concat(ANA.ayar).forEach(s => {
    const a = s === ad;
    const b = $("#sk-" + s);
    b.hidden = anaBul(s) !== ana;
    b.setAttribute("aria-selected", String(a));
    b.tabIndex = a ? 0 : -1;
    $("#p-" + s).hidden = !a;
  });
  $("#govde").dataset.mod = ad === "liste" || ad === "alt" ? "yan" : "tek";
  if (ad === "ozel") yol("#btnOzelOlustur");
}

function sekmeKur() {
  ["hazir", "ayar"].forEach((a, i, dizi) => {
    const b = $("#ana-" + a);
    b.onclick = () => sekme(SON_ALT[a]);
    b.onkeydown = e => {
      const n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: dizi.length - 1 }[e.key];
      if (n === undefined) return;
      e.preventDefault();
      const x = dizi[(n + dizi.length) % dizi.length];
      sekme(SON_ALT[x]);
      $("#ana-" + x).focus();
    };
  });
  Object.values(ANA).forEach(dizi => dizi.forEach((s, i) => {
    const b = $("#sk-" + s);
    b.onclick = () => sekme(s);
    b.onkeydown = e => {
      const n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: dizi.length - 1 }[e.key];
      if (n === undefined) return;
      e.preventDefault();
      const x = dizi[(n + dizi.length) % dizi.length];
      sekme(x);
      $("#sk-" + x).focus();
    };
  }));
}

const YARDIM = [
  [".gecmis-cizgi", "Elle Girilen Geçmiş", "Elle girilen geçmiş olduğunu gösterir. Tıklayınca Geçmiş açılır."],
  [".ay-dgm", "Ay", "Tıkla: o aya geç. Altı çizgili ayın kaydı var; yeşil çizgili ay geçmiş hesabına katılır. Sağ tık: geçmişe kat ya da çıkar. Ay değiştirmek liste oluşturmaz."],
  ["#yilGeri, #yilIleri, #yilYazi", "Yıl", "Önceki ya da sonraki yıla geçer."],
  ["#kisiAlan", "Günlük Kişi", "Her gün kaç hemşirenin nöbet tutacağı. Değişince listeyi yeniden oluştur."],
  ["#btnUret", "Listeyi Oluştur", "Alternatifleri dener, en adilini seçer. Çalışırken basarsan durur."],
  ["#durum", "Durum", "Listenin kurallara uyup uymadığı. Ayrıntı Sorunlar sekmesinde."],
  ["#ilerleme", "İlerleme", "Kaç alternatifin denendiği ve kalan süre."],
  ["#btnKopya", "Excel'e Kopyala", "Listeyi panoya kopyalar, Excel'e yapıştırılır."],
  ["#btnCsv", "CSV Kaydet", "Listeyi CSV dosyası olarak kaydeder."],
  ["#btnYazdir", "Yazdır", "Yalnız listeyi yazdırır."],
  ["#liste", "Nöbet Listesi", "Ayın her günü ve nöbetçileri. Kutudan elle değiştirebilirsin; uyarı renkli kutu istemediği güne ya da art arda nöbete düşmüş demek. Pembe çerçeve: alternatif önizlemesi."],
  ["table.istek .ad-dgm", "İsim", "Tıkla: bütün ayı ✗ yap. Bir daha tıkla: geri al."],
  ["table.istek .hc", "İstek Kutusu", "Sol tık ✓, sağ tık ✗, aynı tık boşaltır. Sürükleyerek boya. Sol Ctrl + tık: o haftagününün tamamı."],
  ["#btnIstekSifir", "Tüm İstekleri Sıfırla", "Bu ayın bütün ✓ ve ✗ işaretlerini siler. Yanlışlıkla silinmesin diye iki kez basılır: ilk basışta düğme onay ister, 3 saniye içinde bir daha basarsan siler."],
  ["#btnOzelSonraki", "Sonraki: Özel Talepler", "İstekleri bitirdiysen bas; Özel Talepler sekmesine geçer."],
  ["#ipucuBar", "Rehber İpucu", "Sağ Ctrl bir kez basılı tutulunca kaybolur. Ayarlar › Genel'de rehber kapalıysa hiç çıkmaz."],
  ["#rehberDevam", "Rehberle Devam Et", "Sonraki aylarda da rehber yol gösterir: Listeyi Oluştur önce Özel Talepler'e yönlendirir."],
  ["#rehberKapat", "Rehberi Kapat", "Rehber yönlendirmeyi bırakır. Ayarlar › Genel'den yeniden açılabilir."],
  ["#rehberBar", "Rehber", "Rehberle devam edersen her ay önce Özel Talepler'e yönlendirilirsin."],
  ["#sk-istek, #p-istek", "1 · İstekler", "Kimin hangi gün nöbet istediği (✓) ya da istemediği (✗)."],
  ["#sk-ozel, #p-ozel", "2 · Özel Talepler", "Şu kişilere en az 1 Perşembe gibi talepler."],
  ["#sk-liste, #p-liste", "3 · Liste ve Çetele", "Oluşan liste ve herkesin haftagünlerine göre nöbet sayısı."],
  [".alt-satir", "Alternatif", "1000 üzerinden puan. Üstüne gel: önizle. Tıkla: seç."],
  ["#sk-alt, #p-alt", "4 · Alternatifler", "Denenen listelerin en iyileri."],
  ["#sk-analiz, #p-analiz", "Analiz", "Herkesin hedefe göre nöbet, puan ve gün dağılımı."],
  ["#sk-sorun, #p-sorun", "Sorunlar", "Kuralı çiğneyen ya da verilemeyen her şey."],
  ["#sk-kadro, #p-kadro", "Kadro", "Herkesin nöbet ve ödeme puanı payı."],
  ["#sk-kural, #p-kural", "Kurallar", "Art arda nöbet, perşembe sonrası boş günler, gün ağırlığı, isteklerin zorunluluğu."],
  ["#sk-ileri, #p-ileri", "İleri Seviye", "Gruplar ve aynı gün olsun / olmasın kuralları."],
  ["#sk-gecmis, #p-gecmis", "Geçmiş", "Önceki ayların çetelesi; hangi ayların hesaba katılacağı."],
  ["#sk-genel, #p-genel", "Genel", "Güncelleme, Yeşil Yol, rehber, resmi tatil, alternatif sayısı."],
  ["#sk-hakkinda, #p-hakkinda", "Hakkında", "Programın tanıtımı ve kullanımı."],
  ["#ana-hazir", "Liste Hazırlama", "İstekler, özel talepler, liste ve alternatifler."],
  ["#ana-ayar", "Ayarlar", "Kadro, kurallar, geçmiş ve genel ayarlar."],
  ["#basbarSurum", "Sürüm", "Güncellemeleri denetler."],
  ["#imza", "İmza", "Teknesyum GitHub sayfasını açar."],
  ["#destek", "Destek", "Geliştiriciyi destekleme sayfasını açar."],
  [".tk-titlebar", "Başlık Çubuğu", "Sürükleyerek taşı; çift tık büyütür."],
  [".ust", "Üst Bölüm", "Ay seçimi, günlük kişi sayısı ve Listeyi Oluştur düğmesi."]
];

const ADIM = {
  istek: "Bu bölümde istekler ve izinler girilir. Nöbet istenen günlere sol tıkla ✓, izinli ya da nöbet istenmeyen günlere sağ tıkla ✗ koy. Bitirince Sonraki: Özel Talepler düğmesine bas.",
  ozel: "Bu bölümde “şu kişilere en az 1 Perşembe” gibi talepler girilir. Gerekmiyorsa boş bırak. Bitirince Listeyi Oluştur'a bas.",
  liste: "Bu bölümde liste ve çetele görülür. Listeyi kontrol et, gerekirse kutudan elle değiştir. Bitirince Yazdır'a ya da Excel'e Kopyala'ya bas.",
  alt: "Bu bölümde denenen listelerin en iyileri sıralanır. Üstüne gelip önizle, beğendiğine tıklayıp seç, sonra Liste ve Çetele'ye dön.",
  analiz: "Bu bölümde herkesin nöbet ve puanı hedefle karşılaştırılır. Sapma büyükse Alternatifler'den başka bir liste seç.",
  sorun: "Bu bölümde kuralı çiğneyen nöbetler listelenir. Sorun yoksa yazdırmaya geç; varsa istekleri gevşetip Listeyi Oluştur'a bas.",
  kadro: "Bu bölümde hemşire adları ve nöbet payları girilir. Bitirince Liste Hazırlama › İstekler'e geç.",
  kural: "Bu bölümde nöbet kuralları ayarlanır. Bir kuralı değiştirdiysen Listeyi Oluştur'a basıp listeyi yenile.",
  ileri: "Bu bölümde gruplar kurulur. Grup Ekle'ye bas, gruptaki kişilerin adına tıkla, aynı gün olsun ya da olmasın kuralını seç.",
  gecmis: "Bu bölümde önceki ayların nöbetleri görülür. Hesaba katılacak ayları seç; o aylardaki fazlalık ve eksiklik yeni listede dengelenir.",
  genel: "Bu bölümde program ayarları yapılır. Her değişiklik hemen kaydedilir.",
  hakkinda: "Programın tanıtımı. Kullanmaya Liste Hazırlama › İstekler'den başla."
};

function simdiMetni() {
  if (CALISIYOR) return "Liste hazırlanıyor. Bitmesini bekle; vazgeçersen Listeyi Oluştur'a bir daha bas.";
  const listeTarafi = ["liste", "alt", "analiz", "sorun"].includes(AKTIF);
  if (listeTarafi && !L) return "Bu ay için henüz liste yok. İstekleri ve özel talepleri girdiysen Listeyi Oluştur'a bas.";
  if (listeTarafi && ESKI) return "Liste oluşturulduktan sonra istekler ya da ayarlar değişti; bu liste onları içermiyor. Yeni hâliyle görmek için Listeyi Oluştur'a bas.";
  return ADIM[AKTIF] || ADIM.istek;
}

(() => {
  const balon = $("#yardimBalon");
  let basili = false, mx = 0, my = 0;
  const goster = () => {
    const hedef = document.elementFromPoint(mx, my);
    let bul = null;
    for (let x = hedef; x && !bul; x = x.parentElement) bul = YARDIM.find(([s]) => x.matches && x.matches(s));
    if (!bul) bul = YARDIM.find(([s]) => s.split(", ")[0] === "#sk-" + AKTIF);
    const [, bas, metin] = bul;
    $("#yardimBaslik").textContent = bas;
    $("#yardimMetin").textContent = metin;
    $("#yardimSimdi").textContent = "Şimdi: " + simdiMetni();
    balon.hidden = false;
    const r = balon.getBoundingClientRect();
    const x = Math.min(innerWidth - r.width - 8, Math.max(8, mx + 16));
    const y = my + 20 + r.height > innerHeight ? Math.max(8, my - r.height - 12) : my + 20;
    balon.style.left = x + "px";
    balon.style.top = y + "px";
  };
  const kapat = () => { basili = false; balon.hidden = true; };
  document.addEventListener("mousemove", e => { mx = e.clientX; my = e.clientY; if (basili) goster(); }, true);
  document.addEventListener("keydown", e => {
    if (e.code === "ControlRight") {
      if (!basili) { basili = true; goster(); }
      if (!AYAR.yardimGoruldu) { ayarYaz({ yardimGoruldu: true }); $("#ipucuBar").hidden = true; }
      e.preventDefault();
      return;
    }
    if (e.code === "ControlLeft" && !SOLCTRL) { SOLCTRL = true; const t = $("table.istek"); if (t && t._vurgula) t._vurgula(); }
  });
  document.addEventListener("keyup", e => {
    if (e.code === "ControlRight") kapat();
    if (e.code === "ControlLeft") { SOLCTRL = false; const t = $("table.istek"); if (t && t._vurgula) t._vurgula(); }
  });
  window.addEventListener("blur", () => { kapat(); SOLCTRL = false; });
  $("#ipucuBar").hidden = !(AYAR.rehber && !AYAR.yardimGoruldu);
})();

function ciz() {
  listeDoldur(L, false);
  $("#listePnl").dataset.oniz = "0";
  $("#onizYazi").textContent = "";
  ONIZ = null;
  ceteleCiz();
  sorunCiz();
  analizCiz();
  altCiz();
  ayPanelCiz();
}

function hepsiniCiz() {
  LKEY = "";
  ciz();
  istekCiz();
  ozelCiz();
  kadroCiz();
  kuralCiz();
  ileriCiz();
  gecmisCiz();
  genelCiz();
}

const sure = ms => (ms === null || ms === undefined ? "hesaplanıyor" : Math.max(1, Math.round(ms / 1000)) + " sn");

function ilerlemeGoster(oran, yazi) {
  $("#ilerleme").hidden = oran === null;
  if (oran === null) return;
  const yuzde = Math.round(oran * 100);
  $("#ilerlemeIz").setAttribute("aria-valuenow", String(yuzde));
  $("#ilerlemeDolgu").style.transform = "scaleX(" + Math.max(0, Math.min(1, oran)) + ")";
  $("#ilerlemeYazi").textContent = "%" + yuzde + " · " + yazi;
}

function uret(zorla) {
  if (CALISIYOR) { CALISIYOR = false; return; }
  if (!zorla && AYAR.rehber && !OZEL_GORULDU) {
    sekme("ozel");
    toast("Rehber: özel talepleri kontrol et, sonra Listeyi Oluştur'a bir daha bas.", "info");
    return;
  }
  const n = Math.min(500, Math.max(30, +AYAR.altSay || 300));
  V.istekCarpan = V.kural.istekDenge ? istekCarpanHesapla() : null;
  const benim = ++KOSU;
  CALISIYOR = true;
  ALT = [];
  ALTTOPLAM = 0;
  let enC = Infinity;
  L = null;
  ESKI = false;
  yolTemizle();
  [...$("#toast").children].forEach(x => { if (x.textContent.startsWith("Rehber:")) x.remove(); });
  $("#rehberBar").hidden = true;
  sekme("liste");
  ciz();
  durumCiz();
  ilerlemeGoster(0, "başlıyor");
  MOTOR.kurAsenkron(V, TOHUM, n, o => {
    if (benim !== KOSU) return;
    ilerlemeGoster(o.oran, o.tur + "/" + o.toplam + " alternatif · kalan " + sure(o.kalanMs));
    if (o.yeni) {
      ALTTOPLAM = o.tur;
      if (o.yeni.maliyet < enC) {
        enC = o.yeni.maliyet;
        L = kopya(o.yeni.liste);
        listeDoldur(L, false);
        ceteleCiz();
      }
    }
  }, () => benim !== KOSU || !CALISIYOR).then(alt => {
    if (benim !== KOSU) return;
    CALISIYOR = false;
    ilerlemeGoster(null);
    ALTTOPLAM = alt.length;
    ALT = alt.slice().sort((x, y) => x.maliyet - y.maliyet).slice(0, 30);
    SEC = 0;
    L = ALT.length ? kopya(ALT[0].liste) : null;
    sakla();
    ciz();
    if (!ALT.length) return;
    toast(ALTTOPLAM + " alternatiften en adili seçildi.", "success");
    if (AYAR.rehber && !AYAR.rehberSoruldu) { $("#rehberBar").hidden = false; yol("#rehberDevam"); }
    else yol("#btnYazdir");
  }, e => {
    CALISIYOR = false;
    ilerlemeGoster(null);
    ciz();
    toast("Liste oluşturulamadı: " + (e && e.message ? e.message : e), "danger");
  });
}

function git(y, a) {
  if (CALISIYOR) { CALISIYOR = false; KOSU++; ilerlemeGoster(null); }
  yukle(y, a);
  sakla();
  hepsiniCiz();
  if (!L && AKTIF !== "istek" && anaBul(AKTIF) === "hazir") sekme("istek");
  if (!L) yol("#sk-istek");
}

function satirlar() {
  const G = MOTOR.gunSayisi(V);
  const s = [["Tarih", "Gün"].concat(Array.from({ length: V.kisi }, (_, i) => "Nöbetçi " + (i + 1)))];
  for (let d = 1; d <= G; d++) s.push([tarihMetin(d), MOTOR.GUN[MOTOR.haftaGunu(V, d)]].concat((L[d] || []).map(p => V.kisiler[p].ad)));
  return s;
}

function kisiDegis(fark) {
  if (CALISIYOR) return;
  const k = Math.min(12, Math.max(1, V.kisi + fark));
  if (k === V.kisi) return;
  V.kisi = k;
  degisti();
  listeDoldur(L, false);
  ayPanelCiz();
  kadroUyari();
  yol("#btnUret");
}

$("#btnUret").onclick = () => uret(false);
$("#kisiEksi").onclick = () => kisiDegis(-1);
$("#kisiArti").onclick = () => kisiDegis(1);
$("#yilGeri").onclick = () => git(V.yil - 1, V.ay);
$("#yilIleri").onclick = () => git(V.yil + 1, V.ay);
$("#btnKopya").onclick = () => {
  if (!L) return toast("Önce listeyi oluştur.", "warning");
  navigator.clipboard.writeText(satirlar().map(r => r.join("\t")).join("\n")).then(() => toast("Kopyalandı.", "success"), () => toast("Kopyalanamadı.", "danger"));
};
$("#btnCsv").onclick = async () => {
  if (!L) return toast("Önce listeyi oluştur.", "warning");
  const yolu = await W.dosyaYaz("nobet-" + V.yil + "-" + iki(V.ay) + ".csv", "﻿" + satirlar().map(r => r.join(";")).join("\r\n"), "CSV");
  if (yolu) toast("Kaydedildi: " + yolu, "success");
};
$("#btnYazdir").onclick = () => { if (!L) return toast("Önce listeyi oluştur.", "warning"); W.yazdir(); };
$("#rehberDevam").onclick = () => { ayarYaz({ rehber: true, rehberSoruldu: true }); $("#rehberBar").hidden = true; genelCiz(); yol("#btnYazdir"); };
$("#rehberKapat").onclick = () => { ayarYaz({ rehber: false, rehberSoruldu: true }); $("#rehberBar").hidden = true; genelCiz(); toast("Rehber kapatıldı. Ayarlar › Genel'den yeniden açabilirsin."); };

(() => {
  aySiraKur();
  sekmeKur();
  const son = oku("son");
  yukle(son ? son.yil : ILK.yil, son ? son.ay : ILK.ay);
  hepsiniCiz();
  hakkindaCiz();
  sekme(L ? "liste" : "istek");
  if (!L) setTimeout(() => yol("#sk-istek"), 400);
})();

(() => {
  const G = W.guncelle;
  const dugme = $("#basbarSurum");
  const panel = $("#gncPanel");
  let mesgul = false;
  G.surum().then(s => {
    dugme.textContent = "v" + s;
    const h = $("#hakSurum");
    if (h) h.textContent = "Sürüm " + s;
    if (AYAR.sonSurum && AYAR.sonSurum !== s) toast("Yeni sürüme geçildi: v" + s, "success", 5000);
    if (AYAR.sonSurum !== s) ayarYaz({ sonSurum: s });
  });
  dugme.setAttribute("aria-label", ET["update.check"] || "update.check");
  dugme.title = ET["update.check"] || "Güncellemeleri denetle";
  const kapat = () => { panel.hidden = true; $("#gncIz").hidden = true; $("#gncEvet").disabled = false; $("#gncSonra").disabled = false; };
  G.ilerle(p => {
    const o = Math.max(0, Math.min(1, +p.yuzde || 0));
    $("#gncDolgu").style.transform = "scaleX(" + o + ")";
    $("#gncYazi").textContent = p.adim + " (%" + Math.round(o * 100) + ")";
  });
  async function uygula() {
    $("#gncEvet").disabled = true;
    $("#gncSonra").disabled = true;
    $("#gncIz").hidden = false;
    const r = await G.uygula();
    if (!r.ok) { kapat(); toast("Güncelleme başarısız: " + r.hata, "danger"); }
  }
  async function denetle(sessiz) {
    if (mesgul) return;
    mesgul = true;
    dugme.disabled = true;
    const r = await G.denetle();
    mesgul = false;
    dugme.disabled = false;
    if (!r.ok) return sessiz ? null : toast("Güncelleme denetlenemedi: " + r.hata, "danger");
    if (!r.yeni) return sessiz ? null : toast((ET["update.current"] || "Güncel") + " (v" + dugme.textContent.replace(/^v/, "") + ")", "success");
    $("#gncBaslik").textContent = "Yeni sürüm hazır: v" + r.surum;
    $("#gncYazi").textContent = r.notlar || "Yeni sürüm indirilip kurulacak, program yeniden başlayacak.";
    panel.hidden = false;
    if (!AYAR.onayIste) {
      $("#gncEvet").hidden = true;
      $("#gncSonra").hidden = true;
      return uygula();
    }
    $("#gncEvet").hidden = false;
    $("#gncSonra").hidden = false;
    $("#gncEvet").focus();
  }
  dugme.onclick = () => denetle(false);
  $("#gncEvet").onclick = uygula;
  $("#gncSonra").onclick = kapat;
  setTimeout(() => denetle(true), 2500);
})();
