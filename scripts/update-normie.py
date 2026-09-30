"""Refresh Normie #8362 artwork from its current on-chain state (api.normies.art).

Writes public/8362.png (active on-chain image) and public/neon8362.png (the
NEONFACES-style mutation shown on the desktop). Re-run after customizing the Normie:

    python scripts/update-normie.py
"""
import urllib.request
from pathlib import Path
from PIL import Image

TOKEN = 8362
API = f'https://api.normies.art/normie/{TOKEN}'
PUBLIC = Path(__file__).resolve().parent.parent / 'public'

def get(path: str) -> bytes:
    req = urllib.request.Request(API + path, headers={'User-Agent': 'kancuno.com'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()

(PUBLIC / '8362.png').write_bytes(get('/image.png'))
bits = get('/pixels').decode().strip()
assert len(bits) == 1600, 'unexpected pixel payload'

# Render the current on-chain Normie #8362 bitmap as a NEONFACES-style close-up:
# neon #CCFF00 blocks, olive shading around the lines, fading to black at the bottom.
on = lambda x, y: 0 <= x < 40 and 0 <= y < 40 and bits[y*40+x] == '1'
NEON, O4, O3, O2, BLACK = (0xcc,0xff,0x00), (0x94,0xb2,0x1d), (0x67,0x79,0x20), (0x41,0x4d,0x12), (0,0,0)
X0, Y0, N, CELL = 8, 1, 25, 16          # 25x25 crop, 16 px per pixel -> 400x400
img = Image.new('RGB', (N*CELL, N*CELL))
for j in range(N):
    for i in range(N):
        x, y = X0+i, Y0+j
        if on(x, y):
            dense = sum(on(x+dx, y+dy) for dx in (-1,0,1) for dy in (-1,0,1))
            c = BLACK if dense >= 9 else O2 if dense >= 5 else O3
        else:
            near = sum(on(x+dx, y+dy) for dx in (-1,0,1) for dy in (-1,0,1) if dx or dy)
            c = O4 if near >= 6 else NEON
        # fade the last rows to black
        fade = max(0, j - (N-4)) / 3
        if fade: c = tuple(int(v*(1-fade)) for v in c)
        img.paste(c, (i*CELL, j*CELL, (i+1)*CELL, (j+1)*CELL))
img.save(PUBLIC / 'neon8362.png', optimize=True)
print('updated public/8362.png and public/neon8362.png')
