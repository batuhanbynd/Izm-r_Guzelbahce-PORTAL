// =============================================
// Havza ve Koruma Alanları: grafik verileri
// Kaynak: araştırma grubunun "Conservation Areas and Watershed Protection Areas" ve
// "Physical Structure, Natural and Environmental Resources" raporlarındaki tablolar (değerler aynen).
// "(hesap)" olanlar kaynaktaki sayılardan türetildi.
// =============================================
document.addEventListener('DOMContentLoaded', function () {
    const IYI = '#34d399', ORTA = '#facc15', ZAYIF = '#fb923c', KOTU = '#f87171', KURU = '#a1a1aa', YOK = 'rgba(148, 163, 184, 0.35)';

    // 1. Havza alanının illere dağılımı (km²)
    const iller = [
        { ad: 'İzmir', alan: 6640.898, pay: 95.3 },
        { ad: 'Aydın', alan: 267.49, pay: 3.8 },
        { ad: 'Manisa', alan: 58.298, pay: 0.8 }
    ];
    const ctxIl = getCtx('havzaIlChart');
    if (ctxIl) new Chart(ctxIl, {
        type: 'doughnut',
        data: {
            labels: iller.map(i => i.ad),
            datasets: [{ data: iller.map(i => i.alan), birim: 'km2', backgroundColor: ['#38bdf8', '#a78bfa', '#fbbf24'], hoverOffset: 6 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '58%',
            plugins: {
                legend: { position: 'right' },
                tooltip: { callbacks: { label: (c) => c.label + ': ' + formatSayi(c.parsed) + ' km² (' + formatYuzde(iller[c.dataIndex].pay, 1) + ')' } },
                datalabels: { display: (c) => c.dataIndex === 0, color: '#0b1220', font: { weight: '800', size: 13 }, formatter: (v, c) => formatYuzde(iller[c.dataIndex].pay, 1) }
            }
        }
    });

    // 2. Yüzey su kütlelerinin durumu (55 kütle; SYGM, 2018)
    const ctxYuzey = getCtx('yuzeySuChart');
    if (ctxYuzey) new Chart(ctxYuzey, {
        type: 'bar',
        data: {
            labels: ['Kimyasal durum', 'Ekolojik durum', 'Nihai durum'],
            datasets: [
                { label: 'İyi / geçti', data: [6, 4, null], birim: 'kutle', backgroundColor: IYI },
                { label: 'Orta', data: [null, 14, 18], birim: 'kutle', backgroundColor: ORTA },
                { label: 'Zayıf', data: [null, 5, 5], birim: 'kutle', backgroundColor: ZAYIF },
                { label: 'Kötü / kaldı', data: [38, 21, 21], birim: 'kutle', backgroundColor: KOTU },
                { label: 'Kuru', data: [9, 9, 9], birim: 'kutle', backgroundColor: KURU },
                { label: 'İzleme yok', data: [2, 2, 2], birim: 'kutle', backgroundColor: YOK }
            ]
        },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                datalabels: { display: (c) => (c.dataset.data[c.dataIndex] || 0) >= 4, color: '#0b1220', anchor: 'center', align: 'center', font: { weight: '700', size: 11 }, formatter: (v) => formatSayi(v) }
            },
            scales: {
                x: degerEkseni('Su kütlesi sayısı', { stacked: true, max: 55, ticks: { stepSize: 5 } }),
                y: Object.assign({}, kategoriEkseni, { stacked: true })
            }
        }
    });

    // 3. Yeraltı suyu kütlelerinde risk (42 kütle)
    const ctxYeralti = getCtx('yeraltiChart');
    if (ctxYeralti) new Chart(ctxYeralti, {
        type: 'bar',
        data: {
            labels: ['Risk yok', 'Potansiyel risk', 'Riskte'],
            datasets: [
                { label: 'Miktar bakımından', data: [24, 3, 15], birim: 'kutle', backgroundColor: '#38bdf8' },
                { label: 'Kalite bakımından', data: [3, 6, 33], birim: 'kutle', backgroundColor: '#f87171' }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' }, datalabels: { formatter: (v) => formatSayi(v) } },
            scales: { y: degerEkseni('Su kütlesi sayısı', { grace: '12%' }), x: kategoriEkseni }
        }
    });

    // 4. Birinci sınıf tarım arazisi, 1957 ve 2005 (ha)
    const ctxBirinci = getCtx('birinciSinifChart');
    if (ctxBirinci) new Chart(ctxBirinci, {
        type: 'bar',
        data: {
            labels: ['1957', '2005'],
            datasets: [{ label: '1. sınıf tarım arazisi', data: [1753.1, 989.6], birim: 'ha', backgroundColor: ['#f59e0b', '#f87171'], barPercentage: 0.5 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, datalabels: { formatter: (v) => formatSayi(v, 1) + ' ha' } },
            scales: { y: degerEkseni('ha', { grace: '15%' }), x: kategoriEkseni }
        }
    });

    // 5. Diğer arazi kullanımlarının alanı, 1957–2005 (ha); "-" olan yıllar boş bırakıldı
    const ctxDegisim = getCtx('kullanimDegisimChart');
    if (ctxDegisim) new Chart(ctxDegisim, {
        type: 'line',
        data: {
            labels: ['1957', '1976', '1995', '2005'],
            datasets: [
                { label: 'Yerleşim', data: [104.7, 535.2, 1304.6, 1694.5], birim: 'ha', borderColor: '#f87171', backgroundColor: '#f87171' },
                { label: 'Otoyol', data: [null, null, 118.0, 145.8], birim: 'ha', borderColor: '#fb923c', backgroundColor: '#fb923c' },
                { label: 'Rekreasyon alanı', data: [7.7, 8.0, 43.9, 74.8], birim: 'ha', borderColor: '#a78bfa', backgroundColor: '#a78bfa' },
                { label: 'Bataklık', data: [53.3, 60.7, 8.6, 6.4], birim: 'ha', borderColor: '#34d399', backgroundColor: '#34d399' },
                { label: 'Baraj', data: [null, 17.9, 25.0, 25.0], birim: 'ha', borderColor: '#38bdf8', backgroundColor: '#38bdf8' }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { position: 'bottom' } },
            scales: { y: degerEkseni('ha'), x: kategoriEkseni }
        }
    });

    // 6. Yerleşim, otoyol ve barajın yerini aldığı alanlar, 1957–2005 (ha)
    const ctxDonusum = getCtx('donusumChart');
    if (ctxDonusum) new Chart(ctxDonusum, {
        type: 'bar',
        data: {
            labels: ['Kuru tarım', 'Fundalık', 'Bahçe tarımı', 'Sulu tarım', 'Orman', 'Zeytinlik'],
            datasets: [
                { label: 'Yerleşime', data: [739.0, 606.2, 198.3, 11.6, 9.4, 7.7], birim: 'ha', backgroundColor: '#f87171' },
                { label: 'Otoyola', data: [49.0, 32.3, 53.5, null, null, null], birim: 'ha', backgroundColor: '#fb923c' },
                { label: 'Baraja', data: [null, 20.1, null, null, 4.9, null], birim: 'ha', backgroundColor: '#38bdf8' }
            ]
        },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { position: 'bottom' }, datalabels: { display: false } },
            scales: { x: degerEkseni('ha', { stacked: true }), y: Object.assign({}, kategoriEkseni, { stacked: true }) }
        }
    });

    // 7. Arazi kullanımında doğal nitelikli alanlar (ha, ilçe genel arazi kullanımındaki pay)
    const dogal = [
        { ad: 'Tarımsal niteliği korunacak alan', ha: 2383.1, pay: 34.8, renk: '#fbbf24' },
        { ad: 'Orman alanı', ha: 2117.5, pay: 30.9, renk: '#15803d' },
        { ad: 'Ağaçlık niteliği korunacak alan', ha: 500.3, pay: 7.3, renk: '#22c55e' },
        { ad: 'Mera', ha: 192.4, pay: 2.8, renk: '#a3e635' },
        { ad: 'Ağaçlandırılacak alan', ha: 162, pay: 2.4, renk: '#86efac' },
        { ad: 'Fundalık, çalılık ve makilik', ha: 149.5, pay: 2.2, renk: '#a1a1aa' }
    ];
    const ctxDogal = getCtx('dogalAlanChart');
    if (ctxDogal) new Chart(ctxDogal, {
        type: 'bar',
        data: {
            labels: dogal.map(d => d.ad),
            datasets: [{ label: 'Alan', data: dogal.map(d => d.ha), birim: 'ha', backgroundColor: dogal.map(d => d.renk), barPercentage: 0.65 }]
        },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (c) => formatSayi(c.parsed.x) + ' ha (' + formatYuzde(dogal[c.dataIndex].pay, 1) + ')' } },
                datalabels: { formatter: (v, c) => formatYuzde(dogal[c.dataIndex].pay, 1) }
            },
            scales: { x: degerEkseni('ha', { grace: '12%' }), y: kategoriEkseni }
        }
    });

    // 8. Tescilli kültür varlıkları: türlere göre (14 kayıt, hesap)
    const ctxKultur = getCtx('kulturChart');
    if (ctxKultur) new Chart(ctxKultur, {
        type: 'bar',
        data: {
            labels: ['Arkeolojik sit', 'Cami', 'Sivil mimarlık örneği', 'Anıt', 'Tümülüs', 'Dini yapı (kilise kalıntısı)', 'Mezarlık'],
            datasets: [{ label: 'Kayıt sayısı (hesap)', data: [3, 3, 3, 2, 1, 1, 1], birim: 'adet', backgroundColor: '#a78bfa', barPercentage: 0.65 }]
        },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, datalabels: { formatter: (v) => formatSayi(v) } },
            scales: { x: degerEkseni('', { grace: '15%', ticks: { stepSize: 1 } }), y: kategoriEkseni }
        }
    });

    // 9. Havzadaki omurgalı türler (balıklar hariç): tür ve familya sayısı
    const omurgali = [
        { ad: 'Kuşlar', tur: 155, familya: 45 },
        { ad: 'Memeliler', tur: 28, familya: 17 },
        { ad: 'Sürüngenler', tur: 24, familya: 14 },
        { ad: 'Amfibiler', tur: 6, familya: 5 }
    ];
    const ctxOmurgali = getCtx('omurgaliChart');
    if (ctxOmurgali) new Chart(ctxOmurgali, {
        type: 'bar',
        data: {
            labels: omurgali.map(o => o.ad),
            datasets: [
                { label: 'Tür', data: omurgali.map(o => o.tur), birim: 'adet', backgroundColor: '#f472b6' },
                { label: 'Familya', data: omurgali.map(o => o.familya), birim: 'adet', backgroundColor: 'rgba(244, 114, 182, 0.4)' }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' }, datalabels: { formatter: (v) => formatSayi(v) } },
            scales: { y: degerEkseni('', { grace: '12%' }), x: kategoriEkseni }
        }
    });

    // 10. Bitki türlerinin fitocoğrafik dağılımı (264 tür)
    const ctxFlora = getCtx('floraChart');
    if (ctxFlora) new Chart(ctxFlora, {
        type: 'doughnut',
        data: {
            labels: ['Geniş yayılışlı', 'Akdeniz elementi', 'Avrupa-Sibirya elementi', 'İran-Turan elementi', 'Öksin elementi'],
            datasets: [{ data: [170, 78, 10, 5, 1], birim: 'adet', backgroundColor: ['#a1a1aa', '#34d399', '#60a5fa', '#fbbf24', '#f472b6'], hoverOffset: 6 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '56%',
            plugins: {
                legend: { position: 'right' },
                tooltip: tooltipPayConfig,
                datalabels: { display: (c) => c.dataset.data[c.dataIndex] >= 50, color: '#0b1220', font: { weight: '800', size: 12 }, formatter: (v) => formatSayi(v) }
            }
        }
    });
});
