"""Extract per-lesson vocabulary from the UFLI Foundations Vocabulary Resource PDF.

Columns are located by x-coordinate (pdftotext -bbox-layout), which survives the
long concept names that defeat whitespace-column parsing.
"""
import re, json, html

COLS = [(35, 70, 'lesson'), (70, 200, 'concept'), (200, 300, 'steps'),
        (300, 400, 'word'), (400, 9999, 'expl')]

def col_of(x):
    for lo, hi, name in COLS:
        if lo <= x < hi:
            return name
    return None

def block_text(inner):
    """Cell text; a cell wrapped over several lines joins with a space."""
    lines = []
    for lm in re.finditer(r'<line\b[^>]*>(.*?)</line>', inner, re.S):
        words = re.findall(r'<word[^>]*>(.*?)</word>', lm.group(1), re.S)
        if words:
            lines.append(' '.join(words))
    return re.sub(r'\s+', ' ', html.unescape(' '.join(lines))).strip()

doc = open('vocab.xml', encoding='utf-8').read()
pages = re.findall(r'<page .*?</page>', doc, re.S)

rows = []
for page in pages:
    blocks = []
    for m in re.finditer(r'<block xMin="([\d.]+)" yMin="([\d.]+)"[^>]*>(.*?)</block>', page, re.S):
        x, y = float(m.group(1)), float(m.group(2))
        if y < 80:                      # page title + table header
            continue
        text = block_text(m.group(3))
        if not text or '©' in text or 'Literacy Institute' in text:
            continue
        col = col_of(x)
        if col is None:                 # section banner at the left margin
            continue
        blocks.append((y, col, text))

    blocks.sort(key=lambda b: b[0])
    for y, col, text in blocks:
        if rows and rows[-1]['page'] is page and abs(rows[-1]['y'] - y) <= 6:
            rows[-1].setdefault(col, text)
        else:
            rows.append({'page': page, 'y': y, col: text})

# ---- fold rows into lessons ----
vocab, cur_lesson, cur_word = {}, None, None
for r in rows:
    lesson = r.get('lesson', '').strip()
    concept = re.sub(r",?\s*cont'd\s*$", '', r.get('concept', '')).strip()
    steps = r.get('steps', '').strip()
    word = r.get('word', '').strip()
    expl = r.get('expl', '').strip()

    if lesson:
        cur_lesson = lesson
    if cur_lesson is None:
        continue

    entry = vocab.setdefault(cur_lesson, {'concept': '', 'words': []})

    # A long concept can abut the Step(s) column, and pdftotext then merges the
    # two cells. Recover the trailing step list when the row has no steps of its own.
    if word and not steps and concept:
        m = re.match(r'^(.*?\S)\s+(\d(?:\s*,\s*\d)*)$', concept)
        if m:
            concept, steps = m.group(1), m.group(2)

    if concept and not entry['concept']:
        entry['concept'] = concept

    if word:
        cur_word = {'word': word, 'steps': steps, 'defs': [expl] if expl else []}
        entry['words'].append(cur_word)
    elif expl and cur_word is not None:
        cur_word['defs'].append(expl)

# A page break can split one word's entry in two; fold the repeat back together.
for entry in vocab.values():
    merged = []
    for w in entry['words']:
        if merged and merged[-1]['word'] == w['word']:
            prev = merged[-1]
            for d in w['defs']:
                if d not in prev['defs']:
                    prev['defs'].append(d)
            if not prev['steps']:
                prev['steps'] = w['steps']
            continue
        merged.append(w)
    entry['words'] = merged

json.dump(vocab, open('vocab.json', 'w'), ensure_ascii=False, indent=1)

nw = sum(len(v['words']) for v in vocab.values())
nd = sum(len(w['defs']) for v in vocab.values() for w in v['words'])
print(f'lessons: {len(vocab)}  words: {nw}  explanations: {nd}')
bad = [w['word'] for v in vocab.values() for w in v['words'] if len(w['word'].split()) > 2]
print('suspect word cells:', bad)
print('words with no definition:', [w['word'] for v in vocab.values() for w in v['words'] if not w['defs']])
print('words with no steps:', [w['word'] for v in vocab.values() for w in v['words'] if not w['steps']])
print('lessons with no concept:', [k for k, v in vocab.items() if not v['concept']])

L = json.load(open('lessons.json'))
toolbox = {l['id']: l['concept'] for l in L['lessons']}
print('vocab ids not in toolbox:', sorted(set(vocab) - set(toolbox)))

norm = lambda s: re.sub(r'[^a-z0-9/]', '', s.lower())
mism = [(k, v['concept'], toolbox[k]) for k, v in vocab.items()
        if k in toolbox and norm(v['concept']) != norm(toolbox[k])]
print(f'concept mismatches vs toolbox: {len(mism)}')
for k, a, b in mism:
    print(f'   {k}: vocab={a!r}  toolbox={b!r}')
