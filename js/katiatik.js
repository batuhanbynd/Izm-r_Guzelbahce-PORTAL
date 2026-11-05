// =============================================
// Katı Atık Yönetimi: grafik verileri
// Kaynak: Word raporu (Güzelbahçe atık toplama ve yönetimi; içme suyu, atık su ve katı atık altyapısı bölümleri)
// =============================================
document.addEventListener('DOMContentLoaded', function () {
    const KIS = '#60a5fa', YAZ = '#f59e0b';

    // 1. Atık karakterizasyonu (İzmir Entegre Atık Yönetim Planı, Ekim 2018), % (sıfır ve boş satırlar hariç)
    const bilesen = [
        ['Organik atıklar', 40.02, 44.71], ['Diğer yanabilir', 27.56, 15.91], ['Cam', 10.68, 11.90],
        ['Kağıt karton', 6.59, 8.30], ['Poşet', 5.93, 4.81], ['Plastikler', 2.59, 2.73],
        ['Metaller', 1.39, 1.65], ['Tehlikeli atıklar', 1.16, 1.29], ['Plastik', 0.90, 3.43],
        ['Kompozit', 0.52, 1.00], ['Tekstil', 0.45, 2.08]
    ];
    const ctxBilesen = getCtx('bilesenChart');
    if (ctxBilesen) new Chart(ctxBilesen, {
        type: 'bar',
        data: {
            labels: bilesen.map(b => b[0]),
            datasets: [
                { label: 'Kış', data: bilesen.map(b => b[1]), birim: 'yuzde', backgroundColor: KIS },
                { label: 'Yaz', data: bilesen.map(b => b[2]), birim: 'yuzde', backgroundColor: YAZ }
            ]
        },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: { datalabels: { display: true, anchor: 'end', align: 'end', font: { size: 10, weight: '600' }, formatter: (v) => formatYuzdeSabit(v, 2) } },
            scales: { x: yuzdeEkseni('Pay', { max: 50 }), y: kategoriEkseni }
        }
    });

    // 2. Biyobozunur ve ambalaj atığı payı (%)
    const ctxAmbalaj = getCtx('ambalajChart');
    if (ctxAmbalaj) new Chart(ctxAmbalaj, {
        type: 'bar',
        data: {
            labels: ['Biyobozunur', 'Ambalaj'],
            datasets: [
                { label: 'Kış', data: [40.02, 22.15], birim: 'yuzde', backgroundColor: KIS },
                { label: 'Yaz', data: [44.71, 28.01], birim: 'yuzde', backgroundColor: YAZ }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { datalabels: { display: true, formatter: (v) => formatYuzdeSabit(v, 2) } },
            scales: { y: yuzdeEkseni('Pay', { max: 55 }), x: kategoriEkseni }
        }
    });

    // 3. Günlük atık miktarı (ton/gün): Bakanlık planı ortalaması (doğrulanacak) ve 2026 hesabı
    const ctxGunluk = getCtx('gunlukChart');
    if (ctxGunluk) new Chart(ctxGunluk, {
        type: 'bar',
        data: {
            labels: [['Bakanlık planı', '2019-2020'], ['2026', 'ilk 8 ay bazlı']],
            datasets: [{ label: 'Günlük atık', data: [35, 46.09], birim: 'ton', backgroundColor: [NOTR_RENK.ikincil, '#fb923c'], barPercentage: 0.5 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, datalabels: { formatter: (v) => formatSayi(v) + ' ' + birimAdi('ton') } },
            scales: { y: degerEkseni('ton/gün', { grace: '20%' }), x: kategoriEkseni }
        }
    });

    // 4. Ayrı toplanan atıklar, 2022 (kg). Ambalaj atığı (420,470 ton) ölçek farkı nedeniyle ayrı kartta.
    const ctxAyri = getCtx('ayriChart');
    if (ctxAyri) new Chart(ctxAyri, {
        type: 'bar',
        data: {
            labels: ['Tekstil', 'Atık pil', 'Bitkisel atık yağ', 'Elektronik atık', 'Atık ilaç'],
            datasets: [{ label: 'Ayrı toplanan', data: [8990, 367, 331, 295, 115], birim: 'kg', backgroundColor: ['#f472b6', '#fbbf24', '#f59e0b', '#60a5fa', '#f87171'], barPercentage: 0.65 }]
        },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, datalabels: { formatter: (v) => formatSayi(v) + ' kg' } },
            scales: { x: degerEkseni('kg', { grace: '40%' }), y: kategoriEkseni }
        }
    });

    // 5. Temizlik İşleri araç filosu, 2022 (14 araç)
    const ctxFilo = getCtx('filoChart');
    if (ctxFilo) new Chart(ctxFilo, {
        type: 'doughnut',
        data: {
            labels: ['Çöp aracı', 'Süpürge aracı', 'Konteyner yıkama aracı', 'Kamyonet'],
            datasets: [{ data: [10, 2, 1, 1], birim: 'adet', backgroundColor: ['#fb923c', '#60a5fa', '#34d399', '#a78bfa'], hoverOffset: 6 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '58%',
            plugins: {
                legend: { position: 'bottom' },
                tooltip: tooltipPayConfig,
                datalabels: { color: '#f8fafc', anchor: 'center', align: 'center', font: { weight: '700', size: 13 }, formatter: (v) => v }
            }
        }
    });

    // 6. Temizlik personeli: 2018 (Sayıştay) ve 2022 (faaliyet raporu)
    const ctxPersonel = getCtx('personelChart');
    if (ctxPersonel) new Chart(ctxPersonel, {
        type: 'bar',
        data: {
            labels: ['2018', '2022'],
            datasets: [
                { label: 'Memur', data: [1, 2], birim: 'kisi', backgroundColor: '#a78bfa' },
                { label: 'Kadrolu işçi', data: [13, 13], birim: 'kisi', backgroundColor: '#60a5fa' },
                { label: 'Şirket işçisi / hizmet alımı', data: [30, 40], birim: 'kisi', backgroundColor: '#fb923c' }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { datalabels: { display: true, color: '#f8fafc', anchor: 'center', align: 'center', formatter: (v) => v } },
            scales: { x: { ...kategoriEkseni, stacked: true }, y: degerEkseni('Personel', { stacked: true, ticks: { precision: 0 } }) }
        }
    });

    // 7. Çöp aracı sayısı (2020 planı değeri doğrulanacak)
    const ctxArac = getCtx('aracChart');
    if (ctxArac) new Chart(ctxArac, {
        type: 'bar',
        data: {
            labels: ['2010', ['2020 planı', '(doğrulanacak)'], '2022'],
            datasets: [{ label: 'Çöp aracı', data: [7, 11, 10], birim: 'adet', backgroundColor: ['#fb923c', NOTR_RENK.ikincil, '#fb923c'], barPercentage: 0.5 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, datalabels: { formatter: (v) => v } },
            scales: { y: degerEkseni('Araç', { ticks: { precision: 0 }, grace: '20%' }), x: kategoriEkseni }
        }
    });

    // 8. Yıllık sistem maliyeti (TL)
    const ctxMaliyet = getCtx('maliyetChart');
    if (ctxMaliyet) new Chart(ctxMaliyet, {
        type: 'bar',
        data: {
            labels: [['Değerlemeye', 'esas tutar'], ['Toplam sistem maliyeti', '(yeniden değerleme sonrası)'], ['ÇTV payı', '(toplam)'], ['Net toplam', 'sistem maliyeti']],
            datasets: [{ label: 'Yıllık tutar', data: [54564972.00, 60845400.84, -7702130, 53143269], birim: 'tl', backgroundColor: [NOTR_RENK.ikincil, '#60a5fa', '#f87171', '#34d399'], barPercentage: 0.55 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, datalabels: { anchor: (c) => c.dataset.data[c.dataIndex] < 0 ? 'start' : 'end', align: (c) => c.dataset.data[c.dataIndex] < 0 ? 'start' : 'end', formatter: (v) => formatSayi(v) + ' TL' } },
            scales: { y: degerEkseni('TL', { grace: '15%' }), x: kategoriEkseni }
        }
    });

    // 9. Evsel katı atığın kaynaklara göre payı (%)
    const ctxKaynak = getCtx('kaynakPayChart');
    if (ctxKaynak) new Chart(ctxKaynak, {
        type: 'doughnut',
        data: {
            labels: ['Konutlar', 'İşyerleri', 'Diğer binalar (kamu, okul, sağlık)'],
            datasets: [{ data: [89, 7, 4], birim: 'yuzde', backgroundColor: ['#fb923c', '#60a5fa', '#a78bfa'], hoverOffset: 6 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '58%',
            plugins: {
                legend: { position: 'bottom' },
                tooltip: { callbacks: { label: (c) => c.label + ': ' + formatYuzde(c.raw, 0) } },
                datalabels: { color: '#f8fafc', anchor: 'center', align: 'center', font: { weight: '700', size: 13 }, formatter: (v) => formatYuzde(v, 0) }
            }
        }
    });

    // 10. Aylık ortalama toplama maliyeti (TL/ay)
    const ctxAylik = getCtx('aylikMaliyetChart');
    if (ctxAylik) new Chart(ctxAylik, {
        type: 'bar',
        data: {
            labels: [['Konut', '1,04 ton/yıl'], ['Konut dışı', '0,9 ton/yıl']],
            datasets: [{ label: 'Aylık ortalama maliyet', data: [273.75, 236], birim: 'tlay', backgroundColor: ['#fb923c', '#60a5fa'], barPercentage: 0.5 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, datalabels: { formatter: (v) => formatSayi(v) + ' ' + birimAdi('tlay') } },
            scales: { y: degerEkseni('TL/ay', { grace: '20%' }), x: kategoriEkseni }
        }
    });

    // 11. Katı atık tarifesi: 2022, 2023, 2026 (TL). 2026'da kırsal konut için ayrı kalem yok -> null
    const ctxTarife = getCtx('tarifeChart');
    if (ctxTarife) new Chart(ctxTarife, {
        type: 'bar',
        data: {
            labels: [['Mesken', '101-200 m²'], ['Mesken', '201-300 m²'], ['Mesken', '301 m² ve üzeri'], ['Kırsal konut', 'Yelki, Yaka, Atatürk köy içi'], ['Kırsal konut', 'Çamlı, Payamlı, Küçükkaya'], ['Şehit aileleri, gaziler,', 'engelli vatandaşlar']],
            datasets: [
                { label: '2022', data: [20.00, 28.57, 34.95, 13.00, 8.40, 1.00], birim: 'tl', backgroundColor: NOTR_RENK.ikincil },
                { label: '2023', data: [46.00, 70.00, 90.00, 18.00, 10.00, 1.00], birim: 'tl', backgroundColor: '#60a5fa' },
                { label: '2026', data: [150.00, 150.00, 150.00, null, null, 15.00], birim: 'tl', backgroundColor: '#fb923c' }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: degerEkseni('TL', { ticks: { callback: (v) => formatSayi(v) } }), x: kategoriEkseni }
        }
    });

    // 12. Tıbbi atık (kg): 2021 ve 2025
    const ctxTibbi = getCtx('tibbiChart');
    if (ctxTibbi) new Chart(ctxTibbi, {
        type: 'bar',
        data: {
            labels: ['2021', '2025'],
            datasets: [{ label: 'Tıbbi atık', data: [2298, 3840], birim: 'kg', backgroundColor: ['#fca5a5', '#f87171'], barPercentage: 0.5 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, datalabels: { formatter: (v) => formatSayi(v) + ' kg' } },
            scales: { y: degerEkseni('kg', { grace: '20%' }), x: kategoriEkseni }
        }
    });
});
