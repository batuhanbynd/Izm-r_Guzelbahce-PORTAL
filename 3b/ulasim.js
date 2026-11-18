// =============================================
// Güzelbahçe toplu taşıma: ESHOT hatları ve dolmuş, gerçek arazi ve bina modeli üzerinde
// Veriler: 3b/ulasim-veri.js (ULASIM), 3b/kent-veri.js (KENT), 3b/arazi-veri.js, 3b/zemin.js. Motor: 3b/sahne.js
// Tarifeye göre canlandırma: kaynaktaki ilk/son kalkış ve sefer aralığıyla temsili araç hareketi (aşağıda)
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

// ---------- 400 m alanları: arazi üstü örtü ve bina payı hesabı
// Tuval, zemin haritasıyla aynı çerçevede (ilçenin tamamı, ZEMIN), 5 model birimi / piksel.
// Her daire ayrı doldurulur: üst üste binen daireler birleşir (tek yolda "evenodd" kesişimleri boşaltıyordu).
const ZM = ZEMIN, P = 5;
const OW = Math.round(ZM.w / P), OH = Math.round(ZM.h / P);
const X = x => (x - ZM.mx0) / P, Y = y => (y - ZM.my0) / P;
const ortu = document.createElement('canvas'); ortu.width = OW; ortu.height = OH;
const kapsam = document.createElement('canvas'); kapsam.width = OW; kapsam.height = OH;
const gecici = document.createElement('canvas'); gecici.width = OW; gecici.height = OH;
function alanDoldur(ctx, L) {
  L.alan400.forEach(poly => {
    ctx.beginPath();
    poly.forEach(ring => { ring.forEach((p, k) => k ? ctx.lineTo(X(p[0]), Y(p[1])) : ctx.moveTo(X(p[0]), Y(p[1]))); ctx.closePath(); });
    ctx.fill('evenodd');   // halkanın içindeki delikler (varsa) için; daireler arası birleşim ayrı doldurmayla sağlanır
  });
}
function payHesapla(liste) {
  const ctx = kapsam.getContext('2d', { willReadFrequently: true }); ctx.clearRect(0, 0, OW, OH); ctx.fillStyle = '#fff';
  liste.forEach(L => alanDoldur(ctx, L));
  const d = ctx.getImageData(0, 0, OW, OH).data; let n = 0;
  for (const b of B) {
    const px = Math.floor(X(b.x + SC.HW)), py = Math.floor(Y(b.z + SC.HH));
    if (px >= 0 && py >= 0 && px < OW && py < OH && d[(py * OW + px) * 4 + 3] > 127) n++;
  }
  return n;
}
HATLAR.forEach(L => { L.pay = payHesapla([L]); });
function ortuCiz() {
  const ctx = ortu.getContext('2d'); ctx.clearRect(0, 0, OW, OH);
  const g = gecici.getContext('2d');
  if (S.alan) HATLAR.filter(L => S.secili.has(L.hat)).forEach(L => {
    g.clearRect(0, 0, OW, OH); g.fillStyle = HAT[L.hat].renk; alanDoldur(g, L);
    ctx.globalAlpha = 0.32; ctx.drawImage(gecici, 0, 0); ctx.globalAlpha = 1;
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
    if (TARIFE[L.hat]) ek.push(TARIFE[L.hat].ilk + '–' + TARIFE[L.hat].son);
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
// ---------- tarifeye göre canlandırma (temsili, canlı konum değil)
// İlk ve son kalkış, ortalama sefer aralığı: ekibin raporu (ESHOT sayfası). Hat 8 için "21–22 dk" ortası (21,5) alındı.
// Yolculuk süresi verisi yok: araçlar seçilen ortalama hızla (varsayım) güzergâhın model alanındaki bölümünü gider;
// iki yönde aynı tarife varsayılır. Hat 28 (güzergâh çizimi yok) ve dolmuş (tarife yok) canlandırılmaz.
const TARIFE = {
  '8': { ilk: '06:00', son: '00:30', aralik: 21.5, parca: [0, 1] },
  '82': { ilk: '06:00', son: '00:25', aralik: 30, parca: [0] },
  '684': { ilk: '06:00', son: '21:20', aralik: 25, parca: [0] },
  '9': { ilk: '06:35', son: '20:20', aralik: 120, parca: [0, 1] },
  '762': { ilk: '06:40', son: '16:30', aralik: 120, parca: [0] }
};
const SAAT_MIN = 330, SAAT_MAX = 1530;                       // 05:30 … ertesi gün 01:30 (dakika)
const dakika = s => { const [h, m] = s.split(':').map(Number); return h * 60 + m + (h < 4 ? 1440 : 0); };
const saatYazi = d => { const m = Math.floor(((d % 1440) + 1440) % 1440); return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
HATLAR.forEach(L => {
  const T = TARIFE[L.hat];
  if (!T || !L.guzergah.length) return;
  const nok = []; T.parca.forEach(i => (L.guzergah[i] || []).forEach(p => nok.push(p)));
  const kum = [0]; for (let i = 1; i < nok.length; i++) kum.push(kum[i - 1] + Math.hypot(nok[i][0] - nok[i - 1][0], nok[i][1] - nok[i - 1][1]));
  const kalkis = [], a = dakika(T.ilk), b = dakika(T.son);
  for (let k = a; k <= b + 1e-6; k += T.aralik) kalkis.push(k);
  if (b - kalkis[kalkis.length - 1] > 0.5) kalkis.push(b);   // kaynaktaki son kalkış saati korunur
  L.canli = { T, nok, kum, boy: kum[kum.length - 1], kalkis, pts: [] };
});
// Araçlar ekran katmanında çizilir: her yakınlaştırmada aynı boyutta, parlayan işaretler
const ak = document.createElement('canvas'); ak.id = 'arac-katmani'; ak.setAttribute('aria-hidden', 'true');
document.getElementById('gl').insertAdjacentElement('afterend', ak);
const akx = ak.getContext('2d');
function akBoyut() { const r = Math.min(devicePixelRatio || 1, 2); ak.width = Math.round(innerWidth * r); ak.height = Math.round(innerHeight * r); akx.setTransform(r, 0, 0, r, 0, 0); }
addEventListener('resize', () => { akBoyut(); SC.yenile(); }); akBoyut();
function araclariCiz() {
  akx.clearRect(0, 0, innerWidth, innerHeight);
  CANLI.forEach(L => {
    if (!S.secili.has(L.hat)) return;
    const c = HAT[L.hat].renk;
    L.canli.pts.forEach(p => {
      const x = p[0] - SC.HW, z = p[1] - SC.HH, q = SC.project(x, SC.yer(x, z) + 14, z);
      if (!q) return;
      const g = akx.createRadialGradient(q[0], q[1], 0, q[0], q[1], 20);
      g.addColorStop(0, c + 'dd'); g.addColorStop(0.45, c + '55'); g.addColorStop(1, c + '00');
      akx.fillStyle = g; akx.beginPath(); akx.arc(q[0], q[1], 20, 0, Math.PI * 2); akx.fill();
      akx.fillStyle = c; akx.strokeStyle = '#ffffff'; akx.lineWidth = 2;
      akx.beginPath(); akx.arc(q[0], q[1], 7, 0, Math.PI * 2); akx.fill(); akx.stroke();
    });
  });
}
SC.cizimSonrasi = araclariCiz;
const CANLI = HATLAR.filter(L => L.canli);
const simdi = new Date(), simdiDk = simdi.getHours() * 60 + simdi.getMinutes() + (simdi.getHours() < 4 ? 1440 : 0);
const CS = { saat: simdiDk >= SAAT_MIN && simdiDk <= SAAT_MAX ? simdiDk : 450, carpan: 60, hiz: 20, oynuyor: !matchMedia('(prefers-reduced-motion: reduce)').matches };
function konum(C, s) {
  const k = C.kum; let lo = 0, hi = k.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (k[m] <= s) lo = m; else hi = m; }
  const f = (s - k[lo]) / ((k[hi] - k[lo]) || 1), p = C.nok[lo], q = C.nok[hi];
  return [p[0] + (q[0] - p[0]) * f, p[1] + (q[1] - p[1]) * f];
}
let sonYolda = '';
function araclar() {
  let toplam = 0; const parcalar = [];
  CANLI.forEach(L => {
    const C = L.canli, sure = C.boy * BIRIM / 1000 / CS.hiz * 60;   // dakika
    const pts = [];
    C.kalkis.forEach(t0 => {
      const g = CS.saat - t0;
      if (g < 0 || g > sure) return;
      const s = C.boy * g / sure;
      pts.push(konum(C, s), konum(C, C.boy - s));                 // iki yön
    });
    C.pts = pts;
    if (S.secili.has(L.hat)) { toplam += pts.length; parcalar.push(`<i style="background:${HAT[L.hat].renk}"></i>${L.hat}: ${pts.length}`); }
  });
  SC.yenile();
  const yazi = `<b>${t('Yolda', 'On the road')} ${fmt(toplam)} ${t('araç', toplam === 1 ? 'bus' : 'buses')}</b>${parcalar.join('')}`;
  if (yazi !== sonYolda) { $('o-yolda').innerHTML = yazi; sonYolda = yazi; }
}
function saatGoster() {
  $('o-saat').textContent = saatYazi(CS.saat);
  $('c-saat').value = Math.round(CS.saat);
  $('o-hiz').textContent = fmt(CS.hiz) + ' km/' + t('sa', 'h');
  const b = $('b-oynat'); b.setAttribute('aria-pressed', CS.oynuyor);
  b.setAttribute('aria-label', CS.oynuyor ? t('Durdur', 'Pause') : t('Oynat', 'Play'));
  document.querySelectorAll('#saat-carpan button').forEach(x => x.setAttribute('aria-pressed', Number(x.dataset.k) === CS.carpan));
}
$('b-oynat').onclick = () => { CS.oynuyor = !CS.oynuyor; saatGoster(); };
$('c-saat').oninput = e => { CS.saat = Number(e.target.value); saatGoster(); araclar(); };
$('c-hiz').oninput = e => { CS.hiz = Number(e.target.value); saatGoster(); araclar(); };
document.querySelectorAll('#saat-carpan button').forEach(x => { x.onclick = () => { CS.carpan = Number(x.dataset.k); saatGoster(); }; });
let onceki = performance.now(), sonDakika = -1;
(function tik(an) {
  const dt = Math.min(0.25, Math.max(0, (an - onceki) / 1000)); onceki = an;
  if (CS.oynuyor) {
    CS.saat += dt * CS.carpan / 60;
    if (CS.saat > SAAT_MAX) CS.saat = SAAT_MIN;
    araclar();
    if (Math.floor(CS.saat) !== sonDakika) { sonDakika = Math.floor(CS.saat); saatGoster(); }
  }
  requestAnimationFrame(tik);
})(onceki);
saatGoster(); araclar();
addEventListener('m3dil', () => { liste(); istatistik(); lejant(); uygula(); saatGoster(); sonYolda = ''; araclar(); });
uygula();
SC.basla();
})();
