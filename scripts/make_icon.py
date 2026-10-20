"""Render the extension icon from the shipped theme files.

A ring of 26 equal wedges, one per theme, each filled with that theme's
primary color as shipped (statusBar.background), sorted by hue with the
near-grays last. The tile is Superhero's editor background, the site default.

Usage: python3 scripts/make_icon.py   (requires Pillow)
Writes images/icon.png at 256x256.
"""

import colorsys
import glob
import json
import os

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
THEMES = os.path.join(ROOT, "themes")
OUT = os.path.join(ROOT, "images", "icon.png")

SIZE = 256
SUPERSAMPLE = 4  # draw large, then downscale for smooth edges


def hex_rgb(c):
    return tuple(int(c[i:i + 2], 16) for i in (1, 3, 5))


def hue_key(c):
    h, l, s = colorsys.rgb_to_hls(*(v / 255 for v in hex_rgb(c)))
    return (s < 0.15, l if s < 0.15 else h)  # grays last, ordered by lightness


def load_colors():
    colors = {}
    for path in glob.glob(os.path.join(THEMES, "*-color-theme.json")):
        with open(path) as f:
            colors[os.path.basename(path).split("-")[0]] = json.load(f)["colors"]
    return colors


def render(themes):
    primaries = sorted((c["statusBar.background"] for c in themes.values()), key=hue_key)
    tile = hex_rgb(themes["superhero"]["editor.background"])

    s = SIZE * SUPERSAMPLE
    im = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, s - 1, s - 1), radius=s * 0.18, fill=tile)

    center, outer, inner = s / 2, s * 0.40, s * 0.20
    box = (center - outer, center - outer, center + outer, center + outer)
    step = 360 / len(primaries)
    for i, color in enumerate(primaries):
        start = -90 + step * i
        # A slight overlap hides hairline seams between wedges.
        d.pieslice(box, start, start + step + 0.3, fill=hex_rgb(color))
    d.ellipse((center - inner, center - inner, center + inner, center + inner), fill=tile)

    return im.resize((SIZE, SIZE), Image.Resampling.LANCZOS)


if __name__ == "__main__":
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    render(load_colors()).save(OUT, optimize=True)
    print(f"wrote {os.path.relpath(OUT, ROOT)}")
