import os, subprocess
import numpy as np
from PIL import Image

ROOT = r"C:\Users\ALIENWARE\.gemini\antigravity\scratch\tiffin-website-v3\assets"
OUT = r"C:\Users\ALIENWARE\.gemini\antigravity\brain\5870a321-fa75-4e82-a1ae-56953261be32\scratch\v3_check"
os.makedirs(OUT, exist_ok=True)

# 1. Contact sheets for all 3 videos
for name, rel in [("v1_intro", r"references\first animation 2.mp4"),
                  ("v2_title1", r"title scene\title scene 1.mp4"),
                  ("v3_title2", r"title scene\title scene 2.mp4")]:
    vp = os.path.join(ROOT, rel)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", vp, "-vf", "fps=2,scale=320:-1,tile=6x4", "-frames:v", "1", os.path.join(OUT, f"{name}_sheet.png")], check=True)
    # first and last frame at 1920x1080
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", vp, "-frames:v", "1", os.path.join(OUT, f"{name}_first.png")], check=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-sseof", "-0.08", "-i", vp, "-frames:v", "1", os.path.join(OUT, f"{name}_last.png")], check=True)

# 2. Check first frame of title scene 1 colour
t1_first = Image.open(os.path.join(OUT, "v2_title1_first.png")).convert("RGB")
print("title scene 1 first frame top-left pixel:", t1_first.getpixel((10, 10)), "hex: #%02x%02x%02x" % t1_first.getpixel((10, 10)))

# 3. Check updated still 2 vs options_bg + excited boy + mother + options hand
W, H = 1920, 1080
c2 = Image.new("RGBA", (W, H), (255, 255, 255, 255))
for n in ["options_bg", "excited boy", "mother", "options hand"]:
    im = Image.open(os.path.join(ROOT, "options scene", n + ".png")).convert("RGBA")
    c2.alpha_composite(im)
s2 = Image.open(os.path.join(ROOT, "references", "still 2.png")).convert("RGBA")
s2_rgb = Image.new("RGBA", (W, H), (255, 255, 255, 255))
s2_rgb.alpha_composite(s2)
rmse2 = float(np.sqrt(((np.asarray(c2.convert("RGB"), dtype=np.float32) - np.asarray(s2_rgb.convert("RGB"), dtype=np.float32)) ** 2).mean()))
print(f"Scene 2 with options_bg vs updated still 2 | RMSE: {rmse2:.3f} / 255")
s2_rgb.convert("RGB").resize((1280, 720), Image.LANCZOS).save(os.path.join(OUT, "still2_new.png"))

# 4. Check updated still 3 vs Kitchen_bg + stove + pan + bowls + arm + mother
c3 = Image.new("RGBA", (W, H), (255, 255, 255, 255))
for n in ["Kitchen_bg", "stove", "pan", "rice", "masala", "onion", "lemon juice", "cashew and nuts", "oil", "forearm", "shoulder", "wrist", "still mother"]:
    im = Image.open(os.path.join(ROOT, "kitchen scene", n + ".png")).convert("RGBA")
    c3.alpha_composite(im)
s3 = Image.open(os.path.join(ROOT, "references", "still 3.png")).convert("RGBA")
s3_rgb = Image.new("RGBA", (W, H), (255, 255, 255, 255))
s3_rgb.alpha_composite(s3)
rmse3 = float(np.sqrt(((np.asarray(c3.convert("RGB"), dtype=np.float32) - np.asarray(s3_rgb.convert("RGB"), dtype=np.float32)) ** 2).mean()))
print(f"Scene 3 with Kitchen_bg vs updated still 3 | RMSE: {rmse3:.3f} / 255")
s3_rgb.convert("RGB").resize((1280, 720), Image.LANCZOS).save(os.path.join(OUT, "still3_new.png"))

# 5. Check last frame of title scene 2 + school students vs still 5
t2_last = Image.open(os.path.join(OUT, "v3_title2_last.png")).convert("RGBA")
c5 = t2_last.copy()
for n in ["boy 3", "girl 1", "main boy", "bench", "boy 2", "girl 2"]:
    im = Image.open(os.path.join(ROOT, "school scene", n + ".png")).convert("RGBA")
    c5.alpha_composite(im)
c5.convert("RGB").resize((1280, 720), Image.LANCZOS).save(os.path.join(OUT, "scene5_over_title2_last.png"))
