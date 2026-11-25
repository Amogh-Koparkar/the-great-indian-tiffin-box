import subprocess, os
from PIL import Image
import numpy as np

OUT = r"C:\Users\ALIENWARE\.gemini\antigravity\brain\5870a321-fa75-4e82-a1ae-56953261be32\scratch\v3_check\t2_frames"
os.makedirs(OUT, exist_ok=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", r"assets\title scene\title scene 2.mp4", "-vf", "scale=320:180", os.path.join(OUT, "f_%03d.png")], check=True)
fs = sorted(os.listdir(OUT))
last = np.asarray(Image.open(os.path.join(OUT, fs[-1])).convert("RGB"), dtype=np.float32)
for i, f in enumerate(fs):
    im = np.asarray(Image.open(os.path.join(OUT, f)).convert("RGB"), dtype=np.float32)
    diff = float(np.abs(im - last).mean())
    if diff < 8.0:
        print(f"frame {i:03d} (t={i/25.0:.2f}s / {len(fs)/25.0:.2f}s): diff_to_last={diff:.2f}")
