/**
 * Build-time checks over the generated HTML.
 *
 * Deliberately dependency-free and regex-based: these are cheap structural
 * assertions meant to fail a deploy, not a replacement for Lighthouse or the
 * Rich Results Test. Run with `npm run check` after `npm run build`.
 */
import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "_site");
const problems = [];
const notes = [];

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : p.endsWith(".html") ? [p] : [];
  });

const files = walk(root);
const fail = (file, msg) => problems.push(`${path.relative(root, file)}: ${msg}`);

for (const file of files) {
  const html = fs.readFileSync(file, "utf8");
  const rel = path.relative(root, file).replace(/\\/g, "/");

  // --- Document head -----------------------------------------------------
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
  if (!title) fail(file, "missing <title>");
  else if (title.length > 65) fail(file, `title is ${title.length} chars (>65)`);

  const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1];
  if (!desc) fail(file, "missing meta description");
  else if (desc.length < 70 || desc.length > 170)
    fail(file, `meta description is ${desc.length} chars (want 70-170)`);

  for (const tag of [
    'rel="canonical"',
    'property="og:title"',
    'property="og:description"',
    'property="og:image"',
    'property="og:url"',
    'name="twitter:card"',
  ]) {
    if (!html.includes(tag)) fail(file, `missing ${tag}`);
  }

  // --- Structured data ---------------------------------------------------
  const ld = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/
  )?.[1];
  if (!ld) fail(file, "no JSON-LD block");
  else {
    try {
      const parsed = JSON.parse(ld);
      const types = parsed["@graph"].map((n) => n["@type"]);
      notes.push(`${rel} -> ${types.join(", ")}`);
      for (const node of parsed["@graph"]) {
        if (!node["@type"]) fail(file, "JSON-LD node without @type");
        if (JSON.stringify(node).includes("undefined"))
          fail(file, `JSON-LD ${node["@type"]} contains "undefined"`);
      }
      if (!types.includes("Organization")) fail(file, "no Organization node");
    } catch (e) {
      fail(file, `JSON-LD does not parse: ${e.message}`);
    }
  }

  // --- Headings ----------------------------------------------------------
  const h1s = html.match(/<h1[\s>]/g) || [];
  if (h1s.length !== 1) fail(file, `${h1s.length} <h1> elements (want exactly 1)`);

  const levels = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => +m[1]);
  levels.forEach((lvl, i) => {
    if (i && lvl > levels[i - 1] + 1)
      fail(file, `heading jumps h${levels[i - 1]} -> h${lvl}`);
  });

  // --- Landmarks ---------------------------------------------------------
  for (const el of ["<header", "<main", "<footer", "<nav"]) {
    if (!html.includes(el)) fail(file, `missing ${el}> landmark`);
  }
  if (!html.includes('class="skip-link"')) fail(file, "missing skip link");

  // --- Duplicate ids -----------------------------------------------------
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) fail(file, `duplicate id(s): ${[...new Set(dupes)].join(", ")}`);

  // --- Form controls have labels ----------------------------------------
  const labelled = new Set(
    [...html.matchAll(/<label[^>]*\sfor="([^"]+)"/g)].map((m) => m[1])
  );
  for (const m of html.matchAll(/<(input|select|textarea)\b[^>]*>/g)) {
    const tag = m[0];
    if (/type="(hidden|submit)"/.test(tag)) continue;
    const id = tag.match(/\sid="([^"]+)"/)?.[1];
    // The honeypot is marked by tabindex="-1" and sits inside a wrapping label,
    // so it is exempt from the id/label pairing rule.
    const wrapped = /tabindex="-1"/.test(tag);
    if (!wrapped && (!id || !labelled.has(id)))
      fail(file, `unlabelled form control: ${tag.slice(0, 60)}`);
  }

  // --- Images ------------------------------------------------------------
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt=/.test(m[0])) fail(file, `<img> without alt: ${m[0].slice(0, 60)}`);
    if (!/width=/.test(m[0]) || !/height=/.test(m[0]))
      fail(file, `<img> without intrinsic dimensions (CLS risk): ${m[0].slice(0, 60)}`);
  }

  // --- Decorative SVGs should not be announced --------------------------
  for (const m of html.matchAll(/<svg\b[^>]*>/g)) {
    if (!/aria-hidden|role="img"/.test(m[0]))
      fail(file, `<svg> with no accessible role: ${m[0].slice(0, 60)}`);
  }

  // --- Performance budget ------------------------------------------------
  const bytes = Buffer.byteLength(html);
  if (bytes > 60_000) fail(file, `HTML is ${(bytes / 1024).toFixed(1)} KB (>60 KB)`);
  notes.push(`${rel} -> ${(bytes / 1024).toFixed(1)} KB, ${h1s.length} h1`);

  if (/<script\s[^>]*src="https?:\/\//.test(html))
    fail(file, "third-party script found (blocks the render path)");
}

console.log(notes.join("\n"));
console.log(`\nChecked ${files.length} pages.`);

if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log("All structural checks passed.");
