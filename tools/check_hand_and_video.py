import subprocess
from PIL import Image
import numpy as np

# Check rows 1030..1080 of options hand.png and excited boy.png
for name in ['options hand', 'excited boy', 'mother']:
    im = Image.open(rf'assets\options scene\{name}.png').convert('RGBA')
    a = np.asarray(im.split()[3])
    print(f'=== {name} ===')
    for y in [1000, 1030, 1050, 1060, 1065, 1070, 1074, 1075, 1076, 1077, 1078, 1079]:
        nz = np.where(a[y] > 128)[0]
        print(f'  y={y}: count(a>128)={len(nz)}, range={((int(nz[0]), int(nz[-1])) if len(nz) else None)}')

# Check first animation 2.mp4 frame-to-frame motion between t=1.2s and t=6.0s
# Extract frames at 30fps into memory or temp folder and compute dx/dy or diff
