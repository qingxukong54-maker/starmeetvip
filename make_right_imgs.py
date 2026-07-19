from PIL import Image

OUT = 'assets/images'
TW, TH = 435, 320  # 输出尺寸 = 右侧区域 2x 高清


def crop_box(src, box):
    """按精确坐标 box=(l,t,r,b) 裁切，然后 resize 到目标尺寸"""
    im = Image.open(src).convert('RGB')
    W, H = im.size
    l, t, r, b = [int(round(v)) for v in box]
    l, t = max(0, l), max(0, t)
    r, b = min(W, r), min(H, b)
    cropped = im.crop((l, t, r, b))
    return cropped.resize((TW, TH), Image.Resampling.LANCZOS)


# ===== Yoko：脸部居中特写(1440×1920) =====
# 目标：完整面部+头发+肩颈+上胸（类似参考截图中的半身肖像）
# 当前问题(第2次)：box 仍然太近，只露出眼睛额头
# 解决：大幅扩展框范围到完整上半身肖像
yoko = crop_box(f'{OUT}/member-00008.jpg', (100, 120, 1340, 1280))
yoko.save(f'{OUT}/banner-right-yoko.png', quality=95)
print('Yoko OK', yoko.size)

# ===== Cindy：古村落全身照(800×888)，人靠左侧石墙 =====
# 第3次修正：头部(棒球帽)被切 → top 上移到 230
# 她的棒球帽顶约 y=290，top=230 确保帽完整且贴近输出上沿
# 高度 490px(230→720), 宽度需 490×1.36≈666px
# 水平中心 x≈405: left=70, right=736
cindy = crop_box(f'{OUT}/member-00009.jpg', (70, 230, 736, 720))
cindy.save(f'{OUT}/banner-right-cindy.png', quality=95)
print('Cindy OK', cindy.size)

# ===== 熙：机场自拍(960×1228) =====
# 目标：脸在右侧中间区域（非边缘）+ 飞机机舱 + 手势
# 当前问题：right=920 脸仍挤在最右边
# 关键策略：大幅左移扩展，让脸(原图x≈780-955)映射到输出右侧30%区域
#   高度 560(340→900), 宽度需 560×1.36≈762px
#   让脸在输出中位于约72%位置 → 框右边界=960, 左边界=960-762=198
xi = crop_box(f'{OUT}/member-00007.jpg', (198, 320, 960, 880))
xi.save(f'{OUT}/banner-right-xi.png', quality=95)
print('熙 OK', xi.size)

print('DONE — 三张已重新生成')
