import re, json, html, urllib.parse

UNITS = ["a-j","1-34","35-41","42-53","54-62","63-68","69-76","77-83","84-88",
         "89-94","95-98","99-106","107-110","111-118","119-128"]

def strip_tags(s):
    s = re.sub(r'<br\s*/?>', ' • ', s, flags=re.I)
    s = re.sub(r'<[^>]+>', '', s)
    return re.sub(r'\s+', ' ', html.unescape(s).replace(' ', ' ')).strip()

def unwrap(u):
    u = html.unescape(u)
    if 'safelinks.protection.outlook.com' in u:
        q = urllib.parse.parse_qs(urllib.parse.urlparse(u).query)
        if 'url' in q:
            u = html.unescape(q['url'][0])
    return u

def cells(row):
    return [(m.group(1).lower(), m.group(2)) for m in
            re.finditer(r'<(th|td)\b[^>]*>(.*?)</\1>', row, re.S | re.I)]

KEY = {'Slide Deck': 'slides', 'Decodable Passages': 'decodable',
       'Home Practice Activities': 'home', 'Additional Activities': 'extra'}

TITLES = {'a-j': 'Getting Ready', '1-34': 'Consonants & Short Vowels'}

lessons, units = {}, {}
order = []

for unit in UNITS:
    h = open(f'ufli_raw/{unit}.html', encoding='utf-8', errors='replace').read()

    # unit assessment button (outside the tables)
    ua = None
    for m in re.finditer(r'<a class="et_pb_button[^"]*"\s+href="([^"]+)"[^>]*>(.*?)</a>', h, re.S | re.I):
        lab = strip_tags(m.group(2))
        if 'Fluency-Check' in m.group(1) or 'assessment' in lab.lower():
            ua = {'label': lab, 'url': unwrap(m.group(1))}
            break
    title = (re.sub(r'\s*\bUnit Assessment\b\s*$', '', ua['label']).strip() if ua else None) \
            or TITLES.get(unit)
    units[unit] = {'id': unit, 'title': title, 'assessment': ua,
                   'page': f'https://ufli.education.ufl.edu/foundations/toolbox/{unit}/'}

    for tbl in re.findall(r'<table\b.*?</table>', h, re.S | re.I):
        rows = re.findall(r'<tr\b.*?</tr>', tbl, re.S | re.I)
        if not rows:
            continue
        header = [strip_tags(c[1]) for c in cells(rows[0])]
        for row in rows[1:]:
            cs = cells(row)
            if not cs:
                continue
            label = strip_tags(cs[0][1])
            if not label or label.lower() == 'lesson':
                continue
            rec = lessons.setdefault(label, {'id': label, 'unit': unit, 'concept': '', 'res': {}})
            if label not in order:
                order.append(label)
            for idx, (_tag, inner) in enumerate(cs[1:], start=1):
                col = header[idx] if idx < len(header) else ''
                links = [{'text': strip_tags(a.group(2)), 'url': unwrap(a.group(1))}
                         for a in re.finditer(r'<a\b[^>]*href="([^"]+)"[^>]*>(.*?)</a>', inner, re.S | re.I)]
                if col == 'Concept':
                    rec['concept'] = strip_tags(inner)
                elif links:
                    rec['res'].setdefault(KEY.get(col, col), []).extend(links)

data = {'units': units, 'lessons': [lessons[k] for k in order]}
json.dump(data, open('lessons.json', 'w'), indent=1)

print('lessons:', len(data['lessons']))
missing = {k: 0 for k in ['slides', 'decodable', 'home', 'extra']}
for L in data['lessons']:
    for k in missing:
        if k not in L['res']:
            missing[k] += 1
print('missing per type:', missing)
print('units w/o assessment:', [u for u, v in units.items() if not v['assessment']])
for u, v in units.items():
    print(' ', u, '->', v['title'])
