// =============================================
// ESHOT Otobüs Grafikleri
// =============================================

(function() {
    const eshotAylar = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
    const eshotGunluk = [660446, 719559, 463682, 100704, 103168, 316936, 384188, 374791, 409971, 417266, 342619, 236473];
    const eshotOtobus = [636, 699, 494, 154, 196, 332, 406, 398, 426, 423, 352, 265];

    // Günlük Ortalama Biniş Chart
    const ctxEG = getCtx('eshotGunlukChart');
    if (ctxEG) new Chart(ctxEG, {
        type: 'bar',
        data: {
            labels: eshotAylar,
            datasets: [{
                label: 'Günlük ortalama biniş',
                data: eshotGunluk,
                birim: 'yolcu',
                backgroundColor: MOD_RENK.eshot
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: degerEkseni('Günlük ortalama biniş'),
                x: kategoriEkseni
            }
        }
    });

    // Otobüs Başına Günlük Ort. Biniş Chart
    const ctxEO = getCtx('eshotOtobusChart');
    if (ctxEO) new Chart(ctxEO, {
        type: 'bar',
        data: {
            labels: eshotAylar,
            datasets: [{
                label: 'Otobüs başına günlük ortalama biniş',
                data: eshotOtobus,
                birim: 'yolcu',
                backgroundColor: renkSaydam(MOD_RENK.eshot, 0.55)
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: degerEkseni('Biniş / otobüs / gün'),
                x: kategoriEkseni
            }
        }
    });

    // Nüfus grafiği iptal edildi (Doğrulanabilir kesin kaynak sunulamadığı için)
})();
