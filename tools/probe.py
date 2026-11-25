import subprocess, re, sys
from PIL import Image
base = r"C:\Users\ALIENWARE\.gemini\antigravity\scratch\tiffin-experience"
subprocess.run(["ffmpeg","-v","error","-y","-ss","9","-i",base+r"\assets\references\first animation 2.mp4","-frames:v","1",base+r"\tools\_f.png"],check=True)
im = Image.open(base+r"\tools\_f.png").convert("RGB")
print("video corners", im.getpixel((4,4)), im.getpixel((1900,4)), im.getpixel((1000,1075)))
st = Image.open(base+r"\assets\references\still 5.png").convert("RGBA")
print("still5 corner", st.getpixel((4,4)))
d = open(base+r"\Lemon_Rice.pdf","rb").read()
print("pdf pages ~", len(re.findall(rb"/Type\s*/Page[^s]", d)), re.findall(rb"/MediaBox\s*\[[^\]]*\]", d)[:2])
