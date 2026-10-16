"""Refresh Normie #8362 artwork from its current on-chain state (api.normies.art).

Writes public/8362.png (active on-chain image). Re-run after customizing the Normie:

    python scripts/update-normie.py
"""
import urllib.request
from pathlib import Path

TOKEN = 8362
API = f'https://api.normies.art/normie/{TOKEN}'
PUBLIC = Path(__file__).resolve().parent.parent / 'public'

def get(path: str) -> bytes:
    req = urllib.request.Request(API + path, headers={'User-Agent': 'kancuno.com'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()

(PUBLIC / '8362.png').write_bytes(get('/image.png'))
print('updated public/8362.png')
