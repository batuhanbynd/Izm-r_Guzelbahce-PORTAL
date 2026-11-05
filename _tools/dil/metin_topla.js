// Portal sayfalarını jsdom'da çalıştırır; görünen metinleri, öznitelikleri ve grafik etiketlerini toplar.
// Kullanım: node metin_topla.js <portal kökü> <çıktı.json> sayfa1.html sayfa2.html ...
const fs = require('fs');
const path = require('path');
const kok = process.argv[2];
const cikti = process.argv[3];
const sayfalar = process.argv.slice(4);
const { JSDOM, VirtualConsole } = require(path.join(kok, 'node_modules', 'jsdom'));

function norm(s) { return String(s).replace(/\s+/g, ' ').trim(); }

async function sayfa(ad) {
    let html = fs.readFileSync(path.join(kok, ad), 'utf8');
    // Yerel betikleri satır içine al, CDN betiklerini çıkar (jsdom ağdan yüklemez)
    html = html.replace(/<script src="(js\/[^"]+)"><\/script>/g, (m, yol) => '<script>' + fs.readFileSync(path.join(kok, yol), 'utf8').replace(/<\/script/g, '<\/script') + '</script>');
    html = html.replace(/<script src="https?:[^"]+"><\/script>/g, '');
    const grafikler = [];
    const vc = new VirtualConsole();
    vc.on('jsdomError', (e) => { if (!/getContext|Not implemented/.test(e.message)) console.error(ad, 'HATA:', e.message); });
    const dom = new JSDOM(html, {
        url: 'file:///' + path.join(kok, ad).replace(/\\/g, '/'),
        runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
        beforeParse(window) {
            const derin = () => new Proxy(function () {}, {
                get: (t, k) => { if (k === Symbol.toPrimitive) return () => ''; if (!(k in t)) t[k] = derin(); return t[k]; },
                set: (t, k, v) => { t[k] = v; return true; },
                apply: () => derin(), construct: () => derin()
            });
            function Chart(ctx, config) { grafikler.push(config); this.config = config; this.data = config.data; this.options = config.options || {}; this.update = () => {}; }
            Chart.defaults = derin();
            Chart.register = () => {};
            Chart.instances = {};
            window.Chart = Chart;
            window.ChartDataLabels = {};
            window.HTMLCanvasElement.prototype.getContext = function () { return { canvas: this }; };
            window.matchMedia = () => ({ matches: false, addEventListener() {}, addListener() {} });
            window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
            window.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
            window.scrollTo = () => {};
        }
    });
    await new Promise((r) => dom.window.addEventListener('load', r));
    await new Promise((r) => setTimeout(r, 400));
    const w = dom.window, d = w.document;
    const metinler = new Set();
    const yuruyucu = d.createTreeWalker(d.body, w.NodeFilter.SHOW_TEXT);
    let n;
    while ((n = yuruyucu.nextNode())) {
        const ust = n.parentElement;
        if (!ust || ust.closest('script, style, noscript, .dil-yok')) continue;
        const t = norm(n.nodeValue);
        if (t) metinler.add(t);
    }
    d.querySelectorAll('[alt], [title], [aria-label], [placeholder]').forEach((el) => {
        if (el.closest('.dil-yok')) return;
        ['alt', 'title', 'aria-label', 'placeholder'].forEach((a) => { const v = el.getAttribute(a); if (v && norm(v)) metinler.add(norm(v)); });
    });
    metinler.add(norm(d.title.split(' | ')[0]));
    const ekle = (v) => { if (Array.isArray(v)) v.forEach(ekle); else if (typeof v === 'string' && norm(v)) metinler.add(norm(v)); };
    grafikler.forEach((c) => {
        ekle((c.data || {}).labels);
        ((c.data || {}).datasets || []).forEach((ds) => ekle(ds.label));
        const sc = (c.options || {}).scales || {};
        Object.values(sc).forEach((s) => s && s.title && ekle(s.title.text));
        const bt = c.options && c.options.plugins && c.options.plugins.title;
        if (bt) ekle(bt.text);
    });
    w.close();
    return [...metinler];
}

(async () => {
    const sonuc = {};
    for (const ad of sayfalar) {
        sonuc[ad] = await sayfa(ad);
        console.log(ad, sonuc[ad].length, 'metin');
    }
    fs.writeFileSync(cikti, JSON.stringify(sonuc, null, 1), 'utf8');
})();
