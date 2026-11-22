# Plan 3 — Geçmiş Düzenleme, Kural Seçenekleri, Gün Ağırlığı

Ölçüm (Kasım 2026, varsayılan kadro): Σ nöbet 120 = 30 gün × 4 kişi, Σ ödeme 188 = günde 4 kişiyle toplam puan. Günlük kişi 5 seçilince herkesin hedefi %25 şişiyor (6 → 7,5); 4 ile her kişi tam 6/10 alıyor.

1. `motor.js`: kurallar `v.kural` içinde. `ardArda` (aç/kapa), `sonraBos` listesi: {gun, bos[], kapsam: hepsi|ilk|son, acik}. Varsayılan: Perşembe → Cmt, Paz, tüm perşembeler. `odemeModu`: `puan` (Cum 2, Cmt 3, Paz 2) veya `esit` (her gün 1, yalnız gün grupları dengelenir).
2. `motor.js`: `v.gecmis` artık doğrudan fark (yapılan − o ayın kendi hedefi); motor şimdiki ayın hedefiyle karşılaştırmaz.
3. `uygulama.js`: geçmiş yalnız "hesaba kat" işaretli aylardan ve elle girilen farktan gelir. Ay gezerken kendiliğinden üretilen listeler artık geçmişe girmez (hatanın kaynağı).
4. Geçmiş sekmesi: kişi × ay tablosu, her hücre "6/10" (nöbet/puan) ve altında hedef; elle fark girişi; toplam fark.
5. Kurallar sekmesi: aç/kapa düğmeleri, kural ekle/sil, gün seçimi, kapsam seçimi.
6. Kadro sekmesi: Σ nöbet ile gün × kişi uyuşmazsa uyarı.
7. Uygulamayı çalıştır, ekran görüntüsü.
