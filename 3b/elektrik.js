// =============================================
// Güzelbahçe elektrik şebekesi: halihazır haritadaki direk, pilon, trafo, sokak lambası ve havai hatlar
// Veriler: 3b/elektrik-veri.js (ELEKTRIK), 3b/kent-veri.js (KENT), 3b/arazi-veri.js, 3b/zemin.js. Motor: 3b/sahne.js
// Direk, pilon ve hat yükseklikleri temsilîdir.
// =============================================
(() => {
"use strict";
const $ = id => document.getElementById(id);
const t = M3.t, fmt = M3.fmt;
const E = ELEKTRIK;
const nokta = k => { if (!E.nokta[k]) return []; const a = M3.b64u16(E.nokta[k]), o = []; for (let i = 0; i + 1 < a.length; i += 2) o.push([a[i] * E.olcek + (E.ox || 0), a[i + 1] * E.olcek + (E.oy || 0)]); return o; };
const SINIF = [
  { id: 'enh', ad: ['Enerji nakil hattı', 'Power transmission line'], renk: '#f05252', cizgi: true, oz: { gen: 6, kal: 6, y: 28, duz: 1, em: 0.9 } },
  { id: 'pilon', ad: ['Pilon', 'Pylon'], renk: '#fb7185', oz: { gen: 10, y0: 0, y1: 30, em: 0.35 } },
  { id: 'havai', ad: ['Havai hat', 'Overhead line'], renk: '#facc15', cizgi: true, oz: { gen: 4, kal: 4, y: 9, duz: 1, em: 0.8 } },
  { id: 'direk', ad: ['Elektrik direği', 'Electricity pole'], renk: '#cbd5e1', oz: { gen: 4, y0: 0, y1: 10, em: 0.25 } },
  { id: 'trafo', ad: ['Trafo', 'Transformer'], renk: '#22d3ee', oz: { gen: 14, y0: 0, y1: 9, em: 0.45 } },
  { id: 'lamba', ad: ['Sokak lambası', 'Street lamp'], renk: '#fde68a', oz: { gen: 3.5, y0: 4, y1: 7, em: 1.4 } }
];
const ad = s => t(s.ad[0], s.ad[1]);

const SC = M3.sahne({
  kab: 1.5, binaMod: 'gri', zeminSoluk: true,
  noktaIpucu: (K, i) => `<b>${ad(K.sinif)}</b><div><span>${t('Kaynak', 'Source')}</span><span>${t('halihazır 2015', 'base map 2015')}</span></div>`,
  turGiris: () => t('Kamera enerji nakil hattını, trafoları, sokak lambalarını ve direkleri sırayla gösterir.',
    'The camera shows the power transmission line, the transformers, the street lamps and the poles in turn.')
});
if (!SC) return;

const S = { gorunur: new Set(SINIF.map(s => s.id)), kab: 1.5 };
SINIF.forEach(s => {
  if (s.cizgi) { s.veri = E.cizgi[s.id] || []; s.K = SC.cizgiKatmani(s.veri, Object.assign({ renk: s.renk }, s.oz)); }
  else { s.veri = nokta(s.id); s.K = SC.noktaKatmani(s.veri, Object.assign({ renk: s.renk, secilebilir: s.id !== 'lamba' && s.id !== 'direk' }, s.oz)); }
  s.K.sinif = s;
});
const sayi = s => s.cizgi ? fmt((E.uzunluk[s.id] || 0) / 1000, 1) + ' km' : fmt(s.veri.length);

function liste() {
  const el = $('katmanlar'); el.innerHTML = '';
  SINIF.forEach(s => {
    const b = document.createElement('button'); b.type = 'button'; b.style.setProperty('--c', s.renk); b.setAttribute('aria-pressed', S.gorunur.has(s.id));
    b.innerHTML = `<i></i><span>${ad(s)}<small>${s.cizgi ? t('çizim uzunluğu (hesap)', 'drawn length (calc.)') : t('paftadaki sembol', 'symbols on the map')}</small></span><em>${sayi(s)}</em>`;
    b.onclick = () => { if (S.gorunur.has(s.id)) S.gorunur.delete(s.id); else S.gorunur.add(s.id); uygula(); };
    el.appendChild(b);
  });
}
function istatistik() {
  const d = SINIF.find(s => s.id === 'direk');
  $('s-pct').textContent = fmt(d.veri.length);
  $('s-txt').textContent = t('elektrik direği, ilçe sınırı içinde (halihazır harita 2015)', 'electricity poles inside the district boundary (2015 base map)');
  const g = id => SINIF.find(s => s.id === id);
  $('s-km').textContent = t(`${sayi(g('pilon'))} pilon · ${sayi(g('trafo'))} trafo · ${sayi(g('lamba'))} sokak lambası`,
    `${sayi(g('pilon'))} pylons · ${sayi(g('trafo'))} transformers · ${sayi(g('lamba'))} street lamps`);
}
function lejant() {
  const sw = (c, txt) => `<span><i style="background:${c}"></i>${txt}</span>`;
  $('lg-key').innerHTML = SINIF.map(s => sw(s.renk, ad(s))).join('') + sw('#5c6776', t('Bina', 'Building'));
}
function uygula() {
  SINIF.forEach(s => { s.K.gorunur = S.gorunur.has(s.id); });
  SC.kab = S.kab; $('c-kab').value = Math.round(S.kab * 100); $('o-kab').textContent = fmt(S.kab, 1) + '×';
  liste(); istatistik(); lejant(); SC.yenile();
}
$('c-kab').oninput = e => { S.kab = e.target.value / 100; uygula(); };

// ---------- gezinti
function merkez(pts, ek) {
  if (!pts.length) return SC.HOME;
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  return Object.assign({ tx: (x0 + x1) / 2 - SC.HW, tz: (y0 + y1) / 2 - SC.HH, dist: Math.min(6000, Math.max(2200, Math.max(x1 - x0, (y1 - y0) * 1.8) * 1.2)), pitch: 0.6, yaw: 0.35 }, ek || {});
}
const g = id => SINIF.find(s => s.id === id);
const goster = ids => () => { S.gorunur = new Set(ids); uygula(); };
SC.tur([
  { baslik: ['Elektrik şebekesi', 'Power network'], cam: SC.HOME, ayar: goster(SINIF.map(s => s.id)),
    metin: () => t(`Halihazır haritada ilçe sınırı içinde ${sayi(g('direk'))} elektrik direği, ${sayi(g('pilon'))} pilon, ${sayi(g('trafo'))} trafo ve ${sayi(g('lamba'))} sokak lambası var. Yükseklikler temsilî.`,
      `On the base map there are ${sayi(g('direk'))} electricity poles, ${sayi(g('pilon'))} pylons, ${sayi(g('trafo'))} transformers and ${sayi(g('lamba'))} street lamps inside the district boundary. Heights are representative.`) },
  { baslik: ['Enerji nakil hattı', 'Power transmission line'], cam: merkez(g('enh').veri.flat(), { yaw: 0.7 }), ayar: goster(['enh', 'pilon']),
    metin: () => t(`Paftalarda ${sayi(g('enh'))} enerji nakil hattı çizimi ve ${sayi(g('pilon'))} pilon var (hesap).`,
      `The sheets show ${sayi(g('enh'))} of power transmission line and ${sayi(g('pilon'))} pylons (calc.).`) },
  { baslik: ['Trafolar', 'Transformers'], cam: merkez(g('trafo').veri, { yaw: -0.2 }), ayar: goster(['trafo', 'havai', 'enh']),
    metin: () => t(`Haritada ${sayi(g('trafo'))} trafo sembolü ve ${sayi(g('havai'))} havai hat çizimi var (hesap). Direkler arasındaki alçak gerilim hatlarının çoğu haritada çizilmemiş.`,
      `The map has ${sayi(g('trafo'))} transformer symbols and ${sayi(g('havai'))} of overhead line drawings (calc.). Most low-voltage lines between poles are not drawn on the map.`) },
  { baslik: ['Sokak lambaları', 'Street lamps'], cam: Object.assign({}, SC.HOME, { dist: 6200, pitch: 0.95 }), ayar: goster(['lamba']),
    metin: () => t(`Haritada ilçe sınırı içinde ${sayi(g('lamba'))} sokak lambası sembolü var.`, `The map has ${sayi(g('lamba'))} street lamp symbols inside the district boundary.`) },
  { baslik: ['Elektrik direkleri', 'Electricity poles'], cam: Object.assign({}, SC.HOME, { dist: 6200, pitch: 0.7, yaw: -0.3 }), ayar: goster(['direk', 'trafo']),
    metin: () => t(`Haritada ilçe sınırı içinde ${sayi(g('direk'))} elektrik direği sembolü var. Direkler 10 m, pilonlar 30 m yükseklikte temsilî olarak çizildi.`, `The map has ${sayi(g('direk'))} electricity pole symbols inside the district boundary. Poles are drawn 10 m high and pylons 30 m high, as a representation.`) }
]);
addEventListener('m3dil', () => { uygula(); });
uygula();
SC.basla();
})();
