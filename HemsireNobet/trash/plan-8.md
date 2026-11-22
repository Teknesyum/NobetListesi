# Plan — 1.9 (İki Çetele, Para Önde, Yumuşak Denkleştirme)

Sıra benim seçimim. Kullanıcı ikinci kez "başla" deyince uygulanır.

## 1. 1.8.3 — Hata (küçük, önce)
- "4 nöbet" yazılan kişiye 5 yazılıyor. Neden: geçmiş eksiği hedefe ekleniyor (`hazirla`, `hedef = x − dev`). Elle sayı verilen kişide sayı kesin; geçmiş yalnız puan dağılımını etkiler, sayıyı aşmaz.

## 2. 1.9.0 — Motor
1. **Yumuşak denkleştirme.** Geçmiş farkı bir ayda tümüyle kapanmıyor. Ayda en çok 1 nöbet (ve onun puanı) kadar düzeltilir: −100 → −90 → −80 gibi ay ay toparlanır.
2. **İzinli ay telafisi.** Bütün ay izinli olan kişi, o ay için çetelede ortalama nöbet ve puanı almış sayılır; dönüşte aşırı beslenmez. Genel Çetele'de yönetici her kişinin bu değerini (ay ay) elle değiştirebilir.
3. **Gün adaleti.** Pazar (ve her gün türü) kişiler arasında en çok 1 farkla dağıtılmaya çalışılır. Olmadıysa nedeni üretilir (izin, istek, art arda kuralı, grup kuralı, kota).
4. **Özel talep: Cuma + Pazar paketi.** Özel Talepler'de gün listesine "Cuma + Pazar" eklenir; seçilen kişiye en az N paket (N cuma ve N pazar) verilir.

## 3. 1.9.0 — Arayüz
1. **İki çetele.** Liste ekranının sağı ikiye bölünür: üstte Bu Ay, altta Genel (önceki aylar + bu ay). Bu Ay / Genel düğmeleri kalkar.
2. **NÖBET sütunu.** "13/13" yerine tek değer: tutulan nöbet (beyaz). Yanında para puanı ayrı sütun, mavi. Beklenen nöbet sayısı yalnız ipucunda.
3. **Sorunlar.** Sonraki aya kalan ±1 farklar sorun sayılmaz; yeşil bilgi notu olur. Nöbet sayısındaki küçük farklar sorun listesinden çıkar; ölçüt paradır. Geçmişte fazla tutanın bu ay 1 eksik alması olumlu not olarak yazılır.
4. **Sağ Ctrl ile neden.** Çetelede bir gün sütununun (ör. PAZAR) ya da hücrenin üstünde sağ Ctrl basılınca o dağılımın nedeni gösterilir (3.3'teki gerekçe).

## Kontrol
Harness: 4 nöbetlik kişi 4 alıyor; −10 geçmişli kişi bu ay en çok +1; tam izinli ayın çetele değeri ortalama; pazar farkı ≤1 ya da gerekçeli; Cuma+Pazar paketi veriliyor; iki çetele yatay kaydırmasız; `yardimEksik` boş; UI taraması 0.

## Bedel
Dokunulacak: `motor.js`, `uygulama.js`, `app.css`, `arayuz.html`, harness. Tahmin ~1,5–2,5 saat model çalışması, ~2–3 M token (çoğu önbellek). En pahalı kalem motor (2.1–2.3), çünkü her değişiklik ölçümle doğrulanmalı.
