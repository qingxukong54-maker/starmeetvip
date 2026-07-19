#!/usr/bin/env python3
"""Take Cindy banner screenshot as base — replace only: photo + specific text fields."""
from PIL import Image, ImageDraw, ImageFont
import os

BASE = r'C:\Users\Administrator\.workbuddy\clipboard-images\clipboard-2026-07-19T12-08-10-815Z-7d13dc80.png'
PHOTO_SRC = r'C:\Users\Administrator\.workbuddy\clipboard-images\clipboard-2026-07-19T12-08-10-823Z-53bab625.png'
OUT = r'assets\images\banner-yoko.png'

base = Image.open(BASE).convert('RGBA')
bw, bh = base.size
print(f'Base: {bw}x{bh}')

# Font scale: base image is 944x410, reference design is ~489px wide
SCALE = bw / 944
FONT = r'C:\Windows\Fonts\msyh.ttc'
def lf(s):
    return ImageFont.truetype(FONT, max(1, int(s * SCALE)))
font_sm = lf(18)
font_lg = lf(36)

draw = ImageDraw.Draw(base)

# Helper: erase a rect area by painting gradient color
def erase_rect(x1, y1, x2, y2):
    x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
    for px in range(max(0,x1), min(bw,x2)):
        for py in range(max(0,y1), min(bh,y2)):
            r = px / bw * 30 + 225
            g = px / bw * 80 + 110
            b = py / bh * 80 + 100
            base.putpixel((px, py), (int(r)%256, int(g)%256, int(b)%256, 255))

# ---- 1. Name: "Cindy" → "Yoko" ----
ny = int(bh * 0.463)
nx = int(22 * SCALE)
nw = int(draw.textlength('Cindy', font=font_lg)) + int(8*SCALE)
erase_rect(nx, ny, nx+nw, ny+int(40*SCALE))
draw = ImageDraw.Draw(base)
draw.text((nx, ny), 'Yoko', fill='#ffffff', font=font_lg)

# ---- 2. Desc line 1 ----
d1y = int(bh * 0.585)
old1 = '\u559c\u9759\u4e0d\u559c\u4e89\uff0c\u5fc3\u5b89\u5373\u5bcc\u8db3'
new1 = '46\u5c81\u9500\u552e\u5c0f\u59d0\u59d9'
w1 = int(draw.textlength(old1, font=font_sm)) + int(8*SCALE)
erase_rect(int(18*SCALE), d1y, int(18*SCALE)+w1, d1y+int(24*SCALE))
draw = ImageDraw.Draw(base)
draw.text((int(18*SCALE), d1y), new1, fill='#ffffff', font=font_sm)

# ---- 3. Desc line 2 ----
d2y = d1y + int(26*SCALE)
old2 = '\u7cbe\u795e\u4e16\u754c\u7684\u9971\u6ee1\uff0c\u80dc\u4e8e\u4e00\u5207'
new2 = '\u6e29\u6696\u77e5\u6027\uff0c\u671f\u5f85\u771f\u8bda\u76f8\u9047'
w2 = int(draw.textlength(old2, font=font_sm)) + int(8*SCALE)
erase_rect(int(18*SCALE), d2y, int(18*SCALE)+w2, d2y+int(24*SCALE))
draw = ImageDraw.Draw(base)
draw.text((int(18*SCALE), d2y), new2, fill='#ffffff', font=font_sm)

# ---- 4. Tags ----
ty = d2y + int(34*SCALE)
old_tags = ['48\u5c81', '\u767d\u9886', '\u6c34\u74f6\u5ea7']
new_tags = ['46\u5c81', '\u9500\u552e', '\u5929\u79e4\u5ea7']
tx = int(20 * SCALE)
gap = int(8 * SCALE)
for ot, nt in zip(old_tags, new_tags):
    otw = int(draw.textlength(ot, font=font_sm)) + int(18*SCALE)
    th = int(28 * SCALE)
    erase_rect(tx, ty, tx+otw, ty+th)
    draw = ImageDraw.Draw(base)
    ntw = int(draw.textlength(nt, font=font_sm)) + int(18*SCALE)
    draw.rounded_rectangle([tx, ty, tx+ntw, ty+th], radius=int(14*SCALE),
                           outline='#ffccb0', width=max(1,int(SCALE)))
    draw.text((tx+int(9*SCALE), ty+int(4*SCALE)), nt, fill='#ffccb0', font=font_sm)
    tx += ntw + gap

# ---- 5. Replace right-side photo ----
src_img = Image.open(PHOTO_SRC).convert('RGB')
sw, sh = src_img.size
print(f'Source: {sw}x{sh}')

pleft = int(bw * 0.54) - int(5*SCALE)
pw = bw - pleft + int(10*SCALE)
ph = bh

aspect = pw / ph
cw = sw
ch = int(sw / aspect)
if ch > sh:
    ch = sh
    cw = int(sh * aspect)
cy1 = max(0, (sh - ch) // 2)
cx1 = max(0, (sw - cw) // 2)
crop = src_img.crop((cx1, cy1, cx1+cw, cy1+ch))
photo = crop.resize((pw, ph), Image.LANCZOS)
base.paste(photo.convert('RGBA'), (pleft, 0))

# ---- 6. Upscale to 750x320 ----
final = base.resize((750, 320), Image.LANCZOS)
final.convert('RGB').save(OUT, quality=95)
print(f'Done: {OUT} (750x320)')
