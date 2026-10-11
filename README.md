# BAS PORTAL — İzmir Güzelbahçe Ulaşım Portalı

İzmir'deki toplu ulaşım ve altyapı verilerini grafiklerle sunan, Güzelbahçe ulaşım analizi çalışmasına ait web portalı.

🔗 **Canlı site:** https://batuhanbynd.github.io/Izm-r_Guzelbahce-PORTAL/

## Sayfalar

| Sayfa | İçerik |
|---|---|
| [Diyagramlar](kavramsal.html) | İzmir ulaşım ağı kavramsal diyagramları |
| [Adnan Menderes](index.html) | Havalimanı yolcu trafiği analizi |
| [ESHOT](eshot.html) | Otobüs verileri |
| [Tramvay](tramvay.html) | İzmir Tramvayı analizi |
| [İZBAN](izban.html) | İZBAN yolcu trafiği (2010–2015) |
| [Vapur (İzdeniz)](vapur.html) | İzdeniz vapur hatları analizi |
| [İzmir Metro](metro.html) | Metro toplam biniş analizi |
| [Ulaşım Karşılaştırması](karsilastirma.html) | Tüm toplu ulaşım ağlarının karşılaştırması |
| [KGM Karayolları](kgm.html) | KGM 2. Bölge devlet yolları |
| [İZSU Su Kaynakları](izsu.html) | İZSU su kaynakları |
| [Planlanan Projeler](planlanan-projeler.html) | Planlanan ulaşım projeleri |
| [İşbirliklerimiz](isbirlikleri.html) | İşbirlikleri |
| [Güzelbahçe Raporu](Guzelbahce_Rapor.html) | Güzelbahçe ulaşım analizi raporu |

## Yerelde açmak

Herhangi bir kurulum gerekmez. `index.html` dosyasını tarayıcıda açmanız yeterli. Grafikler (Chart.js), yazı tipleri ve ikonlar internetten yüklendiği için internet bağlantısı gerekir.

## Proje yapısı

- `*.html`: portal sayfaları
- `js/`: her sayfanın grafik verileri ve ayarları
- `styles.css`: ortak tasarım
- `_tools/`: sayfaları ve Word raporunu üretmek ya da güncellemek için kullanılan Node.js yardımcı scriptleri (`npm install` sonrası çalışır)
