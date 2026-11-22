# Plan — 1.8 (Çetele Bağlı Liste, Para Eşitliği, Baskı)

Sıra benim seçimim. Kullanıcı ikinci kez "başla" deyince uygulanır. Katalog (NobetListesi, SlaytEdit, kuran-analiz) bu işten sonra.

## 1. 1.7.4 — Hata ve renk (küçük, önce)
- Çetelede kişi adına ya da gün başlığına tıklayınca vurgu çalışmıyor → onar.
- Takas renkleri: "Ücret sırası bozulur" uyarısı her taşımayı kırmızı yapıyor. Kırmızı yalnız sert kural (art arda, izinli gün, kesin grup) bozulunca. Ücret sırası turuncuya iner. Hepsi yazı rengi, dolgu yok.
- Çeteleden sürükle-bırak: bırakmayı engellemek yerine izin ver.
  - Sürüklerken farenin altındaki sayı +1, kaynaktaki −1 önizlenir.
  - Sorun varsa önizleme sırasında yazılır.
  - Bırakılırsa taşıma yapılır ve "Yeni liste yapılacak" denir; Listeyi Oluştur çalışır (taşınan nöbet sabitlenir).

## 2. 1.8.0 — Motor: Para Eşitliği
Amaç herkesin cebine giren puanı (para) eşitlemek. Nöbet başına para korunmaz.

1. Payda: ayın toplam puanı / kişi sayısı (ör. 200 / 20 = 10).
2. Herkes kabaca bu puana yazılır; isteyenler arasında puan farkı en çok 1.
3. Az isteyen (ör. 6 yerine 4): önce en ucuz nöbetini bırakır. Sıra: Pzt-Sal-Çar (1) → Per (1) → Cuma / Pazar (2) → Cumartesi (3) en son. 6/9 → 4/7 gibi.
4. Bırakılan puan, en az puanı olana verilir; eşitlikte daha çok nöbet tutana (6/9 ile 7/9 varsa 7/9 desteklenir, 6/9 değil).
5. Ay içi ±1 fark, geçmişte (Base çetele) tutulur; ertesi ay eksik kalan öne alınır. Fark yine en çok 1.

Kontrol: bugünkü veriyle eski ve yeni hedefler yan yana tabloda gösterilir.

## 3. 1.8.0 — Çetele Akışı
- Genel Çetele (1. sekme) = Base çetele, geçmişin tamamı. Bir düğmeyle açılan alandan kimlerin dahil olacağı seçilir.
- Liste ekranındaki çetelenin üstünde iki seçenek: **Bu Ay** / **Genel**.
  - Genel: önceki + bu ay, güncellenmiş çetelenin önizlemesi.
- **Listeyi Kabul Et** düğmesi bu ayı Base çeteleye ekler.
- Listeyi Oluştur'un yanında seçim: **Çeteleye Bağlı** (varsayılan) / **Yalnız Bu Ay**.

## 4. 1.8.0 — Baskı
- A4 yatay; liste ile bu ayın çetelesi yan yana.
- Tek sayfaya sığacak şekilde ölçeklenir.

## Yardım ve Doğrulama
- Her yeni öğeye YARDIM metni; harness yardım denetimi boş dönmeli.
- Harness: vurgu, sürükle önizleme, renk sınıfları, iki çetele görünümü, kabul, baskı (printToPDF tek sayfa).

## Maliyet
- 1 (1.7.3): küçük.
- 2 (motor): büyük; en riskli kısım, mevcut adalet testleri yeniden kurulur.
- 3–4: orta.
- Toplam: bugünkü 1.7 turunun kabaca iki katı.
