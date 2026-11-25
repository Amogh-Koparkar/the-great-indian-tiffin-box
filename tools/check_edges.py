import subprocess
from PIL import Image
import numpy as np

def check_img(p):
    im = Image.open(p).convert('RGBA')
    a = np.asarray(im)
    w, h = im.size
    print(p, f'{w}x{h}')
    for side, sl in [('left', a[:, :10]), ('right', a[:, -10:]), ('top', a[:10, :]), ('bottom', a[-10:, :])]:
        white = ((sl[...,0]>240)&(sl[...,1]>240)&(sl[...,2]>240)&(sl[...,3]>200)).mean()
        trans = (sl[...,3]<50).mean()
        print(f'  {side}: white={white:.2f}, trans={trans:.2f}, meanRGB={sl[...,:3].mean(axis=(0,1)).astype(int).tolist()}')

check_img(r'assets\options scene\options_bg.png')
check_img(r'assets\kitchen scene\Kitchen_bg.png')
check_img(r'assets\options scene\options hand.png')

# Check options hand bbox in 1920x1080
hand = Image.open(r'assets\options scene\options hand.png').convert('RGBA')
alpha = hand.split()[3]
print('options hand alpha bbox (1920x1080):', alpha.point(lambda v: 255 if v > 8 else 0).getbbox())
ha = np.asarray(alpha)
for y in range(1060, 1080):
    nz = np.where(ha[y] > 20)[0]
    if len(nz):
        print(f'  row y={y}: x in [{nz[0]}..{nz[-1]}], count={len(nz)}')
    else:
        print(f'  row y={y}: EMPTY')
