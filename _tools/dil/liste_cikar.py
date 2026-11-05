# Toplanan metinlerden çevrilmesi gereken benzersiz listeyi çıkarır.
import json, re, sys, glob, os
P = os.path.dirname(os.path.abspath(__file__))
kok = sys.argv[1]
veri = json.load(open(os.path.join(P, 'metinler.json'), encoding='utf-8'))

HARF = re.compile(r'[A-Za-zÇĞİÖŞÜçğıöşüÂâÎîÛû]')
SERBEST = {'m', 'km', 'm³', 'm²', 'mm', 'mm²', 'kv', 'mva', 'kva', 'kwh', 'tl', 'kg', 'l', 'v', 'x', 'cfu', 'ml', 'mw', 'gwh', 'p+r', 'k+r'}


def tr_en(n):
    return n.replace('.', '\0').replace(',', '.').replace('\0', ',')


def sayilari_cevir(s):
    s = re.sub(r'%\s?(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?)', lambda m: tr_en(m.group(1)) + '%', s)
    return re.sub(r'(?<![\d.,])(\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+,\d+)(?![.,]?\d)', lambda m: tr_en(m.group(0)), s)


def otomatik(n):
    if not HARF.search(n):
        return True
    kel = [k for k in re.split(r'[^A-Za-zÇĞİÖŞÜçğıöşüÂâÎîÛû³²+]+', sayilari_cevir(n)) if k]
    return all(k.lower() in SERBEST for k in kel)


# Betiklerdeki dizeler (etkileşimle görünen metinler için)
js_dizeler = set()
for f in glob.glob(os.path.join(kok, 'js', '*.js')):
    ad = os.path.basename(f)
    if ad in ('dil.js', 'dil-en.js'):
        continue
    s = open(f, encoding='utf-8').read()
    for m in re.finditer(r"'((?:[^'\\\n]|\\.)*)'|\"((?:[^\"\\\n]|\\.)*)\"|`((?:[^`\\]|\\.)*)`", s):
        t = m.group(1) or m.group(2) or m.group(3) or ''
        if '<' in t:  # HTML parçası: içindeki metinler
            parcalar = re.sub(r'<[^>]+>', '\n', t).split('\n')
        else:
            parcalar = [t]
        for p in parcalar:
            p = re.sub(r'\$\{[^}]*\}', ' ', p)
            p = ' '.join(p.split())
            if len(p) < 2 or not re.search(r'[ÇĞİÖŞÜçğıöşü]|[a-z] [a-z]', p):
                continue
            if re.search(r'rgba|#[0-9a-f]{3}|fa-|\.(js|png|jpg|html|css)\b|^[a-z-]+:|=>|\bfunction\b|\.\w+\(', p):
                continue
            js_dizeler.add((ad, p))

gorulen = {}
for sayfa, liste in veri.items():
    for t in liste:
        if t not in gorulen:
            gorulen[t] = sayfa
for ad, t in sorted(js_dizeler):
    if t not in gorulen:
        gorulen[t] = 'js/' + ad

cevrilecek = {t: s for t, s in gorulen.items() if not otomatik(t)}
print('benzersiz:', len(gorulen), 'çevrilecek:', len(cevrilecek))
sayac = {}
for t, s in cevrilecek.items():
    sayac[s] = sayac.get(s, 0) + 1
print(sayac)
json.dump(cevrilecek, open(os.path.join(P, 'cevrilecek.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
