// =============================================
// Atık Su ve Arıtma: grafik verileri
// Kaynak: "Güzelbahçe İçme Suyu, Atık Su ve Katı Atık Altyapısı" (Word raporu), 4. bölüm
// "(hesap)" değerleri kaynaktaki yıllık değerlerden raporda türetildi.
// =============================================
document.addEventListener('DOMContentLoaded', function () {
    const KAPASITE = 21600; // m³/gün
    const yillar = ['2019', '2022', '2024'];

    // 1. Günlük ortalama debi (hesap) ve kapasite
    const ctxDebi = getCtx('debiChart');
    if (ctxDebi) new Chart(ctxDebi, {
        type: 'bar',
        data: {
            labels: yillar,
            datasets: [
                { type: 'line', label: 'Kapasite', data: [KAPASITE, KAPASITE, KAPASITE], birim: 'm3gun', borderColor: '#f87171', backgroundColor: '#f87171', borderDash: [6, 4], pointRadius: 0, borderWidth: 2, order: 0 },
                { label: 'Günlük ortalama debi (hesap)', data: [23363, 20438, 21597], birim: 'm3gun', backgroundColor: MOD_RENK.su, barPercentage: 0.55, order: 1 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { datalabels: { display: (c) => c.dataset.type !== 'line', formatter: (v) => formatSayi(v) } },
            scales: { y: degerEkseni('m³/gün', { min: 0, grace: '12%' }), x: kategoriEkseni }
        }
    });

    // 2. Kapasiteye oran (hesap)
    const oranlar = [108.2, 94.6, 100.0];
    const ctxOran = getCtx('oranChart');
    if (ctxOran) new Chart(ctxOran, {
        type: 'bar',
        data: {
            labels: yillar,
            datasets: [{ label: 'Kapasiteye oran (hesap)', data: oranlar, birim: 'yuzde', backgroundColor: oranlar.map(o => o >= 100 ? '#f87171' : '#34d399'), barPercentage: 0.55 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, datalabels: { formatter: (v) => formatYuzde(v, 1) } },
            scales: { y: yuzdeEkseni('Kapasiteye oran', { min: 0, max: 120 }), x: kategoriEkseni }
        }
    });

    // 3. 75. Yıl Cumhuriyet Bulvarı: döşenen hat (m)
    const ctxHat = getCtx('hatChart');
    if (ctxHat) new Chart(ctxHat, {
        type: 'bar',
        data: {
            labels: ['Atık su hattı', 'Yağmur suyu hattı'],
            datasets: [{ label: 'Döşenen hat', data: [1808, 3158], birim: 'metre', backgroundColor: ['#0f766e', '#7dd3fc'], barPercentage: 0.55 }]
        },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, datalabels: { formatter: (v) => formatSayi(v) + ' m' } },
            scales: { x: degerEkseni('m', { grace: '25%' }), y: kategoriEkseni }
        }
    });

    // 4. Yatırımın dağılımı (milyon TL): toplam 87,35
    const ctxYatirim = getCtx('yatirimChart');
    if (ctxYatirim) new Chart(ctxYatirim, {
        type: 'doughnut',
        data: {
            labels: ['İBB Fen İşleri Dairesi', 'İZSU'],
            datasets: [{ data: [51.75, 35.6], birim: 'mnTL', backgroundColor: ['#fb923c', MOD_RENK.su], hoverOffset: 6 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '58%',
            plugins: {
                legend: { position: 'bottom' },
                tooltip: tooltipPayConfig,
                datalabels: { color: '#f8fafc', anchor: 'center', align: 'center', font: { weight: '700', size: 13 }, formatter: (v) => formatSayi(v) + ' ' + birimAdi('mnTL') }
            }
        }
    });

    // 5. Körfez izleme, Pina Restoran Açığı, 2024 (cfu/100 ml)
    const aylar = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const ctxKorfez = getCtx('korfezChart');
    if (ctxKorfez) new Chart(ctxKorfez, {
        type: 'bar',
        data: {
            labels: aylar,
            datasets: [
                { label: 'E. coli', data: [210, 40, 4, 2, 10, 2, 60, 2, 80, 1, 2, 500], birim: 'cfu', backgroundColor: '#f472b6' },
                { label: 'İntestinal enterokok', data: [0, 25, 1, 5, 0, 0, 10, 1, 20, 0, 4, 200], birim: 'cfu', backgroundColor: '#a78bfa' }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: degerEkseni('cfu/100 ml', { ticks: { callback: (v) => formatSayi(v) } }), x: kategoriEkseni }
        }
    });
});
