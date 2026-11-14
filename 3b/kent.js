// =============================================
// Güzelbahçe kent modeli: halihazır haritadaki binalar, paftadaki kat adediyle yükseltilmiş
// Veriler: 3b/kent-veri.js (KENT), 3b/arazi-veri.js (ARAZI), 3b/zemin.js (GROUND). Motor: 3b/sahne.js
// =============================================
(() => {
"use strict";
const $ = id => document.getElementById(id);
const t = M3.t, fmt = M3.fmt, pct = M3.pct;
const turAd = i => t(M3.TUR_AD[i][0], M3.TUR_AD[i][1]);
const katAd = k => k ? (k >= 6 ? t('6+ kat', '6+ floors') : k + t(' kat', k === 1 ? ' floor' : ' floors')) : t('Kat bilgisi yok', 'No floor data');

const SC = M3.sahne({
  kab: 1.5, binaMod: 'kat',
  binaIpucu: (b) => `<b>${turAd(b.tur)}</b>
    <div><span>${t('Kat adedi', 'Floors')}</span><span>${b.kat ? b.kat : t('yok', 'none')}</span></div>
    <div><span>${t('Taban alanı (hesap)', 'Footprint (calc.)')}</span><span>${fmt(Math.round(b.alan))} m²</span></div>`,
  turGiris: () => t('Kamera kıyıdan yamaçlara doğru mahalleleri gezer; her durakta o çevredeki binaların kat dağılımı hesaplanır.',
    'The camera moves from the coast up the slopes; at each stop the floor counts of the buildings around it are calculated.')
});
if (!SC) return;
const B = SC.binalar, N = B.length;

// ---------- istatistikler
const katGrup = k => k ? Math.min(6, k) : 0;
function dagilim(liste) { const d = [0, 0, 0, 0, 0, 0, 0]; liste.forEach(b => d[katGrup(b.kat)]++); return d; }
const DAG = dagilim(B);
const bilgili = N - DAG[0];
function ozet(liste) {
  const k = liste.filter(b => b.kat); const ort = k.reduce((s, b) => s + b.kat, 0) / Math.max(1, k.length);
  const d = dagilim(liste); let mod = 1; for (let i = 1; i <= 6; i++) if (d[i] > d[mod]) mod = i;
  return { n: liste.length, ort, mod, max: k.reduce((m, b) => Math.max(m, b.kat), 0), d, kN: k.length };
}

function istatistik() {
  $('s-pct').textContent = fmt(N);
  $('s-txt').textContent = t('bina, ilçe sınırı içinde (halihazır harita 2015)', 'buildings inside the district boundary (2015 base map)');
  $('s-km').textContent = t(`paftada kat adedi olanların payı ${pct(bilgili / N * 100, 1)}`, `${pct(bilgili / N * 100, 1)} have a floor count on the map`);
  // kat dağılımı: eşit genişlikte sütunlar; yükseklik bina sayısıyla orantılı. Tıklanan kat ve üzeri vurgulanır.
  const bar = $('katbar'); bar.innerHTML = '';
  const enCok = Math.max(...DAG);
  $('katgrafik').classList.toggle('filtreli', !!S.minKat);
  $('kg-tumu').setAttribute('aria-pressed', !S.minKat);
  [1, 2, 3, 4, 5, 6, 0].forEach(k => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'kg' + (k ? '' : ' yok');
    b.style.setProperty('--c', M3.KAT_RENK[k]);
    const secili = !!S.minKat && k >= S.minKat && k > 0;
    b.setAttribute('aria-pressed', k ? String(secili) : 'false');
    b.title = katAd(k) + ' · ' + fmt(DAG[k]) + t(' bina · ', ' buildings · ') + pct(DAG[k] / N * 100, 1);
    b.setAttribute('aria-label', b.title);
    b.innerHTML = `<span class="s">${fmt(DAG[k])}</span><span class="c" style="height:${Math.max(3, DAG[k] / enCok * 62)}px"></span><span class="e">${k ? (k >= 6 ? '6+' : k) : '?'}</span>`;
    if (k) b.onclick = () => { S.minKat = S.minKat === k ? 0 : k; uygula(); };
    else b.disabled = true;
    bar.appendChild(b);
  });
  const nV = B.filter(b => b.kat >= S.minKat && b.kat > 0).length;
  $('katbar-not').innerHTML = S.minKat
    ? t(`<b>${S.minKat === 6 ? '6+' : S.minKat + ' ve üzeri'} kat</b> vurgulanıyor · ${fmt(nV)} bina, payı ${pct(nV / N * 100, 1)}. Kaldırmak için <b>Tümü</b>.`,
      `Highlighting <b>${S.minKat}+ floors</b> · ${fmt(nV)} buildings, ${pct(nV / N * 100, 1)}. Press <b>All</b> to clear.`)
    : t('Bir sütuna tıklayın: o kat adedi ve üzerindeki binalar vurgulanır, diğerleri soluklaşır. <b>?</b> = paftada kat adedi yok.',
      'Click a column to highlight buildings with that many floors or more; the others fade. <b>?</b> = no floor count on the map.');
}
$('kg-tumu').onclick = () => { S.minKat = 0; uygula(); };
function lejant() {
  const k = $('lg-key'); const sw = (c, txt) => `<span><i style="background:${c}"></i>${txt}</span>`;
  if (S.mod === 'kat') {
    $('lg-baslik').textContent = t('Kat adedi', 'Floors');
    k.innerHTML = [1, 2, 3, 4, 5, 6].map(i => sw(M3.KAT_RENK[i], i >= 6 ? '6+' : String(i))).join('') + sw(M3.KAT_RENK[0], t('bilgi yok', 'no data'));
  } else {
    $('lg-baslik').textContent = t('Kullanım', 'Use');
    const say = new Array(11).fill(0); B.forEach(b => say[b.tur]++);
    k.innerHTML = M3.TUR_RENK.map((c, i) => say[i] ? sw(c, turAd(i) + ' · ' + fmt(say[i])) : '').join('');
  }
}

// ---------- durum
const S = { mod: 'kat', minKat: 0, kab: 1.5 };
function uygula() {
  SC.binaMod = S.mod; SC.minKat = S.minKat; SC.kab = S.kab;
  $('m-kat').setAttribute('aria-pressed', S.mod === 'kat'); $('m-tur').setAttribute('aria-pressed', S.mod === 'tur');
  $('c-kab').value = Math.round(S.kab * 100); $('o-kab').textContent = fmt(S.kab, 1) + '×';
  istatistik(); lejant(); SC.yenile();
}
$('m-kat').onclick = () => { S.mod = 'kat'; uygula(); };
$('m-tur').onclick = () => { S.mod = 'tur'; uygula(); };
$('c-kab').oninput = e => { S.kab = e.target.value / 100; uygula(); };

// ---------- gezinti: her durakta 700 m çevresindeki binalar (hesap)
const E = KENT.etiket, R = 700;
const C = (ad, ek) => Object.assign({ tx: E[ad][0] - SC.HW, tz: E[ad][1] - SC.HH, dist: 2600, pitch: 0.55 }, ek || {});
function cevre(ad, adEn) {
  const o = ozet(SC.yakinBinalar(E[ad][0], E[ad][1], R));
  return t(`${ad} çevresinde (${R} m) ${fmt(o.n)} bina var. Kat adedi bilinenlerin ortalaması ${fmt(o.ort, 1)} kat (hesap); en yaygın ${o.mod} kat, en yüksek ${o.max} kat.`,
    `There are ${fmt(o.n)} buildings within ${R} m of ${adEn || ad}. Where the floor count is known, the average is ${fmt(o.ort, 1)} floors (calc.); the most common is ${o.mod} and the highest ${o.max}.`);
}
SC.tur([
  { baslik: ['Güzelbahçe, bina bina', 'Güzelbahçe, building by building'], cam: SC.HOME, ayar: () => { S.mod = 'kat'; S.minKat = 0; uygula(); },
    metin: () => { const o = ozet(B); return t(`İlçe sınırı içinde ${fmt(N)} bina var. Kat adedi bilinen binalar içinde 1 ya da 2 katlıların payı ${pct((o.d[1] + o.d[2]) / o.kN * 100, 1)} (hesap): ilçenin yapı dokusu alçak.`,
      `There are ${fmt(N)} buildings inside the district boundary. Of those with a known floor count, ${pct((o.d[1] + o.d[2]) / o.kN * 100, 1)} have 1 or 2 floors (calc.): the district has a low, spread-out building pattern.`); } },
  { baslik: ['Kıyı şeridi · Yalı', 'The coast · Yalı'], cam: C('Yalı', { yaw: 0.5 }), metin: () => cevre('Yalı') },
  { baslik: ['Merkez · Çelebi', 'Centre · Çelebi'], cam: C('Çelebi', { yaw: -0.3 }), metin: () => cevre('Çelebi') },
  { baslik: ['Kahramandere', 'Kahramandere'], cam: C('Kahramandere', { yaw: 0.2 }), metin: () => cevre('Kahramandere') },
  { baslik: ['Yaka yamaçları', 'The slopes of Yaka'], cam: C('Yaka', { yaw: 0.9, pitch: 0.42 }), metin: () => cevre('Yaka') },
  { baslik: ['Yelki', 'Yelki'], cam: C('Yelki', { yaw: -0.4, dist: 3400 }), metin: () => cevre('Yelki') + t(" Yelki'nin batı ve güney kesimi paftaların dışında; oradaki arazi Copernicus verisinden.",' The western and southern parts of Yelki are outside the map sheets; the terrain there comes from Copernicus data.') },
  { baslik: ['4 kat ve üzeri', '4 floors and more'], cam: Object.assign({}, SC.HOME, { dist: 7600, pitch: 0.8 }), ayar: () => { S.mod = 'kat'; S.minKat = 4; uygula(); },
    metin: () => { const n = B.filter(b => b.kat >= 4).length; return t(`4 ve üzeri katlı bina sayısı ${fmt(n)}, toplam içindeki payı ${pct(n / N * 100, 1)}. Vurgulanan binalar parlak, diğerleri soluk gösteriliyor.`,
      `There are ${fmt(n)} buildings with 4 or more floors, ${pct(n / N * 100, 1)} of the total. They are shown bright; the others are faded.`); } },
  { baslik: ['Kullanım', 'Building use'], cam: SC.HOME, ayar: () => { S.mod = 'tur'; S.minKat = 0; uygula(); },
    metin: () => { const say = i => B.filter(b => b.tur === i).length; return t(`Konutların payı ${pct(say(0) / N * 100, 1)}. Paftalarda ${fmt(say(1))} ticari yapı, ${fmt(say(9))} sera, ${fmt(say(3))} okul ve ${fmt(say(2))} resmî bina var.`,
      `${pct(say(0) / N * 100, 1)} of the buildings are residential. The map sheets show ${fmt(say(1))} commercial buildings, ${fmt(say(9))} greenhouses, ${fmt(say(3))} schools and ${fmt(say(2))} public buildings.`); } }
]);

addEventListener('m3dil', () => { istatistik(); lejant(); });
uygula();
SC.basla();
})();
