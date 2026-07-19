# -*- coding: utf-8 -*-
"""
生成 StarMeet 会员推荐 Banner 的分层 PSD
图层结构（从下到上）：
  1. 背景照片（占位，可替换）
  2. 品牌斜向渐变蒙层
  3. 底部暗角渐变
  4. 文字层（标题/副标题/标签，栅格化）
尺寸：750 x 320 (2x，即 375x160 @2x 高清)
"""
import numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H = 750, 320
FONT = "C:/Windows/Fonts/msyh.ttc"
FONT_BD = "C:/Windows/Fonts/msyhbd.ttc"

def hex2rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

# ---------- 图层2：品牌斜向渐变蒙层 (110deg, 左浓右透) ----------
def brand_gradient():
    img = np.zeros((H, W, 4), dtype=np.float64)
    c1 = hex2rgb('#ff5a6e'); c2 = hex2rgb('#ff8a3d')
    # 110deg 方向向量
    import math
    ang = math.radians(110 - 90)  # CSS 角度转换
    dx, dy = math.sin(math.radians(110)), -math.cos(math.radians(110))
    # 归一化投影范围
    xs = np.arange(W); ys = np.arange(H)
    gx, gy = np.meshgrid(xs, ys)
    proj = gx * dx + gy * dy
    proj = (proj - proj.min()) / (proj.max() - proj.min())  # 0..1
    # 分段：0%->c1(0.90), 42%->c2(0.65), 72%->c1(0.08), 100%->transparent
    stops = [(0.0, c1, 0.90), (0.42, c2, 0.65), (0.72, c1, 0.08), (1.0, c1, 0.0)]
    for i in range(len(stops)-1):
        p0, col0, a0 = stops[i]
        p1, col1, a1 = stops[i+1]
        mask = (proj >= p0) & (proj <= p1)
        t = (proj - p0) / (p1 - p0 + 1e-9)
        for c in range(3):
            img[..., c][mask] = (col0[c] * (1-t) + col1[c] * t)[mask]
        img[..., 3][mask] = ((a0 * (1-t) + a1 * t) * 255)[mask]
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), 'RGBA')

# ---------- 图层3：底部暗角渐变 ----------
def bottom_shadow():
    img = np.zeros((H, W, 4), dtype=np.float64)
    ys = np.arange(H)
    # 40%以下开始，到底部 0.50 黑
    alpha = np.clip((ys/H - 0.40) / 0.60, 0, 1) * 0.50 * 255
    for y in range(H):
        img[y, :, 3] = alpha[y]
    # RGB=黑
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), 'RGBA')

# ---------- 图层1：背景照片占位 ----------
def bg_placeholder():
    img = Image.new('RGBA', (W, H), (210, 210, 214, 255))
    d = ImageDraw.Draw(img)
    f = ImageFont.truetype(FONT, 26)
    txt = "▲ 替换为会员照片图层"
    bb = d.textbbox((0,0), txt, font=f)
    d.text(((W-(bb[2]-bb[0]))/2, (H-(bb[3]-bb[1]))/2), txt, font=f, fill=(120,120,126,255))
    return img

# ---------- 图层4：文字 ----------
def text_layer():
    img = Image.new('RGBA', (W, H), (0,0,0,0))
    d = ImageDraw.Draw(img)
    PAD = 32
    y = 36
    # 标签 badge
    f_badge = ImageFont.truetype(FONT, 20)
    btxt = "🔥 今日会员推荐"
    bb = d.textbbox((0,0), btxt, font=f_badge)
    bw, bh = bb[2]-bb[0], bb[3]-bb[1]
    d.rounded_rectangle([PAD, y, PAD+bw+28, y+bh+16], radius=20, fill=(255,255,255,60))
    d.text((PAD+14, y+6), btxt, font=f_badge, fill=(255,255,255,255))
    y += bh + 30
    # tagline
    f_tag = ImageFont.truetype(FONT, 18)
    d.text((PAD, y), "STARMEET · 跨界交友", font=f_tag, fill=(255,255,255,210))
    y += 30
    # 标题
    f_title = ImageFont.truetype(FONT_BD, 44)
    d.text((PAD, y), "会员昵称 · 城市", font=f_title, fill=(255,255,255,255))
    y += 60
    # 副标题
    f_sub = ImageFont.truetype(FONT, 22)
    d.text((PAD, y), "一句话文案第一行", font=f_sub, fill=(255,255,255,235))
    d.text((PAD, y+30), "一句话文案第二行", font=f_sub, fill=(255,255,255,235))
    # 底部标签 chips
    f_chip = ImageFont.truetype(FONT, 20)
    cy = H - 52
    cx = PAD
    for chip in ["年龄", "职业", "星座"]:
        bb = d.textbbox((0,0), chip, font=f_chip)
        cw = bb[2]-bb[0]
        d.rounded_rectangle([cx, cy, cx+cw+24, cy+34], radius=8, fill=(255,255,255,45))
        d.text((cx+12, cy+6), chip, font=f_chip, fill=(255,255,255,255))
        cx += cw + 36
    return img

# ============ 组装 PSD ============
layers_pil = {
    "1_背景照片(可替换)": bg_placeholder(),
    "2_品牌渐变蒙层": brand_gradient(),
    "3_底部暗角": bottom_shadow(),
    "4_文字": text_layer(),
}

# 先导出一张合成预览 PNG
composite = Image.new('RGBA', (W, H), (0,0,0,0))
for name, ly in layers_pil.items():
    composite = Image.alpha_composite(composite, ly)
composite.convert('RGB').save("C:/Users/Administrator/WorkBuddy/Claw/assets/images/banner-template-preview.png")
print("PREVIEW_SAVED")

# 尝试用 pytoshop 生成分层 PSD
try:
    import pytoshop
    from pytoshop.user import nested_layers
    from pytoshop import enums

    psd_layers = []
    # pytoshop 图层顺序：列表第一个在最上层
    order = ["4_文字", "3_底部暗角", "2_品牌渐变蒙层", "1_背景照片(可替换)"]
    for name in order:
        pil = layers_pil[name].convert('RGBA')
        arr = np.array(pil)
        r = arr[..., 0]; g = arr[..., 1]; b = arr[..., 2]; a = arr[..., 3]
        layer = nested_layers.Image(
            name=name,
            visible=True,
            opacity=255,
            top=0, left=0,
            bottom=H, right=W,
            channels={-1: a, 0: r, 1: g, 2: b},
            color_mode=enums.ColorMode.rgb,
        )
        psd_layers.append(layer)

    psd = nested_layers.nested_layers_to_psd(
        psd_layers, color_mode=enums.ColorMode.rgb,
        compression=enums.Compression.raw,
    )
    with open("C:/Users/Administrator/WorkBuddy/Claw/assets/images/banner-template.psd", "wb") as f:
        psd.write(f)
    print("PSD_SAVED_PYTOSHOP")
except Exception as e:
    print("PYTOSHOP_FAILED:", repr(e))
