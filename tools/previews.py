import os, sys
from PIL import Image
src = r"C:\Users\ALIENWARE\.gemini\antigravity\scratch\tiffin-experience\assets\references"
dst = r"C:\Users\ALIENWARE\.gemini\antigravity\brain\5870a321-fa75-4e82-a1ae-56953261be32\scratch"
os.makedirs(dst, exist_ok=True)
for n in ["still 2", "still 3", "still 4", "still 5"]:
    im = Image.open(os.path.join(src, n + ".png")).convert("RGB").resize((1280, 720), Image.LANCZOS)
    im.save(os.path.join(dst, n.replace(" ", "") + "_prev.png"))
print("ok")
