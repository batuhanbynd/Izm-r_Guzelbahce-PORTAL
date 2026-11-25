# Portal içi arama (Ctrl+K) dizinini üretir: js/arama-dizin.js
# Kullanım: python _tools/arama/dizin_uret.py <portal klasörü>
# Her kayıt: [sayfa, tür, başlık, metin, bağlam, hedef]. "hedef", sonuca gidildiğinde sayfada aranıp vurgulanan görünür metindir.
import sys, os, re, json
import lxml.html

kok = sys.argv[1]
os.chdir(kok)

# Yan menüdeki adlar ve simgeler (sıra = gösterim sırası)
SAYFALAR = [
    ('index.html', 'Genel Bakış', 'fa-house'), ('kavramsal.html', 'Diyagramlar', 'fa-network-wired'),
    ('kent-tarihi.html', 'Kent Tarihi ve Kimlik', 'fa-landmark'), ('mekansal-yapi.html', 'Mekânsal Yapı', 'fa-map-location-dot'),
    ('ekonomi.html', 'Ekonomik Yapı', 'fa-chart-line'), ('dogal-yapi.html', 'Doğal Yapı ve Afet', 'fa-mountain'),
    ('havza-koruma.html', 'Havza ve Koruma', 'fa-leaf'), ('kriz-dayaniklilik.html', 'Kriz ve Dayanıklılık', 'fa-shield-heart'), ('havalimani.html', 'Adnan Menderes', 'fa-plane-departure'),
    ('eshot.html', 'ESHOT', 'fa-bus'), ('dolmus.html', 'Dolmuş', 'fa-van-shuttle'), ('tramvay.html', 'Tramvay', 'fa-train-tram'),
    ('izban.html', 'İZBAN', 'fa-train'), ('vapur.html', 'Vapur (İzdeniz)', 'fa-ship'), ('metro.html', 'İzmir Metro', 'fa-subway'),
    ('karsilastirma.html', 'Ulaşım Karşılaştırması', 'fa-chart-pie'), ('kgm.html', 'KGM Karayolları', 'fa-road'),
    ('otoparklar.html', 'Otoparklar', 'fa-square-parking'), ('izsu.html', 'İZSU Su Kaynakları', 'fa-droplet'),
    ('atiksu.html', 'Atık Su', 'fa-house-flood-water'), ('kati-atik.html', 'Katı Atık', 'fa-recycle'),
    ('elektrik.html', 'Elektrik Altyapısı', 'fa-bolt'), ('planlanan-projeler.html', 'Planlanan Projeler', 'fa-layer-group'),
    ('isbirlikleri.html', 'İşbirliklerimiz', 'fa-handshake'),
    ('3b.html', '3B Modeller', 'fa-cube'), ('3b-kent.html', '3B Kent Modeli', 'fa-cube'), ('3b-su-aglari.html', '3B Yer Altı Ağları', 'fa-cube'),
    ('3b-erisim.html', '3B Erişim Boşlukları', 'fa-cube'), ('3b-ulasim.html', '3B Toplu Taşıma', 'fa-cube'),
    ('3b-elektrik.html', '3B Elektrik Şebekesi', 'fa-cube'), ('senaryo.html', 'Senaryo Laboratuvarı', 'fa-flask'),
]

def metin(el):
    return re.sub(r'\s+', ' ', el.text_content() or '').strip()

def kisalt(s, n=220):
    return s if len(s) <= n else s[:n].rsplit(' ', 1)[0] + '…'

def sinif(el):
    return ' ' + (el.get('class') or '') + ' '

def var(el, s):
    return (' ' + s + ' ') in sinif(el)

kayitlar = []
gorulen = set()
def ekle(sayfa, tur, baslik, govde, baglam, hedef):
    baslik, govde = kisalt(baslik, 140), kisalt(govde)
    if not baslik or len(baslik) < 2:
        return
    anahtar = (sayfa, tur, baslik, govde)
    if anahtar in gorulen:
        return
    gorulen.add(anahtar)
    kayitlar.append([sayfa, tur, baslik, govde, baglam if baglam != baslik else '', hedef or baslik])

for dosya, ad, _ in SAYFALAR:
    if not os.path.exists(dosya):
        continue
    doc = lxml.html.fromstring(open(dosya, encoding='utf-8').read())
    for e in doc.xpath('//script|//style|//aside|//nav|//*[contains(concat(" ",@class," ")," ekran-okuyucu ")]|//*[@aria-hidden="true"]'):
        e.drop_tree()

    # 3B sayfaları ve laboratuvar: yalnızca sayfa kaydı (başlık + alt metin)
    if dosya.startswith('3b') or dosya == 'senaryo.html':
        h1 = doc.xpath('//h1')
        alt = doc.xpath('//*[contains(concat(" ",@class," ")," sub ")]|//p[contains(concat(" ",@class," ")," lead ")]')
        ekle(dosya, 'sayfa', ad, (metin(h1[0]) + ' · ' if h1 else '') + (metin(alt[0]) if alt else ''), '', '')
        continue

    h1 = doc.xpath('//main//h1')
    alt = doc.xpath('//main//p[contains(concat(" ",@class," ")," subtitle ")]|//main//div[contains(concat(" ",@class," ")," giris-metin ")]/p')
    ekle(dosya, 'sayfa', ad, (metin(alt[0]) if alt else (metin(h1[0]) if h1 else '')), '', metin(h1[0]) if h1 else '')

    baglam = ''
    for el in doc.xpath('//main//*'):
        if el.tag in ('script', 'style'):
            continue
        if var(el, 'bolum-baslik') or var(el, 'bolum-ust'):
            h = el.xpath('.//h2'); p = el.xpath('.//p')
            if h:
                baglam = metin(h[0])
                ekle(dosya, 'bolum', baglam, metin(p[0]) if p else '', '', baglam)
        elif el.tag == 'h2' and var(el, 'ara-baslik'):
            ekle(dosya, 'bolum', metin(el), '', baglam, metin(el))
        elif var(el, 'card') or var(el, 'info-card') or var(el, 'galeri-karti'):
            h = el.xpath('./h2|./h3|./figcaption|./div/h2|./div/h3')
            if not h:
                continue
            b = metin(h[0])
            p = el.xpath('.//p[contains(concat(" ",@class," ")," kart-aciklama ")]|.//p[contains(concat(" ",@class," ")," kucuk-not ")]|./p')
            ekle(dosya, 'kart', b, metin(p[0]) if p else '', baglam, b)
        elif var(el, 'stat-card'):
            l = el.xpath('.//*[contains(concat(" ",@class," ")," stat-label ")]'); v = el.xpath('.//*[contains(concat(" ",@class," ")," stat-value ")]')
            c = el.xpath('.//*[contains(concat(" ",@class," ")," stat-change ")]')
            if l:
                ekle(dosya, 'deger', metin(l[0]), ' · '.join(metin(x[0]) for x in (v, c) if x), baglam, metin(l[0]))
        elif var(el, 'kpi'):
            l = el.xpath('.//*[contains(concat(" ",@class," ")," kpi-etiket ")]'); v = el.xpath('.//*[contains(concat(" ",@class," ")," kpi-deger ")]')
            a = el.xpath('.//*[contains(concat(" ",@class," ")," kpi-alt ")]')
            if l:
                ekle(dosya, 'deger', metin(l[0]), ' · '.join(metin(x[0]) for x in (v, a) if x), baglam, metin(l[0]))
        elif var(el, 'mini-ist'):
            v = el.xpath('./*[contains(concat(" ",@class," ")," deger ")]'); l = el.xpath('./*[contains(concat(" ",@class," ")," etiket ")]')
            if v and l:
                ekle(dosya, 'deger', metin(l[0]), metin(v[0]), baglam, metin(l[0]))
        elif var(el, 'servis-karti') or var(el, 'simge-karti'):
            h = el.xpath('.//h3'); p = el.xpath('.//p|.//*[contains(concat(" ",@class," ")," latince ")]')
            if h:
                ekle(dosya, 'kart', metin(h[0]), metin(p[0]) if p else '', baglam, metin(h[0]))
        elif el.tag == 'tr' and el.xpath('./td'):
            hucre = [metin(c) for c in el.xpath('./th|./td')]
            hucre = [h for h in hucre if h]
            if hucre:
                ekle(dosya, 'tablo', hucre[0], ' · '.join(hucre[1:]), baglam, hucre[0])
        elif el.tag == 'li' and el.getparent() is not None and var(el.getparent(), 'zaman-cizelgesi'):
            t = el.xpath('.//*[contains(concat(" ",@class," ")," zc-tarih ")]'); bb = el.xpath('.//*[contains(concat(" ",@class," ")," zc-baslik ")]')
            m = el.xpath('.//*[contains(concat(" ",@class," ")," zc-metin ")]')
            b = (metin(t[0]) + ' · ' if t else '') + (metin(bb[0]) if bb else '')
            ekle(dosya, 'olay', b.strip(' ·'), metin(m[0]) if m else '', baglam, metin(m[0]) if m else b)
        elif var(el, 'cz-olay'):
            s = el.xpath('./strong'); m = el.xpath('./span')
            if s:
                ekle(dosya, 'olay', metin(s[0]), metin(m[0]) if m else '', baglam, metin(s[0]))
        elif var(el, 'accordion-header'):
            m = re.sub(r'\s*\(Görüntülemek için tıklayınız\)', '', metin(el))
            bas, _, guz = m.partition(' GÜZERGAH : ')
            ekle(dosya, 'bolum', bas.strip(), ('Güzergâh: ' + guz.strip()) if guz else '', baglam, metin(el))
        elif el.tag == 'li' and el.getparent() is not None and var(el.getparent(), 'bant-listesi'):
            s = el.xpath('.//strong'); a = el.xpath('.//*[contains(concat(" ",@class," ")," bant-aralik ")]')
            m = el.xpath('.//*[contains(concat(" ",@class," ")," bant-metin ")]')
            b = metin(s[0]) if s else (metin(a[0]) if a else '')
            ekle(dosya, 'kart', b, metin(m[0]) if m else '', baglam, b)

sayfa_bilgi = {d: [a, i] for d, a, i in SAYFALAR}
cikti = ('// Portal içi arama dizini (Ctrl+K). Üreten: _tools/arama/dizin_uret.py — sayfalar değişince yeniden çalıştırın.\n'
         '// Kayıt: [sayfa, tür, başlık, metin, bağlam, hedef]\n'
         'window.ARAMA_DIZIN = ' + json.dumps({'sayfalar': sayfa_bilgi, 'kayit': kayitlar}, ensure_ascii=False, separators=(',', ':')) + ';\n')
open(os.path.join('js', 'arama-dizin.js'), 'w', encoding='utf-8', newline='\n').write(cikti)
from collections import Counter
print('kayıt:', len(kayitlar), '· boyut:', round(len(cikti.encode('utf-8')) / 1024), 'KB')
print(Counter(k[1] for k in kayitlar))
