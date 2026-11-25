import os
from PIL import Image, ImageDraw
base = r"C:\Users\ALIENWARE\.gemini\antigravity\scratch\tiffin-experience\assets\kitchen scene"
dst = r"C:\Users\ALIENWARE\.gemini\antigravity\brain\5870a321-fa75-4e82-a1ae-56953261be32\scratch"
def sheet(names, out, bg=(215,235,215)):
    W, H = 1280, 720
    canvas = Image.new("RGBA", (W, H), bg + (255,))
    for n in names:
        im = Image.open(os.path.join(base, n + ".png")).convert("RGBA").resize((W, H), Image.LANCZOS)
        # tint alpha-edge so layers are distinguishable
        canvas.alpha_composite(im)
    d = ImageDraw.Draw(canvas)
    for x in range(0, 3840, 480):
        px = x * W / 3840
        d.line([(px, 0), (px, H)], fill=(0, 0, 255, 90))
        d.text((px + 2, 2), str(x), fill=(0, 0, 200, 255))
    for y in range(0, 2160, 270):
        py = y * H / 2160
        d.line([(0, py), (W, py)], fill=(0, 0, 255, 90))
        d.text((2, py + 2), str(y), fill=(0, 0, 200, 255))
    canvas.convert("RGB").save(os.path.join(dst, out))
sheet(["shoulder"], "k_shoulder.png")
sheet(["forearm"], "k_forearm.png")
sheet(["wrist"], "k_wrist.png")
sheet(["still mother"], "k_mother.png")
sheet(["stove", "pan"], "k_stovepan.png")
print("ok")
