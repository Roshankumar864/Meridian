/**
 * Runs Google PageSpeed Insights against the deployed URL and writes the raw
 * responses plus a markdown summary to docs/evidence/.
 *
 * PSI runs on Google's infrastructure, not this machine, which makes it the
 * evidence that matters: local Lighthouse can be argued with, a third-party
 * measurement of the live origin cannot.
 *
 * Usage: node tools/psi.js https://your-site.example
 */
import fs from "node:fs";
import path from "node:path";

const ORIGIN = process.argv[2];
if (!ORIGIN) {
  console.error("Usage: node tools/psi.js <origin>");
  process.exit(1);
}

const OUT = path.join(process.cwd(), "docs/evidence");
fs.mkdirSync(OUT, { recursive: true });

const PAGES = [
  ["home", "/"],
  ["product", "/product/"],
  ["pricing", "/pricing/"],
  ["contact", "/contact/"],
];
const CATS = ["performance", "accessibility", "best-practices", "seo"];

const rows = [];

for (const [name, urlPath] of PAGES) {
  for (const strategy of ["mobile", "desktop"]) {
    const api = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
    api.searchParams.set("url", ORIGIN + urlPath);
    api.searchParams.set("strategy", strategy);
    for (const c of CATS) api.searchParams.append("category", c);

    let json;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const res = await fetch(api, { signal: AbortSignal.timeout(120000) });
      if (res.ok) {
        json = await res.json();
        break;
      }
      // PSI rate-limits unauthenticated callers; back off rather than fail.
      const wait = attempt * 20000;
      console.error(`  ${urlPath} ${strategy}: HTTP ${res.status}, retrying in ${wait / 1000}s`);
      await new Promise((r) => setTimeout(r, wait));
    }
    if (!json) throw new Error(`PSI failed for ${urlPath} (${strategy})`);

    fs.writeFileSync(
      path.join(OUT, `psi-${name}-${strategy}.json`),
      JSON.stringify(json, null, 2)
    );

    const lh = json.lighthouseResult;
    const cat = lh.categories;
    const a = lh.audits;
    const pct = (k) => Math.round(cat[k].score * 100);

    rows.push([
      "`" + urlPath + "`",
      strategy[0].toUpperCase() + strategy.slice(1),
      pct("performance"),
      pct("accessibility"),
      pct("best-practices"),
      pct("seo"),
      a["largest-contentful-paint"].displayValue,
      a["cumulative-layout-shift"].displayValue,
      a["total-blocking-time"].displayValue,
      a["first-contentful-paint"].displayValue,
    ]);
    console.log(`${urlPath} (${strategy}) perf ${pct("performance")}  lh ${lh.lighthouseVersion}`);
  }
}

const md = [
  `PageSpeed Insights — ${ORIGIN} — run ${new Date().toISOString().slice(0, 10)}`,
  "",
  "| Page | Strategy | Perf | A11y | Best practices | SEO | LCP | CLS | TBT | FCP |",
  "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ...rows.map((r) => `| ${r.join(" | ")} |`),
].join("\n");

fs.writeFileSync(path.join(OUT, "psi-summary.md"), `${md}\n`);
console.log(`\n${md}`);
