// Génère slides/transcendence_soutenance.pptx
//
//   npm install pptxgenjs          (une fois, n'importe où dans le NODE_PATH)
//   node slides/build_slides.js
//
// Les extraits de code sont lus directement dans le repo : si le code bouge,
// relancer le script (et ajuster les numéros de ligne dans les appels à src()).

const fs = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");

const REPO = path.resolve(__dirname, "..");
const OUT = path.join(__dirname, "transcendence_soutenance.pptx");
const APPLY_THEME = process.env.APPLY_THEME; // chemin optionnel vers apply_theme.js

/* ------------------------------------------------------------------ theme */
const THEME = {
  name: "Tock",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "25313E", lt1: "FFFFFF", dk2: "1B2430", lt2: "F4F0E6",
    accent1: "407FC1", accent2: "C0563E", accent3: "C98A2E",
    accent4: "5F7F4A", accent5: "7B5C8F", accent6: "639EDE",
    hlink: "407FC1", folHlink: "7B5C8F",
  },
};
const HEX = THEME.colors;
const MONO = "Courier New";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.author = "Équipe Transcendence";
pres.title = "Transcendence — Tock en ligne";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;
const SEAT = [C.accent2, C.accent3, C.accent4, C.accent5];
const SEAT_HEX = [HEX.accent2, HEX.accent3, HEX.accent4, HEX.accent5];
const MUTED = "5D6B7A";
const LINE = "C9C0AC";

/* ---------------------------------------------------------------- layouts */
pres.defineSlideMaster({
  title: "TITLE",
  background: { color: HEX.dk2 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.8, y: 2.3, w: 11.7, h: 1.3,
      fontSize: 54, bold: true, color: C.background1, align: "left", valign: "bottom" }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 0.8, y: 3.75, w: 11.7, h: 1.2,
      fontSize: 22, color: C.accent6, align: "left", valign: "top" }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "SECTION",
  background: { color: HEX.dk2 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 2.6, y: 2.75, w: 9.9, h: 1.1,
      fontSize: 44, bold: true, color: C.background1, align: "left", valign: "middle" }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: 2.6, y: 3.85, w: 9.9, h: 1.0,
      fontSize: 20, color: C.accent6, align: "left", valign: "top" }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "CONTENT",
  background: { color: HEX.lt1 },
  margin: [0.5, 0.5, 0.6, 0.5],
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.35, w: 12.1, h: 0.85,
      fontSize: 30, bold: true, color: C.text1, align: "left", valign: "middle" }, text: "" } },
    { text: { text: "ft_transcendence · Tock en ligne", options: { x: 0.6, y: 7.0, w: 6, h: 0.3,
      fontSize: 10, color: MUTED, fontFace: THEME.bodyFontFace } } },
  ],
  slideNumber: { x: 12.2, y: 7.0, w: 0.6, h: 0.3, fontSize: 10, color: MUTED, align: "right" },
});

/* ----------------------------------------------------------- code reading */
function readLines(file) {
  return fs.readFileSync(path.join(REPO, file), "utf8").replace(/\t/g, "  ").split("\n");
}
// src("a.ts", [10, 20], [30, 35]) : plages de lignes (1-indexées, incluses), "…" entre deux plages
function src(file, ...ranges) {
  const lines = readLines(file);
  const out = [];
  ranges.forEach((range, i) => {
    if (i > 0) out.push("…");
    out.push(...lines.slice(range[0] - 1, range[1]));
  });
  const indents = out.filter(l => l.trim() && l !== "…").map(l => l.match(/^ */)[0].length);
  const cut = Math.min(...indents);
  return out.map(l => (l === "…" ? l : l.slice(cut))).join("\n");
}

/* ------------------------------------------------------------ highlighting */
const KEYWORDS = new Set(("const let var function return if else for while of in async await new throw try " +
  "catch finally export import from type private class switch case break continue void null true false " +
  "typeof as default this readonly constructor").split(" "));
const TOKEN = /(\/\/.*$|#.*$|\/\*.*?\*\/)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)|(@\w+)|\b(\d+)\b|\b([A-Za-z_]\w*)\b(?=\s*\()|\b([A-Za-z_]\w*)\b/g;
const CODE_COLORS = { text: "ABB2BF", comment: "7F848E", string: "98C379", deco: "61AFEF", num: "D19A66",
  kw: "C678DD", fn: "61AFEF", type: "E5C07B", gutter: "5C6370" };

function highlightLine(line, lang) {
  const runs = [];
  let last = 0;
  const push = (text, color, italic) => text && runs.push({ text, options: { color, italic: !!italic } });
  if (line === "…") return [{ text: "  …", options: { color: CODE_COLORS.gutter } }];
  for (const m of line.matchAll(TOKEN)) {
    push(line.slice(last, m.index), CODE_COLORS.text);
    const [all, comment, str, deco, num, fn, ident] = m;
    if (comment && (lang === "ts" ? !comment.startsWith("#") : comment.startsWith("#") || comment.startsWith("/*")))
      push(all, CODE_COLORS.comment, true);
    else if (comment) push(all, CODE_COLORS.text);
    else if (str) push(all, CODE_COLORS.string);
    else if (deco) push(all, CODE_COLORS.deco);
    else if (num) push(all, CODE_COLORS.num);
    else if (fn) push(all, KEYWORDS.has(fn) ? CODE_COLORS.kw : CODE_COLORS.fn);
    else if (ident && KEYWORDS.has(ident) && lang === "ts") push(all, CODE_COLORS.kw);
    else if (ident && /^[A-Z]/.test(ident)) push(all, CODE_COLORS.type);
    else push(all, CODE_COLORS.text);
    last = m.index + all.length;
  }
  push(line.slice(last), CODE_COLORS.text);
  if (runs.length === 0) runs.push({ text: " ", options: { color: CODE_COLORS.text } });
  return runs;
}

// Coupe les lignes trop longues au dernier espace, avec un retrait de suite.
// Une suite de commentaire garde son "//" pour rester grise.
function wrapLines(lines, max) {
  const out = [];
  for (let line of lines) {
    const indent = line.match(/^ */)[0];
    const isComment = /^\s*(\/\/|#)/.test(line);
    while (line.length > max) {
      let cut = line.lastIndexOf(" ", max);
      if (cut <= indent.length + 4) cut = max;
      out.push(line.slice(0, cut));
      const rest = line.slice(cut).trimStart();
      line = indent + (isComment ? (line.trimStart().startsWith("#") ? "# " : "// ") : "    ") + rest;
    }
    out.push(line);
  }
  return out;
}

// Panneau de code sombre avec un onglet qui porte le nom du fichier.
function code(slide, { x, y, w, h, file, text, size = 12, lang = "ts" }) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.08,
    fill: { color: "282C34" }, line: { color: "282C34" }, objectName: "Code panel" });
  slide.addShape(pres.shapes.RECTANGLE, { x: x + 0.02, y: y + 0.02, w: w - 0.04, h: 0.36,
    fill: { color: "21252B" }, line: { color: "21252B" } });
  slide.addText(file, { x: x + 0.2, y: y + 0.02, w: w - 0.4, h: 0.36, fontFace: MONO, fontSize: 10.5,
    color: "D7DAE0", bold: true, margin: 0, valign: "middle", isTextBox: true });
  // Taille la plus grande (>= 9.5 pt) pour laquelle le code, recoupé proprement, tient dans le panneau.
  let lines;
  for (; ; size -= 0.5) {
    lines = wrapLines(text.split("\n"), Math.floor((w - 0.3) / (size * 0.6 / 72)));
    if (lines.length * size * 1.17 / 72 <= h - 0.55 || size <= 9.5) break;
  }
  const runs = [];
  lines.forEach((line, i) => {
    const lineRuns = highlightLine(line, lang);
    if (i < lines.length - 1) lineRuns[lineRuns.length - 1].options.breakLine = true;
    runs.push(...lineRuns);
  });
  slide.addText(runs, { x: x + 0.15, y: y + 0.45, w: w - 0.3, h: h - 0.55, fontFace: MONO, fontSize: size,
    valign: "top", margin: 0, lineSpacingMultiple: 1.0, isTextBox: true, objectName: `Code ${file}` });
  const tall = lines.length * size * 1.17 / 72;
  if (tall > h - 0.55) console.warn(`! ${file}: ${lines.length} lignes trop hautes (${tall.toFixed(2)} > ${(h - 0.55).toFixed(2)})`);
  if (size < 10.5) console.warn(`~ ${file}: ${size} pt`);
}

/* --------------------------------------------------------------- helpers */
function addContent(title, section) {
  const s = pres.addSlide({ masterName: "CONTENT", sectionTitle: section });
  s.addText(title, { placeholder: "title" });
  return s;
}

// Boîte arrondie (élément de schéma).
function box(slide, x, y, w, h, text, o = {}) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: o.radius ?? 0.08,
    fill: { color: o.fill ?? C.background2 }, line: { color: o.line ?? (o.fill ?? LINE), width: o.lineWidth ?? 1 },
    objectName: o.name ?? `Box ${String(Array.isArray(text) ? text[0].text : text).slice(0, 30)}` });
  slide.addText(text, { x, y, w, h, fontSize: o.size ?? 14, color: o.color ?? C.text1, bold: o.bold ?? false,
    align: o.align ?? "center", valign: o.valign ?? "middle", margin: o.margin ?? 0.08,
    fontFace: o.mono ? MONO : undefined, isTextBox: true });
}

// Flèche droite entre deux points.
function arrow(slide, x1, y1, x2, y2, o = {}) {
  slide.addShape(pres.shapes.LINE, {
    x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1), h: Math.abs(y2 - y1),
    flipH: x2 < x1, flipV: y2 < y1,
    line: { color: o.color ?? MUTED, width: o.width ?? 1.5, endArrowType: o.noHead ? undefined : "triangle",
      beginArrowType: o.both ? "triangle" : undefined, dashType: o.dash ? "dash" : "solid" },
  });
  if (o.label) {
    slide.addText(o.label, { x: o.lx ?? (x1 + x2) / 2 - 1.2, y: o.ly ?? (y1 + y2) / 2 - 0.15, w: o.lw ?? 2.4, h: 0.3,
      fontSize: o.labelSize ?? 11, color: o.labelColor ?? MUTED, align: o.labelAlign ?? "center",
      fontFace: o.labelMono ? MONO : undefined, margin: 0, isTextBox: true });
  }
}

// Pastille ronde (le motif du deck : un pion).
function pawn(slide, x, y, d, color, text, size) {
  slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color }, line: { color }, objectName: "Pawn" });
  if (text !== undefined)
    slide.addText(String(text), { x, y, w: d, h: d, fontSize: size ?? Math.round(d * 30), bold: true,
      color: C.background1, align: "center", valign: "middle", margin: 0, isTextBox: true });
}

// Carte : pion de couleur + titre + texte.
function card(slide, x, y, w, h, head, body, color, o = {}) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.1,
    fill: { color: o.fill ?? C.background2 }, line: { color: o.fill ?? C.background2 }, objectName: `Card ${head}` });
  pawn(slide, x + 0.25, y + 0.27, 0.42, color, o.mark, 14);
  slide.addText(head, { x: x + 0.8, y: y + 0.2, w: w - 1.0, h: 0.56, fontSize: o.headSize ?? 17, bold: true,
    color: C.text1, valign: "middle", margin: 0, fontFace: THEME.headFontFace, isTextBox: true });
  slide.addText(body, { x: x + 0.25, y: y + 0.85, w: w - 0.5, h: h - 1.0, fontSize: o.size ?? 14,
    color: C.text1, valign: "top", margin: 0, paraSpaceAfter: 4, isTextBox: true });
}

// Liste à puces : items = string | [boldPrefix, rest]
function bullets(slide, items, { x, y, w, h, size = 15, color, gap = 6 }) {
  const runs = [];
  items.forEach((item, i) => {
    const last = i === items.length - 1;
    if (Array.isArray(item)) {
      runs.push({ text: item[0], options: { bold: true, bullet: true, color: color ?? C.text1 } });
      runs.push({ text: item[1], options: { breakLine: !last, color: color ?? C.text1 } });
    } else {
      runs.push({ text: item, options: { bullet: true, breakLine: !last, color: color ?? C.text1 } });
    }
  });
  slide.addText(runs, { x, y, w, h, fontSize: size, valign: "top", margin: 0, paraSpaceAfter: gap, isTextBox: true });
}

function table(slide, rows, { x, y, w, colW, size = 12, rowH = 0.34, headFill = C.text1 }) {
  const data = rows.map((row, r) => row.map(cell => {
    const isObj = cell && typeof cell === "object" && !Array.isArray(cell);
    const text = isObj ? cell.text : cell;
    const extra = isObj ? cell.options : {};
    return { text, options: {
      fontSize: size, color: r === 0 ? C.background1 : C.text1, bold: r === 0,
      fill: { color: r === 0 ? headFill : (r % 2 ? C.background1 : C.background2) },
      valign: "middle", margin: [0.03, 0.08, 0.03, 0.08], ...extra } };
  }));
  slide.addTable(data, { x, y, w, colW, rowH, border: { type: "solid", pt: 0.5, color: LINE } });
}

function note(slide, text, { x, y, w, h, size = 13, color = MUTED, italic = true }) {
  slide.addText(text, { x, y, w, h, fontSize: size, color, italic, valign: "top", margin: 0, isTextBox: true });
}

function sectionSlide(num, title, subtitle) {
  pres.addSection({ title });
  const s = pres.addSlide({ masterName: "SECTION", sectionTitle: title });
  pawn(s, 0.9, 2.85, 1.3, SEAT[(num - 1) % 4], num, 44);
  s.addText(title, { placeholder: "title" });
  s.addText(subtitle, { placeholder: "body" });
  return title;
}

/* ======================================================================= */
/*                                 SLIDES                                  */
/* ======================================================================= */

/* ---------- 1. titre */
pres.addSection({ title: "Introduction" });
{
  const s = pres.addSlide({ masterName: "TITLE", sectionTitle: "Introduction" });
  s.addText("Transcendence", { placeholder: "title" });
  s.addText("Un Tock à 4 joueurs en ligne — architecture, code et modules", { placeholder: "body" });
  SEAT.forEach((c, i) => pawn(s, 0.8 + i * 0.75, 1.45, 0.55, c));
  s.addText("Support de soutenance · ft_transcendence (sujet v21.1)", { x: 0.8, y: 6.4, w: 8, h: 0.4,
    fontSize: 14, color: "AEB8C4", margin: 0, isTextBox: true });
  s.addNotes("Présentation de l'équipe, puis la big picture, puis chaque couche du code, puis la grille d'évaluation et les modules.");
}

/* ---------- 2. sommaire */
{
  const s = addContent("Ce qu'on va voir", "Introduction");
  const parts = [
    ["La big picture", "Le jeu, la stack, l'architecture Docker / nginx"],
    ["Backend NestJS", "Auth, profil, amis, base de données"],
    ["Le moteur de jeu", "Plateau, cartes, règles, IA — du code pur"],
    ["Temps réel", "WebSockets, diffusion de l'état, déconnexions"],
    ["Frontend Next.js", "Pages, hooks, plateau, design system"],
    ["Grille & modules", "Exigences, points, ce qu'il reste à corriger"],
  ];
  parts.forEach(([head, sub], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.8 + col * 6.1, y = 1.6 + row * 1.7;
    pawn(s, x, y + 0.1, 0.8, SEAT[i % 4], i + 1, 26);
    s.addText(head, { x: x + 1.1, y: y + 0.02, w: 4.8, h: 0.5, fontSize: 22, bold: true,
      fontFace: THEME.headFontFace, color: C.text1, margin: 0, isTextBox: true });
    s.addText(sub, { x: x + 1.1, y: y + 0.52, w: 4.8, h: 0.45, fontSize: 15, color: MUTED, margin: 0, isTextBox: true });
  });
}

/* ======================================================= 1. BIG PICTURE */
let SEC = sectionSlide(1, "La big picture", "Ce que fait l'application et comment les morceaux s'emboîtent");

/* ---------- concept + stack */
{
  const s = addContent("Un Tock à 4 joueurs, jouable dans le navigateur", SEC);
  bullets(s, [
    ["4 joueurs, 4 pions chacun ", "sur un plateau de 72 cases ; 52 cartes, 5 par manche."],
    ["Les sièges vides ", "sont pris par des IA : on peut jouer seul ou entre amis."],
    ["Temps réel : ", "chaque coup est poussé à tous les joueurs par WebSocket."],
    ["Victoire : ", "le premier qui rentre ses 4 pions dans sa maison."],
    ["Autour du jeu : ", "comptes, profil + avatar, amis avec statut en ligne."],
  ], { x: 0.6, y: 1.5, w: 5.4, h: 4.8, size: 16, gap: 10 });
  table(s, [
    ["Couche", "Techno", "Pourquoi"],
    ["Frontend", "Next.js 16, React 19", "Routing par fichier, écosystème React"],
    ["Style", "Tailwind 4 + shadcn/ui", "Tokens de couleur, composants accessibles"],
    ["Backend", "NestJS 11 + socket.io", "Modules + injection, gateways WebSocket intégrées"],
    ["ORM / BDD", "Prisma 7 + PostgreSQL 18", "Schéma typé, migrations, contraintes"],
    ["Proxy", "nginx", "TLS + un seul point d'entrée"],
    ["Déploiement", "Docker Compose", "Tout démarre en une commande"],
  ], { x: 6.3, y: 1.55, w: 6.45, colW: [1.3, 2.25, 2.9], size: 12, rowH: 0.62 });
}

/* ---------- architecture */
{
  const s = addContent("Le navigateur ne parle qu'à nginx, qui aiguille selon l'URL", SEC);
  box(s, 4.9, 1.4, 3.5, 0.6, "Navigateur", { fill: C.text1, color: C.background1, bold: true, size: 16 });
  arrow(s, 6.65, 2.0, 6.65, 2.45, { label: "https://localhost:8443", lx: 6.8, lw: 2.6, labelAlign: "left", labelMono: true });
  box(s, 4.4, 2.45, 4.5, 0.75, [
    { text: "nginx", options: { bold: true, breakLine: true } },
    { text: "TLS 1.2 / 1.3, certificat auto-signé", options: { fontSize: 12 } }], { fill: C.accent1, color: C.background1, size: 16 });
  // routes
  arrow(s, 5.2, 3.2, 2.6, 4.2, { label: "/", lx: 3.1, ly: 3.5, lw: 1.2, labelMono: true, labelSize: 13 });
  arrow(s, 7.6, 3.2, 8.8, 4.2, { label: "/api/  et  /ws/", lx: 8.4, ly: 3.45, lw: 2.2, labelAlign: "left", labelMono: true, labelSize: 13 });
  box(s, 0.9, 4.2, 3.6, 1.0, [
    { text: "frontend", options: { bold: true, breakLine: true } },
    { text: "Next.js · :3000", options: { fontSize: 12, fontFace: MONO } }], { fill: C.background2, size: 16 });
  box(s, 7.2, 4.2, 4.6, 1.75, [
    { text: "backend", options: { bold: true, breakLine: true } },
    { text: "NestJS · :3001", options: { fontSize: 12, fontFace: MONO, breakLine: true } },
    { text: "Auth · Profile · Friends · Game", options: { fontSize: 12, breakLine: true } },
    { text: "└ engine/ : règles pures", options: { fontSize: 12 } }], { fill: C.background2, size: 16 });
  arrow(s, 9.5, 5.95, 9.5, 6.35, { label: "Prisma", lx: 9.65, lw: 1.2, labelAlign: "left" });
  box(s, 8.3, 6.35, 2.4, 0.55, "PostgreSQL", { fill: C.accent4, color: C.background1, bold: true });
  // légende
  note(s, "Front et back sont servis sur le même domaine : les cookies passent partout et il n'y a pas de CORS. Seul le backend touche la base.",
    { x: 0.9, y: 5.55, w: 5.6, h: 1.2, size: 14, italic: false, color: C.text1 });
  s.addNotes("nginx regarde le début de l'URL : /api/ et /ws/ vont au backend (avec l'upgrade WebSocket pour /ws/), tout le reste au frontend.");
}

/* ---------- docker */
{
  const s = addContent("Une seule commande : docker compose up --build", SEC);
  const services = [
    ["postgres", "Image officielle, volume db_data, healthcheck pg_isready", SEAT[2]],
    ["backend", "Attend postgres « healthy », puis migrate deploy → generate → start", SEAT[0]],
    ["frontend", "next dev, code monté en volume (rechargement à chaud)", C.accent1],
    ["nginx", "Génère le certificat avec openssl au build, écoute 443 → 8443", SEAT[3]],
  ];
  services.forEach(([head, body, color], i) => {
    const y = 1.5 + i * 1.3;
    pawn(s, 0.6, y + 0.15, 0.5, color);
    s.addText(head, { x: 1.3, y, w: 4.7, h: 0.45, fontSize: 18, bold: true, fontFace: MONO, color: C.text1, margin: 0, isTextBox: true });
    s.addText(body, { x: 1.3, y: y + 0.45, w: 4.7, h: 0.7, fontSize: 14, color: C.text1, margin: 0, valign: "top", isTextBox: true });
  });
  code(s, { x: 6.3, y: 1.45, w: 6.45, h: 3.3, file: "docker-compose.yml", lang: "yaml", size: 11.5,
    text: src("docker-compose.yml", [2, 6], [50, 53]) });
  code(s, { x: 6.3, y: 4.9, w: 6.45, h: 1.1, file: "backend/Dockerfile", lang: "yaml", size: 11,
    text: 'CMD ["sh", "-c", "npx prisma migrate deploy\n  && npx prisma generate && npm run start:dev"]' });
  note(s, "Sans le healthcheck, le backend lancerait les migrations sur une base pas encore prête.",
    { x: 6.3, y: 6.15, w: 6.45, h: 0.6, size: 13 });
}

/* ---------- principes */
{
  const s = addContent("Quatre principes guident tout le code", SEC);
  const items = [
    ["Le serveur fait autorité", "Le front envoie une intention (« cette carte, ce pion »). Le serveur la valide ou la refuse : aucune règle n'est appliquée côté client."],
    ["Le moteur est pur", "engine/ ne contient que des fonctions (état, action) → nouvel état. Ni Nest, ni Prisma, ni mutation : facile à tester et à relire."],
    ["La partie vit en mémoire", "Une Map dans GameService. La base ne garde que ce qui dure : comptes, profils, parties, participants, amitiés."],
    ["Un seul point d'entrée", "Tout passe par nginx en HTTPS. Les cookies httpOnly suivent les requêtes HTTP et le handshake WebSocket."],
  ];
  items.forEach(([head, body], i) => {
    const x = 0.6 + (i % 2) * 6.15, y = 1.5 + Math.floor(i / 2) * 2.65;
    card(s, x, y, 5.95, 2.4, head, body, SEAT[i], { size: 15, mark: i + 1 });
  });
}

/* ======================================================= 2. BACKEND */
SEC = sectionSlide(2, "Backend NestJS", "Un module par domaine, tout sous /api");

/* ---------- modules */
{
  const s = addContent("NestJS : un module par domaine, branchés dans AppModule", SEC);
  box(s, 5.15, 1.4, 3.0, 0.6, "AppModule", { fill: C.text1, color: C.background1, bold: true, size: 16 });
  const mods = [
    ["PrismaModule", ["PrismaService (global)", "connexion pg"], C.accent4],
    ["AuthModule", ["AuthController", "AuthService", "JwtModule (global)"], SEAT[0]],
    ["ProfileModule", ["ProfileController", "ProfileService", "avatar-storage"], SEAT[1]],
    ["FriendsModule", ["FriendsController", "FriendsGateway /friends", "PresenceService"], SEAT[3]],
    ["GameModule", ["GameController (HTTP)", "GameGateway (WS)", "GameService", "engine/ (pur)"], C.accent1],
  ];
  mods.forEach(([name, parts, color], i) => {
    const x = 0.6 + i * 2.48, y = 2.75;
    arrow(s, 6.65, 2.0, x + 1.12, y, { noHead: true, color: LINE, width: 1 });
    box(s, x, y, 2.25, 0.55, name, { fill: color, color: C.background1, bold: true, size: 14 });
    box(s, x, y + 0.65, 2.25, 1.25, parts.join("\n"), { fill: C.background2, size: 12, valign: "top", margin: 0.12 });
  });
  code(s, { x: 0.6, y: 5.2, w: 6.1, h: 1.6, file: "backend/src/main.ts", size: 11.5, text: src("backend/src/main.ts", [10, 12]) });
  bullets(s, [
    "Préfixe global /api : nginx n'a qu'une règle pour le backend.",
    "JwtModule global : JwtService injectable aussi dans les gateways WebSocket.",
    "Les avatars sont servis en statique, avec nosniff.",
  ], { x: 7.0, y: 5.25, w: 5.75, h: 1.6, size: 14 });
}

/* ---------- routes */
{
  const s = addContent("Les routes HTTP (toutes sous /api)", SEC);
  const ok = { text: "✔", options: { align: "center", color: C.accent4, bold: true } };
  const no = { text: "—", options: { align: "center", color: MUTED } };
  table(s, [
    ["Méthode", "Route", "Auth", "Rôle"],
    ["POST", "/auth/register", no, "Crée le user et un profil vide"],
    ["POST", "/auth/login", no, "Pose les cookies jwt + refresh_token"],
    ["POST", "/auth/refresh", "cookie", "Rotation des deux tokens"],
    ["PATCH", "/auth/password", ok, "Change le mot de passe"],
    ["POST", "/auth/logout", ok, "Révoque le refresh token"],
    ["GET", "/profile", ok, "Profil + stats (amis, parties)"],
    ["PATCH", "/profile", ok, "Pseudo, bio"],
    ["POST", "/profile/avatar", ok, "Upload (2 Mo max)"],
    ["DELETE", "/profile/avatar", ok, "Retour à l'avatar par défaut"],
  ], { x: 0.6, y: 1.5, w: 6.3, colW: [0.95, 1.9, 0.75, 2.7], size: 12, rowH: 0.42 });
  table(s, [
    ["Méthode", "Route", "Rôle"],
    ["GET", "/friends", "Amis, demandes reçues / envoyées"],
    ["POST", "/friends/requests", "Demande par pseudo"],
    ["POST", "/friends/requests/:id/accept", "Accepter"],
    ["DELETE", "/friends/:id", "Retirer / refuser"],
    ["POST", "/game", "Crée une partie (siège 0)"],
    ["POST", "/game/join/:inviteCode", "Rejoint une partie"],
    ["POST", "/game/start/:gameId", "L'hôte lance, IA en renfort"],
  ], { x: 7.15, y: 1.5, w: 5.6, colW: [0.95, 2.45, 2.2], size: 12, rowH: 0.42 });
  note(s, "Amis et jeu : tout est protégé par AuthGuard. Les routes de jeu ne renvoient jamais l'état de la partie : il arrive toujours par WebSocket.",
    { x: 7.15, y: 5.15, w: 5.6, h: 1.2, size: 13 });
}

/* ---------- auth login */
{
  const s = addContent("Login : bcrypt pour le mot de passe, deux JWT en cookies", SEC);
  const steps = [
    ["POST /api/auth/login", C.text1],
    ["findUnique({ email })", C.accent1],
    ["bcrypt.compare(mdp, hash)", C.accent1],
    ["createSession(userId)", SEAT[1]],
    ["Set-Cookie jwt (15 min)\nSet-Cookie refresh_token (7 j)", SEAT[2]],
  ];
  steps.forEach(([t, color], i) => {
    const y = 1.5 + i * 1.02;
    box(s, 0.6, y, 4.3, i === 4 ? 0.85 : 0.7, t, { fill: color, color: C.background1, mono: true, size: 12.5 });
    if (i < steps.length - 1) arrow(s, 2.75, y + 0.7, 2.75, y + 1.02);
  });
  code(s, { x: 5.25, y: 1.45, w: 7.5, h: 5.35, file: "backend/src/auth/auth.service.ts", size: 11.5,
    text: src("backend/src/auth/auth.service.ts", [26, 28], [44, 58]) });
  s.addNotes("bcrypt génère un sel aléatoire par mot de passe (genSalt(10) = 2^10 tours). Le sel est stocké dans le hash lui-même : compare() le relit. Même message d'erreur que l'email ou le mot de passe soit faux.");
}

/* ---------- refresh */
{
  const s = addContent("Refresh token : rotation à chaque usage, révocable en base", SEC);
  code(s, { x: 0.6, y: 1.45, w: 6.6, h: 5.35, file: "backend/src/auth/auth.service.ts", size: 11.5,
    text: src("backend/src/auth/auth.service.ts", [11, 13], [86, 95], [97, 100]) });
  card(s, 7.5, 1.45, 5.25, 1.6, "Stocké haché", "Seul le SHA-256 du refresh token est en base (User.hashedRefreshToken). Logout = on le met à null.", SEAT[0], { size: 14 });
  card(s, 7.5, 3.2, 5.25, 1.6, "Pourquoi pas bcrypt ici ?", "bcrypt ne lit que 72 octets : tous les JWT d'un même user commencent pareil. timingSafeEqual évite les attaques temporelles.", SEAT[1], { size: 14 });
  card(s, 7.5, 4.95, 5.25, 1.85, "Côté front", "fetchWithRefresh : sur un 401, appelle /auth/refresh une seule fois (promesse partagée), puis rejoue la requête.", SEAT[2], { size: 14 });
}

/* ---------- guard + cookies */
{
  const s = addContent("AuthGuard : le JWT est lu dans un cookie httpOnly", SEC);
  code(s, { x: 0.6, y: 1.45, w: 6.2, h: 3.4, file: "backend/src/auth/guards/jwt-auth.guard.ts", size: 11.5,
    text: src("backend/src/auth/guards/jwt-auth.guard.ts", [9, 21]) });
  code(s, { x: 0.6, y: 5.0, w: 6.2, h: 1.8, file: "backend/src/auth/cookies.ts", size: 11.5,
    text: src("backend/src/auth/cookies.ts", [3, 7]) });
  const flags = [
    ["httpOnly", "Le JavaScript de la page ne peut pas lire le token : une faille XSS ne permet pas de le voler."],
    ["secure", "Le cookie ne part qu'en HTTPS."],
    ["sameSite: strict", "Pas envoyé depuis un autre site : protège du CSRF."],
    ["WebSocket", "Même vérification au handshake : readCookie(headers.cookie, 'jwt') puis jwtService.verify."],
  ];
  flags.forEach(([head, body], i) => {
    const y = 1.5 + i * 1.3;
    pawn(s, 7.15, y + 0.05, 0.4, SEAT[i]);
    s.addText(head, { x: 7.75, y, w: 5.0, h: 0.42, fontSize: 16, bold: true, fontFace: MONO, color: C.text1, margin: 0, isTextBox: true });
    s.addText(body, { x: 7.75, y: y + 0.42, w: 5.0, h: 0.8, fontSize: 14, color: C.text1, margin: 0, valign: "top", isTextBox: true });
  });
}

/* ---------- profile + avatar */
{
  const s = addContent("Profil et avatar : on vérifie le contenu, pas le nom du fichier", SEC);
  code(s, { x: 0.6, y: 1.45, w: 7.1, h: 3.15, file: "backend/src/profile/avatar-storage.ts", size: 10.5,
    text: src("backend/src/profile/avatar-storage.ts", [11, 23]) });
  code(s, { x: 0.6, y: 4.75, w: 7.1, h: 2.05, file: "backend/src/profile/profile.service.ts", size: 11,
    text: src("backend/src/profile/profile.service.ts", [7, 8], [47, 50]) });
  bullets(s, [
    ["Magic bytes : ", "le type est lu dans les premiers octets ; le mimetype envoyé peut mentir."],
    ["Pas de SVG : ", "il peut contenir du JavaScript."],
    ["Nom aléatoire ", "(userId-UUID) et basename() à la suppression : pas de path traversal."],
    ["2 Mo max ", "(limite de multer) ; l'ancien fichier est supprimé."],
    ["Pseudo unique : ", "l'erreur Prisma P2002 devient un 409 lisible."],
    ["Avatar par défaut : ", "les initiales du pseudo (AvatarFallback)."],
  ], { x: 8.0, y: 1.5, w: 4.75, h: 5.3, size: 14, gap: 8 });
}

/* ---------- friends */
{
  const s = addContent("Amis : des demandes croisées sans course", SEC);
  code(s, { x: 0.6, y: 1.45, w: 7.4, h: 4.15, file: "backend/src/friends/friends.service.ts", size: 10.5,
    text: src("backend/src/friends/friends.service.ts", [91, 105]) });
  // schéma A <-> B
  box(s, 8.3, 1.5, 1.4, 0.6, "A", { fill: SEAT[0], color: C.background1, bold: true, size: 18 });
  box(s, 11.35, 1.5, 1.4, 0.6, "B", { fill: SEAT[2], color: C.background1, bold: true, size: 18 });
  arrow(s, 9.7, 1.7, 11.35, 1.7, { label: "demande → pending", ly: 1.3, lx: 9.4, lw: 2.2, labelSize: 11 });
  arrow(s, 11.35, 1.95, 9.7, 1.95, { label: "B demande A → accepted", ly: 2.05, lx: 9.3, lw: 2.5, labelSize: 11 });
  bullets(s, [
    ["Course : ", "A et B s'ajoutent au même instant. Postgres refuse une des deux transactions ; rejouée (3 essais max), elle accepte la demande de l'autre."],
    ["Présence : ", "PresenceService compte les sockets par user. En ligne au 1er onglet, hors ligne au dernier."],
    ["Temps réel : ", "chaque changement émet friends-changed dans la room user-<id> ; le front recharge la liste."],
  ], { x: 8.3, y: 2.65, w: 4.45, h: 4.2, size: 14, gap: 8 });
  code(s, { x: 0.6, y: 5.75, w: 7.4, h: 1.05, file: "backend/prisma/schema.prisma", size: 11,
    text: src("backend/prisma/schema.prisma", [72, 73]) });
}

/* ---------- DB schema */
{
  const s = addContent("Base de données : 5 modèles Prisma, relations explicites", SEC);
  const model = (x, y, w, name, fields, color) => {
    box(s, x, y, w, 0.5, name, { fill: color, color: C.background1, bold: true, size: 15, radius: 0.05 });
    box(s, x, y + 0.5, w, fields.length * 0.29 + 0.2, fields.join("\n"), { fill: C.background2, size: 11.5,
      mono: true, align: "left", valign: "top", margin: [0.1, 0.12, 0.05, 0.12], radius: 0.05 });
  };
  model(4.75, 1.45, 3.4, "User", ["id          PK", "name        unique", "email       unique", "password    bcrypt",
    "hashedRefreshToken?", "isAdmin", "createdAt / updatedAt"], C.text1);
  model(0.6, 1.45, 3.0, "Profile", ["userId   unique FK", "bio?", "avatarUrl?"], SEAT[1]);
  model(9.3, 1.45, 3.45, "Friendship", ["id            PK", "requesterId   FK", "addresseeId   FK",
    "status  pending|accepted", "@@unique(requester,", "         addressee)"], SEAT[3]);
  model(4.75, 4.6, 3.4, "GamePlayer", ["idPlayer  PK", "gameId    FK", "userId    FK", "seat 0..3"], SEAT[0]);
  model(9.3, 4.6, 3.45, "Game", ["idGame      PK", "inviteCode  unique", "phase  waiting|playing|", "       finished",
    "winnerSeat?  finishedAt?"], C.accent1);
  arrow(s, 3.6, 2.0, 4.75, 2.0, { noHead: true, color: C.text1, label: "1 — 1", ly: 1.65, lx: 3.55, lw: 1.25 });
  arrow(s, 8.15, 2.3, 9.3, 2.3, { noHead: true, color: C.text1, label: "1 — * (×2)", ly: 1.95, lx: 8.0, lw: 1.45 });
  arrow(s, 6.45, 3.95, 6.45, 4.6, { noHead: true, color: C.text1, label: "1 — *", lx: 6.6, lw: 1, labelAlign: "left" });
  arrow(s, 8.15, 5.0, 9.3, 5.0, { noHead: true, color: C.text1, label: "* — 1", ly: 4.65, lx: 8.1, lw: 1.25 });
  note(s, "La base ne contient pas les pions ni les cartes : l'état d'une partie en cours vit en mémoire. Les IA ne sont pas stockées (pas de compte).",
    { x: 0.6, y: 3.2, w: 3.8, h: 2.0, size: 14, italic: false, color: C.text1 });
  note(s, "Migrations versionnées dans backend/prisma/migrations, appliquées au démarrage (migrate deploy).",
    { x: 0.6, y: 5.4, w: 3.8, h: 1.2, size: 13 });
}

/* ======================================================= 3. ENGINE */
SEC = sectionSlide(3, "Le moteur de jeu", "backend/src/game/engine — des fonctions pures, sans Nest ni base");

/* ---------- board */
{
  const s = addContent("Le plateau : 72 cases en numérotation absolue", SEC);
  const cx = 3.5, cy = 4.15, r = 2.2, d = 0.13;
  const posOf = (cell, rad = r) => {
    const a = Math.PI / 2 + (cell / 72) * 2 * Math.PI; // case 0 en bas, sens horaire à l'écran
    return [cx + rad * Math.cos(a), cy + rad * Math.sin(a)];
  };
  for (let cell = 0; cell < 72; cell++) {
    const seat = cell % 18 === 0 ? cell / 18 : null;
    const [px, py] = posOf(cell);
    const size = seat !== null ? 0.3 : d;
    s.addShape(pres.shapes.OVAL, { x: px - size / 2, y: py - size / 2, w: size, h: size,
      fill: { color: seat !== null ? SEAT[seat] : "B9B1A0" }, line: { color: seat !== null ? SEAT[seat] : "B9B1A0" } });
  }
  for (let seat = 0; seat < 4; seat++) {
    const entry = (seat * 18 - 3 + 72) % 72;
    for (let k = 1; k <= 4; k++) {
      const [hx, hy] = posOf(entry, r - k * 0.3);
      s.addShape(pres.shapes.RECTANGLE, { x: hx - 0.09, y: hy - 0.09, w: 0.18, h: 0.18,
        fill: { color: SEAT[seat], transparency: 35 }, line: { color: SEAT[seat] } });
    }
    const [lx, ly] = posOf(seat * 18, r + 0.5);
    s.addText(`S${seat} : ${seat * 18}`, { x: lx - 0.6, y: ly - 0.17, w: 1.2, h: 0.34, fontSize: 12, bold: true,
      color: SEAT[seat], align: "center", margin: 0, isTextBox: true });
  }
  s.addText("sortie (grand rond)\nmaison (4 carrés)", { x: cx - 1.0, y: cy - 0.35, w: 2.0, h: 0.7, fontSize: 11,
    color: MUTED, align: "center", margin: 0, isTextBox: true });
  code(s, { x: 7.0, y: 1.45, w: 5.75, h: 3.65, file: "engine/board.ts", size: 11.5,
    text: src("backend/src/game/engine/board.ts", [13, 16], [78, 90]) });
  bullets(s, [
    "La même numérotation pour tout le monde : c'est le front qui tourne le plateau.",
    "mod() fait boucler 71 → 0, y compris en arrière (le 4).",
    "Pion : { zone: 'spawn' } | { zone: 'board', cell } | { zone: 'home', cell }.",
  ], { x: 7.0, y: 5.25, w: 5.75, h: 1.6, size: 14 });
}

/* ---------- types */
{
  const s = addContent("Tout le jeu tient dans quelques types", SEC);
  code(s, { x: 0.6, y: 1.45, w: 7.3, h: 5.35, file: "backend/src/game/game.types.ts", size: 11.5,
    text: src("backend/src/game/game.types.ts", [10, 10], [31, 34], [83, 90], [96, 101]) });
  card(s, 8.2, 1.45, 4.55, 1.65, "Des ids, jamais des cases", "Une action dit « quelle carte, quel pion ». Le serveur recalcule seul où il arrive.", SEAT[0], { size: 14 });
  card(s, 8.2, 3.25, 4.55, 1.65, "Union discriminée", "Le champ type permet à TypeScript de vérifier chaque cas du switch.", SEAT[1], { size: 14 });
  card(s, 8.2, 5.05, 4.55, 1.75, "Une seule source", "game.types.ts est copié dans le front (gameTypes.ts) : les deux côtés parlent le même langage.", SEAT[2], { size: 14 });
}

/* ---------- cards */
{
  const s = addContent("Les cartes : ce que fait chaque valeur", SEC);
  table(s, [
    ["Carte", "Effet", "Type d'action"],
    ["As (1), Roi (13)", "Sortir un pion du spawn, ou avancer", "exit / move"],
    ["4", "Reculer de 4 cases", "move (valeur −4)"],
    ["5", "Faire avancer un pion adverse", "move"],
    ["7", "Répartir 7 pas entre ses pions, capture sur le passage", "split (un emit par morceau)"],
    ["Valet (11)", "Échanger deux pions du plateau, n'avance jamais", "swap"],
    ["Autres", "Avancer du nombre de cases", "move / enter"],
    ["Injouable", "Défausser la carte", "discard"],
  ], { x: 0.6, y: 1.5, w: 7.4, colW: [1.6, 3.6, 2.2], size: 13, rowH: 0.55 });
  code(s, { x: 8.3, y: 1.45, w: 4.45, h: 2.2, file: "engine/deck.ts", size: 11.5,
    text: src("backend/src/game/engine/deck.ts", [16, 21]) });
  code(s, { x: 8.3, y: 3.8, w: 4.45, h: 2.3, file: "engine/deck.ts", size: 11,
    text: src("backend/src/game/engine/deck.ts", [40, 45]) });
  note(s, "realValueOf est utilisé par la validation ET par l'application du coup : elles ne peuvent pas diverger.",
    { x: 0.6, y: 6.1, w: 7.4, h: 0.7, size: 13 });
  note(s, "Mélange Fisher-Yates : chaque ordre a la même probabilité.", { x: 8.3, y: 6.2, w: 4.45, h: 0.6, size: 13 });
}

/* ---------- playTurn */
{
  const s = addContent("playTurn : un coup, du contrôle à la redistribution", SEC);
  const steps = [["isLegal", "refusé → null"], ["applyAction", "pions + captures"], ["playCard", "main → défausse"],
    ["checkWinner", "4 pions en maison"], ["nextSeat", "joueur suivant"], ["startRound ?", "mains vides → redonne"]];
  steps.forEach(([name, sub], i) => {
    const x = 0.6 + i * 2.05;
    box(s, x, 1.5, 1.8, 0.95, [{ text: name, options: { bold: true, fontFace: MONO, fontSize: 13, breakLine: true } },
      { text: sub, options: { fontSize: 11 } }], { fill: i === 0 ? SEAT[0] : C.background2, color: i === 0 ? C.background1 : C.text1 });
    if (i < steps.length - 1) arrow(s, x + 1.8, 1.97, x + 2.05, 1.97);
  });
  code(s, { x: 0.6, y: 2.75, w: 7.6, h: 4.05, file: "engine/state.ts", size: 11,
    text: src("backend/src/game/engine/state.ts", [117, 118], [120, 120], [132, 138], [150, 157]) });
  bullets(s, [
    ["Retourne { game, event } ", "ou null : jamais de mutation, l'ancien état reste intact."],
    ["event ", "dit ce qui vient de se passer (qui, quelle action, quels pions capturés, nouvelle manche) : le front s'en sert pour animer."],
    ["Le 7 ", "garde la main au même joueur tant qu'il reste des pas jouables (pendingSplit)."],
  ], { x: 8.5, y: 2.8, w: 4.25, h: 4.0, size: 14, gap: 8 });
}

/* ---------- legality */
{
  const s = addContent("Une seule source de vérité : getLegalActions", SEC);
  box(s, 4.6, 1.5, 4.1, 0.75, "getLegalActions(main, pions, siège)", { fill: C.text1, color: C.background1, mono: true, size: 13 });
  const uses = [["isLegal", "valide l'action reçue du client", SEAT[0]], ["chooseAIAction", "l'IA tire parmi ces coups", SEAT[1]],
    ["viewFor → legalMoves", "le front affiche les coups possibles", SEAT[2]]];
  uses.forEach(([name, sub, color], i) => {
    const x = 0.6 + i * 4.15;
    arrow(s, 6.65, 2.25, x + 1.9, 2.85);
    box(s, x, 2.85, 3.8, 0.95, [{ text: name, options: { bold: true, fontFace: MONO, breakLine: true } },
      { text: sub, options: { fontSize: 12 } }], { fill: color, color: C.background1, size: 14 });
  });
  code(s, { x: 0.6, y: 4.05, w: 7.2, h: 2.75, file: "engine/legalMoves.ts", size: 11,
    text: src("backend/src/game/engine/legalMoves.ts", [114, 122]) });
  note(s, "On ne réimplémente jamais les règles pour valider : l'action reçue doit être identique (mêmes ids) à un des coups générés. Le client ne peut donc rien inventer.",
    { x: 8.1, y: 4.1, w: 4.65, h: 2.6, size: 15, italic: false, color: C.text1 });
}

/* ---------- rules: block + capture */
{
  const s = addContent("Blocages et captures", SEC);
  code(s, { x: 0.6, y: 1.45, w: 6.3, h: 3.6, file: "engine/rules.ts", size: 11,
    text: src("backend/src/game/engine/rules.ts", [19, 35]) });
  code(s, { x: 7.15, y: 1.45, w: 5.6, h: 2.45, file: "engine/apply.ts", size: 11,
    text: src("backend/src/game/engine/apply.ts", [28, 34]) });
  card(s, 0.6, 5.25, 6.3, 1.55, "Blocage", "Un pion posé sur sa propre case de sortie bloque le passage à tous les autres pions.", SEAT[0], { size: 14 });
  card(s, 7.15, 4.1, 5.6, 1.45, "Capture", "Finir sur une case occupée renvoie l'occupant au spawn, même si c'est un de ses pions.", SEAT[1], { size: 14 });
  card(s, 7.15, 5.7, 5.6, 1.1, "Le 7", "Capture tout sur son chemin (captureAlongPath).", SEAT[2], { size: 14, headSize: 15 });
}

/* ---------- split */
{
  const s = addContent("Le 7 : un coup découpé en morceaux", SEC);
  code(s, { x: 0.6, y: 1.45, w: 6.9, h: 3.4, file: "engine/split.ts", size: 11,
    text: src("backend/src/game/engine/split.ts", [70, 70], [73, 86]) });
  code(s, { x: 0.6, y: 5.0, w: 6.9, h: 1.8, file: "engine/state.ts", size: 11,
    text: src("backend/src/game/engine/state.ts", [143, 148]) });
  const flow = ["Choisir un pion et un nombre de pas (1..restant)", "Émettre { type: 'split', steps }",
    "Le serveur simule le morceau (simulateSplitStep)", "pendingSplit.left diminue, même joueur", "Plus rien de jouable : pas restants perdus"];
  flow.forEach((t, i) => {
    const y = 1.5 + i * 1.07;
    pawn(s, 7.85, y + 0.1, 0.5, SEAT[i % 4], i + 1, 15);
    s.addText(t, { x: 8.55, y: y, w: 4.2, h: 0.7, fontSize: 14, color: C.text1, valign: "middle", margin: 0, isTextBox: true });
  });
}

/* ---------- AI */
{
  const s = addContent("L'IA : un coup légal, joué par une boucle côté serveur", SEC);
  code(s, { x: 0.6, y: 1.45, w: 7.2, h: 1.95, file: "engine/AI.ts", size: 11,
    text: src("backend/src/game/engine/AI.ts", [7, 8], [10, 12]) });
  code(s, { x: 0.6, y: 3.55, w: 7.2, h: 3.25, file: "backend/src/game/game.service.ts", size: 11,
    text: src("backend/src/game/game.service.ts", [182, 194]) });
  bullets(s, [
    ["Délai humain : ", "1 à 3 s aléatoires avant chaque coup, le même rythme pour tous les joueurs."],
    ["Un commit par coup : ", "les joueurs voient chaque coup des bots."],
    ["Une seule boucle par partie ", "(Set botLoops) : deux bots ne jouent jamais le même tour."],
    ["La partie est relue ", "après chaque pause : un joueur a pu revenir ou partir."],
  ], { x: 8.1, y: 1.5, w: 4.65, h: 3.6, size: 14, gap: 8 });
  box(s, 8.1, 5.0, 4.65, 1.8, "À savoir pour la soutenance : l'IA choisit au hasard parmi les coups légaux. Le module « AI Opponent » exige une IA qui peut gagner et qui imite un humain.",
    { fill: "FBEDE8", line: SEAT[0], size: 13.5, align: "left", margin: 0.15 });
}

/* ======================================================= 4. TEMPS RÉEL */
SEC = sectionSlide(4, "Temps réel", "socket.io derrière nginx, sur /ws/socket.io");

/* ---------- sequence */
{
  const s = addContent("Le trajet d'un clic, du navigateur aux 4 joueurs", SEC);
  const lanes = [["Front", C.accent1], ["Gateway", SEAT[3]], ["Service", SEAT[1]], ["Engine", SEAT[2]], ["Autres clients", SEAT[0]]];
  const lx = i => 1.35 + i * 2.6;
  lanes.forEach(([name, color], i) => {
    box(s, lx(i) - 1.0, 1.4, 2.0, 0.5, name, { fill: color, color: C.background1, bold: true, size: 13 });
    arrow(s, lx(i), 1.9, lx(i), 6.85, { noHead: true, color: LINE, width: 1, dash: true });
  });
  const msgs = [
    [0, 1, "emit('action')"],
    [1, 2, "playAction : son tour ?"],
    [2, 3, "playTurn(...)"],
    [3, 2, "{ game, event } ou null"],
    [2, 2, "commit : Map.set + broadcast"],
    [2, 4, "emit('state', viewFor(...))"],
    [2, 0, "ack { ok } / { error }"],
    [2, 2, "runBots : un coup / 1-3 s"],
  ];
  msgs.forEach(([from, to, label], i) => {
    const y = 2.2 + i * 0.58;
    if (from === to) {
      box(s, lx(from) - 1.15, y - 0.17, 2.3, 0.36, label, { fill: C.background2, size: 10.5, mono: true });
      return;
    }
    arrow(s, lx(from), y + 0.1, lx(to), y + 0.1, { color: C.text1 });
    const left = Math.min(lx(from), lx(to));
    s.addText(label, { x: left + 0.1, y: y - 0.22, w: Math.abs(lx(to) - lx(from)) - 0.2, h: 0.28, fontSize: 10.5,
      fontFace: MONO, color: C.text1, align: "center", margin: 0, isTextBox: true });
  });
  s.addNotes("Le clic n'attend pas le nouvel état dans la réponse : l'ack dit juste ok/erreur. L'état arrive à TOUT le monde (y compris l'auteur du coup) via le message 'state'. Le front n'a donc qu'une seule façon de se mettre à jour.");
}

/* ---------- gateway */
{
  const s = addContent("GameGateway : authentifie le socket, diffuse l'état", SEC);
  code(s, { x: 0.6, y: 1.45, w: 7.4, h: 5.35, file: "backend/src/game/game.gateway.ts", size: 11,
    text: src("backend/src/game/game.gateway.ts", [13, 13], [20, 28], [32, 45]) });
  card(s, 8.3, 1.45, 4.45, 1.7, "Une room par user", "user-<id> : tous les onglets d'un joueur reçoivent l'état.", SEAT[0], { size: 14 });
  card(s, 8.3, 3.3, 4.45, 1.75, "Service découplé", "GameService ne connaît pas socket.io : la gateway lui injecte une fonction broadcast.", SEAT[1], { size: 14 });
  card(s, 8.3, 5.2, 4.45, 1.6, "Jeton expiré ?", "Socket coupé ; le front appelle /auth/refresh puis se reconnecte.", SEAT[2], { size: 14 });
}

/* ---------- commit + viewFor */
{
  const s = addContent("commit + viewFor : un état, quatre vues filtrées", SEC);
  code(s, { x: 0.6, y: 1.45, w: 6.4, h: 1.8, file: "game.service.ts", size: 11.5,
    text: src("backend/src/game/game.service.ts", [33, 37]) });
  code(s, { x: 0.6, y: 3.4, w: 6.4, h: 3.4, file: "engine/view.ts", size: 11,
    text: src("backend/src/game/engine/view.ts", [25, 37]) });
  arrow(s, 10.0, 2.2, 10.0, 2.7, { label: "viewFor(game, siège) × 4", lx: 10.15, lw: 2.6, labelAlign: "left", labelMono: true });
  box(s, 8.4, 1.5, 3.2, 0.7, "Game (serveur)", { fill: C.text1, color: C.background1, bold: true, size: 15 });
  for (let i = 0; i < 4; i++) {
    const y = 2.75 + i * 0.95;
    box(s, 7.35, y, 5.4, 0.65, `Siège ${i} : sa main · handCount des autres`, { fill: SEAT[i], color: C.background1, size: 13 });
  }
  note(s, "La pioche et les mains adverses ne quittent jamais le serveur : impossible de tricher en lisant le réseau.",
    { x: 7.35, y: 6.6, w: 5.4, h: 0.5, size: 12 });
}

/* ---------- protocol */
{
  const s = addContent("Le protocole WebSocket complet", SEC);
  table(s, [
    ["Sens", "Message", "Contenu", "Quand"],
    ["serveur → client", "state", "{ state: GameView, event: GameEvent | null }", "À chaque commit, et en réponse à sync"],
    ["serveur → client", "no-game", "—", "sync alors que le joueur n'a pas de partie"],
    ["client → serveur", "sync", "—", "Arrivée sur une page de jeu, reconnexion"],
    ["client → serveur", "action", "{ gameId, action } + ack { ok } | { error }", "Le joueur joue"],
    ["serveur → client", "friends-changed", "— (namespace /friends)", "Demande, acceptation, suppression, connexion d'un ami"],
  ], { x: 0.6, y: 1.5, w: 12.15, colW: [1.9, 1.85, 4.3, 4.1], size: 13, rowH: 0.6 });
  bullets(s, [
    ["state est la vérité : ", "le front affiche exactement ce qu'il reçoit."],
    ["event n'est qu'un indice ", "pour animer ; il vaut null quand rien n'a été joué (sync)."],
  ], { x: 0.6, y: 5.95, w: 12.15, h: 0.9, size: 15 });
}

/* ---------- disconnect */
{
  const s = addContent("Déconnexion : délai de grâce, puis l'IA prend le relais", SEC);
  const steps = [["Dernier onglet fermé", "handleDisconnect"], ["Délai de grâce", "un refresh n'est pas un départ"],
    ["isConnected = false", "commit → les autres le voient"], ["L'IA joue pour lui", "isBotControlled(player)"], ["Il revient", "connexion → sync → il reprend"]];
  steps.forEach(([head, sub], i) => {
    const x = 0.6 + i * 2.48;
    box(s, x, 1.5, 2.2, 1.1, [{ text: head, options: { bold: true, breakLine: true } }, { text: sub, options: { fontSize: 11 } }],
      { fill: SEAT[i % 4], color: C.background1, size: 13 });
    if (i < steps.length - 1) arrow(s, x + 2.2, 2.05, x + 2.48, 2.05);
  });
  code(s, { x: 0.6, y: 2.9, w: 7.3, h: 3.9, file: "backend/src/game/game.service.ts", size: 10.5,
    text: src("backend/src/game/game.service.ts", [224, 230], [245, 253]) });
  card(s, 8.2, 2.9, 4.55, 1.85, "Plus aucun humain ?", "abandonGame : phase finished, winnerSeat null. Différent d'une victoire.", SEAT[0], { size: 14 });
  card(s, 8.2, 4.9, 4.55, 1.9, "Multi-onglets", "La gateway ne prévient le service que si plus aucun socket du user n'est dans sa room.", SEAT[1], { size: 14 });
}

/* ======================================================= 5. FRONTEND */
SEC = sectionSlide(5, "Frontend Next.js", "Pages Router, hooks, plateau animé, design system");

/* ---------- pages */
{
  const s = addContent("Les pages et le parcours d'un joueur", SEC);
  const p = (x, y, t, color, w = 1.9) => box(s, x, y, w, 0.6, t, { fill: color ?? C.background2, color: color ? C.background1 : C.text1, mono: true, size: 13, bold: !!color });
  p(0.6, 2.2, "/login", C.accent1); p(0.6, 3.3, "/register");
  arrow(s, 1.55, 2.8, 1.55, 3.3, { both: true });
  p(3.3, 2.2, "/menu", C.text1);
  arrow(s, 2.5, 2.5, 3.3, 2.5);
  p(6.1, 1.6, "POST /api/game", SEAT[1], 2.4); p(6.1, 2.8, "/join-game");
  arrow(s, 5.2, 2.35, 6.1, 1.9); arrow(s, 5.2, 2.65, 6.1, 3.1);
  p(9.0, 2.2, "/lobby", SEAT[2]);
  arrow(s, 8.5, 1.9, 9.0, 2.35); arrow(s, 8.0, 3.1, 9.0, 2.65);
  p(11.0, 2.2, "/play", SEAT[0], 1.75);
  arrow(s, 10.9, 2.5, 11.0, 2.5);
  p(3.3, 3.8, "/profile"); p(3.3, 4.6, "/friends"); p(3.3, 5.4, "/rules");
  arrow(s, 4.25, 2.8, 4.25, 3.8);
  p(0.6, 5, "/privacy"); p(0.6, 5.8, "/terms");
  note(s, "liens du footer, sur toutes les pages", { x: 0.6, y: 6.5, w: 2.6, h: 0.6, size: 12 });
  bullets(s, [
    ["Pages Router : ", "un fichier de src/pages = une route. / redirige vers /login."],
    ["Lobby en temps réel : ", "useGame reçoit chaque join ; dès que l'hôte lance, tout le monde part sur /play."],
    ["Responsive : ", "classes md: de Tailwind, et le plateau est le plus grand carré qui tient (container queries, min(100cqw, 100cqh))."],
  ], { x: 6.1, y: 3.9, w: 6.65, h: 2.9, size: 15, gap: 10 });
}

/* ---------- useGame */
{
  const s = addContent("useGame : un socket partagé, l'état poussé par le serveur", SEC);
  code(s, { x: 0.6, y: 1.45, w: 6.0, h: 3.5, file: "frontend/src/game/socket.ts", size: 11,
    text: src("frontend/src/game/socket.ts", [12, 33]).split("\n").filter(l => !l.trim().startsWith("//")).join("\n") });
  code(s, { x: 6.85, y: 1.45, w: 5.9, h: 3.5, file: "frontend/src/game/useGame.ts", size: 11,
    text: src("frontend/src/game/useGame.ts", [39, 42], [55, 63]).split("\n").filter(l => !l.trim().startsWith("//")).join("\n") });
  const pts = [["Singleton", "Créé au premier usage seulement : Next rend aussi les pages côté serveur, sans navigateur."],
    ["Resynchro", "À chaque (re)connexion, le client émet sync et récupère l'état complet."],
    ["Pas de calcul", "setGame(message.state) : le front affiche, il ne déduit rien."]];
  pts.forEach(([h, b], i) => card(s, 0.6 + i * 4.1, 5.15, 3.9, 1.65, h, b, SEAT[i], { size: 13, headSize: 16 }));
}

/* ---------- useTurnChoice */
{
  const s = addContent("useTurnChoice : carte → pion → case, sans connaître les règles", SEC);
  const steps = [["1. Carte", "filtre legalMoves par cardId"], ["2. Pion", "pions présents dans ces coups"], ["3. Case", "seulement s'il y a plusieurs destinations"], ["emit", "send(action)"]];
  steps.forEach(([h, b], i) => {
    const x = 0.6 + i * 3.1;
    box(s, x, 1.5, 2.75, 0.95, [{ text: h, options: { bold: true, breakLine: true } }, { text: b, options: { fontSize: 11.5 } }],
      { fill: i === 3 ? C.text1 : SEAT[i], color: C.background1, size: 15 });
    if (i < 3) arrow(s, x + 2.75, 1.97, x + 3.1, 1.97);
  });
  code(s, { x: 0.6, y: 2.7, w: 7.5, h: 4.1, file: "frontend/src/game/useTurnChoice.ts", size: 11,
    text: src("frontend/src/game/useTurnChoice.ts", [85, 89], [91, 96], [115, 120]) });
  bullets(s, [
    "Tout vient de game.legalMoves, calculé par le serveur pour ce joueur.",
    "Un seul coup possible ? Il part directement, sans clic de plus.",
    "Le Valet : premier pion, puis le pion avec lequel l'échanger.",
    "Une erreur du serveur (ack { error }) s'affiche sous les contrôles.",
  ], { x: 8.4, y: 2.75, w: 4.35, h: 4.0, size: 14, gap: 8 });
}

/* ---------- board rendering */
{
  const s = addContent("Chaque joueur voit le plateau depuis sa place", SEC);
  code(s, { x: 0.6, y: 1.45, w: 6.6, h: 2.0, file: "frontend/src/components/game/Board.tsx", size: 11,
    text: src("frontend/src/components/game/Board.tsx", [35, 39]) });
  code(s, { x: 0.6, y: 3.6, w: 6.6, h: 3.2, file: "frontend/src/pages/play.tsx", size: 10.5,
    text: src("frontend/src/pages/play.tsx", [80, 87], [96, 103]) });
  // mini plateau tourné
  [0, 1, 2, 3].forEach(seat => {
    const angle = seat * Math.PI / 2 + Math.PI / 2;
    const x = 9.95 + 1.35 * Math.cos(angle), y = 3.5 + 1.35 * Math.sin(angle);
    pawn(s, x - 0.32, y - 0.32, 0.64, SEAT[seat], `S${seat}`, 14);
  });
  s.addShape(pres.shapes.OVAL, { x: 9.15, y: 2.7, w: 1.6, h: 1.6, fill: { color: C.background2 }, line: { color: LINE } });
  s.addText("moi\nen bas", { x: 9.15, y: 2.7, w: 1.6, h: 1.6, fontSize: 13, align: "center", valign: "middle", color: MUTED, margin: 0, isTextBox: true });
  bullets(s, [
    "Le serveur reste en coordonnées absolues ; le front tourne le plateau de quarts de tour.",
    "Les pions sont animés avec motion (event = qui a bougé, qui a été capturé).",
    "Un aperçu de trajet s'affiche au survol des pions jouables.",
  ], { x: 7.6, y: 5.25, w: 5.15, h: 1.6, size: 13.5, gap: 5 });
}

/* ---------- design system */
{
  const s = addContent("Style : Tailwind 4 + shadcn/ui, piloté par des tokens", SEC);
  code(s, { x: 0.6, y: 1.45, w: 5.6, h: 4.0, file: "frontend/src/styles/globals.css", lang: "css", size: 11,
    text: src("frontend/src/styles/globals.css", [1, 3], [11, 12], [21, 23], [56, 60]) });
  const swatches = [["background", "E5DECF"], ["foreground", "25313E"], ["primary", "407FC1"], ["secondary", "91B8E2"]];
  swatches.forEach(([name, hex], i) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.6 + i * 1.42, y: 5.65, w: 1.25, h: 0.6, rectRadius: 0.06,
      fill: { color: hex }, line: { color: LINE } });
    s.addText(name, { x: 0.6 + i * 1.42, y: 6.3, w: 1.3, h: 0.3, fontSize: 10.5, color: MUTED, margin: 0, isTextBox: true });
  });
  const comps = ["Button", "Card", "Field", "Input", "Label", "Avatar", "Breadcrumb", "Separator",
    "PageLayout", "Header", "Footer", "Title", "WornFrame", "SeatBadge", "CardRule", "TiltCard"];
  s.addText("Composants réutilisables", { x: 6.6, y: 1.45, w: 6.1, h: 0.45, fontSize: 18, bold: true,
    fontFace: THEME.headFontFace, color: C.text1, margin: 0, isTextBox: true });
  comps.forEach((name, i) => {
    const col = i % 4, row = Math.floor(i / 4);
    box(s, 6.6 + col * 1.55, 2.05 + row * 0.62, 1.42, 0.48, name, { fill: row < 2 ? C.accent1 : SEAT[1], color: C.background1, size: 12, mono: true });
  });
  s.addText([
    { text: "Bleu : ", options: { bold: true, color: C.accent1 } }, { text: "shadcn/ui (components/ui)   ", options: {} },
    { text: "Ocre : ", options: { bold: true, color: SEAT[1] } }, { text: "composants maison", options: {} },
  ], { x: 6.6, y: 4.6, w: 6.15, h: 0.35, fontSize: 12.5, color: C.text1, margin: 0, isTextBox: true });
  bullets(s, [
    "Deux polices (Fraunces pour les titres, Public Sans pour le texte), exposées en variables CSS.",
    "Couleurs d'équipe en tokens --team-0..3, partagées par le plateau et le lobby.",
  ], { x: 6.6, y: 5.15, w: 6.15, h: 1.6, size: 14 });
}

/* ======================================================= 6. GRILLE */
SEC = sectionSlide(6, "Grille & modules", "Où en est le projet face au sujet et à la feuille de correction");

/* ---------- mandatory checklist */
{
  const s = addContent("Partie obligatoire : état actuel du dépôt", SEC);
  const OK = { text: "OK", options: { bold: true, color: C.background1, fill: { color: C.accent4 }, align: "center" } };
  const WARN = { text: "À revoir", options: { bold: true, color: C.background1, fill: { color: C.accent3 }, align: "center" } };
  const KO = { text: "Manquant", options: { bold: true, color: C.background1, fill: { color: C.accent2 }, align: "center" } };
  table(s, [
    ["Exigence", "État", "Preuve / commentaire"],
    ["Frontend + backend + BDD", OK, "Next.js, NestJS, PostgreSQL"],
    ["Déploiement en une commande", OK, "docker compose up --build, healthcheck postgres"],
    ["HTTPS", WARN, "nginx TLS sur 8443, mais 3001 et 3002 sont publiés en clair dans le compose"],
    ["Privacy Policy / Terms of Service", OK, "/privacy et /terms, liens dans le footer, contenu réel"],
    ["Framework CSS", OK, "Tailwind 4 + shadcn/ui"],
    [".env ignoré + .env.example", KO, ".env racine commité, pas de .gitignore racine, pas de .env.example"],
    ["Schéma BDD et relations", OK, "5 modèles Prisma, migrations versionnées"],
    ["Mots de passe hachés et salés", OK, "bcrypt, genSalt(10)"],
    ["Validation front ET back", WARN, "OK pour profil, amis, mot de passe ; register et login non validés côté back"],
    ["Multi-utilisateurs simultanés", OK, "rooms socket.io, verrou « Not your turn », transaction sérialisable"],
    ["README complet", KO, "manquent : rôles, organisation, modules + points, contributions"],
    ["Commits de tous les membres", OK, "plusieurs auteurs (voir slide Git)"],
  ], { x: 0.6, y: 1.4, w: 12.15, colW: [3.4, 1.25, 7.5], size: 12.5, rowH: 0.41 });
}

/* ---------- modules */
{
  const s = addContent("Modules : 13 points solides pour 14 requis", SEC);
  const OK = { text: "Solide", options: { bold: true, color: C.accent4 } };
  const RISK = { text: "Risqué", options: { bold: true, color: C.accent3 } };
  table(s, [
    ["Module", "Type", "Pts", "État", "Ce qui le prouve dans le code"],
    ["Framework front + back", "Major", "2", OK, "Next.js + NestJS"],
    ["WebSockets temps réel", "Major", "2", OK, "commit → broadcast, rooms, reconnexion"],
    ["ORM", "Minor", "1", OK, "Prisma 7 + migrations"],
    ["Jeu web complet", "Major", "2", OK, "Tock : règles, victoire, parties live"],
    ["Joueurs distants", "Major", "2", OK, "sync, délai de grâce, IA remplaçante"],
    ["Multijoueur (3+)", "Major", "2", OK, "4 sièges synchronisés"],
    ["Gestion utilisateurs standard", "Major", "2", OK, "profil, avatar + défaut, amis en ligne"],
    ["Adversaire IA", "Major", "2", RISK, "IA aléatoire : pas « challenging »"],
    ["Design system maison", "Minor", "1", RISK, "à documenter : palette, typo, icônes, 10+ comp."],
  ], { x: 0.6, y: 1.4, w: 8.6, colW: [2.6, 0.8, 0.55, 0.95, 3.7], size: 12.5, rowH: 0.47 });
  // stat callouts
  const stat = (y, big, label, color) => {
    s.addText(big, { x: 9.6, y, w: 3.15, h: 0.95, fontSize: 54, bold: true, color, fontFace: THEME.headFontFace,
      margin: 0, align: "left", valign: "middle", isTextBox: true });
    s.addText(label, { x: 9.6, y: y + 0.95, w: 3.15, h: 0.45, fontSize: 14, color: MUTED, margin: 0, isTextBox: true });
  };
  stat(1.4, "13", "points solides aujourd'hui", C.accent4);
  stat(3.0, "14", "points requis", C.text1);
  stat(4.6, "16", "si l'IA et le design system passent", C.accent1);
  note(s, "Un module non fonctionnel vaut 0 : viser plus que 14.", { x: 0.6, y: 6.35, w: 8.6, h: 0.45, size: 13 });
}

/* ---------- blocking fixes */
{
  const s = addContent("À corriger avant la soutenance", SEC);
  const items = [
    ["Conflit Git : à committer", "Le conflit de game.service.ts est résolu en local (mode rapide retiré, IA à 1-3 s), mais le commit actuel contient encore les marqueurs : committer la correction.", SEAT[0]],
    [".env dans le dépôt", "Échec immédiat selon la grille. Ajouter un .gitignore racine, un .env.example, retirer .env du suivi et changer les mots de passe.", SEAT[0]],
    ["Register sans validation back", "Le body entier est étalé dans prisma.user.create (...data) : un client peut envoyer isAdmin, qui vaut true par défaut.", SEAT[1]],
    ["Ports publiés en clair", "3001 et 3002 sont exposés : tout doit passer par nginx en HTTPS.", SEAT[1]],
    ["Fichiers parasites", ".next/, frontend/frontend/.next, backend/cookies.txt, backend/POST, *.png~ sont commités.", SEAT[1]],
    ["README", "Ajouter rôles (PO, PM, Tech Lead), organisation, modules + calcul des points, contributions. La section « reste à faire » est périmée.", SEAT[1]],
  ];
  items.forEach(([head, body, color], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    card(s, 0.6 + col * 6.15, 1.45 + row * 1.8, 5.95, 1.65, head, body, color, { size: 13.5, headSize: 16, mark: i + 1 });
  });
}

/* ---------- git */
{
  const s = addContent("Git : la contribution doit être visible pour chacun", SEC);
  s.addChart(pres.charts.BAR, [{ name: "Commits", labels: ["nadeluge", "elaudrez", "Gwena", "Jules Azéma*", "nar10", "copilot (bot)"],
    values: [33, 17, 9, 9, 3, 1] }], {
    x: 0.6, y: 1.45, w: 7.2, h: 5.3, barDir: "bar", showTitle: true, title: "Commits par auteur Git (72 au total)",
    titleFontSize: 14, titleColor: HEX.dk1, titleFontFace: "+mj-lt",
    showValue: true, dataLabelPosition: "outEnd", dataLabelFontSize: 12, dataLabelColor: HEX.dk1, dataLabelFontFace: "+mn-lt",
    chartColors: [HEX.accent1], catAxisLabelColor: MUTED, valAxisLabelColor: MUTED, catAxisLabelFontSize: 12,
    catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt", valAxisHidden: true,
    valGridLine: { style: "none" }, catGridLine: { style: "none" }, showLegend: false, catAxisOrientation: "maxMin",
  });
  bullets(s, [
    ["* Jules Azéma ", "regroupe 3 identités (jazema, julesazema, Jules Azéma) : unifier avec un .mailmap."],
    ["Préparer ", "pour chaque membre : son rôle, une feature qu'il a codée, et un fichier à montrer."],
    ["Messages de commit : ", "certains sont flous (« clean », « comment », « front changesx ») ; la grille demande des messages clairs."],
    ["Le commit du bot Copilot ", "doit pouvoir être expliqué."],
  ], { x: 8.1, y: 1.6, w: 4.65, h: 5.2, size: 14, gap: 10 });
}

/* ---------- Q&A */
{
  const s = addContent("Questions probables du correcteur", SEC);
  const qa = [
    ["Comment les mots de passe sont-ils stockés ?", "bcrypt avec un sel aléatoire par mot de passe ; le sel est dans le hash."],
    ["Pourquoi des cookies et pas localStorage ?", "httpOnly : un script injecté ne peut pas lire le token."],
    ["Comment empêchez-vous la triche ?", "Le serveur valide chaque action (isLegal) et cache les mains adverses (viewFor)."],
    ["Deux actions en même temps ?", "Node traite un message à la fois ; le contrôle « Not your turn » refuse l'autre."],
    ["Un joueur ferme l'onglet ?", "Délai de grâce, puis l'IA joue pour lui ; à son retour, sync lui rend la main."],
    ["Pourquoi l'état en mémoire ?", "Rapide et simple. Prix à payer : un redémarrage du backend perd les parties."],
  ];
  qa.forEach(([q, a], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.6 + col * 6.15, y = 1.45 + row * 1.8;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w: 5.95, h: 1.6, rectRadius: 0.1, fill: { color: C.background2 }, line: { color: C.background2 } });
    pawn(s, x + 0.2, y + 0.22, 0.42, SEAT[i % 4], "?", 16);
    s.addText(q, { x: x + 0.8, y: y + 0.15, w: 4.95, h: 0.55, fontSize: 15, bold: true, color: C.text1, valign: "middle", margin: 0, isTextBox: true });
    s.addText(a, { x: x + 0.8, y: y + 0.72, w: 4.95, h: 0.8, fontSize: 13.5, color: C.text1, valign: "top", margin: 0, isTextBox: true });
  });
}

/* ---------- closing */
{
  const s = pres.addSlide({ masterName: "TITLE", sectionTitle: SEC });
  s.addText("À retenir", { placeholder: "title" });
  s.addText("Le serveur décide, le moteur est pur, le front affiche ce qu'il reçoit.", { placeholder: "body" });
  SEAT.forEach((c, i) => pawn(s, 0.8 + i * 0.75, 1.45, 0.55, c));
  s.addText("Avant la soutenance : committer la résolution du conflit, sortir .env du dépôt, compléter le README.", {
    x: 0.8, y: 5.6, w: 11.7, h: 0.6, fontSize: 16, color: "AEB8C4", margin: 0, isTextBox: true });
}

/* ------------------------------------------------------------------ write */
(async () => {
  await pres.writeFile({ fileName: OUT });
  if (APPLY_THEME) {
    const { applyTheme } = require(APPLY_THEME);
    await applyTheme(OUT, THEME);
  }
  console.log("écrit :", OUT);
})();
