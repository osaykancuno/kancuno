"""K1N0 launch video, v2: the same 30 s cut and music, with the words aligned to what K1N0 is.

    python scripts/launch-video-v2.py [editor.png] [token.png]

Local only (ffmpeg + Pillow, no generation credits). From launch/K1N0_launch_30s*.mp4 it writes
launch/K1N0_launch_30s_v2.mp4 (9:16) and launch/K1N0_launch_30s_16x9_v2.mp4 (16:9):
  0-4 s   "ONE K." becomes "K1N0." (the character's name)
  4-8 s   the K4NCUN0 logo with "BY OSAY KANCUNO" becomes THE K.LAB's mark: an open character, no owner, CC0
          (the pill now reads THE K.LAB · KANCUNO.COM/KLAB)
  11.5-15 s  the old interface tour becomes the K Editor in K1N0 mode and a token page (if the two
          screenshots are given, 1920x1080 PNG); without them that part stays as it was
"""
import importlib.util
import os
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location('brand_assets', os.path.join(ROOT, 'scripts', 'brand-assets.py'))
brand = importlib.util.module_from_spec(spec)
spec.loader.exec_module(brand)
font = brand.font

FPS = 30
INK = (15, 13, 10)
CREAM = (255, 246, 220)
YELLOW = (251, 197, 0)
DARK = (15, 13, 10)
MARK = Image.open(os.path.join(ROOT, 'public/klab/k1n0-mark.png')).convert('RGB')

FORMATS = {
    # file: size, box of "ONE K." (x0, y0, x1, y1), how it is aligned
    'K1N0_launch_30s_16x9.mp4': dict(size=(1920, 1080), box=(60, 486, 640, 580), align='left', out='K1N0_launch_30s_16x9_v2.mp4'),
    'K1N0_launch_30s.mp4': dict(size=(1080, 1920), box=(206, 148, 874, 238), align='center', out='K1N0_launch_30s_v2.mp4'),
}


def text_size(d, s, f):
    l, t, r, b = d.textbbox((0, 0), s, font=f)
    return r - l, b - t, l, t


def fit_font(kind, text, cap_h, weight, width=None):
    """The size whose capital height matches cap_h."""
    probe = Image.new('RGB', (10, 10))
    d = ImageDraw.Draw(probe)
    size = cap_h
    for _ in range(12):
        f = font(kind, size, weight, width) if width else font(kind, size, weight)
        _, h, _, _ = text_size(d, 'K', f)
        size = max(8, round(size * cap_h / max(1, h)))
    return font(kind, size, weight, width) if width else font(kind, size, weight)


def patch_name(img, fmt):
    """0-4 s: cover "ONE K." with its own background and write "K1N0." in the same colour."""
    a = np.asarray(img)
    x0, y0, x1, y1 = fmt['box']
    bg = tuple(int(v) for v in a[y0 - 12, x0 - 30 if x0 > 40 else x0 + 2])
    region = a[y0:y1, x0:x1].reshape(-1, 3).astype(int)
    far = region[np.abs(region - np.array(bg)).sum(axis=1) > 160]
    if len(far) < 200:
        return img  # no title in this frame
    ink = tuple(int(v) for v in np.median(far, axis=0))
    d = ImageDraw.Draw(img)
    d.rectangle((x0 - 40, y0 - 16, x1 + 40, y1 + 24), fill=bg)  # the old title's soft edges too
    f = fit_font('mono', 'K1N0.', y1 - y0, 800)
    w, h, l, t = text_size(d, 'K1N0.', f)
    x = x0 - l if fmt['align'] == 'left' else (x0 + x1) // 2 - w // 2 - l
    d.text((x, y0 - t), 'K1N0.', font=f, fill=ink)
    return img


def mark_card(px):
    m = MARK.resize((px, px), Image.LANCZOS)
    mask = Image.new('L', (px, px), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, px - 1, px - 1), radius=px // 24, fill=255)
    return m, mask


def mark_frame(fmt, t):
    """4-8 s: THE K.LAB's mark on cream, slowly coming closer, with what it is."""
    W, H = fmt['size']
    img = Image.new('RGB', (W, H), CREAM)
    d = ImageDraw.Draw(img)
    k = 1 + 0.06 * (t / 4)  # gentle push-in
    pill_txt = 'THE K.LAB  ·  KANCUNO.COM/KLAB'
    if W > H:
        px = round(560 * k)
        m, mask = mark_card(px)
        shadow = Image.new('L', (W, H), 0)
        ImageDraw.Draw(shadow).rounded_rectangle(((W - px) // 2 + 14, (H - px) // 2 + 22, (W + px) // 2 + 14, (H + px) // 2 + 22), radius=px // 24, fill=90)
        img.paste(INK, (0, 0), shadow.filter(ImageFilter.GaussianBlur(24)))
        img.paste(m, ((W - px) // 2, (H - px) // 2 - 30), mask)
        big = fit_font('display', 'O', 40, 900, 125)
        d.text((80, 470), 'AN OPEN', font=big, fill=INK)
        d.text((80, 530), 'CHARACTER.', font=big, fill=INK)
        w, _, _, _ = text_size(d, 'NO OWNER.', big)
        d.text((W - 80 - w, 470), 'NO OWNER.', font=big, fill=INK)
        w, _, _, _ = text_size(d, 'CC0.', big)
        d.text((W - 80 - w, 530), 'CC0.', font=big, fill=INK)
        pill_y = H - 150
    else:
        px = round(900 * k)
        m, mask = mark_card(px)
        img.paste(m, ((W - px) // 2, 520 - (px - 900) // 2), mask)
        big = fit_font('display', 'O', 74, 900, 125)
        for i, line in enumerate(['AN OPEN', 'CHARACTER.']):
            w, _, _, _ = text_size(d, line, big)
            d.text(((W - w) // 2, 170 + i * 100, ), line, font=big, fill=INK)
        for i, line in enumerate(['NO OWNER.', 'CC0.']):
            w, _, _, _ = text_size(d, line, big)
            d.text(((W - w) // 2, 1480 + i * 100), line, font=big, fill=INK)
        pill_y = H - 150
    # the pill, in the style of the original ("BY OSAY KANCUNO")
    pf = font('mono', 26 if W > H else 24, 700)
    w, h, l, t0 = text_size(d, pill_txt, pf)
    pw, ph = w + 64, 56
    x = (W - pw) // 2
    d.rounded_rectangle((x, pill_y, x + pw, pill_y + ph), radius=ph // 2, fill=INK)
    d.text((x + 32 - l, pill_y + (ph - h) // 2 - t0), pill_txt, font=pf, fill=YELLOW)
    return img


def ui_frame(fmt, shot, label):
    """11.5-15 s: a screenshot of the Lab with its label, like the original tour."""
    W, H = fmt['size']
    img = Image.new('RGB', (W, H), DARK)
    d = ImageDraw.Draw(img)
    s = Image.open(shot).convert('RGB')
    if W > H:
        sw = 1640
        s = s.resize((sw, round(s.height * sw / s.width)), Image.LANCZOS)
        img.paste(s, ((W - sw) // 2, 40))
        ly = 40 + s.height + 40
    else:
        crop = s.crop((300, 70, 1110, 1000))  # the title and the stage of the 1920x1080 page
        sw = W
        crop = crop.resize((sw, round(crop.height * sw / crop.width)), Image.LANCZOS)
        img.paste(crop, (0, 240))
        ly = 240 + crop.height + 80
    cap = 46
    big = fit_font('display', 'O', cap, 900, 125)
    w, _, _, _ = text_size(d, label, big)
    while w > W - 100 and cap > 20:  # the label always fits the frame (9:16 is narrow)
        cap -= 2
        big = fit_font('display', 'O', cap, 900, 125)
        w, _, _, _ = text_size(d, label, big)
    d.text(((W - w) // 2, ly), label, font=big, fill=YELLOW)
    sm = font('mono', 22, 600)
    w, _, _, _ = text_size(d, 'IN YOUR BROWSER', sm)
    d.text(((W - w) // 2, ly + 80), 'IN YOUR BROWSER', font=sm, fill=CREAM)
    return img


def build(src, fmt, shots):
    W, H = fmt['size']
    dec = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', os.path.join(ROOT, 'launch', src), '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    out = os.path.join(ROOT, 'launch', fmt['out'])
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                            '-i', os.path.join(ROOT, 'launch', src), '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
                            '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-c:a', 'copy', '-movflags', '+faststart', '-shortest', out], stdin=subprocess.PIPE)
    ui = [ui_frame(fmt, shots[0], 'K EDITOR · K1N0 MODE'), ui_frame(fmt, shots[1], 'LOOK STUDIO · ON-CHAIN')] if shots else None
    n = 0
    frame_bytes = W * H * 3
    while True:
        buf = dec.stdout.read(frame_bytes)
        if len(buf) < frame_bytes:
            break
        t = n / FPS
        if t < 4.0:
            img = patch_name(Image.frombuffer('RGB', (W, H), buf), fmt)
        elif t < 8.0:
            img = mark_frame(fmt, t - 4.0)
        elif ui and 11.5 <= t < 15.0:
            img = ui[0] if t < 13.25 else ui[1]
        else:
            img = None
        enc.stdin.write(img.tobytes() if img is not None else buf)
        n += 1
    enc.stdin.close()
    enc.wait()
    dec.wait()
    print(out, n, 'frames')


if __name__ == '__main__':
    shots = sys.argv[1:3] if len(sys.argv) >= 3 else None
    for src, fmt in FORMATS.items():
        build(src, fmt, shots)
