# BAS PORTAL — İzmir Güzelbahçe Ulaşım Portalı

İzmir'deki toplu ulaşım ve altyapı verilerini grafiklerle sunan, Güzelbahçe ulaşım analizi çalışmasına ait web portalı.

🔗 **Canlı site:** https://batuhanbynd.github.io/Izm-r_Guzelbahce-PORTAL/

## Sayfalar

| Sayfa | İçerik |
|---|---|
| [Genel Bakış](index.html) | Öne çıkan veriler ve tüm sayfalara giriş |
| [Diyagramlar](kavramsal.html) | İzmir ulaşım ağı kavramsal diyagramları |
| [Adnan Menderes](havalimani.html) | Havalimanı yolcu trafiği analizi |
| [ESHOT](eshot.html) | Otobüs verileri |
| [Tramvay](tramvay.html) | İzmir Tramvayı analizi |
| [İZBAN](izban.html) | İZBAN yolcu trafiği (2010–2015) |
| [Vapur (İzdeniz)](vapur.html) | İzdeniz vapur hatları analizi |
| [İzmir Metro](metro.html) | Metro toplam biniş analizi |
| [Ulaşım Karşılaştırması](karsilastirma.html) | Tüm toplu ulaşım ağlarının karşılaştırması |
| [KGM Karayolları](kgm.html) | KGM 2. Bölge devlet yolları |
| [İZSU Su Kaynakları](izsu.html) | Baraj durumu, günlük su üretimi, su kayıpları, Çamlı Barajı |
| [Atık Su](atiksu.html) | Güneybatı arıtma tesisi, kapasite kullanımı, 75. Yıl Bulvarı altyapısı, Körfez ölçümleri |
| [Katı Atık](kati-atik.html) | Atık bileşenleri, ayrı toplama, araç ve personel, maliyet ve tarife |
| [Planlanan Projeler](planlanan-projeler.html) | Planlanan ulaşım projeleri |
| [İşbirliklerimiz](isbirlikleri.html) | İşbirlikleri |
| [Güzelbahçe Raporu](Guzelbahce_Rapor.html) | Güzelbahçe ulaşım analizi raporu |

## Dil (TR / EN)

Her sayfanın sağ üstündeki **TR / EN** düğmesi bütün metinleri, grafik etiketlerini ve sayı biçimlerini İngilizceye çevirir; seçim tarayıcıda hatırlanır. Sayfalar Türkçe yazılır, İngilizce karşılıklar `js/dil-en.js` sözlüğündedir (`js/dil.js` uygular). Özel adlar (durak, mahalle, kurum adları) çevrilmez.

Yeni metin eklendiğinde sözlüğü güncellemek için `_tools/dil/` klasörüne bakın:
1. `node _tools/dil/metin_topla.js <portal klasörü> _tools/dil/metinler.json <sayfalar...>` ile sayfalardaki metinleri toplayın.
2. `python _tools/dil/liste_cikar.py <portal klasörü>` ile çevrilecek listeyi çıkarın.
3. Çevirileri `_tools/dil/ceviri/*.json` dosyalarına ekleyin.
4. `python _tools/dil/sozluk_uret.py <portal klasörü>` ile `js/dil-en.js`'i yeniden üretip eksikleri görün.

## Yerelde açmak

Herhangi bir kurulum gerekmez. `index.html` dosyasını tarayıcıda açmanız yeterli. Grafikler (Chart.js), yazı tipleri ve ikonlar internetten yüklendiği için internet bağlantısı gerekir.

## Proje yapısı

- `*.html`: portal sayfaları
- `js/`: her sayfanın grafik verileri ve ayarları
- `styles.css`: ortak tasarım
- `_tools/`: sayfaları ve Word raporunu üretmek ya da güncellemek için kullanılan Node.js yardımcı scriptleri (`npm install` sonrası çalışır)
