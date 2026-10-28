(function (g) {
  const V = {
    yil: 2026,
    ay: 11,
    kisi: 5,
    tatil: [],
    kisiler: [
      { ad: "Hemşire 01", nobet: 6, odeme: 10, izin: [], istemiyor: [], istiyor: [] },
      { ad: "Hemşire 02", nobet: 6, odeme: 10, izin: [], istemiyor: [1, 2, 3, 4, 5, 6, 7, 21, 22], istiyor: [] },
      { ad: "Hemşire 03", nobet: 6, odeme: 9, izin: [], istemiyor: [20, 21, 22], istiyor: [] },
      { ad: "Hemşire 04", nobet: 6, odeme: 9, izin: [16, 17, 18, 19, 20], istemiyor: [], istiyor: [12, 24] },
      { ad: "Hemşire 05", nobet: 7, odeme: 11, izin: [], istemiyor: [17], istiyor: [] },
      { ad: "Hemşire 06", nobet: 7, odeme: 11, izin: [], istemiyor: [], istiyor: [] },
      { ad: "Hemşire 07", nobet: 5, odeme: 8, izin: [], istemiyor: [7, 8, 21], istiyor: [] },
      { ad: "Hemşire 08", nobet: 6, odeme: 9, izin: [], istemiyor: [3, 8, 18, 21], istiyor: [] },
      { ad: "Hemşire 09", nobet: 4, odeme: 7, izin: [], istemiyor: [], istiyor: [] },
      { ad: "Hemşire 10", nobet: 7, odeme: 11, izin: [], istemiyor: [], istiyor: [] },
      { ad: "Hemşire 11", nobet: 6, odeme: 10, izin: [], istemiyor: [], istiyor: [] },
      { ad: "Hemşire 12", nobet: 6, odeme: 9, izin: [], istemiyor: [6], istiyor: [] },
      { ad: "Hemşire 13", nobet: 6, odeme: 9, izin: [], istemiyor: [], istiyor: [] },
      { ad: "Hemşire 14", nobet: 6, odeme: 9, izin: [], istemiyor: [], istiyor: [] },
      { ad: "Hemşire 15", nobet: 6, odeme: 9, izin: [], istemiyor: [], istiyor: [] },
      { ad: "Hemşire 16", nobet: 6, odeme: 9, izin: [15, 16, 17], istemiyor: [], istiyor: [12] },
      { ad: "Hemşire 17", nobet: 6, odeme: 10, izin: [], istemiyor: [], istiyor: [] },
      { ad: "Hemşire 18", nobet: 6, odeme: 9, izin: [], istemiyor: [], istiyor: [16] },
      { ad: "Hemşire 19", nobet: 6, odeme: 9, izin: [], istemiyor: [], istiyor: [] },
      { ad: "Hemşire 20", nobet: 6, odeme: 10, izin: [], istemiyor: [7, 8, 12, 14, 15, 21, 22], istiyor: [] }
    ]
  };
  if (typeof module !== "undefined") module.exports = V;
  else g.VERI = V;
})(typeof window !== "undefined" ? window : globalThis);
