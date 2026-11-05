# ceviri/*.json + kaliplar.json -> js/dil-en.js; eksik çevirileri raporlar
import json, glob, os, re, sys
P = os.path.dirname(os.path.abspath(__file__))
kok = sys.argv[1]
sozluk = {}
for f in sorted(glob.glob(os.path.join(P, 'ceviri', '*.json'))):
    if f.endswith('kaliplar.json'):
        continue
    for k, v in json.load(open(f, encoding='utf-8')).items():
        k = ' '.join(k.split())
        if k in sozluk and sozluk[k] != v:
            print('ÇAKIŞMA:', k, '|', sozluk[k], '|', v)
        sozluk[k] = v
kaliplar = json.load(open(os.path.join(P, 'ceviri', 'kaliplar.json'), encoding='utf-8'))

js = ('// =============================================\n'
      '// TR -> EN sözlük (js/dil.js kullanır). Anahtarlar sayfadaki Türkçe metnin aynısıdır.\n'
      '// Özel adlar (durak, mahalle, kurum adları) çevrilmez; sözlükte yoksa olduğu gibi kalır.\n'
      '// =============================================\n'
      'window.BAS_KALIPLAR_EN = ' + json.dumps(kaliplar, ensure_ascii=False, indent=0) + ';\n'
      'window.BAS_SOZLUK_EN = ' + json.dumps(sozluk, ensure_ascii=False, indent=0, sort_keys=True) + ';\n')
open(os.path.join(kok, 'js', 'dil-en.js'), 'w', encoding='utf-8').write(js)
print('sözlük:', len(sozluk), 'giriş ·', len(kaliplar), 'kalıp · dosya', round(len(js.encode('utf-8')) / 1024), 'KB')

# Eksik denetimi (dil.js mantığının aynısı)
HARF = re.compile(r'[A-Za-zÇĞİÖŞÜçğıöşüÂâÎîÛû]')
SERBEST = {'m', 'km', 'm³', 'm²', 'mm', 'mm²', 'kv', 'mva', 'kva', 'kwh', 'tl', 'kg', 'l', 'v', 'x', 'cfu', 'ml', 'mw', 'gwh', 'p+r', 'k+r'}
def tr_en(n): return n.replace('.', '\0').replace(',', '.').replace('\0', ',')
def sc(s):
    s = re.sub(r'%\s?(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?)', lambda m: tr_en(m.group(1)) + '%', s)
    return re.sub(r'(?<![\d.,])(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+,\d+)(?![.,]?\d)', lambda m: tr_en(m.group(0)), s)
kr = [re.compile(k[0]) for k in kaliplar]
cev = json.load(open(os.path.join(P, 'cevrilecek.json'), encoding='utf-8'))
eksik = []
for t, sayfa in cev.items():
    if t in sozluk or any(k.search(t) for k in kr):
        continue
    kel = [k for k in re.split(r'[^A-Za-zÇĞİÖŞÜçğıöşüÂâÎîÛû³²+]+', sc(t)) if k]
    if not HARF.search(t) or all(k.lower() in SERBEST for k in kel):
        continue
    if re.match(r'^\d+\. ', t):  # durak listesi (özel ad)
        continue
    eksik.append((sayfa, t))
print('eksik:', len(eksik))
for s, t in eksik:
    print(' ', s, '|', t)
