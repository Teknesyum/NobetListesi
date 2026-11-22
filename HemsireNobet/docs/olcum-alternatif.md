# Ölçüm — Alternatif Sayısı (30-500)

Motor 1.2.2, günlük 4 kişi, 20 hemşire, Kasım 2026 istekleri. Her tekrar 500 alternatif üretir; N için ilk N alternatifin en iyisi alınır. 8 tekrar, alternatif başına 6.9 ms.

| N | ort. maliyet | min | maks | ort / 500 ort | süre (sn) | maks nöbet sapma | maks puan sapma | HS fark | sorunlu tekrar |
|---|---|---|---|---|---|---|---|---|---|
| 30 | 53 | 51 | 55 | 1.073 | 0.2 | 0.00 | 1.00 | 1.00 | 0/8 |
| 50 | 52 | 49 | 54 | 1.050 | 0.3 | 0.00 | 1.00 | 1.00 | 0/8 |
| 75 | 51 | 49 | 54 | 1.039 | 0.5 | 0.00 | 1.00 | 1.00 | 0/8 |
| 100 | 50 | 49 | 52 | 1.027 | 0.7 | 0.00 | 1.00 | 1.00 | 0/8 |
| 150 | 50 | 49 | 52 | 1.024 | 1.0 | 0.00 | 1.00 | 1.00 | 0/8 |
| 200 | 50 | 49 | 51 | 1.016 | 1.4 | 0.00 | 1.00 | 1.00 | 0/8 |
| 250 | 50 | 49 | 51 | 1.015 | 1.7 | 0.00 | 1.00 | 1.00 | 0/8 |
| 300 | 49 | 49 | 51 | 1.006 | 2.1 | 0.00 | 1.00 | 1.00 | 0/8 |
| 400 | 49 | 49 | 50 | 1.000 | 2.8 | 0.00 | 1.00 | 1.00 | 0/8 |
| 500 | 49 | 49 | 50 | 1.000 | 3.4 | 0.00 | 1.00 | 1.00 | 0/8 |

## Sonuç

Adalet ölçüleri (nöbet sapması, puan sapması, hafta sonu farkı) her N'de aynı. Fark yalnız maliyetin küçük kısmında.

200, 500'ün maliyetine %1.6 uzak; pratikte adil. 300 %0.6 ile en iyiye neredeyse eşit ve 2.1 sn sürüyor — tatlı nokta 300.

500 de yalnız 3.4 sn; makine yavaşsa 200, değilse 300-500 seçilebilir. Varsayılan 300 yapıldı.

Betik: oturum karalama klasöründe `sim.js` (`node sim.js <uygulama klasörü>`).
