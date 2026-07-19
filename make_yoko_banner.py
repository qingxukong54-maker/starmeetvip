"""Generate Yoko member carousel banner (750x320)"""
from PIL import Image, ImageDraw, ImageFont

SRC = r'D:\Backup\xwechat_files\shadow_o_a2ca\temp\RWTemp\2026-07\3cdd4224fe3691437627f9f0cc3da11f.jpg'
DST = r'C:\Users\Administrator\WorkBuddy\Claw\assets\images\banner-yoko.png'
W, H = 750, 320

RS = Image.Resampling.LANCZOS if hasattr(Image, 'Resampling') else Image.LANCZOS

src = Image.open(SRC).convert('RGB')
sw, sh = src.size  # 1080 x 1920

# Crop upper body: top 8% to 60% for face+shoulders
crop_top = int(sh * 0.08)
crop_bottom = int(sh * 0.60)
src_crop = src.crop((0, crop_top, sw, crop_bottom))

# Resize to right side
right_w = 435
ratio = right_w / src_crop.width
right_h = int(src_crop.height * ratio)
if right_h < H:
    ratio = H / src_crop.height
    right_h = H
    right_w = int(src_crop.width * ratio)
right_img = src_crop.resize((right_w, right_h), RS)

# Canvas with gradient bg
canvas = Image.new('RGB', (W, H))
draw = ImageDraw.Draw(canvas)
for y in range(H):
    r = int(255 - (y / H) * 40)
    g = int(90 + (y / H) * 48)
    b = int(110 + (y / H) * 50)
    draw.line([(0, y), (W, y)], fill=(r, g, b))

# Place photo on RIGHT side
photo_x = W - right_w
photo_y = (H - right_h) // 2
if right_h > H:
    crop_offset = (right_h - H) // 2
    right_img_cropped = right_img.crop((0, crop_offset, right_w, crop_offset + H))
    canvas.paste(right_img_cropped, (photo_x, 0))
else:
    canvas.paste(right_img, (photo_x, photo_y))

# Dark overlay on left text area
overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
ov_draw = ImageDraw.Draw(overlay)
for x in range(380):
    alpha = int(180 * (1 - x / 380) * 0.5)
    ov_draw.line([(x, 0), (x, H)], fill=(0, 0, 0, alpha))
canvas = Image.alpha_composite(canvas.convert('RGBA'), overlay).convert('RGB')
draw = ImageDraw.Draw(canvas)

# Fonts
f_bold = ImageFont.truetype(r'C:/Windows/Fonts/msyhbd.ttc', 28)
f_med = ImageFont.truetype(r'C:/Windows/Fonts/msyh.ttc', 16)
f_sm = ImageFont.truetype(r'C:/Windows/Fonts/msyh.ttc', 14)
f_btn = ImageFont.truetype(r'C:/Windows/Fonts/msyhbd.ttc', 16)

def txtsize(text, font):
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]

def txt(draw, x, y, text, font, fill):
    draw.text((x, y), text, font=font, fill=fill)

# Text
txt(draw, 30, 24, '今日会员推荐', f_bold, 'white')
txt(draw, 30, 64, '注重心灵富足的温柔女生', f_med, '#ffe0e0')
txt(draw, 30, 100, '28岁  |  水瓶座  |  自由职业  |  杭州', f_sm, '#ffd0d0')
txt(draw, 30, 132, '她相信真正的缘分，是灵魂的共振。期待一个', f_sm, '#ffc8c8')
txt(draw, 30, 154, '能读懂她的你，一起书写温暖的故事。', f_sm, '#ffc8c8')

# CTA button
btn_x, btn_y, btn_w, btn_h = 30, 198, 140, 42
draw.rounded_rectangle([btn_x, btn_y, btn_x+btn_w, btn_y+btn_h], radius=21, fill='white')
bw, bh = txtsize('立即了解', f_btn)
txt(draw, btn_x+(btn_w-bw)//2, btn_y+(btn_h-bh)//2-1, '立即了解', f_btn, '#ff5a6e')

canvas.save(DST, quality=95)
print(f'OK: {DST} ({canvas.size})')
