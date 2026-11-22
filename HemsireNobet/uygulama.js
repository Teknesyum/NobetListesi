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
const haftaIci = d => { const p = d - (MOTOR.haftaGunu(V, d) + 6) % 7; const r = []; for (let x = p; x < p + 5; x++) if (x >= 1 && x <= MOTOR.gunSayisi(V)) r.push(x); return r; };

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

let GA = { aylar: {}, elle: {}, manuel: {}, duzelt: {}, disi: {} };
let KAPSAM_ACIK = false;
let KISI_ACIK = false;
let CETELE_GOR = "ay";
const HG_GRUP = [0, 0, 0, 1, 2, 3, 4];
let GD = { aylar: [], detay: {} };
let GSEC = null;
let KAYITLAR = [null, null, null];
let VURGU_KISI = null;
let VURGU_GUN = null;

function gecmisAyarOku() {
  const g = oku("gecmis") || {};
  GA = { aylar: g.aylar || {}, elle: g.elle || {}, manuel: g.manuel || {}, duzelt: g.duzelt || {}, disi: g.disi || {} };
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
    if (GA.disi[ad]) return;
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
  for (const [ad, dz] of Object.entries(GA.duzelt)) {
    const hg = (dz || []).map(x => +x || 0);
    const g = [0, 0, 0, 0, 0];
    hg.forEach((x, i) => { g[HG_GRUP[i]] += x; });
    ekle(ad, hgTop(hg), hgPuan(hg), g);
  }
  return Object.values(r).some(x => Math.abs(x.n) > 1e-9 || Math.abs(x.p) > 1e-9) ? r : null;
}

function puanOrt() {
  const h = MOTOR.hazirla(V, false);
  return h.toplam ? h.toplamOde / h.toplam : 1;
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
  const zor = kayit && kayit.zs === 2 ? kayit.zorunlu : kadro && kadro.zs === 2 ? kadro.zorunlu : true;
  const kural = MOTOR.kuralNorm((kayit && kayit.kural) || (kadro && kadro.kural) || null, kisiler);
  V = {
    yil: y, ay: a, kisi: (kayit && kayit.kisi) || (kadro && kadro.kisi) || taban.kisi,
    tatil: AYAR.resmiTatil ? TATIL.tamGunler(y, a) : [], kisiler, zorunlu: !!zor, kural,
    ozel: (kayit && kayit.ozel) || [], onceki: [], gecmis: null, istekCarpan: null,
    pin: (kayit && kayit.pin) || [], yalniz: !!(kayit && kayit.yalniz)
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
  KAYITLAR = (kayit && kayit.kayitlar) || [null, null, null];
  VURGU_KISI = null;
  VURGU_GUN = null;
  OZEL_GORULDU = false;
  GSEC = null;
}

function sakla() {
  W.veri.yaz(ayAnahtar(V.yil, V.ay), JSON.stringify({ kisi: V.kisi, kisiler: V.kisiler, zorunlu: V.zorunlu, zs: 2, kural: V.kural, ozel: V.ozel, tatil: V.tatil, liste: L, tohum: TOHUM, alt: ALT, altToplam: ALTTOPLAM, sec: SEC, eski: ESKI, pin: V.pin, kayitlar: KAYITLAR, yalniz: V.yalniz }));
  W.veri.yaz("kadro", JSON.stringify({ kisi: V.kisi, kisiler: V.kisiler.map(k => ({ ad: k.ad, nobet: k.nobet, izin: [], istemiyor: [], istiyor: [] })), zorunlu: V.zorunlu, zs: 2, kural: V.kural }));
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
const yardim = m => { const p = el("p", { className: "yardim", textContent: m }); p.tabIndex = 0; return p; };
const paragraf = (kap, m) => { kap.replaceChildren(...String(m).split("\n\n").map(x => el("span", { className: "yardim-p", textContent: x }))); };
const satir = (...x) => { const d = el("div", { className: "satir" }); d.append(...x); return d; };
const yd = (e, bas, metin) => { e.dataset.yb = bas; e.dataset.ym = metin; return e; };
const basYardim = (t, harita) => { for (const th of t.rows[0].cells) { const m = harita[th.firstChild && th.firstChild.nodeType === 3 ? th.firstChild.textContent : th.textContent]; if (m) yd(th, th.textContent, m); } return t; };
const KESIN = "Kesin işaretliyse bu kural hiç çiğnenmez: program listeyi buna göre kurar, başka hiçbir yol yoksa ancak o zaman çiğner ve Sorunlar sekmesinde yazar.\n\nKesin işaretli değilse kural güçlü bir tercihtir: çoğu zaman uyulur, ama adalet ya da istekler için gerekirse çiğnenir ve yine Sorunlar'da görünür.";
const DURUM_Y = "Açık: bu satır listeyi hazırlarken hesaba katılır. Kapalı: satır silinmez ama yok sayılır; tekrar açmak için bir daha bas.";
const SIL_Y = "Bu satırı hemen siler. Geri almak için yeniden eklemen gerekir.";
const GUN_PUAN = "Pzt–Per 1, Cuma 2, Cumartesi 3, Pazar ve resmi tatil 2 ödeme puanı.";
const CETELE_BAS = { Ad: "Hemşirenin adı.", PTS: "Pazartesi günleri tutulan nöbet sayısı.", "SALI": "Salı günleri tutulan nöbet sayısı.", "ÇARŞ": "Çarşamba günleri tutulan nöbet sayısı.", "PERŞ": "Perşembe günleri tutulan nöbet sayısı.", CUMA: "Cuma günleri tutulan nöbet sayısı (2 puan).", "CTESİ": "Cumartesi günleri tutulan nöbet sayısı (3 puan).", PAZAR: "Pazar ve resmi tatil günlerinde tutulan nöbet sayısı (2 puan).", "NÖBET": "Tutulan nöbet / ödeme puanı. " + GUN_PUAN, "GEÇMİŞ": "Önceki aylarda hakkından fazla (+) ya da eksik (−) tutulan nöbet / puan. Bu fark yeni listede dengelenir.", HAK: "O ay tutması gereken nöbet / ödeme puanı. Kâğıttaki hak sayısını yaz.", FARK: "Tutulan eksi hak: + fazla tuttu, − eksik tuttu." };

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

const NEDEN = {
  kural: p => V.kisiler[p].ad + ": kural bozulur",
  istek: p => V.kisiler[p].ad + ": isteği bozulur",
  ucret: () => "Ücret eşitliği bozulur: puan farkı 1'i aşar ya da fazla nöbet tutan daha az puan alır",
  grup: () => "Gün grubu kuralı bozulur",
  pin: () => "Sabitlenmiş hücre",
  ayni: () => "O gün zaten nöbetçi"
};
const nedenMetin = n => n.map(([t, p]) => NEDEN[t](p)).join(" · ");

function surukle(e, basla, birak, tik, gez) {
  if (e.button !== 0) return;
  e.preventDefault();
  const x0 = e.clientX, y0 = e.clientY;
  let aktif = false;
  const mm = ev => {
    if (!aktif && Math.hypot(ev.clientX - x0, ev.clientY - y0) > 4) { aktif = true; document.body.classList.add("suruk"); basla(); }
    if (aktif && gez) gez(ev);
  };
  const mu = ev => {
    document.removeEventListener("mousemove", mm, true);
    document.removeEventListener("mouseup", mu, true);
    document.body.classList.remove("suruk");
    surukIpucu(null);
    if (aktif) birak(ev.target); else if (tik) tik();
  };
  document.addEventListener("mousemove", mm, true);
  document.addEventListener("mouseup", mu, true);
}

function surukIpucu(ev, metin, renk) {
  let b = $("#surukIpucu");
  if (!ev) { if (b) b.hidden = true; return; }
  if (!b) { b = el("div", { id: "surukIpucu", className: "suruk-ipucu" }); b.setAttribute("role", "status"); document.body.append(b); }
  b.hidden = false;
  b.textContent = metin;
  b.dataset.takas = renk;
  b.style.left = ev.clientX + "px";
  b.style.top = ev.clientY + "px";
  b.classList.toggle("sol", ev.clientX + b.offsetWidth * 1.2 > innerWidth);
}

const takasYazi = r => !r ? "" : r.renk === "yesil" ? "Sorun yok" : nedenMetin(r.neden) + (r.sert ? " · Bırakırsan taşınır, yeni liste yapılacak" : "");

function takasTemizle() {
  document.querySelectorAll("[data-takas]").forEach(x => { delete x.dataset.takas; x.removeAttribute("title"); });
  document.querySelectorAll(".kaynak").forEach(x => x.classList.remove("kaynak"));
}

function takasIsaretle(td, r) {
  td.dataset.takas = r.renk;
  td.title = r.neden.length ? nedenMetin(r.neden) : "Sorun yok";
}

function sonucUygula(r, yeni, mesaj) {
  if (!r) return;
  if (r.engel) { toast("Olmaz: " + nedenMetin(r.neden), "warning"); return; }
  L = yeni();
  if (r.sert && r.sabit) r.sabit.forEach(([d, y]) => { V.pin = V.pin.filter(x => !(x[0] === d && x[1] === y)); V.pin.push([d, y, V.kisiler[L[d][y]].ad]); });
  degisti();
  ciz();
  if (r.sert && r.sabit) {
    toast(mesaj() + " Kural bozuldu: " + nedenMetin(r.neden) + ". Yeni liste yapılacak; taşınan nöbet sabitlendi.", "warning", 6000);
    setTimeout(() => uret(true), 600);
    return;
  }
  toast(mesaj() + (r.neden.length ? " Uyarı: " + nedenMetin(r.neden) : ""), r.renk === "yesil" ? "success" : "warning");
}

function hucreSurukle(e, d, y) {
  if (!L || CALISIYOR || !L[d] || L[d][y] === undefined) return;
  const kaynak = SECLER[d][y].parentElement;
  let sonuc = [];
  surukle(e, () => {
    kaynak.classList.add("kaynak");
    sonuc = MOTOR.takasAnaliz(V, L, d, y);
    sonuc.forEach(r => takasIsaretle(SECLER[r.d][r.y].parentElement, r));
  }, hedef => {
    const td = hedef && hedef.closest && hedef.closest("td.hucre");
    takasTemizle();
    if (!td) return;
    const r = sonuc.find(x => x.d === +td.dataset.d && x.y === +td.dataset.y);
    if (r) r.sabit = [[d, y], [r.d, r.y]];
    sonucUygula(r, () => MOTOR.takasYap(L, d, y, r.d, r.y), () => tarihMetin(d) + " ile " + tarihMetin(r.d) + " yer değiştirdi.");
  }, () => {
    const s = SECLER[d][y];
    s.focus();
    try { s.showPicker(); } catch (x) {}
  }, ev => {
    const td = ev.target && ev.target.closest && ev.target.closest("td.hucre");
    const r = td && sonuc.find(x => x.d === +td.dataset.d && x.y === +td.dataset.y);
    if (r) surukIpucu(ev, takasYazi(r), r.renk); else surukIpucu(null);
  });
}

function pinDegistir(d, y) {
  if (!L || CALISIYOR || !L[d] || L[d][y] === undefined) return;
  const i = V.pin.findIndex(x => x[0] === d && x[1] === y);
  if (i >= 0) V.pin.splice(i, 1); else V.pin.push([d, y, V.kisiler[L[d][y]].ad]);
  sakla();
  listeDoldur(L, false);
  toast(i >= 0 ? "Sabitleme kaldırıldı." : "Sabitlendi: Listeyi Oluştur bu hücreyi korur.", "info", 3000);
}

function nobetSayac(k, sonra) {
  const sp = el("span", { className: "sayac nobet-sayac" });
  sp.dataset.k = String(V.kisiler.indexOf(k));
  const eksi = el("button", { type: "button", className: "dgm dgm-kare", textContent: "−" });
  const deg = el("span", { className: "sayac-deger", textContent: String(k.nobet) });
  const arti = el("button", { type: "button", className: "dgm dgm-kare", textContent: "+" });
  eksi.setAttribute("aria-label", k.ad + " nöbet sayısını azalt");
  arti.setAttribute("aria-label", k.ad + " nöbet sayısını artır");
  deg.setAttribute("aria-live", "polite");
  eksi.disabled = k.nobet <= 0;
  const yaz = v => {
    k.nobet = Math.max(0, v);
    document.querySelectorAll('.nobet-sayac[data-k="' + sp.dataset.k + '"]').forEach(x => { x.querySelector(".sayac-deger").textContent = String(k.nobet); x.querySelector(".dgm-kare").disabled = k.nobet <= 0; });
    degisti();
    sonra();
  };
  eksi.onclick = () => yaz(k.nobet - 1);
  arti.onclick = () => yaz(k.nobet + 1);
  sp.append(eksi, deg, arti);
  return sp;
}

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
        V.pin = V.pin.filter(x => !(x[0] === d && x[1] === y));
        degisti();
        ciz();
      };
      SECLER[d][y] = s;
      const td = el("td", { className: "hucre" });
      td.dataset.d = d;
      td.dataset.y = y;
      td.addEventListener("mousedown", e => hucreSurukle(e, d, y));
      td.addEventListener("contextmenu", e => { e.preventDefault(); pinDegistir(d, y); });
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
  let s0;
  for (let d = 1; d <= G; d++) {
    for (let y = 0; y < V.kisi; y++) {
      const s = SECLER[d][y];
      const p = liste && liste[d] ? liste[d][y] : undefined;
      s.value = p === undefined ? "-1" : String(p);
      s.disabled = !L || CALISIYOR;
      const kotu = H && p !== undefined && (H.yok[p].has(d) || H.istemez[p].has(d) || (d > 1 && liste[d - 1] && liste[d - 1].includes(p)));
      if (kotu) s.dataset.kotu = "1"; else delete s.dataset.kotu;
      const td = s.parentElement;
      const pin = !oniz && liste === L && L && V.pin.some(x => x[0] === d && x[1] === y);
      if (pin) td.dataset.pin = "1"; else delete td.dataset.pin;
      td.classList.toggle("vurgu", !oniz && VURGU_KISI !== null && p === VURGU_KISI && (VURGU_GUN === null || (MOTOR.haftaGunu(V, d) + 6) % 7 === VURGU_GUN));
    }
    s0 = SECLER[d][0];
    if (s0) s0.closest("tr").classList.toggle("vurgu-gun", VURGU_GUN !== null && VURGU_KISI === null && (MOTOR.haftaGunu(V, d) + 6) % 7 === VURGU_GUN);
  }
}

function ceteleTablo(satirlar, gecmisVar, etk) {
  const t = el("table", { className: "tablo cetele" + (etk ? " etk" : "") });
  const b = el("tr");
  b.append(el("th", { scope: "col", textContent: "Ad" }));
  CETELE_AD.forEach((m, i) => {
    const th = el("th", { scope: "col" });
    if (etk) {
      const g = el("button", { type: "button", className: "ad-dgm gun-dgm", textContent: m });
      g.setAttribute("aria-pressed", String(VURGU_GUN === i));
      g.onclick = () => { VURGU_GUN = VURGU_GUN === i ? null : i; listeDoldur(L, false); ceteleCiz(); };
      th.append(g);
    } else th.textContent = m;
    if (i >= 5) th.className = "hs";
    b.append(th);
  });
  b.append(el("th", { scope: "col", textContent: "NÖBET" }));
  if (gecmisVar) b.append(el("th", { scope: "col", textContent: "GEÇMİŞ" }));
  t.append(b);
  const top = [0, 0, 0, 0, 0, 0, 0];
  let tn = 0, tp = 0;
  satirlar.forEach((r, ri) => {
    const tr = el("tr");
    if (etk) {
      const td = el("td", { className: "ad" });
      const a = el("button", { type: "button", className: "ad-dgm", textContent: r.ad });
      a.setAttribute("aria-pressed", String(VURGU_KISI === ri));
      a.onclick = () => { VURGU_KISI = VURGU_KISI === ri ? null : ri; listeDoldur(L, false); ceteleCiz(); };
      td.append(a);
      tr.append(td);
      if (VURGU_KISI === ri && VURGU_GUN === null) tr.classList.add("vurgu");
    } else tr.append(el("td", { className: "ad", textContent: r.ad }));
    r.hg.forEach((x, i) => {
      top[i] += x;
      const td = el("td", { textContent: String(x) });
      td.className = (x ? "" : "sifir") + (i >= 5 ? " hs" : "") + (etk ? " gh" : "");
      if (etk) {
        td.dataset.q = ri;
        td.dataset.i = i;
        if (x && L && !CALISIYOR) { td.classList.add("tasin"); td.addEventListener("mousedown", e => verSurukle(e, ri, i)); }
        else td.addEventListener("click", () => hucreVurgu(ri, i));
        td.title = r.ad + " · " + CETELE_AD[i] + ": tıkla, listede yansın";
      }
      if (etk && (VURGU_KISI === null ? VURGU_GUN === i : VURGU_KISI === ri && VURGU_GUN === i)) td.classList.add("vurgu", "vurgu-hucre");
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

function hucreVurgu(ri, i) {
  const ayni = VURGU_KISI === ri && VURGU_GUN === i;
  VURGU_KISI = ayni ? null : ri;
  VURGU_GUN = ayni ? null : i;
  listeDoldur(L, false);
  ceteleCiz();
}

function verSurukle(e, p, i) {
  let sonuc = [];
  const kaynak = e.currentTarget;
  const tablo = kaynak.closest("table");
  const kx = kaynak.textContent;
  let onceki = null;
  const geri = () => { if (onceki) { onceki.td.textContent = onceki.x; onceki = null; } kaynak.textContent = kx; };
  surukle(e, () => {
    kaynak.classList.add("kaynak");
    sonuc = MOTOR.verAnaliz(V, L, p, (i + 1) % 7);
    sonuc.forEach(r => { const td = tablo.querySelector('td.gh[data-q="' + r.q + '"][data-i="' + i + '"]'); if (td) takasIsaretle(td, r); });
  }, hedef => {
    geri();
    const td = hedef && hedef.closest && hedef.closest("td.gh");
    takasTemizle();
    if (!td || +td.dataset.i !== i) return;
    const r = sonuc.find(x => x.q === +td.dataset.q);
    if (r) r.sabit = [[r.d, r.y]];
    sonucUygula(r, () => MOTOR.verYap(L, r.d, r.y, r.q), () => V.kisiler[p].ad + " → " + V.kisiler[r.q].ad + ": " + tarihMetin(r.d) + " nöbeti verildi.");
  }, () => { takasTemizle(); hucreVurgu(p, i); }, ev => {
    const td = ev.target && ev.target.closest && ev.target.closest("td.gh");
    const r = td && td !== kaynak && +td.dataset.i === i && sonuc.find(x => x.q === +td.dataset.q);
    if (onceki && onceki.td !== td) geri();
    if (!r) { surukIpucu(null); return; }
    if (!onceki) { onceki = { td, x: td.textContent }; td.textContent = String(+td.textContent + 1); kaynak.textContent = String(+kx - 1); }
    surukIpucu(ev, V.kisiler[r.q].ad + " " + onceki.x + " → " + td.textContent + " · " + takasYazi(r), r.renk);
  });
}

const kabulMu = () => !!L && GA.aylar[ayKod(V.yil, V.ay)] === true;

function bagCiz() {
  const y = !!V.yalniz;
  $("#bagCetele").setAttribute("aria-pressed", String(!y));
  $("#bagYalniz").setAttribute("aria-pressed", String(y));
  $("#bagCetele").disabled = $("#bagYalniz").disabled = CALISIYOR;
}

function bagSec(y) {
  if (CALISIYOR || !!V.yalniz === y) return;
  V.yalniz = y;
  degisti();
  bagCiz();
  toast(y ? "Yalnız Bu Ay: liste geçmiş farklara bakmadan, yalnız bu ayın adaletine göre oluşacak." : "Çeteleye Bağlı: liste genel çetelenin farklarını kapatacak şekilde oluşacak.", "info", 3500);
}

function kabulDegistir() {
  if (!L || CALISIYOR) return;
  const ak = ayKod(V.yil, V.ay);
  const k = !kabulMu();
  GA.aylar[ak] = k;
  gecmisAyarYaz();
  ceteleCiz();
  ayPanelCiz();
  durumCiz();
  toast(k ? AYLAR[V.ay - 1] + " " + V.yil + " genel çeteleye eklendi. Sonraki ay bu farkları kapatır." : AYLAR[V.ay - 1] + " " + V.yil + " genel çeteleden çıkarıldı.", k ? "success" : "info");
}

function ceteleCiz() {
  const p = $("#p-liste");
  p.replaceChildren();
  const genel = CETELE_GOR === "genel";
  p.append(baslik(genel ? "Genel Çetele Önizleme" : "Çetele: " + AYLAR[V.ay - 1] + " " + V.yil));
  const gor = el("div", { className: "cipler gorunum" });
  gor.setAttribute("role", "group");
  gor.setAttribute("aria-label", "Çetele görünümü");
  [["ay", "Bu Ay", "Bu Ay", "Yalnız bu ayın çetelesi: kim hangi gün kaç nöbet tuttu. Buradan sürükleyip nöbet verebilir, tıklayıp vurgulayabilirsin."], ["genel", "Genel", "Genel", "Önceki aylar + bu ay: bu liste kabul edilirse genel çetele nasıl olur, onun önizlemesi. Değiştirmez, yalnız gösterir."]].forEach(([v, m, b, a]) => {
    const c = yd(el("button", { type: "button", className: "cip", id: "gor-" + v, textContent: m }), b, a);
    c.setAttribute("aria-pressed", String(CETELE_GOR === v));
    c.onclick = () => { if (CETELE_GOR === v) return; CETELE_GOR = v; ceteleCiz(); };
    gor.append(c);
  });
  const kb = yd(el("button", { type: "button", className: kabulMu() ? "dgm" : "dgm dgm-birincil", id: "btnKabul", textContent: kabulMu() ? "Kabulü Geri Al" : "Listeyi Kabul Et" }), "Listeyi Kabul Et", "Bu ayın listesini genel çeteleye ekler: sonraki ay oluşturulurken bu ayın ±1 farkları kapatılır. Kabul edildiyse düğme Kabulü Geri Al olur ve ayı çeteleden çıkarır.");
  kb.disabled = !L || CALISIYOR;
  kb.onclick = kabulDegistir;
  p.append(satir(gor, kb));
  if (genel) {
    genelCeteleCiz();
    const kap = el("div", { className: "istek-kap" });
    kap.append(genelTablo(genelSatir(true), false));
    p.append(kap);
    p.append(yardim(L ? "Kapsanan önceki aylar + bu ayın listesi. " + (kabulMu() ? "Bu ay kabul edildi; Genel Çetele sekmesi de bunu gösteriyor." : "Bu ay henüz kabul edilmedi: Listeyi Kabul Et'e basınca Genel Çetele bu hale gelir.") : "Liste henüz oluşturulmadı; yalnız önceki aylar görünüyor."));
    return;
  }
  const rows = ayRows();
  const kap = el("div", { className: "istek-kap" });
  kap.append(basYardim(ceteleTablo(rows, true, true), CETELE_BAS));
  p.append(kap);
  ceteleSon(p);
}

function ayRows() {
  const an = L ? MOTOR.analiz(V, L) : null;
  return V.kisiler.map((k, i) => {
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
}

function ceteleSon(p) {
  if (L) p.append(yardim("Ada tıkla: nöbetleri listede yanar. Gün başlığına tıkla: o günler yanar. Bir kişinin gün hücresine tıkla: yalnız o kişinin o gündeki nöbetleri yanar. Bir gün sayısını başka birinin aynı sütununa sürükle: üstüne gelince sayılar ±1 değişir ve sorun yazılır; kırmızıda bırakırsan taşınır, nöbet sabitlenir ve yeni liste yapılır."));
  if (!L) p.append(yardim("Liste henüz oluşturulmadı. Üstteki Listeyi Oluştur düğmesine bas."));
  p.append(yardim("Her sütun o gün tutulan nöbet sayısı. NÖBET: nöbet / ödeme puanı (Cuma 2, Cumartesi 3, Pazar ve tatil 2). GEÇMİŞ: önceki aylarda hakkından fazla (+) ya da eksik (−) tutulan nöbet / puan."));
  const b = yd(el("button", { type: "button", className: "dgm", textContent: "Geçmiş Verileri İncele" }), "Geçmiş Verileri İncele", "Ayarlar › Geçmiş sekmesini açar: önceki ayların çetelesi, hangi ayların hesaba katıldığı ve elle ay ekleme orada.");
  b.onclick = () => sekme("gecmis");
  const g = yd(el("button", { type: "button", className: "dgm", textContent: "Genel Çeteleye Git" }), "Genel Çeteleye Git", "Genel Çetele sekmesini açar: birkaç ayın toplamı ve herkesin hakkına göre farkı.");
  g.onclick = () => sekme("cetele");
  p.append(satir(g, b));
  genelCeteleCiz();
}

function genelCeteleCiz() {
  const p = $("#p-cetele");
  if (!p) return;
  p.replaceChildren();
  p.append(baslik("Genel Çetele"));
  const aylar = GD.aylar.slice().reverse();
  const dahil = aylar.filter(m => m.dahil);
  const kapsam = el("div", { className: "ay-cipler" });
  const kd = yd(el("button", { type: "button", className: "dgm", id: "btnKapsam", textContent: "Kapsanan Aylar" }), "Kapsanan Aylar", "Genel çeteleye hangi ayların katıldığını gösterir ya da gizler. Ayın üstüne tıklayınca o ay katılır ya da çıkar.");
  kd.setAttribute("aria-expanded", String(KAPSAM_ACIK));
  kd.setAttribute("aria-controls", "kapsamCipler");
  const cipKap = el("div", { className: "cipler", id: "kapsamCipler" });
  cipKap.hidden = !KAPSAM_ACIK;
  kd.onclick = () => { KAPSAM_ACIK = !KAPSAM_ACIK; kd.setAttribute("aria-expanded", String(KAPSAM_ACIK)); cipKap.hidden = !KAPSAM_ACIK; };
  aylar.forEach(m => {
    const c = el("button", { type: "button", className: "cip", textContent: ayKisa(m.k) });
    c.setAttribute("aria-pressed", String(m.dahil));
    c.onclick = () => { GA.aylar[m.k] = !m.dahil; gecmisAyarYaz(); yenidenKur(); };
    cipKap.append(c);
  });
  cipKap.append(el("span", { className: "cip bu-ay", textContent: AYLAR[V.ay - 1].slice(0, 3) + " " + V.yil + " (bu ay, " + (!L ? "liste yok)" : kabulMu() ? "kabul edildi)" : "kabul edilmedi)") }));
  kapsam.append(kd, cipKap);
  p.append(kapsam);
  const kisiKap = el("div", { className: "ay-cipler" });
  const kk = yd(el("button", { type: "button", className: "dgm", id: "btnKisiKapsam", textContent: "Kapsanan Kişiler" }), "Kapsanan Kişiler", "Genel çeteleye kimlerin katıldığını gösterir ya da gizler. Bir kişiye tıklayınca çeteleden çıkar ya da geri katılır; çıkarılanın geçmiş farkı yeni listeye yansımaz.");
  kk.setAttribute("aria-expanded", String(KISI_ACIK));
  kk.setAttribute("aria-controls", "kisiCipler");
  const kc = el("div", { className: "cipler", id: "kisiCipler" });
  kc.hidden = !KISI_ACIK;
  kk.onclick = () => { KISI_ACIK = !KISI_ACIK; kk.setAttribute("aria-expanded", String(KISI_ACIK)); kc.hidden = !KISI_ACIK; };
  V.kisiler.forEach(k => {
    const c = el("button", { type: "button", className: "cip", textContent: k.ad });
    c.setAttribute("aria-pressed", String(!GA.disi[k.ad]));
    c.onclick = () => { if (GA.disi[k.ad]) delete GA.disi[k.ad]; else GA.disi[k.ad] = true; gecmisAyarYaz(); yenidenKur(k.ad + (GA.disi[k.ad] ? " genel çeteleden çıkarıldı." : " genel çeteleye katıldı.")); };
    kc.append(c);
  });
  kisiKap.append(kk, kc);
  p.append(kisiKap);
  const t = genelTablo(genelSatir(kabulMu()), true);
  const kap = el("div", { className: "istek-kap" });
  kap.append(t);
  p.append(kap);
  genelSon(p);
}

function genelSatir(buAy) {
  const dahil = GD.aylar.filter(m => m.dahil);
  const an = L && buAy ? MOTOR.analiz(V, L) : null;
  const h0 = MOTOR.hazirla(V, false);
  return V.kisiler.filter(k => !GA.disi[k.ad]).map(k => {
    const i = V.kisiler.indexOf(k);
    const r = { ad: k.ad, hg: [0, 0, 0, 0, 0, 0, 0], n: 0, p: 0, hn: 0, hp: 0 };
    for (const m of dahil) {
      const x = GD.detay[m.k] && GD.detay[m.k][k.ad];
      if (!x) continue;
      (x.hg || []).forEach((c, j) => { r.hg[j] += +c || 0; });
      r.n += +x.n || 0; r.p += +x.p || 0; r.hn += +x.hn || 0; r.hp += +x.hp || 0;
    }
    if (an) {
      an[i].hg.forEach((c, j) => { r.hg[j] += c; });
      r.n += an[i].nobet; r.p += an[i].odeme;
      r.hn += h0.nTaban[i]; r.hp += h0.pTaban[i];
    }
    r.dz = (GA.duzelt[k.ad] || [0, 0, 0, 0, 0, 0, 0]).map(x => +x || 0);
    r.dz.forEach((c, j) => { r.hg[j] += c; });
    r.n += hgTop(r.dz); r.p += hgPuan(r.dz);
    return r;
  });
}

function genelTablo(rows, duzenle) {
  const t = el("table", { className: "tablo cetele genel" });
  const genelBas = Object.assign({}, CETELE_BAS, { "NÖBET": "Kapsanan aylar ve bu ay toplamı: tutulan nöbet / hakkı olan nöbet.", PUAN: "Kapsanan aylar ve bu ay toplamı: tutulan ödeme puanı / hakkı olan puan. " + GUN_PUAN, FARK: "Hakkından fazla (+) ya da eksik (−) tutulan nöbet / puan. Uyarı renginde olan fark büyük demek; Listeyi Oluştur bunu kapatmaya çalışır." });
  const bas = el("tr");
  bas.append(el("th", { scope: "col", textContent: "Ad" }));
  CETELE_AD.forEach((m, i) => bas.append(el("th", { scope: "col", className: i >= 4 ? "hs" : "", textContent: m })));
  ["NÖBET", "PUAN", "FARK"].forEach(m => bas.append(el("th", { scope: "col", textContent: m })));
  t.append(bas);
  rows.forEach((r, i) => {
    const tr = el("tr");
    tr.append(el("td", { className: "ad", textContent: r.ad }));
    r.hg.forEach((x, j) => {
      const td = el("td", { className: j >= 4 ? "hs" : "" });
      if (!duzenle) {
        td.textContent = String(x);
        if (!x) td.classList.add("sifir");
        tr.append(td);
        return;
      }
      const inp = el("input", { className: "hucre-giris", type: "number", step: "1", value: String(x) });
      inp.setAttribute("aria-label", r.ad + " " + CETELE_AD[j]);
      inp.dataset.i = String(i);
      inp.dataset.j = String(j);
      if (!x) td.classList.add("sifir");
      if (r.dz[j]) { td.classList.add("elle"); td.title = "Elle düzeltme " + isr(r.dz[j]); }
      yd(inp, "Gün Sayısı", "Bu kişinin bu günde tuttuğu toplam nöbet. Kâğıttaki çeteleyle uyuşmuyorsa sayıyı değiştir; fark elle düzeltme olarak kaydedilir ve bütün aylara eklenir. Düzeltilmiş hücre vurgulu görünür.");
      inp.onchange = () => {
        const yeni = Math.round(+inp.value);
        const dz = (GA.duzelt[r.ad] || [0, 0, 0, 0, 0, 0, 0]).map(v => +v || 0);
        dz[j] = r.dz[j] + (isFinite(yeni) ? yeni : x) - x;
        if (dz.some(v => v)) GA.duzelt[r.ad] = dz; else delete GA.duzelt[r.ad];
        gecmisAyarYaz();
        const odak = document.activeElement === inp;
        yenidenKur();
        if (odak) { const n = $('#p-cetele input[data-i="' + i + '"][data-j="' + j + '"]'); if (n) n.focus(); }
      };
      td.append(inp);
      tr.append(td);
    });
    const tn = el("td", { className: "np", textContent: r.n + " / " + Math.round(r.hn), title: r.n + " / " + f1(r.hn) });
    const tp = el("td", { className: "np", textContent: f1(r.p) + " / " + Math.round(r.hp), title: f1(r.p) + " / " + f1(r.hp) });
    tr.append(tn, tp);
    const fn = r.n - r.hn, fp = r.p - r.hp;
    const fk = el("td", { className: "np fark", textContent: isr(Math.round(fn)) + " / " + isr(Math.round(fp)), title: isr(fn) + " / " + isr(fp) });
    fk.dataset.kotu = Math.abs(fn) >= 1 || Math.abs(fp) >= 2.5 ? "1" : "0";
    tr.append(fk);
    t.append(tr);
  });
  basYardim(t, genelBas);
  return t;
}

function genelSon(p) {
  const sf = el("button", { type: "button", className: "dgm dgm-sil", id: "btnDuzeltSifir", textContent: "Düzeltmeleri Sıfırla" });
  let onay = null;
  sf.onclick = () => {
    if (!Object.keys(GA.duzelt).length) { toast("Elle düzeltme yok.", "info"); return; }
    if (!onay) { sf.textContent = "Emin misin? Bir daha bas"; onay = setTimeout(() => { onay = null; sf.textContent = "Düzeltmeleri Sıfırla"; }, 3000); return; }
    clearTimeout(onay);
    GA.duzelt = {};
    gecmisAyarYaz();
    yenidenKur("Elle düzeltmeler silindi.");
  };
  p.append(satir(sf));
  p.append(yardim("Genel çetele, kapsanan ayların ve kabul edilmişse bu ayın toplamıdır. Bu ay, Liste sekmesindeki Listeyi Kabul Et ile eklenir. NÖBET ve PUAN: tutulan / hakkı olan. FARK: hakkından fazla (+) ya da eksik (−) tutulan nöbet / puan.\n\nListeyi Oluştur bu farkı kapatmaya çalışır: fazlası olanın bu ayki hedefi düşer, eksiği olanınki artar. Amaç birkaç ay sonunda herkesin farkının sıfıra yakın olmasıdır.\n\nGün sütunlarındaki sayılar doğrudan değiştirilebilir: kâğıttaki çeteleyle uyuşmayan bir sayı varsa üstüne yaz. Fark bütün aylara genel olarak eklenir ve liste hazırlanırken hesaba katılır."));
}

function sorunSekme() {
  const n = L ? MOTOR.rapor(V, L).sorun.length : 0;
  const b = $("#sk-sorun");
  const r = $("#sorunRozet");
  if (!b || !r) return;
  if (n) b.dataset.sorun = "1"; else delete b.dataset.sorun;
  r.hidden = !n;
  r.textContent = String(n);
  b.setAttribute("aria-label", n ? "Sorunlar, " + n + " sorun" : "Sorunlar");
}

function durumCiz() {
  bagCiz();
  sorunSekme();
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
  const t = el("table", { className: "tablo analiz" });
  const b = el("tr");
  ["Ad", "Nöbet", "Ödeme"].concat(MOTOR.TIP_AD, ["İstek", "İstemez", "Geçmiş"]).forEach(m => b.append(el("th", { scope: "col", textContent: m })));
  t.append(b);
  basYardim(t, { Ad: "Hemşirenin adı; altında üyesi olduğu gruplar.", "Nöbet": "Bu ay tuttuğu nöbet; altında hedefi. Hedef, kadro payı ve geçmiş aylardaki fark hesaba katılarak bulunur. Uyarı rengi: hedeften 1,5 ya da daha çok sapma.", "Ödeme": "Bu ay aldığı ödeme puanı; altında hedefi. Para Eşitliği dağıtımında herkesin hedefi eşittir; az nöbet isteyenin hedefi bıraktığı ucuz günler kadar düşer. " + GUN_PUAN, Pzt: "Pazartesi nöbeti; altında beklenen (~).", Sal: "Salı nöbeti; altında beklenen (~).", "Çar": "Çarşamba nöbeti; altında beklenen (~).", Per: "Perşembe nöbeti; altında beklenen (~).", Cum: "Cuma nöbeti; altında beklenen (~).", Cmt: "Cumartesi nöbeti; altında beklenen (~).", Paz: "Pazar ve resmi tatil nöbeti; altında beklenen (~).", "İstek": "Verilen / istenen (✓) gün sayısı. “eksik” ise isteklerinin bir kısmı karşılanamadı.", "İstemez": "İstemediği (✗) güne yazılma / toplam ✗. Altında: art arda nöbet sayısı ve perşembe kuralının çiğnendiği hafta sayısı.", "Geçmiş": "Önceki aylarda hakkından fazla (+) ya da eksik (−) tuttuğu nöbet; altında ödeme puanı farkı." });
  yd(t, "Analiz", "Her hücrenin altındaki mavi değer (hedef, beklenen, ayrıntı) fare o hücreye gelince görünür. Hepsini birden görmek için sağ Ctrl'yi basılı tut.");
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
  const kap = el("div", { className: "istek-kap analiz-kap" });
  kap.append(t);
  p.append(kap);
  p.append(yardim("Hücrenin altındaki mavi değer fare üstüne gelince görünür; hepsi için sağ Ctrl'yi basılı tut. Nöbet ve Ödeme: geçmiş aylar düşüldükten sonraki hedef. Pzt…Paz: o günlerdeki nöbet ve beklenen (tatiller Paz sütununda). İstek: verilen / istenen. İstemez: istemediği güne yazılan / toplam. Geçmiş: önceki aylarda hakkından fazla (+) ya da eksik (−)."));
}

function kadroCiz() {
  const p = $("#p-kadro");
  p.replaceChildren();
  p.append(baslik("Kadro"));
  const t = el("table", { className: "tablo" });
  const b = el("tr");
  ["Ad", "Nöbet", "Ödeme Puanı Hedefi"].forEach(m => b.append(el("th", { scope: "col", textContent: m })));
  const h0 = MOTOR.hazirla(V, false);
  t.append(b);
  basYardim(t, { Ad: "Hemşirenin adı.", "Nöbet": "Kişinin bu ay tutacağı nöbet payı. 0 yazarsan o ay hiç nöbet yazılmaz.", "Ödeme Puanı Hedefi": "Nöbet sayısıyla orantılı hesaplanır, elle girilmez. 3 nöbet tutan 3 nöbetlik, 6 tutan 6 nöbetlik puan alır. " + GUN_PUAN });
  V.kisiler.forEach(k => {
    const tr = el("tr");
    tr.append(el("td", { className: "ad", textContent: k.ad }));
    const td = el("td", { className: "nobet-kutu" });
    td.append(nobetSayac(k, () => kadroUyari()));
    tr.append(td);
    tr.append(el("td", { className: "gec", textContent: f1(h0.pTaban[V.kisiler.indexOf(k)]) }));
    t.append(tr);
  });
  p.append(t);
  p.append(yd(el("p", { className: "yardim uyari", id: "kadroUyari" }), "Toplam Kontrolü", "Kadrodaki nöbet payları toplamı ile ayın gerektirdiği nöbet (gün × günlük kişi) karşılaştırılır. Uyuşmazsa herkesin hedefi aynı oranda büyütülür ya da küçültülür."));
  kadroUyari();
  p.append(yardim("Nöbet: kişinin bu ayki nöbet payı. Ödeme puanı hedefi nöbet sayısıyla aynı oranda hesaplanır: 3 nöbet tutan 3 nöbetlik, 6 tutan 6 nöbetlik puan alır. Böylece az nöbet tutan biri hep Cumartesi tutup çok nöbet tutanla aynı parayı alamaz. Cuma 2, Cumartesi 3, Pazar ve tatil 2, diğer günler 1 puan."));
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
    el("span", { textContent: "Sol Ctrl + tık: o haftanın Pzt–Cum günleri ✗ · İsme tık: bütün ay ✗" })
  );
  p.append(yd(lej, "Renkler ve İşaretler", "✓ istiyor: bu gün nöbet istiyor. ✗ istemiyor: izinli ya da bu gün nöbet istemiyor. Gri sütunlar hafta sonu, renkli sütunlar resmi tatil.\n\nSol Ctrl basılıyken o haftanın Pazartesi–Cuma kutuları yanar; tıklarsan hepsi ✗ olur, bir daha tıklarsan kalkar. İsme tıklarsan bütün ay ✗ olur; bir daha tıklarsan geri alınır."));
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
    const hi = SOLCTRL && td.parentElement.querySelector(".hc") ? haftaIci(i) : [];
    for (const tr of t.rows) {
      for (let d = 1; d <= G; d++) {
        const c = tr.cells[d];
        if (!c) continue;
        if (tr === td.parentElement && hi.includes(d)) { c.classList.add("ctrl"); vurgu.push(c); }
        else if (d === i) { c.classList.add("kol"); vurgu.push(c); }
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
  cg.append(el("col", { className: "c-nobet" }));
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
    yd(th, tarihMetin(d) + " " + MOTOR.GUN[w], (T[d] ? T[d].ad + (T[d].tam ? ": resmi tatil, Pazar gibi 2 puan sayılır." : ": arife, yarım gün.") + "\n\n" : "") + "Bu sütundaki kutular o günün istekleri. Fare sütunun üstündeyken sütun vurgulanır.");
    isaret(th, d);
    b.append(th);
  }
  b.append(yd(el("th", { scope: "col", textContent: "Nöbet" }), "Nöbet", "Kişinin bu ay tutacağı nöbet sayısı. Ayarlar › Kadro'daki sayıyla aynıdır; ikisinden de değiştirilebilir. Değişince Listeyi Oluştur'a bas."));
  b.append(yd(el("th", { scope: "col", textContent: "Toplam" }), "Toplam", "Kişinin bu aydaki ✓ istiyor ve ✗ istemiyor sayısı. En az istekte bulunanın isteği önceliklidir."));
  b.cells[0].dataset.yb = "Ad";
  b.cells[0].dataset.ym = "İsme tıklarsan o kişinin bütün ayı ✗ olur (örneğin tüm ay izinli). Bir daha tıklarsan ✗'ler kalkar.";
  t.append(b);
  V.kisiler.forEach(k => {
    const tr = el("tr");
    const adTd = el("td");
    const ad = el("button", { type: "button", className: "ad-dgm", textContent: k.ad });
    adTd.append(ad);
    tr.append(adTd);
    const nTd = el("td", { className: "nobet-kutu" });
    nTd.append(nobetSayac(k, () => kadroUyari()));
    const top = yd(el("td", { className: "top" }), "Toplam", "Kişinin bu aydaki ✓ istiyor ve ✗ istemiyor sayısı. En az istekte bulunanın isteği önceliklidir.");
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
          const gunler = haftaIci(d);
          const qq = gunler.every(x => istekDurum(k, x) === 2) ? 0 : 2;
          gunler.forEach(x => uygula(x, qq));
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
    tr.append(nTd, top);
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
  p.append(yardim("Sol tık ✓ istiyor, sağ tık ✗ istemiyor; aynı tık bir daha basılırsa kutu boşalır. Basılı tutup sürüklersen geçtiğin kutular aynı şekilde boyanır. Sol Ctrl basılıyken tıklarsan o haftanın Pazartesi–Cuma günleri birden ✗ olur. En az istekte bulunanın isteği önceliklidir."));
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
      yd(anahtar(r.acik !== false, "", v => { r.acik = v; degis(); }), "Durum", DURUM_Y),
      el("span", { className: "etiket", textContent: "En az" }),
      yd(sayac(r.enAz || 1, 1, 6, (i + 1) + ". talep en az", v => { r.enAz = v; degis(); }), "En Az Kaç Gün", "Seçilen kişilerin her birine bu günden en az kaç nöbet yazılacağı. − ve + ile 1 ile 6 arasında ayarla."),
      yd(gunSecici(r.gun, (i + 1) + ". talep günü", v => { r.gun = v; degis(); }), "Talep Günü", "Hangi haftagünü için talep olduğu. Örnek: Perşembe seçip 1 yaparsan seçilen herkese en az bir Perşembe nöbeti düşer."),
      yd(el("span", { className: "etiket", textContent: r.kisiler.length + " kişi" }), "Kişi Sayısı", "Bu talebe seçilmiş kişi sayısı. Aşağıdaki adlara tıklayarak ekle ya da çıkar.")
    );
    const sil = yd(el("button", { type: "button", className: "dgm dgm-sil", textContent: "Sil" }), "Talebi Sil", SIL_Y);
    sil.onclick = () => { V.ozel.splice(i, 1); degis(); };
    ust.append(el("span", { className: "bosluk" }), sil);
    k.append(ust);
    const c = el("div", { className: "cipler" });
    V.kisiler.forEach(q => {
      const b = yd(el("button", { type: "button", className: "cip", textContent: q.ad }), q.ad, "Tıkla: bu kişiyi talebe ekle ya da çıkar. Renkli olanlar talebe dahil.");
      b.setAttribute("aria-pressed", String(r.kisiler.includes(q.ad)));
      b.onclick = () => { r.kisiler = r.kisiler.includes(q.ad) ? r.kisiler.filter(x => x !== q.ad) : r.kisiler.concat(q.ad); degis(); };
      c.append(b);
    });
    k.append(c);
    liste.append(k);
  });
  if (!V.ozel.length) liste.append(yardim("Bu ay için özel talep yok."));
  p.append(liste);
  const ekle = yd(el("button", { type: "button", className: "dgm", textContent: "Talep Ekle" }), "Talep Ekle", "Yeni bir “en az N gün” talebi ekler. Varsayılan: en az 1 Perşembe, kimse seçili değil.");
  ekle.onclick = () => { V.ozel.push({ gun: 4, enAz: 1, kisiler: [], acik: true }); degis(); };
  const kop = yd(el("button", { type: "button", className: "dgm", textContent: "Önceki Aydan Kopyala" }), "Önceki Aydan Kopyala", "Geçen ayın özel taleplerini bu aya ekler. Kadroda artık olmayan kişiler atlanır; var olan talepler silinmez.");
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
  const ileri = yd(el("button", { type: "button", className: "dgm dgm-birincil", id: "btnOzelOlustur", textContent: "Sonraki: Listeyi Oluştur" }), "Sonraki: Listeyi Oluştur", "Özel talepleri bitirdiysen bas: liste hazırlanır, bitince Liste ve Çetele sekmesi açılır.");
  ileri.onclick = () => uret(true);
  p.append(satir(ekle, kop, el("span", { className: "bosluk" }), ileri));
}

function kuralCiz() {
  const p = $("#p-kural");
  p.replaceChildren();
  const K = V.kural;
  const degis = () => { V.kural = MOTOR.kuralNorm(K, V.kisiler); degisti(); kuralCiz(); };
  p.append(baslik("Kurallar"));
  const ag = yd(el("select", { className: "tk-input ince" }), "Gün Ağırlığı", "Ödeme Puanına Göre: Cuma 2, Cumartesi 3, Pazar ve tatil 2, diğer günler 1 sayılır; ağır günler herkese puan payına göre dağıtılır.\n\nTüm Günler Eşit: bütün günler 1 sayılır, yalnız nöbet sayısı dengelenir.");
  ag.setAttribute("aria-label", "Gün ağırlığı");
  [["puan", "Ödeme Puanına Göre (Cum 2, Cmt 3, Paz 2, diğer 1)"], ["esit", "Tüm Günler Eşit"]].forEach(([v, m]) => ag.append(el("option", { value: v, textContent: m, selected: K.odemeModu === v })));
  ag.onchange = () => { K.odemeModu = ag.value; degis(); };
  const dg = yd(el("select", { className: "tk-input ince" }), "Dağıtım", "Para Eşitliği: herkesin puanı eşitlenir, aradaki fark en çok 1 olur. Az nöbet isteyen önce en ucuz günlerini bırakır (Pzt-Çar, sonra Per, sonra Cum ve Paz, en son Cmt); bıraktığı nöbetler en az puanı olana, eşitlikte daha çok nöbet tutana gider. Bu ayın ±1 farkı geçmişe yazılır ve sonraki aylarda kapanır.\n\nİsteğe Oranlı: eski yöntem; herkesin hedefi istediği nöbet sayısıyla orantılıdır.");
  dg.setAttribute("aria-label", "Dağıtım");
  [["para", "Para Eşitliği"], ["oran", "İsteğe Oranlı"]].forEach(([v, m]) => dg.append(el("option", { value: v, textContent: m, selected: K.dagitim === v })));
  dg.onchange = () => { K.dagitim = dg.value; degis(); };
  p.append(satir(
    yd(anahtar(K.ardArda, "Art Arda Nöbet Yasak", v => { K.ardArda = v; degis(); }), "Art Arda Nöbet Yasak", "Açıkken kimseye iki gün üst üste nöbet yazılmaz. Kapalıyken yine de kaçınılır ama gerekirse yazılır."),
    yd(anahtar(V.zorunlu, "İstekler Zorunlu", v => { V.zorunlu = v; degisti(); kuralCiz(); }), "İstekler Zorunlu", "Açıkken ✓ istenen günler mutlaka verilir, ✗ istenmeyen günlere kimse yazılmaz; adalet bunun etrafında kurulur.\n\nKapalıyken istekler güçlü bir tercihtir: adalet için gerekirse biri çiğnenir ve Analiz'de “eksik” görünür. Varsayılan açık."),
    el("span", { className: "etiket", textContent: "Gün Ağırlığı" }), ag,
    el("span", { className: "etiket", textContent: "Dağıtım" }), dg
  ));
  p.append(baslik("Bu Günden Sonra Boş Kalsın", "h3"));
  const t = el("table", { className: "tablo" });
  const b = el("tr");
  ["Durum", "Nöbet Günü", "Boş Kalacak Günler", "Hangi Nöbetler", "Kesin", ""].forEach(m => b.append(el("th", { scope: "col", textContent: m })));
  t.append(b);
  basYardim(t, { Durum: DURUM_Y, "Nöbet Günü": "Kuralın başladığı gün. Bu gün nöbet tutan kişi için sonraki günler boş bırakılır.", "Boş Kalacak Günler": "Nöbet gününden sonra o kişiye nöbet yazılmayacak günler. İşaretli olanlar boş kalır.", "Hangi Nöbetler": "Nöbetlerinden biri: kişinin bu ay tuttuğu bu günlerden en az birinin ardından boş günler bırakılır.\n\nHer nöbeti: bu gün tutulan her nöbetin ardından boş günler bırakılır.", Kesin: KESIN });
  const td = (...x) => { const c = el("td"); c.append(...x); return c; };
  K.sonraBos.forEach((r, i) => {
    const tr = el("tr");
    const bos = el("div", { className: "cipler" });
    for (let o = 1; o <= 6; o++) {
      const w = (r.gun + o) % 7;
      bos.append(yd(kutu(r.bos.includes(w), MOTOR.KISA[w], v => { r.bos = v ? [...r.bos, w] : r.bos.filter(x => x !== w); degis(); }), "Boş Kalacak Gün: " + MOTOR.GUN[w], "İşaretliyse " + MOTOR.GUN[r.gun] + " nöbetinden sonraki " + MOTOR.GUN[w] + " o kişiye nöbet yazılmaz."));
    }
    const ks = yd(el("select", { className: "tk-input ince" }), "Hangi Nöbetler", MOTOR.GUN[r.gun] + " nöbetlerinden biri: kişinin bu ay tuttuğu " + MOTOR.GUN[r.gun] + " günlerinden en az birinin ardından boş günler bırakılır. Diğer " + MOTOR.GUN[r.gun] + " nöbetlerinden sonra hafta sonu nöbeti yazılabilir.\n\nHer " + MOTOR.GUN[r.gun] + " nöbeti: her " + MOTOR.GUN[r.gun] + " nöbetinin ardından boş günler bırakılır.");
    ks.setAttribute("aria-label", (i + 1) + ". kural kapsamı");
    [["bir", MOTOR.GUN[r.gun] + " nöbetlerinden biri"], ["hepsi", "Her " + MOTOR.GUN[r.gun] + " nöbeti"]].forEach(([v, m]) => ks.append(el("option", { value: v, textContent: m, selected: r.kapsam === v })));
    ks.onchange = () => { r.kapsam = ks.value; degis(); };
    const sil = yd(el("button", { type: "button", className: "dgm dgm-sil", textContent: "Sil" }), "Kuralı Sil", SIL_Y);
    sil.onclick = () => { K.sonraBos.splice(i, 1); degis(); };
    tr.append(
      td(yd(anahtar(r.acik, "", v => { r.acik = v; degis(); }), "Durum", DURUM_Y)),
      td(yd(gunSecici(r.gun, (i + 1) + ". kural günü", v => { r.gun = v; r.bos = []; degis(); }), "Nöbet Günü", "Kuralın başladığı gün. Değiştirince boş kalacak günler sıfırlanır, yeniden işaretle.")),
      td(bos), td(ks),
      td(yd(kutu(r.kesin, "Kesin", v => { r.kesin = v; degis(); }), "Kesin", KESIN)),
      td(sil)
    );
    t.append(tr);
  });
  p.append(t);
  const ekle = yd(el("button", { type: "button", className: "dgm", textContent: "Kural Ekle" }), "Kural Ekle", "Yeni bir “bu günden sonra boş kalsın” kuralı ekler. Varsayılan: Perşembe nöbetlerinden birinin ardından Cuma, Cumartesi, Pazar boş.");
  ekle.onclick = () => { K.sonraBos.push({ gun: 4, bos: [5, 6, 0], kapsam: "bir", kesin: false, acik: true }); degis(); };
  const varsay = yd(el("button", { type: "button", className: "dgm", textContent: "Varsayılana Dön" }), "Varsayılana Dön", "Art arda yasağı, gün ağırlığını ve boş kalma kurallarını ilk hâline getirir: Perşembe nöbetlerinden birinin ardından Cumartesi ve Pazar boş. Gruplar ve İstekler Zorunlu değişmez.");
  varsay.onclick = () => { Object.assign(K, { ardArda: MOTOR.KURAL.ardArda, odemeModu: MOTOR.KURAL.odemeModu, sonraBos: kopya(MOTOR.KURAL.sonraBos) }); degis(); };
  p.append(satir(ekle, varsay));
  p.append(yardim("Örnek: Perşembe → Cmt, Paz işaretli ve \u201cPerşembe nöbetlerinden biri\u201d seçiliyse, herkesin tuttuğu perşembelerden en az birinin ardından hafta sonu boş kalır. \u201cHer Perşembe nöbeti\u201d seçilirse her perşembe nöbetinden sonra hafta sonu boş kalır. Kesin işaretli değilse kural güçlü bir tercihtir, gerekirse çiğnenir ve Sorunlar'da yazar. Gruplar ve aynı gün kuralları İleri Seviye'de."));
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
    const ad = yd(el("input", { className: "tk-input ince", type: "text", value: g.ad }), "Grup Adı", "Grubun adı, örneğin Çömezler. Analiz'de kişinin altında ve Aynı Gün Kuralları'nda bu ad görünür.");
    ad.setAttribute("aria-label", (i + 1) + ". grubun adı");
    ad.onchange = () => { g.ad = ad.value.trim() || "Grup " + (i + 1); degis(); };
    const sinirli = g.enFazla !== null;
    const sil = yd(el("button", { type: "button", className: "dgm dgm-sil", textContent: "Sil" }), "Grubu Sil", "Grubu ve bu grubu kullanan aynı gün kurallarını siler.");
    sil.onclick = () => { K.gruplar.splice(i, 1); degis(); };
    const ust = satir(
      ad,
      yd(anahtar(g.acik, "", v => { g.acik = v; degis(); }), "Durum", DURUM_Y),
      yd(kutu(sinirli, "Aynı gün en fazla", v => { g.enFazla = v ? 1 : null; degis(); }), "Aynı Gün En Fazla", "İşaretliyse bu grubun üyelerinden aynı güne en fazla yandaki sayı kadar kişi yazılır. Örnek: 1 ise iki çömez aynı gün nöbet tutmaz.")
    );
    if (sinirli) ust.append(yd(sayac(g.enFazla, 0, 12, g.ad + " aynı gün en fazla", v => { g.enFazla = v; degis(); }), "Sınır", "Bu gruptan aynı güne yazılabilecek en fazla kişi. 0: bu gruptan kimse yazılmaz."));
    ust.append(yd(kutu(g.kesin, "Kesin", v => { g.kesin = v; degis(); }), "Kesin", KESIN), el("span", { className: "bosluk" }), sil);
    k.append(ust);
    const iki2 = el("div", { className: "iki-liste" });
    const uy = el("div"), dg = el("div");
    uy.append(el("h3", { textContent: "Üyeler (" + g.uyeler.length + ")" }));
    dg.append(el("h3", { textContent: "Diğerleri" }));
    const cu = el("div", { className: "cipler" }), cd = el("div", { className: "cipler" });
    V.kisiler.forEach(q => {
      const uye = g.uyeler.includes(q.ad);
      const b = yd(el("button", { type: "button", className: "cip", textContent: q.ad }), q.ad, uye ? "Grup üyesi. Tıklarsan gruptan çıkar ve Diğerleri'ne geçer." : "Grupta değil. Tıklarsan gruba eklenir ve Üyeler'e geçer.");
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
  const gEkle = yd(el("button", { type: "button", className: "dgm", textContent: "Grup Ekle" }), "Grup Ekle", "Yeni boş bir grup ekler. Sonra adına tıklayarak üye ekle; varsayılan sınır aynı gün en fazla 1.");
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
    basYardim(t, { Durum: DURUM_Y, Grup: "Kuralın iki tarafındaki gruplar. Aynı grup iki tarafta da seçilebilir.", Kural: "Aynı gün olmasın: iki grubun üyeleri aynı güne yazılmaz. Aynı gün olsun: birinin nöbeti olan günde diğer gruptan da biri yazılır.", Kesin: KESIN });
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
      const tur = yd(el("select", { className: "tk-input ince" }), "Kural Türü", "Aynı gün olmasın: iki grubun üyeleri aynı güne yazılmaz. Aynı grup iki tarafta seçiliyse o grubun üyeleri birbiriyle aynı güne düşmez.\n\nAynı gün olsun: birinci gruptan biri nöbetteyken ikinci gruptan da biri yazılır.");
      tur.setAttribute("aria-label", (i + 1) + ". kural türü");
      [["ayri", "aynı gün olmasın"], ["birlikte", "aynı gün olsun"]].forEach(([v, m]) => tur.append(el("option", { value: v, textContent: m, selected: r.tur === v })));
      tur.onchange = () => { r.tur = tur.value; degis(); };
      const sil = yd(el("button", { type: "button", className: "dgm dgm-sil", textContent: "Sil" }), "Kuralı Sil", SIL_Y);
      sil.onclick = () => { K.iliski.splice(i, 1); degis(); };
      tr.append(
        td(yd(anahtar(r.acik, "", v => { r.acik = v; degis(); }), "Durum", DURUM_Y)),
        td(yd(grupSec(r.a, (i + 1) + ". kural birinci grup", v => { r.a = v; degis(); }), "Birinci Grup", "Kuralın ilk tarafındaki grup.")),
        td(tur),
        td(yd(grupSec(r.b, (i + 1) + ". kural ikinci grup", v => { r.b = v; degis(); }), "İkinci Grup", "Kuralın ikinci tarafındaki grup. Birinciyle aynı seçilirse kural grubun kendi üyeleri arasında geçerli olur.")),
        td(yd(kutu(r.kesin, "Kesin", v => { r.kesin = v; degis(); }), "Kesin", KESIN)),
        td(sil)
      );
      t.append(tr);
    });
    p.append(t);
    const iEkle = yd(el("button", { type: "button", className: "dgm", textContent: "Kural Ekle" }), "Aynı Gün Kuralı Ekle", "İki grup arasında yeni bir “aynı gün olsun / olmasın” kuralı ekler. Varsayılan: ilk iki grup aynı gün olmasın.");
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
  const ob = yd(el("button", { type: "button", className: "dgm", textContent: "Bu Aya Yansıyan" }), "Bu Aya Yansıyan", "Hesaba katılan bütün ayların toplam farkını sağda gösterir: kim fazla, kim eksik tuttu ve bu ay ne olacak.");
  ob.onclick = () => { GSEC = null; gecmisCiz(); };
  ozet.append(ob);
  sol.append(ozet);
  GD.aylar.forEach(m => {
    const s = el("div", { className: "ay-satir" });
    s.setAttribute("aria-current", String(GSEC === m.k));
    const b = yd(el("button", { type: "button", className: "dgm" }), ayKisa(m.k), m.tur === "elle" ? "Elle girilmiş ay. Tıkla: çetelesini sağda düzenle." : "Program içinde listesi kayıtlı ay. Tıkla: çetelesini ve listesini sağda gör.");
    b.append(ayKisa(m.k), el("span", { className: "ay-tur", textContent: m.tur === "elle" ? "elle" : "kayıtlı" }));
    b.onclick = () => { GSEC = m.k; gecmisCiz(); };
    const d = yd(el("button", { type: "button", className: "dgm", textContent: m.dahil ? "Katılıyor" : "Katılmıyor" }), "Hesaba Katılsın mı", "Katılıyor: bu aydaki fazlalık ve eksiklik yeni listede ve genel çetelede dengelenir. Katılmıyor: ay saklanır ama sayılmaz. Tıklayınca değişir.");
    d.setAttribute("aria-pressed", String(m.dahil));
    d.setAttribute("aria-label", ayKisa(m.k) + " geçmişe " + (m.dahil ? "katılıyor" : "katılmıyor"));
    d.onclick = () => { GA.aylar[m.k] = !m.dahil; gecmisAyarYaz(); yenidenKur(); };
    s.append(b, d);
    sol.append(s);
  });
  if (!GD.aylar.length) sol.append(yardim("Önceki aylarda kayıt yok."));
  const sec = yd(el("select", { className: "tk-input ince" }), "Elle Eklenecek Ay", "Programda listesi olmayan geçmiş bir ayı seç; yanındaki Elle Ay Ekle ile kâğıttaki çeteleyi girersin.");
  sec.setAttribute("aria-label", "Elle eklenecek ay");
  let py = V.yil, pa = V.ay;
  for (let i = 0; i < 24; i++) {
    pa--;
    if (pa < 1) { pa = 12; py--; }
    const ak = ayKod(py, pa);
    if (!GA.manuel[ak]) sec.append(el("option", { value: ak, textContent: ayKisa(ak) }));
  }
  const ekle = yd(el("button", { type: "button", className: "dgm", textContent: "Elle Ay Ekle" }), "Elle Ay Ekle", "Seçili ayı boş bir çetele olarak ekler ve hesaba katar. Sağda her kişinin gün sayılarını ve hakkını yaz.");
  ekle.onclick = () => {
    const ak = sec.value;
    if (!ak) return;
    const kisiler = {};
    V.kisiler.forEach(k => { kisiler[k.ad] = { hg: [0, 0, 0, 0, 0, 0, 0], hn: k.nobet, hp: +f1(k.nobet * puanOrt()) }; });
    GA.manuel[ak] = { kisiler };
    GA.aylar[ak] = true;
    GSEC = ak;
    gecmisAyarYaz();
    yenidenKur();
  };
  sol.append(satir(sec, ekle));
  if (Object.keys(GA.elle).length) {
    const sifir = yd(el("button", { type: "button", className: "dgm dgm-sil", textContent: "Eski Toplamı Temizle" }), "Eski Toplamı Temizle", "Eski sürümde tek satır olarak girilen toplam geçmişi siler. Aylık kayıtlar etkilenmez.");
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
  basYardim(t, { Ad: "Hemşirenin adı.", "Nöbet Farkı": "Hesaba katılan aylarda hakkından fazla (+) ya da eksik (−) tutulan nöbet.", "Puan Farkı": "Hesaba katılan aylarda hakkından fazla (+) ya da eksik (−) alınan ödeme puanı.", Etkisi: "Farkın bu aya etkisi: fazla tuttuysa hedefi düşer, eksik tuttuysa artar." });
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
  kap.append(basYardim(ceteleTablo(rows, true), Object.assign({}, CETELE_BAS, { "GEÇMİŞ": "O ay hakkına göre fark: + fazla, − eksik tuttu." })));
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
  basYardim(t, CETELE_BAS);
  const adlar = [...new Set(V.kisiler.map(k => k.ad).concat(Object.keys(man.kisiler || {})))];
  const guncel = () => { gecmisAyarYaz(); V.gecmis = gecmisHesapla(V.yil, V.ay); if (L) ESKI = true; sakla(); ceteleCiz(); analizCiz(); durumCiz(); ayPanelCiz(); };
  adlar.forEach(ad => {
    const kk = V.kisiler.find(k => k.ad === ad);
    const x = man.kisiler[ad] || (man.kisiler[ad] = { hg: [0, 0, 0, 0, 0, 0, 0], hn: kk ? kk.nobet : 0, hp: kk ? +f1(kk.nobet * puanOrt()) : 0 });
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
      yd(i, ad + " · " + e, e.startsWith("hak") ? "O ay tutması gereken " + (e === "hak nöbet" ? "nöbet sayısı" : "ödeme puanı") + ". Kâğıttaki çetelede yazan hakkı gir." : "Bu kişinin o ay " + e + " günlerinde tuttuğu nöbet sayısı.");
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
  const sil = yd(el("button", { type: "button", className: "dgm dgm-sil", textContent: "Bu Elle Ayı Sil" }), "Bu Elle Ayı Sil", "Bu elle girilmiş ayı ve çetelesini siler; artık hesaba katılmaz.");
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
    s.append(sol, yd(kontrol, bas, ac + (kontrol.tagName === "BUTTON" ? "\n\nTıklayınca açılır ya da kapanır; hemen kaydedilir." : "\n\n− ve + ile ayarla; hemen kaydedilir.")));
    l.append(s);
  };
  sat("Güncellemeden Önce Sor", "Açıkken yeni sürüm bulununca kurmadan önce sorar; kapalıyken kendiliğinden kurar.",
    anahtar(AYAR.onayIste, "", v => { ayarYaz({ onayIste: v }); genelCiz(); }));
  sat("Yeşil Yol", "Sıradaki adımı 2 saniyelik yeşil bir çerçeveyle gösterir.",
    anahtar(AYAR.yesilYol, "", v => { ayarYaz({ yesilYol: v }); if (!v) yolTemizle(); genelCiz(); }));
  sat("Rehber", "Açılışta sağ Ctrl yardımını hatırlatan yeşil ipucunu gösterir ve Listeyi Oluştur'a ilk basışta önce Özel Talepler'e yönlendirir.",
    anahtar(AYAR.rehber, "", v => { ayarYaz({ rehber: v, rehberSoruldu: true }); if (!v) $("#ipucuBar").hidden = true; genelCiz(); }));
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
    ["r3", "İstekler:", "Sol tık ✓ istiyor, sağ tık ✗ istemiyor. Basılı sürükleyerek boya. Sol Ctrl + tık o haftanın Pzt–Cum günlerini ✗ yapar. İsme tıklamak bütün ayı ✗ yapar."],
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

const ANA = { cetele: ["cetele"], hazir: ["istek", "ozel", "liste", "alt", "analiz", "sorun"], ayar: ["kadro", "kural", "ileri", "gecmis", "genel", "hakkinda"] };
const SON_ALT = { cetele: "cetele", hazir: "istek", ayar: "kadro" };
const ANA_AD = Object.keys(ANA);
const anaBul = ad => ANA_AD.find(a => ANA[a].includes(ad)) || "ayar";

function sekme(ad) {
  const ana = anaBul(ad);
  AKTIF = ad;
  SON_ALT[ana] = ad;
  if (ad === "ozel") OZEL_GORULDU = true;
  ANA_AD.forEach(a => {
    const b = $("#ana-" + a);
    b.setAttribute("aria-selected", String(a === ana));
    b.tabIndex = a === ana ? 0 : -1;
  });
  ANA_AD.flatMap(a => ANA[a]).forEach(s => {
    const a = s === ad;
    const b = $("#sk-" + s);
    b.hidden = anaBul(s) !== ana;
    const ok = b.previousElementSibling;
    if (ok && ok.classList.contains("sekme-ok")) ok.hidden = b.hidden;
    b.setAttribute("aria-selected", String(a));
    b.tabIndex = a ? 0 : -1;
    $("#p-" + s).hidden = !a;
  });
  $("#govde").dataset.mod = ad === "liste" || ad === "alt" ? "yan" : "tek";
  if (ad === "ozel") yol("#btnOzelOlustur");
}

function sekmeKur() {
  Object.entries(ANA).forEach(([a, dizi]) => dizi.slice(1).forEach(s => {
    const o = el("span", { className: "sekme-ok", textContent: "›" });
    o.setAttribute("aria-hidden", "true");
    o.dataset.ana = a;
    $("#sk-" + s).before(o);
  }));
  ANA_AD.forEach((a, i, dizi) => {
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
  ["#bagCetele", "Çeteleye Bağlı", "Varsayılan. Liste genel çeteleye göre oluşur: önceki aylarda eksik kalanın hedefi artar, fazla tutanınki düşer."],
  ["#bagYalniz", "Yalnız Bu Ay", "Liste geçmiş farklara bakmadan, yalnız bu ayın adaletine göre oluşur. Genel çetele değişmez; kabul edersen bu ay yine ona eklenir."],
  ["#durum", "Durum", "Listenin kurallara uyup uymadığı. Ayrıntı Sorunlar sekmesinde."],
  ["#ilerleme", "İlerleme", "Kaç alternatifin denendiği ve kalan süre."],
  [".kayit-dgm", "Kayıt", "Tıkla: bu kaydı yükle. Sol tuşla 1 saniye basılı tut: şimdiki listeyi buraya kaydet. Sağ tuşla 1 saniye basılı tut: kaydı sil. Dolu kayıt renkli; üzerinde durunca tarih ve saati görünür."],
  ["table.cetele.etk td.ad .ad-dgm", "İsim", "Tıkla: bu kişinin nöbetleri listede yanar. Bir daha tıkla: söner."],
  ["table.cetele.etk .gun-dgm", "Gün", "Tıkla: listede bu günler yanar. Bir daha tıkla: söner."],
  ["table.cetele.etk td.tasin", "Nöbet Ver", "Başka birinin aynı sütununa sürükle: o günün nöbetini ona ver. Sürüklerken yeşil sorunsuz, sarı bir kişinin isteği, turuncu iki kişinin isteği bozulur, kırmızı kural bozulur."],
  ["#btnKopya", "Excel'e Kopyala", "Listeyi panoya kopyalar, Excel'e yapıştırılır."],
  ["#btnCsv", "CSV Kaydet", "Listeyi CSV dosyası olarak kaydeder."],
  ["#btnYazdir", "Yazdır", "Listeyi ve bu ayın çetelesini yan yana, A4 yatay tek sayfaya sığacak şekilde yazdırır."],
  ["#liste", "Nöbet Listesi", "Tıkla: kişiyi seç. Sürükle: başka bir hücreyle yer değiştir; sürüklerken hücre yazısı renklenir: yeşil sorunsuz, sarı bir kişinin, turuncu iki kişinin isteği ya da ücret sırası bozulur, kırmızı kural bozulur (bırakırsan yine de taşınır, nöbet sabitlenir ve yeni liste yapılır). Sağ tık: hücreyi sabitle, Listeyi Oluştur onu korur. Uyarı renkli yazı istemediği güne ya da art arda nöbete düşmüş demek."],
  ["table.istek .ad-dgm", "İsim", "Tıkla: bütün ayı ✗ yap. Bir daha tıkla: geri al."],
  ["table.istek .hc", "İstek Kutusu", "Sol tık ✓, sağ tık ✗, aynı tık boşaltır. Sürükleyerek boya. Sol Ctrl + tık: o haftanın Pzt–Cum günleri ✗."],
  ["#btnIstekSifir", "Tüm İstekleri Sıfırla", "Bu ayın bütün ✓ ve ✗ işaretlerini siler. Yanlışlıkla silinmesin diye iki kez basılır: ilk basışta düğme onay ister, 3 saniye içinde bir daha basarsan siler."],
  ["#btnOzelSonraki", "Sonraki: Özel Talepler", "İstekleri bitirdiysen bas; Özel Talepler sekmesine geçer."],
  ["#ipucuBar", "Rehber İpucu", "Her açılışta görünür. Üstüne tıklayınca ya da herhangi bir Ctrl tuşuna basınca kapanır. Ayarlar › Genel'de rehber kapalıysa hiç çıkmaz."],
  [".nobet-sayac .dgm-kare", "Nöbet Sayısı", "− azaltır, + artırır. Bu kişinin bu ay tutacağı nöbet sayısı; İstekler ve Ayarlar › Kadro'da aynıdır. Değiştirince Listeyi Oluştur'a bas."],
  ["#sk-istek, #p-istek", "1 · İstekler", "Kimin hangi gün nöbet istediği (✓) ya da istemediği (✗)."],
  ["#sk-ozel, #p-ozel", "2 · Özel Talepler", "Şu kişilere en az 1 Perşembe gibi talepler."],
  ["#sk-liste, #p-liste", "3 · Liste ve Çetele", "Oluşan liste ve herkesin haftagünlerine göre nöbet sayısı."],
  [".alt-satir", "Alternatif", "1000 üzerinden puan. Üstüne gel: önizle. Tıkla: seç."],
  ["#sk-alt, #p-alt", "4 · Alternatifler", "Denenen listelerin en iyileri."],
  ["#sk-analiz, #p-analiz", "Analiz", "Herkesin hedefe göre nöbet, puan ve gün dağılımı."],
  ["#sk-sorun, #p-sorun", "Sorunlar", "Kuralı çiğneyen ya da verilemeyen her şey. Sorun varsa sekme turuncu olur ve yanında sayısı görünür."],
  [".sekme-ok", "Adım Ayracı", "Sekmeler arasındaki ok yalnız sırayı gösterir; tıklanmaz."],
  ["#sk-kadro, #p-kadro", "Kadro", "Herkesin nöbet ve ödeme puanı payı."],
  ["#sk-kural, #p-kural", "Kurallar", "Art arda nöbet, perşembe sonrası boş günler, gün ağırlığı, isteklerin zorunluluğu."],
  ["#sk-ileri, #p-ileri", "İleri Seviye", "Gruplar ve aynı gün olsun / olmasın kuralları."],
  ["#sk-gecmis, #p-gecmis", "Geçmiş", "Önceki ayların çetelesi; hangi ayların hesaba katılacağı."],
  ["#sk-genel, #p-genel", "Genel", "Güncelleme, Yeşil Yol, rehber, resmi tatil, alternatif sayısı."],
  ["#sk-hakkinda, #p-hakkinda", "Hakkında", "Programın tanıtımı ve kullanımı."],
  ["#liste select", "Nöbetçi Kutusu", "Tıkla: başka birini seç, — boşaltır. Sürükle: başka bir hücreyle yer değiştir; yeşil sorunsuz, sarı bir kişinin, turuncu iki kişinin isteği ya da ücret sırası bozulur, kırmızı kural bozulur (bırakırsan yine de taşınır, nöbet sabitlenir ve yeni liste yapılır). Sağ tık: sabitle, Listeyi Oluştur korur."],
  ["#liste tr.tatil", "Resmi Tatil", "Resmi tatil günü: Pazar gibi 2 ödeme puanı sayılır. Ayarlar › Genel'den kapatılabilir."],
  ["#liste tr.arife", "Arife", "Arife günü: yarım gün tatil, normal gün gibi sayılır."],
  ["#liste tr.hs", "Hafta Sonu", "Cumartesi 3, Pazar 2 ödeme puanı."],
  ["#baslik", "Liste Başlığı", "Yazdırılan kâğıdın başlığı; ay ve yıl kendiliğinden yazılır."],
  ["#onizYazi", "Önizleme", "Alternatifler sekmesinde bir satırın üstüne gelince o liste burada gösterilir. Tıklarsan seçilir; fareyi çekersen seçili listeye döner."],
  ["#listePnl", "Nöbet Listesi", "Ayın nöbet listesi. Kutulardan elle değiştirebilir, Yazdır ya da Excel'e Kopyala ile dışarı alabilirsin."],
  [".alt-puan", "Alternatif Puanı", "1000 en iyi listedir. Puan, adalet, istekler ve kurallara uyumun toplam ölçüsüdür; düşükse o liste daha çok sapma içerir."],
  [".sorun-liste li", "Sorun", "Kuralı çiğneyen bir durum. Kesin olmayan kurallar gerekirse çiğnenir ve burada yazar. Düzeltmek için istekleri gevşet, kuralı değiştir ya da Alternatifler'den başka liste seç."],
  ["#kisiEksi, #kisiArti", "Günlük Kişi", "Her gün kaç hemşirenin nöbet tutacağı. − ve + ile 1 ile 12 arasında ayarla. Değişince Listeyi Oluştur ile yenile."],
  ["#pKucult", "Küçült", "Pencereyi görev çubuğuna indirir."],
  ["#pBuyult", "Büyüt", "Pencereyi tam ekran yapar ya da eski boyutuna getirir."],
  ["#pKapat", "Kapat", "Programı kapatır. Her şey zaten kaydedildi."],
  ["#gncPanel", "Güncelleme", "Yeni sürüm bulunduğunda burada görünür. Güncelle kurar ve yeniden başlatır; Sonra ertelenir."],
  ["#toast", "Bildirim", "Yapılan işin kısa sonucu; birkaç saniye sonra kendiliğinden kaybolur."],
  ["table.genel .hucre-giris", "Gün Sayısı", "Kâğıttaki çeteleyle uyuşmayan sayıyı doğrudan değiştir. Örnek: biri kayda geçmemiş bir Cumartesi tuttuysa CTESİ sütunundaki sayıyı 1 artır. Fark elle düzeltme olarak saklanır."],
  ["#btnKapsam", "Kapsanan Aylar", "Hangi ayların genel çeteleye katıldığını gösterir ya da gizler."],
  ["#btnDuzeltSifir", "Düzeltmeleri Sıfırla", "Bütün elle düzeltmeleri siler. İki kez basılır."],
  ["table.genel", "Genel Çetele", "Kapsanan ayların ve bu ayın toplamı. FARK: hakkından fazla (+) ya da eksik (−) tutulan nöbet / puan; uyarı renkli fark büyük demek."],
  [".ay-cipler .cip", "Kapsanan Ay", "Tıkla: bu ayı genel çeteleye kat ya da çıkar. Katılan aylardaki fark yeni listede dengelenir."],
  ["#sk-cetele, #p-cetele", "Genel Çetele", "Birkaç ayın toplam nöbet ve puanı. Amaç bu tablodaki farkları sıfıra yaklaştırmak."],
  ["#ana-cetele", "Genel Çetele", "Aylar boyu genel çetele ve elle düzeltme."],
  ["#ana-hazir", "Liste Hazırlama", "İstekler, özel talepler, liste ve alternatifler."],
  ["#ana-ayar", "Ayarlar", "Kadro, kurallar, geçmiş ve genel ayarlar."],
  ["#basbarSurum", "Sürüm", "Güncellemeleri denetler."],
  ["#imza", "İmza", "Teknesyum GitHub sayfasını açar."],
  ["#destek", "Destek", "Geliştiriciyi destekleme sayfasını açar."],
  [".tk-titlebar", "Başlık Çubuğu", "Sürükleyerek taşı; çift tık büyütür."],
  [".ust", "Üst Bölüm", "Ay seçimi, günlük kişi sayısı ve Listeyi Oluştur düğmesi."]
];

const ADIM = {
  cetele: "Bu bölümde kapsanan ayların toplam çetelesi görülür. FARK sütunu sıfırdan uzaksa Liste Hazırlama › İstekler'e geçip bu ayın listesini oluştur; program farkı kapatmaya çalışır.\n\nKâğıttaki çeteleyle uyuşmayan bir sayı varsa tablodaki gün sayısını doğrudan düzelt.",
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
    for (let x = hedef; x && !bul; x = x.parentElement) bul = x.dataset && x.dataset.yb ? [null, x.dataset.yb, x.dataset.ym] : YARDIM.find(([s]) => x.matches && x.matches(s));
    if (!bul) bul = YARDIM.find(([s]) => s.split(", ")[0] === "#sk-" + AKTIF);
    const [, bas, metin] = bul;
    $("#yardimBaslik").textContent = bas;
    paragraf($("#yardimMetin"), metin);
    paragraf($("#yardimSimdi"), simdiMetni());
    $("#yardimSimdi").prepend(el("span", { className: "yardim-etiket", textContent: "Sonraki Adım" }));
    balon.hidden = false;
    const r = balon.getBoundingClientRect();
    const x = Math.min(innerWidth - r.width - 8, Math.max(8, mx + 16));
    const y = my + 20 + r.height > innerHeight ? Math.max(8, my - r.height - 12) : my + 20;
    balon.style.left = x + "px";
    balon.style.top = y + "px";
  };
  const kapat = () => { basili = false; balon.hidden = true; document.body.classList.remove("sag-ctrl"); };
  document.addEventListener("mousemove", e => { mx = e.clientX; my = e.clientY; if (basili) goster(); }, true);
  document.addEventListener("keydown", e => {
    if (e.code === "ControlRight" || e.code === "ControlLeft") $("#ipucuBar").hidden = true;
    if (e.code === "ControlRight") {
      if (!basili) { basili = true; document.body.classList.add("sag-ctrl"); goster(); }
      if (!AYAR.yardimGoruldu) ayarYaz({ yardimGoruldu: true });
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
  $("#ipucuBar").hidden = !AYAR.rehber;
})();

function kayitCiz() {
  document.querySelectorAll(".kayit-dgm").forEach((b, i) => {
    const k = KAYITLAR[i];
    b.dataset.dolu = k ? "1" : "0";
    b.title = k ? "Kayıt " + (i + 1) + ": " + new Date(k.t).toLocaleString("tr-TR") : "Kayıt " + (i + 1) + ": boş";
  });
}

function kayitIslem(i, tur) {
  if (tur === "yukle") {
    const k = KAYITLAR[i];
    if (!k) { toast("Kayıt " + (i + 1) + " boş. Kaydetmek için 1 saniye sol tuşla basılı tut.", "info"); return; }
    if (CALISIYOR) return;
    L = kopya(k.liste);
    V.pin = kopya(k.pin || []);
    ESKI = false;
    sakla();
    ciz();
    durumCiz();
    toast("Kayıt " + (i + 1) + " yüklendi.", "success", 3000);
  } else if (tur === "kaydet") {
    if (!L) { toast("Önce listeyi oluştur.", "info"); return; }
    KAYITLAR[i] = { t: new Date().toISOString(), liste: kopya(L), pin: kopya(V.pin) };
    sakla();
    kayitCiz();
    toast("Kayıt " + (i + 1) + " kaydedildi.", "success", 3000);
  } else {
    if (!KAYITLAR[i]) return;
    KAYITLAR[i] = null;
    sakla();
    kayitCiz();
    toast("Kayıt " + (i + 1) + " silindi.", "info", 3000);
  }
}

document.querySelectorAll(".kayit-dgm").forEach((b, i) => {
  let bas = null;
  const bitir = () => { if (bas) cancelAnimationFrame(bas.raf); bas = null; b.style.setProperty("--dolum", "0"); delete b.dataset.tur; };
  b.addEventListener("contextmenu", e => e.preventDefault());
  b.addEventListener("mousedown", e => {
    if (e.button !== 0 && e.button !== 2) return;
    e.preventDefault();
    const tur = e.button === 0 ? "kaydet" : "sil";
    b.dataset.tur = tur;
    const t0 = performance.now();
    bas = { tur, bitti: false, raf: 0 };
    const ad = () => {
      if (!bas) return;
      const o = Math.min(1, (performance.now() - t0) / 1000);
      b.style.setProperty("--dolum", String(o));
      if (o >= 1) { bas.bitti = true; kayitIslem(i, tur); return; }
      bas.raf = requestAnimationFrame(ad);
    };
    bas.raf = requestAnimationFrame(ad);
  });
  b.addEventListener("mouseup", e => {
    const kisa = bas && !bas.bitti && bas.tur === "kaydet" && e.button === 0;
    bitir();
    if (kisa) kayitIslem(i, "yukle");
  });
  b.addEventListener("mouseleave", bitir);
  b.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); kayitIslem(i, "yukle"); } });
});

function ciz() {
  kayitCiz();
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
    yol("#btnYazdir");
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
$("#bagCetele").onclick = () => bagSec(false);
$("#bagYalniz").onclick = () => bagSec(true);
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
function baskiHazirla() {
  const eski = $("#baski");
  if (eski) eski.remove();
  const b = el("div", { className: "baski", id: "baski" });
  b.setAttribute("aria-hidden", "true");
  b.append(el("h1", { className: "baski-baslik", textContent: $("#baslik").textContent }));
  const sira = el("div", { className: "baski-sira" });
  const lt = $("#liste").cloneNode(true);
  lt.removeAttribute("id");
  lt.querySelectorAll("[id]").forEach(x => x.removeAttribute("id"));
  const kaynak = [...$("#liste").querySelectorAll("select")];
  [...lt.querySelectorAll("select")].forEach((s, i) => {
    const o = kaynak[i] && kaynak[i].selectedOptions[0];
    s.replaceWith(document.createTextNode(o ? o.textContent : ""));
  });
  const ct = ceteleTablo(ayRows(), true, false);
  const sag = el("div", { className: "baski-cetele" });
  sag.append(el("h2", { className: "baski-alt", textContent: "Çetele: " + AYLAR[V.ay - 1] + " " + V.yil }), ct);
  sira.append(lt, sag);
  b.append(sira);
  b.classList.add("olc");
  document.body.append(b);
  const r = b.getBoundingClientRect();
  const w = Math.max(r.width, b.scrollWidth), h = Math.max(r.height, b.scrollHeight);
  b.dataset.olcu = Math.round(w) + "x" + Math.round(h);
  const z = Math.min(1, 1040 / w, 705 / h);
  b.style.zoom = String(Math.floor(z * 1000) / 1000);
  b.classList.remove("olc");
  return b;
}

$("#btnYazdir").onclick = async () => {
  if (!L) return toast("Önce listeyi oluştur.", "warning");
  const b = baskiHazirla();
  try { await W.yazdir(); } finally { b.remove(); }
};
$("#ipucuBar").onclick = () => { $("#ipucuBar").hidden = true; };

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
