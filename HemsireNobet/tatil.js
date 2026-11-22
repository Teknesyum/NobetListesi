(function (g) {
  const R = Math.PI / 180;
  const S = (x) => Math.sin(x * R);

  function yeniAy(k) {
    const T = k / 1236.85;
    let J = 2451550.09766 + 29.530588861 * k + 0.00015437 * T * T - 0.00000015 * T ** 3 + 0.00000000073 * T ** 4;
    const E = 1 - 0.002516 * T - 0.0000074 * T * T;
    const M = 2.5534 + 29.1053567 * k - 0.0000014 * T * T - 0.00000011 * T ** 3;
    const Mp = 201.5643 + 385.81693528 * k + 0.0107582 * T * T + 0.00001238 * T ** 3 - 0.000000058 * T ** 4;
    const F = 160.7108 + 390.67050284 * k - 0.0016118 * T * T - 0.00000227 * T ** 3 + 0.000000011 * T ** 4;
    const O = 124.7746 - 1.56375588 * k + 0.0020672 * T * T + 0.00000215 * T ** 3;
    J += -0.4072 * S(Mp) + 0.17241 * E * S(M) + 0.01608 * S(2 * Mp) + 0.01039 * S(2 * F)
      + 0.00739 * E * S(Mp - M) - 0.00514 * E * S(Mp + M) + 0.00208 * E * E * S(2 * M)
      - 0.00111 * S(Mp - 2 * F) - 0.00057 * S(Mp + 2 * F) + 0.00056 * E * S(2 * Mp + M)
      - 0.00042 * S(3 * Mp) + 0.00042 * E * S(M + 2 * F) + 0.00038 * E * S(M - 2 * F)
      - 0.00024 * E * S(2 * Mp - M) - 0.00017 * S(O) - 0.00007 * S(Mp + 2 * M)
      + 0.00004 * S(2 * Mp - 2 * F) + 0.00004 * S(3 * M) + 0.00003 * S(Mp + M - 2 * F)
      + 0.00003 * S(2 * Mp + 2 * F) - 0.00003 * S(Mp + M + 2 * F) + 0.00003 * S(Mp - M + 2 * F)
      - 0.00002 * S(Mp - M - 2 * F) - 0.00002 * S(3 * Mp + M) + 0.00002 * S(4 * Mp);
    const y = 2000 + k / 12.3685;
    const dT = (62.92 + 0.32217 * (y - 2000) + 0.005589 * (y - 2000) ** 2) / 86400;
    return (J - dT - 2440587.5) * 86400000;
  }

  function ayBasi(k) {
    const t = new Date(yeniAy(k));
    const ek = t.getUTCHours() < 15 ? 1 : 2;
    return Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate() + ek);
  }

  const SABIT = [
    [1, 1, "Yılbaşı", true], [4, 23, "Ulusal Egemenlik ve Çocuk Bayramı", true], [5, 1, "Emek ve Dayanışma Günü", true],
    [5, 19, "Atatürk'ü Anma, Gençlik ve Spor Bayramı", true], [7, 15, "Demokrasi ve Milli Birlik Günü", true],
    [8, 30, "Zafer Bayramı", true], [10, 28, "Cumhuriyet Bayramı Arifesi", false], [10, 29, "Cumhuriyet Bayramı", true],
    [12, 31, "Yılbaşı Gecesi", false]
  ];

  const onbellek = {};

  function yil(y) {
    if (onbellek[y]) return onbellek[y];
    const t = {};
    const ekle = (ms, ad, tam) => {
      const d = new Date(ms);
      if (d.getUTCFullYear() !== y) return;
      const a = d.getUTCMonth() + 1;
      const gun = d.getUTCDate();
      (t[a] = t[a] || {});
      const eski = t[a][gun];
      if (eski && eski.tam && !tam) return;
      t[a][gun] = { ad, tam };
    };
    for (const [a, gun, ad, tam] of SABIT) ekle(Date.UTC(y, a - 1, gun), ad, tam);
    const k0 = Math.floor((y - 2000) * 12.3685) - 2;
    const GN = 86400000;
    for (let k = k0; k <= k0 + 16; k++) {
      const m = (((k % 12) + 12) % 12);
      if (m === 0) {
        const b = ayBasi(k);
        ekle(b - GN, "Ramazan Bayramı Arifesi", false);
        for (let i = 0; i < 3; i++) ekle(b + i * GN, "Ramazan Bayramı " + (i + 1) + ". Gün", true);
      } else if (m === 2) {
        const b = ayBasi(k) + 9 * GN;
        ekle(b - GN, "Kurban Bayramı Arifesi", false);
        for (let i = 0; i < 4; i++) ekle(b + i * GN, "Kurban Bayramı " + (i + 1) + ". Gün", true);
      }
    }
    return (onbellek[y] = t);
  }

  function ay(y, a) {
    return yil(y)[a] || {};
  }

  function tamGunler(y, a) {
    const t = ay(y, a);
    return Object.keys(t).filter((d) => t[d].tam).map(Number).sort((x, z) => x - z);
  }

  const T = { ay, yil, tamGunler, yeniAy };
  if (typeof module !== "undefined") module.exports = T;
  else g.TATIL = T;
})(typeof window !== "undefined" ? window : globalThis);
