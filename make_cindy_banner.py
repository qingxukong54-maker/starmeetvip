# -*- coding: utf-8 -*-
"""生成 Cindy 会员推荐 Banner PNG（750×320 @2x）—— 纯色fill，与HTML版一致"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

OUT = 'assets/images'
W, H = 750, 320

FONT_DIR = r'C:\Windows\Fonts'
def font(size, bold=False):
    name = 'msyhbd.ttc' if bold else 'msyh.ttc'
    return ImageFont.truetype(os.path.join(FONT_DIR, name), size)

# ---- 底图：Cindy 原图缩放 ----
base = Image.open(f'{OUT}/member-00009.jpg').convert('RGB')
bg = base.resize((W, H), Image.LANCZOS)

# ---- 渐变蒙层（第二套方案）----
overlay = Image.new('RGBA', (W, H), (0,0,0,0))
od = ImageDraw.Draw(overlay)
for y in range(H):
    for x in range(W):
        progress = (x / W * 0.7 + y / H * 0.3)
        if progress < 0.42:
            alpha = int(230 * (1 - progress / 0.42))
            r, g, b = 255, 90, 110
        elif progress < 0.72:
            t = (progress - 0.42) / 0.30
            alpha = int(230 * (1 - t * 0.75))
            r = 255; g = int(90 + (138-90)*t); b = int(110 + (61-110)*t)
        else:
            t = (progress - 0.72) / 0.28
            alpha = int(57 * (1 - t))
            r, g, b = 255, 138, 61
        od.point((x,y), fill=(r,g,b,alpha))

canvas = bg.convert('RGBA')
canvas = Image.alpha_composite(canvas, overlay)

# ---- 文字（纯色fill）----
draw = ImageDraw.Draw(canvas)
lx = 22

# 🔥 今日会员推荐 标签（白底）
badge_text = '\U0001f525 \u4eca\u65e5\u4f1a\u5458\u63a8\u8350'
bbox = draw.textbbox((0,0), badge_text, font=font(13))
bw_, bh_ = bbox[2]-bbox[0], bbox[3]-bbox[1]
pad_x, pad_y = 10, 4
draw.rounded_rectangle([lx, 16, lx+bw_+pad_x*2, 16+bh_+pad_y*2], radius=12,
                       fill='white')
draw.text((lx+pad_x, 16+pad_y), badge_text, font=font(13), fill='#ff5a6e')

# STARMEET · 跨界交友
draw.text((lx, 38), 'STARMEET \u00b7 \u8de8\u754c\u4ea4\u53cb', font=font(11), fill='#FCC')

# 主标题：Cindy · 福州（Cindy 金色）
title_y = 56
c_bbox = draw.textbbox((0,0), 'Cindy', font=font(24, True))
c_w = c_bbox[2] - c_bbox[0]
draw.text((lx, title_y), 'Cindy', font=font(24, True), fill='#FFE896')
draw.text((lx + c_w + 2, title_y), ' \u00b7 \u798f\u5dde', font=font(24, True), fill='white')

# 副标题
sub_y = 88
draw.text((lx, sub_y), '\u559c\u9759\u4e0d\u559c\u4e89\uff0c\u5fc3\u5b89\u5373\u5bcc\u8db3', font=font(13), fill='white')
draw.text((lx, sub_y + 20), '\u7cbe\u795e\u4e16\u754c\u7684\u9971\u6ee1\uff0c\u80dc\u4e8e\u4e00\u5207', font=font(13), fill='#FEE')

# 信息标签（深色半透明底）
chip_y = 126
chips = ['48\u5c81', '\u767d\u9886', '\u6c34\u74f6\u5ea7']
cx = lx; gap = 6
for chip in chips:
    cb = draw.textbbox((0,0), chip, font=font(12))
    cw, ch = cb[2]-cb[0], cb[3]-cb[1]
    px, py = 8, 4
    draw.rounded_rectangle([cx, chip_y, cx+cw+px*2, chip_y+ch+py*2],
                            radius=6, fill=(40,40,40,140),
                            outline=(180,180,180,160), width=1)
    draw.text((cx+px, chip_y+py), chip, font=font(12), fill='white')
    cx += cw + px*2 + gap

# CTA 按钮（右下角白底红字）
btn_text = '\u7acb\u5373\u4e86\u89e3 \u2192'
btn_font = font(14, True)
btn_bb = draw.textbbox((0,0), btn_text, btn_font)
btn_w, btn_h = btn_bb[2]-btn_bb[0], btn_bb[3]-btn_bb[1]
btn_px, btn_py = 18, 9
btn_x = W - btn_w - btn_px*2 - 14
btn_y = H - btn_h - btn_py*2 - 12
draw.rounded_rectangle([btn_x, btn_y, btn_x+btn_w+btn_px*2, btn_y+btn_h+btn_py*2],
                       radius=20, fill='white')
draw.text((btn_x+btn_px, btn_y+btn_py), btn_text, font=btn_font, fill='#ff5a6e')

out_path = f'{OUT}/banner-cindy.png'
canvas.convert('RGB').save(out_path, quality=95)
print(f'OK: {out_path} ({os.path.getsize(out_path)//1024}KB)')
