// =============================================
// Chart.js Ortak Konfigürasyon
// Tüm grafikler aynı renk, sayı biçimi ve etkileşim kurallarını buradan alır.
// Bu dosya yalnızca GÖRÜNÜMÜ belirler; grafik verileri her sayfanın kendi dosyasındadır.
// =============================================

// Accordion Toggle Function
function toggleAccordion(header) {
    const item = header.parentElement;
    const content = item.querySelector('.accordion-content');

    if (item.classList.contains('active')) {
        item.classList.remove('active');
        content.style.maxHeight = null;
        header.setAttribute('aria-expanded', 'false');
    } else {
        item.classList.add('active');
        content.style.maxHeight = content.scrollHeight + "px";
        header.setAttribute('aria-expanded', 'true');
    }
}

// ---------------------------------------------
// Ulaşım modu renkleri: aynı mod her sayfada aynı renkte görünür
// ---------------------------------------------
const MOD_RENK = {
    eshot: '#f472b6',
    metro: '#818cf8',
    izban: '#fbbf24',
    vapur: '#38bdf8',
    tramvayKonak: '#34d399',
    tramvayKarsiyaka: '#10b981',
    havalimani: '#a78bfa',
    karayolu: '#fb923c',
    su: '#0ea5e9'
};

// Karşılaştırma için nötr renkler (önceki yıl, kapasite, "diğer" vb.)
const NOTR_RENK = {
    onceki: '#64748b',
    ikincil: '#94a3b8',
    zayif: 'rgba(148, 163, 184, 0.35)'
};

// Renge saydamlık ekler: renkSaydam('#818cf8', 0.5)
function renkSaydam(hex, alfa) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alfa})`;
}

// ---------------------------------------------
// Türkçe sayı biçimleri
// ---------------------------------------------
function formatSayi(deger, basamak) {
    if (deger === null || deger === undefined || isNaN(deger)) return '–';
    const opt = basamak === undefined ? {} : { minimumFractionDigits: basamak, maximumFractionDigits: basamak };
    return Number(deger).toLocaleString('tr-TR', opt);
}

// Eksen ve etiketler için kısa gösterim: 1,5 milyon · 840 bin
function formatKisa(deger) {
    if (deger === null || deger === undefined || isNaN(deger)) return '';
    const mutlak = Math.abs(deger);
    if (mutlak >= 1e6) return (deger / 1e6).toLocaleString('tr-TR', { maximumFractionDigits: 1 }) + ' mn';
    if (mutlak >= 1e3) return (deger / 1e3).toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' bin';
    return deger.toLocaleString('tr-TR', { maximumFractionDigits: 1 });
}

// Yüzde, Türkçe yazımla: %7,5
function formatYuzde(deger, basamak) {
    if (deger === null || deger === undefined || isNaN(deger)) return '–';
    const b = basamak === undefined ? 1 : basamak;
    return '%' + Number(deger).toLocaleString('tr-TR', { maximumFractionDigits: b });
}

// Veri setinin "birim" alanına göre değeri yazar.
// birim: 'yuzde' | 'yolcu' | 'tasit' | 'm3' | undefined
function formatBirimli(deger, birim) {
    switch (birim) {
        case 'yuzde': return formatYuzde(deger);
        case 'yolcu': return formatSayi(deger) + ' yolcu';
        case 'tasit': return formatSayi(deger) + ' taşıt/gün';
        case 'm3': return formatSayi(deger, 3) + ' milyon m³';
        case 'adet': return formatSayi(deger) + ' adet';
        default: return formatSayi(deger);
    }
}

// Grafiğin değer eksenindeki sayıyı döndürür (yatay grafiklerde x, dikeyde y)
function grafikDegeri(ctx) {
    if (ctx.chart.config.type === 'doughnut' || ctx.chart.config.type === 'pie' || ctx.chart.config.type === 'polarArea') {
        return ctx.parsed;
    }
    return ctx.chart.options.indexAxis === 'y' ? ctx.parsed.x : ctx.parsed.y;
}

// ---------------------------------------------
// Genel görünüm
// ---------------------------------------------
const AZ_HAREKET = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Grafik çevresi renkleri (yazı, ızgara, kenar). Grafikler koyu tema renkleriyle tanımlanır;
// açık temada aşağıdaki eşleme ile açık tema karşılıklarına çevrilir.
const GRAFIK_TEMA = {
    koyu: { metin: '#a3b1c6', lejant: '#cbd5e1', etiket: '#e2e8f0', izgara: 'rgba(148, 163, 184, 0.14)', kenar: 'rgba(148, 163, 184, 0.28)', dilim: '#131c2f', cizgi: 'rgba(248, 250, 252, 0.7)' },
    acik: { metin: '#4b5a70', lejant: '#334155', etiket: '#1e293b', izgara: 'rgba(15, 23, 42, 0.09)', kenar: 'rgba(15, 23, 42, 0.22)', dilim: '#ffffff', cizgi: 'rgba(15, 23, 42, 0.6)' }
};

// Koyu → açık renk karşılıkları (yalnızca nötr renkler; veri renkleri değişmez)
const ACIK_KARSILIK = {
    '#94a3b8': '#4b5a70',
    '#a3b1c6': '#4b5a70',
    '#cbd5e1': '#334155',
    '#e2e8f0': '#1e293b',
    '#1e293b': '#ffffff',
    '#131c2f': '#ffffff',
    '#0f172a': '#ffffff',
    'rgba(148,163,184,0.12)': 'rgba(15, 23, 42, 0.09)',
    'rgba(148,163,184,0.14)': 'rgba(15, 23, 42, 0.09)',
    'rgba(148,163,184,0.2)': 'rgba(100, 116, 139, 0.3)',
    'rgba(148,163,184,0.25)': 'rgba(15, 23, 42, 0.22)',
    'rgba(148,163,184,0.28)': 'rgba(15, 23, 42, 0.22)',
    'rgba(248,250,252,0.7)': 'rgba(15, 23, 42, 0.6)'
};

function aktifTema() {
    return document.documentElement.getAttribute('data-tema') === 'acik' ? 'acik' : 'koyu';
}

// Özel çizimler (ör. kapasite çizgisi) için o anki temanın rengi
function temaRengi(ad) {
    return GRAFIK_TEMA[aktifTema()][ad];
}

Chart.defaults.color = GRAFIK_TEMA.koyu.metin;
Chart.defaults.borderColor = GRAFIK_TEMA.koyu.izgara;
Chart.defaults.font.family = "'Outfit', sans-serif";
Chart.defaults.font.size = 12;

// Sakin, kısa açılış animasyonu; hareket azaltma tercihinde kapalı
Chart.defaults.animation.duration = AZ_HAREKET ? 0 : 450;
Chart.defaults.animation.easing = 'easeOutCubic';
Chart.defaults.transitions.active.animation.duration = AZ_HAREKET ? 0 : 150;

Chart.defaults.elements.bar.borderRadius = 3;
Chart.defaults.elements.bar.borderSkipped = 'start';
Chart.defaults.elements.line.borderWidth = 2.5;
Chart.defaults.elements.line.tension = 0;
Chart.defaults.elements.point.radius = 3.5;
Chart.defaults.elements.point.hoverRadius = 5.5;
Chart.defaults.elements.point.borderWidth = 2;
Chart.defaults.elements.arc.borderWidth = 2;
Chart.defaults.elements.arc.borderColor = GRAFIK_TEMA.koyu.dilim;
Chart.defaults.datasets.bar.maxBarThickness = 56;

Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.boxWidth = 8;
Chart.defaults.plugins.legend.labels.boxHeight = 8;
Chart.defaults.plugins.legend.labels.padding = 16;
Chart.defaults.plugins.legend.labels.color = GRAFIK_TEMA.koyu.lejant;
Chart.defaults.plugins.legend.align = 'start';

// ---------------------------------------------
// Bilgi kutusu (tooltip)
// ---------------------------------------------
const tooltipConfig = {
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    titleColor: '#f8fafc',
    bodyColor: '#e2e8f0',
    borderColor: 'rgba(148, 163, 184, 0.25)',
    borderWidth: 1,
    padding: 12,
    boxPadding: 6,
    cornerRadius: 6,
    titleFont: { weight: '600' },
    callbacks: {
        label: function(context) {
            const deger = grafikDegeri(context);
            if (deger === null || deger === undefined) return null;
            const ad = context.dataset.label || context.label || '';
            return (ad ? ad + ': ' : '') + formatBirimli(deger, context.dataset.birim);
        }
    }
};

// Pasta/halka grafiklerde değer + toplam içindeki pay
const tooltipPayConfig = {
    ...tooltipConfig,
    callbacks: {
        label: function(context) {
            const toplam = context.dataset.data.reduce((a, b) => a + Number(b), 0);
            const pay = (context.parsed / toplam) * 100;
            return context.label + ': ' + formatBirimli(context.parsed, context.dataset.birim) + ' (' + formatYuzde(pay) + ')';
        }
    }
};
(function() {
    const { callbacks, ...gorunum } = tooltipConfig;
    Object.assign(Chart.defaults.plugins.tooltip, gorunum);
    Chart.defaults.plugins.tooltip.callbacks.label = callbacks.label;
})();

// ---------------------------------------------
// Veri etiketleri: yalnızca az sayıda çubuk varken gösterilir,
// kalabalık grafiklerde değerler bilgi kutusunda okunur.
// ---------------------------------------------
Chart.register(ChartDataLabels);
Chart.defaults.set('plugins.datalabels', {
    display: function(ctx) {
        const tip = ctx.chart.config.type;
        if (tip === 'doughnut' || tip === 'pie' || tip === 'polarArea' || tip === 'line') return false;
        const gorunur = ctx.chart.data.datasets.filter((d, i) => ctx.chart.isDatasetVisible(i)).length;
        return ctx.chart.data.labels.length * gorunur <= 8 ? 'auto' : false;
    },
    color: GRAFIK_TEMA.koyu.etiket,
    font: { weight: '600', size: 12 },
    anchor: 'end',
    align: 'end',
    offset: 2,
    clamp: true,
    formatter: function(value, ctx) {
        if (value === null || value === undefined) return '';
        if (ctx.dataset.birim === 'yuzde') return formatYuzde(value);
        return formatKisa(value);
    }
});

// ---------------------------------------------
// Eksenler
// ---------------------------------------------
// Sayısal eksen: sıfırdan başlar, kısa Türkçe gösterim, isteğe bağlı başlık
function degerEkseni(baslik, ek) {
    return Object.assign({
        beginAtZero: true,
        grid: { color: GRAFIK_TEMA.koyu.izgara },
        border: { display: false },
        ticks: { callback: function(value) { return formatKisa(value); } },
        title: baslik ? { display: true, text: baslik, color: GRAFIK_TEMA.koyu.metin, font: { size: 12 } } : { display: false }
    }, ek || {});
}

// Yüzde ekseni
function yuzdeEkseni(baslik, ek) {
    return degerEkseni(baslik, Object.assign({
        ticks: { callback: function(value) { return formatYuzde(value, 0); } }
    }, ek || {}));
}

// Kategori ekseni (aylar, yıllar, hatlar)
const kategoriEkseni = { grid: { display: false }, border: { color: GRAFIK_TEMA.koyu.kenar } };

// Eski dosyalarla uyumluluk için
const yAxisConfig = degerEkseni();

// Helper: Güvenli canvas context alma
function getCtx(id) {
    const el = document.getElementById(id);
    return el ? el.getContext('2d') : null;
}

// ---------------------------------------------
// Tema geçişi
// Grafik ayarlarındaki nötr renkler açık temada karşılıklarıyla değiştirilir;
// değişen her alan kaydedilir, koyu temaya dönüşte aynen geri yazılır.
// ---------------------------------------------
function renkAnahtari(deger) {
    return String(deger).toLowerCase().replace(/\s+/g, '');
}

function acikTemayaCevir(nesne, kayit, gorulen) {
    if (!nesne || typeof nesne !== 'object' || gorulen.has(nesne)) return;
    gorulen.add(nesne);
    Object.keys(nesne).forEach(function (anahtar) {
        const deger = nesne[anahtar];
        if (typeof deger === 'string') {
            const karsilik = ACIK_KARSILIK[renkAnahtari(deger)];
            if (karsilik) {
                kayit.push([nesne, anahtar, deger]);
                nesne[anahtar] = karsilik;
            }
        } else if (deger && typeof deger === 'object' && !(deger instanceof Node) && anahtar.charAt(0) !== '_' && anahtar.charAt(0) !== '$') {
            acikTemayaCevir(deger, kayit, gorulen);
        }
    });
}

function grafigeTemaUygula(chart, tema) {
    if (tema === 'acik') {
        if (chart.$temaKaydi) return;
        chart.$temaKaydi = [];
        const gorulen = new WeakSet();
        acikTemayaCevir(chart.config.options, chart.$temaKaydi, gorulen);
        (chart.config.data.datasets || []).forEach(function (ds) {
            acikTemayaCevir(ds, chart.$temaKaydi, gorulen);
        });
    } else if (chart.$temaKaydi) {
        chart.$temaKaydi.forEach(function (k) { k[0][k[1]] = k[2]; });
        chart.$temaKaydi = null;
    }
}

function varsayilanlariAyarla(tema) {
    const r = GRAFIK_TEMA[tema];
    Chart.defaults.color = r.metin;
    Chart.defaults.borderColor = r.izgara;
    Chart.defaults.elements.arc.borderColor = r.dilim;
    Chart.defaults.plugins.legend.labels.color = r.lejant;
    Chart.defaults.plugins.datalabels.color = r.etiket;
}

varsayilanlariAyarla(aktifTema());

window.addEventListener('temadegisti', function () {
    const tema = aktifTema();
    varsayilanlariAyarla(tema);
    Object.values(Chart.instances).forEach(function (chart) {
        grafigeTemaUygula(chart, tema);
        chart.update('none');
    });
});

// ---------------------------------------------
// Erişilebilirlik: her grafiğe metin karşılığı ve açılır veri tablosu
// Tablo, grafiğe verilen değerlerin aynısını yuvarlamadan gösterir.
// ---------------------------------------------
const BIRIM_ADI = { yolcu: 'yolcu', tasit: 'taşıt/gün', m3: 'milyon m³', adet: 'adet', yuzde: '%' };

function grafikBasligi(chart) {
    const kap = chart.canvas.closest('.card, .chart-card, .info-card, .galeri-karti');
    const b = kap && kap.querySelector('h2, h3');
    return b ? b.textContent.replace(/\s+/g, ' ').trim() : 'Grafik';
}

function etiketMetni(etiket) {
    return Array.isArray(etiket) ? etiket.join(' ') : String(etiket);
}

function tabloDegeri(deger, birim) {
    if (Array.isArray(deger)) return deger.map(function (d) { return tabloDegeri(d, birim); }).join(' – ');
    if (deger === null || deger === undefined || deger === '' || isNaN(Number(deger))) return '–';
    const metin = Number(deger).toLocaleString('tr-TR', { maximumFractionDigits: 6 });
    return birim === 'yuzde' ? '%' + metin : metin;
}

function hucre(etiket, metin, ozellik) {
    const el = document.createElement(etiket);
    if (ozellik) Object.keys(ozellik).forEach(function (k) { el.setAttribute(k, ozellik[k]); });
    el.textContent = metin;
    return el;
}

function veriTablosunuYaz(chart) {
    const veri = chart.data;
    const imza = JSON.stringify([veri.labels, (veri.datasets || []).map(function (d) { return [d.label, d.data]; })]);
    if (chart.$tabloImza === imza) return;
    chart.$tabloImza = imza;

    const baslik = grafikBasligi(chart);
    const canvas = chart.canvas;
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', baslik + ' grafiği. Değerler grafiğin altındaki veri tablosundadır.');

    let kutu = chart.$tabloKutusu;
    if (!kutu) {
        kutu = document.createElement('details');
        kutu.className = 'grafik-tablo';
        kutu.appendChild(hucre('summary', 'Verileri tablo olarak göster'));
        const kaydir = document.createElement('div');
        kaydir.className = 'tablo-kaydir';
        kutu.appendChild(kaydir);
        canvas.parentElement.insertAdjacentElement('afterend', kutu);
        chart.$tabloKutusu = kutu;
    }

    const tablo = document.createElement('table');
    tablo.appendChild(hucre('caption', baslik, { class: 'ekran-okuyucu' }));

    const pasta = ['doughnut', 'pie', 'polarArea'].indexOf(chart.config.type) !== -1;
    const eksen = chart.options.indexAxis === 'y' ? 'y' : 'x';
    const eksenAyari = chart.options.scales && chart.options.scales[eksen];
    const ilkSutun = !pasta && eksenAyari && eksenAyari.title && eksenAyari.title.display && eksenAyari.title.text
        ? eksenAyari.title.text : 'Kategori';

    const ust = document.createElement('thead');
    const ustSatir = document.createElement('tr');
    ustSatir.appendChild(hucre('th', ilkSutun, { scope: 'col' }));
    veri.datasets.forEach(function (ds) {
        const birim = BIRIM_ADI[ds.birim];
        ustSatir.appendChild(hucre('th', (ds.label || 'Değer') + (birim ? ' (' + birim + ')' : ''), { scope: 'col' }));
    });
    ust.appendChild(ustSatir);
    tablo.appendChild(ust);

    const govde = document.createElement('tbody');
    (veri.labels || []).forEach(function (etiket, i) {
        const satir = document.createElement('tr');
        satir.appendChild(hucre('th', etiketMetni(etiket), { scope: 'row' }));
        veri.datasets.forEach(function (ds) {
            satir.appendChild(hucre('td', tabloDegeri(ds.data[i], ds.birim)));
        });
        govde.appendChild(satir);
    });
    tablo.appendChild(govde);

    const kaydir = kutu.querySelector('.tablo-kaydir');
    kaydir.textContent = '';
    kaydir.appendChild(tablo);
}

Chart.register({
    id: 'erisilebilirGrafik',
    beforeInit: function (chart) {
        if (aktifTema() === 'acik') grafigeTemaUygula(chart, 'acik');
    },
    afterUpdate: function (chart) {
        veriTablosunuYaz(chart);
    }
});
