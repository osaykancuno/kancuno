"""OpenSea kit for THE K.LAB · K1N0: logo, banner and featured image (the K1N0 in 3D, as the contract draws it).

    python scripts/opensea-kit.py      → opensea-kit/logo.png, banner.png, featured.png

The K's are drawn like the on-chain artwork (the flat K of src/lib/lab/base.ts) in colours of the
K1N0 palette only, so the page shows exactly what the collection is made of.
"""
import math
import os
import random
import sys

from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'scripts'))
import importlib.util

spec = importlib.util.spec_from_file_location('brand_assets', os.path.join(ROOT, 'scripts', 'brand-assets.py'))
brand = importlib.util.module_from_spec(spec)
spec.loader.exec_module(brand)

OUT = os.path.join(ROOT, 'opensea-kit')
P = {
    'yellow': '#fbc500', 'ink': '#0f0d0a', 'pink': '#fc98ca', 'purple': '#9559bb', 'cream': '#fff6dc', 'grey': '#7a7468',
    'cyan': '#3ff2ff', 'blue': '#2f6bff', 'green': '#27e07a', 'red': '#ff3b30', 'orange': '#ff7a1a', 'brown': '#6b3e26',
    'tan': '#d9b38c', 'magenta': '#ff4fd8', 'navy': '#1d2a6b', 'lime': '#c8f04a',
}
rgb = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))

# Flat K, as on-chain: head squares 11x10 on a 12-unit pitch over two capsules at ±36° (100-unit canvas)
HEAD = [(38.5, 23), (50.5, 23), (32.5, 33), (44.5, 33), (56.5, 33), (38.5, 43), (50.5, 43)]
BAR = dict(cx=50, cy=63, length=44, thickness=7.75, angle=36)


def flat_k(size, bg, body, cubes, zoom=1.0):
    """One K tile, `size` px, colours by palette name. zoom > 1 crops in on the figure."""
    big = size * 4
    k = big / 100 * zoom
    off = big / 2 - 50 * k  # keep the figure centred when zoomed
    img = Image.new('RGB', (big, big), rgb(P[bg]))
    d = ImageDraw.Draw(img)
    r = BAR['thickness'] / 2
    half = BAR['length'] / 2 - r
    for s in (1, -1):
        a = math.radians(s * BAR['angle'])
        dx, dy = math.cos(a) * half, math.sin(a) * half
        p1 = (off + (BAR['cx'] - dx) * k, off + (BAR['cy'] - dy) * k)
        p2 = (off + (BAR['cx'] + dx) * k, off + (BAR['cy'] + dy) * k)
        d.line([p1, p2], fill=rgb(P[body]), width=round(BAR['thickness'] * k))
        for px, py in (p1, p2):
            d.ellipse((px - r * k, py - r * k, px + r * k, py + r * k), fill=rgb(P[body]))
    for (x, y), c in zip(HEAD, cubes):
        d.rectangle((off + x * k, off + y * k, off + (x + 11) * k, off + (y + 10) * k), fill=rgb(P[c]))
    return img.resize((size, size), Image.LANCZOS)


# ── K1N0 v2: the clay K in 3D, drawn from the contract's own faces (contracts/art3d/faces.json) ──
import json
FACES = json.load(open(os.path.join(ROOT, 'contracts', 'art3d', 'faces.json')))
ORDER = list(P)  # palette order = names order above (yellow, ink, pink, purple, …)


def _lit(c, s):
    return tuple(min(255, round((v * s + (255 - v) * s / 10) / 255)) for v in c)


def k3d(size, bg, centre, front_l, front_r):
    """One K1N0 tile (size px) as the contract draws it, without effects. Colours: palette names."""
    sc = 8
    W = size * sc
    k = W / 100
    img = Image.new('RGB', (W, W), rgb(P[bg]))
    shadow = Image.new('L', (W, W), 0)
    ds = ImageDraw.Draw(shadow)
    pts = lambda d: [(float(x) * k, float(y) * k) for x, y in (q.split(' ') for q in d[1:-1].split('L'))]
    for f in FACES:
        if f['group'] == 0:
            ds.polygon(pts(f['d']), fill=255)
    sh = Image.new('RGB', (W, W), tuple(round(v * 0.35) for v in rgb(P[bg])))
    img.paste(sh, (0, 0), shadow.point(lambda v: v * 0.5))
    d = ImageDraw.Draw(img)
    cols = {1: 'ink', 3: 'ink', 4: centre, 5: front_l, 6: front_r}  # the X and four head blocks: black
    for f in FACES:
        if f['group'] == 0:
            continue
        c = _lit(rgb(P[cols[f['group']]]), f['shade'])
        poly = pts(f['d'])
        d.polygon(poly, fill=c)
        d.line(poly + [poly[0]], fill=c, width=max(1, round(0.35 * k)), joint='curve')
    return img.resize((size, size), Image.LANCZOS)


def head(main, centre, front, top=None, sides=None):
    t = top or main
    s = sides or main
    return [t, t, s, centre, s, front, front]


# Curated combinations (the first is the original K)
CURATED = [
    ('yellow', 'ink', head('ink', 'purple', 'pink')),
    ('ink', 'yellow', head('yellow', 'purple', 'pink')),
    ('navy', 'cyan', head('cyan', 'magenta', 'yellow')),
    ('cream', 'ink', head('ink', 'yellow', 'ink')),
    ('magenta', 'navy', head('navy', 'lime', 'cream')),
    ('green', 'ink', head('ink', 'cream', 'pink')),
    ('orange', 'brown', head('brown', 'cream', 'yellow')),
    ('purple', 'lime', head('lime', 'pink', 'cyan')),
    ('red', 'cream', head('cream', 'ink', 'yellow')),
    ('blue', 'yellow', head('yellow', 'red', 'pink')),
    ('tan', 'brown', head('brown', 'orange', 'cream')),
    ('grey', 'ink', head('ink', 'lime', 'magenta')),
    ('lime', 'navy', head('navy', 'magenta', 'cyan')),
    ('pink', 'purple', head('purple', 'yellow', 'cream')),
    ('cyan', 'ink', head('ink', 'red', 'yellow')),
    ('ink', 'magenta', head('cyan', 'yellow', 'lime')),
]


def contrast_ok(a, b):
    ra, rb = rgb(P[a]), rgb(P[b])
    la = 0.2126 * ra[0] + 0.7152 * ra[1] + 0.0722 * ra[2]
    lb = 0.2126 * rb[0] + 0.7152 * rb[1] + 0.0722 * rb[2]
    return abs(la - lb) > 60


def random_combo(rng):
    names = list(P)
    while True:
        bg, body = rng.sample(names, 2)
        if not contrast_ok(bg, body):
            continue
        centre, front = rng.sample([n for n in names if n not in (bg, body)], 2)
        return bg, body, head(body, centre, front)


V2 = [  # curated K1N0 (background, centre, front left, front right); the first is the mark of THE K.LAB
    ('cream', 'pink', 'lime', 'lime'), ('yellow', 'purple', 'pink', 'pink'), ('navy', 'magenta', 'yellow', 'cyan'), ('cream', 'yellow', 'red', 'red'),
    ('magenta', 'lime', 'cream', 'navy'), ('green', 'cream', 'pink', 'pink'), ('orange', 'cream', 'yellow', 'brown'),
    ('purple', 'pink', 'cyan', 'lime'), ('red', 'yellow', 'cream', 'cream'), ('blue', 'red', 'pink', 'yellow'),
    ('tan', 'orange', 'cream', 'brown'), ('grey', 'lime', 'magenta', 'magenta'), ('lime', 'magenta', 'cyan', 'navy'),
    ('pink', 'yellow', 'cream', 'purple'), ('cyan', 'red', 'yellow', 'yellow'), ('brown', 'cyan', 'lime', 'tan'),
]


def v2_combo(rng):
    names = [n for n in P if n != 'ink']
    while True:
        bg = rng.choice(names)
        slots = [rng.choice([n for n in P if n != bg]) for _ in range(3)]
        if contrast_ok(bg, 'ink'):
            return (bg, *slots)


def write_logo():
    """350x350 (made at 2x): the mark of THE K.LAB (public/klab/k1n0-mark.png), not the K4NCUN0 logo."""
    brand.lab_mark(700, crop=True).save(os.path.join(OUT, 'logo.png'), optimize=True)


def write_banner():
    """1400x350 (made at 2x): a wall of K1N0, all different, in 3D."""
    W, H = 2800, 700
    img = Image.new('RGB', (W, H), (32, 28, 22))
    tile, gap, cols, rows = 196, 20, 13, 3
    x0 = (W - (cols * tile + (cols - 1) * gap)) // 2
    y0 = (H - (rows * tile + (rows - 1) * gap)) // 2
    rng = random.Random(8362)
    combos = V2[:]
    while len(combos) < cols * rows:
        c = v2_combo(rng)
        if c not in combos:
            combos.append(c)
    rng.shuffle(combos)
    mid = (rows // 2) * cols + cols // 2
    i0 = combos.index(V2[0])
    combos[i0], combos[mid] = combos[mid], combos[i0]
    mask = Image.new('L', (tile, tile), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, tile - 1, tile - 1), radius=14, fill=255)
    for i, c in enumerate(combos):
        r, cc = divmod(i, cols)
        img.paste(k3d(tile, *c), (x0 + cc * (tile + gap), y0 + r * (tile + gap)), mask)
    img.save(os.path.join(OUT, 'banner.png'), optimize=True)


def write_featured():
    """600x400 (made at 2x): three K1N0 side by side."""
    W, H = 1200, 800
    img = Image.new('RGB', (W, H), (32, 28, 22))
    tile, gap = 340, 30
    x0 = (W - (3 * tile + 2 * gap)) // 2
    y = (H - tile) // 2
    mask = Image.new('L', (tile, tile), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, tile - 1, tile - 1), radius=22, fill=255)
    for i, c in enumerate([V2[1], V2[0], V2[6]]):
        img.paste(k3d(tile, *c), (x0 + i * (tile + gap), y), mask)
    img.save(os.path.join(OUT, 'featured.png'), optimize=True)


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    write_logo()
    write_banner()
    write_featured()
    print('opensea-kit/: logo.png (700x700), banner.png (2800x700), featured.png (1200x800)')
