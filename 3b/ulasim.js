// =============================================
// Güzelbahçe toplu taşıma: ESHOT hatları ve dolmuş, gerçek arazi ve bina modeli üzerinde
// Veriler: 3b/ulasim-veri.js (ULASIM), 3b/kent-veri.js (KENT), 3b/arazi-veri.js, 3b/zemin.js. Motor: 3b/sahne.js
// =============================================
(() => {
"use strict";
const $ = id => document.getElementById(id);
const t = M3.t, fmt = M3.fmt, pct = M3.pct;
// Erişim modeliyle aynı hat renkleri; sıklık grupları ekibin raporundan
const HAT = {
  '8': { renk: '#ed423d', sik: true }, '82': { renk: '#e04dd9', sik: true }, '684': { renk: '#855cfa', sik: true },
  '9': { renk: '#3db354', sik: false }, '28': { renk: '#3d85db', sik: false }, '762': { renk: '#fad638', sik: false }, 'D1': { renk: '#22d3ee', dolmus: true }
};
const hatAd = h => h === 'D1' ? t('Dolmuş · Güzelbahçe–F. Altay', 'Minibus · Güzelbahçe–F. Altay') : t('Hat ', 'Line ') + h;
const sikMetin = h => HAT[h].dolmus ? t('Dolmuş', 'Minibus') : HAT[h].sik ? t('21–30 dakikada bir', 'every 21–30 min') : t('2–4 saatte bir', 'every 2–4 hours');

const SC = M3.sahne({
  kab: 1.5, binaMod: 'gri', zeminSoluk: true,
  noktaIpucu: (K, i) => {
    const p = K.noktalar[i], n = binaSay(p[0], p[1], 400);
    return `<b>${hatAd(K.hat)} · ${t('durak', 'stop')}</b>
      <div><span>${t('Sıklık', 'Frequency')}</span><span>${sikMetin(K.hat)}</span></div>
      <div><span>${t('400 m içindeki bina (hesap)', 'Buildings within 400 m (calc.)')}</span><span>${fmt(n)}</span></div>`;
  },
  turGiris: () => t('Kamera hatları sırayla gezer: sık gelen hatlar, seyrek hatlar ve dolmuş. Her durakta seçili hatların 400 m yürüme alanındaki bina payı hesaplanır.',
    'The camera visits the lines in turn: the frequent lines, the infrequent lines and the minibus. At each stop the share of buildings in the selected lines\' 400 m walking areas is calculated.')
});
if (!SC) return;
const B = SC.binalar, NB = B.length, BIRIM = KENT.birim;
function binaSay(x, y, r) { const rr = r / BIRIM; x -= SC.HW; y -= SC.HH; let n = 0; for (const b of B) if (Math.hypot(b.x - x, b.z - y) <= rr) n++; return n; }

// ---------- katmanlar
const HATLAR = ULASIM.hatlar;
const S = { secili: new Set(HATLAR.map(h => h.hat)), alan: true, kab: 1.5 };
HATLAR.forEach((L, i) => {
  const c = HAT[L.hat].renk;
  L.k = [];
  if (L.guzergah.length) L.k.push(SC.cizgiKatmani(L.guzergah, { renk: c, gen: 9, kal: 5, y: 7 + i * 1.2, yan: (i - 3) * 7, em: 0.55 }));
  if (L.durak.length) {
    L.k.push(SC.noktaKatmani(L.durak, { renk: c, gen: 3, y0: 0, y1: 46, em: 0.2 }));
    const bas = SC.noktaKatmani(L.durak, { renk: c, gen: 16, y0: 44, y1: 60, em: 0.7, secilebilir: true });
    bas.hat = L.hat; L.k.push(bas);
  }
});

// ---------- 400 m alanları: arazi üstü örtü ve bina payı hesabı (4 m/piksel)
const OW = Math.round(SC.W / 4), OH = Math.round(SC.H / 4);
const ortu = document.createElement('canvas'); ortu.width = OW; ortu.height = OH;
const kapsam = document.createElement('canvas'); kapsam.width = OW; kapsam.height = OH;
function yol(ctx, L) {
  ctx.beginPath();
  L.alan400.forEach(poly => poly.forEach(ring => { ring.forEach((p, k) => k ? ctx.lineTo(p[0] / 4, p[1] / 4) : ctx.moveTo(p[0] / 4, p[1] / 4)); ctx.closePath(); }));
}
function payHesapla(liste) {
  const ctx = kapsam.getContext('2d', { willReadFrequently: true }); ctx.clearRect(0, 0, OW, OH); ctx.fillStyle = '#fff';
  liste.forEach(L => { yol(ctx, L); ctx.fill('evenodd'); });
  const d = ctx.getImageData(0, 0, OW, OH).data; let n = 0;
  for (const b of B) {
    const px = Math.floor((b.x + SC.HW) / 4), py = Math.floor((b.z + SC.HH) / 4);
    if (px >= 0 && py >= 0 && px < OW && py < OH && d[(py * OW + px) * 4 + 3] > 127) n++;
  }
  return n;
}
HATLAR.forEach(L => { L.pay = payHesapla([L]); });
function ortuCiz() {
  const ctx = ortu.getContext('2d'); ctx.clearRect(0, 0, OW, OH);
  if (S.alan) HATLAR.filter(L => S.secili.has(L.hat)).forEach(L => {
    yol(ctx, L); ctx.globalAlpha = 0.28; ctx.fillStyle = HAT[L.hat].renk; ctx.fill('evenodd');
    ctx.globalAlpha = 0.9; ctx.lineWidth = 1.6; ctx.strokeStyle = HAT[L.hat].renk; ctx.stroke(); ctx.globalAlpha = 1;
  });
  SC.ortu(ortu, 0.8);
}

// ---------- arayüz
function liste() {
  const el = $('hatlar'); el.innerHTML = '';
  HATLAR.forEach(L => {
    const b = document.createElement('button'); b.type = 'button'; b.style.setProperty('--c', HAT[L.hat].renk);
    b.setAttribute('aria-pressed', S.secili.has(L.hat));
    const ek = [sikMetin(L.hat)];
    if (L.durak.length) ek.push(t('alanda ', '') + fmt(L.durak.length) + t(' durak', L.durak.length === 1 ? ' stop in the area' : ' stops in the area'));
    if (L.uzunluk) ek.push(t('çizim ', 'drawn ') + fmt(L.uzunluk / 1000, 1) + ' km');
    b.innerHTML = `<i></i><span>${hatAd(L.hat)}<small>${ek.join(' · ')}</small></span><em>${pct(L.pay / NB * 100, 1)}</em>`;
    b.title = t('400 m alanındaki bina payı (hesap)', 'Share of buildings in the 400 m area (calc.)');
    b.onclick = () => { if (S.secili.has(L.hat)) S.secili.delete(L.hat); else S.secili.add(L.hat); uygula(); };
    el.appendChild(b);
  });
}
function istatistik() {
  const sec = HATLAR.filter(L => S.secili.has(L.hat)); const n = sec.length ? payHesapla(sec) : 0;
  $('s-pct').textContent = pct(n / NB * 100, 1);
  $('s-txt').textContent = t('binanın, seçili hatların 400 m yürüme alanında olduğu oran (hesap)', 'of buildings are in the selected lines\' 400 m walking areas (calc.)');
  $('s-km').textContent = t(`${fmt(n)} / ${fmt(NB)} bina · ${sec.length} hat seçili`, `${fmt(n)} of ${fmt(NB)} buildings · ${sec.length} lines selected`);
}
function lejant() {
  const sw = (c, txt) => `<span><i style="background:${c}"></i>${txt}</span>`;
  $('lg-key').innerHTML = HATLAR.map(L => sw(HAT[L.hat].renk, hatAd(L.hat))).join('') + sw('#5c6776', t('Bina', 'Building'));
}
function uygula() {
  HATLAR.forEach(L => L.k.forEach(K => { K.gorunur = S.secili.has(L.hat); }));
  SC.kab = S.kab; $('c-kab').value = Math.round(S.kab * 100); $('o-kab').textContent = fmt(S.kab, 1) + '×';
  $('b-alan').setAttribute('aria-pressed', S.alan); $('b-alan').textContent = S.alan ? t('Gösteriliyor', 'Shown') : t('Gizli', 'Hidden');
  ortuCiz(); liste(); istatistik(); lejant(); SC.yenile();
}
$('b-alan').onclick = () => { S.alan = !S.alan; uygula(); };
$('c-kab').oninput = e => { S.kab = e.target.value / 100; uygula(); };

// ---------- gezinti
function kamera(hatlar, ek) {
  const p = []; HATLAR.filter(L => hatlar.includes(L.hat)).forEach(L => { L.durak.forEach(q => p.push(q)); L.guzergah.forEach(c => c.forEach(q => p.push(q))); });
  if (!p.length) return SC.HOME;
  const x0 = Math.min(...p.map(q => q[0])), x1 = Math.max(...p.map(q => q[0])), y0 = Math.min(...p.map(q => q[1])), y1 = Math.max(...p.map(q => q[1]));
  return Object.assign({ tx: (x0 + x1) / 2 - SC.HW, tz: (y0 + y1) / 2 - SC.HH, dist: Math.min(9500, Math.max(2600, Math.max(x1 - x0, (y1 - y0) * 1.8) * 1.15)), pitch: 0.66, yaw: 0.3 }, ek || {});
}
const sec = h => () => { S.secili = new Set(h); uygula(); };
const payMetin = h => { const L = HATLAR.filter(x => h.includes(x.hat)); const n = payHesapla(L); return pct(n / NB * 100, 1); };
SC.tur([
  { baslik: ['Tüm hatlar', 'All lines'], cam: SC.HOME, ayar: sec(HATLAR.map(L => L.hat)),
    metin: () => t(`Çalışmadaki 6 ESHOT hattı ve dolmuşun 400 m yürüme alanlarında kalan bina payı ${payMetin(HATLAR.map(L => L.hat))} (hesap). Renkli alanlar her hattın 400 m alanı.`,
      `Together, the 6 ESHOT lines in the study and the minibus keep ${payMetin(HATLAR.map(L => L.hat))} of the buildings in the model area within a 400 m walk (calc.). The coloured areas are each line's 400 m area.`) },
  { baslik: ['Hat 8', 'Line 8'], cam: kamera(['8']), ayar: sec(['8']),
    metin: () => t(`Hat 8 ${sikMetin('8')} geliyor. Bu hattın 400 m alanında kalan bina payı ${payMetin(['8'])} (hesap).`,
      `Line 8 comes ${sikMetin('8')}. ${payMetin(['8'])} of the buildings in the model area are in this line's 400 m area (calc.).`) },
  { baslik: ['Sık hatlar · 8, 82, 684', 'Frequent lines · 8, 82, 684'], cam: kamera(['8', '82', '684']), ayar: sec(['8', '82', '684']),
    metin: () => t(`21–30 dakikada bir gelen üç hattın 400 m alanlarında kalan bina payı ${payMetin(['8', '82', '684'])} (hesap).`,
      `The three lines that come every 21–30 minutes cover ${payMetin(['8', '82', '684'])} of the buildings together (calc.).`) },
  { baslik: ['Seyrek hatlar · 9, 28, 762', 'Infrequent lines · 9, 28, 762'], cam: kamera(['9', '28', '762'], { yaw: -0.2 }), ayar: sec(['9', '28', '762']),
    metin: () => t(`Kahramandere ve Mustafa Kemal Paşa çevresi 2–4 saatte bir gelen bu hatlara bağlı. Bu hatların 400 m alanlarında kalan bina payı ${payMetin(['9', '28', '762'])} (hesap).`,
      `The area around Kahramandere and Mustafa Kemal Paşa depends on these lines, which come every 2–4 hours. ${payMetin(['9', '28', '762'])} of the buildings are in their 400 m areas (calc.).`) },
  { baslik: ['Dolmuş', 'Minibus'], cam: kamera(['D1'], { yaw: 0.6 }), ayar: sec(['D1']),
    metin: () => t(`Güzelbahçe–Fahrettin Altay dolmuşu. Ekibin çiziminde durak yok, yalnızca güzergâh ve 400 m alanı var; bu alanda kalan bina payı ${payMetin(['D1'])} (hesap).`,
      `The Güzelbahçe–Fahrettin Altay minibus. The team's drawing has no stops, only the route and its 400 m area; this area covers ${payMetin(['D1'])} of the buildings (calc.).`) }
]);
addEventListener('m3dil', () => { liste(); istatistik(); lejant(); uygula(); });
uygula();
SC.basla();
})();
