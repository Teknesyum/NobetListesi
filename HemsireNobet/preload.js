const { contextBridge, ipcRenderer } = require("electron");

const dosyaAdi = k => String(k).replace(/[^A-Za-z0-9:_-]/g, "_").replace(/:/g, "@");
let onbellek = {};
const hazir = ipcRenderer.invoke("veri:hepsi").then(o => { onbellek = o || {}; });

contextBridge.exposeInMainWorld("pencere", {
  etiket: () => ipcRenderer.invoke("etiket:hepsi"),
  kucult: () => ipcRenderer.send("pencere:kucult"),
  buyult: () => ipcRenderer.send("pencere:buyult"),
  kapat: () => ipcRenderer.send("pencere:kapat"),
  ac: u => ipcRenderer.send("pencere:ac", u),
  yazdir: () => ipcRenderer.invoke("pencere:yazdir"),
  dosyaYaz: (ad, metin, tur) => ipcRenderer.invoke("pencere:dosyaYaz", { ad, metin, tur }),
  guncelle: {
    surum: () => ipcRenderer.invoke("guncelle:surum"),
    denetle: () => ipcRenderer.invoke("guncelle:denetle"),
    uygula: () => ipcRenderer.invoke("guncelle:uygula"),
    ilerle: cb => ipcRenderer.on("guncelle:ilerle", (e, d) => cb(d))
  },
  durum: cb => ipcRenderer.on("pencere:durum", (e, buyuk) => cb(buyuk)),
  veri: {
    hazir: () => hazir,
    oku: k => (dosyaAdi(k) in onbellek ? onbellek[dosyaAdi(k)] : null),
    yaz: (k, m) => { onbellek[dosyaAdi(k)] = m; ipcRenderer.send("veri:yaz", { k, m }); }
  }
});
