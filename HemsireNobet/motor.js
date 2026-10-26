(function (g) {
  const GUN = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  const KISA = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

  function gunSayisi(v) {
    return new Date(v.yil, v.ay, 0).getDate();
  }

  function haftaGunu(v, g1) {
    return new Date(v.yil, v.ay - 1, g1).getDay();
  }

  function grup(v, g1) {
    const w = haftaGunu(v, g1);
    if (v.tatil.includes(g1)) return 3;
    if (w === 6) return 2;
    if (w === 0) return 3;
    if (w === 5) return 1;
    return 0;
  }

  function rng(tohum) {
    let s = tohum >>> 0 || 1;
    return function () {
      s ^= s << 13;
      s >>>= 0;
      s ^= s >>> 17;
      s ^= s << 5;
      s >>>= 0;
      return s / 4294967296;
    };
  }

  function hazirla(v) {
    const n = v.kisiler.length;
    const G = gunSayisi(v);
    const toplam = G * v.kisi;
    const minT = v.kisiler.reduce((a, k) => a + k.min, 0);
    const fark = v.kisiler.reduce((a, k) => a + (k.max - k.min), 0) || 1;
    const hedef = v.kisiler.map((k) => k.min + ((toplam - minT) * (k.max - k.min)) / fark);
    const grupSay = [0, 0, 0, 0];
    for (let d = 1; d <= G; d++) grupSay[grup(v, d)] += v.kisi;
    const beklenen = v.kisiler.map((_, i) => grupSay.map((c) => (c * hedef[i]) / toplam));
    const yok = v.kisiler.map((k) => new Set(k.izin));
    const istemez = v.kisiler.map((k) => new Set(k.istemiyor));
    const ister = v.kisiler.map((k) => new Set(k.istiyor));
    const onceki = new Set(v.onceki || []);
    const grp = [];
    for (let d = 1; d <= G; d++) grp[d] = grup(v, d);
    const zor = !!v.zorunlu;
    return {
      n, G, toplam, hedef, beklenen, yok, istemez, ister, onceki, grp,
      agIstemez: zor ? 1000 : 400,
      agIster: zor ? 1000 : 40
    };
  }

  const ZOR = 100000;

  function kisiMaliyet(v, h, p, gun) {
    const k = v.kisiler[p];
    const G = h.G;
    let say = 0;
    let c = 0;
    const gs = [0, 0, 0, 0];
    const yok = h.yok[p];
    const istemez = h.istemez[p];
    const ister = h.ister[p];
    if (h.onceki.has(p) && gun[1]) c += ZOR;
    for (let d = 1; d <= G; d++) {
      if (gun[d]) {
        say++;
        gs[h.grp[d]]++;
        if (yok.has(d)) c += ZOR;
        if (istemez.has(d)) c += h.agIstemez;
        if (gun[d + 1]) c += ZOR;
        if (gun[d + 2]) c += 3;
      } else if (ister.has(d)) c += h.agIster;
    }
    if (say < k.min) c += 300 * (k.min - say);
    if (say > k.max) c += 300 * (say - k.max);
    c += 6 * (say - h.hedef[p]) ** 2;
    for (let q = 0; q < 4; q++) c += 3 * (gs[q] - h.beklenen[p][q]) ** 2;
    return c;
  }

  function maliyet(v, h, a) {
    const gun = Array.from({ length: h.n }, () => new Array(h.G + 3).fill(false));
    for (let d = 1; d <= h.G; d++) for (const p of a[d]) gun[p][d] = true;
    let c = 0;
    for (let p = 0; p < h.n; p++) c += kisiMaliyet(v, h, p, gun[p]);
    return c;
  }

  function secenek(v, tohum, itSay) {
    const h = hazirla(v);
    const R = rng(tohum || 1);
    const { n, G } = h;
    const a = [null];
    const say = new Array(n).fill(0);
    const son = new Array(n).fill(-9);
    for (const p of h.onceki) son[p] = 0;
    for (let d = 1; d <= G; d++) {
      const aday = [];
      for (let p = 0; p < n; p++) {
        if (h.yok[p].has(d) || son[p] === d - 1) continue;
        let s = (say[p] - h.hedef[p] * (d / G)) * 4 + R() * 6;
        if (h.istemez[p].has(d)) s += v.zorunlu ? 5000 : 50;
        if (h.ister[p].has(d)) s -= v.zorunlu ? 5000 : 30;
        if (d - son[p] === 2) s += 2;
        aday.push([s, p]);
      }
      aday.sort((x, y) => x[0] - y[0]);
      const sec = aday.slice(0, v.kisi).map((x) => x[1]);
      a[d] = sec;
      for (const p of sec) {
        say[p]++;
        son[p] = d;
      }
    }
    const gun = Array.from({ length: n }, () => new Array(G + 3).fill(false));
    for (let d = 1; d <= G; d++) for (const p of a[d]) gun[p][d] = true;
    const kc = [];
    for (let p = 0; p < n; p++) kc[p] = kisiMaliyet(v, h, p, gun[p]);
    let c = kc.reduce((x, y) => x + y, 0);
    let it = 0;

    function adim(sayi) {
      const bit = Math.min(itSay, it + sayi);
      for (; it < bit; it++) {
        const d = 1 + Math.floor(R() * G);
        const yer = Math.floor(R() * a[d].length);
        const eski = a[d][yer];
        if (R() < 0.5) {
          const yeni = Math.floor(R() * n);
          if (gun[yeni][d]) continue;
          gun[eski][d] = false;
          gun[yeni][d] = true;
          const e1 = kisiMaliyet(v, h, eski, gun[eski]);
          const e2 = kisiMaliyet(v, h, yeni, gun[yeni]);
          const fark = e1 + e2 - kc[eski] - kc[yeni];
          if (fark <= 0) {
            a[d][yer] = yeni;
            kc[eski] = e1;
            kc[yeni] = e2;
            c += fark;
          } else {
            gun[eski][d] = true;
            gun[yeni][d] = false;
          }
        } else {
          const d2 = 1 + Math.floor(R() * G);
          if (d2 === d) continue;
          const y2 = Math.floor(R() * a[d2].length);
          const o2 = a[d2][y2];
          if (gun[o2][d] || gun[eski][d2]) continue;
          gun[eski][d] = false;
          gun[eski][d2] = true;
          gun[o2][d2] = false;
          gun[o2][d] = true;
          const e1 = kisiMaliyet(v, h, eski, gun[eski]);
          const e2 = kisiMaliyet(v, h, o2, gun[o2]);
          const fark = e1 + e2 - kc[eski] - kc[o2];
          if (fark <= 0) {
            a[d][yer] = o2;
            a[d2][y2] = eski;
            kc[eski] = e1;
            kc[o2] = e2;
            c += fark;
          } else {
            gun[eski][d] = true;
            gun[eski][d2] = false;
            gun[o2][d2] = true;
            gun[o2][d] = false;
          }
        }
      }
      return it >= itSay;
    }

    return { adim, oran: () => it / itSay, sonuc: () => ({ liste: a.map((x) => (x ? x.slice() : x)), maliyet: c }) };
  }

  const IT = 14000;

  function kur(v, tohum, tur) {
    let en = null;
    const deneme = tur || 12;
    for (let t = 0; t < deneme; t++) {
      const s = secenek(v, (tohum || 1) + t * 7919, IT);
      s.adim(IT);
      const r = s.sonuc();
      if (!en || r.maliyet < en.maliyet) en = r;
    }
    return { liste: en.liste, maliyet: en.maliyet };
  }

  function sonraki(f) {
    if (typeof MessageChannel === "undefined") return setTimeout(f, 0);
    const k = new MessageChannel();
    k.port1.onmessage = () => { k.port1.close(); f(); };
    k.port2.postMessage(0);
  }

  function kurAsenkron(v, tohum, tur, ilerle, iptal) {
    return new Promise((ok) => {
      const toplam = tur || 12;
      const alt = [];
      const bas = Date.now();
      let t = 0;
      let cur = secenek(v, tohum || 1, IT);
      function tik() {
        if (iptal && iptal()) return ok(alt);
        const t0 = Date.now();
        let bitti = false;
        while (Date.now() - t0 < 24 && !bitti) bitti = cur.adim(700);
        const oran = (t + cur.oran()) / toplam;
        if (bitti) {
          alt.push(cur.sonuc());
          t++;
          if (t < toplam) cur = secenek(v, (tohum || 1) + t * 7919, IT);
        }
        const gecen = Date.now() - bas;
        if (ilerle) try { ilerle({ tur: t, toplam, oran: Math.min(1, oran), kalanMs: oran > 0.02 ? (gecen / oran) * (1 - oran) : null, yeni: bitti ? alt[alt.length - 1] : null, alt }); } catch (e) { if (g.console) console.error(e); }
        if (t >= toplam) return ok(alt);
        sonraki(tik);
      }
      tik();
    });
  }

  function rapor(v, a) {
    const h = hazirla(v);
    const G = h.G;
    const sorun = [];
    const say = new Array(h.n).fill(0);
    const gun = Array.from({ length: h.n }, () => new Array(G + 2).fill(false));
    for (let d = 1; d <= G; d++) {
      const set = new Set(a[d]);
      if (set.size !== a[d].length) sorun.push(d + ". gün: aynı kişi iki kez yazılmış");
      if (a[d].length !== v.kisi) sorun.push(d + ". gün: " + a[d].length + " kişi (hedef " + v.kisi + ")");
      for (const p of a[d]) {
        say[p]++;
        gun[p][d] = true;
        if (h.yok[p].has(d)) sorun.push(d + ". gün: " + v.kisiler[p].ad + " izinli");
        else if (h.istemez[p].has(d)) sorun.push(d + ". gün: " + v.kisiler[p].ad + " istemediği güne yazılmış");
      }
    }
    for (let p = 0; p < h.n; p++) {
      if (h.onceki.has(p) && gun[p][1]) sorun.push(v.kisiler[p].ad + ": önceki ayın son günü ile 1. gün arka arkaya");
      for (let d = 1; d < G; d++) if (gun[p][d] && gun[p][d + 1]) sorun.push(v.kisiler[p].ad + ": " + d + "-" + (d + 1) + " arka arkaya");
      if (say[p] < v.kisiler[p].min) sorun.push(v.kisiler[p].ad + ": " + say[p] + " nöbet, alt sınır " + v.kisiler[p].min);
      if (say[p] > v.kisiler[p].max) sorun.push(v.kisiler[p].ad + ": " + say[p] + " nöbet, üst sınır " + v.kisiler[p].max);
      const ist = new Set(v.kisiler[p].istiyor);
      for (const d of ist) {
        if (gun[p][d]) continue;
        const ad = v.kisiler[p].ad;
        if (h.yok[p].has(d)) sorun.push(ad + ": " + d + ". gün hem izinli hem istek, izin kesin olduğu için verilemez");
        else if (ist.has(d - 1) || ist.has(d + 1)) sorun.push(ad + ": " + d + ". gün istediği halde yazılmadı, yanındaki gün de istek ve art arda nöbet olmaz, ikisi birden verilemez");
        else sorun.push(ad + ": " + d + ". gün istediği halde yazılmadı");
      }
    }
    for (let d = 1; d <= G; d++) {
      let ister = 0;
      for (let p = 0; p < h.n; p++) if (h.ister[p].has(d)) ister++;
      if (ister > v.kisi) sorun.push(d + ". gün: " + ister + " kişi istiyor, günlük kontenjan " + v.kisi + ", hepsi verilemez");
    }
    return { say, sorun };
  }

  const M = { GUN, KISA, gunSayisi, haftaGunu, grup, kur, kurAsenkron, rapor, maliyet, hazirla };
  if (typeof module !== "undefined") module.exports = M;
  else g.MOTOR = M;
})(typeof window !== "undefined" ? window : globalThis);
