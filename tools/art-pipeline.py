#!/usr/bin/env python3
"""Art pipeline for generated images: magenta chroma key with edge decontamination, grid/blob slicing, WebP encoding,
and a manifest the build embeds (web/assets/art/manifest.json -> globalThis.MONGYU_EMBEDDED_ART).

  python tools/art-pipeline.py bg   <in.png> <id> [--width 720] [--quality 78]        full-bleed background
  python tools/art-pipeline.py cut  <in.png> <id-prefix> [--ids a,b,c] [--size 256]   chroma-key + split into separate sprites
  python tools/art-pipeline.py list

Sprites are found as connected blobs on the key colour, sorted top-to-bottom then left-to-right, and each is padded
to a square (centered) so it can be drawn at any size.
"""
import argparse, hashlib, json, sys
from pathlib import Path
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'web' / 'assets' / 'art'
MANIFEST = OUT / 'manifest.json'
KEY = (255, 0, 255)


def load_manifest():
    if MANIFEST.exists():
        return json.loads(MANIFEST.read_text(encoding='utf-8'))
    return {'version': 1, 'images': {}}


def save_manifest(m):
    OUT.mkdir(parents=True, exist_ok=True)
    m['images'] = dict(sorted(m['images'].items()))
    MANIFEST.write_text(json.dumps(m, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


def digest(b):
    return hashlib.sha256(b).hexdigest()


def write_webp(img, name, quality, lossless=False):
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / (name + '.webp')
    if lossless:
        img.save(path, 'WEBP', lossless=True, method=6)
    else:
        img.save(path, 'WEBP', quality=quality, method=6)
    data = path.read_bytes()
    return {'file': path.name, 'mime': 'image/webp', 'sha256': digest(data), 'bytes': len(data), 'w': img.width, 'h': img.height}


def key_distance(px):
    r, g, b = px[:3]
    # magenta-ness: both red and blue high, green low
    return min(r, b) - g


def chroma_key(im, hard=95, soft=40):
    """Return RGBA with the magenta background removed. Pixels fully key-coloured become transparent; the glow/edge ramp is
    alpha-blended and its colour decontaminated (magenta spill removed)."""
    im = im.convert('RGB')
    w, h = im.size
    px = im.load()
    out = Image.new('RGBA', (w, h))
    op = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            m = min(r, b) - g  # how magenta
            if m >= hard and r > 150 and b > 150:
                op[x, y] = (0, 0, 0, 0)
                continue
            if m > soft and r > 120 and b > 120:
                a = int(255 * (1 - (m - soft) / (hard - soft)))
                a = max(0, min(255, a))
                # decontaminate: pull red/blue down toward green by the spill amount
                spill = (m - soft) * 0.7
                r2 = int(max(0, r - spill)); b2 = int(max(0, b - spill))
                op[x, y] = (r2, g, b2, a)
            else:
                op[x, y] = (r, g, b, 255)
    return out


def blobs(alpha, min_area):
    """Connected components of non-transparent pixels, via a coarse flood fill on a downsampled mask."""
    w, h = alpha.size
    scale = 4
    small = alpha.resize((w // scale, h // scale), Image.BILINEAR).point(lambda v: 255 if v > 24 else 0)
    # dilate to merge detached glow bits belonging to one sprite
    small = small.filter(ImageFilter.MaxFilter(9))
    sw, sh = small.size
    sp = small.load()
    seen = [[False] * sw for _ in range(sh)]
    boxes = []
    for y0 in range(sh):
        for x0 in range(sw):
            if sp[x0, y0] and not seen[y0][x0]:
                stack = [(x0, y0)]
                seen[y0][x0] = True
                minx = maxx = x0
                miny = maxy = y0
                area = 0
                while stack:
                    x, y = stack.pop()
                    area += 1
                    minx = min(minx, x); maxx = max(maxx, x); miny = min(miny, y); maxy = max(maxy, y)
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < sw and 0 <= ny < sh and sp[nx, ny] and not seen[ny][nx]:
                            seen[ny][nx] = True
                            stack.append((nx, ny))
                if area >= min_area:
                    boxes.append((minx * scale, miny * scale, (maxx + 1) * scale, (maxy + 1) * scale))
    return boxes


def order_boxes(boxes):
    if not boxes:
        return boxes
    hts = sorted(b[3] - b[1] for b in boxes)
    row_h = hts[len(hts) // 2] * 0.6
    boxes = sorted(boxes, key=lambda b: ((b[1] + b[3]) / 2, b[0]))
    rows, cur, cy = [], [], None
    for b in boxes:
        c = (b[1] + b[3]) / 2
        if cy is None or abs(c - cy) <= row_h:
            cur.append(b)
            cy = c if cy is None else (cy * (len(cur) - 1) + c) / len(cur)
        else:
            rows.append(cur); cur = [b]; cy = c
    rows.append(cur)
    return [b for r in rows for b in sorted(r, key=lambda b: b[0])]


def cmd_bg(a):
    im = Image.open(a.input).convert('RGB')
    if im.width > a.width:
        im = im.resize((a.width, round(im.height * a.width / im.width)), Image.LANCZOS)
    m = load_manifest()
    m['images'][a.id] = {**write_webp(im, a.id, a.quality), 'kind': 'bg'}
    save_manifest(m)
    print(a.id, m['images'][a.id])


def cmd_cut(a):
    im = Image.open(a.input)
    keyed = chroma_key(im)
    boxes = order_boxes(blobs(keyed.split()[3], min_area=a.min_area))
    ids = a.ids.split(',') if a.ids else [f'{a.prefix}{i + 1:02d}' for i in range(len(boxes))]
    if len(ids) != len(boxes):
        print(f'WARNING: found {len(boxes)} sprites but {len(ids)} ids; boxes (x0,y0,x1,y1): {boxes}', file=sys.stderr)
        ids = (ids + [f'{a.prefix}{i + 1:02d}' for i in range(len(ids), len(boxes))])[:len(boxes)]
    m = load_manifest()
    pad = 6
    for sid, (x0, y0, x1, y1) in zip(ids, boxes):
        x0 = max(0, x0 - pad); y0 = max(0, y0 - pad); x1 = min(keyed.width, x1 + pad); y1 = min(keyed.height, y1 + pad)
        spr = keyed.crop((x0, y0, x1, y1))
        side = max(spr.width, spr.height)
        sq = Image.new('RGBA', (side, side), (0, 0, 0, 0))
        sq.paste(spr, ((side - spr.width) // 2, (side - spr.height) // 2))
        sq = sq.resize((a.size, a.size), Image.LANCZOS)
        m['images'][sid] = {**write_webp(sq, sid, 82), 'kind': 'sprite'}
        print(sid, (x0, y0, x1, y1), m['images'][sid]['bytes'], 'bytes')
    save_manifest(m)


def cmd_grid(a):
    im = Image.open(a.input)
    keyed = chroma_key(im)
    ids = a.ids.split(',')
    assert len(ids) == a.cols * a.rows, f'{len(ids)} ids for a {a.cols}x{a.rows} grid'
    cw, ch = keyed.width / a.cols, keyed.height / a.rows
    m = load_manifest()
    for i, sid in enumerate(ids):
        c, r = i % a.cols, i // a.cols
        cell = keyed.crop((round(c * cw), round(r * ch), round((c + 1) * cw), round((r + 1) * ch)))
        bb = cell.split()[3].point(lambda v: 255 if v > 24 else 0).getbbox()
        if not bb:
            print('EMPTY cell', sid); continue
        pad = 6
        bb = (max(0, bb[0] - pad), max(0, bb[1] - pad), min(cell.width, bb[2] + pad), min(cell.height, bb[3] + pad))
        spr = cell.crop(bb)
        side = max(spr.width, spr.height)
        sq = Image.new('RGBA', (side, side), (0, 0, 0, 0))
        sq.paste(spr, ((side - spr.width) // 2, (side - spr.height) // 2))
        sq = sq.resize((a.size, a.size), Image.LANCZOS)
        m['images'][sid] = {**write_webp(sq, sid, 82), 'kind': 'sprite'}
        print(sid, bb, m['images'][sid]['bytes'], 'bytes')
    save_manifest(m)


def cmd_list(_):
    m = load_manifest()
    tot = 0
    for k, v in m['images'].items():
        tot += v['bytes']
        print(f"{k:28} {v['kind']:7} {v['w']}x{v['h']} {v['bytes'] // 1024:5} KB")
    print('total', tot // 1024, 'KB')


def main():
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest='cmd', required=True)
    b = sub.add_parser('bg'); b.add_argument('input'); b.add_argument('id'); b.add_argument('--width', type=int, default=720); b.add_argument('--quality', type=int, default=78); b.set_defaults(fn=cmd_bg)
    c = sub.add_parser('cut'); c.add_argument('input'); c.add_argument('prefix'); c.add_argument('--ids', default=''); c.add_argument('--size', type=int, default=256); c.add_argument('--min-area', type=int, default=400); c.set_defaults(fn=cmd_cut)
    g = sub.add_parser('grid'); g.add_argument('input'); g.add_argument('--cols', type=int, required=True); g.add_argument('--rows', type=int, required=True); g.add_argument('--ids', required=True); g.add_argument('--size', type=int, default=256); g.set_defaults(fn=cmd_grid)
    l = sub.add_parser('list'); l.set_defaults(fn=cmd_list)
    a = p.parse_args()
    a.fn(a)


if __name__ == '__main__':
    main()
