"""
Génère les images (1920x1080) de la présentation « Le trajet d'un clic ».

    python3 build.py            -> html/*.html puis png/*.png

Les extraits de code sont lus directement dans le repo (vrais numéros de ligne).
Si le code bouge, relancer le script. Si les numéros de ligne changent, ajuster
les plages dans SLIDES.
"""
import html
import pathlib
import subprocess

from pygments import highlight
from pygments.formatters import HtmlFormatter
from pygments.lexers import TypeScriptLexer, get_lexer_by_name

HERE = pathlib.Path(__file__).resolve().parent
REPO = HERE.parent.parent
OUT_HTML = HERE / "html"
OUT_PNG = HERE / "png"

W, H = 1920, 1080

# ---------------------------------------------------------------- palette ---
INK = "#25313E"
MUTED = "#6B7280"
PAPER = "#F4EFE6"
CARD = "#FFFDF8"
LINE = "#DDD5C6"

LAYERS = {
    "FRONT": "#407FC1",
    "SOCKET": "#2E8C8C",
    "GATEWAY": "#7B5C8F",
    "SERVICE": "#C98A2E",
    "ENGINE": "#5F7F4A",
}
LAYER_ORDER = ["FRONT", "SOCKET", "GATEWAY", "SERVICE", "ENGINE"]
TEAM = ["#C0563E", "#C98A2E", "#5F7F4A", "#7B5C8F"]

FORMATTER = HtmlFormatter(nowrap=True, style="one-dark")

CSS = f"""
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=block');
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
html, body {{ width: {W}px; height: {H}px; overflow: hidden; }}
body {{ background: {PAPER}; color: {INK}; font-family: Inter, sans-serif; position: relative; }}
.abs {{ position: absolute; }}
.chip {{ display: inline-block; padding: 6px 16px; border-radius: 999px; color: #fff;
        font-weight: 700; font-size: 20px; letter-spacing: .08em; }}
.step {{ font-weight: 700; font-size: 20px; letter-spacing: .08em; color: {MUTED}; margin-left: 14px; }}
h1 {{ font-size: 54px; font-weight: 800; letter-spacing: -.02em; line-height: 1.1; }}
.sub {{ font-size: 26px; color: {MUTED}; margin-top: 10px; line-height: 1.35; }}
code, .mono, .row, .json, .inl, .tab {{ font-variant-ligatures: none; }}
code, .mono {{ font-family: 'JetBrains Mono', monospace; }}
.inl {{ font-family: 'JetBrains Mono', monospace; background: rgba(37,49,62,.08);
        padding: 1px 7px; border-radius: 6px; font-size: .9em; }}

/* code panel */
.panel {{ background: #282C34; border-radius: 16px; overflow: hidden;
          box-shadow: 0 12px 32px rgba(37,49,62,.18); display: flex; flex-direction: column; }}
.tab {{ display: flex; align-items: center; gap: 12px; padding: 0 20px; height: 46px;
        background: #21252B; color: #ABB2BF; font-family: 'JetBrains Mono', monospace; font-size: 17px; }}
.tab .dot {{ width: 12px; height: 12px; border-radius: 50%; }}
.tab .fn {{ color: #E6E6E6; font-weight: 700; }}
.codebody {{ padding: 14px 0; flex: 1; }}
.row {{ display: flex; align-items: center; position: relative; white-space: pre; color: #ABB2BF;
        font-family: 'JetBrains Mono', monospace; line-height: 1.55; border-left: 5px solid transparent; }}
.row .ln {{ width: 3.6em; text-align: right; padding-right: 1.1em; color: #5C6370; flex: none; }}
.row.hl {{ background: rgba(255,255,255,.075); }}
.row.dim .src {{ opacity: .45; }}
.row .mk {{ position: absolute; right: 14px; width: 1.45em; height: 1.45em; border-radius: 50%;
            color: #fff; font-family: Inter, sans-serif; font-weight: 800; font-size: .85em;
            display: flex; align-items: center; justify-content: center; }}
.gap {{ color: #5C6370; font-family: 'JetBrains Mono', monospace; padding-left: 1.3em; line-height: 1.4; }}
{FORMATTER.get_style_defs('.src')}
.src {{ background: transparent !important; }}

/* notes */
.notes {{ background: {CARD}; border: 2px solid {LINE}; border-radius: 16px; padding: 30px 32px;
          display: flex; flex-direction: column; gap: 22px; }}
.note {{ display: flex; gap: 16px; font-size: 24px; line-height: 1.4; }}
.note .n {{ flex: none; width: 36px; height: 36px; border-radius: 50%; color: #fff; font-weight: 800;
            display: flex; align-items: center; justify-content: center; font-size: 19px; margin-top: 1px; }}
.note b {{ font-weight: 700; }}
.notes h3 {{ font-size: 18px; letter-spacing: .1em; color: {MUTED}; font-weight: 700; }}
.callout {{ border-radius: 14px; padding: 18px 24px; font-size: 23px; line-height: 1.4; }}
.json {{ font-family: 'JetBrains Mono', monospace; white-space: pre; font-size: 21px; line-height: 1.5;
         background: #282C34; color: #ABB2BF; border-radius: 14px; padding: 18px 22px; }}
.json .k {{ color: #E06C75; }} .json .s {{ color: #98C379; }} .json .v {{ color: #D19A66; }}
.json .c {{ color: #5C6370; font-style: italic; }}
"""


# ------------------------------------------------------------ primitives ---
def read_lines(rel):
    return (REPO / rel).read_text().expandtabs(4).split("\n")


def lexer_for(rel):
    if rel.endswith(".tsx"):
        try:
            return get_lexer_by_name("tsx")
        except Exception:
            pass
    return TypeScriptLexer()


def code_panel(rel, ranges, x, y, w, h, layer, hl=(), marks=None, dim=(), maxfs=24):
    """Panneau de code : `ranges` = [(debut, fin)] en numéros de ligne réels."""
    marks = marks or {}
    all_lines = read_lines(rel)
    color = LAYERS[layer]

    # coloration syntaxique ligne par ligne sur tout le fichier (contexte correct)
    colored = highlight("\n".join(all_lines), lexer_for(rel), FORMATTER).split("\n")

    # indentation commune retirée pour gagner de la place
    shown = [n for a, b in ranges for n in range(a, b + 1)]
    indents = [len(all_lines[n - 1]) - len(all_lines[n - 1].lstrip()) for n in shown if all_lines[n - 1].strip()]
    cut = min(indents) if indents else 0

    n_rows = len(shown) + (len(ranges) - 1)
    max_chars = max(len(all_lines[n - 1]) - cut for n in shown) + 4
    usable_w = w - 60
    usable_h = h - 46 - 28
    fs = min(maxfs, usable_w / ((max_chars + 4.6) * 0.6), usable_h / (n_rows * 1.55))
    fs = round(fs, 1)

    rows = []
    for i, (a, b) in enumerate(ranges):
        if i:
            rows.append('<div class="gap">⋯</div>')
        for n in range(a, b + 1):
            src = colored[n - 1]
            src = strip_leading(src, cut)
            cls = "row"
            if n in hl:
                cls += " hl"
            if n in dim:
                cls += " dim"
            style = f"border-left-color:{color}" if n in hl else ""
            mk = ""
            if n in marks:
                mk = f'<span class="mk" style="background:{color}">{marks[n]}</span>'
            rows.append(f'<div class="{cls}" style="{style}"><span class="ln">{n}</span><span class="src">{src or " "}</span>{mk}</div>')

    folder, _, name = rel.rpartition("/")
    return f"""
<div class="abs panel" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px">
  <div class="tab"><span class="dot" style="background:{color}"></span>{folder}/<span class="fn">{name}</span></div>
  <div class="codebody" style="font-size:{fs}px">{''.join(rows)}</div>
</div>"""


def strip_leading(colored_line, n):
    """Retire n espaces au début d'une ligne déjà colorée (HTML)."""
    out, i, removed = [], 0, 0
    while i < len(colored_line) and removed < n:
        ch = colored_line[i]
        if ch == "<":
            j = colored_line.index(">", i)
            out.append(colored_line[i:j + 1])
            i = j + 1
        elif ch == " ":
            removed += 1
            i += 1
        else:
            break
    return "".join(out) + colored_line[i:]


def notes(x, y, w, h, items, layer, title=None, fs=None):
    color = LAYERS[layer]
    style = f"font-size:{fs}px" if fs else ""
    head = f"<h3>{title}</h3>" if title else ""
    body = "".join(
        f'<div class="note" style="{style}"><span class="n" style="background:{color}">{n}</span><div>{t}</div></div>'
        for n, t in items
    )
    hh = f"height:{h}px;" if h else ""
    return f'<div class="abs notes" style="left:{x}px;top:{y}px;width:{w}px;{hh}">{head}{body}</div>'


def box(x, y, w, h, inner, style=""):
    return f'<div class="abs" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px;{style}">{inner}</div>'


def callout(x, y, w, inner, layer, h=None):
    c = LAYERS[layer]
    hh = f"height:{h}px;" if h else ""
    return box(x, y, w, h or 0, f'<div class="callout" style="background:{c}14;border:2px solid {c}55;{hh}">{inner}</div>',
               "height:auto")


def json_box(x, y, w, text, h=None, fs=21):
    hh = f"height:{h}px;" if h else ""
    return f'<div class="abs json" style="left:{x}px;top:{y}px;width:{w}px;{hh}font-size:{fs}px">{text}</div>'


def k(s):
    return f'<span class="k">{s}</span>'


def s(t):
    return f'<span class="s">{t}</span>'


def v(t):
    return f'<span class="v">{t}</span>'


def c(t):
    return f'<span class="c">{t}</span>'


# ------------------------------------------------------------------ svg ----
def svg(inner, x=0, y=0, w=W, h=H):
    markers = "".join(
        f'<marker id="a-{name}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">'
        f'<path d="M0,0 L10,5 L0,10 z" fill="{col}"/></marker>'
        for name, col in list(LAYERS.items()) + [("INK", INK), ("MUTED", MUTED)] + [(f"T{i}", t) for i, t in enumerate(TEAM)]
    )
    return (f'<svg class="abs" style="left:{x}px;top:{y}px" width="{w}" height="{h}" viewBox="0 0 {w} {h}" '
            f'font-family="Inter, sans-serif" style="font-variant-ligatures:none"><defs>{markers}</defs>{inner}</svg>')


def col(name):
    return LAYERS.get(name) or {"INK": INK, "MUTED": MUTED}.get(name) or TEAM[int(name[1])]


def rect(x, y, w, h, fill=CARD, stroke=LINE, sw=2, r=14, dash=None, extra=""):
    d = f'stroke-dasharray="{dash}"' if dash else ""
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" {d} {extra}/>'


def text(x, y, t, size=22, weight=500, fill=INK, anchor="middle", mono=False, italic=False):
    fam = 'font-family="JetBrains Mono, monospace"' if mono else ""
    it = 'font-style="italic"' if italic else ""
    return f'<text x="{x}" y="{y}" font-size="{size}" font-weight="{weight}" fill="{fill}" text-anchor="{anchor}" {fam} {it}>{t}</text>'


def arrow(x1, y1, x2, y2, color="INK", sw=3, dash=None, both=False, curve=None):
    cc = col(color)
    d = f'stroke-dasharray="{dash}"' if dash else ""
    start = f'marker-start="url(#a-{color})"' if both else ""
    if curve is not None:
        mx, my = (x1 + x2) / 2, (y1 + y2) / 2 + curve
        path = f"M{x1},{y1} Q{mx},{my} {x2},{y2}"
    else:
        path = f"M{x1},{y1} L{x2},{y2}"
    return f'<path d="{path}" fill="none" stroke="{cc}" stroke-width="{sw}" {d} marker-end="url(#a-{color})" {start}/>'


def pill(x, y, label, color, size=18, fill=True, w=None):
    w = w or (len(label) * size * 0.68 + 30)
    h = size + 18
    bg = color if fill else CARD
    fg = "#fff" if fill else color
    return (rect(x - w / 2, y - h / 2, w, h, fill=bg, stroke=color, sw=2, r=h / 2)
            + text(x, y + size * 0.36, label, size=size, weight=700, fill=fg))


def num(x, y, n, color, r=17):
    return (f'<circle cx="{x}" cy="{y}" r="{r}" fill="{color}"/>'
            + text(x, y + r * 0.38, str(n), size=r * 1.1, weight=800, fill="#fff"))


# ------------------------------------------------------------- slide page --
def page(idx, total, layer, step, title, sub, body, direction=None):
    color = LAYERS.get(layer, INK)
    chip = f'<span class="chip" style="background:{color}">{layer}</span>' if layer in LAYERS else ""
    ml = "" if chip else "margin-left:0"
    stp = f'<span class="step" style="{ml}">{step}</span>' if step else ""
    footer = minimap(layer, direction) if layer in LAYERS else ""
    return f"""<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>{CSS}</style></head><body>
<div class="abs" style="left:80px;top:52px;width:1760px">
  <div>{chip}{stp}</div>
  <h1 style="margin-top:16px">{title}</h1>
  <div class="sub">{sub}</div>
</div>
{body}
{footer}
<div class="abs" style="left:80px;top:1034px;font-size:17px;color:{MUTED}">Transcendence · Le trajet d'un clic</div>
<div class="abs" style="right:80px;top:1034px;font-size:17px;color:{MUTED};font-weight:600">{idx:02d} / {total:02d}</div>
</body></html>"""


def minimap(current, direction):
    parts = []
    x0, gap = 600, 170
    y = 1044
    for i, name in enumerate(LAYER_ORDER):
        x = x0 + i * gap
        if i:
            parts.append(f'<line x1="{x - gap + 62}" y1="{y}" x2="{x - 62}" y2="{y}" stroke="{LINE}" stroke-width="3"/>')
        parts.append(pill(x, y, name, LAYERS[name], size=14, fill=(name == current), w=118))
    if direction:
        parts.append(text(x0 + 4 * gap + 110, y + 6, direction, size=17, weight=700, fill=LAYERS[current], anchor="start"))
    return svg("".join(parts))


# ================================================================ SLIDES ===
FRONT_TC = "frontend/src/game/useTurnChoice.ts"
FRONT_UG = "frontend/src/game/useGame.ts"
FRONT_SK = "frontend/src/game/socket.ts"
FRONT_CT = "frontend/src/game/CardTable.tsx"
FRONT_PL = "frontend/src/game/PawnLayer.tsx"
FRONT_PW = "frontend/src/game/Pawn.tsx"
FRONT_BP = "frontend/src/game/boardPawns.ts"
FRONT_PLAY = "frontend/src/pages/play.tsx"
GW = "backend/src/game/game.gateway.ts"
SV = "backend/src/game/game.service.ts"
EN_STATE = "backend/src/game/engine/state.ts"
EN_LEGAL = "backend/src/game/engine/legalMoves.ts"
EN_RULES = "backend/src/game/engine/rules.ts"
EN_APPLY = "backend/src/game/engine/apply.ts"
EN_BOARD = "backend/src/game/engine/board.ts"
EN_VIEW = "backend/src/game/engine/view.ts"

SLIDES = []


def slide(fn):
    SLIDES.append(fn)
    return fn


# ---------------------------------------------------------------- 01 titre
@slide
def s_title():
    parts = []
    # petit plateau stylisé : piste de cases, pion qui saute de 10 à 15
    cx0, cy = 420, 640
    for i in range(12):
        cell = 8 + i
        x = cx0 + i * 96
        on_path = 11 <= cell <= 15
        parts.append(rect(x, cy, 80, 80, fill=("#FFFFFF" if not on_path else "#EAF2FB"),
                          stroke=(LAYERS["FRONT"] if on_path else LINE), sw=2, r=12))
        parts.append(text(x + 40, cy + 112, str(cell), size=20, weight=600, fill=MUTED, mono=True))
    for i in range(5):
        a = cx0 + (2 + i) * 96 + 40
        b = a + 96
        parts.append(f'<path d="M{a},{cy - 6} Q{(a + b) / 2},{cy - 80} {b},{cy - 6}" fill="none" '
                     f'stroke="{TEAM[0]}" stroke-width="3" stroke-dasharray="7 7"/>')
    parts.append(f'<circle cx="{cx0 + 2 * 96 + 40}" cy="{cy + 40}" r="26" fill="{TEAM[0]}" opacity=".35"/>')
    parts.append(f'<circle cx="{cx0 + 7 * 96 + 40}" cy="{cy + 40}" r="26" fill="{TEAM[0]}"/>')
    parts.append(text(cx0 + 7 * 96 + 40, cy + 48, "1", size=22, weight=800, fill="#fff"))
    # la carte
    parts.append(rect(150, 540, 170, 240, fill="#FFFFFF", stroke=INK, sw=3, r=16))
    parts.append(text(185, 590, "5", size=44, weight=800, fill=TEAM[0], anchor="start"))
    parts.append(text(235, 700, "♥", size=90, weight=400, fill=TEAM[0]))
    body = svg("".join(parts))
    body += f"""
<div class="abs" style="left:80px;top:290px;width:1760px">
  <div style="font-size:28px;color:{MUTED};max-width:1500px;line-height:1.45">
  Scénario suivi dans toute la présentation : je suis au <b style="color:{INK}">siège 0</b>, j'ai le
  <b style="color:{TEAM[0]}">5 de cœur</b> en main, mon <b style="color:{INK}">pion n°1</b> est sur la case
  <b style="color:{INK}">10</b>. Je clique la carte, puis le pion.</div>
</div>"""
    b = body + svg("".join(
        [pill(760 + i * 200, 1000, n, LAYERS[n], size=17, w=160) for i, n in enumerate(LAYER_ORDER)]
        + [f'<line x1="{760 + i * 200 + 82}" y1="1000" x2="{760 + (i + 1) * 200 - 82}" y2="1000" stroke="{LINE}" stroke-width="3"/>' for i in range(4)]
    ))
    return page(1, 0, "", "", "Le trajet d'un clic",
                "Du clic sur une carte jusqu'au pion qui avance de 5 cases : front, WebSocket, gateway, service, moteur.",
                b)


# ---------------------------------------------------------- 02 architecture
@slide
def s_archi():
    p = []
    F, S, G, V, E = (LAYERS[n] for n in LAYER_ORDER)
    # navigateur
    p.append(rect(80, 220, 560, 700, fill="#FFFFFF", stroke=F, sw=3, r=20))
    p.append(text(110, 262, "NAVIGATEUR (moi)", size=20, weight=800, fill=F, anchor="start"))
    p.append(text(110, 290, "Next.js · React", size=18, fill=MUTED, anchor="start"))
    comps = [
        ("CardTable · PawnLayer", "les clics", 330),
        ("useTurnChoice", "construit l'action", 470),
        ("useGame", "écoute 'state' · envoie 'action'", 610),
        ("socket.ts", "un seul socket pour toute l'app", 750),
    ]
    for name, desc, yy in comps:
        fill = "#EAF2FB" if name != "socket.ts" else "#E3F2F2"
        stroke = F if name != "socket.ts" else S
        p.append(rect(120, yy, 480, 100, fill=fill, stroke=stroke, sw=2))
        p.append(text(360, yy + 44, name, size=24, weight=700, mono=True))
        p.append(text(360, yy + 76, desc, size=19, fill=MUTED))
    for a, b in [(430, 470), (570, 610), (710, 750)]:
        p.append(arrow(360, a, 360, b - 4, "FRONT", sw=3))
    # nginx
    p.append(rect(730, 420, 220, 300, fill="#FFFFFF", stroke=INK, sw=2, r=16))
    p.append(text(840, 470, "nginx", size=26, weight=800))
    p.append(text(840, 505, ":8443 · HTTPS", size=17, fill=MUTED, mono=True))
    p.append(text(840, 580, "/ws/ →", size=19, weight=700, fill=S, mono=True))
    p.append(text(840, 608, "backend", size=19, weight=700, fill=S, mono=True))
    p.append(text(840, 660, "(upgrade", size=16, fill=MUTED))
    p.append(text(840, 684, "WebSocket)", size=16, fill=MUTED))
    # tuyau websocket
    p.append(f'<path d="M600,800 C680,800 660,640 730,640" fill="none" stroke="{S}" stroke-width="10" opacity=".85"/>')
    p.append(f'<path d="M950,640 C1010,640 1000,330 1060,330" fill="none" stroke="{S}" stroke-width="10" opacity=".85"/>')
    p.append(text(840, 770, "WebSocket", size=20, weight=700, fill=S))
    p.append(text(840, 796, "(cookie jwt envoyé)", size=16, fill=MUTED))
    # backend
    p.append(rect(1040, 220, 800, 560, fill="#FFFFFF", stroke=INK, sw=3, r=20))
    p.append(text(1070, 262, "BACKEND · NestJS", size=20, weight=800, anchor="start"))
    blocks = [
        ("GameGateway", "le réseau : reçoit 'action', émet 'state'", G, 290, "game.gateway.ts"),
        ("GameService", "Map des parties · « c'est ton tour ? » · commit · bots", V, 450, "game.service.ts"),
        ("engine/", "les règles, pures : (état, action) → nouvel état", E, 610, "playTurn, isLegal, applyAction…"),
    ]
    for name, desc, cc, yy, file in blocks:
        p.append(rect(1080, yy, 720, 130, fill=cc + "18", stroke=cc, sw=3))
        p.append(text(1110, yy + 52, name, size=28, weight=800, fill=cc, anchor="start", mono=True))
        p.append(text(1110, yy + 88, desc, size=20, fill=INK, anchor="start"))
        p.append(text(1780, yy + 52, file, size=16, fill=MUTED, anchor="end", mono=True))
    p.append(f'<line x1="1440" y1="420" x2="1440" y2="450" stroke="{INK}" stroke-width="4"/>')
    p.append(f'<line x1="1440" y1="580" x2="1440" y2="610" stroke="{INK}" stroke-width="4"/>')
    # bdd
    p.append(rect(1080, 820, 720, 100, fill="#F1EEE8", stroke=MUTED, sw=2, dash="8 6"))
    p.append(text(1440, 862, "PostgreSQL (Prisma)", size=22, weight=700, fill=MUTED))
    p.append(text(1440, 894, "comptes et parties… mais PAS l'état d'un coup : lui vit en mémoire", size=18, fill=MUTED))
    return page(2, 0, "", "VUE D'ENSEMBLE", "Qui parle à qui",
                "Pour jouer un coup, on ne passe que par le WebSocket. Pas de HTTP, pas de base de données.",
                svg("".join(p)))


# ---------------------------------------------------------- 03 séquence
@slide
def s_sequence():
    p = []
    cols = [("Moi", "navigateur", 190, "FRONT"), ("Gateway", "game.gateway.ts", 640, "GATEWAY"),
            ("Service", "game.service.ts", 1030, "SERVICE"), ("Engine", "engine/", 1400, "ENGINE"),
            ("Joueur B", "autre navigateur", 1740, "FRONT")]
    for name, sub, x, lay in cols:
        cc = LAYERS[lay]
        p.append(rect(x - 125, 222, 250, 70, fill=cc, stroke=cc, r=14))
        p.append(text(x, 253, name, size=24, weight=800, fill="#fff"))
        p.append(text(x, 278, sub, size=15, fill="#ffffffcc", mono=True))
        p.append(f'<line x1="{x}" y1="292" x2="{x}" y2="1000" stroke="{cc}" stroke-width="2.5" stroke-dasharray="4 8"/>')
    X = {c[0]: c[2] for c in cols}

    def msg(y, a, b, label, color, n=None, dash=None, lab_dy=-12):
        xa, xb = X[a], X[b]
        pad = 8 if xb > xa else -8
        out = arrow(xa + pad, y, xb - pad, y, color, sw=3.5, dash=dash)
        out += text((xa + xb) / 2, y + lab_dy, label, size=19, weight=600, mono=True, fill=col(color))
        if n:
            out += num(min(xa, xb) + 30, y + lab_dy - 6, n, col(color), r=14)
        return out

    def self_note(y, who, label, color, n=None):
        x = X[who]
        cc = col(color)
        out = rect(x + 18, y - 26, 330 if who != "Moi" else 320, 44, fill=cc + "1A", stroke=cc, sw=2, r=10)
        out += text(x + 38 + (22 if n else 0), y + 3, label, size=18, weight=600, anchor="start", fill=INK)
        if n:
            out += num(x + 40, y - 4, n, cc, r=13)
        return out

    p.append(self_note(336, "Moi", "clic carte 5 → selectedCardId", "FRONT", 1))
    p.append(self_note(388, "Moi", "clic pion 1 → action « move »", "FRONT", 2))
    p.append(msg(450, "Moi", "Gateway", "emit('action', …, ack)", "SOCKET", 3))
    p.append(msg(510, "Gateway", "Service", "playAction(…)", "GATEWAY", 4))
    p.append(msg(570, "Service", "Engine", "playTurn(…)", "SERVICE", 5))
    p.append(msg(630, "Engine", "Service", "{ game, event }", "ENGINE", 6, dash="9 7"))
    p.append(self_note(688, "Service", "commit → broadcast", "SERVICE", 7))
    p.append(msg(752, "Gateway", "Moi", "emit('state')", "GATEWAY", 8))
    p.append(msg(752, "Gateway", "Joueur B", "emit('state')", "GATEWAY"))
    p.append(msg(816, "Gateway", "Moi", "ack { ok: true }", "MUTED", None, dash="9 7"))
    p.append(self_note(880, "Service", "1 s plus tard : runBots", "SERVICE", 9))
    p.append(msg(950, "Gateway", "Moi", "emit('state')  (coup de l'IA)", "GATEWAY"))
    p.append(msg(950, "Gateway", "Joueur B", "emit('state')", "GATEWAY"))
    return page(3, 0, "", "VUE D'ENSEMBLE", "Le coup, dans l'ordre",
                "Chaque numéro correspond à une slide de la suite.",
                svg("".join(p)))


# ---------------------------------------------------------- 04 connexion
@slide
def s_connect():
    b = code_panel(FRONT_SK, [(10, 17)], 80, 220, 1140, 330, "SOCKET", hl=(11, 16, 17), marks={11: 1, 16: 2, 17: 3})
    b += code_panel(GW, [(43, 54)], 80, 575, 1140, 415, "GATEWAY", hl=(44, 47, 49), marks={44: 4, 47: 5, 49: 6})
    b += notes(1260, 220, 580, None, [
        (1, "<b>Un seul socket</b> pour toute l'app : il survit aux changements de page (lobby → play)."),
        (2, "Le navigateur envoie <b>tout seul le cookie <span class='inl'>jwt</span></b> avec la connexion."),
        (3, "<span class='inl'>/ws/socket.io</span> : nginx transmet au backend."),
    ], "SOCKET", fs=22)
    b += notes(1260, 620, 580, None, [
        (4, "La gateway lit le cookie et vérifie le JWT."),
        (5, "Elle retient <b>qui tu es</b> dans <span class='inl'>client.data.userId</span>."),
        (6, "Le socket entre dans ta <b>room</b> <span class='inl'>user-&lt;id&gt;</span> : tous tes onglets recevront l'état."),
    ], "GATEWAY", fs=22)
    return page(4, 0, "SOCKET", "ÉTAPE 0 · CONNEXION", "D'abord, le tuyau",
                "À l'arrivée sur /play, le front ouvre le WebSocket et le serveur l'identifie.", b, "aller →")


# ---------------------------------------------------------- 05 clic carte
@slide
def s_card():
    b = code_panel(FRONT_CT, [(186, 190)], 80, 220, 1060, 280, "FRONT", hl=(188, 189), marks={188: 1, 189: 2})
    b += code_panel(FRONT_TC, [(59, 66)], 80, 530, 1060, 460, "FRONT", hl=(65,), marks={65: 3})
    b += notes(1180, 220, 660, 480, [
        (1, "Une carte n'est cliquable que <b>si c'est mon tour</b>."),
        (2, "Le clic remonte l'id de la carte à <span class='inl'>handleCardClick</span>."),
        (3, "On mémorise la carte choisie : <b>un simple état React</b>. Les pions jouables brillent, "
            "mais <b>ce n'est qu'un indice</b> : le serveur tranchera."),
    ], "FRONT", fs=23)
    b += json_box(1180, 730, 660, f"""{c('// état local de useTurnChoice')}
{k('selectedCardId')}:    {s('"heart_5"')}
{k('selectedCardValue')}: {v('5')}
{k('selectablePawnIds')}: [{v('1')}]  {c('// en jeu')}""", fs=22)
    b += box(1180, 940, 660, 50, f'<div style="font-size:21px;color:{LAYERS["FRONT"]};font-weight:700">→ Rien n\'est encore envoyé au serveur.</div>')
    return page(5, 0, "FRONT", "ÉTAPE 1 · CLIC SUR LA CARTE", "Je choisis le 5 de cœur",
                "La main est affichée par CardTable, le choix est gardé par le hook useTurnChoice.", b, "aller →")


# ---------------------------------------------------------- 06 clic pion
@slide
def s_pawn():
    b = code_panel(FRONT_PL, [(111, 112), (119, 120)], 80, 220, 1060, 190, "FRONT", hl=(120,), marks={120: 1}, maxfs=21)
    b += code_panel(FRONT_TC, [(49, 51), (78, 81), (105, 111)], 80, 430, 1060, 560, "FRONT",
                    hl=(51, 110), marks={110: 2, 51: 3})
    b += notes(1180, 220, 660, 440, [
        (1, "Le pion cliqué remonte son id à <span class='inl'>handlePawnClick</span>."),
        (2, "Pion sur le plateau + mode « move » : on construit l'action <b>move</b>."),
        (3, "<span class='inl'>send</span> la confie à <span class='inl'>sendAction</span> (useGame) et attend la réponse."),
    ], "FRONT", fs=23)
    b += json_box(1180, 690, 660, f"""{c('// l\'action construite')}
{{ {k('type')}:   {s('"move"')},
  {k('cardId')}: {s('"heart_5"')},
  {k('pawnId')}: {v('1')} }}""", fs=23)
    b += box(1180, 880, 660, 110, f'<div class="callout" style="background:{LAYERS["FRONT"]}14;border:2px solid {LAYERS["FRONT"]}55;font-size:21px">'
             "<b>Que des ids.</b> Jamais « va en case 15 » : c'est le serveur qui calcule où le pion arrive.</div>")
    return page(6, 0, "FRONT", "ÉTAPE 2 · CLIC SUR LE PION", "Je clique mon pion n°1",
                "Le deuxième clic transforme le choix en une action complète.", b, "aller →")


# ---------------------------------------------------------- 07 emit
@slide
def s_emit():
    b = code_panel(FRONT_UG, [(63, 74)], 80, 220, 1060, 470, "SOCKET", hl=(72,), marks={67: 1, 72: 2})
    p = []
    S = LAYERS["SOCKET"]
    # schéma du paquet
    p.append(rect(80, 730, 1060, 250, fill="#FFFFFF", stroke=S, sw=2.5, r=18))
    p.append(text(110, 772, "socket.emit(", size=24, weight=700, anchor="start", mono=True))
    segs = [("'action'", "nom du message", 300, 170), ("{ gameId: 42, action }", "le contenu", 490, 360),
            ("resolve", "l'ack : rappelé par le serveur", 870, 240)]
    for label, desc, x, w in segs:
        p.append(rect(x, 800, w, 70, fill=S + "1A", stroke=S, sw=2, r=10))
        p.append(text(x + w / 2, 845, label, size=21, weight=700, mono=True, fill=INK))
        p.append(text(x + w / 2, 912, desc, size=19, fill=MUTED))
    p.append(text(1120, 845, ")", size=24, weight=700, mono=True, anchor="end"))
    b += svg("".join(p))
    b += notes(1180, 220, 660, 760, [
        (1, "On enveloppe l'envoi dans une <b>Promise</b> : <span class='inl'>send</span> pourra faire <span class='inl'>await</span>."),
        (2, "Trois arguments : le <b>nom</b> du message, le <b>contenu</b>, et une fonction <b>ack</b>."),
        ("!", "<span class='inl'>resolve</span> sera appelée avec <b>ce que la gateway renvoie</b> : <span class='inl'>{ ok: true }</span> ou <span class='inl'>{ error }</span>."),
        ("!", "La réponse ne contient <b>pas</b> le nouvel état. Il arrivera par un autre message : <span class='inl'>state</span>."),
    ], "SOCKET", fs=23)
    return page(7, 0, "SOCKET", "ÉTAPE 3 · ENVOI", "L'action part dans le tuyau",
                "sendAction (useGame.ts) émet le message « action » sur le socket.", b, "aller →")


# ---------------------------------------------------------- 08 gateway
@slide
def s_gateway():
    b = code_panel(GW, [(69, 80)], 80, 220, 1760, 440, "GATEWAY", hl=(71, 74, 75, 78),
                   marks={71: 1, 74: 2, 75: 3, 78: 4})
    b += notes(80, 690, 1160, None, [
        (1, "<span class='inl'>@SubscribeMessage('action')</span> : l'équivalent d'une route HTTP, mais pour un message."),
        (2, "Le <span class='inl'>userId</span> vient de <span class='inl'>client.data</span> (vérifié à la connexion), <b>jamais du message</b>."),
        (3, "Ce qu'on <span class='inl'>return</span> part dans l'<b>ack</b> du client."),
        (4, "Une exception du service devient <span class='inl'>{ error }</span>, par exemple « Not your turn »."),
    ], "GATEWAY", fs=22)
    b += callout(1280, 690, 560, "<b>La gateway ne connaît aucune règle.</b> Elle identifie le client, "
                 "transmet l'action au service et traduit le résultat en réponse.", "GATEWAY")
    return page(8, 0, "GATEWAY", "ÉTAPE 4 · RÉCEPTION", "La gateway reçoit le message",
                "Côté NestJS, game.gateway.ts est la porte d'entrée du WebSocket.", b, "aller →")


# ---------------------------------------------------------- 09 service
@slide
def s_service():
    b = code_panel(SV, [(142, 163)], 80, 220, 1160, 770, "SERVICE",
                   hl=(143, 149, 153, 156, 160, 162), marks={143: 1, 149: 2, 153: 3, 156: 4, 160: 5, 162: 6})
    b += notes(1280, 220, 560, 770, [
        (1, "La partie existe et elle est en cours ?"),
        (2, "Je fais partie de cette partie ?"),
        (3, "C'est bien <b>mon tour</b> ? Sert aussi de <b>verrou</b> pendant que les bots jouent."),
        (4, "On demande au <b>moteur</b> d'appliquer le coup. <span class='inl'>null</span> = coup illégal."),
        (5, "<span class='inl'>commit</span> : on garde le nouvel état <b>et</b> on le diffuse."),
        (6, "Les bots jouent <b>en fond</b>, sans <span class='inl'>await</span> : la réponse part tout de suite."),
    ], "SERVICE", fs=22)
    return page(9, 0, "SERVICE", "ÉTAPE 5 · VÉRIFICATIONS", "Le service vérifie qui joue",
                "game.service.ts garde les parties dans une Map en mémoire et contrôle les droits du joueur.", b, "aller →")


# ---------------------------------------------------------- 10 playTurn
@slide
def s_playturn():
    b = code_panel(EN_STATE, [(112, 120), (127, 139)], 80, 220, 1160, 770, "ENGINE",
                   hl=(113, 116, 118, 128, 132, 135), marks={113: 1, 116: 2, 118: 3, 128: 4, 132: 5, 135: 6})
    b += notes(1280, 220, 560, 600, [
        (1, "<span class='inl'>isLegal</span> : le coup est-il permis ?"),
        (2, "<span class='inl'>applyAction</span> : les pions bougent."),
        (3, "<span class='inl'>playCard</span> : le 5 passe de la main à la défausse."),
        (4, "<span class='inl'>event</span> : ce qui vient de se passer, pour l'animation."),
        (5, "Tour au joueur suivant."),
        (6, "Mains vides ? On redistribue."),
    ], "ENGINE", fs=22)
    b += callout(1280, 845, 560, "<b>Fonction pure</b> : aucun objet n'est modifié, on renvoie un <b>nouveau</b> <span class='inl'>game</span>.",
                 "ENGINE")
    return page(10, 0, "ENGINE", "ÉTAPE 6 · LE MOTEUR", "playTurn, le chef d'orchestre",
                "engine/state.ts enchaîne toutes les étapes d'un coup.", b, "aller →")


# ---------------------------------------------------------- 11 isLegal
@slide
def s_legal():
    b = code_panel(EN_LEGAL, [(23, 33), (79, 88)], 80, 220, 1160, 770, "ENGINE",
                   hl=(24, 32, 33, 80, 84), marks={24: 1, 32: 2, 80: 3, 84: 4})
    b += notes(1280, 220, 560, 480, [
        (1, "Mes pions."),
        (2, "Pour chaque carte × chaque pion, on ajoute les coups permis par <span class='inl'>rules.ts</span>."),
        (3, "<span class='inl'>isLegal</span> recalcule <b>toute la liste</b>…"),
        (4, "… et cherche l'action reçue dedans."),
    ], "ENGINE", fs=22)
    b += json_box(1280, 730, 560, f"""{c('// getLegalActions(...) contient')}
{{ {k('type')}: {s('"move"')},
  {k('cardId')}: {s('"heart_5"')},
  {k('pawnId')}: {v('1')} }}  {c('✔ trouvée')}""", fs=21)
    b += box(1280, 900, 560, 90, f'<div style="font-size:21px;line-height:1.4"><b>Une seule source de vérité :</b> l\'IA choisit dans <b>la même liste</b>.</div>')
    return page(11, 0, "ENGINE", "ÉTAPE 6a · LÉGALITÉ", "Valider = « l'action est dans la liste »",
                "legalMoves.ts ne réécrit pas les règles : il génère tous les coups possibles.", b, "aller →")


# ---------------------------------------------------------- 12 canMove
@slide
def s_canmove():
    p = []
    x0, y0, cw = 150, 250, 128
    for i in range(12):
        cell = 8 + i
        x = x0 + i * cw
        on = 11 <= cell <= 15
        start = cell == 18
        fill = "#EEF3EA" if on else "#FFFFFF"
        stroke = LAYERS["ENGINE"] if on else LINE
        if start:
            fill, stroke = TEAM[1] + "22", TEAM[1]
        p.append(rect(x, y0, 108, 108, fill=fill, stroke=stroke, sw=2.5, r=14))
        p.append(text(x + 54, y0 + 146, str(cell), size=22, weight=700, fill=MUTED, mono=True))
    p.append(text(x0 + 10 * cw + 54, y0 - 20, "sortie siège 1", size=18, weight=700, fill=TEAM[1]))
    for i in range(5):
        a = x0 + (2 + i) * cw + 54
        b2 = a + cw
        p.append(f'<path d="M{a},{y0 - 4} Q{(a + b2) / 2},{y0 - 70} {b2},{y0 - 4}" fill="none" stroke="{TEAM[0]}" '
                 f'stroke-width="3" stroke-dasharray="7 6" marker-end="url(#a-T0)"/>')
    p.append(f'<circle cx="{x0 + 2 * cw + 54}" cy="{y0 + 54}" r="30" fill="{TEAM[0]}"/>')
    p.append(text(x0 + 2 * cw + 54, y0 + 63, "1", size=26, weight=800, fill="#fff"))
    p.append(f'<circle cx="{x0 + 7 * cw + 54}" cy="{y0 + 54}" r="30" fill="none" stroke="{TEAM[0]}" stroke-width="3" stroke-dasharray="6 5"/>')
    p.append(text(x0 + 4.5 * cw + 54, y0 + 190, "pathCells(10, 5)  =  [11, 12, 13, 14, 15]", size=22, weight=700,
                  fill=LAYERS["ENGINE"], mono=True))
    b = svg("".join(p))
    b += code_panel(EN_RULES, [(19, 24), (27, 35)], 80, 470, 1100, 520, "ENGINE",
                    hl=(24, 30, 32, 33), marks={24: 1, 30: 2, 32: 3})
    b += notes(1220, 470, 620, 520, [
        (1, "Les cases traversées, avec <span class='inl'>realValueOf</span> : le 5 vaut 5 (un 4 vaudrait −4)."),
        (2, "Sur chaque case : est-ce une <b>case de sortie</b> ?"),
        (3, "Si un pion est posé <b>sur sa propre sortie</b>, il bloque le passage."),
        ("✔", "Ici aucune des cases 11 à 15 n'est une sortie : <b>le coup est permis</b>."),
    ], "ENGINE", fs=22)
    return page(12, 0, "ENGINE", "ÉTAPE 6a · LA RÈGLE", "canMove : puis-je avancer de 5 ?",
                "rules.ts regarde chaque case du chemin.", b, "aller →")


# ---------------------------------------------------------- 13 apply
@slide
def s_apply():
    b = code_panel(EN_APPLY, [(42, 44), (59, 66)], 80, 220, 1100, 470, "ENGINE",
                   hl=(44, 59, 60, 63), marks={44: 1, 59: 2, 60: 3, 63: 4})
    b += code_panel(EN_APPLY, [(27, 28), (30, 32)], 80, 715, 1100, 275, "ENGINE", hl=(32,), maxfs=21)
    b += notes(1220, 220, 620, 460, [
        (1, "La carte donne le nombre de cases : <b>5</b>."),
        (2, "<span class='inl'>mod</span> : la piste fait 72 cases, on boucle de 71 à 0."),
        (3, "Quelqu'un sur la case d'arrivée ? Il retourne au spawn."),
        (4, "<b>Nouveau tableau</b> de pions, plus la liste des capturés."),
    ], "ENGINE", fs=22)
    b += json_box(1220, 710, 620, f"""{c('// ActionResult')}
{{ {k('pawns')}: [ …, {{ {k('id')}: {v('1')},
      {k('position')}: {{ {k('zone')}: {s('"board"')}, {k('cell')}: {v('15')} }} }}, … ],
  {k('captured')}: [] }}  {c('// case 15 libre')}""", fs=19)
    return page(13, 0, "ENGINE", "ÉTAPE 6b · APPLICATION", "applyAction : le pion avance",
                "apply.ts suppose le coup déjà validé et ne touche qu'aux pions.", b, "aller →")


# ---------------------------------------------------------- 14 commit
@slide
def s_commit():
    b = code_panel(SV, [(15, 15), (24, 27)], 80, 220, 1140, 290, "SERVICE", hl=(15, 25, 26), marks={15: 1, 25: 2, 26: 3})
    b += code_panel(GW, [(31, 40)], 80, 535, 1140, 455, "GATEWAY", hl=(32, 34, 36, 37), marks={32: 4, 36: 5, 37: 6})
    b += notes(1260, 220, 580, None, [
        (1, "Toutes les parties en cours vivent dans une <b>Map en mémoire</b>."),
        (2, "Le serveur <b>se souvient</b> du nouvel état…"),
        (3, "… et les joueurs <b>le voient</b>."),
    ], "SERVICE", fs=22)
    b += notes(1260, 590, 580, None, [
        (4, "Au démarrage, la gateway <b>donne au service</b> la fonction d'envoi."),
        (5, "Un message <b>par joueur</b> : chacun sa vue (<span class='inl'>viewFor</span>)."),
        (6, "Envoyé dans la room du joueur. Les IA sont sautées."),
    ], "GATEWAY", fs=22)
    return page(14, 0, "SERVICE", "ÉTAPE 7 · COMMIT", "Se souvenir et diffuser",
                "Le service ne connaît pas socket.io : c'est la gateway qui lui fournit la fonction d'envoi.", b, "← retour")


# ---------------------------------------------------------- 15 fan-out
@slide
def s_fanout():
    p = []
    V, G, F = LAYERS["SERVICE"], LAYERS["GATEWAY"], LAYERS["FRONT"]
    p.append(rect(80, 470, 330, 150, fill=V + "18", stroke=V, sw=3))
    p.append(text(245, 530, "commit(game, event)", size=22, weight=800, mono=True, fill=V))
    p.append(text(245, 568, "game.service.ts", size=17, fill=MUTED, mono=True))
    p.append(arrow(412, 545, 520, 545, "SERVICE", sw=4))
    p.append(rect(522, 400, 380, 290, fill=G + "18", stroke=G, sw=3))
    p.append(text(712, 455, "broadcaster", size=26, weight=800, mono=True, fill=G))
    p.append(text(712, 490, "for (player of game.players)", size=17, fill=INK, mono=True))
    p.append(text(712, 540, "IA → on saute", size=19, fill=MUTED))
    p.append(text(712, 580, "humain → viewFor(game, seat)", size=18, fill=INK, mono=True))
    p.append(text(712, 610, "puis emit dans sa room", size=18, fill=INK))
    players = [
        (0, "Moi", "user-7", True, 2),
        (1, "IA 2", None, False, 0),
        (2, "Joueur B", "user-9", True, 1),
        (3, "IA 4", None, False, 0),
    ]
    y = 250
    for seat, name, room, human, tabs in players:
        cy = y + seat * 175
        cc = TEAM[seat]
        if human:
            p.append(arrow(904, 545, 1096, cy + 55, "GATEWAY", sw=3.5, curve=0))
            ly = 545 + (cy + 55 - 545) * 0.55
            p.append(rect(1000 - 48, ly - 17, 96, 30, fill=PAPER, stroke="none", r=8))
            p.append(text(1000, ly + 4, "'state'", size=17, weight=700, fill=G, mono=True))
            p.append(rect(1102, cy, 330, 110, fill="#FFFFFF", stroke=cc, sw=3))
            p.append(text(1130, cy + 44, f"siège {seat} · {name}", size=23, weight=800, fill=cc, anchor="start"))
            p.append(text(1130, cy + 80, f"room {room}", size=18, fill=MUTED, mono=True, anchor="start"))
            for t in range(tabs):
                ty = cy + 55 if tabs == 1 else cy + 20 + t * 72
                p.append(arrow(1434, cy + 55, 1526, ty, "FRONT", sw=2.5))
                p.append(rect(1530, ty - 30, 230, 60, fill="#EAF2FB", stroke=F, sw=2, r=10))
                p.append(text(1550, ty + 7, f"onglet {t + 1}", size=19, weight=700, fill=F, anchor="start"))
                p.append(text(1740, ty + 6, "useGame", size=15, fill=MUTED, mono=True, anchor="end"))
        else:
            p.append(arrow(904, 545, 1100, cy + 55, "MUTED", sw=2, dash="6 8", curve=0))
            p.append(rect(1102, cy, 330, 110, fill="#F1EEE8", stroke=MUTED, sw=2, dash="8 6"))
            p.append(text(1130, cy + 44, f"siège {seat} · {name}", size=23, weight=800, fill=MUTED, anchor="start"))
            p.append(text(1130, cy + 80, "pas de navigateur → rien", size=18, fill=MUTED, anchor="start"))
    b = svg("".join(p))
    b += callout(80, 760, 830, "Mon coup est diffusé <b>à tout le monde</b>, moi compris : "
                 "je reçois mon propre coup exactement comme Joueur B le reçoit.", "GATEWAY")
    return page(15, 0, "GATEWAY", "ÉTAPE 7 · DIFFUSION", "Un commit, un message par humain",
                "Exemple : 2 humains et 2 IA, et j'ai deux onglets ouverts.", b, "← retour")


# ---------------------------------------------------------- 16 viewFor
@slide
def s_viewfor():
    p = []
    E = LAYERS["ENGINE"]
    # Game complet
    p.append(rect(80, 540, 480, 440, fill="#FFFFFF", stroke=INK, sw=3))
    p.append(text(110, 585, "Game  (serveur, complet)", size=22, weight=800, anchor="start"))
    rows = [("pawns", "16 pions", INK), ("currentSeat", "1", INK), ("discardPile", "[…, heart_5]", INK),
            ("drawPile", "32 cartes", TEAM[0]), ("players[0].hand", "♥7 ♠2 ♦K ♣9", TEAM[0]),
            ("players[2].hand", "♥Q ♦3 ♠4 ♣A", TEAM[0])]
    for i, (key, val, cc) in enumerate(rows):
        yy = 640 + i * 55
        p.append(text(110, yy, key, size=19, weight=700, mono=True, anchor="start", fill=cc))
        p.append(text(535, yy, val, size=19, mono=True, anchor="end", fill=MUTED))
    p.append(text(110, 960, "en rouge : secret", size=17, fill=TEAM[0], weight=700, anchor="start"))
    # flèches
    p.append(arrow(562, 700, 796, 630, "ENGINE", sw=3.5))
    p.append(arrow(562, 840, 796, 870, "ENGINE", sw=3.5))
    p.append(text(660, 622, "viewFor(game, 0)", size=17, weight=700, mono=True, fill=E))
    p.append(text(680, 912, "viewFor(game, 2)", size=17, weight=700, mono=True, fill=E))
    for i, (seat, hand, other) in enumerate([(0, "♥7 ♠2 ♦K ♣9", "siège 2 : handCount 4"),
                                             (2, "♥Q ♦3 ♠4 ♣A", "siège 0 : handCount 4")]):
        yy = 520 + i * 245
        cc = TEAM[seat]
        p.append(rect(800, yy, 530, 215, fill="#FFFFFF", stroke=cc, sw=3))
        p.append(text(826, yy + 42, f"GameView envoyée au siège {seat}", size=21, weight=800, fill=cc, anchor="start"))
        p.append(text(826, yy + 88, f"mySeat: {seat}", size=19, mono=True, anchor="start"))
        p.append(text(826, yy + 124, f"myHand: {hand}", size=19, mono=True, anchor="start"))
        p.append(text(826, yy + 160, f"players: … {other}", size=19, mono=True, anchor="start"))
        p.append(text(826, yy + 196, "drawPileCount: 32", size=19, mono=True, anchor="start"))
    b = code_panel(EN_VIEW, [(4, 5), (9, 12)], 80, 220, 1250, 290, "ENGINE", hl=(5, 10, 11), maxfs=22)
    b += svg("".join(p))
    b += notes(1370, 220, 470, 760, [
        ("🙈", "On <b>retire</b> la pioche et la main des autres."),
        ("✋", "On garde <b>ma main</b> (<span class='inl'>myHand</span>) et seulement le <b>nombre</b> de cartes des autres."),
        ("🔒", "Même en fouillant les outils réseau du navigateur, on ne voit pas les cartes adverses : "
                "<b>elles ne sont jamais envoyées</b>."),
    ], "ENGINE", fs=22)
    return page(16, 0, "ENGINE", "ÉTAPE 7 · CE QUE CHACUN VOIT", "viewFor : une vue par joueur",
                "Le même état complet devient un message différent pour chaque siège.", b, "← retour")


# ---------------------------------------------------------- 17 réception
@slide
def s_receive():
    b = code_panel(FRONT_UG, [(34, 38), (49, 51)], 80, 220, 860, 370, "FRONT", hl=(35, 36, 49), marks={49: 1, 35: 2, 36: 3})
    b += code_panel(FRONT_PLAY, [(14, 15), (41, 46)], 980, 220, 860, 370, "FRONT", hl=(14, 42), marks={14: 4, 42: 5})
    b += notes(80, 620, 1760, None, [
        (1, "<span class='inl'>useGame</span> écoute <span class='inl'>state</span> en permanence, pour n'importe quel coup (le mien, celui de Joueur B, celui d'une IA)."),
        (2, "<span class='inl'>setGame</span> : la vérité à afficher. <b>React redessine</b> le plateau et la main."),
        (3, "<span class='inl'>setLastEvent</span> : juste un indice pour l'animation."),
        (4, "La page <span class='inl'>/play</span> récupère ces valeurs et les passe aux composants."),
        (5, "<span class='inl'>toBoardPawns</span> combine les pions avec l'event pour savoir <b>qui doit marcher</b>."),
    ], "FRONT", fs=22)
    return page(17, 0, "FRONT", "ÉTAPE 8 · RÉCEPTION", "Le front reçoit « state »",
                "Le front ne calcule rien : il remplace son état par celui du serveur.", b, "← retour")


# ---------------------------------------------------------- 18 animation
@slide
def s_anim():
    b = code_panel(FRONT_BP, [(45, 58)], 80, 220, 1040, 470, "FRONT", hl=(53, 54, 56, 57), marks={54: 1, 56: 2, 57: 3})
    b += code_panel(FRONT_PW, [(94, 96), (128, 129)], 80, 720, 1040, 270, "FRONT", hl=(128,), marks={128: 4}, maxfs=21)
    p = []
    F = LAYERS["FRONT"]
    x0, y0, cw = 1190, 290, 108
    for i in range(6):
        cell = 10 + i
        p.append(rect(x0 + i * cw, y0, 92, 92, fill="#EAF2FB" if i else "#FFFFFF", stroke=F if i else LINE, sw=2, r=12))
        p.append(text(x0 + i * cw + 46, y0 + 125, str(cell), size=20, weight=700, fill=MUTED, mono=True))
    for i in range(5):
        a = x0 + i * cw + 46
        b2 = a + cw
        p.append(f'<path d="M{a},{y0 - 4} Q{(a + b2) / 2},{y0 - 60} {b2},{y0 - 4}" fill="none" stroke="{TEAM[0]}" '
                 f'stroke-width="3" marker-end="url(#a-T0)"/>')
    p.append(f'<circle cx="{x0 + 5 * cw + 46}" cy="{y0 + 46}" r="26" fill="{TEAM[0]}"/>')
    p.append(text(x0 + 5 * cw + 46, y0 + 54, "1", size=22, weight=800, fill="#fff"))
    p.append(text(x0 + 46, y0 + 54, "départ", size=15, fill=MUTED))
    b += svg("".join(p))
    b += notes(1170, 470, 670, 520, [
        (1, "L'event dit : <span class='inl'>move</span> avec le 5 sur le pion 1."),
        (2, "Le pion est arrivé en 15, donc il est parti de <b>15 − 5 = 10</b>."),
        (3, "Chemin à parcourir : <span class='inl'>[11, 12, 13, 14, 15]</span>."),
        (4, "<span class='inl'>motion</span> fait sauter le pion de case en case."),
    ], "FRONT", fs=22)
    return page(18, 0, "FRONT", "ÉTAPE 8 · ANIMATION", "De l'event au pion qui saute",
                "state dit OÙ est le pion, event dit CE QUI s'est passé : le front reconstruit le trajet.", b, "← retour")


# ---------------------------------------------------------- 19 bots
@slide
def s_bots():
    b = code_panel(SV, [(165, 179)], 80, 220, 1060, 460, "SERVICE", hl=(169, 170, 172, 173, 177),
                   marks={169: 1, 170: 2, 172: 3, 177: 4})
    b += notes(1180, 220, 660, 460, [
        (1, "Tant que c'est au tour d'une IA…"),
        (2, "… on attend <b>1 seconde</b> pour que les joueurs voient passer le coup,"),
        (3, "l'IA choisit un coup (parmi les coups légaux), puis <span class='inl'>playTurn</span> comme pour un humain,"),
        (4, "et <b>un commit par coup</b>, donc un <span class='inl'>state</span> diffusé à chaque fois."),
    ], "SERVICE", fs=22)
    p = []
    V = LAYERS["SERVICE"]
    y = 830
    p.append(f'<line x1="120" y1="{y}" x2="1800" y2="{y}" stroke="{INK}" stroke-width="3"/>')
    evts = [(160, "t = 0", "siège 0 · Moi", "move ♥5", TEAM[0], True),
            (620, "t = 1 s", "siège 1 · IA 2", "coup de l'IA", TEAM[1], True),
            (1080, "puis", "siège 2 · Joueur B", "humain → la boucle s'arrête", TEAM[2], False)]
    for x, t, who, what, cc, commit in evts:
        p.append(f'<circle cx="{x + 40}" cy="{y}" r="12" fill="{cc}"/>')
        p.append(text(x + 40, y - 30, t, size=19, weight=700, mono=True, fill=MUTED))
        p.append(text(x + 70, y + 40, who, size=21, weight=800, fill=cc, anchor="start"))
        p.append(text(x + 70, y + 72, what, size=19, fill=INK, anchor="start"))
        if commit:
            p.append(pill(x + 260, y - 30, "commit → state", V, size=15, w=170))
    p.append(text(1500, y + 40, "… attend que Joueur B clique", size=19, fill=MUTED, italic=True, anchor="start"))
    b += svg("".join(p))
    return page(19, 0, "SERVICE", "ÉTAPE 9 · ET ENSUITE ?", "Les bots jouent à la suite",
                "Juste après mon coup, runBots démarre en fond (sans await).", b, "← retour")


# ---------------------------------------------------------- 20 deux canaux
@slide
def s_channels():
    p = []
    S, G, F = LAYERS["SOCKET"], LAYERS["GATEWAY"], LAYERS["FRONT"]
    # colonne gauche : ack
    p.append(rect(80, 230, 860, 700, fill="#FFFFFF", stroke=LINE, sw=2, r=22))
    p.append(text(510, 290, "📞  L'ACK : la réponse à MA question", size=28, weight=800))
    p.append(rect(150, 360, 240, 110, fill="#EAF2FB", stroke=F, sw=2.5))
    p.append(text(270, 422, "Moi", size=26, weight=800, fill=F))
    p.append(rect(630, 360, 240, 110, fill=G + "18", stroke=G, sw=2.5))
    p.append(text(750, 422, "Gateway", size=26, weight=800, fill=G))
    p.append(arrow(392, 395, 626, 395, "SOCKET", sw=3.5))
    p.append(text(510, 382, "action", size=19, weight=700, mono=True, fill=S))
    p.append(arrow(626, 440, 392, 440, "MUTED", sw=3, dash="8 6"))
    p.append(text(510, 470, "{ ok } ou { error }", size=19, weight=700, mono=True, fill=MUTED))
    for i, t in enumerate(["• un seul destinataire : <b>celui qui a joué</b>",
                           "• dit seulement <b>oui / non (et pourquoi)</b>",
                           "• sert à afficher « Not your turn »",
                           "• ne contient <b>jamais</b> l'état"]):
        p.append(f'<foreignObject x="150" y="{540 + i * 80}" width="760" height="70"><div xmlns="http://www.w3.org/1999/xhtml" '
                 f'style="font-size:25px;font-family:Inter;color:{INK}">{t}</div></foreignObject>')
    # colonne droite : state
    p.append(rect(980, 230, 860, 700, fill="#FFFFFF", stroke=LINE, sw=2, r=22))
    p.append(text(1410, 290, "📻  STATE : la radio, pour tout le monde", size=28, weight=800))
    p.append(rect(1050, 360, 220, 110, fill=G + "18", stroke=G, sw=2.5))
    p.append(text(1160, 422, "Gateway", size=26, weight=800, fill=G))
    for i, who in enumerate(["Moi", "Joueur B"]):
        yy = 330 + i * 95
        p.append(rect(1560, yy, 210, 80, fill="#EAF2FB", stroke=F, sw=2.5))
        p.append(text(1665, yy + 50, who, size=23, weight=800, fill=F))
        p.append(arrow(1272, 415, 1556, yy + 40, "GATEWAY", sw=3.5))
    p.append(text(1400, 385, "state", size=19, weight=700, mono=True, fill=G))
    for i, t in enumerate(["• envoyé à <b>tous les humains</b> de la partie",
                           "• à chaque changement : mon coup, celui d'un autre, d'une IA",
                           "• c'est <b>la vérité</b> que le front affiche",
                           "• aussi en réponse à <span style='font-family:JetBrains Mono'>sync</span> (reconnexion)"]):
        p.append(f'<foreignObject x="1050" y="{540 + i * 80}" width="760" height="70"><div xmlns="http://www.w3.org/1999/xhtml" '
                 f'style="font-size:25px;font-family:Inter;color:{INK}">{t}</div></foreignObject>')
    return page(20, 0, "", "L'IDÉE À RETENIR", "Deux canaux, deux rôles",
                "Le résultat de mon coup n'arrive pas dans la réponse, mais à la radio, comme pour tout le monde.",
                svg("".join(p)))


# ---------------------------------------------------------- 21 payloads
@slide
def s_payloads():
    b = box(80, 220, 560, 40, f'<div style="font-size:22px;font-weight:800;color:{LAYERS["SOCKET"]}">→ FRONT VERS SERVEUR · « action »</div>')
    b += json_box(80, 270, 560, f"""{{
  {k('gameId')}: {v('42')},
  {k('action')}: {{
    {k('type')}:   {s('"move"')},
    {k('cardId')}: {s('"heart_5"')},
    {k('pawnId')}: {v('1')}
  }}
}}""", h=330, fs=22)
    b += box(80, 640, 560, 40, f'<div style="font-size:22px;font-weight:800;color:{MUTED}">← RÉPONSE (ack)</div>')
    b += json_box(80, 690, 560, f"""{{ {k('ok')}: {v('true')} }}
{c('// ou, si refusé :')}
{{ {k('error')}: {s('"Not your turn"')} }}""", h=160, fs=22)
    b += box(680, 220, 1160, 40, f'<div style="font-size:22px;font-weight:800;color:{LAYERS["GATEWAY"]}">← SERVEUR VERS CHAQUE HUMAIN · « state »  (vue du siège 0, abrégée)</div>')
    b += json_box(680, 270, 1160, f"""{{
  {k('state')}: {{                                  {c('// GameView : la vérité à afficher')}
    {k('id')}: {v('42')}, {k('phase')}: {s('"playing"')}, {k('currentSeat')}: {v('1')}, {k('mySeat')}: {v('0')},
    {k('myHand')}: [ {s('"heart_7"')}, {s('"spade_2"')}, {s('"diamond_13"')}, {s('"club_9"')} ],
    {k('players')}: [ {{ {k('seat')}: {v('0')}, {k('pseudo')}: {s('"Moi"')}, {k('handCount')}: {v('4')} }}, … ],
    {k('pawns')}: [ …, {{ {k('id')}: {v('1')}, {k('playerSeat')}: {v('0')},
                   {k('position')}: {{ {k('zone')}: {s('"board"')}, {k('cell')}: {v('15')} }} }}, … ],
    {k('discardPile')}: [ …, {s('"heart_5"')} ],  {k('drawPileCount')}: {v('32')}
  }},
  {k('event')}: {{                                  {c('// GameEvent : quoi animer')}
    {k('seat')}: {v('0')},
    {k('action')}: {{ {k('type')}: {s('"move"')}, {k('cardId')}: {s('"heart_5"')}, {k('pawnId')}: {v('1')} }},
    {k('captured')}: [],
    {k('newRound')}: {v('false')}
  }}
}}""", h=620, fs=21)
    b += callout(80, 890, 560, "Les types sont dans <span class='inl'>game.types.ts</span> et copiés dans <span class='inl'>gameTypes.ts</span> côté front.", "SOCKET")
    return page(21, 0, "", "CE QUI PASSE DANS LE TUYAU", "Les messages, tels quels",
                "Les trois messages échangés pour notre coup. Les cartes sont écrites en id.", b)


# ---------------------------------------------------------- 22 récap
@slide
def s_recap():
    p = []
    bw, bh = 300, 130
    xs = [80, 445, 810, 1175, 1540]
    top = [
        ("FRONT", "clic carte + pion", "useTurnChoice"),
        ("SOCKET", "emit('action')", "useGame.sendAction"),
        ("GATEWAY", "qui es-tu ?", "handleAction"),
        ("SERVICE", "ton tour ?", "playAction"),
        ("ENGINE", "légal ? appliquer", "playTurn"),
    ]
    bottom = [  # de droite à gauche
        ("SERVICE", "commit", "Map + broadcast"),
        ("GATEWAY", "une vue par humain", "viewFor · emit"),
        ("SOCKET", "'state'", "à tous les humains"),
        ("FRONT", "setGame", "useGame"),
        ("FRONT", "le pion saute", "boardPawns · Pawn"),
    ]
    yt, yb = 290, 700

    def card(x, y, lay, what, where, n):
        cc = LAYERS[lay]
        out = rect(x, y, bw, bh, fill="#FFFFFF", stroke=cc, sw=3, r=16)
        out += rect(x, y, bw, 38, fill=cc, stroke=cc, sw=0, r=16) + rect(x, y + 20, bw, 18, fill=cc, stroke=cc, sw=0, r=0)
        out += text(x + 18, y + 26, f"{n}  ·  {lay}", size=16, weight=800, fill="#fff", anchor="start")
        out += text(x + bw / 2, y + 80, what, size=24, weight=800, fill=INK)
        out += text(x + bw / 2, y + 112, where, size=17, fill=MUTED, mono=True)
        return out

    for i, (lay, what, where) in enumerate(top):
        p.append(card(xs[i], yt, lay, what, where, i + 1))
        if i:
            p.append(arrow(xs[i - 1] + bw + 6, yt + bh / 2 + 19, xs[i] - 6, yt + bh / 2 + 19, lay, sw=4))
    for i, (lay, what, where) in enumerate(bottom):
        x = xs[4 - i]
        p.append(card(x, yb, lay, what, where, i + 6))
        if i:
            p.append(arrow(xs[5 - i] - 6, yb + bh / 2 + 19, x + bw + 6, yb + bh / 2 + 19, lay, sw=4))
    # engine -> commit
    p.append(arrow(xs[4] + bw / 2, yt + bh + 6, xs[4] + bw / 2, yb - 6, "ENGINE", sw=4))
    p.append(text(xs[4] + bw / 2 + 16, (yt + bh + yb) / 2 + 6, "{ game, event }", size=18, weight=700, fill=LAYERS["ENGINE"], mono=True, anchor="start"))
    # prochain clic
    p.append(arrow(xs[0] + bw / 2, yb - 6, xs[0] + bw / 2, yt + bh + 6, "MUTED", sw=3, dash="8 7"))
    p.append(text(xs[0] + bw / 2 + 16, (yt + bh + yb) / 2 + 6, "prochain clic", size=18, weight=600, fill=MUTED, anchor="start", italic=True))
    # aller / retour + message central
    p.append(text(80, yt - 22, "ALLER  →", size=18, weight=800, fill=MUTED, anchor="start"))
    p.append(text(1840, yb + bh + 44, "←  RETOUR", size=18, weight=800, fill=MUTED, anchor="end"))
    p.append(text(960, 552, "Le serveur fait autorité", size=34, weight=800))
    p.append(text(960, 594, "le front envoie une intention, puis affiche ce qu'on lui renvoie", size=22, fill=MUTED))
    return page(22, 0, "", "RÉCAP", "La boucle complète", "", svg("".join(p)))


# ================================================================== build ==
def main():
    OUT_HTML.mkdir(exist_ok=True)
    OUT_PNG.mkdir(exist_ok=True)
    total = len(SLIDES)
    for i, fn in enumerate(SLIDES, 1):
        doc = fn().replace(f" / 00</div>", f" / {total:02d}</div>")
        name = f"{i:02d}_{fn.__name__[2:]}"
        (OUT_HTML / f"{name}.html").write_text(doc)
        subprocess.run([
            "chromium-browser", "--headless=new", "--disable-gpu", "--hide-scrollbars",
            f"--window-size={W},{H}", "--virtual-time-budget=4000", "--force-device-scale-factor=1",
            f"--screenshot={OUT_PNG / (name + '.png')}", (OUT_HTML / f"{name}.html").as_uri(),
        ], check=True, capture_output=True)
        print("ok", name)


if __name__ == "__main__":
    main()
