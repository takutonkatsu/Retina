from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "appstore-screenshots"
OUT.mkdir(parents=True, exist_ok=True)
for stale in list(OUT.glob("iphone_*.png")) + list(OUT.glob("ipad_*.png")):
    stale.unlink()

SOURCES = {
    "play": Path("/Users/takuto/Downloads/IMG_9144.jpg"),
    "origin_result": Path("/Users/takuto/Downloads/IMG_9145.jpg"),
    "daily": Path("/Users/takuto/Downloads/IMG_9154.PNG"),
    "versus_win": Path("/Users/takuto/Downloads/IMG_9150.PNG"),
    "share": Path("/Users/takuto/Downloads/retina_versus.PNG"),
}

ICON = ROOT / "Retina_icon.png"

BG = (8, 10, 18)
PANEL = (17, 20, 31)
WHITE = (248, 248, 252)
MUTED = (156, 165, 188)
CYAN = (29, 166, 226)
GREEN = (42, 215, 143)
PURPLE = (145, 125, 255)
PINK = (255, 72, 103)
YELLOW = (255, 215, 0)


def font(size, weight="regular"):
    candidates = {
        "bold": [
            "/System/Library/Fonts/ヒラギノ角ゴシック W7.ttc",
            "/System/Library/Fonts/Hiragino Sans GB.ttc",
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        ],
        "regular": [
            "/System/Library/Fonts/ヒラギノ角ゴシック W4.ttc",
            "/System/Library/Fonts/Hiragino Sans GB.ttc",
            "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        ],
    }[weight]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default(size)


def text_size(draw, text, fnt):
    box = draw.textbbox((0, 0), text, font=fnt)
    return box[2] - box[0], box[3] - box[1]


def draw_centered(draw, xy, text, fnt, fill, anchor="mm"):
    draw.text(xy, text, font=fnt, fill=fill, anchor=anchor)


def add_gradient_background(img, accent):
    w, h = img.size
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)

    for i in range(8):
        alpha = max(0, 34 - i * 4)
        radius = int(min(w, h) * (0.48 + i * 0.07))
        od.ellipse(
            (int(w * 0.20) - radius // 2, int(h * 0.42) - radius // 2,
             int(w * 0.20) + radius // 2, int(h * 0.42) + radius // 2),
            fill=accent + (alpha,),
        )

    overlay = overlay.filter(ImageFilter.GaussianBlur(int(w * 0.08)))
    img.alpha_composite(overlay)

    d = ImageDraw.Draw(img)
    for y in range(h):
        a = y / h
        line = (
            int(BG[0] * (1 - a) + 13 * a),
            int(BG[1] * (1 - a) + 15 * a),
            int(BG[2] * (1 - a) + 27 * a),
            255,
        )
        d.line((0, y, w, y), fill=line)


def cover(im, size, crop=None):
    if crop:
        im = im.crop(crop)
    return ImageOps.fit(im.convert("RGB"), size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.42))


def contain_panel(im, size, crop=None, valign=0.0):
    if crop:
        im = im.crop(crop)
    im = im.convert("RGB")
    contained = ImageOps.contain(im, size, Image.Resampling.LANCZOS)
    panel = Image.new("RGB", size, (8, 9, 14))
    x = (size[0] - contained.width) // 2
    y = int((size[1] - contained.height) * valign)
    panel.paste(contained, (x, y))
    return panel


def resize_to_width(im, width, crop=None, max_height=None):
    if crop:
        im = im.crop(crop)
    im = im.convert("RGB")
    height = round(width * im.height / im.width)
    resized = im.resize((width, height), Image.Resampling.LANCZOS)
    if max_height and resized.height > max_height:
        resized = ImageOps.contain(resized, (width, max_height), Image.Resampling.LANCZOS)
    return resized


def rounded_image(im, radius):
    mask = Image.new("L", im.size, 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle((0, 0, im.size[0], im.size[1]), radius=radius, fill=255)
    out = im.convert("RGBA")
    out.putalpha(mask)
    return out


def shadow_for(size, radius, blur, opacity=120):
    shadow = Image.new("RGBA", (size[0] + blur * 4, size[1] + blur * 4), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle(
        (blur * 2, blur * 2, blur * 2 + size[0], blur * 2 + size[1]),
        radius=radius,
        fill=(0, 0, 0, opacity),
    )
    return shadow.filter(ImageFilter.GaussianBlur(blur))


def paste_with_shadow(base, im, xy, radius, blur=36):
    x, y = xy
    sh = shadow_for(im.size, radius, blur)
    base.alpha_composite(sh, (x - blur * 2, y - blur * 2))
    base.alpha_composite(rounded_image(im, radius), (x, y))


def draw_frame(base, box, radius, accent):
    d = ImageDraw.Draw(base)
    x0, y0, x1, y1 = box
    d.rounded_rectangle(box, radius=radius, outline=(255, 255, 255, 38), width=3)
    d.rounded_rectangle((x0 + 5, y0 + 5, x1 - 5, y1 - 5), radius=radius - 4, outline=accent + (92,), width=3)


def add_brand(draw, canvas, scale=1.0):
    w, _ = canvas.size
    icon_size = int(54 * scale)
    margin = int(84 * scale)
    y = int(88 * scale)
    icon = Image.open(ICON).convert("RGBA").resize((icon_size, icon_size), Image.Resampling.LANCZOS)
    canvas.alpha_composite(icon, (margin, y))
    draw.text((margin + icon_size + int(16 * scale), y + int(1 * scale)), "Retina",
              font=font(int(40 * scale), "bold"), fill=WHITE)
    draw.text((w - margin, y + int(15 * scale)), "Color Game",
              font=font(int(22 * scale), "bold"), fill=(255, 255, 255, 150), anchor="ra")


def pill(draw, xy, text, fill, scale):
    x, y = xy
    f = font(int(23 * scale), "bold")
    tw, th = text_size(draw, text, f)
    pad_x = int(20 * scale)
    pad_y = int(10 * scale)
    box = (x, y, x + tw + pad_x * 2, y + th + pad_y * 2)
    draw.rounded_rectangle(box, radius=int(22 * scale), fill=fill)
    draw.text((x + pad_x, y + pad_y - int(2 * scale)), text, font=f, fill=WHITE)


def draw_copy(draw, width, y, title, subtitle, accent, scale):
    title_font = font(int(92 * scale), "bold")
    sub_font = font(int(30 * scale), "bold")
    draw_centered(draw, (width / 2, y), title, title_font, WHITE)
    sw, _ = text_size(draw, subtitle, sub_font)
    if sw > width * 0.84:
        sub_font = font(int(28 * scale))
    draw_centered(draw, (width / 2, y + int(92 * scale)), subtitle, sub_font, accent + (255,))
    draw.rounded_rectangle(
        (width / 2 - int(34 * scale), y + int(146 * scale), width / 2 + int(34 * scale), y + int(154 * scale)),
        radius=int(6 * scale),
        fill=(255, 255, 255, 180),
    )


def make_phone(idx, spec):
    W, H = 1242, 2688
    accent = spec["accent"]
    canvas = Image.new("RGBA", (W, H), BG + (255,))
    add_gradient_background(canvas, accent)
    d = ImageDraw.Draw(canvas)
    add_brand(d, canvas, 1.0)
    draw_copy(d, W, 302, spec["title"], spec["subtitle"], accent, 1.0)
    pill(d, (84, 472), spec["label"], accent + (235,), 1.0)

    if spec["source"] == "share":
        src = Image.open(SOURCES["share"])
        card = cover(src, (1020, 986))
        paste_with_shadow(canvas, card, (111, 910), 44, 42)
        draw_frame(canvas, (111, 910, 1131, 1896), 44, accent)
        d.text((W / 2, 2192), "99.94%", font=font(88, "bold"), fill=YELLOW, anchor="mm")
        d.text((W / 2, 2276), "SHARE YOUR COLOR SENSE", font=font(30, "bold"), fill=MUTED, anchor="mm")
    else:
        src = Image.open(SOURCES[spec["source"]])
        crop = spec.get("crop")
        phone = resize_to_width(src, spec.get("phone_width", 910), crop, 1930)
        px = (W - phone.width) // 2
        py = spec.get("phone_y", 650) + (1930 - phone.height) // 2
        paste_with_shadow(canvas, phone, (px, py), 64, 48)
        draw_frame(canvas, (px, py, px + phone.width, py + phone.height), 64, accent)

    out = OUT / f"iphone_{idx:02d}_{spec['slug']}_1242x2688.png"
    canvas.convert("RGB").save(out, quality=95)
    return out


def make_ipad(idx, spec):
    W, H = 2064, 2752
    accent = spec["accent"]
    canvas = Image.new("RGBA", (W, H), BG + (255,))
    add_gradient_background(canvas, accent)
    d = ImageDraw.Draw(canvas)
    add_brand(d, canvas, 1.34)
    draw_copy(d, W, 385, spec["title"], spec["subtitle"], accent, 1.34)
    pill(d, (148, 620), spec["label"], accent + (235,), 1.34)

    if spec["source"] == "share":
        src = Image.open(SOURCES["share"])
        card = cover(src, (1530, 1480))
        paste_with_shadow(canvas, card, (267, 820), 58, 56)
        draw_frame(canvas, (267, 820, 1797, 2300), 58, accent)
    else:
        src = Image.open(SOURCES[spec["source"]])
        crop = spec.get("crop")
        phone = resize_to_width(src, spec.get("ipad_phone_width", 965), crop, 1990)
        x = spec.get("ipad_x", 250 if idx % 2 else 884)
        y_phone = spec.get("ipad_phone_y", 700) + (1990 - phone.height) // 2
        paste_with_shadow(canvas, phone, (x, y_phone), 66, 54)
        draw_frame(canvas, (x, y_phone, x + phone.width, y_phone + phone.height), 66, accent)

        side_x = 1240 if idx % 2 else 250
        stat_font = font(66, "bold")
        d.text((side_x, 1260), spec["side_title"], font=stat_font, fill=WHITE)
        d.text((side_x, 1356), spec["side_note"], font=font(35, "bold"), fill=accent + (255,))
        d.rounded_rectangle((side_x, 1442, side_x + 360, 1457), radius=8, fill=(255, 255, 255, 170))

    out = OUT / f"ipad_{idx:02d}_{spec['slug']}_2064x2752.png"
    canvas.convert("RGB").save(out, quality=95)
    return out


def main():
    specs = [
        {
            "slug": "origin_play",
            "source": "play",
            "title": "色を見抜け",
            "subtitle": "RGBで直感プレイ",
            "label": "ORIGIN",
            "accent": PINK,
            "side_title": "直感で合わせる",
            "side_note": "3本のスライダーだけ",
            "phone_width": 900,
            "ipad_phone_width": 930,
        },
        {
            "slug": "precision_score",
            "source": "origin_result",
            "title": "100%を目指そう",
            "subtitle": "色感覚をスコア化",
            "label": "SCORE",
            "accent": GREEN,
            "side_title": "99.23%",
            "side_note": "ベストを更新",
            "phone_width": 900,
            "ipad_phone_width": 930,
        },
        {
            "slug": "daily_color",
            "source": "daily",
            "title": "今日の一色",
            "subtitle": "毎日変わるチャレンジ",
            "label": "DAILY",
            "accent": (255, 166, 64),
            "crop": (0, 120, 1179, 2260),
            "side_title": "1日1回",
            "side_note": "Daily Color",
            "phone_width": 920,
            "ipad_phone_width": 945,
        },
        {
            "slug": "versus_battle",
            "source": "versus_win",
            "title": "友達と勝負",
            "subtitle": "近い色を作った方が勝ち",
            "label": "VERSUS",
            "accent": PURPLE,
            "crop": (0, 120, 1179, 2190),
            "side_title": "VS",
            "side_note": "リアルタイム対戦",
            "phone_width": 920,
            "ipad_phone_width": 945,
        },
        {
            "slug": "share_results",
            "source": "share",
            "title": "結果をシェア",
            "subtitle": "スコアを1枚に",
            "label": "SHARE",
            "accent": CYAN,
            "side_title": "Share",
            "side_note": "1タップで共有",
        },
    ]
    paths = []
    for i, spec in enumerate(specs, 1):
        paths.append(make_phone(i, spec))
    for i, spec in enumerate(specs, 1):
        paths.append(make_ipad(i, spec))

    sheet_w, thumb_h = 1000, 720
    rows = (len(paths) + 1) // 2
    sheet = Image.new("RGB", (sheet_w * 2, thumb_h * rows), (16, 18, 26))
    for i, path in enumerate(paths):
        im = Image.open(path)
        thumb = ImageOps.contain(im, (sheet_w - 24, thumb_h - 24), Image.Resampling.LANCZOS)
        x = (i % 2) * sheet_w + (sheet_w - thumb.width) // 2
        y = (i // 2) * thumb_h + (thumb_h - thumb.height) // 2
        sheet.paste(thumb, (x, y))
    sheet_path = OUT / "preview_contact_sheet.png"
    sheet.save(sheet_path, quality=92)

    for path in paths:
        print(path)
    print(sheet_path)


if __name__ == "__main__":
    main()
