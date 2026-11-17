// =============================================
// Güzelbahçe senaryo laboratuvarı ("hayal atölyesi")
// Kullanıcı haritaya durak, okul, istasyon, konteyner, lamba ekler ya da deniz seviyesini, kat sayısını değiştirir;
// etkisi gerçek veriden anında hesaplanır. Hiçbir değişiklik portaldaki verilere yazılmaz; durum yalnızca adres satırında tutulur.
// Veriler: KENT, ULASIM, ELEKTRIK, DATA (erişim), SENARYO, ARAZI. Motor: 3b/sahne.js
// =============================================
(() => {
"use strict";
const $ = id => document.getElementById(id);
const t = M3.t, fmt = M3.fmt, pct = M3.pct;
const BIRIM = KENT.birim;                 // 1 model birimi = BIRIM metre
const mB = m => m / BIRIM;                // metre -> model birimi
const Bm = u => u * BIRIM;                // model birimi -> metre
const R = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const GRI = R('#465060'), SOLUK = R('#2f3743');

let aktif = null, ekleModu = false;
const SC = M3.sahne({
  kab: 1.5, binaMod: 'ozel', zeminSoluk: true,
  tikla: (x, y) => { if (aktif && ekleModu && aktif.ekle) { aktif.ekle([x, y]); durumYaz(); } },
  binaIpucu: (b, i) => (aktif && aktif.binaIpucu) ? aktif.binaIpucu(i) : '',
  noktaIpucu: (K, i) => K.ipucu ? K.ipucu(i) : ''
});
if (!SC) return;
const HW = SC.HW, HH = SC.HH, AR = SC.AR;
const B = SC.binalar, NB = B.length;
const BX = new Float64Array(NB), BY = new Float64Array(NB);
B.forEach((b, i) => { BX[i] = b.x + HW; BY[i] = b.z + HH; });
const turBina = tur => { const o = []; B.forEach((b, i) => { if (b.tur === tur) o.push([BX[i], BY[i]]); }); return o; };

// ---------- uzamsal yardımcılar (model birimi)
const anahtar = (a, b) => (a + 5000) * 20000 + (b + 5000);
function kilavuz(p, h) { const g = new Map(); p.forEach((q, j) => { const k = anahtar(Math.floor(q[0] / h), Math.floor(q[1] / h)); let L = g.get(k); if (!L) g.set(k, L = []); L.push(j); }); return { g, h, p }; }
function yakin(K, x, y, r, fn) {
  const h = K.h, cx = Math.floor(x / h), cy = Math.floor(y / h), n = Math.ceil(r / h);
  for (let a = -n; a <= n; a++) for (let b = -n; b <= n; b++) {
    const L = K.g.get(anahtar(cx + a, cy + b)); if (!L) continue;
    for (const j of L) { const d = Math.hypot(K.p[j][0] - x, K.p[j][1] - y); if (d <= r) fn(j, d); }
  }
}
// hedeflerin (xs, ys) en yakın tesise uzaklığı; r'den uzaksa Infinity
function enYakin(xs, ys, tesis, r) {
  const out = new Float32Array(xs.length).fill(Infinity); if (!tesis.length) return out;
  const K = kilavuz(tesis, r);
  for (let i = 0; i < xs.length; i++) { let en = Infinity; yakin(K, xs[i], ys[i], r, (j, d) => { if (d < en) en = d; }); out[i] = en; }
  return out;
}
// Açgözlü yer önerisi: kapsanmamış hedefleri en çok kapsayan 'adet' nokta (adaylar: kapsanmamış hedeflerin konumları)
function oner(xs, ys, acik, r, adet) {
  const idx = []; for (let i = 0; i < xs.length; i++) if (acik(i)) idx.push(i);
  if (!idx.length) return [];
  const hp = idx.map(i => [xs[i], ys[i]]), KH = kilavuz(hp, r);
  const adim = Math.max(1, Math.floor(idx.length / 2500)), aday = []; for (let k = 0; k < hp.length; k += adim) aday.push(hp[k]);
  const alindi = new Uint8Array(hp.length), sonuc = [];
  for (let s = 0; s < adet; s++) {
    let en = -1, enK = 0;
    for (let c = 0; c < aday.length; c++) { let k = 0; yakin(KH, aday[c][0], aday[c][1], r, j => { if (!alindi[j]) k++; }); if (k > enK) { enK = k; en = c; } }
    if (en < 0) break;
    sonuc.push(aday[en]); yakin(KH, aday[en][0], aday[en][1], r, j => { alindi[j] = 1; });
  }
  return sonuc;
}

// ---------- bina renkleri, örtü, işaretler
const RGBA = new Uint8Array(NB * 4);
function boya(fn) { for (let i = 0; i < NB; i++) { const c = fn(i); RGBA[i * 4] = c[0]; RGBA[i * 4 + 1] = c[1]; RGBA[i * 4 + 2] = c[2]; RGBA[i * 4 + 3] = c[3] || 0; } SC.binaRenkleri(RGBA); }
const ZM = ZEMIN, OP = 8;
const ov = document.createElement('canvas'); ov.width = Math.round(ZM.w / OP); ov.height = Math.round(ZM.h / OP);
const ox = ov.getContext('2d');
const px = x => (x - ZM.mx0) / OP, py = y => (y - ZM.my0) / OP;
const ortuTemizle = () => ox.clearRect(0, 0, ov.width, ov.height);
const ortuGonder = a => SC.ortu(ov, a === undefined ? 0.8 : a);
function halka(p, r, renk, dolgu) {
  ox.beginPath(); ox.arc(px(p[0]), py(p[1]), r / OP, 0, Math.PI * 2);
  if (dolgu) { ox.globalAlpha = dolgu; ox.fillStyle = renk; ox.fill(); }
  ox.globalAlpha = 0.95; ox.lineWidth = 1.6; ox.strokeStyle = renk; ox.stroke(); ox.globalAlpha = 1;
}
const KM = { g: SC.noktaKatmani([], { renk: '#94a3b8', gen: 3, y0: 0, y1: 26, em: 0.2 }), b: SC.noktaKatmani([], { renk: '#94a3b8', gen: 11, y0: 24, y1: 35, em: 0.6, secilebilir: true }) };
const KY = { g: SC.noktaKatmani([], { renk: '#a3e635', gen: 4, y0: 0, y1: 72, em: 0.4 }), b: SC.noktaKatmani([], { renk: '#a3e635', gen: 20, y0: 68, y1: 88, em: 1.1, secilebilir: true }) };
function isaretler(mevcut, yeni, renk, ipM, ipY, olcek) {
  const k = olcek || 1;
  SC.noktaGuncelle(KM.g, mevcut); SC.noktaGuncelle(KM.b, mevcut); SC.renkAyarla(KM.g, renk || '#94a3b8'); SC.renkAyarla(KM.b, renk || '#94a3b8');
  KM.g.y1 = 26 * k; KM.b.y0 = 24 * k; KM.b.y1 = 35 * k; KM.b.gen = 11 * Math.sqrt(k);
  SC.noktaGuncelle(KY.g, yeni); SC.noktaGuncelle(KY.b, yeni);
  KM.b.ipucu = ipM || null; KY.b.ipucu = ipY || null;
}

// ---------- arayüz yardımcıları
const m = v => fmt(Math.round(v)) + ' m';
function kaydirici(id, etiket, min, max, adim, deger, bicim) {
  return `<div class="ctl"><div class="ctl-head"><label for="${id}">${etiket}</label><output id="o-${id}">${bicim(deger)}</output></div>` +
    `<input id="${id}" type="range" min="${min}" max="${max}" step="${adim}" value="${deger}"></div>`;
}
function bagla(id, bicim, fn) { const el = $(id); if (!el) return; el.oninput = () => { $('o-' + id).textContent = bicim(+el.value); fn(+el.value); }; }
function sonucKart(o) {
  const fs = o.fark === undefined ? '' : `<div class="fark ${o.farkSinif || ''}">${o.fark}</div>`;
  return `<div class="sn-sonuc"><div class="et">${o.et}</div>` +
    `<div class="once"><small>${o.onceEt || t('Bugün', 'Today')}</small><b>${o.once}</b></div><div class="ok" aria-hidden="true">→</div>` +
    `<div class="sonra"><small>${o.sonraEt || t('Senaryo', 'Scenario')}</small><b>${o.sonra}</b></div>${fs}</div>`;
}
const satir = (et, v) => `<div class="sn-satir"><span>${et}</span><b>${v}</b></div>`;
function eylemler(o) {
  let h = '<div class="sn-eylem">';
  if (o.ekle) h += `<button id="e-ekle" type="button" aria-pressed="${ekleModu}">${ekleModu ? t('Eklemeyi bitir', 'Stop adding') : t('Haritaya ekle', 'Add on the map')}</button>`;
  if (o.oner) h += `<button id="e-oner" type="button">${o.oner}</button>`;
  if (o.ekle) h += `<button id="e-geri" type="button" ${o.geriYok ? 'disabled' : ''}>${t('Geri al', 'Undo')}</button>`;
  return h + '</div>';
}
function eylemBagla(sn) {
  if ($('e-ekle')) $('e-ekle').onclick = () => { ekleModuAyarla(!ekleModu); };
  if ($('e-oner')) $('e-oner').onclick = () => { calis(() => { sn.oner(); durumYaz(); }); };
  if ($('e-geri')) $('e-geri').onclick = () => { sn.geriAl(); durumYaz(); };
}
function ekleModuAyarla(v) {
  ekleModu = !!v && !!(aktif && aktif.ekle);
  document.body.classList.toggle('ekle-modu', ekleModu);
  $('ekle-ipucu').hidden = !ekleModu;
  if (ekleModu && aktif) $('ekle-metin').textContent = aktif.ekleMetni();
  const b = $('e-ekle'); if (b) { b.setAttribute('aria-pressed', ekleModu); b.textContent = ekleModu ? t('Eklemeyi bitir', 'Stop adding') : t('Haritaya ekle', 'Add on the map'); }
}
addEventListener('keydown', e => { if (e.key === 'Escape' && ekleModu) ekleModuAyarla(false); });
function calis(fn) { const d = $('hesap-durum'); if (d) d.textContent = t('Hesaplanıyor…', 'Calculating…'); document.body.style.cursor = 'progress'; setTimeout(() => { fn(); document.body.style.cursor = ''; const d2 = $('hesap-durum'); if (d2) d2.textContent = ''; }, 30); }
function lejant(baslik, ogeler) {
  $('lg-baslik').textContent = baslik;
  $('lg-key').innerHTML = ogeler.map(o => `<span><i style="background:${o[0]}"></i>${o[1]}</span>`).join('');
}
const farkPuan = (a, b, iyiArtis) => {
  const d = b - a, s = (d > 0 ? '+' : d < 0 ? '−' : '±') + fmt(Math.abs(d), 1) + t(' puan', ' pts');
  return { fark: s, farkSinif: Math.abs(d) < 0.05 ? 'notr' : ((d > 0) === iyiArtis ? '' : 'kotu') };
};
const yuzde = (n, top) => top ? n / top * 100 : 0;

// ---------- veri hazırlığı
const DURAKLAR = []; const HATDURAK = {};
ULASIM.hatlar.forEach(L => {
  HATDURAK[L.hat] = L.hat === 'D1' ? [].concat(...L.guzergah) : L.durak.slice();   // dolmuş: güzergâh boyunca koridor
  if (L.hat !== 'D1') L.durak.forEach(p => DURAKLAR.push(p));
});
const LAMBA = (() => { const a = M3.b64u16(ELEKTRIK.nokta.lamba || ''), o = []; for (let i = 0; i + 1 < a.length; i += 2) o.push([a[i] * ELEKTRIK.olcek + ELEKTRIK.ox, a[i + 1] * ELEKTRIK.olcek + ELEKTRIK.oy]); return o; })();
const HAT_RENK = { '8': '#ed423d', '82': '#e04dd9', '684': '#855cfa', '9': '#3db354', '28': '#3d85db', '762': '#fad638', 'D1': '#22d3ee' };
const hatAd = h => h === 'D1' ? t('Dolmuş', 'Minibus') : h;

// =============================================
// Senaryolar
// =============================================
const SEN = [];

// ---------- 1) 15 dakikalık kent
SEN.push((() => {
  const HZ = [
    { id: 'durak', ad: ['Otobüs durağı', 'Bus stop'], renk: '#f472b6', p: DURAKLAR },
    { id: 'okul', ad: ['Okul', 'School'], renk: '#43c08a', p: turBina(3) },
    { id: 'ticaret', ad: ['Ticaret', 'Shops'], renk: '#f39a3d', p: turBina(1) },
    { id: 'resmi', ad: ['Resmî kurum', 'Public office'], renk: '#5b8def', p: turBina(2) },
    { id: 'ibadet', ad: ['Cami, mescit', 'Mosque'], renk: '#a78bfa', p: SENARYO.cami.concat(turBina(4)) }
  ];
  const KON = []; B.forEach((b, i) => { if (b.tur === 0) KON.push(i); });
  const KX = KON.map(i => BX[i]), KY2 = KON.map(i => BY[i]), KIDX = new Int32Array(NB).fill(-1); KON.forEach((i, k) => { KIDX[i] = k; });
  const S = { sure: 15, hiz: 4.8, egim: true, sec: 'okul', ek: { durak: [], okul: [], ticaret: [], resmi: [], ibadet: [] } };
  let T0 = null, T = null, hazirParam = '';
  const PUAN = ['#b91c4b', '#e2553c', '#f08c3a', '#e9c46a', '#9bd17a', '#34c48b'];
  const rMaxU = () => mB(S.hiz / 3.6 * S.sure * 60 * 1.25);
  // a -> b yürüme süresi (dk): düzde S.hiz, eğimde Tobler bağıntısı (düz hıza göre ölçeklenmiş)
  function zaman(x0, y0, x1, y1) {
    const L = Bm(Math.hypot(x1 - x0, y1 - y0)), v0 = S.hiz / 3.6;
    if (!S.egim || L < 1) return L / v0 / 60;
    const n = Math.max(1, Math.ceil(L / 40)), seg = L / n; let sn = 0, h0 = AR.yer(x0 - HW, y0 - HH);
    for (let k = 1; k <= n; k++) {
      const f = k / n, h1 = AR.yer(x0 + (x1 - x0) * f - HW, y0 + (y1 - y0) * f - HH), s = (h1 - h0) / seg;
      sn += seg / (v0 * Math.exp(-3.5 * Math.abs(s + 0.05)) / Math.exp(-0.175)); h0 = h1;
    }
    return sn / 60;
  }
  function tabanHesapla() {
    const r = rMaxU(); T0 = {}; T = {};
    HZ.forEach(H => {
      const K = kilavuz(H.p, r), a = new Float32Array(KON.length).fill(Infinity);
      for (let k = 0; k < KON.length; k++) {
        const ad = []; yakin(K, KX[k], KY2[k], r, (j, d) => ad.push([d, j]));
        ad.sort((p, q) => p[0] - q[0]);
        for (let c = 0; c < Math.min(3, ad.length); c++) { const q = H.p[ad[c][1]]; const z = zaman(KX[k], KY2[k], q[0], q[1]); if (z < a[k]) a[k] = z; }
      }
      T0[H.id] = a; T[H.id] = a.slice();
    });
    hazirParam = S.sure + '|' + S.hiz + '|' + S.egim;
    HZ.forEach(H => S.ek[H.id].forEach(p => uygulaEk(H.id, p)));
  }
  function uygulaEk(id, p) {
    const r = rMaxU(), a = T[id];
    for (let k = 0; k < KON.length; k++) {
      const d = Math.hypot(KX[k] - p[0], KY2[k] - p[1]); if (d > r) continue;
      const z = zaman(KX[k], KY2[k], p[0], p[1]); if (z < a[k]) a[k] = z;
    }
  }
  function yenidenEk(id) { T[id] = T0[id].slice(); S.ek[id].forEach(p => uygulaEk(id, p)); }
  const puan = (TT, k) => HZ.reduce((s, H) => s + (TT[H.id][k] <= S.sure ? 1 : 0), 0);
  const H = () => HZ.find(h => h.id === S.sec);
  return {
    id: 'onbes', renk: '#34c48b', ad: ['15 dakikalık kent', '15-minute city'],
    ikon: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/>',
    ekleMetni: () => t(`Haritaya tıklayın: ${H().ad[0].toLowerCase()} eklenecek · Esc ile çıkın`, `Click the map to add a ${H().ad[1].toLowerCase()} · Esc to stop`),
    kamera: () => Object.assign({}, SC.HOME, { dist: 12500, pitch: 0.9 }),
    kur() {
      $('govde').innerHTML = `<h2>${t('15 dakikalık kent', '15-minute city')}</h2>
        <p class="ack">${t('Her konuttan beş temel hizmete yürüme süresi: otobüs durağı, okul, ticaret, resmî kurum, cami. Bir hizmet ekleyin ya da sistemin en çok konuta erişim sağlayacak yeri önermesine izin verin.', 'Walking time from every home to five basic services: bus stop, school, shops, public office, mosque. Add a service, or let the system suggest the place that reaches the most homes.')}</p>
        <div class="sn-cip" id="hz">${HZ.map(h => `<button type="button" data-h="${h.id}" style="--c:${h.renk}" aria-pressed="${h.id === S.sec}"><i></i>${t(h.ad[0], h.ad[1])}</button>`).join('')}</div>
        ${eylemler({ ekle: true, oner: t('En iyi 3 yeri öner', 'Suggest the best 3 places'), geriYok: !S.ek[S.sec].length })}
        <div id="sonuc"></div>
        ${kaydirici('s-sure', t('Yürüme süresi', 'Walking time'), 5, 20, 1, S.sure, v => v + t(' dk', ' min'))}
        ${kaydirici('s-hiz', t('Düzde yürüme hızı (varsayım)', 'Walking speed on the flat (assumption)'), 3, 6, 0.1, S.hiz, v => fmt(v, 1) + t(' km/sa', ' km/h'))}
        <div class="anahtar"><span>${t('Yokuşu hesaba kat (Tobler)', 'Account for slopes (Tobler)')}</span><button id="s-egim" type="button" aria-pressed="${S.egim}">${S.egim ? t('Açık', 'On') : t('Kapalı', 'Off')}</button></div>
        <span id="hesap-durum"></span>
        <p class="sn-not">${t('Mesafe konut ile hizmet arasındaki düz çizgi boyunca; gerçek yol daha uzundur. Ticaret ve resmî kurum halihazır haritadaki bina türlerinden. Eğim açıkken süre, 20 m\'lik arazi kotlarıyla Tobler yürüyüş bağıntısına göre hesaplanır.', 'Distance is the straight line from the home to the service; the real route is longer. Shops and public offices come from the building types on the base map. With slopes on, time follows the Tobler hiking function on the terrain heights.')}</p>`;
      $('hz').querySelectorAll('button').forEach(b => b.onclick = () => { S.sec = b.dataset.h; this.kur(); });
      bagla('s-sure', v => v + t(' dk', ' min'), v => { S.sure = v; calis(() => this.hesap()); });
      bagla('s-hiz', v => fmt(v, 1) + t(' km/sa', ' km/h'), v => { S.hiz = v; calis(() => this.hesap()); });
      $('s-egim').onclick = () => { S.egim = !S.egim; this.kur(); };
      eylemBagla(this);
      calis(() => this.hesap());
    },
    hesap() {
      if (!T0 || hazirParam !== S.sure + '|' + S.hiz + '|' + S.egim) tabanHesapla();
      const n = KON.length; let p0 = 0, p1 = 0, tam0 = 0, tam1 = 0; const pu = new Uint8Array(n);
      for (let k = 0; k < n; k++) { const a = puan(T0, k), b = puan(T, k); pu[k] = b; p0 += a; p1 += b; if (a === 5) tam0++; if (b === 5) tam1++; }
      const f = farkPuan(yuzde(tam0, n), yuzde(tam1, n), true);
      let h = sonucKart({ et: t(`5 hizmetin tümüne ${S.sure} dakikada yürüyerek ulaşan konutlar`, `Homes that reach all 5 services within a ${S.sure}-minute walk`), once: pct(yuzde(tam0, n), 1), sonra: pct(yuzde(tam1, n), 1), fark: f.fark, farkSinif: f.farkSinif });
      h += '<div class="sn-satirlar">' + satir(t('Ortalama hizmet puanı (0–5)', 'Average service score (0–5)'), fmt(p0 / n, 2) + ' → <em>' + fmt(p1 / n, 2) + '</em>');
      HZ.forEach(H2 => { let a = 0, b = 0; for (let k = 0; k < n; k++) { if (T0[H2.id][k] <= S.sure) a++; if (T[H2.id][k] <= S.sure) b++; } h += satir(t(H2.ad[0], H2.ad[1]), pct(yuzde(a, n), 1) + ' → <em>' + pct(yuzde(b, n), 1) + '</em>'); });
      $('sonuc').innerHTML = h + '</div>';
      boya(i => { const k = KIDX[i]; return k < 0 ? SOLUK : R(PUAN[pu[k]]); });
      const Hs = H();
      ortuTemizle(); S.ek[Hs.id].forEach(p => halka(p, mB(S.hiz / 3.6 * S.sure * 60), '#a3e635', 0.08)); ortuGonder(0.85);
      isaretler(Hs.p, S.ek[Hs.id], Hs.renk, () => `<b>${t(Hs.ad[0], Hs.ad[1])}</b><div><span>${t('Kaynak', 'Source')}</span><span>${t('mevcut', 'existing')}</span></div>`,
        () => `<b>${t(Hs.ad[0], Hs.ad[1])}</b><div><span>${t('Kaynak', 'Source')}</span><span>${t('senaryo', 'scenario')}</span></div>`, 1);
      lejant(t('Ulaşılan hizmet (konut)', 'Services reached (homes)'), PUAN.map((c, i) => [c, i + (i === 5 ? t(' · hepsi', ' · all') : '')]).concat([['#2f3743', t('Konut dışı bina', 'Not a home')], ['#a3e635', t('Eklenen', 'Added')]]));
      if ($('e-geri')) $('e-geri').disabled = !S.ek[S.sec].length;
    },
    ekle(p) { S.ek[S.sec].push(p); if (T) { uygulaEk(S.sec, p); this.hesap(); } },
    geriAl() { S.ek[S.sec].pop(); yenidenEk(S.sec); this.hesap(); },
    oner() {
      const r = mB(S.hiz / 3.6 * S.sure * 60), a = T[S.sec];
      oner(KX, KY2, k => a[k] > S.sure, r, 3).forEach(p => { S.ek[S.sec].push(p); uygulaEk(S.sec, p); });
      this.hesap();
    },
    binaIpucu(i) {
      const k = KIDX[i]; if (k < 0) return `<b>${t(M3.TUR_AD[B[i].tur][0], M3.TUR_AD[B[i].tur][1])}</b><div><span>${t('Hesap', 'Calc.')}</span><span>${t('yalnız konutlar', 'homes only')}</span></div>`;
      return `<b>${t('Konut', 'Home')} · ${puan(T, k)}/5</b>` + HZ.map(H2 => `<div><span>${t(H2.ad[0], H2.ad[1])}</span><span class="${T[H2.id][k] <= S.sure ? 'good' : 'bad'}">${isFinite(T[H2.id][k]) ? fmt(T[H2.id][k], 0) + t(' dk', ' min') : '>' + Math.round(S.sure * 1.25) + t(' dk', ' min')}</span></div>`).join('');
    },
    durum: () => S, yukle(d) { Object.assign(S, d); T0 = null; },
    sifirla() { HZ.forEach(H2 => { S.ek[H2.id] = []; }); T0 = null; }
  };
})());

// ---------- 2) Toplu taşıma: hat kapatma ve yeni durak
SEN.push((() => {
  const S = { r: 400, kapali: [], ek: [] };
  let D0 = null, D1 = null;
  const aktifDurak = () => { const o = []; ULASIM.hatlar.forEach(L => { if (!S.kapali.includes(L.hat)) HATDURAK[L.hat].forEach(p => o.push(p)); }); return o.concat(S.ek); };
  const tumDurak = () => { const o = []; ULASIM.hatlar.forEach(L => HATDURAK[L.hat].forEach(p => o.push(p))); return o; };
  const sinif = i => { const a = D0[i] <= mB(S.r), b = D1[i] <= mB(S.r); return a && b ? 0 : (!a && b ? 1 : (a && !b ? 2 : 3)); };
  const RENK = ['#2f8f87', '#a3e635', '#f97316', '#b91c4b'];
  return {
    id: 'durak', renk: '#f472b6', ad: ['Toplu taşıma', 'Public transport'],
    ikon: '<rect x="5" y="3.5" width="14" height="14" rx="2.5"/><path d="M5 11h14M8 21l1-3.5M16 21l-1-3.5"/><circle cx="8.5" cy="14.5" r=".8"/><circle cx="15.5" cy="14.5" r=".8"/>',
    ekleMetni: () => t('Haritaya tıklayın: yeni otobüs durağı eklenecek · Esc ile çıkın', 'Click the map to add a new bus stop · Esc to stop'),
    kamera: () => Object.assign({}, SC.HOME, { dist: 12000, pitch: 0.9 }),
    kur() {
      $('govde').innerHTML = `<h2>${t('Toplu taşıma', 'Public transport')}</h2>
        <p class="ack">${t('Bir hattı kapatırsanız ya da yeni durak eklerseniz, durağa yürüme mesafesindeki bina sayısı nasıl değişir? Hatlara tıklayarak kapatıp açın.', 'What happens to the number of buildings within walking distance of a stop if you close a line or add new stops? Click the lines to switch them off and on.')}</p>
        <div class="sn-cip" id="hatlar">${ULASIM.hatlar.map(L => `<button type="button" class="${S.kapali.includes(L.hat) ? 'kapali' : ''}" data-h="${L.hat}" style="--c:${HAT_RENK[L.hat]}" aria-pressed="${!S.kapali.includes(L.hat)}"><i></i>${hatAd(L.hat)}</button>`).join('')}</div>
        ${eylemler({ ekle: true, oner: t('En iyi 3 durağı öner', 'Suggest the best 3 stops'), geriYok: !S.ek.length })}
        <div id="sonuc"></div>
        ${kaydirici('s-r', t('Durağa yürüme mesafesi', 'Walking distance to a stop'), 300, 600, 25, S.r, v => v + ' m')}
        <span id="hesap-durum"></span>
        <p class="sn-not">${t('Duraklar ve dolmuş güzergâhı ekibin QGIS çizimlerinden; mesafe kuş uçuşu. "Bugün" tüm hatlar açıkken; senaryoda kapattığınız hatlar ve eklediğiniz duraklar var.', 'Stops and the minibus route come from the team\'s QGIS drawings; distance is straight-line. "Today" has all lines on; the scenario has the lines you closed and the stops you added.')}</p>`;
      $('hatlar').querySelectorAll('button').forEach(b => b.onclick = () => { const h = b.dataset.h; S.kapali = S.kapali.includes(h) ? S.kapali.filter(x => x !== h) : S.kapali.concat([h]); this.kur(); durumYaz(); });
      bagla('s-r', v => v + ' m', v => { S.r = v; this.hesap(); durumYaz(); });
      eylemBagla(this); this.hesap();
    },
    hesap() {
      const r = mB(S.r);
      D0 = enYakin(BX, BY, tumDurak(), r); D1 = enYakin(BX, BY, aktifDurak(), r);
      let a = 0, b = 0, yeni = 0, kayip = 0;
      for (let i = 0; i < NB; i++) { const x = D0[i] <= r, y = D1[i] <= r; if (x) a++; if (y) b++; if (!x && y) yeni++; if (x && !y) kayip++; }
      const f = farkPuan(yuzde(a, NB), yuzde(b, NB), true);
      $('sonuc').innerHTML = sonucKart({ et: t(`Durağa ${S.r} m içindeki binalar`, `Buildings within ${S.r} m of a stop`), once: pct(yuzde(a, NB), 1), sonra: pct(yuzde(b, NB), 1), fark: f.fark, farkSinif: f.farkSinif }) +
        '<div class="sn-satirlar">' + satir(t('Yeni kapsanan bina', 'Newly covered buildings'), '<em>' + fmt(yeni) + '</em>') + satir(t('Kapsamdan çıkan bina', 'Buildings no longer covered'), fmt(kayip)) +
        satir(t('Kapsam dışında kalan bina', 'Buildings still outside'), fmt(NB - b)) + satir(t('Eklenen durak', 'Added stops'), fmt(S.ek.length)) + '</div>';
      boya(i => R(RENK[sinif(i)]));
      ortuTemizle(); S.ek.forEach(p => halka(p, r, '#a3e635', 0.08)); ortuGonder(0.85);
      const mev = []; ULASIM.hatlar.forEach(L => { if (!S.kapali.includes(L.hat) && L.hat !== 'D1') L.durak.forEach(p => mev.push(p)); });
      isaretler(mev, S.ek, '#f472b6', () => `<b>${t('Mevcut durak', 'Existing stop')}</b>`, () => `<b>${t('Yeni durak (senaryo)', 'New stop (scenario)')}</b>`);
      lejant(t(`Durağa ${S.r} m`, `${S.r} m to a stop`), [[RENK[0], t('Kapsanıyor', 'Covered')], [RENK[1], t('Senaryoyla kapsanan', 'Covered by the scenario')], [RENK[2], t('Kapsamdan çıkan', 'No longer covered')], [RENK[3], t('Kapsam dışı', 'Not covered')], ['#f472b6', t('Durak', 'Stop')]]);
      if ($('e-geri')) $('e-geri').disabled = !S.ek.length;
    },
    ekle(p) { S.ek.push(p); this.hesap(); },
    geriAl() { S.ek.pop(); this.hesap(); },
    oner() { const r = mB(S.r); oner(BX, BY, i => !(D1[i] <= r), r, 3).forEach(p => S.ek.push(p)); this.hesap(); },
    binaIpucu(i) { return `<b>${t(M3.TUR_AD[B[i].tur][0], M3.TUR_AD[B[i].tur][1])}</b><div><span>${t('En yakın durak · bugün', 'Nearest stop · today')}</span><span>${isFinite(D0[i]) ? m(Bm(D0[i])) : '>' + S.r + ' m'}</span></div><div><span>${t('Senaryo', 'Scenario')}</span><span>${isFinite(D1[i]) ? m(Bm(D1[i])) : '>' + S.r + ' m'}</span></div>`; },
    durum: () => S, yukle(d) { Object.assign(S, d); },
    sifirla() { S.kapali = []; S.ek = []; }
  };
})());

// ---------- 3) Metro
SEN.push((() => {
  const S = { r: 800, ekip: true, ek: [] };
  let D = null;
  const istasyon = () => (S.ekip ? SENARYO.metro : []).concat(S.ek);
  const SIK = []; ['8', '82', '684'].forEach(h => (HATDURAK[h] || []).forEach(p => SIK.push(p)));
  let sikPay = null;
  return {
    id: 'metro', renk: '#a78bfa', ad: ['Metro', 'Metro'],
    ikon: '<rect x="6" y="3" width="12" height="15" rx="3"/><path d="M6 11h12M9 21l1.5-3M15 21l-1.5-3"/><circle cx="9.5" cy="14.5" r=".8"/><circle cx="14.5" cy="14.5" r=".8"/>',
    ekleMetni: () => t('Haritaya tıklayın: metro istasyonu eklenecek · Esc ile çıkın', 'Click the map to add a metro station · Esc to stop'),
    kamera: () => Object.assign({}, SC.HOME, { tz: SC.HOME.tz - 1800, dist: 11000, pitch: 0.85 }),
    kur() {
      $('govde').innerHTML = `<h2>${t('Metro gelirse', 'If the metro comes')}</h2>
        <p class="ack">${t('Ekibin tahmini metro istasyonlarının yürüme mesafesinde kaç bina kalır? İstasyon ekleyin, ekibin istasyonlarını kapatın, ya da sistemin en çok binaya ulaşan yerleri önermesine izin verin.', 'How many buildings are within walking distance of the team\'s estimated metro stations? Add stations, switch the team\'s stations off, or let the system suggest the places that reach the most buildings.')}</p>
        <div class="anahtar"><span>${t('Ekibin tahmini istasyonları (11)', 'The team\'s estimated stations (11)')}</span><button id="s-ekip" type="button" aria-pressed="${S.ekip}">${S.ekip ? t('Açık', 'On') : t('Kapalı', 'Off')}</button></div>
        ${eylemler({ ekle: true, oner: t('En iyi 3 istasyonu öner', 'Suggest the best 3 stations'), geriYok: !S.ek.length })}
        <div id="sonuc"></div>
        ${kaydirici('s-r', t('İstasyona yürüme mesafesi', 'Walking distance to a station'), 400, 1200, 50, S.r, v => v + ' m')}
        <span id="hesap-durum"></span>
        <p class="sn-not">${t('İstasyonlar ekibin "tahmini metro" QGIS çiziminden (11 istasyon, 4\'ü ilçe sınırı içinde); güzergâh çizimde yok. Brüt inşaat alanı = taban alanı × kat adedi (kat bilgisi olan binalar, hesap). Mesafe kuş uçuşu.', 'Stations come from the team\'s "estimated metro" QGIS drawing (11 stations, 4 inside the district); the drawing has no route. Gross floor area = footprint × floors (buildings with a floor count, calc.). Distance is straight-line.')}</p>`;
      $('s-ekip').onclick = () => { S.ekip = !S.ekip; this.kur(); durumYaz(); };
      bagla('s-r', v => v + ' m', v => { S.r = v; this.hesap(); durumYaz(); });
      eylemBagla(this); this.hesap();
    },
    hesap() {
      const r = mB(S.r); D = enYakin(BX, BY, istasyon(), r);
      if (sikPay === null) { const d = enYakin(BX, BY, SIK, mB(400)); let n = 0; for (let i = 0; i < NB; i++) if (d[i] <= mB(400)) n++; sikPay = yuzde(n, NB); }
      let n = 0, kon = 0, alan = 0; for (let i = 0; i < NB; i++) if (D[i] <= r) { n++; if (B[i].tur === 0) kon++; if (B[i].kat) alan += B[i].alan * B[i].kat; }
      $('sonuc').innerHTML = sonucKart({ et: t(`İstasyona ${S.r} m içindeki binalar`, `Buildings within ${S.r} m of a station`), onceEt: t('Bugün (metro yok)', 'Today (no metro)'), once: '0', sonra: fmt(n), fark: '+' + pct(yuzde(n, NB), 1) + t(' bina payı', ' of buildings'), farkSinif: n ? '' : 'notr' }) +
        '<div class="sn-satirlar">' + satir(t('Konut', 'Homes'), fmt(kon)) + satir(t('Brüt inşaat alanı (hesap)', 'Gross floor area (calc.)'), fmt(Math.round(alan / 1000) * 1000) + ' m²') +
        satir(t('Karşılaştırma: sık otobüs hatlarına 400 m (bugün)', 'For comparison: within 400 m of frequent bus lines (today)'), pct(sikPay, 1)) + satir(t('İstasyon sayısı', 'Stations'), fmt(istasyon().length)) + '</div>';
      boya(i => D[i] <= r ? R('#a78bfa') : GRI);
      ortuTemizle(); (S.ekip ? SENARYO.metro : []).forEach(p => halka(p, r, '#a78bfa', 0.06)); S.ek.forEach(p => halka(p, r, '#a3e635', 0.08)); ortuGonder(0.85);
      isaretler(S.ekip ? SENARYO.metro : [], S.ek, '#a78bfa', () => `<b>${t('Tahmini metro istasyonu', 'Estimated metro station')}</b><div><span>${t('Kaynak', 'Source')}</span><span>${t('ekip çizimi', 'team drawing')}</span></div>`, () => `<b>${t('Yeni istasyon (senaryo)', 'New station (scenario)')}</b>`, 2.2);
      lejant(t(`İstasyona ${S.r} m`, `${S.r} m to a station`), [['#a78bfa', t('Yürüme mesafesinde', 'Within walking distance')], ['#465060', t('Uzakta', 'Further away')], ['#a3e635', t('Eklenen istasyon', 'Added station')]]);
      if ($('e-geri')) $('e-geri').disabled = !S.ek.length;
    },
    ekle(p) { S.ek.push(p); this.hesap(); },
    geriAl() { S.ek.pop(); this.hesap(); },
    oner() { const r = mB(S.r); oner(BX, BY, i => !(D[i] <= r), r, 3).forEach(p => S.ek.push(p)); this.hesap(); },
    binaIpucu(i) { return `<b>${t(M3.TUR_AD[B[i].tur][0], M3.TUR_AD[B[i].tur][1])}</b><div><span>${t('En yakın istasyon', 'Nearest station')}</span><span>${isFinite(D[i]) ? m(Bm(D[i])) : '>' + S.r + ' m'}</span></div>`; },
    durum: () => S, yukle(d) { Object.assign(S, d); },
    sifirla() { S.ekip = true; S.ek = []; }
  };
})());

// ---------- 4) Atık konteyneri (erişim modelinin 50 m yerleşim hücreleri)
SEN.push((() => {
  const CS = DATA.cell, HUC = DATA.cells, NC = HUC.length;
  const CX = HUC.map(c => (c[0] + 0.5) * CS), CY = HUC.map(c => (c[1] + 0.5) * CS), DC = HUC.map(c => c[4]);
  const HMAP = new Map(HUC.map((c, k) => [c[1] * 10000 + c[0], k]));
  const BH = new Int32Array(NB).fill(-1); for (let i = 0; i < NB; i++) { const k = HMAP.get(Math.floor(BY[i] / CS) * 10000 + Math.floor(BX[i] / CS)); if (k !== undefined) BH[i] = k; }
  const S = { esik: 100, ek: [] };
  let D1 = null;
  const RENK = ['#2f8f87', '#a3e635', '#b91c4b'];
  const durum = k => DC[k] <= S.esik ? 0 : (D1[k] <= S.esik ? 1 : 2);
  return {
    id: 'konteyner', renk: '#8fd3ff', ad: ['Konteyner', 'Waste bins'],
    ikon: '<path d="M5 7h14M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6"/>',
    ekleMetni: () => t('Haritaya tıklayın: çöp konteyneri eklenecek · Esc ile çıkın', 'Click the map to add a waste container · Esc to stop'),
    kamera: () => ({ tx: -300, tz: 250, dist: 8200, yaw: 0.3, pitch: 0.95 }),
    kur() {
      $('govde').innerHTML = `<h2>${t('Çöp konteyneri', 'Waste containers')}</h2>
        <p class="ack">${t('Erişim modelindeki 50 m\'lik yerleşim hücrelerinin konteynere uzaklığı. Konteyner ekleyin ya da boşlukları en çok kapatacak yerleri önerin.', 'The distance of the 50 m settlement cells in the access model to a container. Add containers, or suggest the places that close the most gaps.')}</p>
        ${eylemler({ ekle: true, oner: t('En iyi 10 yeri öner', 'Suggest the best 10 places'), geriYok: !S.ek.length })}
        <div id="sonuc"></div>
        ${kaydirici('s-esik', t('Konteynere yürüme eşiği', 'Walking threshold to a container'), 50, 200, 10, S.esik, v => v + ' m')}
        <span id="hesap-durum"></span>
        <p class="sn-not">${t('Hücreler ve konteynerler erişim modelindeki verinin aynısı (ekibin haritalarından); "bugün" değeri o modeldeki oranla aynıdır. Analiz yalnızca çalışma alanındaki yerleşim hücrelerini kapsar.', 'The cells and containers are the same data as in the access model (from the team\'s maps); the "today" value matches that model. The analysis covers only the settlement cells in the study area.')}</p>`;
      bagla('s-esik', v => v + ' m', v => { S.esik = v; this.hesap(); durumYaz(); });
      eylemBagla(this); this.hesap();
    },
    hesap() {
      D1 = enYakin(CX, CY, S.ek, mB(400)); for (let k = 0; k < NC; k++) D1[k] = Math.min(D1[k], DC[k]);
      let a = 0, b = 0; for (let k = 0; k < NC; k++) { if (DC[k] > S.esik) a++; if (D1[k] > S.esik) b++; }
      const km = n => fmt(n * CS * CS / 1e6, 2) + ' km²';
      const f = farkPuan(yuzde(a, NC), yuzde(b, NC), false);
      $('sonuc').innerHTML = sonucKart({ et: t(`Konteynere ${S.esik} m'den uzak yerleşim alanı`, `Settled area more than ${S.esik} m from a container`), once: pct(yuzde(a, NC), 1), sonra: pct(yuzde(b, NC), 1), fark: f.fark, farkSinif: f.farkSinif }) +
        '<div class="sn-satirlar">' + satir(t('Alan', 'Area'), km(a) + ' → <em>' + km(b) + '</em>') + satir(t('Eklenen konteyner', 'Added containers'), fmt(S.ek.length)) + '</div>';
      boya(i => BH[i] < 0 ? SOLUK : R(RENK[durum(BH[i])]));
      ortuTemizle();
      for (let k = 0; k < NC; k++) { ox.globalAlpha = 0.5; ox.fillStyle = RENK[durum(k)]; ox.fillRect(px(CX[k] - CS / 2), py(CY[k] - CS / 2), CS / OP, CS / OP); }
      ox.globalAlpha = 1; ortuGonder(0.75);
      isaretler(DATA.conts.map(c => [c[0], c[1]]), S.ek, '#8fd3ff', () => `<b>${t('Mevcut konteyner', 'Existing container')}</b>`, () => `<b>${t('Yeni konteyner (senaryo)', 'New container (scenario)')}</b>`, 0.6);
      lejant(t(`Konteynere ${S.esik} m`, `${S.esik} m to a container`), [[RENK[0], t('Eşik içinde', 'Within threshold')], [RENK[1], t('Senaryoyla eşik içinde', 'Within threshold with the scenario')], [RENK[2], t('Uzak', 'Too far')], ['#8fd3ff', t('Konteyner', 'Container')]]);
      if ($('e-geri')) $('e-geri').disabled = !S.ek.length;
    },
    ekle(p) { S.ek.push(p); this.hesap(); },
    geriAl() { S.ek.pop(); this.hesap(); },
    oner() { oner(CX, CY, k => D1[k] > S.esik, S.esik, 10).forEach(p => S.ek.push(p)); this.hesap(); },
    binaIpucu(i) { const k = BH[i]; if (k < 0) return `<b>${t('Çalışma alanı dışında', 'Outside the study area')}</b>`; return `<b>${t('50 m yerleşim hücresi', '50 m settlement cell')}</b><div><span>${t('Konteyner · bugün', 'Container · today')}</span><span>${m(DC[k])}</span></div><div><span>${t('Senaryo', 'Scenario')}</span><span>${m(D1[k])}</span></div>`; },
    durum: () => S, yukle(d) { Object.assign(S, d); },
    sifirla() { S.ek = []; }
  };
})());

// ---------- 5) Deniz seviyesi
SEN.push((() => {
  const S = { seviye: 2.0 };
  let SU = null, BS = null, alan0 = 0, bina0 = 0;
  function taskin(sev) {
    const nx = AR.nx, nz = AR.nz, h = AR.h, s = AR.s, su = new Uint8Array(nx * nz), q = new Int32Array(nx * nz); let bas = 0, son = 0;
    for (let k = 0; k < nx * nz; k++) if ((s[k] & 3) === 1) { su[k] = 2; q[son++] = k; }
    while (bas < son) {
      const k = q[bas++], i = k % nx, j = (k - i) / nx;
      const kom = [i > 0 ? k - 1 : -1, i < nx - 1 ? k + 1 : -1, j > 0 ? k - nx : -1, j < nz - 1 ? k + nx : -1];
      for (const n of kom) if (n >= 0 && !su[n] && (s[n] & 3) !== 1 && h[n] <= sev) { su[n] = 1; q[son++] = n; }
    }
    return su;
  }
  const hucre = i => { const gi = Math.round((B[i].x - AR.x0) / AR.CS), gj = Math.round((B[i].z - AR.z0) / AR.CS); return gj * AR.nx + gi; };
  return {
    id: 'deniz', renk: '#38bdf8', ad: ['Deniz seviyesi', 'Sea level'],
    ikon: '<path d="M3 15c2 0 2-1.5 4.5-1.5S10 15 12 15s2.5-1.5 4.5-1.5S19 15 21 15M3 19c2 0 2-1.5 4.5-1.5S10 19 12 19s2.5-1.5 4.5-1.5S19 19 21 19M12 3v8M9 8l3 3 3-3"/>',
    kamera: () => ({ tx: 300, tz: -1400, dist: 6500, yaw: 0.2, pitch: 0.75 }),
    kur() {
      $('govde').innerHTML = `<h2>${t('Deniz yükselirse', 'If the sea rises')}</h2>
        <p class="ack">${t('Deniz seviyesini yükseltin: denize bağlı olup kotu bu seviyenin altında kalan kara ve binalar maviye döner.', 'Raise the sea level: land and buildings that are connected to the sea and lie below that level turn blue.')}</p>
        <div id="sonuc"></div>
        ${kaydirici('s-sev', t('Deniz seviyesi yükselmesi', 'Sea level rise'), 0, 5, 0.1, S.seviye, v => '+' + fmt(v, 1) + ' m')}
        <span id="hesap-durum"></span>
        <p class="sn-not">${t('Senaryodur, tahmin değildir. 25 m\'lik arazi modeline göre hesaplanır; kıyı yapıları, dalga, gelgit ve taşkın akışı hesaba katılmaz. Bina, merkezinin bulunduğu arazi hücresi su altındaysa etkilenmiş sayılır.', 'This is a scenario, not a forecast. It uses the 25 m terrain model; coastal structures, waves, tides and flood flow are not included. A building counts as affected when the terrain cell at its centre is under water.')}</p>`;
      bagla('s-sev', v => '+' + fmt(v, 1) + ' m', v => { S.seviye = v; this.hesap(); durumYaz(); });
      this.hesap();
    },
    hesap() {
      const hucreAlan = Bm(AR.CS) * Bm(AR.CS) / 1e6;
      if (!BS) { const su0 = taskin(0); BS = new Int32Array(NB); for (let i = 0; i < NB; i++) BS[i] = hucre(i); alan0 = 0; for (let k = 0; k < su0.length; k++) if (su0[k] === 1) alan0++; bina0 = 0; for (let i = 0; i < NB; i++) if (su0[BS[i]] === 1) bina0++; }
      SU = taskin(S.seviye);
      let alan = 0; for (let k = 0; k < SU.length; k++) if (SU[k] === 1) alan++;
      let n = 0, kon = 0, tic = 0; for (let i = 0; i < NB; i++) if (SU[BS[i]] === 1) { n++; if (B[i].tur === 0) kon++; if (B[i].tur === 1) tic++; }
      $('sonuc').innerHTML = sonucKart({ et: t('Su altında kalan binalar', 'Buildings under water'), onceEt: t('Bugün (+0 m)', 'Today (+0 m)'), once: fmt(bina0), sonraEt: '+' + fmt(S.seviye, 1) + ' m', sonra: fmt(n), fark: '+' + fmt(n - bina0) + t(' bina', ' buildings'), farkSinif: n > bina0 ? 'kotu' : 'notr' }) +
        '<div class="sn-satirlar">' + satir(t('Konut', 'Homes'), fmt(kon)) + satir(t('Ticari yapı', 'Commercial'), fmt(tic)) + satir(t('Su altındaki kara', 'Land under water'), fmt(alan0 * hucreAlan, 2) + ' → <em>' + fmt(alan * hucreAlan, 2) + ' km²</em>') + '</div>';
      boya(i => SU[BS[i]] === 1 ? R('#38bdf8') : GRI);
      ortuTemizle(); ox.fillStyle = '#1d9bf0';
      const c = AR.CS / OP, dx = AR.x0 + HW, dz = AR.z0 + HH;
      for (let k = 0; k < SU.length; k++) if (SU[k] === 1) { const i = k % AR.nx, j = (k - i) / AR.nx; ox.globalAlpha = 0.7; ox.fillRect(px(dx + (i - 0.5) * AR.CS), py(dz + (j - 0.5) * AR.CS), c + 0.5, c + 0.5); }
      ox.globalAlpha = 1; ortuGonder(0.85);
      isaretler([], []);
      lejant('+' + fmt(S.seviye, 1) + ' m', [['#1d9bf0', t('Su altında kalan kara', 'Land under water')], ['#38bdf8', t('Etkilenen bina', 'Affected building')], ['#465060', t('Diğer binalar', 'Other buildings')]]);
    },
    binaIpucu(i) { return `<b>${t(M3.TUR_AD[B[i].tur][0], M3.TUR_AD[B[i].tur][1])}</b><div><span>${t('Zemin kotu', 'Ground level')}</span><span>${fmt(AR.yer(B[i].x, B[i].z), 1)} m</span></div><div><span>${t('Durum', 'Status')}</span><span class="${SU && SU[BS[i]] === 1 ? 'bad' : 'good'}">${SU && SU[BS[i]] === 1 ? t('su altında', 'under water') : t('kuru', 'dry')}</span></div>`; },
    durum: () => S, yukle(d) { Object.assign(S, d); },
    sifirla() { S.seviye = 2.0; }
  };
})());

// ---------- 6) Yapılaşma: kat artışı
SEN.push((() => {
  const S = { artis: 1, sinir: 4, konut: true, kisi: 40 };
  let EK = null;
  let toplamAlan = 0; B.forEach(b => { if (b.kat) toplamAlan += b.alan * b.kat; });
  return {
    id: 'yapi', renk: '#e9c46a', ad: ['Yapılaşma', 'Building growth'],
    ikon: '<path d="M4 21V9l6-4v16M10 21V3l10 5v13M3 21h18M13 9h3M13 13h3M13 17h3"/>',
    kamera: () => ({ tx: 400, tz: -700, dist: 3600, yaw: 0.5, pitch: 0.55 }),
    kur() {
      $('govde').innerHTML = `<h2>${t('Binalar yükselirse', 'If buildings grow')}</h2>
        <p class="ack">${t('Bir imar senaryosu deneyin: binalara kat ekleyin, bir üst sınır koyun. Büyüyen binalar 3B\'de yükselir; eklenen inşaat alanı ve barındırabileceği nüfus hesaplanır.', 'Try a zoning scenario: add floors and set an upper limit. Growing buildings rise in 3D; the added floor area and the population it could house are calculated.')}</p>
        <div class="seg" style="grid-template-columns:repeat(3,1fr)" role="group" aria-label="${t('Kat artışı', 'Added floors')}">${[1, 2, 3].map(k => `<button type="button" data-a="${k}" aria-pressed="${S.artis === k}">+${k} ${t('kat', k > 1 ? 'floors' : 'floor')}</button>`).join('')}</div>
        <div id="sonuc"></div>
        ${kaydirici('s-sinir', t('En fazla kat (üst sınır)', 'Maximum floors (upper limit)'), 2, 8, 1, S.sinir, v => v + t(' kat', ' floors'))}
        <div class="anahtar"><span>${t('Yalnızca konutlar', 'Homes only')}</span><button id="s-konut" type="button" aria-pressed="${S.konut}">${S.konut ? t('Evet', 'Yes') : t('Konut ve ticari', 'Homes and shops')}</button></div>
        ${kaydirici('s-kisi', t('Kişi başı brüt konut alanı (varsayım)', 'Gross floor area per person (assumption)'), 20, 60, 1, S.kisi, v => v + ' m²')}
        <p class="sn-not">${t('Taban alanı halihazır haritadaki bina çiziminden, kat adedi paftadaki yazıdan (hesap). Kat bilgisi olmayan binalar değişmez. Nüfus kapasitesi seçtiğiniz kişi başı alana bağlı bir varsayımdır; mevcut nüfus TÜİK 2025 (39.474).', 'Footprints come from the building drawings on the base map and floors from the texts on the sheet (calc.). Buildings without a floor count do not change. The population capacity is an assumption that depends on the area per person you choose; the current population is TÜİK 2025 (39,474).')}</p>`;
      $('govde').querySelectorAll('[data-a]').forEach(b => b.onclick = () => { S.artis = +b.dataset.a; this.kur(); durumYaz(); });
      bagla('s-sinir', v => v + t(' kat', ' floors'), v => { S.sinir = v; this.hesap(); durumYaz(); });
      bagla('s-kisi', v => v + ' m²', v => { S.kisi = v; this.hesap(); durumYaz(); });
      $('s-konut').onclick = () => { S.konut = !S.konut; this.kur(); durumYaz(); };
      this.hesap();
    },
    hesap() {
      EK = new Uint8Array(NB); let n = 0, alan = 0;
      for (let i = 0; i < NB; i++) {
        const b = B[i]; if (!b.kat || (S.konut ? b.tur !== 0 : (b.tur !== 0 && b.tur !== 1))) continue;
        const yeni = Math.min(b.kat + S.artis, S.sinir); if (yeni <= b.kat) continue;
        EK[i] = yeni - b.kat; n++; alan += b.alan * EK[i];
      }
      const nufus = alan / S.kisi, NUF = SENARYO.nufus.deger;
      $('sonuc').innerHTML = sonucKart({ et: t('Eklenen brüt inşaat alanı (hesap)', 'Added gross floor area (calc.)'), once: '0', sonra: fmt(Math.round(alan / 1000)) + t(' bin m²', 'k m²'), fark: '+' + pct(alan / toplamAlan * 100, 1) + t(' mevcut alana göre', ' on the current area'), farkSinif: alan ? '' : 'notr' }) +
        '<div class="sn-satirlar">' + satir(t('Büyüyen bina', 'Buildings that grow'), fmt(n)) +
        satir(t('Ek nüfus kapasitesi (varsayım)', 'Extra population capacity (assumption)'), '<em>' + fmt(Math.round(nufus / 10) * 10) + '</em>') +
        satir(t('TÜİK 2025 nüfusuna oranı', 'Relative to the TÜİK 2025 population'), pct(nufus / NUF * 100, 1)) + '</div>';
      boya(i => EK[i] ? R('#e9c46a').concat([EK[i]]) : GRI);
      ortuTemizle(); ortuGonder(0);
      isaretler([], []);
      lejant(t('Kat artışı', 'Added floors'), [['#e9c46a', t('Büyüyen bina', 'Growing building')], ['#465060', t('Değişmeyen', 'Unchanged')]]);
    },
    binaIpucu(i) { const b = B[i]; return `<b>${t(M3.TUR_AD[b.tur][0], M3.TUR_AD[b.tur][1])}</b><div><span>${t('Kat · bugün', 'Floors · today')}</span><span>${b.kat || '—'}</span></div><div><span>${t('Senaryo', 'Scenario')}</span><span>${b.kat ? b.kat + (EK && EK[i] || 0) : '—'}</span></div><div><span>${t('Taban alanı (hesap)', 'Footprint (calc.)')}</span><span>${fmt(Math.round(b.alan))} m²</span></div>`; },
    durum: () => S, yukle(d) { Object.assign(S, d); },
    sifirla() { S.artis = 1; S.sinir = 4; S.konut = true; S.kisi = 40; }
  };
})());

// ---------- 7) Sokak aydınlatması
SEN.push((() => {
  const S = { esik: 50, ek: [] };
  let D0 = null, D1 = null;
  const RENK = ['#c9a227', '#a3e635', '#4f46e5'];
  return {
    id: 'isik', renk: '#fde68a', ad: ['Aydınlatma', 'Street lighting'],
    ikon: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V17h5v-1.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/>',
    ekleMetni: () => t('Haritaya tıklayın: sokak lambası eklenecek · Esc ile çıkın', 'Click the map to add a street lamp · Esc to stop'),
    kamera: () => ({ tx: 400, tz: -500, dist: 5200, yaw: 0.4, pitch: 0.8 }),
    kur() {
      $('govde').innerHTML = `<h2>${t('Sokak aydınlatması', 'Street lighting')}</h2>
        <p class="ack">${t('Halihazır haritadaki sokak lambalarına uzak kalan binalar karanlıkta görünür. Lamba ekleyin ya da karanlık noktaları en çok azaltacak yerleri önerin.', 'Buildings far from the street lamps on the base map appear dark. Add lamps, or suggest the places that reduce the dark spots the most.')}</p>
        ${eylemler({ ekle: true, oner: t('En iyi 10 yeri öner', 'Suggest the best 10 places'), geriYok: !S.ek.length })}
        <div id="sonuc"></div>
        ${kaydirici('s-esik', t('Lambaya uzaklık eşiği', 'Distance threshold to a lamp'), 20, 100, 5, S.esik, v => v + ' m')}
        <p class="sn-not">${t('Lambalar halihazır haritadaki sokak lambası sembolleri (2015); bu tarihten sonraki aydınlatma yok. Mesafe kuş uçuşu.', 'Lamps are the street lamp symbols on the base map (2015); later lighting is not included. Distance is straight-line.')}</p>`;
      bagla('s-esik', v => v + ' m', v => { S.esik = v; this.hesap(); durumYaz(); });
      eylemBagla(this); this.hesap();
    },
    hesap() {
      const r = mB(S.esik), r4 = mB(400);
      D0 = enYakin(BX, BY, LAMBA, r4); const de = enYakin(BX, BY, S.ek, r4); D1 = new Float32Array(NB); for (let i = 0; i < NB; i++) D1[i] = Math.min(D0[i], de[i]);
      let a = 0, b = 0; for (let i = 0; i < NB; i++) { if (D0[i] > r) a++; if (D1[i] > r) b++; }
      const f = farkPuan(yuzde(a, NB), yuzde(b, NB), false);
      $('sonuc').innerHTML = sonucKart({ et: t(`Lambaya ${S.esik} m'den uzak binalar`, `Buildings more than ${S.esik} m from a lamp`), once: pct(yuzde(a, NB), 1), sonra: pct(yuzde(b, NB), 1), fark: f.fark, farkSinif: f.farkSinif }) +
        '<div class="sn-satirlar">' + satir(t('Karanlıkta kalan bina', 'Buildings in the dark'), fmt(a) + ' → <em>' + fmt(b) + '</em>') + satir(t('Eklenen lamba', 'Added lamps'), fmt(S.ek.length)) + '</div>';
      boya(i => R(D0[i] <= r ? RENK[0] : (D1[i] <= r ? RENK[1] : RENK[2])));
      ortuTemizle(); ortuGonder(0);
      isaretler(LAMBA, S.ek, '#fde68a', () => `<b>${t('Sokak lambası', 'Street lamp')}</b>`, () => `<b>${t('Yeni lamba (senaryo)', 'New lamp (scenario)')}</b>`, 0.35);
      lejant(t(`Lambaya ${S.esik} m`, `${S.esik} m to a lamp`), [[RENK[0], t('Aydınlık', 'Lit')], [RENK[1], t('Senaryoyla aydınlık', 'Lit by the scenario')], [RENK[2], t('Karanlıkta', 'In the dark')], ['#fde68a', t('Lamba', 'Lamp')]]);
      if ($('e-geri')) $('e-geri').disabled = !S.ek.length;
    },
    ekle(p) { S.ek.push(p); this.hesap(); },
    geriAl() { S.ek.pop(); this.hesap(); },
    oner() { oner(BX, BY, i => D1[i] > mB(S.esik), mB(S.esik), 10).forEach(p => S.ek.push(p)); this.hesap(); },
    binaIpucu(i) { return `<b>${t(M3.TUR_AD[B[i].tur][0], M3.TUR_AD[B[i].tur][1])}</b><div><span>${t('En yakın lamba · bugün', 'Nearest lamp · today')}</span><span>${isFinite(D0[i]) ? m(Bm(D0[i])) : '>400 m'}</span></div><div><span>${t('Senaryo', 'Scenario')}</span><span>${isFinite(D1[i]) ? m(Bm(D1[i])) : '>400 m'}</span></div>`; },
    durum: () => S, yukle(d) { Object.assign(S, d); },
    sifirla() { S.ek = []; }
  };
})());

// =============================================
// Seçici, paylaşım, başlangıç
// =============================================
function seciciYaz() {
  $('secici').innerHTML = SEN.map(s => `<button type="button" data-s="${s.id}" style="--sn:${s.renk}" aria-pressed="${aktif && aktif.id === s.id}"><svg viewBox="0 0 24 24" aria-hidden="true">${s.ikon}</svg><span>${t(s.ad[0], s.ad[1])}</span></button>`).join('');
  $('secici').querySelectorAll('button').forEach(b => b.onclick = () => sec(b.dataset.s, true));
}
function sec(id, ucus) {
  const s = SEN.find(x => x.id === id) || SEN[0];
  ekleModuAyarla(false); aktif = s;
  document.body.style.setProperty('--sn', '#a3e635');
  seciciYaz(); s.kur();
  if (ucus) SC.flyTo(s.kamera ? s.kamera() : SC.HOME, 1800);
  durumYaz();
}
// Durum adres satırında: #s=<senaryo>&d=<base64url(JSON)>
function durumYaz() {
  if (!aktif) return;
  try {
    const d = btoa(unescape(encodeURIComponent(JSON.stringify(aktif.durum(), (k, v) => typeof v === 'number' ? Math.round(v * 10) / 10 : v)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    history.replaceState(null, '', '#s=' + aktif.id + '&d=' + d);
  } catch (e) { /* adres güncellenemedi */ }
}
function durumOku() {
  const h = new URLSearchParams(location.hash.slice(1)); const id = h.get('s'), d = h.get('d');
  if (!id) return null;
  const s = SEN.find(x => x.id === id); if (!s) return null;
  if (d) { try { s.yukle(JSON.parse(decodeURIComponent(escape(atob(d.replace(/-/g, '+').replace(/_/g, '/')))))); } catch (e) { /* bozuk bağlantı */ } }
  return id;
}
$('b-paylas').onclick = () => {
  durumYaz(); const b = $('b-paylas'), eski = b.textContent;
  const bitti = () => { b.textContent = t('Bağlantı kopyalandı ✓', 'Link copied ✓'); setTimeout(() => { b.textContent = eski; }, 1800); };
  if (navigator.clipboard) navigator.clipboard.writeText(location.href).then(bitti, bitti); else bitti();
};
$('b-sifirla').onclick = () => { if (!aktif) return; aktif.sifirla(); sec(aktif.id, false); };
addEventListener('m3dil', () => { if (aktif) { seciciYaz(); aktif.kur(); if (ekleModu) $('ekle-metin').textContent = aktif.ekleMetni(); } });

SC.basla();
(function bekle() {
  if (!AR.hazir) { setTimeout(bekle, 120); return; }
  const id = durumOku();
  sec(id || 'onbes', true);
})();
})();
