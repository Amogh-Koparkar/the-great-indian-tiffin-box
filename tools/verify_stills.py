import os
import numpy as np
from PIL import Image

ROOT = r"C:\Users\ALIENWARE\.gemini\antigravity\scratch\tiffin-experience\assets"
OUT = r"C:\Users\ALIENWARE\.gemini\antigravity\brain\5870a321-fa75-4e82-a1ae-56953261be32\scratch"

def comp_and_diff(folder, order, still_name, out_prefix):
    W, H = 1920, 1080
    canvas = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    for name in order:
        im = Image.open(os.path.join(ROOT, folder, name + ".png")).convert("RGBA")
        canvas.alpha_composite(im)
    still = Image.open(os.path.join(ROOT, "references", still_name + ".png")).convert("RGBA")
    still_rgb = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    still_rgb.alpha_composite(still)

    a = np.asarray(canvas.convert("RGB"), dtype=np.float32)
    b = np.asarray(still_rgb.convert("RGB"), dtype=np.float32)
    rmse = float(np.sqrt(((a - b) ** 2).mean()))
    max_diff = float(np.abs(a - b).max())
    print(f"{still_name} | RMSE: {rmse:.3f} / 255 | Max diff: {max_diff:.1f}")
    canvas.convert("RGB").resize((1280, 720), Image.LANCZOS).save(os.path.join(OUT, f"{out_prefix}_comp.png"))

comp_and_diff("options scene", ["excited boy", "mother", "options hand"], "still 2", "s2")
comp_and_diff("kitchen scene", ["stove", "pan", "rice", "masala", "onion", "lemon juice", "cashew and nuts", "oil", "forearm", "shoulder", "wrist", "still mother"], "still 3", "s3")
comp_and_diff("title scene", ["tiffin", "boy hand", "mother hand"], "still 4", "s4")
comp_and_diff("school scene", ["boy 3", "girl 1", "main boy", "bench", "boy 2", "girl 2"], "still 5", "s5")
