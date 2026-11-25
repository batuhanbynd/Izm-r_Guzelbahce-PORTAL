// =============================================
// Kent Tarihi ve Kimlik: grafikler, dönem süzgeci ve tarihî harita gezgini
// Kaynak: araştırma grubunun "Location and Urban Identity" (Tablo 1–2) ve
// "Guzelbahce Spatial Structure (Macroform)" raporlarındaki değerler (aynen).
// Endeks değerleri (2000 = 100) tablodaki nüfuslardan hesaplanır (hesap).
// =============================================
document.addEventListener('DOMContentLoaded', function () {
    const RENK = { kilizman: '#fbbf24', yelki: '#a78bfa', camli: '#34d399', payamli: '#38bdf8' };

    // 1. Erken Osmanlı dönemi nüfus tahminleri (hane × 5 + bekâr)
    const ctxErken = getCtx('erkenNufusChart');
    if (ctxErken) new Chart(ctxErken, {
        type: 'bar',
        data: {
            labels: ['1478', '1528', '1575'],
            datasets: [
                { label: 'Kilizman', data: [408, 388, 348], birim: 'kisi', backgroundColor: RENK.kilizman, borderRadius: 4 },
                { label: 'Seki/Yelki', data: [389, 295, 545], birim: 'kisi', backgroundColor: RENK.yelki, borderRadius: 4 },
                { label: 'Çamlı', data: [null, 888, 1215], birim: 'kisi', backgroundColor: RENK.camli, borderRadius: 4 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' },
                datalabels: { display: (c) => c.dataset.data[c.dataIndex] !== null, font: { weight: '600', size: 11 }, formatter: (v) => formatSayi(v) }
            },
            scales: { x: kategoriEkseni, y: degerEkseni('Tahmini nüfus (kişi)', { suggestedMax: 1400, ticks: { callback: (v) => formatSayi(v) } }) }
        }
    });

    // 2. Erken Cumhuriyet: bugünkü ilçedeki yerleşimler (1927–28 ve 1935)
    const ctxCum = getCtx('cumhuriyetNufusChart');
    if (ctxCum) new Chart(ctxCum, {
        type: 'bar',
        data: {
            labels: ['Kızılbahçe', 'Yelki', 'Çamlı', 'Payamlı'],
            datasets: [
                { label: '1927–28', data: [1418, 712, 317, 229], birim: 'kisi', backgroundColor: '#38bdf8', borderRadius: 4 },
                { label: '1935', data: [1452, 566, 399, 229], birim: 'kisi', backgroundColor: '#fbbf24', borderRadius: 4 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' }, datalabels: { formatter: (v) => formatSayi(v) } },
            scales: { x: kategoriEkseni, y: degerEkseni('Nüfus (kişi)', { suggestedMax: 1700, ticks: { callback: (v) => formatSayi(v) } }) }
        }
    });

    // 3. İlçe nüfusu, 1990–2025 (doğrusal zaman ekseni)
    const yillar = [1990, 2000, 2008, 2010, 2011, 2012, 2017, 2020, 2022, 2025];
    const nufus = [14243, 18190, 22138, 24462, 25335, 28469, 31429, 36727, 37753, 39474];
    const adnksCizgisi = {
        id: 'adnksCizgisi',
        afterDatasetsDraw(chart) {
            const x = chart.scales.x, y = chart.scales.y, c = chart.ctx;
            const px = x.getPixelForValue(2007);
            c.save();
            c.strokeStyle = aktifTema() === 'acik' ? 'rgba(15, 23, 42, 0.45)' : 'rgba(248, 250, 252, 0.45)';
            c.setLineDash([5, 4]); c.lineWidth = 1.2;
            c.beginPath(); c.moveTo(px, y.top); c.lineTo(px, y.bottom); c.stroke();
            c.setLineDash([]);
            c.fillStyle = aktifTema() === 'acik' ? '#334155' : '#cbd5e1';
            c.font = '600 11px Outfit, sans-serif'; c.textAlign = 'right';
            c.fillText(cevir('ADNKS (2007)'), px - 6, y.top + 12);
            c.restore();
        }
    };
    const ctxIlce = getCtx('ilceNufusChart');
    if (ctxIlce) new Chart(ctxIlce, {
        type: 'line',
        data: {
            labels: yillar,
            datasets: [{
                label: 'Güzelbahçe nüfusu', data: nufus, birim: 'kisi',
                borderColor: '#34d399', backgroundColor: renkSaydam('#34d399', 0.14), fill: true, tension: 0.25,
                pointRadius: 4, pointHoverRadius: 6, pointBackgroundColor: '#34d399', borderWidth: 2.5
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { title: (i) => String(i[0].label) } },
                datalabels: { display: (c) => [0, 1, 5, 9].indexOf(c.dataIndex) !== -1, align: 'top', anchor: 'end', formatter: (v) => formatSayi(v) }
            },
            scales: {
                x: Object.assign({}, kategoriEkseni, { type: 'linear', min: 1988, max: 2027, ticks: { stepSize: 5, callback: (v) => (v % 5 === 0 ? String(v) : '') } }),
                y: degerEkseni('Nüfus (kişi)', { suggestedMax: 44000 })
            }
        },
        plugins: [adnksCizgisi]
    });

    // 4. Nüfus endeksi (2000 = 100) — tablodaki değerlerden (hesap)
    const alanlar = [
        { ad: 'Güzelbahçe', d: [18190, 24462, 36727, 39474], renk: '#fbbf24', kalin: 3.5 },
        { ad: 'Seferihisar', d: [34761, 32655, 48320, 63712], renk: '#34d399', kalin: 2 },
        { ad: 'Urla', d: [49269, 52500, 69550, 82021], renk: '#38bdf8', kalin: 2 },
        { ad: 'İzmir ili', d: [3370866, 3948848, 4394694, 4504185], renk: '#e2e8f0', kalin: 2, kesik: true },
        { ad: 'Narlıdere', d: [54107, 72832, 65178, 61320], renk: '#a78bfa', kalin: 2 }
    ];
    const ctxEndeks = getCtx('endeksChart');
    if (ctxEndeks) new Chart(ctxEndeks, {
        type: 'line',
        data: {
            labels: [2000, 2010, 2020, 2025],
            datasets: alanlar.map((a) => ({
                label: a.ad,
                data: a.d.map((v) => Math.round(v / a.d[0] * 1000) / 10),
                borderColor: a.renk, backgroundColor: a.renk, borderWidth: a.kalin, borderDash: a.kesik ? [6, 4] : [],
                pointRadius: 3.5, tension: 0.2
            }))
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: { position: 'bottom' },
                datalabels: { display: (c) => c.dataIndex === 3, align: 'right', anchor: 'end', offset: 4, font: { weight: '700', size: 11 }, color: (c) => c.dataset.borderColor, formatter: (v) => formatSayi(v, 1) }
            },
            layout: { padding: { right: 34 } },
            scales: {
                x: Object.assign({}, kategoriEkseni, { type: 'linear', min: 2000, max: 2025, ticks: { stepSize: 5, callback: (v) => String(v) } }),
                y: degerEkseni('Endeks (2000 = 100)', { beginAtZero: false, suggestedMin: 80, suggestedMax: 230 })
            }
        }
    });

    // ---- Dönem süzgeci ----
    document.querySelectorAll('.suzgec-cipleri[data-hedef]').forEach(function (grup) {
        const liste = document.getElementById(grup.dataset.hedef);
        if (!liste) return;
        const dugmeler = Array.from(grup.querySelectorAll('button[data-donem]'));
        dugmeler.forEach(function (d) {
            d.addEventListener('click', function () {
                const donem = d.dataset.donem;
                dugmeler.forEach(function (x) { x.setAttribute('aria-pressed', String(x === d)); });
                liste.querySelectorAll(':scope > li').forEach(function (li) {
                    const goster = donem === 'hepsi' || li.dataset.donem === donem;
                    li.hidden = !goster;
                    if (goster) li.classList.add('gorundu');
                });
            });
        });
    });

    // ---- Tarihî harita gezgini ----
    const gezgin = document.getElementById('haritaGezgini');
    if (gezgin) {
        const sahne = gezgin.querySelector('.hg-sahne');
        const resim = sahne.querySelector('img');
        const yilEt = sahne.querySelector('.hg-yil');
        const dugmeler = Array.from(gezgin.querySelectorAll('.hg-ray button'));
        const metinler = Array.from(gezgin.querySelectorAll('.hg-metin'));
        let sira = 0;
        function sec(i, odakla) {
            sira = (i + dugmeler.length) % dugmeler.length;
            const d = dugmeler[sira];
            dugmeler.forEach(function (x, j) { x.setAttribute('aria-current', String(j === sira)); });
            metinler.forEach(function (m, j) { m.hidden = j !== sira; });
            const baslik = metinler[sira].querySelector('strong');
            yilEt.textContent = d.querySelector('strong').textContent;
            const yeni = d.dataset.gorsel;
            if (resim.getAttribute('src') !== yeni) {
                resim.classList.add('gecis');
                const on = new Image();
                on.onload = on.onerror = function () {
                    resim.src = yeni; resim.width = +d.dataset.en; resim.height = +d.dataset.boy;
                    requestAnimationFrame(function () { resim.classList.remove('gecis'); });
                };
                on.src = yeni;
            }
            resim.alt = (baslik ? baslik.textContent : '') + ' · ' + yilEt.textContent;
            if (odakla) d.focus();
        }
        dugmeler.forEach(function (d, i) { d.addEventListener('click', function () { sec(i); }); });
        gezgin.querySelectorAll('.hg-dugmeler button').forEach(function (b) {
            b.addEventListener('click', function () { sec(sira + Number(b.dataset.yon)); });
        });
        gezgin.addEventListener('keydown', function (e) {
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); sec(sira + 1, true); }
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); sec(sira - 1, true); }
        });
        function buyut() { if (window.openImageModal) window.openImageModal(resim.getAttribute('src')); }
        sahne.addEventListener('click', buyut);
        sahne.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); buyut(); } });
        sec(0);
    }
});
