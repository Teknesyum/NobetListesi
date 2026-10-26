"use strict";

const $ = s => document.querySelector(s);
const el = (t, p) => Object.assign(document.createElement(t), p || {});
const W = window.pencere;
const ET = window.ETIKET || {};
const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const ILK = JSON.parse(JSON.stringify(VERI));

function toast(m, tur) {
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

function oku(k) { try { return JSON.parse(W.veri.oku(k)); } catch (e) { return null; } }

function yukle(y, a) {
  const kayit = oku(ayAnahtar(y, a));
  const kadro = oku("kadro");
  const taban = kopya(ILK);
  let kisiler;
  if (kayit && kayit.kisiler) kisiler = kayit.kisiler;
  else if (y === ILK.yil && a === ILK.ay) kisiler = taban.kisiler;
  else kisiler = kopya((kadro && kadro.kisiler) || taban.kisiler).map(k => Object.assign(k, { izin: [], istemiyor: [], istiyor: [] }));
  const zor = kayit && kayit.zorunlu !== undefined ? kayit.zorunlu : kadro && kadro.zorunlu !== undefined ? kadro.zorunlu : false;
  V = { yil: y, ay: a, kisi: (kayit && kayit.kisi) || (kadro && kadro.kisi) || taban.kisi, tatil: [], kisiler, zorunlu: !!zor, onceki: [] };
  const py = a === 1 ? y - 1 : y;
  const pa = a === 1 ? 12 : a - 1;
  const pk = oku(ayAnahtar(py, pa));
  if (pk && pk.liste && pk.kisiler) {
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
  W.veri.yaz(ayAnahtar(V.yil, V.ay), JSON.stringify({ kisi: V.kisi, kisiler: V.kisiler, zorunlu: V.zorunlu, liste: L, tohum: TOHUM, alt: ALT, altToplam: ALTTOPLAM, sec: SEC }));
  W.veri.yaz("kadro", JSON.stringify({ kisi: V.kisi, kisiler: V.kisiler, zorunlu: V.zorunlu }));
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
    n.dataset.kotu = gunler.length < k.min || gunler.length > k.max ? "1" : "0";
    n.append(String(gunler.length), el("small", { textContent: k.min + "–" + k.max }));
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
  ["Ad", "Alt", "Üst", "İzin", "İstemiyor", "İstiyor"].forEach(m => b.append(el("th", { scope: "col", textContent: m })));
  t.append(b);
  V.kisiler.forEach(k => {
    const tr = el("tr", {});
    tr.append(el("td", { textContent: k.ad }));
    [["min", "Alt Sınır"], ["max", "Üst Sınır"], ["izin", "İzin Günleri"], ["istemiyor", "İstemediği Günler"], ["istiyor", "İstediği Günler"]].forEach(([a, e]) => {
      const sayi = a === "min" || a === "max";
      const i = el("input", { className: "tk-input" + (sayi ? " dar" : ""), type: sayi ? "number" : "text", value: sayi ? k[a] : yaz(k[a]) });
      i.setAttribute("aria-label", k.ad + " " + e);
      i.onchange = () => { k[a] = sayi ? +i.value : gunOku(i.value); sakla(); ciz(); };
      tr.append(el("td", {}));
      tr.lastChild.append(i);
    });
    t.append(tr);
  });
  p.append(t);
  p.append(el("p", { className: "yardim", textContent: "Günler virgülle yazılır, aralık için tire kullanılır: 3, 7-9, 21. İzin kesin boş demektir; istemiyor ve istiyor mümkün olduğunca uygulanır." }));
}

function altCiz() {
  const p = $("#p-alt");
  p.replaceChildren();
  if (!ALT.length) { p.append(el("p", { className: "yardim", textContent: "Henüz alternatif yok." })); return; }
  const en = Math.min(...ALT.map(x => x.maliyet));
  const baslik = el("p", { className: "yardim", textContent: ALTTOPLAM + " alternatif üretildi, en iyi " + ALT.length + " tanesi listelendi. Seçilen: " + (SEC + 1) + ". sıradaki. Birine tıklarsan liste o alternatife döner." });
  baslik.style.marginTop = "0";
  p.append(baslik);
  const ul = el("div", { className: "alt-liste", role: "list" });
  ALT.forEach((x, i) => {
    const b = el("button", { type: "button", className: "alt-satir", role: "listitem" });
    b.setAttribute("aria-current", String(i === SEC));
    b.append(el("span", { className: "alt-no", textContent: String(i + 1) }));
    const iz = el("span", { className: "alt-iz" });
    const dolgu = el("span", { className: "alt-dolgu" });
    dolgu.style.width = Math.max(4, Math.round((en / Math.max(x.maliyet, 1e-9)) * 100)) + "%";
    iz.append(dolgu);
    b.append(iz, el("span", { className: "alt-puan", textContent: x.maliyet.toFixed(0) }));
    b.setAttribute("aria-label", (i + 1) + ". alternatif, puan " + x.maliyet.toFixed(0) + (i === SEC ? ", seçili" : ""));
    b.onclick = () => { if (CALISIYOR) return; SEC = i; L = kopya(x.liste); sakla(); ciz(); };
    ul.append(b);
  });
  p.append(ul);
}

function ayPanelCiz() {
  $("#yilYazi").textContent = String(V.yil);
  document.querySelectorAll(".ay-dgm").forEach((b, i) => {
    const kayit = oku(ayAnahtar(V.yil, i + 1));
    b.dataset.dolu = kayit && kayit.liste ? "1" : "0";
    b.setAttribute("aria-current", String(i + 1 === V.ay));
  });
  $("#btnZor").setAttribute("aria-pressed", String(!!V.zorunlu));
  $("#btnZor").textContent = "İstekler Zorunlu: " + (V.zorunlu ? "Açık" : "Kapalı");
  $("#btnUret").textContent = CALISIYOR ? "Durdur" : "Listeyi Oluştur";
}

function ciz() { listeCiz(); ozetCiz(); sorunCiz(); altCiz(); ayPanelCiz(); }

function ustOku() {
  const k = Math.min(12, Math.max(1, +$("#kisi").value || V.kisi));
  const n = Math.min(500, Math.max(2, +$("#altSay").value || 200));
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
    ilerlemeGoster(o.oran, o.tur + "/" + o.toplam + " alternatif · kalan " + sure(o.kalanMs) + " · en iyi puan " + (enC === Infinity ? "-" : enC.toFixed(0)));
    if (o.yeni) {
      ALTTOPLAM = o.tur;
      if (o.yeni.maliyet < enC) {
        enC = o.yeni.maliyet;
        L = kopya(o.yeni.liste);
        listeCiz(); ozetCiz(); sorunCiz();
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
    if (ALT.length) toast(ALTTOPLAM + " alternatiften en iyisi seçildi (puan " + ALT[0].maliyet.toFixed(0) + ")", "success");
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
$("#kisi").onchange = () => { const { k } = ustOku(); if (k !== V.kisi) { V.kisi = k; L = null; ALT = []; sakla(); uret(); } };
$("#btnZor").onclick = () => { if (CALISIYOR) return; V.zorunlu = !V.zorunlu; sakla(); uret(); };
$("#yilGeri").onclick = () => git(V.yil - 1, V.ay);
$("#yilIleri").onclick = () => git(V.yil + 1, V.ay);
$("#btnSonraki").onclick = () => ayKay(1);
document.querySelectorAll(".ay-dgm").forEach((b, i) => { b.onclick = () => git(V.yil, i + 1); });

const SEKMELER = ["ozet", "sorun", "kadro", "alt"];
function sekme(ad) {
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
  kadroCiz();
  if (!L) uret(); else ciz();
})();

(() => {
  const G = W.guncelle;
  const dugme = $("#basbarSurum");
  const panel = $("#gncPanel");
  let mesgul = false;
  G.surum().then(s => { dugme.textContent = "v" + s; });
  let onay = false;
  try { onay = JSON.parse(W.veri.oku("ayar") || "{}").onayIste === true; } catch (e) {}
  const onayCiz = () => {
    $("#btnOnay").setAttribute("aria-pressed", String(onay));
    $("#btnOnay").textContent = (ET["update.confirmSetting"] || "Güncellemeden önce sor") + ": " + (onay ? "Açık" : "Kapalı");
  };
  onayCiz();
  $("#btnOnay").onclick = () => { onay = !onay; W.veri.yaz("ayar", JSON.stringify({ onayIste: onay })); onayCiz(); };
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
