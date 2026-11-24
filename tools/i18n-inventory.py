#!/usr/bin/env python3
"""Korean string inventory for the R105 localization pass.

Scans web/src/*.js and web/index.template.html, extracts every string literal
(or HTML text / attribute) that contains Hangul, gives each a stable id, and
classifies the speaking voice. Writes docs/i18n-inventory.json and prints a
summary (counts per file and per voice).

    python tools/i18n-inventory.py [--json docs/i18n-inventory.json] [--quiet]
"""
from __future__ import annotations
import argparse, hashlib, json, re, sys
from collections import Counter, defaultdict
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HANGUL = re.compile(r'[ㄱ-ㆎ가-힣]')
REGEX_PREV_OK = set('(,=:[!&|?{};+-*%<>~^')
REGEX_KEYWORDS = ('return', 'typeof', 'case', 'in', 'of', 'delete', 'void', 'throw', 'new', 'else', 'do')


def line_of(src: str, idx: int) -> int:
    return src.count('\n', 0, idx) + 1


# ---------------------------------------------------------------- JS scanner
def scan_js(src: str, base: int = 0, out: list | None = None, in_template_expr: bool = False):
    """Tokenise just enough JS to find string/template literals.
    Returns (strings, end_index). Each string: (start_idx, kind, text, key)."""
    out = [] if out is None else out
    i, n = 0, len(src)
    depth = 0
    last_sig = ''  # last significant character (for regex-vs-division)
    last_word = ''
    while i < n:
        c = src[i]
        if c == '/' and i + 1 < n and src[i + 1] == '/':
            j = src.find('\n', i)
            i = n if j < 0 else j
            continue
        if c == '/' and i + 1 < n and src[i + 1] == '*':
            j = src.find('*/', i + 2)
            i = n if j < 0 else j + 2
            continue
        if c in '\'"':
            j = i + 1
            buf = []
            while j < n and src[j] != c:
                if src[j] == '\\' and j + 1 < n:
                    nx = src[j + 1]
                    if nx == 'u' and re.match(r'[0-9a-fA-F]{4}', src[j + 2:j + 6]):
                        buf.append(chr(int(src[j + 2:j + 6], 16)))
                        j += 6
                        continue
                    buf.append({'n': '\n', 't': '\t'}.get(nx, nx))
                    j += 2
                    continue
                buf.append(src[j])
                j += 1
            text = ''.join(buf)
            out.append((base + i, 'str', text, prop_key(src, i)))
            i = j + 1
            last_sig, last_word = '"', ''
            continue
        if c == '`':
            j = i + 1
            buf = []
            while j < n and src[j] != '`':
                if src[j] == '\\' and j + 1 < n:
                    buf.append(src[j + 1])
                    j += 2
                    continue
                if src[j] == '$' and j + 1 < n and src[j + 1] == '{':
                    # find matching brace by scanning nested expression
                    k = j + 2
                    d = 1
                    # run scanner on the remainder, stopping at the matching }
                    sub_out: list = []
                    k = scan_expr(src, j + 2, base, sub_out)
                    out.extend(sub_out)
                    buf.append('{}')
                    j = k + 1
                    continue
                buf.append(src[j])
                j += 1
            out.append((base + i, 'tpl', ''.join(buf), prop_key(src, i)))
            i = j + 1
            last_sig, last_word = '"', ''
            continue
        if c == '/':
            prev_ok = (last_sig == '' or last_sig in REGEX_PREV_OK or last_word in REGEX_KEYWORDS)
            if prev_ok:
                # regex literal: skip
                j = i + 1
                in_class = False
                while j < n:
                    if src[j] == '\\':
                        j += 2
                        continue
                    if src[j] == '[':
                        in_class = True
                    elif src[j] == ']':
                        in_class = False
                    elif src[j] == '/' and not in_class:
                        break
                    elif src[j] == '\n':
                        break
                    j += 1
                i = j + 1
                while i < n and src[i].isalpha():
                    i += 1
                last_sig, last_word = '"', ''
                continue
        if c.isalnum() or c in '_$':
            j = i
            while j < n and (src[j].isalnum() or src[j] in '_$'):
                j += 1
            last_word = src[i:j]
            last_sig = 'a'
            i = j
            continue
        if not c.isspace():
            last_sig, last_word = c, ''
        i += 1
    return out


def scan_expr(src: str, start: int, base: int, out: list) -> int:
    """Scan a template ${...} expression starting at `start`; return index of matching '}'."""
    i, n, d = start, len(src), 1
    last_sig, last_word = '', ''
    while i < n:
        c = src[i]
        if c == '/' and src[i:i + 2] == '//':
            j = src.find('\n', i)
            i = n if j < 0 else j
            continue
        if c == '/' and src[i:i + 2] == '/*':
            j = src.find('*/', i + 2)
            i = n if j < 0 else j + 2
            continue
        if c in '\'"':
            j = i + 1
            while j < n and src[j] != c:
                j += 2 if src[j] == '\\' else 1
            out.append((base + i, 'str', src[i + 1:j], prop_key(src, i)))
            i = j + 1
            last_sig = '"'
            continue
        if c == '`':
            # nested template: scan with a recursive pass up to the closing backtick
            j = i + 1
            buf = []
            while j < n and src[j] != '`':
                if src[j] == '\\':
                    buf.append(src[j + 1])
                    j += 2
                    continue
                if src[j] == '$' and src[j + 1:j + 2] == '{':
                    k = scan_expr(src, j + 2, base, out)
                    buf.append('{}')
                    j = k + 1
                    continue
                buf.append(src[j])
                j += 1
            out.append((base + i, 'tpl', ''.join(buf), prop_key(src, i)))
            i = j + 1
            last_sig = '"'
            continue
        if c == '{':
            d += 1
        elif c == '}':
            d -= 1
            if d == 0:
                return i
        i += 1
    return n


def prop_key(src: str, idx: int) -> str:
    """Name that introduces the literal at idx: `key:` or `.prop=`; '' when unknown."""
    before = src[max(0, idx - 60):idx].rstrip()
    m = re.search(r'([A-Za-z_$][\w$]*)\s*[:=]$', before)
    if m and not before.endswith('==') and not before.endswith('?'):
        return m.group(1)
    m = re.search(r'([A-Za-z_$][\w$]*)\s*\(\s*$', before)
    if m:
        return m.group(1) + '()'
    return ''


# -------------------------------------------------------------- HTML scanner
class HtmlScan(HTMLParser):
    def __init__(self, src: str):
        super().__init__(convert_charrefs=True)
        self.src = src
        self.items: list[dict] = []
        self.stack: list[str] = []
        self.panel_stack: list[str] = []
        self.script_chunks: list[tuple[int, str]] = []
        self.skip = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag not in ('br', 'meta', 'link', 'input', 'img', 'path', 'circle', 'rect', 'line', 'hr'):
            self.stack.append(tag)
            self.panel_stack.append(a.get('id') or (self.panel_stack[-1] if self.panel_stack else ''))
        line = self.getpos()[0]
        for k in ('aria-label', 'title', 'placeholder', 'alt', 'content'):
            v = a.get(k)
            if v and HANGUL.search(v):
                ctx = 'attr:' + k + ('@' + tag)
                self.items.append({'line': line, 'text': v, 'ctx': ctx, 'panel': self.panel_stack[-1] if self.panel_stack else '', 'label_ctx': k in ('aria-label', 'title', 'placeholder', 'alt')})
        if tag in ('script', 'style'):
            self.skip += 1

    def handle_endtag(self, tag):
        if tag in ('script', 'style'):
            self.skip = max(0, self.skip - 1)
        if tag in self.stack:
            while self.stack:
                t = self.stack.pop()
                if self.panel_stack:
                    self.panel_stack.pop()
                if t == tag:
                    break

    def handle_data(self, data):
        if self.skip:
            if self.stack and self.stack[-1] == 'script' and HANGUL.search(data):
                self.script_chunks.append((self.getpos()[0], data))
            return
        text = data.strip()
        if text and HANGUL.search(text):
            tag = self.stack[-1] if self.stack else ''
            self.items.append({'line': self.getpos()[0], 'text': text, 'ctx': 'text@' + tag, 'panel': self.panel_stack[-1] if self.panel_stack else '', 'label_ctx': tag in ('button', 'h1', 'h2', 'h3', 'label', 'summary', 'th', 'a', 'span', 'option', 'output')})


# ---------------------------------------------------------------- voice class
SENT_END = re.compile(r'[.!?…~\s·\-—]+$')
HAEYO = re.compile(r'(요|죠|세요|예요|이에요|어요|아요|해요|네요|군요|래요|게요|까요)$')
HAPSYO = re.compile(r'(습니다|ㅂ니다|입니다|니다|십시오|습니까|니까|시오|십시다)$')
BANMAL_END = re.compile(r'(어|아|야|지|네|군|걸|는걸|잖아|래|게|자|까|나|냐|구나|거든|봐|해|워|줘|와|데|든|라|려|러|어라|해라|어봐|아봐|보자|가자|돼|니|렴|구려|던걸|잖니|쳐|져|펴|켜|겨|줘|둬|뒤|해라)$')
DA_END = re.compile(r'다$')
SYNTAX_HINT = re.compile(r'^[\w.#\[\]()>=:~*,\s\-]+$')  # css/selector-ish


def classify(text: str) -> str:
    t = re.sub(r'\{\}|\$\{[^}]*\}|%[sd]', ' ', text)
    t = re.sub(r'\s+', ' ', t).strip()
    if not HANGUL.search(t):
        return '기타'
    # use last sentence
    parts = [p for p in re.split(r'(?<=[.!?…])\s+|\n', t) if HANGUL.search(p)]
    last = parts[-1] if parts else t
    core = SENT_END.sub('', last)
    core = re.sub(r'[\)\]」』”’"\']+$', '', core)
    if not core:
        return '기타'
    if HAPSYO.search(core):
        return '합쇼'
    if HAEYO.search(core):
        return '해요'
    has_sentence = len(parts) > 1 or bool(re.search(r'[.!?…]$', last.strip())) or ' ' in core
    if DA_END.search(core) and (has_sentence or len(core) > 3):
        return '서술 -다'
    if has_sentence and BANMAL_END.search(core):
        return '반말'
    if len(core) <= 4 and BANMAL_END.search(core) and re.search(r'[!?]$', last.strip()):
        return '반말'
    return '명사형'


def make_id(rel: str, text: str) -> str:
    return hashlib.sha1((rel + '\0' + text).encode('utf-8')).hexdigest()[:10]


LABEL_KEYS = {'label', 'title', 'name', 'button', 'cta', 'heading', 'head', 'tag', 'badge', 'kicker', 'short', 'caption', 'text', 'ariaLabel', 'aria-label', 'btn'}


def collect() -> list[dict]:
    items: list[dict] = []
    seen_html = ROOT / 'web' / 'index.template.html'
    files = sorted((ROOT / 'web' / 'src').glob('*.js'))
    for f in files:
        if f.name.startswith('i18n'):
            continue  # translation tables themselves are not UI source
        rel = f.relative_to(ROOT).as_posix()
        src = f.read_text(encoding='utf-8').replace('\r\n', '\n')
        for idx, kind, text, key in scan_js(src):
            if not HANGUL.search(text):
                continue
            items.append({'file': rel, 'line': line_of(src, idx), 'text': text, 'kind': kind, 'ctx': key,
                          'panel': '', 'label_ctx': key in LABEL_KEYS or key.rstrip('()') in ('setLabel', 'label')})
    src = seen_html.read_text(encoding='utf-8').replace('\r\n', '\n')
    p = HtmlScan(src)
    p.feed(src)
    rel = seen_html.relative_to(ROOT).as_posix()
    for it in p.items:
        items.append({'file': rel, 'kind': 'html', **it})
    # inline <script> blocks inside the template
    for line, chunk in p.script_chunks:
        for idx, kind, text, key in scan_js(chunk):
            if HANGUL.search(text):
                items.append({'file': rel, 'line': line + chunk.count('\n', 0, idx), 'text': text, 'kind': kind, 'ctx': key, 'panel': 'script', 'label_ctx': False})
    for it in items:
        it['voice'] = classify(it['text'])
        it['chars'] = len(HANGUL.findall(it['text']))
        it['id'] = make_id(it['file'], it['text'])
    # disambiguate duplicate ids (same text twice in one file)
    count: Counter = Counter()
    for it in items:
        count[it['id']] += 1
        if count[it['id']] > 1:
            it['id'] += f"-{count[it['id']]}"
    return items


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument('--json', default=str(ROOT / 'docs' / 'i18n-inventory.json'))
    ap.add_argument('--quiet', action='store_true')
    args = ap.parse_args(argv)
    items = collect()
    out = Path(args.json)
    out.parent.mkdir(parents=True, exist_ok=True)
    slim = [{k: it[k] for k in ('id', 'file', 'line', 'voice', 'kind', 'ctx', 'chars', 'text')} for it in items]
    head = {'total': len(items), 'hangulChars': sum(i['chars'] for i in items)}
    body = ',\n'.join(' ' + json.dumps(i, ensure_ascii=False, separators=(',', ':')) for i in slim)
    out.write_text(json.dumps(head, ensure_ascii=False)[:-1] + ',"items":[\n' + body + '\n]}\n', encoding='utf-8', newline='\n')
    if args.quiet:
        return 0
    by_file: dict[str, list] = defaultdict(list)
    for it in items:
        by_file[it['file']].append(it)
    voices = ['반말', '해요', '합쇼', '서술 -다', '명사형', '기타']
    print(f"{'file':44} {'strings':>7} {'chars':>7} " + ' '.join(f'{v:>7}' for v in voices))
    for f, its in sorted(by_file.items(), key=lambda kv: -sum(i['chars'] for i in kv[1])):
        vc = Counter(i['voice'] for i in its)
        print(f"{f:44} {len(its):7d} {sum(i['chars'] for i in its):7d} " + ' '.join(f"{vc.get(v, 0):7d}" for v in voices))
    vc = Counter(i['voice'] for i in items)
    print(f"{'TOTAL':44} {len(items):7d} {sum(i['chars'] for i in items):7d} " + ' '.join(f"{vc.get(v, 0):7d}" for v in voices))
    return 0


if __name__ == '__main__':
    sys.exit(main())
