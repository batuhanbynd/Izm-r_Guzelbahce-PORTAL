// =============================================
// Kriz ve Dayanıklılık: bağımlılık ağı ve grafikler
// Kaynak: araştırma grubunun "Crises, Vulnerabilities, Disasters and Resilience" raporundaki
// tablolar ve rapora gömülü grafik verileri (aynen).
// =============================================
document.addEventListener('DOMContentLoaded', function () {
    const AYLAR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const VURGU = '#fbbf24';

    // ---- Sistemler arası bağımlılık ağı ----
    const ag = document.getElementById('bagAgi');
    if (ag) {
        const KENARLAR = [
            ['enerji', 'su'], ['ulasim', 'gida'], ['ulasim', 'atik'], ['su', 'gida'], ['su', 'ekosistem'],
            ['iklim', 'su'], ['iklim', 'enerji'], ['iklim', 'gida'], ['iklim', 'yangin'], ['yangin', 'ekosistem'],
            ['ekosistem', 'iklim'], ['afet', 'ulasim'], ['atik', 'ekosistem']
        ];
        const NS = 'http://www.w3.org/2000/svg';
        const svg = ag.querySelector('svg');
        const dugumler = Array.from(ag.querySelectorAll('.ba-dugum'));
        const detaylar = Array.from(ag.querySelectorAll('.ba-detay'));
        const konum = {};
        const R = 38, M = 50;
        dugumler.forEach(function (d, i) {
            const aci = (i / dugumler.length) * Math.PI * 2;
            const x = M + R * Math.sin(aci), y = M - R * Math.cos(aci);
            konum[d.dataset.dugum] = { x: x, y: y };
            d.style.left = x + '%';
            d.style.top = y + '%';
        });
        const defs = document.createElementNS(NS, 'defs');
        ['varsayilan', 'cikan', 'giren'].forEach(function (tur) {
            const m = document.createElementNS(NS, 'marker');
            m.setAttribute('id', 'ok-' + tur);
            m.setAttribute('viewBox', '0 0 10 10'); m.setAttribute('refX', '8'); m.setAttribute('refY', '5');
            m.setAttribute('markerUnits', 'userSpaceOnUse'); m.setAttribute('markerWidth', '3.4'); m.setAttribute('markerHeight', '3.4'); m.setAttribute('orient', 'auto-start-reverse');
            const p = document.createElementNS(NS, 'path');
            p.setAttribute('d', 'M0,0 L10,5 L0,10 z');
            p.setAttribute('class', 'ba-ok' + (tur === 'varsayilan' ? '' : ' ' + tur));
            m.appendChild(p); defs.appendChild(m);
        });
        svg.appendChild(defs);
        const yollar = KENARLAR.map(function (k) {
            const a = konum[k[0]], b = konum[k[1]];
            const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
            const cx = mx + (M - mx) * 0.32, cy = my + (M - my) * 0.32;
            function kisalt(p, q, d) { const dx = q.x - p.x, dy = q.y - p.y, u = Math.hypot(dx, dy) || 1; return { x: p.x + dx / u * d, y: p.y + dy / u * d }; }
            const bas = kisalt(a, { x: cx, y: cy }, 5.4), son = kisalt(b, { x: cx, y: cy }, 5.6);
            const yol = document.createElementNS(NS, 'path');
            yol.setAttribute('d', 'M' + bas.x.toFixed(2) + ',' + bas.y.toFixed(2) + ' Q' + cx.toFixed(2) + ',' + cy.toFixed(2) + ' ' + son.x.toFixed(2) + ',' + son.y.toFixed(2));
            yol.setAttribute('class', 'ba-kenar');
            yol.setAttribute('vector-effect', 'non-scaling-stroke');
            yol.setAttribute('marker-end', 'url(#ok-varsayilan)');
            svg.appendChild(yol);
            return { yol: yol, kaynak: k[0], hedef: k[1] };
        });
        function sec(ad) {
            const komsu = new Set([ad]);
            yollar.forEach(function (y) {
                const tur = y.kaynak === ad ? 'cikan' : (y.hedef === ad ? 'giren' : '');
                y.yol.setAttribute('class', 'ba-kenar' + (tur ? ' ' + tur : ' soluk'));
                y.yol.setAttribute('marker-end', 'url(#ok-' + (tur || 'varsayilan') + ')');
                if (tur) { komsu.add(y.kaynak); komsu.add(y.hedef); }
            });
            dugumler.forEach(function (d) {
                d.setAttribute('aria-pressed', String(d.dataset.dugum === ad));
                d.classList.toggle('soluk', !komsu.has(d.dataset.dugum));
            });
            detaylar.forEach(function (x) { x.hidden = x.dataset.dugum !== ad; });
        }
        dugumler.forEach(function (d) { d.addEventListener('click', function () { sec(d.dataset.dugum); }); });
        sec('iklim');
    }

    // ---- 1. Havzada sektörel yeraltı suyu kullanımı, 2024 (DSİ) ----
    const yeraltiPay = [53.12, 21.15, 15.12, 10.61];
    const ctxYeralti = getCtx('yeraltiSektorChart');
    if (ctxYeralti) new Chart(ctxYeralti, {
        type: 'doughnut',
        data: {
            labels: ['Tarım', 'Sanayi', 'İçme ve kullanma (İzmir)', "İçme ve kullanma (Manisa'dan aktarılan)"],
            datasets: [{ data: [412.25, 164.02, 117.32, 82.33], birim: 'hm3', backgroundColor: ['#34d399', '#fb923c', '#38bdf8', '#818cf8'], hoverOffset: 6 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '56%',
            plugins: {
                legend: { position: 'bottom' },
                tooltip: { callbacks: { label: (c) => c.label + ': ' + formatSayi(c.parsed) + ' hm³ (' + formatYuzde(yeraltiPay[c.dataIndex], 2) + ')' } },
                datalabels: { display: true, color: '#0b1220', font: { weight: '800', size: 12 }, formatter: (v, c) => formatYuzde(yeraltiPay[c.dataIndex], 1) }
            }
        }
    });

    // ---- 2. İklim projeksiyonları, 2091–2100 (havza modelleri) ----
    const ctxSicak = getCtx('sicaklikProjChart');
    if (ctxSicak) new Chart(ctxSicak, {
        type: 'bar',
        data: {
            labels: ['RCP4.5', 'RCP8.5'],
            datasets: [{ label: 'Sıcaklık anomalisi', data: [[1.9, 3.2], [3.9, 5.3]], birim: 'derece', backgroundColor: ['rgba(251, 191, 36, 0.75)', 'rgba(248, 113, 113, 0.8)'], borderColor: ['#fbbf24', '#f87171'], borderWidth: 1, borderSkipped: false, barPercentage: 0.55 }]
        },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (c) => '+' + formatSayi(c.raw[0], 1) + ' … +' + formatSayi(c.raw[1], 1) + ' °C' } },
                datalabels: { display: true, anchor: 'end', align: 'right', formatter: (v) => '+' + formatSayi(v[0], 1) + ' … +' + formatSayi(v[1], 1) + ' °C' }
            },
            layout: { padding: { right: 8 } },
            scales: { x: degerEkseni('Sıcaklık anomalisi (°C)', { min: 0, max: 7 }), y: kategoriEkseni }
        }
    });
    const ctxYagisProj = getCtx('yagisProjChart');
    if (ctxYagisProj) new Chart(ctxYagisProj, {
        type: 'bar',
        data: {
            labels: ['RCP8.5'],
            datasets: [{ label: 'Yağış anomalisi', data: [[-155.8, 34.6]], birim: 'mm', backgroundColor: 'rgba(56, 189, 248, 0.7)', borderColor: '#38bdf8', borderWidth: 1, borderSkipped: false, barPercentage: 0.5 }]
        },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (c) => formatSayi(c.raw[0], 1) + ' … +' + formatSayi(c.raw[1], 1) + ' mm' } },
                datalabels: { display: true, anchor: 'center', align: 'center', color: '#0b1220', font: { weight: '700', size: 11 }, formatter: (v) => formatSayi(v[0], 1) + ' … +' + formatSayi(v[1], 1) + ' mm' }
            },
            scales: { x: degerEkseni('Yağış anomalisi (mm)', { min: -200, max: 60, beginAtZero: false }), y: kategoriEkseni }
        }
    });

    // ---- 3. Aylık güneş ışınımı (EİE GEPA) ----
    const ctxIsinim = getCtx('isinimChart');
    if (ctxIsinim) new Chart(ctxIsinim, {
        type: 'line',
        data: {
            labels: AYLAR,
            datasets: [
                { label: 'Güzelbahçe', data: [1.62, 2.07, 3.78, 5.02, 5.94, 6.54, 6.31, 5.80, 4.63, 3.60, 2.20, 1.61], birim: 'kwhm2', borderColor: VURGU, backgroundColor: renkSaydam(VURGU, 0.16), fill: true, borderWidth: 3, pointRadius: 3, cubicInterpolationMode: 'monotone' },
                { label: 'İzmir ortalaması', data: [1.81, 2.16, 3.79, 4.99, 5.94, 6.50, 6.27, 5.76, 4.63, 3.54, 2.20, 1.62], birim: 'kwhm2', borderColor: '#e2e8f0', borderDash: [6, 4], borderWidth: 2, pointRadius: 0, cubicInterpolationMode: 'monotone' }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { position: 'bottom' }, datalabels: { display: (c) => c.datasetIndex === 0 && c.dataIndex === 5, align: 'top', formatter: (v) => formatSayi(v, 2) } },
            scales: { x: kategoriEkseni, y: degerEkseni('kWh/m²·gün', { suggestedMax: 7.5 }) }
        }
    });

    // ---- 4. İzmir sera gazı envanteri, 2024 (sanayi ve havacılık hariç) ----
    const emisyonPay = [42.1, 39.1, 14, 4.8];
    const ctxEmisyon = getCtx('emisyonChart');
    if (ctxEmisyon) new Chart(ctxEmisyon, {
        type: 'doughnut',
        data: {
            labels: ['Sabit enerji', 'Ulaşım', 'Tarım ve hayvancılık', 'Atık'],
            datasets: [{ data: [6652331, 6170433, 2211082, 750457], birim: 'tco2', backgroundColor: ['#fbbf24', '#f87171', '#34d399', '#a78bfa'], hoverOffset: 6 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '56%',
            plugins: {
                legend: { position: 'right' },
                tooltip: { callbacks: { label: (c) => c.label + ': ' + formatSayi(c.parsed) + ' tCO₂e (' + formatYuzde(emisyonPay[c.dataIndex], 1) + ')' } },
                datalabels: { display: true, color: '#0b1220', font: { weight: '800', size: 12 }, formatter: (v, c) => formatYuzde(emisyonPay[c.dataIndex], 1) }
            }
        }
    });

    // ---- 5. İklim nötr yolu ----
    const ctxYol = getCtx('emisyonYoluChart');
    if (ctxYol) new Chart(ctxYol, {
        type: 'bar',
        data: {
            labels: ['2018 envanteri', '2050 olağan senaryo', '2050 hedef (kalan)'],
            datasets: [{ label: 'Sera gazı emisyonu', data: [15282340, 20158435, 4031687], birim: 'tco2', backgroundColor: ['#fbbf24', '#f87171', '#34d399'], borderRadius: 5 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, datalabels: { display: true, formatter: (v) => formatSayi(v) } },
            scales: { x: kategoriEkseni, y: degerEkseni('tCO₂e', { suggestedMax: 23000000 }) }
        }
    });

    // ---- 6. Tarım alanının ürün gruplarına dağılımı (İZKA, 2021) ----
    const ctxTarim = getCtx('tarimDagilimChart');
    if (ctxTarim) new Chart(ctxTarim, {
        type: 'bar',
        data: {
            labels: ['Meyve, içecek ve baharat bitkileri', 'Tahıllar ve diğer bitkiler', 'Nadas', 'Sebze', 'Süs bitkileri'],
            datasets: [
                { label: '2015', data: [72.7, 12.2, 6.1, 6.4, 2.6], birim: 'yuzde', backgroundColor: renkSaydam('#34d399', 0.45), borderColor: '#34d399', borderWidth: 1.5, borderRadius: 4 },
                { label: '2020', data: [72.2, 12.8, 6.5, 5.9, 2.6], birim: 'yuzde', backgroundColor: '#34d399', borderRadius: 4 }
            ]
        },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' }, datalabels: { display: true, align: 'right', anchor: 'end', font: { weight: '600', size: 10 }, formatter: (v) => formatYuzde(v, 1) } },
            layout: { padding: { right: 36 } },
            scales: { x: yuzdeEkseni('Tarım alanındaki pay', { max: 85 }), y: kategoriEkseni }
        }
    });

    // ---- 7. Turunçgil nematodu: Güzelbahçe bahçeleri ----
    const ESIK = 1600;
    const nematod = [80, 540, 2860, 40];
    const ctxNem = getCtx('nematodChart');
    if (ctxNem) new Chart(ctxNem, {
        type: 'bar',
        data: {
            labels: ['Bahçe 1', 'Bahçe 2', 'Bahçe 3', 'Bahçe 4'],
            datasets: [
                { type: 'bar', label: 'Birey / 100 g toprak', data: nematod, backgroundColor: nematod.map((v) => (v > ESIK ? '#f87171' : '#2dd4bf')), borderRadius: 5, order: 2 },
                { type: 'line', label: 'Ekonomik zarar eşiği', data: nematod.map(() => ESIK), borderColor: '#fbbf24', borderDash: [6, 4], borderWidth: 2, pointRadius: 0, order: 1, datalabels: { display: false } }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' }, datalabels: { display: true, formatter: (v) => formatSayi(v) } },
            scales: { x: kategoriEkseni, y: degerEkseni('Birey / 100 g toprak', { suggestedMax: 3200, ticks: { callback: (v) => formatSayi(v) } }) }
        }
    });

    // ---- 8. ÇKS'ye kayıtlı çiftçi ----
    const ctxCks = getCtx('cksChart');
    if (ctxCks) new Chart(ctxCks, {
        type: 'bar',
        data: { labels: ['2015', '2019', '2020'], datasets: [{ label: 'Kayıtlı çiftçi', data: [120, 152, 179], birim: 'kisi', backgroundColor: ['#86efac', '#4ade80', '#16a34a'], borderRadius: 5 }] },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, datalabels: { display: true, formatter: (v) => formatSayi(v) } },
            scales: { x: kategoriEkseni, y: degerEkseni('Çiftçi sayısı', { suggestedMax: 210 }) }
        }
    });

    // ---- 9. Mahallelerin ilçe merkezine uzaklığı ----
    const ctxUzak = getCtx('uzaklikChart');
    if (ctxUzak) new Chart(ctxUzak, {
        type: 'bar',
        data: { labels: ['Payamlı', 'Çamlı', 'Küçükkaya', 'Yelki'], datasets: [{ label: 'Uzaklık', data: [12, 8.2, 6.2, 4.3], birim: 'kmetre', backgroundColor: '#38bdf8', borderRadius: 5 }] },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, datalabels: { display: true, align: 'right', anchor: 'end', formatter: (v) => formatSayi(v, 1) + ' km' } },
            layout: { padding: { right: 44 } },
            scales: { x: degerEkseni('km', { suggestedMax: 14 }), y: kategoriEkseni }
        }
    });

    // ---- 10. Ayrı toplanan atıklar, 2025 (logaritmik eksen) ----
    const ctxAyri = getCtx('ayriAtikChart');
    if (ctxAyri) new Chart(ctxAyri, {
        type: 'bar',
        data: {
            labels: ['Bitkisel atık yağ', 'Ambalaj atığı', 'Tekstil atığı', 'Elektronik atık', 'Atık pil', 'Atık ilaç'],
            datasets: [{ label: 'Toplanan miktar', data: [130905, 60300, 46370, 570, 300, 160], birim: 'kg', backgroundColor: ['#fbbf24', '#38bdf8', '#f472b6', '#a78bfa', '#34d399', '#fb923c'], borderRadius: 4 }]
        },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, datalabels: { display: true, align: 'right', anchor: 'end', formatter: (v) => formatSayi(v) + ' kg' } },
            layout: { padding: { right: 70 } },
            scales: {
                x: degerEkseni('kg (logaritmik eksen)', { type: 'logarithmic', beginAtZero: false, min: 100, max: 1000000, ticks: { maxRotation: 0, autoSkip: false, callback: (v) => ([100, 1000, 10000, 100000, 1000000].indexOf(v) !== -1 ? formatKisa(v) : '') } }),
                y: kategoriEkseni
            }
        }
    });

    // ---- 11. Yelki Çalıcası hafriyat sahası ----
    const ctxHaf = getCtx('hafriyatChart');
    if (ctxHaf) new Chart(ctxHaf, {
        type: 'bar',
        data: {
            labels: ['2023', '2024'],
            datasets: [
                { label: 'Hafriyat toprağı', data: [895981.59, 940690.69], birim: 'ton', backgroundColor: '#fb923c', borderRadius: 4 },
                { label: 'İnşaat ve yıkıntı atığı', data: [187098.79, 103409.08], birim: 'ton', backgroundColor: '#a78bfa', borderRadius: 4 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' }, datalabels: { display: true, font: { weight: '600', size: 11 }, formatter: (v) => formatSayi(v, 2) } },
            scales: { x: kategoriEkseni, y: degerEkseni('ton', { suggestedMax: 1100000 }) }
        }
    });

    // ---- 12. Uzun yıllar aylık yağış ----
    const yagis = [
        { ad: 'Güzelbahçe', d: [163.4, 71.3, 78.7, 41.1, 31.8, 19.4, 2.3, 7, 11.4, 46.1, 67.5, 115.9], renk: VURGU, kalin: 3.5 },
        { ad: 'Konak', d: [171.5, 73.6, 80.2, 41.6, 41.9, 27.2, 0.1, 0.8, 11.3, 43.1, 75.1, 103.3], renk: '#38bdf8', kalin: 2 },
        { ad: 'Bornova', d: [161.3, 85.1, 66.5, 39.4, 45.2, 21.9, 2, 5.2, 6.8, 44.3, 59.8, 67.6], renk: '#a78bfa', kalin: 2 },
        { ad: 'Karşıyaka', d: [121.1, 56.6, 66.5, 37.5, 32.9, 15.4, 0.7, 4.3, 6.6, 34.3, 50.2, 75], renk: '#f472b6', kalin: 2 }
    ];
    const ctxYagis = getCtx('yagisChart');
    if (ctxYagis) new Chart(ctxYagis, {
        type: 'line',
        data: { labels: AYLAR, datasets: yagis.map((y) => ({ label: y.ad, data: y.d, birim: 'mm', borderColor: y.renk, backgroundColor: y.renk, borderWidth: y.kalin, pointRadius: y.kalin > 3 ? 3 : 0, cubicInterpolationMode: 'monotone' })) },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { position: 'bottom' }, datalabels: { display: false } },
            scales: { x: kategoriEkseni, y: degerEkseni('Yağış (mm)', { suggestedMax: 180 }) }
        }
    });

    // ---- 13. İklim değişikliği kırılganlık endeksi ----
    const ctxKir = getCtx('kirilganlikChart');
    if (ctxKir) new Chart(ctxKir, {
        type: 'bar',
        data: {
            labels: ['Konak', 'Bornova', 'Karşıyaka', 'Seferihisar', 'Güzelbahçe'],
            datasets: [{ label: 'Kırılganlık endeksi', data: [0.684, 0.527, 0.488, 0.250, 0.104], backgroundColor: ['#f87171', '#f87171', '#f87171', '#f87171', VURGU], borderRadius: 4 }]
        },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, datalabels: { display: true, align: 'right', anchor: 'end', formatter: (v) => formatSayi(v, 3) } },
            layout: { padding: { right: 44 } },
            scales: { x: degerEkseni('Endeks (0–1)', { max: 0.8, ticks: { callback: (v) => formatSayi(v, 1) } }), y: kategoriEkseni }
        }
    });

    // ---- 14. İzmir'de afet tehlikelerinin dağılımı (AFAD) ----
    const afetler = [
        ['Deprem', 11.6], ['Sel ve su baskını', 9.5], ['Yangın ve orman yangını', 9.3], ['Bulaşıcı hastalık', 9.3], ['Kuraklık', 7.1],
        ['Fırtına ve hortum', 6.7], ['Dolu', 6.5], ['Yıldırım', 5.9], ['Ulaşım kazaları (gemi, tren vb.)', 5.8], ['Endüstriyel kazalar', 5.6],
        ['Heyelan', 5.6], ['Maden kazaları', 4.3], ['Nükleer, biyolojik ve kimyasal kazalar', 4.1], ['Böcek istilası', 4], ['Kaya düşmesi', 3.6], ['Çığ', 1.2]
    ];
    const ctxAfet = getCtx('afetDagilimChart');
    if (ctxAfet) new Chart(ctxAfet, {
        type: 'bar',
        data: {
            labels: afetler.map((a) => a[0]),
            datasets: [{ label: 'Pay', data: afetler.map((a) => a[1]), birim: 'yuzde', backgroundColor: afetler.map((a, i) => (i < 5 ? '#f87171' : '#fca5a5')), borderRadius: 3 }]
        },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, datalabels: { display: true, align: 'right', anchor: 'end', font: { weight: '600', size: 10 }, formatter: (v) => formatYuzde(v, 1) } },
            layout: { padding: { right: 40 } },
            scales: { x: yuzdeEkseni('Pay', { max: 14 }), y: Object.assign({}, kategoriEkseni, { ticks: { font: { size: 11 } } }) }
        }
    });

    // ---- 15. Sosyal kırılganlık faktör endeksleri (Ortakavak, 2019) ----
    const sosyal = [-1.533, -0.123, -0.983, 1.245, -1.39];
    const ctxSos = getCtx('sosyalKirilganlikChart');
    if (ctxSos) new Chart(ctxSos, {
        type: 'bar',
        data: {
            labels: ['Faktör 1', 'Faktör 2', 'Faktör 3', 'Faktör 4', 'Bütünleşik endeks'],
            datasets: [{ label: 'Güzelbahçe', data: sosyal, backgroundColor: sosyal.map((v, i) => (i === 4 ? '#a78bfa' : (v < 0 ? '#38bdf8' : '#fb923c'))), borderRadius: 4 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                datalabels: { display: true, anchor: (c) => (c.dataset.data[c.dataIndex] < 0 ? 'start' : 'end'), align: (c) => (c.dataset.data[c.dataIndex] < 0 ? 'bottom' : 'top'), formatter: (v) => formatSayi(v, 3) }
            },
            scales: { x: kategoriEkseni, y: degerEkseni('Endeks değeri', { beginAtZero: false, min: -2, max: 1.8, ticks: { callback: (v) => formatSayi(v, 1) } }) }
        }
    });

    // ---- 16. Kentsel yangınlar, 2023 ----
    const ctxYangin = getCtx('yanginChart');
    if (ctxYangin) new Chart(ctxYangin, {
        type: 'bar',
        data: {
            labels: ['Konak', 'Bornova', 'Karşıyaka', 'Seferihisar', 'Güzelbahçe'],
            datasets: [{ label: 'Yangın sayısı', data: [1183, 1126, 464, 221, 91], birim: 'adet', backgroundColor: ['#f472b6', '#f472b6', '#f472b6', '#f472b6', VURGU], borderRadius: 5 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, datalabels: { display: true, formatter: (v) => formatSayi(v) } },
            scales: { x: kategoriEkseni, y: degerEkseni('Yangın sayısı', { suggestedMax: 1350, ticks: { callback: (v) => formatSayi(v) } }) }
        }
    });
});
