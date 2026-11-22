# Plan — 1.6 / 1.7 / Base / Teknesyum-UI

Sıra benim seçimim; kullanıcı ikinci kez "başla" deyince uygulanır.

## 0. Teknesyum Base kurulumu (önce, veri kaybı riski)
- Bugün: depoda `teknesyum.json` yok → Base ilk `.zip`i seçer = `kod-x.zip` (kod paketi, çalışmaz). Kurulamıyor.
- Ek risk: Base güncellemede kurulum klasörünü bütün olarak değiştiriyor; `veri/` (listeler, geçmiş) silinir.
- Yapılacak:
  - NöbetListesi köküne `teknesyum.json`: `asset: "HemsireNobet-portable-*.zip"`, `method: zip`, `run: "HemsireNobet.bat"`, ad, kategori.
  - Base'e manifest alanı `keep: ["veri"]` — güncellemede bu yollar eski klasörden yenisine taşınır. Rust + test + Base sürümü.
  - Base dev'de gerçek kurulum + güncelleme denemesi; `veri/` korunuyor mu.

## 1. HemsireNobet 1.6.0 — adalet çekirdeği
- Ücret kuralı sert: nöbet sayısı fazla olanın puanı az olamaz (7/9 ile 6/10 yasak; 6/9 – 7/10 olur). Monotonluk motor kısıtı.
- Öncelik: ücret > kişisel istek > özel talepler (Perş/Cuma en az N) > Perşembe sonrası boşluk. Maliyet katsayıları bu sıraya göre.
- Sorunlar sekmesi sorun varsa turuncu + sayı; sekmeler arasına `›` (1 İstekler › 2 Talepler …).
- Sekme adı "Genel Çetele"; düzeltme kutuları her zaman yazılabilir (mod düğmesi kalkar).
- Genel çetele derli toplu: dar sütunlar, hedef tam sayı (7), fare üstünde ondalık (6.2); kapsanan aylar bir düğmenin arkasında.
- Nöbet sayıları İstekler tablosunda (Toplam yanında sayı kutusu).
- Analiz sıkı satırlar, yapışkan başlık; mavi açıklamalar tek satır, yalnız fare üstünde.

## 2. HemsireNobet 1.7.0 — liste üstünde çalışma
- Sürükle-bırak takas: sürükleme başlarken herkes boyanır — kırmızı: kural (art arda vb.), sarı: birinin isteği bozulur, turuncu: ikisinin isteği bozulur. İki yönlü analiz.
- Ayın çetelesinde Perşembe hücresinden sürükleyip başkasına bırakmak = o nöbeti ver (takas değil).
- Çetelede isme tık: kişinin bütün nöbetleri vurgulanır; gün başlığına tık: o gün sütunu.
- Sağ tık = hücreyi pinle; Listeyi Oluştur pinleri koruyarak yeniden kurar.
- Save 1/2/3: tık yükler, 1 sn sol basılı = üstüne yaz, 1 sn sağ basılı = sil (dolum animasyonu); dolu yuva vurgulu, fare üstünde tarih-saat.

## 3. Teknesyum-UI raporu ve standarda katma
- Liste (issue): sağ Ctrl rehberi + Sonraki Adım, ilk açılış yeşil bandı, iki basışlı tehlikeli düğme, yeşil yol çerçevesi, ana/alt sekme + `›` adım sırası, sekmede sorun sayısı rozeti, yapışkan tablo başlığı, hover açıklama, uzun basma ile yaz/sil yuvaları, sürükle-bırak uygunluk boyaması.
- Teknesyum-UI deposunda kitaba ve tarayıcıya (scan.js) kural olarak işlemek.

## Maliyet tahmini
| İş | Tahmini token | Not |
|---|---|---|
| 0 Base | ~150k | Rust değişikliği + Base sürümü |
| 1 1.6.0 | ~350k | motor kısıtı en riskli parça |
| 2 1.7.0 | ~450k | sürükle-bırak + pin motoru |
| 3 UI raporu + standart | ~200k | başka depo, kural + tarayıcı |
| Toplam | ~1.1–1.2M | 4 sürüm |
