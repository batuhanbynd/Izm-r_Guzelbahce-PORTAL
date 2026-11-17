// =============================================
// Ekonomik Yapı: grafik verileri
// Kaynak: araştırma grubunun "Economic Structure of Güzelbahçe" raporu (Word) ve
// "Physical Structure, Natural and Environmental Resources" raporundaki arazi grafikleri.
// Değerler kaynaktaki yazımıyla girilmiştir; "(hesap)" olanlar kaynaktaki sayılardan türetildi.
// =============================================
document.addEventListener('DOMContentLoaded', function () {
    const YESIL = '#34d399', MAVI = '#60a5fa', AMBER = '#f59e0b', TURUNCU = '#fb923c', MOR = '#a78bfa', PEMBE = '#f472b6';

    // Halka grafiklerde dilim etiketi: yüzde
    const dilimYuzde = {
        display: true, color: '#0b1220', anchor: 'center', align: 'center', font: { weight: '800', size: 12 },
        formatter: (v) => formatYuzde(v, 1)
    };

    // 1. İzmir işgücü göstergeleri (TÜİK)
    const ctxIsgucu = getCtx('isgucuChart');
    if (ctxIsgucu) new Chart(ctxIsgucu, {
        type: 'bar',
        data: {
            labels: ['İşgücüne katılım oranı', 'İstihdam oranı', 'İşsizlik oranı'],
            datasets: [{ label: 'İzmir', data: [54.2, 49.5, 8.7], birim: 'yuzde', backgroundColor: [MAVI, YESIL, '#f87171'], barPercentage: 0.6 }]
        },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, datalabels: { formatter: (v) => formatYuzde(v, 1) } },
            scales: { x: yuzdeEkseni('', { min: 0, max: 70 }), y: kategoriEkseni }
        }
    });

    // 2. Sağlık kuruluşları: 18 kamu, 56 özel (toplam 74)
    const ctxSaglik = getCtx('saglikChart');
    if (ctxSaglik) new Chart(ctxSaglik, {
        type: 'doughnut',
        data: {
            labels: ['Özel', 'Kamu'],
            datasets: [{ data: [56, 18], birim: 'adet', backgroundColor: [MOR, MAVI], hoverOffset: 6 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '58%',
            plugins: {
                legend: { position: 'bottom' },
                tooltip: tooltipPayConfig,
                datalabels: { display: true, color: '#0b1220', anchor: 'center', align: 'center', font: { weight: '800', size: 13 }, formatter: (v) => formatSayi(v) }
            }
        }
    });

    // 3. İzmir'de sektörlere göre istihdam, 2023 (sanayi ve hizmetler kaynakta "yaklaşık")
    const ctxIstihdam = getCtx('istihdamChart');
    if (ctxIstihdam) new Chart(ctxIstihdam, {
        type: 'doughnut',
        data: {
            labels: ['Hizmetler (yaklaşık)', 'Sanayi (yaklaşık)', 'Tarım'],
            datasets: [{ data: [61, 33, 6.3], birim: 'yuzde', backgroundColor: [MAVI, TURUNCU, YESIL], hoverOffset: 6 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '56%',
            plugins: {
                legend: { position: 'bottom' },
                tooltip: { callbacks: { label: (c) => c.label + ': ' + formatYuzde(c.parsed, 1) } },
                datalabels: dilimYuzde
            }
        }
    });

    // 4. İmalat tesisleri (Güzelbahçe Belediyesi, 2022)
    const ctxImalat = getCtx('imalatChart');
    if (ctxImalat) new Chart(ctxImalat, {
        type: 'bar',
        data: {
            labels: ['Gıda', 'Mobilya', 'Metal, demir-çelik', 'Mermer, granit', 'Diğer'],
            datasets: [{ label: 'Tesis sayısı', data: [4, 3, 2, 2, 1], birim: 'adet', backgroundColor: [AMBER, TURUNCU, '#a1a1aa', '#d4d4d8', '#71717a'], barPercentage: 0.6 }]
        },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (c) => formatSayi(c.parsed.x) + ' ' + birimAdi('adet') + ' (' + formatYuzde(c.parsed.x / 13 * 100, 1) + ')' } },
                datalabels: { formatter: (v) => formatSayi(v) }
            },
            scales: { x: degerEkseni('', { grace: '15%', ticks: { stepSize: 1 } }), y: kategoriEkseni }
        }
    });

    // 5. Tarım alanının dağılımı, 2023 (dekar) · toplam 9.190,3
    const tarimEtiket = ['Meyve, içecek ve baharat bitkileri', 'Nadas', 'Tahıllar ve diğer bitkisel ürünler', 'Sebze', 'Süs bitkileri'];
    const tarimDekar = [7131, 1248, 444, 313, 53];
    const tarimPay = [77.6, 13.6, 4.8, 3.4, 0.6];
    const ctxTarim = getCtx('tarimAlanChart');
    if (ctxTarim) new Chart(ctxTarim, {
        type: 'bar',
        data: {
            labels: tarimEtiket,
            datasets: [{ label: 'Alan', data: tarimDekar, birim: 'dekar', backgroundColor: [YESIL, '#fbbf24', '#d9f99d', '#22c55e', PEMBE], barPercentage: 0.65 }]
        },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (c) => formatSayi(c.parsed.x) + ' ' + birimAdi('dekar') + ' (' + formatYuzde(tarimPay[c.dataIndex], 1) + ')' } },
                datalabels: { formatter: (v, c) => formatSayi(v) + ' · ' + formatYuzde(tarimPay[c.dataIndex], 1) }
            },
            scales: { x: degerEkseni('dekar', { grace: '22%' }), y: kategoriEkseni }
        }
    });

    // 6. İlçe arazisinin dağılımı (Tarım ve Orman Bakanlığı, 2024)
    const ctxArazi = getCtx('araziChart');
    if (ctxArazi) new Chart(ctxArazi, {
        type: 'doughnut',
        data: {
            labels: ['Orman ve ağaçlık alanlar', 'Yerleşim, altyapı ve diğer', 'Tarım alanları'],
            datasets: [{ data: [50, 25, 25], birim: 'yuzde', backgroundColor: ['#15803d', '#a1a1aa', '#fbbf24'], hoverOffset: 6 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '56%',
            plugins: {
                legend: { position: 'bottom' },
                tooltip: { callbacks: { label: (c) => c.label + ': ' + formatYuzde(c.parsed, 0) } },
                datalabels: Object.assign({}, dilimYuzde, { formatter: (v) => formatYuzde(v, 0) })
            }
        }
    });

    // 7. Tarım arazisinin kullanımı (Tarım ve Orman Bakanlığı, 2024)
    const ctxKullanim = getCtx('tarimKullanimChart');
    if (ctxKullanim) new Chart(ctxKullanim, {
        type: 'doughnut',
        data: {
            labels: ['Zeytinlik', 'Narenciye (mandalina, limon)'],
            datasets: [{ data: [60, 40], birim: 'yuzde', backgroundColor: ['#84cc16', '#fb923c'], hoverOffset: 6 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '56%',
            plugins: {
                legend: { position: 'bottom' },
                tooltip: { callbacks: { label: (c) => c.label + ': ' + formatYuzde(c.parsed, 0) } },
                datalabels: Object.assign({}, dilimYuzde, { formatter: (v) => formatYuzde(v, 0) })
            }
        }
    });

    // 8. Balıkçılık, 2024: Güzelbahçe'nin İzmir içindeki payı (hesap)
    const balik = [
        { ad: 'Balıkçı teknesi', ilce: 217, il: 1738 },
        { ad: 'Balık çiftliği', ilce: 13, il: 102 }
    ];
    const ctxBalik = getCtx('balikPayChart');
    if (ctxBalik) new Chart(ctxBalik, {
        type: 'bar',
        data: {
            labels: balik.map(b => b.ad),
            datasets: [{ label: 'İzmir içindeki pay (hesap)', data: balik.map(b => b.ilce / b.il * 100), birim: 'yuzde', backgroundColor: ['#38bdf8', '#0ea5e9'], barPercentage: 0.55 }]
        },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (c) => formatYuzde(c.parsed.x, 1) + ' · ' + formatSayi(balik[c.dataIndex].ilce) + ' / ' + formatSayi(balik[c.dataIndex].il) } },
                datalabels: { formatter: (v, c) => formatYuzde(v, 1) + '  (' + formatSayi(balik[c.dataIndex].ilce) + ' / ' + formatSayi(balik[c.dataIndex].il) + ')' }
            },
            scales: { x: yuzdeEkseni('', { min: 0, max: 25 }), y: kategoriEkseni }
        }
    });

    // 9. Konaklama kapasitesi, 2023 (kişi) · toplam 110
    const ctxKonak = getCtx('konaklamaChart');
    if (ctxKonak) new Chart(ctxKonak, {
        type: 'bar',
        data: {
            labels: ['Kahramandere', 'Maltepe', 'Yaka', 'Küçükkaya'],
            datasets: [{ label: 'Konaklama kapasitesi', data: [43, 30, 30, 7], birim: 'kisi', backgroundColor: PEMBE, barPercentage: 0.55 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, datalabels: { formatter: (v) => formatSayi(v) } },
            scales: { y: degerEkseni('kişi', { grace: '15%' }), x: kategoriEkseni }
        }
    });
});
