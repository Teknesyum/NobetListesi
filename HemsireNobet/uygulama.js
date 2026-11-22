"use strict";

const $ = s => document.querySelector(s);
const el = (t, p) => Object.assign(document.createElement(t), p || {});
const W = window.pencere;
const ET = window.ETIKET || {};
const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const ILK = JSON.parse(JSON.stringify(VERI));

function toast(m, tur) {
  [...$("#toast").children].forEach(x => { if (x.textContent === m) x.remove(); });
  const t = el("div", { className: "tk-toast" + (tur ? " tk-toast-" + tur : ""), role: "status" });
  t.append(el("div", { className: "tk-toast-body", textContent: m }));
  $("#toast").append(t);
  setTimeout(() => t.remove(), 4000);
}

(() => {
  const ad = ET["app.title"] || "";
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

const ayAnahtar = (y, a) => "ay-" + y + "-" + String(a).padStart(2, "0");

let V = null;
let L = null;
let TOHUM = 1;
let ALT = [];
let ALTTOPLAM = 0;
let SEC = 0;
let KOSU = 0;
let CALISIYOR = false;
const kopya = x => JSON.parse(JSON.stringify(x));

function ayarYaz(x) {
  let a = {};
  try { a = JSON.parse(W.veri.oku("ayar") || "{}") || {}; } catch (e) {}
  W.veri.yaz("ayar", JSON.stringify(Object.assign(a, x)));
}

function oku(k) { try { return JSON.parse(W.veri.oku(k)); } catch (e) { return null; } }

function goc(k) {
  if (k.nobet === undefined) k.nobet = k.min !== undefined ? k.min : 7;
  if (k.odeme === undefined) k.odeme = k.max !== undefined ? k.max : 11;
  delete k.min;
  delete k.max;
  return k;
}

let GA = { aylar: {}, elle: {} };
let GD = { aylar: [], detay: {} };

function gecmisAyarOku() {
  const g = oku("gecmis") || {};
  GA = { aylar: g.aylar || {}, elle: g.elle || {} };
}

function gecmisAyarYaz() { W.veri.yaz("gecmis", JSON.stringify(GA)); }

const ayKisa = k => { const [y, a] = k.split("-"); return AYLAR[+a - 1].slice(0, 3) + " " + y; };

function gecmisHesapla(y, a) {
  const r = {};
  const ekle = (ad, n, p, g) => {
    const x = r[ad] || (r[ad] = { n: 0, p: 0, g: [0, 0, 0, 0, 0] });
    x.n += n; x.p += p;
    if (g) for (let q = 0; q < 5; q++) x.g[q] += g[q];
  };
  GD = { aylar: [], detay: {} };
  let py = y, pa = a;
  for (let i = 0; i < 24; i++) {
    pa--;
    if (pa < 1) { pa = 12; py--; }
    const pk = oku(ayAnahtar(py, pa));
    if (!pk || !pk.liste || !pk.kisiler) continue;
    const ak = py + "-" + String(pa).padStart(2, "0");
    const dahil = GA.aylar[ak] === true;
    GD.aylar.push({ k: ak, dahil });
    const mv = { yil: py, ay: pa, kisi: pk.kisi || 4, tatil: pk.tatil || [], kisiler: kopya(pk.kisiler).map(goc), kural: pk.kural };
    const h = MOTOR.hazirla(mv, false);
    const an = MOTOR.analiz(mv, pk.liste);
    const dt = GD.detay[ak] = {};
    an.forEach((x, i2) => {
      const gb = h.beklenen[i2];
      dt[x.ad] = { n: x.nobet, p: x.odeme, hn: h.nTaban[i2], hp: h.pTaban[i2] };
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
  const kural = MOTOR.kuralNorm((kayit && kayit.kural) || (kadro && kadro.kural) || null);
  V = { yil: y, ay: a, kisi: (kayit && kayit.kisi) || (kadro && kadro.kisi) || taban.kisi, tatil: [], kisiler, zorunlu: !!zor, kural, onceki: [], gecmis: null };
  gecmisAyarOku();
  V.gecmis = gecmisHesapla(y, a);
  const py = a === 1 ? y - 1 : y;
  const pa = a === 1 ? 12 : a - 1;
  const pk = oku(ayAnahtar(py, pa));
  if (pk && pk.liste && pk.kisiler && GA.aylar[py + "-" + String(pa).padStart(2, "0")] === true) {
    const son = pk.liste[new Date(py, pa, 0).getDate()] || [];
    V.onceki = son.map(i => pk.kisiler[i] && pk.kisiler[i].ad).map(ad => kisiler.findIndex(k => k.ad === ad)).filter(i => i >= 0);
  }
  L = kayit && kayit.liste ? kayit.liste : null;
  TOHUM = (kayit && kayit.tohum) || 1;
  ALT = (kayit && kayit.alt) || [];
  ALTTOPLAM = (kayit && kayit.altToplam) || ALT.length;
  SEC = (kayit && kayit.sec) || 0;
}

function sakla() {
  W.veri.yaz(ayAnahtar(V.yil, V.ay), JSON.stringify({ kisi: V.kisi, kisiler: V.kisiler, zorunlu: V.zorunlu, kural: V.kural, liste: L, tohum: TOHUM, alt: ALT, altToplam: ALTTOPLAM, sec: SEC }));
  W.veri.yaz("kadro", JSON.stringify({ kisi: V.kisi, kisiler: V.kisiler, zorunlu: V.zorunlu, kural: V.kural }));
  W.veri.yaz("son", JSON.stringify({ yil: V.yil, ay: V.ay }));
}

const yaz = a => a.join(", ");

function gunOku(s) {
  const r = [];
  for (const p of String(s).split(",")) {
    const m = p.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) continue;
    const a = +m[1], b = m[2] ? +m[2] : a;
    for (let i = a; i <= b && i <= 31; i++) r.push(i);
  }
  return [...new Set(r)].sort((x, y) => x - y);
}

function tarihMetin(d) { return d + "." + String(V.ay).padStart(2, "0") + "." + V.yil; }

function listeCiz() {
  const G = MOTOR.gunSayisi(V);
  const ad = AYLAR[V.ay - 1] + " " + V.yil + " Ameliyathane HemşireNöbet Listesi";
  $("#baslik").textContent = ad.toLocaleUpperCase("tr");
  const t = $("#liste");
  t.replaceChildren();
  const cg = el("colgroup");
  cg.append(el("col", { className: "c-tarih" }), el("col", { className: "c-gun" }));
  for (let i = 0; i < V.kisi; i++) cg.append(el("col"));
  t.append(cg);
  const bas = el("tr");
  ["Tarih", "Gün"].concat(Array.from({ length: V.kisi }, (_, i) => "Nöbetçi " + (i + 1))).forEach(m => bas.append(el("th", { scope: "col", textContent: m })));
  t.append(bas);
  const H = MOTOR.hazirla(V);
  for (let d = 1; d <= G; d++) {
    const w = MOTOR.haftaGunu(V, d);
    const tr = el("tr", { className: w === 0 ? "paz" : w === 6 ? "cmt" : "" });
    tr.append(el("td", { className: "tarih", textContent: tarihMetin(d) }), el("td", { className: "gun", textContent: MOTOR.GUN[w] }));
    for (let y = 0; y < V.kisi; y++) {
      const p = L && L[d] ? L[d][y] : undefined;
      const s = el("select", { className: "sec" });
      s.setAttribute("aria-label", tarihMetin(d) + " nöbetçi " + (y + 1));
      s.append(el("option", { value: "-1", textContent: "—", selected: p === undefined }));
      V.kisiler.forEach((k, i) => s.append(el("option", { value: String(i), textContent: k.ad, selected: p === i })));
      if (p !== undefined && (H.yok[p].has(d) || H.istemez[p].has(d) || (d > 1 && L[d - 1] && L[d - 1].includes(p)))) s.dataset.kotu = "1";
      s.onchange = () => {
        if (!L) return;
        const v = +s.value;
        if (v < 0) L[d].splice(y, 1); else L[d][y] = v;
        sakla();
        ciz();
      };
      const td = el("td", { className: "hucre" });
      td.append(s);
      tr.append(td);
    }
    t.append(tr);
  }
}

function ozetCiz() {
  const p = $("#p-ozet");
  p.replaceChildren();
  if (!L) { p.append(el("p", { className: "yardim", textContent: "Liste henüz oluşturulmadı." })); return; }
  const G = MOTOR.gunSayisi(V);
  const t = el("table", { className: "ozet" });
  const b = el("tr");
  ["Ad", "Nöbet", "Günler"].forEach(m => b.append(el("th", { scope: "col", textContent: m })));
  t.append(b);
  V.kisiler.forEach((k, i) => {
    const gunler = [];
    for (let d = 1; d <= G; d++) if ((L[d] || []).includes(i)) gunler.push(d);
    const n = el("td", { className: "n" });
    n.dataset.kotu = "0";
    n.append(String(gunler.length), el("small", { textContent: "/ " + k.nobet }));
    const tr = el("tr");
    tr.append(el("td", { textContent: k.ad }), n, el("td", { className: "g", textContent: gunler.join(", ") }));
    t.append(tr);
  });
  p.append(t);
}

function sorunCiz() {
  const p = $("#p-sorun");
  p.replaceChildren();
  const d = $("#durum");
  const ul = el("ul", { className: "sorun-liste" });
  if (!L) {
    ul.append(el("li", { textContent: "Liste henüz oluşturulmadı." }));
    d.textContent = "";
    delete d.dataset.iyi;
  } else {
    const r = MOTOR.rapor(V, L);
    if (r.sorun.length) r.sorun.forEach(s => ul.append(el("li", { textContent: s })));
    else { const li = el("li", { textContent: "Hiç sorun yok." }); li.dataset.iyi = "1"; ul.append(li); }
    d.textContent = r.sorun.length ? r.sorun.length + " sorun var" : "Kurallara tam uyuyor";
    d.dataset.iyi = r.sorun.length ? "0" : "1";
  }
  p.append(ul);
}

function kadroCiz() {
  const p = $("#p-kadro");
  p.replaceChildren();
  const t = el("table", { className: "kadro" });
  const b = el("tr");
  ["Ad", "Nöbet", "Ödeme"].forEach(m => b.append(el("th", { scope: "col", textContent: m })));
  t.append(b);
  V.kisiler.forEach(k => {
    const tr = el("tr", {});
    tr.append(el("td", { textContent: k.ad }));
    [["nobet", "Nöbet Sayısı"], ["odeme", "Ödeme Puanı"]].forEach(([a, e]) => {
      const i = el("input", { className: "tk-input dar", type: "number", min: "0", value: k[a] });
      i.setAttribute("aria-label", k.ad + " " + e);
      i.onchange = () => { k[a] = Math.max(0, +i.value || 0); sakla(); kadroCiz(); ciz(); };
      tr.append(el("td", {}));
      tr.lastChild.append(i);
    });
    t.append(tr);
  });
  p.append(t);
  const G = MOTOR.gunSayisi(V);
  const sn = V.kisiler.reduce((a, k) => a + k.nobet, 0);
  const uy = el("p", { className: "yardim kadro-uyari", textContent: "Toplam nöbet " + sn + ", bu ay gereken " + G * V.kisi + " (" + G + " gün × günde " + V.kisi + " kişi)." + (sn === G * V.kisi ? " Uyuşuyor." : " Uyuşmuyor: herkesin hedefi aynı oranda " + (sn < G * V.kisi ? "artırılır" : "azaltılır") + " (6 yazan " + f1(6 * G * V.kisi / Math.max(1, sn)) + " alır). Günlük kişi sayısını ya da nöbet sayılarını düzelt.") });
  uy.dataset.kotu = sn === G * V.kisi ? "0" : "1";
  p.append(uy);
  p.append(el("p", { className: "yardim", textContent: "Nöbet, kişinin bu ayki nöbet sayısı payıdır (6/10 yazan kâğıtta 6). Ödeme, ödeme puanı payıdır (10). Cuma 2, Cumartesi 3, Pazar ve tatil 2, diğer günler 1 puan. İzin, istemiyor ve istiyor günleri İstekler sekmesinden tıklayarak seçilir." }));
}

const GUN2 = ["Pz", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct"];
const DURUM_AD = ["Boş", "İstiyor", "İstemiyor", "İzin"];
let BOYA = null;
window.addEventListener("mouseup", () => { if (BOYA !== null) { BOYA = null; sakla(); } });
const DURUM_IM = ["", "✓", "✕", "İ"];

function istekDurum(k, d) {
  if (k.izin.includes(d)) return 3;
  if (k.istemiyor.includes(d)) return 2;
  if (k.istiyor.includes(d)) return 1;
  return 0;
}

function istekYaz(k, d, q) {
  for (const a of ["izin", "istemiyor", "istiyor"]) k[a] = k[a].filter(x => x !== d);
  if (q === 1) k.istiyor.push(d);
  else if (q === 2) k.istemiyor.push(d);
  else if (q === 3) k.izin.push(d);
  for (const a of ["izin", "istemiyor", "istiyor"]) k[a].sort((x, y) => x - y);
}

function istekCiz() {
  const p = $("#p-istek");
  p.replaceChildren();
  const G = MOTOR.gunSayisi(V);
  const lej = el("div", { className: "lejant" });
  [[0, "Boş"], [1, "İstiyor · sol tık"], [2, "İstemiyor · sağ tık"], [3, "İzin (kesin boş) · Shift+tık ya da orta tık"]].forEach(([q, m]) => {
    const s = el("span", {});
    const hc = el("span", { className: "hc", textContent: DURUM_IM[q] || "·" });
    hc.dataset.d = String(q);
    s.append(hc, m);
    lej.append(s);
  });
  p.append(lej);
  const t = el("table", { className: "istek" });
  let vurgu = [];
  const vurgula = td => {
    vurgu.forEach(x => x.classList.remove("kol"));
    vurgu = [];
    t.querySelectorAll("tr.sat").forEach(x => x.classList.remove("sat"));
    if (!td) return;
    const i = td.cellIndex;
    if (i < 1) return;
    td.parentElement.classList.add("sat");
    for (const tr of t.rows) if (tr.cells[i]) { tr.cells[i].classList.add("kol"); vurgu.push(tr.cells[i]); }
  };
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
  for (let d = 1; d <= G; d++) {
    const w = MOTOR.haftaGunu(V, d);
    const th = el("th", { scope: "col", textContent: String(d) });
    th.append(el("small", { textContent: GUN2[w] }));
    th.title = tarihMetin(d) + " " + MOTOR.GUN[w];
    if (w === 0 || w === 6) th.dataset.hs = "1";
    b.append(th);
  }
  b.append(el("th", { scope: "col", textContent: "Toplam" }));
  t.append(b);
  V.kisiler.forEach(k => {
    const tr = el("tr", {});
    tr.append(el("td", { textContent: k.ad }));
    const top = el("td", { className: "top" });
    const topYaz = () => { top.textContent = k.istiyor.length + " ✓ " + k.istemiyor.length + " ✕ " + k.izin.length + " İ"; };
    for (let d = 1; d <= G; d++) {
      const w = MOTOR.haftaGunu(V, d);
      const td = el("td", {});
      if (w === 0 || w === 6) td.dataset.hs = "1";
      const h = el("button", { type: "button", className: "hc" });
      const guncelle = () => {
        const q = istekDurum(k, d);
        h.dataset.d = String(q);
        h.textContent = DURUM_IM[q];
        h.setAttribute("aria-label", k.ad + " " + tarihMetin(d) + ": " + DURUM_AD[q]);
      };
      guncelle();
      const uygula = q => {
        if (istekDurum(k, d) === q) return;
        istekYaz(k, d, q);
        guncelle();
        topYaz();
        $("#istekIpucu").hidden = false;
      };
      h.onclick = e => {
        if (e.detail !== 0) return;
        uygula((istekDurum(k, d) + 1) % 4);
        sakla();
      };
      h.onmousedown = e => {
        const hedef = e.shiftKey || e.button === 1 ? 3 : e.button === 2 ? 2 : e.button === 0 ? 1 : -1;
        if (hedef < 0) return;
        e.preventDefault();
        h.focus();
        BOYA = istekDurum(k, d) === hedef ? 0 : hedef;
        uygula(BOYA);
      };
      h.onmouseenter = () => { if (BOYA !== null) uygula(BOYA); };
      td.append(h);
      tr.append(td);
    }
    topYaz();
    tr.append(top);
    t.append(tr);
  });
  p.append(t);
  p.append(el("p", { className: "yardim", textContent: "Sol tık istiyor, sağ tık istemiyor, Shift+tık ya da orta tık izin; aynı tık bir daha basılırsa kutu boşalır. Basılı tutup sürüklersen geçtiğin kutular aynı şekilde boyanır. Klavyede Enter sırayla dolaştırır. En az istekte bulunanın isteği önceliklidir." }));
  const ip = el("p", { className: "yardim", id: "istekIpucu", textContent: "Değişiklik kaydedildi. Listeye yansıması için Listeyi Oluştur düğmesine bas." });
  ip.hidden = true;
  p.append(ip);
}

function analizCiz() {
  const p = $("#p-analiz");
  p.replaceChildren();
  if (!L) { p.append(el("p", { className: "yardim", textContent: "Liste henüz oluşturulmadı." })); return; }
  const an = MOTOR.analiz(V, L);
  const t = el("table", { className: "analiz" });
  const b = el("tr");
  ["Ad", "Nöbet", "Ödeme"].concat(MOTOR.TIP_AD, ["İstek", "İstemez", "Geçmiş"]).forEach(m => b.append(el("th", { scope: "col", textContent: m })));
  t.append(b);
  an.forEach(a => {
    const tr = el("tr");
    tr.append(el("td", { textContent: a.ad + (a.comez ? " (çömez)" : "") }));
    const hucre = (ana, alt, kotu) => {
      const td = el("td", {});
      td.dataset.kotu = kotu ? "1" : "0";
      td.append(String(ana), el("small", { textContent: alt }));
      return td;
    };
    tr.append(hucre(a.nobet, "hedef " + f1(a.nobetHedef), Math.abs(a.nobet - a.nobetHedef) >= 1.5));
    tr.append(hucre(a.odeme, "hedef " + f1(a.odemeHedef), Math.abs(a.odeme - a.odemeHedef) >= 2.5));
    a.tip.forEach((x, t2) => tr.append(hucre(x, "~" + f1(a.tipBeklenen[t2]), Math.abs(x - a.tipBeklenen[t2]) >= 1.5)));
    const ist = hucre(a.istekVerilen + "/" + a.istek, a.istek ? (a.istekVerilen === a.istek ? "tamam" : "eksik") : "yok", a.istek > a.istekVerilen);
    if (a.istek && a.istekVerilen === a.istek) ist.dataset.iyi = "1";
    tr.append(ist);
    tr.append(hucre(a.istemezIhlal + "/" + a.istemez, a.ardArda || a.perHs ? "ard arda " + a.ardArda + ", per-hs " + a.perHs : "temiz", a.istemezIhlal > 0 || a.ardArda > 0 || a.perHs > 0));
    const gc = a.gecmis ? a.fark : null;
    tr.append(hucre(gc ? isr(gc.n) : "-", gc ? "ödeme " + isr(gc.p) : "kayıt yok", gc && (Math.abs(gc.n) >= 1.5 || Math.abs(gc.p) >= 2.5)));
    t.append(tr);
  });
  p.append(t);
  p.append(el("p", { className: "yardim", textContent: "Nöbet ve Ödeme: yazılan sayı ve geçmiş aylar düşüldükten sonraki hedef. Pzt…Paz: haftanın her günü ayrı, o günlerdeki nöbet sayısı ve beklenen (tatiller Paz sütununda). İstek: verilen istek / toplam. İstemez: istemediği güne yazılan / toplam; ard arda ve perşembe sonrası hafta sonu sayıları altta. Geçmiş: önceki ayların toplamında hak edilene göre fazla (+) veya eksik (-); yeni ay bunu dengelemek için kurulur." }));
}

const f1 = x => (Math.round(x * 10) / 10).toString();
const isr = x => (x > 0.05 ? "+" : "") + f1(x);

function yenidenKur(m) {
  V.gecmis = gecmisHesapla(V.yil, V.ay);
  analizCiz();
  gecmisCiz();
  ayPanelCiz();
  toast(m || "Değişiklik kaydedildi. Listeye yansıması için Listeyi Oluştur düğmesine bas.");
}

function gecmisCiz() {
  const p = $("#p-gecmis");
  p.replaceChildren();
  const ust = el("div", { className: "gecmis-ust" });
  ust.append(el("span", { className: "etiket", textContent: "Hesaba Katılan Aylar:" }));
  if (!GD.aylar.length) ust.append(el("span", { className: "yardim", textContent: "Önceki aylarda kayıtlı liste yok. Geçmişi aşağıdan elle gir." }));
  GD.aylar.slice().reverse().forEach(m => {
    const b = el("button", { type: "button", className: "dgm dgm-ac", textContent: ayKisa(m.k) + ": " + (m.dahil ? "Katılıyor" : "Katılmıyor") });
    b.setAttribute("aria-pressed", String(m.dahil));
    b.onclick = () => { GA.aylar[m.k] = !m.dahil; gecmisAyarYaz(); yenidenKur(); };
    ust.append(b);
  });
  const sifir = el("button", { type: "button", className: "dgm", textContent: "Elle Girilenleri Temizle" });
  sifir.onclick = () => { GA.elle = {}; gecmisAyarYaz(); yenidenKur("Elle girilen geçmiş temizlendi."); };
  ust.append(sifir);
  p.append(ust);
  const aylar = GD.aylar.filter(m => m.dahil).map(m => m.k).reverse();
  const t = el("table", { className: "analiz gecmis" });
  const b = el("tr");
  b.append(el("th", { scope: "col", textContent: "Ad" }));
  aylar.forEach(k => b.append(el("th", { scope: "col", textContent: ayKisa(k) })));
  ["Elle: Tuttuğu", "Elle: Hakkı", "Toplam Fark"].forEach(m => b.append(el("th", { scope: "col", textContent: m })));
  t.append(b);
  const esit = V.kural.odemeModu === "esit";
  V.kisiler.forEach(k => {
    const tr = el("tr");
    tr.append(el("td", { textContent: k.ad }));
    aylar.forEach(ak => {
      const x = GD.detay[ak][k.ad];
      const td = el("td", {});
      if (!x) { td.append("-", el("small", { textContent: "kadroda yok" })); }
      else {
        const fn = x.n - x.hn;
        td.dataset.kotu = Math.abs(fn) >= 1 ? "1" : "0";
        td.append(x.n + "/" + x.p, el("small", { textContent: "hak " + f1(x.hn) + "/" + f1(x.hp) }));
      }
      tr.append(td);
    });
    const e = GA.elle[k.ad] || {};
    const giris = (a1, a2, ad) => {
      const td = el("td", { className: "elle" });
      [a1, a2].forEach((a, j) => {
        const i = el("input", { className: "tk-input dar", type: "number", step: "1", value: e[a] === undefined ? "" : e[a], placeholder: j ? "puan" : "nöbet" });
        i.setAttribute("aria-label", k.ad + " " + ad + " " + (j ? "ödeme puanı" : "nöbet sayısı"));
        i.onchange = () => {
          const x = GA.elle[k.ad] || (GA.elle[k.ad] = {});
          if (i.value === "") delete x[a]; else x[a] = +i.value;
          if (!Object.keys(x).length) delete GA.elle[k.ad];
          gecmisAyarYaz();
          yenidenKur();
        };
        td.append(i);
        if (!j) td.append(el("span", { className: "bolu", textContent: "/" }));
      });
      return td;
    };
    tr.append(giris("n", "p", "tuttuğu"), giris("hn", "hp", "hakkı"));
    const g = V.gecmis && V.gecmis[k.ad];
    const td = el("td", {});
    td.dataset.kotu = g && (Math.abs(g.n) >= 1 || (!esit && Math.abs(g.p) >= 2)) ? "1" : "0";
    td.append(g ? isr(g.n) + " / " + isr(g.p) : "0 / 0", el("small", { textContent: g ? (g.n > 0.05 ? "fazla tuttu, bu ay azalır" : g.n < -0.05 ? "eksik tuttu, bu ay artar" : "dengede") : "geçmiş yok" }));
    tr.append(td);
    t.append(tr);
  });
  p.append(t);
  p.append(el("p", { className: "yardim", textContent: "Hücrelerde nöbet/puan yazar: 6/10, 6 nöbet ve 10 ödeme puanı demek; altında o ayın hakkı. Ay gezerken kendiliğinden oluşan listeler geçmişe katılmaz; yalnız Katılıyor yapılan aylar sayılır. Kayıtlı liste yoksa önceki aylarda gerçekte tuttuğunu ve hakkını Elle sütunlarına yaz (ör. tuttuğu 7/11, hakkı 6/10 → +1/+1). Toplam Fark: + fazla tutmuş, bu ay hedefinden düşülür; - eksik tutmuş, eklenir." }));
}

const GUNLER = [1, 2, 3, 4, 5, 6, 0];

function comezCiz(p, degis) {
  const C = V.kural.comez;
  const kutu = el("section", { className: "comez" });
  kutu.append(el("h2", { className: "bolum-baslik", textContent: "Çömezler" }));
  const sat = el("div", { className: "kural-ust" });
  const ac = el("button", { type: "button", className: "dgm dgm-ac", textContent: "Çömez Kuralı: " + (C.acik ? "Açık" : "Kapalı") });
  ac.setAttribute("aria-pressed", String(C.acik));
  ac.onclick = () => { C.acik = !C.acik; degis(); };
  const lim = el("div", { className: "alan", role: "group" });
  lim.setAttribute("aria-label", "Aynı gün en fazla çömez");
  const say = el("span", { className: "sayac" });
  const eksi = el("button", { type: "button", className: "dgm dgm-kare", textContent: "−" });
  eksi.setAttribute("aria-label", "Azalt");
  const art = el("button", { type: "button", className: "dgm dgm-kare", textContent: "+" });
  art.setAttribute("aria-label", "Artır");
  const deg = el("span", { className: "sayac-deger", textContent: String(C.enFazla) });
  eksi.onclick = () => { if (C.enFazla > 0) { C.enFazla--; degis(); } };
  art.onclick = () => { if (C.enFazla < V.kisi) { C.enFazla++; degis(); } };
  say.append(eksi, deg, art);
  lim.append(el("span", { textContent: "Aynı Gün En Fazla" }), say);
  const kl = el("label", { className: "kutu" });
  const kc = el("input", { type: "checkbox", checked: C.kesin });
  kc.onchange = () => { C.kesin = kc.checked; degis(); };
  kl.append(kc, "Kesin");
  sat.append(ac, lim, kl);
  kutu.append(sat);
  const iki = el("div", { className: "comez-iki" });
  const liste = (baslik, cz) => {
    const s = el("div", { className: "comez-liste" });
    s.dataset.cz = cz ? "1" : "0";
    const ks = V.kisiler.filter(k => !!k.comez === cz);
    s.append(el("h3", { textContent: baslik + " (" + ks.length + ")" }));
    const ul = el("div", { className: "comez-adlar" });
    ks.forEach(k => {
      const b = el("button", { type: "button", className: "dgm comez-ad", textContent: cz ? "← " + k.ad : k.ad + " →" });
      b.dataset.ad = k.ad;
      b.setAttribute("aria-label", k.ad + (cz ? ": çömezlerden çıkar" : ": çömezlere ekle"));
      b.onclick = () => {
        k.comez = !cz;
        degis();
        const yeni = [...$("#p-kural").querySelectorAll(".comez-ad")].find(x => x.dataset.ad === k.ad);
        if (yeni) yeni.focus();
      };
      ul.append(b);
    });
    if (!ks.length) ul.append(el("span", { className: "yardim", textContent: cz ? "Çömez yok. Soldan bir ada tıkla." : "Herkes çömez." }));
    s.append(ul);
    return s;
  };
  iki.append(liste("Hemşireler", false), liste("Çömezler", true));
  kutu.append(iki);
  kutu.append(el("p", { className: "yardim", textContent: "Bir ada tıklayınca öbür listeye geçer. Kural açıkken aynı güne en fazla " + C.enFazla + " çömez yazılır; Kesin değilse gerekirse çiğnenir ve Sorunlar'da yazar." }));
  p.append(kutu);
}

function kuralCiz() {
  const p = $("#p-kural");
  p.replaceChildren();
  const K = V.kural;
  const degis = () => { V.kural = MOTOR.kuralNorm(K); sakla(); kuralCiz(); sorunCiz(); yenidenKur(); };
  const sat = el("div", { className: "kural-ust" });
  const ard = el("button", { type: "button", className: "dgm dgm-ac", textContent: "Art Arda Nöbet Yasak: " + (K.ardArda ? "Açık" : "Kapalı") });
  ard.setAttribute("aria-pressed", String(K.ardArda));
  ard.onclick = () => { K.ardArda = !K.ardArda; degis(); };
  const ag = el("label", { className: "alan" });
  const s = el("select", { className: "tk-input" });
  [["puan", "Ödeme Puanına Göre (Cum 2, Cmt 3, Paz 2, diğer 1)"], ["esit", "Tüm Günler Eşit (her gün 1)"]].forEach(([v, m]) => s.append(el("option", { value: v, textContent: m, selected: K.odemeModu === v })));
  s.onchange = () => { K.odemeModu = s.value; degis(); };
  ag.append(el("span", { textContent: "Gün Ağırlığı" }), s);
  sat.append(ard, ag);
  p.append(sat);
  const t = el("table", { className: "analiz kural" });
  const b = el("tr");
  ["Durum", "Bu Günün Nöbetinden Sonra", "Boş Kalacak Günler", "Hangi Haftalar", "Kesin", ""].forEach(m => b.append(el("th", { scope: "col", textContent: m })));
  t.append(b);
  K.sonraBos.forEach((r, i) => {
    const tr = el("tr");
    const ac = el("button", { type: "button", className: "dgm dgm-ac", textContent: r.acik ? "Açık" : "Kapalı" });
    ac.setAttribute("aria-pressed", String(r.acik));
    ac.onclick = () => { r.acik = !r.acik; degis(); };
    tr.append(el("td", {})); tr.lastChild.append(ac);
    const gs = el("select", { className: "tk-input" });
    gs.setAttribute("aria-label", (i + 1) + ". kural günü");
    GUNLER.forEach(w => gs.append(el("option", { value: String(w), textContent: MOTOR.GUN[w], selected: r.gun === w })));
    gs.onchange = () => { r.gun = +gs.value; r.bos = []; degis(); };
    tr.append(el("td", {})); tr.lastChild.append(gs);
    const kt = el("td", { className: "kural-gun" });
    for (let o = 1; o <= 6; o++) {
      const w = (r.gun + o) % 7;
      const lb = el("label", { className: "kutu" });
      const c = el("input", { type: "checkbox", checked: r.bos.includes(w) });
      c.onchange = () => { r.bos = c.checked ? [...r.bos, w] : r.bos.filter(x => x !== w); degis(); };
      lb.append(c, MOTOR.KISA[w]);
      kt.append(lb);
    }
    tr.append(kt);
    const ks = el("select", { className: "tk-input" });
    ks.setAttribute("aria-label", (i + 1) + ". kural kapsamı");
    [["hepsi", "Her " + MOTOR.GUN[r.gun]], ["ilk", "Yalnız Ayın İlk " + MOTOR.GUN[r.gun] + " Günü"], ["son", "Yalnız Ayın Son " + MOTOR.GUN[r.gun] + " Günü"]].forEach(([v, m]) => ks.append(el("option", { value: v, textContent: m, selected: r.kapsam === v })));
    ks.onchange = () => { r.kapsam = ks.value; degis(); };
    tr.append(el("td", {})); tr.lastChild.append(ks);
    const kl = el("label", { className: "kutu" });
    const kc = el("input", { type: "checkbox", checked: r.kesin });
    kc.onchange = () => { r.kesin = kc.checked; degis(); };
    kl.append(kc, "Kesin");
    tr.append(el("td", {})); tr.lastChild.append(kl);
    const sil = el("button", { type: "button", className: "dgm", textContent: "Sil" });
    sil.onclick = () => { K.sonraBos.splice(i, 1); degis(); };
    tr.append(el("td", {})); tr.lastChild.append(sil);
    t.append(tr);
  });
  p.append(t);
  const ekle = el("button", { type: "button", className: "dgm", textContent: "Kural Ekle" });
  ekle.onclick = () => { K.sonraBos.push({ gun: 4, bos: [5, 6, 0], kapsam: "hepsi", kesin: false, acik: true }); degis(); };
  const varsay = el("button", { type: "button", className: "dgm", textContent: "Varsayılana Dön" });
  varsay.onclick = () => { V.kural = MOTOR.kuralNorm(null); sakla(); kuralCiz(); sorunCiz(); yenidenKur(); };
  const alt = el("div", { className: "kural-ust" });
  alt.append(ekle, varsay);
  p.append(alt);
  comezCiz(p, degis);
  p.append(el("p", { className: "yardim", textContent: "Örnek: Perşembe → Cum, Cmt, Paz işaretli ve Yalnız Ayın İlk Perşembe Günü seçili ise yalnız ilk perşembe nöbetçisinin o hafta sonu boş kalır; sonraki perşembelere dokunulmaz. Kesin işaretli değilse kural güçlü bir tercihtir, gerekirse çiğnenir ve Sorunlar'da yazar. Tüm Günler Eşit seçilince ödeme puanı yok sayılır, herkes nöbet sayısı payına göre her gün türünden eşit alır." }));
}

const puan = (c, en) => Math.round(1000 * Math.max(en, 1e-9) / Math.max(c, 1e-9));
let ONIZ = null;

function onizle(i) {
  if (CALISIYOR || !ALT.length) return;
  if (i === ONIZ) return;
  ONIZ = i;
  const asil = L;
  const var1 = i !== null && i !== SEC;
  if (var1) L = ALT[i].liste;
  listeCiz();
  L = asil;
  $(".liste-pnl").dataset.oniz = var1 ? "1" : "0";
  $("#onizYazi").textContent = var1 ? "Önizleme: " + (i + 1) + ". alternatif, " + puan(ALT[i].maliyet, ALT[0].maliyet) + " puan. Seçmek için tıkla." : "";
}

function altCiz() {
  const p = $("#p-alt");
  p.replaceChildren();
  if (!ALT.length) { p.append(el("p", { className: "yardim", textContent: "Henüz alternatif yok." })); return; }
  const en = Math.min(...ALT.map(x => x.maliyet));
  const baslik = el("p", { className: "yardim", textContent: ALTTOPLAM + " alternatif üretildi, en iyi " + ALT.length + " tanesi 1000 üzerinden puanla sıralandı (en iyisi 1000). Seçilen: " + (SEC + 1) + ". sıradaki. Üstüne gelince soldaki listede önizlenir, tıklarsan seçilir." });
  baslik.style.marginTop = "0";
  p.append(baslik);
  const ul = el("div", { className: "alt-liste", role: "list" });
  ALT.forEach((x, i) => {
    const b = el("button", { type: "button", className: "alt-satir", role: "listitem" });
    b.setAttribute("aria-current", String(i === SEC));
    b.append(el("span", { className: "alt-no", textContent: String(i + 1) }));
    const iz = el("span", { className: "alt-iz" });
    const dolgu = el("span", { className: "alt-dolgu" });
    const pu = puan(x.maliyet, en);
    dolgu.style.width = Math.max(4, pu / 10) + "%";
    iz.append(dolgu);
    b.append(iz, el("span", { className: "alt-puan", textContent: String(pu) }));
    b.setAttribute("aria-label", (i + 1) + ". alternatif, puan " + pu + " / 1000" + (i === SEC ? ", seçili" : ""));
    b.onclick = () => { if (CALISIYOR) return; ONIZ = null; SEC = i; L = kopya(x.liste); sakla(); ciz(); onizle(null); };
    b.onmouseenter = b.onfocus = () => onizle(i);
    b.onmouseleave = b.onblur = () => onizle(null);
    ul.append(b);
  });
  p.append(ul);
}

const CIZGI = el("button", { type: "button", className: "gecmis-cizgi" });
CIZGI.onclick = () => sekme("gecmis");

function ayPanelCiz() {
  $("#yilYazi").textContent = String(V.yil);
  const dgm = [...document.querySelectorAll(".ay-dgm")];
  dgm.forEach((b, i) => {
    const kayit = oku(ayAnahtar(V.yil, i + 1));
    const ak = V.yil + "-" + String(i + 1).padStart(2, "0");
    const dolu = !!(kayit && kayit.liste);
    b.dataset.dolu = dolu ? "1" : "0";
    b.dataset.dahil = GA.aylar[ak] === true && dolu ? "1" : "0";
    b.title = AYLAR[i] + " " + V.yil + (b.dataset.dahil === "1" ? ": geçmiş hesabına katılıyor" : dolu ? ": kayıtlı liste var, geçmişe katılmıyor" : "") + (dolu ? ". Sağ tık: geçmişe kat ya da çıkar." : "");
    b.setAttribute("aria-current", String(i + 1 === V.ay));
  });
  const elle = Object.keys(GA.elle).length > 0;
  CIZGI.hidden = !elle;
  if (elle) {
    const ilk = GD.aylar.filter(m => m.dahil).map(m => m.k).sort()[0];
    let yer = V.ay - 1;
    if (ilk) { const [y, a] = ilk.split("-").map(Number); if (y < V.yil) yer = 0; else if (y === V.yil) yer = a - 1; }
    dgm[yer].before(CIZGI);
    CIZGI.title = "Elle girilen geçmiş: bu çizginin solundaki aylar elle girildi. Düzenlemek için tıkla.";
    CIZGI.setAttribute("aria-label", "Elle girilen geçmişi düzenle");
  }
  $("#btnZor").setAttribute("aria-pressed", String(!!V.zorunlu));
  $("#btnZor").textContent = "İstekler Zorunlu: " + (V.zorunlu ? "Açık" : "Kapalı");
  $("#btnUret").textContent = CALISIYOR ? "Durdur" : "Listeyi Oluştur";
}

function hakkindaCiz() {
  const p = $("#p-hakkinda");
  p.replaceChildren();
  const k = el("article", { className: "hakkinda" });
  k.append(el("h2", { className: "hakkinda-baslik", textContent: "Ameliyathane HemşireNöbet" }));
  [
    "Aylık nöbet listesini kendisi hazırlar: herkesin nöbet sayısı ve ödeme puanı hedefine, isteklerine ve kurallara uyar. Yüzlerce alternatif dener, en adilini seçer.",
    "Kullanımı: üstten ayı seç, Kadro'da nöbet ve ödeme paylarını, İstekler'de izin ve istekleri gir, Listeyi Oluştur'a bas. Sorunlar ve Analiz listenin ne kadar adil olduğunu gösterir.",
    "Geçmiş: önceki aylarda fazla ya da eksik tutulan nöbetler bu aya yansır. Kayıtlı liste yoksa Geçmiş sekmesinde elle gir. Ay şeridindeki yeşil çizgi elle girilen geçmişi, yeşil anahat hesaba katılan ayları gösterir.",
    "İstekler tablosunda sol tık istiyor, sağ tık istemiyor, Shift+tık izin. Basılı tutup sürükleyerek çok kutuyu birden boyayabilirsin.",
    "Açıklama sistemi: sağ Alt (AltGr) tuşunu basılı tutup herhangi bir yere tıkla; o bölümün ne işe yaradığı küçük bir kutuda çıkar. Esc ya da bir tık kapatır.",
    "Veriler programın yanındaki veri klasöründe durur, internete gönderilmez. Güncellemeler başlıktaki sürüm düğmesinden denetlenir."
  ].forEach(m => k.append(el("p", { textContent: m })));
  const imza = el("p", { className: "hakkinda-imza" });
  const a = el("button", { type: "button", className: "dgm", textContent: "github.com/Teknesyum" });
  a.onclick = () => W.ac("https://github.com/Teknesyum");
  const sv = $("#basbarSurum").textContent.replace(/^v/, "");
  imza.append(el("span", { textContent: "Teknesyum tarafından geliştirildi" }), el("span", { id: "hakSurum", textContent: sv ? "Sürüm " + sv : "" }), a);
  k.append(imza);
  p.append(k);
}

const YARDIM = [
  [".gecmis-cizgi", "Elle Girilen Geçmiş", "Yeşil çizgi, solundaki ayların geçmişinin elle girildiğini gösterir. Tıklayınca Geçmiş sekmesi açılır, oradan düzenlenir."],
  [".ay-dgm", "Ay Düğmeleri", "Tıkla: o aya geç. Altı yeşil çizgili ayın kayıtlı listesi var; yeşil anahatlı ay geçmiş hesabına katılır. Sağ tık: ayı geçmişe kat ya da çıkar."],
  ["#yilGeri, #yilIleri, #yilYazi", "Yıl", "Önceki ya da sonraki yıla geçer."],
  ["#btnSonraki", "Sonraki Ayı Hazırla", "Bir sonraki aya geçer, listesi yoksa hemen oluşturur."],
  ["[data-hedef=kisi], #kisi, #kisiAd", "Günlük Kişi", "Her gün kaç hemşirenin nöbet tutacağı. + ve − ile değiştir; değişince liste yeniden kurulur. Kadro toplamıyla uyuşmalı, Kadro sekmesi uyarır."],
  ["[data-hedef=altSay], #altSay, #altAd", "Alternatif", "Kaç farklı liste denenip en iyisinin seçileceği. 300-500 en adile neredeyse eşit; 200 de adil ve daha hızlı."],
  ["#btnZor", "İstekler Zorunlu", "Açıkken istek ve istemezler neredeyse kesin kural gibi davranır; kapalıyken güçlü tercihtir."],
  ["#btnOnay", "Güncellemeden Önce Sor", "Açıkken yeni sürüm bulununca kurmadan önce sorar; kapalıyken kendiliğinden kurar."],
  ["#btnUret", "Listeyi Oluştur", "Seçili ay için alternatifleri üretir, en iyisini seçer. Çalışırken basarsan durur."],
  ["#btnYeni", "Başka Bir Tane", "Farklı bir başlangıçla yeniden üretir; aynı adalette başka bir liste çıkar."],
  ["#btnKopya", "Excel'e Kopyala", "Listeyi panoya kopyalar, Excel'e yapıştırılabilir."],
  ["#btnCsv", "CSV Kaydet", "Listeyi CSV dosyası olarak kaydeder."],
  ["#btnYazdir", "Yazdır", "Listeyi yazdırır."],
  ["#durum", "Durum", "Listenin kurallara uyup uymadığını özetler. Ayrıntı Sorunlar sekmesinde."],
  ["#ilerleme", "İlerleme", "Kaç alternatifin denendiğini ve kalan süreyi gösterir."],
  ["#liste", "Nöbet Listesi", "Ayın her günü ve o gün nöbet tutanlar. Kutudan elle değiştirebilirsin; uyarı renkli kutu izin, istemez ya da art arda nöbete düşmüş demek."],
  ["table.istek .hc", "İstek Kutusu", "Sol tık istiyor, sağ tık istemiyor, Shift+tık ya da orta tık izin. Aynı tık tekrar basılırsa boşalır. Basılı sürükleyerek boyayabilirsin."],
  ["#sk-ozet, #p-ozet", "Kişi Özeti", "Her hemşirenin kaç nöbet tuttuğu ve hangi günler."],
  ["#sk-sorun, #p-sorun", "Sorunlar", "Kuralı çiğneyen ya da verilemeyen her şey burada. Boşsa liste kurallara tam uyuyor."],
  ["#sk-istek, #p-istek", "İstekler", "İzin, istiyor ve istemiyor günleri. Farenin altındaki satır ve sütun parlar."],
  ["#sk-analiz, #p-analiz", "Analiz", "Herkesin nöbeti, ödeme puanı ve haftanın her günündeki nöbet sayısı; altında hedefi. Uyarı renkli hücre hedeften belirgin sapma demek."],
  ["#p-gecmis .elle", "Elle Geçmiş", "Kayıtlı liste olmayan geçmiş aylarda gerçekte tuttuğu ve hakkı: nöbet / puan. Fark bu aya yansır."],
  ["#p-gecmis .dgm-ac", "Hesaba Katılan Ay", "Bu ayın listesinin geçmişe katılıp katılmayacağı. Ay şeridinde sağ tıkla da yapılır."],
  ["#sk-gecmis, #p-gecmis", "Geçmiş", "Önceki aylardaki fazla ya da eksik nöbetler. + fazla tutmuş, bu ay azalır; − eksik tutmuş, artar."],
  [".comez", "Çömezler", "Çömez işaretlenenler aynı güne en fazla belirtilen sayıda yazılır. Ada tıklayınca öbür listeye geçer."],
  ["#sk-kural, #p-kural", "Kurallar", "Art arda nöbet, belli bir günden sonra boş kalacak günler, gün ağırlığı ve çömez kuralı. Her kural açılıp kapatılabilir."],
  ["#sk-kadro, #p-kadro", "Kadro", "Her hemşirenin bu ayki nöbet sayısı ve ödeme puanı payı (6/10 gibi)."],
  [".alt-satir", "Alternatif", "1000 üzerinden puan: en iyisi 1000, diğerleri ona oranla. Üstüne gel: önizle. Tıkla: seç."],
  ["#sk-alt, #p-alt", "Alternatifler", "Denenen listelerin en iyi 30 tanesi, en iyisi üstte."],
  ["#sk-hakkinda, #p-hakkinda", "Hakkında", "Programın kısa tanıtımı ve kullanımı."],
  ["#basbarSurum", "Sürüm", "Güncellemeleri denetler."],
  ["#imza", "İmza", "Teknesyum GitHub sayfasını açar."],
  ["#destek", "Destek", "Geliştiriciyi destekleme sayfasını açar."],
  [".tk-titlebar", "Başlık Çubuğu", "Pencereyi taşımak için sürükle; çift tık büyütür."]
];

(() => {
  const balon = $("#yardimBalon");
  const kapat = () => { balon.hidden = true; };
  const altgr = e => (e.getModifierState && e.getModifierState("AltGraph")) || (e.ctrlKey && e.altKey);
  const goster = e => {
    let bul = null;
    for (let x = e.target instanceof Element ? e.target : e.target.parentElement; x && !bul; x = x.parentElement) bul = YARDIM.find(([s]) => x.matches(s));
    const [, bas, metin] = bul || [null, "Açıklama", "Bu bölüm için ayrı açıklama yok. Hakkında sekmesinde genel kullanım anlatılıyor."];
    $("#yardimBaslik").textContent = bas;
    $("#yardimMetin").textContent = metin;
    balon.hidden = false;
    const r = balon.getBoundingClientRect();
    const x = Math.min(innerWidth - r.width - 8, Math.max(8, e.clientX + 12));
    const y = e.clientY + 16 + r.height > innerHeight ? Math.max(8, e.clientY - r.height - 12) : e.clientY + 16;
    balon.style.left = x + "px";
    balon.style.top = y + "px";
  };
  document.addEventListener("mousedown", e => {
    if (altgr(e)) { e.preventDefault(); e.stopPropagation(); goster(e); return; }
    if (!balon.hidden) kapat();
  }, true);
  ["click", "contextmenu", "mouseup", "auxclick", "dblclick"].forEach(t => document.addEventListener(t, e => { if (altgr(e)) { e.preventDefault(); e.stopPropagation(); } }, true));
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !balon.hidden) kapat(); });
  window.addEventListener("blur", kapat);
  document.addEventListener("scroll", kapat, true);
})();

function ciz() { listeCiz(); ozetCiz(); sorunCiz(); analizCiz(); gecmisCiz(); altCiz(); ayPanelCiz(); }

function ustOku() {
  const k = Math.min(12, Math.max(1, +$("#kisi").value || V.kisi));
  const n = Math.min(500, Math.max(30, +$("#altSay").value || 300));
  return { k, n };
}

function sure(ms) {
  if (ms === null) return "hesaplanıyor";
  return Math.max(1, Math.round(ms / 1000)) + " sn";
}

function ilerlemeGoster(oran, yazi) {
  $("#ilerleme").hidden = oran === null;
  if (oran === null) return;
  const yuzde = Math.round(oran * 100);
  $("#ilerlemeIz").setAttribute("aria-valuenow", String(yuzde));
  $("#ilerlemeDolgu").style.width = yuzde + "%";
  $("#ilerlemeYazi").textContent = "%" + yuzde + " · " + yazi;
}

function uret() {
  if (CALISIYOR) { CALISIYOR = false; return; }
  const { k, n } = ustOku();
  V.kisi = k;
  const benim = ++KOSU;
  CALISIYOR = true;
  ALT = [];
  ALTTOPLAM = 0;
  let enC = Infinity;
  L = null;
  sekme("alt");
  ciz();
  ilerlemeGoster(0, "başlıyor");
  MOTOR.kurAsenkron(V, TOHUM, n, o => {
    if (benim !== KOSU) return;
    ilerlemeGoster(o.oran, o.tur + "/" + o.toplam + " alternatif · kalan " + sure(o.kalanMs));
    if (o.yeni) {
      ALTTOPLAM = o.tur;
      if (o.yeni.maliyet < enC) {
        enC = o.yeni.maliyet;
        L = kopya(o.yeni.liste);
        listeCiz(); ozetCiz(); sorunCiz(); analizCiz();
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
    if (ALT.length) toast(ALTTOPLAM + " alternatiften en iyisi seçildi (1000 puan)", "success");
  });
}

function git(y, a) {
  if (CALISIYOR) { CALISIYOR = false; KOSU++; ilerlemeGoster(null); }
  const eskiKisi = V.kisi;
  const k = ustOku().k;
  yukle(y, a);
  if (!L) V.kisi = k || eskiKisi;
  $("#kisi").value = V.kisi;
  kadroCiz();
  istekCiz();
  kuralCiz();
  if (!L) uret(); else { sakla(); ciz(); }
}

function ayKay(fark) {
  const t = new Date(V.yil, V.ay - 1 + fark, 1);
  git(t.getFullYear(), t.getMonth() + 1);
}

function satirlar() {
  const G = MOTOR.gunSayisi(V);
  const s = [["Tarih", "Gün"].concat(Array.from({ length: V.kisi }, (_, i) => "Nöbetçi " + (i + 1)))];
  for (let d = 1; d <= G; d++) s.push([tarihMetin(d), MOTOR.GUN[MOTOR.haftaGunu(V, d)]].concat((L[d] || []).map(p => V.kisiler[p].ad)));
  return s;
}

$("#btnUret").onclick = uret;
$("#btnYeni").onclick = () => { if (CALISIYOR) return; TOHUM = Math.floor(Math.random() * 1e9) + 1; uret(); };
$("#btnKopya").onclick = () => {
  if (!L) return toast("Önce listeyi oluştur", "warning");
  navigator.clipboard.writeText(satirlar().map(r => r.join("\t")).join("\n")).then(() => toast("Kopyalandı", "success"), () => toast("Kopyalanamadı", "danger"));
};
$("#btnCsv").onclick = async () => {
  if (!L) return toast("Önce listeyi oluştur", "warning");
  const yol = await W.dosyaYaz("nobet-" + V.yil + "-" + String(V.ay).padStart(2, "0") + ".csv", satirlar().map(r => r.join(";")).join("\r\n"), "CSV");
  if (yol) toast("Kaydedildi: " + yol, "success");
};
$("#btnYazdir").onclick = () => { if (!L) return toast("Önce listeyi oluştur", "warning"); W.yazdir(); };
$("#altSay").onchange = () => { const { n } = ustOku(); $("#altSay").value = n; ayarYaz({ altSay: n }); };
$("#kisi").onchange = () => { const { k } = ustOku(); if (k !== V.kisi) { V.kisi = k; L = null; ALT = []; sakla(); uret(); } };
$("#btnZor").onclick = () => { if (CALISIYOR) return; V.zorunlu = !V.zorunlu; sakla(); uret(); };
$("#yilGeri").onclick = () => git(V.yil - 1, V.ay);
$("#yilIleri").onclick = () => git(V.yil + 1, V.ay);
$("#btnSonraki").onclick = () => ayKay(1);
document.querySelectorAll(".ay-dgm").forEach((b, i) => {
  b.onclick = () => git(V.yil, i + 1);
  b.oncontextmenu = e => {
    e.preventDefault();
    const kayit = oku(ayAnahtar(V.yil, i + 1));
    if (!kayit || !kayit.liste) return toast(AYLAR[i] + " " + V.yil + " için kayıtlı liste yok; geçmişi Geçmiş sekmesinden elle gir.", "warning");
    const ak = V.yil + "-" + String(i + 1).padStart(2, "0");
    GA.aylar[ak] = GA.aylar[ak] !== true;
    gecmisAyarYaz();
    yenidenKur(AYLAR[i] + " " + V.yil + (GA.aylar[ak] ? " geçmişe katıldı." : " geçmişten çıkarıldı.") + " Listeye yansıması için Listeyi Oluştur.");
  };
});
document.querySelectorAll(".sayac .dgm[data-hedef]").forEach(b => {
  b.onclick = () => {
    const i = $("#" + b.dataset.hedef);
    const yeni = Math.min(+i.max, Math.max(+i.min, (+i.value || 0) + +b.dataset.adim));
    if (yeni === +i.value) return;
    i.value = yeni;
    i.dispatchEvent(new Event("change"));
  };
});

const SEKMELER = ["ozet", "sorun", "istek", "analiz", "gecmis", "kural", "kadro", "alt", "hakkinda"];
const GENIS = ["istek", "analiz", "gecmis", "kural", "hakkinda"];
function sekme(ad) {
  document.querySelector(".govde").dataset.genis = GENIS.includes(ad) ? "1" : "0";
  SEKMELER.forEach(s => {
    const a = s === ad;
    const b = $("#sk-" + s);
    b.setAttribute("aria-selected", String(a));
    b.tabIndex = a ? 0 : -1;
    $("#p-" + s).hidden = !a;
  });
}
SEKMELER.forEach((s, i) => {
  const b = $("#sk-" + s);
  b.onclick = () => sekme(s);
  b.onkeydown = e => {
    const git = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: SEKMELER.length - 1 }[e.key];
    if (git === undefined) return;
    e.preventDefault();
    const n = (git + SEKMELER.length) % SEKMELER.length;
    sekme(SEKMELER[n]);
    $("#sk-" + SEKMELER[n]).focus();
  };
});

(() => {
  const son = oku("son");
  const y = son ? son.yil : ILK.yil;
  const a = son ? son.ay : ILK.ay;
  yukle(y, a);
  $("#kisi").value = V.kisi;
  try { const n = JSON.parse(W.veri.oku("ayar") || "{}").altSay; if (n) $("#altSay").value = n; } catch (e) {}
  kadroCiz();
  istekCiz();
  kuralCiz();
  hakkindaCiz();
  if (!L) uret(); else ciz();
})();

(() => {
  const G = W.guncelle;
  const dugme = $("#basbarSurum");
  const panel = $("#gncPanel");
  let mesgul = false;
  G.surum().then(s => { dugme.textContent = "v" + s; $("#hakSurum").textContent = "Sürüm " + s; });
  let onay = false;
  try { onay = JSON.parse(W.veri.oku("ayar") || "{}").onayIste === true; } catch (e) {}
  const onayCiz = () => {
    $("#btnOnay").setAttribute("aria-pressed", String(onay));
    $("#btnOnay").textContent = (ET["update.confirmSetting"] || "Güncellemeden önce sor") + ": " + (onay ? "Açık" : "Kapalı");
  };
  onayCiz();
  $("#btnOnay").onclick = () => { onay = !onay; ayarYaz({ onayIste: onay }); onayCiz(); };
  dugme.setAttribute("aria-label", ET["update.check"] || "update.check");
  dugme.title = ET["update.check"] || "";
  const kapat = () => { panel.hidden = true; $("#gncIz").hidden = true; $("#gncEvet").disabled = false; $("#gncSonra").disabled = false; };
  G.ilerle(p => {
    $("#gncDolgu").style.width = Math.round(p.yuzde * 100) + "%";
    $("#gncYazi").textContent = p.adim + " (%" + Math.round(p.yuzde * 100) + ")";
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
    if (!onay) {
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
