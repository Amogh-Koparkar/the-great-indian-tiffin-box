import os
from PIL import Image, ImageDraw
base = r"C:\Users\ALIENWARE\.gemini\antigravity\scratch\tiffin-experience\assets\kitchen scene"
dst = r"C:\Users\ALIENWARE\.gemini\antigravity\brain\5870a321-fa75-4e82-a1ae-56953261be32\scratch"
S = (2900, 900); E = (2040, 1830); W = (870, 1200)
order = ["stove", "pan", "masala", "onion", "lemon juice", "cashew and nuts", "oil", "rice", "forearm", "shoulder", "wrist", "still mother"]
Wd, Hd = 1920, 1080
canvas = Image.new("RGBA", (Wd, Hd), (255, 255, 255, 255))
for n in order:
    im = Image.open(os.path.join(base, n + ".png")).convert("RGBA").resize((Wd, Hd), Image.LANCZOS)
    canvas.alpha_composite(im)
d = ImageDraw.Draw(canvas)
for name, p, c in (("S", S, (0, 0, 255)), ("E", E, (0, 160, 0)), ("W", W, (255, 0, 255))):
    x, y = p[0] / 2, p[1] / 2
    d.ellipse([x - 8, y - 8, x + 8, y + 8], outline=c + (255,), width=3)
    d.text((x + 10, y - 10), name, fill=c + (255,))
d.line([(S[0] / 2, S[1] / 2), (E[0] / 2, E[1] / 2), (W[0] / 2, W[1] / 2)], fill=(0, 0, 0, 255), width=2)
canvas.convert("RGB").save(os.path.join(dst, "k_pivots.png"))
print("ok")
