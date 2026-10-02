// =============================================
// Kavramsal Diyagram — İzmir Ulaşım Ağı
// =============================================

(function () {
    // ---- DATA ----
    const modlar = [
        { id: 'eshot', ad: 'ESHOT', yolcu: 137842250, ikon: '🚌', renk: '#f472b6', renkAlpha: 'rgba(244, 114, 182, 0.6)' },
        { id: 'metro', ad: 'İzmir Metro', yolcu: 127400000, ikon: '🚇', renk: '#818cf8', renkAlpha: 'rgba(129, 140, 248, 0.6)' },
        { id: 'izban', ad: 'İZBAN', yolcu: 101086308, ikon: '🚆', renk: '#fbbf24', renkAlpha: 'rgba(251, 191, 36, 0.6)' },
        { id: 'vapur', ad: 'Vapur (İzdeniz)', yolcu: 46397340, ikon: '⛴️', renk: '#38bdf8', renkAlpha: 'rgba(56, 189, 248, 0.6)' },
        { id: 'tramvay_konak', ad: 'Konak Tramvayı', yolcu: 22465062, ikon: '🚊', renk: '#34d399', renkAlpha: 'rgba(52, 211, 153, 0.6)' },
        { id: 'tramvay_karsiyaka', ad: 'Karşıyaka Tramvayı', yolcu: 11065052, ikon: '🚋', renk: '#10b981', renkAlpha: 'rgba(16, 185, 129, 0.6)' },
        { id: 'havaalani', ad: 'Adnan Menderes', yolcu: 8925405, ikon: '✈️', renk: '#a78bfa', renkAlpha: 'rgba(167, 139, 250, 0.6)' }
    ];

    const toplamYolcu = modlar.reduce((s, m) => s + m.yolcu, 0);

    // Aktarma ilişkileri (karşılıklı)
    const aktarmalar = [
        ['eshot', 'metro'], ['eshot', 'izban'], ['eshot', 'vapur'],
        ['eshot', 'tramvay_konak'], ['eshot', 'tramvay_karsiyaka'], ['eshot', 'havaalani'],
        ['metro', 'izban'], ['metro', 'tramvay_konak'], ['metro', 'eshot'],
        ['izban', 'havaalani'], ['izban', 'metro'],
        ['vapur', 'eshot'], ['vapur', 'tramvay_konak'],
        ['tramvay_konak', 'metro'], ['tramvay_konak', 'vapur'],
        ['tramvay_karsiyaka', 'izban'],
    ];

    // ---- TAB NAVIGATION MAPPING ----
    // Maps diagram node IDs to sidebar tab targets
    const tabMap = {
        'eshot': 'eshot',
        'metro': 'metro',
        'izban': 'izban',
        'vapur': 'vapur',
        'tramvay_konak': 'tramvay',
        'tramvay_karsiyaka': 'tramvay',
        'havaalani': 'havalimani'
    };

    // Also map by display name (for hierarchy diagram nodes)
    const tabMapByName = {
        'ESHOT': 'eshot',
        'ESHOT Otobüs': 'eshot',
        'İzmir Metro': 'metro',
        'İZBAN': 'izban',
        'Vapur (İzdeniz)': 'vapur',
        'İzdeniz Vapur': 'vapur',
        'Konak Tramvayı': 'tramvay',
        'Karşıyaka Tramvayı': 'tramvay',
        'Adnan Menderes': 'havalimani',
        'KGM Karayolları': 'kgm',
        'Karayolu Ulaşımı': 'kgm',
        'Raylı Sistemler': 'karsilastirma',
        'Deniz Ulaşımı': 'vapur',
        'Hava Ulaşımı': 'havalimani'
    };

    function navigateToTab(tabId) {
        if (!tabId) return;
        let page = tabId + '.html';
        if (tabId === 'havalimani') {
            page = 'index.html';
        }
        window.location.href = page;
    }

    // ---- DIAGRAM SELECTOR ----
    const btns = document.querySelectorAll('.diagram-btn');
    const panels = document.querySelectorAll('.diagram-panel');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            const target = btn.getAttribute('data-diagram');
            const panel = document.getElementById('diag-' + target);
            if (panel) panel.classList.add('active');
        });
    });

    // ---- HELPERS ----
    function fmt(v) { return new Intl.NumberFormat('tr-TR').format(v); }
    function fmtM(v) { return (v / 1000000).toFixed(1) + 'M'; }

    function createSVG(container, w, h) {
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.style.width = '100%';
        svg.style.height = h + 'px';
        container.appendChild(svg);
        return svg;
    }

    function svgEl(tag, attrs) {
        const ns = 'http://www.w3.org/2000/svg';
        const el = document.createElementNS(ns, tag);
        for (const [k, v] of Object.entries(attrs || {})) {
            el.setAttribute(k, v);
        }
        return el;
    }

    // =====================
    // 1. YOLCU AKIŞ DİYAGRAMI
    // =====================
    function drawFlowDiagram() {
        const container = document.getElementById('flowDiagramContainer');
        if (!container) return;
        container.innerHTML = '';

        const W = 1000, H = 580;
        const svg = createSVG(container, W, H);

        // Defs for gradients
        const defs = svgEl('defs');
        modlar.forEach(m => {
            const grad = svgEl('linearGradient', { id: 'flowGrad_' + m.id, x1: '0%', y1: '0%', x2: '100%', y2: '0%' });
            const s1 = svgEl('stop', { offset: '0%', 'stop-color': m.renk, 'stop-opacity': '0.8' });
            const s2 = svgEl('stop', { offset: '100%', 'stop-color': m.renk, 'stop-opacity': '0.2' });
            grad.appendChild(s1); grad.appendChild(s2);
            defs.appendChild(grad);
        });
        svg.appendChild(defs);

        // Central node
        const cx = W / 2, cy = H / 2;
        const centerR = 70;

        // Central circle with glow
        const glowFilter = svgEl('filter', { id: 'glow' });
        const feGauss = svgEl('feGaussianBlur', { stdDeviation: '4', result: 'coloredBlur' });
        const feMerge = svgEl('feMerge');
        const fm1 = svgEl('feMergeNode', { in: 'coloredBlur' });
        const fm2 = svgEl('feMergeNode', { in: 'SourceGraphic' });
        feMerge.appendChild(fm1); feMerge.appendChild(fm2);
        glowFilter.appendChild(feGauss); glowFilter.appendChild(feMerge);
        defs.appendChild(glowFilter);

        // Arrange nodes in ellipse
        const nodePositions = [];
        const ellipseA = 380, ellipseB = 200;
        modlar.forEach((m, i) => {
            const angle = (i / modlar.length) * Math.PI * 2 - Math.PI / 2;
            const nx = cx + ellipseA * Math.cos(angle);
            const ny = cy + ellipseB * Math.sin(angle);
            nodePositions.push({ ...m, x: nx, y: ny });
        });

        // Draw flow links (curved paths proportional to yolcu)
        const maxYolcu = Math.max(...modlar.map(m => m.yolcu));
        nodePositions.forEach((node) => {
            const thickness = Math.max(3, (node.yolcu / maxYolcu) * 30);
            const midX = (cx + node.x) / 2;
            const midY = (cy + node.y) / 2;
            const offsetX = (cy - node.y) * 0.25;
            const offsetY = (node.x - cx) * 0.25;

            const path = svgEl('path', {
                d: `M ${cx} ${cy} Q ${midX + offsetX} ${midY + offsetY} ${node.x} ${node.y}`,
                stroke: `url(#flowGrad_${node.id})`,
                'stroke-width': thickness,
                fill: 'none',
                opacity: '0.6',
                class: 'flow-link'
            });

            // Animate dash
            const len = 500;
            path.setAttribute('stroke-dasharray', `${thickness * 2} ${thickness}`);
            const anim = svgEl('animate', {
                attributeName: 'stroke-dashoffset',
                from: len,
                to: '0',
                dur: (3 + Math.random() * 2) + 's',
                repeatCount: 'indefinite'
            });
            path.appendChild(anim);
            svg.appendChild(path);
        });

        // Central circle
        const centerGroup = svgEl('g', { filter: 'url(#glow)' });
        const bgCircle = svgEl('circle', {
            cx, cy, r: centerR,
            fill: 'rgba(15, 23, 42, 0.9)',
            stroke: 'rgba(129, 140, 248, 0.5)',
            'stroke-width': '3'
        });
        centerGroup.appendChild(bgCircle);

        const centerText1 = svgEl('text', {
            x: cx, y: cy - 15,
            'text-anchor': 'middle', fill: '#f8fafc',
            'font-size': '14', 'font-weight': '800'
        });
        centerText1.textContent = 'İZMİR';
        centerGroup.appendChild(centerText1);

        const centerText2 = svgEl('text', {
            x: cx, y: cy + 5,
            'text-anchor': 'middle', fill: '#94a3b8',
            'font-size': '11', 'font-weight': '600'
        });
        centerText2.textContent = 'ULAŞIM AĞI';
        centerGroup.appendChild(centerText2);

        const centerText3 = svgEl('text', {
            x: cx, y: cy + 25,
            'text-anchor': 'middle', fill: '#38bdf8',
            'font-size': '13', 'font-weight': '700'
        });
        centerText3.textContent = fmtM(toplamYolcu);
        centerGroup.appendChild(centerText3);

        svg.appendChild(centerGroup);

        // Outer nodes
        nodePositions.forEach(node => {
            const g = svgEl('g', { class: 'flow-node' });
            const nodeR = Math.max(28, (node.yolcu / maxYolcu) * 50);

            // Node circle
            const c = svgEl('circle', {
                cx: node.x, cy: node.y, r: nodeR,
                fill: node.renk,
                opacity: '0.85',
                stroke: 'rgba(255,255,255,0.2)',
                'stroke-width': '2'
            });
            g.appendChild(c);

            // Icon
            const icon = svgEl('text', {
                x: node.x, y: node.y - 5,
                'text-anchor': 'middle',
                'dominant-baseline': 'middle',
                'font-size': Math.max(16, nodeR * 0.6),
                fill: '#fff'
            });
            icon.textContent = node.ikon;
            g.appendChild(icon);

            // Label
            const label = svgEl('text', {
                x: node.x, y: node.y + nodeR + 18,
                'text-anchor': 'middle', fill: '#f8fafc',
                'font-size': '11', 'font-weight': '700'
            });
            label.textContent = node.ad;
            g.appendChild(label);

            // Value
            const val = svgEl('text', {
                x: node.x, y: node.y + nodeR + 33,
                'text-anchor': 'middle', fill: '#94a3b8',
                'font-size': '10', 'font-weight': '600'
            });
            val.textContent = fmtM(node.yolcu) + ' yolcu';
            g.appendChild(val);

            // Percentage
            const pct = ((node.yolcu / toplamYolcu) * 100).toFixed(1);
            const pctText = svgEl('text', {
                x: node.x, y: node.y + nodeR + 47,
                'text-anchor': 'middle', fill: node.renk,
                'font-size': '10', 'font-weight': '800'
            });
            pctText.textContent = '%' + pct;
            g.appendChild(pctText);

            // Click to navigate to tab
            g.style.cursor = 'pointer';
            g.addEventListener('click', () => {
                const target = tabMap[node.id];
                if (target) navigateToTab(target);
            });

            svg.appendChild(g);
        });

        // Legend
        const legend = document.createElement('div');
        legend.className = 'diagram-legend';
        legend.innerHTML = modlar.map(m =>
            `<div class="legend-item"><div class="legend-dot" style="background:${m.renk}"></div>${m.ikon} ${m.ad} — ${fmtM(m.yolcu)}</div>`
        ).join('');
        container.appendChild(legend);
    }

    // =====================
    // 2. AĞ TOPOLOJİSİ
    // =====================
    function drawNetworkDiagram() {
        const container = document.getElementById('networkDiagramContainer');
        if (!container) return;
        container.innerHTML = '';

        const W = 1000, H = 600;
        const svg = createSVG(container, W, H);

        // Defs
        const defs = svgEl('defs');
        const glowF = svgEl('filter', { id: 'netGlow' });
        const feG = svgEl('feGaussianBlur', { stdDeviation: '6', result: 'blur' });
        const feM = svgEl('feMerge');
        feM.appendChild(svgEl('feMergeNode', { in: 'blur' }));
        feM.appendChild(svgEl('feMergeNode', { in: 'SourceGraphic' }));
        glowF.appendChild(feG); glowF.appendChild(feM);
        defs.appendChild(glowF);
        svg.appendChild(defs);

        // Node positions (manually placed for nice topology)
        const positions = {
            eshot:              { x: 500, y: 100 },
            metro:              { x: 200, y: 200 },
            izban:              { x: 800, y: 200 },
            vapur:              { x: 150, y: 400 },
            tramvay_konak:      { x: 400, y: 380 },
            tramvay_karsiyaka:  { x: 700, y: 380 },
            havaalani:          { x: 500, y: 500 }
        };

        // Aktarma noktaları (transfer hubs)
        const transferHubs = [
            { ad: 'Fahrettin Altay', x: 300, y: 290, baglanti: ['eshot', 'metro', 'tramvay_konak', 'vapur'] },
            { ad: 'Halkapınar', x: 500, y: 250, baglanti: ['metro', 'izban', 'eshot'] },
            { ad: 'Konak', x: 350, y: 350, baglanti: ['tramvay_konak', 'vapur', 'eshot'] },
            { ad: 'Karşıyaka', x: 650, y: 300, baglanti: ['tramvay_karsiyaka', 'vapur', 'eshot'] },
            { ad: 'Havalimanı', x: 600, y: 450, baglanti: ['izban', 'havaalani', 'eshot'] }
        ];

        // Draw edges between transfer hubs and modes
        transferHubs.forEach(hub => {
            hub.baglanti.forEach(modId => {
                const pos = positions[modId];
                if (!pos) return;
                const line = svgEl('line', {
                    x1: hub.x, y1: hub.y,
                    x2: pos.x, y2: pos.y,
                    stroke: 'rgba(255, 255, 255, 0.08)',
                    'stroke-width': '2',
                    'stroke-dasharray': '6 4',
                    class: 'network-edge'
                });
                svg.appendChild(line);
            });
        });

        // Draw direct connections between modes
        const uniqueLinks = new Set();
        aktarmalar.forEach(([a, b]) => {
            const key = [a, b].sort().join('-');
            if (uniqueLinks.has(key)) return;
            uniqueLinks.add(key);
            const p1 = positions[a], p2 = positions[b];
            if (!p1 || !p2) return;
            const line = svgEl('line', {
                x1: p1.x, y1: p1.y,
                x2: p2.x, y2: p2.y,
                stroke: 'rgba(129, 140, 248, 0.15)',
                'stroke-width': '2',
                class: 'network-edge'
            });

            // Animated pulse
            const anim = svgEl('animate', {
                attributeName: 'stroke-opacity',
                values: '0.1;0.4;0.1',
                dur: (2 + Math.random() * 2) + 's',
                repeatCount: 'indefinite'
            });
            line.appendChild(anim);
            svg.appendChild(line);
        });

        // Transfer hubs (small diamonds)
        transferHubs.forEach(hub => {
            const g = svgEl('g');
            const diamond = svgEl('rect', {
                x: hub.x - 10, y: hub.y - 10,
                width: '20', height: '20',
                rx: '4',
                fill: 'rgba(251, 191, 36, 0.4)',
                stroke: 'rgba(251, 191, 36, 0.8)',
                'stroke-width': '1.5',
                transform: `rotate(45 ${hub.x} ${hub.y})`
            });
            g.appendChild(diamond);

            const label = svgEl('text', {
                x: hub.x, y: hub.y + 25,
                'text-anchor': 'middle', fill: '#fbbf24',
                'font-size': '9', 'font-weight': '700',
                'letter-spacing': '0.5'
            });
            label.textContent = hub.ad;
            g.appendChild(label);
            svg.appendChild(g);
        });

        // Mode nodes
        const maxYolcu = Math.max(...modlar.map(m => m.yolcu));
        modlar.forEach(m => {
            const pos = positions[m.id];
            if (!pos) return;
            const g = svgEl('g', { class: 'network-node', filter: 'url(#netGlow)' });
            const r = Math.max(25, (m.yolcu / maxYolcu) * 45);

            // Outer ring (pulsing)
            const outerRing = svgEl('circle', {
                cx: pos.x, cy: pos.y, r: r + 8,
                fill: 'none', stroke: m.renk,
                'stroke-width': '1', opacity: '0.3'
            });
            const pulseAnim = svgEl('animate', {
                attributeName: 'r',
                values: `${r + 5};${r + 15};${r + 5}`,
                dur: '3s', repeatCount: 'indefinite'
            });
            const pulseOpacity = svgEl('animate', {
                attributeName: 'opacity',
                values: '0.3;0.1;0.3',
                dur: '3s', repeatCount: 'indefinite'
            });
            outerRing.appendChild(pulseAnim);
            outerRing.appendChild(pulseOpacity);
            g.appendChild(outerRing);

            // Main circle
            const circle = svgEl('circle', {
                cx: pos.x, cy: pos.y, r,
                fill: m.renk, opacity: '0.85',
                stroke: 'rgba(255,255,255,0.3)',
                'stroke-width': '2'
            });
            g.appendChild(circle);

            // Icon
            const icon = svgEl('text', {
                x: pos.x, y: pos.y + 2,
                'text-anchor': 'middle',
                'dominant-baseline': 'middle',
                'font-size': Math.max(18, r * 0.55)
            });
            icon.textContent = m.ikon;
            g.appendChild(icon);

            // Label below
            const label = svgEl('text', {
                x: pos.x, y: pos.y + r + 20,
                'text-anchor': 'middle', fill: '#f8fafc',
                'font-size': '12', 'font-weight': '700'
            });
            label.textContent = m.ad;
            g.appendChild(label);

            const sub = svgEl('text', {
                x: pos.x, y: pos.y + r + 35,
                'text-anchor': 'middle', fill: '#94a3b8',
                'font-size': '10', 'font-weight': '600'
            });
            sub.textContent = fmtM(m.yolcu) + '/yıl';
            g.appendChild(sub);

            // Click to navigate to tab
            g.style.cursor = 'pointer';
            g.addEventListener('click', () => {
                const target = tabMap[m.id];
                if (target) navigateToTab(target);
            });

            svg.appendChild(g);
        });

        // Legend
        const legend = document.createElement('div');
        legend.className = 'diagram-legend';
        legend.innerHTML = `
            <div class="legend-item"><div class="legend-dot" style="background: #818cf8;"></div>Ulaşım Modu (Büyüklük = Yolcu Hacmi)</div>
            <div class="legend-item"><div class="legend-dot" style="background: #fbbf24; transform: rotate(45deg); border-radius: 2px;"></div>Aktarma Noktası</div>
            <div class="legend-item"><div class="legend-dot" style="background: rgba(255,255,255,0.2);"></div>Bağlantı Hattı</div>
        `;
        container.appendChild(legend);
    }

    // =====================
    // 3. HİYERARŞİK YAPI
    // =====================
    function drawHierarchyDiagram() {
        const container = document.getElementById('hierarchyDiagramContainer');
        if (!container) return;
        container.innerHTML = '';

        const W = 1600, H = 820;
        const svg = createSVG(container, W, H);

        // Hierarchy data
        const tree = {
            ad: 'İzmir Büyükşehir Belediyesi', ikon: '🏛️', renk: '#818cf8',
            alt: 'Ulaşım Ana Planı',
            children: [
                {
                    ad: 'Karayolu Ulaşımı', ikon: '🛣️', renk: '#f472b6',
                    alt: '~347M Yolcu/Yıl',
                    children: [
                        { ad: 'ESHOT Otobüs', ikon: '🚌', renk: '#f472b6', alt: '137.8M Yolcu', detail: '1.050+ Hat' },
                        { ad: 'KGM Karayolları', ikon: '🚗', renk: '#a78bfa', alt: '209.260 Taşıt/Gün', detail: '5 Güzergah' }
                    ]
                },
                {
                    ad: 'Raylı Sistemler', ikon: '🚊', renk: '#38bdf8',
                    alt: '~262M Yolcu/Yıl',
                    children: [
                        { ad: 'İzmir Metro', ikon: '🚇', renk: '#818cf8', alt: '127.4M Yolcu', detail: '1 Hat, 17 İstasyon' },
                        { ad: 'İZBAN', ikon: '🚆', renk: '#fbbf24', alt: '101.1M Yolcu', detail: '2 Yön, 41 İstasyon' },
                        { ad: 'Konak Tramvayı', ikon: '🚊', renk: '#34d399', alt: '22.5M Yolcu', detail: '12 İstasyon' },
                        { ad: 'Karşıyaka Tramvayı', ikon: '🚋', renk: '#10b981', alt: '11.1M Yolcu', detail: '16 İstasyon' }
                    ]
                },
                {
                    ad: 'Deniz Ulaşımı', ikon: '⛴️', renk: '#38bdf8',
                    alt: '~46.4M Yolcu/Yıl',
                    children: [
                        { ad: 'İzdeniz Vapur', ikon: '⛴️', renk: '#38bdf8', alt: '46.4M Yolcu', detail: '17 Hat' }
                    ]
                },
                {
                    ad: 'Hava Ulaşımı', ikon: '✈️', renk: '#a78bfa',
                    alt: '~8.9M Yolcu/Yıl',
                    children: [
                        { ad: 'Adnan Menderes', ikon: '✈️', renk: '#a78bfa', alt: '8.9M Yolcu', detail: 'İç + Dış Hat' }
                    ]
                }
            ]
        };

        // Layout params — generous spacing
        const levelH = 200;
        const nodeW = 180, nodeH = 68;
        const rootY = 40;

        function drawNode(x, y, node, isRoot) {
            const g = svgEl('g', { class: 'hierarchy-node' });
            const w = isRoot ? 260 : nodeW;
            const h = isRoot ? 75 : nodeH;

            // Glow behind box
            const glowRect = svgEl('rect', {
                x: x - w / 2 - 4, y: y - 4, width: w + 8, height: h + 8,
                rx: '16',
                fill: node.renk,
                opacity: '0.06',
                filter: 'blur(8px)'
            });
            g.appendChild(glowRect);

            // Box
            const rect = svgEl('rect', {
                x: x - w / 2, y, width: w, height: h,
                rx: '14',
                fill: isRoot ? 'rgba(129, 140, 248, 0.15)' : 'rgba(30, 41, 59, 0.85)',
                stroke: node.renk,
                'stroke-width': isRoot ? '2.5' : '1.5',
                opacity: '0.95'
            });
            g.appendChild(rect);

            // Icon
            const ikon = svgEl('text', {
                x: x - w / 2 + 18, y: y + (h / 2) + 4,
                'font-size': isRoot ? '22' : '18',
                'dominant-baseline': 'middle'
            });
            ikon.textContent = node.ikon;
            g.appendChild(ikon);

            // Title
            const title = svgEl('text', {
                x: x - w / 2 + (isRoot ? 50 : 42), y: y + (isRoot ? 28 : 24),
                fill: '#f8fafc',
                'font-size': isRoot ? '15' : '12.5',
                'font-weight': '700'
            });
            title.textContent = node.ad;
            g.appendChild(title);

            // Subtitle
            if (node.alt) {
                const sub = svgEl('text', {
                    x: x - w / 2 + (isRoot ? 50 : 42), y: y + (isRoot ? 50 : 44),
                    fill: '#94a3b8',
                    'font-size': isRoot ? '12' : '10',
                    'font-weight': '600'
                });
                sub.textContent = node.alt;
                g.appendChild(sub);
            }

            // Detail line
            if (node.detail) {
                const det = svgEl('text', {
                    x: x - w / 2 + 42, y: y + 60,
                    fill: node.renk,
                    'font-size': '9',
                    'font-weight': '700'
                });
                det.textContent = node.detail;
                g.appendChild(det);
            }

            // Click to navigate to tab
            const targetTab = tabMapByName[node.ad];
            if (targetTab) {
                g.style.cursor = 'pointer';
                g.addEventListener('click', () => navigateToTab(targetTab));
            }

            svg.appendChild(g);
            return { cx: x, cy: y + h };
        }

        // Draw connecting line (smooth Bezier curve)
        function drawLink(x1, y1, x2, y2, color) {
            const midY = (y1 + y2) / 2;
            const path = svgEl('path', {
                d: `M ${x1} ${y1} C ${x1} ${midY} ${x2} ${midY} ${x2} ${y2}`,
                fill: 'none',
                stroke: color || 'rgba(255,255,255,0.12)',
                'stroke-width': '2.5',
                class: 'hierarchy-link'
            });
            svg.appendChild(path);
        }

        // Root
        const rootPos = drawNode(W / 2, rootY, tree, true);

        // Flatten all Level 2 children to distribute evenly
        const allL2 = [];
        tree.children.forEach((cat, catIdx) => {
            (cat.children || []).forEach(child => {
                allL2.push({ child, catIdx, parentRenk: cat.renk });
            });
        });

        // Place ALL Level 2 nodes evenly across full width
        const l2Y = rootY + levelH * 2;
        const l2Margin = 100;
        const l2Count = allL2.length;
        const l2Spacing = (W - l2Margin * 2) / (l2Count - 1);
        const l2Positions = allL2.map((item, i) => ({
            ...item,
            x: l2Margin + l2Spacing * i
        }));

        // Compute Level 1 parent x = center of its children's positions
        const l1Y = rootY + levelH;
        const l1Data = tree.children.map((cat, catIdx) => {
            const childPositions = l2Positions.filter(p => p.catIdx === catIdx);
            const centerX = childPositions.length > 0
                ? childPositions.reduce((s, p) => s + p.x, 0) / childPositions.length
                : W / 2;
            return { cat, catIdx, x: centerX };
        });

        // Draw Level 1 nodes
        const l1Rendered = [];
        l1Data.forEach(item => {
            drawLink(rootPos.cx, rootPos.cy, item.x, l1Y);
            const pos = drawNode(item.x, l1Y, item.cat, false);
            l1Rendered.push({ x: item.x, bottom: pos.cy, catIdx: item.catIdx });
        });

        // Draw Level 2 nodes with links from their parent
        l2Positions.forEach(item => {
            const parent = l1Rendered.find(p => p.catIdx === item.catIdx);
            if (parent) {
                drawLink(parent.x, parent.bottom, item.x, l2Y);
            }
            drawNode(item.x, l2Y, item.child, false);
        });

        // Legend
        const legend = document.createElement('div');
        legend.className = 'diagram-legend';
        legend.innerHTML = `
            <div class="legend-item"><div class="legend-dot" style="background: #818cf8;"></div>Üst Yönetim</div>
            <div class="legend-item"><div class="legend-dot" style="background: #f472b6;"></div>Karayolu</div>
            <div class="legend-item"><div class="legend-dot" style="background: #38bdf8;"></div>Raylı / Deniz</div>
            <div class="legend-item"><div class="legend-dot" style="background: #a78bfa;"></div>Hava Ulaşımı</div>
        `;
        container.appendChild(legend);
    }

    // =====================
    // 4. İLİŞKİ MATRİSİ
    // =====================
    function drawMatrixDiagram() {
        const container = document.getElementById('matrixDiagramContainer');
        if (!container) return;
        container.innerHTML = '';

        const labels = modlar.map(m => m.ad);
        const ids = modlar.map(m => m.id);
        const ikonlar = modlar.map(m => m.ikon);
        const renkler = modlar.map(m => m.renk);

        // Build adjacency
        const adj = {};
        ids.forEach(a => {
            adj[a] = {};
            ids.forEach(b => { adj[a][b] = false; });
        });
        aktarmalar.forEach(([a, b]) => {
            if (adj[a]) adj[a][b] = true;
            if (adj[b]) adj[b][a] = true;
        });

        // Build HTML table
        const table = document.createElement('table');
        table.className = 'matrix-grid';

        // Header row
        const thead = document.createElement('thead');
        const hr = document.createElement('tr');
        hr.appendChild(document.createElement('th')); // empty corner
        ids.forEach((id, i) => {
            const th = document.createElement('th');
            th.style.textAlign = 'center';
            th.innerHTML = `<span style="font-size:1.3rem;">${ikonlar[i]}</span><br><span style="font-size:0.7rem; color:${renkler[i]};">${labels[i].split(' ')[0]}</span>`;
            th.style.cursor = 'pointer';
            th.addEventListener('click', () => {
                const target = tabMap[id];
                if (target) navigateToTab(target);
            });
            hr.appendChild(th);
        });
        thead.appendChild(hr);
        table.appendChild(thead);

        // Body
        const tbody = document.createElement('tbody');
        ids.forEach((rowId, ri) => {
            const tr = document.createElement('tr');
            const rowHeader = document.createElement('th');
            rowHeader.className = 'matrix-row-header';
            rowHeader.innerHTML = `${ikonlar[ri]} <span style="color:${renkler[ri]};">${labels[ri]}</span>`;
            rowHeader.style.cursor = 'pointer';
            rowHeader.addEventListener('click', () => {
                const target = tabMap[rowId];
                if (target) navigateToTab(target);
            });
            tr.appendChild(rowHeader);

            ids.forEach((colId, ci) => {
                const td = document.createElement('td');
                if (ri === ci) {
                    td.className = 'matrix-cell-self';
                    td.textContent = '●';
                    td.title = labels[ri] + ' (kendisi)';
                } else if (adj[rowId][colId]) {
                    td.className = 'matrix-cell-connected';
                    td.textContent = '✓';
                    td.title = labels[ri] + ' ↔ ' + labels[ci] + ' aktarma var';
                } else {
                    td.className = 'matrix-cell-empty';
                    td.textContent = '—';
                    td.title = 'Doğrudan aktarma yok';
                }
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);

        container.appendChild(table);

        // Summary below matrix
        const summary = document.createElement('div');
        summary.className = 'diagram-legend';
        const totalConnections = new Set();
        aktarmalar.forEach(([a, b]) => totalConnections.add([a, b].sort().join('-')));
        summary.innerHTML = `
            <div class="legend-item"><div class="legend-dot" style="background: var(--success);"></div>✓ Doğrudan Aktarma (${totalConnections.size} bağlantı)</div>
            <div class="legend-item"><div class="legend-dot" style="background: var(--accent-2);"></div>● Kendisi</div>
            <div class="legend-item"><div class="legend-dot" style="background: rgba(255,255,255,0.1);"></div>— Doğrudan Aktarma Yok</div>
        `;
        container.appendChild(summary);
    }

    // ---- INITIALIZE ----
    drawFlowDiagram();
    drawNetworkDiagram();
    drawHierarchyDiagram();
    drawMatrixDiagram();

})();
