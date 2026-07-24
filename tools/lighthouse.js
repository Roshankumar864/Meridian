/**
 * Runs Lighthouse over every page, mobile and desktop, and writes the reports
 * plus a markdown summary into docs/evidence/.
 *
 * Usage: npm run build && npx http-server _site -p 8099 & npm run lh
 *
 * Note: the Lighthouse CLI can exit non-zero on Windows while cleaning up its
 * temp profile directory even after a successful run, so we key success off the
 * report file existing rather than the exit code.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ORIGIN = process.env.LH_ORIGIN || "http://127.0.0.1:8099";
const OUT = path.join(process.cwd(), "docs/evidence");
const PAGES = [
  ["home", "/"],
  ["product", "/product/"],
  ["pricing", "/pricing/"],
  ["contact", "/contact/"],
];

fs.mkdirSync(OUT, { recursive: true });

const run = (name, url, mobile) => {
  const base = path.join(OUT, `${name}-${mobile ? "mobile" : "desktop"}`);
  const cmd = [
    "npx --yes lighthouse@12",
    `"${ORIGIN}${url}"`,
    "--quiet",
    '--chrome-flags="--headless=new --no-sandbox"',
    "--output=json --output=html",
    `--output-path="${base}"`,
    mobile ? "" : "--preset=desktop",
  ].join(" ");
  try {
    execSync(cmd, { stdio: "ignore" });
  } catch {
    /* temp-dir cleanup can fail on Windows; the report is already written */
  }
  const json = `${base}.report.json`;
  if (!fs.existsSync(json)) throw new Error(`Lighthouse produced no report for ${url}`);
  return JSON.parse(fs.readFileSync(json, "utf8"));
};

const rows = [];
for (const [name, url] of PAGES) {
  for (const mobile of [true, false]) {
    const r = run(name, url, mobile);
    const c = r.categories;
    const a = r.audits;
    rows.push({
      page: url,
      profile: mobile ? "Mobile" : "Desktop",
      perf: Math.round(c.performance.score * 100),
      a11y: Math.round(c.accessibility.score * 100),
      bp: Math.round(c["best-practices"].score * 100),
      seo: Math.round(c.seo.score * 100),
      lcp: a["largest-contentful-paint"].displayValue,
      cls: a["cumulative-layout-shift"].displayValue,
      tbt: a["total-blocking-time"].displayValue,
      fcp: a["first-contentful-paint"].displayValue,
      si: a["speed-index"].displayValue,
    });
    console.log(`${url} (${mobile ? "mobile" : "desktop"}) perf ${rows.at(-1).perf}`);
  }
}

const md = [
  "| Page | Profile | Perf | A11y | Best practices | SEO | LCP | CLS | TBT | FCP | Speed Index |",
  "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ...rows.map(
    (r) =>
      `| \`${r.page}\` | ${r.profile} | ${r.perf} | ${r.a11y} | ${r.bp} | ${r.seo} | ${r.lcp} | ${r.cls} | ${r.tbt} | ${r.fcp} | ${r.si} |`
  ),
].join("\n");

fs.writeFileSync(path.join(OUT, "summary.md"), `${md}\n`);
console.log(`\n${md}`);
