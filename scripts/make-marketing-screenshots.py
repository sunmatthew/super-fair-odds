"""Build App Store marketing screenshots: headline above a framed device shot.

Rendered natively at every portrait size App Store Connect accepts for an
iPhone slot, rather than resampling one size into the others, so the type stays
crisp whichever slot you are filling.

Which slot wants which size is not guessable from the slot's name — a listing
tab reading "iPhone with Dynamic Island (medium display)" does not tell you
whether it means 1206x2622 or 1179x2556 — so render them all and drop in the
one the upload panel asks for.

Type is San Francisco at weight 800, which is the app's own display token
(fontWeight '800', letterSpacing -1.4 at 40px), rendered with matching negative
tracking so the headline looks like the app's voice rather than a caption.

    python3 scripts/make-marketing-screenshots.py store-screenshots OUTDIR
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
import sys

SRC = sys.argv[1]
OUT = sys.argv[2]

SIZES = [
    (1320, 2868, '6.9" — 16/17 Pro Max'),
    (1290, 2796, '6.9"/6.7" alt — 14/15/16 Pro Max'),
    (1284, 2778, '6.7" — 12/13/14 Plus, 12/13 Pro Max'),
    (1242, 2688, '6.5" — XS Max, 11 Pro Max'),
    (1206, 2622, '6.3" — 16/17 Pro'),
    (1179, 2556, '6.1" — 14/15/16'),
]
BASE_H = 2868                      # the height the geometry below was tuned at

# --- theme/colors.ts -------------------------------------------------------
BG = '#F5F3EF'
INK = '#1A1917'
SECONDARY = '#8A867E'

ACCENT = {
    'coin': '#DFAE3C', 'dice': '#A89E8B', 'cards': '#C4453B',
    'wheel': '#C79A4E', 'numbers': '#8FA3C9',
    'home': '#DFAE3C', 'history': '#8FA3C9',
}

FONT = '/System/Library/Fonts/SFNS.ttf'

# --- geometry at BASE_H; every value scales from here ----------------------
G = dict(
    margin=104, wordmark_y=150, mark_size=34, gap_mark=86,
    head_size=100, head_track=-3.5, head_lead=112,
    sub_size=40, gap_sub=22, gap_dev=86,
    dev_w=1000, bezel=13, bottom=118, shadow_dy=20, shadow_blur=34,
)


def hex2rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def luminance(rgb):
    def ch(c):
        c /= 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (ch(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    la, lb = luminance(a), luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def saturation(rgb):
    hi, lo = max(rgb), min(rgb)
    return 0 if hi == 0 else (hi - lo) / hi


def text_target(hex_color):
    """A hue can carry a headline at 3:1; a near-neutral cannot.

    3:1 is the bar for large text, which a 100px bold headline is — holding it
    to the 4.5:1 that body copy needs turns the gold olive for no benefit.
    Dice's accent is a taupe, though, and at 3:1 it reads as washed-out grey
    beside the cards red, so neutrals go to 4.5 and look deliberate.
    """
    return 4.5 if saturation(hex2rgb(hex_color)) < 0.25 else 3.0


def darken_until_readable(hex_color, bg_rgb, target):
    """Blend an accent toward ink until it carries as type on cream.

    The palette was tuned for fills behind a hero object, not for text.
    """
    rgb, ink = hex2rgb(hex_color), hex2rgb(INK)
    t = 0.0
    while t <= 1.0:
        mixed = tuple(round(rgb[i] + (ink[i] - rgb[i]) * t) for i in range(3))
        if contrast(mixed, bg_rgb) >= target:
            return mixed, t
        t += 0.02
    return ink, 1.0


def sf(size, weight=400):
    f = ImageFont.truetype(FONT, max(size, 1))
    try:                               # axes: Width, Optical Size, GRAD, Weight
        f.set_variation_by_axes([100.0, float(max(size, 1)), 0.0, float(weight)])
    except Exception:
        pass
    return f


def draw_tracked(draw, xy, text, font, fill, tracking):
    """PIL has no letter-spacing, so advance per glyph by hand."""
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + tracking
    return x


def tracked_width(draw, text, font, tracking):
    if not text:
        return 0
    return sum(draw.textlength(c, font=font) + tracking for c in text) - tracking


PANELS = [
    dict(src='01-home', accent='home',
         head=['Five ways', 'to settle it.'], accent_line=1,
         sub='No ads, no accounts, no internet.'),
    dict(src='02-coin', accent='coin',
         head=['The toss,', 'perfected.'], accent_line=1,
         sub='One flip, or best of three.'),
    dict(src='03-dice', accent='dice',
         head=['Dice that', 'actually tumble.'], accent_line=1,
         sub='One, two or three at a time.'),
    dict(src='04-cards', accent='cards',
         head=['Fifty-two cards,', 'never repeated.'], accent_line=1,
         sub='The deck thins as you draw, then reshuffles.'),
    dict(src='05-wheel', accent='wheel',
         head=['Your options,', 'spun.'], accent_line=1,
         sub='Write the list. It remembers.'),
    dict(src='06-numbers', accent='numbers',
         head=['Any number,', 'any range.'], accent_line=1,
         sub='One to ten, or one to nine thousand.'),
    dict(src='07-history', accent='history',
         head=['Every result,', 'kept.'], accent_line=1,
         sub='On your phone, and nowhere else.'),
]

bg_rgb, ink_rgb, sec_rgb = hex2rgb(BG), hex2rgb(INK), hex2rgb(SECONDARY)
shots = {p['src']: Image.open(os.path.join(SRC, p['src'] + '.png')).convert('RGB')
         for p in PANELS}

for W, H in [(w, h) for w, h, _ in SIZES]:
    label = next(l for w, h, l in SIZES if (w, h) == (W, H))
    s = H / BASE_H
    g = {k: (v * s if isinstance(v, (int, float)) else v) for k, v in G.items()}
    d_out = os.path.join(OUT, f'{W}x{H}')
    os.makedirs(d_out, exist_ok=True)

    f_mark = sf(round(g['mark_size']), 600)
    f_head = sf(round(g['head_size']), 800)
    f_sub = sf(round(g['sub_size']), 400)

    widest = 0
    for p in PANELS:
        canvas = Image.new('RGB', (W, H), bg_rgb)
        dr = ImageDraw.Draw(canvas)

        acc_hex = ACCENT[p['accent']]
        acc_rgb, _ = darken_until_readable(acc_hex, bg_rgb, text_target(acc_hex))

        m = round(g['margin'])
        draw_tracked(dr, (m, round(g['wordmark_y'])), 'super fair odds', f_mark, sec_rgb, 0.4)

        y = g['wordmark_y'] + g['gap_mark']
        for i, line in enumerate(p['head']):
            fill = acc_rgb if i == p['accent_line'] else ink_rgb
            draw_tracked(dr, (m, round(y)), line, f_head, fill, g['head_track'])
            widest = max(widest, tracked_width(dr, line, f_head, g['head_track']))
            y += g['head_lead']

        y += g['gap_sub']
        draw_tracked(dr, (m, round(y)), p['sub'], f_sub, sec_rgb, -0.3)
        widest = max(widest, tracked_width(dr, p['sub'], f_sub, -0.3))
        y += g['sub_size'] + g['gap_dev']

        dev_w = round(g['dev_w'])
        bezel = max(round(g['bezel']), 1)
        shot = shots[p['src']]
        inner_w = dev_w - 2 * bezel
        inner_h = round(inner_w * shot.size[1] / shot.size[0])
        scaled = shot.resize((inner_w, inner_h), Image.LANCZOS)

        dev_h = inner_h + 2 * bezel
        dev_x = (W - dev_w) // 2
        dev_y = round(y)
        if dev_y + dev_h > H - round(g['bottom']):
            dev_y = H - round(g['bottom']) - dev_h
        radius = round(dev_w * 0.125)

        sh = Image.new('L', (W, H), 0)
        ImageDraw.Draw(sh).rounded_rectangle(
            (dev_x, dev_y + round(g['shadow_dy']),
             dev_x + dev_w, dev_y + dev_h + round(g['shadow_dy'])),
            radius=radius, fill=58)
        canvas.paste(Image.new('RGB', (W, H), ink_rgb), (0, 0),
                     sh.filter(ImageFilter.GaussianBlur(g['shadow_blur'])))

        body = Image.new('RGB', (dev_w, dev_h), ink_rgb)
        mask = Image.new('L', (dev_w, dev_h), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, dev_w - 1, dev_h - 1),
                                               radius=radius, fill=255)
        im = Image.new('L', (inner_w, inner_h), 0)
        ImageDraw.Draw(im).rounded_rectangle((0, 0, inner_w - 1, inner_h - 1),
                                             radius=max(radius - bezel, 1), fill=255)
        body.paste(scaled, (bezel, bezel), im)
        canvas.paste(body, (dev_x, dev_y), mask)

        canvas.save(os.path.join(d_out, p['src'] + '.png'), optimize=True)

    avail = W - 2 * round(g['margin'])
    fit = 'ok' if widest <= avail else f'OVERFLOW by {round(widest - avail)}px'
    total = sum(os.path.getsize(os.path.join(d_out, f)) for f in os.listdir(d_out))
    print(f'  {W}x{H}  {label:<38} widest line {round(widest):>4}/{avail}  {fit:<8} '
          f'{total // 1024:>5} KB')

print(f'\n  {len(SIZES)} sizes x {len(PANELS)} panels = {len(SIZES) * len(PANELS)} files in {OUT}/')
