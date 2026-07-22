# CAD Dosyaları — Orange Vestiyer Dönüşümü (Rev A, Temmuz 2026)

## Dosyalar

| Dosya | İçerik | PDF karşılığı |
|---|---|---|
| `S01_Yerlesim.dxf` | Yerleşim planı (2.0 × 4.0 m oda, W1/B1 mobilya, D1/D2) | Shop Drawings S-01 |
| `S02_W1_Gorunus.dxf` | W1 gardırop duvarı görünüşü (3 × 1100 modül) | Shop Drawings S-02 |
| `S03_B1_Gorunus.dxf` | B1 bank duvarı görünüşü + ayna (dip) duvarı | Shop Drawings S-03 |
| `S04_Kesitler.dxf` | Düşey kesitler: bank duvarı + boy dolap | Shop Drawings S-04 |

S-05 (hırdavat tablosu) çizim değil tablo olduğundan DXF üretilmemiştir — PDF setindedir.

## Teknik özellikler

- **Format:** DXF R2010 (AC1024), UTF-8 — Türkçe karakterler (ş ğ ı İ ü ö ç) doğrudan kodlanır.
- **Birim:** milimetre (`$INSUNITS = 4`), geometri **1:1 gerçek boyut**. Kotlar metre olarak yazıyla belirtilmiştir (FFL +1.20).
- **Yazı stili:** `TRTEXT` → `DejaVuSans.ttf` (Unicode). `txt.shx` bilinçli olarak KULLANILMAMIŞTIR: ölçü yazıları dahil tüm metin Türkçe glifleri tam gösterir. Görüntüleyiciniz DejaVu Sans bulamazsa herhangi bir Unicode TTF ile eşleyin (ör. Arial) — glifler korunur.
- **Ölçü stili:** `OZLU` (S01'de `OZLU50`) — mm, ondalıksız, tick (çizgi) uçlu, yazı yüksekliği 60 mm (S01: 110 mm) model biriminde; 1:25 / 1:50 baskıda ~2 mm'ye denk gelir. Ölçüler gerçek DIMENSION varlıklarıdır (patlatılmamış), ölçü blokları dosya içinde gömülüdür.

## Katmanlar

| Katman | Renk (ACI) | İçerik |
|---|---|---|
| `0` | 7 | — (boş referans katmanı) |
| `DUVAR-MEVCUT` | 8 gri | Mevcut duvarlar, zemin/tavan çizgileri |
| `DUVAR-YENI` | 1 kırmızı | Yeni duvarlar, D1 kapı bölgesi |
| `MOBILYA-KARKAS` | 30 turuncu | Gövde, baza, çırpma, raf/boru (kesik), kanca |
| `MOBILYA-KAPAK` | 34 açık kahve | Kapaklar, shaker çerçeveler, kulplar, çekmece önleri, minder, ayna, LED (kesik) |
| `OLCU` | 5 mavi | Tüm ölçüler (DIMENSION) |
| `YAZI` | 7 | Etiketler ve notlar (TEXT) |
| `AKS` | 3 yeşil | Aks / tavan doğrulama çizgileri (CENTER tip) |

## Açma / kullanma

- AutoCAD, BricsCAD, LibreCAD, QCAD, DraftSight ve ODA Viewer ile test amaçlı uyumludur (R2010).
- Açınca birimlerin **mm** olduğunu doğrulayın; ölçek 1:1'dir, baskı ölçeği pafta antetinde (S-01: 1:50, S-02/03: 1:25, S-04: 1:20).
- `ezdxf.audit` ile üretim sonrası doğrulanmıştır (0 hata) ve her dosya PNG'ye çizdirilerek görsel kontrol edilmiştir.
- **Uyarı:** Bu çizimler tasarım niyetidir. `İMALAT ÖNCESİ YERİNDE ÖLÇÜ ZORUNLUDUR` — kesim listesi kaba inşaat sonrası lazer ölçüye göre revize edilir; plan ölçüsüyle imalata başlanmaz.

## Yeniden üretim

```bash
pip install ezdxf matplotlib
python3 src/cad/build_dxf.py     # DXF'leri + qa/CAD/*.png kontrol görüntülerini üretir
```
