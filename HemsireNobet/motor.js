(function (g) {
  const GUN = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  const KISA = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

  function gunSayisi(v) {
    return new Date(v.yil, v.ay, 0).getDate();
  }

  function haftaGunu(v, g1) {
    return new Date(v.yil, v.ay - 1, g1).getDay();
  }

  const AGIRLIK = [1, 1, 2, 3, 2];
  const GRUP_AD = ["Pzt-Çar", "Per", "Cum", "Cmt", "Paz"];
  const ZOR = 100000;
  const GW = [1, 3, 3, 4, 3];

  function grup(v, g1) {
    if (v.tatil.includes(g1)) return 4;
    const w = haftaGunu(v, g1);
    if (w === 6) return 3;
    if (w === 0) return 4;
    if (w === 5) return 2;
    if (w === 4) return 1;
    return 0;
  }

  const nb = (k) => (k.nobet !== undefined ? k.nobet : k.min !== undefined ? k.min : 7);
  const od = (k) => (k.odeme !== undefined ? k.odeme : k.max !== undefined ? k.max : 11);

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

  function hazirla(v, gecmisKullan) {
    const n = v.kisiler.length;
    const G = gunSayisi(v);
    const toplam = G * v.kisi;
    const grupSay = [0, 0, 0, 0, 0];
    const grp = [];
    for (let d = 1; d <= G; d++) {
      grp[d] = grup(v, d);
      grupSay[grp[d]] += v.kisi;
    }
    const toplamOde = grupSay.reduce((a, c, q) => a + c * AGIRLIK[q], 0);
    const sn = v.kisiler.reduce((a, k) => a + nb(k), 0) || 1;
    const sp = v.kisiler.reduce((a, k) => a + od(k), 0) || 1;
    const nTaban = v.kisiler.map((k) => (toplam * nb(k)) / sn);
    const pTaban = v.kisiler.map((k) => (toplamOde * od(k)) / sp);
    const gTaban = v.kisiler.map((k) => grupSay.map((c) => (c * nb(k)) / sn));
    const dev = v.kisiler.map(() => ({ n: 0, p: 0, g: [0, 0, 0, 0, 0] }));
    const gec = gecmisKullan === false ? null : v.gecmis;
    if (gec) {
      const c = v.kisiler.map((k) => gec[k.ad] || { n: 0, p: 0, g: [0, 0, 0, 0, 0] });
      const TN = c.reduce((a, x) => a + x.n, 0);
      const TP = c.reduce((a, x) => a + x.p, 0);
      const TG = [0, 1, 2, 3, 4].map((q) => c.reduce((a, x) => a + x.g[q], 0));
      v.kisiler.forEach((k, i) => {
        dev[i].n = c[i].n - (TN * nb(k)) / sn;
        dev[i].p = c[i].p - (TP * od(k)) / sp;
        for (let q = 0; q < 5; q++) dev[i].g[q] = c[i].g[q] - (TG[q] * nb(k)) / sn;
      });
    }
    const hedef = nTaban.map((x, i) => Math.max(0, x - dev[i].n));
    const odeme = pTaban.map((x, i) => Math.max(0, x - dev[i].p));
    const beklenen = gTaban.map((a, i) => a.map((x, q) => Math.max(0, x - dev[i].g[q])));
    const yok = v.kisiler.map((k) => new Set(k.izin));
    const istemez = v.kisiler.map((k) => new Set(k.istemiyor));
    const ister = v.kisiler.map((k) => new Set(k.istiyor));
    const onceki = new Set(v.onceki || []);
    const zor = !!v.zorunlu;
    const agIster = v.kisiler.map((k) => (zor ? 2000 : 120) / Math.max(1, new Set(k.istiyor).size));
    return {
      n, G, toplam, toplamOde, hedef, odeme, beklenen, yok, istemez, ister, onceki, grp, dev, nTaban, pTaban, agIster,
      agIstemez: zor ? 1000 : 400,
      perHs: zor ? 200 : 80
    };
  }

  function kisiMaliyet(v, h, p, gun) {
    const G = h.G;
    let say = 0;
    let pay = 0;
    let c = 0;
    const gs = [0, 0, 0, 0, 0];
    const yok = h.yok[p];
    const istemez = h.istemez[p];
    const ister = h.ister[p];
    if (h.onceki.has(p) && gun[1]) c += ZOR;
    for (let d = 1; d <= G; d++) {
      if (gun[d]) {
        say++;
        const q = h.grp[d];
        gs[q]++;
        pay += AGIRLIK[q];
        if (yok.has(d)) c += ZOR;
        if (istemez.has(d)) c += h.agIstemez;
        if (gun[d + 1]) c += ZOR;
        if (gun[d + 2]) c += 3;
        if (q === 1 && (gun[d + 2] || gun[d + 3])) c += h.perHs;
      } else if (ister.has(d)) c += h.agIster[p];
    }
    c += 6 * (say - h.hedef[p]) ** 2;
    c += 2 * (pay - h.odeme[p]) ** 2;
    for (let q = 0; q < 5; q++) c += GW[q] * (gs[q] - h.beklenen[p][q]) ** 2;
    return c;
  }

  function maliyet(v, h, a) {
    const gun = Array.from({ length: h.n }, () => new Array(h.G + 4).fill(false));
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
        if (h.ister[p].has(d)) s -= (v.zorunlu ? 5000 : 60) / Math.max(1, h.ister[p].size);
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
    const gun = Array.from({ length: n }, () => new Array(G + 4).fill(false));
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
    const gun = Array.from({ length: h.n }, () => new Array(G + 4).fill(false));
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
      for (let d = 1; d <= G; d++) if (gun[p][d] && h.grp[d] === 1 && (gun[p][d + 2] || gun[p][d + 3])) sorun.push(v.kisiler[p].ad + ": " + d + ". gün perşembe nöbetinden sonra hafta sonu da yazılmış");
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

  function analiz(v, a) {
    const h = hazirla(v);
    const G = h.G;
    const gun = Array.from({ length: h.n }, () => new Array(G + 4).fill(false));
    for (let d = 1; d <= G; d++) for (const p of a[d]) gun[p][d] = true;
    return v.kisiler.map((k, p) => {
      const gs = [0, 0, 0, 0, 0];
      let say = 0;
      let pay = 0;
      let ardArda = 0;
      let perHs = 0;
      for (let d = 1; d <= G; d++) {
        if (!gun[p][d]) continue;
        say++;
        gs[h.grp[d]]++;
        pay += AGIRLIK[h.grp[d]];
        if (gun[p][d + 1]) ardArda++;
        if (h.grp[d] === 1 && (gun[p][d + 2] || gun[p][d + 3])) perHs++;
      }
      const ist = [...h.ister[p]];
      const verilen = ist.filter((d) => gun[p][d]).length;
      const istemez = [...h.istemez[p]];
      const ihlal = istemez.filter((d) => gun[p][d]).length;
      const gec = (v.gecmis && v.gecmis[k.ad]) || null;
      return {
        ad: k.ad, nobet: say, nobetHedef: h.hedef[p], nobetAsil: nb(k),
        odeme: pay, odemeHedef: h.odeme[p], odemeAsil: od(k),
        grup: gs, grupBeklenen: h.beklenen[p],
        istek: ist.length, istekVerilen: verilen,
        istemez: istemez.length, istemezIhlal: ihlal,
        izin: k.izin.length, ardArda, perHs,
        gecmis: gec, fark: { n: -h.dev[p].n, p: -h.dev[p].p }
      };
    });
  }

  const M = { AGIRLIK, GRUP_AD, analiz, GUN, KISA, gunSayisi, haftaGunu, grup, kur, kurAsenkron, rapor, maliyet, hazirla };
  if (typeof module !== "undefined") module.exports = M;
  else g.MOTOR = M;
})(typeof window !== "undefined" ? window : globalThis);
