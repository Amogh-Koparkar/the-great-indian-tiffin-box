import subprocess, os
from PIL import Image
import numpy as np

OUT = r"C:\Users\ALIENWARE\.gemini\antigravity\brain\5870a321-fa75-4e82-a1ae-56953261be32\scratch\v3_check\frames"
os.makedirs(OUT, exist_ok=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", "1.0", "-to", "6.0", "-i", r"assets\references\first animation 2.mp4", "-vf", "scale=320:180", os.path.join(OUT, "f_%03d.png")], check=True)
fs = sorted(os.listdir(OUT))
prev = None
for i, f in enumerate(fs):
    im = np.asarray(Image.open(os.path.join(OUT, f)).convert("L"), dtype=np.float32)
    if prev is not None:
        diff = float(np.abs(im - prev).mean())
        t = 1.0 + i / 30.0
        if diff > 0.3:
            print(f"frame {i:03d} (t={t:.2f}s): mean_abs_diff={diff:.2f}")
    prev = im
