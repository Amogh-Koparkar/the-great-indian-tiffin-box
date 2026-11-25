import os, sys
from PIL import Image
base = sys.argv[1]
for root, _, fs in os.walk(base):
    if 'references' in root:
        continue
    for f in sorted(fs):
        if f.lower().endswith('.png'):
            im = Image.open(os.path.join(root, f)).convert('RGBA')
            a = im.split()[3]
            bb = a.point(lambda v: 255 if v > 8 else 0).getbbox()
            print(os.path.basename(root), '|', f, '|', bb, '| ', 'FULL-OPAQUE' if a.getextrema()[0] > 200 else '')
