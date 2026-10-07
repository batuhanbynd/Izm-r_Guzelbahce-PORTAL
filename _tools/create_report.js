const fs = require('fs');
const path = require('path');
const htmlToDocx = require('html-to-docx');

async function createDocx() {
    function getBase64(file) {
        if (!fs.existsSync(file)) return '';
        const ext = path.extname(file).replace('.', '') === 'jpg' ? 'jpeg' : 'png';
        const base64 = fs.readFileSync(file).toString('base64');
        return `data:image/${ext};base64,${base64}`;
    }

    const img8 = getBase64('8cap_v2.jpg');
    const img9 = getBase64('9cap_v2.jpg');
    const img28 = getBase64('28cap_v2.jpg');
    const img82 = getBase64('82cap_v2.jpg');
    const img684 = getBase64('684cap_v2.jpg');
    const img762 = getBase64('762cap_v2.jpg');
    const harita = getBase64('harita.jpg');
    const kgmImg = getBase64('kgm.jpg');

    // Mime types are fixed to image/jpeg or image/png based on extension.
    // Removed width: 100% and instead used fixed width attributes for Word compatibility.

    const htmlString = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="utf-8">
        <title>GÜZELBAHÇE ULAŞIM ANALİZİ VE MEKÂNSAL DEĞERLENDİRME RAPORU</title>
        <style>
            body { font-family: "Times New Roman", Times, serif; font-size: 11pt; line-height: 1.5; }
            h1 { font-size: 16pt; font-weight: bold; text-align: center; margin-top: 20pt; margin-bottom: 10pt; color: #111; }
            h2 { font-size: 13pt; font-weight: bold; margin-top: 14pt; margin-bottom: 6pt; color: #222; }
            h3 { font-size: 12pt; font-weight: bold; margin-top: 10pt; margin-bottom: 4pt; color: #333; }
            p { margin-bottom: 10pt; text-align: justify; }
            table { border-collapse: collapse; margin-bottom: 12pt; width: 100%; }
            th, td { border: 1px solid #000; padding: 5px; text-align: left; }
            th { font-weight: bold; background-color: #e2e2e2; }
            .cover-page { text-align: center; margin-top: 100pt; }
            .cover-title { font-size: 22pt; font-weight: bold; margin-bottom: 20pt; }
            .cover-subtitle { font-size: 16pt; margin-bottom: 80pt; }
            .cover-author { font-size: 12pt; margin-bottom: 10pt; }
            .figure-caption { font-weight: bold; text-align: center; margin-bottom: 5pt; font-size: 10pt; }
            .source-text { font-size: 9pt; font-style: italic; text-align: left; margin-bottom: 12pt; color: #555; }
        </style>
    </head>
    <body>

        <!-- KAPAK -->
        <div class="cover-page">
            <div class="cover-title">GÜZELBAHÇE ULAŞIM ANALİZİ VE MEKÂNSAL DEĞERLENDİRME RAPORU</div>
            <div class="cover-subtitle">İzmir Büyükşehir Belediyesi Ulaşım Ağı Çalışması</div>
            <div class="cover-author">Hazırlayan: Proje Geliştirme Ekibi</div>
            <div class="cover-author">İzmir / 2026</div>
        </div>

        <br clear="all" style="page-break-before:always" />

        <h1>1. GİRİŞ VE ÇALIŞMANIN AMACI</h1>
        <p>Bu rapor, İzmir ili Güzelbahçe ilçesi ve çevresindeki ulaşım altyapısının, karayolu trafiğinin ve toplu ulaşım ağlarının güncel veriler ışığında analiz edilmesi amacıyla hazırlanmıştır. Çalışma kapsamında; ESHOT otobüs hatlarının kapasiteleri ve mekânsal kapsama alanları, Karayolları Genel Müdürlüğü (KGM) 2. Bölge trafik hacim verileri, İZBAN banliyö hattı istatistikleri ve Adnan Menderes Havalimanı yolcu akış verileri bütüncül bir yaklaşımla incelenmiştir.</p>
        
        <h1>2. VERİ KAYNAKLARI VE YÖNTEM</h1>
        <p>Raporda sunulan istatistiksel veriler ve mekânsal analizler; İzmir Büyükşehir Belediyesi (ESHOT), Karayolları Genel Müdürlüğü (KGM) 24. Şube Şefliği ve havalimanı işletme verilerinden derlenmiştir. Analizlerde hem nitel hem nicel değerlendirme yöntemleri kullanılmış olup, güzergah bazlı kapasite ölçümleri Yıllık Ortalama Günlük Trafik (YOGT) değerleri üzerinden yapılmıştır.</p>
        
        <br clear="all" style="page-break-before:always" />

        <h1>3. İZMİR GENELİ ULAŞIM AĞLARI VE KARŞILAŞTIRMA</h1>
        <h2>3.1. Ulaşım Modlarının Genel Durumu</h2>
        <p>İzmir genelinde ulaşım 7 farklı mod (ESHOT, Metro, İZBAN, Tramvay, Vapur, vb.) üzerinden sağlanmakta olup, sistemler 12'den fazla ana aktarma merkezi ile entegre edilmiştir. Ağın yıllık tahmini yolcu taşıma kapasitesi yaklaşık 446.2 milyondur.</p>
        
        <table>
            <tr><th>Ulaşım Modu</th><th>Durum</th><th>Yolcu Sayısı</th></tr>
            <tr><td>ESHOT Otobüs Ağı</td><td>En Çok Kullanılan Mod</td><td>Veri Seti - Lider</td></tr>
            <tr><td>Metro</td><td>İkinci Sırada</td><td>-</td></tr>
            <tr><td>Raylı Sistemler Toplamı</td><td>İZBAN + Metro + Tramvay</td><td>262 Milyon / Yıl</td></tr>
        </table>
        <p class="source-text">Kaynak: İzmir Ulaşım Verileri, 2026.</p>

        <h2>3.2. Adnan Menderes Havalimanı Yolcu Trafiği</h2>
        <p>2026 yılı Ocak-Ağustos döneminde Adnan Menderes Havalimanı toplam 8.925.405 yolcuya hizmet vermiştir. Bu trafiğin 5.560.681'i İç Hatlar, 3.364.724'ü ise Dış Hatlar yolcularından oluşmaktadır. Havalimanından Güzelbahçe yönüne erişim için Raylı Sistem, Ekspres Otobüs ve Körfez Vapur rotası olmak üzere 3 ana alternatif bulunmaktadır.</p>

        <br clear="all" style="page-break-before:always" />

        <h1>4. KGM 2. BÖLGE DEVLET YOLLARI VE GÜZELBAHÇE TRAFİK HACMİ</h1>
        <h2>4.1. Temel Göstergeler (Dashboard Verileri)</h2>
        <p>Güzelbahçe ve çevresini kapsayan 6 farklı karayolu güzergahından toplanan 2025 YOGT (Yıllık Ortalama Günlük Trafik) verilerine göre temel istatistikler aşağıda özetlenmiştir:</p>
        <ul>
            <li><strong>Toplam Günlük Trafik:</strong> 224.324 Araç / Gün</li>
            <li><strong>En Yoğun Güzergah:</strong> Güzelbahçe - Menderes (76.779 Taşıt/Gün)</li>
            <li><strong>Ortalama Ağır Taşıt Oranı:</strong> %9,7</li>
        </ul>

        <h2>4.2. Güzelbahçe Ulaşım Altyapısı ve Kapasite Analizi</h2>
        <p>İlçeyi İzmir geneline bağlayan 4 temel karayolu bağlantısı incelenmiştir:</p>

        <h3>1. İzmir - Çeşme Otoyolu (O-32)</h3>
        <p>Güzelbahçe geçişini sağlayan O-32 Otoyolu, 2x3 (3 gidiş, 3 geliş) şeritli olup acil emniyet şeritlerine sahiptir. Şerit başına ideal koşullarda 2.000 - 2.400 otomobil/saat kapasiteye sahiptir. Günlük bazda 80.000 - 100.000 araçlık yüksek trafik hacmi için tasarlanmıştır.</p>

        <h3>2. D.300 Devlet Yolu (Mithatpaşa Caddesi)</h3>
        <p>İlçe merkezinde sahil kesimini takip eden eski Çeşme yoludur. Genellikle 2x1, yer yer 2x2 şeritlidir. Hafta sonları liman ve balık hali bölgesinde teorik sınırına (1.200 - 1.500 araç/saat/şerit) ulaşarak tıkanıklıklar yaşanmaktadır.</p>

        <h3>3. Yeni 75. Yıl Cumhuriyet Bulvarı</h3>
        <p>24,5 metre genişliğinde ve 2x2 bölünmüş yol standardında olan alternatif dağ yoludur. Mithatpaşa Caddesi'nin kapasite yetersizliğini çözmek amacıyla inşa edilmiş olup, sahil yolunun trafik yükünü önemli ölçüde hafifletmiştir.</p>

        <h3>4. 300-01 Otoyol Bağlantı Yolu (Urla Otoyol Ayrımı - Güzelbahçe Girişi)</h3>
        <p>9 kilometre uzunluğundaki bu bağlantı yolu, Çeşme Otoyolu'ndan Güzelbahçe ve Urla bölgelerine geçişi sağlayan toplayıcı-dağıtıcı roldedir.</p>

        <p><strong>Tablo 1. 300-01 Otoyol Bağlantı Yolu KGM Resmi Trafik Hacim Verisi (YOGT)</strong></p>
        <table>
            <tr><th>Araç Sınıfı</th><th>Günlük Ortalama Araç Sayısı (YOGT)</th></tr>
            <tr><td>Toplam</td><td>15.064</td></tr>
            <tr><td>Otomobil</td><td>13.983</td></tr>
            <tr><td>Hafif Ticari</td><td>687</td></tr>
            <tr><td>Ağır Vasıta & Otobüs</td><td>394</td></tr>
        </table>
        <p>KGM 2. Bölge istatistiklerine göre, bu bağlantı yolundan günlük ortalama 15 bin araç Güzelbahçe yönüne geçiş yapmaktadır. Trafiğin %92'sinden fazlasını otomobiller oluşturduğundan şahsi araç kullanımı son derece yüksektir.</p>

        <br clear="all" style="page-break-before:always" />

        <h1>5. ESHOT OTOBÜS HATLARI VE MEKÂNSAL KAPSAM (COVERAGE) ANALİZİ</h1>
        <h2>5.1. ESHOT Genel Biniş İstatistikleri</h2>
        <p>Yıl bazında günlük ortalama biniş istatistiklerine göre; ESHOT otobüslerinin en yüksek günlük ortalama biniş sayısı 719.559, en düşük 100.704 ve yıllık ortalaması 377.650 yolcudur.</p>

        <h2>5.2. Güzelbahçe Özel Hat İncelemeleri ve Durak Kapsam Alanları</h2>
        <p>Çalışma alanındaki kritik ESHOT hatlarının operasyonel verileri ve durak çevrelerindeki <strong>400 metrelik yürüme mesafesi yarıçapları</strong> haritalandırılmıştır.</p>

        <h3>5.2.1. Hat No: 8 (GÜZELBAHÇE - F. ALTAY AKTARMA MERKEZİ)</h3>
        <p>İlk kalkış 06:00, son kalkış 00:30'dur. Ortalama 21-22 dakika sefer aralığına sahip olup günde ortalama 100 sefer düzenlenmekte ve 64 duraktan geçmektedir.</p>
        ${img8 ? `<div class="figure-caption">Şekil 1. 8 Numaralı Hat Durak Ulaşım Çapları (400m Yarıçap)</div><img src="${img8}" width="600" height="auto"><p class="source-text">Kaynak: ESHOT Açık Veri Portalı, Portal Analizi.</p>` : ''}

        <h3>5.2.2. Hat No: 9 (ÖZZÜMRÜT EVLERİ – SİTELER)</h3>
        <p>Seferler 06:35 ile 20:20 arasındadır. 2 saatte bir kalkan otobüslerle günde ortalama 16 sefer yapılır (50 Durak).</p>
        ${img9 ? `<div class="figure-caption">Şekil 2. 9 Numaralı Hat Durak Ulaşım Çapları (400m Yarıçap)</div><img src="${img9}" width="600" height="auto"><p class="source-text">Kaynak: ESHOT Açık Veri Portalı, Portal Analizi.</p>` : ''}

        <h3>5.2.3. Hat No: 28 (KAVACIK – GÜZELBAHÇE)</h3>
        <p>Seferler 06:50 ile 18:20 arasındadır. 4 saatte bir kalkan otobüslerle günde ortalama 8-9 sefer yapılmaktadır (25 Durak).</p>
        ${img28 ? `<div class="figure-caption">Şekil 3. 28 Numaralı Hat Durak Ulaşım Çapları (400m Yarıçap)</div><img src="${img28}" width="600" height="auto"><p class="source-text">Kaynak: ESHOT Açık Veri Portalı, Portal Analizi.</p>` : ''}

        <br clear="all" style="page-break-before:always" />
        
        <h3>5.2.4. Hat No: 82 (SİTELER - F. ALTAY AKTARMA MERKEZİ)</h3>
        <p>Seferler 06:00 - 00:25 arasındadır. Yarım saatte bir kalkan otobüslerle günde 60 sefer yapılmaktadır (71 Durak).</p>
        ${img82 ? `<div class="figure-caption">Şekil 4. 82 Numaralı Hat Durak Ulaşım Çapları (400m Yarıçap)</div><img src="${img82}" width="600" height="auto"><p class="source-text">Kaynak: ESHOT Açık Veri Portalı, Portal Analizi.</p>` : ''}

        <h3>5.2.5. Hat No: 684 (URLA - F. ALTAY AKTARMA MERKEZİ EKSPRES)</h3>
        <p>Seferler 06:00 - 21:20 arasındadır. 25 dakika aralıklarla günde ortalama 70 sefer düzenlenmektedir. Ekspres olması sebebiyle 17 duraktan geçmektedir.</p>
        ${img684 ? `<div class="figure-caption">Şekil 5. 684 Numaralı Hat Durak Ulaşım Çapları (400m Yarıçap)</div><img src="${img684}" width="600" height="auto"><p class="source-text">Kaynak: ESHOT Açık Veri Portalı, Portal Analizi.</p>` : ''}

        <h3>5.2.6. Hat No: 762 (GÜZELBAHÇE - URLA)</h3>
        <p>Seferler 06:40 - 16:30 arasındadır. 2 saatte bir kalkan otobüslerle günde 6 sefer yapılmaktadır (52 Durak).</p>
        ${img762 ? `<div class="figure-caption">Şekil 6. 762 Numaralı Hat Durak Ulaşım Çapları (400m Yarıçap)</div><img src="${img762}" width="600" height="auto"><p class="source-text">Kaynak: ESHOT Açık Veri Portalı, Portal Analizi.</p>` : ''}


        <br clear="all" style="page-break-before:always" />

        <h1>6. İZBAN YOLCU TRAFİĞİ VE RAYLI SİSTEMLER</h1>
        <h2>6.1. İZBAN Yıllık Kullanım İstatistikleri (2010 - 2015)</h2>
        <p>İzmir Banliyö Sistemi İZBAN'a ait yıllık taşıma verileri incelendiğinde, sistemin kentin ana omurgalarından birini oluşturduğu anlaşılmaktadır.</p>
        ${harita ? `<div class="figure-caption">Şekil 7. İzmir Raylı Sistemler Genel Haritası</div><img src="${harita}" width="600" height="auto"><p class="source-text">Kaynak: İZBAN / İzmir Metro A.Ş.</p>` : ''}

        <br clear="all" style="page-break-before:always" />

        <h1>7. İŞBİRLİKLERİ VE PAYDAŞLAR</h1>
        <p>Güzelbahçe çalışmamız kapsamında ulaşım ve karayolu altyapısına ilişkin veri ve bilgi alışverişi konusunda <strong>KGM 2. Bölge 24. Şube Şefliği</strong> ile görüşmeler gerçekleştirilmiştir. Ayrıca portalın geliştirilmesinde İzmir Büyükşehir Belediyesi ve ESHOT gibi kurumların açık veri setlerinden yararlanılmıştır.</p>
        ${kgmImg ? `<div class="figure-caption">Şekil 8. Karayolları Genel Müdürlüğü İşbirliği</div><img src="${kgmImg}" width="300" height="auto"><p class="source-text">Kaynak: KGM Görüşme Arşivi</p>` : ''}

        <br clear="all" style="page-break-before:always" />

        <h1>8. SONUÇ VE DEĞERLENDİRME</h1>
        <p>Mevcut veriler ve mekânsal analizler neticesinde Güzelbahçe ilçesi ulaşım altyapısına dair aşağıdaki sonuçlara ulaşılmıştır:</p>
        <ul>
            <li><strong>Karayolu Ağı:</strong> D.300 Devlet Yolu sahil şeridinde darboğaz oluştururken, alternatif 75. Yıl Cumhuriyet Bulvarı ilçe içi kapasiteyi rahatlatmıştır. Otoyol bağlantısı 15 bini aşan yüksek şahsi araç kullanım hacmine sahiptir.</li>
            <li><strong>Toplu Ulaşım (ESHOT):</strong> İlçeye hizmet veren otobüs hatlarının sefer aralıkları ve durak konumları incelendiğinde (400m kapsama alanları), merkezdeki kapsayıcılığın yüksek olduğu ancak çeper alanlarda seyrek seferlerin öne çıktığı görülmektedir.</li>
            <li><strong>Genel Sistem:</strong> Raylı sistemlerin eksikliği, ilçede karayolu odaklı ve lastik tekerlekli toplu taşımaya olan bağımlılığı artırmaktadır.</li>
        </ul>

        <h1>9. KAYNAKÇA</h1>
        <ul>
            <li>İzmir Büyükşehir Belediyesi Ulaşım Dairesi Başkanlığı, 2026 Ulaşım Raporları.</li>
            <li>Karayolları Genel Müdürlüğü (KGM) 2025 Yılı 2. Bölge Trafik Hacim Haritası.</li>
            <li>ESHOT Genel Müdürlüğü Açık Veri Portalı İstatistikleri.</li>
            <li>Adnan Menderes Havalimanı Yolcu Trafiği Raporları (Ocak-Ağustos 2026).</li>
        </ul>

    </body>
    </html>
    `;

    try {
        const docxBuffer = await htmlToDocx(htmlString, null, {
            table: { row: { cantSplit: true } },
            footer: true,
            pageNumber: true,
            margins: { top: 1440, right: 1440, bottom: 1440, left: 1440 } // 1-inch margins
        });

        fs.writeFileSync('Guzelbahce_Ulasim_Analizi_Raporu.docx', docxBuffer);
        console.log('DOCX created successfully without errors.');
    } catch(err) {
        console.error('Error creating docx:', err);
    }
}

createDocx();
