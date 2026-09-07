"""Generate die-cut (transparent background) product SVGs for SC Singhawat Concrete.

Die-cut = the product only, no backdrop, so it can sit on any section colour.
These are placeholders; real cut-out photography should replace them at the same
paths (see REQUIREMENTS.md).
"""
import os
import pathlib

OUT = os.path.join("assets", "images", "diecut")
PLACE = os.path.join("assets", "images", "placeholder")

# Concrete palette. Light source is upper-left, so: top face lightest,
# left face mid, right face darkest.
TOP = "#dcd9d3"
LEFT = "#bdb9b1"
RIGHT = "#98948c"
EDGE = "#827e76"
REBAR = "#9aa3a8"
REBAR_DK = "#6f7a80"
STEEL = "#b9c0c4"

W, H = 800, 600


def head(extra=""):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
        f'width="{W}" height="{H}" role="img">\n'
        "  <defs>\n"
        '    <radialGradient id="sh" cx="50%" cy="50%" r="50%">\n'
        '      <stop offset="0%" stop-color="#000" stop-opacity=".22"/>\n'
        '      <stop offset="70%" stop-color="#000" stop-opacity=".07"/>\n'
        '      <stop offset="100%" stop-color="#000" stop-opacity="0"/>\n'
        "    </radialGradient>\n"
        '    <linearGradient id="gtop" x1="0" y1="0" x2="1" y2="1">\n'
        f'      <stop offset="0%" stop-color="#e6e3de"/><stop offset="100%" stop-color="{TOP}"/>\n'
        "    </linearGradient>\n"
        '    <linearGradient id="gleft" x1="0" y1="0" x2="0" y2="1">\n'
        f'      <stop offset="0%" stop-color="#c6c2ba"/><stop offset="100%" stop-color="{LEFT}"/>\n'
        "    </linearGradient>\n"
        '    <linearGradient id="gright" x1="0" y1="0" x2="0" y2="1">\n'
        f'      <stop offset="0%" stop-color="#a5a199"/><stop offset="100%" stop-color="{RIGHT}"/>\n'
        "    </linearGradient>\n"
        "    <filter id=\"grain\" x=\"0\" y=\"0\" width=\"100%\" height=\"100%\">\n"
        '      <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" result="n"/>\n'
        '      <feColorMatrix in="n" type="saturate" values="0"/>\n'
        '      <feComponentTransfer><feFuncA type="linear" slope=".16"/></feComponentTransfer>\n'
        '      <feComposite operator="in" in2="SourceGraphic"/>\n'
        "    </filter>\n"
        f"{extra}"
        "  </defs>\n"
    )


def shadow(cx, cy, rx, ry):
    return f'  <ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="url(#sh)"/>\n'


def poly(pts, fill, op=1.0):
    p = " ".join(f"{x:.1f},{y:.1f}" for x, y in pts)
    o = f' opacity="{op}"' if op != 1.0 else ""
    return f'  <polygon points="{p}" fill="{fill}"{o}/>\n'


def box(px, py, a, b, h, grain=True):
    """Isometric rectangular prism. P = top-back corner.
    a = edge vector going right-down, b = edge vector going left-down."""
    ax, ay = a
    bx, by = b
    P = (px, py)
    Pa = (px + ax, py + ay)
    Pb = (px + bx, py + by)
    Pab = (px + ax + bx, py + ay + by)
    Pah = (px + ax, py + ay + h)
    Pbh = (px + bx, py + by + h)
    Pabh = (px + ax + bx, py + ay + by + h)
    g = '' if grain else ""
    s = f"  <g{g}>\n"
    s += poly([P, Pa, Pab, Pb], "url(#gtop)")
    s += poly([Pb, Pab, Pabh, Pbh], "url(#gleft)")
    s += poly([Pa, Pab, Pabh, Pah], "url(#gright)")
    s += "  </g>\n"
    # crisp edges
    s += (
        f'  <path d="M{P[0]:.1f},{P[1]:.1f} L{Pa[0]:.1f},{Pa[1]:.1f} L{Pab[0]:.1f},{Pab[1]:.1f} '
        f'L{Pb[0]:.1f},{Pb[1]:.1f} Z M{Pab[0]:.1f},{Pab[1]:.1f} L{Pabh[0]:.1f},{Pabh[1]:.1f} '
        f'M{Pa[0]:.1f},{Pa[1]:.1f} L{Pah[0]:.1f},{Pah[1]:.1f} L{Pabh[0]:.1f},{Pabh[1]:.1f} '
        f'L{Pbh[0]:.1f},{Pbh[1]:.1f} L{Pb[0]:.1f},{Pb[1]:.1f}" '
        f'fill="none" stroke="{EDGE}" stroke-width="2" stroke-linejoin="round" opacity=".55"/>\n'
    )
    return s


def cylinder(cx, cy, rx, ry, ax, ay, wall=0.46):
    """Hollow pipe with its opening facing the viewer at (cx,cy), the barrel
    receding along (ax,ay). Drawn back-to-front so a stack composites correctly."""
    fx, fy = cx + ax, cy + ay
    s = ""
    # barrel: the two silhouette lines plus the far cap, as one closed path
    s += (
        f'  <path d="M{cx:.1f},{cy - ry:.1f} L{fx:.1f},{fy - ry:.1f} '
        f'A{rx},{ry} 0 0 1 {fx:.1f},{fy + ry:.1f} L{cx:.1f},{cy + ry:.1f} '
        f'A{rx},{ry} 0 0 0 {cx:.1f},{cy - ry:.1f} Z" fill="url(#gright)" '
        f'stroke="{EDGE}" stroke-width="2" stroke-linejoin="round" opacity=".95"/>\n'
    )
    # annular near face
    s += (
        f'  <path d="M{cx:.1f},{cy - ry:.1f} A{rx},{ry} 0 1 1 {cx:.1f},{cy + ry:.1f} '
        f'A{rx},{ry} 0 1 1 {cx:.1f},{cy - ry:.1f} Z '
        f'M{cx:.1f},{cy - ry * wall:.1f} A{rx * wall:.1f},{ry * wall:.1f} 0 1 0 {cx:.1f},{cy + ry * wall:.1f} '
        f'A{rx * wall:.1f},{ry * wall:.1f} 0 1 0 {cx:.1f},{cy - ry * wall:.1f} Z" '
        f'fill="url(#gtop)" fill-rule="evenodd" stroke="{EDGE}" stroke-width="2" opacity=".95"/>\n'
    )
    # bore, darkening into the pipe
    s += (
        f'  <ellipse cx="{cx + ax * .06:.1f}" cy="{cy + ay * .06:.1f}" '
        f'rx="{rx * wall:.1f}" ry="{ry * wall:.1f}" fill="{EDGE}" opacity=".85"/>\n'
    )
    return s


def write(name, body, folder=OUT):
    os.makedirs(folder, exist_ok=True)
    with open(os.path.join(folder, name), "w", encoding="utf-8") as f:
        f.write(head() + body + "</svg>\n")
    print("wrote", os.path.join(folder, name))


# ---------------------------------------------------------------- products

def readymix():
    """Mixer truck, side-on die-cut."""
    s = shadow(400, 505, 300, 34)
    # chassis
    s += f'  <rect x="120" y="392" width="530" height="34" rx="8" fill="{RIGHT}"/>\n'
    # drum
    s += (
        '  <g>\n'
        f'    <path d="M300,180 L520,205 Q580,232 580,300 Q580,368 520,392 L300,392 '
        f'Q244,368 244,286 Q244,204 300,180 Z" fill="url(#gleft)"/>\n'
        "  </g>\n"
    )
    # drum bands
    for i, x in enumerate((300, 360, 420, 480)):
        s += (
            f'  <path d="M{x},188 Q{x + 26},286 {x},386" fill="none" stroke="{EDGE}" '
            f'stroke-width="7" opacity=".35"/>\n'
        )
    s += (
        f'  <path d="M300,180 L520,205 Q580,232 580,300 Q580,368 520,392 L300,392 '
        f'Q244,368 244,286 Q244,204 300,180 Z" fill="none" stroke="{EDGE}" stroke-width="3" opacity=".6"/>\n'
    )
    # chute
    s += f'  <path d="M578,320 L690,368 L672,398 L560,352 Z" fill="{LEFT}" stroke="{EDGE}" stroke-width="2"/>\n'
    # cab
    s += (
        f'  <path d="M120,300 L206,300 L232,352 L232,392 L120,392 Z" fill="{STEEL}" '
        f'stroke="{REBAR_DK}" stroke-width="3" stroke-linejoin="round"/>\n'
        f'  <path d="M136,312 L200,312 L218,350 L136,350 Z" fill="#dfe5e8"/>\n'
    )
    # wheels
    for cx in (176, 452, 528, 604):
        s += (
            f'  <circle cx="{cx}" cy="432" r="46" fill="#3d3f41"/>\n'
            f'  <circle cx="{cx}" cy="432" r="21" fill="{STEEL}"/>\n'
            f'  <circle cx="{cx}" cy="432" r="9" fill="#6f7a80"/>\n'
        )
    return s


def slab():
    """Precast concrete slab, isometric, with exposed strand ends."""
    s = shadow(400, 470, 300, 40)
    s += box(180, 210, (400, 118), (-130, 66), 46)
    # strand ends on the near face
    for i in range(5):
        x = 208 + i * 76
        s += f'  <circle cx="{x}" cy="{300 + i * 22:.0f}" r="0" fill="none"/>\n'
    # ribbed top texture
    for i in range(1, 6):
        t = i / 6
        x0, y0 = 180 + 400 * t, 210 + 118 * t
        s += (
            f'  <line x1="{x0:.1f}" y1="{y0:.1f}" x2="{x0 - 130:.1f}" y2="{y0 + 66:.1f}" '
            f'stroke="{EDGE}" stroke-width="2" opacity=".22"/>\n'
        )
    return s


def pile():
    """Precast concrete pile: long square section with a tapered driving point."""
    s = shadow(400, 500, 320, 34)
    P, a, b, h = (300, 140), (330, 178), (-92, 50), 58
    # Driving point first, so the shaft overlaps its base cleanly.
    # The far end face of the shaft is the quad P, P+b, P+b+h, P+h; the apex sits
    # beyond it along -a, centred on that face.
    px, py = P
    bx, by = b
    apex = (px + bx / 2 - a[0] * 0.34, py + by / 2 + h / 2 - a[1] * 0.34)
    s += poly([apex, P, (px + bx, py + by)], TOP)                       # upper facet
    s += poly([apex, (px + bx, py + by), (px + bx, py + by + h)], LEFT)  # left facet
    s += (
        f'  <path d="M{apex[0]:.1f},{apex[1]:.1f} L{px},{py} '
        f'M{apex[0]:.1f},{apex[1]:.1f} L{px + bx},{py + by} '
        f'M{apex[0]:.1f},{apex[1]:.1f} L{px + bx},{py + by + h}" '
        f'fill="none" stroke="{EDGE}" stroke-width="2" opacity=".5"/>\n'
    )
    s += box(px, py, a, b, h)
    # chamfered corner line along the top face, as cast piles have
    s += (
        f'  <line x1="{px + a[0] * .04:.1f}" y1="{py + a[1] * .04 + 8:.1f}" '
        f'x2="{px + a[0] * .96:.1f}" y2="{py + a[1] * .96 + 8:.1f}" '
        f'stroke="{EDGE}" stroke-width="2" opacity=".18"/>\n'
    )
    # lifting eye on the top face
    s += (
        f'  <path d="M494,272 a24,20 0 1 1 48,26" fill="none" stroke="{REBAR_DK}" '
        f'stroke-width="9" stroke-linecap="round"/>\n'
    )
    return s


def pipe():
    """Reinforced concrete pipes, stacked 3-2-1. The client had not decided
    between stacked and single (frame 14); stacked reads better on a card."""
    s = shadow(400, 508, 290, 34)
    rx, ry = 66, 62
    ax, ay = 150, -74          # barrel recedes up and to the right
    # 3-2-1 pyramid. Drawn top row first so the lower, nearer rows overlap it.
    for row, n in enumerate((1, 2, 3)):
        y = 214 + row * 116
        x0 = 400 - (n - 1) * 69
        for i in range(n):
            s += cylinder(x0 + i * 138, y, rx, ry, ax, ay)
    return s


def manhole():
    """Reinforced concrete manhole box with a circular cover opening."""
    s = shadow(400, 486, 250, 34)
    P, a, b, h = (300, 140), (200, 108), (-186, 98), 186
    s += box(P[0], P[1], a, b, h)
    # Access opening, centred on the top face and lying in its plane.
    cx = P[0] + (a[0] + b[0]) / 2
    cy = P[1] + (a[1] + b[1]) / 2
    ang = -22
    s += (
        f'  <g transform="rotate({ang} {cx:.0f} {cy:.0f})">\n'
        f'    <ellipse cx="{cx:.0f}" cy="{cy:.0f}" rx="96" ry="48" fill="{EDGE}"/>\n'
        f'    <ellipse cx="{cx:.0f}" cy="{cy + 7:.0f}" rx="84" ry="39" fill="#5f5c56"/>\n'
        f'    <ellipse cx="{cx:.0f}" cy="{cy:.0f}" rx="96" ry="48" fill="none" '
        f'stroke="{EDGE}" stroke-width="3" opacity=".8"/>\n'
        f"  </g>\n"
    )
    # step irons descending the far inner wall, seen through the opening
    for i in range(3):
        s += (
            f'  <path d="M{cx - 16:.0f},{cy - 12 + i * 15:.0f} h34" stroke="{REBAR}" '
            f'stroke-width="5" stroke-linecap="round" opacity=".55"/>\n'
        )
    # pipe knockout, centred on the right-hand face
    kx = P[0] + a[0] + b[0] / 2
    ky = P[1] + a[1] + b[1] / 2 + h / 2
    s += (
        f'  <ellipse cx="{kx:.0f}" cy="{ky:.0f}" rx="26" ry="44" '
        f'transform="rotate(-14 {kx:.0f} {ky:.0f})" fill="{EDGE}" opacity=".55"/>\n'
    )
    return s


def beam():
    """Reinforced concrete beam: long rectangular section, rebar showing at one end."""
    s = shadow(400, 486, 320, 32)
    P, a, b, h = (240, 190), (400, 168), (-92, 50), 76
    s += box(P[0], P[1], a, b, h)
    # Exposed rebar at the far-left end face: starts on that face and runs out
    # along -a, so it reads as steel projecting from the cast section.
    ux, uy = -a[0] * 0.17, -a[1] * 0.17
    fx, fy = P[0] + b[0], P[1] + b[1]        # left end, top-front corner
    for dx, dy in ((22, 14), (58, 6), (22, 46), (58, 38)):
        x, y = fx + dx, fy + dy
        s += (
            f'  <path d="M{x:.0f},{y:.0f} l{ux:.0f},{uy:.0f}" stroke="{REBAR}" '
            f'stroke-width="9" stroke-linecap="round"/>\n'
            f'  <path d="M{x:.0f},{y:.0f} l{ux:.0f},{uy:.0f}" stroke="{REBAR_DK}" '
            f'stroke-width="3" stroke-linecap="round" opacity=".45"/>\n'
        )
    # stirrup ties showing as faint bands along the top face
    for t in (0.28, 0.5, 0.72):
        x0, y0 = P[0] + a[0] * t, P[1] + a[1] * t
        s += (
            f'  <line x1="{x0:.1f}" y1="{y0:.1f}" x2="{x0 + b[0]:.1f}" y2="{y0 + b[1]:.1f}" '
            f'stroke="{EDGE}" stroke-width="2" opacity=".16"/>\n'
        )
    return s


write("ready-mixed-concrete.svg", readymix())
write("precast-slab.svg", slab())
write("precast-pile.svg", pile())
write("concrete-pipe.svg", pipe())
write("manhole.svg", manhole())
write("concrete-beam.svg", beam())


# ------------------------------------------------------------ placeholders
# Not die-cut: these stand in for photographs until the client supplies them.

SCENES = {
    "hero-plant": ("#7d8a93", "#5f6b73", "batch plant"),
    "hero-truck": ("#8a8378", "#6b655c", "mixer fleet"),
    "hero-pour": ("#8f8b80", "#6e6a61", "concrete pour"),
    "about-yard": ("#87908f", "#666e6d", "production yard"),
    "about-team": ("#8d8479", "#6a635a", "our team"),
    "history-1": ("#8a8a92", "#67676e", "founding years"),
    "history-2": ("#7f8a86", "#5f6864", "today"),
    "policy-team": ("#88807a", "#655f5a", "quality control"),
    "builders-team": ("#7e8891", "#5e666d", "Singhawat Builders"),
    "project-house": ("#93897c", "#6e675c", "housing"),
    "project-office": ("#7c848e", "#5c626a", "office building"),
    "project-road": ("#8b8b83", "#666660", "concrete road"),
    "work-1": ("#89918c", "#666c68", "project 01"),
    "work-2": ("#918a80", "#6c665e", "project 02"),
    "work-3": ("#828b94", "#61686f", "project 03"),
    "work-4": ("#8e8781", "#6a6560", "project 04"),
    "work-5": ("#848e8a", "#626a67", "project 05"),
    "work-6": ("#8f8a92", "#6a666d", "project 06"),
}

PW, PH = 1200, 800


def placeholder(top, bottom, label):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {PW} {PH}" '
        f'width="{PW}" height="{PH}" role="img">\n'
        "  <defs>\n"
        f'    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">\n'
        f'      <stop offset="0%" stop-color="{top}"/><stop offset="100%" stop-color="{bottom}"/>\n'
        "    </linearGradient>\n"
        '    <filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="4"/>'
        '<feColorMatrix type="saturate" values="0"/>'
        '<feComponentTransfer><feFuncA type="linear" slope=".1"/></feComponentTransfer></filter>\n'
        "  </defs>\n"
        f'  <rect width="{PW}" height="{PH}" fill="url(#g)"/>\n'
        f'  <rect width="{PW}" height="{PH}" filter="url(#n)" opacity=".55"/>\n'
        # horizon + simple massing so it reads as a site photo, not a colour swatch
        f'  <path d="M0,560 H{PW} V{PH} H0 Z" fill="#000" opacity=".12"/>\n'
        '  <path d="M120,560 V400 h150 v160 Z M300,560 V330 h210 v230 Z M540,560 V440 h120 v120 Z'
        '  M700,560 V360 h180 v200 Z M910,560 V470 h150 v90 Z" fill="#000" opacity=".14"/>\n'
        f'  <text x="{PW / 2}" y="{PH - 54}" text-anchor="middle" font-family="system-ui, sans-serif" '
        f'font-size="30" fill="#fff" opacity=".72" letter-spacing="3">{label.upper()}</text>\n'
        f'  <text x="{PW / 2}" y="{PH - 20}" text-anchor="middle" font-family="system-ui, sans-serif" '
        f'font-size="18" fill="#fff" opacity=".45" letter-spacing="2">PLACEHOLDER — REPLACE WITH PHOTO</text>\n'
        "</svg>\n"
    )


os.makedirs(PLACE, exist_ok=True)
for name, (a, b, label) in SCENES.items():
    with open(os.path.join(PLACE, f"{name}.svg"), "w", encoding="utf-8") as f:
        f.write(placeholder(a, b, label))
    print("wrote", os.path.join(PLACE, f"{name}.svg"))


# --------------------------------------------------- favicon & social card
# Rasterised with Playwright (already a project dependency for
# tools/browser-check.py) since there's no other SVG->PNG path here.

def _render_svg_to_png(svg_text, out_path, width, height):
    from playwright.sync_api import sync_playwright

    html = (
        "<!doctype html><meta charset=utf-8>"
        f"<style>html,body{{margin:0;padding:0;background:transparent}}"
        f"svg{{display:block;width:{width}px;height:{height}px}}</style>{svg_text}"
    )
    tmp = pathlib.Path("_render.html")
    tmp.write_text(html, encoding="utf-8")
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page(viewport={"width": width, "height": height})
            page.goto("file:///" + str(tmp.resolve()).replace("\\", "/"))
            page.wait_for_timeout(150)
            page.locator("svg").screenshot(path=str(out_path))
            browser.close()
    finally:
        tmp.unlink(missing_ok=True)


_FAVICON_SVG = (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
    '<rect width="64" height="64" rx="14" fill="#1c1d1f"/>'
    '<text x="32" y="41" font-family="Barlow Condensed, Arial, sans-serif" '
    'font-weight="700" font-size="30" fill="#e2611c" text-anchor="middle">SC</text>'
    "</svg>"
)

pathlib.Path("assets").mkdir(exist_ok=True)
pathlib.Path("assets/favicon.svg").write_text(_FAVICON_SVG, encoding="utf-8")
print("wrote assets/favicon.svg")

for _size, _name in [(32, "favicon-32.png"), (180, "apple-touch-icon.png"), (512, "icon-512.png")]:
    _render_svg_to_png(_FAVICON_SVG, pathlib.Path("assets") / _name, _size, _size)
    print("wrote", f"assets/{_name}")

_CARD_SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#232426"/><stop offset="100%" stop-color="#1c1d1f"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="630" fill="none" stroke="#e2611c" stroke-width="14"/>
  <rect x="90" y="90" width="150" height="150" rx="28" fill="#1c1d1f" stroke="#e2611c" stroke-width="4"/>
  <text x="165" y="196" font-family="Barlow Condensed, Arial, sans-serif" font-weight="700"
        font-size="76" fill="#e2611c" text-anchor="middle">SC</text>
  <text x="90" y="330" font-family="Barlow Condensed, Arial, sans-serif" font-weight="700"
        font-size="66" fill="#f6f4f1">Singhawat Concrete</text>
  <text x="90" y="392" font-family="Arial, sans-serif" font-size="30" fill="#c9c6c1">
    Ready-mixed concrete &amp; precast components
  </text>
  <text x="90" y="432" font-family="Arial, sans-serif" font-size="30" fill="#c9c6c1">
    Full construction services, one plant to your pour
  </text>
  <g font-family="Barlow Condensed, Arial, sans-serif" font-weight="600" font-size="26" fill="#e2611c">
    <text x="90" y="540">READY-MIXED</text>
    <text x="330" y="540">PRECAST SLAB</text>
    <text x="560" y="540">PILE</text>
    <text x="690" y="540">PIPE</text>
    <text x="810" y="540">MANHOLE</text>
    <text x="1000" y="540">BEAM</text>
  </g>
</svg>"""
_render_svg_to_png(_CARD_SVG, pathlib.Path("assets") / "images" / "social-card.png", 1200, 630)
print("wrote assets/images/social-card.png")
