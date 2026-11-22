# Plan 2 — Kural düzeltmeleri

1. `motor.js`: nöbet sayısı ve ödeme hedefi ayrı (kadro `nobet` / `odeme`, eski `min`/`max` göç eder). Ödeme katsayısı: Cuma 2, Cumartesi 3, Pazar/tatil 2, diğer 1. Beş gün grubu (Pzt-Çar, Per, Cum, Cmt, Paz) uzun vadede eşitlenir. Perşembe nöbetinin hafta sonu (Cmt, Paz) boş kalır. Geçmiş aylardan gelen fazla/eksik hedeften düşülür (`v.gecmis`). İstek ağırlığı = 1 / kişinin istek sayısı (az isteyenin isteği önce).
2. `motor.js`: `analiz(v, liste)` kişi başına nöbet, ödeme, grup sayıları, istek durumu, geçmişle fark.
3. `uygulama.js`: geçmiş aylardan `gecmis` hesabı, kadro göçü, İstekler sekmesi (tıkla-döngü tablo), Analiz sekmesi, Kadro sekmesi (Nöbet/Ödeme).
4. `arayuz.html` + `app.css`: iki yeni sekme, geniş sekmelerde liste gizlenir.
5. Veri düzeltmesi: Emel Hemşire'nin 7, 8, 12, 14, 15 günleri istek değil, istemediği gün.
6. Sonraya: ek kurallar (iki kişi birlikte nöbet ertesi yapmasın vb.), kullanıcı verince.
