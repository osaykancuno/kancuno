"""Generate the site's icons and share image from the K4NCUN0 logo.

    python scripts/brand-assets.py

Inputs : public/kancuno-logo.png (the 3D logo render)
         Archivo + JetBrains Mono fonts: taken from .next/static/media after a
         `npm run build` (next/font downloads them), else Arial Black / Consolas.
Outputs: src/app/icon.svg        flat vector mark (browser tab icon; replaces icon.png)
         src/app/favicon.ico     16/32/48 px, drawn from the same flat mark
         src/app/apple-icon.png  180 px, the 3D logo (home-screen icon)
         public/og.png           1200x630 share image (X, Telegram, WhatsApp...)
         public/lab/og-lab.png   1200x630 share image of THE K.LAB (/lab)

    python scripts/brand-assets.py lab   # only THE K.LAB share image
"""

import glob
import math
import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
YELLOW = (251, 197, 0)
INK = (21, 18, 14)
PINK = (252, 152, 202)
PURPLE = (149, 89, 187)

# Flat mark, same geometry as src/components/experience/LogoMark.tsx (32-unit box)
CUBES = [
    (9.3, 0.8, INK), (16.3, 0.8, INK),
    (5.8, 6.4, INK), (12.8, 6.4, PURPLE), (19.8, 6.4, INK),
    (9.3, 12.0, PINK), (16.3, 12.0, PINK),
]
CUBE, CUBE_R = 6.4, 1.3
ARMS = [((7.5, 17.5), (24.5, 30.0)), ((24.5, 17.5), (7.5, 30.0))]
ARM_W = 4.6
# Square viewBox around the mark, with breathing room
VB_X, VB_Y, VB_S = -1.6, -1.2, 35.2


def hexc(c):
    return '#%02x%02x%02x' % c


def write_svg():
    cubes = '\n'.join(
        f'  <rect x="{x}" y="{y}" width="{CUBE}" height="{CUBE}" rx="{CUBE_R}" fill="{hexc(c)}"/>'
        for x, y, c in CUBES
    )
    arms = ' '.join(f'M{a[0]} {a[1]} L{b[0]} {b[1]}' for a, b in ARMS)
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{VB_X} {VB_Y} {VB_S} {VB_S}">
  <rect x="{VB_X}" y="{VB_Y}" width="{VB_S}" height="{VB_S}" rx="8" fill="{hexc(YELLOW)}"/>
  <path d="{arms}" stroke="{hexc(INK)}" stroke-width="{ARM_W}" stroke-linecap="round"/>
{cubes}
</svg>
'''
    with open(os.path.join(ROOT, 'src/app/icon.svg'), 'w', encoding='utf-8') as f:
        f.write(svg)


def draw_mark(size, rounded=True):
    """Rasterise the flat mark at `size` px (drawn 8x larger, then downsampled)."""
    big = size * 8
    k = big / VB_S
    to = lambda x, y: ((x - VB_X) * k, (y - VB_Y) * k)
    img = Image.new('RGBA', (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, big - 1, big - 1), radius=(8 * k if rounded else 0), fill=YELLOW)
    w = ARM_W * k
    for a, b in ARMS:
        pa, pb = to(*a), to(*b)
        d.line([pa, pb], fill=INK, width=round(w))
        for p in (pa, pb):
            d.ellipse((p[0] - w / 2, p[1] - w / 2, p[0] + w / 2, p[1] + w / 2), fill=INK)
    for x, y, c in CUBES:
        x0, y0 = to(x, y)
        d.rounded_rectangle((x0, y0, x0 + CUBE * k, y0 + CUBE * k), radius=CUBE_R * k, fill=c)
    return img.resize((size, size), Image.LANCZOS)


def write_favicon():
    sizes = [16, 32, 48]
    base = draw_mark(256)
    base.save(os.path.join(ROOT, 'src/app/favicon.ico'), sizes=[(s, s) for s in sizes])


def logo_figure():
    """The 3D logo cropped to the figure, on its own yellow (no corner bars)."""
    logo = Image.open(os.path.join(ROOT, 'public/kancuno-logo.png')).convert('RGB')
    return logo.crop((88, 18, 312, 362))  # x 224 wide, y 344 tall: the figure only


def write_apple_icon():
    fig = logo_figure()
    side = 420
    canvas = Image.new('RGB', (side, side), YELLOW)
    fig_s = fig.resize((round(fig.width * 1.05), round(fig.height * 1.05)), Image.LANCZOS)
    canvas.paste(fig_s, ((side - fig_s.width) // 2, (side - fig_s.height) // 2))
    canvas.resize((180, 180), Image.LANCZOS).save(os.path.join(ROOT, 'src/app/apple-icon.png'))


def font(kind, size, weight=900, width=125):
    media = glob.glob(os.path.join(ROOT, '.next/static/media/*.p.woff2'))
    for path in media:
        try:
            f = ImageFont.truetype(path, size)
        except OSError:
            continue
        family = f.getname()[0]
        if kind == 'display' and family.startswith('Archivo'):
            f.set_variation_by_axes([weight, width])
            return f
        if kind == 'mono' and family.startswith('JetBrains'):
            f.set_variation_by_axes([weight])
            return f
    fallback = 'C:/Windows/Fonts/ariblk.ttf' if kind == 'display' else 'C:/Windows/Fonts/consolab.ttf'
    return ImageFont.truetype(fallback, size)


def write_og():
    W, H = 1200, 630
    img = Image.new('RGB', (W, H), YELLOW)
    fig = logo_figure()

    # The 3D figure on the right, cut out from the render with feathered edges
    fh = 520
    fw = round(fig.width * fh / fig.height)
    fig = fig.resize((fw, fh), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.2, percent=50))
    # Key out the render's yellow: pure background becomes transparent, the soft
    # shadow stays as a partial overlay, the figure stays opaque
    keyed = Image.new('L', (fw, fh))
    keyed.putdata([
        max(0, min(255, round((((r - 251) ** 2 + (g - 197) ** 2 + b ** 2) ** 0.5 - 22) * 4)))
        for r, g, b in (fig.get_flattened_data() if hasattr(fig, 'get_flattened_data') else fig.getdata())
    ])
    edge = Image.new('L', (fw, fh), 0)
    ImageDraw.Draw(edge).rectangle((6, 6, fw - 6, fh - 6), fill=255)
    edge = edge.filter(ImageFilter.GaussianBlur(4))
    mask = Image.composite(keyed, Image.new('L', (fw, fh), 0), edge)
    img.paste(fig, (W - 96 - fw, (H - fh) // 2), mask)

    d = ImageDraw.Draw(img)
    x0 = 72
    mono = font('mono', 22, 700)
    d.text((x0, 84), 'K4NCUN0  —  ARTIST & BUILDER ON-CHAIN', font=mono, fill=INK)

    big = font('display', 92)
    d.text((x0, 160), 'OSAY', font=big, fill=INK)
    d.text((x0, 256), 'KANCUNO', font=big, fill=INK)

    # pink + purple tag squares, as in the site's chapter index
    sq = 16
    d.rounded_rectangle((x0, 432, x0 + sq, 432 + sq), radius=4, fill=PURPLE)
    d.rounded_rectangle((x0 + sq + 6, 432, x0 + 2 * sq + 6, 432 + sq), radius=4, fill=PINK)
    small = font('mono', 22, 700)
    d.text((x0 + 2 * sq + 22, 427), 'BUILDING SOMETHING NEW', font=small, fill=INK)

    url = font('display', 30, 800, 112)
    d.text((x0, 520), 'kancuno.com', font=url, fill=INK)

    img.save(os.path.join(ROOT, 'public/og.png'), optimize=True)


# The flat K of THE K.LAB, same numbers as src/lib/lab/base.ts (100-unit canvas)
LAB_HEAD = [(38.5, 23, INK), (50.5, 23, INK), (32.5, 33, INK), (44.5, 33, PURPLE), (56.5, 33, INK),
            (38.5, 43, PINK), (50.5, 43, PINK)]
LAB_BAR = dict(cx=50, cy=63, length=44, thickness=7.75, angle=36)
LAB_BG = (15, 13, 10)
CREAM = (255, 246, 220)


def draw_lab_k(size):
    """The original K of THE K.LAB (lattice diamond, flat figure) at `size` px."""
    big = size * 4
    k = big / 100
    img = Image.new('RGB', (big, big), YELLOW)
    d = ImageDraw.Draw(img)
    h, w = 57.6 * k, 5.3 * k
    c = 50 * k
    pts = [(c, c - h), (c + h, c), (c, c + h), (c - h, c), (c, c - h)]
    d.line(pts, fill=INK, width=round(w), joint='curve')
    r = LAB_BAR['thickness'] / 2
    half = LAB_BAR['length'] / 2 - r
    for s in (1, -1):
        a = math.radians(s * LAB_BAR['angle'])
        dx, dy = math.cos(a) * half, math.sin(a) * half
        p1 = ((LAB_BAR['cx'] - dx) * k, (LAB_BAR['cy'] - dy) * k)
        p2 = ((LAB_BAR['cx'] + dx) * k, (LAB_BAR['cy'] + dy) * k)
        d.line([p1, p2], fill=INK, width=round(LAB_BAR['thickness'] * k))
        for px, py in (p1, p2):
            d.ellipse((px - r * k, py - r * k, px + r * k, py + r * k), fill=INK)
    for x, y, col in LAB_HEAD:
        d.rectangle((x * k, y * k, (x + 11) * k, (y + 10) * k), fill=col)
    return img.resize((size, size), Image.LANCZOS)


def figure_mask(fig):
    """Alpha mask of the figure in a crop of the logo artwork (see write_og_lab)."""
    w, h = fig.size
    px = fig.load()
    a = [[0.0] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            dist = abs(r - YELLOW[0]) + abs(g - YELLOW[1]) + abs(b - YELLOW[2])
            a[y][x] = min(1.0, max(0.0, (dist - 18) / 70))
    keep = [[False] * w for _ in range(h)]
    stack = [(w // 2, h // 2)]
    while stack:
        x, y = stack.pop()
        if x < 0 or y < 0 or x >= w or y >= h or keep[y][x] or a[y][x] < 0.12:
            continue
        keep[y][x] = True
        stack += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    m = Image.new('L', (w, h), 0)
    mp = m.load()
    for y in range(h):
        for x in range(w):
            if keep[y][x]:
                edge = min(x, y, w - 1 - x, h - 1 - y)  # the shadow runs past the crop: fade it out
                mp[x, y] = round(a[y][x] * min(1.0, edge / 10) * 255)
    return m.filter(ImageFilter.GaussianBlur(0.6))


def write_og_lab():
    W, H = 1200, 630
    img = Image.new('RGB', (W, H), LAB_BG)
    art = 450
    ax, ay = W - 72 - art, (H - art) // 2
    d = ImageDraw.Draw(img)
    d.rectangle((ax - 10, ay - 10, ax + art + 9, ay + art + 9), fill=(23, 20, 15))
    # The 3D figure of the logo (no bars around it), on its own yellow, like the apple icon
    fig = logo_figure()
    # brand yellow panel with the figure cut out of the artwork: only pixels that differ from
    # the yellow and touch the figure are kept (the diamond frame's fragments at the crop's
    # edges drop away), with soft alpha so its shadow and rounded edges stay natural
    fh = round(art * 0.84)
    fig = fig.resize((round(fig.width * fh / fig.height), fh), Image.LANCZOS)
    panel = Image.new('RGB', (art, art), YELLOW)
    panel.paste(fig, ((art - fig.width) // 2, (art - fh) // 2), figure_mask(fig))
    img.paste(panel, (ax, ay))

    x0 = 72
    d.text((x0, 92), 'THE K.LAB  ·  BY K4NCUN0', font=font('mono', 22, 700), fill=YELLOW)
    big = font('display', 68, 900, 116)
    d.text((x0, 160), 'One symbol.', font=big, fill=CREAM)
    d.text((x0, 240), 'Infinite', font=big, fill=YELLOW)
    d.text((x0, 320), 'variations.', font=big, fill=YELLOW)
    d.text((x0, 460), 'CREATE · REMIX · ANIMATE · NO WALLET', font=font('mono', 18, 600), fill=(190, 184, 166))
    d.text((x0, 520), 'kancuno.com/lab', font=font('display', 30, 800, 112), fill=CREAM)
    os.makedirs(os.path.join(ROOT, 'public/lab'), exist_ok=True)
    img.save(os.path.join(ROOT, 'public/lab/og-lab.png'), optimize=True)


if __name__ == '__main__':
    if sys.argv[1:] == ['lab']:
        write_og_lab()
        print('public/lab/og-lab.png written')
        sys.exit(0)
    write_og_lab()
    write_svg()
    write_favicon()
    write_apple_icon()
    write_og()
    print('icons and og.png written')
