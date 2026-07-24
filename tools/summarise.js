/**
 * Rebuilds docs/evidence/summary.md from whatever Lighthouse JSON reports are
 * already on disk. Useful after re-running a single page in isolation.
 */
import fs from "node:fs";

const PAGES = [
  ["home", "/"],
  ["product", "/product/"],
  ["pricing", "/pricing/"],
  ["contact", "/contact/"],
];

const rows = PAGES.flatMap(([name, url]) =>
  ["mobile", "desktop"].map((profile) => {
    const r = JSON.parse(
      fs.readFileSync(`docs/evidence/${name}-${profile}.report.json`, "utf8")
    );
    const c = r.categories;
    const a = r.audits;
    const pct = (k) => Math.round(c[k].score * 100);
    return [
      "`" + url + "`",
      profile[0].toUpperCase() + profile.slice(1),
      pct("performance"),
      pct("accessibility"),
      pct("best-practices"),
      pct("seo"),
      a["largest-contentful-paint"].displayValue,
      a["cumulative-layout-shift"].displayValue,
      a["total-blocking-time"].displayValue,
      a["first-contentful-paint"].displayValue,
      a["speed-index"].displayValue,
    ];
  })
);

const md = [
  "| Page | Profile | Perf | A11y | Best practices | SEO | LCP | CLS | TBT | FCP | Speed Index |",
  "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ...rows.map((r) => `| ${r.join(" | ")} |`),
].join("\n");

fs.writeFileSync("docs/evidence/summary.md", `${md}\n`);
console.log(md);
