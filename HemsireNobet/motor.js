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
  const MONO = 20000;

  function monoCift(sp, pp, sq, pq) {
    if (sp > sq && pp <= pq) return MONO * (pq - pp + 1);
    if (sq > sp && pq <= pp) return MONO * (pp - pq + 1);
    return 0;
  }

  function monoToplam(sA, pA) {
    let c = 0;
    for (let p = 0; p < sA.length; p++) for (let q = p + 1; q < sA.length; q++) c += monoCift(sA[p], pA[p], sA[q], pA[q]);
    return c;
  }

  function monoIki(sA, pA, x, y) {
    let c = monoCift(sA[x], pA[x], sA[y], pA[y]);
    for (let q = 0; q < sA.length; q++) {
      if (q !== x && q !== y) c += monoCift(sA[x], pA[x], sA[q], pA[q]) + monoCift(sA[y], pA[y], sA[q], pA[q]);
    }
    return c;
  }

  function sayPay(h, a) {
    const sA = new Array(h.n).fill(0);
    const pA = new Array(h.n).fill(0);
    for (let d = 1; d <= h.G; d++) for (const p of a[d]) { sA[p]++; pA[p] += h.ag[h.grp[d]]; }
    return { sA, pA };
  }
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

  const KURAL = { ardArda: true, odemeModu: "puan", istekDenge: false, sonraBos: [{ gun: 4, bos: [6, 0], kapsam: "bir", kesin: false, acik: true }], s: 2, comez: { acik: true, enFazla: 1, kesin: false } };
  const TIP_AD = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

  function tip(v, g1) {
    const q = grup(v, g1);
    return q === 0 ? haftaGunu(v, g1) - 1 : q + 2;
  }

  const sinir = (x, a, b) => Math.max(a, Math.min(b, x));

  function kuralNorm(k, kisiler) {
    const x = Object.assign({}, KURAL, k || {});
    x.ardArda = x.ardArda !== false;
    x.istekDenge = !!x.istekDenge;
    x.odemeModu = x.odemeModu === "esit" ? "esit" : "puan";
    const eski = !(+x.s >= 2);
    x.sonraBos = (Array.isArray(x.sonraBos) ? x.sonraBos : KURAL.sonraBos).map((r) => ({
      gun: ((+r.gun % 7) + 7) % 7, bos: (r.bos || []).map((b) => ((+b % 7) + 7) % 7),
      kapsam: r.kapsam === "hepsi" && !eski ? "hepsi" : "bir", kesin: !!r.kesin, acik: r.acik !== false
    }));
    x.s = 2;
    const c = Object.assign({}, KURAL.comez, x.comez || {});
    x.comez = { acik: c.acik !== false, enFazla: Math.max(0, Math.min(12, Math.round(+c.enFazla) || 0)), kesin: !!c.kesin };
    if (!Array.isArray(x.gruplar)) {
      const uy = (kisiler || []).filter((q) => q.comez).map((q) => q.ad);
      x.gruplar = uy.length || !kisiler ? [{ id: "comez", ad: "Çömezler", uyeler: uy, enFazla: x.comez.enFazla, kesin: x.comez.kesin, acik: x.comez.acik }] : [];
    }
    x.gruplar = x.gruplar.map((r, i) => ({
      id: String(r.id || "g" + i), ad: String(r.ad || "Grup " + (i + 1)), uyeler: Array.isArray(r.uyeler) ? r.uyeler.map(String) : [],
      enFazla: r.enFazla === null || r.enFazla === undefined || r.enFazla === "" ? null : sinir(Math.round(+r.enFazla) || 0, 0, 12),
      kesin: !!r.kesin, acik: r.acik !== false
    }));
    const ids = new Set(x.gruplar.map((r) => r.id));
    x.iliski = (Array.isArray(x.iliski) ? x.iliski : []).filter((r) => ids.has(r.a) && ids.has(r.b)).map((r) => ({
      a: r.a, b: r.b, tur: r.tur === "birlikte" ? "birlikte" : "ayri", kesin: !!r.kesin, acik: r.acik !== false
    }));
    return x;
  }

  function sonraKur(v, G, kural) {
    const s = Array.from({ length: G + 2 }, () => []);
    const bir = [];
    for (const r of kural.sonraBos) {
      if (!r.acik || !r.bos.length) continue;
      const gunler = [];
      for (let d = 1; d <= G; d++) if (haftaGunu(v, d) === r.gun) gunler.push(d);
      const ek = {};
      for (const d of gunler) {
        ek[d] = [];
        for (let o = 1; o <= 6; o++) if (r.bos.includes((r.gun + o) % 7)) ek[d].push(d + o);
      }
      if (r.kapsam === "bir") { bir.push({ gunler, ek, kesin: r.kesin, gun: r.gun }); continue; }
      for (const d of gunler) for (const e of ek[d]) s[d].push([e, r.kesin, r.gun]);
    }
    return { s, bir };
  }

  function birBak(r, gun) {
    let t = 0;
    for (const d of r.gunler) {
      if (!gun[d]) continue;
      t++;
      if (!r.ek[d].some((e) => gun[e])) return 0;
    }
    return t;
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
    const tp = [];
    const wd = [];
    const tipSay = [0, 0, 0, 0, 0, 0, 0];
    for (let d = 1; d <= G; d++) {
      grp[d] = grup(v, d);
      tp[d] = tip(v, d);
      wd[d] = haftaGunu(v, d);
      grupSay[grp[d]] += v.kisi;
      tipSay[tp[d]] += v.kisi;
    }
    const kural = kuralNorm(v.kural, v.kisiler);
    const ag = kural.odemeModu === "esit" ? [1, 1, 1, 1, 1] : AGIRLIK;
    const toplamOde = grupSay.reduce((a, c, q) => a + c * ag[q], 0);
    const tumIzin = v.kisiler.map((k) => {
      const s = new Set([...(k.izin || []), ...(k.istemiyor || [])]);
      for (let d = 1; d <= G; d++) if (!s.has(d)) return false;
      return true;
    });
    const nbE = v.kisiler.map((k, i) => (tumIzin[i] ? 0 : nb(k)));
    const sn = nbE.reduce((a, x) => a + x, 0) || 1;
    const nTaban = nbE.map((x) => (toplam * x) / sn);
    const pTaban = nbE.map((x) => (toplamOde * x) / sn);
    const gTaban = nbE.map((x) => grupSay.map((c) => (c * x) / sn));
    const dev = v.kisiler.map(() => ({ n: 0, p: 0, g: [0, 0, 0, 0, 0] }));
    const gec = gecmisKullan === false ? null : v.gecmis;
    if (gec) v.kisiler.forEach((k, i) => {
      const x = gec[k.ad];
      if (!x || tumIzin[i]) return;
      dev[i].n = +x.n || 0;
      dev[i].p = kural.odemeModu === "esit" ? +x.n || 0 : +x.p || 0;
      for (let q = 0; q < 5; q++) dev[i].g[q] = (x.g && +x.g[q]) || 0;
    });
    const hedef = nTaban.map((x, i) => (tumIzin[i] ? 0 : Math.max(0, x - dev[i].n)));
    const odeme = pTaban.map((x, i) => (tumIzin[i] ? 0 : Math.max(0, x - dev[i].p)));
    const beklenen = gTaban.map((a, i) => a.map((x, q) => (tumIzin[i] ? 0 : Math.max(0, x - dev[i].g[q]))));
    const tipBek = beklenen.map((b) => tipSay.map((c, t) => (t < 3 ? (grupSay[0] ? (b[0] * c) / grupSay[0] : 0) : b[t - 2])));
    const yok = v.kisiler.map((k, i) => {
      const s = new Set(k.izin || []);
      if (tumIzin[i]) for (let d = 1; d <= G; d++) s.add(d);
      return s;
    });
    const istemez = v.kisiler.map((k) => new Set(k.istemiyor || []));
    const ister = v.kisiler.map((k) => new Set(k.istiyor || []));
    const onceki = new Set(v.onceki || []);
    const zor = !!v.zorunlu;
    const carpan = v.kisiler.map((k) => (kural.istekDenge && v.istekCarpan && v.istekCarpan[k.ad] ? sinir(+v.istekCarpan[k.ad] || 1, 0.8, 1.2) : 1));
    const agIster = v.kisiler.map((k, i) => (carpan[i] * (zor ? 2000 : 120)) / Math.max(1, ister[i].size));
    const agIstemez = carpan.map((c) => c * (zor ? 1000 : 400));
    const adIdx = new Map(v.kisiler.map((k, i) => [k.ad, i]));
    const oz = v.kisiler.map(() => []);
    for (const r of v.ozel || []) {
      if (!r || r.acik === false) continue;
      const w = ((+r.gun % 7) + 7) % 7;
      const enAz = sinir(Math.round(+r.enAz) || 0, 0, 6);
      if (!enAz) continue;
      for (const ad of r.kisiler || []) if (adIdx.has(ad) && !tumIzin[adIdx.get(ad)]) oz[adIdx.get(ad)].push([w, enAz]);
    }
    const gAc = kural.gruplar.filter((r) => r.acik);
    const gi = new Map(gAc.map((r, i) => [r.id, i]));
    const uy = v.kisiler.map(() => []);
    gAc.forEach((r, i) => { for (const ad of r.uyeler) if (adIdx.has(ad)) uy[adIdx.get(ad)].push(i); });
    const yumusak = zor ? 300 : 150;
    const gLim = gAc.map((r) => r.enFazla);
    const gW = gAc.map((r) => (r.kesin ? ZOR : yumusak));
    const rel = kural.iliski.filter((r) => r.acik && gi.has(r.a) && gi.has(r.b)).map((r) => [gi.get(r.a), gi.get(r.b), r.tur, r.kesin ? ZOR : yumusak]);
    const gAcik = gAc.length > 0 && uy.some((x) => x.length) && (gLim.some((x) => x !== null) || rel.length > 0);
    const sk = sonraKur(v, G, kural);
    const pin = Array.from({ length: G + 1 }, () => new Map());
    for (const x of v.pin || []) {
      const d = +x[0], y = +x[1];
      if (d >= 1 && d <= G && y >= 0 && y < v.kisi && adIdx.has(x[2])) pin[d].set(y, adIdx.get(x[2]));
    }
    return {
      pin,
      kural, ag, sonra: sk.s, sonraBir: sk.bir, ard: kural.ardArda ? ZOR : 0, wP: kural.odemeModu === "esit" ? 0 : 2,
      n, G, toplam, toplamOde, hedef, odeme, beklenen, yok, istemez, ister, onceki, grp, dev, nTaban, pTaban, agIster, tp, tipBek, wd,
      tumIzin, carpan, oz, gruplar: gAc, uy, gLim, gW, rel, gAcik,
      agIstemez,
      perHs: zor ? 200 : 80,
      ozW: zor ? 500 : 100
    };
  }

  function gunSay(h, L) {
    const c = new Array(h.gruplar.length).fill(0);
    for (const p of L) for (const i of h.uy[p]) c[i]++;
    return c;
  }

  function gunCost(h, L, sert) {
    if (!h.gAcik) return 0;
    const c = gunSay(h, L);
    let t = 0;
    for (let i = 0; i < c.length; i++) if (h.gLim[i] !== null && c[i] > h.gLim[i]) t += (c[i] - h.gLim[i]) * h.gW[i];
    for (const [a, b, tur, w] of h.rel) {
      if (tur === "ayri") t += a === b ? ((c[a] * (c[a] - 1)) / 2) * w : c[a] * c[b] * w;
      else if (!sert && a !== b && (c[a] > 0) !== (c[b] > 0)) t += w;
    }
    return t;
  }

  function kisiMaliyet(v, h, p, gun) {
    const G = h.G;
    let say = 0;
    let pay = 0;
    let c = 0;
    const gs = [0, 0, 0, 0, 0];
    const ts = [0, 0, 0];
    const yok = h.yok[p];
    const istemez = h.istemez[p];
    const ister = h.ister[p];
    const oz = h.oz[p];
    const ws = oz.length ? [0, 0, 0, 0, 0, 0, 0] : null;
    if (h.onceki.has(p) && gun[1]) c += h.ard;
    for (let d = 1; d <= G; d++) {
      if (gun[d]) {
        say++;
        const q = h.grp[d];
        gs[q]++;
        if (h.tp[d] < 3) ts[h.tp[d]]++;
        pay += h.ag[q];
        if (yok.has(d)) c += ZOR;
        if (istemez.has(d)) c += h.agIstemez[p];
        if (ws) ws[h.wd[d]]++;
        if (gun[d + 1]) c += h.ard;
        if (gun[d + 2]) c += 3;
        for (const [e, kesin] of h.sonra[d]) if (gun[e]) c += kesin ? ZOR : h.perHs;
      } else if (ister.has(d)) c += h.agIster[p];
    }
    if (ws) for (const [w, enAz] of oz) if (ws[w] < enAz) c += h.ozW * (enAz - ws[w]);
    for (const r of h.sonraBir) if (birBak(r, gun)) c += r.kesin ? ZOR : h.perHs;
    c += 6 * (say - h.hedef[p]) ** 2;
    c += h.wP * (pay - h.odeme[p]) ** 2;
    for (let q = 0; q < 5; q++) c += GW[q] * (gs[q] - h.beklenen[p][q]) ** 2;
    for (let t = 0; t < 3; t++) c += (ts[t] - h.tipBek[p][t]) ** 2;
    return c;
  }

  function gunMaliyet(h, a) {
    if (!h.gAcik) return 0;
    let c = 0;
    for (let d = 1; d <= h.G; d++) c += gunCost(h, a[d]);
    return c;
  }

  function maliyet(v, h, a) {
    const gun = Array.from({ length: h.n }, () => new Array(h.G + 8).fill(false));
    for (let d = 1; d <= h.G; d++) for (const p of a[d]) gun[p][d] = true;
    let c = 0;
    for (let p = 0; p < h.n; p++) c += kisiMaliyet(v, h, p, gun[p]);
    const sp = sayPay(h, a);
    return c + gunMaliyet(h, a) + monoToplam(sp.sA, sp.pA);
  }

  function secenek(v, tohum, itSay) {
    const h = hazirla(v);
    const R = rng(tohum || 1);
    const { n, G } = h;
    const a = [null];
    const say = new Array(n).fill(0);
    const son = new Array(n).fill(-9);
    for (const p of h.onceki) son[p] = 0;
    const blok = Array.from({ length: n }, () => ({}));
    const wsay = Array.from({ length: n }, () => [0, 0, 0, 0, 0, 0, 0]);
    for (let d = 1; d <= G; d++) {
      const aday = [];
      for (let p = 0; p < n; p++) {
        if (h.yok[p].has(d) || (h.ard && son[p] === d - 1)) continue;
        let s = (say[p] - h.hedef[p] * (d / G)) * 4 + R() * 6;
        if (h.istemez[p].has(d)) s += v.zorunlu ? 5000 : 50;
        if (h.ister[p].has(d)) s -= (v.zorunlu ? 5000 : 60) / Math.max(1, h.ister[p].size);
        if (d - son[p] === 2) s += 2;
        if (blok[p][d]) s += blok[p][d];
        for (const [w, enAz] of h.oz[p]) if (w === h.wd[d] && wsay[p][w] < enAz) s -= 40;
        aday.push([s, p]);
      }
      aday.sort((x, y) => x[0] - y[0]);
      let sec;
      if (h.gAcik) {
        sec = [];
        const ertele = [];
        let cs = 0;
        for (const [, p] of aday) {
          if (sec.length >= v.kisi) break;
          if (h.uy[p].length) {
            const c2 = gunCost(h, sec.concat(p), true);
            if (c2 > cs) { ertele.push([c2 - cs, p]); continue; }
          }
          sec.push(p);
        }
        ertele.sort((x, y) => x[0] - y[0]);
        while (sec.length < v.kisi && ertele.length) sec.push(ertele.shift()[1]);
      } else sec = aday.slice(0, v.kisi).map((x) => x[1]);
      if (h.pin[d].size) {
        const sabit = new Set(h.pin[d].values());
        const kalan = sec.filter((p) => !sabit.has(p)).concat(aday.map((x) => x[1]).filter((p) => !sabit.has(p) && !sec.includes(p)));
        const yeni = [];
        for (let y = 0; y < v.kisi; y++) yeni[y] = h.pin[d].has(y) ? h.pin[d].get(y) : kalan.shift();
        sec = yeni.filter((p) => p !== undefined);
      }
      a[d] = sec;
      for (const p of sec) {
        say[p]++;
        son[p] = d;
        wsay[p][h.wd[d]]++;
        for (const [e, kesin] of h.sonra[d]) blok[p][e] = (blok[p][e] || 0) + (kesin ? 5000 : 30);
      }
    }
    const gun = Array.from({ length: n }, () => new Array(G + 8).fill(false));
    for (let d = 1; d <= G; d++) for (const p of a[d]) gun[p][d] = true;
    const kc = [];
    for (let p = 0; p < n; p++) kc[p] = kisiMaliyet(v, h, p, gun[p]);
    const gc = [0];
    for (let d = 1; d <= G; d++) gc[d] = gunCost(h, a[d]);
    const { sA, pA } = sayPay(h, a);
    let c = kc.reduce((x, y) => x + y, 0) + gc.reduce((x, y) => x + y, 0) + monoToplam(sA, pA);
    let it = 0;
    const yeniGc = (d, yer, p) => {
      if (!h.gAcik) return 0;
      const L = a[d].slice();
      L[yer] = p;
      return gunCost(h, L);
    };

    function adim(sayi) {
      const bit = Math.min(itSay, it + sayi);
      for (; it < bit; it++) {
        const d = 1 + Math.floor(R() * G);
        const yer = Math.floor(R() * a[d].length);
        const eski = a[d][yer];
        if (h.pin[d].has(yer)) continue;
        if (R() < 0.5) {
          const yeni = Math.floor(R() * n);
          if (gun[yeni][d]) continue;
          gun[eski][d] = false;
          gun[yeni][d] = true;
          const e1 = kisiMaliyet(v, h, eski, gun[eski]);
          const e2 = kisiMaliyet(v, h, yeni, gun[yeni]);
          const g1 = yeniGc(d, yer, yeni);
          const w = h.ag[h.grp[d]];
          const m0 = monoIki(sA, pA, eski, yeni);
          sA[eski]--; pA[eski] -= w; sA[yeni]++; pA[yeni] += w;
          const m1 = monoIki(sA, pA, eski, yeni);
          const fark = e1 + e2 - kc[eski] - kc[yeni] + g1 - gc[d] + m1 - m0;
          if (fark > 0) { sA[eski]++; pA[eski] += w; sA[yeni]--; pA[yeni] -= w; }
          if (fark <= 0) {
            a[d][yer] = yeni;
            gc[d] = g1;
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
          if (h.pin[d2].has(y2)) continue;
          if (gun[o2][d] || gun[eski][d2]) continue;
          gun[eski][d] = false;
          gun[eski][d2] = true;
          gun[o2][d2] = false;
          gun[o2][d] = true;
          const e1 = kisiMaliyet(v, h, eski, gun[eski]);
          const e2 = kisiMaliyet(v, h, o2, gun[o2]);
          const g1 = yeniGc(d, yer, o2);
          const g2 = yeniGc(d2, y2, eski);
          const wf = h.ag[h.grp[d2]] - h.ag[h.grp[d]];
          let m0 = 0;
          let m1 = 0;
          if (wf) { m0 = monoIki(sA, pA, eski, o2); pA[eski] += wf; pA[o2] -= wf; m1 = monoIki(sA, pA, eski, o2); }
          const fark = e1 + e2 - kc[eski] - kc[o2] + g1 - gc[d] + g2 - gc[d2] + m1 - m0;
          if (fark > 0 && wf) { pA[eski] -= wf; pA[o2] += wf; }
          if (fark <= 0) {
            a[d][yer] = o2;
            gc[d] = g1;
            gc[d2] = g2;
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
    const gun = Array.from({ length: h.n }, () => new Array(G + 8).fill(false));
    for (let d = 1; d <= G; d++) {
      const set = new Set(a[d]);
      if (set.size !== a[d].length) sorun.push(d + ". gün: aynı kişi iki kez yazılmış");
      if (a[d].length !== v.kisi) sorun.push(d + ". gün: " + a[d].length + " kişi (hedef " + v.kisi + ")");
      for (const p of a[d]) {
        say[p]++;
        gun[p][d] = true;
        if (h.tumIzin[p]) sorun.push(d + ". gün: " + v.kisiler[p].ad + " bütün ay izinli");
        else if (h.yok[p].has(d)) sorun.push(d + ". gün: " + v.kisiler[p].ad + " izinli");
        else if (h.istemez[p].has(d)) sorun.push(d + ". gün: " + v.kisiler[p].ad + " istemediği güne yazılmış");
      }
    }
    for (let p = 0; p < h.n; p++) {
      if (h.ard && h.onceki.has(p) && gun[p][1]) sorun.push(v.kisiler[p].ad + ": önceki ayın son günü ile 1. gün arka arkaya");
      if (h.ard) for (let d = 1; d < G; d++) if (gun[p][d] && gun[p][d + 1]) sorun.push(v.kisiler[p].ad + ": " + d + "-" + (d + 1) + " arka arkaya");
      for (let d = 1; d <= G; d++) if (gun[p][d]) for (const [e, , wg] of h.sonra[d]) if (gun[p][e]) sorun.push(v.kisiler[p].ad + ": " + d + ". gün " + GUN[wg].toLocaleLowerCase("tr") + " nöbetinden sonra " + e + ". gün " + GUN[haftaGunu(v, e)].toLocaleLowerCase("tr") + " de yazılmış (kural)");
      for (const r of h.sonraBir) if (birBak(r, gun[p])) sorun.push(v.kisiler[p].ad + ": tuttuğu " + GUN[r.gun].toLocaleLowerCase("tr") + " nöbetlerinin hiçbirinin ardından boş günler bırakılmadı (kural)");
      if (h.oz[p].length) {
        const ws = [0, 0, 0, 0, 0, 0, 0];
        for (let d = 1; d <= G; d++) if (gun[p][d]) ws[h.wd[d]]++;
        for (const [w, enAz] of h.oz[p]) if (ws[w] < enAz) sorun.push(v.kisiler[p].ad + ": özel talep en az " + enAz + " " + GUN[w].toLocaleLowerCase("tr") + ", verilen " + ws[w]);
      }
      const ist = new Set(v.kisiler[p].istiyor);
      for (const d of ist) {
        if (gun[p][d]) continue;
        const ad = v.kisiler[p].ad;
        if (h.yok[p].has(d)) sorun.push(ad + ": " + d + ". gün izinli, istek verilemez");
        else if (h.ard && (ist.has(d - 1) || ist.has(d + 1))) sorun.push(ad + ": " + d + ". gün istediği halde yazılmadı, yanındaki gün de istek ve art arda nöbet olmaz, ikisi birden verilemez");
        else sorun.push(ad + ": " + d + ". gün istediği halde yazılmadı");
      }
    }
    const sp = sayPay(h, a);
    for (let p = 0; p < h.n; p++) for (let q = 0; q < h.n; q++) {
      if (sp.sA[p] > sp.sA[q] && sp.pA[p] <= sp.pA[q]) sorun.push("Ücret: " + v.kisiler[p].ad + " " + sp.sA[p] + " nöbet / " + sp.pA[p] + " puan, " + v.kisiler[q].ad + " " + sp.sA[q] + " nöbet / " + sp.pA[q] + " puan; fazla nöbet tutan daha fazla puan almalı");
    }
    for (let d = 1; d <= G; d++) {
      let ister = 0;
      for (let p = 0; p < h.n; p++) if (h.ister[p].has(d)) ister++;
      if (ister > v.kisi) sorun.push(d + ". gün: " + ister + " kişi istiyor, günlük kontenjan " + v.kisi + ", hepsi verilemez");
      if (h.gAcik) {
        const c = gunSay(h, a[d]);
        const uyeAd = (i) => a[d].filter((p) => h.uy[p].includes(i)).map((p) => v.kisiler[p].ad).join(", ");
        h.gruplar.forEach((r, i) => {
          if (h.gLim[i] !== null && c[i] > h.gLim[i]) sorun.push(d + ". gün: " + r.ad + " grubundan " + c[i] + " kişi (" + uyeAd(i) + "), en fazla " + h.gLim[i] + " olmalı");
        });
        for (const [x, y, tur] of h.rel) {
          if (tur === "ayri" && (x === y ? c[x] > 1 : c[x] && c[y])) sorun.push(d + ". gün: " + h.gruplar[x].ad + (x === y ? " üyeleri" : " ile " + h.gruplar[y].ad) + " aynı gün olmamalı");
          if (tur === "birlikte" && x !== y && (c[x] > 0) !== (c[y] > 0)) sorun.push(d + ". gün: " + h.gruplar[x].ad + " ile " + h.gruplar[y].ad + " birlikte olmalı");
        }
      }
    }
    return { say, sorun };
  }

  function analiz(v, a) {
    const h = hazirla(v);
    const G = h.G;
    const gun = Array.from({ length: h.n }, () => new Array(G + 8).fill(false));
    for (let d = 1; d <= G; d++) for (const p of a[d]) gun[p][d] = true;
    return v.kisiler.map((k, p) => {
      const gs = [0, 0, 0, 0, 0];
      const ts = [0, 0, 0, 0, 0, 0, 0];
      const hg = [0, 0, 0, 0, 0, 0, 0];
      let say = 0;
      let pay = 0;
      let ardArda = 0;
      let perHs = 0;
      for (let d = 1; d <= G; d++) {
        if (!gun[p][d]) continue;
        say++;
        gs[h.grp[d]]++;
        ts[h.tp[d]]++;
        hg[(h.wd[d] + 6) % 7]++;
        pay += h.ag[h.grp[d]];
        if (gun[p][d + 1]) ardArda++;
        for (const [e] of h.sonra[d]) if (gun[p][e]) perHs++;
      }
      for (const r of h.sonraBir) if (birBak(r, gun[p])) perHs++;
      const ist = [...h.ister[p]];
      const verilen = ist.filter((d) => gun[p][d]).length;
      const istemez = [...h.istemez[p]];
      const ihlal = istemez.filter((d) => gun[p][d]).length;
      const gec = (v.gecmis && v.gecmis[k.ad]) || null;
      return {
        ad: k.ad, nobet: say, nobetHedef: h.hedef[p], nobetAsil: nb(k),
        odeme: pay, odemeHedef: h.odeme[p], odemeAsil: od(k),
        grup: gs, grupBeklenen: h.beklenen[p], tip: ts, tipBeklenen: h.tipBek[p], hg, tumIzin: h.tumIzin[p],
        gruplar: h.uy[p].map((i) => h.gruplar[i].ad),
        istek: ist.length, istekVerilen: verilen,
        istemez: istemez.length, istemezIhlal: ihlal,
        izin: (k.izin || []).length, ardArda, perHs,
        gecmis: gec, fark: { n: -h.dev[p].n, p: -h.dev[p].p }
      };
    });
  }

  function gunTablo(h, a) {
    const gun = Array.from({ length: h.n }, () => new Array(h.G + 8).fill(false));
    for (let d = 1; d <= h.G; d++) for (const p of a[d]) gun[p][d] = true;
    return gun;
  }

  function kisiSorun(h, p, gun) {
    let kural = 0;
    let istek = 0;
    if (h.ard && h.onceki.has(p) && gun[1]) kural++;
    for (let d = 1; d <= h.G; d++) {
      if (gun[d]) {
        if (h.yok[p].has(d)) kural++;
        if (h.ard && gun[d + 1] && d + 1 <= h.G) kural++;
        for (const [e] of h.sonra[d]) if (gun[e]) kural++;
        if (h.istemez[p].has(d)) istek++;
      } else if (h.ister[p].has(d)) istek++;
    }
    for (const r of h.sonraBir) if (birBak(r, gun)) kural++;
    if (h.oz[p].length) {
      const ws = [0, 0, 0, 0, 0, 0, 0];
      for (let d = 1; d <= h.G; d++) if (gun[d]) ws[h.wd[d]]++;
      for (const [w, enAz] of h.oz[p]) if (ws[w] < enAz) istek += enAz - ws[w];
    }
    return { kural, istek };
  }

  function monoKisi(sA, pA, x) {
    let c = 0;
    for (let q = 0; q < sA.length; q++) if (q !== x && monoCift(sA[x], pA[x], sA[q], pA[q])) c++;
    return c;
  }

  function degisimRenk(h, a, gun, sp, degis) {
    const kisiler = [...new Set(degis.map((x) => x[0]))];
    const once = kisiler.map((p) => kisiSorun(h, p, gun[p]));
    const mOnce = kisiler.reduce((t, p) => t + monoKisi(sp.sA, sp.pA, p), 0);
    const gunler = [...new Set(degis.map((x) => x[1]))];
    const gOnce = gunler.map((d) => gunCost(h, a[d], true));
    for (const [p, d, var_] of degis) { gun[p][d] = var_; sp.sA[p] += var_ ? 1 : -1; sp.pA[p] += (var_ ? 1 : -1) * h.ag[h.grp[d]]; }
    const sonra = kisiler.map((p) => kisiSorun(h, p, gun[p]));
    const mSonra = kisiler.reduce((t, p) => t + monoKisi(sp.sA, sp.pA, p), 0);
    const yeniA = gunler.map((d) => a[d].filter((p) => !degis.some((x) => x[0] === p && x[1] === d && !x[2])).concat(degis.filter((x) => x[1] === d && x[2]).map((x) => x[0])));
    const gSonra = yeniA.map((L) => gunCost(h, L, true));
    for (const [p, d, var_] of degis) { gun[p][d] = !var_; sp.sA[p] -= var_ ? 1 : -1; sp.pA[p] -= (var_ ? 1 : -1) * h.ag[h.grp[d]]; }
    const neden = [];
    kisiler.forEach((p, i) => { if (sonra[i].kural > once[i].kural) neden.push(["kural", p]); });
    if (mSonra > mOnce) neden.push(["ucret", -1]);
    if (gSonra.some((c, i) => c > gOnce[i])) neden.push(["grup", -1]);
    const istekBoz = kisiler.filter((p, i) => sonra[i].istek > once[i].istek);
    istekBoz.forEach((p) => neden.push(["istek", p]));
    const sert = neden.some((x) => x[0] === "kural" || x[0] === "grup");
    const renk = sert ? "kirmizi" : istekBoz.length >= 2 || neden.some((x) => x[0] === "ucret") ? "turuncu" : istekBoz.length === 1 ? "sari" : "yesil";
    return { renk, neden, engel: false, sert };
  }

  function takasAnaliz(v, a, d, yer) {
    const h = hazirla(v);
    const gun = gunTablo(h, a);
    const sp = sayPay(h, a);
    const p = a[d][yer];
    const sonuc = [];
    for (let d2 = 1; d2 <= h.G; d2++) {
      if (d2 === d) continue;
      a[d2].forEach((q, y2) => {
        if (q === p) return;
        if (h.pin[d2].has(y2) || h.pin[d].has(yer)) { sonuc.push({ d: d2, y: y2, renk: "kirmizi", neden: [["pin", -1]], engel: true }); return; }
        if (gun[p][d2] || gun[q][d]) { sonuc.push({ d: d2, y: y2, renk: "kirmizi", neden: [["ayni", -1]], engel: true }); return; }
        const r = degisimRenk(h, a, gun, sp, [[p, d, false], [p, d2, true], [q, d2, false], [q, d, true]]);
        sonuc.push(Object.assign({ d: d2, y: y2 }, r));
      });
    }
    return sonuc;
  }

  function takasYap(a, d, yer, d2, y2) {
    const b = a.map((x) => (x ? x.slice() : x));
    const t = b[d][yer];
    b[d][yer] = b[d2][y2];
    b[d2][y2] = t;
    return b;
  }

  function verAnaliz(v, a, p, w) {
    const h = hazirla(v);
    const gun = gunTablo(h, a);
    const sp = sayPay(h, a);
    const sira = { yesil: 0, sari: 1, turuncu: 2, kirmizi: 3 };
    const sonuc = [];
    for (let q = 0; q < h.n; q++) {
      if (q === p) continue;
      let en = null;
      for (let d = 1; d <= h.G; d++) {
        if (h.wd[d] !== w || !gun[p][d] || gun[q][d]) continue;
        const yer = a[d].indexOf(p);
        const r = h.pin[d].has(yer) ? { renk: "kirmizi", neden: [["pin", -1]], engel: true } : degisimRenk(h, a, gun, sp, [[p, d, false], [q, d, true]]);
        if (!en || sira[r.renk] < sira[en.renk]) en = Object.assign({ q, d, y: yer }, r);
      }
      if (en) sonuc.push(en);
    }
    return sonuc;
  }

  function verYap(a, d, yer, q) {
    const b = a.map((x) => (x ? x.slice() : x));
    b[d][yer] = q;
    return b;
  }

  const M = { takasAnaliz, takasYap, verAnaliz, verYap, KURAL, kuralNorm, gunCost, TIP_AD, tip, AGIRLIK, GRUP_AD, analiz, GUN, KISA, gunSayisi, haftaGunu, grup, kur, kurAsenkron, rapor, maliyet, hazirla };
  if (typeof module !== "undefined") module.exports = M;
  else g.MOTOR = M;
})(typeof window !== "undefined" ? window : globalThis);
