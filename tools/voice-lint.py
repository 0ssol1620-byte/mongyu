#!/usr/bin/env python3
"""Voice/tone lint for the R105 Korean UI strings (see docs/R105_VOICE_TONE_KO.md).

Checks every Hangul string found by tools/i18n-inventory.py:
  (a) forbidden developer words      (b) translationese patterns
  (c) mixed voices inside one panel/region   (d) over-long strings in short-label contexts

    python tools/voice-lint.py [--out docs/R105_VOICE_LINT.md] [--max-region 40]
"""
from __future__ import annotations
import argparse, importlib.util, re, sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('i18n_inventory', ROOT / 'tools' / 'i18n-inventory.py')
inv = importlib.util.module_from_spec(spec)
spec.loader.exec_module(inv)

DEV_WORDS = [('실행', '"한 판", "플레이", "시작" 등으로'), ('허용', '"할 수 있어요", "괜찮아요" 등으로'), ('비활성', '"꺼짐", "잠김"으로'), ('활성', '"켜짐", "쓸 수 있는"으로'),
             ('시각 신호', '"화면이 반짝여요" 식으로'), ('세션', '"이번 플레이", "이번 판"으로'), ('리셋', '"처음부터", "다시"로'), ('인스턴스', '쓰지 않기')]
TRANSLATIONESE = [(r'에 의해', '능동형으로'), (r'하는 것이 가능', '"~할 수 있어요"'), (r'(을|를) 가지고', '"~이/가 있다", "~을 쥐고" 등으로'), (r'에 대해', '"~은/는", "~을 ..." 로 줄이기')]
VOICES = ['반말', '해요', '합쇼', '서술 -다']
SHORT_LIMIT = 40


def region_key(it: dict, prev: dict | None, gap: int = 14) -> bool:
    """True when `it` starts a new region relative to the previous item of the same file."""
    if prev is None or prev['file'] != it['file']:
        return True
    if it['file'].endswith('.html'):
        return (it.get('panel') or '') != (prev.get('panel') or '')
    return it['line'] - prev['line'] > gap


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default=str(ROOT / 'docs' / 'R105_VOICE_LINT.md'))
    ap.add_argument('--max-region', type=int, default=40)
    args = ap.parse_args(argv)
    items = inv.collect()
    items.sort(key=lambda i: (i['file'], i['line']))

    dev, trans, longs = [], [], []
    for it in items:
        t = it['text']
        for w, fix in DEV_WORDS:
            probe = t.replace('비활성', '') if w == '활성' else t
            if w in probe:
                dev.append((it, w, fix))
        for pat, fix in TRANSLATIONESE:
            m = re.search(pat, t)
            if m:
                trans.append((it, m.group(0), fix))
        if it.get('label_ctx') and len(re.sub(r'\{\}', '', t)) > SHORT_LIMIT:
            longs.append(it)

    # regions
    regions, cur, prev = [], None, None
    for it in items:
        if region_key(it, prev):
            cur = []
            regions.append(cur)
        cur.append(it)
        prev = it
    mixed = []
    for r in regions:
        vc = Counter(i['voice'] for i in r if i['voice'] in VOICES)
        if len(vc) >= 2:
            minor = sum(vc.values()) - max(vc.values())
            mixed.append((minor, len(vc), r, vc))
    mixed.sort(key=lambda x: (-x[1], -x[0], x[2][0]['file'], x[2][0]['line']))

    def loc(it):
        return f"{it['file'].replace('web/', '')}:{it['line']}"

    def clip(t, n=70):
        t = t.replace('\n', ' ').replace('|', '\\|')
        return t if len(t) <= n else t[:n - 1] + '…'

    L = []
    L.append('# R105 보이스 린트 리포트\n')
    L.append('`python tools/voice-lint.py`가 만든 파일이에요. 기준은 `docs/R105_VOICE_TONE_KO.md`. 문구를 고치면 다시 돌려 주세요.\n')
    L.append(f'- 검사한 문자열: **{len(items)}**개 (한글 {sum(i["hangulChars"] if "hangulChars" in i else i["chars"] for i in items)}자)')
    L.append(f'- (a) 개발자 용어: **{len(dev)}**건 / (b) 번역투: **{len(trans)}**건 / (c) 한 구역 말투 혼용: **{len(mixed)}**구역 / (d) 짧은 라벨에 {SHORT_LIMIT}자 초과: **{len(longs)}**건\n')

    def by_file_counts(rows):
        c = Counter(r[0]['file'] if isinstance(r, tuple) else r['file'] for r in rows)
        return c

    L.append('## (a) 개발자 용어\n')
    wc = Counter(w for _, w, _ in dev)
    L.append('단어별: ' + ', '.join(f'{w} {n}' for w, n in wc.most_common()) + '\n')
    L.append('| 위치 | 단어 | 문구 | 대안 |\n| --- | --- | --- | --- |')
    for it, w, fix in dev:
        L.append(f"| {loc(it)} | {w} | {clip(it['text'])} | {fix} |")
    L.append('\n## (b) 번역투\n')
    L.append('| 위치 | 패턴 | 문구 | 방향 |\n| --- | --- | --- | --- |')
    for it, w, fix in trans:
        L.append(f"| {loc(it)} | {w} | {clip(it['text'])} | {fix} |")
    L.append('\n## (c) 한 구역 안의 말투 혼용\n')
    L.append(f'구역은 HTML에서는 가장 가까운 `id` 패널, JS에서는 줄 간격 14줄 이내로 묶인 연속 문자열이에요. 목소리가 둘 이상 섞인 구역이 위로 오고(상위 {args.max_region}개), 길(반말)과 시스템(존대)이 한 구역에 있으면 의도된 경우도 있으니 사람이 확인해요.\n')
    L.append('| 위치 | 구성 | 소수 목소리 문구 |\n| --- | --- | --- |')
    for minor, nv, r, vc in mixed[:args.max_region]:
        major = vc.most_common(1)[0][0]
        minors = [i for i in r if i['voice'] in VOICES and i['voice'] != major][:3]
        comp = ' / '.join(f'{v} {n}' for v, n in vc.most_common())
        ex = '<br>'.join(f"{i['voice']}: {clip(i['text'], 40)}" for i in minors)
        L.append(f"| {loc(r[0])}–{r[-1]['line']} | {comp} | {ex} |")
    L.append(f'\n## (d) 짧은 라벨에 {SHORT_LIMIT}자 넘는 문구\n')
    L.append('버튼, 제목, `aria-label`·`title`, `label:`·`title:` 같은 키에 들어간 문구예요.\n')
    L.append('| 위치 | 길이 | 문구 |\n| --- | --- | --- |')
    for it in sorted(longs, key=lambda i: -len(i['text'])):
        L.append(f"| {loc(it)} | {len(it['text'])} | {clip(it['text'], 80)} |")

    # per-file offender summary
    L.append('\n## 파일별 요약\n')
    score = defaultdict(lambda: [0, 0, 0, 0, 0])
    for it in items:
        score[it['file']][4] += 1
    for it, *_ in dev:
        score[it['file']][0] += 1
    for it, *_ in trans:
        score[it['file']][1] += 1
    for _, _, r, _ in mixed:
        score[r[0]['file']][2] += 1
    for it in longs:
        score[it['file']][3] += 1
    L.append('| 파일 | 문자열 | 개발자 용어 | 번역투 | 혼용 구역 | 긴 라벨 |\n| --- | ---: | ---: | ---: | ---: | ---: |')
    for f, s in sorted(score.items(), key=lambda kv: -(kv[1][0] + kv[1][1] + kv[1][2] + kv[1][3])):
        if s[0] + s[1] + s[2] + s[3] == 0:
            continue
        L.append(f'| {f.replace("web/", "")} | {s[4]} | {s[0]} | {s[1]} | {s[2]} | {s[3]} |')
    Path(args.out).write_text('\n'.join(L) + '\n', encoding='utf-8', newline='\n')
    print(f'items={len(items)} dev={len(dev)} translationese={len(trans)} mixedRegions={len(mixed)} longLabels={len(longs)}')
    for f, s in sorted(score.items(), key=lambda kv: -(kv[1][0] + kv[1][1] + kv[1][2] + kv[1][3]))[:8]:
        print(f'  {f}: dev={s[0]} trans={s[1]} mixed={s[2]} long={s[3]}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
