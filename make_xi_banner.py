# -*- coding: utf-8 -*-
"""生成 熙 会员推荐 Banner PNG（750×320 @2x）—— 与 Cindy 同款风格"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os, math

OUT = 'assets/images'
W, H = 750, 320

FONT_DIR = r'C:\Windows\Fonts'
def font(size, bold=False):
    name = 'msyhbd.ttc' if bold else 'msyh.ttc'
    return ImageFont.truetype(os.path.join(FONT_DIR, name), size)

# ---- 底图：熙 原图，整张缩放铺满（不裁切）----
base = Image.open(f'{OUT}/member-00007.jpg').convert('RGB')
bg = base.resize((W, H), Image.LANCZOS)

# ---- 渐变蒙层（与 Cindy 完全一致的参数）----
overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
od = ImageDraw.Draw(overlay)
for y in range(H):
    for x in range(W):
        # 对角线渐变：左上(#ff5a6e 浓) → 右下透 —— 和 Cindy 一模一样
        progress = (x / W * 0.7 + y / H * 0.3)
        if progress < 0.42:
            alpha = int(230 * (1 - progress / 0.42))
            r, g, b = 255, 90, 110
        elif progress < 0.72:
            t = (progress - 0.42) / 0.30
            alpha = int(230 * (1 - t * 0.75))
            r = int(255 + (255-255)*t)
            g = int(90 + (138-90)*t)
            b = int(110 + (61-110)*t)
        else:
            t = (progress - 0.72) / 0.28
            alpha = int(57 * (1 - t))
            r, g, b = 255, 138, 61
        od.point((x, y), fill=(r, g, b, alpha))

canvas = bg.convert('RGBA')
canvas = Image.alpha_composite(canvas, overlay)

# ---- 文字绘制（纯色 fill，不用 RGBA） ----
draw = ImageDraw.Draw(canvas)
lx = 22

# 🔥 标签
badge_text = '\U0001f525 \u4eca\u65e5\u4f1a\u5458\u63a8\u8350'
bbox = draw.textbbox((0, 0), badge_text, font=font(13))
bw_, bh_ = bbox[2] - bbox[0], bbox[3] - bbox[1]
pad_x, pad_y = 10, 4
draw.rounded_rectangle([lx, 16, lx+bw_+pad_x*2, 16+bh_+pad_y*2],
                       radius=12, fill=(255,255,255),
                       outline=(255,255,255), width=1)
draw.text((lx+pad_x, 16+pad_y), badge_text, font=font(13), fill=(255,90,110))

# STARMEET · 跨界交友
draw.text((lx, 38), 'STARMEET \u00b7 \u8de8\u754c\u4ea4\u53cb', font=font(11), fill='#E88')

# 主标题：熙 · 福州（熙 用金色高亮）
title_y = 56
xi_bbox = draw.textbbox((0, 0), '\u7199', font=font(24, True))
xi_w = xi_bbox[2] - xi_bbox[0]
draw.text((lx, title_y), '\u7199', font=font(24, True), fill='#FFE896')
dot_x = lx + xi_w + 2
draw.text((dot_x, title_y), ' \u00b7 \u798f\u5dde', font=font(24, True), fill='white')

# 副标题
sub_y = 88
draw.text((lx, sub_y), '\u515c\u515c\u4e1a\u4e1a\u7684\u6559\u80b2\u5de5\u4f5c\u8005', font=font(13), fill='#FFF')
draw.text((lx, sub_y + 20), '\u771f\u8bda \u00b7 \u4e0a\u8fdb \u00b7 \u5b5d\u987a', font=font(13), fill='#FEE')

# 信息标签
chip_y = 126
chips = ['35\u5c81', '\u8001\u5e08', '\u91d1\u725b\u5ea7']
cx = lx
gap = 6
for chip in chips:
    cb = draw.textbbox((0, 0), chip, font=font(12))
    cw, ch = cb[2]-cb[0], cb[3]-cb[1]
    px, py = 8, 4
    draw.rounded_rectangle([cx, chip_y, cx+cw+px*2, chip_y+ch+py*2],
                            radius=6, fill=(40,40,40,120),
                            outline=(200,200,200,160), width=1)
    draw.text((cx+px, chip_y+py), chip, font=font(12), fill='white')
    cx += cw + px*2 + gap

# CTA 按钮（右下角）
btn_text = '\u7acb\u5373\u4e86\u89e3 \u2192'
btn_font = font(14, True)
btn_bb = draw.textbbox((0, 0), btn_text, btn_font)
btn_w, btn_h = btn_bb[2]-btn_bb[0], btn_bb[3]-btn_bb[1]
btn_px, btn_py = 18, 9
btn_x = W - btn_w - btn_px*2 - 14
btn_y = H - btn_h - btn_py*2 - 12
draw.rounded_rectangle([btn_x, btn_y, btn_x+btn_w+btn_px*2, btn_y+btn_h+btn_py*2],
                       radius=20, fill='white')
draw.text((btn_x+btn_px, btn_y+btn_py), btn_text, font=btn_font, fill='#ff5a6e')

out_path = f'{OUT}/banner-xi.png'
canvas.convert('RGB').save(out_path, quality=95)
print(f'OK: {out_path} ({os.path.getsize(out_path)//1024}KB)')
