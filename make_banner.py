from PIL import Image, ImageDraw, ImageFont

OUT = 'assets/images'
FONT_DIR = 'C:/Windows/Fonts/'

def make_font(size, bold=False):
    idx = 1 if bold else 0
    return ImageFont.truetype(FONT_DIR + 'msyh.ttc', size, index=idx)

# ---------- 用用户底图作为背景 ----------
bg = Image.open(f'{OUT}/banner-survey-bg.png').convert('RGB')
W, Hh = bg.size  # 保持原始比例，resize 到 750x320
if (W, Hh) != (750, 320):
    bg = bg.resize((750, 320), Image.Resampling.LANCZOS)
    W, Hh = 750, 320

d = ImageDraw.Draw(bg)

# 右侧白卡（二维码）
card_x, card_y, card_w, card_h = 512, 38, 206, 244
d.rounded_rectangle([card_x, card_y, card_x+card_w, card_y+card_h], radius=18, fill='white')

qr = Image.open(f'{OUT}/qr-survey.png').resize((168,168))
bg.paste(qr, (card_x + (card_w-168)//2, card_y + 16))

def text_center(txt, y, fnt, fill):
    tw = d.textlength(txt, font=fnt)
    d.text((card_x+card_w/2 - tw/2, y), txt, font=fnt, fill=fill)
text_center('扫码报名', card_y + 192, make_font(22, True), '#FF5A6E')
text_center('填写问卷抢名额', card_y + 218, make_font(15), '#828282')

# 左侧文案（新文案 v3）
lx = 36

# 主标题：StarMeet 创始会员招募（粗体）
d.text(xy=(lx, 88), text='StarMeet 创始会员招募', font=make_font(40, True), fill='#FFFFFF')

# 副标题：真人认证 · 人工审核 · 高质量会员（粗体醒目）
d.text(xy=(lx, 152), text='真人认证 · 人工审核 · 高质量会员', font=make_font(22, True), fill='#FFF5F5')

# 底部小字（两行）
d.text(xy=(lx, 210), text='我们坚信，只有真诚，才值得认真对待。', font=make_font(14), fill='#E8D0D0')
d.text(xy=(lx, 234), text='诚邀同频的你，共建真诚的交友社区。', font=make_font(14), fill='#E8D0D0')

bg.save(f'{OUT}/banner-survey.png', quality=95)
print('BANNER ->', f'{OUT}/banner-survey.png', bg.size)
print('DONE')
