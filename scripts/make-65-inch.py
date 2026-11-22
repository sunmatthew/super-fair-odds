"""Derive the 6.5" (1284x2778) set from the native 6.9" (1320x2868) captures.

A straight resize to 1284x2778 squashes the image 0.4% vertically, because the
two sizes are not the same aspect ratio. Instead: scale by height alone, which
keeps every circle a circle, then pad the 5 leftover columns by replicating the
edge column. Verified beforehand that all seven captures carry nothing but
background in their outer 4 columns, so the padding is invisible.
"""
from PIL import Image
import os, sys

SRC, DST = sys.argv[1], sys.argv[2]
TARGET_W, TARGET_H = 1284, 2778
os.makedirs(DST, exist_ok=True)

for name in sorted(os.listdir(SRC)):
    if not name.endswith('.png'):
        continue
    im = Image.open(os.path.join(SRC, name)).convert('RGB')
    w, h = im.size
    scaled_w = round(w * TARGET_H / h)
    im = im.resize((scaled_w, TARGET_H), Image.LANCZOS)

    pad = TARGET_W - scaled_w
    left = pad // 2
    out = Image.new('RGB', (TARGET_W, TARGET_H))
    out.paste(im, (left, 0))
    # replicate the edge columns into the padding
    for x in range(left):
        out.paste(im.crop((0, 0, 1, TARGET_H)), (x, 0))
    for x in range(left + scaled_w, TARGET_W):
        out.paste(im.crop((scaled_w - 1, 0, scaled_w, TARGET_H)), (x, 0))

    out.save(os.path.join(DST, name), optimize=True)
    print(f'  {name:<15} {w}x{h} -> scaled {scaled_w}x{TARGET_H}, padded {pad}px -> {TARGET_W}x{TARGET_H}')
