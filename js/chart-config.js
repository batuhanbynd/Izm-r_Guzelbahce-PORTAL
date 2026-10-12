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

Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = 'rgba(148, 163, 184, 0.12)';
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
Chart.defaults.elements.arc.borderColor = '#1e293b';
Chart.defaults.datasets.bar.maxBarThickness = 56;

Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.boxWidth = 8;
Chart.defaults.plugins.legend.labels.boxHeight = 8;
Chart.defaults.plugins.legend.labels.padding = 16;
Chart.defaults.plugins.legend.labels.color = '#cbd5e1';
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
    color: '#e2e8f0',
    font: { weight: '600', size: 11 },
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
        grid: { color: 'rgba(148, 163, 184, 0.12)' },
        border: { display: false },
        ticks: { callback: function(value) { return formatKisa(value); } },
        title: baslik ? { display: true, text: baslik, color: '#94a3b8', font: { size: 11 } } : { display: false }
    }, ek || {});
}

// Yüzde ekseni
function yuzdeEkseni(baslik, ek) {
    return degerEkseni(baslik, Object.assign({
        ticks: { callback: function(value) { return formatYuzde(value, 0); } }
    }, ek || {}));
}

// Kategori ekseni (aylar, yıllar, hatlar)
const kategoriEkseni = { grid: { display: false }, border: { color: 'rgba(148, 163, 184, 0.25)' } };

// Eski dosyalarla uyumluluk için
const yAxisConfig = degerEkseni();

// Helper: Güvenli canvas context alma
function getCtx(id) {
    const el = document.getElementById(id);
    return el ? el.getContext('2d') : null;
}
