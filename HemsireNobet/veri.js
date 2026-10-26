(function (g) {
  const V = {
    yil: 2026,
    ay: 11,
    kisi: 5,
    tatil: [],
    kisiler: [
      { ad: "Hemşire 01", min: 6, max: 10, izin: [], istemiyor: [], istiyor: [] },
      { ad: "Hemşire 02", min: 6, max: 10, izin: [], istemiyor: [1, 2, 3, 4, 5, 6, 7, 21, 22], istiyor: [] },
      { ad: "Hemşire 03", min: 6, max: 9, izin: [], istemiyor: [20, 21, 22], istiyor: [] },
      { ad: "Hemşire 04", min: 6, max: 9, izin: [16, 17, 18, 19, 20], istemiyor: [], istiyor: [12, 24] },
      { ad: "Hemşire 05", min: 7, max: 11, izin: [], istemiyor: [17], istiyor: [] },
      { ad: "Hemşire 06", min: 7, max: 11, izin: [], istemiyor: [], istiyor: [] },
      { ad: "Hemşire 07", min: 5, max: 8, izin: [], istemiyor: [7, 8, 21], istiyor: [] },
      { ad: "Hemşire 08", min: 6, max: 9, izin: [], istemiyor: [3, 8, 18, 21], istiyor: [] },
      { ad: "Hemşire 09", min: 4, max: 7, izin: [], istemiyor: [], istiyor: [] },
      { ad: "Hemşire 10", min: 7, max: 11, izin: [], istemiyor: [], istiyor: [] },
      { ad: "Hemşire 11", min: 6, max: 10, izin: [], istemiyor: [], istiyor: [] },
      { ad: "Hemşire 12", min: 6, max: 9, izin: [], istemiyor: [6], istiyor: [] },
      { ad: "Hemşire 13", min: 6, max: 9, izin: [], istemiyor: [], istiyor: [] },
      { ad: "Hemşire 14", min: 6, max: 9, izin: [], istemiyor: [], istiyor: [] },
      { ad: "Hemşire 15", min: 6, max: 9, izin: [], istemiyor: [], istiyor: [] },
      { ad: "Hemşire 16", min: 6, max: 9, izin: [15, 16, 17], istemiyor: [], istiyor: [12] },
      { ad: "Hemşire 17", min: 6, max: 10, izin: [], istemiyor: [], istiyor: [] },
      { ad: "Hemşire 18", min: 6, max: 9, izin: [], istemiyor: [], istiyor: [16] },
      { ad: "Hemşire 19", min: 6, max: 9, izin: [], istemiyor: [], istiyor: [] },
      { ad: "Hemşire 20", min: 6, max: 10, izin: [], istemiyor: [21, 22], istiyor: [7, 8, 12, 14, 15] }
    ]
  };
  if (typeof module !== "undefined") module.exports = V;
  else g.VERI = V;
})(typeof window !== "undefined" ? window : globalThis);
