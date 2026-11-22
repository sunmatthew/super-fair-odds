"""Build App Store marketing screenshots: headline above a framed device shot.

Same structure as the previous listing's shots, rebuilt in the app's current
identity — cream rather than the old dark/gold, because the app itself is cream
now and a dark listing would misrepresent it.

Type is San Francisco at weight 800, which is the app's own display token
(fontWeight '800', letterSpacing -1.4 at 40px), rendered with matching negative
tracking so the headline looks like the app's own voice rather than a generic
caption.
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
import sys

SRC = sys.argv[1]
OUT = sys.argv[2]
os.makedirs(OUT, exist_ok=True)

W, H = 1320, 2868

# --- theme/colors.ts -------------------------------------------------------
BG = '#F5F3EF'
INK = '#1A1917'
SECONDARY = '#8A867E'

ACCENT = {
    'coin':    '#DFAE3C',
    'dice':    '#A89E8B',
    'cards':   '#C4453B',
    'wheel':   '#C79A4E',
    'numbers': '#8FA3C9',
    'home':    '#DFAE3C',
    'history': '#8FA3C9',
}

FONT = '/System/Library/Fonts/SFNS.ttf'


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

    Dice's accent is a taupe. At 3:1 it reads as washed-out grey beside the
    cards red, so neutrals go darker until they look like a deliberate dark
    warm grey rather than a mistake.
    """
    return 4.5 if saturation(hex2rgb(hex_color)) < 0.25 else 3.0


def darken_until_readable(hex_color, bg_rgb, target=3.0):
    """Blend an accent toward ink until it is legible as large text on cream.

    The palette was tuned for fills behind a hero object, not for type. Taupe
    dice at #A89E8B is invisible as a headline; this keeps each activity's hue
    while making it actually readable.

    3:1 is the threshold for large text (the headline is 92px bold), not the
    4.5:1 that body copy needs. Using the stricter number here muddies gold
    into olive for no benefit.
    """
    rgb = hex2rgb(hex_color)
    ink = hex2rgb(INK)
    t = 0.0
    while t <= 1.0:
        mixed = tuple(round(rgb[i] + (ink[i] - rgb[i]) * t) for i in range(3))
        if contrast(mixed, bg_rgb) >= target:
            return mixed, t
        t += 0.02
    return ink, 1.0


def sf(size, weight=400):
    f = ImageFont.truetype(FONT, size)
    try:                                   # axes: Width, Optical Size, GRAD, Weight
        f.set_variation_by_axes([100.0, float(size), 0.0, float(weight)])
    except Exception:
        pass
    return f


def tracked_width(draw, text, font, tracking):
    w = 0
    for ch in text:
        w += draw.textlength(ch, font=font) + tracking
    return w - tracking if text else 0


def draw_tracked(draw, xy, text, font, fill, tracking):
    """PIL has no letter-spacing, so advance per glyph by hand."""
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + tracking
    return x


def rounded_shadow(size, box, radius, blur, alpha):
    layer = Image.new('L', size, 0)
    ImageDraw.Draw(layer).rounded_rectangle(box, radius=radius, fill=alpha)
    return layer.filter(ImageFilter.GaussianBlur(blur))


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

# --- geometry --------------------------------------------------------------
MARGIN = 104
WORDMARK_Y = 150
HEAD_SIZE = 100
HEAD_TRACK = -3.5          # ~ -0.035em, the app's display tracking
HEAD_LEAD = 112
SUB_SIZE = 40
DEV_W = 1000
BEZEL = 13

bg_rgb = hex2rgb(BG)
ink_rgb = hex2rgb(INK)
sec_rgb = hex2rgb(SECONDARY)

f_mark = sf(34, 600)
f_head = sf(HEAD_SIZE, 800)
f_sub = sf(SUB_SIZE, 400)

report = []
for p in PANELS:
    canvas = Image.new('RGB', (W, H), bg_rgb)
    d = ImageDraw.Draw(canvas)

    acc_hex = ACCENT[p['accent']]
    acc_rgb, blend = darken_until_readable(acc_hex, bg_rgb, text_target(acc_hex))

    # wordmark
    draw_tracked(d, (MARGIN, WORDMARK_Y), 'super fair odds', f_mark, sec_rgb, 0.4)

    # headline
    y = WORDMARK_Y + 86
    for i, line in enumerate(p['head']):
        fill = acc_rgb if i == p['accent_line'] else ink_rgb
        draw_tracked(d, (MARGIN, y), line, f_head, fill, HEAD_TRACK)
        y += HEAD_LEAD

    # subtitle
    y += 22
    draw_tracked(d, (MARGIN, y), p['sub'], f_sub, sec_rgb, -0.3)
    y += SUB_SIZE + 86

    # device
    shot = Image.open(os.path.join(SRC, p['src'] + '.png')).convert('RGB')
    inner_w = DEV_W - 2 * BEZEL
    inner_h = round(inner_w * shot.size[1] / shot.size[0])
    shot = shot.resize((inner_w, inner_h), Image.LANCZOS)

    dev_h = inner_h + 2 * BEZEL
    dev_x = (W - DEV_W) // 2
    dev_y = y
    if dev_y + dev_h > H - 118:                # keep a little breathing room
        dev_y = H - 118 - dev_h
    radius = round(DEV_W * 0.125)

    shadow = rounded_shadow((W, H), (dev_x, dev_y + 20, dev_x + DEV_W, dev_y + dev_h + 20),
                            radius, 34, 58)
    canvas.paste(Image.new('RGB', (W, H), (26, 25, 23)), (0, 0), shadow)

    body = Image.new('RGB', (DEV_W, dev_h), (26, 25, 23))
    mask = Image.new('L', (DEV_W, dev_h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, DEV_W - 1, dev_h - 1), radius=radius, fill=255)

    inner_mask = Image.new('L', (inner_w, inner_h), 0)
    ImageDraw.Draw(inner_mask).rounded_rectangle(
        (0, 0, inner_w - 1, inner_h - 1), radius=radius - BEZEL, fill=255)
    body.paste(shot, (BEZEL, BEZEL), inner_mask)

    canvas.paste(body, (dev_x, dev_y), mask)

    path = os.path.join(OUT, p['src'] + '.png')
    canvas.save(path, optimize=True)
    report.append((p['src'], ACCENT[p['accent']], blend,
                   contrast(acc_rgb, bg_rgb), dev_y, dev_y + dev_h,
                   os.path.getsize(path) // 1024))

print(f'{"panel":<12} {"accent":<9} {"darkened":<9} {"contrast":<9} {"device y":<14} size')
for name, acc, blend, cr, y0, y1, kb in report:
    print(f'  {name:<10} {acc:<9} {blend*100:>5.0f}%    {cr:>5.2f}:1   {y0:>5}-{y1:<7} {kb:>4} KB')
print(f'\n  all panels {W}x{H}')
