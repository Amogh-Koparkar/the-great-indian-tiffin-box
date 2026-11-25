"""Find the layer stacking order that best reproduces each reference still (lowest RMSE)."""
import os, itertools
import numpy as np
from PIL import Image

ROOT = r"C:\Users\ALIENWARE\.gemini\antigravity\scratch\tiffin-experience\assets"
W, H = 480, 270

def load(folder, name):
    im = Image.open(os.path.join(ROOT, folder, name + ".png")).convert("RGBA").resize((W, H), Image.BOX)
    return np.asarray(im, dtype=np.float32) / 255.0

def still(n):
    im = Image.open(os.path.join(ROOT, "references", n + ".png")).convert("RGBA").resize((W, H), Image.BOX)
    a = np.asarray(im, dtype=np.float32) / 255.0
    # composite still over white to compare
    return a[..., :3] * a[..., 3:4] + (1 - a[..., 3:4])

def comp(layers):
    out = np.ones((H, W, 3), dtype=np.float32)
    for l in layers:
        a = l[..., 3:4]
        out = l[..., :3] * a + out * (1 - a)
    return out

def search(folder, names, ref):
    ls = {n: load(folder, n) for n in names}
    r = still(ref)
    best = []
    for p in itertools.permutations(names):
        c = comp([ls[n] for n in p])
        best.append((float(np.sqrt(((c - r) ** 2).mean())), p))
    best.sort()
    print(folder, ref)
    for s, p in best[:3]:
        print("  %.4f" % s, " < ".join(p))

search("options scene", ["excited boy", "mother", "options hand"], "still 2")
search("title scene", ["boy hand", "mother hand", "tiffin"], "still 4")
search("school scene", ["bench", "boy 2", "boy 3", "girl 1", "girl 2", "main boy"], "still 5")
# kitchen: fixed bottom layers, search over the arm related ones
search("kitchen scene", ["stove", "pan", "forearm", "shoulder", "wrist", "still mother"], "still 3")
